import { promises as fs } from 'node:fs';
import type { Geometry } from 'geojson';
import type {
  GeometryTempFile,
  NZGBSourceData,
  OSMTempFile,
  OsmPatchFile,
  StatsFile,
} from '../types';
import { NZGB_NAME_TYPES, type NameType, __SKIP } from '../data';
import {
  extraLayersFile,
  findTopLevelTags,
  nzgbIndexPath,
  nzgbJsonGeometryPath,
  nzgbJsonPath,
  osmPathFilePath,
  tempOsmFile,
} from '../core';
import {
  compareFeatures,
  wikidataErrors,
} from './compareFeatures/compareFeatures';
import { findMatch } from './findMatch';
import { getPresetTags } from './getPresetTags';

// baseline: this took 120sec on the very first run (1k refs in the planet)
function processOneType(
  type: NameType,
  nzgb: NZGBSourceData,
  nzgbGeom: GeometryTempFile,
  osm: OSMTempFile,
) {
  console.log(type);
  console.log('\tReading files...');

  console.log('\tConflating...');

  const categoryDefinition = NZGB_NAME_TYPES[type];
  if (categoryDefinition === __SKIP) {
    throw new Error(`Type "${type}" is skipped`);
  }

  // find the top level tag(s) to use. If there is a different tagging scheme
  // for on land vs subsea, then we merge two categories together
  const presets =
    'tags' in categoryDefinition
      ? findTopLevelTags(categoryDefinition.tags)
      : [
          ...findTopLevelTags(categoryDefinition.onLandTags),
          ...findTopLevelTags(categoryDefinition.subseaTags),
        ];

  let osmCategory: OSMTempFile[string];
  if (presets.length === 0) {
    throw new Error('Preset error run `yarn 2`');
  } else if (presets.length === 1) {
    osmCategory = osm[presets[0]];
    if (!osmCategory) {
      throw new Error('Preset error run `yarn 2`');
    }
  } else {
    osmCategory = {
      noRef: [],
      withRef: {},
    };
    for (const preset of presets) {
      if (!osm[preset]) {
        throw new Error('Preset error run `yarn 2`');
      }
      osmCategory.noRef.push(...osm[preset].noRef);
      Object.assign(osmCategory.withRef, osm[preset].withRef);
    }
  }

  let total = 0;

  const output: OsmPatchFile = {
    type: 'FeatureCollection',
    size: 'large',
    stats: {
      okayCount: 0,
      addNodeCount: 0,
      addWayCount: 0,
      editCount: 0,
      percentageAnt: 0,
    },
    features: [],
    instructions:
      'Please review and refine suggestions to add `name:mi` or `name:etymology`. These suggestions may not be perfect.',
  };

  for (const ref in nzgb) {
    const nzgbPlace = nzgb[ref];
    if (nzgbPlace.type !== type) continue; // eslint-disable-line no-continue

    total += 1;

    let osmPlace = osmCategory.withRef[ref];
    // we can't immediately find the place, try lookup the other categories
    // and check for possible invalid/out of date resf
    if (!osmPlace) {
      // check all the oldRefs and split the current ref to check if
      // it's mapped with part of the ref.
      const potentialIds = [...ref.split(';'), ...(nzgbPlace.oldRefs || [])];

      for (const potentialRef of potentialIds) {
        osmPlace ||= osmCategory.withRef[potentialRef];

        for (const category in osm) {
          osmPlace ||= osm[category].withRef[potentialRef];
        }
      }
    }

    if (osmPlace) {
      // Case A: there is already a OSM feature with the ref:linz:place_id tag
      const action = compareFeatures(ref, nzgbPlace, osmPlace);
      if (action) output.features.push(action);
    } else {
      // there is no OSM feature with a ref, so try to search by name
      const matchFound = findMatch(nzgbPlace, osmCategory.noRef);
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
            ...getPresetTags(nzgbPlace).all,

            name: nzgbPlace.name,
            'name:mi': nzgbPlace.nameMi,
            alt_name: nzgbPlace.altNames?.join(';'),
            old_name: nzgbPlace.oldNames?.join(';'),
            'ref:linz:place_id': ref,

            wikidata: nzgbPlace.qId,
            wikipedia: nzgbPlace.wikipedia,
            'name:etymology': nzgbPlace.etymology,
            'name:etymology:wikidata': nzgbPlace.etymologyQId,
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

  output.stats.percentageAnt = Math.round(
    (output.features.filter((f) => {
      // @ts-expect-error -- hack
      let firstPair = f.geometry.coordinates;
      while (typeof firstPair[0] !== 'number') {
        [firstPair] = firstPair;
      }
      return firstPair[1] < -50;
    }).length /
      output.features.length) *
      100,
  );

  console.log(
    `\tComplete (${output.stats.addNodeCount}+${output.stats.addWayCount} missing, ${output.stats.editCount} wrong, ${output.stats.okayCount} okay)\n`,
  );

  return output;
}

const trivialKeys = new Set([
  '__action',
  'ref:linz:place_id',
  'wikidata',
  'wikipedia',
  'name:etymology', // only if there is also name:ety:wikidata
  'name:etymology:wikidata',
  'source:name',
  'source',
  'alt_name',
  'old_name',
]);

// temp - eventually move everything out of ZZ
const publish: Partial<Record<NameType, true>> = {
  Hill: true,
  Locality: true,
  Bay: true,
  Point: true,
  Island: true,
  Lake: true,
  Ridge: true,
  Range: true,
  Site: true,
  Rock: true,
  Cliff: true,
  Flat: true,
  Place: true,
  Beach: true,
};

async function main() {
  const nzgb: NZGBSourceData = JSON.parse(
    await fs.readFile(nzgbJsonPath, 'utf8'),
  );
  const nzgbGeom: GeometryTempFile = JSON.parse(
    await fs.readFile(nzgbJsonGeometryPath, 'utf8'),
  );
  const osm: OSMTempFile = JSON.parse(await fs.readFile(tempOsmFile, 'utf8'));

  const statsObject: Partial<StatsFile> = {};
  const extraLayersObject: Record<string, OsmPatchFile> = {};

  // Create a special layer with only the trivial changes, so we can race thru the
  // trivial changes in the import tool. This only affects the extra-layers.geo.json file.
  const trivialLayerName = 'ZZ Add Wikidata/Ref';
  extraLayersObject[trivialLayerName] = {
    type: 'FeatureCollection',
    stats: {
      addNodeCount: 0,
      addWayCount: 0,
      editCount: 0,
      okayCount: 0,
      percentageAnt: 0,
    },

    size: 'large',
    instructions:
      'For this layer, a table editor is much more efficient than RapiD',
    features: [],
  };

  for (const _type in NZGB_NAME_TYPES) {
    const type = _type as NameType;
    const object = NZGB_NAME_TYPES[type];
    if (object === __SKIP) {
      statsObject[type] = null;
    } else {
      const osmPatch = processOneType(type, nzgb, nzgbGeom, osm);
      await fs.writeFile(
        osmPathFilePath(type),
        JSON.stringify(osmPatch, null, 2),
      );
      statsObject[type] = osmPatch.stats;

      for (const f of osmPatch.features) {
        // if the only thing being editted is the ref tag or wikidata or wikipedia tag
        const isTrivial =
          f.properties.__action === 'edit' &&
          Object.keys(f.properties).every((key) => trivialKeys.has(key)) &&
          // either both name:ety & wikidata, or niether
          !!f.properties['name:etymology'] ===
            !!f.properties['name:etymology:wikidata'];

        if (isTrivial) {
          extraLayersObject[trivialLayerName].features.push(f);
          extraLayersObject[trivialLayerName].stats.editCount++;
        }
      }

      extraLayersObject[`${publish[type] ? 'Z' : 'ZZ'} ${type}`] = osmPatch;
    }
  }

  console.log(wikidataErrors.join('\n'));

  await fs.writeFile(nzgbIndexPath, JSON.stringify(statsObject, null, 2));
  await fs.writeFile(extraLayersFile, JSON.stringify(extraLayersObject));
}
main();
