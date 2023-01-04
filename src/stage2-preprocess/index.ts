import { preprocessNZGB } from './preprocessNZGB';
import { preprocesOSM } from './preprocesOSM';

async function main() {
  await preprocessNZGB();
  await preprocesOSM();
}

main();
