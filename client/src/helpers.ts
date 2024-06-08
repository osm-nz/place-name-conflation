import type { OsmFeatureType } from 'osm-api';

export const FILE_EXTN = '.osmPatch.geo.json';

const TYPES: Record<string, OsmFeatureType> = {
  n: 'node',
  w: 'way',
  r: 'relation',
};

export const osmIdToLink = (osmId: string) => {
  return `https://openstreetmap.org/${TYPES[osmId[0]]}/${osmId.slice(1)}`;
};

export function download(fileName: string, fileContents: string) {
  const blob = new Blob([fileContents], { type: 'text/json' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = fileName;
  document.body.append(a);
  a.click();
  URL.revokeObjectURL(blobUrl);
}
