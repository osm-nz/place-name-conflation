import type { Tags } from 'osm-api';

/** deletes object properties that are `undefined` */
export function deleteUndefined(tags: Record<string, string | undefined>) {
  for (const key in tags) {
    if (tags[key] === undefined) delete tags[key];
  }
  return tags as Tags;
}
