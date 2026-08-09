'use client';

import { useLocale, useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { KIND_KEY } from '@/components/careers/job-list';
import { useHydrated, useStore } from '@/mock/store';
import type { JobPosting } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * Screen H3 — the postings.
 *
 * The empty state says the thing that is easy to get wrong: with no postings
 * the public jobs page does not go blank, it invites a speculative
 * application. Knowing that changes whether unpublishing a role feels risky.
 */
export default function AdminPostingsPage() {
  const t = useTranslations('admin.postings');
  const careers = useTranslations('careers.index');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const postings = useStore((s) => s.data.postings);
  const applications = useStore((s) => s.data.applications);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const columns: Column<JobPosting>[] = [
    {
      key: 'title',
      header: t('colTitle'),
      primary: true,
      cell: (p) => p.title[locale],
    },
    {
      key: 'kind',
      header: t('colKind'),
      cell: (p) => <span className="text-ink-secondary">{careers(KIND_KEY[p.kind])}</span>,
    },
    {
      key: 'workload',
      header: t('colWorkload'),
      align: 'end',
      cell: (p) => (
        <span data-numeric className="text-ink-secondary">
          {p.workload[0]}–{p.workload[1]}%
        </span>
      ),
    },
    {
      key: 'applications',
      header: t('colApplications'),
      align: 'end',
      cell: (p) => (
        <span data-numeric>{applications.filter((a) => a.postingId === p.id).length}</span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      cell: (p) => (
        <span
          className={cn(
            'rounded-sm border px-1.5 py-0.5 text-xs',
            p.published
              ? 'border-status-success-line bg-status-success text-status-success-fg'
              : 'border-status-neutral-line bg-status-neutral text-status-neutral-fg',
          )}
        >
          {p.published ? t('published') : t('draft')}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      <DataView
        className="mt-8"
        items={postings}
        columns={columns}
        getKey={(p) => p.id}
        onSelect={(p) => router.push(`/admin/stellen/${p.slug}`)}
        caption={t('title')}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
