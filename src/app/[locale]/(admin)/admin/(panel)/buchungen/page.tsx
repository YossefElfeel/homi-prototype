'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { CalendarCheck, CalendarDays, FileText, Receipt, Repeat } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { DataView, type Column } from '@/components/ui/data-view';
import { RowAction, RowActions } from '@/components/ui/row-actions';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { CustomerLink } from '@/components/ui/record-link';
import { Toolbar } from '@/components/ui/toolbar';
import { offerTotal } from '@/mock/engines/offers';
import { customerName } from '@/lib/offer-facts';
import { statesOf } from '@/lib/status-registry';
import { useHydrated, useStore } from '@/mock/store';
import type { Booking } from '@/mock/schema';

/**
 * Bookings — new.
 *
 * A booking was the only major entity in the system with no list of its own.
 * They existed on the calendar, which answers "what is on Tuesday" and cannot
 * answer anything else: which jobs came out of quotes and which off plans, how
 * many are waiting on approval, what the month is worth, which finished job
 * still has no invoice. Every one of those was a scroll through four calendar
 * views, counting by eye.
 *
 * Screen 63 — the booking detail — moved here from `/admin/kalender/[id]`
 * rather than being copied. A second detail would have drifted from the first
 * the week after it shipped, and leaving it under the calendar meant its back
 * button threw everyone who arrived from this list into a timeline view they
 * had not come from.
 */
export default function BookingsPage() {
  const t = useTranslations('admin.bookings');
  const statusT = useTranslations('status.booking');
  const appT = useTranslations('app');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const hydrated = useHydrated();

  const bookings = useStore((s) => s.data.bookings);
  const customers = useStore((s) => s.data.customers);
  const offers = useStore((s) => s.data.offers);
  const invoices = useStore((s) => s.data.invoices);
  const services = useStore((s) => s.services);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const nameOf = (b: Booking) =>
    customerName(customers.find((c) => c.id === b.customerId));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...bookings]
      .filter((b) => !status || b.status === status)
      .filter((b) => {
        if (!q) return true;
        const customer = customers.find((c) => c.id === b.customerId);
        return (
          b.reference.toLowerCase().includes(q) ||
          `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.start.localeCompare(a.start));
  }, [bookings, customers, query, status]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const columns: Column<Booking>[] = [
    {
      key: 'reference',
      header: t('colReference'),
      primary: true,
      sortBy: (b) => b.reference,
      cell: (b) => <span data-numeric>{b.reference}</span>,
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (b) => <StatusBadge entity="booking" state={b.status} size="sm" />,
    },
    {
      key: 'customer',
      header: t('colCustomer'),
      sortBy: nameOf,
      cell: (b) => <CustomerLink id={b.customerId} name={nameOf(b)} />,
    },
    {
      key: 'service',
      header: t('colService'),
      cell: (b) => services.find((s) => s.slug === b.serviceSlug)?.name[locale] ?? '—',
    },
    {
      /*
       * The column the calendar could never carry. A job off a plan and a job
       * off a quote are billed differently, cancelled differently and chased
       * differently, and until now telling them apart meant opening each one.
       */
      key: 'source',
      header: t('colSource'),
      cell: (b) => {
        if (b.subscriptionId) {
          return (
            <Chip tone="accent" icon={Repeat}>
              {t('sourceSubscription')}
            </Chip>
          );
        }
        const offer = offers.find((o) => o.id === b.offerId);
        return offer ? (
          <Link
            href={`/admin/offerten/${offer.id}`}
            data-numeric
            className="text-ink-accent hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {offer.reference}
          </Link>
        ) : (
          <span className="text-ink-tertiary">{t('sourceManual')}</span>
        );
      },
    },
    {
      key: 'start',
      header: t('colWhen'),
      sortBy: (b) => b.start,
      cell: (b) => (
        <span className="flex flex-col gap-0.5">
          <span data-numeric>{format.dateTime(new Date(b.start), 'short')}</span>
          <span data-numeric className="text-xs text-ink-tertiary">
            {format.dateTime(new Date(b.start), 'time')} · {t('hours', {
              hours: (b.duration / 60).toFixed(1),
            })}
          </span>
        </span>
      ),
    },
    {
      key: 'amount',
      header: t('colAmount'),
      align: 'end',
      tableOnly: true,
      cell: (b) => {
        const offer = offers.find((o) => o.id === b.offerId);
        /* A plan visit has no amount of its own — the monthly charge covers
           it, and printing the quote total here would count money twice. */
        if (!offer) return <span className="text-ink-tertiary">—</span>;
        return <Money amount={offerTotal(offer)} emphasis="quiet" />;
      },
    },
    {
      key: 'invoice',
      header: t('colInvoice'),
      align: 'end',
      tableOnly: true,
      cell: (b) => {
        const invoice = invoices.find((i) => i.bookingId === b.id);
        if (!invoice) return <span className="text-ink-tertiary">—</span>;
        return <StatusBadge entity="invoice" state={invoice.status} size="sm" />;
      },
    },
  ];

  return (
    <div className="mx-auto max-w-[100rem]">
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        actions={
          <Button asChild variant="secondary">
            <Link href="/admin/kalender">
              <CalendarDays className="size-4" aria-hidden />
              {t('openCalendar')}
            </Link>
          </Button>
        }
      />

      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('search'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          query || status
            ? appT('results', { shown: visible.length, total: bookings.length })
            : appT('resultsAll', { total: bookings.length })
        }
        filters={
          <label className="min-w-40">
            <span className="sr-only">{t('filterStatus')}</span>
            {/* Options come from the status registry, so the filter and the
                badge it filters can never read differently. */}
            <Select dense value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">
                {t('filterStatus')}: {t('filterAll')}
              </option>
              {statesOf('booking').map((state) => (
                <option key={state} value={state}>
                  {statusT(state)}
                </option>
              ))}
            </Select>
          </label>
        }
      />

      <DataView
        items={visible}
        columns={columns}
        getKey={(b) => b.id}
        defaultSort={{ key: 'start', dir: 'desc' }}
        onSelect={(b) => router.push(`/admin/buchungen/${b.id}`)}
        caption={t('title')}
        openLabel={t('rowOpen')}
        empty={
          bookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={t('emptyTitle')}
              body={t('emptyBody')}
              action={
                <Button asChild variant="secondary">
                  <Link href="/admin/offerten">{t('emptyAction')}</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              compact
              title={t('filterEmptyTitle')}
              body={t('filterEmptyBody')}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setStatus('');
                  }}
                >
                  {t('filterReset')}
                </Button>
              }
            />
          )
        }
        /* Same strip as the requests and quotes lists — the quote a job came
           from and the invoice it produced are the two things this screen is
           asked for, and both were a menu away with no sign from the row of
           whether either existed. */
        rowActions={(b) => {
          const offer = offers.find((o) => o.id === b.offerId);
          const invoice = invoices.find((i) => i.bookingId === b.id);
          return (
            <RowActions>
              <RowAction href={`/admin/buchungen/${b.id}`} label={t('rowOpen')}>
                <CalendarCheck aria-hidden />
              </RowAction>
              {offer && (
                <RowAction
                  href={`/admin/offerten/${offer.id}`}
                  label={t('rowOpenOffer', { reference: offer.reference })}
                >
                  <FileText aria-hidden />
                </RowAction>
              )}
              {invoice && (
                <RowAction
                  href={`/admin/rechnungen/${invoice.id}`}
                  label={t('rowOpenInvoice', { reference: invoice.reference })}
                >
                  <Receipt aria-hidden />
                </RowAction>
              )}
            </RowActions>
          );
        }}
      />
    </div>
  );
}
