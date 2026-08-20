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
  Invoice,
  Offer,
  PackageCredit,
  Payment,
  Plan,
  RhythmKey,
  ServiceRequest,
  Subscription,
} from '@/mock/schema';
import { offerHours } from '@/mock/engines/offers';

/* ----------------------------------------------------------- frequency */

/**
 * How often a plan's visits are meant to land, read off the plan's own numbers.
 *
 * This replaces a `PLAN_RHYTHM` map that hardcoded one rhythm per tier. The map
 * was a second place claiming how often a customer is visited, and it could not
 * survive a plan being editable: change a plan to twenty-six visits and the map
 * would still call it weekly. Twenty-six visits across twelve months *is*
 * fortnightly — so the rhythm is derived from the visits, and there is nothing
 * left for it to disagree with.
 */
export function planRhythm(plan: Plan | undefined): RhythmKey {
  if (!plan || plan.includedVisits <= 0 || plan.validityMonths <= 0) return 'oneTime';

  // Months rather than weeks, because `validityMonths` is what a plan stores.
  // 4.33 is the average number of weeks in a month.
  const perWeek = plan.includedVisits / plan.validityMonths / 4.33;
  if (perWeek >= 1.75) return 'twiceWeekly';
  if (perWeek >= 0.85) return 'weekly';
  if (perWeek >= 0.4) return 'biweekly';
  return 'monthly';
}

/**
 * One-time or recurring, from the request the quote answers.
 *
 * `planIntent` is the plan the customer picked in the booking wizard, and an
 * accepted quote carrying one is what the subscription is opened from — so it
 * is the honest source for "is this a single job or the start of a plan?" long
 * before a `Subscription` row exists.
 */
export function offerRhythm(request: ServiceRequest | undefined, plans: Plan[]): RhythmKey {
  if (!request?.planIntent) return 'oneTime';
  return planRhythm(plans.find((p) => p.id === request.planIntent));
}

/* ------------------------------------------------------------ coverage */

export type CoverageKind = 'subscription' | 'package' | 'payable';

export interface Coverage {
  kind: CoverageKind;
  /** The subscription or credit the work would be drawn against. */
  sourceId?: ID;
  /** Hours left on the package, for the ones that are close to running out. */
  hoursRemaining?: number;
  /** Visits left on the plan, for the same reason. */
  visitsRemaining?: number;
}

/**
 * Whether this job is already paid for.
 *
 * The order matters. A plan customer's regular visit is covered by the plan
 * whether or not they also hold package hours, and charging a card for it would
 * be a double bill. Package hours only answer for the work if there are enough
 * of them: a six-hour job against four remaining hours is a payable job, not a
 * covered one, and calling it covered is how an invoice goes missing.
 *
 * A plan now runs out two ways rather than one. Its term can end, and it can be
 * *spent* — the term still running, every included visit used. The second is
 * new, and it is the one that would otherwise produce free work silently:
 * before visits were counted, a plan covered everything it touched for a whole
 * year no matter how much of it there was.
 */
export function offerCoverage(
  offer: Offer,
  request: ServiceRequest | undefined,
  subscriptions: Subscription[],
  plans: Plan[],
  credits: PackageCredit[],
  now: Date,
): Coverage {
  if (!request) return { kind: 'payable' };

  const subscription = subscriptions.find((s) => {
    if (s.customerId !== request.customerId || s.propertyId !== request.propertyId) return false;
    if (s.status !== 'active') return false;
    if (new Date(s.endDate) <= now) return false;
    const plan = plans.find((x) => x.id === s.planId);
    if (!plan || plan.serviceSlug !== request.serviceSlug) return false;
    return s.visitsUsed < plan.includedVisits;
  });
  if (subscription) {
    const plan = plans.find((x) => x.id === subscription.planId);
    return {
      kind: 'subscription',
      sourceId: subscription.id,
      visitsRemaining: (plan?.includedVisits ?? 0) - subscription.visitsUsed,
    };
  }

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

export type BookingPaymentState = 'paid' | 'pending' | 'unpaid' | 'covered';

/**
 * Where the money for one job stands — §10.
 *
 * Money reaches a booking by two different roads and a booking can be on
 * either: a quote paid up front before the slot was confirmed, or an invoice
 * raised after the work. The bookings list showed the invoice column only, so
 * every job paid at the quote read as having no invoice — which is true, and
 * says nothing about whether we were paid.
 *
 * `covered` is not a fourth colour for tidiness. A plan visit has no quote and
 * no invoice of its own because the monthly charge already paid for it; filing
 * it under "unpaid" would point the owner at money nobody owes, which is the
 * same mistake `paymentNotDue` exists to prevent on the quotes list.
 */
export function bookingPaymentState(
  booking: Booking,
  payments: Payment[],
  invoices: Invoice[],
): BookingPaymentState {
  const invoice = invoices.find((i) => i.bookingId === booking.id);
  const payment = booking.offerId ? offerPayment(booking.offerId, payments) : undefined;

  if (payment?.status === 'succeeded' || invoice?.status === 'paid') return 'paid';
  if (
    payment?.status === 'pending' ||
    invoice?.status === 'sent' ||
    invoice?.status === 'overdue'
  ) {
    return 'pending';
  }
  /* No quote and no invoice: the plan paid for it. A draft invoice is not this
     — it means we have not asked yet, which is money still outstanding. */
  if (!booking.offerId && !invoice) return 'covered';
  return 'unpaid';
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
  credits: PackageCredit[] = [],
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

  /* `expired` passes this test on purpose. A year of visits that has since run
     out is the strongest evidence of a relationship on this model, not the
     weakest — only a cancelled-and-refunded plan means nothing ever happened. */
  if (subscriptions.some((s) => s.customerId === customerId && s.status !== 'cancelled')) {
    return true;
  }

  /*
   * Someone who has paid for ten hours up front is not a stranger, whatever
   * the booking statuses happen to say. Without this the demo account — whose
   * package ledger records two finished jobs — was routed down the first-job
   * path, because the bookings those ledger entries point at are seeded
   * `scheduled` rather than `closed`.
   */
  return credits.some((c) => c.customerId === customerId);
}

/** How long the office's confirmed date is held before the slot is released. */
export const CONFIRMED_HOLD_HOURS = 48;

export function customerName(customer: Customer | undefined) {
  return customer ? `${customer.firstName} ${customer.lastName}` : '—';
}
