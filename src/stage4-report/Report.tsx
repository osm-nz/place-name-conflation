import React, { Fragment } from 'react';
import { osmPathFilePath } from '../core';
import { NameType, NZGB_NAME_TYPES } from '../data';
import { OsmPatchFile, StatsFile } from '../types';

const { format: formatNumber } = new Intl.NumberFormat('en-NZ');

const total = (stats: OsmPatchFile['stats']) =>
  stats.addNodeCount + stats.addWayCount + stats.editCount + stats.okayCount;

const ProgressBar: React.FC<{ stats: OsmPatchFile['stats'] }> = ({ stats }) => {
  const okay = Math.floor((stats.okayCount / total(stats)) * 100);
  const edit = Math.floor((stats.editCount / total(stats)) * 100);
  const add = 100 - okay - edit;

  return (
    <div className="progress-bar">
      <div style={{ width: `${okay}%` }}>{formatNumber(stats.okayCount)}</div>
      <div style={{ width: `${edit}%` }}>{formatNumber(stats.editCount)}</div>
      <div style={{ width: `${add}%` }}>
        {/* eslint-disable-next-line no-nested-ternary */}
        {add === 0 ? (
          0
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
      {Object.entries(tags).map(([k, v], i) => (
        <Fragment key={k}>
          {!!i && ' + '}
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
  const obj = NZGB_NAME_TYPES[type];
  if (typeof obj === 'symbol') return null;

  if ('tags' in obj) {
    return <RenderKV tags={{ ...obj.tags, ...obj.addTags }} />;
  }

  return (
    <>
      <RenderKV tags={obj.onLandTags} renderBraces />
      or <RenderKV tags={obj.subseaTags} renderBraces />
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
  return (
    <html lang="en-NZ">
      <head>
        <title>Place Name Conflation report</title>
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <td>Progress</td>
              <td>Type</td>
              <td>Count</td>
              <td>Tagging</td>
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
                  <td>
                    {stats ? (
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
