/**
 * Pricing engine — spec §5, implemented in full.
 *
 * The hour is the only unit of account (§21 item 1). Area, rooms, bathrooms,
 * pets and condition are inputs to a *duration estimate*; that estimate times
 * the hourly rate is the price. This is what makes a plan's per-visit price,
 * discounts and part-refunds computable at all.
 *
 * Everything here is pure. The booking flow calls it on every keystroke to
 * show a live range, and the quote builder calls it once to pre-fill lines.
 */

import type {
  AddOn,
  DurationProfile,
  Service,
  Settings,
  ServiceSlug,
} from '../schema';
import { businessWeekday, zonedParts } from '@/lib/business-time';

/* --------------------------------------------------- §5.2 duration matrix */

type AreaTier = 'xs' | 's' | 'm' | 'l';

const AREA_TIERS: { tier: AreaTier; maxArea: number; label: string }[] = [
  { tier: 'xs', maxArea: 60, label: '< 60 m²' },
  { tier: 's', maxArea: 100, label: '60–100 m²' },
  { tier: 'm', maxArea: 150, label: '100–150 m²' },
  { tier: 'l', maxArea: Infinity, label: '> 150 m²' },
];

/** Hours, straight from the table in §5.2. */
const DURATION_MATRIX: Record<Exclude<DurationProfile, 'none'>, Record<AreaTier, number>> = {
  standard: { xs: 2, s: 3, m: 4, l: 5 },
  deep: { xs: 3, s: 4.5, m: 6, l: 7.5 },
  moveout: { xs: 3, s: 4.5, m: 6, l: 7.5 },
  office: { xs: 2, s: 3, m: 4, l: 5 },
};

export function areaTier(area: number): AreaTier {
  return AREA_TIERS.find((t) => area < t.maxArea)?.tier ?? 'l';
}

/** The tiers, for the pricing page's "how we estimate the hours" table. */
export const DURATION_TIERS = AREA_TIERS.map((t) => ({
  label: t.label,
  standard: DURATION_MATRIX.standard[t.tier],
  deep: DURATION_MATRIX.deep[t.tier],
  moveout: DURATION_MATRIX.moveout[t.tier],
  office: DURATION_MATRIX.office[t.tier],
}));

/** Smallest-to-largest hours for a profile — the "typical duration" on a service page. */
export function durationRange(profile: DurationProfile): [number, number] | null {
  if (profile === 'none') return null;
  const row = DURATION_MATRIX[profile];
  return [row.xs, row.l];
}

export function areaTierLabel(area: number): string {
  return AREA_TIERS.find((t) => area < t.maxArea)?.label ?? '> 150 m²';
}

/* ----------------------------------------------------------------- inputs */

export interface EstimateInput {
  service: Service;
  addOns: AddOn[];
  area: number;
  bathrooms: number;
  hasPets: boolean;
  needsExtraEffort: boolean;
  /** Per-unit services. */
  windowCount?: number;
  furniturePieces?: number;
  /** Scheduling context — only known once a slot is chosen. */
  start?: Date;
  travelKm?: number;
  /** Applied discounts. */
  /**
   * The discount the customer's plan earns on work *outside* the package, as a
   * percentage. It arrives as a number rather than a plan id because pricing
   * has no business resolving plans: which plan applies, and whether this job
   * is inside the package or beyond it, is decided by `requestCoverage` — and a
   * job inside the package is not quoted at all.
   */
  planDiscountPercent?: number;
  couponPercent?: number;
  couponAmount?: number;
}

export interface DurationBreakdownRow {
  key: string;
  hours: number;
}

export interface PriceLine {
  key: string;
  label: string;
  calc: 'hourly' | 'perUnit' | 'flat';
  quantity: number;
  unitPrice: number;
  total: number;
  /** Surcharges and travel show as their own line, never folded into a total. */
  kind: 'service' | 'addon' | 'surcharge' | 'travel' | 'discount';
}

