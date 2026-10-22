// In the options list order: Deezer first, then roughly by audience
export const PLATFORM_IDS = ['deezer', 'spotify', 'appleMusic', 'youtubeMusic', 'amazonMusic', 'youtube', 'soundcloud', 'tidal', 'pandora'] as const;

/** Platform IDs, as the Odesli API names them */
export type PlatformId = (typeof PLATFORM_IDS)[number];

export interface Platform {
  name: string;
  url: string;
  /** Other origins of the platform's website */
  aliases?: string[];
  /** Odesli knows a desktop app link for this platform */
  hasNativeAppLink?: boolean;
  /** The platform's search page for `query` */
  search: (query: string) => string;
}

const encode = encodeURIComponent;

export const platforms: Record<PlatformId, Platform> = {
  amazonMusic: {
    name: 'Amazon Music',
    url: 'https://music.amazon.com',
    search: query => `https://music.amazon.com/search/${encode(query)}`,
  },
  appleMusic: {
    name: 'Apple Music',
    url: 'https://music.apple.com',
    hasNativeAppLink: true,
    search: query => `https://music.apple.com/search?term=${encode(query)}`,
  },
  deezer: {
    name: 'Deezer',
    url: 'https://www.deezer.com',
    hasNativeAppLink: true,
    search: query => `https://www.deezer.com/search/${encode(query)}`,
  },
  pandora: {
    name: 'Pandora',
    url: 'https://www.pandora.com',
    search: query => `https://www.pandora.com/search/${encode(query)}/all`,
  },
  soundcloud: {
    name: 'SoundCloud',
    url: 'https://soundcloud.com',
    search: query => `https://soundcloud.com/search?q=${encode(query)}`,
  },
  spotify: {
    name: 'Spotify',
    url: 'https://open.spotify.com',
    hasNativeAppLink: true,
    search: query => `https://open.spotify.com/search/${encode(query)}`,
  },
  tidal: {
    name: 'Tidal',
    // listen.tidal.com, which Odesli still links to, redirects to tidal.com
    url: 'https://tidal.com',
    aliases: ['https://listen.tidal.com'],
    search: query => `https://tidal.com/search?q=${encode(query)}`,
  },
  youtube: {
    name: 'YouTube',
    url: 'https://www.youtube.com',
    search: query => `https://www.youtube.com/results?search_query=${encode(query)}`,
  },
  youtubeMusic: {
    name: 'YouTube Music',
    url: 'https://music.youtube.com',
    search: query => `https://music.youtube.com/search?q=${encode(query)}`,
  },
};

export const DEFAULT_PLATFORM: PlatformId = 'spotify';

/** The page `href` is on the platform's website */
export const isOnPlatform = (href: string, { url, aliases = [] }: Platform): boolean => [url, ...aliases].some(origin => href === origin || href.startsWith(`${origin}/`));

export const isPlatformId = (value: unknown): value is PlatformId => typeof value === 'string' && (PLATFORM_IDS as readonly string[]).includes(value);
