'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Filter, Search, X } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DataView, type Column } from '@/components/ui/data-view';
import { Select } from '@/components/ui/field';
import { RowAction, RowActions } from '@/components/ui/row-actions';
import { ActionIcon } from '@/lib/action-icons';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Money } from '@/components/ui/money';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { offerBadgeState } from '@/lib/offer-label';
import { daysLeft, offerTotal } from '@/mock/engines/offers';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Offer } from '@/mock/schema';

/**
 * The states one of *these* quotes can be in.
 *
 * Not `statesOf('request')`, whose vocabulary the badge borrows: a quote is
 * never `new`, `inReview` or cancelled, and `draft` never leaves the office.
 * A menu carrying options that can only ever return nothing is the dead
 * control this pass exists to remove.
 */
const OFFER_STATES = [
  'offerSent',
  'revisionRequested',
  'accepted',
  'rejected',
  'expired',
] as const;

/**
 * Screen 38 — quotes.
 *
 * The expiry warning appears at seven days rather than on the last day. §9.3
 * gives a quote a fixed life, and a customer who finds out it lapsed on the
 * morning it lapsed has been told too late to act.
 *
 * It was the only list in the account with no toolbar over it: eleven rows,
 * paged at ten, and no way to ask «welche warten noch auf mich» or to find the
 * one from March by its reference. The requests list beside it and the office's
 * own quote queue both answer those; this one made you page and read.
 */
export default function AccountOffersPage() {
  const t = useTranslations('account.offers');
  const appT = useTranslations('app');
  const statusLabel = useTranslations('status.request');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const { offers, requests } = useAccount();
  const services = useStore((s) => s.services);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const requestOf = (o: Offer) => requests.find((r) => r.id === o.requestId);
  const serviceName = (o: Offer) =>
    services.find((s) => s.slug === requestOf(o)?.serviceSlug)?.name[locale] ?? '';

  /* The date decides, not the stored value — the same rule the badge reads, so
     picking «Abgelaufen» from the menu cannot return a row badged otherwise. */
  const stateOf = (o: Offer) => offerBadgeState(o, now);

  const q = query.trim().toLowerCase();
  const all = offers.filter((o) => o.status !== 'draft');
  const rows = all
    .filter((o) => (status === 'all' ? true : stateOf(o) === status))
    /* Reference and service: the two things printed on the row. Searching
       anything the row does not show reads as the box being broken rather than
       as a hit. */
    .filter(
      (o) =>
        !q ||
        o.reference.toLowerCase().includes(q) ||
        serviceName(o).toLowerCase().includes(q),
    )
    /* Newest first. The list had no order at all — it came out in whatever
       sequence the store happened to hold, so the quote you are waiting on
       could sit under two years of settled ones. Left as the array order
       rather than a `defaultSort` so that clearing a column sort lands back
       here instead of on the seed's order. */
    .sort((a, b) => ((a.issuedAt ?? '') < (b.issuedAt ?? '') ? 1 : -1));

  const filtering = Boolean(q) || status !== 'all';

  function reset() {
    setQuery('');
    setStatus('all');
  }

  const columns: Column<Offer>[] = [
    {
      key: 'reference',
      header: t('colReference'),
      primary: true,
      cell: (o) => <span data-numeric>{o.reference}</span>,
    },
    {
      key: 'service',
      header: t('colService'),
      tableOnly: true,
      sortBy: (o) => serviceName(o).toLowerCase(),
      cell: (o) => serviceName(o) || '—',
    },
    {
      key: 'total',
      header: t('colTotal'),
      align: 'end',
      sortBy: (o) => offerTotal(o),
      cell: (o) => <Money amount={offerTotal(o)} />,
    },
    {
      key: 'valid',
      header: t('colValid'),
      align: 'end',
      sortBy: (o) => o.expiresAt ?? null,
      cell: (o) => {
        const left = daysLeft(o, now);
        return (
          <span className="flex flex-col items-end gap-1">
            <span data-numeric className="text-sm text-ink-tertiary">
              {o.expiresAt ? format.dateTime(new Date(o.expiresAt), 'short') : '—'}
            </span>
            {/* Was the one status-coloured thing in the customer area built by
                hand out of raw `status-warning` classes, a copy of `Chip` that
                had already drifted a step off it. */}
            {o.status === 'sent' && left !== null && left <= 7 && left >= 0 && (
              <Chip tone="warning">{t('expiresSoon', { days: left })}</Chip>
            )}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      sortBy: (o) => stateOf(o),
      // Offer states are a subset of the request vocabulary — all but one.
      // A quote that has gone out is `sent`, and the request registry calls
      // that `offerSent`, so this printed the literal «status.request.sent»
      // in the pill on every open quote. The two other screens that badge a
      // quote had each fixed it inline; the rule lives in `offer-label` now.
      cell: (o) => <StatusBadge entity="request" state={stateOf(o)} size="sm" />,
    },
  ];

  return (
    <>
      <PageHeader title={t('title')} />

      {all.length > 0 && (
        <Toolbar
          search={{
            value: query,
            onChange: setQuery,
            label: t('search'),
            clearLabel: appT('clearSearch'),
          }}
          count={
            filtering
              ? appT('results', { shown: rows.length, total: all.length })
              : appT('resultsAll', { total: all.length })
          }
          filters={
            <>
              <label className="min-w-44">
                <span className="sr-only">{t('filterStatus')}</span>
                <Select dense value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="all">
                    {t('filterStatus')}: {t('filterAll')}
                  </option>
                  {/* Labels out of the status registry, so the option and the
                      badge it filters read identically. */}
                  {OFFER_STATES.map((state) => (
                    <option key={state} value={state}>
                      {statusLabel(state)}
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
      )}

      <DataView
        items={rows}
        columns={columns}
        getKey={(o) => o.id}
        onSelect={(o) => router.push(`/offerte/${o.id}`)}
        caption={t('title')}
        /* The quote and the request it answers are the two records a customer
           compares when a price surprises them, and until now getting from one
           to the other meant leaving for the menu and coming back. */
        rowActions={(o) => (
          <RowActions>
            <RowAction href={`/offerte/${o.id}`} label={t('rowOpen')}>
              <ActionIcon.open aria-hidden />
            </RowAction>
            <RowAction href={`/konto/anfragen/${o.requestId}`} label={t('rowRequest')}>
              <ActionIcon.request aria-hidden />
            </RowAction>
          </RowActions>
        )}
        empty={
          /* Three nothings, and only the last is an invitation: offering to
             start a request because somebody mistyped a reference would read
             their narrowing as a need. */
          q ? (
            <EmptyState
              icon={Search}
              title={t('searchEmptyTitle')}
              body={t('searchEmptyBody', { query })}
              action={
                <Button variant="secondary" onClick={reset}>
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
                <Button variant="secondary" onClick={reset}>
                  {t('filterReset')}
                </Button>
              }
            />
          ) : (
            <EmptyState
              title={t('emptyTitle')}
              body={t('emptyBody')}
              /* A quote is something we send, so there is nothing here the
                 customer can do to produce one directly — but the request that
                 earns one is one click away, and an empty state that names no
                 way out is the page this rule exists to prevent. */
              action={
                <Button asChild>
                  <Link href="/anfrage">
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
