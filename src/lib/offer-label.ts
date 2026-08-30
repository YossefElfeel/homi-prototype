import type { Locale } from '@/i18n/routing';
import type { AddOn, Offer, OfferLine, Service } from '@/mock/schema';
import { isExpired } from '@/mock/engines/offers';

/**
 * What a quote line is called on screen.
 *
 * Three sources, in order: an override the owner typed for this quote, the
 * catalogue name in the reader's language, or the raw label for a line that
 * was free text to begin with.
 *
 * One helper because four screens render these — the builder, the send
 * preview, the admin quote detail and the customer's own quote — and they must
 * agree. A line the owner renamed has to keep that name when the customer
 * opens it, or the quote they discussed on the phone is not the quote on
 * screen.
 */
export function offerLineLabel(
  line: OfferLine,
  services: Service[],
  addOns: AddOn[],
  locale: Locale,
): string {
  if (line.displayLabel?.trim()) return line.displayLabel;

  const service = services.find((s) => s.slug === line.label);
  if (service) return service.name[locale];

  const addOn = addOns.find((a) => a.slug === line.label);
  if (addOn) return addOn.name[locale];

  return line.label;
}

/**
 * Which `request` state a quote is badged as.
 *
 * `Offer.status` and `ServiceRequest['status']` overlap on every value but
 * one: a quote that has gone out is `sent`, and the request vocabulary calls
 * that `offerSent`. `status-registry` has no `request.sent`, so a badge handed
 * the raw offer status printed the literal string «status.request.sent» in the
 * status pill — which is exactly what the customer's own quote list did.
 *
 * Two screens already translated it inline before badging and a third did not,
 * which is the drift. `offer-shell` and the admin quote list still carry their
 * own copies; they are correct, and folding them into this one is a change to
 * screens outside the account area.
 *
 * `now` decides expiry rather than the stored status: §9.3 makes the date, not
 * a person, the thing that ends a quote.
 */
export function offerBadgeState(offer: Offer, now: Date): string {
  if (offer.status === 'sent') {
    return isExpired(offer, now) ? 'expired' : 'offerSent';
  }
  return offer.status;
}
