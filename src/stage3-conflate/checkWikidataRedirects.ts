import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { USER_AGNET, createDiamond, osmIdToLink } from '../core';
import type { OsmPatchFile } from '../types';
import { wikidataErrors } from './compareFeatures/compareFeatures';

const outputFilePath = join(
  __dirname,
  '../../out/wikidata-redirects.osmPatch.geo.json',
);

type WikidataApiResponse = {
  [qId: string]: {
    id: string;
    redirects?: { from: string; to: string };
  };
};

export async function checkWikidataRedirects(): Promise<OsmPatchFile> {
  console.log(
    `Checking ${wikidataErrors.length} invalid wikidata tags for redirects…`,
  );

  const byOldQId = Object.fromEntries(
    wikidataErrors.map((error) => [error.actual, error]),
  );

  const result: WikidataApiResponse = {};
  const qIdsToFetch = Object.keys(byOldQId);

  const chunkSize = 49;
  for (let index = 0; index < qIdsToFetch.length; index += chunkSize) {
    const chunk = qIdsToFetch.slice(index, index + chunkSize);
    const chunkResult: { entities: WikidataApiResponse } = await fetch(
      `https://wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${chunk.join('|')}`,
      { headers: { 'User-Agent': USER_AGNET } },
    ).then((r) => r.json());

    Object.assign(result, chunkResult.entities);
  }

  const redirects = Object.values(result)
    .filter((entity) => entity.redirects)
    .map((entity) => [entity.redirects!.from, entity.redirects!.to]);

  const nonRedirectIssues = Object.values(result).filter(
    (entity) => !entity.redirects,
  );
  for (const entity of nonRedirectIssues) {
    const error = byOldQId[entity.id];
    console.error(
      `(!) Expected ${error.expected} on ${osmIdToLink(error.osmId)}`,
    );
  }

  const patchFile: OsmPatchFile = {
    type: 'FeatureCollection',
    features: redirects.map(([from, to]) => {
      const error = byOldQId[from];
      return {
        type: 'Feature',
        id: error.osmId,
        geometry: createDiamond(error.lat, error.lng),
        properties: {
          __action: 'edit',
          wikidata: to,
        },
      };
    }),
    size: 'large',
    stats: {} as never,
    changesetTags: {
      comment: 'update wikidata tags which point to redirect pages',
    },
  };

  await fs.writeFile(outputFilePath, JSON.stringify(patchFile, null, 2));

  return patchFile;
}
