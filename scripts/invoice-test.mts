/**
 * Invariants for the invoicing wave.
 *
 * Three classes of failure this catches, none of which typechecks as wrong:
 *
 *  · **A permission rule that drifted.** Eleven inline status tests became one
 *    table, and a table is only worth having if something checks it says what
 *    the screens assume. A status added to `InvoiceStatus` that nobody adds to
 *    `BY_STATUS` silently forbids every action on it.
 *  · **A dead end in the data.** Cancelling an invoice used to leave its
 *    booking on `invoiced` for ever, and the create screen offers «finished
 *    jobs with no live invoice» — so one wrong invoice made a job permanently
 *    unbillable. That is invisible in a type and invisible on screen until the
 *    day somebody needs to re-bill.
 *  · **A number handed out twice.** The invoice counter was `52 +
 *    invoices.length`, so a scenario seeded in the 0100s produced RE-2026-0060
 *    next. References are what customers read out on the phone.
 *
 * Unlike the other four scripts this one drives the real store rather than the
 * seed alone: create, cancel, delete and reissue are mutators, and their whole
 * subject is what happens to *other* records when they run.
 */

/* First, and before the store: see the file's own note. */
import './storage-shim.mts';

import { SCENARIOS, buildScenario } from '../src/mock/scenarios.ts';
import { useStore } from '../src/mock/store.ts';
import {
  effectiveInvoiceStatus,
  invoicePermission,
  isInvoiceOutstanding,
  mayInvoice,
  type InvoiceAction,
} from '../src/lib/invoice-permissions.ts';
import type { DemoRole } from '../src/mock/store.ts';
import type { Invoice, InvoiceStatus } from '../src/mock/schema.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

const STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
const ROLES: DemoRole[] = ['visitor', 'customer', 'owner', 'contractor'];
const ACTIONS: InvoiceAction[] = [
  'read',
  'create',
  'editLines',
  'approve',
  'markPaid',
  'reissue',
  'cancel',
  'delete',
];

/* ---------------------------------------------------------- the rule table */

/* Total, in the mathematical sense: every combination answers, and a `false`
   always says which axis refused. A rule that returns undefined for a status
   nobody thought of is a control that renders enabled. */
for (const role of ROLES) {
  for (const action of ACTIONS) {
    for (const status of STATUSES) {
      const verdict = invoicePermission(action, { role, status });
      check(
        `${role}/${action}/${status} answers`,
        verdict.allowed === true ||
          verdict.because === 'role' ||
          verdict.because === 'status',
      );
    }
  }
}

/* Only the owner acts. AdminShell already keeps everyone else out of the panel,
   so this arm is belt and braces — and it is the arm that will matter the day a
   bookkeeper or a contractor gets a login (see /open-questions §10a). */
for (const role of ROLES.filter((r) => r !== 'owner')) {
  for (const action of ACTIONS.filter((a) => a !== 'read')) {
    for (const status of STATUSES) {
      check(
        `${role} cannot ${action}`,
        !mayInvoice(action, role, status),
        `allowed on ${status}`,
      );
    }
  }
}

/* §10 — a draft is internal until approved. This is the rule the account's
   invoice screen enforces, and it used to be enforced only by the *list*
   filtering drafts out, so the detail screen showed one to anybody with the id. */
check('a customer may read a sent invoice', mayInvoice('read', 'customer', 'sent'));
check('a customer may read a paid invoice', mayInvoice('read', 'customer', 'paid'));
check('a customer may not read a draft', !mayInvoice('read', 'customer', 'draft'));
/* Which axis refused decides the sentence a screen shows — «Sie dürfen nicht»
   and «noch nicht so weit» are different answers. */
const withheld = invoicePermission('read', { role: 'customer', status: 'draft' });
check(
  'a draft is withheld from a customer on the status axis, not the role one',
  withheld.allowed === false && withheld.because === 'status',
);
check('a contractor may not read an invoice at all', !mayInvoice('read', 'contractor', 'sent'));
check('a visitor may not read an invoice at all', !mayInvoice('read', 'visitor', 'sent'));

/* The status axis, action by action. Written out rather than looped, because
   the point is the list of statuses each one accepts — a loop over the same
   table it is testing proves nothing. */
const OWNER_MATRIX: Record<Exclude<InvoiceAction, 'read' | 'create'>, InvoiceStatus[]> = {
  editLines: ['draft'],
  approve: ['draft'],
  markPaid: ['sent', 'overdue'],
  reissue: ['sent', 'overdue'],
  cancel: ['draft', 'sent', 'overdue'],
  delete: ['draft'],
};

