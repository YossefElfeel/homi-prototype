/**
 * Seed invariants for the quote wave.
 *
 * The wave added four derived columns to screen 57 and the data behind them.
 * Every one of those columns is a join — offer → request → customer, offer →
 * payment, offer → booking, offer → credit — and a join over seed data fails
 * silently: the cell renders "—" and reads as "nothing here yet" rather than
 * "this row is broken".
 */

import { SCENARIOS, buildScenario, seedHolds } from '../src/mock/scenarios.ts';
import { offerHours, offerTotal } from '../src/mock/engines/offers.ts';
import {
  bookingPaymentState,
  requestCoverage,
  offerPayment,
  offerBooking,
  offerRhythm,
} from '../src/lib/offer-facts.ts';
import { availabilityCalendar, startOfDay } from '../src/mock/engines/availability.ts';
import { businessWeekday, zonedParts } from '../src/lib/business-time.ts';
import { SEED_PLANS, SEED_SETTINGS } from '../src/mock/seed.ts';
import { SERVICE_SLUGS } from '../src/mock/schema.ts';
import { planOf, subscriptionState, visitsLeft } from '../src/lib/plan-facts.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

/* A fixed clock: the seed is written relative to "now", and a test that only
   passes on the weekday it was written is not a test. */
const CLOCKS = [
  new Date('2026-08-17T10:00:00Z'), // Monday
  new Date('2026-08-20T10:00:00Z'), // Thursday
  new Date('2026-08-22T10:00:00Z'), // Saturday
  new Date('2026-08-23T10:00:00Z'), // Sunday
];

