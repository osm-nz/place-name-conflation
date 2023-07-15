import assert from 'node:assert';
import type { Feature, Geometry } from 'geojson';
import type { Tags } from 'pbf2json';
import type { NZGBFeature, OSMFeature } from '../../types';
import { createDiamond, distanceBetween } from '../../core';
import {
  nameHasSlashForOldName,
  isUnofficialAndOsmHasMacrons,
  allowSlashInsteadOfOr,
} from './exceptions';
import { checkTagsFromFeaturePreset } from './checkTagsFromFeaturePreset';
import { DONT_TRY_TO_MOVE, NZGB_NAME_TYPES, __SKIP } from '../../data';

// in metres
const DISTANCE_APART_THRESHOLD_NODE = 2500;
// this one is slightly higher since the centroid of the area might be quite far from the NZGB point
const DISTANCE_APART_THRESHOLD_AREA = 15_000;

export const wikidataErrors: string[] = [];

/** compares the OSM place with the NZGB place and returns a list of issues */
export function compareFeatures(
  ref: string,
  nzgb: NZGBFeature,
  osm: OSMFeature,
): Feature<Geometry, Tags> | undefined {
  const tagChanges: Tags = { __action: 'edit' };

  const preset = NZGB_NAME_TYPES[nzgb.type];
  assert(preset !== __SKIP);

  // 1a. Check `name`
  if (!preset.chillMode && osm.tags.name !== nzgb.name) {
    const exceptions = [
      nameHasSlashForOldName(nzgb, osm),
      isUnofficialAndOsmHasMacrons(nzgb, osm),
      allowSlashInsteadOfOr(nzgb, osm),
    ];
    // if every exception is false, then propose changing the name
    if (exceptions.every((x) => !x)) {
      tagChanges.name = nzgb.name;
    }
  }

  // 1b. In chill mode, we only care if `official_name` is correct.
  if (
    preset.chillMode &&
    osm.tags.official_name !== nzgb.name &&
    osm.tags.name !== nzgb.name // no need for `official_name` if `name` is the official one
  ) {
    tagChanges.official_name = nzgb.name;
  }

  // 2. Check `name:mi`
  //    special case: If we're adding macrons to `name`, override `name:mi` as well
  const nameChangeIsAddingMacrons =
    tagChanges.name &&
    tagChanges.name.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '') ===
      osm.tags.name;

  if (nzgb.nameMi && (!osm.tags['name:mi'] || nameChangeIsAddingMacrons)) {
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
    tagChanges.alt_name = [
      ...altNamesNotInOsm,
      ...(osm.tags.alt_name?.split(';') || []),
    ].join(';');
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
    tagChanges.old_name = [
      ...oldNamesNotInOsm,
      ...(osm.tags.old_name?.split(';') || []),
    ].join(';');
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
  if (metresAway > threshold && !DONT_TRY_TO_MOVE.has(nzgb.type)) {
    tagChanges.__action = 'move';
  }

  // 7. Check that it has the right tags from the preset.
  Object.assign(tagChanges, checkTagsFromFeaturePreset(nzgb, osm));

  // 8. Check `name:etymology`. If there is already a value in OSM, we respect that,
  //    even if it's different to the value we deduced.
  if (
    nzgb.etymology &&
    !osm.tags['name:etymology'] &&
    !osm.tags['name:mi:etymology'] &&
    !osm.tags['name:en:etymology'] &&
    !osm.tags['name:etymology:wikidata'] &&
    !osm.tags['name:mi:etymology:wikidata'] &&
    !osm.tags['name:en:etymology:wikidata']
  ) {
    tagChanges['name:etymology'] = nzgb.etymology;
  }

  // 9. Ensure that `name:etymology:wikidata` tag is correct. If not, either OSM or wikidata needs fixing
  if (
    nzgb.etymologyQId &&
    nzgb.etymologyQId !== osm.tags['name:etymology:wikidata'] &&
    nzgb.etymologyQId !== osm.tags['name:mi:etymology:wikidata'] &&
    nzgb.etymologyQId !== osm.tags['name:en:etymology:wikidata']
  ) {
    tagChanges['name:etymology:wikidata'] = nzgb.etymologyQId;
  }

  // 10. Ensure the `wikidata` tag is correct. If not, either OSM or wikidata needs fixing
  if (nzgb.qId && nzgb.qId !== osm.tags.wikidata) {
    if (osm.tags.wikidata) {
      // abort and don't touch the feature if there appears to be duplicate entries in wikidata
      // Fixing this data issue may require editing or merging wikidata items.
      wikidataErrors.push(
        `(!) Wikidata tag is wrong on ${osm.osmId} (${osm.tags.wikidata}), should be ${nzgb.qId}`,
      );
      return undefined;
    }

    // wikidata tag is mising
    tagChanges.wikidata = nzgb.qId;
  }

  // 11. Add the wikipedia tag if it's missing
  if (nzgb.wikipedia && !osm.tags.wikipedia) {
    tagChanges.wikipedia = nzgb.wikipedia;
  }

  // 12. Replace source:name=https://gazetteer.linz.govt.nz/place/XXX with ref:linz:place_id=XXX
  if (
    osm.tags['source:name']?.startsWith(
      'https://gazetteer.linz.govt.nz/place/',
    ) &&
    !osm.tags['source:name'].includes(';')
  ) {
    const existingRef = osm.tags['source:name'].replace(
      'https://gazetteer.linz.govt.nz/place/',
      '',
    );
    if (existingRef !== ref) {
      // abort and don't touch the feature if someone has already tagged it with a different ref
      // in the source:name tag
      wikidataErrors.push(
        `(!) Incorrect source:name tag on ${osm.osmId}, should be “${ref}”`,
      );
      return undefined;
    }
    // delete the source:name tag since it duplicates ref:linz:place_id
    tagChanges['source:name'] = '🗑️';
  }

  //
  // END OF CHECKS
  //

  const numberChanges = Object.keys(tagChanges).length - 1;
  if (numberChanges === 0) return undefined;

  // If the only thing the system wants to do is add `name:mi`, then abort.
  // It's probably wrong and will be dealt with separately
  if (numberChanges === 1 && tagChanges['name:mi']) return undefined;
  // Likewise for the wikipedia tag: if it's the only thing we want to edit, don't bother.
  if (numberChanges === 1 && tagChanges.wikipedia) return undefined;
  if (numberChanges === 2 && tagChanges.wikipedia && tagChanges['name:mi']) {
    return undefined;
  }

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
