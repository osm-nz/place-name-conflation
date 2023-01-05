import type { NZGBFeature, OSMFeature } from '../../types';

/**
 * special case to allow a name like `Te Onetapu / Rangipo Desert`
 * even though the official name is `Te Onetapu` and the legacy name is `Rangipo Desert`
 */
export function nameHasSlashForOldName(nzgb: NZGBFeature, osm: OSMFeature) {
  if (!osm.tags.name) return false;

  const nameSegments = osm.tags.name.split(' / ');
  return (
    nameSegments[0] === nzgb.name &&
    nameSegments.every(
      // check that every name in the "/" list is recognized by the NZGB
      (name) =>
        name === nzgb.name ||
        nzgb.oldNames?.includes(name) ||
        nzgb.altNames?.includes(name),
    )
  );
}
