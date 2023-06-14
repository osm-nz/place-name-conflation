import type { NZGBFeature, OSMFeature } from '../../types';

/**
 * special case to allow a name like `Te Onetapu / Rangipo Desert`
 * even though the official name is `Te Onetapu` and the legacy name is `Rangipo Desert`
 * @returns true if this is an exception and we shouldn't change the name
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

/**
 * Special case to allow OSM to have macrons, if the NZGB name is unofficial.
 * @returns true if this is an exception and we shouldn't change the name
 */
export function isUnofficialAndOsmHasMacrons(
  nzgb: NZGBFeature,
  osm: OSMFeature,
) {
  if (nzgb.official) return false;

  return (
    nzgb.name?.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '') ===
    osm.tags.name?.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '')
  );
}

/**
 * If the name is 'Blackwood Bay or Tahuahua Bay', allow the OSM value to have
 * a `/` instead of `or`. Regardless, we will suggest the official value when
 * creating the feature.
 */
export function allowSlashInsteadOfOr(nzgb: NZGBFeature, osm: OSMFeature) {
  return nzgb.name.replaceAll(' or ', ' / ') === osm.tags.name;
}
