'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { Archive, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/i18n/navigation';
import { ActionIcon } from '@/lib/action-icons';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import {
  RowAction,
  RowActionButton,
  RowActions,
  RowActionsDivider,
} from '@/components/ui/row-actions';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Customer } from '@/mock/schema';

/** Screen 64 — the customer list, with search across name, email and phone. */
export default function CustomersPage() {
  const t = useTranslations('admin.customers');
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const updateCustomer = useStore((s) => s.updateCustomer);
  const [query, setQuery] = useState('');
  /*
   * Archiving is what "delete" means for a customer, so the archive has to be
   * somewhere you can look. A soft delete with no view of what it swallowed is
   * indistinguishable from a real one — right up to the day somebody needs the
   * record back.
   */
  const [tab, setTab] = useState<'active' | 'archived'>('active');

  const inTab = useMemo(
    () =>
      customers.filter((c) => (tab === 'archived' ? Boolean(c.archivedAt) : !c.archivedAt)),
    [customers, tab],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inTab;
    return inTab.filter((c) =>
      [c.firstName, c.lastName, c.email, c.phone].join(' ').toLowerCase().includes(q),
    );
  }, [inTab, query]);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const archivedCount = customers.filter((c) => c.archivedAt).length;
  const nameOf = (c: Customer) => `${c.firstName} ${c.lastName}`;

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: t('colName'),
      primary: true,
      /* The row used to be the link, and cannot be one any more — see the
         status column. The name carries it instead, which is where a reader
         reaches for it anyway. */
      cell: (c) => (
        <Link
          href={`/admin/kunden/${c.id}`}
          className="rounded-[var(--radius-xs)] font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
        >
          {nameOf(c)}
        </Link>
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
      header: tab === 'archived' ? t('tabArchived') : t('colSince'),
      align: 'end',
      cell: (c) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {format.dateTime(new Date(tab === 'archived' ? c.archivedAt! : c.createdAt), 'short')}
        </span>
      ),
    },
    /* Last, i.e. hard against the action strip. Everything to its left is
       something to read; these two are the things to do, and putting a
       control the eye can flip in the middle of four columns it is only
       scanning is how a row gets toggled on the way past. */
    {
      /*
       * `colStatus`, `active` and `inactive` were translated in all four
       * locales and rendered by nothing. A closed account (§15 — the record
       * survives because invoices hang off it) was indistinguishable from a
       * live one, so the list invited you to quote somebody who had left.
       *
       * The cell is the control rather than a report of one: active and
       * inactive are the two ends of one switch, and a switch says "this
       * takes effect the moment you flip it", which is what happens.
       *
       * `blocked` is a chip, not a third position on that switch. It is a
       * decision rather than a fact about the customer, it is reached by its
       * own button behind its own confirm, and offering a half-flipped
       * switch on a blocked record invites the click that silently undoes it.
       */
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (c) =>
        c.status === 'blocked' ? (
          <Chip tone="danger">{t('blocked')}</Chip>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Switch
              checked={c.status === 'active'}
              onCheckedChange={() => toggleStatus(c)}
              aria-label={t('statusToggleLabel', { name: nameOf(c) })}
            />
            <span className="text-sm text-ink-secondary">
              {t(c.status === 'active' ? 'active' : 'inactive')}
            </span>
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

  function toggleStatus(c: Customer) {
    const next = c.status === 'active' ? 'inactive' : 'active';
    updateCustomer(c.id, { status: next });
    toast.success(
      t(next === 'active' ? 'toggledActive' : 'toggledInactive', { name: nameOf(c) }),
    );
  }

  function toggleBlock(c: Customer) {
    if (c.status === 'blocked') {
      updateCustomer(c.id, { status: 'active' });
      toast.success(t('unblockDone', { name: nameOf(c) }));
      return;
    }
    if (!window.confirm(t('blockConfirm', { name: nameOf(c) }))) return;
    updateCustomer(c.id, { status: 'blocked' });
    toast.success(t('blockDone', { name: nameOf(c) }));
  }

  function archive(c: Customer) {
    if (!window.confirm(t('archiveConfirm', { name: nameOf(c) }))) return;
    updateCustomer(c.id, { archivedAt: now.toISOString() });
    toast.success(t('archiveDone', { name: nameOf(c) }));
  }

  function restore(c: Customer) {
    updateCustomer(c.id, { archivedAt: undefined });
    toast.success(t('restoreDone', { name: nameOf(c) }));
  }

  const list = (
    <DataView
      className="mt-6"
      items={filtered}
      columns={columns}
      getKey={(c) => c.id}
      caption={t('title')}
      /*
       * Opening a customer was the row's only trick, so everything else —
       * correcting a typo in a phone number, parking an account, taking one
       * out of the working list — meant opening the record to find out there
       * was nowhere to do it there either. The strip is the answer to both.
       */
      rowActions={(c) => (
        <RowActions>
          <RowAction href={`/admin/kunden/${c.id}`} label={t('rowView')}>
            <ActionIcon.open aria-hidden />
          </RowAction>
          <RowAction href={`/admin/kunden/${c.id}/bearbeiten`} label={t('rowEdit')}>
            <ActionIcon.edit aria-hidden />
          </RowAction>
          <RowActionsDivider />

          <RowActionButton
            tone={c.status === 'blocked' ? 'default' : 'danger'}
            label={t(c.status === 'blocked' ? 'rowUnblock' : 'rowBlock')}
            onClick={() => toggleBlock(c)}
          >
            {c.status === 'blocked' ? <ActionIcon.unblock aria-hidden /> : <ActionIcon.block aria-hidden />}
          </RowActionButton>
          {c.archivedAt ? (
            <RowActionButton label={t('rowRestore')} onClick={() => restore(c)}>
              <ActionIcon.restore aria-hidden />
            </RowActionButton>
          ) : (
            <RowActionButton
              tone="danger"
              label={t('rowArchive')}
              onClick={() => archive(c)}
            >
              <ActionIcon.archive aria-hidden />
            </RowActionButton>
          )}
        </RowActions>
      )}
      empty={
        query ? (
          <EmptyState
            icon={Search}
            title={t('searchEmptyTitle')}
            body={t('searchEmptyBody', { query })}
          />
        ) : tab === 'archived' ? (
          <EmptyState
            icon={Archive}
            title={t('archivedEmptyTitle')}
            body={t('archivedEmptyBody')}
          />
        ) : (
          /* The empty state used to explain why the list was empty and then
             leave you there. On the "Tag 1" scenario that is the first
             screen the owner sees, so it is also the first place the create
             path has to exist. */
          <EmptyState title={t('emptyTitle')} body={t('emptyBody')} action={addButton} />
        )
      }
    />
  );

  return (
    <div>
      <PageHeader title={t('title')} actions={addButton} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="flex flex-wrap items-center gap-4">
          <TabsList>
            <TabsTrigger value="active">{t('tabActive')}</TabsTrigger>
            <TabsTrigger value="archived">
              {t('tabArchived')}
              {archivedCount > 0 && (
                <span data-numeric className="text-ink-tertiary">
                  {archivedCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <label className="relative block min-w-56 flex-1 sm:max-w-md">
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
        </div>

        <TabsContent value="active">{list}</TabsContent>
        <TabsContent value="archived">{list}</TabsContent>
      </Tabs>
    </div>
  );
}
