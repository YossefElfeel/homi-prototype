/**
 * The named date formats every screen uses.
 *
 * Shared between the next-intl request config and the Swiss-bound formatter in
 * ./format.ts, so a preset can never mean two different things depending on
 * which one a component happens to reach for.
 */
export const DATE_FORMATS = {
  /** "Donnerstag, 12. September 2026" — the brief's canonical long date. */
  full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  dayMonth: { weekday: 'long', day: 'numeric', month: 'long' },
  short: { day: '2-digit', month: '2-digit', year: 'numeric' },
  time: { hour: '2-digit', minute: '2-digit' },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DateFormatName = keyof typeof DATE_FORMATS;

export const NUMBER_FORMATS = {
  chf: { style: 'currency', currency: 'CHF' },
} as const satisfies Record<string, Intl.NumberFormatOptions>;

/** §1 — the business runs on one clock, and it is not the browser's. */
export const TIME_ZONE = 'Europe/Zurich';
