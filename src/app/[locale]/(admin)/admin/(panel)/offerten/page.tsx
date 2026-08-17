'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { CalendarCheck, CalendarClock, ExternalLink, FileText, MoreHorizontal, Package, RefreshCw, Repeat } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { DataView, type Column } from '@/components/ui/data-view';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
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

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const visible = offers
    .filter((o) => o.status !== 'draft')
    .sort((a, b) => (b.issuedAt ?? '').localeCompare(a.issuedAt ?? ''));

  const requestOf = (offer: Offer) => requests.find((r) => r.id === offer.requestId);
  const nameOf = (offer: Offer) =>
    customerName(customers.find((c) => c.id === requestOf(offer)?.customerId));

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
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (o) => (
        <StatusBadge
          entity="request"
          state={
            isExpired(o, now) && o.status === 'sent'
              ? 'expired'
              : o.status === 'sent'
                ? 'offerSent'
                : o.status === 'accepted'
                  ? 'accepted'
                  : o.status === 'revisionRequested'
                    ? 'revisionRequested'
                    : o.status === 'rejected'
                      ? 'rejected'
                      : 'expired'
          }
          size="sm"
        />
      ),
    },
    {
      key: 'customer',
      header: t('colCustomer'),
      sortBy: nameOf,
      cell: nameOf,
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
      key: 'coverage',
      header: t('colCoverage'),
      tableOnly: true,
      cell: (o) => {
        const coverage = offerCoverage(o, requestOf(o), subscriptions, credits, now);
        /* Payable is the norm, and a chip on every row saying "normal" is
           noise that hides the two rows where it matters. */
        if (coverage.kind === 'payable') {
          return <span className="text-ink-tertiary">—</span>;
        }
        return (
          <Chip tone="accent" icon={coverage.kind === 'package' ? Package : Repeat}>
            {coverage.kind === 'package'
              ? t('coveragePackage', { hours: coverage.hoursRemaining ?? 0 })
              : t('coverageSubscription')}
          </Chip>
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
    {
      key: 'payment',
      header: t('colPayment'),
      align: 'end',
      cell: (o) => {
        const payment = offerPayment(o.id, payments);
        if (!payment) {
          const coverage = offerCoverage(o, requestOf(o), subscriptions, credits, now);
          /* A covered job never produces a payment and never will. Leaving the
             cell blank would read as "not paid yet" for a job that owes
             nothing. */
          return (
            <span className="text-sm text-ink-tertiary">
              {coverage.kind === 'payable' ? '—' : t('paymentNotDue')}
            </span>
          );
        }
        return (
          <span className="flex flex-col items-end gap-1">
            <StatusBadge entity="payment" state={payment.status} size="sm" />
            <span className="text-xs text-ink-tertiary">{t(`method.${payment.method}`)}</span>
          </span>
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
    <div className="mx-auto max-w-[100rem]">
      <PageHeader title={t('title')} lead={t('lead')} />
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
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
        /*
         * The row led to exactly one place and every other move — read the
         * request it answers, open the job it became, check what the customer
         * sees, reissue a lapsed one — meant landing on the detail page first
         * and setting off again. The requests list has had this menu since
         * wave 6; the quotes list was the one that never got it.
         */
        rowActions={(o) => {
          const booking = offerBooking(o.id, bookings);
          const awaitingConfirmation = Boolean(
            o.proposedSlots?.length && !o.slotConfirmedAt,
          );
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={t('rowActions')}
                className="rounded-[var(--radius-sm)] p-1.5 text-ink-tertiary hover:bg-sunken hover:text-ink"
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/offerten/${o.id}`}>
                    <FileText className="size-4" aria-hidden />
                    {t('rowOpen')}
                  </Link>
                </DropdownMenuItem>
                {awaitingConfirmation && (
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/offerten/${o.id}#termin`}>
                      <CalendarClock className="size-4" aria-hidden />
                      {t('rowConfirmSlot')}
                    </Link>
                  </DropdownMenuItem>
                )}
                {booking && (
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/buchungen/${booking.id}`}>
                      <CalendarCheck className="size-4" aria-hidden />
                      {t('rowOpenBooking', { reference: booking.reference })}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href={`/admin/anfragen/${o.requestId}`}>
                    <RefreshCw className="size-4" aria-hidden />
                    {t('rowOpenRequest')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href={`/offerte/${o.id}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" aria-hidden />
                    {t('rowOpenAsCustomer')}
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }}
      />
    </div>
  );
}
