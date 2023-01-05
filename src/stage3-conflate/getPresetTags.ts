import assert from 'node:assert';
import type { Tags } from 'pbf2json';
import type { NZGBFeature } from '../types';
import { NZGB_NAME_TYPES, __SKIP } from '../data';
import { isOffShore } from './isOffShore';

export function getPresetTags(place: NZGBFeature): { all: Tags; match: Tags } {
  const preset = NZGB_NAME_TYPES[place.type];
  assert(preset !== __SKIP); // impossible

  if ('tags' in preset) {
    return {
      all: { ...preset.tags, ...preset.addTags },
      match: preset.tags,
    };
  }

  return isOffShore(place.lat, place.lng)
    ? { all: preset.subseaTags, match: preset.subseaTags }
    : { all: preset.onLandTags, match: preset.onLandTags };
}
