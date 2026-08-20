/**
 * Invariants for the customer wave, and for the dictionary it reads from.
 *
 * Two classes of failure this catches, both of which typecheck cleanly and both
 * of which the seed test cannot see:
 *
 *  · **A join that renders as nothing.** The invoice table's "Zahlweg" column
 *    is `payments.find(p => p.invoiceId === …)`. A paid invoice with no payment
 *    behind it does not error — it prints "Offen" next to a green "Bezahlt"
 *    badge, which is worse than an error because it looks like data.
 *  · **A message key that exists in one locale.** `next-intl` throws at render
 *    on a missing key, so a key added to `crm.de.ts` and forgotten in
 *    `crm.en.ts` is a screen that white-screens in English only — and the
 *    English build is the one reviewers land on (`defaultLocale`).
 */

import { SCENARIOS, buildScenario } from '../src/mock/scenarios.ts';
import { customerHistory, invoiceSubject, invoiceTotal } from '../src/lib/customer-history.ts';
import { INVOICE_METHODS, METHOD_ICONS, SAVABLE_METHODS, invoicePayment } from '../src/lib/payment-methods.ts';
import { de, en } from '../src/messages/index.ts';
import { SEED_PLANS } from '../src/mock/seed.ts';
import type { PaymentMethod } from '../src/mock/schema.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

/* The same fixed clocks the seed test uses: the seed is written relative to
   "now", and an invariant that only holds on the weekday it was written is
   not an invariant. */
const CLOCKS = [
  new Date('2026-08-17T10:00:00Z'), // Monday
  new Date('2026-08-20T10:00:00Z'), // Thursday
  new Date('2026-08-22T10:00:00Z'), // Saturday
];

/* ------------------------------------------------------------ dictionary */

type Dict = Record<string, unknown>;

/** Every leaf path in a message object, so a nested namespace is compared too. */
function paths(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix];
  return Object.entries(node as Dict).flatMap(([key, value]) =>
    paths(value, prefix ? `${prefix}.${key}` : key),
  );
}

const dePaths = new Set(paths(de));
const enPaths = new Set(paths(en));

/* Both directions. A key only German has white-screens the English default;
   a key only English has does the same to the market language. */
const missingInEn = [...dePaths].filter((p) => !enPaths.has(p));
const missingInDe = [...enPaths].filter((p) => !dePaths.has(p));
check('every de key exists in en', missingInEn.length === 0, missingInEn.slice(0, 8).join(', '));
check('every en key exists in de', missingInDe.length === 0, missingInDe.slice(0, 8).join(', '));

/* The registries hand `status.method` a key per value. A method added to the
   union without a label is a screen that throws where it used to print. */
const METHODS: PaymentMethod[] = [
  'card',
  'twint',
  'apple-pay',
  'google-pay',
  'qr-bill',
  'cash',
];
for (const method of METHODS) {
  check(`status.method.${method} is translated`, dePaths.has(`status.method.${method}`));
  check(`${method} has an icon`, Boolean(METHOD_ICONS[method]));
}
check(
  'the invoice picker only offers methods an invoice can arrive by',
  INVOICE_METHODS.every((m) => METHODS.includes(m)) &&
    !INVOICE_METHODS.includes('apple-pay') &&
    !INVOICE_METHODS.includes('google-pay'),
);
check(
  'every savable method is a payment method',
  SAVABLE_METHODS.every((m) => METHODS.includes(m)),
);

/* Keys the two new surfaces read by name. Spelled out rather than derived:
   a typo in the component and the same typo in the test would agree. */
