'use client';

import { useStore } from '@/mock/store';

/**
 * Everything a quote screen needs, resolved in one place: the offer plus the
 * request, property, customer and service it hangs off. Returns null while the
 * store is still hydrating or when the id does not exist.
 */
export function useOffer(id: string) {
  const offers = useStore((s) => s.data.offers);
  const requests = useStore((s) => s.data.requests);
  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const bookings = useStore((s) => s.data.bookings);
  const services = useStore((s) => s.services);
  const holds = useStore((s) => s.holds);

  const offer = offers.find((o) => o.id === id);
  if (!offer) return null;

  const request = requests.find((r) => r.id === offer.requestId);
  if (!request) return null;

  const property = properties.find((p) => p.id === request.propertyId);
  const customer = customers.find((c) => c.id === request.customerId);
  const service = services.find((s) => s.slug === request.serviceSlug);
  const hold = holds.find((h) => h.offerId === offer.id) ?? null;
  const booking = bookings.find((b) => b.offerId === offer.id) ?? null;

  if (!property || !customer || !service) return null;
  return { offer, request, property, customer, service, hold, booking };
}
