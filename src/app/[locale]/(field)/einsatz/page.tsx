'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CalendarCheck, Check } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { EmptyState } from '@/components/ui/empty-state';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Booking } from '@/mock/schema';
import { cn } from '@/lib/cn';

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Screen 85 — today's jobs.
 *
 * Today only, plus a glance at tomorrow. A contractor standing on a doorstep
 * needs the next hour, not a calendar; anything further out is the office's
 * problem. Order is by start time, and a finished job stays visible rather
 * than disappearing — seeing what is already done is how you know you have not
 * skipped one.
 */
export default function FieldTodayPage() {
  const t = useTranslations('field.today');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const now = useNow();

  const memberId = useStore((s) => s.demo.currentMemberId);
  const bookings = useStore((s) => s.data.bookings);
  const properties = useStore((s) => s.data.properties);
  const services = useStore((s) => s.services);

  if (!hydrated) return <p className="py-10 text-ink-tertiary">…</p>;

  const tomorrow = new Date(now.getTime() + 86_400_000);
  const mine = bookings.filter((b) => b.assigneeId === memberId);
  const byStart = (a: Booking, b: Booking) => (a.start < b.start ? -1 : 1);

  const today = mine.filter((b) => sameDay(new Date(b.start), now)).sort(byStart);
  const next = mine.filter((b) => sameDay(new Date(b.start), tomorrow)).sort(byStart);

  const card = (booking: Booking, muted = false) => {
    const property = properties.find((p) => p.id === booking.propertyId);
    const done = booking.status === 'completed' || booking.status === 'closed';
    const end = new Date(new Date(booking.start).getTime() + booking.arrivalWindow * 60_000);
    return (
      <li key={booking.id}>
        <Link
          href={`/einsatz/${booking.id}`}
          className={cn(
            'flex min-h-11 items-start gap-4 border-b border-line-subtle py-4',
            muted && 'opacity-70',
          )}
        >
          <span data-numeric className="w-14 shrink-0 pt-0.5 text-lg font-medium">
            {format.dateTime(new Date(booking.start), 'time')}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">
              {property ? property.street : '—'}
            </span>
            <span className="mt-0.5 block text-sm text-ink-secondary">
              {property && (
                <>
                  <span data-numeric>{property.postcode}</span> {property.city} ·{' '}
                </>
              )}
              {services.find((s) => s.slug === booking.serviceSlug)?.name[locale]}
            </span>
            <span data-numeric className="mt-1 block text-sm text-ink-tertiary">
              {t('arrival', {
                from: format.dateTime(new Date(booking.start), 'time'),
                to: format.dateTime(end, 'time'),
              })}
            </span>
          </span>
          {done ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-status-success px-1.5 py-0.5 text-xs text-status-success-fg">
              <Check className="size-3" aria-hidden />
              {t('doneToday')}
            </span>
          ) : (
            <ArrowRight className="mt-1 size-4 shrink-0 text-ink-tertiary" aria-hidden />
          )}
        </Link>
      </li>
    );
  };

  return (
    <div className="py-6">
      <h1 className="display-type text-2xl">{t('title')}</h1>
      <p data-numeric className="mt-1 text-ink-secondary">
        {format.dateTime(now, 'full')}
      </p>

      {today.length === 0 ? (
        <>
          <EmptyState
            className="mt-8"
            icon={CalendarCheck}
            title={t('emptyTitle')}
            body={t('emptyBody')}
            compact
          />
          {next.length === 0 && (
            <p className="mt-4 text-center text-sm text-ink-tertiary">
              {t('emptyTomorrow')}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="label-type mt-6 text-ink-tertiary">
            {t('jobsCount', { n: today.length })}
          </p>
          <ul className="mt-2 border-t border-line-subtle">{today.map((b) => card(b))}</ul>
        </>
      )}

      {next.length > 0 && (
        <section className="mt-10">
          <h2 className="label-type text-ink-tertiary">{t('tomorrowTitle')}</h2>
          <ul className="mt-2 border-t border-line-subtle">
            {next.map((b) => card(b, true))}
          </ul>
        </section>
      )}
    </div>
  );
}
