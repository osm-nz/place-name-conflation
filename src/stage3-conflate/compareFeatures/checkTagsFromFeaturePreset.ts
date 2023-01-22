import type { Tags } from 'pbf2json';
import type { NZGBFeature, OSMFeature } from '../../types';
import { getPresetTags } from '../getPresetTags';

// from https://github.com/openstreetmap/iD/blame/5f1360e/modules/osm/tags.js#L11-L24
const LIFECYCLE_PREFIXES = new Set([
  'proposed',
  'planned',
  'construction',
  'disused',
  'abandoned',
  'was',
  'dismantled',
  'razed',
  'demolished',
  'destroyed',
  'removed',
  'obliterated',
  'intermittent',
  'not',
]);

// from https://github.com/openstreetmap/iD/blame/5f1360e/modules/osm/tags.js#L27
function osmRemoveLifecyclePrefix(key: string) {
  const keySegments = key.split(':');
  if (keySegments.length === 1) return key;

  if (LIFECYCLE_PREFIXES.has(keySegments[0])) {
    return key.slice(keySegments[0].length + 1);
  }

  return key;
}

function stripAllLifecyclePrefixes(tags: Tags) {
  const out: Tags = {};
  for (const [key, value] of Object.entries(tags)) {
    out[osmRemoveLifecyclePrefix(key)] = value;
  }
  return out;
}

/**
 * We are pretty generous here, e.g. `demolished:man_made=bridge` is accepted for
 * `man_made=bridge`, and if the preset if `place=locality`, we accept anything.
 * We even accept `not:X=Y` if the preset is `X=Y`. We may want to reconsider this.
 */
export function checkTagsFromFeaturePreset(
  nzgb: NZGBFeature,
  osm: OSMFeature,
): Tags {
  const presetTags = getPresetTags(nzgb);

  // if the preset is place=locality skip this check
  if (presetTags.all.place === 'locality') return {};

  const cleanedOsmTags = stripAllLifecyclePrefixes(osm.tags);

  function check(presetToCheck: Tags): Tags {
    const tagChanges: Tags = {};

    for (const [key, value] of Object.entries(presetToCheck)) {
      const isTagWrong =
        value === '*' ? !cleanedOsmTags[key] : cleanedOsmTags[key] !== value;

      if (isTagWrong) {
        if (key === 'seamark:type' && cleanedOsmTags[key]) {
          // don't try to change seamark:type if it already has a more useful value
          // e.g. seamark:type=obstruction cf. seamark:type=sea_area
          // but if it's missing, we will add it
        } else {
          tagChanges[key] = presetTags.all[key];
        }
      }
    }
    return tagChanges;
  }

  const tagChanges = check(presetTags.match);

  // also check acceptTags
  if (presetTags.acceptTags) {
    for (const altPreset of presetTags.acceptTags) {
      const changesCount = Object.keys(check(altPreset)).length;

      // if no changes are required to conform to this preset, then
      // it's already tagged correctly. So return nothing.
      if (!changesCount) return {};
    }
  }

  return tagChanges;
}
