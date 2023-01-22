import type { NZGBSourceData, Ref } from '../types';

export const OVERRIDES: Record<Ref, Partial<NZGBSourceData[string]>> = {
  '7006;6879': { name: 'Whanganui' },
  47427: { name: 'Whanganui East' },
  15198: { name: 'Ahukawakawa' },
  59543: { name: 'Simla Crescent' }, // misspelling in NZGB dataset
  5727: { name: 'Takaanini', oldNames: ['Takanini'] },
  3194: { name: 'Manukau' }, // remove " City Centre" suffix
  24112: { qId: 'Q82632727' }, // `valley` and `suburb` wikidata items are messed up
  54886: { name: 'Waitomokia', altNames: ['Mount Gabriel'] },
  4903: { name: 'Queenstown Airport' },
  4115: { name: 'Ōhaaki Power Station' },
};

export const IGNORE = new Set([
  13381, // natural=spit + name=Spit (in Antarctica)

  59622, // Mt Eden station
  59553, // Redwood station mapped as two separate stations

  54478, // Westland Land District - insane multipolygon
  54480, // Otago Land District - insane multipolygon

  // 3194, // Suburb = Manukau City Centre
  3193, // City = Manukau City
  55806, // Former City = Manukau City

  4071, // Duplicate of Northland Region

  6381, // Duplicate of Queen Charlotte Sound / Tōtaranui
  17197, // Duplicate of Braemar Springs

  // these areas are bigger than australia...
  40632, // Southwest Pacific Basin
  138122, // Bellingshausen Basin
  40662, // Tasman Basin
  40232, // Hikurangi Plateau

  // outside of the bbox for oceania + antarctica
  56588, // Southern Ocean
]);
