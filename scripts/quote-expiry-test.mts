/**
 * A quote lapses by date, and nothing writes that down.
 *
 * `expired` is never stored on a request: §9.3 makes the date end a quote, and
 * a date cannot set a field. So every screen showing a request has to derive
 * it, and for three waves only one of them did — `/konto/offerten` called a
 * lapsed quote «Abgelaufen» while `/konto/anfragen` and the request detail
 * beside it read the stored status and said «Offerte erhalten», with a primary
 * button onto a quote nobody could sign.
 *
 * This is here because the bug is **invisible to every other check we have**:
 *
 *  · It typechecks. `request.status` is a valid `RequestStatus` either way.
 *  · No scenario shows it. The seed keeps each quote's stored status and its
 *    date consistent by hand — `req_1` is written `expired` because `off_2`
 *    is, under a comment saying the request ends where its quote ended.
 *  · The demo bar cannot stage it. Moving the clock calls `setDateOverride`,
 *    which rebuilds the scenario at the new date, so the quote is re-issued
 *    two days before the new "now" and is never out of date.
 *
 * It appears when the clock passes a `sent` quote's `expiresAt` *without* the
 * scenario being rebuilt — which is what the persisted store hands a browser
 * that opened the prototype a fortnight ago and comes back. That is the state
 * this file stages, because nothing a reviewer can click will.
 */
import { buildScenario } from '../src/mock/scenarios.ts';
import { requestBadgeState, offerBadgeState } from '../src/lib/offer-label.ts';
import { isExpired } from '../src/mock/engines/offers.ts';

const seededAt = new Date('2026-08-30T09:00:00.000Z');
const data = buildScenario('demo', seededAt);

const req3 = data.requests.find((r) => r.id === 'req_3')!;
const off1 = data.offers.find((o) => o.id === 'off_1')!;

console.log('seeded at      ', seededAt.toISOString());
console.log('req_3 stored   ', req3.status, `(customer ${req3.customerId})`);
console.log('off_1 stored   ', off1.status, 'expires', off1.expiresAt);

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

/* 1. On the seeding day nothing has lapsed, and the derivation must not invent
      an expiry that is not there. */
check(
  'day 0: quote is live, request badges as stored',
  !isExpired(off1, seededAt) &&
    requestBadgeState(req3, off1, seededAt) === 'offerSent' &&
    offerBadgeState(off1, seededAt) === 'offerSent',
  `${requestBadgeState(req3, off1, seededAt)} / ${offerBadgeState(off1, seededAt)}`,
);

/* 2. Thirteen days later the store still holds `offerSent` and `sent` — the
      clock is the only thing that moved. Both screens must now say `expired`,
      and before this wave the request half said `offerSent`. */
const later = new Date(seededAt.getTime() + 13 * 86_400_000);
check(
  'day 13: the quote has lapsed by date',
  isExpired(off1, later),
  `expiresAt ${off1.expiresAt}`,
);
check(
  'day 13: /konto/offerten derives expired',
  offerBadgeState(off1, later) === 'expired',
  offerBadgeState(off1, later),
);
check(
  'day 13: /konto/anfragen now derives expired too (the fix)',
  requestBadgeState(req3, off1, later) === 'expired',
  `derived ${requestBadgeState(req3, off1, later)}, stored still ${req3.status}`,
);
check(
  'day 13: the two screens agree',
  requestBadgeState(req3, off1, later) === offerBadgeState(off1, later),
);

/* 3. The ball-with-the-office case must NOT flip: a superseded quote running
      out does not kill a request the office is rewriting. */
const revisionReq = data.requests.find((r) => r.id === 'req_acc_revision')!;
const revisionOffer = data.offers.find((o) => o.id === 'off_acc_revision')!;
check(
  'revisionRequested never flips to expired',
  requestBadgeState(revisionReq, revisionOffer, new Date(seededAt.getTime() + 400 * 86_400_000)) ===
    'revisionRequested',
  requestBadgeState(revisionReq, revisionOffer, later),
);

/* 4. A settled request is settled: an accepted quote whose date passes stays
      accepted. */
const acceptedReq = data.requests.find((r) => r.id === 'req_acc_accepted')!;
const acceptedOffer = data.offers.find((o) => o.id === 'off_acc_accepted')!;
check(
  'accepted stays accepted after its date',
  requestBadgeState(acceptedReq, acceptedOffer, later) === 'accepted',
  requestBadgeState(acceptedReq, acceptedOffer, later),
);

/* 5. A request with no quote at all cannot be expired by one. */
const newReq = data.requests.find((r) => r.id === 'req_acc_new')!;
check(
  'a request with no quote is untouched',
  requestBadgeState(newReq, undefined, later) === 'new',
  requestBadgeState(newReq, undefined, later),
);

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
