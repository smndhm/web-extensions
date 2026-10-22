import { describe, expect, it } from 'vitest';
import { daysUntil, releaseWhen } from '@/utils/release';

// October 22, 2026, in the evening on the user's clock
const NOW = new Date(2026, 9, 22, 20, 39);

describe('daysUntil', () => {
  it.each([
    ['2026-10-22', 0],
    ['2026-10-23', 1],
    ['2026-10-25', 3],
    ['2026-11-14', 23],
    ['2026-10-21', -1],
  ])('counts %s as %i days away', (date, days) => {
    expect(daysUntil(date, NOW)).toBe(days);
  });
});

describe('releaseWhen', () => {
  it.each([
    ['2026-10-23', 'fr', { date: '23 octobre', soon: 'demain' }],
    ['2026-10-25', 'fr', { date: '25 octobre', soon: 'dans 3 jours' }],
    ['2026-10-28', 'fr', { date: '28 octobre', soon: 'dans 6 jours' }],
    ['2026-10-29', 'fr', { date: '29 octobre' }],
    ['2027-01-15', 'fr', { date: '15 janvier 2027' }],
    ['2026-10-23', 'en', { date: 'October 23', soon: 'tomorrow' }],
    ['2026-10-25', 'en', { date: 'October 25', soon: 'in 3 days' }],
    ['2026-10-22', 'en', { date: 'October 22', soon: 'today' }],
  ])('says %s in %s as %o', (date, lang, when) => {
    expect(releaseWhen(date, lang, NOW)).toEqual(when);
  });
});
