/**
 * The cost side, and the arithmetic that reads it against the invoices.
 *
 * Four classes of failure this catches, none of which typechecks as wrong:
 *
 *  · **A month that lands in the wrong bucket.** Both sides are counted by the
 *    month the work happened in, and the bucketing runs on the Zurich clock.
 *    A receipt dated the 1st at 00:30 filed under the previous month is
 *    invisible on screen and moves a profit figure — the same class of bug the
 *    slot picker had, and it is invisible from a desk in Zurich.
 *
 *  · **A total that disagrees with the chart above it.** The tiles sum the
 *    same buckets the bars are drawn from, so the two cannot drift; that only
 *    holds while `financeMonths` is the single source, and this pins it.
 *
 *  · **A state nothing can reach.** `overdue` is derived, not stored, so a
 *    seed with no unpaid receipt past its date leaves one of three badges
 *    unreviewable — and the list defaults to showing exactly that row.
 *
 *  · **A store action that lies.** `createExpense` mints the reference, and a
 *    counter that hands out a number twice is a receipt the bookkeeper cannot
 *    look up. Same failure `nextInvoiceSeq` was written for.
 *
 *  · **A labour row that points at nobody.** The workforce board is a set of
 *    totals with names on them, and an id that resolves to nothing prints an
 *    em dash and still counts the hours underneath it — a number with no
 *    answer behind it, which is worse than a missing row.
 */

/* First, and before the store: see the file's own note. */
import './storage-shim.mts';

import { SCENARIOS, buildScenario } from '../src/mock/scenarios.ts';
import { useStore } from '../src/mock/store.ts';
import {
  EXPENSE_CATEGORIES,
  costsByCategory,
  effectiveExpenseStatus,
  expenseSum,
  isExpenseOutstanding,
  monthlyCommitment,
} from '../src/lib/expense-facts.ts';
import {
  billedInvoices,
  financeMonths,
  financeTotals,
  monthKey,
  outstandingSum,
  revenueSum,
} from '../src/lib/finance-facts.ts';
import { invoiceTotal } from '../src/lib/customer-history.ts';
import {
  averageRate,
  byJob,
  byWorker,
  hoursOnSite,
  isCompleteLabour,
  isLabourExpense,
  labourAmount,
  labourExpenses,
  labourHours,
  labourTotals,
  memberName,
  rateOf,
  unpaidLabour,
} from '../src/lib/labour-facts.ts';
import { statesOf } from '../src/lib/status-registry.ts';
import { de, en } from '../src/messages/index.ts';
import type { Booking, Expense } from '../src/mock/schema.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

const NOW = new Date('2026-08-25T10:00:00Z');
const seeded = buildScenario('demo', NOW).expenses;

