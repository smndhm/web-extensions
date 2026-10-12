// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { CACHE_TTL, coverUrl, deezerLink, loadTracks, removeLegacyData, tracksCache, type DeezerTrack } from '@/utils/deezer';

const NOW = 1_800_000_000_000;

const track = (id: number, extra: Partial<DeezerTrack> = {}): DeezerTrack => ({
  type: 'track',
  title: `Track ${id}`,
  link: `https://www.deezer.com/track/${id}`,
  artist: { name: 'Artist', link: 'https://www.deezer.com/artist/1' },
  album: { id, cover_big: `https://cdn.test/${id}.jpg` },
  ...extra,
});

const PLAYLISTS = { data: [1, 2, 3, 4, 5, 6].map(id => ({ type: 'playlist', id })) };
const TRACKS = { data: [track(1), track(2)] };

let api: Record<string, unknown>;
const fetchMock = vi.fn(async (input: string | URL) => {
  const url = new URL(input);
  const body = api[url.pathname.slice(1)];
  if (body === undefined) return new Response('', { status: 500 });
  return Response.json(body);
});

beforeEach(() => {
  fakeBrowser.reset();
  api = {};
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('loadTracks', () => {
  it('fetches the tracks of a top playlist and caches them', async () => {
    api['chart/0/playlists'] = PLAYLISTS;
    api['playlist/1/tracks'] = TRACKS;
    expect(await loadTracks(NOW)).toEqual(TRACKS.data);
    expect(await tracksCache.getValue()).toEqual({ tracks: TRACKS.data, fetchedAt: NOW });
    expect(new URL(fetchMock.mock.calls[0]![0]).searchParams.get('limit')).toBe('50');
  });

  it('picks the playlist among the first five', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    api['chart/0/playlists'] = PLAYLISTS;
    api['playlist/5/tracks'] = TRACKS;
    expect(await loadTracks(NOW)).toEqual(TRACKS.data);
  });

  it('uses the tracks when the source already lists tracks', async () => {
    api['chart/0/playlists'] = TRACKS;
    expect(await loadTracks(NOW)).toEqual(TRACKS.data);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses the cache for an hour', async () => {
    await tracksCache.setValue({ tracks: [track(9)], fetchedAt: NOW - CACHE_TTL + 1 });
    expect(await loadTracks(NOW)).toEqual([track(9)]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes an older cache', async () => {
    await tracksCache.setValue({ tracks: [track(9)], fetchedAt: NOW - CACHE_TTL });
    api['chart/0/playlists'] = TRACKS;
    expect(await loadTracks(NOW)).toEqual(TRACKS.data);
  });

  it('keeps showing the old tracks when Deezer fails', async () => {
    await tracksCache.setValue({ tracks: [track(9)], fetchedAt: NOW - 2 * CACHE_TTL });
    expect(await loadTracks(NOW)).toEqual([track(9)]);
    // An error object in a 200 answer
    api['chart/0/playlists'] = { error: { type: 'Exception', message: 'Quota limit exceeded', code: 4 } };
    expect(await loadTracks(NOW)).toEqual([track(9)]);
    // An empty playlist
    api['chart/0/playlists'] = PLAYLISTS;
    api['playlist/1/tracks'] = { data: [] };
    expect(await loadTracks(NOW)).toEqual([track(9)]);
  });

  it('has no track when Deezer fails on the first run', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await loadTracks(NOW)).toEqual([]);
  });
});

describe('links', () => {
  it('adds the application ID to deezer.com links', () => {
    expect(deezerLink('https://www.deezer.com/track/1')).toBe('https://www.deezer.com/track/1?app_id=216424');
    expect(deezerLink('https://www.deezer.com/')).toBe('https://www.deezer.com/?app_id=216424');
  });

  it('falls back to the album image endpoint without a cover', () => {
    expect(coverUrl(track(1))).toBe('https://cdn.test/1.jpg');
    expect(coverUrl(track(7, { album: { id: 7 } }))).toBe('https://api.deezer.com/album/7/image?size=500');
  });
});

it('removes the data stored by older versions', async () => {
  await fakeBrowser.storage.sync.set({ api_call: 0, last_call: 1, uuid: 'ABC', other: true });
  localStorage.dzData = '[]';
  localStorage.uuid = 'ABC';
  await removeLegacyData();
  expect(await fakeBrowser.storage.sync.get()).toEqual({ other: true });
  expect(localStorage.length).toBe(0);
});
