import type { OsmFeature, Tags } from 'osm-api';

type RawOsmFeature = OsmFeature & {
  center?: { lat: number; lon: number };
};

export type RawOsm = {
  elements: RawOsmFeature[];
};

// tags are always defined
export type OSMFeature = Omit<RawOsmFeature, 'tags'> & { tags: Tags };

export type TransformedOsm = {
  [nzgbId: string]: OSMFeature;
};
