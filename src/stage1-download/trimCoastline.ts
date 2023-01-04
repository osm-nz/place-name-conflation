import { promises as fs } from 'node:fs';
import { coastlineFile } from '../core';
import type { CoastlineFile } from '../types';

// we don't need a 23MB file for the whole world, so only keep these countries.
const KEEP = { NZ: true, AQ: true };

async function main() {
  console.log('Trimming coastline file...');

  let geojson: CoastlineFile = JSON.parse(
    await fs.readFile(coastlineFile, 'utf8'),
  );
  geojson.features = geojson.features.filter(
    (f) => f.properties.ISO_A2 in KEEP,
  );

  // spread so that this property ends up at the top of the file
  geojson = { processed: true, ...geojson };
  await fs.writeFile(coastlineFile, JSON.stringify(geojson));
}
main();
