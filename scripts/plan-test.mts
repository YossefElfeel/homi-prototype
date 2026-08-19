/**
 * The plan flow, end to end, without a browser.
 *
 * `seed-test` proves the seeded data is internally consistent and `crm-test`
 * proves the customer record reads it. Neither exercises the part this wave
 * exists to fix: the *actions*. The break was never in the data — it was that
 * a visitor could choose a plan, pay for it, and end up without one, because
 * no code path between the payment and the subscription existed.
 *
 * A screen check cannot catch that either. It renders whatever the store holds,
 * so a store that never opened the subscription simply shows an empty state,
 * which is indistinguishable from a customer who has not bought anything.
 *
 * Every assertion here is a rule the business stated, checked against the store
 * rather than against a comment describing it.
 */

/* The store persists to localStorage and node has none, so zustand warns on
   every single write. The warning is correct and irrelevant here — nothing in
   this file is testing persistence — and twenty copies of it would bury the
   result line. A memory shim, installed before the store module is imported. */
const memory = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
  clear: () => memory.clear(),
  key: (i: number) => [...memory.keys()][i] ?? null,
  get length() {
    return memory.size;
  },
};

const { useStore } = await import('../src/mock/store.ts');
import { SEED_PLANS } from '../src/mock/seed.ts';
import { buildScenario } from '../src/mock/scenarios.ts';
import { cancelBlock, skipsUsedThisMonth, subscriptionState, visitsLeft } from '../src/lib/plan-facts.ts';
import { offerCoverage } from '../src/lib/offer-facts.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

const NOW = new Date('2026-08-17T10:00:00Z');

/** A fresh world per case: these actions write, and a shared store would make
    the order of the cases part of what is being tested. */
function reset() {
  const data = buildScenario('demo', NOW);
  useStore.setState({ data, plans: SEED_PLANS.map((p) => ({ ...p })) });
  return useStore.getState();
}

/* ------------------------------------------------- the join that was missing */
{
  reset();
  const before = useStore.getState().data.subscriptions.length;
  const id = useStore.getState().openSubscription(
    { customerId: 'cus_3', propertyId: 'prp_3', planId: 'pln_premium', method: 'card' },
    NOW,
  );
  const s = useStore.getState();
  const sub = s.data.subscriptions.find((x) => x.id === id);

  check('paying for a plan opens one', Boolean(id) && s.data.subscriptions.length === before + 1);
  check('it starts unspent', sub?.visitsUsed === 0);
  check('its term is the plan validity', sub?.endDate.startsWith('2027-08-17') === true, sub?.endDate);

  /* `Invoice.subscriptionId` was read in two places and written by nothing, so
     a plan's payment history was structurally empty. */
  const invoice = s.data.invoices.find((i) => i.id === sub?.invoiceId);
  check('it raises an invoice', Boolean(invoice));
  check('the invoice points back at it', invoice?.subscriptionId === id);
  check('the invoice is settled, not draft', invoice?.status === 'paid');
  check('the invoice is for the plan price', invoice?.lines[0]?.unitPrice === 6500);
  check(
    'a payment records how the money came',
    s.data.payments.some((p) => p.invoiceId === invoice?.id && p.status === 'succeeded'),
  );
}

/* --------------------------------------------------- one plan per property */
{
  reset();
  const second = useStore.getState().openSubscription(
    { customerId: 'cus_2', propertyId: 'prp_2', planId: 'pln_premium', method: 'card' },
    NOW,
  );
  check('a property already on a plan refuses a second', second === null);

  /* But a *different* address of the same customer is exactly the case the
     property column exists for. */
  const other = useStore.getState().openSubscription(
    { customerId: 'cus_3', propertyId: 'prp_3', planId: 'pln_basic', method: 'card' },
    NOW,
  );
  check('another address of another customer is fine', other !== null);
}

