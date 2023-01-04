import { preprocessNZGB } from './preprocessNZGB';
import { preprocesOSM } from './preprocesOSM';

async function main() {
  await preprocessNZGB();
  await preprocesOSM();
  // geometry uses heaps of memory so it runs separately
}

main();
