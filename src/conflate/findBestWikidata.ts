/* eslint-disable unicorn/prevent-abbreviations -- refs is a common OSM term */
import type { NZGBFeature } from '../core/types/nzgb.def.js';
import type { WikidataItem } from '../core/types/wikidata.def.js';

/**
 * Wikidata can be quite a mess:
 *
 * 1. An NZGB ref could be linked to multiple QIds. This should never
 *    happen, but due to the cebwiki garbage, there are thousands of
 *    cases like this pending cleanup.
 *
 * 2. An OSM feature can refer to multiple NZGB entries, in situations
 *    where the NZGB has duplicates, or when there are dual names with
 *    equal validity. In these cases, wikidata might erroneously have
 *    two items, even though it's the same geographic feature.
 *
 * Therefore, we need some process to find the best wikidata item when
 * there are multiple options. Also, we have to handle multiple
 * conflicting etymologies.
 */
export function findBestWikidata(
  ref: string,
  nzgbItem: NZGBFeature,
  wikidataItems: WikidataItem[],
) {
  /** lowest first */
  const sortedItems = wikidataItems.sort(
    (a, b) => +a.qId.slice(1) - +b.qId.slice(1),
  );

  const refs = ref.split(';').map(Number);
  const primaryRef = refs[0]!;

  // simple case: there is a single wikidata for the main ref
  const itemsForPrimaryRef = sortedItems.filter(
    (q) => q.nzgbRef === primaryRef,
  );

  // if there are multiple wikidata items for the primary ref,
  // find the lowest qId, since that will most likely be the
  // survivor when these duplicates are eventually merged.
  if (itemsForPrimaryRef.length) {
    return itemsForPrimaryRef[0];
  }

  // if we get to here, then there are no wikidata items for the primary ref
  // So, see if we can find a wikidata item for any of the non-primary refs
  return wikidataItems.find((item) => refs.includes(item.nzgbRef));
}
