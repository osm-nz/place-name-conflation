import { promises as fs } from 'node:fs';
import { wikidataFile } from '../core';
import { WikidataFile } from '../types';

type WikidataAPI = {
  results: {
    bindings: {
      qid: { type: 'uri'; value: string };
      ref: { type: 'literal'; value: string };
    }[];
  };
};

const QUERY = 'SELECT ?qid ?ref WHERE { ?qid wdt:P5104 ?ref. }';

export async function fetchWikidata(): Promise<WikidataFile> {
  try {
    const out: WikidataFile = JSON.parse(
      await fs.readFile(wikidataFile, 'utf8'),
    );
    console.log('Using cached wikidata file');
    return out;
  } catch {
    console.log('Fetching from wikidata...');

    const req = await fetch(
      `https://query.wikidata.org/sparql?query=${encodeURIComponent(QUERY)}`,
      { headers: { Accept: 'application/sparql-results+json' } },
    );
    const apiResp: WikidataAPI = await req.json();

    const out: WikidataFile = {};
    for (const item of apiResp.results.bindings) {
      const qid = item.qid.value.split('/entity/')[1];
      const ref = +item.ref.value;
      out[ref] = qid;
    }
    await fs.writeFile(wikidataFile, JSON.stringify(out));
    console.log('Wikidata done.');
    return out;
  }
}
