mkdir -p out
mkdir -p tmp
mkdir -p out/spam
cd tmp
rm -rf englishDictionary.json
rm -rf nzgb.csv

ENGLISH_DICT_URL="https://github.com/dwyl/english-words/raw/master/words_dictionary.json"
NZGB_URL="https://gazetteer.linz.govt.nz/gaz.csv"

curl -L $ENGLISH_DICT_URL --output englishDictionary.json
curl -L $NZGB_URL --output nzgb.csv
