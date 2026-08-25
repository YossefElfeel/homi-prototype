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
  Payment,
  Plan,
  RhythmKey,
  Service,
  ServiceRequest,
  Subscription,
} from '@/mock/schema';
import { offerTotal, roundChf } from '@/mock/engines/offers';
/* The one implementation of "add up an invoice". A second one here would be
   two answers to the same sum the first time a line grows a field. */
import { invoiceTotal } from '@/lib/customer-history';

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

export type CoverageKind = 'subscription' | 'payable';

export interface Coverage {
  kind: CoverageKind;
  /** The subscription the work would be drawn against. */
  sourceId?: ID;
  /** Visits left on the plan, for the ones that are close to running out. */
  visitsRemaining?: number;
}

/**
 * Whether this job is already paid for.
 *
 * There is one answer to that now: the plan, counted in visits. Hour credit
 * bought as a separate package used to be a second one, and two ledgers for the
 * same question is how a job gets covered twice or not at all — the hours came
 * off one balance while the plan's visit counter, the thing every screen shows,
 * stayed where it was. What a customer pays for up front is a plan, and what
 * they spend is a visit off it.
 *
 * A plan runs out two ways rather than one. Its term can end, and it can be
 * *spent* — the term still running, every included visit used. The second is
 * the one that would otherwise produce free work silently: before visits were
 * counted, a plan covered everything it touched for a whole year no matter how
 * much of it there was.
 *
 * Decided off the request, not the quote: the plan pays for a visit whatever
 * the quote says it will take. Hours only ever mattered here while a package
 * balance had to stretch to them.
 */
export function requestCoverage(
  request: ServiceRequest | undefined,
  subscriptions: Subscription[],
  plans: Plan[],
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
  /*
   * The plan paid for it — and the plan has to be on the record for that to be
   * true. This read "no quote and no invoice", which is not the same thing: a
   * job entered by hand on the phone has neither either, and every one of them
   * came out of this function labelled «Im Abo» — the bookings list telling
   * the owner a monthly charge had settled a job no plan covers.
   *
   * A draft invoice is still not this: it means we have not asked yet, which
   * is money outstanding.
   */
  if (booking.subscriptionId && !booking.offerId && !invoice) return 'covered';
  return 'unpaid';
}

/** Which record the amount came off. Four different kinds of certainty. */
export type AmountBasis = 'offer' | 'invoice' | 'plan' | 'estimate';

export interface BookingAmount {
  amount: number;
  basis: AmountBasis;
}

/**
 * What one job is worth, and which record says so.
 *
 * The bookings list read the amount off the quote and printed «—» when there
 * was none — which is most of them. A job entered on the phone has no quote, a
 * plan visit has no quote, and a job invoiced afterwards has one only if
 * somebody quoted it first. So the money column was a dash down the page, on
 * the one screen that exists to answer what a month is worth.
 *
 * The basis travels with the number on purpose. A signed quote, an issued
 * invoice, a plan's per-visit share and an hourly estimate are four different
 * kinds of certainty, and a column that printed all four as plain francs would
 * make the estimate look like a bill somebody owes.
 *
 * The order is what keeps it from counting the same money twice. The quote is
 * what was agreed, so it wins; the invoice is what was actually asked for; a
 * plan visit is already paid for by the monthly charge, so its share is
 * informational and marked `/ Einsatz`; the estimate is last because it is the
 * only one of the four nobody has agreed to.
 */
export function bookingAmount(
  booking: Booking,
  sources: {
    offers: Offer[];
    invoices: Invoice[];
    subscriptions: Subscription[];
    plans: Plan[];
    services: Service[];
    /** §5.1's office rate — the fallback for work priced by the unit. */
    hourlyRate: number;
  },
): BookingAmount {
  const offer = booking.offerId
    ? sources.offers.find((o) => o.id === booking.offerId)
    : undefined;
  if (offer) return { amount: offerTotal(offer), basis: 'offer' };

  const invoice = sources.invoices.find((i) => i.bookingId === booking.id);
  if (invoice) return { amount: invoiceTotal(invoice), basis: 'invoice' };

  if (booking.subscriptionId) {
    const subscription = sources.subscriptions.find((s) => s.id === booking.subscriptionId);
    const plan = sources.plans.find((p) => p.id === subscription?.planId);
    if (plan && plan.includedVisits > 0) {
      return { amount: roundChf(plan.price / plan.includedVisits), basis: 'plan' };
    }
  }

  /* `basePrice` is per *unit* for window and furniture work, so it cannot
     price an hour of it. The office rate can, and what this returns is an
     estimate either way — the column says so. */
  const service = sources.services.find((s) => s.slug === booking.serviceSlug);
  const rate = service?.calc === 'hourly' ? service.basePrice : sources.hourlyRate;
  return { amount: roundChf((booking.duration / 60) * rate), basis: 'estimate' };
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

  /* `expired` passes this test on purpose. A year of visits that has since run
     out is the strongest evidence of a relationship on this model, not the
     weakest — only a cancelled-and-refunded plan means nothing ever happened. */
  return subscriptions.some(
    (s) => s.customerId === customerId && s.status !== 'cancelled',
  );
}

/** How long the office's confirmed date is held before the slot is released. */
export const CONFIRMED_HOLD_HOURS = 48;

export function customerName(customer: Customer | undefined) {
  return customer ? `${customer.firstName} ${customer.lastName}` : '—';
}
