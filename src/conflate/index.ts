import type {
  OsmFeature,
  SingleFeatureConflationResult,
} from '@osm-conflation-engine/cli';
import type { TransformedWikidata } from '../core/types/wikidata.def.js';
import type { NZGBFeatureGeoJson } from '../core/types/nzgb.def.js';
import { REF } from '../core/constants.js';
import { NZGB_NAME_TYPES, __SKIP } from '../core/data/presets.js';
import { deleteUndefined } from '../core/helpers.js';
import type { Config } from '../core/types/general.def.js';
import { compareFeatures } from './compareFeatures/compareFeatures.js';
import { getPresetTags } from './getPresetTags.js';
import { findBestWikidata } from './findBestWikidata.js';

export function conflateItem({
  nzgbItem: _nzgbItem,
  osmItem,
  wikidata,
  config,
}: {
  nzgbItem: NZGBFeatureGeoJson;
  osmItem: OsmFeature | undefined;
  wikidata: TransformedWikidata;
  config: Config;
}): SingleFeatureConflationResult | undefined {
  const nzgbItem = _nzgbItem.properties;
  const { ref } = nzgbItem;

  // "Discontinued" don't exist or completely irrelevant
  if (nzgbItem.discontinued) return undefined;

  // skipAntarctica for some layers
  const isInAntarctica = nzgbItem.lat < -60;
  const layerConfig = NZGB_NAME_TYPES[nzgbItem.type];
  if (
    layerConfig === __SKIP ||
    (layerConfig?.skipAntarctica && isInAntarctica)
  ) {
    return undefined;
  }

  const allRefs = [...ref.split(';'), ...(nzgbItem.oldRefs || [])];
  if (allRefs.some((subRef) => subRef in config.ignore)) return undefined;

  const wikidataItems = ref
    .split(';')
    .flatMap((subRef) => wikidata[+subRef] || []);

  const bestWikidata = findBestWikidata(ref, nzgbItem, wikidataItems);

  if (osmItem) {
    // there is already a OSM feature with the ref:linz:place_id tag
    const patch = compareFeatures(ref, nzgbItem, osmItem, bestWikidata, config);
    if (!patch) return undefined;
    return {
      diff: {
        tags: patch.properties,
        geometry:
          patch.properties.__action === 'move' ? patch.geometry : undefined,
      },
    };
  }

  // we couldn't find a match in OSM
  return {
    diff: {
      tags: deleteUndefined({
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
    },
  };
}
