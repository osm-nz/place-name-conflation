import type { Tags } from 'osm-api';
import { normaliseTrivialNameDifferences } from './exceptions.js';

const normalise = (word: string) =>
  normaliseTrivialNameDifferences(word)
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '');

/**
 * We're detecting the case where:
 * 1. the OSM feature has a manually-set `name:mi` tag; and
 * 2. a word within `name:mi` also exists in the nzgb name; and
 * 3. the word has macrons in the NZGB dataset; and
 * 4. the word does not have macrons in OSM, or the wrong
 *   characters have macrons.
 * See unit tests for examples.
 */
export function checkSubNameForMissingMacrons(
  nzgb: string,
  osmSubName: string,
) {
  /** map of unmacronated words to the version with macrons */
  const nzgbMacronMap = Object.fromEntries(
    nzgb
      .split(' ')
      .map((word) => [normalise(word), normaliseTrivialNameDifferences(word)]),
  );

  const updatedSubName = osmSubName
    .split(' ')
    .map((osmWord) => {
      const osmWordWithoutMacrons = normalise(osmWord);
      const nzgbWord = nzgbMacronMap[osmWordWithoutMacrons];
      if (
        nzgbWord &&
        // this logic should not trigger if capitalisation is
        // the only difference, hence `toLowerCase` everywhere.
        nzgbWord.toLowerCase() !== osmWord.toLowerCase() &&
        nzgbWord.toLowerCase() !== osmWordWithoutMacrons
      ) {
        return nzgbWord;
      }
      return osmWord;
    })
    .join(' ');

  if (osmSubName === updatedSubName) return undefined; // no change
  return updatedSubName;
}

// no other checks rn
export const checkNameMi = checkSubNameForMissingMacrons;

export function checkNameEn(nzgb: string, tags: Tags) {
  const nameEn = tags['name:en']!;

  const macronIssue = checkSubNameForMissingMacrons(nzgb, nameEn);
  if (macronIssue) return macronIssue;

  /** if `name` = `name:fr` or something (e.g. in Antartica) */
  const isPrimaryNameInForeignLanguage = Object.entries(tags).some(
    ([key, value]) =>
      key.startsWith('name:') &&
      !key.startsWith('name:etymology') &&
      key !== 'name:en' &&
      key !== 'name:mi' &&
      value === tags.name,
  );

  // if `name:en` doesn't exist in `name`, there's probably something wrong
  if (
    !normalise(nzgb).includes(normalise(nameEn)) &&
    !isPrimaryNameInForeignLanguage &&
    nzgb
  ) {
    return nzgb;
  }

  // TODO: in the future, we could also check if `name:en` only
  // contains half of a dual name instead of the entire thing.
  return undefined;
}
