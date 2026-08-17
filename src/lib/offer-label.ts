import type { Locale } from '@/i18n/routing';
import type { AddOn, OfferLine, Service } from '@/mock/schema';

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
