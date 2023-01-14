import { promises as fs } from 'node:fs';
import { wikidataFile } from '../core';
import { WikidataFile } from '../types';

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

const QUERY = `
  SELECT ?qid ?etymology ?etymologyLabel ?ref ?wikipedia WHERE {
    ?qid wdt:P5104 ?ref.
    OPTIONAL { ?qid wdt:P138 ?etymology }
    SERVICE wikibase:label {
      bd:serviceParam wikibase:language "en,mi,fr,es,de"
    }
    OPTIONAL {
      ?wikipedia schema:about ?qid .
      ?wikipedia schema:inLanguage "en" .
      FILTER (SUBSTR(str(?wikipedia), 1, 25) = "https://en.wikipedia.org/")
    }
  }
`;

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
      const qId = item.qid.value.split('/entity/')[1];
      const wikipedia = item.wikipedia?.value
        ? decodeURIComponent(
            `en:${item.wikipedia.value.split('/wiki/')[1].replace(/_/g, ' ')}`,
          )
        : undefined;
      const etymologyQId = item.etymology?.value.split('/entity/')[1];
      const etymology = item.etymologyLabel?.value;
      const ref = +item.ref.value;
      out[ref] = { qId, etymologyQId, etymology, wikipedia };
    }
    await fs.writeFile(wikidataFile, JSON.stringify(out));
    console.log('Wikidata done.');
    return out;
  }
}
