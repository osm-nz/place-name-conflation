import { promises as fs, createReadStream } from 'node:fs';
import csv from 'csv-parser';
import { NZGBCsv, NZGBSourceData, Ref } from '../types';
import { OVERRIDES, NameType, NZGB_NAME_TYPES, IGNORE } from '../data';
import { nzgbCsvPath, nzgbJsonPath } from '../core';
import { maybeTeReoName } from './maybeTeReoName';

export type TempName = {
  name: string;
  ref: number;
  /** Oficicial, replaced, or unofficial */
  status: 'O' | 'R' | 'U';
  teReo: boolean;
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

async function csvToTemp(): Promise<TempObject> {
  return new Promise((resolve, reject) => {
    const out: TempObject = {};
    let i = 0;

    createReadStream(nzgbCsvPath)
      .pipe(csv())
      .on('data', (data: NZGBCsv) => {
        if (!(i % 1000)) process.stdout.write('.');
        i += 1;

        /** cause of the BOM character at the start of the csv file we do this */
        const nameIdKey = Object.keys(data)[0] as 'name_id';
        const ref = +data[nameIdKey];

        if (IGNORE.has(ref)) return; // ignore this entry

        out[data.feat_id] ||= {
          lat: +data.crd_latitude,
          lng: +data.crd_longitude,
          type: data.feat_type,
          names: [],
          isArea: data.geom_type !== 'POINT',
          isUndersea: data.gebco === 'Y' || data.gebco === 'N', // i.e. column is not blank
        };

        out[data.feat_id].names.push({
          name: data.name,
          ref,
          // eslint-disable-next-line no-nested-ternary
          status: data.status.startsWith('Official')
            ? 'O'
            : data.status === 'Unofficial Replaced'
            ? 'R'
            : 'U',
          teReo: data.maori_name === 'Yes',
        });
      })
      .on('end', () => {
        resolve(out);
        console.log(`\npart 1 done (${i})`);
      })
      .on('error', reject);
  });
}

async function tempToFinal(temp: TempObject) {
  const out: NZGBSourceData = {};
  for (const featId in temp) {
    const place = temp[featId];

    if (!(place.type in NZGB_NAME_TYPES)) {
      console.warn(`(!) Unexpected type '${place.type}'`);
    }

    const officialNames = place.names
      .filter((x) => x.status === 'O')
      .sort((a, b) => +b.teReo - +a.teReo);

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
      const ref = officialNames
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

        ...OVERRIDES[ref],
      };
      if (place.isArea) out[ref].isArea = true;
      if (place.isUndersea) out[ref].isUndersea = true;
    } else {
      // this feature has no official names
      const names = place.names
        .filter((x) => x.status === 'U')
        .sort((a, b) => +b.teReo - +a.teReo);

      const ref = names.map((n) => n.ref).join(';') as Ref;
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

        ...OVERRIDES[ref],
      };
      if (place.isArea) out[ref].isArea = true;
    }
  }

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

  console.log(`\npart 2 done (${Object.keys(out).length})`);

  return out;
}

export async function preprocessNZGB(): Promise<void> {
  console.log('Preprocessing NZGB data...');
  const temp = await csvToTemp();
  const res = await tempToFinal(temp);
  await fs.writeFile(nzgbJsonPath, JSON.stringify(res, null, 2));
  console.log('Preprocessing NZGB data complete.');
}
