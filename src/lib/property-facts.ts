/**
 * The facts about a property that are not stored on it.
 *
 * A `Property` records what the address *is* — area, rooms, access, standing
 * notes. Everything the office actually asks a list of properties is a
 * question about time: when were we last there, and when are we next. Both
 * answers live in `bookings`, and both change without anybody touching the
 * property, so storing them would mean a nightly job to keep them true — the
 * same reason `plan-facts` derives an expired plan instead of writing one
 * down.
 *
 * The zone is the third of these. §6 draws the service area as eight
 * municipalities, and the postcode on the address is the only thing that says
 * which one — so "show me Meilen" is a question the stored record can answer
 * and the stored record has no field for.
 */

import type { DataSet } from '@/mock/scenarios';
import type { Booking, BookingStatus, ID, Property, PropertyKind } from '@/mock/schema';
import { regionByPostcode } from '@/mock/engines/coverage';

export const PROPERTY_KINDS: readonly PropertyKind[] = ['apartment', 'house', 'office'];

/* --------------------------------------------------------------- visits */

/**
 * A job that happened. `noAccess` is deliberately not in the set: nobody got
 * in, so nothing was cleaned, and printing that date under "last service"
 * would tell the office an address is looked after when it is the one address
 * that was missed. It stays visible on the property's own history, where the
 * badge says what went wrong.
 *
 * `awaitingApproval` is in: the work is done and the check-out written, only
 * the office sign-off is outstanding.
 */
const SERVED: readonly BookingStatus[] = [
  'awaitingApproval',
  'completed',
  'invoiced',
  'closed',
];

/**
 * A job still on the books. `inProgress` counts as the next one rather than
 * the last: it has not finished, and today's crew being on site is exactly
 * what somebody phoning about this address needs to hear first.
 *
 * Nothing here is filtered by date. A `scheduled` job whose day has passed is
 * still the next thing owed at this address — dropping it because the clock
 * moved would make the column go blank for precisely the rows that need
 * chasing.
 */
const BOOKED: readonly BookingStatus[] = ['scheduled', 'rescheduled', 'inProgress'];

export interface PropertyVisits {
  /** Most recent job that actually served the address. */
  last?: Booking;
  /** Earliest job still owed. */
  next?: Booking;
}

export function propertyVisits(bookings: Booking[], propertyId: ID): PropertyVisits {
  let last: Booking | undefined;
  let next: Booking | undefined;

  for (const booking of bookings) {
    if (booking.propertyId !== propertyId) continue;

    if (SERVED.includes(booking.status)) {
      if (!last || booking.start > last.start) last = booking;
    } else if (BOOKED.includes(booking.status)) {
      if (!next || booking.start < next.start) next = booking;
    }
  }

  return { last, next };
}

/* ----------------------------------------------------------------- zone */

export interface Zone {
  /** The postcode, which is what actually distinguishes two zones. */
  key: string;
  label: string;
}

/**
 * Which of the eight municipalities an address sits in.
 *
 * Falls back to the city typed on the record rather than to "unknown": the
 * area check gates intake, but a property entered by hand in the panel is not
 * gated, and an address in Rapperswil belongs under «Rapperswil» rather than
 * in a bucket that pretends we do not know where it is.
 */
export function zoneOf(property: Property): Zone {
  return {
    key: property.postcode,
    label: regionByPostcode(property.postcode)?.name || property.city || property.postcode,
  };
}

/** The zones actually present in a set of properties, ordered by postcode. */
export function zonesOf(properties: Property[]): Zone[] {
  const byKey = new Map<string, Zone>();
  for (const property of properties) {
    const zone = zoneOf(property);
    if (!byKey.has(zone.key)) byKey.set(zone.key, zone);
  }
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/* ------------------------------------------------------------ deletable */

/**
 * Everything that would be left pointing at nothing.
 *
 * Seven record types carry a `propertyId`, and three of them dereference it
 * with `!` on a screen. So "delete" cannot mean "remove the row and hope" —
 * it means "remove an address nothing has used yet", which is the only case
 * where the word is honest. A property with history is not deleted at all:
 * the office is told what holds it, and the record stays where the invoices
 * behind it can still resolve (§15).
 *
 * Deliberately not an archive flag. A customer is archived because a closed
 * household is still a household you may need back; an address typed wrong on
 * a phone call is a mistake, and a mistake that can only be hidden is how a
 * list of twelve addresses becomes a list of forty.
 */
export interface PropertyUsage {
  requests: number;
  bookings: number;
  subscriptions: number;
  credits: number;
  keys: number;
  events: number;
  photos: number;
  total: number;
}

export function propertyUsage(data: DataSet, propertyId: ID): PropertyUsage {
  const count = <T,>(rows: T[], read: (row: T) => ID | undefined) =>
    rows.filter((row) => read(row) === propertyId).length;

  const usage = {
    requests: count(data.requests, (r) => r.propertyId),
    bookings: count(data.bookings, (b) => b.propertyId),
    subscriptions: count(data.subscriptions, (s) => s.propertyId),
    credits: count(data.credits, (c) => c.propertyId),
    keys: count(data.keyLog, (k) => k.propertyId),
    events: count(data.events, (e) => e.propertyId),
    photos: count(data.photos, (p) => p.propertyId),
  };

  return {
    ...usage,
    total: Object.values(usage).reduce((sum, n) => sum + n, 0),
  };
}
