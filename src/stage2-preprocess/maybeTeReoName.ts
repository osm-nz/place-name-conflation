import { readFileSync } from 'node:fs';
import { englishDictFile } from '../core';
import {
  ADD_TO_DICTIONARY,
  BANNED_WORDS,
  DELETE_FROM_DICTIONARY,
  ENGLISH_PREFIXES,
  ENGLISH_SUFFIXES,
} from '../data';
import type { TempName } from './preprocessNZGB';

const englishDict: Record<string, 1> = JSON.parse(
  readFileSync(englishDictFile, 'utf8'),
);
for (const word of DELETE_FROM_DICTIONARY) {
  delete englishDict[word.toLowerCase()];
}
for (const word of ADD_TO_DICTIONARY) {
  englishDict[word.toLowerCase()] = 1;
}

const englishPrefixesRegExp = new RegExp(
  `^(${ENGLISH_PREFIXES.join('|')}) `,
  'i',
);
const englishSuffixesRegExp = new RegExp(
  ` (${ENGLISH_SUFFIXES.join('|')})$`,
  'i',
);
const bannedWordsRegExp = new RegExp(
  `(^| )(${BANNED_WORDS.join('|')})( |$)`,
  'i',
);

// te reo only has 15 letters, not 26, so this a simple first check
// eslint-disable-next-line unicorn/better-regex -- it's more clear written out like this
const anyNonTeReoLetters = /[^-ghkmnprtw aeiouāēīōū]/i;

export function removeEnglishPrefixesAndSuffixes(
  name: string,
): string | undefined {
  if (bannedWordsRegExp.test(name)) return undefined;

  const newName = name
    .replace(englishPrefixesRegExp, '')
    .replace(englishSuffixesRegExp, '')
    .replace(/\bPa\b/, 'Pā')
    .replace(/\bMaori\b/, 'Māori')
    .trim();

  if (newName !== name) {
    // if it changed, run the regex again until it doesn't change anymore
    return removeEnglishPrefixesAndSuffixes(newName);
  }

  // the newName didn't change in the last iteration, so we're done.
  // Now check if there are still any english words left. If yes, abort
  const anyEnglishWords = newName
    .split(' ')
    .some((word) => word.toLowerCase() in englishDict);
  if (anyEnglishWords) return undefined;

  return newName;
}

/** the higher the rank, the more likely we think it could be te reo māori */
function rankName(name: string | undefined) {
  if (!name) return -2; // definitely not
  if (anyNonTeReoLetters.test(name)) return -1; // very unlikely

  if (/[āēīōū]/i.test(name)) return 1; // very likely

  // TODO: we could do a lot more intelligent guesswork here

  return 0; // 0 is neutral
}

// splits "Aaaa (Bbbb)" into ["Aaaa", "Bbbb"]
const splitAtBraces = (str: string) =>
  str.match(/(.+) \((.+)\)/)?.slice(1, 3) || [str];

/**
 * This function will use some guesswork to determine if the name
 * is partially or fully in te reo (partially means something like
 * "Karaka Bay").
 *
 * Since this involves a bit of dodgy guess work, the results are
 * presented in a table for human review.
 *
 * The value in OSM is always prefered over this guess.
 *
 * The return value is what goes in the `name:mi` tag if the tag
 * doesn't already exist.
 */
export function maybeTeReoName(names: TempName[]): string | undefined {
  const teReoNames = names.filter((n) => n.teReo);
  if (!teReoNames.length) return undefined; // all names are enlish

  // if there are multiple official te reo names, merge them with a slash.
  // This is very rare and most likely there'll be an override for this entry.
  const mainTeReoName = teReoNames
    .map((x) => x.name)
    .flatMap(splitAtBraces)
    .flatMap((name) => name.split(' or '))
    .join(' / ');

  // now we need to guess which of the names is the te reo one vs the english one
  const rankedAndSorted = mainTeReoName
    .split('/')
    .map((name) => ({
      name: name.trim(),
      rank: rankName(removeEnglishPrefixesAndSuffixes(name.trim())),
    }))
    .sort((a, b) => b.rank - a.rank);

  return removeEnglishPrefixesAndSuffixes(rankedAndSorted[0].name);
}
