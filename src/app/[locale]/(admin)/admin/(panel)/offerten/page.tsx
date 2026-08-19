'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { Repeat, Search, X } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { Select } from '@/components/ui/field';
import { RowAction, RowActions } from '@/components/ui/row-actions';
import { ActionIcon } from '@/lib/action-icons';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Toolbar } from '@/components/ui/toolbar';
import { Chip } from '@/components/ui/chip';
import { daysLeft, isExpired, offerTotal } from '@/mock/engines/offers';
import {
  customerName,
  offerBooking,
  offerCoverage,
  offerPayment,
  offerRhythm,
} from '@/lib/offer-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Offer } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * The states a quote can actually be in on this screen.
 *
 * Not `statesOf('request')`: the badge borrows the request registry for its
 * colour, but a quote is never `new`, `inReview` or `cancelledByCustomer`, and
 * a filter offering those is a filter with dead options in it. `draft` is out
 * too — the list itself excludes drafts.
 */
const OFFER_STATES = [
  'sent',
  'revisionRequested',
  'accepted',
  'rejected',
  'expired',
] as const;

/** The badge reads from the request registry, so `sent` answers to `offerSent`. */
const STATE_LABEL_KEY: Record<(typeof OFFER_STATES)[number], string> = {
  sent: 'offerSent',
  revisionRequested: 'revisionRequested',
  accepted: 'accepted',
  rejected: 'rejected',
  expired: 'expired',
};

/**
 * The payment column has three shapes, and only one of them is a `Payment`
 * record — so the filter has to carry the other two as well, or "which jobs
 * owe us nothing?" stays unanswerable on the screen that shows it.
 */
const PAYMENT_FILTERS = ['succeeded', 'failed', 'pending', 'refunded', 'notDue', 'none'] as const;

/**
 * Screen 57 — quotes.
 *
 * The list answered four questions: who, how much, when sent, when it lapses.
 * It could not answer the ones actually asked of it in a working week — *what*
 * was quoted, whether it repeats, whether the money arrived, and whether the
 * job is billable at all or already covered by hours the customer bought
 * months ago. Every one of those was derivable from data the store already
 * held; none of them was on screen, so each was a trip to another list.
 *
 * The columns are derived rather than stored (see `lib/offer-facts.ts`) — a
 * `coveredBy` value written at quote time is wrong the moment a package runs
 * out of hours.
 */
