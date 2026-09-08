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
import {
  cancelBlock,
  nextPlanVisit,
  skipsUsedThisMonth,
  subscriptionState,
  upgradeQuote,
  visitsLeft,
} from '../src/lib/plan-facts.ts';
import { requestCoverage } from '../src/lib/offer-facts.ts';

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
    { customerId: 'cus_3', propertyId: 'prp_3', planId: 'pln_premium', method: 'card', paymentMethodId: undefined },
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
    { customerId: 'cus_2', propertyId: 'prp_2', planId: 'pln_premium', method: 'card', paymentMethodId: undefined },
    NOW,
  );
  check('a property already on a plan refuses a second', second === null);

  /* But a *different* address of the same customer is exactly the case the
     property column exists for. */
  const other = useStore.getState().openSubscription(
    { customerId: 'cus_3', propertyId: 'prp_3', planId: 'pln_basic', method: 'card', paymentMethodId: undefined },
    NOW,
  );
  check('another address of another customer is fine', other !== null);
}

/* ------------------------------------------------------------ retired plans */
{
  reset();
  const refused = useStore.getState().openSubscription(
    { customerId: 'cus_3', propertyId: 'prp_3', planId: 'pln_buero', method: 'card', paymentMethodId: undefined },
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
    { customerId: 'cus_3', propertyId: 'prp_3', planId: 'pln_basic', method: 'card', paymentMethodId: undefined },
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
  const covered = requestCoverage(request, [sub], [plan], NOW);
  check('a plan with visits left covers the job', covered.kind === 'subscription');
  check('and says how many are left', covered.visitsRemaining === visitsLeft(sub, plan));

  const spent = { ...sub, visitsUsed: plan.includedVisits };
  check(
    'a spent plan does not cover it',
    requestCoverage(request, [spent], [plan], NOW).kind === 'payable',
  );

  const ended = { ...sub, endDate: new Date('2026-01-01').toISOString() };
  check(
    'an expired plan does not cover it',
    requestCoverage(request, [ended], [plan], NOW).kind === 'payable',
  );
  check('and it reads as expired', subscriptionState(ended, NOW) === 'expired');
}

/* ---------------------------------------- buying one from the account itself */
{
  reset();
  /* The demo account's third address, which exists so this is reachable at
     all: cus_2's other two both carry a plan, and the store allows one per
     property. Without a free address the account's buy flow could only ever
     render its refusal. */
  const free = useStore
    .getState()
    .data.properties.filter(
      (p) =>
        p.customerId === 'cus_2' &&
        !useStore
          .getState()
          .data.subscriptions.some(
            (s) => s.propertyId === p.id && s.status !== 'cancelled' && new Date(s.endDate) > NOW,
          ),
    );
  check('the demo customer has an address with no plan on it', free.length > 0, `${free.length}`);

  const id = useStore.getState().openSubscription(
    { customerId: 'cus_2', propertyId: free[0]!.id, planId: 'pln_premium', method: 'card', paymentMethodId: undefined },
    NOW,
  );
  check('and can buy a plan for it without leaving the account', id !== null);
  check(
    'the customer then holds three',
    useStore.getState().data.subscriptions.filter((s) => s.customerId === 'cus_2').length === 3,
  );
}

/* ------------------------------------------------- what a skip actually does */
{
  reset();
  const s = useStore.getState();
  const sub = s.data.subscriptions.find((x) => x.id === 'sub_2')!;
  const plan = s.plans.find((p) => p.id === sub.planId)!;
  const target = nextPlanVisit(sub.id, s.data.bookings, NOW);

  const usedBefore = sub.visitsUsed;
  useStore.getState().skipNextVisit(sub.id, NOW);
  const after = useStore.getState().data.subscriptions.find((x) => x.id === sub.id)!;

  /* The claim the screen now makes in as many words, checked rather than
     believed: the visit is not deducted, so a skipped visit is still owed. */
  check('a skip does not spend a visit', after.visitsUsed === usedBefore);
  check('the package still owes the same number', visitsLeft(after, plan) === visitsLeft(sub, plan));
  check('it counts against this month allowance', skipsUsedThisMonth(after, NOW) === 1);

  if (target) {
    const booking = useStore.getState().data.bookings.find((b) => b.id === target.id);
    check('and it cancels the visit the screen named', booking?.status === 'cancelled');
  } else {
    check('there was a scheduled visit to skip', false, 'seed has none for sub_2');
  }
}

/* ------------------------------------------------------------ moving up a plan */
{
  reset();
  const before = useStore.getState().data.subscriptions.find((x) => x.id === 'sub_2')!;
  const from = useStore.getState().plans.find((p) => p.id === before.planId)!;
  const to = useStore.getState().plans.find((p) => p.id === 'pln_premium')!;
  const quote = upgradeQuote(before, from, to);

  const result = useStore
    .getState()
    .upgradeSubscription({ id: 'sub_2', toPlanId: 'pln_premium', method: 'card' }, NOW);
  check('a running plan can move up', !('blocked' in result));

  const after = useStore.getState().data.subscriptions.find((x) => x.id === 'sub_2')!;
  check('it is the same subscription, not a second one', after.reference === before.reference);
  check('on the same address', after.propertyId === before.propertyId);
  check('carrying the new plan', after.planId === 'pln_premium');
  check('with the visits reset, because a whole package was bought', after.visitsUsed === 0);
  check('and a fresh term', after.endDate.startsWith('2027-08-17'), after.endDate);
  check(
    'the move is on the record',
    after.history.some((e) => e.kind === 'upgraded'),
  );

  const invoice = useStore.getState().data.invoices.find((i) => i.id === after.invoiceId);
  check('it raises an invoice', Boolean(invoice));
  check('the invoice points back at the plan', invoice?.subscriptionId === 'sub_2');
  check('it charges the new package', invoice?.lines[0]?.unitPrice === to.price);
  /* The credit is a line of its own, so the customer can see why the amount is
     not the price on the card they clicked. */
  check('and credits the unused visits', invoice?.lines[1]?.unitPrice === -quote.credit);
  check(
    'the total is the difference',
    invoice?.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0) === quote.due,
  );
  check(
    'the payment is for that difference',
    useStore.getState().data.payments.some((p) => p.invoiceId === invoice?.id && p.amount === quote.due),
  );
  /* Not invented: the credit is the customer's own receipt divided by what it
     bought, times what they have not used. */
  check(
    'the credit is the unused visits at what they paid per visit',
    quote.credit === Math.round(visitsLeft(before, from) * (from.price / from.includedVisits) * 20) / 20,
    String(quote.credit),
  );
}