/* --------------------------------------------------------------- the seed */
{
  check('the demo scenario seeds costs', seeded.length > 0, `got ${seeded.length}`);
  check(
    'fresh stays empty, so the empty state is still reachable',
    buildScenario('fresh', NOW).expenses.length === 0,
  );
  check(
    'every other scenario carries them',
    SCENARIOS.filter((s) => s !== 'fresh').every(
      (s) => buildScenario(s, NOW).expenses.length > 0,
    ),
  );

  check('no two costs share an id', new Set(seeded.map((e) => e.id)).size === seeded.length);
  check(
    'no two costs share a reference — it is what a bookkeeper looks one up by',
    new Set(seeded.map((e) => e.reference)).size === seeded.length,
  );
  check('every amount is positive', seeded.every((e) => e.amount > 0));
  check('every supplier is named', seeded.every((e) => e.supplier.trim() !== ''));

  /* Nothing dated ahead of the clock. The current-month block sits on fixed
     days of the month and `now` is whatever the demo bar says, so on the 2nd
     three of them would otherwise be in the future — where they sort to the
     top of a list ordered newest-first and are compared against a due date
     that has not happened. */
  for (const name of SCENARIOS) {
    const data = buildScenario(name, NOW);
    check(
      `${name}: no cost is incurred in the future`,
      data.expenses.every((e) => new Date(e.incurredAt) <= NOW),
      data.expenses
        .filter((e) => new Date(e.incurredAt) > NOW)
        .map((e) => e.reference)
        .join(', '),
    );
  }

  check(
    'a paid cost records how it was paid',
    seeded.filter((e) => e.status === 'paid').every((e) => Boolean(e.method) && Boolean(e.paidAt)),
  );
  check(
    'and an open one records neither — printing a route before the money moved states a fact that has not happened',
    seeded.filter((e) => e.status === 'open').every((e) => !e.method && !e.paidAt),
  );
  check(
    'no deadline falls before the cost arose',
    seeded.every((e) => !e.dueAt || e.dueAt >= e.incurredAt),
  );

  /* Every column of the list has to have something in it, or half the
     rendering ships unreviewed — the same rule the coupon seed follows. */
  check(
    'a recurring cost is seeded, and so is a one-off',
    seeded.some((e) => e.recurring) && seeded.some((e) => !e.recurring),
  );
  check(
    'a cost with no deadline is seeded — «ohne Frist» is a real cell',
    seeded.some((e) => e.dueAt === undefined),
  );
  check(
    'and one with a deadline is too',
    seeded.some((e) => e.dueAt !== undefined),
  );
  /*
   * The «Fällig» column has three renderings and this is the one that had
   * nothing behind it: a settled bill prints the date it *was* due. The first
   * seed gave a deadline only to unpaid rows, so 74 of 76 read «ohne Frist»
   * and the branch could not be reached at all. Found by looking at the
   * screen, which is the only way it could have been.
   */
  check(
    'a settled cost that had a deadline is seeded, so the paid branch of «Fällig» is reachable',
    seeded.some((e) => e.status === 'paid' && e.dueAt !== undefined),
  );
  check(
    'and every settled one was settled before its deadline — none derives as overdue',
    seeded
      .filter((e) => e.status === 'paid' && e.dueAt && e.paidAt)
      .every((e) => e.paidAt! <= e.dueAt!),
  );
  /* Neither branch is a rounding error. A column where one of two renderings
     appears on three rows in seventy-six is a column nobody reviews. */
  const withDue = seeded.filter((e) => e.dueAt !== undefined).length;
  check(
    'both renderings of «Fällig» carry real weight in the seed',
    withDue > seeded.length * 0.25 && seeded.length - withDue > seeded.length * 0.15,
    `${withDue} with a deadline, ${seeded.length - withDue} without`,
  );
  check('cash is seeded, not only the QR-bill', seeded.some((e) => e.method === 'cash'));
}

/* ------------------------------------------------------- the derived state */
{
  const seen = new Set(seeded.map((e) => effectiveExpenseStatus(e, NOW)));

  check(
    'the seed reaches every declared expense state',
    statesOf('expense').every((s) => seen.has(s as never)),
    `missing ${statesOf('expense').filter((s) => !seen.has(s as never)).join(', ')}`,
  );
  check(
    'and declares no state it cannot reach',
    [...seen].every((s) => statesOf('expense').includes(s)),
  );
  check(
    'every state has a label in both languages',
    statesOf('expense').every(
      (s) =>
        Boolean((en.status.expense as Record<string, string>)[s]) &&
        Boolean((de.status.expense as Record<string, string>)[s]),
    ),
  );

  const shell = (over: Partial<Expense>): Expense => ({
    id: 'exp_shell',
    reference: 'AUS-2026-9999',
    category: 'supplies',
    supplier: 'Shell',
    amount: 100,
    incurredAt: '2026-08-01T10:00:00.000Z',
    status: 'open',
    ...over,
  });

  const past = '2026-08-01T10:00:00.000Z';
  const future = '2026-09-30T10:00:00.000Z';

  check('a paid cost is never overdue', effectiveExpenseStatus(shell({ status: 'paid', dueAt: past }), NOW) === 'paid');
  check('an open one past its date is', effectiveExpenseStatus(shell({ dueAt: past }), NOW) === 'overdue');
  check('an open one before it is not', effectiveExpenseStatus(shell({ dueAt: future }), NOW) === 'open');
  /*
   * No deadline can never be late. A cash purchase at the wholesaler was
   * settled at the till and a supplier who sent no date is not chasing
   * anybody — treating a missing date as "due now" would put half the list in
   * red on the day it was entered.
   */
  check('and one with no deadline at all never is', effectiveExpenseStatus(shell({}), NOW) === 'open');

  /* «Offen» has to partition the three, or the filter loses rows. */
  const states = statesOf('expense') as ('open' | 'overdue' | 'paid')[];
  check(
    'open and settled cover every state',
    states.filter(isExpenseOutstanding).length + states.filter((s) => !isExpenseOutstanding(s)).length ===
      states.length,
  );
  check('paid is not outstanding', !isExpenseOutstanding('paid'));
  check('overdue is', isExpenseOutstanding('overdue'));
}

