'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, Plus, Search } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DataView, type Column } from '@/components/ui/data-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination, paginate } from '@/components/ui/pagination';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Toolbar } from '@/components/ui/toolbar';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { statesOf } from '@/lib/status-registry';
import { elapsed, hoursSince } from '@/lib/elapsed';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { ServiceRequest } from '@/mock/schema';
import { cn } from '@/lib/cn';

const PER_PAGE = 25;

/** Screen 52 — filters by status, area and free text, per §17.2. */
export default function RequestsPage() {
  const t = useTranslations('admin.requests');
  const appT = useTranslations('app');
  const statusLabel = useTranslations('status.request');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const requests = useStore((s) => s.data.requests);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);

  const [status, setStatus] = useState('all');
  const [region, setRegion] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const nameOf = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };
  const propertyOf = (id: string) => properties.find((p) => p.id === id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests
      .filter((r) => (status === 'all' ? true : r.status === status))
      .filter((r) =>
        region === 'all' ? true : propertyOf(r.propertyId)?.postcode === region,
      )
      .filter((r) =>
        q
          ? r.reference.toLowerCase().includes(q) ||
            nameOf(r.customerId).toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, customers, properties, status, region, query]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const view = paginate(filtered, page, PER_PAGE);
  const filtering = Boolean(query) || status !== 'all' || region !== 'all';

  const columns: Column<ServiceRequest>[] = [
    {
      key: 'customer',
      header: t('colCustomer'),
      primary: true,
      sortBy: (r) => nameOf(r.customerId),
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-2">
          {nameOf(r.customerId)}
          {r.outOfArea && (
            <Chip tone="warning" icon={AlertTriangle} title={t('outOfArea')}>
              {propertyOf(r.propertyId)?.postcode}
            </Chip>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      sortBy: (r) => r.status,
      cell: (r) => <StatusBadge entity="request" state={r.status} size="sm" />,
    },
    {
      key: 'reference',
      header: t('colReference'),
      sortBy: (r) => r.reference,
      cell: (r) => (
        <span data-numeric className="text-ink-secondary">
          {r.reference}
        </span>
      ),
    },
    {
      key: 'service',
      header: t('colService'),
      cell: (r) => services.find((s) => s.slug === r.serviceSlug)?.name[locale] ?? '—',
    },
    {
      key: 'region',
      header: t('colRegion'),
      sortBy: (r) => propertyOf(r.propertyId)?.city ?? '',
      cell: (r) => propertyOf(r.propertyId)?.city ?? '—',
    },
    {
      key: 'received',
      header: t('colReceived'),
      align: 'end',
      sortBy: (r) => r.createdAt,
      cell: (r) => {
        const late =
          (r.status === 'new' || r.status === 'inReview') &&
          hoursSince(r.createdAt, now) > settings.responseTimeHours;
        return (
          <span
            data-numeric
            className={cn(
              'text-sm',
              late ? 'font-medium text-status-danger-fg' : 'text-ink-tertiary',
            )}
          >
            {elapsed(r.createdAt, now, locale)}
          </span>
        );
      },
    },
  ];

  const addButton = (
    <Button asChild>
      <Link href="/admin/anfragen/neu">
        <Plus className="size-4" aria-hidden />
        {t('addAction')}
      </Link>
    </Button>
  );

  return (
    <div className="mx-auto max-w-[100rem]">
      <PageHeader title={t('title')} actions={addButton} />

      {/*
        The filters used to sit bare on the page background with no result
        count, so "did that filter do anything" was answered by counting rows.
      */}
      <Toolbar
        search={{
          value: query,
          onChange: (value) => {
            setQuery(value);
            setPage(1);
          },
          label: t('search'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: filtered.length, total: requests.length })
            : appT('resultsAll', { total: requests.length })
        }
        filters={
          <>
            <label className="min-w-40">
              <span className="sr-only">{t('filterStatus')}</span>
              <Select
                dense
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">
                  {t('filterStatus')}: {t('filterAll')}
                </option>
                {/* Labels come from the status registry, not the enum — the
                    filter and the badge it filters must read identically. */}
                {statesOf('request').map((state) => (
                  <option key={state} value={state}>
                    {statusLabel(state)}
                  </option>
                ))}
              </Select>
            </label>

            <label className="min-w-40">
              <span className="sr-only">{t('filterRegion')}</span>
              <Select
                dense
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">
                  {t('filterRegion')}: {t('filterAll')}
                </option>
                {SERVED_REGIONS.map((r) => (
                  <option key={r.postcode} value={r.postcode}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </label>
          </>
        }
      />

      <DataView
        items={view.slice}
        columns={columns}
        getKey={(r) => r.id}
        onSelect={(r) => router.push(`/admin/anfragen/${r.id}`)}
        caption={t('title')}
        empty={
          filtering ? (
            <EmptyState
              icon={Search}
              title={t('searchEmptyTitle')}
              body={t('searchEmptyBody', { query: query || '—' })}
            />
          ) : (
            <EmptyState
              title={t('emptyTitle')}
              body={t('emptyBody')}
              action={addButton}
            />
          )
        }
      />

      <Pagination
        page={view.page}
        pageCount={view.pageCount}
        onPageChange={setPage}
        label={appT('pageLabel')}
        previousLabel={appT('pagePrevious')}
        nextLabel={appT('pageNext')}
        summary={appT('pageSummary', {
          from: view.from,
          to: view.to,
          total: view.total,
        })}
      />
    </div>
  );
}
