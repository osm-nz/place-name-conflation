import type { Key, Tags } from 'osm-api';
import { getPresetTags } from '../getPresetTags.js';
import type { NZGBFeature } from '../../core/types/nzgb.def.js';
import type { OSMFeature } from '../../core/types/osm.def.js';

// from https://github.com/openstreetmap/iD/blame/5f1360e/modules/osm/tags.js#L11-L24
const LIFECYCLE_PREFIXES = new Set(<const>[
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
export type LifeCyclePrefix =
  typeof LIFECYCLE_PREFIXES extends Set<infer T> ? T : never;

// from https://github.com/openstreetmap/iD/blame/5f1360e/modules/osm/tags.js#L27
function osmRemoveLifecyclePrefix(key: Key): Key {
  const keySegments = key.split(':');
  if (keySegments.length === 1) return key;

  if (LIFECYCLE_PREFIXES.has(<LifeCyclePrefix>keySegments[0]!)) {
    return <Key>key.slice(keySegments[0]!.length + 1);
  }

  return key;
}

/**
 * This converts an object like:
 * ```js
 * { place: 'suburb', 'not:place': 'island' }
 * ```
 * into:
 * ```js
 * { place: ['suburb', 'island'] }
 * ```
 */
function stripAllLifecyclePrefixes(tags: Tags) {
  const out: Partial<Record<Key, Set<string>>> = {};
  for (const [_key, value] of Object.entries(tags)) {
    const key = <Key>_key;
    if (value) {
      const stripedKey = osmRemoveLifecyclePrefix(key);
      out[stripedKey] ||= new Set<string>();
      out[stripedKey]!.add(value);
    }
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

    // if the preset consists of multiple tags, any *any* of the
    // tags have a lifecycle prefix, then we won't try to add the
    // other tags from the preset.
    const hasLifecyclePrefix = Object.entries(presetToCheck).some(
      ([_key, value]) => {
        const key = <Key>_key;
        return cleanedOsmTags[key]?.has(value!) && osm.tags[key] !== value;
      },
    );
    if (hasLifecyclePrefix) return tagChanges;

    for (const [_key, value] of Object.entries(presetToCheck)) {
      const key = <Key>_key;
      const osmTagValues = [...(cleanedOsmTags[key] || [])];
      const isTagWrong =
        !osmTagValues.length ||
        (value !== '*' && osmTagValues.every((v) => v !== value));

      if (isTagWrong) {
        if (key === 'seamark:type' && !!osmTagValues.length) {
          // don't try to change seamark:type if it already has a more useful value
          // e.g. seamark:type=obstruction cf. seamark:type=sea_area
          // but if it's missing, we will add it
        } else {
          tagChanges[key] = presetTags.all[key]!;
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
