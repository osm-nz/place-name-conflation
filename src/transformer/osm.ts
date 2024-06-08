import { REF } from '../core/constants.js';
import type {
  OSMFeature,
  RawOsm,
  TransformedOsm,
} from '../core/types/osm.def.js';

export function transformOsm(raw: RawOsm) {
  const out: TransformedOsm = {};

  for (const feature of raw.elements) {
    const ref = feature.tags?.[REF];
    if (!ref) {
      throw new Error(`${feature.type}/${feature.id} has no ref`);
    }

    out[ref] = feature as OSMFeature;
  }

  return out;
}
