'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, Search } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { DataView, type Column } from '@/components/ui/data-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/field';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { statesOf } from '@/lib/status-registry';
import { elapsed, hoursSince } from '@/lib/elapsed';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { ServiceRequest } from '@/mock/schema';
import { cn } from '@/lib/cn';

/** Screen 52 — filters by status, area and free text, per §17.2. */
export default function RequestsPage() {
  const t = useTranslations('admin.requests');
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

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const columns: Column<ServiceRequest>[] = [
    {
      key: 'customer',
      header: t('colCustomer'),
      primary: true,
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-2">
          {nameOf(r.customerId)}
          {r.outOfArea && (
            <span
              title={t('outOfArea')}
              className="inline-flex items-center gap-1 rounded-sm border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-[0.6875rem] text-status-warning-fg"
            >
              <AlertTriangle className="size-3" aria-hidden />
              {propertyOf(r.propertyId)?.postcode}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (r) => <StatusBadge entity="request" state={r.status} size="sm" />,
    },
    {
      key: 'reference',
      header: t('colReference'),
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
      cell: (r) => propertyOf(r.propertyId)?.city ?? '—',
    },
    {
      key: 'received',
      header: t('colReceived'),
      align: 'end',
      cell: (r) => {
        const late =
          (r.status === 'new' || r.status === 'inReview') &&
          hoursSince(r.createdAt, now) > settings.responseTimeHours;
        return (
          <span
            data-numeric
            className={cn('text-sm', late ? 'font-medium text-status-danger-fg' : 'text-ink-tertiary')}
          >
            {elapsed(r.createdAt, now, locale)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">{t('search')}</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search')}
            className="pl-10"
          />
        </label>

        <label className="min-w-40">
          <span className="sr-only">{t('filterStatus')}</span>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">
              {t('filterStatus')}: {t('filterAll')}
            </option>
            {/* Labels come from the status registry, not the enum — the filter
                and the badge it filters must read identically. */}
            {statesOf('request').map((state) => (
              <option key={state} value={state}>
                {statusLabel(state)}
              </option>
            ))}
          </Select>
        </label>

        <label className="min-w-40">
          <span className="sr-only">{t('filterRegion')}</span>
          <Select value={region} onChange={(e) => setRegion(e.target.value)}>
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
      </div>

      <DataView
        className="mt-6"
        items={filtered}
        columns={columns}
        getKey={(r) => r.id}
        onSelect={(r) => router.push(`/admin/anfragen/${r.id}`)}
        caption={t('title')}
        empty={
          query || status !== 'all' || region !== 'all' ? (
            <EmptyState
              icon={Search}
              title={t('searchEmptyTitle')}
              body={t('searchEmptyBody', { query: query || '—' })}
            />
          ) : (
            <EmptyState title={t('emptyTitle')} body={t('emptyBody')} />
          )
        }
      />
    </div>
  );
}
