import { promises as fs } from 'node:fs';
import taginfo from '../../taginfo.json' assert { type: 'json' };
import { configRawPath } from '../core/constants.js';
import type { Config } from '../core/types/general.def.js';
import { parseJsonc } from '../core/jsonc.js';

const url = taginfo.project.project_url.replace(
  'github.com',
  'raw.githubusercontent.com/wiki',
);

export async function fetchConfig() {
  try {
    const config: Config = JSON.parse(await fs.readFile(configRawPath, 'utf8'));
    console.log('🟢 Using cached config data');
    return config;
  } catch {
    console.log('🔵 Fetching config data…');
  }

  const apiResponse: Config = await fetch(`${url}/Wiki.md`)
    .then((r) => r.text())
    .then((text) => text.split('```jsonc')[1]!.split('```')[0]!)
    .then(parseJsonc);

  await fs.writeFile(configRawPath, JSON.stringify(apiResponse, null, 2));
  console.log('\tDone');
  return apiResponse;
}
