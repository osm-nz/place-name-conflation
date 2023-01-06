import { preprocessNZGB } from './preprocessNZGB';
import { preprocesOSM } from './preprocesOSM';
import { fetchWikidata } from './fetchWikidata';

async function main() {
  const wikidataMap = await fetchWikidata();
  await preprocessNZGB(wikidataMap);
  await preprocesOSM();
  // geometry uses heaps of memory so it runs separately
}

main();
