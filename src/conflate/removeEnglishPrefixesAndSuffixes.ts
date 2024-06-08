/**
 * a common example is "Mt X" and "X Mountain" coëxisting, because
 * the NZGB hasn't done a good job of deduplicating their dataset.
 */
const WORDS_TO_REMOVE = [
  'Mount',
  'Mountain',
  'Peak',
  'Hill',
  'St',
  'Saint',
].join('|');

const REGEX = new RegExp(`(^(${WORDS_TO_REMOVE})|(${WORDS_TO_REMOVE})$)`);

export function removeEnglishPrefixesAndSuffixes(name: string) {
  return name.replace(REGEX, '').trim();
}