for (const [action, allowed] of Object.entries(OWNER_MATRIX)) {
  for (const status of STATUSES) {
    const expected = allowed.includes(status);
    check(
      `owner ${action} on ${status} is ${expected ? 'allowed' : 'refused'}`,
      mayInvoice(action as InvoiceAction, 'owner', status) === expected,
    );
  }
}

/* The three that would cost money if they drifted. */
check('a paid invoice cannot be cancelled', !mayInvoice('cancel', 'owner', 'paid'));
check('a paid invoice cannot be reissued', !mayInvoice('reissue', 'owner', 'paid'));
check('a sent invoice cannot be deleted', !mayInvoice('delete', 'owner', 'sent'));
check('a sent invoice cannot be edited', !mayInvoice('editLines', 'owner', 'sent'));
check('the owner may always create', mayInvoice('create', 'owner'));

/* ------------------------------------------------------ the derived status */

const at = new Date('2026-08-20T10:00:00Z');
const past = new Date('2026-07-01T00:00:00Z').toISOString();
const future = new Date('2026-09-30T00:00:00Z').toISOString();

const shell = (status: InvoiceStatus, dueAt: string): Invoice => ({
  id: 'x',
  reference: 'RE-2026-0001',
  customerId: 'cus_1',
  lines: [],
  status,
  createdAt: past,
  issuedAt: past,
  dueAt,
  qrReference: '21 00000 00000 00000 00000 00000',
});

check('a sent invoice past its date reads overdue', effectiveInvoiceStatus(shell('sent', past), at) === 'overdue');
check('a sent invoice inside its date stays sent', effectiveInvoiceStatus(shell('sent', future), at) === 'sent');
/* The three that must never be rewritten by a date passing. A paid invoice
   whose due date has gone is paid, not overdue — the money arrived. */
check('a paid invoice is never overdue', effectiveInvoiceStatus(shell('paid', past), at) === 'paid');
check('a cancelled invoice is never overdue', effectiveInvoiceStatus(shell('cancelled', past), at) === 'cancelled');
check('a draft is never overdue', effectiveInvoiceStatus(shell('draft', past), at) === 'draft');

/* «Offen» has to partition the five, or the filter loses rows: every status is
   either outstanding or settled, and none of them is both. */
const outstanding = STATUSES.filter(isInvoiceOutstanding);
const settled = STATUSES.filter((s) => !isInvoiceOutstanding(s));
check('open and settled cover every status', outstanding.length + settled.length === STATUSES.length);
check('paid is not outstanding', !isInvoiceOutstanding('paid'));
check('cancelled is not outstanding — nobody owes it', !isInvoiceOutstanding('cancelled'));
check('a draft is outstanding — it is money not yet asked for', isInvoiceOutstanding('draft'));

/* ------------------------------------------------------------ the seed */

for (const scenario of SCENARIOS) {
  const data = buildScenario(scenario, at);

  for (const invoice of data.invoices) {
    check(
      `${scenario}/${invoice.reference} has a creation date`,
      typeof invoice.createdAt === 'string' && !Number.isNaN(Date.parse(invoice.createdAt)),
    );
    /* Raised before it was issued, never after. `sendInvoice` moves `issuedAt`
       forward on approval and must never touch this one. */
    check(
      `${scenario}/${invoice.reference} was raised no later than it was issued`,
      invoice.createdAt <= invoice.issuedAt,
      `${invoice.createdAt} > ${invoice.issuedAt}`,
    );
  }

  /* The premise `releaseBooking` rests on: `invoiced` means one live invoice.
     A booking sitting on `invoiced` with none is the dead end this wave fixed,
     and the seed must not ship one. */
  for (const booking of data.bookings.filter((b) => b.status === 'invoiced')) {
    const live = data.invoices.filter(
      (i) => i.bookingId === booking.id && i.status !== 'cancelled',
    );
    check(
      `${scenario}/${booking.reference} on «invoiced» has exactly one live invoice`,
      live.length === 1,
      `${live.length}`,
    );
  }

  /* Two live invoices against one job is a double charge, whatever the job's
     own status says. */
  const byBooking = new Map<string, number>();
  for (const invoice of data.invoices) {
    if (!invoice.bookingId || invoice.status === 'cancelled') continue;
    byBooking.set(invoice.bookingId, (byBooking.get(invoice.bookingId) ?? 0) + 1);
  }
  for (const [bookingId, count] of byBooking) {
    check(`${scenario}/${bookingId} is billed once`, count === 1, `${count} live invoices`);
  }
}

