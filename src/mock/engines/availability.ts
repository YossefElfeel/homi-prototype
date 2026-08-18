/**
 * Scheduling engine — spec §7, §20.5.
 *
 * This replaced the three fixed slot proposals of §21 item 5: the customer now
 * picks from live availability in both the one-off and the subscription flow.
 * That is friendlier, and it moves two problems onto us —
 *
 *   1. the owner loses route control, so `slotsForDay` returns a `routeCost`
 *      the admin availability panel can surface while quoting;
 *   2. the §20.2 double-booking race becomes likely, so a slot is *held* for
 *      15 minutes while the customer pays.
 *
 * Pure functions only; the store owns the data and the timers.
 */

import type { Booking, ClosurePeriod, Property, Settings, SlotHold } from '../schema';
import { distanceKm, regionByPostcode, travelMinutes } from './coverage';

export interface Slot {
  start: string;
  end: string;
  durationMinutes: number;
  /** Travel minutes this slot forces on the day. Lower is better for routing. */
  routeCost: number;
}

export interface SlotQuery {
  from: Date;
  days: number;
  durationMinutes: number;
  property: Pick<Property, 'postcode'>;
  bookings: Booking[];
  holds: SlotHold[];
  closures: ClosurePeriod[];
  properties: Pick<Property, 'id' | 'postcode'>[];
  settings: Settings;
  now: Date;
}

const SLOT_GRANULARITY_MIN = 30;

/* ------------------------------------------------------------------ dates */

export function atTime(day: Date, hhmm: string) {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const out = new Date(day);
  out.setHours(h, m, 0, 0);
  return out;
}

export function startOfDay(d: Date) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60_000);
}

export function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/* --------------------------------------------------------------- day rules */

export type DayBlockReason = 'closed-day' | 'closure-period' | 'too-soon' | 'at-capacity';

export function closureFor(day: Date, closures: ClosurePeriod[]) {
  const d = startOfDay(day).getTime();
  return closures.find((c) => {
    const start = startOfDay(new Date(c.start));
    const end = startOfDay(new Date(c.end));
    if (c.recurringYearly) {
      // Compare month/day only, so an annual shutdown keeps applying.
      const key = (x: Date) => (x.getMonth() + 1) * 100 + x.getDate();
      const today = key(new Date(day));
      return today >= key(start) && today <= key(end);
    }
    return d >= start.getTime() && d <= end.getTime();
  });
}

export function dayBlockReason(
  day: Date,
  q: Pick<SlotQuery, 'bookings' | 'closures' | 'settings' | 'now'>,
): DayBlockReason | null {
  const { settings, now, closures, bookings } = q;

  // §1.2 — Monday to Saturday. Sunday and public holidays never appear.
  const weekday = day.getDay() === 0 ? 7 : day.getDay();
  if (!settings.workingDays.includes(weekday)) return 'closed-day';

  if (closureFor(day, closures)) return 'closure-period';

  // §1.2 / §20.1 — no same-day bookings, 24 hours minimum notice.
  const earliest = addMinutes(now, settings.minLeadHours * 60);
  if (atTime(day, settings.dayEnd) <= earliest) return 'too-soon';

  // §1.2 — two jobs a day is the hard ceiling on this business.
  const sameDay = bookingsOnDay(day, bookings);
  if (sameDay.length >= settings.maxJobsPerDay) return 'at-capacity';

  return null;
}

