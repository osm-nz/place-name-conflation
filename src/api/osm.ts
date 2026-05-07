import { promises as fs } from 'node:fs';
import path from 'node:path';
import taginfo from '../../taginfo.template.json' with { type: 'json' };
import { osmRawPath } from '../core/constants.js';
import type { RawOsm } from '../core/types/osm.def.js';

export async function fetchOsm() {
  try {
    const cached: RawOsm = JSON.parse(await fs.readFile(osmRawPath, 'utf8'));
    console.log('🟢 Using cached OSM data');
    return cached;
  } catch {
    console.log('🔵 Fetching OSM data…');
  }

  const query = await fs.readFile(
    path.join(import.meta.dirname, './queries/osm.overpassql'),
    'utf8',
  );

  const request = await fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
    { headers: { 'User-Agent': taginfo.project.project_url } },
  );
  if (request.status !== 200) {
    throw new Error(`HTTP ${request.status}: ${request.statusText}`);
  }
  const apiResponse = (await request.json()) as RawOsm;

  await fs.writeFile(osmRawPath, JSON.stringify(apiResponse, null, 2));

  console.log('\tDone');
  return apiResponse;
}
