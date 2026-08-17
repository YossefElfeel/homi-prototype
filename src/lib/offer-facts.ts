/**
 * The facts about a quote that live outside the quote.
 *
 * Screen 57 listed six columns, and every one of them came off the `Offer`
 * record itself — reference, total, dates, status. That is why the list could
 * not answer any of the questions actually asked of it: *what* was quoted, how
 * often it repeats, whether the money arrived, and whether it is billable at
 * all or already covered by a plan the customer pays monthly. None of those
 * are stored on the offer, and all four are derivable — so they are derived
 * here, once, rather than assembled inline on each screen that needs them.
 *
 * Derivation over storage is deliberate: a `coveredBy` column written at quote
 * time is wrong the moment a package runs out of hours.
 */

import type {
  Booking,
  Customer,
  ID,
  Offer,
  PackageCredit,
  Payment,
  PlanTier,
  ServiceRequest,
  Subscription,
} from '@/mock/schema';
import { offerHours } from '@/mock/engines/offers';

/* ----------------------------------------------------------- frequency */

export type RhythmKey = 'oneTime' | 'biweekly' | 'weekly' | 'twiceWeekly';

/**
 * §11 — the plan *is* the rhythm. There is no separate interval field and
 * there should not be one: two places that both claim to say how often a
 * customer is visited will disagree eventually, and the plan is the one the
 * customer is billed against.
 */
export const PLAN_RHYTHM: Record<PlanTier, RhythmKey> = {
  basic: 'biweekly',
  premium: 'weekly',
  vip: 'twiceWeekly',
};

/**
 * One-time or recurring, from the request the quote answers.
 *
 * `subscriptionIntent` is what the customer ticked in the booking wizard, and
 * an accepted quote carrying one is what the subscription is opened from — so
 * it is the honest source for "is this a single job or the start of a plan?"
 * long before a `Subscription` row exists.
 */
export function offerRhythm(request: ServiceRequest | undefined): RhythmKey {
  return request?.subscriptionIntent ? PLAN_RHYTHM[request.subscriptionIntent] : 'oneTime';
}

/* ------------------------------------------------------------ coverage */

export type CoverageKind = 'subscription' | 'package' | 'payable';

export interface Coverage {
  kind: CoverageKind;
  /** The subscription or credit the work would be drawn against. */
  sourceId?: ID;
  /** Hours left on the package, for the ones that are close to running out. */
  hoursRemaining?: number;
}

/**
 * Whether this job is already paid for.
 *
 * The order matters. A subscription customer's regular visit is covered by the
 * plan whether or not they also hold package hours, and charging a card for it
 * would be a double bill. Package hours only answer for the work if there are
 * enough of them: a six-hour job against four remaining hours is a payable
 * job, not a covered one, and calling it covered is how an invoice goes
 * missing.
 */
export function offerCoverage(
  offer: Offer,
  request: ServiceRequest | undefined,
  subscriptions: Subscription[],
  credits: PackageCredit[],
  now: Date,
): Coverage {
  if (!request) return { kind: 'payable' };

  const plan = subscriptions.find(
    (s) =>
      s.customerId === request.customerId &&
      s.propertyId === request.propertyId &&
      s.serviceSlug === request.serviceSlug &&
      (s.status === 'active' || s.status === 'pastDue' || s.status === 'cancellationPending'),
  );
  if (plan) return { kind: 'subscription', sourceId: plan.id };

  const hours = offerHours(offer);
  const credit = credits.find(
    (c) =>
      c.customerId === request.customerId &&
      c.propertyId === request.propertyId &&
      new Date(c.expiresAt) > now &&
      c.hoursRemaining >= hours,
  );
  if (credit) {
    return { kind: 'package', sourceId: credit.id, hoursRemaining: credit.hoursRemaining };
  }

  return { kind: 'payable' };
}

/* ------------------------------------------------------------- payment */

/**
 * The payment that decided this quote.
 *
 * Latest wins: §20.2 keeps a failed attempt on the record and lets the
 * customer retry, so an offer can carry a `failed` and a `succeeded` payment
 * at once. Showing the first one would say a paid job is unpaid.
 */
export function offerPayment(offerId: ID, payments: Payment[]): Payment | undefined {
  return payments
    .filter((p) => p.offerId === offerId)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
}

/** The job a paid quote turned into. */
export function offerBooking(offerId: ID, bookings: Booking[]): Booking | undefined {
  return bookings.find((b) => b.offerId === offerId);
}

/* ------------------------------------------------------------- history */

/**
 * Has this customer been served before?
 *
 * Decides which scheduling path the quote takes (see `Offer.proposedSlots`).
 * "Served", not "registered": an account created by the first quote we ever
 * sent them is not a relationship, and treating it as one puts a stranger
 * straight into the calendar. A plan counts even before its first visit —
 * signing a year's commitment is the relationship.
 */
export function isReturningCustomer(
  customerId: ID,
  bookings: Booking[],
  subscriptions: Subscription[],
): boolean {
  const served = bookings.some(
    (b) =>
      b.customerId === customerId &&
      (b.status === 'completed' ||
        b.status === 'invoiced' ||
        b.status === 'closed' ||
        b.status === 'inProgress'),
  );
  if (served) return true;

  return subscriptions.some(
    (s) => s.customerId === customerId && s.status !== 'cancelled',
  );
}

/** How long the office's confirmed date is held before the slot is released. */
export const CONFIRMED_HOLD_HOURS = 48;

export function customerName(customer: Customer | undefined) {
  return customer ? `${customer.firstName} ${customer.lastName}` : '—';
}
