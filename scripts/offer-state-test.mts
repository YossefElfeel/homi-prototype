/**
 * A quote stops at `accepted`, and the job keeps going.
 *
 * `Offer.status` has no terminal happy state. Signing is the last thing it
 * records, so a quote whose work was finished, invoiced and paid nine months
 * ago carries the same badge as one signed this morning — and «Angenommen» on
 * the office's quote list meant both «do this» and «this is long done».
 *
 * This file is here because the gap is invisible to every other check:
 *
 *  · It typechecks. `accepted` is a valid `OfferStatus` in both cases.
 *  · `npm run build` proves the route renders, not that the badge is right.
 *  · Reading the screen does not catch it either — the wrong badge is a
 *    plausible one. Nothing looks broken; the list is simply answering a
 *    different question from the one it was opened with.
 *
 * So the rule is asserted against the seed instead: the quotes whose jobs are
 * done, the quotes whose jobs are not, and the two ways a job can end without
 * having happened.
 */
import { buildScenario } from '../src/mock/scenarios.ts';
import { offerState } from '../src/lib/offer-facts.ts';
import { statusTone, statesOf } from '../src/lib/status-registry.ts';
import { de, en } from '../src/messages/index.ts';
import type { Offer } from '../src/mock/schema.ts';

/* The list's own filter menu — `/admin/offerten` keeps this list because a
   quote is never `new`, `inReview` or cancelled. Copied rather than imported:
   the screen is a client component and this runs in node. */
const OFFER_STATES = [
  'sent',
  'revisionRequested',
  'accepted',
  'completed',
  'rejected',
  'expired',
] as const;

const NOW = new Date('2026-08-30T09:00:00.000Z');
const demo = buildScenario('demo', NOW);
const states = buildScenario('states', NOW);

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const stateIn = (data: typeof demo, id: string) => {
  const offer = data.offers.find((o) => o.id === id);
  if (!offer) return `MISSING(${id})`;
  return offerState(offer, data.bookings, NOW);
};

/* ------------------------------------------- 1. the job decides, not the quote */

console.log('\n— a finished job closes its quote —');

/* A-2444: signed 258 days ago, worked, invoiced, closed. The stored status is
   still `accepted` and has to stay that way — this is a *derivation*, and the
   day it starts writing to the record is the day it can disagree with it. */
const h4 = demo.offers.find((o) => o.id === 'off_acc_h4')!;
check(
  'off_acc_h4: closed job reads completed',
  stateIn(demo, 'off_acc_h4') === 'completed',
  stateIn(demo, 'off_acc_h4'),
);
check('off_acc_h4: the record itself is untouched', h4.status === 'accepted', h4.status);

check(
  'off_s_accepted: completed job reads completed',
  stateIn(states, 'off_s_accepted') === 'completed',
  stateIn(states, 'off_s_accepted'),
);

/* Every booking status that means the work happened, against the ones that do
   not. `invoiced` is the one worth stating: it is what `completed` becomes the
   moment the office bills it, so a quote that fell back to «Angenommen» on
   being invoiced would be the only row on the list that moves backwards. */
const delivered = ['completed', 'invoiced', 'closed'] as const;
const notDelivered = [
  'scheduled',
  'rescheduled',
  'inProgress',
  'awaitingApproval',
  'noAccess',
  'cancelled',
] as const;

const accepted: Offer = { ...h4, id: 'off_probe', status: 'accepted' };
const booking = demo.bookings.find((b) => b.id === 'bkg_acc_h4')!;

for (const status of delivered) {
  check(
    `booking ${status} → completed`,
    offerState(accepted, [{ ...booking, offerId: 'off_probe', status }], NOW) === 'completed',
  );
}
for (const status of notDelivered) {
  check(
    `booking ${status} → still accepted`,
    offerState(accepted, [{ ...booking, offerId: 'off_probe', status }], NOW) === 'accepted',
  );
}

/* ------------------------------------------------- 2. the cases it must not claim */

console.log('\n— what a finished job is not —');

/* Signed, paid, called off, refunded. It produced no work, and putting the
   best badge on the list on it would be the worst single row this change
   could produce. */
check(
  'off_refund: a cancelled job leaves the quote accepted',
  stateIn(demo, 'off_refund') === 'accepted',
  stateIn(demo, 'off_refund'),
);
check(
  'off_paid: a job still in the calendar leaves the quote accepted',
  stateIn(demo, 'off_paid') === 'accepted',
  stateIn(demo, 'off_paid'),
);
check(
  'off_acc_accepted: same, on the demo account',
  stateIn(demo, 'off_acc_accepted') === 'accepted',
  stateIn(demo, 'off_acc_accepted'),
);

/* Reissuing resets the status to `sent` and leaves the old booking standing.
   Without the `accepted` guard the new version would open badged as finished
   — a quote nobody has answered yet, wearing the badge of a closed job. */
check(
  'a reissued quote over a finished job does not read completed',
  offerState({ ...accepted, status: 'sent', expiresAt: undefined }, [
    { ...booking, offerId: 'off_probe', status: 'closed' },
  ], NOW) === 'sent',
);

/* The rule that was already here keeps working, and keeps winning: a quote
   nobody signed is gone when its date passes, whatever else is true. */
check(
  'expiry still decides a sent quote',
  stateIn(states, 'off_s_expired') === 'expired' && stateIn(states, 'off_s_sent') === 'sent',
  `${stateIn(states, 'off_s_expired')} / ${stateIn(states, 'off_s_sent')}`,
);

/* -------------------------------------------- 3. no dead option in the filter */

console.log('\n— every option in the menu returns rows —');

/* The reason this list exists: a filter offering a state nothing can be in is
   a control that answers every question with an empty table. `states` is the
   scenario that has to carry one of each. */
const rows = states.offers
  .filter((o) => o.status !== 'draft')
  .map((o) => offerState(o, states.bookings, NOW));

for (const state of OFFER_STATES) {
  check(`filter «${state}» has at least one row`, rows.includes(state));
}
check(
  'no row falls outside the menu',
  rows.every((r) => (OFFER_STATES as readonly string[]).includes(r)),
  [...new Set(rows.filter((r) => !(OFFER_STATES as readonly string[]).includes(r)))].join(', '),
);

/* ----------------------------------------------- 4. one colour, one word */

console.log('\n— the badge —');

check('completed is declared in the registry', statesOf('request').includes('completed'));
/* Neutral rather than success, and that is the entire point of adding it: if
   finished business stayed green the badge would have gained a word and no
   information. `accepted` keeps the green because it is the one still owed
   work. */
check('completed is neutral', statusTone('request', 'completed') === 'neutral');
check('accepted keeps the green', statusTone('request', 'accepted') === 'success');
check(
  'only one of the six reads as success',
  OFFER_STATES.filter(
    (s) => statusTone('request', s === 'sent' ? 'offerSent' : s) === 'success',
  ).length === 1,
);

/* `useTranslations` is typed on the namespace and not the key, so a badge for
   a state nobody labelled throws MISSING_MESSAGE the first time a row lands in
   it — and this row only appears once a job closes. */
check('de label exists', de.status.request.completed === 'Abgeschlossen');
check('en label exists', en.status.request.completed === 'Completed');
/* The same word the booking uses, deliberately: it is one event seen from two
   ends, and two words would ask the reader what the difference is. */
check(
  'it is the word the booking already uses',
  de.status.request.completed === de.status.booking.completed &&
    en.status.request.completed === en.status.booking.completed,
);

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
