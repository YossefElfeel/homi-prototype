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
import { offerCoverage, offerPayment, offerBooking, offerRhythm } from '../src/lib/offer-facts.ts';
import { availabilityCalendar, startOfDay } from '../src/mock/engines/availability.ts';
import { businessWeekday, zonedParts } from '../src/lib/business-time.ts';
import { SEED_SETTINGS } from '../src/mock/seed.ts';

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
    for (const c of d.credits) {
      check(`${tag} credit ${c.id} → customer`, customerIds.has(c.customerId), c.customerId);
      check(`${tag} credit ${c.id} → property`, propertyIds.has(c.propertyId), c.propertyId);
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
      const cov = offerCoverage(o, r, d.subscriptions, d.credits, clock);
      if (cov.kind === 'package') {
        const credit = d.credits.find((c) => c.id === cov.sourceId)!;
        check(`${tag} ${o.reference} package actually covers it`,
          credit.hoursRemaining >= offerHours(o),
          `${credit.hoursRemaining} < ${offerHours(o)}`);
      }
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
        offerCoverage(off1, r, d.subscriptions, d.credits, clock).kind === 'payable');
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
            cov: offerCoverage(o, r, d.subscriptions, d.credits, clock).kind,
            pay: offerPayment(o.id, d.payments)?.status,
            booking: Boolean(offerBooking(o.id, d.bookings)),
            rhythm: offerRhythm(r),
            proposing: Boolean(o.proposedSlots?.length && !o.confirmedSlot),
            confirmed: Boolean(o.confirmedSlot),
          };
        });

      check(`${tag} a package-covered quote exists`, states.some((s) => s.cov === 'package'));
      check(`${tag} a paid quote with a booking exists`,
        states.some((s) => s.pay === 'succeeded' && s.booking));
      check(`${tag} a failed payment exists`, states.some((s) => s.pay === 'failed'));
      check(`${tag} a pending payment exists`, states.some((s) => s.pay === 'pending'));
      check(`${tag} a refunded payment exists`, states.some((s) => s.pay === 'refunded'));
      check(`${tag} a recurring quote exists`, states.some((s) => s.rhythm !== 'oneTime'));
      check(`${tag} a quote awaiting a date exists`, states.some((s) => s.proposing));
      check(`${tag} a quote with a confirmed date exists`, states.some((s) => s.confirmed));
    }

    /* `fresh` is launch day and the empty states are the deliverable. */
    if (name === 'fresh') {
      check(`${tag} fresh has no quotes`, d.offers.length === 0);
      check(`${tag} fresh has no payments`, d.payments.length === 0);
      check(`${tag} fresh has no bookings`, d.bookings.length === 0);
      check(`${tag} fresh has no holds`, seedHolds(d, clock).length === 0);
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
