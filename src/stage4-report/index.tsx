import ReactDOMServer from 'react-dom/server';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { htmlReport, nzgbIndexPath } from '../core';
import { Report } from './Report';
import { StatsFile } from '../types';

async function main() {
  console.log('Generating report...');
  const stats: StatsFile = JSON.parse(await fs.readFile(nzgbIndexPath, 'utf8'));
  const css = await fs.readFile(join(__dirname, 'report.css'), 'utf8');

  const html = ReactDOMServer.renderToStaticMarkup(
    <Report data={stats} css={css} />,
  );

  await fs.writeFile(htmlReport, `<!doctype html yeet>${html}`);
}

main();