/* ----------------------------------------------------------- the categories */
{
  check(
    'every seeded category is one the filter offers',
    seeded.every((e) => EXPENSE_CATEGORIES.includes(e.category)),
  );
  check(
    'every category has a label in both languages',
    EXPENSE_CATEGORIES.every(
      (c) =>
        Boolean((en.admin.expenses.categories as Record<string, string>)[c]) &&
        Boolean((de.admin.expenses.categories as Record<string, string>)[c]),
    ),
  );
  /* Not a style point: a category nothing uses is a filter option that empties
     the table every time, on a screen whose whole subject is where the money
     goes. */
  check(
    'and the seed uses every one of them',
    EXPENSE_CATEGORIES.every((c) => seeded.some((e) => e.category === c)),
    `unused: ${EXPENSE_CATEGORIES.filter((c) => !seeded.some((e) => e.category === c)).join(', ')}`,
  );

  const rows = costsByCategory(seeded);
  check('the breakdown accounts for every franc', Math.abs(rows.reduce((n, r) => n + r.total, 0) - expenseSum(seeded)) < 0.005);
  check('the shares add up to one', Math.abs(rows.reduce((n, r) => n + r.share, 0) - 1) < 0.0001);
  check('largest first', rows.every((r, i) => i === 0 || rows[i - 1]!.total >= r.total));
  check('an empty set has no rows and no division by zero', costsByCategory([]).length === 0);
  check('wages are seeded, so the profit line is not a fiction', rows.some((r) => r.category === 'wages'));

  check(
    'the monthly commitment counts only what recurs',
    monthlyCommitment(seeded) === expenseSum(seeded.filter((e) => e.recurring)),
  );
  check('and nothing at all when nothing does', monthlyCommitment(seeded.map((e) => ({ ...e, recurring: false }))) === 0);
}

/* ------------------------------------------------------ revenue and months */
{
  const data = buildScenario('demo', NOW);

  check(
    'a draft is not revenue — nobody has been asked for the money',
    !billedInvoices(data.invoices).some((i) => i.status === 'draft'),
  );
  check(
    'and neither is a cancelled invoice — it was withdrawn',
    !billedInvoices(data.invoices).some((i) => i.status === 'cancelled'),
  );
  check(
    'revenue is the sum of what is left',
    Math.abs(revenueSum(data.invoices) - billedInvoices(data.invoices).reduce((n, i) => n + invoiceTotal(i), 0)) < 0.005,
  );

  const outstanding = outstandingSum(data.invoices, NOW);
  check('something is outstanding in the seed, so the tile is not always zero', outstanding > 0);
  check(
    'and a paid invoice is not part of it',
    outstanding ===
      data.invoices
        .filter((i) => i.status === 'sent' || i.status === 'overdue')
        .reduce((n, i) => n + invoiceTotal(i), 0),
  );

  const months = financeMonths(data.invoices, data.expenses, NOW, 12);
  check('twelve months are asked for and twelve come back', months.length === 12);
  check('oldest first', months.every((m, i) => i === 0 || months[i - 1]!.key < m.key));
  check('the last one is the month we are in', months.at(-1)!.key === monthKey(NOW));
  check(
    'every month is present, including the empty ones — a gap is information',
    new Set(months.map((m) => m.key)).size === 12,
  );
  check('profit is revenue minus costs, per month', months.every((m) => Math.abs(m.profit - (m.revenue - m.costs)) < 0.005));

  /* The one that would be invisible on screen: a bucket keyed off
     `Date.getMonth()` files the 1st of the month at 00:30 under the previous
     one for any reviewer west of Zurich. */
  const firstOfMonth = new Date('2026-08-01T00:30:00+02:00');
  check('the buckets are Zurich months, not the runner’s', monthKey(firstOfMonth) === '2026-08');
  const lastOfMonth = new Date('2026-07-31T23:30:00+02:00');
  check('and the last half-hour of a month stays in it', monthKey(lastOfMonth) === '2026-07');

  /* December of last year needs no special case: `fromZoned` normalises an
     overflowing month the way `Date.UTC` does. */
  const acrossNewYear = financeMonths(data.invoices, data.expenses, new Date('2026-02-15T10:00:00Z'), 12);
  check('a window that crosses the new year is still twelve distinct months', new Set(acrossNewYear.map((m) => m.key)).size === 12);
  check('and it reaches back into the previous year', acrossNewYear.some((m) => m.key.startsWith('2025-')));

  /* The tiles sum the buckets the bars are drawn from, so the number above the
     chart and the chart cannot disagree. */
  const windowRevenue = months.reduce((n, m) => n + m.revenue, 0);
  const windowCosts = months.reduce((n, m) => n + m.costs, 0);
  const keys = new Set(months.map((m) => m.key));
  check(
    'the revenue tile is the sum of the bars',
    Math.abs(
      windowRevenue -
        billedInvoices(data.invoices)
          .filter((i) => keys.has(monthKey(new Date(i.issuedAt))))
          .reduce((n, i) => n + invoiceTotal(i), 0),
    ) < 0.005,
  );
  check(
    'and so is the cost tile',
    Math.abs(windowCosts - expenseSum(data.expenses.filter((e) => keys.has(monthKey(new Date(e.incurredAt)))))) < 0.005,
  );

  /* A year that reads as a business rather than as a demo: mostly profitable,
     with at least one month in the red so the danger tone and the red profit
     cell have a row to stand on. */
  check('the seeded year has a month in the red', months.some((m) => m.profit < 0));
  check('and most of them are not', months.filter((m) => m.profit > 0).length > months.length / 2);

  const totals = financeTotals(data.invoices, data.expenses);
  check('the year as a whole is profitable', totals.profit > 0, `${totals.profit}`);
  check('and the margin is a fraction, not a percentage', totals.margin !== null && totals.margin < 1);
  check('no revenue means no margin rather than a division by zero', financeTotals([], data.expenses).margin === null);
}

