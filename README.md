# NZGB --> OSM place name conflation

[![Test](https://github.com/osm-nz/place-name-conflation/actions/workflows/ci.yml/badge.svg)](https://github.com/osm-nz/place-name-conflation/actions/workflows/ci.yml)
![Lines of code](https://img.shields.io/tokei/lines/github/osm-nz/place-name-conflation?color=green)

This repository contains the code that regularly compares place names in [OpenStreetMap](https://openstreetmap.org) with the [New Zealand Geographic Board (Ngā Pou Taunaha o Aotearoa) Gazetteer](https://gazetteer.linz.govt.nz).

How this works:

- The list of place names is downloaded from the [NZGB](https://gazetteer.linz.govt.nz/gaz.csv)
- An extract of the OpenStreetMap planet is downloaded (containing only Oceania & Antarctica)
- The OpenStreetMap planet is compared with the gazetter's data, and any discrepancies are identified and categories
- The result of the conflation process is converted into a format that allows OpenStreetMap mappers to review each place using the same tools as the [LINZ-to-OSM address import](https://github.com/osm-nz/linz-address-import).

# Setup

If you want to contribute to the code, the following needs to be done manually:

1. Clone this repository
1. Download [nodejs v18](https://nodejs.org) or later
1. Install `yarn` (run `npm i -g yarn`)
1. Run `yarn`
1. Run `yarn 1` to download the data (10mins)
1. Manually download the planet ([West side](https://app.protomaps.com/downloads/osm/6ce28ea0-70a3-4d9d-baf9-abbc3ea93f28) and [East side](https://app.protomaps.com/downloads/osm/3c51acd6-ac4f-448a-b36e-7c09cdb09c40))
1. Manually download [NZGB Lines](https://data.linz.govt.nz/layer/52423) as `tmp/nzgb-lines.csv`
1. Manually download [NZGB Areas](https://data.linz.govt.nz/layer/52424) as `tmp/nzgb-areas.csv`
1. Run `yarn 2` to preprocess the data (15mins)
1. Run `yarn 3` to conflate the data (2mins)
1. Run `yarn 4` to generate the HTML report (1sec)
1. Use the generated [`osmPatch`](https://github.com/osm-nz/linz-address-import/blob/main/SPEC.md) files to update the place names in OSM
