'use client';

import { useMemo } from 'react';
import { useStore } from '@/mock/store';
import { priceEstimate, type Estimate } from '@/mock/engines/pricing';

/**
 * The live price range, recomputed from the draft on every answer.
 *
 * The specification's opening problem is that "العميل عايز يعرف السعر ومش لاقي"
 * — the customer wants a price and cannot find one. The pricing engine can
 * genuinely answer that from what has been entered so far, so it does, with
 * the estimate marked as an estimate throughout.
 *
 * Returns null until there is enough to compute honestly. Showing a number
 * built on nothing would be worse than showing none.
 */
export function useEstimate(): Estimate | null {
  const draft = useStore((s) => s.draft);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);
  const settings = useStore((s) => s.settings);
  const properties = useStore((s) => s.data.properties);

  return useMemo(() => {
    const service = services.find((s) => s.slug === draft.serviceSlug);
    if (!service) return null;

    const saved = draft.propertyId
      ? properties.find((p) => p.id === draft.propertyId)
      : undefined;

    const area = saved?.area ?? draft.property.area;
    const bathrooms = saved?.bathrooms ?? draft.property.bathrooms;
    const hasPets = saved?.hasPets ?? draft.property.hasPets;
    const needsExtraEffort = saved?.needsExtraEffort ?? draft.property.needsExtraEffort;

    const perUnitReady =
      service.calc === 'perUnit'
        ? Boolean(draft.windowCount)
        : service.slug === 'moebelmontage'
          ? Boolean(draft.furniturePieces)
          : false;

    // Area-driven services need an area; counted services need a count.
    if (service.durationProfile !== 'none' && !area) return null;
    if (service.durationProfile === 'none' && !perUnitReady) return null;

    return priceEstimate(
      {
        service,
        addOns: addOns.filter((a) => draft.addOnIds.includes(a.id)),
        area: area ?? 0,
        bathrooms: bathrooms ?? 1,
        hasPets: hasPets ?? false,
        needsExtraEffort: needsExtraEffort ?? false,
        windowCount: draft.windowCount ?? undefined,
        furniturePieces: draft.furniturePieces ?? undefined,
        plan: draft.subscriptionIntent ?? undefined,
      },
      settings,
    );
  }, [draft, services, addOns, settings, properties]);
}