/* --------------------------------------------------------- the mutators */

/**
 * A fresh copy of the demo dataset before each case.
 *
 * The store is a singleton and these cases delete and cancel real records, so
 * running them against one another's leftovers would make the order of the file
 * part of the result.
 */
function fresh() {
  const data = buildScenario('demo', at);
  useStore.setState({ data });
  return useStore.getState();
}

function billable() {
  const { data } = useStore.getState();
  return data.bookings.find(
    (b) =>
      (b.status === 'completed' || b.status === 'awaitingApproval') &&
      !data.invoices.some((i) => i.bookingId === b.id && i.status !== 'cancelled'),
  );
}

const LINES = [{ label: 'Anfahrt', quantity: 1, unitPrice: 40 }];

/* --- a standalone invoice, the thing that had no route into the product --- */
{
  fresh();
  const customerId = useStore.getState().data.customers[0]!.id;
  const before = useStore.getState().data.invoices.length;
  const id = useStore.getState().createInvoice({ customerId, lines: LINES, termDays: 14 }, at);
  const invoice = useStore.getState().data.invoices.find((i) => i.id === id);

  check('an invoice can be raised without a job', Boolean(invoice));
  check('it lands as a draft', invoice?.status === 'draft');
  check('it is added to the list', useStore.getState().data.invoices.length === before + 1);
  check('it carries the lines it was handed', invoice?.lines[0]?.label === 'Anfahrt');
  check('raised and issued are the same instant on a new draft', invoice?.createdAt === invoice?.issuedAt);
  check(
    'the term is the one that was chosen, not the built-in thirty',
    Math.round(
      (new Date(invoice!.dueAt).getTime() - at.getTime()) / 86_400_000,
    ) === 14,
  );
  check('it hangs off no booking', invoice?.bookingId === undefined);

  /* The counter. Highest ever seen plus one, so a scenario numbered in the
     0100s cannot produce an 0060 next. */
  const numberOf = (i: Invoice) => Number(i.reference.slice(i.reference.lastIndexOf('-') + 1));
  const others = useStore.getState().data.invoices.filter((i) => i.id !== id);
  check(
    'the new reference is higher than every existing one',
    others.every((o) => numberOf(o) < numberOf(invoice!)),
  );

  check(
    'an invoice cannot be raised for a customer who does not exist',
    useStore.getState().createInvoice({ customerId: 'cus_nobody', lines: LINES, termDays: 30 }, at) === null,
  );
}

/* --- a job invoice, and the double-charge guard --- */
{
  fresh();
  const booking = billable()!;
  const id = useStore.getState().createInvoice(
    { customerId: booking.customerId, bookingId: booking.id, lines: LINES, termDays: 30 },
    at,
  );
  check('the job moves to «invoiced»', useStore.getState().data.bookings.find((b) => b.id === booking.id)?.status === 'invoiced');
  check(
    'a second attempt returns the same invoice rather than a second bill',
    useStore.getState().createInvoice(
      { customerId: booking.customerId, bookingId: booking.id, lines: LINES, termDays: 30 },
      at,
    ) === id,
  );
}

/* --- approval --- */
{
  fresh();
  const customerId = useStore.getState().data.customers[0]!.id;
  const id = useStore.getState().createInvoice({ customerId, lines: LINES, termDays: 30 }, at)!;
  const raisedAt = useStore.getState().data.invoices.find((i) => i.id === id)!.createdAt;

  const later = new Date(at.getTime() + 3 * 86_400_000);
  useStore.getState().sendInvoice(id, later);
  const sent = useStore.getState().data.invoices.find((i) => i.id === id)!;

  check('approving sends it', sent.status === 'sent');
  check('approving re-stamps the issue date', sent.issuedAt === later.toISOString());
  /* The whole reason `createdAt` exists: the list's «Erstellt» column has to
     keep saying when the draft was raised, or «seit wann liegt der hier» is
     unanswerable again. */
  check('approving leaves the creation date alone', sent.createdAt === raisedAt);
  check('the term counts from approval', Math.round((new Date(sent.dueAt).getTime() - later.getTime()) / 86_400_000) === 30);
}

