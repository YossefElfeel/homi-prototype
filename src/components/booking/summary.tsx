'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Info } from 'lucide-react';

import type { Locale } from '@/i18n/routing';
import { MoneyRange } from '@/components/ui/money';
import { useStore } from '@/mock/store';
import { serviceNeeds } from '@/lib/service-flow';
import { useEstimate } from './use-estimate';

/**
 * The running selection — a sticky rail on desktop, an expandable bar at the
 * bottom of the screen on mobile (both required by the flow's shared elements).
 *
 * The estimate is the reason this is worth the space: it turns the wizard from
 * a form into a conversation about price.
 */
export function BookingSummary({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('booking.shell');
  const ts = useTranslations('booking.service');
  const tp = useTranslations('booking.property');
  const locale = useLocale() as Locale;
  const draft = useStore((s) => s.draft);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);
  const properties = useStore((s) => s.data.properties);
  const estimate = useEstimate();

  const service = services.find((s) => s.slug === draft.serviceSlug);
  const needs = serviceNeeds(service);
  const saved = draft.propertyId ? properties.find((p) => p.id === draft.propertyId) : null;
  const chosenAddOns = addOns.filter((a) => draft.addOnIds.includes(a.id));

  const address = saved
    ? `${saved.street}, ${saved.postcode} ${saved.city}`
    : [draft.property.street, [draft.property.postcode, draft.property.city].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ');

  return (
    <div className={compact ? '' : 'surface-card p-6'}>
      {!compact && <h2 className="label-type text-ink-tertiary">{t('summaryTitle')}</h2>}

      <dl className={compact ? 'space-y-2.5' : 'mt-4 space-y-2.5'}>
        {service && <Row label={t('steps.leistung')}>{service.name[locale]}</Row>}
        {address && <Row label={t('steps.objekt')}>{address}</Row>}
        {/*
          The quantity this service is actually priced on. The rail printed m²
          for everything, so a window clean showed the floor area of the flat —
          a number the quote does not contain — and never showed the count of
          windows, which is the only figure moving the estimate underneath it.
        */}
        {needs.asksArea && (saved?.area ?? draft.property.area) && (
          <Row label="m²">
            <span data-numeric>{saved?.area ?? draft.property.area}</span>
          </Row>
        )}
        {needs.asksWindowCount && draft.windowCount && (
          <Row label={ts('windowsSummary')}>
            <span data-numeric>{draft.windowCount}</span>
          </Row>
        )}
        {needs.asksFurniturePieces && draft.furniturePieces && (
          <Row label={ts('piecesSummary')}>
            <span data-numeric>{draft.furniturePieces}</span>
          </Row>
        )}
        {/* A second stop is the biggest thing that can change about a job
            without changing a single number, so it belongs in the running
            selection rather than only on the review page. */}
        {draft.pickup?.street && (
          <Row label={tp('pickupTitle')}>
            {draft.pickup.street}
            {draft.pickup.city && `, ${draft.pickup.city}`}
          </Row>
        )}
        {chosenAddOns.length > 0 && (
          <Row label={t('steps.extras')}>
            {chosenAddOns.map((a) => a.name[locale]).join(', ')}
          </Row>
        )}
        {draft.photos.length > 0 && (
          <Row label={t('steps.fotos')}>
            <span data-numeric>{draft.photos.length}</span>
          </Row>
        )}
      </dl>

      <div className="mt-5 border-t border-line-subtle pt-4">
        {estimate ? (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="label-type text-ink-tertiary">{t('estimateLabel')}</span>
              <MoneyRange
                low={estimate.rangeLow}
                high={estimate.rangeHigh}
                className="text-lg font-semibold"
              />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink-tertiary">{t('hoursLabel')}</span>
              {/* scheduledHours, not hours: this is how long we will be in
                  the property, which includes add-on time that is not billed
                  by the hour. */}
              <span data-numeric className="text-sm text-ink-secondary">
                ca. {estimate.scheduledHours} Std.
              </span>
            </div>
            <p className="mt-3 flex gap-2 text-xs text-ink-tertiary">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {t('estimateNote')}
            </p>
          </>
        ) : (
          <p className="text-sm text-ink-tertiary">{t('estimatePending')}</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="shrink-0 text-ink-tertiary">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}
