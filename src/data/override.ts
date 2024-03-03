import type { NZGBSourceData, Ref } from '../types';

export const ALLOW_INCONSISTENT_DIACRITICS = new Set<string>([
  //
]);

export const OVERRIDES: Record<Ref, Partial<NZGBSourceData[string]>> = {
  '7006;6879': { name: 'Whanganui' },
  47427: { name: 'Whanganui East' },
  15198: { name: 'Ahukawakawa' },
  59543: { name: 'Simla Crescent' }, // misspelling in NZGB dataset
  5727: { name: 'Takaanini', oldNames: ['Takanini'] },
  3194: { name: 'Manukau' }, // remove " City Centre" suffix
  24112: { qId: 'Q6347824' }, // `valley` and `suburb` wikidata items are messed up
  54886: { name: 'Waitomokia', altNames: ['Mount Gabriel'] },
  4903: { name: 'Queenstown Airport' },
  4115: { name: 'Ōhaaki Power Station' },

  5532: { name: 'Saint Johns' }, // avoid changing to St. Johns
  31781: { name: 'Mount Tasman / Rarakiroa' },
  59478: { name: 'Mount Atkinson' },
};

export const IGNORE = new Set([
  13381, // natural=spit + name=Spit (in Antarctica)

  59622, // Mt Eden station
  59553, // Redwood station mapped as two separate stations

  10233, // (former) Te Urewera National Park

  54478, // Westland Land District - insane multipolygon
  54480, // Otago Land District - insane multipolygon

  // 3194, // Suburb = Manukau City Centre
  3193, // City = Manukau City
  55806, // Former City = Manukau City

  21058, // Freemans Bay is no longer a bay
  47772, // Westhaven...

  39273, // Duplicate Saint Johns suburb
  20153, // duplicate
  1995, // duplcaites aoraki/mt cook
  4071, // Duplicate of Northland Region
  6381, // Duplicate of Queen Charlotte Sound / Tōtaranui
  17197, // Duplicate of Braemar Springs

  14798, // Snares Depression - "does not exist"

  // these areas are bigger than australia...
  40632, // Southwest Pacific Basin
  138122, // Bellingshausen Basin
  40662, // Tasman Basin
  40232, // Hikurangi Plateau

  // outside of the bbox for oceania + antarctica
]);

/**
 * features that are outside of the NZ + Antartica bbox.
 * We query overpass for these ones.
 */
export const OUTSIDE_BBOX: (string | number)[] = [
  56588, // Southern Ocean
  '60370;57128', // South Pacific Ocean
];
