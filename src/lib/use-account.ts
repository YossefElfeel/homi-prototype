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
  const requests = data.requests.filter((r) => r.customerId === customerId);
  const requestIds = new Set(requests.map((r) => r.id));

  return {
    customerId,
    customer: data.customers.find((c) => c.id === customerId),
    properties,
    requests,
    offers: data.offers.filter((o) => requestIds.has(o.requestId)),
    bookings: data.bookings.filter((b) => b.customerId === customerId),
    invoices: data.invoices.filter((i) => i.customerId === customerId),
    subscriptions: data.subscriptions.filter((s) => s.customerId === customerId),
    credits: data.credits.filter((c) => c.customerId === customerId),
    messages: data.messages.filter((m) => m.customerId === customerId),
    reviews: data.reviews.filter((r) => r.customerId === customerId),
    // §20.6 — a customer sees photos of their own property, whether or not
    // they have been cleared for the public gallery.
    photos: data.photos.filter((p) => p.propertyId && propertyIds.has(p.propertyId)),
  };
}
