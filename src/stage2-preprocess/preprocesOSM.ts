import { promises as fs } from 'node:fs';
import pbf2json, { Item } from 'pbf2json';
import through from 'through2';
import { OSMFeature, OSMTempFile } from '../types';
import { NameType, NZGB_NAME_TYPES, TOP_LEVEL_TAGS, __SKIP } from '../data';
import {
  findTopLevelTags,
  planetFileEast,
  planetFileWest,
  tempOsmFile,
} from '../core';

const REF_TAG = 'ref:linz:place_id';

/* eslint-disable no-param-reassign -- returns nothing, mutates the first 2 arguments instead */
function osmToJson(
  out: OSMTempFile,
  query: string,
  planetFile: string,
): Promise<void> {
  process.stdout.write('Querying planet...');
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

          if (query === REF_TAG) {
            out.__OTHER__ ||= { withRef: {}, noRef: [] };
            if (id) {
              // check if this ref was already found in a query for a preset
              // if not, we add it to the __OTHER__ category.
              let alreadySeen = false;
              for (const cat in out) {
                if (id in out[cat].withRef) alreadySeen = true;
              }
              if (!alreadySeen) {
                out.__OTHER__.withRef[id] = feature;
              }
            }
          } else {
            // doing this search several million times sucks
            const topLevelTags = findTopLevelTags(item.tags);

            if (!topLevelTags.length) {
              throw new Error(
                `Couldn't find top level tag for ${feature.osmId}`,
              );
            }

            for (const topLevelTag of topLevelTags) {
              if (id) {
                out[topLevelTag].withRef[id] = feature;
              } else {
                out[topLevelTag].noRef.push(feature);
              }
            }
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
/* eslint-enable no-param-reassign */

export async function preprocesOSM(): Promise<void> {
  let anyErrors = false;
  for (const _type in NZGB_NAME_TYPES) {
    const type = _type as NameType;
    const v = NZGB_NAME_TYPES[type];
    if (v === __SKIP) continue; // eslint-disable-line no-continue -- skip

    const tags = 'tags' in v ? v.tags : { ...v.onLandTags, ...v.subseaTags };

    if (!findTopLevelTags(tags).length) {
      console.error(`Query in preprocesOSM.ts doesn't consider ${type}`);
      anyErrors = true;
    }
  }
  if (anyErrors) process.exit(1);

  const query = TOP_LEVEL_TAGS.map((tag) => `${tag}+name`).join(',');

  console.log('The query is:', query);

  // populate the output object
  const out: OSMTempFile = {};
  for (const topLevelTag of TOP_LEVEL_TAGS) {
    out[topLevelTag] = { withRef: {}, noRef: [] };
  }

  await osmToJson(out, query, planetFileWest);
  await osmToJson(out, query, planetFileEast);

  // query again to find anything with a ref that didn't match a preset
  await osmToJson(out, REF_TAG, planetFileWest);
  await osmToJson(out, REF_TAG, planetFileEast);

  await fs.writeFile(tempOsmFile, JSON.stringify(out));
}
