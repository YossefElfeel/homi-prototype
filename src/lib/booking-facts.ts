/**
 * What a customer may do to their own appointment, and what it costs.
 *
 * §12 has been on the screen since the first wave and only ever as a sentence:
 * the dashboard prints «kostenlos stornierbar bis …», the quote checkout lists
 * «danach {percent} %», and *nothing in the prototype could cancel a job*. A
 * deadline with no control behind it is worse than no deadline — it tells the
 * customer they have until Thursday to do a thing the product does not let
 * them do, so the cancellation arrives by phone on Thursday afternoon, which
 * is the call this whole account exists to prevent.
 *
 * The window lives here rather than on the screen because three readers need
 * the same answer and must not drift: the appointment list (which rows still
 * carry an action), the appointment detail (the button and its warning), and
 * the dashboard card (whether to promise anything at all).
 *
 * Deliberately *not* here: what the fee is in francs. §12 fixes a percentage,
 * and the base it applies to — the quote total, the plan visit's share, or the
 * hours actually booked — has never been settled for a plan visit, which
 * carries a `subscriptionId` and no offer. The screens state the percentage,
 * which is the number the customer was promised at checkout; turning it into
 * money is §12a on /open-questions.
 */

import type { Booking, BookingStatus, Settings, TimelineEvent } from '@/mock/schema';

/**
 * Why an appointment cannot be called off, in the customer's terms.
 *
 * A boolean would have collapsed these into a disabled button, and they need
 * different sentences: work that is finished cannot be cancelled, work already
 * under way has a van outside, and a job called off twice is a bug.
 *
 * `planVisit` is the one that is a redirection rather than a refusal. A visit
 * that belongs to a plan is called off by *skipping* it, and skipping counts
 * against the monthly allowance `settings.monthlyFreeSkips` sets. Cancelling
 * it from here would set the same `cancelled` status while recording no skip —
 * so the allowance could be walked past entirely by using this screen instead
 * of the plan. One writer for that rule, and it is `skipNextVisit` on the plan
 * screen; this sends the customer there.
 */
export type CancelRefusal = 'running' | 'finished' | 'alreadyCancelled' | 'planVisit';

export type BookingCancelWindow =
  | { may: false; reason: CancelRefusal }
  | {
      may: true;
      /** Inside the free window — §12's promise still holds. */
      free: boolean;
      /** The moment the free window shuts. Always in the future when `free`. */
      freeUntil: Date;
      /** What §12 charges once it has. Zero while `free`. */
      feePercent: number;
    };

/** The two states a job can still be called off from. Everything else has moved on. */
const CANCELLABLE: BookingStatus[] = ['scheduled', 'rescheduled'];

/**
 * The one derivation every appointment surface reads.
 *
 * `now` is passed rather than read, for the same reason the invoice screens
 * pass it: the demo clock is a control on this prototype, and a module that
 * called `new Date()` would answer differently from the screen around it the
 * moment somebody moved the date.
 */
export function bookingCancelWindow(
  booking: Booking,
  settings: Pick<Settings, 'cancellationFreeHours' | 'lateCancellationPercent'>,
  now: Date,
): BookingCancelWindow {
  if (booking.status === 'cancelled') return { may: false, reason: 'alreadyCancelled' };
  if (booking.status === 'inProgress') return { may: false, reason: 'running' };
  if (!CANCELLABLE.includes(booking.status)) return { may: false, reason: 'finished' };
  /* Before the date checks: a plan visit is redirected whatever its timing,
     because the skip allowance is the thing being protected, not the deadline. */
  if (booking.subscriptionId) return { may: false, reason: 'planVisit' };

  const start = new Date(booking.start);
  /* A job whose start has passed while still `scheduled` is one nobody has
     checked in on — the office's problem, not something the customer should be
     invited to cancel out from under a van that may already be there. */
  if (start <= now) return { may: false, reason: 'running' };

  const freeUntil = new Date(start.getTime() - settings.cancellationFreeHours * 3_600_000);
  const free = now < freeUntil;

  return {
    may: true,
    free,
    freeUntil,
    feePercent: free ? 0 : settings.lateCancellationPercent,
  };
}

/**
 * The states that mean the work is behind us, whatever the date says.
 *
 * `awaitingApproval` is *not* in this list and is not upcoming either — it is
 * the one state that belongs to neither side of the split. §5.3 gives it to
 * the office: the contractor reported more hours than the quote covered and
 * the owner has to price them. Nothing is being asked of the customer, so it
 * is shown and never actioned — a «wartet auf Sie» filter over it would be the
 * account inventing a decision the customer is not allowed to make.
 */
const FINISHED: BookingStatus[] = ['completed', 'invoiced', 'closed', 'noAccess'];

/**
 * Is this appointment still ahead of the customer, or is it history?
 *
 * The split the list is built on. It reads the clock rather than the status
 * because the two disagree in exactly the case that matters: a job left
 * `scheduled` after its date has passed is not upcoming, whatever the record
 * says, and putting it under «Kommende Termine» would have the account
 * promising a van that came last week.
 */
export function isUpcoming(booking: Booking, now: Date): boolean {
  if (booking.status === 'cancelled') return false;
  if (booking.status === 'awaitingApproval') return false;
  if (FINISHED.includes(booking.status)) return false;
  return new Date(booking.start) > now;
}

/**
 * The events on a job that are the customer's business — by kind, never by label.
 *
 * `Booking.history` is the *office's* record and three of the things it holds
 * have no business on a customer's screen. `assigned` names which contractor
 * is coming and every time that changed, which is a staffing decision and
 * reads as churn. `hours` and `approved` are the two halves of the §5.3
 * conversation about an overrun — and the appointment screen tells the
 * customer, in as many words, that we will be in touch *before* anything is
 * billed. Printing the raw negotiation underneath that sentence would
 * contradict it.
 *
 * The kind is returned rather than the stored label, and that is the second
 * half of the point. Those labels are written by the seed and the store, never
 * by the dictionary — `scripts/lang-check.mts` requires them to be English so
 * that a locale switch cannot half-translate the console. Rendering them here
 * would put "Booked and paid" on a German customer's screen. The caller reads
 * the kind out of its own dictionary instead, so the timeline is in the
 * language the rest of the page is in.
 *
 * `note` is the exception that proves it: free text is shown, but only the
 * customer's own — the reason they typed when they called the job off.
 */
const CUSTOMER_KINDS = [
  'created',
  'rescheduled',
  'checkIn',
  'checkOut',
  'noAccess',
  'completed',
  'invoiced',
  'closed',
  'cancelled',
] as const;

export type CustomerEventKind = (typeof CUSTOMER_KINDS)[number];

export type CustomerEvent =
  | { at: string; kind: CustomerEventKind; text?: undefined }
  /** The customer's own words, shown verbatim because they wrote them. */
  | { at: string; kind: 'note'; text: string };

export function customerVisibleEvents(booking: Booking): CustomerEvent[] {
  return booking.history.flatMap((event: TimelineEvent): CustomerEvent[] => {
    if (event.kind === 'note') {
      return event.actor === 'customer' && event.label.trim()
        ? [{ at: event.at, kind: 'note', text: event.label }]
        : [];
    }
    return (CUSTOMER_KINDS as readonly string[]).includes(event.kind)
      ? [{ at: event.at, kind: event.kind as CustomerEventKind }]
      : [];
  });
}
