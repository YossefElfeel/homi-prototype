'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Info } from 'lucide-react';

import type { Locale } from '@/i18n/routing';
import { Money } from '@/components/ui/money';
import { Field, Input } from '@/components/ui/field';
import { BookingStep } from '@/components/booking/booking-step';
import { ServiceIcon, serviceFromPrice } from '@/components/site/service-grid';
import { durationRange } from '@/mock/engines/pricing';
import { useHydrated, useStore } from '@/mock/store';
import { isOffered } from '@/lib/service-catalogue';
import { cn } from '@/lib/cn';

/** Screen 13 — one service per request, stated on the screen rather than enforced silently. */
export default function ServiceStep({
  searchParams,
}: {
  searchParams: Promise<{ leistung?: string; abo?: string; plz?: string }>;
}) {
  const { leistung, abo, plz } = use(searchParams);
  const t = useTranslations('booking.service');
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const draft = useStore((s) => s.draft);
  const services = useStore((s) => s.services);
  const plans = useStore((s) => s.plans);
  const updateDraft = useStore((s) => s.updateDraft);

  /* A link to a plan is only honoured while that plan is still on sale. A
     retired one arriving from a stale bookmark or a printed flyer would
     otherwise start a wizard for a product the payment step then refuses. */
  const sellable = (id: string | undefined) =>
    Boolean(id && plans.some((x) => x.id === id && x.active));

  /**
   * Whether to announce the prefill. Derived once from the params themselves
   * rather than set from the effect — the effect only writes, and calling
   * setState inside one cascades renders.
   */
  const [prefilled] = useState(
    () =>
      Boolean(leistung && services.some((s) => s.slug === leistung && isOffered(s))) ||
      Boolean(plz && /^\d{4}$/.test(plz)) ||
      sellable(abo),
  );
  const applied = useRef(false);

  /**
   * Seed the draft from what the visitor clicked on the marketing site.
   *
   * Gated on `hydrated` because the persisted draft lands asynchronously and
   * would overwrite an earlier write; guarded by a ref so coming back to this
   * step later does not clobber edits made in between. Anything that does not
   * validate is ignored rather than written — a bad link should start a blank
   * wizard, not put junk in the draft.
   */
  useEffect(() => {
    if (!hydrated || applied.current) return;
    applied.current = true;

    const patch: Parameters<typeof updateDraft>[0] = {};

    const service = services.find((s) => s.slug === leistung && isOffered(s));
    if (service) {
      patch.serviceSlug = service.slug;
      // Same dependent resets the radio does — add-ons are service-scoped.
      patch.addOnIds = [];
      patch.windowCount = null;
      patch.furniturePieces = null;
    }
    // A postcode the visitor typed beats one inferred from a region page.
    if (plz && /^\d{4}$/.test(plz) && draft.property.postcode === '') {
      patch.property = { ...draft.property, postcode: plz };
    }
    if (sellable(abo) && draft.planIntent === null) {
      patch.planIntent = abo;
    }

    if (Object.keys(patch).length > 0) updateDraft(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, leistung, abo, plz, services, plans, draft.property, draft.planIntent, updateDraft]);

  const selected = services.find((s) => s.slug === draft.serviceSlug);
  const needsWindows = selected?.slug === 'fensterreinigung';
  const needsPieces = selected?.slug === 'moebelmontage';

  const complete =
    Boolean(selected) &&
    (!needsWindows || Boolean(draft.windowCount)) &&
    (!needsPieces || Boolean(draft.furniturePieces));

  return (
    <BookingStep step="leistung" title={t('title')} lead={t('lead')} canContinue={complete}>
      {/* A silently pre-selected radio reads as a bug, so say it out loud. */}
      {prefilled && (
        <p className="mb-6 flex gap-2 border-l-2 border-rule bg-sunken p-4 text-sm text-ink-secondary">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('prefilled')}
        </p>
      )}

      <fieldset>
        <legend className="sr-only">{t('title')}</legend>
        <ul className="grid gap-3 sm:grid-cols-2">
          {services
            .filter(isOffered)
            .sort((a, b) => a.order - b.order)
            .map((service) => {
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
                    <ServiceIcon slug={service.slug} className="mt-0.5 size-5 shrink-0 text-ink-accent" />
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
