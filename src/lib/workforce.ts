/**
 * Who is on a job, and how long it actually took them.
 *
 * Both halves used to be assertions no screen could check. `assigneeId` was
 * written when a booking was created and never again — /open-questions §2a
 * records why the panel that changed it was taken out, and says in as many
 * words that the day a second pair of hands exists the screen needs it back.
 * That day is here: the seed hires two contractors, and the field app filters
 * a person's whole day on a field the office could not edit.
 *
 * The hours were worse. §5.3 splits the job — the person on site reports the
 * time, the office prices it — and the reporting half wrote a *sentence*
 * («Ausgecheckt · +1 h reported») into the timeline. Nothing could add that
 * up, filter on it, or correct a typo in it.
 *
 * Everything here is derived from `Booking.work` and `TeamMember`, in one
 * place, because five screens now ask the same four questions of them and five
 * inline answers is how the totals start disagreeing.
 */

import type { Booking, ID, TeamMember, WorkEntry } from '@/mock/schema';
import { overlaps } from '@/mock/engines/availability';

/* ------------------------------------------------------------ the roster */

/**
 * Who a job may be handed to.
 *
 * `active` is not decoration: the team screen labels the switch «can be
 * assigned jobs», and until now the one select that assigned anything listed
 * everybody regardless. A person parked over the winter stayed in the dropdown
 * with nothing to say they were parked.
 *
 * The owner stays in the list. Marco does the work as well as sells it, and a
 * roster that excluded him would make the common case — a job that is his —
 * unassignable.
 */
export function assignableTeam(team: TeamMember[]): TeamMember[] {
  return team.filter((m) => m.active);
}

export function memberById(team: TeamMember[], id?: ID): TeamMember | undefined {
  return id ? team.find((m) => m.id === id) : undefined;
}

export function memberName(member: TeamMember | undefined): string {
  return member ? `${member.firstName} ${member.lastName}` : '';
}

/* ------------------------------------------------------- what may go wrong */

/**
 * Why an assignment is worth a second look — never why it is refused.
 *
 * The office is on the phone and knows things the record does not: the
 * contractor is driving past anyway, the customer asked for that person by
 * name, the skill list is a fortnight out of date. So none of these block the
 * save. What they must not do is stay silent — a job handed to somebody not
 * cleared for the service, or already at another address at that hour, is a
 * van that does not arrive.
 *
 * `clash` is the one that cannot be recovered from on the day, so it sorts
 * first everywhere it is shown.
 */
export type AssignmentWarning = 'clash' | 'skill' | 'region' | 'inactive';

export function assignmentWarnings(
  member: TeamMember,
  booking: Booking,
  allBookings: Booking[],
  properties: { id: ID; postcode: string }[],
): AssignmentWarning[] {
  const warnings: AssignmentWarning[] = [];

  if (clashingBookings(member.id, booking, allBookings).length > 0) warnings.push('clash');
  /* The owner is cleared for everything by definition — §22 gives them every
     permission, and listing "not cleared for this service" against the person
     who wrote the service list would be noise on every job. */
  if (member.role !== 'owner') {
    if (!member.skills.includes(booking.serviceSlug)) warnings.push('skill');
    const postcode = properties.find((p) => p.id === booking.propertyId)?.postcode;
    if (postcode && !member.regions.includes(postcode)) warnings.push('region');
  }
  if (!member.active) warnings.push('inactive');

  return warnings;
}

/** Jobs this person is already standing at while that one runs. */
export function clashingBookings(
  memberId: ID,
  booking: Booking,
  allBookings: Booking[],
): Booking[] {
  const start = new Date(booking.start);
  const end = new Date(start.getTime() + booking.duration * 60_000);

  return allBookings.filter((b) => {
    if (b.id === booking.id || b.assigneeId !== memberId) return false;
    /* A called-off or finished job occupies nobody. `cancelled` in particular
       would otherwise make every replacement booking look like a clash with
       the job it replaced. */
    if (b.status === 'cancelled' || b.status === 'closed') return false;
    const bStart = new Date(b.start);
    return overlaps(start, end, bStart, new Date(bStart.getTime() + b.duration * 60_000));
  });
}

/* -------------------------------------------------------------- the hours */

/** Minutes recorded against a job, by everybody who worked it. */
export function workedMinutes(booking: Booking): number {
  return (booking.work ?? []).reduce((sum, entry) => sum + entry.minutes, 0);
}

/** Whether anybody has recorded anything at all — distinct from zero. */
export function hasWorkRecord(booking: Booking): boolean {
  return (booking.work ?? []).length > 0;
}

export function workEntryFor(booking: Booking, memberId?: ID): WorkEntry | undefined {
  return memberId ? (booking.work ?? []).find((w) => w.memberId === memberId) : undefined;
}

/**
 * Over or under the estimate, in minutes. Negative is a job that finished early.
 *
 * Signed rather than clamped at zero, because §5.3 is not only about charging
 * more: a plan visit that keeps finishing an hour early is the estimate being
 * wrong, and that is the same number read the other way.
 */
export function varianceMinutes(booking: Booking): number {
  return workedMinutes(booking) - booking.duration;
}

/** Everything one person has recorded, across the jobs handed to them. */
export function memberMinutes(
  bookings: Booking[],
  memberId: ID,
  range?: { from: Date; to: Date },
): number {
  return bookings.reduce((sum, b) => {
    if (range) {
      const at = new Date(b.start);
      if (at < range.from || at > range.to) return sum;
    }
    return (
      sum +
      (b.work ?? []).reduce((n, w) => (w.memberId === memberId ? n + w.minutes : n), 0)
    );
  }, 0);
}

/** How many jobs carry a recorded entry for this person. */
export function memberJobCount(bookings: Booking[], memberId: ID): number {
  return bookings.filter((b) => (b.work ?? []).some((w) => w.memberId === memberId)).length;
}

/* -------------------------------------------------------------- rendering */

/**
 * Minutes as decimal hours, at one decimal place.
 *
 * The field screen asks for hours in steps of 0.5 and the whole product prints
 * `duration / 60`, so this is the shape every caller already wanted. One
 * decimal rather than two: nobody records seven point two five hours, and
 * «7.25 Std.» beside a planned «5 Std.» reads as a measurement rather than as
 * something a person typed.
 */
export function hoursOf(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

/** Hours back to whole minutes — the inverse, in one place, so the two agree. */
export function minutesOf(hours: number): number {
  return Math.round(hours * 60);
}

/**
 * The ceiling on a single entry, in hours.
 *
 * Not a business rule — a typo guard. `80` instead of `8` is one missed
 * keystroke, and it lands in a total the office prices work off. A day longer
 * than this is two entries, or a conversation.
 */
export const MAX_WORK_HOURS = 24;

export function isValidWorkHours(hours: number): boolean {
  return Number.isFinite(hours) && hours > 0 && hours <= MAX_WORK_HOURS;
}