export default function OffersPage() {
  const t = useTranslations('admin.offers');
  const appT = useTranslations('app');
  const statusLabel = useTranslations('status.request');
  const paymentLabel = useTranslations('status.payment');
  const methodLabel = useTranslations('status.method');
  const rhythmT = useTranslations('admin.rhythm');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const offers = useStore((s) => s.data.offers);
  const requests = useStore((s) => s.data.requests);
  const customers = useStore((s) => s.data.customers);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const credits = useStore((s) => s.data.credits);
  const payments = useStore((s) => s.data.payments);
  const bookings = useStore((s) => s.data.bookings);
  const services = useStore((s) => s.services);

  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');
  const [service, setService] = useState('all');
  const [query, setQuery] = useState('');

  const requestOf = (offer: Offer) => requests.find((r) => r.id === offer.requestId);
  const customerOf = (offer: Offer) =>
    customers.find((c) => c.id === requestOf(offer)?.customerId);
  const nameOf = (offer: Offer) => customerName(customerOf(offer));

  /* Derived, like every other column here — the stored `status` still says
     `sent` on a quote whose date has passed, and a filter that disagreed with
     the badge next to it would be worse than no filter. */
  const stateOf = (o: Offer) =>
    isExpired(o, now) && o.status === 'sent' ? 'expired' : o.status;

  const paymentStateOf = (o: Offer) => {
    const record = offerPayment(o.id, payments);
    if (record) return record.status;
    return offerCoverage(o, requestOf(o), subscriptions, credits, now).kind === 'payable'
      ? 'none'
      : 'notDue';
  };

  const all = useMemo(
    () =>
      offers
        .filter((o) => o.status !== 'draft')
        .sort((a, b) => (b.issuedAt ?? '').localeCompare(a.issuedAt ?? '')),
    [offers],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((o) => (status === 'all' ? true : stateOf(o) === status))
      .filter((o) => (payment === 'all' ? true : paymentStateOf(o) === payment))
      /* The service column has been on this list since it was rebuilt and had
         no filter behind it, so "show me every window-cleaning quote" meant
         reading 25 rows a page. It is the same question the requests queue
         already answers about requests. */
      .filter((o) => (service === 'all' ? true : requestOf(o)?.serviceSlug === service))
      .filter((o) => {
        if (!q) return true;
        const c = customerOf(o);
        return (
          o.reference.toLowerCase().includes(q) ||
          nameOf(o).toLowerCase().includes(q) ||
          (requestOf(o)?.reference ?? '').toLowerCase().includes(q) ||
          (c?.email ?? '').toLowerCase().includes(q)
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    all,
    requests,
    customers,
    payments,
    subscriptions,
    credits,
    status,
    payment,
    service,
    query,
    now,
  ]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering =
    status !== 'all' || payment !== 'all' || service !== 'all' || Boolean(query);

  function reset() {
    setStatus('all');
    setPayment('all');
    setService('all');
    setQuery('');
  }

  const columns: Column<Offer>[] = [
    {
      key: 'reference',
      header: t('colReference'),
      primary: true,
      sortBy: (o) => o.reference,
      cell: (o) => (
        <span data-numeric className="inline-flex items-center gap-2">
          {o.reference}
          {o.version > 1 && <Chip tone="neutral">{t('version', { n: o.version })}</Chip>}
        </span>
      ),
    },
    {
      key: 'customer',
      header: t('colCustomer'),
      sortBy: nameOf,
      /* The name was plain text, so the one screen that lists every quote a
         person has had gave no way to reach the person. Stops propagation —
         the row underneath goes to the quote, and tapping the name should not
         be a coin flip between the two. */
      cell: (o) => {
        const customer = customerOf(o);
        if (!customer) return <span className="text-ink-tertiary">—</span>;
        return (
          <Link
            href={`/admin/kunden/${customer.id}`}
            onClick={(e) => e.stopPropagation()}
            className="rounded-[var(--radius-xs)] underline-offset-4 hover:text-ink-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
          >
            {customerName(customer)}
          </Link>
        );
      },
    },
    {
      /* Service and rhythm read as one fact — "Unterhaltsreinigung, weekly" is
         a different job from "Unterhaltsreinigung, once". Splitting them into
         two columns would have cost width to say half a thing twice. */
      key: 'service',
      header: t('colService'),
      cell: (o) => {
        const request = requestOf(o);
        const service = services.find((s) => s.slug === request?.serviceSlug);
        const rhythm = offerRhythm(request);
        return (
          <span className="flex flex-col gap-0.5">
            <span>{service?.name[locale] ?? '—'}</span>
            <span className="inline-flex items-center gap-1 text-xs text-ink-tertiary">
              {rhythm !== 'oneTime' && <Repeat className="size-3 shrink-0" aria-hidden />}
              {rhythmT(rhythm)}
            </span>
          </span>
        );
      },
    },
    {
      key: 'total',
      header: t('colTotal'),
      align: 'end',
      sortBy: (o) => offerTotal(o),
      cell: (o) => <Money amount={offerTotal(o)} />,
    },
    /*
     * Where the quote stands, then where the money stands, then how it was
     * paid — the three read left to right as one sentence about this row.
     * Status used to open the row and the coverage chip sat between the two
     * halves of that sentence; coverage is now on the detail, where there is
     * room to say what is left rather than only that something covers it.
     */
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      cell: (o) => {
        const state = stateOf(o);
        return (
          <StatusBadge
            entity="request"
            state={state === 'sent' ? 'offerSent' : state}
            size="sm"
          />
        );
      },
    },
    {
      key: 'paymentStatus',
      header: t('colPayment'),
      align: 'end',
      cell: (o) => {
        const payment = offerPayment(o.id, payments);
        if (payment) {
          return <StatusBadge entity="payment" state={payment.status} size="sm" />;
        }
        const coverage = offerCoverage(o, requestOf(o), subscriptions, credits, now);
        /* A covered job never produces a payment and never will. Leaving the
           cell blank would read as "not paid yet" for a job that owes
           nothing. */
        return (
          <span className="text-sm text-ink-tertiary">
            {coverage.kind === 'payable' ? '—' : t('paymentNotDue')}
          </span>
        );
      },
    },
    {
      /* Stacked under the badge before, at a size that made "TWINT" and "Karte"
         read as a footnote to the status rather than an answer to "how did
         they pay" — which is the question this column is asked when a payment
         has to be traced. */
      key: 'paymentMethod',
      header: t('colMethod'),
      align: 'end',
      cell: (o) => {
        const payment = offerPayment(o.id, payments);
        return payment ? (
          <span className="text-sm text-ink-secondary">{methodLabel(payment.method)}</span>
        ) : (
          <span className="text-sm text-ink-tertiary">—</span>
        );
      },
    },
    {
      key: 'validity',
      header: t('colValidity'),
      align: 'end',
      sortBy: (o) => o.issuedAt ?? null,
      cell: (o) => {
        const left = daysLeft(o, now);
        const gone = left !== null && left <= 0;
        return (
          <span className="flex flex-col items-end gap-0.5">
            <span data-numeric className="text-sm text-ink-secondary">
              {o.issuedAt ? format.dateTime(new Date(o.issuedAt), 'short') : '—'}
            </span>
            <span
              data-numeric
              className={cn('text-xs', gone ? 'text-status-danger-fg' : 'text-ink-tertiary')}
            >
              {left === null ? '—' : gone ? t('expired') : t('expiresIn', { days: left })}
            </span>
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} />

      {/*
        The list opened on every quote ever issued, newest first, and that was
        the only view of it. The two questions a working week actually asks —
        "what is still out there waiting for an answer" and "what has been paid"
        — were both a scroll and a squint. Status and payment are the two
        columns the screen already derives, so filtering on them costs nothing
        the page was not computing anyway.
      */}
      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('search'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: visible.length, total: all.length })
            : appT('resultsAll', { total: all.length })
        }
        filters={
          <>
            <label className="min-w-40">
              <span className="sr-only">{t('filterStatus')}</span>
              <Select dense value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">
                  {t('filterStatus')}: {t('filterAll')}
                </option>
                {OFFER_STATES.map((state) => (
                  <option key={state} value={state}>
                    {statusLabel(STATE_LABEL_KEY[state])}
                  </option>
                ))}
              </Select>
            </label>

            <label className="min-w-40">
              <span className="sr-only">{t('filterPayment')}</span>
              <Select dense value={payment} onChange={(e) => setPayment(e.target.value)}>
                <option value="all">
                  {t('filterPayment')}: {t('filterAll')}
                </option>
                {PAYMENT_FILTERS.map((state) => (
                  <option key={state} value={state}>
                    {state === 'notDue'
                      ? t('paymentNotDue')
                      : state === 'none'
                        ? t('filterPaymentNone')
                        : paymentLabel(state)}
                  </option>
                ))}
              </Select>
            </label>

            <label className="min-w-40">
              <span className="sr-only">{t('filterService')}</span>
              <Select dense value={service} onChange={(e) => setService(e.target.value)}>
                <option value="all">
                  {t('filterService')}: {t('filterAll')}
                </option>
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name[locale]}
                  </option>
                ))}
              </Select>
            </label>

            {filtering && (
              <Button size="sm" variant="ghost" onClick={reset}>
                <X className="size-3.5" aria-hidden />
                {t('filterReset')}
              </Button>
            )}
          </>
        }
      />

      <DataView
        items={visible}
        columns={columns}
        getKey={(o) => o.id}
        /* Was `/offerte/${o.id}` — the customer-facing page, whose only exit
           is a hardcoded link to the marketing home page. Screen 57 now has a
           detail view inside the panel. */
        onSelect={(o) => router.push(`/admin/offerten/${o.id}`)}
        caption={t('title')}
        openLabel={t('rowOpen')}
        empty={
          filtering ? (
            <EmptyState
              icon={Search}
              title={t('searchEmptyTitle')}
              body={t('searchEmptyBody')}
              action={
                <Button variant="secondary" onClick={reset}>
                  {t('filterReset')}
                </Button>
              }
            />
          ) : (
            <EmptyState title={t('emptyTitle')} body={t('emptyBody')} />
          )
        }
        /*
         * The menu was two clicks to reach anything and said nothing from the
         * row: whether a quote had produced a booking, or was sitting on three
         * dates waiting for us, was only visible once it was open. As icons the
         * conditional two announce themselves by existing.
         */
        rowActions={(o) => {
          const booking = offerBooking(o.id, bookings);
          const awaitingConfirmation = Boolean(
            o.proposedSlots?.length && !o.slotConfirmedAt,
          );
          return (
            <RowActions>
              <RowAction href={`/admin/offerten/${o.id}`} label={t('rowOpen')}>
                <ActionIcon.open aria-hidden />
              </RowAction>
              {awaitingConfirmation && (
                <RowAction
                  href={`/admin/offerten/${o.id}#termin`}
                  label={t('rowConfirmSlot')}
                  className="text-status-warning-fg"
                >
                  <ActionIcon.confirmSlot aria-hidden />
                </RowAction>
              )}
              {booking && (
                <RowAction
                  href={`/admin/buchungen/${booking.id}`}
                  label={t('rowOpenBooking', { reference: booking.reference })}
                >
                  <ActionIcon.booking aria-hidden />
                </RowAction>
              )}
              <RowAction
                href={`/admin/anfragen/${o.requestId}`}
                label={t('rowOpenRequest')}
              >
                <ActionIcon.request aria-hidden />
              </RowAction>
              <RowAction
                href={`/offerte/${o.id}`}
                label={t('rowOpenAsCustomer')}
                external
              >
                <ActionIcon.customerView aria-hidden />
              </RowAction>
            </RowActions>
          );
        }}
      />
    </div>
  );
}
