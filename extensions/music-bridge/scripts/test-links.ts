/**
 * Writes the links of TESTING.md: for each platform Music Bridge redirects from, a track and an album on that platform,
 * different for each, to tell at a glance where a link came from.
 *
 * The tracks are the Deezer chart (Top Worldwide, from the public Deezer API), in order: the first to the first platform,
 * the second to the second, and so on; a platform without the track gets the next one. The albums are the Deezer album
 * chart, the same way. Their links on the platforms come from the Music Bridge redirect service, which asks the Odesli
 * API (it needs a key, the service has one). Odesli allows 10 requests a minute: the script waits between them, so it
 * takes about two minutes.
 *
 * Usage: pnpm test-links
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const FILE = resolve(import.meta.dirname, '../TESTING.md');
const REDIRECT_SERVICE_URL = 'https://music-bridge-redirect.smndhm.workers.dev/';
// Top Worldwide, as on the store screenshots (scripts/screenshots.ts), and the album chart
const TRACKS = 'https://api.deezer.com/playlist/3155776842/tracks?limit=50';
const ALBUMS = 'https://api.deezer.com/chart/0/albums?limit=50';
const START = '<!-- test-links:start -->';
const END = '<!-- test-links:end -->';

// The platforms Music Bridge redirects from, with their key in the redirect service (Odesli's)
const PLATFORMS = [
  { platform: 'Spotify', key: 'spotify' },
  { platform: 'Deezer', key: 'deezer' },
  { platform: 'Apple Music', key: 'appleMusic' },
  { platform: 'YouTube Music', key: 'youtubeMusic' },
  { platform: 'Tidal', key: 'tidal' },
  { platform: 'Amazon Music', key: 'amazonMusic' },
  { platform: 'Pandora', key: 'pandora' },
] as const;

/** A track or an album */
interface DeezerItem {
  title: string;
  link: string;
  artist: { name: string };
}

const sleep = (ms: number) => new Promise(done => setTimeout(done, ms));

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return (await response.json()) as T;
}

let lastCall = 0;

/** The link of a Deezer page on a platform, where the redirect service sends it, or undefined when it has none */
async function link(deezerUrl: string, platform: string): Promise<string | undefined> {
  if (platform === 'deezer') return deezerUrl;
  // Odesli allows 10 requests a minute
  await sleep(Math.max(0, lastCall + 6500 - Date.now()));
  lastCall = Date.now();
  const url = `${REDIRECT_SERVICE_URL}?${new URLSearchParams({ url: deezerUrl, platform })}`;
  const response = await fetch(url, { redirect: 'manual' });
  if (response.status === 404) return undefined;
  const location = response.headers.get('location');
  if (response.status !== 302 || !location) throw new Error(`${url}: ${response.status}`);
  return location;
}

/** The link on a platform of the first item of a chart it has, taken out of the chart, as a table cell */
async function next(chart: DeezerItem[], platform: string, key: string): Promise<string> {
  for (let item = chart.shift(); item; item = chart.shift()) {
    const url = await link(item.link, key);
    console.log(`${platform}: ${item.artist.name}, ${item.title}: ${url ?? 'not found'}`);
    if (url) return `[${`${item.artist.name}, ${item.title}`.replaceAll('|', '\\|')}](${url})`;
  }
  return 'not found';
}

const [tracks, albums] = await Promise.all([TRACKS, ALBUMS].map(async url => (await json<{ data: DeezerItem[] }>(url)).data));
const rows: string[] = [];
for (const { platform, key } of PLATFORMS) {
  rows.push(`| ${platform} | ${await next(tracks!, platform, key)} | ${await next(albums!, platform, key)} |`);
}

const table = ['| Platform | Track | Album |', '| --- | --- | --- |', ...rows].join('\n');
const text = await readFile(FILE, 'utf8');
await writeFile(FILE, `${text.slice(0, text.indexOf(START) + START.length)}\n\n${table}\n\n${text.slice(text.indexOf(END))}`);
console.log(`${FILE}: links updated`);
