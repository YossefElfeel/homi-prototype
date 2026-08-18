import type { StatusEntity } from '@/lib/status-registry';
import type { Locale } from '@/i18n/routing';
import type {
  Booking,
  ID,
  Invoice,
  Offer,
  Service,
  ServiceRequest,
  Subscription,
} from '@/mock/schema';

/**
 * Everything that has happened to one customer, in one list.
 *
 * The detail screen built this inline and the history screen would have built
 * it again — two timelines claiming to be the same timeline, drifting the
 * first time one of them learned about a new record type. It is here instead,
 * so "the last five things" and "everything, searchable" are literally the
 * same list read at two lengths.
 *
 * Quotes are in it, and were not before. The old timeline went straight from
 * "request" to "booking", which skipped the entire middle of the flow: what we
 * offered, for how much, and whether the customer said yes, asked for a change
 * or never answered. On the phone that is usually the question being asked.
 */
export type HistoryKind = 'request' | 'offer' | 'booking' | 'invoice';

export const HISTORY_KINDS: readonly HistoryKind[] = [
  'request',
  'offer',
  'booking',
  'invoice',
];

export interface HistoryEntry {
  id: ID;
  kind: HistoryKind;
  /** The date the row is filed under — see `sourceOf` for which one, per kind. */
  at: string;
  /** The record's own reference. What a human types into the search box. */
  reference: string;
  /** What it was about: the service, or the plan being billed. */
  detail: string;
  /**
   * The badge to draw. A quote has no registry of its own — it borrows the
   * request's colours, which is what `/admin/offerten` already does, so `sent`
   * has to answer to `offerSent` here too.
   */
  badge: { entity: StatusEntity; state: string };
  href: string;
  /** Invoices only. Nothing else in the timeline carries a settled amount. */
  amount?: number;
}

export const invoiceTotal = (invoice: Invoice) =>
  invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

export interface HistorySources {
  requests: ServiceRequest[];
  offers: Offer[];
  bookings: Booking[];
  invoices: Invoice[];
  subscriptions: Subscription[];
  services: Service[];
  locale: Locale;
}

const serviceName = (slug: string, services: Service[], locale: Locale) =>
  services.find((s) => s.slug === slug)?.name[locale] ?? slug;

/**
 * The service an invoice is for.
 *
 * Three sources in order, because an invoice does not carry a service of its
 * own: the job it bills, the plan it charges, or — for a hand-written one —
 * the first line the owner typed. Falling back to the reference would print
 * the same string twice in two adjacent columns.
 */
export function invoiceSubject(
  invoice: Invoice,
  { bookings, subscriptions, services, locale }: HistorySources,
): string {
  const booking = bookings.find((b) => b.id === invoice.bookingId);
  if (booking) return serviceName(booking.serviceSlug, services, locale);

  const subscription = subscriptions.find((s) => s.id === invoice.subscriptionId);
  if (subscription) return serviceName(subscription.serviceSlug, services, locale);

  return invoice.lines[0]?.label ?? '—';
}

/**
 * Newest first, across all four record types.
 *
 * Each kind is filed under the date that answers "when did this happen for the
 * customer": a request when it came in, a job when it is due, an invoice when
 * it was issued. A quote uses `issuedAt` and falls back to its request — a
 * draft has never been issued, and sorting it to the bottom of the list under
 * an empty date would hide the one the owner is still writing.
 */
export function customerHistory(customerId: ID, sources: HistorySources): HistoryEntry[] {
  const { requests, offers, bookings, invoices, services, locale } = sources;
  const mine = requests.filter((r) => r.customerId === customerId);

  const entries: HistoryEntry[] = [
    ...mine.map((r) => ({
      id: r.id,
      kind: 'request' as const,
      at: r.createdAt,
      reference: r.reference,
      detail: serviceName(r.serviceSlug, services, locale),
      badge: { entity: 'request' as StatusEntity, state: r.status },
      href: `/admin/anfragen/${r.id}`,
    })),

    ...offers
      .filter((o) => mine.some((r) => r.id === o.requestId))
      .map((o) => {
        const request = mine.find((r) => r.id === o.requestId);
        return {
          id: o.id,
          kind: 'offer' as const,
          at: o.issuedAt ?? request?.createdAt ?? '',
          reference: o.reference,
          detail: request ? serviceName(request.serviceSlug, services, locale) : '—',
          badge: {
            entity: 'request' as StatusEntity,
            state: o.status === 'sent' ? 'offerSent' : o.status,
          },
          href: `/admin/offerten/${o.id}`,
        };
      }),

    ...bookings
      .filter((b) => b.customerId === customerId)
      .map((b) => ({
        id: b.id,
        kind: 'booking' as const,
        at: b.start,
        reference: b.reference,
        detail: serviceName(b.serviceSlug, services, locale),
        badge: { entity: 'booking' as StatusEntity, state: b.status },
        href: `/admin/buchungen/${b.id}`,
      })),

    ...invoices
      .filter((i) => i.customerId === customerId)
      .map((i) => ({
        id: i.id,
        kind: 'invoice' as const,
        at: i.issuedAt,
        reference: i.reference,
        detail: invoiceSubject(i, sources),
        badge: { entity: 'invoice' as StatusEntity, state: i.status },
        href: `/admin/rechnungen/${i.id}`,
        amount: invoiceTotal(i),
      })),
  ];

  return entries.sort((a, b) => b.at.localeCompare(a.at));
}
