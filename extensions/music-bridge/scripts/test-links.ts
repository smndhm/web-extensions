/**
 * Writes the links of TESTING.md: for each platform Music Bridge redirects from, a track and its album on that
 * platform, a different song for each (named after the platform, to tell at a glance where a link came from).
 *
 * Each song is found with the public iTunes Search API (the Deezer API hides much of its catalog from the United States,
 * where the workflow runs), then its links on the other platforms with the Music Bridge redirect
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
  { platform: 'Deezer', key: 'deezer', artist: 'The Goo Goo Dolls', title: 'Dizzy' },
  { platform: 'Apple Music', key: 'appleMusic', artist: 'Charli xcx', title: 'Apple' },
  { platform: 'YouTube Music', key: 'youtubeMusic', artist: 'The Buggles', title: 'Video Killed the Radio Star' },
  { platform: 'Tidal', key: 'tidal', artist: 'Portugal. The Man', title: 'Tidal Wave' },
  { platform: 'Amazon Music', key: 'amazonMusic', artist: 'Gojira', title: 'Amazonia' },
  { platform: 'Pandora', key: 'pandora', artist: 'Orchestral Manoeuvres In The Dark', title: "Pandora's Box" },
] as const;

interface ITunesTrack {
  artistName: string;
  trackName: string;
  collectionName: string;
  trackViewUrl: string;
  collectionViewUrl: string;
}

const sleep = (ms: number) => new Promise(done => setTimeout(done, ms));

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return (await response.json()) as T;
}

/** Case and accent insensitive comparison */
const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0;

/**
 * The song on Apple Music: among the results of a search for its artist and title, its editions by that artist with that
 * exact title (not a remix or a live version), at most 4, else the first by that artist, else the first
 */
async function appleTracks(artist: string, title: string): Promise<ITunesTrack[]> {
  const { results } = await json<{ results: ITunesTrack[] }>(
    `https://itunes.apple.com/search?${new URLSearchParams({ term: `${artist} ${title}`, entity: 'song', country: 'us', limit: '50' })}`,
  );
  const byArtist = results.filter(track => same(track.artistName, artist));
  const exact = byArtist.filter(track => same(track.trackName, title)).slice(0, 4);
  const fallback = byArtist[0] ?? results[0];
  return exact.length ? exact : fallback ? [fallback] : [];
}

/** The album page, without the track iTunes adds to it */
const albumUrl = (track: ITunesTrack) => track.collectionViewUrl.split('?')[0]!;

let lastCall = 0;

/** The link of an Apple Music page on another platform, where the redirect service sends it, or undefined when it has none */
async function link(appleUrl: string, platform: string): Promise<string | undefined> {
  // Odesli allows 10 requests a minute
  await sleep(Math.max(0, lastCall + 6500 - Date.now()));
  lastCall = Date.now();
  const url = `${REDIRECT_SERVICE_URL}?${new URLSearchParams({ url: appleUrl, platform })}`;
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
  const tracks = await appleTracks(artist, title);
  if (!tracks.length) {
    console.log(`${platform}: ${artist}, ${title} not found on Apple Music`);
    rows.push(`| ${platform} | ${cell(`${artist}, ${title}`, undefined)} | |`);
    continue;
  }
  // The first edition the platform has
  let [track] = tracks as [ITunesTrack];
  let trackLink: string | undefined;
  for (const edition of tracks) {
    trackLink = key === 'appleMusic' ? edition.trackViewUrl : await link(edition.trackViewUrl, key);
    track = edition;
    if (trackLink) break;
  }
  const albumLink = key === 'appleMusic' ? albumUrl(track) : await link(albumUrl(track), key);
  console.log(`${platform}: ${track.artistName}, ${track.trackName}: ${trackLink ?? 'no track link'}, ${albumLink ?? 'no album link'}`);
  rows.push(`| ${platform} | ${cell(`${track.artistName}, ${track.trackName}`, trackLink)} | ${cell(`${track.artistName}, ${track.collectionName}`, albumLink)} |`);
}

const table = ['| Platform | Track | Album |', '| --- | --- | --- |', ...rows].join('\n');
const text = await readFile(FILE, 'utf8');
await writeFile(FILE, `${text.slice(0, text.indexOf(START) + START.length)}\n\n${table}\n\n${text.slice(text.indexOf(END))}`);
console.log(`${FILE}: links updated`);
