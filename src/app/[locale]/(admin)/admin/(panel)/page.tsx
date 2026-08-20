'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock,
  Inbox,
  KeyRound,
  MapPin,
  RefreshCw,
  Sun,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { StatGrid, StatTile } from '@/components/ui/stat';
import { StatusBadge } from '@/components/ui/status-badge';
import { CustomerLink, RecordLink } from '@/components/ui/record-link';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
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
 *
 * The four numbers used to be a `gap-px` grid of bare counts with nowhere to
 * go from them. Each one now carries the sentence that makes it actionable and
 * links to the screen it is answered on.
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
  const plans = useStore((s) => s.plans);
  const team = useStore((s) => s.data.team);
  const memberId = useStore((s) => s.demo.currentMemberId);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);

  if (!hydrated) return <SkeletonPage label={t('title', { name: '' })} />;

  const waiting = requests
    .filter((r) => r.status === 'new' || r.status === 'inReview')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const late = waiting.filter(
    (r) => hoursSince(r.createdAt, now) > settings.responseTimeHours,
  );

  const today = bookingsOnDay(now, bookings);
  const tomorrow = bookingsOnDay(addDays(startOfDay(now), 1), bookings);

  /*
   * Plans about to run out, not charges about to be taken.
   *
   * This list was built from `nextChargeAt` — a monthly collection this
   * product does not have. What the office actually needs to see is the
   * opposite end: a plan is paid once for a year and the customer has to renew
   * it themselves, so a term ending unnoticed is a customer quietly lost. Thirty
   * days, not seven, because that is a conversation rather than a direct debit.
   */
  const monthAhead = addDays(now, 30);
  const renewals = subscriptions.filter(
    (s) =>
      s.status === 'active' &&
      new Date(s.endDate) <= monthAhead &&
      new Date(s.endDate) >= now,
  );

  const nameOf = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };
  const propertyOf = (id: string) => properties.find((p) => p.id === id);
  const serviceName = (slug: string) =>
    services.find((s) => s.slug === slug)?.name[locale] ?? slug;

  /* Was the literal string "Marco". The scenario owns who the owner is. */
  const member = team.find((m) => m.id === memberId);
  const firstStart = (jobs: typeof bookings) =>
    jobs.length > 0 ? format.dateTime(new Date(jobs[0]!.start), 'time') : null;

  const todayStart = firstStart(today);
  const tomorrowStart = firstStart(tomorrow);

  return (
    <div>
      <PageHeader
        title={t('title', { name: member?.firstName ?? '' })}
        lead={t('lead')}
      />

      <StatGrid>
        <StatTile
          label={t('statWaiting')}
          value={waiting.length}
          icon={Inbox}
          tone={late.length > 0 ? 'danger' : 'default'}
          hint={
            late.length > 0
              ? t('statWaitingHintLate', { n: late.length })
              : t('statWaitingHintOk')
          }
          href="/admin/anfragen"
          linkLabel={t('statWaitingLink')}
        />
        <StatTile
          label={t('statToday')}
          value={today.length}
          icon={Sun}
          hint={
            todayStart
              ? t('statTodayHint', { time: todayStart })
              : t('statTodayHintEmpty')
          }
          href="/admin/kalender"
          linkLabel={t('statTodayLink')}
        />
        <StatTile
          label={t('statTomorrow')}
          value={tomorrow.length}
          icon={CalendarDays}
          hint={
            tomorrowStart
              ? t('statTomorrowHint', { time: tomorrowStart })
              : t('statTodayHintEmpty')
          }
          href="/admin/kalender"
          linkLabel={t('statTomorrowLink')}
        />
        <StatTile
          label={t('statRenewals')}
          value={renewals.length}
          icon={RefreshCw}
          hint={t('statRenewalsHint')}
          href="/admin/abos"
          linkLabel={t('statRenewalsLink')}
        />
      </StatGrid>

      <Card className="mt-app-section" pad="none">
        <CardHeader
          className="p-card"
          title={t('waitingTitle')}
          description={t('waitingLead', { hours: settings.responseTimeHours })}
          actions={
            <Button asChild variant="link">
              <Link href="/admin/anfragen">
                {t('viewAll')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          }
        />

        {waiting.length === 0 ? (
          <div className="px-card pb-card">
            <EmptyState
              compact
              title={t('waitingEmptyTitle')}
              body={t('waitingEmptyBody')}
            />
          </div>
        ) : (
          <ul className="border-t border-line-subtle">
            {waiting.map((request) => {
              const overdue =
                hoursSince(request.createdAt, now) > settings.responseTimeHours;
              const property = propertyOf(request.propertyId);
              return (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-line-subtle px-card py-row last:border-0"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        <CustomerLink
                          id={request.customerId}
                          name={nameOf(request.customerId)}
                        />
                      </span>
                      <RecordLink
                        href={`/admin/anfragen/${request.id}`}
                        numeric
                        className="text-2xs"
                      >
                        {request.reference}
                      </RecordLink>
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
                        overdue
                          ? 'font-medium text-status-danger-fg'
                          : 'text-ink-tertiary',
                      )}
                    >
                      {overdue && <AlertTriangle className="size-3.5" aria-hidden />}
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
      </Card>

      <div className="mt-app-section gap-app grid lg:grid-cols-2">
        {[
          { key: 'today', title: t('todayTitle'), jobs: today },
          { key: 'tomorrow', title: t('tomorrowTitle'), jobs: tomorrow },
        ].map((block) => (
          <Card key={block.key} pad="none">
            <CardHeader className="p-card" title={block.title} />
            {block.jobs.length === 0 ? (
              <div className="px-card pb-card">
                <EmptyState
                  compact
                  title={t('dayEmptyTitle')}
                  body={t('dayEmptyBody')}
                />
              </div>
            ) : (
              <ul className="border-t border-line-subtle">
                {block.jobs.map((job) => {
                  const property = propertyOf(job.propertyId);
                  const start = new Date(job.start);
                  return (
                    <li key={job.id} className="border-b border-line-subtle last:border-0">
                      <Link
                        href={`/admin/buchungen/${job.id}`}
                        className="flex gap-4 px-card py-row transition-colors hover:bg-sunken"
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
          </Card>
        ))}
      </div>

      <Card className="mt-app-section" pad="none">
        <CardHeader className="p-card" title={t('renewalsTitle')} />
        {renewals.length === 0 ? (
          <div className="px-card pb-card">
            <EmptyState
              compact
              title={t('renewalsEmptyTitle')}
              body={t('renewalsEmptyBody')}
            />
          </div>
        ) : (
          <ul className="border-t border-line-subtle">
            {renewals.map((sub) => (
              <li
                key={sub.id}
                className="flex items-center justify-between gap-4 border-b border-line-subtle px-card py-row last:border-0"
              >
                <div>
                  <p className="font-medium">{nameOf(sub.customerId)}</p>
                  <p className="mt-0.5 text-sm text-ink-secondary">
                    {plans.find((p) => p.id === sub.planId)?.name[locale] ?? '—'}
                  </p>
                </div>
                <span
                  data-numeric
                  className="flex items-center gap-1.5 text-sm text-ink-tertiary"
                >
                  <Clock className="size-3.5" aria-hidden />
                  {t('termEnds', { date: format.dateTime(new Date(sub.endDate), 'short') })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

