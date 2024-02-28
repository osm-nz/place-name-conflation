import type { Tags } from 'pbf2json';
import { TOP_LEVEL_TAGS } from '../data';

const MAP = { n: 'node', w: 'way', r: 'relation' } as const;
export type NWR = (typeof MAP)[keyof typeof MAP];

export const osmIdToLink = (osmId: string) =>
  `https://osm.org/${MAP[<never>osmId[0]]}/${osmId.slice(1)}`;

export const findTopLevelTags = (tags: Tags) =>
  TOP_LEVEL_TAGS.filter((tag) => {
    if (tag.includes('~')) {
      const [k, v] = tag.split('~');
      return tags[k] === v;
    }
    return tag in tags;
  });

export const toCSV = (doubleArray: (string | number | undefined)[][]): string =>
  doubleArray
    .map((row) =>
      row.map((_cell) => {
        const cell = `${_cell ?? '❌'}`.replaceAll('"', '""');
        const quoted =
          cell.includes(',') || cell.includes('"') ? `"${cell}"` : cell;
        return quoted.replaceAll('\n', '↩');
      }),
    )
    .join('\n');
