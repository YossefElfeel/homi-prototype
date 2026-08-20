'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { CalendarDays, Repeat } from 'lucide-react';

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
import { bookingAmount, bookingPaymentState, customerName } from '@/lib/offer-facts';
import { ActionIcon } from '@/lib/action-icons';
import { statesOf } from '@/lib/status-registry';
import { useHydrated, useStore } from '@/mock/store';
import type { Booking } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * The four the derivation can return, in the order the money moves.
 *
 * «Covered» is on the list because a plan visit is neither paid nor owed for
 * on its own — the monthly charge settled it — and a filter that had to file
 * it under one of the other three would be wrong whichever it picked.
 */
const PAYMENT_STATES = ['paid', 'pending', 'unpaid', 'covered'] as const;

/** A finished job is history — it can be read, not moved. Same list the
    booking detail and the calendar's row menu close their actions on. */
const SETTLED: Booking['status'][] = [
  'completed',
  'invoiced',
  'closed',
  'cancelled',
  'noAccess',
];

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
  const payments = useStore((s) => s.data.payments);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const plans = useStore((s) => s.plans);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [paid, setPaid] = useState('');

  const nameOf = (b: Booking) =>
    customerName(customers.find((c) => c.id === b.customerId));

  const paymentOf = (b: Booking) => bookingPaymentState(b, payments, invoices);

  const amountOf = (b: Booking) =>
    bookingAmount(b, {
      offers,
      invoices,
      subscriptions,
      plans,
      services,
      hourlyRate: settings.hourlyRate,
    });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...bookings]
      .filter((b) => !status || b.status === status)
      /* The list had a status filter and no money filter, so "who still owes
         us" — the question a Friday afternoon is made of — meant reading the
         invoice column down the page and holding the count in your head. */
      .filter((b) => !paid || paymentOf(b) === paid)
      .filter((b) => {
        if (!q) return true;
        const customer = customers.find((c) => c.id === b.customerId);
        return (
          b.reference.toLowerCase().includes(q) ||
          `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.start.localeCompare(a.start));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, customers, invoices, payments, query, status, paid]);

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
      /*
       * Was the quote total or a dash, and a dash for four rows out of five:
       * only a job that came off a quote had one. The amount is derived now,
       * and the line under it says which record it came off — a plan share
       * and an hourly estimate are not the same claim as an issued invoice,
       * and a column printing all three as bare francs said they were.
       */
      key: 'amount',
      header: t('colAmount'),
      align: 'end',
      tableOnly: true,
      sortBy: (b) => amountOf(b).amount,
      cell: (b) => {
        const { amount, basis } = amountOf(b);
        return (
          <span className="flex flex-col items-end gap-0.5">
            <Money
              amount={amount}
              /* The only one of the four that is not a total: the plan is
                 billed monthly and this is one visit's share of it. */
              per={basis === 'plan' ? 'visit' : 'none'}
              emphasis={basis === 'estimate' ? 'quiet' : 'default'}
            />
            <span className="text-xs text-ink-tertiary">{t(`amount_${basis}`)}</span>
          </span>
        );
      },
    },
    {
      /*
       * Derived rather than read off one record, because there is no single
       * record to read: a job paid at the quote has no invoice, and one
       * invoiced afterwards has no payment. Next to the invoice column so the
       * two together say how the money came and where it got to.
       */
      key: 'paid',
      header: t('colPaid'),
      align: 'end',
      tableOnly: true,
      sortBy: (b) => paymentOf(b),
      cell: (b) => {
        const state = paymentOf(b);
        return (
          <span
            className={cn(
              'text-sm',
              state === 'paid' && 'text-status-success-fg',
              state === 'pending' && 'text-status-warning-fg',
              state === 'unpaid' && 'text-status-danger-fg',
              state === 'covered' && 'text-ink-tertiary',
            )}
          >
            {t(`paid_${state}`)}
          </span>
        );
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
    <div>
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
          query || status || paid
            ? appT('results', { shown: visible.length, total: bookings.length })
            : appT('resultsAll', { total: bookings.length })
        }
        filters={
          <>
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

            <label className="min-w-40">
              <span className="sr-only">{t('filterPaid')}</span>
              <Select dense value={paid} onChange={(e) => setPaid(e.target.value)}>
                <option value="">
                  {t('filterPaid')}: {t('filterAll')}
                </option>
                {PAYMENT_STATES.map((state) => (
                  <option key={state} value={state}>
                    {t(`paid_${state}`)}
                  </option>
                ))}
              </Select>
            </label>
          </>
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
                <ActionIcon.open aria-hidden />
              </RowAction>
              {/*
                Moving a job is the one thing this list is opened to do that it
                could not do. The calendar's row menu has offered it since it
                gained one; here the only route was open the booking, find the
                actions column, press Verschieben — three steps for the action
                a customer is on the phone about.

                Deep-links to the panel rather than reimplementing it, exactly
                as the calendar menu does. Hidden once the job is settled: a
                finished job cannot be moved, and an item that refuses is worse
                than one that is not there.
              */}
              {!SETTLED.includes(b.status) && (
                <RowAction
                  href={`/admin/buchungen/${b.id}?action=reschedule`}
                  label={t('rowReschedule')}
                >
                  <ActionIcon.reschedule aria-hidden />
                </RowAction>
              )}
              {offer && (
                <RowAction
                  href={`/admin/offerten/${offer.id}`}
                  label={t('rowOpenOffer', { reference: offer.reference })}
                >
                  <ActionIcon.offer aria-hidden />
                </RowAction>
              )}
              {invoice && (
                <RowAction
                  href={`/admin/rechnungen/${invoice.id}`}
                  label={t('rowOpenInvoice', { reference: invoice.reference })}
                >
                  <ActionIcon.invoice aria-hidden />
                </RowAction>
              )}
            </RowActions>
          );
        }}
      />
    </div>
  );
}