/* ---------------------------------------------------- what may not move up */
{
  reset();
  const sideways = useStore
    .getState()
    .upgradeSubscription({ id: 'sub_2', toPlanId: 'pln_buero_standard', method: 'card' }, NOW);
  check(
    'another service is not an upgrade',
    'blocked' in sideways && sideways.blocked === 'notAnUpgrade',
  );

  const down = useStore
    .getState()
    .upgradeSubscription({ id: 'sub_1', toPlanId: 'pln_basic', method: 'card' }, NOW);
  check('nor is a smaller package', 'blocked' in down && down.blocked === 'notAnUpgrade');

  const retired = useStore
    .getState()
    .upgradeSubscription({ id: 'sub_2', toPlanId: 'pln_buero', method: 'card' }, NOW);
  check('a retired package cannot be bought', 'blocked' in retired && retired.blocked === 'retired');

  useStore.getState().pauseSubscription('sub_2', NOW);
  const paused = useStore
    .getState()
    .upgradeSubscription({ id: 'sub_2', toPlanId: 'pln_premium', method: 'card' }, NOW);
  check('a paused plan is resumed first', 'blocked' in paused && paused.blocked === 'notActive');
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

  /* The plan just created is held by nobody, which is the only kind that may
     go. Retiring is what a sold plan gets. */
  check('an unused plan can be deleted', useStore.getState().deletePlan(id));
  check('and it is gone', useStore.getState().plans.length === before);
  check(
    'deleting a plan is logged',
    useStore
      .getState()
      .data.changeLog.filter((e) => e.entityId === id)
      .length >= 2,
  );
}