/* --- cancelling gives the job back --- */
{
  fresh();
  const booking = billable()!;
  const id = useStore.getState().createInvoice(
    { customerId: booking.customerId, bookingId: booking.id, lines: LINES, termDays: 30 },
    at,
  )!;
  useStore.getState().cancelInvoice(id, 'Falsche Adresse verrechnet.');

  const after = useStore.getState().data.bookings.find((b) => b.id === booking.id)!;
  check('cancelling records the reason', useStore.getState().data.invoices.find((i) => i.id === id)?.cancelReason === 'Falsche Adresse verrechnet.');
  check('cancelling hands the job back to «completed»', after.status === 'completed');

  /* The dead end this wave closed, stated as the thing the office actually
     does next: bill it again, correctly. */
  const second = useStore.getState().createInvoice(
    { customerId: booking.customerId, bookingId: booking.id, lines: LINES, termDays: 30 },
    at,
  );
  check('the job can be billed again afterwards', Boolean(second) && second !== id);
}

/* --- a paid invoice keeps its job closed --- */
{
  fresh();
  const booking = billable()!;
  const id = useStore.getState().createInvoice(
    { customerId: booking.customerId, bookingId: booking.id, lines: LINES, termDays: 30 },
    at,
  )!;
  useStore.getState().sendInvoice(id, at);
  useStore.getState().markInvoicePaid(id, at, 'cash');
  check('settling closes the job', useStore.getState().data.bookings.find((b) => b.id === booking.id)?.status === 'closed');
  check(
    'the method is on the record, which is what the new column reads',
    useStore.getState().data.payments.find((p) => p.invoiceId === id)?.method === 'cash',
  );
}

/* --- deleting a draft --- */
{
  fresh();
  const booking = billable()!;
  const id = useStore.getState().createInvoice(
    { customerId: booking.customerId, bookingId: booking.id, lines: LINES, termDays: 30 },
    at,
  )!;

  check('a draft can be deleted', useStore.getState().deleteInvoice(id) === true);
  check('it is gone from the list', !useStore.getState().data.invoices.some((i) => i.id === id));
  check('deleting hands the job back too', useStore.getState().data.bookings.find((b) => b.id === booking.id)?.status === 'completed');
  /* The audit trail outlives the record — a draft that vanishes without a line
     in the log is the one «where did that invoice go» nobody can answer. */
  check('the deletion is logged', useStore.getState().data.changeLog.some((e) => e.entityId === id));

  const second = useStore.getState().createInvoice(
    { customerId: booking.customerId, lines: LINES, termDays: 30 },
    at,
  )!;
  useStore.getState().sendInvoice(second, at);
  check('a sent invoice cannot be deleted', useStore.getState().deleteInvoice(second) === false);
  check('and it is still there', useStore.getState().data.invoices.some((i) => i.id === second));
}

/* --- correcting one that is already out --- */
{
  fresh();
  const customerId = useStore.getState().data.customers[0]!.id;
  const id = useStore.getState().createInvoice({ customerId, lines: LINES, termDays: 30 }, at)!;

  check('a draft cannot be reissued — it is simply edited', useStore.getState().reissueInvoice(id, at, 'x') === null);

  useStore.getState().sendInvoice(id, at);
  const replacementId = useStore.getState().reissueInvoice(id, at, 'Stundenansatz falsch.');
  const original = useStore.getState().data.invoices.find((i) => i.id === id)!;
  const replacement = useStore.getState().data.invoices.find((i) => i.id === replacementId)!;

  check('reissuing opens a replacement', Boolean(replacementId) && replacementId !== id);
  check('the original is cancelled', original.status === 'cancelled');
  check('the replacement is a draft', replacement.status === 'draft');
  check('the replacement carries the same lines', replacement.lines[0]?.unitPrice === LINES[0]!.unitPrice);
  check('the lines are copied, not shared', replacement.lines[0] !== original.lines[0]);
  check('each document names the other', original.cancelReason?.includes(replacement.reference) === true);
  check('and they are two different numbers', original.reference !== replacement.reference);

  useStore.getState().sendInvoice(replacementId!, at);
  useStore.getState().markInvoicePaid(replacementId!, at, 'qr-bill');
  check('a paid invoice is refunded, not reissued', useStore.getState().reissueInvoice(replacementId!, at, 'x') === null);
}

/* ------------------------------------------------------------------ report */

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  for (const failure of failures) console.log(`  ✗ ${failure}`);
  process.exit(1);
}
