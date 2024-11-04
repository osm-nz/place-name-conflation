import { memo, useCallback, useContext, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { OsmPatchFeature } from 'osm-api';
import { Alert, Button, Link } from '@mui/material';
import { BigNumber } from '../components/BigNumber';
import { DataContext } from '../context';
import { FILE_EXTN, download, osmIdToLink } from '../helpers';
import { getAllStats } from './LayerInfo';
import 'leaflet/dist/leaflet.css';

const ADD = <span className="red">Add</span>;
const EDIT = <span className="yellow">Edit</span>;

const columns: GridColDef<OsmPatchFeature>[] = [
  {
    field: 'nzgb',
    headerName: 'NZGB ID',
    width: 130,
    // @ts-expect-error -- unofficial field
    valueGetter: (_, feature) => feature.__hack__.ref,
    renderCell: (cell) => (
      <Link
        href={`https://gazetteer.linz.govt.nz/place/${cell.value}`}
        target="_blank"
        rel="noreferrer"
      >
        {cell.value}
      </Link>
    ),
  },
  {
    field: 'id',
    headerName: 'OSM ID',
    width: 120,
    valueGetter: (_, feature) =>
      feature.properties.__action ? feature.id : '',
    renderCell: (cell) => (
      <Link href={osmIdToLink(cell.value)} target="_blank" rel="noreferrer">
        {cell.value}
      </Link>
    ),
  },
  {
    field: 'type',
    headerName: 'Type',
    width: 50,
    valueGetter: (_, feature) => !!feature.properties.__action,
    renderCell: (cell) => (cell.value ? EDIT : ADD),
  },
  {
    field: 'layer',
    headerName: 'Layer',
    width: 120,
    // @ts-expect-error -- unofficial field
    valueGetter: (_, feature) => feature.__hack__.layer,
  },
  {
    field: 'properties',
    headerName: 'Suggested Changes',
    width: 700,
    sortable: false,
    renderCell: (cell) =>
      Object.entries(cell.value)
        .filter(([key]) => !key.startsWith('__'))
        .map(([key, value], index) => (
          <span key={key}>
            {index ? ' + ' : ''}
            <code>
              {key}={value as string}
            </code>
          </span>
        )),
  },
];
const LeftSide = memo<{ onSelect(selected: (string | number)[]): void }>(
  ({ onSelect }) => {
    const data = useContext(DataContext);

    const allStats = useMemo(() => {
      const totals = getAllStats(data);
      const total = Object.values(totals).reduce((a, b) => a + b, 0);
      const percent = { ...totals };
      for (const k in percent) {
        // @ts-expect-error -- for...in types
        percent[k] = `${((percent[k] / total) * 100).toFixed(2)}%`;
      }
      return { totals, percent };
    }, [data]);

    return (
      <div style={{ width: '50vw' }}>
        <div className="flex">
          <BigNumber
            colour="#cc3232"
            mainStat={allStats.totals.addCount}
            subStat={allStats.percent.addCount}
            label="Missing"
          />
          <BigNumber
            colour="#e7b416"
            mainStat={allStats.totals.editCount}
            subStat={allStats.percent.editCount}
            label="Errors"
          />
          <BigNumber
            colour="#2dc937"
            mainStat={allStats.totals.okayCount}
            subStat={allStats.percent.okayCount}
            label="Perfect"
          />
        </div>
        <DataGrid
          rows={data.features}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 20 } },
          }}
          onRowSelectionModelChange={onSelect}
          pageSizeOptions={[20, 50, 100, 500]}
          checkboxSelection
          disableRowSelectionOnClick
          autoHeight={false}
          style={{ height: 'calc(100vh - 69px - 120px)' }}
        />
      </div>
    );
  },
);
LeftSide.displayName = 'LeftSide';

const LazyPopup: React.FC<{
  feature: OsmPatchFeature;
  lat: number;
  lng: number;
}> = ({ feature, lat, lng }) => {
  // @ts-expect-error -- unofficial field
  const nzgbRef: string = feature.__hack__.ref;
  // @ts-expect-error -- unofficial field
  const layer: string = feature.__hack__.layer;

  const isEdit = !!feature.properties.__action;

  return (
    <>
      {layer} |{' '}
      <Link
        href={`https://gazetteer.linz.govt.nz/place/${nzgbRef}`}
        target="_blank"
        rel="noreferrer"
      >
        {nzgbRef}
      </Link>{' '}
      |{' '}
      {isEdit ? (
        <Link
          href={osmIdToLink(feature.id as string)}
          target="_blank"
          rel="noreferrer"
        >
          {feature.id}
        </Link>
      ) : (
        <Link
          href={`https://kyle.kiwi/iD/#map=18/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
        >
          <span className="red">Not in OSM</span>
        </Link>
      )}
      <pre>
        {Object.entries(feature.properties)
          .filter(([key]) => !key.startsWith('__'))
          .map(([key, _value]) => {
            const value = _value as string;
            return (
              <div key={key}>
                {key === 'name' && isEdit ? (
                  <span className="red">{key}</span>
                ) : (
                  key
                )}
                =
                {key.endsWith('wikidata') ? (
                  <a
                    href={`https://www.wikidata.org/wiki/${value}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {value}
                  </a>
                ) : (
                  value
                )}
              </div>
            );
          })}
      </pre>
    </>
  );
};

export const Home: React.FC = () => {
  const data = useContext(DataContext);
  const [selected, setSelected] = useState<(string | number)[]>([]);

  const filtered = useMemo(
    () => data.features.filter((feature) => selected.includes(feature.id!)),
    [data, selected],
  );

  const exportSelection = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toExport = structuredClone<any>(data);
    delete toExport.stats;
    delete toExport.__hack__;

    const exportId = `export-${Math.round(Math.random() * 1e5)}`;
    download(
      exportId + FILE_EXTN,
      JSON.stringify(
        {
          ...toExport,
          features: filtered.map((feature) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cloned = structuredClone<any>(feature);
            delete cloned.__hack__;
            return cloned;
          }),
        },
        null,
        2,
      ),
    );
  }, [data, filtered]);

  return (
    <div className="flex">
      {selected.length ? (
        <div className="over-map">
          <Button variant="contained" onClick={exportSelection}>
            Export {selected.length} features
          </Button>
        </div>
      ) : (
        <Alert severity="info" className="over-map">
          First select some data in the table
        </Alert>
      )}
      <LeftSide onSelect={setSelected} />
      <MapContainer
        zoom={6}
        center={[-40.905, 173.167]}
        scrollWheelZoom
        zoomSnap={0}
        zoomDelta={0.2}
        maxZoom={23}
        style={{ width: '50vw', height: 'calc(100vh - 69px)' }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={23}
          attribution='<a href="https://osm.org/copyright">&copy; OpenStreetMap contributors</a>'
        />
        <MarkerClusterGroup>
          {filtered.map((feature) => {
            const [lng, lat] =
              feature.geometry.type === 'Point'
                ? (feature.geometry.coordinates as [number, number])
                : [0, 0]; // can never happen

            return (
              <Marker key={feature.id} position={[lat, lng]}>
                <Popup>
                  <LazyPopup feature={feature} lat={lat} lng={lng} />
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};
