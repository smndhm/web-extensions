/**
 * Writes the links of TESTING.md: for each platform Music Bridge redirects from, a track and an album on that platform,
 * different for each, to tell at a glance where a link came from.
 *
 * The tracks are the Deezer chart (Top Worldwide, from the public Deezer API), in order: the first to the first platform,
 * the second to the second, and so on; a platform without the track gets the next one. The albums are the Deezer album
 * chart, the same way. Their links on the platforms come from the Music Bridge redirect service, which asks the Odesli
 * API (it needs a key, the service has one), for France (Pandora: the United States, where it only exists). Odesli
 * allows 10 requests a minute: the script waits between them, so it takes about two minutes.
 *
 * With --check, it writes nothing: it asks the redirect service where each link of TESTING.md goes on every other
 * platform, and fails when the service answers anything but a redirect or "not on this platform" (404).
 *
 * Usage: pnpm test-links
 *        pnpm test-links --check
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const FILE = resolve(import.meta.dirname, '../TESTING.md');
const REDIRECT_SERVICE_URL = 'https://music-bridge.bricodage.fr/';
// Marks the calls as tests in the redirect service's logs, run from GitHub or from a computer
const TEST_HEADERS = { 'User-Agent': 'music-bridge-test (test-links)' };
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
// The platforms Music Bridge redirects to: the ones above, and YouTube and SoundCloud
const TARGETS = [...PLATFORMS, { platform: 'YouTube', key: 'youtube' }, { platform: 'SoundCloud', key: 'soundcloud' }];

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
const asked = new Set<string>();

/** The redirect service's answer for a link and a platform, in France (Pandora: the United States) */
async function redirect(source: string, platform: string): Promise<{ status: number; location?: string }> {
  // The service runs where it is called from, in the United States for GitHub's runners: ask for France's links
  const country = platform === 'pandora' || source.includes('pandora.com') ? 'US' : 'FR';
  // The service asks Odesli once per link and country, which allows 10 requests a minute, and keeps its answer
  if (!asked.has(`${source} ${country}`)) {
    await sleep(Math.max(0, lastCall + 6500 - Date.now()));
    lastCall = Date.now();
    asked.add(`${source} ${country}`);
  }
  const url = `${REDIRECT_SERVICE_URL}?${new URLSearchParams({ url: source, platform, country })}`;
  let response = await fetch(url, { redirect: 'manual', headers: TEST_HEADERS });
  if (response.status === 429) {
    await sleep(60_000);
    lastCall = Date.now();
    response = await fetch(url, { redirect: 'manual', headers: TEST_HEADERS });
  }
  return { status: response.status, location: response.headers.get('location') ?? undefined };
}

/** The link of a Deezer page on a platform, where the redirect service sends it, or undefined when it has none */
async function link(deezerUrl: string, platform: string): Promise<string | undefined> {
  if (platform === 'deezer') return deezerUrl;
  const { status, location } = await redirect(deezerUrl, platform);
  if (status === 404) return undefined;
  if (status !== 302 || !location) throw new Error(`${deezerUrl} on ${platform}: ${status}`);
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

/** Asks the redirect service where each link of TESTING.md goes on every other platform */
async function check(): Promise<void> {
  const text = await readFile(FILE, 'utf8');
  const links = text
    .slice(text.indexOf(START), text.indexOf(END))
    .split('\n')
    .flatMap(line => {
      const from = PLATFORMS.find(({ platform }) => line.startsWith(`| ${platform} `));
      return from ? [...line.matchAll(/\[([^\]]+)\]\((https:[^)\s]+)\)/g)].map(([, label, url]) => ({ from, label: label!, url: url! })) : [];
    });
  let failures = 0;
  for (const { from, label, url } of links) {
    console.log(`\n${from.platform}: ${label}\n${url}`);
    for (const { platform, key } of TARGETS.filter(target => target.key !== from.key)) {
      const { status, location } = await redirect(url, key);
      const ok = (status === 302 && location) || status === 404;
      if (!ok) failures++;
      console.log(`  ${ok ? '✓' : '✗'} ${platform}: ${status === 302 ? location : status === 404 ? 'not on this platform' : `error ${status}`}`);
    }
  }
  console.log(`\n${links.length} links, ${failures} errors`);
  if (failures) process.exitCode = 1;
}

if (parseArgs({ options: { check: { type: 'boolean' } } }).values.check) {
  await check();
} else {
  await write();
}

/** Writes new links in TESTING.md */
async function write(): Promise<void> {
  const [tracks, albums] = await Promise.all([TRACKS, ALBUMS].map(async url => (await json<{ data: DeezerItem[] }>(url)).data));
  const rows: string[] = [];
  for (const { platform, key } of PLATFORMS) {
    rows.push(`| ${platform} | ${await next(tracks!, platform, key)} | ${await next(albums!, platform, key)} |`);
  }

  const table = ['| Platform | Track | Album |', '| --- | --- | --- |', ...rows].join('\n');
  const text = await readFile(FILE, 'utf8');
  await writeFile(FILE, `${text.slice(0, text.indexOf(START) + START.length)}\n\n${table}\n\n${text.slice(text.indexOf(END))}`);
  console.log(`${FILE}: links updated`);
}
