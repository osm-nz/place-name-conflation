/** Use this for features that should be skipped (e.g. roads) */
export const __SKIP = Symbol('Skip');

// seamark:sea_area:category values come from "Standardization of Undersea Feature Names"
// https://iho.int/uploads/user/pubs/bathy/B-6_e4%202%200_2019_EF_clean_3Oct2019.pdf

const _NZGB_NAME_TYPES = {
  'Abyssal Plain': {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'abyssal_plain',
    },
  },
  'Amenity Area': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Amenity Area',
      'protection_title:wikidata': 'Q112160795',
      protect_class: '7',
    },
  },
  Appellation: __SKIP, // colonial-era survey districts or land blocks
  Area: { tags: { place: 'locality' } },
  Bank: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'bank',
    },
  },
  Basin: {
    // basin or cirque
    onLandTags: { natural: 'valley' },
    subseaTags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'basin',
    },
    acceptTags: [{ natural: 'bay' }],
  },
  Bay: {
    tags: { natural: 'bay' },
    acceptTags: [{ natural: 'strait' }, { natural: 'water' }],
  },
  Beach: { tags: { natural: 'beach' } },
  Bend: {
    tags: { waterway: 'bend' },
    acceptTags: [{ water: 'bend' }],
    addTags: { place: 'locality' },
  },
  Bridge: { tags: { man_made: 'bridge' } },
  Building: { tags: { building: '*' } },
  Bush: { tags: { natural: 'wood' } }, // this is ambigous, in NZ English this could mean forest or shrubland
  Caldera: { tags: { natural: 'caldera' } },
  Canal: { tags: { type: 'waterway', waterway: 'canal' } },
  Canyon: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'canyon',
    },
  },
  Cape: { tags: { natural: 'cape' } },
  Cave: { tags: { natural: 'cave_entrance' } },
  Channel: { tags: { natural: 'strait' } },
  Chasm: { tags: { place: 'locality' } },
  City: { tags: { place: '*' }, addTags: { place: 'city' } },
  Clearing: {
    tags: { place: 'locality' },
    acceptTags: [{ landcover: 'clearing' }],
  },
  Cliff: {
    tags: { natural: 'cliff' },
    acceptTags: [
      { natural: 'cape' },
      { natural: 'bare_rock' },
      { natural: 'peak' },
    ],
  },
  'Coast Feature': { tags: { place: 'locality' } },
  'Conservation Park': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Conservation Park',
      'protection_title:wikidata': 'Q5162994',
      protect_class: '2',
    },
  },
  Crater: {
    tags: { natural: 'crater' },
    acceptTags: [
      { natural: 'volcano' },
      { natural: 'peak' },
      { geological: 'volcanic_caldera_rim' },
    ] as Tags[],
  },
  Crevasse: { tags: { natural: 'crevasse' } },
  Deep: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'deep',
    },
  },
  Desert: {
    // someone has been bulk deleting desert=* from around the world,
    // so we can't use that tag anymore...
    tags: { natural: 'sand' },
  },
  'Ecological Area': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Ecological Area',
      'protection_title:wikidata': 'Q112136526',
      protect_class: '1a',
    },
  },
  Escarpment: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'escarpment',
    },
  },
  Estuary: {
    tags: { natural: 'bay' },
    addTags: { estuary: 'yes' },
    acceptTags: [{ natural: 'water', water: 'lagoon' }],
  },
  Facility: {
    // this category is for dams, hydroelectric power schemes, and other random features
    tags: { place: 'locality' },
  },
  Fan: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'fan',
    },
  },
  Flat: { tags: { place: 'locality' } }, // Plateau, table, flat plain
  Ford: { tags: { ford: 'yes' } },
  Forest: { tags: { natural: 'wood' }, acceptTags: [{ landuse: 'forest' }] },
  Fork: { tags: { junction: 'yes' } },
  'Fracture Zone': {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'fracture_zone',
    },
  },
  Gap: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'gap',
    },
  },
  Glacier: { tags: { natural: 'glacier' }, skipAntarctica: true },
  'Government Purpose Reserve': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Government Purpose Reserve',
      'protection_title:wikidata': 'Q112136688',
      protect_class: '4',
    },
    acceptTags: [
      {
        // a lot of these are actually DOC depots, fire stations, etc.
        'not:boundary': 'protected_area',
        protection_title: 'Government Purpose Reserve',
        'protection_title:wikidata': 'Q112136688',
      },
    ],
  },
  Guyot: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'guyot',
    },
  },
  Hill: {
    onLandTags: { natural: 'peak' },
    subseaTags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'peak',
    },
    acceptTags: [
      { natural: 'hill' },
      { natural: 'ridge' },
      { natural: 'cliff' },
      { natural: 'saddle' },
      { natural: 'volcano' },
    ],
  },
  'Historic Antarctic': __SKIP, // this category is for nonexistant features
  'Historic Reserve': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Historic Reserve',
      'protection_title:wikidata': 'Q112161119',
      protect_class: '3',
    },
  },
  'Historic Site': { tags: { historic: '*' }, addTags: { historic: 'yes' } },
  Hole: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'hole',
    },
  },
  'Ice Feature': {
    tags: { place: 'locality' },
    acceptTags: [
      { natural: 'peak' },
      { geological: 'nunatak' },
      { geological: 'moraine' },
      { 'glacier:type': 'icefall' },
      { 'glacier:type': 'shelf' },
      { natural: 'glacier' },
    ] as Tags[],
  },
  Island: {
    tags: { place: 'island' },
    acceptTags: [
      { place: 'islet' },
      { place: 'archipelago' },
      { natural: 'bare_rock' },
      { natural: 'rock' },
    ] as Tags[],
  },
  Isthmus: { tags: { place: 'locality' }, addTags: { natural: 'isthmus' } },
  Knoll: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'knoll',
    },
  },
  Lake: {
    tags: { natural: 'water' },
    addTags: { water: 'lake' },
    acceptTags: [{ natural: 'bay' }, { natural: 'wetland' }],
  },
  Ledge: { tags: { natural: 'ledge' }, acceptTags: [{ natural: 'cliff' }] },
  'Local Authority': __SKIP,
  Locality: { tags: { place: 'locality' } }, // locality (settlement)
  'Marine Feature': {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'yes',
    },
  },
  'Marine Reserve': {
    tags: { leisure: 'nature_reserve' },
    acceptTags: [
      {
        boundary: 'protected_area',
        protection_title: 'Marine Reserve',
        'protection_title:wikidata': 'Q1846270',
        protect_class: '1a',
      },
    ],
  },
  Mound: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'mound', // value exists in the IHO book but not S-57 standard
    },
  },
  'Mud Volcano': { tags: { natural: 'volcano' } },
  'National Park': {
    tags: {
      boundary: 'protected_area',
      protect_class: '2',
      protection_title: 'National Park',
      'protection_title:wikidata': 'Q46169',
    },
    acceptTags: [
      {
        boundary: 'national_park',
        protect_class: '2',
        protection_title: 'National Park',
        'protection_title:wikidata': 'Q46169',
      },
    ],
  },
  'Nature Reserve': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Nature Reserve',
      'protection_title:wikidata': 'Q113561028',
      protect_class: '1a',
    },
  },
  Pass: { tags: { natural: 'saddle' } }, // mountain pass / saddle
  Peak: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'peak',
    },
  },
  Peninsula: {
    tags: { natural: 'peninsula' },
    acceptTags: [{ natural: 'cape' }],
  },
  Pinnacle: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'pinnacle',
    },
  },
  Place: { tags: { place: 'locality' } }, // including MPLA: american places around McMurdo
  Plain: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'terrace',
    },
  },
  Plateau: {
    onLandTags: { place: 'locality' },
    subseaTags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'plateau',
    },
  },
  Point: { tags: { natural: 'cape' } }, // point, headland, cape
  Pool: { tags: { natural: 'water' }, addTags: { water: 'stream_pool' } },
  Port: { tags: { natural: 'bay' } }, // these are not `industrial=port`
  'Railway Crossing': { tags: { place: 'locality' } }, // only 2 features both are localities
  'Railway Junction': { tags: { railway: 'yard' } },
  'Railway Line': {
    tags: { type: 'route', route: 'railway' },
    acceptTags: [{ type: 'route', route: 'train' }], // exception for vintage railways
    chillMode: 'official_name',
  },
  'Railway Station': {
    tags: { railway: 'station' },
    acceptTags: [{ railway: 'halt' }],
  },
  'Ramsar Wetland': { tags: { natural: 'wetland', ramsar: 'yes' } },
  Range: { tags: { natural: 'ridge' }, skipAntarctica: true },
  Rapid: {
    tags: { natural: 'water', water: 'rapids' },
    acceptTags: [{ waterway: 'waterfall' }],
  },

  Recreation: { tags: { place: 'locality' } }, // named places within ski fields
  'Recreation Reserve': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Recreation Reserve',
      'protection_title:wikidata': 'Q112161186',
      protect_class: '5',
    },
  },
  Reef: {
    tags: { natural: 'reef' },
    acceptTags: [
      { natural: 'rock' },
      { natural: 'bare_rock' },
      { natural: 'shoal' },
    ],
  },
  'Reserve (non-CPA)': { tags: { leisure: 'park' } },
  Ridge: {
    onLandTags: { natural: 'ridge' },
    subseaTags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'ridge',
    },
    acceptTags: [{ natural: 'mountain_range' }],
    skipAntarctica: true,
  },
  Rise: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'rise',
    },
  },
  Road: __SKIP,
  Roadstead: { tags: { natural: 'bay' } },
  Rock: {
    tags: { natural: 'rock' },
    acceptTags: [
      { natural: 'bare_rock' },
      { natural: 'stone' },
      { natural: 'peak' },
      { place: 'islet' },
      { place: 'island' },
      { place: 'archipelago' },
    ] as Tags[],
  },
  Saddle: {
    // these are all underwater features
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'saddle',
    },
  },
  'Sanctuary Area': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Sanctuary Area',
      'protection_title:wikidata': 'Q112136448',
      protect_class: '1a',
    },
  },
  Scarp: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'escarpment',
    },
  },
  'Scenic Reserve': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Scenic Reserve',
      'protection_title:wikidata': 'Q63248569',
      protect_class: '3',
    },
  },
  'Scientific Reserve': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Scientific Reserve',
      'protection_title:wikidata': 'Q113561096',
      protect_class: '1a',
    },
  },
  Sea: {
    tags: { place: 'sea' },
    acceptTags: [
      { place: 'ocean' },
      // place=sea/ocean is reserved for the seven seas, so we use a
      // different tag for some of our local waters.
      { 'seamark:type': 'sea_area', 'seamark:sea_area:category': 'sea' },
    ] as Tags[],
  },
  'Sea Valley': {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'valley',
    },
  },
  Seachannel: {
    tags: {
      // different to 'Channel' above
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'sea_channel',
    },
  },
  Seamount: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'seamount',
    },
  },
  'Seamount Chain': {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'seamount_chain',
    },
  },
  Shelf: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'shelf',
    },
  },
  'Shelf-Edge': {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'shelf-edge',
    },
  },
  Shoal: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'shoal',
      natural: 'shoal',
    },
    acceptTags: [
      {
        'seamark:type': 'water_turbulence',
        'seamark:sea_area:category': 'shoal',
      },
      {
        'seamark:type': 'rock',
        'seamark:sea_area:category': 'shoal',
        natural: 'rock',
      },
      {
        'seamark:type': 'obstruction',
        'seamark:sea_area:category': 'shoal',
        natural: 'shoal',
      },
      {
        'seamark:type': 'sea_area',
        'seamark:sea_area:category': 'shoal',
        natural: 'reef',
      },
    ] as Tags[],
  },
  Sill: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'sill',
    },
  },
  Site: {
    tags: { place: 'locality' },
    chillMode: 'alt_name', // official_name wouldn't be right for marae and pā
  },
  Slope: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'slope',
    },
  },
  Spit: { tags: { natural: 'cape' } },
  Spring: {
    tags: { natural: 'spring' },
    acceptTags: [{ natural: 'hot_spring' }],
  },
  Spur: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'spur',
    },
  },
  Stream: __SKIP, // { tags: { waterway: 'stream' } }, // skip for now, streams aren't imported yet
  Suburb: { tags: { place: '*' }, addTags: { place: 'suburb' } },
  Terrace: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'terrace',
    },
  },
  Town: { tags: { place: '*' }, addTags: { place: 'town' } },
  Track: __SKIP, // only 13 and they belong on `highway=path`s so not worth the effort
  Trench: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'trench',
    },
  },
  'Trig Station': {
    tags: { man_made: 'survey_point' },
    chillMode: 'official_name', // prefer the names from LINZ's geodetic dataset
  },
  Trough: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'trough',
    },
  },
  Valley: {
    // valley and gorge
    onLandTags: { natural: 'valley' },
    subseaTags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'valley',
    },
    acceptTags: [
      { natural: 'gorge' },
      { natural: 'gully' },
      { type: 'waterway' }, // many are actually streams
      { waterway: '*' }, // many are actually streams
    ] as Tags[],
    skipAntarctica: true,
  },
  Village: { tags: { place: '*' }, addTags: { place: 'village' } },
  Volcano: { tags: { natural: 'volcano' } },
  Waterfall: {
    tags: { waterway: 'waterfall' },
    acceptTags: [{ water: 'rapids' }],
  }, // or lava-waterfall
  Wetland: { tags: { natural: 'wetland' } },
  'Wilderness Area': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Wilderness Area',
      'protection_title:wikidata': 'Q2445527',
      protect_class: '1b',
    },
  },
  'Wildlife Management Area': {
    tags: {
      boundary: 'protected_area',
      protection_title: 'Wildlife Management Area',
      'protection_title:wikidata': 'Q8001309',
      protect_class: '4',
    },
  },
} satisfies TypeMap;

export const DONT_TRY_TO_MOVE = new Set<NameType>([
  'Stream',
  'Canal',
  'Railway Line',
  'Sea',
  'National Park',
]);

export const NZGB_NAME_TYPES: TypeMap = _NZGB_NAME_TYPES;

export type NameType = keyof typeof _NZGB_NAME_TYPES;

type Tags = { [key: string]: string };
type TypeMap = Record<
  string,
  | typeof __SKIP
  | ({
      /** alternative tagging methods to accept */
      acceptTags?: Tags[];

      /**
       * if truthy, we allow the `name` tag to have any value, and
       * we maintain the `official_name` or `alt_name` tag instead
       */
      chillMode?: 'official_name' | 'alt_name';

      /**
       * if true, we won't try to import or conflate features in
       * Antarctica for this layer.
       */
      skipAntarctica?: boolean;
    } & (
      | {
          /** the primary tag(s) for the feature, used when searching the planet  */
          tags: Tags;
          /** other tags to add, but not to include in the query  */
          addTags?: Tags;
        }
      | {
          /** tags to use when the feature is on land */
          onLandTags: Tags;
          /** tags to use when the feature is underwater offshore */
          subseaTags: Tags;
        }
    ))
>;
