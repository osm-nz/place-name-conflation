import { promises as fs } from 'node:fs';
import path from 'node:path';
import { USER_AGNET, wikidataRawPath } from '../core/constants.js';
import type { RawWikidata } from '../core/types/wikidata.def.js';

export async function fetchWikidata() {
  try {
    const cached: RawWikidata = JSON.parse(
      await fs.readFile(wikidataRawPath, 'utf8'),
    );
    console.log('🟢 Using cached Wikidata data');
    return cached;
  } catch {
    console.log('🔵 Fetching Wikidata data…');
  }

  const query = await fs.readFile(
    path.join(import.meta.dirname, './queries/wikidata.sparql'),
    'utf8',
  );

  const request = await fetch(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent': USER_AGNET,
      },
    },
  );
  const apiResponse = (await request.json()) as RawWikidata;

  await fs.writeFile(wikidataRawPath, JSON.stringify(apiResponse, null, 2));

  console.log('\tDone');
  return apiResponse;
}
