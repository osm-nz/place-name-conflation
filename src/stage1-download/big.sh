mkdir -p out
mkdir -p tmp
mkdir -p tmp/spam
cd tmp
rm -rf osm.pbf
rm -rf nzgb.csv

PLANET_URL="http://download.geofabrik.de/australia-oceania/new-zealand-latest.osm.pbf"
NZGB_URL="https://gazetteer.linz.govt.nz/gaz.csv"

curl -L $PLANET_URL --output osm.pbf
curl -L $NZGB_URL --output nzgb.csv