const CUSTOMER_KEYS = [
  'paymentTitle',
  'paymentLead',
  'paymentEmpty',
  'paymentAdd',
  'paymentAddTitle',
  'paymentKind',
  'paymentLabelField',
  'paymentLabelHint',
  'paymentAddSave',
  'paymentCancel',
  'paymentAdded',
  'paymentRemoveHint',
  'paymentDefaultLabel',
  'paymentMakeDefault',
  'paymentDefaultSet',
  'paymentAddedOn',
  'invoicesTitle',
  'colInvoice',
  'colService',
  'colDate',
  'colAmount',
  'colPaymentStatus',
  'colMethod',
  'methodNone',
  'invoiceRowView',
  'invoicesEmptyTitle',
  'invoicesEmptyBody',
  'invoiceDialogIssued',
  'invoiceDialogDue',
  'invoiceDialogPaid',
  'invoiceDialogPaidVia',
  'invoiceDialogLines',
  'invoiceDialogTotal',
  'invoiceDialogOpen',
  'dismiss',
  'historyRecent',
  'historyAll',
  'typeRequest',
  'typeOffer',
  'typeBooking',
  'typeInvoice',
];
for (const key of CUSTOMER_KEYS) {
  check(`admin.customer.${key}`, dePaths.has(`admin.customer.${key}`) && enPaths.has(`admin.customer.${key}`));
}

const HISTORY_KEYS = [
  'title',
  'lead',
  'back',
  'search',
  'filterType',
  'allTypes',
  'from',
  'to',
  'reset',
  'colWhen',
  'colType',
  'colReference',
  'colDetail',
  'colStatus',
  'colAmount',
  'rowOpen',
  'emptyTitle',
  'emptyBody',
  'filteredEmptyTitle',
  'filteredEmptyBody',
  'notFound',
];
for (const key of HISTORY_KEYS) {
  check(
    `admin.customerHistory.${key}`,
    dePaths.has(`admin.customerHistory.${key}`) && enPaths.has(`admin.customerHistory.${key}`),
  );
}

for (const key of ['markPaidTitle', 'markPaidLead', 'markPaidMethod', 'paidVia']) {
  check(`admin.invoice.${key}`, dePaths.has(`admin.invoice.${key}`) && enPaths.has(`admin.invoice.${key}`));
}
for (const key of ['filterStatus', 'filterAll', 'filterEmptyBody']) {
  check(`admin.customers.${key}`, dePaths.has(`admin.customers.${key}`) && enPaths.has(`admin.customers.${key}`));
}

/* The label map moved out of `admin.offers`. Left behind, it would be a second
   source for the same six words — the thing the move existed to remove. */
check('admin.offers.method is gone', !dePaths.has('admin.offers.method.twint'));

/* --------------------------------------------------------------- the data */

