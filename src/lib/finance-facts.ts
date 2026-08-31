/**
 * The two sides of the money, put next to each other.
 *
 * `invoices` said what came in and nothing said what went out, so «was bleibt
 * am Monatsende» was a question this app could not answer at all — the owner
 * read the revenue on screen 71 and the costs out of a banking app. Screen 71b
 * is that question, and this file is the arithmetic behind it, kept out of the
 * component so the numbers on the analytics screen and the numbers on the two
 * lists cannot drift apart.
 *
 * **Both sides are counted when the work happened, not when the money moved.**
 *
 * That is one decision applied twice, and it is the only one that makes a
 * month comparable to the month before it. A job cleaned in March and paid in
 * May belongs to March; the detergent bought for it belongs to March too.
 * Counting revenue on `paidAt` and costs on `incurredAt` — the tempting mix,
 * because paid invoices are the ones you are sure of — would put the income
 * and the cost of one job in different months and make every monthly profit
 * figure wrong in a way that averages out to right, which is the worst kind.
 *
 * The consequence is stated on the screen rather than hidden: revenue here
 * includes bills nobody has paid yet, so «offen» is its own tile beside it.
 *
 * A draft is not revenue — nobody has been asked for the money and the amount
 * can still change. A cancelled invoice is not revenue either: it was
 * withdrawn, and §15 keeps the document, not the claim.
 */

import { zonedParts, fromZoned } from '@/lib/business-time';
import { invoiceTotal } from '@/lib/customer-history';
import { expenseSum } from '@/lib/expense-facts';
import { effectiveInvoiceStatus, isInvoiceOutstanding } from '@/lib/invoice-permissions';
import type { Expense, Invoice } from '@/mock/schema';

/** The invoices that count as revenue at all. */
export function billedInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter((i) => i.status !== 'draft' && i.status !== 'cancelled');
}

export function revenueSum(invoices: Invoice[]): number {
  return billedInvoices(invoices).reduce((sum, i) => sum + invoiceTotal(i), 0);
}

/** Billed and not yet settled — the working-capital number, not a monthly one. */
export function outstandingSum(invoices: Invoice[], now: Date): number {
  return invoices
    .filter((i) => isInvoiceOutstanding(effectiveInvoiceStatus(i, now)) && i.status !== 'draft')
    .reduce((sum, i) => sum + invoiceTotal(i), 0);
}

export interface FinanceMonth {
  /** `2026-08`, sortable and stable across timezones. */
  key: string;
  /** Midday on the first, so a `format.dateTime` cannot fall into the previous month. */
  at: Date;
  revenue: number;
  costs: number;
  profit: number;
}

/**
 * The last `count` months, oldest first, **including the ones with nothing in
 * them**.
 *
 * A gap is information: a chart that quietly drops February reads as a shorter
 * year rather than as a month with no work in it, and the eye cannot see what
 * is not drawn. So the months are generated from the calendar and the records
 * are dropped into them, never the other way round.
 *
 * Zurich months, via `business-time` — bucketing on `Date.getMonth()` would
 * file the 1st of the month at 00:30 under the previous one for any reviewer
 * west of the office, which is the same class of bug the slot picker had.
 */
export function financeMonths(
  invoices: Invoice[],
  expenses: Expense[],
  now: Date,
  count = 12,
): FinanceMonth[] {
  const here = zonedParts(now);
  const months: FinanceMonth[] = [];
  const index = new Map<string, FinanceMonth>();

  for (let back = count - 1; back >= 0; back -= 1) {
    /* `month - back` may go to zero or negative; `fromZoned` normalises the
       way `Date.UTC` does, so December of last year needs no special case. */
    const at = fromZoned(here.year, here.month - back, 1, 12);
    const p = zonedParts(at);
    const month: FinanceMonth = {
      key: `${p.year}-${String(p.month).padStart(2, '0')}`,
      at,
      revenue: 0,
      costs: 0,
      profit: 0,
    };
    months.push(month);
    index.set(month.key, month);
  }

  /* Anything older than the window simply has no bucket and is skipped — the
     screen says how many months it is showing, so a total that excludes 2024
     is not a number the reader has to reconcile with anything. */
  for (const invoice of billedInvoices(invoices)) {
    const month = index.get(monthKey(new Date(invoice.issuedAt)));
    if (month) month.revenue += invoiceTotal(invoice);
  }
  for (const expense of expenses) {
    const month = index.get(monthKey(new Date(expense.incurredAt)));
    if (month) month.costs += expense.amount;
  }

  for (const month of months) month.profit = month.revenue - month.costs;
  return months;
}

/** `2026-08` for an instant, read on the Zurich clock. */
export function monthKey(at: Date): string {
  const p = zonedParts(at);
  return `${p.year}-${String(p.month).padStart(2, '0')}`;
}

export interface FinanceTotals {
  revenue: number;
  costs: number;
  profit: number;
  /** Profit as a share of revenue, 0–1. `null` when nothing was billed. */
  margin: number | null;
}

export function financeTotals(invoices: Invoice[], expenses: Expense[]): FinanceTotals {
  const revenue = revenueSum(invoices);
  const costs = expenseSum(expenses);
  return {
    revenue,
    costs,
    profit: revenue - costs,
    margin: revenue > 0 ? (revenue - costs) / revenue : null,
  };
}
