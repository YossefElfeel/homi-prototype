/**
 * What an expense is *doing today*, which is nowhere on the record.
 *
 * The same shape as `invoice-permissions.ts` and for the same reason: an
 * `Expense` stores `open` or `paid` and a due date, and every screen asks the
 * third question — is this one late. Deriving it keeps the badge, the filter
 * and the count reading from one expression; storing it would need a nightly
 * sweep to stay true, which this prototype has no room for (see /flows).
 *
 * Kept apart from `finance-facts.ts` on purpose. This file knows about one
 * entity; that one puts two of them side by side.
 */

import type { Expense, ExpenseCategory, ExpenseStatus } from '@/mock/schema';

/** Every declared state, including the derived one. */
export type ExpenseState = ExpenseStatus | 'overdue';

/**
 * The order is the order the office reads them in, and it is what the create
 * form and the filter both iterate — so a category can never exist in one and
 * not the other.
 */
export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'supplies',
  'vehicle',
  'wages',
  'insurance',
  'marketing',
  'software',
  'rent',
  'other',
];

/**
 * `overdue` as the reader sees it.
 *
 * An expense with no `dueAt` can never be late — a cash purchase at the
 * wholesaler was settled at the till, and a supplier who sent no date is not
 * chasing anybody. Treating a missing date as "due now" would put half the
 * list in red on the day it was entered.
 */
export function effectiveExpenseStatus(expense: Expense, now: Date): ExpenseState {
  if (expense.status === 'paid') return 'paid';
  if (!expense.dueAt) return 'open';
  return new Date(expense.dueAt) < now ? 'overdue' : 'open';
}

/** Money the company still owes. The mirror of `isInvoiceOutstanding`. */
export function isExpenseOutstanding(state: ExpenseState): boolean {
  return state !== 'paid';
}

/** Rows that fall inside a window, by the day the cost arose. */
export function expensesBetween(expenses: Expense[], from: Date, to: Date): Expense[] {
  const start = from.getTime();
  const end = to.getTime();
  return expenses.filter((e) => {
    const at = new Date(e.incurredAt).getTime();
    return at >= start && at <= end;
  });
}

export function expenseSum(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export interface CategoryTotal {
  category: ExpenseCategory;
  total: number;
  count: number;
  /** 0–1 of the whole, for the bar. Zero when nothing was spent at all. */
  share: number;
}

/**
 * Costs grouped by heading, largest first, and **only the headings that were
 * used**.
 *
 * A category with nothing in it is not a finding — it is a row of zeroes
 * pushing the three that matter off the first screen. The full list still
 * lives in `EXPENSE_CATEGORIES`, which is what the filter offers, so nothing
 * becomes unreachable by being left out here.
 */
export function costsByCategory(expenses: Expense[]): CategoryTotal[] {
  const whole = expenseSum(expenses);
  const byCategory = new Map<ExpenseCategory, { total: number; count: number }>();

  for (const expense of expenses) {
    const row = byCategory.get(expense.category) ?? { total: 0, count: 0 };
    row.total += expense.amount;
    row.count += 1;
    byCategory.set(expense.category, row);
  }

  return [...byCategory.entries()]
    .map(([category, row]) => ({
      category,
      total: row.total,
      count: row.count,
      share: whole > 0 ? row.total / whole : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * What carries on whether or not the phone rings.
 *
 * The number the owner is actually asking for when they open this screen in a
 * quiet month: rent, insurance and the subscriptions do not care how many jobs
 * were booked. `recurring` is a flag on the record rather than a schedule —
 * nothing writes next month's copy — so this reads what the office marked.
 */
export function monthlyCommitment(expenses: Expense[]): number {
  return expenseSum(expenses.filter((e) => e.recurring));
}
