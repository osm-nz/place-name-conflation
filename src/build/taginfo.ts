import type { Tags } from 'osm-api';
import taginfoTemplate from '../../taginfo.template.json' with { type: 'json' };
import {
  NZGB_NAME_TYPES,
  type NameType,
  __SKIP,
} from '../core/data/presets.js';

// using this locale to get the oxford comma
const andFormatter = new Intl.ListFormat('en-419', { type: 'conjunction' });

export function generateTaginfoFile() {
  const output = structuredClone(taginfoTemplate);

  const tagToFeature: { [kv: string]: Set<NameType> } = {};

  for (const _type in NZGB_NAME_TYPES) {
    const type = <NameType>_type;
    const item = NZGB_NAME_TYPES[type]!;

    if (item === __SKIP) continue;

    const allTags: Tags[] = [];
    if (item.acceptTags) allTags.push(...item.acceptTags);
    if ('tags' in item) allTags.push(item.tags);
    if ('onLandTags' in item) allTags.push(item.onLandTags);
    if ('subseaTags' in item) allTags.push(item.subseaTags);

    for (const group of allTags) {
      for (const kv of Object.entries(group)) {
        tagToFeature[kv.join('=')] ||= new Set();
        tagToFeature[kv.join('=')]!.add(type);
      }
    }
  }

  for (const tag in tagToFeature) {
    const [key, value] = tag.split('=');

    const features = andFormatter.format([...tagToFeature[tag]!]);
    const description = `Used by the ʻNew Zealand Place Names’ tool to automatically conflate named features designated as ${features}`;

    output.tags.push({
      key: key!,
      value: value === '*' ? undefined : value!,
      description,
      object_types: undefined!,
    });
  }

  return output;
}