/* ------------------------------------------------------------ retired plans */
{
  reset();
  const refused = useStore.getState().openSubscription(
    { customerId: 'cus_3', propertyId: 'prp_3', planId: 'pln_buero', method: 'card' },
    NOW,
  );
  check('a retired plan cannot be subscribed to', refused === null);

  /* And retiring one must not touch the people already on it — sub_3 holds the
     retired office plan in the seed. */
  const held = useStore.getState().data.subscriptions.find((x) => x.id === 'sub_3');
  check('a retired plan keeps its existing subscriber', held?.status === 'active');

  useStore.getState().setPlanActive('pln_basic', false);
  const basic = useStore.getState().plans.find((p) => p.id === 'pln_basic');
  check('retiring takes it off the site too', basic?.active === false && basic?.visibleOnSite === false);

  useStore.getState().setPlanVisible('pln_basic', true);
  check(
    'a retired plan cannot be put back on the site alone',
    useStore.getState().plans.find((p) => p.id === 'pln_basic')?.visibleOnSite === false,
  );
}

/* -------------------------------------------------- cancelling and refunding */
{
  reset();
  const id = useStore.getState().openSubscription(
    { customerId: 'cus_3', propertyId: 'prp_3', planId: 'pln_basic', method: 'card' },
    NOW,
  )!;

  check('a fresh untouched plan may be cancelled', cancelBlock(
    useStore.getState().data.subscriptions.find((x) => x.id === id)!,
    useStore.getState().settings,
    NOW,
  ) === null);

  const refused = useStore.getState().cancelSubscription(id, NOW);
  const after = useStore.getState();
  const sub = after.data.subscriptions.find((x) => x.id === id)!;

  check('cancelling inside the window succeeds', refused === null);
  check('it ends the plan', sub.status === 'cancelled');
  check('it records a refund', Boolean(sub.refundedPaymentId));
  check(
    'the refund is a payment, not a deletion',
    after.data.payments.some((p) => p.id === sub.refundedPaymentId && p.status === 'refunded'),
  );
  check(
    'the invoice is cancelled with it',
    after.data.invoices.find((i) => i.id === sub.invoiceId)?.status === 'cancelled',
  );
  check('a second cancel is refused', useStore.getState().cancelSubscription(id, NOW) === 'notActive');
}

/* The two refusals the office has to be able to explain, separately. */
{
  reset();
  const settings = useStore.getState().settings;
  const used = useStore.getState().data.subscriptions.find((x) => x.id === 'sub_2')!;
  check('a plan with visits on it cannot be cancelled', cancelBlock(used, settings, NOW) === 'used');

  const late = { ...used, visitsUsed: 0 };
  check(
    'an untouched plan past the window cannot be cancelled either',
    cancelBlock(late, settings, NOW) === 'windowClosed',
  );

  /* Different reasons, because they are different conversations. */
  check(
    'and the two reasons are distinguishable',
    cancelBlock(used, settings, NOW) !== cancelBlock(late, settings, NOW),
  );
}

/* --------------------------------------------------------------- renewal */
{
  reset();
  const expired = useStore.getState().data.subscriptions.find((x) => x.id === 'sub_1')!;
  const before = expired.renewalCount;
  const invoiceId = useStore.getState().renewSubscription('sub_1', NOW);
  const sub = useStore.getState().data.subscriptions.find((x) => x.id === 'sub_1')!;

  check('renewing raises an invoice', Boolean(invoiceId));
  check('it counts the renewal', sub.renewalCount === before + 1);
  check('it resets the visits', sub.visitsUsed === 0);
  check('it extends the term', new Date(sub.endDate) > NOW);
  check(
    'the renewal invoice is unpaid — nothing is charged automatically',
    useStore.getState().data.invoices.find((i) => i.id === invoiceId)?.status === 'sent',
  );

  useStore.getState().setPlanActive('pln_premium', false);
  check('a retired plan cannot be renewed into', useStore.getState().renewSubscription('sub_1', NOW) === null);
}

/* ---------------------------------------------------------------- skipping */
{
  reset();
  const before = skipsUsedThisMonth(
    useStore.getState().data.subscriptions.find((x) => x.id === 'sub_1')!,
    NOW,
  );
  useStore.getState().skipNextVisit('sub_1', NOW);
  const sub = useStore.getState().data.subscriptions.find((x) => x.id === 'sub_1')!;
  check('a skip is recorded against the month', skipsUsedThisMonth(sub, NOW) === before + 1);

  /* The bug this replaced: the skip picked the customer's next booking at that
     address whatever it was, so a one-off job could be cancelled by a plan's
     free skip. Only this plan's own bookings may be touched. */
  const cancelledBySkip = useStore
    .getState()
    .data.bookings.filter((b) => b.history.some((h) => h.kind === 'skipped'));
  check(
    'a skip only ever cancels this plan’s own visit',
    cancelledBySkip.every((b) => b.subscriptionId === 'sub_1'),
    cancelledBySkip.map((b) => `${b.reference}:${b.subscriptionId}`).join(', '),
  );
}