export interface Estimate {
  /** Hours actually billed at the hourly rate — the base service only. */
  hours: number;
  /**
   * Hours the scheduler must reserve: billed hours plus the time add-ons take.
   *
   * These two are deliberately different. §3 gives an add-on both a price and
   * an extra duration; the price is what the customer pays and the duration is
   * what the calendar has to hold. Billing the duration *as well* would charge
   * for the same add-on twice — CHF 45 for the windows plus CHF 24.50 for the
   * half hour they take.
   */
  scheduledHours: number;
  durationBreakdown: DurationBreakdownRow[];
  lines: PriceLine[];
  subtotal: number;
  discount: number;
  total: number;
  /** The range shown live during the booking flow. */
  rangeLow: number;
  rangeHigh: number;
  minimumApplied: boolean;
  notes: string[];
}

/* -------------------------------------------------------------- duration */

export function estimateHours(input: EstimateInput, settings: Settings) {
  const { service, addOns, area, bathrooms, hasPets, needsExtraEffort } = input;
  const rows: DurationBreakdownRow[] = [];

  if (service.durationProfile !== 'none') {
    const base = DURATION_MATRIX[service.durationProfile][areaTier(area)];
    rows.push({ key: 'base', hours: base });

    // §5.2 — half an hour for every bathroom past the first.
    const extraBaths = Math.max(0, bathrooms - 1);
    if (extraBaths > 0) rows.push({ key: 'bathrooms', hours: extraBaths * 0.5 });

    if (hasPets) rows.push({ key: 'pets', hours: 0.5 });
    if (needsExtraEffort) rows.push({ key: 'effort', hours: 1 });
  }

  // §5.1 — windows are counted, not measured: half an hour per five.
  if (service.calc === 'perUnit' && input.windowCount) {
    rows.push({ key: 'windows', hours: Math.ceil(input.windowCount / 5) * 0.5 });
  }

  if (service.slug === 'moebelmontage' && input.furniturePieces) {
    rows.push({ key: 'pieces', hours: input.furniturePieces * 0.75 });
  }

  const raw = rows.reduce((sum, r) => sum + r.hours, 0);
  // Round to the nearest half hour — the unit the owner actually schedules in.
  const rounded = Math.round(raw * 2) / 2;
  const billable = Math.max(rounded, service.minDuration, settings.minimumHours);

  // Add-on time extends the visit but is not billed by the hour — the add-on's
  // own price already covers it. Kept in the breakdown so the owner can see
  // where the calendar time goes.
  const addOnHours = addOns.reduce((sum, addOn) => sum + addOn.extraDuration, 0);
  for (const addOn of addOns) {
    if (addOn.extraDuration > 0) {
      rows.push({ key: `addon:${addOn.slug}`, hours: addOn.extraDuration });
    }
  }

  return {
    hours: billable,
    scheduledHours: billable + addOnHours,
    rows,
    minimumApplied: billable > rounded,
  };
}

/* --------------------------------------------------------------- surcharges */

/*
 * Both read the Zurich clock, not the runtime's.
 *
 * A surcharge decided by the customer's own timezone is a price that changes
 * with where the browser is: a 17:30 job billed as evening work in Zurich came
 * out as 16:30 daytime for anyone an hour ahead, and a Saturday job could be
 * priced as a Friday one. §5.1 sets these against the working week, and the
 * working week belongs to the business.
 */
export function isSaturday(date: Date) {
  return businessWeekday(date) === 6;
}

export function isEvening(date: Date, settings: Settings) {
  const [h = 17, m = 0] = settings.eveningSurchargeFrom.split(':').map(Number);
  const { hour, minute } = zonedParts(date);
  return hour > h || (hour === h && minute >= m);
}

/* ------------------------------------------------------------------ price */

