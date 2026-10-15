/**
 * The Music Bridge logo of the current version: assets/icon.svg, whose colors change with each release.
 *
 * The logo's 9 colors, in the order they first appear in the SVG, become 9 Tailwind CSS colors: one hue out of two of
 * Tailwind's 17, from a starting hue, in one lightness or two alternating ones. Each release moves to the next combination
 * (the start moves 5 hues on, the lightness to the next of LIGHTNESS), so 68 releases go by before a logo comes back.
 * The release count comes from CHANGELOG.md: the versions released since FIRST, which keeps the original colors.
 *
 * The SVG is cropped to a square around the drawing, as the icons fill their whole size.
 *
 * Usage: node scripts/logo.ts [release count], prints the SVG
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DIR = resolve(import.meta.dirname, '..');
const FIRST = '1.7.1';

// Tailwind CSS v3 colors (MIT), the hues in color wheel order
const TAILWIND: Record<string, Record<number, string>> = {
  red: { 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444' },
  orange: { 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316' },
  amber: { 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b' },
  yellow: { 200: '#fef08a', 300: '#fde047', 400: '#facc15', 500: '#eab308' },
  lime: { 200: '#d9f99d', 300: '#bef264', 400: '#a3e635', 500: '#84cc16' },
  green: { 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e' },
  emerald: { 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981' },
  teal: { 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6' },
  cyan: { 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4' },
  sky: { 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9' },
  blue: { 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6' },
  indigo: { 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1' },
  violet: { 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6' },
  purple: { 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7' },
  fuchsia: { 200: '#f5d0fe', 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef' },
  pink: { 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899' },
  rose: { 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e' },
};
const HUES = Object.keys(TAILWIND);
// The lightness of the logo's colors, alternating when two: each color is the shade of its hue closest to it,
// as the same shade is lighter in yellow than in blue
const LIGHTNESS = [[0.76], [0.84, 0.71], [0.78, 0.71], [0.71, 0.84]];

/** OKLCH lightness of a #rrggbb color */
function lightness(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const [l, m, s] = [
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  ].map(Math.cbrt) as [number, number, number];
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

/** The shade of a hue closest to a lightness */
const shade = (hue: Record<number, string>, target: number): string =>
  Object.values(hue).reduce((best, color) => (Math.abs(lightness(color) - target) < Math.abs(lightness(best) - target) ? color : best));

/** The versions released since FIRST, from CHANGELOG.md */
async function releaseCount(): Promise<number> {
  const versions = [...(await readFile(resolve(DIR, 'CHANGELOG.md'), 'utf8')).matchAll(/^## (\S+)$/gm)].map(match => match[1]);
  const index = versions.indexOf(FIRST);
  return index === -1 ? versions.length : index;
}

/** The logo's 9 colors for a release count: the original ones at 0 */
export function colors(release: number, original: string[]): string[] {
  if (release === 0) return original;
  const start = (release * 5) % HUES.length;
  const targets = LIGHTNESS[release % LIGHTNESS.length]!;
  return original.map((_, i) => shade(TAILWIND[HUES[(start + 2 * i) % HUES.length]!]!, targets[i % targets.length]!));
}

/** A square viewBox around the paths (M, L, H, V and Z commands, absolute coordinates) */
function squareViewBox(svg: string): string {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [, d] of svg.matchAll(/ d="([^"]+)"/g)) {
    for (const [, command, args] of d!.matchAll(/([MLHVZ])([^MLHVZ]*)/gi)) {
      const numbers = args!
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number);
      if (command === 'H') xs.push(...numbers);
      else if (command === 'V') ys.push(...numbers);
      else numbers.forEach((n, i) => (i % 2 ? ys : xs).push(n));
    }
  }
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const size = Math.max(maxX - minX, maxY - minY);
  return [(minX + maxX - size) / 2, (minY + maxY - size) / 2, size, size].map(n => Number(n.toFixed(4))).join(' ');
}

/** The logo's SVG, in the colors of the given release count, by default the current one */
export async function logo(release?: number): Promise<string> {
  const svg = await readFile(resolve(DIR, 'assets/icon.svg'), 'utf8');
  const fill = /fill="(#[0-9a-f]{6})"/gi;
  const original = [...new Set([...svg.matchAll(fill)].map(match => match[1]!.toLowerCase()))];
  const palette = colors(release ?? (await releaseCount()), original);
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

if (import.meta.main) console.log(await logo(process.argv[2] === undefined ? undefined : Number(process.argv[2])));
