/**
 * Background colors with enough contrast for the text, as WCAG 2 measures it.
 *
 * Colors are shaded in OKLCH: only the lightness changes, so the hue and the saturation of the
 * cover stay (mixing with black or white in RGB greyed them).
 */

/** sRGB color, channels from 0 to 255 */
export type Rgb = [number, number, number];
/** OKLCH color: lightness from 0 to 1, chroma, hue in degrees */
type Oklch = [number, number, number];

export const WHITE: Rgb = [255, 255, 255];
export const BLACK: Rgb = [0, 0, 0];

export const rgb = (color: Rgb) => `rgb(${color.map(Math.round).join(', ')})`;

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** WCAG 2 relative luminance: https://www.w3.org/TR/WCAG22/#dfn-relative-luminance */
export function luminance(color: Rgb) {
  const [r, g, b] = color.map(c => toLinear(c / 255)) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio: https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio */
export function contrast(a: Rgb, b: Rgb) {
  const [light, dark] = [luminance(a), luminance(b)].toSorted((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

export const minContrast = (text: Rgb, backgrounds: Rgb[]) => Math.min(...backgrounds.map(background => contrast(text, background)));

/** sRGB → OKLCH, after https://bottosson.github.io/posts/oklab/ */
export function toOklch(color: Rgb): Oklch {
  const [r, g, b] = color.map(c => toLinear(c / 255)) as Rgb;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}

/** OKLCH → sRGB, rounded; out of gamut colors lose chroma until they fit, keeping their lightness and hue */
export function fromOklch([L, C, h]: Oklch): Rgb {
  const convert = (chroma: number) => {
    const A = chroma * Math.cos((h * Math.PI) / 180);
    const B = chroma * Math.sin((h * Math.PI) / 180);
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ].map(c => fromLinear(c));
  };
  const inGamut = (channels: number[]) => channels.every(c => c >= -0.0005 && c <= 1.0005);
  let channels = convert(C);
  if (!inGamut(channels)) {
    let [low, high] = [0, C];
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      if (inGamut(convert(mid))) low = mid;
      else high = mid;
    }
    channels = convert(low);
  }
  return channels.map(c => Math.round(Math.min(1, Math.max(0, c)) * 255)) as Rgb;
}

/** Colors of a linear gradient between two colors, as browsers draw it by default (interpolated in sRGB) */
export function gradientColors(from: Rgb, to: Rgb, steps = 10): Rgb[] {
  return Array.from({ length: steps + 1 }, (_, i) => from.map((c, j) => Math.round(c + ((to[j]! - c) * i) / steps)) as Rgb);
}

/**
 * The color closest to `color`, changing only its OKLCH lightness, on which `text` reaches the
 * `target` contrast. Darkens under white text, lightens under black text.
 */
export function shade(color: Rgb, text: Rgb, target: number): Rgb {
  const rounded = color.map(Math.round) as Rgb;
  if (contrast(text, rounded) >= target) return rounded;
  const [L, C, h] = toOklch(rounded);
  const extreme = text === WHITE ? 0 : 1;
  // Binary search between the color's lightness (fails) and the extreme one (black or white, passes)
  let [failing, passing] = [L, extreme];
  for (let i = 0; i < 24; i++) {
    const mid = (failing + passing) / 2;
    if (contrast(text, fromOklch([mid, C, h])) >= target) passing = mid;
    else failing = mid;
  }
  const shaded = fromOklch([passing, C, h]);
  return contrast(text, shaded) >= target ? shaded : text === WHITE ? BLACK : WHITE;
}

export interface Background {
  from: Rgb;
  to: Rgb;
  /** White text, else black */
  white: boolean;
}

/**
 * Gradient between two cover colors, and the text color (white or black) that needs them to change
 * the least, so that the text reaches the `target` contrast on the whole gradient.
 */
export function backgroundFor([from, to]: [Rgb, Rgb], target = 4.5): Background {
  // A small margin, as the gradient is checked on samples and browsers round its colors
  const safe = target + 0.05;
  const options = [WHITE, BLACK].map(text => {
    // Shade both ends, then more while some color in between the ends falls short
    let ends: [Rgb, Rgb] = [from, to];
    for (let endTarget = safe; endTarget <= 21; endTarget += 0.25) {
      ends = [shade(from, text, endTarget), shade(to, text, endTarget)];
      if (minContrast(text, gradientColors(...ends, 32)) >= safe) break;
    }
    const change = ends.reduce((sum, end, i) => sum + Math.abs(toOklch(end)[0] - toOklch([from, to][i]!)[0]), 0);
    return { from: ends[0], to: ends[1], white: text === WHITE, change };
  });
  const [best] = options.toSorted((a, b) => a.change - b.change);
  return { from: best!.from, to: best!.to, white: best!.white };
}