export function bookingsOnDay(day: Date, bookings: Booking[]) {
  const d = startOfDay(day).getTime();
  return bookings
    .filter((b) => b.status !== 'closed' && startOfDay(new Date(b.start)).getTime() === d)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/* ---------------------------------------------------------------- travel */

function bufferBetween(
  postcodeA: string | undefined,
  postcodeB: string | undefined,
): number {
  const a = postcodeA ? regionByPostcode(postcodeA) : undefined;
  const b = postcodeB ? regionByPostcode(postcodeB) : undefined;
  if (!a || !b) return 30; // Unknown location — assume the middle bucket.
  return travelMinutes(distanceKm(a, b));
}

/* ------------------------------------------------------------------ slots */

export function slotsForDay(day: Date, q: SlotQuery): Slot[] {
  if (dayBlockReason(day, q)) return [];

  const { settings, durationMinutes, property, bookings, holds, properties, now } = q;
  const dayStart = atTime(day, settings.dayStart);
  const dayEnd = atTime(day, settings.dayEnd);
  const earliest = addMinutes(now, settings.minLeadHours * 60);

  const existing = bookingsOnDay(day, bookings).map((b) => {
    const p = properties.find((x) => x.id === b.propertyId);
    return {
      start: new Date(b.start),
      end: addMinutes(new Date(b.start), b.duration),
      postcode: p?.postcode,
    };
  });

  const heldRanges = holds
    .filter((h) => new Date(h.expiresAt) > now)
    .map((h) => ({ start: new Date(h.start), end: addMinutes(new Date(h.start), h.duration) }))
    .filter((h) => startOfDay(h.start).getTime() === startOfDay(day).getTime());

  const slots: Slot[] = [];

  for (
    let cursor = new Date(dayStart);
    addMinutes(cursor, durationMinutes) <= dayEnd;
    cursor = addMinutes(cursor, SLOT_GRANULARITY_MIN)
  ) {
    const start = new Date(cursor);
    const end = addMinutes(start, durationMinutes);

    if (start < earliest) continue;

    // §20.5 — the system refuses overlapping jobs, travel time included.
    let blocked = false;
    let routeCost = 0;

    for (const job of existing) {
      const buffer = bufferBetween(property.postcode, job.postcode);
      if (
        overlaps(
          addMinutes(start, -buffer),
          addMinutes(end, buffer),
          job.start,
          job.end,
        )
      ) {
        blocked = true;
        break;
      }
      // Adjacent jobs still cost travel — surfaced so the owner can see which
      // slots keep the day's route tight.
      const gapBefore = (start.getTime() - job.end.getTime()) / 60_000;
      const gapAfter = (job.start.getTime() - end.getTime()) / 60_000;
      if (gapBefore >= 0 && gapBefore < 180) routeCost += buffer;
      if (gapAfter >= 0 && gapAfter < 180) routeCost += buffer;
    }
    if (blocked) continue;

    if (heldRanges.some((h) => overlaps(start, end, h.start, h.end))) continue;

    slots.push({
      start: start.toISOString(),
      end: end.toISOString(),
      durationMinutes,
      routeCost,
    });
  }

  return slots;
}

export interface DayAvailability {
  date: string;
  blocked: DayBlockReason | null;
  slots: Slot[];
}

export function availabilityCalendar(q: SlotQuery): DayAvailability[] {
  const out: DayAvailability[] = [];
  for (let i = 0; i < q.days; i += 1) {
    const day = addDays(startOfDay(q.from), i);
    const blocked = dayBlockReason(day, q);
    out.push({
      date: day.toISOString(),
      blocked,
      slots: blocked ? [] : slotsForDay(day, q),
    });
  }
  return out;
}

/**
 * The next few slots, cheapest route first. This is what the admin quote
 * builder shows read-only while pricing — capacity awareness without taking
 * the choice away from the customer.
 */
export function nextSlots(q: SlotQuery, limit = 6): Slot[] {
  return availabilityCalendar(q)
    .flatMap((d) => d.slots)
    .sort((a, b) => a.routeCost - b.routeCost || a.start.localeCompare(b.start))
    .slice(0, limit);
}

/* ------------------------------------------------------------------ holds */

export const HOLD_MINUTES = 15;

export function createHold(
  offerId: string,
  slot: Slot,
  now: Date,
  /**
   * Overridden by the office confirming a proposed date. Fifteen minutes is
   * the right pressure on someone standing at a checkout and the wrong one on
   * someone who has to read a mail first — see `SlotHold.confirmed`.
   */
  options: { minutes?: number; confirmed?: boolean } = {},
): SlotHold {
  return {
    id: `hold_${offerId}_${slot.start}`,
    offerId,
    start: slot.start,
    duration: slot.durationMinutes,
    expiresAt: addMinutes(now, options.minutes ?? HOLD_MINUTES).toISOString(),
    confirmed: options.confirmed,
  };
}

export function holdSecondsLeft(hold: SlotHold, now: Date) {
  return Math.max(0, Math.floor((new Date(hold.expiresAt).getTime() - now.getTime()) / 1000));
}

/** §20.5 — flags two jobs whose travel time exceeds the gap between them. */
export function detectRouteConflicts(
  day: Date,
  bookings: Booking[],
  properties: Pick<Property, 'id' | 'postcode'>[],
) {
  const jobs = bookingsOnDay(day, bookings);
  const conflicts: { a: Booking; b: Booking; needed: number; available: number }[] = [];

  for (let i = 0; i < jobs.length - 1; i += 1) {
    const a = jobs[i]!;
    const b = jobs[i + 1]!;
    const needed = bufferBetween(
      properties.find((p) => p.id === a.propertyId)?.postcode,
      properties.find((p) => p.id === b.propertyId)?.postcode,
    );
    const available =
      (new Date(b.start).getTime() - addMinutes(new Date(a.start), a.duration).getTime()) /
      60_000;
    if (available < needed) conflicts.push({ a, b, needed, available });
  }

  return conflicts;
}
