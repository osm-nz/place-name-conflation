import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { outputFile, tempFolder } from './core/constants.js';
import { fetchNzgb } from './api/nzgb.js';
import { fetchOsm } from './api/osm.js';
import { fetchWikidata } from './api/wikidata.js';
import { transformWikidata } from './transformer/wikidata.js';
import { transformOsm } from './transformer/osm.js';
import { transformNzgb } from './transformer/nzgb.js';
import { conflate } from './conflate/index.js';
import { fetchConfig } from './api/config.js';

async function main() {
  await fs.mkdir(tempFolder, { recursive: true });

  const rawNzgb = await fetchNzgb();
  const rawOsm = await fetchOsm();
  const rawWikidata = await fetchWikidata();
  const config = await fetchConfig();

  const nzgb = await transformNzgb(rawNzgb, config);
  const osm = transformOsm(rawOsm);
  const wikidata = transformWikidata(rawWikidata);

  const result = await conflate({ nzgb, osm, wikidata, config });

  await fs.mkdir(dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
}

await main();
