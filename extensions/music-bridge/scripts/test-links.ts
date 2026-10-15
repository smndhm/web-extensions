/**
 * Writes the links of TESTING.md: for each platform Music Bridge redirects from, a track and its album on that
 * platform, a different song for each (named after the platform, to tell at a glance where a link came from).
 *
 * Each song is found with the public Deezer API, then its links on the other platforms with the Music Bridge redirect
 * service, which asks the Odesli API (it needs a key, the service has one). A platform without the song keeps
 * "not found". Odesli allows 10 requests a minute: the script waits between them, so it takes about two minutes.
 *
 * Usage: pnpm test-links
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const FILE = resolve(import.meta.dirname, '../TESTING.md');
const REDIRECT_SERVICE_URL = 'https://music-bridge-redirect.smndhm.workers.dev/';
const START = '<!-- test-links:start -->';
const END = '<!-- test-links:end -->';

// The platforms Music Bridge redirects from, with their key in the redirect service (Odesli's), and a song named after each
const SONGS = [
  { platform: 'Spotify', key: 'spotify', artist: 'Jennifer Hudson', title: 'Spotlight' },
  { platform: 'Deezer', key: 'deezer', artist: 'Goo Goo Dolls', title: 'Dizzy' },
  { platform: 'Apple Music', key: 'appleMusic', artist: 'Charli xcx', title: 'Apple' },
  { platform: 'YouTube Music', key: 'youtubeMusic', artist: 'The Buggles', title: 'Video Killed the Radio Star' },
  { platform: 'Tidal', key: 'tidal', artist: 'Portugal. The Man', title: 'Tidal Wave' },
  { platform: 'Amazon Music', key: 'amazonMusic', artist: 'Gojira', title: 'Amazonia' },
  { platform: 'Pandora', key: 'pandora', artist: 'Orchestral Manoeuvres In The Dark', title: "Pandora's Box" },
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

/** Case and accent insensitive comparison */
const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;

/** The song on Deezer: among the results of a search for its artist and title, the first by that artist, or undefined */
async function deezerTrack(artist: string, title: string): Promise<DeezerTrack | undefined> {
  const { data } = await json<{ data: DeezerTrack[] }>(`https://api.deezer.com/search?q=${encodeURIComponent(`${artist} ${title}`)}&limit=25`);
  return data.find(track => same(track.artist.name, artist)) ?? data[0];
}

let lastCall = 0;

/** The link of a Deezer page on another platform, where the redirect service sends it, or undefined when it has none */
async function link(deezerUrl: string, platform: string): Promise<string | undefined> {
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

const cell = (label: string, url: string | undefined) => {
  const text = label.replaceAll('|', '\\|');
  return url ? `[${text}](${url})` : `${text}: not found`;
};

const rows: string[] = [];
for (const { platform, key, artist, title } of SONGS) {
  const track = await deezerTrack(artist, title);
  if (!track) {
    console.log(`${platform}: ${artist}, ${title} not found on Deezer`);
    rows.push(`| ${platform} | ${cell(`${artist}, ${title}`, undefined)} | |`);
    continue;
  }
  const albumUrl = `https://www.deezer.com/album/${track.album.id}`;
  const [trackLink, albumLink] = key === 'deezer' ? [track.link, albumUrl] : [await link(track.link, key), await link(albumUrl, key)];
  console.log(`${platform}: ${track.artist.name}, ${track.title}: ${trackLink ?? 'no track link'}, ${albumLink ?? 'no album link'}`);
  rows.push(`| ${platform} | ${cell(`${track.artist.name}, ${track.title}`, trackLink)} | ${cell(`${track.artist.name}, ${track.album.title}`, albumLink)} |`);
}

const table = ['| Platform | Track | Album |', '| --- | --- | --- |', ...rows].join('\n');
const text = await readFile(FILE, 'utf8');
await writeFile(FILE, `${text.slice(0, text.indexOf(START) + START.length)}\n\n${table}\n\n${text.slice(text.indexOf(END))}`);
console.log(`${FILE}: links updated`);
