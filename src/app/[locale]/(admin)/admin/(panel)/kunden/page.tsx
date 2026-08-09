'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { Search } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/field';
import { useHydrated, useStore } from '@/mock/store';
import type { Customer } from '@/mock/schema';

/** Screen 64 — the customer list, with search across name, email and phone. */
export default function CustomersPage() {
  const t = useTranslations('admin.customers');
  const format = useFormatter();
  const router = useRouter();
  const hydrated = useHydrated();

  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.firstName, c.lastName, c.email, c.phone].join(' ').toLowerCase().includes(q),
    );
  }, [customers, query]);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: t('colName'),
      primary: true,
      cell: (c) => `${c.firstName} ${c.lastName}`,
    },
    {
      key: 'properties',
      header: t('colProperties'),
      trailing: true,
      align: 'end',
      cell: (c) => (
        <span data-numeric className="text-ink-secondary">
          {properties.filter((p) => p.customerId === c.id).length}
        </span>
      ),
    },
    {
      key: 'contact',
      header: t('colContact'),
      cell: (c) => (
        <span className="text-ink-secondary">
          {c.email}
          <span data-numeric className="block text-sm text-ink-tertiary">
            {c.phone}
          </span>
        </span>
      ),
    },
    {
      key: 'since',
      header: t('colSince'),
      align: 'end',
      cell: (c) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {format.dateTime(new Date(c.createdAt), 'short')}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>

      <label className="relative mt-6 block max-w-md">
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

      <DataView
        className="mt-6"
        items={filtered}
        columns={columns}
        getKey={(c) => c.id}
        onSelect={(c) => router.push(`/admin/kunden/${c.id}`)}
        caption={t('title')}
        empty={
          query ? (
            <EmptyState
              icon={Search}
              title={t('searchEmptyTitle')}
              body={t('searchEmptyBody', { query })}
            />
          ) : (
            <EmptyState title={t('emptyTitle')} body={t('emptyBody')} />
          )
        }
      />
    </div>
  );
}
