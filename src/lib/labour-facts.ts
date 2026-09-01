/**
 * The workforce side of a cost — job → worker → hours → money → payer.
 *
 * Kept apart from `expense-facts.ts` the way that file is kept apart from
 * `finance-facts.ts`: that one knows what *any* cost is doing today, this one
 * knows the single shape that has people in it. Every screen that adds up
 * hours reads from here, so the tile on the workforce board, the line on a
 * booking and the line on a team member cannot arrive at three different
 * numbers for one person's week.
 *
 * The arithmetic is deliberately thin. There is no wage model, no overtime and
 * no rate table — the office types an amount and the hours it bought, and the
 * rate is the division of the two. Inventing a rate card here would be the
 * prototype claiming a payroll it does not have (/open-questions §10.3a).
 */

import { effectiveExpenseStatus, isExpenseOutstanding } from '@/lib/expense-facts';
import {
  hasWorkRecord,
  hoursOf,
  memberName as fullName,
  workedMinutes,
} from '@/lib/workforce';
import type { Booking, Expense, ID, LabourEntry, TeamMember } from '@/mock/schema';

/**
 * A cost with people on it, narrowed.
 *
 * `Expense` cannot say "these three fields travel together" without becoming a
 * union every unrelated reader would have to narrow — see the note on
 * `Expense.labour`. This is where the pairing is asserted once, so no screen
 * has to write `expense.labour!`.
 */
export type LabourExpense = Expense & {
  category: 'labour';
  bookingId: ID;
  labour: LabourEntry;
};

export function isLabourExpense(expense: Expense): expense is LabourExpense {
  return expense.category === 'labour' && Boolean(expense.bookingId) && expense.labour !== undefined;
}

/**
 * Everything the workforce screens read, in one filter.
 *
 * A row that says `labour` and carries no `LabourEntry` cannot be produced by
 * the store or by the form — but it can arrive in a blob persisted before this
 * wave, so the guard drops it rather than crashing a total. Same defence
 * `merge` gives the rest of the data set.
 */
export function labourExpenses(expenses: Expense[]): LabourExpense[] {
  return expenses.filter(isLabourExpense);
}

/** What has to be filled in before a labour row is a record rather than a note. */
export function isCompleteLabour(
  labour: Partial<LabourEntry> | undefined,
  bookingId: string | undefined,
): labour is LabourEntry {
  return Boolean(
    bookingId &&
      labour?.workerId &&
      labour.paidById &&
      labour.responsibleId &&
      typeof labour.hours === 'number' &&
      labour.hours > 0,
  );
}

export function labourHours(rows: LabourExpense[]): number {
  return rows.reduce((sum, row) => sum + row.labour.hours, 0);
}

