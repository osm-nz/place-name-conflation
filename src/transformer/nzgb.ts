import { createReadStream } from 'node:fs';
import csv from 'csv-parser';
import { NZGB_NAME_TYPES, type NameType } from '../core/data/presets.js';
import type { RawNzgb, Ref, TransformedNzgb } from '../core/types/nzgb.def.js';
import { nzgbRawPath } from '../core/constants.js';
import type { Config } from '../core/types/general.def.js';

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

// these transformations must be kept to a bare minimum
const transformName = (_nzgbName: string, type: NameType) => {
  let nzgbName = _nzgbName.trim().replace(/ pa$/i, ' Pā');

  // for train stations, OSM doesn't include the suffix in the name
  if (type === 'Railway Station') {
    nzgbName = nzgbName.replace(/( Railway)? Station$/, '');
  }

  return nzgbName;
};

async function csvToTemp(): Promise<{ out: TempObject }> {
  return new Promise((resolve, reject) => {
    const out: TempObject = {};
    let index = 0;

    createReadStream(nzgbRawPath)
      .pipe(csv())
      .on('data', (data: RawNzgb) => {
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

        out[data.feat_id]!.names.push({
          name: transformName(data.name, data.feat_type),
          ref,
          status: data.status.startsWith('Official')
            ? 'O'
            : data.status === 'Unofficial Replaced'
              ? 'R'
              : 'U',
          teReo: data.maori_name === 'Yes',
        });
      })
      .on('end', () => {
        resolve({ out });
        console.log(`\npart 1 done (${index})`);
      })
      .on('error', reject);
  });
}

async function tempToFinal(temp: TempObject, config: Config) {
  const out: TransformedNzgb = {};
  for (const featId in temp) {
    const place = temp[featId]!;

    if (!(place.type in NZGB_NAME_TYPES)) {
      throw new Error(`(!) Unexpected type '${place.type}'`);
    }

    if (place.names.some((x) => x.ref in config.ignore)) continue;

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
        official: true,

        altNames: altNames.length ? altNames.map((n) => n.name) : undefined,
        oldNames: oldNames.length ? oldNames.map((n) => n.name) : undefined,
        isArea: place.isArea,
        isUndersea: place.isUndersea,
      };
    } else {
      // this feature has no official names
      const names = place.names
        .filter((x) => x.status === 'U')
        .sort((a, b) => +b.teReo - +a.teReo);

      if (!names.length) {
        // skip broken entries
        continue;
      }

      ref = names
        .map((n) => n.ref)
        .sort((a, b) => b - a) // sort so that the newest ref comes first
        .join(';') as Ref;

      const name = names.map((n) => n.name).join(' / ');

      const oldNames = place.names
        .filter((x) => x.status === 'R')
        .filter((x) => !name.includes(x.name)); // remove oldNames which are just subsets of the official name

      out[ref] = {
        lat: place.lat,
        lng: place.lng,
        type: place.type,
        name,
        oldNames: oldNames.length ? oldNames.map((n) => n.name) : undefined,
        oldRefs: place.names.map((n) => n.ref),
        isArea: place.isArea,
        isUndersea: place.isUndersea,
      };
    }

    let override = config.overrides[ref] || {};
    if (typeof override === 'string') override = { name: override };
    Object.assign(out[ref]!, override);
  }

  console.log(`\npart 2 done (${Object.keys(out).length})`);

  return out;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function transformNzgb(_: number, config: Config) {
  console.log('Preprocessing NZGB data...');
  const temp = await csvToTemp();
  const result = await tempToFinal(temp.out, config);

  return result;
}
