import assert from 'node:assert';
import type { Tags } from 'osm-api';
import type { NZGBFeature } from '../core/types/nzgb.def.js';
import { NZGB_NAME_TYPES, __SKIP } from '../core/data/presets.js';

export function getPresetTags(place: NZGBFeature): {
  all: Tags;
  match: Tags;
  acceptTags?: Tags[];
} {
  const preset = NZGB_NAME_TYPES[place.type];
  assert.ok(preset && preset !== __SKIP); // impossible

  if ('tags' in preset) {
    return {
      all: { ...preset.tags, ...preset.addTags },
      match: preset.tags,
      acceptTags: preset.acceptTags,
    };
  }

  if (place.isUndersea) {
    return {
      all: preset.subseaTags,
      match: preset.subseaTags,
      acceptTags: [...(preset.acceptTags || []), preset.onLandTags],
    };
  }
  return {
    all: preset.onLandTags,
    match: preset.onLandTags,
    acceptTags: [...(preset.acceptTags || []), preset.subseaTags],
  };
}
