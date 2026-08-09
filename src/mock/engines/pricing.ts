/**
 * Pricing engine — spec §5, implemented in full.
 *
 * The hour is the only unit of account (§21 item 1). Area, rooms, bathrooms,
 * pets and condition are inputs to a *duration estimate*; that estimate times
 * the hourly rate is the price. This is what makes package credits, plan
 * discounts and part-refunds computable at all.
 *
 * Everything here is pure. The booking flow calls it on every keystroke to
 * show a live range, and the quote builder calls it once to pre-fill lines.
 */

import type {
  AddOn,
  DurationProfile,
  PlanTier,
  Service,
  Settings,
  ServiceSlug,
} from '../schema';

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
  plan?: PlanTier;
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
  hours: number;
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

  for (const addOn of addOns) {
    if (addOn.extraDuration > 0) {
      rows.push({ key: `addon:${addOn.slug}`, hours: addOn.extraDuration });
    }
  }

  const raw = rows.reduce((sum, r) => sum + r.hours, 0);
  // Round to the nearest half hour — the unit the owner actually schedules in.
  const rounded = Math.round(raw * 2) / 2;
  const floored = Math.max(rounded, service.minDuration, settings.minimumHours);

  return {
    hours: floored,
    rows,
    minimumApplied: floored > rounded,
  };
}

/* --------------------------------------------------------------- surcharges */

export function isSaturday(date: Date) {
  return date.getDay() === 6;
}

export function isEvening(date: Date, settings: Settings) {
  const [h = 17, m = 0] = settings.eveningSurchargeFrom.split(':').map(Number);
  return date.getHours() > h || (date.getHours() === h && date.getMinutes() >= m);
}

/* ------------------------------------------------------------------ price */

export function priceEstimate(input: EstimateInput, settings: Settings): Estimate {
  const { service, addOns } = input;
  const rate = service.calc === 'perUnit' ? settings.hourlyRate : service.basePrice;
  const duration = estimateHours(input, settings);
  const lines: PriceLine[] = [];
  const notes: string[] = [];

  // Base service, always expressed in hours × rate.
  lines.push({
    key: `service:${service.slug}`,
    label: service.slug,
    calc: 'hourly',
    quantity: duration.hours,
    unitPrice: rate,
    total: round(duration.hours * rate),
    kind: 'service',
  });

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
  const planPercent = input.plan ? settings.planDiscounts[input.plan] : 0;
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
