import type { Locale } from '@/i18n/routing';
import type { DataSet } from '@/mock/scenarios';
import type { AddOn, Service } from '@/mock/schema';
import { isOffered, slugify } from './service-catalogue';

/**
 * What an add-on *is*, in one place — the companion to `service-catalogue`.
 *
 * A service is a thing you book. An add-on is a line you attach to one: a
 * fixed price on top of the job, plus the minutes it adds to the visit. Every
 * screen that touched one had to re-derive that from the fields, and each got
 * a different part of it right. The request flow filtered on `active` *and*
 * membership; the marketing page filtered on membership alone, so an add-on
 * the owner switched off was still advertised at its price; the admin list
 * asked neither question and simply listed all seven.
 *
 * None of that is catchable by types. `active` is a boolean everywhere, and a
 * withdrawn add-on rendered on a public page is a correct render of a wrong
 * idea.
 */

export { slugify };

/** Whether a customer can pick it today. */
export function isAddOnOffered(addOn: AddOn) {
  return addOn.active;
}

/** The add-ons offered under one service, in the order they were written. */
export function addOnsForService(addOns: AddOn[], serviceSlug: string) {
  return addOns.filter((a) => isAddOnOffered(a) && a.services.includes(serviceSlug));
}

/**
 * `slug`, `slug-2`, `slug-3` — never a collision with an existing add-on.
 *
 * Separate from `uniqueSlug` in `service-catalogue` rather than generic over
 * both: the two namespaces are independent — an add-on called `fenster` and a
 * service called `fensterreinigung` are different records — and a quote line
 * resolves its label against *both* lists, so a shared slug would make
 * `offerLineLabel` pick whichever it looked up first.
 */
export function uniqueAddOnSlug(base: string, addOns: AddOn[], ignoreId?: string) {
  const taken = new Set(addOns.filter((a) => a.id !== ignoreId).map((a) => a.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/**
 * Which services an add-on actually reaches, and whether anybody can pick it.
 *
 * `active` alone does not answer that. An add-on switched on but attached to
 * no service — or attached only to services that are drafts or withdrawn —
 * appears on no screen a customer ever sees, and nothing about the record says
 * so. It was possible to sit on the admin list showing a green state and be
 * unreachable, which is exactly the class of lie /flows exists to catch.
 */
export function addOnReach(addOn: AddOn, services: Service[]) {
  const attached = addOn.services
    .map((slug) => services.find((s) => s.slug === slug))
    .filter((s): s is Service => Boolean(s));
  const live = attached.filter(isOffered);
  return {
    attached,
    live,
    /** Switched on *and* attached to something a customer can book. */
    reachable: isAddOnOffered(addOn) && live.length > 0,
  };
}

/** The services it is attached to, named in the reader's language. */
export function addOnServiceNames(addOn: AddOn, services: Service[], locale: Locale) {
  return addOn.services.map(
    (slug) => services.find((s) => s.slug === slug)?.name[locale] ?? slug,
  );
}

export interface AddOnUsage {
  requests: number;
  /** Quote lines that name this add-on's slug — and therefore invoices too. */
  offers: number;
  total: number;
}

/**
 * What would break if this add-on were deleted.
 *
 * Two different links, and the second is the one that is easy to miss. A
 * request holds `addOnIds`, so deleting the record leaves an id pointing at
 * nothing. A quote line holds the *slug* in `OfferLine.label` — that is the
 * line's identity, and `offerLineLabel` resolves it back to a name every time
 * the quote, the send preview or the invoice built from it is rendered. Delete
 * the add-on and a settled invoice starts reading «backofen» to the customer
 * it was sent to.
 *
 * A `Booking` is deliberately not counted: it carries no `addOnIds` of its own
 * and reaches them through the quote it came from, so counting it would count
 * the same link twice.
 *
 * So deletion is refused rather than cascaded, on the same reasoning as
 * `serviceUsage`: cascading here would edit documents that have been sent.
 */
export function addOnUsage(addOn: AddOn, data: DataSet): AddOnUsage {
  const requests = data.requests.filter((r) => r.addOnIds.includes(addOn.id)).length;
  const offers = data.offers.filter((o) =>
    o.lines.some((line) => line.label === addOn.slug),
  ).length;
  return { requests, offers, total: requests + offers };
}
