export const PLATFORM_IDS = [
  'amazonMusic',
  'appleMusic',
  'deezer',
  'napster',
  'pandora',
  'soundcloud',
  'spotify',
  'tidal',
  'youtube',
  'youtubeMusic',
] as const;

/** Platform IDs, as the Odesli API names them */
export type PlatformId = (typeof PLATFORM_IDS)[number];

export interface Platform {
  name: string;
  url: string;
  /** Odesli knows a desktop app link for this platform */
  hasNativeAppLink?: boolean;
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
  napster: {
    name: 'Napster',
    url: 'https://web.napster.com',
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
  },
  tidal: {
    name: 'Tidal',
    url: 'https://listen.tidal.com',
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

export const isPlatformId = (value: unknown): value is PlatformId =>
  typeof value === 'string' && (PLATFORM_IDS as readonly string[]).includes(value);
