mkdir -p out
mkdir -p tmp
mkdir -p out/spam
cd tmp
rm -rf countries.geo.json
rm -rf englishDictionary.json
rm -rf nzgb.csv

COASTLINE_URL="https://github.com/datasets/geo-countries/raw/master/data/countries.geojson"
ENGLISH_DICT_URL="https://github.com/dwyl/english-words/raw/master/words_dictionary.json"
NZGB_URL="https://gazetteer.linz.govt.nz/gaz.csv"

curl -L $COASTLINE_URL --output coastline.geo.json
curl -L $ENGLISH_DICT_URL --output englishDictionary.json
curl -L $NZGB_URL --output nzgb.csv

yarn ts-node src/stage1-download/trimCoastline.ts
