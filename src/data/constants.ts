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
  Bay: { tags: { natural: 'bay' } },
  Beach: { tags: { natural: 'beach' } },
  Bend: { tags: { natural: 'peak' } }, // MNAT: McMurdo - american Nunatak
  Bridge: { tags: { man_made: 'bridge' } },
  Building: { tags: { building: 'yes' } },
  Bush: { tags: { natural: 'wood' } }, // this is ambigous, in NZ English this could mean forest or shrubland
  Caldera: { tags: { natural: 'volcano' } },
  Canal: { tags: { natural: 'water', water: 'canal' } },
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
  Clearing: { tags: { place: 'locality' } },
  Cliff: { tags: { natural: 'cliff' } },
  'Coast Feature': { tags: { place: 'locality' } },
  'Conservation Park': { tags: { place: 'locality' } },
  Crater: { tags: { natural: 'volcano' } },
  Crevasse: { tags: { natural: 'crevasse' } },
  Deep: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'deep',
    },
  },
  Desert: { tags: { desert: 'yes' } },
  'Ecological Area': { tags: { place: 'locality' } },
  Escarpment: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'escarpment',
    },
  },
  Estuary: { tags: { natural: 'bay' }, addTags: { estuary: 'yes' } },
  Facility: { tags: { place: 'locality' } },
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
  'Government Purpose Reserve': __SKIP, // these should be imported as boundaries first
  Guyot: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'guyot',
    },
  },
  Hill: { tags: { natural: 'peak' } },
  'Historic Antarctic': { tags: { historic: 'yes' } },
  'Historic Reserve': { tags: { historic: 'yes' } },
  'Historic Site': { tags: { historic: 'yes' } },
  Hole: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'hole',
    },
  },
  'Ice Feature': { tags: { place: 'locality' } },
  Island: { tags: { place: 'island' } },
  Isthmus: { tags: { place: 'locality' } },
  Knoll: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'knoll',
    },
  },
  Lake: { tags: { natural: 'water' }, addTags: { water: 'lake' } },
  Ledge: { tags: { natural: 'ledge' } },
  'Local Authority': __SKIP,
  Locality: { tags: { place: 'locality' } }, // locality (settlement)
  'Marine Feature': { tags: { 'seamark:type': 'sea_area' } },
  'Marine Reserve': { tags: { boundary: 'protected_area' } },
  Mound: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'mound', // value exists in the IHO book but not S-57 standard
    },
  },
  'Mud Volcano': { tags: { natural: 'volcano' } },
  'National Park': __SKIP, // { tags: { boundary: 'protected_area' } }, // needs to be imported first
  'Nature Reserve': { tags: { leisure: 'nature_reserve' } },
  Pass: { tags: { natural: 'saddle' } }, // mountain pass / saddle
  Peak: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'peak',
    },
  },
  Peninsula: { tags: { natural: 'cape' } },
  Pinnacle: { tags: { natural: 'rock' } },
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
  Pool: { tags: { natural: 'water' } },
  Port: { tags: { natural: 'bay' } }, // these are not `industrial=port`
  'Railway Crossing': { tags: { place: 'locality' } }, // only 2 features both are localities
  'Railway Junction': { tags: { railway: 'yard' } },
  'Railway Line': { tags: { type: 'route', route: 'railway' } },
  'Railway Station': { tags: { railway: 'station' } },
  Range: { tags: { natural: 'ridge' } },
  Rapid: { tags: { natural: 'water', water: 'rapids' } },
  Recreation: { tags: { place: 'locality' } }, // named places within ski fields
  'Recreation Reserve': { tags: { landuse: 'recreation_ground' } },
  Reef: { tags: { natural: 'reef' } },
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
  Rock: { tags: { natural: 'rock' } }, // rock or Nunatak
  Saddle: {
    // these are all underwater features
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'saddle',
    },
  },
  'Sanctuary Area': { tags: { place: 'locality' } },
  Scarp: {
    tags: {
      'seamark:type': 'sea_area',
      'seamark:sea_area:category': 'escarpment',
    },
  },
  'Scenic Reserve': __SKIP, // { tags: { leisure: 'park' } }, // skip for now, it's big and should be imported as areas
  'Scientific Reserve': { tags: { leisure: 'park' } },
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
  Shoal: { tags: { natural: 'shoal' } },
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
  Spring: { tags: { natural: 'spring' } },
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
  'Trig Station': { tags: { man_made: 'survey_point' } },
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
  Waterfall: { tags: { waterway: 'waterfall' } }, // or lava-waterfall
  Wetland: { tags: { natural: 'wetland' } },
  'Wilderness Area': __SKIP, // these should be imported as boundaries first
  'Wildlife Management Area': __SKIP, // these should be imported as boundaries first
} satisfies TypeMap;

export const NZGB_NAME_TYPES: TypeMap = _NZGB_NAME_TYPES;

export type NameType = keyof typeof _NZGB_NAME_TYPES;

type Tags = { [key: string]: string };
type TypeMap = Record<
  string,
  | typeof __SKIP
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
>;
