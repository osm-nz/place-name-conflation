import { createWriteStream, promises as fs } from 'node:fs';
import { Readable } from 'node:stream';
import { nzgbRawPath } from '../core/constants.js';

export async function fetchNzgb() {
  try {
    await fs.access(nzgbRawPath);
    console.log('🟢 Using cached NZGB data');
    return 0;
  } catch {
    console.log('🔵 Fetching NZGB data…');
  }

  const request = await fetch('https://gazetteer.linz.govt.nz/gaz.csv');

  Readable.fromWeb(request.body!).pipe(createWriteStream(nzgbRawPath));

  console.log('\tDone');
  return 0;
}
