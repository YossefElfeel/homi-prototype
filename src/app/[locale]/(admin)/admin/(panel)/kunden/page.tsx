'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { Plus, Search } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
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
      /*
       * `colStatus`, `active` and `inactive` were translated in all four
       * locales and rendered by nothing. A closed account (§15 — the record
       * survives because invoices hang off it) was indistinguishable from a
       * live one, so the list invited you to quote somebody who had left.
       */
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (c) =>
        c.status === 'active' ? (
          <span className="text-sm text-ink-tertiary">{t('active')}</span>
        ) : (
          <span className="text-sm font-medium text-ink-secondary">{t('inactive')}</span>
        ),
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

  const addButton = (
    <Button asChild>
      <Link href="/admin/kunden/neu">
        <Plus className="size-4" aria-hidden />
        {t('addAction')}
      </Link>
    </Button>
  );

  return (
    <div className="max-w-6xl">
      <PageHeader title={t('title')} actions={addButton} />

      <label className="relative block max-w-md">
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
            /* The empty state used to explain why the list was empty and then
               leave you there. On the "Tag 1" scenario that is the first
               screen the owner sees, so it is also the first place the create
               path has to exist. */
            <EmptyState
              title={t('emptyTitle')}
              body={t('emptyBody')}
              action={addButton}
            />
          )
        }
      />
    </div>
  );
}
