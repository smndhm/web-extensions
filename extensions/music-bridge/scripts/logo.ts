/**
 * The Music Bridge logo: assets/icon.svg, in new colors drawn at random for each release.
 *
 * assets/colors.json keeps each version's 9 colors, which replace the SVG's colors in the order they first appear in
 * it; a version without colors (1.7.1 and before) keeps the SVG's. The colors are drawn in OKLCH:
 * - hues: 9 hues spread at random over a part of the color wheel drawn at random, from a third to all of it;
 * - lightness: one of LIGHTNESS, never dark; chroma: as vivid as the screen allows, up to CHROMA;
 * - no two colors too close, and two triangles that share a side always get clearly different colors (sharing a point
 *   is fine): the colors go to the SVG's colors in a random order that keeps them apart, or are drawn again.
 * Only the extension's icon changes: the store images keep the SVG's colors (logo({ original: true }).
 *
 * Usage: node scripts/logo.ts --draw   draws the colors of the current version, unless it has some already
 *        node scripts/logo.ts --redraw draws them again
 *        node scripts/logo.ts [version] prints the SVG of a version, the current one by default
 * The SVG is cropped to a square around the drawing, as the icons fill their whole size.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const DIR = resolve(import.meta.dirname, '..');
const COLORS_FILE = resolve(DIR, 'assets/colors.json');

// The lightness of the 9 colors, alternating when two: from the shades of the original logo, none dark
const LIGHTNESS = [[0.76], [0.84, 0.71], [0.78, 0.71], [0.71, 0.84]];
const CHROMA = 0.17;
// Smallest OKLab distance between any two of the 9 colors, and between the colors of two triangles that share a side
const MIN_DISTANCE = 0.05;
const MIN_CONTRAST = 0.09;

type Oklch = { l: number; c: number; h: number };
type Rgb = [number, number, number];

/** sRGB (0–1, may be out of gamut) of an OKLCH color */
function rgb({ l, c, h }: Oklch): Rgb {
  const [a, b] = [c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];
  const [lms1, lms2, lms3] = [l + 0.3963377774 * a + 0.2158037573 * b, l - 0.1055613458 * a - 0.0638541728 * b, l - 0.0894841775 * a - 1.291485548 * b].map(v => v ** 3) as Rgb;
  const linear: Rgb = [
    4.0767416621 * lms1 - 3.3077115913 * lms2 + 0.2309699292 * lms3,
    -1.2684380046 * lms1 + 2.6097574011 * lms2 - 0.3413193965 * lms3,
    -0.0041960863 * lms1 - 0.7034186147 * lms2 + 1.707614701 * lms3,
  ];
  return linear.map(v => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.abs(v) ** (1 / 2.4) * Math.sign(v) - 0.055)) as Rgb;
}

const inGamut = (color: Rgb) => color.every(v => v >= -1e-4 && v <= 1 + 1e-4);

