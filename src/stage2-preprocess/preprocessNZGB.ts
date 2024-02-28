import { createReadStream, promises as fs } from 'node:fs';
import csv from 'csv-parser';
import type {
  EtymologyReport,
  NZGBCsv,
  NZGBSourceData,
  Ref,
  WikidataFile,
} from '../types';
import { IGNORE, NZGB_NAME_TYPES, type NameType, OVERRIDES } from '../data';
import { etymologyReportPath, nzgbCsvPath, nzgbJsonPath, toCSV } from '../core';
import { maybeTeReoName } from './maybeTeReoName';
import { parseNameEtymology } from './parseNameEtymology';

export type TempName = {
  name: string;
  ref: number;
  /** Oficicial, replaced, or unofficial */
  status: 'O' | 'R' | 'U';
  teReo: boolean;
  etymology: string | 0xbad | undefined;
};
type TempObject = {
  // we group by physical feature id in this temp structure
  [featId: string]: {
    lat: number;
    lng: number;
    type: NameType;
    names: TempName[];
    isArea: boolean;
    isUndersea: boolean;
  };
};

// these transformations must be kept to a bare minimum
const transformName = (_nzgbName: string, type: NameType) => {
  let nzgbName = _nzgbName.trim().replace(/ pa$/i, ' Pā');

  // for train stations, OSM doesn't include the suffix in the name
  if (type === 'Railway Station') {
    nzgbName = nzgbName.replace(/( Railway)? Station$/, '');
  }

  return nzgbName;
};

async function csvToTemp(): Promise<{ out: TempObject; ety: EtymologyReport }> {
  return new Promise((resolve, reject) => {
    const out: TempObject = {};
    const ety: EtymologyReport = {
      stats: { okay: 0, failed: 0, skipped: 0 },
      list: [],
    };
    let index = 0;

    createReadStream(nzgbCsvPath)
      .pipe(csv())
      .on('data', (data: NZGBCsv) => {
        if (!(index % 1000)) process.stdout.write('.');
        index += 1;

        // "Discontinued" don't exist or completely irrelevant
        if (data.status.endsWith('Discontinued')) return;

        /** cause of the BOM character at the start of the csv file we do this */
        const ref = +(data.name_id || data['\uFEFFname_id' as 'name_id']);

        out[data.feat_id] ||= {
          lat: +data.crd_latitude,
          lng: +data.crd_longitude,
          type: data.feat_type,
          names: [],
          isArea: data.geom_type !== 'POINT',
          isUndersea: data.gebco === 'Y' || data.gebco === 'N', // i.e. column is not blank
        };

        const etymology = parseNameEtymology(data.info_origin, data.name, ref);
        ety.list.push([ref, data.name, etymology, data.info_origin]);
        if (etymology === 0xbad) ety.stats.skipped += 1;
        else if (etymology) ety.stats.okay += 1;
        else ety.stats.failed += 1;

        out[data.feat_id].names.push({
          name: transformName(data.name, data.feat_type),
          ref,
          // eslint-disable-next-line no-nested-ternary
          status: data.status.startsWith('Official')
            ? 'O'
            : data.status === 'Unofficial Replaced'
              ? 'R'
              : 'U',
          teReo: data.maori_name === 'Yes',
          etymology,
        });
      })
      .on('end', () => {
        resolve({ out, ety });
        console.log(`\npart 1 done (${index})`);
      })
      .on('error', reject);
  });
}

