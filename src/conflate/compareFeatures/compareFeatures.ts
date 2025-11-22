import assert from 'node:assert';
import type { Feature, Geometry } from 'geojson';

import type { OsmPatchFeature, Tags } from 'osm-api';
import type { NZGBFeature } from '../../core/types/nzgb.def.js';
import type { OSMFeature } from '../../core/types/osm.def.js';
import {
  DONT_TRY_TO_MOVE,
  NZGB_NAME_TYPES,
  __SKIP,
} from '../../core/data/presets.js';
import { distanceBetween } from '../../core/geo.js';
import type { WikidataItem } from '../../core/types/wikidata.def.js';
import type { Config } from '../../core/types/general.def.js';
import { checkTagsFromFeaturePreset } from './checkTagsFromFeaturePreset.js';
import {
  allowDualNames,
  allowSlashInsteadOfOr,
  allowTrivialDifferences,
  hasNotLifeCycleTag,
  isUnofficialAndOsmHasMacrons,
  nameHasSlashForOldName,
} from './exceptions.js';

// in metres
const DISTANCE_APART_THRESHOLD_NODE = 2500;
// this one is slightly higher since the centroid of the area might be quite far from the NZGB point
const DISTANCE_APART_THRESHOLD_AREA = 15_000;

const TRIVIAL_KEYS = new Set([
  '__action',
  'wikipedia',
  'name:etymology',
  'name:etymology:wikidata',
]);

export type WikidataErrors = {
  osmId: string;
  expected: string;
  actual: string;
  lat: number;
  lng: number;
};
export const wikidataErrors: WikidataErrors[] = [];

type TagsWithAction = Tags & {
  __action: OsmPatchFeature['properties']['__action'];
};

/** compares the OSM place with the NZGB place and returns a list of issues */
export function compareFeatures(
  ref: string,
  nzgb: NZGBFeature,
  osm: OSMFeature,
  bestWikidata: WikidataItem | undefined,
  config: Config,
): Feature<Geometry, TagsWithAction> | undefined {
  const tagChanges: TagsWithAction = { __action: 'edit' };

  const osmCenter =
    'lat' in osm && 'lon' in osm
      ? (osm as { lat: number; lon: number })
      : osm.center;

  const preset = NZGB_NAME_TYPES[nzgb.type];
  assert(preset && preset !== __SKIP);
  assert(osm.tags);

  // 1a. Check `name`
  if (!preset.chillMode && osm.tags.name !== nzgb.name) {
    const exceptions = [
      nameHasSlashForOldName(nzgb, osm),
      isUnofficialAndOsmHasMacrons(nzgb, osm, config),
      allowSlashInsteadOfOr(nzgb, osm),
      allowTrivialDifferences(nzgb, osm),
      allowDualNames(nzgb, osm),
      hasNotLifeCycleTag(nzgb, osm),
    ];
    // if every exception is false, then propose changing the name
    if (exceptions.every((x) => !x)) {
      tagChanges.name = nzgb.name;
    }
  }

  // 1b. In chill mode, we only care if `official_name` is correct.
  //     (In very rare cases we allow `alt_name` instead of
  //     `official_name`, e.g. for marae)
  if (
    preset.chillMode &&
    osm.tags[preset.chillMode] !== nzgb.name &&
    osm.tags.name !== nzgb.name // no need for `official_name` if `name` is the official one
  ) {
    tagChanges[preset.chillMode] = nzgb.name;
  }

  // 3. Check `alt_name`
  const osmAltNames = osm.tags.alt_name?.split(';') || [];
  if (osm.tags['name:mi']) {
    // name:mi is a valid alternative to using alt_name
    osmAltNames.push(...osm.tags['name:mi'].split(';'));
  }
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
  const metresAway = osmCenter
    ? distanceBetween(nzgb.lat, nzgb.lng, osmCenter.lat, osmCenter.lon)
    : 0; // assume location is perfect if we have no centroid

  const threshold =
    osm.tags['seamark:type'] === 'sea_area' // don't check enourmous undersea areas
      ? Infinity
      : osm.type === 'node'
        ? DISTANCE_APART_THRESHOLD_NODE
        : osm.type === 'way'
          ? DISTANCE_APART_THRESHOLD_AREA
          : Infinity; // relations are not checked for distance

  if (metresAway > threshold && !DONT_TRY_TO_MOVE.has(nzgb.type)) {
    tagChanges.__action = 'move';
  }

  // 7. Check that it has the right tags from the preset.
  Object.assign(tagChanges, checkTagsFromFeaturePreset(nzgb, osm));

  // 9. Ensure that `name:etymology[:wikidata]` is correct. If not, either OSM or wikidata needs fixing
  if (
    bestWikidata?.etymology &&
    bestWikidata?.etymologyQId &&
    !osm.tags['name:en:etymology'] &&
    !osm.tags['name:mi:etymology']
  ) {
    if (!osm.tags['name:etymology']) {
      tagChanges['name:etymology'] = bestWikidata.etymology;
    }
    if (bestWikidata.etymologyQId !== osm.tags['name:etymology:wikidata']) {
      // if we're changing the :wikidata tag, then change the normal etymology
      // tag as well, so that they stay in sync.
      tagChanges['name:etymology:wikidata'] = bestWikidata.etymologyQId;
      tagChanges['name:etymology'] = bestWikidata.etymology;
    }
  }

  // 10. Ensure the `wikidata` tag is correct. If not, either OSM or wikidata needs fixing
  if (bestWikidata?.qId && bestWikidata.qId !== osm.tags.wikidata) {
    if (osm.tags.wikidata) {
      // abort and don't touch the feature if there appears to be duplicate entries in wikidata
      // Fixing this data issue may require editing or merging wikidata items.
      wikidataErrors.push({
        osmId: `${osm.type[0]}${osm.id}`,
        expected: bestWikidata.qId,
        actual: osm.tags.wikidata,
        lat: nzgb.lat,
        lng: nzgb.lng,
      });
      return undefined;
    }

    // wikidata tag is mising
    if (osm.tags['not:wikidata'] !== bestWikidata.qId) {
      tagChanges.wikidata = bestWikidata.qId;
    }
  }

  // 11. Add the wikipedia tag if it's missing
  if (
    bestWikidata?.wikipedia &&
    !osm.tags.wikipedia &&
    !osm.tags['not:wikidata'] // skip if this is a tricky situation
  ) {
    tagChanges.wikipedia = bestWikidata.wikipedia;
  }

  //
  // END OF CHECKS
  //

  const numberChanges = Object.keys(tagChanges).length - 1;
  if (numberChanges === 0) return undefined;

  // abort if the only changes are trivial
  if (Object.keys(tagChanges).every((key) => TRIVIAL_KEYS.has(key))) {
    return undefined;
  }

  return {
    type: 'Feature',
    id: `${osm.type[0]}${osm.id}`,
    geometry:
      tagChanges.__action === 'move'
        ? {
            type: 'LineString',
            coordinates: [
              [osmCenter!.lon, osmCenter!.lat],
              [nzgb.lng, nzgb.lat],
            ],
            // @ts-expect-error -- just for diagnostics
            metresAway,
          }
        : {
            type: 'Point',
            coordinates: osmCenter ? [osmCenter.lon, osmCenter.lat] : [0, 0],
          },
    properties: tagChanges,
    __hack__: { layer: nzgb.type, ref },
  };
}
