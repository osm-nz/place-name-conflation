import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BlobServiceClient } from '@azure/storage-blob';
import type { Output } from '../core/types/output.def.js';
import { outputFile } from '../core/constants.js';

const { AZ_CON, CI } = process.env;

export async function upload(result: Output) {
  await fs.writeFile(outputFile, JSON.stringify(result, null, 2));

  if (!CI) {
    console.log('🟢 Not uploading results.');
    return;
  }

  console.log('🔵 Uploading...');
  if (!AZ_CON) {
    throw new Error(
      'You need to create a file called ".env.local" in the root of the repository, and add the AZ_CON="..." variable',
    );
  }

  const az = BlobServiceClient.fromConnectionString(AZ_CON);
  const azContainer = az.getContainerClient('$web');

  const fileClient = azContainer.getBlockBlobClient(path.basename(outputFile));
  await fileClient.uploadFile(outputFile);
  await fileClient.setHTTPHeaders({
    blobContentType: 'application/json',
  });

  console.log('\tDone');
}
