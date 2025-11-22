import type { OsmFeature, OsmFeatureType, Tags } from 'osm-api';
import type { LifeCyclePrefix } from '../../conflate/compareFeatures/checkTagsFromFeaturePreset.js';

export const OSM_TYPES: Record<string, OsmFeatureType> = {
  n: 'node',
  w: 'way',
  r: 'relation',
};

declare global {
  namespace OsmApi {
    interface Keys {
      keys:
        | 'ref:linz:place_id'
        // name related:
        | 'name'
        | 'name:en'
        | 'name:mi'
        | 'name:etymology'
        | 'name:en:etymology'
        | 'name:mi:etymology'
        | 'name:etymology:wikidata'
        | 'name:etymology:wikidata'
        | 'name:en:etymology:wikidata'
        | 'name:mi:etymology:wikidata'
        | 'official_name'
        | 'alt_name'
        | 'alt_name:en'
        | 'alt_name:mi'
        | 'old_name'
        | 'not:name'
        // wikidata:
        | 'not:wikidata'
        | 'wikidata'
        | 'wikipedia'
        // lifecycle prefixes:
        | `${LifeCyclePrefix}:${string}`
        // presets:
        | 'seamark:type'
        | 'seamark:sea_area:category'
        | 'place'
        | 'boundary'
        | 'protection_title'
        | 'protection_title:wikidata'
        | 'protect_class'
        | 'natural'
        | 'landcover'
        | 'landuse'
        | 'leisure'
        | 'railway'
        | 'waterway'
        | 'water'
        | 'estuary'
        | 'ford'
        | 'ramsar'
        | 'man_made'
        | 'building'
        | 'type'
        | 'route'
        | 'historic'
        | 'junction'
        // changesets:
        | 'comment';
    }
  }
}

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
