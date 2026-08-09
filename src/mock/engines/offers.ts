import type {
  AddOn,
  ID,
  Offer,
  OfferLine,
  Property,
  Service,
  ServiceRequest,
  Settings,
} from '../schema';
import { priceEstimate } from './pricing';

/**
 * Turns a request into a draft set of quote lines.
 *
 * §9.1: the quote screen opens with lines already filled in — base service at
 * the estimated duration, the chosen add-ons, travel if any — and the owner
 * edits rather than types. This is that pre-fill, and wave 4's quote builder
 * calls the same function, so what the customer sees and what the owner starts
 * from can never drift apart.
 */
export function buildOfferLines({
  request,
  property,
  service,
  addOns,
  settings,
}: {
  request: ServiceRequest;
  property: Property;
  service: Service;
  addOns: AddOn[];
  settings: Settings;
}): { lines: OfferLine[]; estimatedHours: number } {
  const chosen = addOns.filter((a) => request.addOnIds.includes(a.id));

  const estimate = priceEstimate(
    {
      service,
      addOns: chosen,
      area: property.area,
      bathrooms: property.bathrooms,
      hasPets: property.hasPets,
      needsExtraEffort: property.needsExtraEffort,
      windowCount: request.windowCount,
      furniturePieces: request.furniturePieces,
    },
    settings,
  );

  const lines: OfferLine[] = estimate.lines
    .filter((line) => line.kind !== 'discount')
    .map((line, i) => ({
      id: `oli_${request.id}_${i}`,
      label: line.label,
      calc: line.calc,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      // Billed hours for the service line; scheduling-only hours for add-ons,
      // whose flat price already covers the time they take.
      hours:
        line.kind === 'service'
          ? line.quantity
          : line.kind === 'addon'
            ? (chosen.find((a) => a.slug === line.label)?.extraDuration ?? 0)
            : 0,
      // §9.1 — the owner can mark lines optional and the customer switches
      // them on or off. Add-ons the customer already asked for start selected.
      optional: line.kind === 'addon',
      selected: true,
    }));

  return { lines, estimatedHours: estimate.scheduledHours };
}

/** Only the lines that are actually in play — optional ones the customer switched off do not count. */
export function activeLines(offer: Offer) {
  return offer.lines.filter((line) => !line.optional || line.selected);
}

export function offerSubtotal(offer: Offer) {
  return round(activeLines(offer).reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
}

export function offerDiscount(offer: Offer) {
  const subtotal = offerSubtotal(offer);
  if (!offer.discountValue) return 0;
  return offer.discountKind === 'percent'
    ? round((subtotal * offer.discountValue) / 100)
    : offer.discountValue;
}

export function offerTotal(offer: Offer) {
  return round(offerSubtotal(offer) - offerDiscount(offer));
}

/**
 * Hours the scheduler has to fit. Recomputed from the live lines, so switching
 * an optional line off genuinely shortens the visit rather than just lowering
 * the price — otherwise the slot picker would book time nobody is paying for.
 */
export function offerHours(offer: Offer) {
  return activeLines(offer).reduce((sum, line) => sum + line.hours, 0);
}

export function isExpired(offer: Offer, now: Date) {
  return Boolean(offer.expiresAt && new Date(offer.expiresAt) <= now);
}

export function daysLeft(offer: Offer, now: Date) {
  if (!offer.expiresAt) return null;
  const ms = new Date(offer.expiresAt).getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** Swiss QR-bill reference — 27 digits, grouped the way the bill prints them. */
export function qrReference(seed: ID) {
  const digits = Array.from(seed)
    .map((c) => c.charCodeAt(0) % 10)
    .join('')
    .padEnd(27, '0')
    .slice(0, 27);
  return digits.replace(/(\d{2})(\d{5})(\d{5})(\d{5})(\d{5})(\d{5})/, '$1 $2 $3 $4 $5 $6');
}

function round(value: number) {
  return Math.round(value * 20) / 20;
}
