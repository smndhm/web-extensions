/** Days from today, on the user's clock, to `date` (YYYY-MM-DD): 1 for tomorrow, 0 for today */
export function daysUntil(date: string, now = new Date()): number {
  const [year, month, day] = date.split('-').map(Number);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(year!, month! - 1, day!).getTime() - today.getTime()) / 86_400_000);
}

/** Within a week, "tomorrow" or "in 3 days" reads better than a date alone */
const SOON = 7;

/**
 * When music not out yet comes out, in `lang`: its date ("October 23", with its year when not this one) and, within a
 * week, how soon ("tomorrow", "in 3 days"), for the messages to put together.
 */
export function releaseWhen(date: string, lang: string, now = new Date()): { date: string; soon?: string } {
  const [year, month, day] = date.split('-').map(Number);
  const release = new Date(year!, month! - 1, day!);
  const formatted = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', ...(year !== now.getFullYear() && { year: 'numeric' }) }).format(release);
  const days = daysUntil(date, now);
  return days < SOON ? { date: formatted, soon: new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(days, 'day') } : { date: formatted };
}
