/**
 * The Music Bridge logo: assets/icon.svg, in new colors drawn at random for each release.
 *
 * assets/colors.json keeps each version's 9 colors, which replace the SVG's colors in the order they first appear in
 * it; a version without colors (1.7.1 and before) keeps the SVG's. The colors are drawn with RampenSau
 * (https://github.com/meodai/rampensau, David Aerne): a ramp of 9 colors whose hue turns from a random start, a random
 * part of the color wheel, from a third of it to more than once around, at a random saturation and lightness, never dark.
 * No two colors are too close, and two triangles that share a side always get clearly different colors (sharing a point
 * is fine): the colors go to the SVG's colors in a random order that keeps them apart, or are drawn again.
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
import { generateColorRamp } from 'rampensau';

const DIR = resolve(import.meta.dirname, '..');
const COLORS_FILE = resolve(DIR, 'assets/colors.json');

// Smallest OKLab distance between any two of the 9 colors, and between the colors of two triangles that share a side
const MIN_DISTANCE = 0.05;
const MIN_CONTRAST = 0.09;

type Vector3 = [number, number, number];

/** #rrggbb of an HSL color, hue in degrees, saturation and lightness from 0 to 1 */
function hslHex([h, s, l]: Vector3): string {
  const hue = ((h % 360) + 360) % 360;
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return `#${[f(0), f(8), f(4)]
    .map(v =>
      Math.round(v * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** OKLab coordinates of a #rrggbb color */
function oklab(color: string): Vector3 {
  const [r, g, b] = [1, 3, 5].map(i => {
    const v = parseInt(color.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as Vector3;
  const [l, m, s] = [
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  ].map(Math.cbrt) as Vector3;
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
    const colors = generateColorRamp({
      total: 9,
      hStart: random(0, 360),
      hCycles: (Math.random() < 0.5 ? -1 : 1) * random(0.35, 1.1),
      sRange: [random(0.55, 0.75), random(0.8, 1)],
      lRange: [random(0.55, 0.62), random(0.72, 0.82)],
    }).map(hslHex);
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
