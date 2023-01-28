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
  'Amenity Area': __SKIP, // only 16 and they're random spots in the bush
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
  },
  Bay: { tags: { natural: 'bay' }, acceptTags: [{ natural: 'strait' }] },
  Beach: { tags: { natural: 'beach' } },
  Bend: {
    tags: { waterway: 'bend' },
    acceptTags: [{ water: 'bend' }],
    addTags: { place: 'locality' },
  },
  Bridge: { tags: { man_made: 'bridge' } },
  Building: __SKIP, // only 100 features, all already in OSM, and querying for building=yes is a waste of resources
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
  'Conservation Park': __SKIP, // reconsider after future DOC import
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
  Desert: { tags: { desert: 'yes' } },
  'Ecological Area': __SKIP, // reconsider after future DOC import
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
  Forest: { tags: { natural: 'wood' } },
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
  Glacier: { tags: { natural: 'glacier' } },
  'Government Purpose Reserve': __SKIP, // reconsider after future DOC import
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
    acceptTags: [{ natural: 'ridge' }, { natural: 'volcano' }],
  },
  'Historic Antarctic': {
    tags: { historic: '*' },
    addTags: { historic: 'yes' },
  },
  'Historic Reserve': {
    tags: { leisure: 'nature_reserve' },
    acceptTags: [{ leisure: 'park' }, { historic: '*' }] as Tags[],
  },
  'Historic Site': { tags: { historic: '*' }, addTags: { historic: 'yes' } },
  Hole: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'hole',
    },
  },
  'Ice Feature': { tags: { place: 'locality' } },
  Island: { tags: { place: 'island' } },
  Isthmus: { tags: { place: 'locality' }, addTags: { natural: 'isthmus' } },
  Knoll: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'knoll',
    },
  },
  Lake: { tags: { natural: 'water' }, addTags: { water: 'lake' } },
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
    acceptTags: [{ boundary: 'protected_area' }],
  },
  Mound: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'mound', // value exists in the IHO book but not S-57 standard
    },
  },
  'Mud Volcano': { tags: { natural: 'volcano' } },
  'National Park': {
    tags: { boundary: 'protected_area', protect_class: '2' },
    acceptTags: [{ boundary: 'national_park' }],
  },
  'Nature Reserve': __SKIP, // reconsider after future DOC import
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
      'seamark:sea_area:category': 'plain',
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
    chillMode: true,
  },
  'Railway Station': {
    tags: { railway: 'station' },
    acceptTags: [{ railway: 'halt' }],
  },
  Range: { tags: { natural: 'ridge' } },
  Rapid: {
    tags: { natural: 'water', water: 'rapids' },
    acceptTags: [{ waterway: 'waterfall' }],
  },

  Recreation: { tags: { place: 'locality' } }, // named places within ski fields
  'Recreation Reserve': { tags: { leisure: 'park' } },
  Reef: {
    tags: { natural: 'reef' },
    acceptTags: [{ natural: 'rock' }, { natural: 'bare_rock' }],
  },
  'Reserve (non-CPA)': { tags: { leisure: 'park' } },
  Ridge: {
    onLandTags: { natural: 'ridge' },
    subseaTags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'ridge',
    },
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
    // rock or Nunatak
    tags: { natural: 'rock' },
    acceptTags: [{ natural: 'bare_rock' }, { natural: 'peak' }],
  },
  Saddle: {
    // these are all underwater features
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'saddle',
    },
  },
  'Sanctuary Area': __SKIP, // reconsider after future DOC import
  Scarp: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'escarpment',
    },
  },
  'Scenic Reserve': __SKIP, // reconsider after future DOC import
  'Scientific Reserve': __SKIP, // reconsider after future DOC import
  Sea: { tags: { place: 'sea' } },
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
  },
  Sill: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'sill',
    },
  },
  Site: { tags: { place: 'locality' } },
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
    chillMode: true, // prefer the names from LINZ's geodetic dataset
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
  },
  Village: { tags: { place: '*' }, addTags: { place: 'village' } },
  Volcano: { tags: { natural: 'volcano' } },
  Waterfall: {
    tags: { waterway: 'waterfall' },
    acceptTags: [{ water: 'rapids' }],
  }, // or lava-waterfall
  Wetland: { tags: { natural: 'wetland' } },
  'Wilderness Area': __SKIP, // reconsider after future DOC import
  'Wildlife Management Area': __SKIP, // reconsider after future DOC import
} satisfies TypeMap;

export const DONT_IMPORT_AS_AREA = new Set<NameType>([
  'Stream', // streams take up >50% of the whole file and they need to be imported separately
  'Bay',
  'Suburb',
  'Town',
  'City',
  'Railway Line',
  'National Park',
]);
export const DONT_TRY_TO_MOVE = new Set<NameType>([
  'Stream',
  'Canal',
  'Railway Line',
  'Sea',
  'National Park',
]);

// this what we query the OSM planet file for, since it's cheaper to do one overly generous
// query than 40 specific queries. There will be a whole load of irrelevant crap returned for
// broad queries like `natural=*` but we have to live with that.
export const TOP_LEVEL_TAGS = [
  'natural',
  'place',
  'historic',
  'waterway~waterfall',
  'waterway~bend',
  'leisure~park',
  'leisure~nature_reserve',
  'boundary~protected_area',
  'man_made~bridge',
  'man_made~survey_point',
  'railway~yard',
  'railway~station',
  'route~railway',
  'type~waterway',
  'seamark:sea_area:category',
  'desert~yes',
  'ford~yes',
  'junction~yes',
  'historic~yes',
];

export const NZGB_NAME_TYPES: TypeMap = _NZGB_NAME_TYPES;

export type NameType = keyof typeof _NZGB_NAME_TYPES;

type Tags = { [key: string]: string };
type TypeMap = Record<
  string,
  | typeof __SKIP
  | ({
      /** alternative tagging methods to accept */
      acceptTags?: Tags[];

      /** if true, we allow the `name` tag to have any value, and we maintain the `official_name` tag instead */
      chillMode?: boolean;
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
