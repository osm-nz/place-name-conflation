import type { NZGBSourceData, Ref } from '../types';

export const OVERRIDES: Record<Ref, Partial<NZGBSourceData[string]>> = {
  '7006;6879': {
    name: 'Whanganui',
  },
};

export const IGNORE = new Set([
  13381, // natural=spit + name=Spit (in Antarctica)

  // these areas are bigger than australia...
  40632, // Southwest Pacific Basin
  138122, // Bellingshausen Basin
  40662, // Tasman Basin
  40232, // Hikurangi Plateau

  // outside of the bbox for oceania + antarctica
  56588, // Southern Ocean
]);
