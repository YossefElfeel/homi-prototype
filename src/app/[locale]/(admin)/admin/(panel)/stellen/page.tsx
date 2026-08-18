'use client';

import { useLocale, useTranslations } from 'next-intl';

import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { KIND_KEY } from '@/components/careers/job-list';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { JobPosting } from '@/mock/schema';

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
  const now = useNow();

  const postings = useStore((s) => s.data.postings);
  const applications = useStore((s) => s.data.applications);
  const createPosting = useStore((s) => s.createPosting);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  /*
   * The list had no create button and its empty state had no action — and the
   * default scenario seeds zero postings, so this screen was where a reviewer
   * stopped. `newAction` was already translated in all four locales and
   * rendered by nothing.
   */
  function create() {
    const { slug } = createPosting(now);
    toast.success(t('newAction'));
    router.push(`/admin/stellen/${slug}`);
  }

  const createButton = (
    <Button onClick={create}>
      <Plus className="size-4" aria-hidden />
      {t('newAction')}
    </Button>
  );

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
        <Chip tone={p.published ? 'success' : 'neutral'}>
          {p.published ? t('published') : t('draft')}
        </Chip>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} actions={createButton} />

      <DataView
        items={postings}
        columns={columns}
        getKey={(p) => p.id}
        onSelect={(p) => router.push(`/admin/stellen/${p.slug}`)}
        caption={t('title')}
        empty={
          <EmptyState
            title={t('emptyTitle')}
            body={t('emptyBody')}
            action={createButton}
          />
        }
      />
    </div>
  );
}
