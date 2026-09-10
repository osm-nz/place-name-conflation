import type { OsmFeatureType } from 'osm-api';
import type { OsmFeature } from '@osm-conflation-engine/cli';
import type { LifeCyclePrefix } from '../../conflate/compareFeatures/checkTagsFromFeaturePreset.js';
import { LIFECYCLE_PREFIXES } from '../../conflate/compareFeatures/checkTagsFromFeaturePreset.js';
import { REF } from '../constants.js';

export type StringifiedRegExp = `/${string}/`;

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
        // conflation related:
        | 'check_date:name'
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

export const ALL_KEYS: (OsmApi.Keys['keys'] | StringifiedRegExp)[] = [
  REF,
  'check_date:name',
  'name',
  'name:en',
  'name:mi',
  'name:etymology',
  'name:en:etymology',
  'name:mi:etymology',
  'name:etymology:wikidata',
  'name:etymology:wikidata',
  'name:en:etymology:wikidata',
  'name:mi:etymology:wikidata',
  'official_name',
  'alt_name',
  'alt_name:en',
  'alt_name:mi',
  'old_name',
  'not:name',
  // wikidata:
  'not:wikidata',
  'wikidata',
  'wikipedia',
  // lifecycle prefixes:
  `/^(${['not', ...LIFECYCLE_PREFIXES].join('|')}):/`,
  // presets:
  'seamark:type',
  'seamark:sea_area:category',
  'place',
  'boundary',
  'protection_title',
  'protection_title:wikidata',
  'protect_class',
  'natural',
  'landcover',
  'landuse',
  'leisure',
  'railway',
  'waterway',
  'water',
  'estuary',
  'ford',
  'ramsar',
  'man_made',
  'building',
  'type',
  'route',
  'historic',
  'junction',
  // changesets:
  'comment',
];

export type { OsmFeature as OSMFeature } from '@osm-conflation-engine/cli';

export type TransformedOsm = {
  [nzgbId: string]: OsmFeature;
};