/* ------------------------------------------------------ what the store does */
{
  useStore.setState({ data: buildScenario('demo', NOW) });
  const before = useStore.getState().data.expenses.length;

  const id = useStore.getState().createExpense(
    {
      category: 'supplies',
      supplier: '  Hygiene Center Zürich  ',
      note: '  Two crates of cloths  ',
      amount: 180,
      incurredAt: NOW.toISOString(),
    },
    NOW,
  );
  check('a cost can be recorded', typeof id === 'string');
  const created = useStore.getState().data.expenses.find((e) => e.id === id)!;
  check('it is added to the list', useStore.getState().data.expenses.length === before + 1);
  check('the supplier is trimmed', created.supplier === 'Hygiene Center Zürich');
  check('and so is the note', created.note === 'Two crates of cloths');
  check('it arrives open — settling is its own step, so the route cannot be skipped', created.status === 'open');
  check('with no payment route on it yet', created.method === undefined);

  /* Highest ever seen plus one. The seed numbers into the 0040s, so a counter
     that restarted would hand out a reference somebody is already holding. */
  const numberOf = (e: Expense) => Number(e.reference.slice(e.reference.lastIndexOf('-') + 1));
  check(
    'the new reference is higher than every existing one',
    useStore.getState().data.expenses.filter((e) => e.id !== id).every((e) => numberOf(e) < numberOf(created)),
  );

  check(
    'a cost of nothing is refused — it adds nothing to a total and hides in every sort',
    useStore.getState().createExpense({ category: 'other', supplier: 'X', amount: 0, incurredAt: NOW.toISOString() }, NOW) === null,
  );
  check(
    'and so is one with no supplier',
    useStore.getState().createExpense({ category: 'other', supplier: '   ', amount: 50, incurredAt: NOW.toISOString() }, NOW) === null,
  );

  const logCount = () => useStore.getState().data.changeLog.length;
  const beforeLog = logCount();
  useStore.getState().markExpensePaid(id!, NOW, 'card');
  const paid = useStore.getState().data.expenses.find((e) => e.id === id)!;
  check('settling writes the status', paid.status === 'paid');
  check('the date', Boolean(paid.paidAt));
  check('and the route', paid.method === 'card');
  check('and it is logged', logCount() === beforeLog + 1);

  const afterLog = logCount();
  useStore.getState().markExpensePaid(id!, NOW, 'cash');
  check('settling an already-settled cost changes nothing', logCount() === afterLog);
  check('and does not overwrite the route it was actually paid by', useStore.getState().data.expenses.find((e) => e.id === id)!.method === 'card');

  useStore.getState().updateExpense(id!, { amount: 195 });
  check('a cost can be corrected', useStore.getState().data.expenses.find((e) => e.id === id)!.amount === 195);
  check('and correcting it does not un-settle it', useStore.getState().data.expenses.find((e) => e.id === id)!.status === 'paid');

  /* Deletable at any status, which is where it parts company with an invoice:
     §15 keeps a released invoice because somebody outside is holding a copy,
     and nobody has ever been handed one of these. */
  const deletedLog = logCount();
  check('a settled cost can still be deleted', useStore.getState().deleteExpense(id!) === true);
  check('it leaves the list', !useStore.getState().data.expenses.some((e) => e.id === id));
  check(
    'and the log entry outlives it — a cost vanishing out of a month somebody has read the profit for has to be accountable',
    logCount() === deletedLog + 1,
  );
  check('deleting something that is not there is refused quietly', useStore.getState().deleteExpense('exp_nobody') === false);
}

