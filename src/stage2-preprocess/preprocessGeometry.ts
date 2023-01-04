import csv from 'csv-parser';
import { createReadStream, promises as fs } from 'fs';
import { parse as wktToGeoJson } from 'wellknown';
import {
  nzgbCsvAreasPath,
  nzgbCsvLinesPath,
  nzgbJsonGeometryPath,
  simplify,
} from '../core';
import { IGNORE, NameType } from '../data';
import { GeometryTmpFile } from '../types';

/** tolerance for https://mourner.github.io/simplify-js */
const WAY_SIMPLIFICATION = 0.00003;

type GeometryIn = {
  feat_id: string;
  name: string;
  WKT: string;
  feat_type: NameType;
};

async function readCsv(path: string): Promise<GeometryTmpFile> {
  return new Promise((resolve, reject) => {
    const out: GeometryTmpFile = {};
    let i = 0;

    createReadStream(path)
      .pipe(csv())
      .on('data', (data: GeometryIn) => {
        if (!(i % 1000)) process.stdout.write('.');
        i += 1;

        const ref = +data.feat_id;

        if (IGNORE.has(ref)) return; // ignore this entry
        if (out[ref]) return; // don't waste time processing duplicates
        if (data.feat_type === 'Stream') return; // skip streams for now

        /** cause of the BOM character at the start of the csv file we do this */
        const WKT = data[Object.keys(data)[0] as 'WKT'];

        const geom = wktToGeoJson(WKT);
        if (!geom) {
          console.log(`\tBroken geometry for ${ref} (${data.name})`);
          return;
        }

        // simplify geometry because LINZ uses way too many coordinates
        // this cuts down the file from 150MB to 55MB. Same code as the
        // 2021 topo50 import.
        if (geom.type === 'LineString') {
          // Coord[]
          geom.coordinates = simplify(geom.coordinates, WAY_SIMPLIFICATION);
        } else if (geom.type === 'MultiLineString' || geom.type === 'Polygon') {
          // Coord[][]
          geom.coordinates = geom.coordinates.map((line) =>
            simplify(line, WAY_SIMPLIFICATION),
          );
        } else if (geom.type === 'MultiPolygon') {
          // Coord[][][]
          geom.coordinates = geom.coordinates.map((member) =>
            member.map((ring) => simplify(ring, WAY_SIMPLIFICATION)),
          );
        } else {
          console.log('\tUnexpected geomtry type', geom.type);
        }

        out[ref] = { name: data.name, geom };
      })
      .on('end', () => resolve(out))
      .on('error', reject);
  });
}

async function preprocessGeometry() {
  process.stdout.write('Reading areas...');
  const areas = await readCsv(nzgbCsvAreasPath);

  process.stdout.write('\nReading lines...');
  const lines = await readCsv(nzgbCsvLinesPath);

  console.log('\nSaving...');
  const output = { ...areas, ...lines };
  const str = JSON.stringify(output);
  await fs.writeFile(nzgbJsonGeometryPath, str);

  console.log(`Geometry Done: ${Math.round(str.length / 1024 ** 2)} MB`);
}

preprocessGeometry();
