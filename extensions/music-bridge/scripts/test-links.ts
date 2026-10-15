/**
 * Writes the links of TESTING.md: for each platform Music Bridge redirects from, a track and its album on that
 * platform, a different song for each, to tell at a glance where a link came from.
 *
 * The songs are the Deezer chart (Top Worldwide, from the public Deezer API), in order: the first to the first platform,
 * the second to the second, and so on; a platform without the song or its album gets the next one. Their links on the
 * platforms come from the Music Bridge redirect service, which asks the Odesli API (it needs a key, the service has
 * one). Odesli allows 10 requests a minute: the script waits between them, so it takes about two minutes.
 *
 * Usage: pnpm test-links
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const FILE = resolve(import.meta.dirname, '../TESTING.md');
const REDIRECT_SERVICE_URL = 'https://music-bridge-redirect.smndhm.workers.dev/';
// Top Worldwide, as on the store screenshots (scripts/screenshots.ts)
const CHART = 'https://api.deezer.com/playlist/3155776842/tracks?limit=50';
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

interface DeezerTrack {
  title: string;
  link: string;
  artist: { name: string };
  album: { id: number; title: string };
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

const cell = (label: string, url: string) => `[${label.replaceAll('|', '\\|')}](${url})`;

const chart = (await json<{ data: DeezerTrack[] }>(CHART)).data;
const rows: string[] = [];
for (const { platform, key } of PLATFORMS) {
  let row = `| ${platform} | not found | |`;
  for (let track = chart.shift(); track; track = chart.shift()) {
    const trackLink = await link(track.link, key);
    const albumLink = trackLink && (await link(`https://www.deezer.com/album/${track.album.id}`, key));
    console.log(`${platform}: ${track.artist.name}, ${track.title}: ${trackLink ?? 'no track link'}, ${albumLink ?? 'no album link'}`);
    if (!trackLink || !albumLink) continue;
    row = `| ${platform} | ${cell(`${track.artist.name}, ${track.title}`, trackLink)} | ${cell(`${track.artist.name}, ${track.album.title}`, albumLink)} |`;
    break;
  }
  rows.push(row);
}

const table = ['| Platform | Track | Album |', '| --- | --- | --- |', ...rows].join('\n');
const text = await readFile(FILE, 'utf8');
await writeFile(FILE, `${text.slice(0, text.indexOf(START) + START.length)}\n\n${table}\n\n${text.slice(text.indexOf(END))}`);
console.log(`${FILE}: links updated`);
