import type { Key, Tags } from 'osm-api';

/** deletes object properties that are `undefined` */
export function deleteUndefined(
  tags: Partial<Record<Key, string | undefined>>,
) {
  for (const _key in tags) {
    const key = <Key>_key;
    if (tags[key] === undefined) delete tags[key];
  }
  return tags as Tags;
}
