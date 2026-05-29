import { basename } from 'node:path';
import { statsOutputFile } from '../core/constants.js';
import packageJson from '../../package.json' with { type: 'json' };
import { type Output, type Stats, WARNING } from '../core/types/output.def.js';

export interface StatsFileRow {
  /** ISO Date */
  date: string;
  counts: Stats;
  warnings: Partial<Record<WARNING, number>>;
}

export interface StatsFile {
  /** ISO Date */
  lastUpdated: string;
  rows: StatsFileRow[];
}

export async function generateStats(result: Output) {
  const newRow: StatsFileRow = {
    date: new Date().toISOString(),
    counts: { addCount: 0, editCount: 0, okayCount: 0 },
    warnings: {
      [WARNING.CUSTOM_MERGE]:
        result.__hack__.warnings[WARNING.CUSTOM_MERGE]?.length || 0,
      [WARNING.NON_REDIRECT_WIKIDATA_ERROR]:
        result.__hack__.warnings[WARNING.NON_REDIRECT_WIKIDATA_ERROR]?.length ||
        0,
    },
  };
  for (const cat of Object.values(result.stats)) {
    newRow.counts.addCount += cat.addCount;
    newRow.counts.editCount += cat.editCount;
    newRow.counts.okayCount += cat.okayCount;
  }

  const existingStats = (await fetch(
    `${packageJson.homepage}/${basename(statsOutputFile)}`,
  ).then((r) => r.json())) as StatsFile;

  existingStats.lastUpdated = newRow.date;
  existingStats.rows.push(newRow);

  return existingStats;
}