for (const clock of CLOCKS) {
  const day = clock.toISOString().slice(0, 10);

  for (const name of SCENARIOS) {
    const data = buildScenario(name, clock);
    const where = `${name} @ ${day}`;

    /* The column this wave added. A paid invoice with no payment renders as
       "Offen" — an open invoice, in green, marked paid. */
    const paidWithoutPayment = data.invoices
      .filter((i) => i.status === 'paid')
      .filter((i) => !invoicePayment(i.id, data.payments));
    check(
      `${where}: every paid invoice has a payment behind it`,
      paidWithoutPayment.length === 0,
      paidWithoutPayment.map((i) => i.reference).join(', '),
    );

    /* And the reverse: a payment against an invoice that is not paid would put
       a settled method on an open row. */
    const settledButOpen = data.payments
      .filter((p) => p.invoiceId)
      .filter((p) => {
        const invoice = data.invoices.find((i) => i.id === p.invoiceId);
        return invoice && invoice.status !== 'paid';
      });
    check(
      `${where}: no payment against an unpaid invoice`,
      settledButOpen.length === 0,
      settledButOpen.map((p) => p.id).join(', '),
    );

    /* An invoice payment for the wrong amount is the one error a reader would
       never catch: both numbers look plausible on their own. */
    const wrongAmount = data.payments
      .filter((p) => p.invoiceId)
      .filter((p) => {
        const invoice = data.invoices.find((i) => i.id === p.invoiceId);
        return invoice ? invoiceTotal(invoice) !== p.amount : false;
      });
    check(
      `${where}: invoice payments carry the invoice total`,
      wrongAmount.length === 0,
      wrongAmount.map((p) => p.id).join(', '),
    );

    /* A saved method pointing at nobody is a row on a customer screen that no
       customer screen can reach. */
    const orphanMethods = data.paymentMethods.filter(
      (m) => !data.customers.some((c) => c.id === m.customerId),
    );
    check(`${where}: every saved method has a customer`, orphanMethods.length === 0);

    /* Exactly one default per customer who has any — the account screen picks
       `forPlan` off it and the record screen draws a chip. */
    for (const customer of data.customers) {
      const mine = data.paymentMethods.filter((m) => m.customerId === customer.id);
      if (mine.length === 0) continue;
      check(
        `${where}: ${customer.id} has exactly one default method`,
        mine.filter((m) => m.isDefault).length === 1,
      );
    }

    /* The timeline. Every entry needs a date to sort by and a reference to
       search for — an entry with neither is a row that cannot be found by any
       control on screen 65a. */
    for (const customer of data.customers) {
      const entries = customerHistory(customer.id, {
        requests: data.requests,
        offers: data.offers,
        bookings: data.bookings,
        invoices: data.invoices,
        subscriptions: data.subscriptions,
        plans: SEED_PLANS,
        services: [],
        locale: 'de',
      });

      check(
        `${where}: ${customer.id} timeline entries all carry a date`,
        entries.every((e) => Boolean(e.at)),
        entries.filter((e) => !e.at).map((e) => e.reference).join(', '),
      );
      check(
        `${where}: ${customer.id} timeline entries all carry a reference`,
        entries.every((e) => Boolean(e.reference)),
      );
      /* Newest first — the record shows the *first five* and calls them the
         last five. */
      check(
        `${where}: ${customer.id} timeline is newest first`,
        entries.every((e, i) => i === 0 || entries[i - 1]!.at >= e.at),
      );
      /* Every badge has to resolve, or the row throws where it used to print.
         `offerSent` is the one that borrows another entity's vocabulary. */
      check(
        `${where}: ${customer.id} timeline badges are labelled`,
        entries.every((e) => dePaths.has(`status.${e.badge.entity}.${e.badge.state}`)),
        entries
          .filter((e) => !dePaths.has(`status.${e.badge.entity}.${e.badge.state}`))
          .map((e) => `${e.badge.entity}/${e.badge.state}`)
          .join(', '),
      );
      /* The record's invoice table and the timeline agree on how many invoices
         this customer has — they are two readings of one list. */
      check(
        `${where}: ${customer.id} timeline invoice count matches the table`,
        entries.filter((e) => e.kind === 'invoice').length ===
          data.invoices.filter((i) => i.customerId === customer.id).length,
      );
    }

    /* "Leistung" on the invoice table. Falling through to an empty string
       would print a blank column on every hand-written invoice. */
    const blankSubject = data.invoices.filter(
      (i) =>
        !invoiceSubject(i, {
          requests: data.requests,
          offers: data.offers,
          bookings: data.bookings,
          invoices: data.invoices,
          subscriptions: data.subscriptions,
          plans: SEED_PLANS,
          services: [],
          locale: 'de',
        }).trim(),
    );
    check(
      `${where}: every invoice has a subject to print`,
      blankSubject.length === 0,
      blankSubject.map((i) => i.reference).join(', '),
    );
  }
}

/*
 * An invoice reference is what a human says out loud — on the phone, in a
 * reminder, in a calendar entry that names one. Two invoices wearing the same
 * one is not a type error and not a crash: it is a screen that looks right and
 * a conversation that goes wrong, and the seed is the only place it can be
 * caught. Checked across the whole file, not per scenario, because the number
 * is read by a person who has no idea which scenario they are looking at.
 */
const refOwner = new Map<string, string>();
for (const name of SCENARIOS) {
  for (const invoice of buildScenario(name, CLOCKS[0]!).invoices) {
    const seen = refOwner.get(invoice.reference);
    check(
      `invoice reference ${invoice.reference} belongs to one invoice`,
      seen === undefined || seen === invoice.id,
      seen ? `${seen} and ${invoice.id}` : '',
    );
    refOwner.set(invoice.reference, invoice.id);
  }
}

/* The scenario whose whole promise is that every declared value has a record
   carrying it. Two of these values are new in this wave. */
const states = buildScenario('states', CLOCKS[0]!);
const seenMethods = new Set(states.payments.map((p) => p.method));
for (const method of ['qr-bill', 'cash', 'twint', 'card'] as const) {
  check(`states carries a ${method} payment`, seenMethods.has(method));
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.log(`\n${failures.slice(0, 30).join('\n')}`);
  process.exit(1);
}
