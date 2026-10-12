import { describe, expect, it } from 'vitest';
import { backgroundFor, BLACK, contrast, fromOklch, gradientColors, minContrast, shade, toOklch, WHITE, type Rgb } from '@/utils/contrast';

/** Deterministic pseudo-random colors (mulberry32) */
function colors(count: number, seed = 42): Rgb[] {
  let state = seed;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, () => [next(), next(), next()].map(c => Math.round(c * 255)) as Rgb);
}

const hueDistance = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

describe('contrast', () => {
  it('follows WCAG 2', () => {
    expect(contrast(WHITE, BLACK)).toBeCloseTo(21);
    expect(contrast(WHITE, WHITE)).toBe(1);
    expect(contrast([118, 118, 118], WHITE)).toBeCloseTo(4.54, 2);
  });
});

describe('OKLCH', () => {
  it('converts sRGB back and forth', () => {
    for (const color of colors(200)) {
      expect(fromOklch(toOklch(color))).toEqual(color);
    }
  });

  it('keeps out of gamut colors in sRGB', () => {
    for (const channel of fromOklch([0.9, 0.4, 30])) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
  });
});

describe('shade', () => {
  it('keeps a color that already contrasts enough', () => {
    expect(shade([20, 30, 120], WHITE, 4.5)).toEqual([20, 30, 120]);
  });

  it('darkens under white text and lightens under black text, keeping the hue', () => {
    const red: Rgb = [230, 60, 60];
    const darker = shade(red, WHITE, 4.5);
    expect(contrast(WHITE, darker)).toBeGreaterThanOrEqual(4.5);
    expect(toOklch(darker)[0]).toBeLessThan(toOklch(red)[0]);
    expect(hueDistance(toOklch(darker)[2], toOklch(red)[2])).toBeLessThan(3);

    const blue: Rgb = [40, 60, 160];
    const lighter = shade(blue, BLACK, 4.5);
    expect(contrast(BLACK, lighter)).toBeGreaterThanOrEqual(4.5);
    expect(toOklch(lighter)[0]).toBeGreaterThan(toOklch(blue)[0]);
  });

  it('keeps more chroma than mixing with black', () => {
    const orange: Rgb = [240, 140, 40];
    const shaded = shade(orange, WHITE, 4.5);
    // Mixing in RGB at the same luminance divides the chroma by the mixing ratio; OKLCH keeps most of it
    expect(toOklch(shaded)[1]).toBeGreaterThan(toOklch(orange)[1] * 0.6);
  });
});

describe('backgroundFor', () => {
  it('keeps 4.5:1 on the whole gradient for any pair of colors', () => {
    const all = colors(400, 7);
    for (let i = 0; i < all.length; i += 2) {
      const { from, to, white } = backgroundFor([all[i]!, all[i + 1]!]);
      expect(minContrast(white ? WHITE : BLACK, gradientColors(from, to, 50))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('picks the text color that changes the cover colors the least', () => {
    expect(
      backgroundFor([
        [250, 230, 120],
        [240, 200, 90],
      ]).white,
    ).toBe(false);
    expect(
      backgroundFor([
        [20, 30, 120],
        [60, 20, 80],
      ]).white,
    ).toBe(true);
    expect(
      backgroundFor([
        [20, 30, 120],
        [60, 20, 80],
      ]),
    ).toEqual({ from: [20, 30, 120], to: [60, 20, 80], white: true });
  });

  it('handles a plain background', () => {
    const { from, to } = backgroundFor([
      [128, 128, 128],
      [128, 128, 128],
    ]);
    expect(from).toEqual(to);
  });
});
