/**
 * Shows a random track and paints the page with its cover's colors.
 */

import { Vibrant } from 'node-vibrant/browser';
import { backgroundFor, rgb, type Rgb } from '@/utils/contrast';
import { coverUrl, deezerLink, type DeezerTrack } from '@/utils/deezer';

const track = document.querySelector<HTMLElement>('#track')!;

function setLink(selector: string, href: string, text?: string) {
  const link = track.querySelector<HTMLAnchorElement>(`${selector} a`)!;
  link.href = deezerLink(href);
  if (text !== undefined) link.textContent = text;
}

// Vibrant's swatches, from the most to the least wanted for each end of the gradient
const FROM_SWATCHES = ['Vibrant', 'DarkVibrant', 'LightVibrant', 'Muted', 'DarkMuted', 'LightMuted'] as const;
const TO_SWATCHES = ['DarkVibrant', 'LightVibrant', 'Muted', 'DarkMuted', 'LightMuted', 'Vibrant'] as const;

/** Gradient between two colors of the cover, with text that keeps a 4.5:1 contrast on all of it */
async function paintBackground(cover: string) {
  const palette = await Vibrant.from(cover).getPalette();
  const from = FROM_SWATCHES.map(name => palette[name]).find(Boolean);
  // A cover with a single color gets a plain background
  const to = TO_SWATCHES.map(name => palette[name]).find(swatch => swatch && swatch !== from) ?? from;
  if (!from || !to) return;
  const background = backgroundFor([from.rgb as Rgb, to.rgb as Rgb]);
  document.body.style.backgroundImage = `linear-gradient(to right top, ${rgb(background.from)}, ${rgb(background.to)})`;
  document.body.classList.toggle('white', background.white);
}

export function showTrack(dzTrack: DeezerTrack) {
  const cover = coverUrl(dzTrack);
  setLink('.track-cover', dzTrack.link);
  track.querySelector<HTMLImageElement>('.track-cover img')!.src = cover;
  setLink('.track-title', dzTrack.link, dzTrack.title);
  setLink('.track-artist', dzTrack.artist.link, dzTrack.artist.name);
  // Without a palette (cover unreachable or without colors), the page keeps its default colors
  paintBackground(cover).catch(error => console.warn('[Deezer Tab]', error));
}
