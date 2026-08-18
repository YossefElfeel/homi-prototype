/**
 * Day boundaries in the timezone the business actually runs in.
 *
 * `formats.ts` already states the rule — "the business runs on one clock, and
 * it is not the browser's" — and binds every rendered date to Europe/Zurich.
 * The scheduling engine did not follow it: `startOfDay` called `setHours(0)`,
 * which is midnight *wherever the code happens to be running*.
 *
 * On a machine east of Zurich the two disagree by a day, and the slot picker
 * said so out loud: Saturday came up "Geschlossen" and Sunday offered nineteen
 * slots — the exact inverse of §1.2. Nothing was actually mis-booked, because
 * the engine's own weekday test was right; every *label* was simply drawn a
 * day early, which is worse than a crash. A crash gets reported.
 *
 * It is invisible from a desk in Zurich, which is why it survived seven waves.
 *
 * Everything here works in instants: a `Date` is a point in time, and these
 * functions answer "which Zurich day does this instant fall on, and what
 * instant is 08:00 on that day". DST is handled by resolving the offset twice
 * — the offset at the guessed instant is not always the offset at the answer.
 */

import { TIME_ZONE } from '@/i18n/formats';

const PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** The wall-clock reading in Zurich at this instant. */
export function zonedParts(d: Date): ZonedParts {
  const parts = PARTS.formatToParts(d);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}

/** How far Zurich is ahead of UTC at this instant, in milliseconds. */
function offsetAt(d: Date): number {
  const p = zonedParts(d);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asIfUtc - (d.getTime() - d.getMilliseconds());
}

/**
 * The instant at which Zurich wall-clocks read the given date and time.
 *
 * Overflowing values are normalised the way `Date.UTC` does, so `day + 30` and
 * `hour + 25` are legitimate inputs — which is what makes `addBusinessDays`
 * one line.
 */
export function fromZoned(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  /* Resolve twice. The first guess uses the offset in force at the *wrong*
     instant, which is off by an hour on the two days a year the clocks move. */
  const first = new Date(wall - offsetAt(new Date(wall)));
  return new Date(wall - offsetAt(first));
}

/** Midnight in Zurich on the day this instant falls in. */
export function startOfBusinessDay(d: Date): Date {
  const p = zonedParts(d);
  return fromZoned(p.year, p.month, p.day);
}

/** "08:00" on the Zurich day this instant falls in. */
export function atBusinessTime(day: Date, hhmm: string): Date {
  const [hour = 0, minute = 0] = hhmm.split(':').map(Number);
  const p = zonedParts(day);
  return fromZoned(p.year, p.month, p.day, hour, minute);
}

/**
 * Whole days later, keeping the same Zurich wall-clock time.
 *
 * Adding 24 hours is not the same thing: across a DST change it lands an hour
 * out, so a run of day cells would slowly drift off midnight.
 */
export function addBusinessDays(d: Date, days: number): Date {
  const p = zonedParts(d);
  return fromZoned(p.year, p.month, p.day + days, p.hour, p.minute);
}

/** 1 = Monday … 7 = Sunday, the convention `Settings.workingDays` uses. */
export function businessWeekday(d: Date): number {
  const p = zonedParts(d);
  const js = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  return js === 0 ? 7 : js;
}

/** MMDD, for comparing a recurring yearly window without its year. */
export function businessMonthDay(d: Date): number {
  const p = zonedParts(d);
  return p.month * 100 + p.day;
}
