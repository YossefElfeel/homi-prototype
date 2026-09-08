'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { ArrowRight, CalendarDays, Filter, Search, X } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { RowAction, RowActions } from '@/components/ui/row-actions';
import { ActionIcon } from '@/lib/action-icons';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { isUpcoming } from '@/lib/booking-facts';
import { statesOf } from '@/lib/status-registry';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Booking, BookingStatus } from '@/mock/schema';

/** «Alle», «kommend», or one exact status — the three-part filter the other lists have. */
type StatusFilter = 'all' | 'upcoming' | BookingStatus;

/**
 * Screen 50 — the customer's own appointments.
 *
 * The one large record the account could not open. `useAccount` had been
 * returning `bookings` since the first wave and exactly two screens read it:
 * the dashboard, to pick the single next job and print a date on it, and the
 * review form, to work out which jobs were reviewable. So a customer with
 * fourteen visits behind them could see one — the next — and had no way to
 * answer "when were you last here", "what did that cost" or "why was I charged
 * for a job nobody did".
 *
 * That last one is the reason this is a list rather than a second card on the
 * dashboard. `BookingStatus` has nine values and five of them had no
 * customer-facing surface at all, including the two that put money on an
 * invoice: `noAccess` (§4.2) and `cancelled` (§12). The fee arrived with no
 * screen anywhere in the product that explained where it came from.
 *
 * Same toolbar as the other four lists — search, one status menu, one property
 * menu — because a customer who has learnt the invoices list should not have
 * to learn this one.
 */
export default function AccountAppointmentsPage() {
  const t = useTranslations('account.appointments');
  const statusT = useTranslations('status.booking');
  const appT = useTranslations('app');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const { bookings, properties } = useAccount();
  const services = useStore((s) => s.services);

  const [status, setStatus] = useState<StatusFilter>('all');
  const [property, setProperty] = useState<string>('all');
  const [query, setQuery] = useState('');

  /* Newest first, which for this list means the next visit rather than the
     last one: a future date sorts above every past one, so the row the screen
     is opened for is the row at the top. */
  const mine = useMemo(
    () => [...bookings].sort((a, b) => (a.start < b.start ? 1 : -1)),
    [bookings],
  );

  const serviceName = useMemo(
    () => (slug: string) => services.find((s) => s.slug === slug)?.name[locale] ?? slug,
    [services, locale],
  );

  const addressOf = useMemo(
    () => (id: string) => {
      const p = properties.find((x) => x.id === id);
      return p ? `${p.street}, ${p.city}` : '';
    },
    [properties],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mine
      .filter((b) => {
        if (status === 'all') return true;
        if (status === 'upcoming') return isUpcoming(b, now);
        return b.status === status;
      })
      .filter((b) => (property === 'all' ? true : b.propertyId === property))
      .filter((b) =>
        q
          ? /* The number, the service and the address. A customer looks an
               appointment up by where it was far more often than by its
               reference — «die Reinigung in Stäfa» — and the reference is the
               one thing our own letters quote back at them. */
            [b.reference, serviceName(b.serviceSlug), addressOf(b.propertyId)]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      );
  }, [mine, status, property, query, now, serviceName, addressOf]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = status !== 'all' || property !== 'all' || query.trim() !== '';

  function clearFilters() {
    setStatus('all');
    setProperty('all');
    setQuery('');
  }

  const columns: Column<Booking>[] = [
    {
      key: 'start',
      header: t('colDate'),
      primary: true,
      sortBy: (b) => b.start,
      cell: (b) => (
        <span data-numeric>{format.dateTime(new Date(b.start), 'short')}</span>
      ),
    },
    {
      key: 'service',
      header: t('colService'),
      cell: (b) => serviceName(b.serviceSlug),
    },
    {
      key: 'property',
      header: t('colProperty'),
      /* Not `tableOnly`, unlike the secondary columns on the other lists. This
         account has three addresses and the phone card would otherwise say
         «Unterhaltsreinigung» four times over with no way to tell the office
         in Stäfa from the flat in Meilen. */
      sortBy: (b) => addressOf(b.propertyId),
      cell: (b) => (
        <span className="text-sm text-ink-tertiary">{addressOf(b.propertyId)}</span>
      ),
    },
    {
      key: 'reference',
      header: t('colReference'),
      tableOnly: true,
      cell: (b) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {b.reference}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      sortBy: (b) => b.status,
      cell: (b) => <StatusBadge entity="booking" state={b.status} size="sm" />,
    },
  ];

  return (
    <>
      <PageHeader title={t('title')} />

      {/* Gone once the list is genuinely empty, the way the other four do it —
          a search box over nothing is a control that cannot act. */}
      {mine.length > 0 && (
        <Toolbar
          search={{
            value: query,
            onChange: setQuery,
            label: t('search'),
            clearLabel: appT('clearSearch'),
          }}
          count={
            filtering
              ? appT('results', { shown: visible.length, total: mine.length })
              : appT('resultsAll', { total: mine.length })
          }
          filters={
            <>
              <label className="min-w-44">
                <span className="sr-only">{t('filterStatus')}</span>
                {/* «Kommend» sits inside the status menu rather than beside it,
                    for the reason the invoices list puts «offen» there: it is
                    the same question at a coarser grain, and two controls would
                    allow a pair that empties the table without explaining
                    why. */}
                <Select
                  dense
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                >
                  <option value="all">
                    {t('filterStatus')}: {t('filterAll')}
                  </option>
                  <option value="upcoming">{t('filterUpcoming')}</option>
                  {statesOf('booking').map((state) => (
                    <option key={state} value={state}>
                      {statusT(state)}
                    </option>
                  ))}
                </Select>
              </label>

              {/* Only worth a control once there is more than one address to
                  choose between — on a one-property account it is a menu whose
                  every option returns the same list. */}
              {properties.length > 1 && (
                <label className="min-w-44">
                  <span className="sr-only">{t('filterProperty')}</span>
                  <Select
                    dense
                    value={property}
                    onChange={(e) => setProperty(e.target.value)}
                  >
                    <option value="all">{t('filterPropertyAll')}</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.street}, {p.city}
                      </option>
                    ))}
                  </Select>
                </label>
              )}

              {filtering && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  <X className="size-3.5" aria-hidden />
                  {t('filterReset')}
                </Button>
              )}
            </>
          }
        />
      )}

      <DataView
        items={visible}
        columns={columns}
        getKey={(b) => b.id}
        onSelect={(b) => router.push(`/account/appointments/${b.id}`)}
        caption={t('title')}
        rowActions={(b) => (
          <RowActions>
            <RowAction href={`/account/appointments/${b.id}`} label={t('rowOpen')}>
              <ActionIcon.open aria-hidden />
            </RowAction>
          </RowActions>
        )}
        empty={
          query.trim() ? (
            <EmptyState
              icon={Search}
              title={t('searchEmptyTitle')}
              body={t('searchEmptyBody', { query })}
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  {t('filterReset')}
                </Button>
              }
            />
          ) : filtering ? (
            <EmptyState
              icon={Filter}
              title={t('filterEmptyTitle')}
              body={t('filterEmptyBody')}
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  {t('filterReset')}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title={t('emptyTitle')}
              body={t('emptyBody')}
              /* We book the job, so nothing here creates an appointment
                 directly — but the quote that becomes one starts a click
                 away. */
              action={
                <Button asChild>
                  <Link href="/request">
                    {t('emptyAction')}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              }
            />
          )
        }
      />
    </>
  );
}
