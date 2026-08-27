'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { RowAction, RowActionButton, RowActions, RowActionsDivider } from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Toolbar } from '@/components/ui/toolbar';
import { KIND_KEY } from '@/components/careers/job-list';
import { ActionIcon } from '@/lib/action-icons';
import { regionByPostcode } from '@/mock/engines/coverage';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { EmploymentKind, JobPosting } from '@/mock/schema';

const KINDS: EmploymentKind[] = ['permanent', 'part-time', 'temporary', 'freelance'];

/**
 * Screen H3 — the postings.
 *
 * The empty state says the thing that is easy to get wrong: with no postings
 * the public jobs page does not go blank, it invites a speculative
 * application. Knowing that changes whether unpublishing a role feels risky.
 *
 * Search and the two filters arrived with the eleventh posting, which is one
 * past the page size — the moment a list stops being something you read and
 * starts being something you look things up in. Both come from `Toolbar`, the
 * same row every other admin list carries.
 */
export default function AdminPostingsPage() {
  const t = useTranslations('admin.postings');
  /* The unnamed-job fallback is worded once, on the screen that can produce
     one. Reading it from there rather than restating it here is what keeps
     the list and the editor calling the same job the same thing. */
  const postingT = useTranslations('admin.posting');
  const appT = useTranslations('app');
  const careers = useTranslations('careers.index');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const postings = useStore((s) => s.data.postings);
  const applications = useStore((s) => s.data.applications);
  const createPosting = useStore((s) => s.createPosting);
  const updatePosting = useStore((s) => s.updatePosting);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [kind, setKind] = useState<'all' | EmploymentKind>('all');

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return postings
      .filter((p) =>
        status === 'all' ? true : status === 'published' ? p.published : !p.published,
      )
      .filter((p) => kind === 'all' || p.kind === kind)
      .filter((p) =>
        needle
          ? [
              p.title[locale],
              p.title.de,
              /* The area is searchable by what it is called as well as by its
                 postcode: nobody looking for the Oberland jobs types 8634. */
              ...p.regions.map((code) => `${code} ${regionByPostcode(code)?.name ?? ''}`),
            ]
              .join(' ')
              .toLowerCase()
              .includes(needle)
          : true,
      );
  }, [postings, status, kind, query, locale]);

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

  const filtering = query.trim() !== '' || status !== 'all' || kind !== 'all';

  function togglePublished(posting: JobPosting) {
    updatePosting(posting.id, { published: !posting.published });
    toast.success(posting.published ? t('unpublished_toast') : t('published_toast'));
  }

  const columns: Column<JobPosting>[] = [
    {
      key: 'title',
      header: t('colTitle'),
      primary: true,
      sortBy: (p) => p.title[locale],
      /*
       * «Stelle anlegen» creates the record before anything is typed into it,
       * so an unnamed job is a state this list has to draw — and it was
       * drawing an empty cell, which on the row that is also the card's title
       * reads as a rendering fault rather than as work not yet done.
       */
      cell: (p) => p.title[locale] || postingT('untitled'),
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
      sortBy: (p) => p.workload[1],
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
      sortBy: (p) => applications.filter((a) => a.postingId === p.id).length,
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

      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('search'),
          placeholder: t('searchPlaceholder'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: items.length, total: postings.length })
            : appT('resultsAll', { total: postings.length })
        }
        filters={
          <>
            <label>
              <span className="sr-only">{t('filterStatus')}</span>
              <Select
                dense
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="all">
                  {t('filterStatus')}: {t('filterAll')}
                </option>
                <option value="published">{t('published')}</option>
                <option value="draft">{t('draft')}</option>
              </Select>
            </label>
            <label>
              <span className="sr-only">{t('filterKind')}</span>
              <Select dense value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
                <option value="all">
                  {t('filterKind')}: {t('filterAll')}
                </option>
                {/* The contract labels come from the public jobs page, so the
                    filter and the posting itself use one vocabulary. */}
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {careers(KIND_KEY[k])}
                  </option>
                ))}
              </Select>
            </label>
          </>
        }
      />

      <DataView
        items={items}
        columns={columns}
        getKey={(p) => p.id}
        onSelect={(p) => router.push(`/admin/stellen/${p.slug}`)}
        caption={t('title')}
        rowActions={(p) => (
          <RowActions>
            <RowAction href={`/admin/stellen/${p.slug}`} label={t('rowEdit')}>
              <ActionIcon.edit aria-hidden />
            </RowAction>
            {/* Only worth offering once it is public — the jobs page has no
                route for a draft, so the link would 404 on exactly the rows
                where somebody would most want to check their work. */}
            {p.published && (
              <RowAction href={`/jobs/${p.slug}`} external label={t('rowPreview')}>
                <ActionIcon.customerView aria-hidden />
              </RowAction>
            )}
            <RowActionsDivider />
            {/*
              Publishing an untitled job would put a blank heading on the
              public site, so the row that can do it is the one row that must
              not. Disabled rather than dropped, with the reason in the label:
              see `RowActionButton` on why an absent item explains nothing.
            */}
            <RowActionButton
              tone={p.published ? 'danger' : 'default'}
              disabled={!p.published && !p.title[locale].trim()}
              label={
                p.published
                  ? t('rowUnpublish')
                  : p.title[locale].trim()
                    ? t('rowPublish')
                    : t('rowPublishBlocked')
              }
              onClick={() => togglePublished(p)}
            >
              {p.published ? (
                <ActionIcon.deactivate aria-hidden />
              ) : (
                <ActionIcon.activate aria-hidden />
              )}
            </RowActionButton>
          </RowActions>
        )}
        empty={
          filtering ? (
            <EmptyState title={t('searchEmptyTitle')} body={t('searchEmptyBody')} />
          ) : (
            <EmptyState title={t('emptyTitle')} body={t('emptyBody')} action={createButton} />
          )
        }
      />
    </div>
  );
}
