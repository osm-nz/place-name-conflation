import { join } from 'node:path';
import type { NameType } from '../data';

const repoRoot = join(__dirname, '../..');

export const coastlineFile = join(repoRoot, 'tmp/coastline.geo.json');
export const englishDictFile = join(repoRoot, 'tmp/englishDictionary.json');

export const mainlandPlanetFile = join(repoRoot, 'tmp/osm.pbf');

export const tempOsmFile = (type: NameType) =>
  join(repoRoot, `tmp/spam/osm-${type}.json`);

export const osmPathFilePath = (type: NameType) =>
  join(repoRoot, `out/zzz-${type}.osmPatch.geo.json`);

export const nzgbCsvPath = join(repoRoot, 'tmp/nzgb.csv');
export const nzgbJsonPath = join(repoRoot, 'tmp/nzgb.json');
export const nzgbIndexPath = join(repoRoot, 'out/index.json');
export const extraLayersFile = join(repoRoot, 'out/extra-layers.geo.json');
export const htmlReport = join(repoRoot, 'out/report.html');
