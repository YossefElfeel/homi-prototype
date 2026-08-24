/**
 * Who may do what to an invoice, in one table.
 *
 * Every invoice control on every screen was its own inline expression:
 * `isDraft` in one place, `status !== 'paid' && status !== 'cancelled'` in
 * another, and a bulk action on the list that decided selectability with a
 * third. Three answers to one question, and the audit asked the question the
 * codebase could not answer out loud — *who* is allowed to raise an invoice,
 * approve one, cancel one, delete one, and does that depend on who is asking.
 *
 * Both axes live here:
 *
 *  - **Role.** Billing is the owner's. Today that is also enforced a level up —
 *    `AdminShell` turns the whole panel away from anyone who is not the owner —
 *    so this arm has exactly one caller that can currently see a `no` from it,
 *    the customer-facing side. It is written out anyway, because the hiring
 *    track exists to produce a second pair of hands: the day a contractor or a
 *    bookkeeper reaches these screens, the rule is one table to change rather
 *    than eleven conditions to find. Whether such a role *should* exist is a
 *    business decision and sits on /open-questions, not invented here.
 *
 *  - **Status.** This is where the real variation is, and it is the half that
 *    answers "can this still be edited". A draft is the office's own document
 *    and is fully editable; the moment it is approved it is a document somebody
 *    else is holding, and the only honest correction is a new one.
 *
 * A `no` carries *which* axis refused, because the two need different words on
 * screen: "you may not" and "not at this stage" are different sentences, and a
 * greyed control with neither is the thing this replaces.
 */

import type { DemoRole } from '@/mock/store';
import type { Invoice, InvoiceStatus } from '@/mock/schema';

export type InvoiceAction =
  | 'read'
  | 'create'
  /** Change lines, quantities and prices — and add or remove a line. */
  | 'editLines'
  /** Approve the draft and send it to the customer. */
  | 'approve'
  | 'markPaid'
  /** Cancel this one and open a corrected draft in its place. */
  | 'reissue'
  | 'cancel'
  | 'delete';

/** Which axis refused, so the screen can say why rather than just grey out. */
export type InvoiceDenial = 'role' | 'status';

export type InvoicePermission = { allowed: true } | { allowed: false; because: InvoiceDenial };

const YES: InvoicePermission = { allowed: true };
const NO_ROLE: InvoicePermission = { allowed: false, because: 'role' };
const NO_STATUS: InvoicePermission = { allowed: false, because: 'status' };

/**
 * The status half. `read` is absent on purpose — it is decided by role alone,
 * and a customer reading a draft is a role question, not a stage one.
 */
const BY_STATUS: Record<Exclude<InvoiceAction, 'read' | 'create'>, InvoiceStatus[]> = {
  /* Draft only, and this is the answer to "can I still change it after it
     went out". No — an approved invoice is a document the customer is
     holding, and editing it silently would leave two different papers wearing
     one number. */
  editLines: ['draft'],
  approve: ['draft'],
  /* A draft cannot be paid: nobody has been asked for the money yet. */
  markPaid: ['sent', 'overdue'],
  /* The correction path for the states `editLines` refuses. Not `paid` —
     money that has arrived is refunded, and /flows still carries that as
     deliberately open. */
  reissue: ['sent', 'overdue'],
  /* A paid invoice is refunded, not cancelled, and cancelling twice is not a
     thing. */
  cancel: ['draft', 'sent', 'overdue'],
  /* §15 keeps whatever has been in front of a customer, so everything past
     draft is cancelled instead. A draft has been in front of nobody. */
  delete: ['draft'],
};

/**
 * Read-only for a customer: their own invoices, and never a draft.
 *
 * The draft rule is §10 — an unapproved amount can still change, and the
 * account list filters drafts out for exactly this reason.
 */
export function invoicePermission(
  action: InvoiceAction,
  { role, status }: { role: DemoRole; status?: InvoiceStatus },
): InvoicePermission {
  if (action === 'read') {
    if (role === 'owner') return YES;
    if (role === 'customer') return status === 'draft' ? NO_STATUS : YES;
    return NO_ROLE;
  }

  if (role !== 'owner') return NO_ROLE;
  if (action === 'create') return YES;
  if (!status) return NO_STATUS;

  return BY_STATUS[action].includes(status) ? YES : NO_STATUS;
}

/** The common shape at a call site: one boolean, no destructuring. */
export function mayInvoice(
  action: InvoiceAction,
  role: DemoRole,
  status?: InvoiceStatus,
): boolean {
  return invoicePermission(action, { role, status }).allowed;
}

/**
 * `overdue` as the reader sees it.
 *
 * Nothing writes the status: it is a date passing, and storing it would need a
 * nightly sweep to stay true (see /flows, which says so). Every screen that
 * cared derived it inline — the account shell counts a badge with one copy of
 * the expression, the customer's invoice detail draws a warning with another —
 * and the admin list derived it for a *column* while the badge beside that
 * column still read «Versendet». So the list said sent and overdue in one row.
 *
 * One derivation, used for the badge, the filter and the count alike.
 */
export function effectiveInvoiceStatus(invoice: Invoice, now: Date): InvoiceStatus {
  if (invoice.status !== 'sent') return invoice.status;
  return new Date(invoice.dueAt) < now ? 'overdue' : 'sent';
}

/**
 * Is the money still outstanding?
 *
 * The filter the office actually asks for — «bezahlt oder nicht» — cuts across
 * the five statuses rather than picking one of them, and a cancelled invoice is
 * neither: nobody owes it and nobody paid it.
 */
export function isInvoiceOutstanding(status: InvoiceStatus): boolean {
  return status === 'draft' || status === 'sent' || status === 'overdue';
}
