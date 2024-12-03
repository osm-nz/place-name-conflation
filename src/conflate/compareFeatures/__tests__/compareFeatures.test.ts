import { describe, expect, it } from 'vitest';
import type { Tags } from 'osm-api';
import { compareFeatures } from '../compareFeatures.js';
import type { NZGBFeature } from '../../../core/types/nzgb.def.js';
import type { WikidataItem } from '../../../core/types/wikidata.def.js';
import type { OSMFeature } from '../../../core/types/osm.def.js';
import type { Config } from '../../../core/types/general.def.js';

// helper function so we can write more concise tests.
// if it returns undefined it means there's nothing to fix
function conflateTags(
  nzgb: Partial<NZGBFeature>,
  osm: Tags,
  wikidata?: Partial<WikidataItem>,
) {
  const feature: Partial<OSMFeature> = {
    type: 'node',
    id: 1,
    center: { lat: 0, lon: 0 },
    tags: {
      'ref:linz:place_id': '26242',
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'abyssal_plain',
      ...osm,
    },
  };
  const result = compareFeatures(
    '26242',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { lat: 0, lng: 0, type: 'Abyssal Plain', ...(nzgb as any) },
    feature as OSMFeature,
    wikidata as WikidataItem,
    { allowInconsistentDiacritics: {} } as Config,
  );
  if (!result) return undefined;

  delete result.properties.__action;
  return result.properties;
}

