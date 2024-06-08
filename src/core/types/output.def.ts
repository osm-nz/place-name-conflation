import type { OsmPatch } from 'osm-api';
import type { NZGB_NAME_TYPES, NameType } from '../data/presets.js';

export const enum WARNING {
  CUSTOM_MERGE,
  NON_REDIRECT_WIKIDATA_ERROR,
}

export type Warnings = Partial<Record<WARNING, string[]>>;
export type Stats = {
  addCount: number;
  editCount: number;
  okayCount: number;
};

export type Output = OsmPatch & {
  /** ISO Date */
  lastUpdated: string;
  stats: Partial<Record<NameType, Stats>>;
  /** we have one output file, which can contain child files */
  __hack__: {
    warnings: Warnings;
    presets: typeof NZGB_NAME_TYPES;
    childPatchFiles: {
      [subFile: string]: OsmPatch;
    };
  };
};
