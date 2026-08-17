'use client';

import { useStore } from '@/mock/store';

/**
 * Everything the signed-in customer owns, filtered once.
 *
 * Every account screen needs the same slice, and writing the filter per screen
 * is how one of them eventually forgets it and shows another customer's
 * invoice. The demo bar's "current customer" is the only input.
 */
export function useAccount() {
  const customerId = useStore((s) => s.demo.currentCustomerId);
  const data = useStore((s) => s.data);

  const properties = data.properties.filter((p) => p.customerId === customerId);
  const propertyIds = new Set(properties.map((p) => p.id));
  /*
   * Drafts are the office's, not the customer's.
   *
   * A draft is a half-taken phone call — the address heard wrong, the service
   * not settled, the note still saying "sounded eilig". It carries the
   * customer's id from the moment it is saved, so without this filter it would
   * surface in their own account as a request they never made, and screen 37
   * would promise them a quote within 24 hours for it.
   */
  const requests = data.requests.filter(
    (r) => r.customerId === customerId && r.status !== 'draft',
  );
  const requestIds = new Set(requests.map((r) => r.id));
  const bookings = data.bookings.filter((b) => b.customerId === customerId);
  const bookingIds = new Set(bookings.map((b) => b.id));
  const offers = data.offers.filter((o) => requestIds.has(o.requestId));
  const offerIds = new Set(offers.map((o) => o.id));
  const invoices = data.invoices.filter((i) => i.customerId === customerId);
  const invoiceIds = new Set(invoices.map((i) => i.id));

  return {
    customerId,
    customer: data.customers.find((c) => c.id === customerId),
    properties,
    requests,
    offers,
    bookings,
    invoices,
    /* A payment hangs off either the quote it settled or the invoice it paid,
       never off the customer directly — so it is reached through the two
       records that are already filtered above rather than by a third rule
       that could disagree with them. */
    payments: data.payments.filter(
      (p) =>
        (p.offerId && offerIds.has(p.offerId)) ||
        (p.invoiceId && invoiceIds.has(p.invoiceId)),
    ),
    subscriptions: data.subscriptions.filter((s) => s.customerId === customerId),
    credits: data.credits.filter((c) => c.customerId === customerId),
    messages: data.messages.filter((m) => m.customerId === customerId),
    reviews: data.reviews.filter((r) => r.customerId === customerId),
    /*
     * §20.6 — a customer sees photos of their own property, whether or not
     * they have been cleared for the public gallery.
     *
     * This used to test `p.propertyId` alone, and **no Photo anywhere in the
     * codebase carried one**: the seeds attach `requestId` or `bookingId`,
     * `submitDraft` attaches `requestId`, and the field app attached nothing
     * at all. So screen 47 rendered its empty state in every scenario —
     * including `busy`, which exists specifically to populate it.
     *
     * A photo belongs to this customer if it hangs off any of the three
     * things that are already theirs.
     */
    photos: data.photos.filter(
      (p) =>
        (p.propertyId && propertyIds.has(p.propertyId)) ||
        (p.bookingId && bookingIds.has(p.bookingId)) ||
        (p.requestId && requestIds.has(p.requestId)),
    ),
  };
}
