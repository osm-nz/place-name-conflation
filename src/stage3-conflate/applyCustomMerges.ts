/* eslint-disable no-param-reassign */
/* eslint-disable unicorn/prevent-abbreviations -- refs is a common OSM term */
import { distanceBetween } from '../core';
import { removeEnglishPrefixesAndSuffixes } from '../stage2-preprocess/maybeTeReoName';
import type { NZGBSourceData, OSMTempFile } from '../types';

/**
 * The NZGB has duplicate entries, so this function
 * will look at all the OSM features with semicolon-
 * delimited ref:linz:place_id tags and merge any
 * that were merged by an OSM mapper (rather than the
 * dual-name ones we merged automatically).
 *
 * If the names are the different, we will allow it, but
 * all the names must be listed in alt_name/old_name etc.
 * There are also various safeguards later in the process
 * to prevent anyone abusing this flexibility as a means
 * to remove te reo names without detection.
 * In the future we may require wikidata's P2959 before we
 * accept these custom merges.
 *
 * @returns nothing, the `nzgb` argument is mutated (to improve perf)
 */
export async function applyCustomMerges(
  nzgb: NZGBSourceData,
  osm: OSMTempFile,
) {
  let trivialMerges = 0;

  const unexpectedRefsWithSemiColons = new Set<string>();
  for (const category in osm) {
    for (const ref in osm[category].withRef) {
      if (ref.includes(';') && !nzgb[ref]) {
        unexpectedRefsWithSemiColons.add(ref);
      }
    }
  }

  /**
   * refs that the previous stage has already merged (usually dual names).
   *
   */
  const existingNzgbRefsWithSemiColons: Record<string, string> = {};
  for (const ref in nzgb) {
    if (ref.includes(';')) {
      for (const subRef of ref.split(';')) {
        existingNzgbRefsWithSemiColons[subRef] = ref;
      }
    }
  }

  for (const mergedRef of unexpectedRefsWithSemiColons) {
    const refs = mergedRef.split(';');
    const features = refs.map((ref) => nzgb[ref]);

    if (features.some((f) => !f)) {
      const expected = refs.filter((ref) => nzgb[ref]).join(';');
      if (expected) {
        console.error(`(!) Invalid refs: ${mergedRef} --> ${expected}`);
        // in this case, we suggest removing the refs that don't exist
        // anymore. Most likely cause is that the NZGB has noticed the
        // duplicates and deleted one of them.
      } else {
        // none of the refs exist. This is a bit bizare.
        const possibleOptions = new Set(
          refs.map((ref) => existingNzgbRefsWithSemiColons[ref] || ''),
        );
        possibleOptions.delete('');

        console.error(
          `(!) None of these refs exist: ${mergedRef}. Did you mean ${[...possibleOptions].join(' or ')}?`,
        );
      }
      continue;
    }

    // this check applies to all cases - the merged features
    // have to be reasonably close.
    const anyAreFarAway = features.some(
      (f) =>
        distanceBetween(features[0].lat, features[0].lng, f.lat, f.lng) >
        10_000,
    );
    if (anyAreFarAway) {
      // It's possible that the location used to be the same, but
      // then the NZGB fixed the location on one node. In which case
      // they should not be merged
      console.warn(`Refusing to merge ${refs} since they are too far apart`);
      continue;
    }

    // a common example is "Mt X" and "X Mountain" coëxisting, so we
    // strip out prefixes and suffixes per comparing names.
    const uniqueNames = new Set(
      features.map((f) => removeEnglishPrefixesAndSuffixes(f.name)),
    );

    if (uniqueNames.size === 1) {
      // all the merged features have the same name. This is the easy case

      // no futher checks at the moment.

      // We take everything from  the first ref in the list, merging only
      // a few selective props.
      nzgb[mergedRef] = {
        ...features[0],
        altNames: [...new Set(features.flatMap((f) => f.altNames || []))],
        oldNames: [...new Set(features.flatMap((f) => f.oldNames || []))],
        oldRefs: [...new Set(features.flatMap((f) => f.oldRefs || []))],
      };
      for (const ref of refs) delete nzgb[ref];
      trivialMerges++;
    } else {
      // some of the merged features have different names.

      // the "main" features is what we keep. This is the official name
      // if one of the names is official, otherwise it's the first ref
      const mainFeature = features.find((f) => f.official) || features[0];

      // reference equality is safe here
      const nonMainFeatures = features.filter((f) => f !== mainFeature);

      // non-main names are the names from all the non-main features.
      // these names have to go in alt_name
      const nonMainNames = nonMainFeatures
        .map((f) => f.name)
        .filter(
          (name) =>
            name !==
            mainFeature.name.normalize('NFD').replaceAll(/\p{Diacritic}/gu, ''),
        );

      console.log(
        `Accepting “${mainFeature.name}” over “${nonMainNames.join(' & ')}”`,
      );

      nzgb[mergedRef] = {
        ...mainFeature,
        altNames: [
          ...new Set([
            ...features.flatMap((f) => f.altNames || []),
            ...nonMainNames,
          ]),
        ],
        oldNames: [...new Set(features.flatMap((f) => f.oldNames || []))],
        oldRefs: [...new Set(features.flatMap((f) => f.oldRefs || []))],
      };
      for (const ref of refs) delete nzgb[ref];
    }
  }

  console.log(`Accepted ${trivialMerges} trivial merges`);
}
