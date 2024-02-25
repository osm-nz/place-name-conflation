import type { FeatureCollection, Geometry } from 'geojson';
import type { Tags } from 'pbf2json';
import type { NameType } from './data';

export type Coord = [lng: number, lat: number];

export type NZGBCsv = {
  /** a different ID for each name of a place, the value of `ref:nz:place_id` */
  name_id: string;
  /**
   * this is different to the t50f_id from the geographic_names layer
   *
   * It allows us to group dual-named places together though (e.g. 116826=Takarunga / Mt Vic)
   * We need to pick the Official name, use other unoffical names for alt_name.
   * In rare cases there can be two offical names (e.g. mainland islands)
   */
  feat_id: string;
  name: string;
  status: `Official${string}` | `Unofficial${string}`;
  feat_type: NameType;
  nzgb_ref: string;
  land_district: string;
  // ... various datum and projection fields and WKT ..
  info_ref: string;
  info_origin: string;
  info_description: string;
  info_note?: string;
  feat_note?: string;
  maori_name: 'Yes' | 'No';
  cpa_legislation?: string;
  conservancy?: string;
  doc_cons_unit_no?: string;
  doc_gaz_ref?: string;
  treaty_legislation?: string;
  geom_type: 'POINT' | 'LINE' | 'POLYGON';
  accuracy?: string;
  /** Y or N means the feature is underwater, blank means it's on land */
  gebco?: 'Y' | 'N';
  region?: string;
  /** year */
  scufn?: string;
  /** the elevetation, @deprecated don't use, only 100 of 53,000 features have it, and the format is poor */
  height?: string;
  ant_pn_ref?: string;
  ant_pgaz_ref?: string;
  scar_id?: string;
  /** for american places in antarctica */
  scar_rec_by?: string;
  accuracy_rating?: string;
  /** less readable version of feat_type */
  desc_code: string;
  rev_gaz_ref?: string;
  rev_treaty_legislation?: string;

  crd_latitude: string;
  crd_longitude: string;
};

export type NZGBFeature = {
  lat: number;
  lng: number;
  type: NameType;
  name: string;
  nameMi?: string;
  official?: true;
  altNames?: string[];
  oldNames?: string[];
  oldRefs?: number[];
  isArea?: true;
  isUndersea?: true;
  etymology?: string;
  etymologyQId?: string;
  qId?: string;
  wikipedia?: string;
};
export type NZGBSourceData = {
  [placeId: string]: NZGBFeature;
};

export type OSMFeature = {
  osmId: string;
  lat: number;
  lng: number;
  tags: Tags;
};
export type OSMTempFile = {
  [topLevelTag: string]: {
    withRef: {
      [ref: string]: OSMFeature;
    };
    noRef: OSMFeature[];
  };
};

/** format of the `ref:linz:place_id` tag */
export type Ref =
  | `${number}`
  | `${number};${number}`
  | `${number};${number};${number}`
  | `${number};${number};${number};${number}`;

export type OsmPatchFile = FeatureCollection<Geometry, Tags> & {
  size: 'small' | 'medium' | 'large';
  instructions?: string;
  stats: {
    okayCount: number;
    editCount: number;
    addNodeCount: number;
    addWayCount: number;
    percentageAnt: number;
  };
};

export type StatsFile = Record<NameType, null | OsmPatchFile['stats']>;

export type GeometryTempFile = {
  [placeId: number]: {
    name: string;
    geom: Geometry;
  };
};

export type EtymologyReport = {
  stats: { okay: number; failed: number; skipped: number };
  list: [
    ref: number,
    name: string,
    result: string | undefined | 0xbad,
    originInfo: string,
  ][];
};

export type WikidataFile = {
  [nzgbRef: number]: {
    qId: string;
    etymologyQId?: string;
    etymology?: string;
    wikipedia?: string;
  };
};
