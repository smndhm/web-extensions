export const PLATFORM_IDS = ['amazonMusic', 'appleMusic', 'deezer', 'pandora', 'soundcloud', 'spotify', 'tidal', 'youtube', 'youtubeMusic'] as const;

/** Platform IDs, as the Odesli API names them */
export type PlatformId = (typeof PLATFORM_IDS)[number];

export interface Platform {
  name: string;
  url: string;
  /** Other origins of the platform's website */
  aliases?: string[];
  /** Odesli knows a desktop app link for this platform */
  hasNativeAppLink?: boolean;
  /** The desktop app also exists on Linux (Apple Music and Deezer only have Windows and macOS apps) */
  linuxApp?: boolean;
}

export const platforms: Record<PlatformId, Platform> = {
  amazonMusic: {
    name: 'Amazon Music',
    url: 'https://music.amazon.com',
  },
  appleMusic: {
    name: 'Apple Music',
    url: 'https://music.apple.com',
    hasNativeAppLink: true,
  },
  deezer: {
    name: 'Deezer',
    url: 'https://www.deezer.com',
    hasNativeAppLink: true,
  },
  pandora: {
    name: 'Pandora',
    url: 'https://www.pandora.com',
  },
  soundcloud: {
    name: 'SoundCloud',
    url: 'https://soundcloud.com',
  },
  spotify: {
    name: 'Spotify',
    url: 'https://open.spotify.com',
    hasNativeAppLink: true,
    linuxApp: true,
  },
  tidal: {
    name: 'Tidal',
    // listen.tidal.com, which Odesli still links to, redirects to tidal.com
    url: 'https://tidal.com',
    aliases: ['https://listen.tidal.com'],
  },
  youtube: {
    name: 'YouTube',
    url: 'https://www.youtube.com',
  },
  youtubeMusic: {
    name: 'YouTube Music',
    url: 'https://music.youtube.com',
  },
};

export const DEFAULT_PLATFORM: PlatformId = 'spotify';

/** The page `href` is on the platform's website */
export const isOnPlatform = (href: string, { url, aliases = [] }: Platform): boolean => [url, ...aliases].some(origin => href === origin || href.startsWith(`${origin}/`));

export const isPlatformId = (value: unknown): value is PlatformId => typeof value === 'string' && (PLATFORM_IDS as readonly string[]).includes(value);
