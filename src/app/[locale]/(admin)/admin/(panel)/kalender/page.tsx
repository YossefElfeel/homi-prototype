'use client';

import { useMemo, useState } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, ChevronLeft, ChevronRight, Map } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  addDays,
  addMinutes,
  bookingsOnDay,
  closureFor,
  detectRouteConflicts,
  startOfDay,
} from '@/mock/engines/availability';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

type View = 'day' | 'week' | 'month' | 'agenda';

/**
 * Screens 58–61.
 *
 * One route with four views rather than four routes, because that is what a
 * calendar is — nobody navigates to "the week page". The switcher carries the
 * whole thing and the current date survives switching views.
 *
 * §20.5 is enforced visibly: where two jobs sit closer together than the drive
 * between them, the day says so rather than letting the owner discover it on
 * the road.
 */
export default function CalendarPage() {
  const t = useTranslations('admin.calendar');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const bookings = useStore((s) => s.data.bookings);
  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const closures = useStore((s) => s.data.closures);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);

  const [view, setView] = useState<View>('day');
  const [cursor, setCursor] = useState(() => startOfDay(now));

  const nameOf = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };
  const propertyOf = (id: string) => properties.find((p) => p.id === id);
  const serviceName = (slug: string) =>
    services.find((s) => s.slug === slug)?.name[locale] ?? slug;

  const step = view === 'month' ? 30 : view === 'week' ? 7 : 1;

  const weekStart = useMemo(() => {
    const d = startOfDay(cursor);
    const weekday = d.getDay() === 0 ? 7 : d.getDay();
    return addDays(d, 1 - weekday);
  }, [cursor]);

  const conflicts = useMemo(
    () => detectRouteConflicts(cursor, bookings, properties),
    [cursor, bookings, properties],
  );

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const dayJobs = bookingsOnDay(cursor, bookings);

  const heading =
    view === 'month'
      ? format.dateTime(cursor, { month: 'long', year: 'numeric' })
      : view === 'week'
        ? `${format.dateTime(weekStart, 'dayMonth')} – ${format.dateTime(addDays(weekStart, 5), 'dayMonth')}`
        : format.dateTime(cursor, 'full');

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <Button asChild variant="secondary" size="sm">
          <Link href="/admin/kalender/karte">
            <Map className="size-3.5" aria-hidden />
            Route
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('previous')}
            onClick={() => setCursor(addDays(cursor, -step))}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(startOfDay(now))}>
            {t('today')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('next')}
            onClick={() => setCursor(addDays(cursor, step))}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
          <span data-numeric className="ml-3 font-medium">
            {heading}
          </span>
        </div>

        <div role="tablist" aria-label={t('title')} className="flex gap-1">
          {(['day', 'week', 'month', 'agenda'] as const).map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={view === value}
              onClick={() => setView(value)}
              className={cn(
                'rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
                view === value
                  ? 'bg-accent-subtle font-medium text-ink'
                  : 'text-ink-secondary hover:bg-sunken',
              )}
            >
              {t(`view${value.charAt(0).toUpperCase()}${value.slice(1)}` as 'viewDay')}
            </button>
          ))}
        </div>
      </div>

      {conflicts.length > 0 && view !== 'month' && (
        <ul className="mt-6 space-y-2">
          {conflicts.map((conflict) => (
            <li
              key={`${conflict.a.id}-${conflict.b.id}`}
              className="flex gap-3 rounded-[var(--radius-md)] border border-status-warning-line bg-status-warning p-4 text-status-warning-fg"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">{t('conflictTitle')}</p>
                <p data-numeric className="mt-1 text-sm">
                  {t('conflictBody', {
                    a: nameOf(conflict.a.customerId),
                    b: nameOf(conflict.b.customerId),
                    available: Math.round(conflict.available),
                    needed: conflict.needed,
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {view === 'day' && (
        <section className="mt-8">
          <p data-numeric className="label-type text-ink-tertiary">
            {t('capacity', { used: dayJobs.length, max: settings.maxJobsPerDay })}
          </p>
          {dayJobs.length === 0 ? (
            <EmptyState
              className="mt-4"
              compact
              title={t('emptyDayTitle')}
              body={t('emptyDayBody')}
            />
          ) : (
            <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
              {dayJobs.map((job) => {
                const start = new Date(job.start);
                const property = propertyOf(job.propertyId);
                return (
                  <li key={job.id}>
                    <Link
                      href={`/admin/kalender/${job.id}`}
                      className="flex gap-5 py-4 transition-colors hover:bg-sunken"
                    >
                      <span data-numeric className="w-28 shrink-0">
                        {format.dateTime(start, 'time')}
                        <span className="block text-sm text-ink-tertiary">
                          {format.dateTime(addMinutes(start, job.duration), 'time')}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{nameOf(job.customerId)}</span>
                        <span className="block text-sm text-ink-secondary">
                          {serviceName(job.serviceSlug)} · {property?.street},{' '}
                          {property?.city}
                        </span>
                      </span>
                      <StatusBadge entity="booking" state={job.status} size="sm" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {view === 'week' && (
        <section className="mt-8 overflow-x-auto">
          <div className="grid min-w-3xl grid-cols-6 gap-px bg-line-subtle">
            {Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)).map((day) => {
              const jobs = bookingsOnDay(day, bookings);
              const closure = closureFor(day, closures);
              return (
                <div key={day.toISOString()} className="min-h-56 bg-page p-3">
                  <p className="label-type text-ink-tertiary">
                    {format.dateTime(day, { weekday: 'short' })}
                  </p>
                  <p data-numeric className="mt-1 text-lg">
                    {format.dateTime(day, { day: 'numeric' })}
                  </p>
                  {closure ? (
                    <p className="mt-3 rounded-[var(--radius-sm)] bg-sunken p-2 text-xs text-ink-tertiary">
                      {t('closurePeriod')}
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-1.5">
                      {jobs.map((job) => (
                        <li key={job.id}>
                          <Link
                            href={`/admin/kalender/${job.id}`}
                            className="block rounded-[var(--radius-sm)] bg-accent-subtle p-2 text-xs transition-colors hover:brightness-97"
                          >
                            <span data-numeric className="block font-medium">
                              {format.dateTime(new Date(job.start), 'time')}
                            </span>
                            <span className="block truncate text-ink-secondary">
                              {nameOf(job.customerId)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <p data-numeric className="mt-4 text-sm text-ink-tertiary">
            {t('weekTotal', {
              count: Array.from({ length: 6 }, (_, i) =>
                bookingsOnDay(addDays(weekStart, i), bookings),
              ).flat().length,
              hours:
                Array.from({ length: 6 }, (_, i) =>
                  bookingsOnDay(addDays(weekStart, i), bookings),
                )
                  .flat()
                  .reduce((sum, b) => sum + b.duration, 0) / 60,
            })}
          </p>
        </section>
      )}

      {view === 'month' && (
        <section className="mt-8 overflow-x-auto">
          <div className="grid min-w-2xl grid-cols-7 gap-px bg-line-subtle">
            {Array.from({ length: 42 }, (_, i) => {
              const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
              const offset = (first.getDay() === 0 ? 7 : first.getDay()) - 1;
              const day = addDays(first, i - offset);
              const inMonth = day.getMonth() === cursor.getMonth();
              const jobs = bookingsOnDay(day, bookings);
              const closure = closureFor(day, closures);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    setCursor(day);
                    setView('day');
                  }}
                  className={cn(
                    'min-h-20 bg-page p-2 text-left transition-colors hover:bg-sunken',
                    !inMonth && 'opacity-40',
                    closure && 'bg-sunken',
                  )}
                >
                  <span data-numeric className="text-sm">
                    {day.getDate()}
                  </span>
                  {closure ? (
                    <span className="mt-1 block text-[0.625rem] leading-tight text-ink-tertiary">
                      {t('closurePeriod')}
                    </span>
                  ) : (
                    jobs.length > 0 && (
                      <span className="mt-1.5 flex gap-1">
                        {jobs.map((job) => (
                          <span
                            key={job.id}
                            aria-hidden
                            className="size-1.5 rounded-full bg-accent"
                          />
                        ))}
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {view === 'agenda' && (
        <section className="mt-8">
          {(() => {
            const upcoming = bookings
              .filter((b) => new Date(b.start) >= startOfDay(now))
              .sort((a, b) => a.start.localeCompare(b.start));
            if (upcoming.length === 0) {
              return (
                <EmptyState title={t('emptyAgendaTitle')} body={t('emptyAgendaBody')} />
              );
            }
            return (
              <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                {upcoming.map((job) => {
                  const property = propertyOf(job.propertyId);
                  const start = new Date(job.start);
                  return (
                    <li key={job.id}>
                      <Link
                        href={`/admin/kalender/${job.id}`}
                        className="flex flex-wrap gap-x-5 gap-y-1 py-4 transition-colors hover:bg-sunken"
                      >
                        <span data-numeric className="w-36 shrink-0 text-sm">
                          {format.dateTime(start, 'dayMonth')}
                          <span className="block text-ink-tertiary">
                            {format.dateTime(start, 'time')}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{nameOf(job.customerId)}</span>
                          <span className="block text-sm text-ink-secondary">
                            {serviceName(job.serviceSlug)} · {property?.city}
                          </span>
                        </span>
                        <StatusBadge entity="booking" state={job.status} size="sm" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </section>
      )}
    </div>
  );
}
