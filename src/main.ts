import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  type Config,
  type MutliFeatureConflationResult,
  type OsmFeature,
  run,
  writeJsonL,
} from '@osm-conflation-engine/cli';
import type { Point } from 'geojson';
import {
  CHANGESET_TAGS,
  REF,
  taginfoOutputFile,
  tempFolder,
} from './core/constants.js';
import { fetchNzgb } from './api/nzgb.js';
import { fetchWikidata } from './api/wikidata.js';
import { transformWikidata } from './transformer/wikidata.js';
import { transformNzgb } from './transformer/nzgb.js';
import { fetchConfig } from './api/config.js';
import { generateTaginfoFile } from './build/taginfo.js';
import { ALL_KEYS } from './core/types/osm.def.js';
import type { NZGBFeature } from './core/types/nzgb.def.js';
import { checkWikidataRedirects } from './conflate/checkWikidataRedirects.js';
import { conflateItem } from './conflate/index.js';
import { applyCustomMerges } from './conflate/applyCustomMerges.js';

const SOURCE_FILE = join(import.meta.dirname, '../tmp/nzgb-merged.jsonl');

const conflationConfig: Config = {
  $schema:
    'https://unpkg.com/@osm-conflation-engine/cli/dist/config.schema.json',
  metadata: {
    region: 'NZ',
    name: 'NZGB Place Names',
    description:
      'Names of localities and natural features from the New Zealand Geographic Board (Ngā Pou Taunaha o Aotearoa) Gazetteer',
    git_repository: 'https://github.com/osm-nz/place-name-conflation',
    wiki_page: 'https://wiki.osm.org/Import/New_Zealand_Place_Names',
  },
  source_data: {
    type: 'file',
    file: SOURCE_FILE,
  },
  o_data: {
    source: {
      type: 'overpass',
      // overpass_query_file is not specified, so it'll default to downloading everything with ref:doc
      overpass_server_url:
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    },
    tags_to_keep: ALL_KEYS,
    check_date_key: 'check_date:name',
  },
  merge: {
    osm_key: REF,
    dataset_column: 'ref',
  },
};

async function main() {
  await fs.mkdir(tempFolder, { recursive: true });

  const rawNzgb = await fetchNzgb();
  const rawWikidata = await fetchWikidata();
  const config = await fetchConfig();

  const nzgb = await transformNzgb(rawNzgb, config);
  const wikidata = transformWikidata(rawWikidata);

  await writeJsonL(SOURCE_FILE, nzgb);
  await run<Point, NZGBFeature>(
    conflationConfig,
    {
      // this is not really used, it's a low-volume import; mappers
      // can manually fix each case
      getLocalKeyForOsm: (osm) => osm.tags?.name || '',
      getLocalKeyForSource: (row) => row.properties.name || '',

      create({ source }) {
        const selection = undefined as undefined | OsmFeature; // TODO: consider osmCandidates

        const result = conflateItem({
          config,
          nzgbItem: source,
          osmItem: selection,
          wikidata,
        });
        if (!result) return undefined;
        return { ...result, selection: selection?.id };
      },
      mergeOneToOne({ source, osm }) {
        return conflateItem({
          config,
          nzgbItem: source,
          osmItem: osm,
          wikidata,
        });
      },
      mergeOneToMany({ source, osm }) {
        // one to many: every OSM feature must be correct
        const result: MutliFeatureConflationResult = { diffPerFeature: {} };
        for (const f of osm) {
          const singleResult = conflateItem({
            config,
            nzgbItem: source,
            osmItem: f,
            wikidata,
          });
          if (singleResult?.diff) {
            result.diffPerFeature[f.id] = singleResult.diff;
          }
        }
        return result;
      },
      mergeManyToMany({ osm, source }) {
        console.warn(
          `temporarily ignoring a many:many merge (${osm.map((o) => o.id).join(',')} : ${source.map((s) => s.id).join(',')})`,
        );
        // this would involve:
        // 1. merging the source features into a single fake feature (like above)
        // 2. conflating each osm feature, expecting them to all be duplicates?
        return undefined;
      },

      deleteFeature() {
        // if the NZGB removes a feature from their dataset, we'll
        // never suggest deleting the OSM feature obviously.
        // Instead, we'll just remove the ref:* and add a fix-me tag.
        const note = `This feature's ${REF} tag value was deleted by the NZGB. Check what the new value is`;
        return {
          // eslint-disable-next-line no-useless-concat -- to hide the literal word from ⌘⇧F
          diff: { tags: { [REF]: '🗑️', ['fix' + 'me']: note } },
        };
      },

      mergeManyToOne({ source, osm }) {
        // many to one: we merge the multiple NZGB features into a single fake feature
        const { merged, warnings } = applyCustomMerges(source, osm);
        if (!merged) return { diff: undefined, extra: { warnings } };
        const result = conflateItem({
          config,
          nzgbItem: merged,
          osmItem: osm,
          wikidata,
        });
        if (result) {
          result.extra ||= {};
          result.extra.warnings ||= [];
          result.extra.warnings.push(...warnings);
        }
        return result;
      },

      isImportUser(username) {
        return username?.endsWith('_import') || username?.endsWith('_linz');
      },

      getChangesetTags: () => ({ changesetTags: CHANGESET_TAGS }),

      async addCustomLayers() {
        return {
          'Wikidata Redirects': { '': await checkWikidataRedirects() },
        };
      },
    },
    { use_cache: true },
  );

  const taginfo = generateTaginfoFile();

  await fs.mkdir(dirname(taginfoOutputFile), { recursive: true });
  await fs.writeFile(taginfoOutputFile, JSON.stringify(taginfo, null, 2));
}

await main();
