import { NZGB_NAME_TYPES, __SKIP } from '../../core/data/presets.js';
import type { Config } from '../../core/types/general.def.js';
import type { NZGBFeature } from '../../core/types/nzgb.def.js';
import type { OSMFeature } from '../../core/types/osm.def.js';

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

/** @internal @returns true if the names are similar enough */
function isPrettyMuchEqual(nzgbName: string, osmName: string) {
  // the number of charcaters must be the same
  if (nzgbName.length !== osmName.length) return false;

  for (let index = 0; index < nzgbName.length; index++) {
    // compare letter-by-letter
    const nzgbChar = nzgbName[index];
    const osmChar = osmName[index];

    const isOkay =
      nzgbChar === osmChar ||
      nzgbChar === osmChar!.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '');

    if (!isOkay) return false;
  }

  return true;
}

/**
 * Special case to allow OSM to have macrons, if the NZGB name is unofficial.
 * @returns true if this is an exception and we shouldn't change the name
 */
export function isUnofficialAndOsmHasMacrons(
  nzgb: NZGBFeature,
  osm: OSMFeature,
  config: Config,
) {
  const ref = osm.tags['ref:linz:place_id']!;

  // for official names, an inconsistency is only
  // acceptable if there's an override for this ref.
  const shouldAllowInconsistency = nzgb.official
    ? ref in config.allowInconsistentDiacritics
    : true;

  return (
    shouldAllowInconsistency &&
    isPrettyMuchEqual(nzgb.name, osm.tags.name || '')
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

/** @internal */
function normaliseTrivialNameDifferences(name: string) {
  return name
    .replace(/ Government Purpose/, '')
    .replace(/\bMount\b/, 'Mt')
    .replace(/\bSaint\b/, 'St')
    .replace(/\bSt\./, 'St');
}

/**
 * Allow some deviations to the spelling, in cases where there
 * is ongoing dispute (e.g. Saint vs St) or where the different
 * is pretty trivial. (e.g. Mount vs Mt)
 */
export function allowTrivialDifferences(nzgb: NZGBFeature, osm: OSMFeature) {
  return (
    normaliseTrivialNameDifferences(nzgb.name) ===
    normaliseTrivialNameDifferences(osm.tags.name || '')
  );
}

/**
 * Allow name:mi to be repeated in the name tag for dual names
 * that are separated by a `/`
 */
export function allowDualNames(nzgb: NZGBFeature, osm: OSMFeature) {
  const nameSegments = osm.tags.name?.split(' / ');

  return (
    nameSegments?.length === 2 &&
    nameSegments.every(
      (segment) =>
        isPrettyMuchEqual(nzgb.name, segment) ||
        segment === osm.tags['name:mi'],
    )
  );
}

/**
 * If the preset is `x=y`, but the OSM feature has an explicit `not:x=y`
 * tag, then we'll allow any `name` tag.
 */
export function hasNotLifeCycleTag(nzgb: NZGBFeature, osm: OSMFeature) {
  const preset = NZGB_NAME_TYPES[nzgb.type];
  if (!preset || preset === __SKIP) return false;

  const presetKeys = 'tags' in preset ? Object.entries(preset.tags) : [];

  return presetKeys.some(([key, value]) => osm.tags[`not:${key}`] === value);
}
