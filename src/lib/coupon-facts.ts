/**
 * What a coupon is *doing today*, which is nowhere on the record.
 *
 * A `Coupon` stores a window, a cap and a switch. Every screen that shows one
 * asks the same question instead — may somebody type this code right now — and
 * that answer is four fields combined, not one field read. The list screen had
 * the combination written inline and the edit screen had none at all, so a
 * coupon could be opened, changed and saved with nothing on the page saying it
 * had run out three weeks ago.
 *
 * Derived rather than stored, for the reason `plan-facts` gives: a stored flag
 * would be wrong every morning until someone opened the page, and this
 * prototype has no nightly job to keep it true.
 */

import type { Coupon } from '@/mock/schema';

export type CouponState = 'inactive' | 'expired' | 'used-up' | 'scheduled' | 'active';

/**
 * The order is the point.
 *
 * A switched-off coupon is off whatever its dates say, so `inactive` is asked
 * first — otherwise a coupon the office deliberately pulled would still read
 * «Gültig» until its window happened to close. Then time, then the cap: a code
 * that hit its limit *and* expired is expired, because the date is the thing
 * the office cannot argue with.
 *
 * `scheduled` was missing entirely, and it was the one wrong answer of the
 * five: a code written today for a campaign starting in three weeks showed as
 * valid, on the screen whose whole job is to say whether it is.
 */
export function couponState(coupon: Coupon, now: Date): CouponState {
  if (!coupon.active) return 'inactive';
  if (new Date(coupon.validTo) < now) return 'expired';
  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) return 'used-up';
  if (new Date(coupon.validFrom) > now) return 'scheduled';
  return 'active';
}

/** Redemptions still available, or `undefined` when the coupon is uncapped. */
export function couponRemaining(coupon: Coupon) {
  if (coupon.maxUses === undefined) return undefined;
  return Math.max(0, coupon.maxUses - coupon.usedCount);
}

/**
 * What this code actually takes off a given subtotal.
 *
 * Written once, here, because three places need the same answer and two of
 * them did not exist before: the pricing engine applies it, the coupon form
 * shows the worked example under the ceiling, and the list prints the cap
 * beside the percentage. A percentage on its own is not the discount — the
 * floor and the ceiling are both part of it, and a rule copied into three
 * components is a rule with three chances to be typed differently.
 *
 * Below `minOrder` the answer is zero rather than a smaller discount: the
 * floor is a threshold, not a taper.
 */
export function couponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.minOrder !== undefined && subtotal < coupon.minOrder) return 0;
  if (coupon.kind === 'amount') return Math.min(coupon.value, subtotal);

  const raw = (subtotal * coupon.value) / 100;
  const capped = coupon.maxDiscount !== undefined ? Math.min(raw, coupon.maxDiscount) : raw;
  return Math.min(capped, subtotal);
}

/**
 * The order value at which the ceiling starts biting.
 *
 * The number the office is really asking for when it types a cap: «ab wann
 * greift das?». CHF 80 on 10% means every job over CHF 800 pays the same
 * discount — which is either the point or a surprise, and the form should not
 * make the reader do the division to find out which.
 *
 * `undefined` when there is no cap, or when the percentage is zero and the
 * ceiling can therefore never be reached at any price.
 */
export function couponCapThreshold(coupon: Coupon): number | undefined {
  if (coupon.kind !== 'percent' || coupon.maxDiscount === undefined) return undefined;
  if (coupon.value <= 0) return undefined;
  return (coupon.maxDiscount * 100) / coupon.value;
}

/**
 * The services a coupon applies to, by name.
 *
 * An empty `services` array means all of them — a convention the edit screen
 * spells out under the checkboxes and the list never said at all, so a coupon
 * good on everything and a coupon nobody had finished writing looked the same.
 */
export function couponServiceNames(
  coupon: Coupon,
  services: { slug: string; name: Record<string, string> }[],
  locale: string,
): string[] {
  return coupon.services
    .map((slug) => services.find((s) => s.slug === slug)?.name[locale] ?? slug)
    .filter(Boolean);
}