/** #rrggbb of an OKLCH color, its chroma reduced until the screen can show it */
function hex(color: Oklch): string {
  let c = color.c;
  while (c > 0 && !inGamut(rgb({ ...color, c }))) c -= 0.005;
  return `#${rgb({ ...color, c: Math.max(c, 0) })
    .map(v =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** OKLab coordinates of a #rrggbb color */
function oklab(color: string): Rgb {
  const [r, g, b] = [1, 3, 5].map(i => {
    const v = parseInt(color.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  const [l, m, s] = [
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  ].map(Math.cbrt) as Rgb;
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

const distance = (a: string, b: string) => Math.hypot(...oklab(a).map((v, i) => v - oklab(b)[i]!));

const random = (min: number, max: number) => min + Math.random() * (max - min);
const shuffle = <T>(items: T[]): T[] =>
  items
    .map(item => [Math.random(), item] as const)
    .toSorted(([a], [b]) => a - b)
    .map(([, item]) => item);

/** The SVG's triangles, as their color and their corners */
function triangles(svg: string): { color: string; corners: string[] }[] {
  return [...svg.matchAll(/ d="([^"]+)" fill="(#[0-9a-f]{6})"/gi)].map(([, d, color]) => {
    const corners: string[] = [];
    let [x, y] = [0, 0];
    for (const [, command, args] of d!.matchAll(/([MLHV])([^MLHVZ]*)/gi)) {
      const numbers = args!
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (command === 'H') x = numbers[0]!;
      else if (command === 'V') y = numbers[0]!;
      else [x, y] = numbers as [number, number];
      corners.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return { color: color!.toLowerCase(), corners };
  });
}

/** The SVG's colors, in the order they first appear, and the pairs of them whose triangles share a side */
function layout(svg: string): { original: string[]; sides: [number, number][] } {
  const shapes = triangles(svg);
  const original = [...new Set(shapes.map(shape => shape.color))];
  const sides = new Set<string>();
  for (const [i, a] of shapes.entries()) {
    for (const b of shapes.slice(i + 1)) {
      if (a.corners.filter(corner => b.corners.includes(corner)).length < 2) continue;
      const pair = [original.indexOf(a.color), original.indexOf(b.color)].toSorted((x, y) => x - y);
      if (pair[0] === pair[1]) throw new Error(`assets/icon.svg: two ${a.color} triangles share a side`);
      sides.add(pair.join());
    }
  }
  return { original, sides: [...sides].map(pair => pair.split(',').map(Number) as [number, number]) };
}

/** 9 new colors at random, in an order where the triangles that share a side get clearly different colors */
export function draw(sides: [number, number][]): string[] {
  for (;;) {
    const span = random(120, 360);
    const start = random(0, 360);
    // 9 hues over the span, at least a 24th of it apart
    let hues: number[];
    do hues = Array.from({ length: 9 }, () => start + random(0, span));
    while (hues.toSorted((a, b) => a - b).some((hue, i, sorted) => i > 0 && hue - sorted[i - 1]! < span / 24));
    const lightness = LIGHTNESS[Math.floor(Math.random() * LIGHTNESS.length)]!;
    const colors = hues.map((h, i) => hex({ l: lightness[i % lightness.length]!, c: CHROMA, h: h % 360 }));
    if (colors.some((a, i) => colors.slice(i + 1).some(b => distance(a, b) < MIN_DISTANCE))) continue;
    for (let attempt = 0; attempt < 200; attempt++) {
      const order = shuffle(colors);
      if (sides.every(([a, b]) => distance(order[a]!, order[b]!) >= MIN_CONTRAST)) return order;
    }
  }
}

const readColors = async (): Promise<Record<string, string[]>> => JSON.parse(await readFile(COLORS_FILE, 'utf8').catch(() => '{}')) as Record<string, string[]>;
const currentVersion = async () => (JSON.parse(await readFile(resolve(DIR, 'package.json'), 'utf8')) as { version: string }).version;

/** The logo's SVG in a version's colors, by default the current version's, or in the SVG's own colors */
export async function logo({ version, original: keep = false }: { version?: string; original?: boolean } = {}): Promise<string> {
  const svg = await readFile(resolve(DIR, 'assets/icon.svg'), 'utf8');
  const { original } = layout(svg);
  const palette = (keep ? undefined : (await readColors())[version ?? (await currentVersion())]) ?? original;
  const fill = /fill="(#[0-9a-f]{6})"/gi;
  return (
    svg
      // A stroke of the same color closes the hairline gaps antialiasing leaves between the triangles
      .replace(fill, (_, color: string) => {
        const replacement = palette[original.indexOf(color.toLowerCase())];
        return `fill="${replacement}" stroke="${replacement}" stroke-width="0.2" stroke-linejoin="round"`;
      })
      .replace(/ width="[^"]*" height="[^"]*" viewBox="[^"]*"/, ` viewBox="${squareViewBox(svg)}"`)
  );
}

/** A square viewBox around the triangles */
function squareViewBox(svg: string): string {
  const corners = triangles(svg).flatMap(shape => shape.corners.map(corner => corner.split(',').map(Number) as [number, number]));
  const [xs, ys] = [corners.map(([x]) => x), corners.map(([, y]) => y)];
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const size = Math.max(maxX - minX, maxY - minY);
  return [(minX + maxX - size) / 2, (minY + maxY - size) / 2, size, size].map(n => Number(n.toFixed(4))).join(' ');
}

if (import.meta.main) {
  const {
    values,
    positionals: [version],
  } = parseArgs({ allowPositionals: true, options: { draw: { type: 'boolean' }, redraw: { type: 'boolean' } } });
  if (values.draw || values.redraw) {
    const current = await currentVersion();
    const colors = await readColors();
    if (colors[current] && !values.redraw) {
      console.log(`music-bridge ${current}: colors already drawn, ${colors[current].join(' ')}`);
    } else {
      colors[current] = draw(layout(await readFile(resolve(DIR, 'assets/icon.svg'), 'utf8')).sides);
      await writeFile(COLORS_FILE, `${JSON.stringify(colors, null, 2)}\n`);
      console.log(`music-bridge ${current}: new colors ${colors[current].join(' ')}`);
    }
  } else {
    console.log(await logo({ version }));
  }
}
