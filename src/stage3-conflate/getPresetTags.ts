import assert from 'node:assert';
import type { Tags } from 'pbf2json';
import type { NZGBFeature } from '../types';
import { NZGB_NAME_TYPES, __SKIP } from '../data';

export function getPresetTags(place: NZGBFeature): {
  all: Tags;
  match: Tags;
  acceptTags?: Tags[];
} {
  const preset = NZGB_NAME_TYPES[place.type];
  assert(preset !== __SKIP); // impossible

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
