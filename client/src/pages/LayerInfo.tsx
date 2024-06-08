import { Fragment, useContext, useMemo } from 'react';
import type { NameType, Output, Stats } from '../types';
import { DataContext } from '../context';

const { format: formatNumber } = new Intl.NumberFormat('en-NZ');

const ZERO: Stats = {
  addCount: 0,
  editCount: 0,
  okayCount: 0,
};

const total = (stats: Stats) =>
  stats.addCount + stats.editCount + stats.okayCount;

const ProgressBar: React.FC<{ stats: Stats }> = ({ stats }) => {
  const okay = +((stats.okayCount / total(stats)) * 100).toFixed(3);
  const edit = +((stats.editCount / total(stats)) * 100).toFixed(3);
  const add = +((stats.addCount / total(stats)) * 100).toFixed(3);

  return (
    <div className="progress-bar">
      <div style={{ width: `${okay}%` }}>{formatNumber(stats.okayCount)}</div>
      <div style={{ width: `${edit}%` }}>{formatNumber(stats.editCount)}</div>
      <div style={{ width: `${add}%` }}>{formatNumber(stats.addCount)}</div>
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
            <a href={`https://osm.wiki/Key:${k}`}>{k}</a>=
            <a href={`https://osm.wiki/Tag:${k}=${v}`}>{v}</a>
          </code>
        </Fragment>
      ))}
      {renderBraces && multiple && ')'}
    </>
  );
};

const Tags: React.FC<{
  type: NameType;
  data: Output;
  acceptTags?: boolean;
}> = ({ type, data, acceptTags }) => {
  const object = data.__hack__.presets[type];
  if (typeof object === 'symbol') return null;

  if (acceptTags) {
    return object.acceptTags?.flatMap((tags, index) => [
      index ? ' or ' : '',
      // eslint-disable-next-line react/no-array-index-key
      <RenderKV key={index} tags={tags} renderBraces />,
    ]);
  }

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

export const getAllStats = (data: Output) => {
  const allStats = { ...ZERO };
  for (const item of Object.values(data.stats)) {
    if (item) {
      for (const _key in item) {
        const key = _key as keyof Stats;
        allStats[key] += item[key];
      }
    }
  }
  return allStats;
};

export const LayerInfo: React.FC = () => {
  const data = useContext(DataContext);

  const sorted = Object.entries(data.stats).sort(
    ([, a], [, b]) => (b ? total(b) : 0) - (a ? total(a) : 0),
  );

  // generate summary of totals
  const allStats = useMemo(() => getAllStats(data), [data]);

  // generate summary of layers
  const layerCount = { ...ZERO };
  for (const _layerName in data.stats) {
    const layerName = _layerName as NameType;
    const stats = data.stats[layerName];

    if (stats) {
      const remaining = stats.addCount + stats.editCount;
      if (remaining === 0) {
        layerCount.okayCount += 1; // complete
      } else if (remaining / (stats.okayCount + remaining) < 0.1) {
        layerCount.editCount += 1; // >90% complete
      } else {
        layerCount.addCount += 1; // incomplete
      }
    } else {
      // layerCount.addNodeCount += 1; // skipped
    }
  }

  return (
    <main style={{ margin: 16 }}>
      <div className="summary">
        Total: <ProgressBar stats={allStats} />
        Layers: <ProgressBar stats={layerCount} />
      </div>
      <table className="layers">
        <thead>
          <tr>
            <td>Progress</td>
            <td>Type</td>
            <td>Count</td>
            <td>Tagging</td>
            <td>Alternative Tags</td>
          </tr>
        </thead>
        <tbody>
          {sorted.map(([_type, stats]) => {
            const type = _type as NameType;
            return (
              <tr key={type}>
                <td>
                  {stats ? <ProgressBar stats={stats} /> : <em>Skipped</em>}
                </td>
                <td>{type}</td>
                <td>{stats && formatNumber(total(stats))}</td>
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- bug with the rule */}
                <td>
                  <Tags type={type} data={data} />
                </td>
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- bug with the rule */}
                <td>
                  <Tags type={type} data={data} acceptTags />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
};