for (const clock of CLOCKS) {
  const day = clock.toISOString().slice(0, 10);

  for (const name of SCENARIOS) {
    const d = buildScenario(name, clock);
    const tag = `[${name}@${day}]`;

    /* -------------------------------------------------- referential */
    const requestIds = new Set(d.requests.map((r) => r.id));
    const offerIds = new Set(d.offers.map((o) => o.id));
    const customerIds = new Set(d.customers.map((c) => c.id));
    const propertyIds = new Set(d.properties.map((p) => p.id));

    check(`${tag} offer ids unique`, offerIds.size === d.offers.length);
    check(
      `${tag} offer references unique`,
      new Set(d.offers.map((o) => o.reference)).size === d.offers.length,
      d.offers.map((o) => o.reference).filter((r, i, a) => a.indexOf(r) !== i).join(','),
    );
    check(`${tag} request ids unique`, requestIds.size === d.requests.length);
    check(
      `${tag} booking references unique`,
      new Set(d.bookings.map((b) => b.reference)).size === d.bookings.length,
      d.bookings.map((b) => b.reference).filter((r, i, a) => a.indexOf(r) !== i).join(','),
    );

    for (const o of d.offers) {
      check(`${tag} ${o.reference} → request`, requestIds.has(o.requestId), o.requestId);
    }
    for (const p of d.payments) {
      check(`${tag} payment ${p.id} → offer`, !p.offerId || offerIds.has(p.offerId), p.offerId);
      check(`${tag} payment ${p.id} amount > 0`, p.amount > 0, String(p.amount));
    }
    for (const b of d.bookings) {
      check(`${tag} booking ${b.reference} → offer`, !b.offerId || offerIds.has(b.offerId), b.offerId ?? '');
      check(`${tag} booking ${b.reference} → customer`, customerIds.has(b.customerId), b.customerId);
      check(`${tag} booking ${b.reference} → property`, propertyIds.has(b.propertyId), b.propertyId);
    }
    /* --------------------------------------------------------- reviews
       Every one of these caught something. `busy` filed two reviews under a
       customer who did not have the job they were about — the moderation card
       prints the customer's name, so it printed somebody who had never been to
       that address — and three of its four hung off jobs scheduled *ahead* of
       today, which is a five-star review of work nobody has done yet. The last
       check is the one that matters for the screen the customer sees: a
       booking may carry one review, and if every finished job of the demo
       account already carries one, screen 46 has nothing to offer and sits on
       its empty state for good. */
    const bookingsById = new Map(d.bookings.map((b) => [b.id, b]));
    const reviewedBookings = new Set<string>();

    check(`${tag} review ids unique`, new Set(d.reviews.map((r) => r.id)).size === d.reviews.length);

    for (const r of d.reviews) {
      const booking = bookingsById.get(r.bookingId);
      check(`${tag} review ${r.id} → customer`, customerIds.has(r.customerId), r.customerId);
      check(`${tag} review ${r.id} → booking`, Boolean(booking), r.bookingId);
      check(
        `${tag} review ${r.id} rating in range`,
        r.rating >= 1 && r.rating <= 5,
        String(r.rating),
      );
      check(`${tag} review ${r.id} on one booking only`, !reviewedBookings.has(r.bookingId), r.bookingId);
      reviewedBookings.add(r.bookingId);

      if (booking) {
        check(
          `${tag} review ${r.id} matches the booking's customer`,
          booking.customerId === r.customerId,
          `review=${r.customerId} booking=${booking.customerId}`,
        );
        /* You cannot review a job that has not happened. */
        check(
          `${tag} review ${r.id} is about a job in the past`,
          new Date(booking.start) < new Date(r.submittedAt),
          `job=${booking.start} review=${r.submittedAt}`,
        );
      }

      /* §20.6 — `published` is on the website now and `hidden` was on it
         until somebody took it down. Neither is reachable without consent, so
         a seeded record in either state without it is a website the seed
         claims was published unlawfully. */
      if (r.status === 'published' || r.status === 'hidden') {
        check(`${tag} review ${r.id} ${r.status} implies consent`, r.publishConsent);
      }
    }

    /* Screen 46 offers the most recent finished job with no review against it.
       Review every one of them and the screen is unreachable — which is what
       `busy` shipped. */
    const DEMO_ACCOUNT = 'cus_2';
    const reviewable = d.bookings.filter(
      (b) =>
        b.customerId === DEMO_ACCOUNT &&
        new Date(b.start) < clock &&
        (b.status === 'completed' || b.status === 'invoiced' || b.status === 'closed'),
    );
    if (reviewable.length > 0) {
      check(
        `${tag} the demo account still has a job to review`,
        reviewable.some((b) => !reviewedBookings.has(b.id)),
        reviewable.map((b) => b.reference).join(','),
      );
    }

    /* ------------------------------------------------------ pricing */
    for (const o of d.offers) {
      check(`${tag} ${o.reference} prices > 0`, offerTotal(o) > 0, String(offerTotal(o)));
      check(`${tag} ${o.reference} has hours`, offerHours(o) > 0, String(offerHours(o)));
    }

    /* -------------------------------------------------- signatures
       §9.2 runs in one direction: the company signs on sending, the customer
       signs on accepting. Both halves are derived in `seedSignatures` from
       `issuedAt` and `signedAt`, so the implications are what to assert — a
       scenario that hand-writes an offer past them would otherwise ship a
       contract with nobody's name on it. */
    for (const o of d.offers) {
      check(
        `${tag} ${o.reference} sent implies we signed`,
        Boolean(o.issuedAt) === Boolean(o.ownerSignature),
        `issued=${Boolean(o.issuedAt)} signed=${Boolean(o.ownerSignature)}`,
      );
      check(
        `${tag} ${o.reference} accepted implies they signed`,
        Boolean(o.signedAt) === Boolean(o.customerSignature),
        `signedAt=${Boolean(o.signedAt)} mark=${Boolean(o.customerSignature)}`,
      );
      for (const [who, sig] of [
        ['company', o.ownerSignature],
        ['customer', o.customerSignature],
      ] as const) {
        if (!sig) continue;
        check(`${tag} ${o.reference} ${who} mark has ink`, sig.path.trim().length > 0);
        check(`${tag} ${o.reference} ${who} mark is named`, sig.name.trim().length > 0, sig.name);
        check(`${tag} ${o.reference} ${who} mark has a role`, sig.role.trim().length > 0, sig.role);
      }
      /* The company cannot have signed after the customer: the quote goes out
         signed, so its mark is never younger than the acceptance. */
      if (o.ownerSignature && o.customerSignature) {
        check(
          `${tag} ${o.reference} we signed first`,
          new Date(o.ownerSignature.at) <= new Date(o.customerSignature.at),
          `${o.ownerSignature.at} → ${o.customerSignature.at}`,
        );
      }
    }

    /* -------------------------------------------- proposed dates */
    for (const o of d.offers) {
      for (const s of o.proposedSlots ?? []) {
        check(
          `${tag} ${o.reference} proposal not a Sunday`,
          businessWeekday(new Date(s)) !== 7,
          s,
        );
      }
      if (o.confirmedSlot) {
        check(
          `${tag} ${o.reference} confirmed slot is one it proposed`,
          (o.proposedSlots ?? []).includes(o.confirmedSlot),
          o.confirmedSlot,
        );
        check(`${tag} ${o.reference} confirmed slot has a timestamp`, Boolean(o.slotConfirmedAt));
      }
      if (o.slotConfirmedAt) {
        check(`${tag} ${o.reference} timestamp has a slot`, Boolean(o.confirmedSlot));
      }
    }

    /* ------------------------------------------------------- holds */
    const holds = seedHolds(d, clock);
    const expected = d.offers.filter(
      (o) => o.confirmedSlot && o.status === 'sent' && !d.bookings.some((b) => b.offerId === o.id),
    );
    check(`${tag} one hold per confirmed unbooked quote`, holds.length === expected.length,
      `${holds.length} vs ${expected.length}`);
    for (const h of holds) {
      check(`${tag} hold ${h.id} is marked confirmed`, h.confirmed === true);
      check(`${tag} hold ${h.id} outlasts now`, new Date(h.expiresAt) > clock);
      check(`${tag} hold ${h.id} has a duration`, h.duration > 0);
    }
    check(`${tag} hold ids unique`, new Set(holds.map((h) => h.id)).size === holds.length);

    /* ---------------------------------------------------- coverage */
    for (const o of d.offers) {
      const r = d.requests.find((x) => x.id === o.requestId);
      const cov = requestCoverage(r, d.subscriptions, SEED_PLANS, clock);
      /* A covered quote skips the gateway, so it must not also carry a
         successful charge — that would be the double bill the coverage rule
         exists to prevent. */
      if (cov.kind !== 'payable') {
        const pay = offerPayment(o.id, d.payments);
        check(`${tag} ${o.reference} covered and not charged`,
          !pay || pay.status !== 'succeeded', pay?.status ?? '');
      }
    }

    /* The walkthrough quote must stay payable or screens 27 and 31 are gone. */
    const off1 = d.offers.find((o) => o.id === 'off_1');
    if (off1) {
      const r = d.requests.find((x) => x.id === off1.requestId);
      check(`${tag} off_1 stays payable`,
        requestCoverage(r, d.subscriptions, SEED_PLANS, clock).kind === 'payable');
    }

    /* -------------------------------------------------------- plans */
    for (const sub of d.subscriptions) {
      const plan = planOf(sub, SEED_PLANS);
      check(`${tag} ${sub.reference} points at a real plan`, Boolean(plan), sub.planId);
      if (!plan) continue;

      /* Over-spending a package is the failure the visit counter exists to
         make visible, so the seed must never ship one already over. */
      check(
        `${tag} ${sub.reference} has not overspent its plan`,
        sub.visitsUsed <= plan.includedVisits,
        `${sub.visitsUsed} > ${plan.includedVisits}`,
      );
      check(`${tag} ${sub.reference} ends after it starts`, sub.endDate > sub.startDate);

      /* A stored status that the derived one contradicts is the bug the
         derivation was written to prevent: an "active" badge on a term that
         ended last month. */
      const state = subscriptionState(sub, clock);
      check(
        `${tag} ${sub.reference} stored status agrees with the clock`,
        !(sub.status === 'active' && state === 'expired') || new Date(sub.endDate) <= clock,
      );
      check(
        `${tag} ${sub.reference} visits left is never negative`,
        visitsLeft(sub, plan) >= 0,
      );

      /* One plan per property — two live packages on one address would give
         two of them the same visits to argue over. */
      const sameProperty = d.subscriptions.filter(
        (x) =>
          x.propertyId === sub.propertyId &&
          x.status !== 'cancelled' &&
          new Date(x.endDate) > clock,
      );
      check(
        `${tag} ${sub.propertyId} carries at most one live plan`,
        sameProperty.length <= 1,
        `${sameProperty.length}`,
      );

      const property = d.properties.find((x) => x.id === sub.propertyId);
      check(
        `${tag} ${sub.reference} property belongs to its customer`,
        property?.customerId === sub.customerId,
      );

      /* The invoice a plan names has to exist and has to point back, or the
         payment history on screen 70a is a promise the data cannot keep. */
      if (sub.invoiceId) {
        const invoice = d.invoices.find((i) => i.id === sub.invoiceId);
        check(`${tag} ${sub.reference} invoice exists`, Boolean(invoice), sub.invoiceId);
        check(
          `${tag} ${sub.reference} invoice points back`,
          invoice?.subscriptionId === sub.id,
        );
      }
    }

    for (const plan of SEED_PLANS) {
      check(`${tag} ${plan.reference} sells a real service`,
        (SERVICE_SLUGS as readonly string[]).includes(plan.serviceSlug), plan.serviceSlug);
      check(`${tag} ${plan.reference} includes at least one visit`, plan.includedVisits > 0);
      /* A retired plan on the marketing page advertises something the booking
         flow then refuses to sell. */
      check(`${tag} ${plan.reference} retired implies hidden`,
        plan.active || !plan.visibleOnSite);
    }

    /* --------------------------------------------- office services */
    for (const r of d.requests) {
      if (r.serviceSlug !== 'bueroreinigung') continue;
      const p = d.properties.find((x) => x.id === r.propertyId);
      check(`${tag} ${r.reference} office cleaning on an office`, p?.kind === 'office', p?.kind ?? '?');
    }

    /* ------------------------------- the demo scenario's coverage */
    if (name === 'demo') {
      const states = d.offers
        .filter((o) => o.status !== 'draft')
        .map((o) => {
          const r = d.requests.find((x) => x.id === o.requestId);
          return {
            cov: requestCoverage(r, d.subscriptions, SEED_PLANS, clock).kind,
            pay: offerPayment(o.id, d.payments)?.status,
            booking: Boolean(offerBooking(o.id, d.bookings)),
            rhythm: offerRhythm(r, SEED_PLANS),
            proposing: Boolean(o.proposedSlots?.length && !o.confirmedSlot),
            confirmed: Boolean(o.confirmedSlot),
          };
        });

      /* The quote detail draws a different card per coverage kind, so the
         plan branch is a state a screen can be in — and a state no scenario
         reaches is one nobody ever looks at. */
      check(
        `${tag} a plan-covered quote exists`,
        states.some((s) => s.cov === 'subscription'),
      );
      check(`${tag} a paid quote with a booking exists`,
        states.some((s) => s.pay === 'succeeded' && s.booking));
      check(`${tag} a failed payment exists`, states.some((s) => s.pay === 'failed'));
      check(`${tag} a pending payment exists`, states.some((s) => s.pay === 'pending'));
      check(`${tag} a refunded payment exists`, states.some((s) => s.pay === 'refunded'));
      check(`${tag} a recurring quote exists`, states.some((s) => s.rhythm !== 'oneTime'));
      check(`${tag} a quote awaiting a date exists`, states.some((s) => s.proposing));
      check(`${tag} a quote with a confirmed date exists`, states.some((s) => s.confirmed));
    }

    /* --------------------------------------- money on a booking
       The bookings list filters on this, and it is derived from two records
       that are never both present — a job paid at the quote has no invoice,
       one invoiced afterwards has no payment. A filter option that matches
       nothing in the scenario a reviewer opens on reads as a broken filter
       rather than an empty result. */
    if (name !== 'fresh') {
      const money = new Set(
        d.bookings.map((b) => bookingPaymentState(b, d.payments, d.invoices)),
      );
      for (const want of ['paid', 'pending', 'unpaid', 'covered'] as const) {
        check(`${tag} a ${want} booking exists`, money.has(want), [...money].join(','));
      }
    }

    /* `fresh` is launch day and the empty states are the deliverable. */
    if (name === 'fresh') {
      check(`${tag} fresh has no quotes`, d.offers.length === 0);
      check(`${tag} fresh has no payments`, d.payments.length === 0);
      check(`${tag} fresh has no bookings`, d.bookings.length === 0);
      check(`${tag} fresh has no holds`, seedHolds(d, clock).length === 0);
      /* And no reviews — the promise block on the home page is the launch-day
         design, and it only shows while nothing has been published. */
      check(`${tag} fresh has no reviews`, d.reviews.length === 0);
    }

    /* `states` claims every declared state at once, and `hidden` is the one
       that arrived without it — a status in the union that no seed carries is
       a group heading nobody has ever seen rendered. */
    if (name === 'states') {
      const seen = new Set(d.reviews.map((r) => r.status));
      for (const want of ['pending', 'published', 'hidden', 'rejected'] as const) {
        check(`${tag} a ${want} review exists`, seen.has(want), [...seen].join(','));
      }
    }

    /* The screen a reviewer opens on. It was `reviews: []` here, so the whole
       moderation queue was an empty state in the default scenario. */
    if (name === 'demo') {
      check(`${tag} the moderation queue has cards`, d.reviews.length > 0);
      check(
        `${tag} a review that publishes in one click exists`,
        d.reviews.some((r) => r.status === 'pending' && r.publishConsent && r.rating > 3),
      );
      check(
        `${tag} a critical review awaiting a reply exists`,
        d.reviews.some((r) => r.status === 'pending' && r.rating <= 3 && !r.ownerReply),
      );
      check(
        `${tag} a review nobody consented to publishing exists`,
        d.reviews.some((r) => !r.publishConsent),
      );
    }
  }
}

