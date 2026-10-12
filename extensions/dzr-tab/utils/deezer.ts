/**
 * Tracks from the Deezer API, cached for an hour in the extension storage.
 */

export const DEEZER_API = 'https://api.deezer.com/';
// Registered Deezer application: added to the links to deezer.com
export const APP_ID = 216424;
const LIMIT = 50;
// Top playlists: tracks are picked from one of the first ones
const SOURCE = 'chart/0/playlists';
const PLAYLISTS = 5;
export const CACHE_TTL = 60 * 60 * 1000; // 1 h

export interface DeezerTrack {
  type: 'track';
  title: string;
  link: string;
  artist: { name: string; link: string };
  album: { id: number; cover_big?: string };
}

interface DeezerPlaylist {
  type: 'playlist';
  id: number;
}

interface TracksCache {
  tracks: DeezerTrack[];
  fetchedAt: number;
}

export const tracksCache = storage.defineItem<TracksCache>('local:tracks');

async function getData<T>(path: string): Promise<T[]> {
  const response = await fetch(`${DEEZER_API}${path}${path.includes('?') ? '&' : '?'}limit=${LIMIT}`);
  if (!response.ok) throw new Error(`Deezer API: HTTP ${response.status} for ${path}`);
  // The Deezer API answers errors with a 200 and an error object
  const body = (await response.json()) as { data?: T[]; error?: { message: string } };
  if (body.error) throw new Error(`Deezer API: ${body.error.message} for ${path}`);
  return body.data ?? [];
}

export const random = <T>(items: readonly T[]): T | undefined => items[Math.floor(Math.random() * items.length)];

/** Tracks of one of the top playlists */
export async function fetchTracks(): Promise<DeezerTrack[]> {
  const items = await getData<DeezerTrack | DeezerPlaylist>(SOURCE);
  if (items[0]?.type !== 'playlist') return items.filter(item => item.type === 'track');
  const playlist = random(items.slice(0, PLAYLISTS) as DeezerPlaylist[])!;
  return getData<DeezerTrack>(`playlist/${playlist.id}/tracks`);
}

/** Tracks from the cache, refreshed when older than an hour; the stale cache when Deezer cannot be reached */
export async function loadTracks(now = Date.now()): Promise<DeezerTrack[]> {
  const cache = await tracksCache.getValue();
  if (cache?.tracks.length && now - cache.fetchedAt < CACHE_TTL) return cache.tracks;
  try {
    const tracks = await fetchTracks();
    if (tracks.length) {
      await tracksCache.setValue({ tracks, fetchedAt: now });
      return tracks;
    }
  } catch (error) {
    console.warn('[Deezer Tab]', error);
  }
  return cache?.tracks ?? [];
}

/** Cover of the track's album, from the API image endpoint when the track has none */
export const coverUrl = ({ album }: DeezerTrack) => album.cover_big || `${DEEZER_API}album/${album.id}/image?size=500`;

/** A deezer.com link attributed to the extension */
export function deezerLink(link: string) {
  const url = new URL(link);
  url.searchParams.set('app_id', String(APP_ID));
  return url.href;
}

/** Remove what versions up to 2.1 stored: a never used identifier, and a cache split between storage and localStorage */
export async function removeLegacyData() {
  await browser.storage.sync.remove(['api_call', 'last_call', 'uuid']);
  localStorage.removeItem('dzData');
  localStorage.removeItem('uuid');
}
