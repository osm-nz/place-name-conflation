import type { Feature, Geometry } from 'geojson';
import type { Tags } from 'pbf2json';
import type { NZGBFeature, OSMFeature } from '../types';
import { createDiamond, distanceBetween } from '../core';

// in metres
const DISTANCE_APART_THRESHOLD_NODE = 2_500;
// this one is slightly higher since the centroid of the area might be quite far from the NZGB point
const DISTANCE_APART_THRESHOLD_AREA = 5_000;

/** compares the OSM place with the NZGB place and returns a list of issues */
export function compareFeatures(
  ref: string,
  nzgb: NZGBFeature,
  osm: OSMFeature,
): Feature<Geometry, Tags> | undefined {
  const tagChanges: Tags = { __action: 'edit' };
  // 1. Check `name`
  if (osm.tags.name !== nzgb.name) {
    tagChanges.name = nzgb.name;
  }

  // 2. Check `name:mi`
  if (nzgb.nameMi && !osm.tags['name:mi']) {
    tagChanges['name:mi'] = nzgb.nameMi;
  }

  // 3. Check `alt_name`
  const osmAltNames = osm.tags.alt_name?.split(';') || [];
  const altNamesNotInOsm = nzgb.altNames?.filter(
    (altName) => !osmAltNames.includes(altName),
  );
  if (altNamesNotInOsm?.length) {
    tagChanges.alt_name = [nzgb.altNames!, ...osmAltNames].join(';');
  }

  // 4. Check `old_name`
  const osmOldNames = osm.tags.old_name?.split(';') || [];
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

  if (Object.keys(tagChanges).length < 2) return undefined;

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