/*
 * The scheduling clock belongs to the business, not to whoever is running this.
 *
 * `startOfDay` used the runtime's timezone while every rendered date is bound
 * to Europe/Zurich, so the day grid drew each cell with the day before —
 * Saturday came up closed and Sunday offered nineteen slots. It is invisible
 * from a desk in Zurich, which is exactly why it needs a test: this one runs
 * the calendar under four timezones on both sides of the DST boundary and
 * fails anywhere the two clocks disagree.
 */
for (const tz of ['Europe/Zurich', 'Africa/Cairo', 'America/New_York', 'Pacific/Auckland']) {
  process.env.TZ = tz;
  for (const clock of [new Date('2026-08-17T10:00:00Z'), new Date('2026-01-19T10:00:00Z')]) {
    const d = buildScenario('demo', clock);
    const tag = `[tz:${tz}@${clock.toISOString().slice(0, 10)}]`;

    const cal = availabilityCalendar({
      from: startOfDay(clock),
      days: 21,
      durationMinutes: 120,
      property: d.properties[0]!,
      bookings: d.bookings,
      holds: [],
      closures: d.closures,
      properties: d.properties,
      settings: SEED_SETTINGS,
      now: clock,
    });

    for (const day of cal) {
      const wd = businessWeekday(new Date(day.date));
      const p = zonedParts(new Date(day.date));
      /* Every cell must *be* midnight in Zurich — that is what makes the label
         the browser prints match the slots the cell holds. */
      check(`${tag} day cell is Zurich midnight`, p.hour === 0 && p.minute === 0,
        `${day.date} → ${p.hour}:${String(p.minute).padStart(2, '0')}`);
      if (wd === 7) {
        check(`${tag} Sunday is closed`, day.blocked === 'closed-day' && day.slots.length === 0,
          `${day.date} → ${day.blocked}`);
      }
      if (wd === 6) {
        check(`${tag} Saturday is not closed as a rule`, day.blocked !== 'closed-day', day.date);
      }
      for (const s of day.slots) {
        check(`${tag} slot falls on its own day`,
          businessWeekday(new Date(s.start)) === wd, `${day.date} vs ${s.start}`);
      }
    }
    check(`${tag} the fortnight has slots at all`, cal.some((x) => x.slots.length > 0));
  }
}
delete process.env.TZ;

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures.slice(0, 40)) console.log('  ✗ ' + f);
  if (failures.length > 40) console.log(`  … and ${failures.length - 40} more`);
  process.exit(1);
}
