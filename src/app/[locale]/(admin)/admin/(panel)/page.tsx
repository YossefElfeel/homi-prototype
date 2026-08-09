'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { AlertTriangle, ArrowRight, Clock, KeyRound, MapPin } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { addDays, addMinutes, bookingsOnDay, startOfDay } from '@/mock/engines/availability';
import { elapsed, hoursSince } from '@/lib/elapsed';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

const ACCESS_SHORT: Record<string, string> = {
  'customer-present': 'Kunde da',
  'key-left': 'Schlüssel',
  'key-box': 'Schlüsselkasten',
  'other-person': 'Andere Person',
};

/**
 * Screen 51 — the start screen.
 *
 * The brief sets the bar: "صاحب الشركة يفتحها الصبح ويعرف يعمل إيه النهاردة في
 * عشر ثواني". So it opens with four numbers, then the one block that actually
 * costs money when ignored — requests waiting on an answer, oldest first, with
 * anything past the promised window marked in red.
 *
 * Every block has its own empty state. On day one all four are empty at once,
 * and the screen still has to read as a working tool rather than a failure.
 */
export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const requests = useStore((s) => s.data.requests);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const bookings = useStore((s) => s.data.bookings);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const waiting = requests
    .filter((r) => r.status === 'new' || r.status === 'inReview')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const today = bookingsOnDay(now, bookings);
  const tomorrow = bookingsOnDay(addDays(startOfDay(now), 1), bookings);

  const weekAhead = addDays(now, 7);
  const renewals = subscriptions.filter(
    (s) =>
      s.status === 'active' &&
      s.nextChargeAt &&
      new Date(s.nextChargeAt) <= weekAhead &&
      new Date(s.nextChargeAt) >= now,
  );

  const nameOf = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };
  const propertyOf = (id: string) => properties.find((p) => p.id === id);
  const serviceName = (slug: string) =>
    services.find((s) => s.slug === slug)?.name[locale] ?? slug;

  return (
    <div className="max-w-5xl">
      <h1 className="display-type text-3xl">
        {t('title', { name: 'Marco' })}
      </h1>
      <p className="mt-2 text-ink-secondary">{t('lead')}</p>

      <dl className="mt-8 grid grid-cols-2 gap-px border border-line-subtle bg-line-subtle lg:grid-cols-4">
        {[
          { label: t('statWaiting'), value: waiting.length, alert: waiting.some((r) => hoursSince(r.createdAt, now) > settings.responseTimeHours) },
          { label: t('statToday'), value: today.length },
          { label: t('statTomorrow'), value: tomorrow.length },
          { label: t('statRenewals'), value: renewals.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-page p-5">
            <dt className="label-type text-ink-tertiary">{stat.label}</dt>
            <dd
              data-numeric
              className={cn('mt-2 text-3xl', stat.alert && 'text-status-danger-fg')}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display-type text-xl">{t('waitingTitle')}</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              {t('waitingLead', { hours: settings.responseTimeHours })}
            </p>
          </div>
          <Button asChild variant="link">
            <Link href="/admin/anfragen">
              {t('viewAll')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>

        {waiting.length === 0 ? (
          <EmptyState
            compact
            className="mt-5"
            title={t('waitingEmptyTitle')}
            body={t('waitingEmptyBody')}
          />
        ) : (
          <ul className="mt-5 divide-y divide-line-subtle border-y border-line-subtle">
            {waiting.map((request) => {
              const late = hoursSince(request.createdAt, now) > settings.responseTimeHours;
              const property = propertyOf(request.propertyId);
              return (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{nameOf(request.customerId)}</span>
                      <span data-numeric className="label-type text-ink-tertiary">
                        {request.reference}
                      </span>
                      {request.outOfArea && (
                        <span className="rounded-sm border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-[0.6875rem] text-status-warning-fg">
                          {property?.postcode}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-ink-secondary">
                      {serviceName(request.serviceSlug)} · {property?.city}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* The one number that matters on this screen. */}
                    <span
                      className={cn(
                        'flex items-center gap-1.5 text-sm',
                        late ? 'font-medium text-status-danger-fg' : 'text-ink-tertiary',
                      )}
                    >
                      {late && <AlertTriangle className="size-3.5" aria-hidden />}
                      <span data-numeric>
                        {t('elapsed', { time: elapsed(request.createdAt, now, locale) })}
                      </span>
                    </span>
                    <Button asChild size="sm">
                      <Link href={`/admin/anfragen/${request.id}`}>{t('reply')}</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        {[
          { title: t('todayTitle'), jobs: today },
          { title: t('tomorrowTitle'), jobs: tomorrow },
        ].map((block) => (
          <section key={block.title}>
            <h2 className="display-type text-xl">{block.title}</h2>
            {block.jobs.length === 0 ? (
              <EmptyState
                compact
                className="mt-4"
                title={t('dayEmptyTitle')}
                body={t('dayEmptyBody')}
              />
            ) : (
              <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
                {block.jobs.map((job) => {
                  const property = propertyOf(job.propertyId);
                  const start = new Date(job.start);
                  return (
                    <li key={job.id}>
                      <Link
                        href={`/admin/kalender/${job.id}`}
                        className="flex gap-4 py-3.5 transition-colors hover:bg-sunken"
                      >
                        <span data-numeric className="w-24 shrink-0 text-sm">
                          {format.dateTime(start, 'time')}–
                          {format.dateTime(addMinutes(start, job.duration), 'time')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">
                            {nameOf(job.customerId)}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-secondary">
                            <span>{serviceName(job.serviceSlug)}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" aria-hidden />
                              {property?.street}, {property?.city}
                            </span>
                            {property?.access && (
                              <span className="flex items-center gap-1">
                                <KeyRound className="size-3" aria-hidden />
                                {ACCESS_SHORT[property.access.method]}
                              </span>
                            )}
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
        ))}
      </div>

      <section className="mt-12">
        <h2 className="display-type text-xl">{t('renewalsTitle')}</h2>
        {renewals.length === 0 ? (
          <EmptyState
            compact
            className="mt-4"
            title={t('renewalsEmptyTitle')}
            body={t('renewalsEmptyBody')}
          />
        ) : (
          <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
            {renewals.map((sub) => (
              <li key={sub.id} className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="font-medium">{nameOf(sub.customerId)}</p>
                  <p className="mt-0.5 text-sm text-ink-secondary capitalize">{sub.plan}</p>
                </div>
                <span data-numeric className="flex items-center gap-1.5 text-sm text-ink-tertiary">
                  <Clock className="size-3.5" aria-hidden />
                  {t('nextCharge', {
                    date: sub.nextChargeAt
                      ? format.dateTime(new Date(sub.nextChargeAt), 'short')
                      : '—',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