/* -------------------------------------------------- a visit is spent once */
{
  reset();
  const booking = useStore.getState().data.bookings.find((b) => b.subscriptionId === 'sub_1');
  if (booking) {
    const before = useStore.getState().data.subscriptions.find((x) => x.id === 'sub_1')!.visitsUsed;
    useStore.getState().approveBooking(booking.id, 'Freigegeben', NOW);
    const after = useStore.getState().data.subscriptions.find((x) => x.id === 'sub_1')!;
    check('approving a plan job spends a visit', after.visitsUsed === before + 1);
    check(
      'the booking is completed',
      useStore.getState().data.bookings.find((b) => b.id === booking.id)?.status === 'completed',
    );
  }

  /* A job the same customer paid for separately must not spend one. */
  reset();
  const payable = useStore.getState().data.bookings.find((b) => !b.subscriptionId);
  if (payable) {
    const before = useStore.getState().data.subscriptions.map((x) => x.visitsUsed).join();
    useStore.getState().approveBooking(payable.id, 'Freigegeben', NOW);
    check(
      'approving a non-plan job spends nothing',
      useStore.getState().data.subscriptions.map((x) => x.visitsUsed).join() === before,
    );
  }
}

/* --------------------------------------------- coverage stops when spent */
{
  reset();
  const s = useStore.getState();
  const sub = s.data.subscriptions.find((x) => x.id === 'sub_2')!;
  const plan = s.plans.find((p) => p.id === sub.planId)!;

  /* Build a request that the plan would cover, then spend the plan out and
     check the same request stops being covered. Before visits were counted a
     plan covered everything it touched for a whole year. */
  const request = {
    ...s.data.requests[0]!,
    customerId: sub.customerId,
    propertyId: sub.propertyId,
    serviceSlug: plan.serviceSlug,
  };
  const offer = s.data.offers[0]!;

  const covered = offerCoverage(offer, request, [sub], [plan], [], NOW);
  check('a plan with visits left covers the job', covered.kind === 'subscription');
  check('and says how many are left', covered.visitsRemaining === visitsLeft(sub, plan));

  const spent = { ...sub, visitsUsed: plan.includedVisits };
  check(
    'a spent plan does not cover it',
    offerCoverage(offer, request, [spent], [plan], [], NOW).kind === 'payable',
  );

  const ended = { ...sub, endDate: new Date('2026-01-01').toISOString() };
  check(
    'an expired plan does not cover it',
    offerCoverage(offer, request, [ended], [plan], [], NOW).kind === 'payable',
  );
  check('and it reads as expired', subscriptionState(ended, NOW) === 'expired');
}

/* ------------------------------------------------------------ plan CRUD */
{
  reset();
  const before = useStore.getState().plans.length;
  const id = useStore.getState().createPlan(
    {
      name: { de: 'Test', en: 'Test', fr: 'Test', it: 'Test' },
      description: { de: '', en: '', fr: '', it: '' },
      features: [],
      price: 1200,
      includedVisits: 12,
      validityMonths: 12,
      serviceSlug: 'unterhaltsreinigung',
      extraDiscountPercent: 5,
      active: true,
      visibleOnSite: true,
    },
    NOW,
  );
  check('a plan can be added', useStore.getState().plans.length === before + 1);
  check('it gets a reference', Boolean(useStore.getState().plans.find((p) => p.id === id)?.reference));

  useStore.getState().updatePlan(id, { price: 1500 });
  check('and edited', useStore.getState().plans.find((p) => p.id === id)?.price === 1500);
  check(
    'creating a plan is logged',
    useStore.getState().data.changeLog.some((e) => e.entityId === id),
  );
}

if (failures.length > 0) {
  console.error(`\n${passed} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\n${passed} passed, 0 failed`);
