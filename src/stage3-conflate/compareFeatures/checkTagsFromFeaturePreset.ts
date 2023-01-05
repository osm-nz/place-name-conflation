import type { Tags } from 'pbf2json';
import type { NZGBFeature, OSMFeature } from '../../types';
import { getPresetTags } from '../getPresetTags';

// from https://github.com/openstreetmap/iD/blame/5f1360e/modules/osm/tags.js#L11-L24
const LIFECYCLE_PREFIXES = {
  proposed: true,
  planned: true,
  construction: true,
  disused: true,
  abandoned: true,
  was: true,
  dismantled: true,
  razed: true,
  demolished: true,
  destroyed: true,
  removed: true,
  obliterated: true,
  intermittent: true,
};

// from https://github.com/openstreetmap/iD/blame/5f1360e/modules/osm/tags.js#L27
function osmRemoveLifecyclePrefix(key: string) {
  const keySegments = key.split(':');
  if (keySegments.length === 1) return key;

  if (keySegments[0] in LIFECYCLE_PREFIXES) {
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
 */
export function checkTagsFromFeaturePreset(
  nzgb: NZGBFeature,
  osm: OSMFeature,
): Tags {
  const tagChanges: Tags = {};

  const presetTags = getPresetTags(nzgb);

  // if the preset is place=locality skip this check
  if (presetTags.all.place === 'locality') return tagChanges;

  const cleanedOsmTags = stripAllLifecyclePrefixes(osm.tags);

  for (const [key, value] of Object.entries(presetTags.match)) {
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
