'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { useHydrated, useStore } from '@/mock/store';
import type { ChangeLogEntry } from '@/mock/schema';

/**
 * Screen 83 — the change log.
 *
 * Newest first, and the summary column carries the actual change rather than
 * "updated": on a one-person business the log is read months later to answer
 * "since when has Saturday cost 25%?", and a field-level diff would not answer
 * that any faster than a sentence does.
 */
export default function AdminChangeLogPage() {
  const t = useTranslations('admin.changelog');
  const format = useFormatter();
  const hydrated = useHydrated();

  const changeLog = useStore((s) => s.data.changeLog);

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

  const sorted = [...changeLog].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <div className="max-w-5xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      <DataView
        className="mt-8"
        items={sorted}
        columns={columns}
        getKey={(e) => e.id}
        caption={t('title')}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
