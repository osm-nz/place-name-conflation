import { promises as fs } from 'node:fs';
import { Geometry } from 'geojson';
import {
  GeometryTmpFile,
  NZGBSourceData,
  OsmPatchFile,
  OSMTempFile,
  StatsFile,
} from '../types';
import { NameType, NZGB_NAME_TYPES, __SKIP } from '../data';
import {
  extraLayersFile,
  nzgbIndexPath,
  nzgbJsonGeometryPath,
  nzgbJsonPath,
  osmPathFilePath,
  tempOsmFile,
} from '../core';
import { compareFeatures } from './compareFeatures';
import { findMatch } from './findMatch';
import { isOffShore } from './isOffShore';

let nzgb: NZGBSourceData;
let nzgbGeom: GeometryTmpFile;

// baseline: this took 120sec on the very first run (1k refs in the planet)
async function processOneType(type: NameType) {
  console.log(type);
  console.log('\tReading files...');

  nzgb ||= JSON.parse(await fs.readFile(nzgbJsonPath, 'utf8'));
  nzgbGeom ||= JSON.parse(await fs.readFile(nzgbJsonGeometryPath, 'utf8'));
  const osm: OSMTempFile = JSON.parse(
    await fs.readFile(tempOsmFile(type), 'utf8'),
  );

  console.log('\tConflating...');

  const typeDef = NZGB_NAME_TYPES[type];
  if (typeDef === __SKIP) {
    throw new Error(`Type "${type}" is skipped`);
  }
  const getPresetTags = (lat: number, lng: number) => {
    if ('tags' in typeDef) {
      return { ...typeDef.tags, ...typeDef.addTags };
    }
    return isOffShore(lat, lng) ? typeDef.subseaTags : typeDef.onLandTags;
  };

  let total = 0;

  const output: OsmPatchFile = {
    type: 'FeatureCollection',
    size: 'large',
    stats: { okayCount: 0, addNodeCount: 0, addWayCount: 0, editCount: 0 },
    features: [],
  };

  for (const ref in nzgb) {
    const nzgbPlace = nzgb[ref];
    if (nzgbPlace.type !== type) continue; // eslint-disable-line no-continue

    total += 1;

    if (osm.withRef[ref]) {
      // Case A: there is already a OSM feature with the ref:linz:place_id tag
      const action = compareFeatures(ref, nzgbPlace, osm.withRef[ref]);
      if (action) output.features.push(action);

      delete osm.withRef[ref]; // so that we can check which refs in OSM aren't in the NZGB dataset
    } else {
      // there is no OSM feature with a ref, so try to search by name
      const matchFound = findMatch(nzgbPlace, osm.noRef);
      if (matchFound) {
        // Case B: We think we've found a match
        const action = compareFeatures(ref, nzgbPlace, matchFound);
        if (action) output.features.push(action);
      } else {
        // Case C: We couldn't find a match
        // So create a new OSM feature. Use the geometry from the LDS
        // if possible, otherwise add a node.

        const fallbackGeom: Geometry = {
          type: 'Point',
          coordinates: [nzgbPlace.lng, nzgbPlace.lat],
        };
        output.features.push({
          type: 'Feature',
          id: ref,
          geometry: nzgbGeom[+ref.split(';')[0]]?.geom || fallbackGeom,
          properties: {
            ...getPresetTags(nzgbPlace.lat, nzgbPlace.lng),

            name: nzgbPlace.name,
            'name:mi': nzgbPlace.nameMi,
            alt_name: nzgbPlace.altNames?.join(';'),
            old_name: nzgbPlace.oldNames?.join(';'),
            'ref:linz:place_id': ref,
          },
        });
      }
    }
  }

  // Case D: The ref exists in OSM, but not in the LINZ dataset
  // because of the way we split files, we can't really do this
  // for (const ref in osm.withRef) ...

  // calc stats
  for (const item of output.features) {
    if (item.properties.__action) {
      output.stats.editCount += 1;
    } else if (item.geometry.type === 'Point') {
      output.stats.addNodeCount += 1;
    } else {
      output.stats.addWayCount += 1;
    }
  }
  output.stats.okayCount =
    total -
    output.stats.editCount -
    output.stats.addNodeCount -
    output.stats.addWayCount;

  console.log(
    `\tComplete (${output.stats.addNodeCount}+${output.stats.addWayCount} missing, ${output.stats.editCount} wrong, ${output.stats.okayCount} okay)\n`,
  );
  await fs.writeFile(osmPathFilePath(type), JSON.stringify(output, null, 2));

  return output;
}

async function main() {
  const statsObj: Partial<StatsFile> = {};
  const extraLayersObj: Record<string, OsmPatchFile> = {};
  for (const _type in NZGB_NAME_TYPES) {
    const type = _type as NameType;
    const obj = NZGB_NAME_TYPES[type];
    if (obj === __SKIP) {
      statsObj[type] = null;
    } else {
      const osmPatch = await processOneType(type);
      const layerName = `ZZ Place Names - ${type}`;
      extraLayersObj[layerName] = osmPatch;
      statsObj[type] = osmPatch.stats;
    }
  }
  await fs.writeFile(nzgbIndexPath, JSON.stringify(statsObj, null, 2));
  await fs.writeFile(extraLayersFile, JSON.stringify(extraLayersObj));
}
main();
