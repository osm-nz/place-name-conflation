import type { Tags } from 'pbf2json';
import type { NZGBFeature } from '../../../types';
import { compareFeatures } from '..';

// helper function so we can write more concise tests.
// if it returns undefined it means there's nothing to fix
function conflateTags(
  nzgb: Omit<NZGBFeature, 'lat' | 'lng' | 'type'> & Partial<NZGBFeature>,
  osm: Tags,
) {
  const result = compareFeatures(
    '26242',
    { lat: 0, lng: 0, type: 'Abyssal Plain', ...nzgb },
    {
      lat: 0,
      lng: 0,
      osmId: 'n1',
      tags: {
        'ref:linz:place_id': '26242',
        'seamark:type': 'sea_area',
        'seamark:sea_area:category': 'abyssal_plain',
        ...osm,
      },
    },
  );
  if (!result) return undefined;

  delete result.properties.__action;
  return result.properties;
}

describe('compareFeatures', () => {
  it('accepts if the legacy names are in not:name/alt_name/old_name', () => {
    expect(
      conflateTags(
        { name: 'Bayview', oldNames: ['Bay View', 'Bayvue'] },
        { name: 'Bayview', 'not:name': 'Bayvue', 'alt_name:en': 'Bay View' },
      ),
    ).toBeUndefined();
  });

  it("won't suggest editing a feature if the only change is to add name:mi", () => {
    expect(
      conflateTags(
        { name: 'Timaru Harbour', nameMi: 'Timaru' },
        { name: 'Timaru Harbour' },
      ),
    ).toBeUndefined();
  });

  it('accepts slash-divided names that comprise of official/unofficial names', () => {
    expect(
      conflateTags(
        { name: 'Te Onetapu', oldNames: ['Rangipo Desert'] },
        { name: 'Te Onetapu / Rangipo Desert', old_name: 'Rangipo Desert' },
      ),
    ).toBeUndefined();

    // don't accept it if the official name isn't first
    expect(
      conflateTags(
        { name: 'Te Onetapu', oldNames: ['Rangipo Desert'] },
        { name: 'Rangipo Desert / Te Onetapu', old_name: 'Rangipo Desert' },
      ),
    ).toBeTruthy();

    // also don't accept it if old_name is missing in OSM
    expect(
      conflateTags(
        { name: 'Te Onetapu', oldNames: ['Rangipo Desert'] },
        { name: 'Te Onetapu / Rangipo Desert' },
      ),
    ).toBeTruthy();
  });

  it("fixes the ref tag if it's wrong", () => {
    expect(
      conflateTags(
        { name: 'Jericho' },
        { name: 'Jericho', 'ref:linz:place_id': 'invaliddddd' },
      ),
    ).toStrictEqual({ 'ref:linz:place_id': '26242' });
  });

  it("adds name:etymology if it's mising", () => {
    expect(
      conflateTags(
        { name: 'Arundel', etymology: 'Arendelle' },
        { name: 'Arundel' },
      ),
    ).toStrictEqual({ 'name:etymology': 'Arendelle' });
  });

  it("doesn't override name:etymology if it's already in OSM", () => {
    expect(
      conflateTags(
        { name: 'Arundel', etymology: 'Arendelle' },
        { name: 'Arundel', 'name:etymology': 'some existing value' },
      ),
    ).toBeUndefined();
  });

  it("doesn't add name:ety if name:ety:wikidata already in OSM", () => {
    expect(
      conflateTags(
        { name: 'Arundel', etymology: 'Arendelle' },
        { name: 'Arundel', 'name:etymology:wikidata': 'Q60429821' },
      ),
    ).toBeUndefined();
  });

  describe('preset tag changes', () => {
    it('can fix the preset tags', () => {
      expect(
        conflateTags(
          { name: 'Kupe Abyssal Plain' },
          { name: 'Kupe Abyssal Plain', 'seamark:sea_area:category': 'typo🥴' },
        ),
      ).toStrictEqual({ 'seamark:sea_area:category': 'abyssal_plain' });
    });

    it("doesn't try to change seamark:type if it already exists", () => {
      expect(
        conflateTags(
          { name: 'Pūkākī Saddle' },
          { name: 'Pūkākī Saddle', 'seamark:type': 'obstruction' },
        ),
      ).toBeUndefined();
    });

    it('does add seamark:type if the tag is missing', () => {
      expect(
        conflateTags(
          { name: 'Pūkākī Saddle' },
          { name: 'Pūkākī Saddle', 'seamark:type': undefined },
        ),
      ).toStrictEqual({ 'seamark:type': 'sea_area' });
    });

    it('respects lifecycle prefixes on the preset tags', () => {
      expect(
        conflateTags(
          { name: 'Pūkākī Saddle' },
          {
            name: 'Pūkākī Saddle',
            'seamark:type': undefined,
            'demolished:seamark:type': 'sea_area',
          },
        ),
      ).toBeUndefined();
    });
  });
});
