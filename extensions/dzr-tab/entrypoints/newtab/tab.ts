/**
 * Shows a random track and paints the page with its cover's colors.
 */

import { Vibrant } from 'node-vibrant/browser';
import { BLACK, Utils, WHITE, type Rgb } from '@/utils/contrast';
import { coverUrl, deezerLink, type DeezerTrack } from '@/utils/deezer';

const track = document.querySelector<HTMLElement>('#track')!;

function setLink(selector: string, href: string, text?: string) {
  const link = track.querySelector<HTMLAnchorElement>(`${selector} a`)!;
  link.href = deezerLink(href);
  if (text !== undefined) link.textContent = text;
}

/** Gradient between the cover's vibrant and muted colors, with text that keeps a 4.5:1 contrast on both ends */
async function paintBackground(cover: string) {
  const palette = await Vibrant.from(cover).getPalette();
  if (!palette.Vibrant || !palette.Muted) return;
  const ends = [palette.Vibrant.rgb, palette.Muted.rgb] as Rgb[];
  const white = Utils.minContrast(WHITE, ends) >= Utils.minContrast(BLACK, ends);
  const [from, to] = Utils.ensureContrast(ends, white ? WHITE : BLACK, 4.5);
  document.body.style.backgroundImage = `linear-gradient(to right top, ${Utils.rgb(from!)}, ${Utils.rgb(to!)})`;
  document.body.classList.toggle('white', white);
}

export function showTrack(dzTrack: DeezerTrack) {
  const cover = coverUrl(dzTrack);
  setLink('.track-cover', dzTrack.link);
  track.querySelector<HTMLImageElement>('.track-cover img')!.src = cover;
  setLink('.track-title', dzTrack.link, dzTrack.title);
  setLink('.track-artist', dzTrack.artist.link, dzTrack.artist.name);
  // Without a palette (cover unreachable or without colors), the page keeps its default colors
  paintBackground(cover).catch((error) => console.warn('[Deezer Tab]', error));
}
