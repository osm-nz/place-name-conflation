import type { OsmPatch } from 'osm-api';
import { CHANGESET_TAGS, USER_AGNET } from '../core/constants.js';
import { WARNING, type Warnings } from '../core/types/output.def.js';
import { wikidataErrors } from './compareFeatures/compareFeatures.js';

type WikidataApiResponse = {
  [qId: string]: {
    id: string;
    redirects?: { from: string; to: string };
  };
};

export async function checkWikidataRedirects(
  warnings: Warnings,
): Promise<OsmPatch> {
  console.log(
    `🔵 Checking ${wikidataErrors.length} invalid wikidata tags for redirects…`,
  );

  const byOldQId = Object.fromEntries(
    wikidataErrors.map((error) => [error.actual, error]),
  );

  const result: WikidataApiResponse = {};
  const qIdsToFetch = Object.keys(byOldQId);

  const chunkSize = 49;
  for (let index = 0; index < qIdsToFetch.length; index += chunkSize) {
    const chunk = qIdsToFetch.slice(index, index + chunkSize);
    const chunkResult = (await fetch(
      `https://wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${chunk.join('|')}`,
      { headers: { 'User-Agent': USER_AGNET } },
    ).then((r) => r.json())) as { entities: WikidataApiResponse };

    Object.assign(result, chunkResult.entities);
  }

  const redirects = Object.values(result)
    .filter((entity) => entity.redirects)
    .map((entity) => [entity.redirects!.from, entity.redirects!.to]);

  const nonRedirectIssues = Object.values(result).filter(
    (entity) => !entity.redirects,
  );
  for (const entity of nonRedirectIssues) {
    const error = byOldQId[entity.id]!;
    warnings[WARNING.NON_REDIRECT_WIKIDATA_ERROR] ||= [];
    warnings[WARNING.NON_REDIRECT_WIKIDATA_ERROR].push(
      `Expected ${error.expected} on ${error.osmId}`,
    );
  }

  const patchFile: OsmPatch = {
    type: 'FeatureCollection',
    features: redirects.map(([from, to]) => {
      const error = byOldQId[from!]!;
      return {
        type: 'Feature',
        id: error.osmId,
        geometry: {
          type: 'Point',
          coordinates: [error.lng, error.lat],
        },
        properties: {
          __action: 'edit',
          wikidata: to!,
        },
      };
    }),
    size: 'large',
    changesetTags: {
      ...CHANGESET_TAGS,
      comment: 'update wikidata tags which point to redirect pages',
    },
  };

  return patchFile;
}
