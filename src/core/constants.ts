import path from 'node:path';

export const USER_AGNET =
  'An OpenStreetMap New Zealand project, contact https://github.com/osm-nz';

export const REF = 'ref:linz:place_id';

export const CHANGESET_TAGS = {
  attribution: 'https://wiki.openstreetmap.org/wiki/Contributors#LINZ',
  created_by: 'LINZ Data Import 2.0.0',
  locale: 'en-NZ',
  source: 'https://wiki.osm.org/LINZ',
};

export const tempFolder = path.join(import.meta.dirname, '../../tmp');

export const nzgbRawPath = path.join(tempFolder, 'raw-nzgb.csv');
export const osmRawPath = path.join(tempFolder, 'raw-osm.json');
export const wikidataRawPath = path.join(tempFolder, 'raw-wikidata.json');
export const configRawPath = path.join(tempFolder, 'raw-config.json');

export const outputFile = path.join(
  tempFolder,
  '../client/public/place-names.osmPatch.geo.json',
);

export const taginfoOutputFile = path.join(
  tempFolder,
  '../client/public/taginfo.generated.json',
);
