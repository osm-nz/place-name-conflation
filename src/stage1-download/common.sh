mkdir -p out
mkdir -p tmp
mkdir -p tmp/spam
cd tmp
rm -rf countries.geo.json
rm -rf englishDictionary.json

COASTLINE_URL="https://github.com/datasets/geo-countries/raw/master/data/countries.geojson"
ENGLISH_DICT_URL="https://github.com/dwyl/english-words/raw/master/words_dictionary.json"

curl -L $COASTLINE_URL --output coastline.geo.json
curl -L $ENGLISH_DICT_URL --output englishDictionary.json

yarn ts-node src/stage1-download/trimCoastline.ts
