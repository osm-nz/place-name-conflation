import { join } from 'node:path';
import type { NameType } from '../data';

export const USER_AGNET =
  'An OpenStreetMap New Zealand project, contact https://github.com/osm-nz';

const repoRoot = join(__dirname, '../..');

export const englishDictFile = join(repoRoot, 'tmp/englishDictionary.json');

export const planetFileWest = join(repoRoot, 'tmp/osm-west.pbf');
export const planetFileEast = join(repoRoot, 'tmp/osm-east.pbf');
export const tempOsmFile = join(repoRoot, 'tmp/osm.json');
export const southPoleFile = join(repoRoot, 'tmp/southPole.json');

export const osmPathFilePath = (type: NameType) =>
  join(repoRoot, `out/spam/${type}.osmPatch.geo.json`);

export const nzgbCsvPath = join(repoRoot, 'tmp/nzgb.csv');
export const nzgbCsvAreasPath = join(repoRoot, 'tmp/nzgb-areas.csv');
export const nzgbCsvLinesPath = join(repoRoot, 'tmp/nzgb-lines.csv');
export const nzgbJsonPath = join(repoRoot, 'tmp/nzgb.json');
export const nzgbJsonGeometryPath = join(repoRoot, 'tmp/nzgb-geom.json');
export const etymologyReportPath = join(repoRoot, 'tmp/etymology.csv');
export const wikidataFile = join(repoRoot, 'tmp/wikidata.json');

export const nzgbIndexPath = join(repoRoot, 'out/index.json');
export const extraLayersFile = join(repoRoot, 'out/extra-layers.geo.json');
export const htmlReport = join(repoRoot, 'out/report.html');
