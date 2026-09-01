'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useFormatter } from '@/i18n/format';
import { Search } from 'lucide-react';

import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Toolbar } from '@/components/ui/toolbar';
import { useHydrated, useStore } from '@/mock/store';
import type { ChangeLogEntry } from '@/mock/schema';

/**
 * Screen 83 — the change log.
 *
 * Newest first, and the summary column carries the actual change rather than
 * "updated": on a one-person business the log is read months later to answer
 * "since when has Saturday cost 25%?", and a field-level diff would not answer
 * that any faster than a sentence does.
 *
 * The search box arrived with the user screens, and «wer» is why. A user record
 * now claims that deactivating an account keeps everything it recorded, and
 * counts the entries to prove it — a claim worth nothing if the only way to go
 * and look at those entries is to scroll a log that goes back fourteen months.
 * The link from that count lands here with the name already in the box.
 */
export default function AdminChangeLogPage() {
  const t = useTranslations('admin.changelog');
  const appT = useTranslations('app');
  const format = useFormatter();
  const hydrated = useHydrated();

  const changeLog = useStore((s) => s.data.changeLog);

  /* Initial state only, like screen 84's — after that the box owns the query,
     or every keystroke would fight the URL. */
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');

  const sorted = useMemo(
    () => [...changeLog].sort((a, b) => (a.at < b.at ? 1 : -1)),
    [changeLog],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    /* Actor, entity and summary together. The link from a user record searches
       a name, but the office arrives here asking «was ist mit dem Samstagszuschlag
       passiert» just as often, and two boxes for one question is one box too
       many. */
    return sorted.filter((e) =>
      [e.actor, e.entity, e.summary].join(' ').toLowerCase().includes(q),
    );
  }, [sorted, query]);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const columns: Column<ChangeLogEntry>[] = [
    {
      key: 'when',
      header: t('colWhen'),
      trailing: true,
      cell: (e) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {format.dateTime(new Date(e.at), {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    { key: 'actor', header: t('colActor'), cell: (e) => e.actor, tableOnly: true },
    {
      key: 'entity',
      header: t('colEntity'),
      tableOnly: true,
      cell: (e) => <span className="text-ink-secondary">{e.entity}</span>,
    },
    { key: 'summary', header: t('colSummary'), primary: true, cell: (e) => e.summary },
  ];

  const filtering = Boolean(query.trim());

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} />

      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('search'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: filtered.length, total: sorted.length })
            : appT('resultsAll', { total: sorted.length })
        }
      />

      <DataView
        items={filtered}
        columns={columns}
        getKey={(e) => e.id}
        caption={t('title')}
        empty={
          filtering ? (
            <EmptyState
              icon={Search}
              title={t('searchEmptyTitle')}
              body={t('searchEmptyBody', { query: query.trim() })}
            />
          ) : (
            <EmptyState title={t('emptyTitle')} body={t('emptyBody')} />
          )
        }
      />
    </div>
  );
}
