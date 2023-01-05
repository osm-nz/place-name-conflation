import type { Feature, Geometry } from 'geojson';
import type { Tags } from 'pbf2json';
import type { NZGBFeature, OSMFeature } from '../../types';
import { createDiamond, distanceBetween } from '../../core';
import { nameHasSlashForOldName } from './nameHasSlashForOldName';
import { checkTagsFromFeaturePreset } from './checkTagsFromFeaturePreset';

// in metres
const DISTANCE_APART_THRESHOLD_NODE = 2_500;
// this one is slightly higher since the centroid of the area might be quite far from the NZGB point
const DISTANCE_APART_THRESHOLD_AREA = 15_000;

/** compares the OSM place with the NZGB place and returns a list of issues */
export function compareFeatures(
  ref: string,
  nzgb: NZGBFeature,
  osm: OSMFeature,
): Feature<Geometry, Tags> | undefined {
  const tagChanges: Tags = { __action: 'edit' };
  // 1. Check `name`
  if (osm.tags.name !== nzgb.name) {
    if (!nameHasSlashForOldName(nzgb, osm)) {
      tagChanges.name = nzgb.name;
    }
  }

  // 2. Check `name:mi`
  if (nzgb.nameMi && !osm.tags['name:mi']) {
    tagChanges['name:mi'] = nzgb.nameMi;
  }

  // 3. Check `alt_name`
  const osmAltNames = osm.tags.alt_name?.split(';') || [];
  if (osm.tags['alt_name:mi']) {
    osmAltNames.push(...osm.tags['alt_name:mi'].split(';'));
  }
  if (osm.tags['alt_name:en']) {
    osmAltNames.push(...osm.tags['alt_name:en'].split(';'));
  }

  const altNamesNotInOsm = nzgb.altNames?.filter(
    (altName) => !osmAltNames.includes(altName),
  );
  if (altNamesNotInOsm?.length) {
    tagChanges.alt_name = [nzgb.altNames!, ...osmAltNames].join(';');
  }

  // 4. Check `old_name`
  const osmOldNames = osm.tags.old_name?.split(';') || [];
  osmOldNames.push(...osmAltNames);
  if (osm.tags['not:name']) {
    osmOldNames.push(...osm.tags['not:name'].split(';'));
  }

  const oldNamesNotInOsm = nzgb.oldNames?.filter(
    (oldName) => !osmOldNames.includes(oldName),
  );
  if (oldNamesNotInOsm?.length) {
    tagChanges.old_name = [nzgb.oldNames!, ...osmOldNames].join(';');
  }

  // 5. Check `ref:linz:place_id`
  if (osm.tags['ref:linz:place_id'] !== ref) {
    tagChanges['ref:linz:place_id'] = ref;
  }

  // 6. Check location
  const metresAway = distanceBetween(nzgb.lat, nzgb.lng, osm.lat, osm.lng);
  const threshold =
    osm.osmId[0] === 'n'
      ? DISTANCE_APART_THRESHOLD_NODE
      : DISTANCE_APART_THRESHOLD_AREA;
  if (metresAway > threshold) {
    tagChanges.__action = 'move';
  }

  // 7. Check that it has the right tags from the preset.
  Object.assign(tagChanges, checkTagsFromFeaturePreset(nzgb, osm));

  // 8. Check `name:etymology`. If there is already a value in OSM, we respect that,
  //    even if it's different to the value we deduced.
  if (
    nzgb.etymology &&
    !osm.tags['name:etymology'] &&
    !osm.tags['name:etymology:wikidata']
  ) {
    tagChanges['name:etymology'] = nzgb.etymology;
  }

  //
  // END OF CHECKS
  //

  const numChanges = Object.keys(tagChanges).length - 1;
  if (numChanges === 0) return undefined;

  // If the only thing the system wants to do is add `name:mi`, then abort.
  // It's probably wrong and will be dealt with separately
  if (numChanges === 1 && tagChanges['name:mi']) return undefined;

  return {
    type: 'Feature',
    id: osm.osmId,
    geometry:
      tagChanges.__action === 'move'
        ? {
            type: 'LineString',
            coordinates: [
              [osm.lng, osm.lat],
              [nzgb.lng, nzgb.lat],
            ],
            // @ts-expect-error -- just for diagnostics
            metresAway,
          }
        : createDiamond(osm.lat, osm.lng),
    properties: tagChanges,
  };
}