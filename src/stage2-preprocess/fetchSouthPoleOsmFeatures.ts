import { existsSync, promises as fs } from 'node:fs';
import { join } from 'node:path';
import { type NWR, southPoleFile } from '../core';
import type { OSMFeature, OSMTempFile } from '../types';
import { OUTSIDE_BBOX } from '../data';

type OverpassFeature = {
  type: NWR;
  id: number;
  center?: { lat: number; lon: number };
  lat?: number;
  lon?: number;
  tags: Record<string, string>;
};

export async function fetchSouthPoleOsmFeatures() {
  if (existsSync(southPoleFile)) {
    console.log('Using cached south pole features.');
    const elements: OverpassFeature[] = JSON.parse(
      await fs.readFile(southPoleFile, 'utf8'),
    );
    return elements;
  }

  console.log('Querying overpass for features near the south pole…');
  const templateQuery = await fs.readFile(
    join(__dirname, './fetchSouthPoleOsmFeatures.overpassql'),
    'utf8',
  );

  // manually add a query for every feature outside of Oceania & Antarctica
  const injectedQuery = OUTSIDE_BBOX.map(
    (ref) => `nwr["ref:linz:place_id"="${ref}"];`,
  ).join('\n');

  const finalQuery = templateQuery.replace(
    '/* DO NOT EDIT THIS COMMENT */',
    injectedQuery,
  );

  const { elements } = await fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(finalQuery)}`,
  ).then((r): Promise<{ elements: OverpassFeature[] }> => r.json());

  await fs.writeFile(southPoleFile, JSON.stringify(elements, null, 2));

  console.log('Overpass query complete.');

  return elements;
}

/**
 * There is a bug somewhere along the pipeline
 * which processes the OSM planet file: Everything
 * too close to the south pole is lost.
 *
 * To work around this, we query overpass for everything
 * south of the -85th parallel.
 */
/* eslint-disable no-param-reassign -- returns nothing, mutates the first 2 arguments instead */
export async function processSouthPoleOsmFeatures(
  out: OSMTempFile,
  duplicates: Set<string>,
  apiResponse: OverpassFeature[],
) {
  out.__OTHER__ ||= { withRef: {}, noRef: [] };
  for (const item of apiResponse) {
    const id = item.tags!['ref:linz:place_id'];
    const coords = item.center || item;

    const feature: OSMFeature = {
      osmId: item.type[0] + item.id,
      lat: +coords.lat!,
      lng: +coords.lon!,
      tags: item.tags,
    };

    // check if this ref was already found in a query for a preset
    // if not, we add it to the __OTHER__ category.
    let alreadySeen = false;
    for (const cat in out) {
      const thisFeature = out[cat].withRef[id];
      if (thisFeature) {
        alreadySeen = true;
        if (thisFeature.osmId !== feature.osmId) {
          duplicates.add(id);
        }
        break;
      }
    }
    if (!alreadySeen) {
      out.__OTHER__.withRef[id] = feature;
    }
  }
}