/* ------------------------------------------- what deletion refuses to touch */
{
  reset();
  const state = () => useStore.getState();

  /* `pln_basic` carries four subscribers in the demo, `pln_buero_standard`
     none. Both states are in the seed on purpose: the refusal and the deletion
     are each one click from a cold start, so neither has to be produced by
     wrecking the demo first. */
  const held = state().plans.find((p) => p.id === 'pln_basic')!;
  const unheld = state().plans.find((p) => p.id === 'pln_buero_standard')!;

  check(
    'the demo really does hold one of each',
    state().data.subscriptions.some((sub) => sub.planId === held.id) &&
      !state().data.subscriptions.some((sub) => sub.planId === unheld.id) &&
      !state().data.requests.some((r) => r.planIntent === unheld.id),
  );

  check('a plan somebody holds is refused', state().deletePlan(held.id) === false);
  check('and it is still there', state().plans.some((p) => p.id === held.id));

  /*
   * A cancelled subscription still blocks it.
   *
   * This is the assertion worth having. «Nobody is on it any more» is the
   * reading that would let a plan be deleted out from under a paid invoice —
   * §15 keeps invoices whole, and an invoice naming a package that no longer
   * exists cannot be explained to the person who paid it.
   */
  const sub = state().data.subscriptions.find((x) => x.planId === held.id)!;
  useStore.setState({
    data: {
      ...state().data,
      subscriptions: state().data.subscriptions.map((x) =>
        x.planId === held.id ? { ...x, status: 'cancelled' as const } : x,
      ),
      requests: state().data.requests.map((r) =>
        r.planIntent === held.id ? { ...r, planIntent: undefined } : r,
      ),
    },
  });
  check(
    'a plan whose subscribers have all cancelled is still refused',
    Boolean(sub) && state().deletePlan(held.id) === false,
  );

  /*
   * The wish on a request counts as well.
   *
   * Built rather than found: every seeded `planIntent` is on a plan somebody
   * also holds, so reading one out of the demo would have tested the
   * subscription rule a second time and passed either way. The intent is moved
   * onto a plan nobody holds, which isolates it.
   */
  reset();
  check(
    'the isolation holds — nobody is on this plan',
    !state().data.subscriptions.some((x) => x.planId === 'pln_buero_plus'),
  );
  useStore.setState({
    data: {
      ...state().data,
      requests: state().data.requests.map((r, i) =>
        i === 0 ? { ...r, planIntent: 'pln_buero_plus' } : r,
      ),
    },
  });
  check(
    'a plan a request still asks for is refused',
    state().deletePlan('pln_buero_plus') === false,
  );

  reset();
  check('an unheld seeded plan can go', state().deletePlan('pln_buero_standard'));

  /*
   * References must not be reused after a delete.
   *
   * `reference` and `order` were derived from `plans.length`, which is the
   * highest number in use only while nothing is ever removed. With a delete on
   * the screen, the next plan created would carry a reference the change log
   * already names.
   */
  const refsBefore = state().plans.map((p) => p.reference);
  const fresh = state().createPlan(
    {
      name: { de: 'Nach dem Löschen', en: 'After the delete', fr: '', it: '' },
      description: { de: '', en: '', fr: '', it: '' },
      features: [],
      price: 100,
      includedVisits: 4,
      validityMonths: 12,
      serviceSlug: 'unterhaltsreinigung',
      extraDiscountPercent: 0,
      active: false,
      visibleOnSite: false,
    },
    NOW,
  );
  const made = state().plans.find((p) => p.id === fresh)!;
  check(
    'a plan created after a delete does not reuse a reference',
    !refsBefore.includes(made.reference),
    made.reference,
  );
  check(
    'nor an order',
    state().plans.filter((p) => p.order === made.order).length === 1,
  );
}

