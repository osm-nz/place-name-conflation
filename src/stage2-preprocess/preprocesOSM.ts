import { promises as fs } from 'node:fs';
import pbf2json, { Item, Tags } from 'pbf2json';
import through from 'through2';
import { OSMFeature, OSMTempFile } from '../types';
import { NameType, NZGB_NAME_TYPES, __SKIP } from '../data';
import { mainlandPlanetFile, tempOsmFile } from '../core';

async function osmToJson(query: string): Promise<OSMTempFile> {
  return new Promise((resolve, reject) => {
    let i = 0;
    const out: OSMTempFile = { withRef: {}, noRef: [] };

    pbf2json
      .createReadStream({
        file: mainlandPlanetFile,
        tags: [query],
        leveldb: '/tmposm',
      })
      .pipe(
        through.obj((item: Item, _e, next) => {
          if (!(i % 100)) process.stdout.write('.');
          i += 1;

          const id = item.tags['ref:linz:place_id'];

          const coords = item.type === 'node' ? item : item.centroid;

          const feature: OSMFeature = {
            osmId: item.type[0] + item.id,
            lat: +coords.lat,
            lng: +coords.lon,
            tags: item.tags,
          };
          if (id) {
            out.withRef[id] = feature;
          } else {
            out.noRef.push(feature);
          }

          next();
        }),
      )
      .on('finish', () => {
        resolve(out);
        console.log(`\n\tdone (${i})`);
      })
      .on('error', reject);
  });
}

const tagsToQuery = (tags: Tags) =>
  `${Object.entries(tags)
    .map(([k, v]) => (v === '*' ? k : `${k}~${v}`))
    .join('+')}+name`; // only search for features with a name

export async function preprocesOSM(): Promise<void> {
  const queries: Record<string, NameType[]> = {};

  for (const type in NZGB_NAME_TYPES) {
    const v = NZGB_NAME_TYPES[type as NameType];
    if (v === __SKIP) continue; // eslint-disable-line no-continue -- skip

    let query;

    if ('tags' in v) {
      query = tagsToQuery(v.tags);
    } else {
      query = [tagsToQuery(v.onLandTags), tagsToQuery(v.subseaTags)].join(',');
    }

    // to speed up the search, simplify these all into one query
    // since there are so few features
    if (query.includes('seamark:type~sea_area')) {
      query = 'seamark:type~sea_area+name';
    }

    queries[query] ||= [];
    queries[query].push(type as NameType);
  }

  let i = 0;
  for (const query in queries) {
    i += 1;
    const count = `${i}/${Object.keys(queries).length}`;

    let anyMissing = false;
    for (const type of queries[query]) {
      const exists = await fs
        .access(tempOsmFile(type))
        .then(() => true)
        .catch(() => false);
      if (!exists) anyMissing = true;
    }
    if (!anyMissing) {
      console.log(
        `[${count}] Skipping ${query} (${queries[query].join(', ')})`,
      );
      continue; // eslint-disable-line no-continue
    }

    console.log(
      `[${count}] Searching planet for ${query} (${queries[query].join(', ')})`,
    );

    const res = await osmToJson(query);

    for (const type of queries[query]) {
      await fs.writeFile(tempOsmFile(type), JSON.stringify(res));
    }
  }
}
