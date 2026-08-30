'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Filter, Search, X } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { Select } from '@/components/ui/field';
import { RowAction, RowActions } from '@/components/ui/row-actions';
import { ActionIcon } from '@/lib/action-icons';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { requestBadgeState } from '@/lib/offer-label';
import { statesOf } from '@/lib/status-registry';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { ServiceRequest } from '@/mock/schema';

/**
 * Screen 36 — the customer's own requests, newest first.
 *
 * The list is a list now rather than a handful of rows, so it carries the same
 * toolbar the admin queue does: search, then the dropdowns. A customer of two
 * years' standing arrives here with one of two questions — «wo ist die
 * Offerte, auf die ich warte» and «was habe ich damals für die Fenster
 * bezahlt» — and the second one is a search, not a filter. Paging back through
 * twenty rows to find a reference is not an answer.
 */
export default function AccountRequestsPage() {
  const t = useTranslations('account.requests');
  const appT = useTranslations('app');
  const statusLabel = useTranslations('status.request');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const { requests, properties, offers } = useAccount();
  const services = useStore((s) => s.services);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [service, setService] = useState('all');

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  /*
   * `draft` is left out on purpose. It is the office's half-taken phone call
   * and `useAccount` filters it out of this list, so offering it here would be
   * an option that can only ever return nothing — the exact shape of dead
   * control the rest of the panel has been having removed. Every other state
   * stays listed whether or not anything is in it: an option that vanished
   * because nothing is expired today would make the menu change shape between
   * visits, and «nichts gefunden» is the more honest answer.
   */
  const states = statesOf('request').filter((s) => s !== 'draft');

  const serviceName = (slug: string) =>
    services.find((s) => s.slug === slug)?.name[locale] ?? '';
  const propertyOf = (id: string) => properties.find((p) => p.id === id);
  const offerOf = (r: ServiceRequest) =>
    offers.find((o) => o.requestId === r.id && o.status !== 'draft');

  /* Read once per row and used by both the filter and the badge. They were the
     stored status, which no longer matches what the badge prints — and a menu
     that disagreed with the pill beside it would be worse than no menu. */
  const stateOf = (r: ServiceRequest) => requestBadgeState(r, offerOf(r), now);

  const q = query.trim().toLowerCase();
  const rows = [...requests]
    .filter((r) => (status === 'all' ? true : stateOf(r) === status))
    .filter((r) => (service === 'all' ? true : r.serviceSlug === service))
    /*
     * The three things actually printed on the row, and nothing behind it.
     * Searching the customer's own note would find rows on words the list
     * never shows, which reads as the filter having broken rather than as a
     * hit — the reference, the service and the address are what somebody is
     * looking at when they start typing.
     */
    .filter((r) => {
      if (!q) return true;
      const property = propertyOf(r.propertyId);
      return (
        r.reference.toLowerCase().includes(q) ||
        serviceName(r.serviceSlug).toLowerCase().includes(q) ||
        `${property?.street ?? ''} ${property?.postcode ?? ''} ${property?.city ?? ''}`
          .toLowerCase()
          .includes(q)
      );
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const filtering = Boolean(q) || status !== 'all' || service !== 'all';

  function reset() {
    setQuery('');
    setStatus('all');
    setService('all');
  }

  const columns: Column<ServiceRequest>[] = [
    {
      key: 'reference',
      header: t('colReference'),
      primary: true,
      cell: (r) => <span data-numeric>{r.reference}</span>,
    },
    {
      key: 'service',
      header: t('colService'),
      sortBy: (r) => serviceName(r.serviceSlug).toLowerCase(),
      cell: (r) => serviceName(r.serviceSlug) || '—',
    },
    {
      key: 'property',
      header: t('colProperty'),
      tableOnly: true,
      sortBy: (r) => propertyOf(r.propertyId)?.street?.toLowerCase() ?? null,
      cell: (r) => (
        <span className="text-ink-secondary">{propertyOf(r.propertyId)?.street ?? '—'}</span>
      ),
    },
    {
      /*
       * Sortable, like every table the office has and none the customer had.
       * Not the reference column: A-2510 sorts by our numbering, which is a
       * fact about our filing rather than anything the reader asked for — and
       * the list is already in date order, so it would only ever be a slower
       * way to get back to where it started.
       */
      key: 'created',
      header: t('colCreated'),
      align: 'end',
      sortBy: (r) => r.createdAt,
      cell: (r) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {format.dateTime(new Date(r.createdAt), 'short')}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      sortBy: (r) => stateOf(r),
      cell: (r) => <StatusBadge entity="request" state={stateOf(r)} size="sm" />,
    },
  ];

  return (
    <>
      <PageHeader title={t('title')} />

      {/*
        Shown whenever the account has a request at all, which is the same rule
        the other three lists in here now follow.

        It used to appear only above two rows or more, on the argument that one
        row under a search box and two menus is three controls that cannot do
        anything. True as far as it goes — but keying the chrome to the row
        count means the screen changes shape with the data, so a customer with
        one request and a customer with two are looking at different screens,
        and neither can be told where the filter is. The toolbar goes when the
        list is genuinely empty; there the empty state does the talking.
      */}
      {requests.length > 0 && (
        <Toolbar
          search={{
            value: query,
            onChange: setQuery,
            label: t('search'),
            clearLabel: appT('clearSearch'),
          }}
          /* Always, not only under a filter. It is `aria-live`, so it is the
             one thing that confirms a keystroke narrowed anything — and idle it
             still answers "how many do I have", which the rows only answer by
             being counted. */
          count={
            filtering
              ? appT('results', { shown: rows.length, total: requests.length })
              : appT('resultsAll', { total: requests.length })
          }
          filters={
            <>
              <label className="min-w-44">
                <span className="sr-only">{t('filterStatus')}</span>
                <Select
                  dense
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">
                    {t('filterStatus')}: {t('filterAll')}
                  </option>
                  {/* Labels out of the status registry, not the enum — the
                      option and the badge it filters have to read identically
                      or the customer is matching two vocabularies. */}
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {statusLabel(state)}
                    </option>
                  ))}
                </Select>
              </label>

              {/* The whole catalogue, not only the services this customer has
                  bought. A menu whose options changed with the account is one
                  nobody can be told about — and «Möbelmontage» quietly missing
                  reads as the company not offering it. */}
              <label className="min-w-44">
                <span className="sr-only">{t('filterService')}</span>
                <Select
                  dense
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
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
      )}

      <DataView
        items={rows}
        columns={columns}
        getKey={(r) => r.id}
        onSelect={(r) => router.push(`/konto/anfragen/${r.id}`)}
        caption={t('title')}
        /*
         * The row was already the link, but nothing on it said so — a table of
         * plain text that happens to be clickable is a thing you find by
         * accident. The eye is the same one the panel uses for "open this row",
         * and the quote it produced hangs off the row it came from rather than
         * making the customer match references across two screens.
         */
        rowActions={(r) => {
          const offer = offers.find(
            (o) => o.requestId === r.id && o.status !== 'draft',
          );
          return (
            <RowActions>
              <RowAction href={`/konto/anfragen/${r.id}`} label={t('rowOpen')}>
                <ActionIcon.open aria-hidden />
              </RowAction>
              {offer && (
                <RowAction href={`/offerte/${offer.id}`} label={t('rowOffer')}>
                  <ActionIcon.offer aria-hidden />
                </RowAction>
              )}
            </RowActions>
          );
        }}
        empty={
          /* Three different nothings, and only one of them is an invitation.
             "You have never sent us one" offers a new request; a search that
             missed and a filter that matched nothing must not — offering to
             start a request because somebody mistyped a reference would be
             reading their narrowing as a need. The search miss is split off
             from the filter miss because it can name the thing that failed,
             and «nichts zu "A-2149"» is usually enough for the reader to spot
             their own typo. */
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