async function tempToFinal(temp: TempObject, wikidataFile: WikidataFile) {
  const out: NZGBSourceData = {};
  for (const featId in temp) {
    const place = temp[featId];

    if (!(place.type in NZGB_NAME_TYPES)) {
      console.warn(`(!) Unexpected type '${place.type}'`);
    }

    // eslint-disable-next-line no-continue
    if (place.names.some((x) => IGNORE.has(x.ref))) continue;

    const officialNames = place.names
      .filter((x) => x.status === 'O')
      .sort((a, b) => +b.teReo - +a.teReo);

    let ref: Ref;

    if (officialNames.length) {
      const name = officialNames
        .map((n) => n.name)
        .join(' / ')
        .replace('/', ' / ') // put a space on either side of a slash
        .replace('  /  ', ' / ');

      const altNames = place.names.filter((x) => x.status === 'U');
      const oldNames = place.names
        .filter((x) => x.status === 'R')
        .filter((x) => !name.includes(x.name)); // remove oldNames which are just subsets of the official name

      // this feature has one or more official names
      ref = officialNames
        .map((n) => n.ref)
        .sort((a, b) => b - a) // sort so that the newest ref comes first
        .join(';') as Ref;

      if (officialNames.length > 2) {
        throw new Error('More than 2 official names');
      }

      out[ref] = {
        lat: place.lat,
        lng: place.lng,
        type: place.type,
        name,
        nameMi: maybeTeReoName(officialNames),
        official: true,

        altNames: altNames.length ? altNames.map((n) => n.name) : undefined,
        oldNames: oldNames.length ? oldNames.map((n) => n.name) : undefined,
      };
    } else {
      // this feature has no official names
      const names = place.names
        .filter((x) => x.status === 'U')
        .sort((a, b) => +b.teReo - +a.teReo);

      if (!names.length) {
        console.warn(
          'Broken entry',
          place.names.map((x) => x.name).join(' / '),
        );
        continue; // eslint-disable-line no-continue
      }

      ref = names
        .map((n) => n.ref)
        .sort((a, b) => b - a) // sort so that the newest ref comes first
        .join(';') as Ref;

      const name = names.map((n) => n.name).join(' / ');

      const oldNames = place.names
        .filter((x) => x.status === 'R')
        .filter((x) => !name.includes(x.name)); // remove oldNames which are just subsets of the official name

      const unofficialTeReoNames = names.filter((x) => x.teReo);

      out[ref] = {
        lat: place.lat,
        lng: place.lng,
        type: place.type,
        name,
        nameMi: maybeTeReoName(unofficialTeReoNames),
        oldNames: oldNames.length ? oldNames.map((n) => n.name) : undefined,
        oldRefs: place.names.map((n) => n.ref),
      };
    }

    const mainName = place.names.find((x) => x.ref === +ref.split(';')[0]);
    const wikidata = ref
      .split(';')
      .map((r) => wikidataFile[+r])
      .find(Boolean); // find the first truthy value

    if (mainName?.etymology && mainName.etymology !== 0xbad) {
      out[ref].etymology = mainName.etymology;
    }
    if (place.isArea) out[ref].isArea = true;
    if (place.isUndersea) out[ref].isUndersea = true;
    if (wikidata) {
      const { qId, etymology: ety, etymologyQId: etyQId, wikipedia } = wikidata;
      out[ref].qId = qId;
      if (etyQId && ety) {
        out[ref].etymology = ety; // prefer the value from wikidata over what we deduced
        out[ref].etymologyQId = etyQId;
      }
      if (wikipedia) {
        out[ref].wikipedia = wikipedia;
      }
    }

    Object.assign(out[ref], OVERRIDES[ref]);
  }

  console.log(`\npart 2 done (${Object.keys(out).length})`);

  const stats: Record<string, number> = {};
  for (const ref in out) {
    stats[out[ref].type] ||= 0;
    stats[out[ref].type] += 1;
  }
  const statsString = Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => `\t${type} (${count})`)
    .join('\n');
  console.log(statsString);

  return out;
}

export async function preprocessNZGB(wikidataMap: WikidataFile): Promise<void> {
  console.log('Preprocessing NZGB data...');
  const temp = await csvToTemp();
  const result = await tempToFinal(temp.out, wikidataMap);
  await fs.writeFile(nzgbJsonPath, JSON.stringify(result, null, 2));

  // hack to move the errors to the end
  temp.ety.list.sort((a) => +!!a[2] || -1);
  await fs.writeFile(
    etymologyReportPath,
    toCSV(temp.ety.list.filter((x) => typeof x[2] !== 'number')),
  );

  // print etymology stats
  const total =
    temp.ety.stats.okay + temp.ety.stats.failed + temp.ety.stats.skipped;
  const skippedPct = Math.round((temp.ety.stats.skipped / total) * 100);
  const okayPct = Math.round(
    (temp.ety.stats.okay / (temp.ety.stats.okay + temp.ety.stats.failed)) * 100,
  );
  console.log(
    '\nEtymologies:',
    skippedPct,
    `% have no info. Of the remaining ${100 - skippedPct}%,`,
    okayPct,
    '% were parsed.\n',
  );

  console.log('Preprocessing NZGB data complete.');
}
