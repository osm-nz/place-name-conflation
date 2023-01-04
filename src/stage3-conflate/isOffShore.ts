import { readFileSync } from 'node:fs';
import whichPolygon from 'which-polygon';
import { coastlineFile } from '../core';
import { CoastlineFile } from '../types';

const coastline: CoastlineFile = JSON.parse(
  readFileSync(coastlineFile, 'utf8'),
);
const countryQuery = whichPolygon(coastline);

export function isOffShore(lat: number, lng: number): boolean {
  return !countryQuery([lng, lat]);
}
