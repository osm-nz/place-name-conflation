import type { Tags } from 'pbf2json';
import type { NZGBFeature } from '../../../types';
import { compareFeatures } from '../compareFeatures';

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

  it("doesn't override name:mi if it's already set", () => {
    expect(
      conflateTags(
        { name: 'Ōtāhuhu Creek', nameMi: 'Ōtāhuhu' },
        { name: 'Ōtāhuhu Creek', 'name:mi': 'some other value' },
      ),
    ).toBeUndefined();
  });

  it('does override name:mi if `name` is being changed', () => {
    expect(
      conflateTags(
        { name: 'Ōtāhuhu Creek', nameMi: 'Ōtāhuhu' },
        { name: 'Otahuhu Creek', 'name:mi': 'Otahuhu' },
      ),
    ).toStrictEqual({ name: 'Ōtāhuhu Creek', 'name:mi': 'Ōtāhuhu' });
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

  it('allows the OSM feature to have macrons if the NZGB has no official name', () => {
    expect(
      conflateTags({ name: 'Puhoi', official: undefined }, { name: 'Pūhoi' }),
    ).toBeUndefined();
  });

  it('does not apply the above exception for features that have an official name', () => {
    expect(
      conflateTags({ name: 'Puhoi', official: true }, { name: 'Pūhoi' }),
    ).toStrictEqual({ name: 'Puhoi' });
  });

  it('allows OSM to use a slash instead of the word "or"', () => {
    expect(
      conflateTags(
        { name: 'Blackwood Bay or Tahuahua Bay' },
        { name: 'Blackwood Bay / Tahuahua Bay' },
      ),
    ).toBeUndefined();

    // but when creating a new feature, it uses the official spelling by default.
    expect(
      conflateTags({ name: 'Blackwood Bay or Tahuahua Bay' }, {}),
    ).toStrictEqual({ name: 'Blackwood Bay or Tahuahua Bay' });
  });

  it('can append a value to old_name', () => {
    expect(
      conflateTags(
        { name: 'Pākaraka', oldNames: ['Maxwelltown'] },
        { name: 'Pākaraka', old_name: 'Maxwell' },
      ),
    ).toStrictEqual({ old_name: 'Maxwelltown;Maxwell' });
  });

  it("doesn't try to add old_name if the value already exists in alt_name", () => {
    expect(
      conflateTags(
        { name: 'Pākaraka', oldNames: ['Maxwell'] },
        { name: 'Pākaraka', alt_name: 'Maxwell' },
      ),
    ).toBeUndefined();

    expect(
      conflateTags(
        { name: 'Pākaraka', oldNames: ['Maxwell', 'Maxwelltown'] },
        { name: 'Pākaraka', 'not:name': 'Maxwell' },
      ),
    ).toStrictEqual({ old_name: 'Maxwelltown' });
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

  it("adds name:etymology:wikidata if it's mising", () => {
    expect(
      conflateTags(
        { name: 'Arundel', etymologyQId: 'Q60429821' },
        { name: 'Arundel' },
      ),
    ).toStrictEqual({ 'name:etymology:wikidata': 'Q60429821' });

    // all good
    expect(
      conflateTags(
        { name: 'Arundel', etymologyQId: 'Q60429821' },
        { name: 'Arundel', 'name:etymology:wikidata': 'Q60429821' },
      ),
    ).toBeUndefined();
  });

  it('removes source:name if it duplicates the ref tag', () => {
    expect(
      conflateTags(
        { name: 'Kororāreka' },
        {
          name: 'Kororāreka',
          'source:name': 'https://gazetteer.linz.govt.nz/place/26242',
        },
      ),
    ).toStrictEqual({ 'source:name': '🗑️' });
  });

  it('does not remove source:name if it contains multiple values', () => {
    expect(
      conflateTags(
        { name: 'Kororāreka' },
        {
          name: 'Kororāreka',
          'source:name':
            'https://gazetteer.linz.govt.nz/place/26242;survey;Bing',
        },
      ),
    ).toBeUndefined();
  });

  it('allows any name in chill mode but ensures official_name is correct', () => {
    // 1. nothing to change, official_name is all good
    expect(
      conflateTags(
        { name: 'Otiria-Okaihau Industrial Railway', type: 'Railway Line' },
        {
          type: 'route',
          route: 'railway',
          name: 'Ōkaihau Branch',
          official_name: 'Otiria-Okaihau Industrial Railway',
        },
      ),
    ).toBeUndefined();

    // 2. official_name missing so it tries to add it
    expect(
      conflateTags(
        { name: 'Otiria-Okaihau Industrial Railway', type: 'Railway Line' },
        { type: 'route', route: 'railway', name: 'Ōkaihau Branch' },
      ),
    ).toStrictEqual({ official_name: 'Otiria-Okaihau Industrial Railway' });

    // 3. official_name missing but name=official_name so there's no point adding it
    expect(
      conflateTags(
        { name: 'Otiria-Okaihau Industrial Railway', type: 'Railway Line' },
        {
          type: 'route',
          route: 'railway',
          name: 'Otiria-Okaihau Industrial Railway',
        },
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

    it('uses acceptTags to accept alternative tagging methods', () => {
      // 1. We accept `natural=hot_spring` as an alternative
      expect(
        conflateTags(
          { name: 'Winter Spring', type: 'Spring' },
          { name: 'Winter Spring', natural: 'hot_spring' },
        ),
      ).toBeUndefined();

      // 2. but we don't accept `natural=wssdfsdfw` as an alternative
      expect(
        conflateTags(
          { name: 'Winter Spring', type: 'Spring' },
          { name: 'Winter Spring', natural: 'wssdfsdfw' },
        ),
      ).toStrictEqual({ natural: 'spring' }); // default preset is suggested
    });
  });
});
