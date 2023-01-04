import type { Tags } from 'pbf2json';
import { TOP_LEVEL_TAGS } from '../data';

export const findTopLevelTag = (tags: Tags) =>
  TOP_LEVEL_TAGS.find((tag) => {
    if (tag.includes('~')) {
      const [k, v] = tag.split('~');
      return tags[k] === v;
    }
    return tag in tags;
  });
