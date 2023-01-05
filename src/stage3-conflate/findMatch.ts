import { distanceBetween } from '../core';
import { NZGBFeature, OSMFeature } from '../types';

// metres. If the matched feature is further away than this, discard it.
const DISTANCE_THRESHOLD = 5_000;

const stripDownName = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w ]/g, '');

export function findMatch(
  nzgb: NZGBFeature,
  osmFeatures: OSMFeature[],
): OSMFeature | undefined {
  const stripedNzgbName = stripDownName(nzgb.name);
  const matches = osmFeatures
    .filter((el) => stripDownName(el.tags.name!) === stripedNzgbName)
    .map((el) => ({
      el,
      distance: distanceBetween(nzgb.lat, nzgb.lng, el.lat, el.lng),
    }))
    .sort((a, b) => a.distance - b.distance);

  if (matches[0]?.distance < DISTANCE_THRESHOLD) {
    return matches[0].el;
  }

  return undefined;
}
