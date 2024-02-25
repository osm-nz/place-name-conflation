import { Fragment } from 'react';
import { osmPathFilePath } from '../core';
import { NZGB_NAME_TYPES, type NameType } from '../data';
import type { OsmPatchFile, StatsFile } from '../types';

const { format: formatNumber } = new Intl.NumberFormat('en-NZ');

type Stats = OsmPatchFile['stats'];

const ZERO: Stats = {
  addNodeCount: 0,
  addWayCount: 0,
  editCount: 0,
  okayCount: 0,
  percentageAnt: 0,
};

const total = (stats: Stats) =>
  stats.addNodeCount + stats.addWayCount + stats.editCount + stats.okayCount;

const ProgressBar: React.FC<{ stats: Stats }> = ({ stats }) => {
  const okay = +((stats.okayCount / total(stats)) * 100).toFixed(3);
  const edit = +((stats.editCount / total(stats)) * 100).toFixed(3);
  const add = +(
    ((stats.addNodeCount + stats.addWayCount) / total(stats)) *
    100
  ).toFixed(3);

  return (
    <div className="progress-bar">
      <div style={{ width: `${okay}%` }}>{formatNumber(stats.okayCount)}</div>
      <div style={{ width: `${edit}%` }}>{formatNumber(stats.editCount)}</div>
      <div style={{ width: `${add}%` }}>
        {/* eslint-disable-next-line no-nested-ternary */}
        {add === 0 ? (
          ''
        ) : stats.addWayCount === 0 ? (
          formatNumber(stats.addNodeCount)
        ) : (
          <>
            {formatNumber(stats.addNodeCount)} +{' '}
            {formatNumber(stats.addWayCount)}
          </>
        )}
      </div>
    </div>
  );
};

const RenderKV: React.FC<{
  tags: Record<string, string>;
  renderBraces?: boolean;
}> = ({ tags, renderBraces }) => {
  const multiple = Object.keys(tags).length > 1;
  return (
    <>
      {renderBraces && multiple && '('}
      {Object.entries(tags).map(([k, v], index) => (
        <Fragment key={k}>
          {!!index && ' + '}
          <code>
            <a href={`https://wiki.osm.org/Key:${k}`}>{k}</a>=
            <a href={`https://wiki.osm.org/Tag:${k}=${v}`}>{v}</a>
          </code>
        </Fragment>
      ))}
      {renderBraces && multiple && ')'}
    </>
  );
};

const Tags: React.FC<{ type: NameType }> = ({ type }) => {
  const object = NZGB_NAME_TYPES[type];
  if (typeof object === 'symbol') return null;

  if ('tags' in object) {
    return <RenderKV tags={{ ...object.tags, ...object.addTags }} />;
  }

  return (
    <>
      <RenderKV tags={object.onLandTags} renderBraces />
      or <RenderKV tags={object.subseaTags} renderBraces />
    </>
  );
};

export const Report: React.FC<{ data: StatsFile; css: string }> = ({
  data,
  css,
}) => {
  const sorted = Object.entries(data).sort(
    ([, a], [, b]) => (b ? total(b) : 0) - (a ? total(a) : 0),
  );

  // generate summary of totals
  const allStats = { ...ZERO };
  for (const item of Object.values(data)) {
    if (item) {
      for (const _key in item) {
        const key = _key as keyof Stats;
        allStats[key] += item[key];
      }
    }
  }

  // generate summary of layers
  const layerCount = { ...ZERO };
  for (const _layerName in data) {
    const layerName = _layerName as keyof typeof data;
    const stats = data[layerName];

    if (stats) {
      const remaining =
        stats.addNodeCount + stats.addWayCount + stats.editCount;
      if (remaining === 0) {
        layerCount.okayCount += 1; // complete
      } else if (remaining / stats.okayCount > 0.9) {
        layerCount.editCount += 1; // >90% complete
      } else {
        layerCount.addNodeCount += 1; // incomplete
      }
    } else {
      // layerCount.addNodeCount += 1; // skipped
    }
  }

  return (
    <html lang="en-NZ">
      <head>
        <title>Place Name Conflation report</title>
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <div className="summary">
          Total: <ProgressBar stats={allStats} />
          Layers: <ProgressBar stats={layerCount} />
        </div>
        <table>
          <thead>
            <tr>
              <td>Progress</td>
              <td>Type</td>
              <td>Count</td>
              <td>🇦🇶</td>
              <td>Tagging</td>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([_type, stats]) => {
              const type = _type as NameType;
              const done =
                stats &&
                Math.floor((stats.okayCount / total(stats)) * 100) === 100;
              return (
                <tr key={type}>
                  <td>
                    {stats ? <ProgressBar stats={stats} /> : <em>Skipped</em>}
                  </td>
                  <td>
                    {stats && !done ? (
                      <a
                        href={osmPathFilePath(type)}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {type}
                      </a>
                    ) : (
                      type
                    )}
                  </td>
                  <td>{stats && formatNumber(total(stats))}</td>
                  <td>
                    {stats?.percentageAnt
                      ? `${formatNumber(stats.percentageAnt)}%`
                      : null}
                  </td>
                  {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- bug with the rule */}
                  <td>
                    <Tags type={type} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </body>
    </html>
  );
};
