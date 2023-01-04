import { promises as fs } from 'node:fs';
import pbf2json, { Item } from 'pbf2json';
import through from 'through2';
import { OSMFeature, OSMTempFile } from '../types';
import { NameType, NZGB_NAME_TYPES, TOP_LEVEL_TAGS, __SKIP } from '../data';
import {
  findTopLevelTag,
  planetFileEast,
  planetFileWest,
  tempOsmFile,
} from '../core';

/* eslint-disable no-param-reassign -- returns nothing, mutates the first argument instead */
async function osmToJson(
  out: OSMTempFile,
  query: string,
  planetFile: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let i = 0;

    pbf2json
      .createReadStream({
        file: planetFile,
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

          // doing this search several million times sucks
          const topLevelTag = findTopLevelTag(item.tags);

          if (!topLevelTag) {
            throw new Error(`Couldn't find top level tag for ${feature.osmId}`);
          }

          out[topLevelTag] ||= { withRef: {}, noRef: [] };
          if (id) {
            out[topLevelTag].withRef[id] = feature;
          } else {
            out[topLevelTag].noRef.push(feature);
          }

          next();
        }),
      )
      .on('finish', () => {
        resolve();
        console.log(`\n\tdone (${i})`);
      })
      .on('error', reject);
  });
}
/* eslint-enable */

export async function preprocesOSM(): Promise<void> {
  const queries: Record<string, NameType[]> = {};

  let anyErrors = false;
  for (const _type in NZGB_NAME_TYPES) {
    const type = _type as NameType;
    const v = NZGB_NAME_TYPES[type];
    if (v === __SKIP) continue; // eslint-disable-line no-continue -- skip

    const tags = 'tags' in v ? v.tags : { ...v.onLandTags, ...v.subseaTags };

    const topLevelTag = findTopLevelTag(tags);

    if (topLevelTag) {
      queries[topLevelTag] ||= [];
      queries[topLevelTag].push(type);
    } else {
      console.error(`Query in preprocesOSM.ts doesn't consider ${type}`);
      anyErrors = true;
    }
  }

  if (anyErrors) process.exit(1);

  const query = TOP_LEVEL_TAGS.map((tag) => `${tag}+name`).join(',');

  console.log('The query is:', query);

  const out: OSMTempFile = {};
  await osmToJson(out, query, planetFileWest);
  await osmToJson(out, query, planetFileEast);
  await fs.writeFile(tempOsmFile, JSON.stringify(out));
}
