import { distanceBetween } from '../core';
import type { NZGBFeature, OSMFeature } from '../types';
import { getPresetTags } from './getPresetTags';

// metres. If the matched feature is further away than this, discard it.
const DISTANCE_THRESHOLD = 5000;

const stripDownName = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .replaceAll(/[^\w ]/g, '')
    .replaceAll(/^Mt /g, 'Mount ');

const rankTags = (element: OSMFeature, nzgb: NZGBFeature) => {
  const presetTags = getPresetTags(nzgb);
  let score = 0;
  for (const [key, value] of Object.entries(presetTags.all)) {
    // one point if the feature has the exact tags
    if (element.tags[key] === value) score += 1;
    // ½ point if it has the right key but a diff value
    else if (element.tags[key]) score += 0.5;
  }
  return score;
};

export function findMatch(
  nzgb: NZGBFeature,
  osmFeatures: OSMFeature[],
): OSMFeature | undefined {
  const stripedNzgbName = stripDownName(nzgb.name);
  const matches = osmFeatures
    .filter(
      (element) =>
        // match by name or qId
        stripDownName(element.tags.name!) === stripedNzgbName ||
        (nzgb.qId && nzgb.qId === element.tags.wikidata),
    )
    .map((element) => ({
      el: element,
      distance: distanceBetween(nzgb.lat, nzgb.lng, element.lat, element.lng),
    }))
    .filter((x) => x.distance < DISTANCE_THRESHOLD)
    .sort((a, b) => a.distance - b.distance);

  if (matches.length > 1) {
    // multiple nearby matches. So pick the one with the most appropriate preset.
    // e.g. If we're looking for a bay, prefer natural=bay over natural=beach
    const rankedMatches = matches
      .map((x) => ({ ...x, rank: rankTags(x.el, nzgb) }))
      .sort((a, b) => b.rank - a.rank);
    return rankedMatches[0].el;
  }

  if (matches.length === 1) return matches[0].el;

  return undefined;
}
