'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { ArrowLeft, ChevronLeft, ChevronRight, Car, MapPin } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CustomerLink } from '@/components/ui/record-link';
import { addDays, addMinutes, bookingsOnDay, startOfDay } from '@/mock/engines/availability';
import { distanceKm, regionByPostcode, travelMinutes } from '@/mock/engines/coverage';
import { useHydrated, useNow, useStore } from '@/mock/store';

/**
 * Screen 62 — the day's route.
 *
 * §17.2 wants this "to order the route and cut the time spent driving between
 * jobs". With two jobs a day that is a short list, so a real map would be
 * decoration: what matters is the order, the drive between each pair, and the
 * total. Marked in the page as a schematic so nobody mistakes it for a live
 * map integration.
 */
export default function RouteMapPage() {
  const t = useTranslations('admin.map');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const bookings = useStore((s) => s.data.bookings);
  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const services = useStore((s) => s.services);

  const [cursor, setCursor] = useState(() => startOfDay(now));

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const jobs = bookingsOnDay(cursor, bookings);
  const stops = jobs.map((job) => {
    const property = properties.find((p) => p.id === job.propertyId);
    const customer = customers.find((c) => c.id === job.customerId);
    return { job, property, customer };
  });

  const legs = stops.slice(1).map((stop, i) => {
    const from = regionByPostcode(stops[i]!.property?.postcode ?? '');
    const to = regionByPostcode(stop.property?.postcode ?? '');
    const km = from && to ? distanceKm(from, to) : 0;
    return { km, minutes: from && to ? travelMinutes(km) : 0 };
  });

  const totalDrive = legs.reduce((sum, leg) => sum + leg.minutes, 0);

  return (
    <div>
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/kalender">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <h1 className="display-type text-3xl">{t('title')}</h1>

      <div className="mt-6 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('previousDay')}
          onClick={() => setCursor(addDays(cursor, -1))}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCursor(startOfDay(now))}>
          {t('today')}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('nextDay')}
          onClick={() => setCursor(addDays(cursor, 1))}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
        <span data-numeric className="ml-3 font-medium">
          {format.dateTime(cursor, 'full')}
        </span>
      </div>

      {stops.length === 0 ? (
        <EmptyState className="mt-8" title={t('emptyTitle')} body={t('emptyBody')} />
      ) : (
        <>
          <p className="mt-6 text-ink-secondary">
            {t('lead', { date: format.dateTime(cursor, 'dayMonth') })}
          </p>

          <ol className="mt-8">
            {stops.map((stop, i) => (
              <li key={stop.job.id}>
                <Link
                  href={`/admin/buchungen/${stop.job.id}`}
                  className="flex gap-4 rounded-[var(--radius-lg)] border border-line p-4 transition-colors hover:bg-sunken"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-on-accent">
                    <span data-numeric>{i + 1}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">
                        <CustomerLink
                          id={stop.customer?.id}
                          name={`${stop.customer?.firstName ?? ''} ${stop.customer?.lastName ?? ''}`.trim()}
                        />
                      </span>
                      <span data-numeric className="text-sm text-ink-secondary">
                        {format.dateTime(new Date(stop.job.start), 'time')}–
                        {format.dateTime(
                          addMinutes(new Date(stop.job.start), stop.job.duration),
                          'time',
                        )}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm text-ink-secondary">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {stop.property?.street}, {stop.property?.city}
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-tertiary">
                      {services.find((s) => s.slug === stop.job.serviceSlug)?.name[locale]}
                    </span>
                  </span>
                </Link>

                {i < legs.length && (
                  <div className="flex items-center gap-3 py-3 pl-4">
                    <span aria-hidden className="ml-[1.0625rem] h-8 w-px bg-line" />
                    <span
                      data-numeric
                      className="flex items-center gap-1.5 text-sm text-ink-tertiary"
                    >
                      <Car className="size-3.5" aria-hidden />
                      {t('driveTime', { minutes: legs[i]!.minutes })} · {legs[i]!.km} km
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ol>

          <p
            data-numeric
            className="mt-6 flex items-center justify-between border-t border-line-subtle pt-4"
          >
            <span className="text-ink-secondary">{t('totalDrive')}</span>
            <span className="text-lg font-medium">{t('minutes', { n: totalDrive })}</span>
          </p>
        </>
      )}

      <p className="mt-8 text-xs text-ink-tertiary">{t('mapNote')}</p>
    </div>
  );
}