const st = () => useStore.getState();

/* ------------------------------- which card a package is actually billed to */
/*
 * Screen 45 used to answer this by taking the first card in the list. It was
 * not the card marked «Standard», not anything the customer had chosen, and
 * not written down anywhere — so nothing here could have caught it going
 * wrong. These are the rules that replaced it.
 */
{
  reset();
  const running = st().data.subscriptions.filter(
    (x) => x.status === 'active' || x.status === 'paused',
  );
  check(
    'every seeded package that will be billed names the card it is billed to',
    running.filter((x) => x.customerId === 'cus_1' || x.customerId === 'cus_2').every((x) => Boolean(x.paymentMethodId)),
  );
  check(
    "the demo customer's two packages sit on two different cards",
    st().data.subscriptions.find((x) => x.id === 'sub_2')!.paymentMethodId !==
      st().data.subscriptions.find((x) => x.id === 'sub_3')!.paymentMethodId,
  );
}

{
  reset();
  /* The deletion that used to succeed and leave a running package pointing at
     an id that was not there any more. */
  const refused = st().removePaymentMethod('pm_card_2');
  check('a card a running package is billed to cannot be removed', 'blocked' in refused);
  check(
    'and the refusal names the package, so the screen can say which',
    'blocked' in refused && refused.plans.includes('S-0013'),
    'blocked' in refused ? refused.plans.join(', ') : 'not blocked',
  );
  check(
    'the card is still on file',
    st().data.paymentMethods.some((m) => m.id === 'pm_card_2'),
  );

  /* A TWINT carries no package, so nothing holds it down. */
  check('a method no package uses still goes', 'ok' in st().removePaymentMethod('pm_twint_2'));
}

{
  reset();
  st().setSubscriptionMethod('sub_2', 'pm_card_2b', NOW);
  check(
    'a package can be moved to another card',
    st().data.subscriptions.find((x) => x.id === 'sub_2')!.paymentMethodId === 'pm_card_2b',
  );
  check(
    'and the move is on the record',
    st()
      .data.subscriptions.find((x) => x.id === 'sub_2')!
      .history.some((e) => e.kind === 'method-changed'),
  );
  check(
    'the card it left can then be removed',
    'ok' in st().removePaymentMethod('pm_card_2'),
  );
}

{
  reset();
  /* The rule the alert on 45 states. Before this, the dialog that opens a
     package offered TWINT and this would have gone through. */
  st().setSubscriptionMethod('sub_2', 'pm_twint_2', NOW);
  check(
    'a package cannot be moved onto TWINT',
    st().data.subscriptions.find((x) => x.id === 'sub_2')!.paymentMethodId === 'pm_card_2',
  );

  /* cus_1's card, against cus_2's package. */
  st().setSubscriptionMethod('sub_2', 'pm_card_1', NOW);
  check(
    "nor onto another customer's card",
    st().data.subscriptions.find((x) => x.id === 'sub_2')!.paymentMethodId === 'pm_card_2',
  );
}

{
  reset();
  const id = st().openSubscription(
    {
      customerId: 'cus_2',
      propertyId: 'prp_2c',
      planId: 'pln_premium',
      method: 'card',
      paymentMethodId: 'pm_card_2b',
    },
    NOW,
  );
  check(
    'a package opened from the dialog remembers the card it was opened on',
    id !== null &&
      st().data.subscriptions.find((x) => x.id === id)?.paymentMethodId === 'pm_card_2b',
  );
}

if (failures.length > 0) {
  console.error(`\n${passed} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\n${passed} passed, 0 failed`);
