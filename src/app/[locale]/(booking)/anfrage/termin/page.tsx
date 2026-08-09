'use client';

import { useMemo } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Info } from 'lucide-react';

import { Checkbox } from '@/components/ui/field';
import { BookingStep } from '@/components/booking/booking-step';
import { addDays, dayBlockReason, startOfDay } from '@/mock/engines/availability';
import { useNow, useStore } from '@/mock/store';
import type { TimeBand } from '@/mock/schema';
import { cn } from '@/lib/cn';

const BANDS: { value: TimeBand; label: 'bandMorning' | 'bandMidday' | 'bandAfternoon'; time: 'bandMorningTime' | 'bandMiddayTime' | 'bandAfternoonTime' }[] = [
  { value: 'morning', label: 'bandMorning', time: 'bandMorningTime' },
  { value: 'midday', label: 'bandMidday', time: 'bandMiddayTime' },
  { value: 'afternoon', label: 'bandAfternoon', time: 'bandAfternoonTime' },
];

const DAYS_SHOWN = 28;

/**
 * Screen 19 — the preferred time.
 *
 * The hard part is that this is *not* a booking, and the flow has to say so
 * without making the step feel pointless. Hence the notice directly under the
 * heading and the wording throughout: a wish, then a real slot in the quote.
 *
 * Days are filtered by the same rules the scheduler uses — Sundays, closure
 * periods and anything inside the 24-hour lead time are shown disabled rather
 * than hidden, so the constraint is visible instead of mysterious.
 */
export default function TimeStep() {
  const t = useTranslations('booking.time');
  const format = useFormatter();
  const now = useNow();
  const draft = useStore((s) => s.draft);
  const updateDraft = useStore((s) => s.updateDraft);
  const settings = useStore((s) => s.settings);
  const bookings = useStore((s) => s.data.bookings);
  const closures = useStore((s) => s.data.closures);

  const days = useMemo(() => {
    const from = startOfDay(now);
    return Array.from({ length: DAYS_SHOWN }, (_, i) => {
      const date = addDays(from, i);
      return {
        date,
        blocked: dayBlockReason(date, { bookings, closures, settings, now }),
      };
    });
  }, [now, bookings, closures, settings]);

  const selectedDate = draft.preferred.date ? new Date(draft.preferred.date) : null;
  const complete =
    draft.preferred.flexible || Boolean(draft.preferred.date && draft.preferred.band);

  return (
    <BookingStep step="termin" title={t('title')} lead={t('lead')} canContinue={complete}>
      <div className="flex gap-3 border-l-2 border-rule bg-sunken p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
        <div>
          <h2 className="font-medium">{t('noticeTitle')}</h2>
          <p className="mt-1.5 text-sm text-ink-secondary">{t('noticeBody')}</p>
        </div>
      </div>

      <fieldset className="mt-8" disabled={draft.preferred.flexible}>
        <legend className="label-type mb-3 text-ink-tertiary">
          {t('leadHint', { hours: settings.minLeadHours })}
        </legend>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {days.map(({ date, blocked }) => {
            const iso = date.toISOString();
            const active = selectedDate?.toDateString() === date.toDateString();
            return (
              <li key={iso}>
                <label
                  className={cn(
                    'flex h-full flex-col items-center rounded-[var(--radius-md)] border px-2 py-3 text-center transition-colors',
                    blocked
                      ? 'cursor-not-allowed border-line-subtle bg-sunken text-ink-tertiary opacity-60'
                      : 'cursor-pointer border-line hover:bg-sunken',
                    active && !blocked && 'border-line-strong bg-accent-subtle',
                    draft.preferred.flexible && 'opacity-45',
                  )}
                >
                  <input
                    type="radio"
                    name="day"
                    className="sr-only"
                    disabled={Boolean(blocked)}
                    checked={active}
                    onChange={() =>
                      updateDraft({ preferred: { ...draft.preferred, date: iso } })
                    }
                  />
                  <span className="label-type text-ink-tertiary">
                    {format.dateTime(date, { weekday: 'short' })}
                  </span>
                  <span data-numeric className="mt-1 text-lg">
                    {format.dateTime(date, { day: 'numeric' })}
                  </span>
                  <span className="text-xs text-ink-tertiary">
                    {format.dateTime(date, { month: 'short' })}
                  </span>
                  {blocked && (
                    <span className="mt-1 text-[0.625rem] leading-tight text-ink-tertiary">
                      {blocked === 'too-soon' ? t('tooSoon') : t('closedDay')}
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset className="mt-8" disabled={draft.preferred.flexible}>
        <legend className="label-type mb-3 text-ink-tertiary">{t('selectedLabel')}</legend>
        <div className="flex flex-wrap gap-2">
          {BANDS.map((band) => {
            const active = draft.preferred.band === band.value;
            return (
              <label
                key={band.value}
                className={cn(
                  'flex cursor-pointer flex-col rounded-[var(--radius-md)] border px-4 py-3 transition-colors',
                  active ? 'border-line-strong bg-accent-subtle' : 'border-line hover:bg-sunken',
                  draft.preferred.flexible && 'cursor-not-allowed opacity-45',
                )}
              >
                <input
                  type="radio"
                  name="band"
                  className="sr-only"
                  checked={active}
                  onChange={() =>
                    updateDraft({ preferred: { ...draft.preferred, band: band.value } })
                  }
                />
                <span className="font-medium">{t(band.label)}</span>
                <span data-numeric className="text-sm text-ink-tertiary">
                  {t(band.time)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 border-t border-line-subtle pt-6">
        <Checkbox
          label={t('flexible')}
          checked={draft.preferred.flexible}
          onChange={(e) =>
            updateDraft({
              preferred: e.target.checked
                ? { flexible: true }
                : { ...draft.preferred, flexible: false },
            })
          }
        />
      </div>
    </BookingStep>
  );
}
