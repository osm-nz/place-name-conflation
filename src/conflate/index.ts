import type { OsmPatchFeature } from 'osm-api';
import type { OSMFeature, TransformedOsm } from '../core/types/osm.def.js';
import type {
  TransformedWikidata,
  WikidataItem,
} from '../core/types/wikidata.def.js';
import type { NZGBFeature, TransformedNzgb } from '../core/types/nzgb.def.js';
import {
  type Output,
  WARNING,
  type Warnings,
} from '../core/types/output.def.js';
import { CHANGESET_TAGS, REF } from '../core/constants.js';
import { deleteUndefined } from '../core/helpers.js';
import { NZGB_NAME_TYPES, __SKIP } from '../core/data/presets.js';
import type { Config } from '../core/types/general.def.js';
import { compareFeatures } from './compareFeatures/compareFeatures.js';
import { getPresetTags } from './getPresetTags.js';
import { checkWikidataRedirects } from './checkWikidataRedirects.js';
import { applyCustomMerges } from './applyCustomMerges.js';
import { findBestWikidata } from './findBestWikidata.js';

const createStats = () => ({
  addCount: 0,
  editCount: 0,
  okayCount: 0,
});

function conflateItem({
  ref,
  nzgbItem,
  osmItem,
  wikidataItems,
  config,
}: {
  ref: string;
  nzgbItem: NZGBFeature;
  osmItem: OSMFeature | undefined;
  wikidataItems: WikidataItem[];
  config: Config;
}): {
  verdict: 'add' | 'edit' | 'okay';
  patch: OsmPatchFeature | undefined;
} {
  const bestWikidata = findBestWikidata(ref, nzgbItem, wikidataItems);

  if (osmItem) {
    // there is already a OSM feature with the ref:linz:place_id tag
    const patch = compareFeatures(ref, nzgbItem, osmItem, bestWikidata, config);
    return { verdict: patch ? 'edit' : 'okay', patch };
  }

  // we couldn't find a match in OSM
  return {
    verdict: 'add',
    patch: {
      type: 'Feature',
      id: ref,
      geometry: {
        type: 'Point',
        coordinates: [nzgbItem.lng, nzgbItem.lat],
      },
      properties: deleteUndefined({
        ...getPresetTags(nzgbItem).all,

        name: nzgbItem.name,
        alt_name: nzgbItem.altNames?.join(';') || undefined,
        old_name: nzgbItem.oldNames?.join(';') || undefined,
        [REF]: ref,

        wikidata: bestWikidata?.qId,
        wikipedia: bestWikidata?.wikipedia,
        'name:etymology': bestWikidata?.etymology,
        'name:etymology:wikidata': bestWikidata?.etymologyQId,
      }),
      // @ts-expect-error -- extra properties to aid debugging
      __hack__: { layer: nzgbItem.type, ref },
    },
  };
}

export async function conflate({
  nzgb,
  osm,
  wikidata,
  config,
}: {
  nzgb: TransformedNzgb;
  osm: TransformedOsm;
  wikidata: TransformedWikidata;
  config: Config;
}) {
  const mergeResult = applyCustomMerges(nzgb, osm);

  const warnings: Warnings = {
    [WARNING.CUSTOM_MERGE]: mergeResult.warnings,
  };

  const output: Output = {
    type: 'FeatureCollection',
    lastUpdated: new Date().toISOString(),
    changesetTags: {
      ...CHANGESET_TAGS,
      comment: 'Add/update features based on the NZGB Gazetteer',
    },
    stats: {},
    features: [],
    __hack__: {
      warnings,
      presets: NZGB_NAME_TYPES,
      childPatchFiles: {},
    },
  };

  for (const [ref, nzgbItem] of Object.entries(nzgb)) {
    const isInAntarctica = nzgbItem.lat < -60;

    const layerConfig = NZGB_NAME_TYPES[nzgbItem.type];
    if (
      layerConfig === __SKIP ||
      (layerConfig?.skipAntarctica && isInAntarctica)
    ) {
      continue;
    }

    let osmItem = osm[ref];
    const wikidataItems = ref
      .split(';')
      .flatMap((subRef) => wikidata[+subRef] || []);

    // we can't immediately find the place, try lookup the other categories
    // and check for possible invalid/out of date resf
    if (!osmItem) {
      // check all the oldRefs and split the current ref to check if
      // it's mapped with part of the ref.
      const potentialIds = [...ref.split(';'), ...(nzgbItem.oldRefs || [])];

      for (const potentialRef of potentialIds) {
        osmItem ||= osm[potentialRef];
      }
    }

    const result = conflateItem({
      ref,
      nzgbItem,
      osmItem,
      wikidataItems,
      config,
    });

    output.stats[nzgbItem.type] ||= createStats();
    output.stats[nzgbItem.type]![`${result.verdict}Count`]++;

    if (result.patch) {
      output.features.push(result.patch);
    }
  }

  output.__hack__.childPatchFiles['Wikidata Redirects'] =
    await checkWikidataRedirects(warnings);

  return output;
}