/* --------------------------------------------- what the store does with a crew */
{
  const data = buildScenario('demo', NOW);
  useStore.setState({ data });

  const worker = data.team.find((m) => m.role !== 'owner')!;
  const owner = data.team.find((m) => m.role === 'owner')!;
  const booking = data.bookings.find((b) => b.status === 'completed')!;
  const crew = {
    workerId: worker.id,
    paidById: owner.id,
    responsibleId: owner.id,
    hours: 4.5,
  };
  const base = {
    category: 'labour' as const,
    supplier: 'ignored',
    amount: 144,
    incurredAt: NOW.toISOString(),
    bookingId: booking.id,
  };

  const id = useStore.getState().createExpense({ ...base, labour: crew }, NOW)!;
  const created = useStore.getState().data.expenses.find((e) => e.id === id)!;
  check('hours can be booked against a job', typeof id === 'string');
  check('the crew is stored whole', JSON.stringify(created.labour) === JSON.stringify(crew));
  check(
    'and the supplier is the worker, not what the caller typed — that is what the list prints',
    created.supplier === memberName(worker),
  );
  check(
    'the log entry says how many hours and on which job, so a month can be reconciled',
    useStore.getState().data.changeLog[0]!.summary.includes('4.5 h') &&
      useStore.getState().data.changeLog[0]!.summary.includes(booking.reference),
  );

  /* Five ways to be incomplete, and every one of them produces a total the
     board could print and could not attribute. */
  check('labour with no worker is refused', useStore.getState().createExpense({ ...base, labour: { ...crew, workerId: '' } }, NOW) === null);
  check('labour with no hours is refused', useStore.getState().createExpense({ ...base, labour: { ...crew, hours: 0 } }, NOW) === null);
  check('labour with no job is refused', useStore.getState().createExpense({ ...base, bookingId: undefined, labour: crew }, NOW) === null);
  check('labour with no crew at all is refused', useStore.getState().createExpense({ ...base }, NOW) === null);
  check('a worker who is not on the team is refused', useStore.getState().createExpense({ ...base, labour: { ...crew, workerId: 'tm_nobody' } }, NOW) === null);
  check('a payer who is not on the team is refused', useStore.getState().createExpense({ ...base, labour: { ...crew, paidById: 'tm_nobody' } }, NOW) === null);
  check('a responsible who is not on the team is refused', useStore.getState().createExpense({ ...base, labour: { ...crew, responsibleId: 'tm_nobody' } }, NOW) === null);
  check('a job that does not exist is refused', useStore.getState().createExpense({ ...base, bookingId: 'bkg_nobody', labour: crew }, NOW) === null);

  /* The other direction: a crew handed to a category that cannot hold one. */
  const strayId = useStore.getState().createExpense(
    { category: 'supplies', supplier: 'Hygiene Center Zürich', amount: 60, incurredAt: NOW.toISOString(), bookingId: booking.id, labour: crew },
    NOW,
  )!;
  check(
    'a crew handed to a supplies receipt is dropped rather than stored out of sight',
    useStore.getState().data.expenses.find((e) => e.id === strayId)!.labour === undefined,
  );

  useStore.getState().updateExpense(id, { amount: 180 });
  check('a labour cost can be corrected', useStore.getState().data.expenses.find((e) => e.id === id)!.amount === 180);
  check('and keeps its crew', useStore.getState().data.expenses.find((e) => e.id === id)!.labour !== undefined);

  const second = data.team.find((m) => m.id !== worker.id && m.role !== 'owner') ?? owner;
  useStore.getState().updateExpense(id, { labour: { ...crew, workerId: second.id } });
  check(
    'changing the worker moves the name in the list with it',
    useStore.getState().data.expenses.find((e) => e.id === id)!.supplier === memberName(second),
  );

  useStore.getState().updateExpense(id, { labour: { ...crew, workerId: '' } });
  check(
    'a patch that would leave the crew incomplete is refused, not half-written',
    useStore.getState().data.expenses.find((e) => e.id === id)!.labour?.workerId === second.id,
  );

  useStore.getState().updateExpense(id, { category: 'supplies', supplier: 'Landi Männedorf' });
  const converted = useStore.getState().data.expenses.find((e) => e.id === id)!;
  check('a cost that stops being labour loses the crew with the category', converted.labour === undefined);
  check('and takes the supplier it was given', converted.supplier === 'Landi Männedorf');
  check(
    'so it is no longer counted on the workforce board',
    !labourExpenses(useStore.getState().data.expenses).some((e) => e.id === id),
  );

  useStore.getState().updateExpense(id, { supplier: '   ' });
  check(
    'and it cannot be left nameless — a blank first column is unfindable in a list sorted by it',
    useStore.getState().data.expenses.find((e) => e.id === id)!.supplier === 'Landi Männedorf',
  );
}

