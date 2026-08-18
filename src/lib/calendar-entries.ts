/**
 * Everything a calendar day can contain, in one shape.
 *
 * The calendar drew bookings and nothing else, in one flat accent colour for
 * every one of them. Nine booking states, three kinds of appointment, company
 * holidays and time held against an unsigned quote all rendered identically —
 * so a legend would have had nothing to explain and the week grid answered
 * "is there something on Tuesday" but never "what".
 *
 * Merging them here rather than in the page is what lets the day, week, month
 * and agenda views agree. Four views drawing the same day from four hand-rolled
 * filters is how they drift, and this calendar has already lost the closure
 * state that way — week and month drew company holidays, day and agenda did
 * not, and a closed day read "Nothing scheduled".
 *
 * Colour comes from `status-registry`. Nothing here invents a tone.
 */

import type { Booking, CalendarEvent, ClosurePeriod, SlotHold } from '@/mock/schema';
import {
  addMinutes,
  bookingsOnDay,
  closureFor,
  eventsOnDay,
  startOfDay,
} from '@/mock/engines/availability';
import { statusTone, type StatusTone } from './status-registry';

export type CalendarEntryKind = 'booking' | 'event' | 'hold';

export interface CalendarEntry {
  id: string;
  kind: CalendarEntryKind;
  start: Date;
  end: Date;
  tone: StatusTone;
  /** Absent for a hold: there is no job yet, so there is nothing to open. */
  href?: string;
  booking?: Booking;
  event?: CalendarEvent;
  hold?: SlotHold;
}

export interface CalendarDay {
  date: Date;
  closure?: ClosurePeriod;
  entries: CalendarEntry[];
}

export interface CalendarSource {
  bookings: Booking[];
  events: CalendarEvent[];
  holds: SlotHold[];
  closures: ClosurePeriod[];
  now: Date;
}

/**
 * Time held while a first-time customer decides.
 *
 * `slotsForDay` has always refused to offer these, so the scheduler knew the
 * time was gone — and the calendar did not draw them anywhere. The owner
 * looked at a day the engine considered half full and saw it empty, which is
 * the worst possible disagreement between two screens over the same fact.
 */
function holdsOnDay(day: Date, holds: SlotHold[], now: Date) {
  const d = startOfDay(day).getTime();
  return holds
    .filter((h) => new Date(h.expiresAt) > now)
    .filter((h) => startOfDay(new Date(h.start)).getTime() === d)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function calendarDay(day: Date, source: CalendarSource): CalendarDay {
  /* `closureFor`, not a copy of it. A recurring yearly shutdown compares
     month and day only, and a second implementation of that rule here would
     be one wave away from disagreeing with the scheduler about whether the
     office is open. */
  const closure = closureFor(day, source.closures);

  const entries: CalendarEntry[] = [
    ...bookingsOnDay(day, source.bookings).map((booking): CalendarEntry => {
      const start = new Date(booking.start);
      return {
        id: booking.id,
        kind: 'booking',
        start,
        end: addMinutes(start, booking.duration),
        tone: statusTone('booking', booking.status),
        href: `/admin/buchungen/${booking.id}`,
        booking,
      };
    }),
    ...eventsOnDay(day, source.events).map((event): CalendarEntry => {
      const start = new Date(event.start);
      return {
        id: event.id,
        kind: 'event',
        start,
        end: addMinutes(start, event.duration),
        tone: statusTone('calendarEvent', event.status),
        href: `/admin/kalender/${event.id}`,
        event,
      };
    }),
    ...holdsOnDay(day, source.holds, source.now).map((hold): CalendarEntry => {
      const start = new Date(hold.start);
      return {
        id: hold.id,
        kind: 'hold',
        start,
        end: addMinutes(start, hold.duration),
        /* Progress, not info: the time is spoken for but nothing is settled,
           which is exactly what the tone means everywhere else. */
        tone: 'progress',
        hold,
      };
    }),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  return { date: day, closure, entries };
}

/** Tailwind classes for a solid dot or chip in a given tone. */
export const TONE_DOT: Record<StatusTone, string> = {
  neutral: 'bg-status-neutral-fg',
  info: 'bg-status-info-fg',
  progress: 'bg-status-progress-fg',
  success: 'bg-status-success-fg',
  warning: 'bg-status-warning-fg',
  danger: 'bg-status-danger-fg',
};

/** Soft fill plus readable text, for the week grid's chips. */
export const TONE_CHIP: Record<StatusTone, string> = {
  neutral: 'bg-status-neutral text-status-neutral-fg',
  info: 'bg-status-info text-status-info-fg',
  progress: 'bg-status-progress text-status-progress-fg',
  success: 'bg-status-success text-status-success-fg',
  warning: 'bg-status-warning text-status-warning-fg',
  danger: 'bg-status-danger text-status-danger-fg',
};
