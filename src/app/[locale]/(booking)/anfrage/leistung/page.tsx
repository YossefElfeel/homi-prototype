'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import type { Locale } from '@/i18n/routing';
import { Money } from '@/components/ui/money';
import { Field, Input } from '@/components/ui/field';
import { BookingStep } from '@/components/booking/booking-step';
import { SERVICE_ICONS, serviceFromPrice } from '@/components/site/service-grid';
import { durationRange } from '@/mock/engines/pricing';
import { useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

/** Screen 13 — one service per request, stated on the screen rather than enforced silently. */
export default function ServiceStep() {
  const t = useTranslations('booking.service');
  const locale = useLocale() as Locale;
  const draft = useStore((s) => s.draft);
  const services = useStore((s) => s.services);
  const updateDraft = useStore((s) => s.updateDraft);

  const selected = services.find((s) => s.slug === draft.serviceSlug);
  const needsWindows = selected?.slug === 'fensterreinigung';
  const needsPieces = selected?.slug === 'moebelmontage';

  const complete =
    Boolean(selected) &&
    (!needsWindows || Boolean(draft.windowCount)) &&
    (!needsPieces || Boolean(draft.furniturePieces));

  return (
    <BookingStep step="leistung" title={t('title')} lead={t('lead')} canContinue={complete}>
      <fieldset>
        <legend className="sr-only">{t('title')}</legend>
        <ul className="grid gap-3 sm:grid-cols-2">
          {services
            .filter((s) => s.active)
            .sort((a, b) => a.order - b.order)
            .map((service) => {
              const Icon = SERVICE_ICONS[service.slug];
              const range = durationRange(service.durationProfile);
              const active = draft.serviceSlug === service.slug;

              return (
                <li key={service.slug}>
                  <label
                    className={cn(
                      'flex h-full cursor-pointer gap-4 rounded-[var(--radius-lg)] border p-4 transition-colors',
                      active
                        ? 'border-line-strong bg-accent-subtle'
                        : 'border-line hover:bg-sunken',
                    )}
                  >
                    <input
                      type="radio"
                      name="service"
                      className="sr-only"
                      checked={active}
                      onChange={() =>
                        updateDraft({
                          serviceSlug: service.slug,
                          // Add-ons are service-scoped; keeping a stale one
                          // would put an unbuyable line in the quote.
                          addOnIds: [],
                          windowCount: null,
                          furniturePieces: null,
                        })
                      }
                    />
                    <Icon className="mt-0.5 size-5 shrink-0 text-ink-accent" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-medium">{service.name[locale]}</span>
                        {active && (
                          <Check className="size-4 shrink-0 text-eco" aria-hidden />
                        )}
                      </span>
                      <span className="mt-1 block text-sm text-ink-secondary">
                        {service.short[locale]}
                      </span>
                      <span className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                        <Money amount={serviceFromPrice(service.minDuration)} from />
                        <span data-numeric className="text-ink-tertiary">
                          {range
                            ? t('duration', { from: range[0], to: range[1] })
                            : t('durationUnit')}
                        </span>
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
        </ul>
      </fieldset>

      {needsWindows && (
        <Field label={t('windowsLabel')} hint={t('windowsHint')} className="mt-8 max-w-xs">
          {(props) => (
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={draft.windowCount ?? ''}
              onChange={(e) =>
                updateDraft({ windowCount: e.target.value ? Number(e.target.value) : null })
              }
              {...props}
            />
          )}
        </Field>
      )}

      {needsPieces && (
        <Field label={t('piecesLabel')} hint={t('piecesHint')} className="mt-8 max-w-xs">
          {(props) => (
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={draft.furniturePieces ?? ''}
              onChange={(e) =>
                updateDraft({
                  furniturePieces: e.target.value ? Number(e.target.value) : null,
                })
              }
              {...props}
            />
          )}
        </Field>
      )}
    </BookingStep>
  );
}