export function labourAmount(rows: LabourExpense[]): number {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

/**
 * What the hour actually cost, derived rather than stored.
 *
 * Two numbers were typed and this is their quotient — storing it would let the
 * three disagree the first time somebody corrects an amount and leaves the
 * hours alone. `null` rather than an infinity for a row with no hours on it.
 */
export function rateOf(row: LabourExpense): number | null {
  return row.labour.hours > 0 ? row.amount / row.labour.hours : null;
}

/** The blended rate over a set — one division, not an average of averages. */
export function averageRate(rows: LabourExpense[]): number | null {
  const hours = labourHours(rows);
  return hours > 0 ? labourAmount(rows) / hours : null;
}

/** Hours recorded and not yet paid out. */
export function unpaidLabour(rows: LabourExpense[], now: Date): number {
  return rows
    .filter((row) => isExpenseOutstanding(effectiveExpenseStatus(row, now)))
    .reduce((sum, row) => sum + row.amount, 0);
}

/**
 * «Marta Nowak», and an em dash for an id that no longer resolves.
 *
 * The spelling comes from `workforce.ts` — wave 84 put the same two lines
 * there for the assignment screens, and two implementations of "how a person's
 * name is written" is the failure `status-registry` and `action-icons` exist to
 * prevent: the day somebody adds a middle initial, half the panel gets it.
 *
 * The dash stays this module's own. These are table cells and an empty one
 * reads as a rendering fault; `workforce` returns an empty string on purpose,
 * because its callers fall back to «Nicht zugewiesen» rather than to a rule.
 */
export function memberName(member: TeamMember | undefined): string {
  return fullName(member) || '—';
}

/**
 * Hours the person was actually on site, to the nearest quarter.
 *
 * The field interface already stamps a check-in and a check-out, so the hours
 * on a finished job are a fact this app is holding and the office was retyping
 * off somebody's phone. Offered as the form's opening figure rather than
 * written silently: a cleaner who forgets to check out would otherwise book an
 * eleven-hour day, and the person entering the cost is the one who knows.
 *
 * Quarters, because that is what a timesheet is written in. `null` for a job
 * with no pair of stamps — there is nothing to suggest, and a zero would read
 * as an answer.
 */
export function hoursOnSite(booking: Booking | undefined): number | null {
  if (!booking?.checkInAt || !booking.checkOutAt) return null;
  const span =
    (new Date(booking.checkOutAt).getTime() - new Date(booking.checkInAt).getTime()) / 3_600_000;
  if (!(span > 0)) return null;
  return Math.round(span * 4) / 4;
}

export interface WorkerTotal {
  workerId: ID;
  hours: number;
  amount: number;
  /** Distinct jobs, not rows — two entries on one job are one job. */
  jobs: number;
  entries: number;
  /** Recorded and not yet paid out to this person. */
  outstanding: number;
  rate: number | null;
}

/**
 * Who worked how much, most hours first.
 *
 * Only people who appear on a row — the rule `costsByCategory` follows, for
 * the same reason: a roster printed in full puts three zeroes above the one
 * line somebody opened the screen for. The whole team is still what the filter
 * offers, so nobody becomes unfindable by being left out here.
 */
export function byWorker(rows: LabourExpense[], now: Date): WorkerTotal[] {
  const index = new Map<ID, { rows: LabourExpense[]; jobs: Set<ID> }>();

  for (const row of rows) {
    const entry = index.get(row.labour.workerId) ?? { rows: [], jobs: new Set<ID>() };
    entry.rows.push(row);
    entry.jobs.add(row.bookingId);
    index.set(row.labour.workerId, entry);
  }

  return [...index.entries()]
    .map(([workerId, entry]) => ({
      workerId,
      hours: labourHours(entry.rows),
      amount: labourAmount(entry.rows),
      jobs: entry.jobs.size,
      entries: entry.rows.length,
      outstanding: unpaidLabour(entry.rows, now),
      rate: averageRate(entry.rows),
    }))
    .sort((a, b) => b.hours - a.hours);
}

export interface JobTotal {
  bookingId: ID;
  hours: number;
  amount: number;
  /** Everyone who booked hours to this job, first appearance first. */
  workerIds: ID[];
  entries: number;
  /** The newest entry on the job — what the list sorts on. */
  latestAt: string;
}

/**
 * What each job cost in people, newest first.
 *
 * The job is the many side here: two cleaners on one move-out clean are two
 * records, and that is the whole reason the hours sit on the cost rather than
 * on the booking — a booking carries one `assigneeId`, and a Saturday carries
 * three people.
 */
export function byJob(rows: LabourExpense[]): JobTotal[] {
  const index = new Map<ID, LabourExpense[]>();

  for (const row of rows) {
    index.set(row.bookingId, [...(index.get(row.bookingId) ?? []), row]);
  }

  return [...index.entries()]
    .map(([bookingId, entries]) => ({
      bookingId,
      hours: labourHours(entries),
      amount: labourAmount(entries),
      workerIds: [...new Set(entries.map((e) => e.labour.workerId))],
      entries: entries.length,
      latestAt: entries.reduce((latest, e) => (e.incurredAt > latest ? e.incurredAt : latest), ''),
    }))
    .sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}

export interface LabourTotals {
  hours: number;
  amount: number;
  entries: number;
  jobs: number;
  workers: number;
  outstanding: number;
  rate: number | null;
}

/** The four tiles at the top of the workforce board, from one pass. */
export function labourTotals(rows: LabourExpense[], now: Date): LabourTotals {
  return {
    hours: labourHours(rows),
    amount: labourAmount(rows),
    entries: rows.length,
    jobs: new Set(rows.map((r) => r.bookingId)).size,
    workers: new Set(rows.map((r) => r.labour.workerId)).size,
    outstanding: unpaidLabour(rows, now),
    rate: averageRate(rows),
  };
}

/**
 * What to open the hours field on, and which of the two it is.
 *
 * `hoursOnSite` was the only answer this file could give, and its own note
 * says why that was uncomfortable: a cleaner who forgets to check out books an
 * eleven-hour day. Wave 84 removed the reason to guess — the person on the job
 * now *reports* their hours at check-out, the office approves them, and that
 * figure is on the booking as `work`.
 *
 * So the report wins where there is one. It is a number a human typed and a
 * second human accepted; the span between two stamps is neither, and it counts
 * the break and the drive home. The stamps stay as the fallback for a job
 * finished before this wave, and the caller has to say which it got — the two
 * cannot share a sentence, because «Check-in bis Check-out» would then be a
 * claim about a figure that did not come from there.
 */
export type HoursSource = 'reported' | 'onSite';

export function suggestedHours(
  booking: Booking | undefined,
): { hours: number; source: HoursSource } | null {
  if (booking && hasWorkRecord(booking)) {
    return { hours: hoursOf(workedMinutes(booking)), source: 'reported' };
  }
  const span = hoursOnSite(booking);
  return span === null ? null : { hours: span, source: 'onSite' };
}
