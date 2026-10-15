/**
 * The Music Bridge logo of the current version: assets/icon.svg, whose colors change with each release.
 *
 * The logo's 9 colors, in the order they first appear in the SVG, become 9 Tailwind CSS colors: one hue out of two of
 * Tailwind's 17, from a starting hue, in one shade or two alternating shades. Each release moves to the next combination
 * (the start moves 5 hues on, the shades to the next of SHADES), so 136 releases go by before a logo comes back.
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
  red: { 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626' },
  orange: { 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c' },
  amber: { 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
  yellow: { 300: '#fde047', 400: '#facc15', 500: '#eab308', 600: '#ca8a04' },
  lime: { 300: '#bef264', 400: '#a3e635', 500: '#84cc16', 600: '#65a30d' },
  green: { 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a' },
  emerald: { 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669' },
  teal: { 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488' },
  cyan: { 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
  sky: { 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7' },
  blue: { 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb' },
  indigo: { 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5' },
  violet: { 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
  purple: { 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea' },
  fuchsia: { 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef', 600: '#c026d3' },
  pink: { 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777' },
  rose: { 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
};
const HUES = Object.keys(TAILWIND);
// The shades of the logo's colors, alternating when two
const SHADES = [[400], [400, 600], [500], [300, 500], [400, 500], [600, 400], [500, 300], [500, 400]];

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
  const shades = SHADES[release % SHADES.length]!;
  return original.map((_, i) => TAILWIND[HUES[(start + 2 * i) % HUES.length]!]![shades[i % shades.length]!]!);
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