describe('compareFeatures', () => {
  it('suggests fixing names', () => {
    expect(
      conflateTags({ name: 'correct name' }, { name: 'wrong name' }),
    ).toStrictEqual({ name: 'correct name' });
  });

  it('accepts if the legacy names are in not:name/alt_name/old_name', () => {
    expect(
      conflateTags(
        { name: 'Bayview', oldNames: ['Bay View', 'Bayvue'] },
        { name: 'Bayview', 'not:name': 'Bayvue', 'alt_name:en': 'Bay View' },
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

  it('allows the OSM feature to have more macrons if the NZGB has no official name', () => {
    expect(
      conflateTags(
        { name: 'Ōtuwharekai', official: undefined },
        { name: 'Ōtūwharekai' },
      ),
    ).toBeUndefined();
  });

  it('does not apply the above exception for features that have an official name', () => {
    expect(
      conflateTags({ name: 'Puhoi', official: true }, { name: 'Pūhoi' }),
    ).toStrictEqual({ name: 'Puhoi' });
    expect(
      conflateTags(
        { name: 'Ōtuwharekai', official: true },
        { name: 'Ōtūwharekai' },
      ),
    ).toStrictEqual({ name: 'Ōtuwharekai' });
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

  it("doesn't override name:etymology if it's already in OSM", () => {
    expect(
      conflateTags(
        { name: 'Arundel' },
        { name: 'Arundel', 'name:etymology': 'some existing value' },
        { etymology: 'Arendelle' },
      ),
    ).toBeUndefined();
  });

  it("doesn't set name:etymology if name:{lang}:etymology is already set", () => {
    expect(
      conflateTags(
        { name: 'Arundel' },
        { name: 'Arundel', 'name:mi:etymology': 'some existing value' },
        { etymology: 'Arendelle' },
      ),
    ).toBeUndefined();
  });

  it("doesn't set name:etymology if name:{lang}:etymology:wikidata is already set", () => {
    expect(
      conflateTags(
        { name: 'Arundel' },
        {
          name: 'Arundel',
          'name:mi:etymology:wikidata': 'some existing value',
        },
        { etymology: 'Arendelle' },
      ),
    ).toBeUndefined();
  });

  it("adds name:etymology:wikidata if it's mising", () => {
    expect(
      conflateTags(
        { name: 'Arundel' },
        { name: 'Arundel typo' },
        { etymology: 'Arendelle', etymologyQId: 'Q60429821' },
      ),
    ).toStrictEqual({
      name: 'Arundel',
      'name:etymology': 'Arendelle',
      'name:etymology:wikidata': 'Q60429821',
    });
  });

  it("does't add name:etymology[]:wikidata] if it's the only thing that's wrong", () => {
    expect(
      conflateTags(
        { name: 'Arundel' },
        { name: 'Arundel' },
        { etymology: 'Arendelle', etymologyQId: 'Q60429821' },
      ),
    ).toBeUndefined();
  });

  it("doesn't add name:etymology:wikidata if the tag is already correct", () => {
    expect(
      conflateTags(
        { name: 'Arundel' },
        { name: 'Arundel', 'name:etymology:wikidata': 'Q60429821' },
        { etymologyQId: 'Q60429821' },
      ),
    ).toBeUndefined();
  });

  it("doesn't add name:etymology:wikidata if the feature has name:{lang}:etymology:wikidata", () => {
    expect(
      conflateTags(
        { name: 'Arundel' },
        { name: 'Arundel', 'name:en:etymology:wikidata': 'Q60429821' },
        { etymologyQId: 'Q60429821' },
      ),
    ).toBeUndefined();
  });

  it("adds the wikipedia tag if it's missing", () => {
    expect(
      conflateTags(
        { name: 'Kuratau' },
        { name: 'typo' },
        { wikipedia: 'en:Kuratau' },
      ),
    ).toStrictEqual({ name: 'Kuratau', wikipedia: 'en:Kuratau' });
  });

  it("doesn't add the wikipedia tag if it's the only tag to be changed", () => {
    expect(
      conflateTags(
        { name: 'Kuratau' },
        { name: 'Kuratau' },
        { wikipedia: 'en:Kuratau' },
      ),
    ).toBeUndefined();
  });

  it("doesn't override the wikipedia tag if it already exists", () => {
    expect(
      conflateTags(
        { name: 'Kuratau' },
        { name: 'Kuratau', wikipedia: 'de:Kuratau (Neuseeland)' },
        { wikipedia: 'en:Kuratau' },
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
          { name: 'Pūkākī Saddle', 'seamark:type': '' },
        ),
      ).toStrictEqual({ 'seamark:type': 'sea_area' });
    });

    it('respects lifecycle prefixes on the preset tags', () => {
      expect(
        conflateTags(
          { name: 'Pūkākī Saddle' },
          {
            name: 'Pūkākī Saddle',
            'seamark:type': '',
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

    it('accepts lifecycle prefixes that duplicate a normal key', () => {
      expect(
        conflateTags(
          { name: 'X', type: 'Island' },
          { name: 'X', place: 'suburb', 'not:place': 'island' },
        ),
      ).toBeUndefined();
    });

    it('suggests adding other preset tags if some are missing', () => {
      expect(
        conflateTags(
          { name: 'A', type: 'Nature Reserve' },
          { name: 'A', boundary: 'protected_area' },
        ),
      ).toStrictEqual({
        protect_class: '1a',
        protection_title: 'Nature Reserve',
        'protection_title:wikidata': 'Q113561028',
      });
    });

    it("doesn't suggest adding other preset tags if any of the preset tags have a lifecycle prefix", () => {
      expect(
        conflateTags(
          { name: 'A', type: 'Nature Reserve' },
          { name: 'A', 'not:boundary': 'protected_area' },
        ),
      ).toBeUndefined();
    });
  });

  describe('exceptions', () => {
    it.each`
      nzgb              | osm
      ${'Saint Martin'} | ${'St Martin'}
      ${'St Martin'}    | ${'Saint Martin'}
      ${'St. Martin'}   | ${'Saint Martin'}
      ${'St. Martin'}   | ${'St Martin'}
      ${'Mt Martin'}    | ${'Mount Martin'}
      ${'Mount martin'} | ${'Mt martin'}
    `('accepts an inconsistency between $nzgb & $osm', ({ nzgb, osm }) => {
      expect(conflateTags({ name: nzgb }, { name: osm })).toBeUndefined();
    });
  });

  it('allows dual names in the name tag', () => {
    expect(
      conflateTags(
        { name: 'Omanawa Falls' },
        {
          name: 'Te Rere o Ōmanawa / Ōmanawa Falls',
          'name:mi': 'Te Rere o Ōmanawa',
        },
      ),
    ).toBeUndefined();
  });
});