/* ------------------------------------------------------- the labour rows */
{
  const data = buildScenario('demo', NOW);
  const rows = labourExpenses(data.expenses);
  const member = (id: string) => data.team.find((m) => m.id === id);
  const job = (id: string) => data.bookings.find((b) => b.id === id);

  check('the seed books hours against jobs', rows.length > 0, `got ${rows.length}`);
  check(
    'every scenario but fresh carries them, so the board is never empty by accident',
    SCENARIOS.filter((s) => s !== 'fresh').every(
      (s) => labourExpenses(buildScenario(s, NOW).expenses).length > 0,
    ),
  );
  check(
    'and fresh carries none — the empty board is a real state, not a bug',
    labourExpenses(buildScenario('fresh', NOW).expenses).length === 0,
  );

  /* The four that make a labour row a record. Any one of them missing is a
     total the screen can print and cannot explain. */
  check('every labour row names a job', rows.every((e) => Boolean(job(e.bookingId))));
  check('every labour row names a worker who exists', rows.every((e) => Boolean(member(e.labour.workerId))));
  check('a payer who exists', rows.every((e) => Boolean(member(e.labour.paidById))));
  check('a responsible who exists', rows.every((e) => Boolean(member(e.labour.responsibleId))));
  check('and hours above zero', rows.every((e) => e.labour.hours > 0));

  /* The derivation the list, the search and the export all lean on. */
  check(
    'the supplier on a labour row is the worker’s name — that is what the list prints',
    rows.every((e) => e.supplier === memberName(member(e.labour.workerId))),
    rows.filter((e) => e.supplier !== memberName(member(e.labour.workerId))).map((e) => e.reference).join(', '),
  );

  /* Nothing else may carry a crew. A receipt from the wholesaler with three
     people attached is invisible on screen and still inside every total. */
  check(
    'no cost outside the labour category carries a crew',
    data.expenses.filter((e) => e.category !== 'labour').every((e) => e.labour === undefined),
  );
  check(
    'and no labour row claims to run every month — hours on one job do not recur',
    rows.every((e) => !e.recurring),
  );

  /* Every rendering on the board needs a row behind it, or half the screen
     ships unreviewed — the rule the coupon and the «Fällig» column follow. */
  const labourStates = new Set(rows.map((e) => effectiveExpenseStatus(e, NOW)));
  check(
    'all three states are reachable on the workforce board',
    statesOf('expense').every((s) => labourStates.has(s as never)),
    `missing ${statesOf('expense').filter((s) => !labourStates.has(s as never)).join(', ')}`,
  );
  check(
    'a job with two people on it is seeded — one `assigneeId` cannot hold a crew',
    byJob(rows).some((j) => j.workerIds.length > 1),
  );
  check(
    'somebody paid for hours they did not work, so «Bezahlt von» is not a copy of the name',
    rows.some((e) => e.labour.paidById !== e.labour.workerId),
  );
  check(
    'and somebody other than the owner carries a cost, so «Verantwortlich» is not either',
    new Set(rows.map((e) => e.labour.responsibleId)).size > 1,
  );

  check(
    'the guard rejects a row that says labour and carries nothing',
    !isLabourExpense({ ...rows[0]!, labour: undefined } as Expense),
  );
  check(
    'and one with a crew but no job',
    !isLabourExpense({ ...rows[0]!, bookingId: undefined } as Expense),
  );
  check('a complete crew passes', isCompleteLabour(rows[0]!.labour, rows[0]!.bookingId));
  check('zero hours do not', !isCompleteLabour({ ...rows[0]!.labour, hours: 0 }, rows[0]!.bookingId));
  check('and neither does a missing job', !isCompleteLabour(rows[0]!.labour, undefined));
}

