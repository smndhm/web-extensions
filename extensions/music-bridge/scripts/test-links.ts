/**
 * Writes the links of TESTING.md: for each platform Music Bridge redirects from, a track and its album on that
 * platform, a different song for each (named after the platform, to tell at a glance where a link came from).
 *
 * Each song is found with the public Deezer API, then its links on the other platforms with the Odesli API, the one the
 * redirect service uses. A platform without the song keeps "not found". Odesli allows 10 requests a minute: the script
 * waits between them, so it takes about two minutes.
 *
 * Usage: pnpm test-links
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const FILE = resolve(import.meta.dirname, '../TESTING.md');
const START = '<!-- test-links:start -->';
const END = '<!-- test-links:end -->';

// The platforms Music Bridge redirects from, with their Odesli key, and a song named after each
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

/** The song on Deezer: the first result of a search for its artist and title */
async function deezerTrack(artist: string, title: string): Promise<DeezerTrack> {
  const { data } = await json<{ data: DeezerTrack[] }>(`https://api.deezer.com/search?q=${encodeURIComponent(`artist:"${artist}" track:"${title}"`)}&limit=1`);
  if (!data[0]) throw new Error(`Deezer: ${artist}, ${title} not found`);
  return data[0];
}

let lastOdesliCall = 0;

/** The link of a Deezer page on another platform, from Odesli, or undefined when Odesli has none */
async function odesliLink(deezerUrl: string, key: string): Promise<string | undefined> {
  // 10 requests a minute
  await sleep(Math.max(0, lastOdesliCall + 6500 - Date.now()));
  lastOdesliCall = Date.now();
  // Pandora is only in the United States
  const country = key === 'pandora' ? 'US' : 'FR';
  const { linksByPlatform } = await json<{ linksByPlatform: Record<string, { url: string }> }>(
    `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(deezerUrl)}&userCountry=${country}`,
  );
  return linksByPlatform[key]?.url;
}

const cell = (label: string, url: string | undefined) => {
  const text = label.replaceAll('|', '\\|');
  return url ? `[${text}](${url})` : `${text}: not found`;
};

const rows: string[] = [];
for (const { platform, key, artist, title } of SONGS) {
  const track = await deezerTrack(artist, title);
  const albumUrl = `https://www.deezer.com/album/${track.album.id}`;
  const [trackLink, albumLink] = key === 'deezer' ? [track.link, albumUrl] : [await odesliLink(track.link, key), await odesliLink(albumUrl, key)];
  console.log(`${platform}: ${track.artist.name}, ${track.title}: ${trackLink ?? 'no track link'}, ${albumLink ?? 'no album link'}`);
  rows.push(`| ${platform} | ${cell(`${track.artist.name}, ${track.title}`, trackLink)} | ${cell(`${track.artist.name}, ${track.album.title}`, albumLink)} |`);
}

const table = ['| Platform | Track | Album |', '| --- | --- | --- |', ...rows].join('\n');
const text = await readFile(FILE, 'utf8');
await writeFile(FILE, `${text.slice(0, text.indexOf(START) + START.length)}\n\n${table}\n\n${text.slice(text.indexOf(END))}`);
console.log(`${FILE}: links updated`);
