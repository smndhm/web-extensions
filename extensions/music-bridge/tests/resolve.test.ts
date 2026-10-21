import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { FALLBACK_SERVICE_URL, REDIRECT_SERVICE_URL } from '@/utils/redirect';
import { listenForResolve, resolve, RESOLVE_MESSAGE_TYPE } from '@/utils/resolve';

const QUERY = '?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2Fabc&platform=deezer';
const SERVICE_URL = `${REDIRECT_SERVICE_URL}${QUERY}`;
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fakeBrowser.reset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe('resolve', () => {
  it('asks the service for the link in JSON', async () => {
    fetchMock.mockResolvedValue(Response.json({ url: 'https://www.deezer.com/track/123' }));
    expect(await resolve(SERVICE_URL)).toEqual({ url: 'https://www.deezer.com/track/123', service: SERVICE_URL });
    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(url.searchParams.get('format')).toBe('json');
    expect(url.searchParams.get('platform')).toBe('deezer');
  });

  it.each([404, 429, 502])('answers the status %i of an error', async status => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    expect(await resolve(SERVICE_URL)).toEqual({ status });
  });

  it('asks workers.dev when bricodage.fr is unreachable, and answers it as the service to go through', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(Response.json({ url: 'https://www.deezer.com/track/123' }));
    expect(await resolve(SERVICE_URL)).toEqual({ url: 'https://www.deezer.com/track/123', service: `${FALLBACK_SERVICE_URL}${QUERY}` });
    expect(new URL(String(fetchMock.mock.calls[1]![0])).origin + '/').toBe(FALLBACK_SERVICE_URL);
  });

  it('does not ask workers.dev for an error answer', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 502 }));
    expect(await resolve(SERVICE_URL)).toEqual({ status: 502 });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('answers status 0 when both are unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await resolve(SERVICE_URL)).toEqual({ status: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('answers status 502 when the service answer has no link', async () => {
    fetchMock.mockResolvedValue(Response.json({}));
    expect(await resolve(SERVICE_URL)).toEqual({ status: 502 });
  });
});

describe('listenForResolve', () => {
  beforeEach(() => listenForResolve());

  it('answers the content script with the service link', async () => {
    fetchMock.mockResolvedValue(Response.json({ url: 'deezer://track/123' }));
    const sendResponse = vi.fn();
    await fakeBrowser.runtime.onMessage.trigger({ type: RESOLVE_MESSAGE_TYPE, url: SERVICE_URL }, {}, sendResponse);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ url: 'deezer://track/123', service: SERVICE_URL }));
  });

  it('ignores other messages and other addresses than the service', async () => {
    const sendResponse = vi.fn();
    await fakeBrowser.runtime.onMessage.trigger({ type: 'closeTab' }, {}, sendResponse);
    await fakeBrowser.runtime.onMessage.trigger({ type: RESOLVE_MESSAGE_TYPE, url: 'https://example.com/' }, {}, sendResponse);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendResponse).not.toHaveBeenCalled();
  });
});