/* ------------------------------------------------------ the labour totals */
{
  const data = buildScenario('demo', NOW);
  const rows = labourExpenses(data.expenses);

  const people = byWorker(rows, NOW);
  check('the per-person breakdown accounts for every hour', Math.abs(people.reduce((n, r) => n + r.hours, 0) - labourHours(rows)) < 0.0001);
  check('and for every franc', Math.abs(people.reduce((n, r) => n + r.amount, 0) - labourAmount(rows)) < 0.005);
  check('most hours first', people.every((r, i) => i === 0 || people[i - 1]!.hours >= r.hours));
  check(
    'two entries on one job count as one job, not two',
    people.every((r) => r.jobs <= r.entries),
  );

  const jobs = byJob(rows);
  check('the per-job breakdown accounts for every franc too', Math.abs(jobs.reduce((n, r) => n + r.amount, 0) - labourAmount(rows)) < 0.005);
  check('newest job first', jobs.every((r, i) => i === 0 || jobs[i - 1]!.latestAt >= r.latestAt));
  check('an empty set produces no rows and no division by zero', byWorker([], NOW).length === 0 && byJob([]).length === 0);

  const totals = labourTotals(rows, NOW);
  check('the tiles read the same rows the tables do', totals.hours === labourHours(rows) && totals.amount === labourAmount(rows));
  check('the average rate is the total divided once, not a mean of means', totals.rate !== null && Math.abs(totals.rate - labourAmount(rows) / labourHours(rows)) < 0.0001);
  check('no hours means no rate rather than an infinity', averageRate([]) === null);
  check(
    'the outstanding tile counts only what is still owed',
    Math.abs(unpaidLabour(rows, NOW) - rows.filter((e) => isExpenseOutstanding(effectiveExpenseStatus(e, NOW))).reduce((n, e) => n + e.amount, 0)) < 0.005,
  );
  check('something is still owed in the seed, so the warning tone has a row', unpaidLabour(rows, NOW) > 0);

  const first = rows[0]!;
  check('the rate on a row is the amount over the hours', Math.abs((rateOf(first) ?? 0) - first.amount / first.labour.hours) < 0.0001);
  check('and a row with no hours has no rate', rateOf({ ...first, labour: { ...first.labour, hours: 0 } }) === null);

  /* The hours a job already knows. Offered to the form rather than written —
     but the arithmetic still has to be right, and quarters are what a
     timesheet is written in. */
  const shell = (over: Partial<Booking>) => ({ ...data.bookings[0]!, ...over });
  check(
    'check-in to check-out rounds to the nearest quarter',
    hoursOnSite(shell({ checkInAt: '2026-08-20T07:00:00.000Z', checkOutAt: '2026-08-20T10:22:00.000Z' })) === 3.25,
  );
  check('a job with no check-out suggests nothing', hoursOnSite(shell({ checkInAt: '2026-08-20T07:00:00.000Z', checkOutAt: undefined })) === null);
  check('and neither does one with no stamps at all', hoursOnSite(shell({ checkInAt: undefined, checkOutAt: undefined })) === null);
  check(
    'a check-out before the check-in is refused rather than returned negative',
    hoursOnSite(shell({ checkInAt: '2026-08-20T10:00:00.000Z', checkOutAt: '2026-08-20T07:00:00.000Z' })) === null,
  );
}

if (failures.length > 0) {
  console.error(`\n${passed} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\n${passed} passed, 0 failed`);