export function priceEstimate(input: EstimateInput, settings: Settings): Estimate {
  const { service, addOns } = input;
  const rate = service.calc === 'perUnit' ? settings.hourlyRate : service.basePrice;
  const duration = estimateHours(input, settings);
  const lines: PriceLine[] = [];
  const notes: string[] = [];

  /*
   * Base service. Hours × rate for the two cleaning models; one line at one
   * price for a flat one.
   *
   * `flat` used to fall through to the hourly branch, because no service could
   * be flat and the case was unreachable. The catalogue can set it now, and
   * the fall-through was not a rounding difference: `basePrice` would have
   * been read as an hourly rate, so a CHF 180 flat job priced at three hours
   * came out at CHF 540. The duration is still estimated either way — the
   * calendar has to hold the visit even when the money does not depend on it.
   */
  lines.push(
    service.calc === 'flat'
      ? {
          key: `service:${service.slug}`,
          label: service.slug,
          calc: 'flat',
          quantity: 1,
          unitPrice: service.basePrice,
          total: round(service.basePrice),
          kind: 'service',
        }
      : {
          key: `service:${service.slug}`,
          label: service.slug,
          calc: 'hourly',
          quantity: duration.hours,
          unitPrice: rate,
          total: round(duration.hours * rate),
          kind: 'service',
        },
  );

  // Add-ons carry their own fixed price on top of the time they add.
  for (const addOn of addOns) {
    if (addOn.price > 0) {
      lines.push({
        key: `addon:${addOn.slug}`,
        label: addOn.slug,
        calc: 'flat',
        quantity: 1,
        unitPrice: addOn.price,
        total: addOn.price,
        kind: 'addon',
      });
    }
  }

  const serviceSubtotal = lines.reduce((s, l) => s + l.total, 0);

  // §5.1 — surcharges are their own visible line. Never folded into the total,
  // never a surprise: "لو في رسوم انتقال أو رسوم سبت، تظهر كسطر واضح".
  if (input.start) {
    if (isSaturday(input.start) && settings.saturdaySurchargePercent > 0) {
      const amount = round((serviceSubtotal * settings.saturdaySurchargePercent) / 100);
      lines.push({
        key: 'surcharge:saturday',
        label: 'saturday',
        calc: 'flat',
        quantity: 1,
        unitPrice: amount,
        total: amount,
        kind: 'surcharge',
      });
    } else if (isEvening(input.start, settings) && settings.eveningSurchargePercent > 0) {
      const amount = round((serviceSubtotal * settings.eveningSurchargePercent) / 100);
      lines.push({
        key: 'surcharge:evening',
        label: 'evening',
        calc: 'flat',
        quantity: 1,
        unitPrice: amount,
        total: amount,
        kind: 'surcharge',
      });
    }
  }

  // §5.1 — free inside the radius; beyond it the job goes to manual review and
  // the owner adds the fee to the quote by hand.
  if (input.travelKm !== undefined && input.travelKm > settings.freeTravelKm) {
    notes.push('travel-review');
  }

  const subtotal = round(lines.reduce((s, l) => s + l.total, 0));

  // §20.2 — a plan discount and a coupon never stack; the larger one wins.
  const planPercent = input.planDiscountPercent ?? 0;
  const planDiscount = round((subtotal * planPercent) / 100);
  const couponDiscount = input.couponPercent
    ? round((subtotal * input.couponPercent) / 100)
    : (input.couponAmount ?? 0);
  const discount = Math.max(planDiscount, couponDiscount);

  if (discount > 0) {
    lines.push({
      key: planDiscount >= couponDiscount ? 'discount:plan' : 'discount:coupon',
      label: planDiscount >= couponDiscount ? 'plan' : 'coupon',
      calc: 'flat',
      quantity: 1,
      unitPrice: -discount,
      total: -discount,
      kind: 'discount',
    });
    if (planDiscount > 0 && couponDiscount > 0) notes.push('discount-not-stacked');
  }

  const total = round(subtotal - discount);

  return {
    hours: duration.hours,
    scheduledHours: duration.scheduledHours,
    durationBreakdown: duration.rows,
    lines,
    subtotal,
    discount,
    total,
    // The live range in the booking flow. Narrow enough to be useful, honest
    // enough that the quote rarely lands outside it.
    rangeLow: round(total * 0.92),
    rangeHigh: round(total * 1.18),
    minimumApplied: duration.minimumApplied,
    notes,
  };
}

/** §7.1 — one hour for jobs up to three, two hours beyond. */
export function arrivalWindowMinutes(hours: number) {
  return hours <= 3 ? 60 : 120;
}

/** §11.3 — a differently-priced visit converts to hours at the current rate. */
export function valueToHours(amount: number, settings: Settings) {
  return Math.round((amount / settings.hourlyRate) * 100) / 100;
}

function round(value: number) {
  // Swiss five-rappen rounding.
  return Math.round(value * 20) / 20;
}

export const PRICING_SERVICE_ORDER: ServiceSlug[] = [
  'unterhaltsreinigung',
  'einmalreinigung',
  'grundreinigung',
  'umzugsreinigung',
  'fensterreinigung',
  'bueroreinigung',
  'moebelmontage',
];
