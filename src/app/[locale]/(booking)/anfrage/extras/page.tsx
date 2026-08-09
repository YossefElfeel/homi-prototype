'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import type { Locale } from '@/i18n/routing';
import { Money } from '@/components/ui/money';
import { EmptyState } from '@/components/ui/empty-state';
import { BookingStep } from '@/components/booking/booking-step';
import { useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

/** Screen 17 — entirely optional, and the step says so rather than implying it. */
export default function AddOnsStep() {
  const t = useTranslations('booking.addons');
  const locale = useLocale() as Locale;
  const draft = useStore((s) => s.draft);
  const addOns = useStore((s) => s.addOns);
  const updateDraft = useStore((s) => s.updateDraft);

  const available = addOns.filter(
    (a) => a.active && draft.serviceSlug && a.services.includes(draft.serviceSlug),
  );

  function toggle(id: string) {
    const next = draft.addOnIds.includes(id)
      ? draft.addOnIds.filter((x) => x !== id)
      : [...draft.addOnIds, id];
    updateDraft({ addOnIds: next });
  }

  return (
    <BookingStep
      step="extras"
      title={t('title')}
      lead={t('lead')}
      optional
      canContinue={draft.addOnIds.length > 0}
    >
      {available.length === 0 ? (
        <EmptyState compact headingLevel={2} title={t('none')} body={t('lead')} />
      ) : (
        <ul className="divide-y divide-line-subtle border-y border-line-subtle">
          {available.map((addOn) => {
            const active = draft.addOnIds.includes(addOn.id);
            return (
              <li key={addOn.id}>
                <label className="flex cursor-pointer items-start gap-4 py-4">
                  <span
                    className={cn(
                      'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[var(--radius-xs)] border transition-colors',
                      active ? 'border-accent bg-accent text-on-accent' : 'border-line',
                    )}
                  >
                    {active && <Check className="size-3.5" aria-hidden />}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={active}
                    onChange={() => toggle(addOn.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{addOn.name[locale]}</span>
                    <span className="mt-1 block text-sm text-ink-secondary">
                      {addOn.short[locale]}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <Money amount={addOn.price} />
                    <span data-numeric className="mt-0.5 block text-sm text-ink-tertiary">
                      {t('extraTime', { hours: addOn.extraDuration })}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </BookingStep>
  );
}
