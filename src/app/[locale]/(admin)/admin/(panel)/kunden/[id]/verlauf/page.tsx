'use client';

import { use, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { History, Search } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import {
  HISTORY_KINDS,
  customerHistory,
  type HistoryEntry,
  type HistoryKind,
} from '@/lib/customer-history';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { RecordLink } from '@/components/ui/record-link';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { useHydrated, useStore } from '@/mock/store';

const KIND_KEY: Record<HistoryKind, string> = {
  request: 'typeRequest',
  offer: 'typeOffer',
  booking: 'typeBooking',
  invoice: 'typeInvoice',
};

/**
 * Screen 65a — one customer's whole history, searchable.
 *
 * The record screen used to carry the entire timeline inline, unfiltered. That
 * is fine for the customer who called twice and useless for the one who has
 * been on a plan for three years: "when was the last move-out clean?" and "did
 * we ever quote them for windows?" were both answered by scrolling, and the
 * record's own contact details were pushed off the first screen to make room.
 *
 * So the record keeps the last five and this screen keeps all of it, with the
 * two filters those questions actually need: what kind of thing, and when.
 * Both read from `lib/customer-history.ts`, so the short list and the long one
 * cannot disagree about what happened.
 */
export default function CustomerHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('admin.customerHistory');
  const ct = useTranslations('admin.customer');
  const appT = useTranslations('app');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const hydrated = useHydrated();

  const customers = useStore((s) => s.data.customers);
  const requests = useStore((s) => s.data.requests);
  const offers = useStore((s) => s.data.offers);
  const bookings = useStore((s) => s.data.bookings);
  const invoices = useStore((s) => s.data.invoices);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const services = useStore((s) => s.services);

  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | HistoryKind>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const entries = useMemo(
    () =>
      customerHistory(id, {
        requests,
        offers,
        bookings,
        invoices,
        subscriptions,
        services,
        locale,
      }),
    [id, requests, offers, bookings, invoices, subscriptions, services, locale],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    /* `<input type="date">` gives YYYY-MM-DD and every `at` is a full ISO
       string, so the first ten characters compare as calendar days rather than
       drifting by the reader's offset. */
    const fromKey = from || null;
    const toKey = to || null;

    return entries
      .filter((e) => (kind === 'all' ? true : e.kind === kind))
      .filter((e) => (fromKey ? e.at.slice(0, 10) >= fromKey : true))
      .filter((e) => (toKey ? e.at.slice(0, 10) <= toKey : true))
      .filter((e) =>
        q
          ? e.reference.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q)
          : true,
      );
  }, [entries, kind, from, to, query]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const customer = customers.find((c) => c.id === id);
  if (!customer) {
    return (
      <EmptyState
        icon={History}
        headingLevel={1}
        title={t('notFound')}
        body={t('emptyBody')}
        action={
          <Button onClick={() => router.push('/admin/kunden')}>{ct('back')}</Button>
        }
      />
    );
  }

  const name = `${customer.firstName} ${customer.lastName}`;
  const filtering = kind !== 'all' || Boolean(from) || Boolean(to) || Boolean(query);

  function reset() {
    setKind('all');
    setFrom('');
    setTo('');
    setQuery('');
  }

  const columns: Column<HistoryEntry>[] = [
    {
      key: 'reference',
      header: t('colReference'),
      primary: true,
      sortBy: (e) => e.reference,
      cell: (e) => (
        <span data-numeric className="font-medium">
          {e.reference}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      sortBy: (e) => e.badge.state,
      cell: (e) => <StatusBadge entity={e.badge.entity} state={e.badge.state} size="sm" />,
    },
    {
      key: 'when',
      header: t('colWhen'),
      sortBy: (e) => e.at,
      cell: (e) => (
        <span data-numeric className="text-sm text-ink-secondary">
          {e.at ? format.dateTime(new Date(e.at), 'short') : '—'}
        </span>
      ),
    },
    {
      key: 'kind',
      header: t('colType'),
      sortBy: (e) => e.kind,
      cell: (e) => <Chip>{ct(KIND_KEY[e.kind])}</Chip>,
    },
    {
      key: 'detail',
      header: t('colDetail'),
      cell: (e) => <span className="text-ink-secondary">{e.detail}</span>,
    },
    {
      /* Only invoices carry one. A blank cell on the other three is the honest
         rendering: a request has no amount, it is not an amount of zero. */
      key: 'amount',
      header: t('colAmount'),
      align: 'end',
      trailing: true,
      sortBy: (e) => e.amount ?? null,
      cell: (e) =>
        e.amount == null ? (
          <span className="text-ink-tertiary">—</span>
        ) : (
          <Money amount={e.amount} />
        ),
    },
  ];

  return (
    <div>
      {/* The name qualifies the title — "History" alone does not say whose, and
          this screen is reachable from a link that no longer shows the record.
          Not a breadcrumb trail: no other detail screen in the panel has one,
          and the back link already goes where the second crumb would. */}
      <PageHeader
        back={{ href: `/admin/kunden/${customer.id}`, label: t('back') }}
        title={t('title')}
        meta={
          <RecordLink href={`/admin/kunden/${customer.id}`} className="text-xl">
            {name}
          </RecordLink>
        }
        lead={t('lead')}
      />

      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('search'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: filtered.length, total: entries.length })
            : appT('resultsAll', { total: entries.length })
        }
        filters={
          <>
            <label className="min-w-36">
              <span className="sr-only">{t('filterType')}</span>
              <Select
                dense
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
              >
                <option value="all">{t('allTypes')}</option>
                {HISTORY_KINDS.map((value) => (
                  <option key={value} value={value}>
                    {ct(KIND_KEY[value])}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex items-center gap-1.5 text-sm">
              <span className="text-ink-tertiary">{t('from')}</span>
              <Input
                dense
                type="date"
                value={from}
                max={to || undefined}
                className="w-auto"
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <span className="text-ink-tertiary">{t('to')}</span>
              <Input
                dense
                type="date"
                value={to}
                min={from || undefined}
                className="w-auto"
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </>
        }
        actions={
          filtering ? (
            <Button variant="quiet" size="sm" onClick={reset}>
              {t('reset')}
            </Button>
          ) : undefined
        }
      />

      <DataView
        items={filtered}
        columns={columns}
        getKey={(e) => `${e.kind}-${e.id}`}
        onSelect={(e) => router.push(e.href)}
        openLabel={t('rowOpen')}
        caption={t('title')}
        defaultSort={{ key: 'when', dir: 'desc' }}
        empty={
          filtering ? (
            <EmptyState
              icon={Search}
              title={t('filteredEmptyTitle')}
              body={t('filteredEmptyBody')}
              action={
                <Button variant="secondary" onClick={reset}>
                  {t('reset')}
                </Button>
              }
            />
          ) : (
            <EmptyState icon={History} title={t('emptyTitle')} body={t('emptyBody')} />
          )
        }
      />
    </div>
  );
}
