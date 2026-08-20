'use client';

import { useMemo } from 'react';
import { useStore } from '@/mock/store';
import { priceEstimate, type Estimate } from '@/mock/engines/pricing';
import type {
  AddOn,
  ID,
  Plan,
  Property,
  Service,
  ServiceSlug,
  Settings,
} from '@/mock/schema';

/**
 * Everything the pricing engine needs that a *form* can supply — the subset of
 * RequestDraft that moves the number.
 *
 * Extracted so the admin intake screen can price a phoned-in request with the
 * same engine, without writing into `store.draft`. Sharing the draft would have
 * been half a line of code and a real bug: the owner taking a call would
 * silently overwrite whatever a visitor had half-finished in the same browser.
 */
export interface EstimateSource {
  serviceSlug: ServiceSlug | null;
  /** Set when an existing property is chosen; its figures win over the typed ones. */
  propertyId: ID | null;
  property: {
    area: number | null;
    bathrooms: number | null;
    hasPets: boolean;
    needsExtraEffort: boolean;
  };
  addOnIds: ID[];
  windowCount: number | null;
  furniturePieces: number | null;
  /** The plan the customer picked, by id. */
  planIntent?: ID | null;
}

export interface EstimateContext {
  services: Service[];
  addOns: AddOn[];
  settings: Settings;
  properties: Property[];
  plans: Plan[];
}

/**
 * Returns null until there is enough to compute honestly. Showing a number
 * built on nothing would be worse than showing none.
 */
export function computeEstimate(
  source: EstimateSource,
  { services, addOns, settings, properties, plans }: EstimateContext,
): Estimate | null {
  const service = services.find((s) => s.slug === source.serviceSlug);
  if (!service) return null;

  const saved = source.propertyId
    ? properties.find((p) => p.id === source.propertyId)
    : undefined;

  const area = saved?.area ?? source.property.area;
  const bathrooms = saved?.bathrooms ?? source.property.bathrooms;
  const hasPets = saved?.hasPets ?? source.property.hasPets;
  const needsExtraEffort = saved?.needsExtraEffort ?? source.property.needsExtraEffort;

  const perUnitReady =
    service.calc === 'perUnit'
      ? Boolean(source.windowCount)
      : service.slug === 'moebelmontage'
        ? Boolean(source.furniturePieces)
        : false;

  // Area-driven services need an area; counted services need a count.
  if (service.durationProfile !== 'none' && !area) return null;
  if (service.durationProfile === 'none' && !perUnitReady) return null;

  return priceEstimate(
    {
      service,
      addOns: addOns.filter((a) => source.addOnIds.includes(a.id)),
      area: area ?? 0,
      bathrooms: bathrooms ?? 1,
      hasPets: hasPets ?? false,
      needsExtraEffort: needsExtraEffort ?? false,
      windowCount: source.windowCount ?? undefined,
      furniturePieces: source.furniturePieces ?? undefined,
      /* The estimate a visitor sees while picking a plan is the *quoted*
         price with the plan's discount on it, which is what they are comparing.
         The first visit under a plan is not quoted at all — it comes out of the
         package — so this number is what any work beyond the package costs. */
      planDiscountPercent: plans.find((x) => x.id === source.planIntent)?.extraDiscountPercent,
    },
    settings,
  );
}

/**
 * The live price range, recomputed from the draft on every answer.
 *
 * The specification's opening problem is that "العميل عايز يعرف السعر ومش لاقي"
 * — the customer wants a price and cannot find one. The pricing engine can
 * genuinely answer that from what has been entered so far, so it does, with
 * the estimate marked as an estimate throughout.
 */
export function useEstimate(): Estimate | null {
  const draft = useStore((s) => s.draft);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);
  const settings = useStore((s) => s.settings);
  const properties = useStore((s) => s.data.properties);
  const plans = useStore((s) => s.plans);

  return useMemo(
    () => computeEstimate(draft, { services, addOns, settings, properties, plans }),
    [draft, services, addOns, settings, properties, plans],
  );
}
