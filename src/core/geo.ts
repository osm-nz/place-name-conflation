import type { Polygon } from 'geojson';
import type { Coord } from '../types';

const { sin, cos, sqrt, PI: π, atan2 } = Math;

const R = 6371; // radius of the earth in km
const K = π / 180; // marginal performance boost by pre-calculating this

const deg2rad = (deg: number) => deg * K;

/** returns the distance in metres between two coordinates */
export function distanceBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lng2 - lng1);
  const a =
    sin(dLat / 2) * sin(dLat / 2) +
    cos(deg2rad(lat1)) * cos(deg2rad(lat2)) * sin(dLon / 2) * sin(dLon / 2);
  const c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return 1000 * R * c;
}

/** radius of the diamond */
const RADIUS = 0.0002;
// 0.0002° ~= 0° 0' 0.72"

/** generates a bbox around a point, but as a diamond not a square */
export function createDiamond(lat: number, lng: number): Polygon {
  const diamond: Coord[] = [
    [lng, lat + RADIUS], // top
    [lng + RADIUS, lat], // right
    [lng, lat - RADIUS], // bottom
    [lng - RADIUS, lat], // left
  ];
  diamond.push(diamond[0]); // make it a closed way

  return {
    type: 'Polygon',
    coordinates: [diamond], // only 1 ring since it's an area, not a multipolygon
  };
}
