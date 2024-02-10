import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { wikidataFile } from '../core';
import type { WikidataFile } from '../types';

type WikidataAPI = {
  results: {
    bindings: {
      qid: { type: 'uri'; value: string };
      etymology?: { type: 'uri'; value: string };
      etymologyLabel?: { type: 'literal'; value: string };
      wikipedia?: { type: 'uri'; value: string };
      ref: { type: 'literal'; value: string };
    }[];
  };
};

export async function fetchWikidata(): Promise<WikidataFile> {
  try {
    const out: WikidataFile = JSON.parse(
      await fs.readFile(wikidataFile, 'utf8'),
    );
    console.log('Using cached wikidata file');
    return out;
  } catch {
    console.log('Fetching from wikidata...');

    const QUERY = await fs.readFile(
      join(__dirname, './fetchWikidata.sparql'),
      'utf8',
    );

    const request = await fetch(
      `https://query.wikidata.org/sparql?query=${encodeURIComponent(QUERY)}`,
      { headers: { Accept: 'application/sparql-results+json' } },
    );
    const apiResp: WikidataAPI = await request.json();

    const out: WikidataFile = {};
    const duplicateItems: Record<number, true> = {};
    const duplicateEtymologies: Record<number, true> = {};

    for (const item of apiResp.results.bindings) {
      const qId = item.qid.value.split('/entity/')[1];
      const wikipedia = item.wikipedia?.value
        ? decodeURIComponent(
            `en:${item.wikipedia.value
              .split('/wiki/')[1]
              .replaceAll('_', ' ')}`,
          )
        : undefined;
      const etymologyQId = item.etymology?.value.split('/entity/')[1];
      const etymology = item.etymologyLabel?.value;
      const ref = +item.ref.value;
      if (out[ref]) {
        // duplicate row - something is wrong in wikipedia, or the field has multiple etymologies

        const diff: Record<string, [string | undefined, string | undefined]> = {
          ety: [etymology, out[ref].etymology],
          qId: [qId, out[ref].qId],
          wiki: [wikipedia, out[ref].wikipedia],
        };
        for (const key in diff) {
          if (diff[key][0] === diff[key][1]) delete diff[key];
        }

        if (Object.keys(diff).join('|') === 'ety') {
          // the only different is the etymology tag. This means it's actually the same item,
          // but there are multiple etymologies. In this case, we won't suggest adding name:etymology
          // because the situation is probably too complex to model in OSM tags.
          duplicateEtymologies[ref] = true;
        } else {
          console.warn(
            '(!) Two wikidata items have duplicate attributes',
            ref,
            '\n\t',
            Object.values(diff)
              .map(([a, b]) => `${a} vs ${b}`)
              .join(' AND '),
          );
          duplicateItems[ref] = true;
        }
      }
      out[ref] = { qId, etymologyQId, etymology, wikipedia };
    }

    for (const ref in duplicateEtymologies) {
      delete out[ref].etymology;
      delete out[ref].etymologyQId;
    }

    // need to address the issues, until then the wikidata item is skipped
    for (const ref in duplicateItems) delete out[ref];

    await fs.writeFile(wikidataFile, JSON.stringify(out));
    console.log('Wikidata done.');
    return out;
  }
}
