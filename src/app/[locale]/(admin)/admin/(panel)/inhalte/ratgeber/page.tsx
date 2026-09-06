'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { useFormatter } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import {
  RowAction,
  RowActionButton,
  RowActions,
  RowActionsDivider,
} from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { ActionIcon } from '@/lib/action-icons';
import { BLOG_STATUSES, isPublished, missingLocales, readingMinutes, textFor } from '@/lib/blog';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { BlogPost, BlogStatus } from '@/mock/schema';

type StatusFilter = 'all' | BlogStatus;

/** The two decisions that must not happen on one click, and their subject. */
type Pending = { kind: 'publish' | 'withdraw' | 'delete'; post: BlogPost } | null;

/**
 * Screen R3 — the Ratgeber, from the office.
 *
 * It sits under /admin/inhalte rather than as its own sidebar row, and that is
 * a permission decision as much as a filing one: `permissionForPath` takes the
 * longest matching prefix, so everything below the content route inherits the
 * `website` right. Whoever may rewrite the homepage may write an article, and
 * nobody had to be given a second switch to do it.
 *
 * The list is the only place publishing happens. The editor next door
 * autosaves every keystroke, which is right for prose and would be wrong for
 * «auf die Website stellen» — so the status is moved here, behind a confirm
 * that says which article and what will happen.
 */
export default function AdminRatgeberPage() {
  const t = useTranslations('admin.blog');
  const appT = useTranslations('app');
  const actionsT = useTranslations('actions');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const posts = useStore((s) => s.data.posts);
  const team = useStore((s) => s.data.team);
  const createPost = useStore((s) => s.createPost);
  const setPostStatus = useStore((s) => s.setPostStatus);
  const deletePost = useStore((s) => s.deletePost);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [pending, setPending] = useState<Pending>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((post) => (status === 'all' ? true : post.status === status))
      .filter((post) =>
        q
          ? [
              ...routing.locales.map((l) => post.title[l] ?? ''),
              ...routing.locales.map((l) => post.excerpt[l] ?? ''),
              post.slug,
            ]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      )
      .slice()
      /* Drafts first, then newest. The list is a desk, not an archive: the
         thing somebody opens this screen to do is finish the piece they were
         writing, and sorting purely by date buries it under everything that
         already went out. */
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'draft' ? -1 : 1;
        return (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt);
      });
  }, [posts, status, query]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = status !== 'all' || query.trim() !== '';
  const nameOf = (post: BlogPost) => textFor(post.title, locale) || t('untitled');

  function create() {
    const { slug } = createPost(now);
    router.push(`/admin/inhalte/ratgeber/${slug}`);
  }

  function confirmPending() {
    if (!pending) return;
    const { post } = pending;

    if (pending.kind === 'delete') {
      deletePost(post.id);
      toast.success(t('deleteDone', { name: nameOf(post) }));
    } else {
      const next: BlogStatus = pending.kind === 'publish' ? 'published' : 'draft';
      setPostStatus(post.id, next, now);
      toast.success(
        t(pending.kind === 'publish' ? 'publishDone' : 'withdrawDone', { name: nameOf(post) }),
      );
    }
    setPending(null);
  }

  const columns: Column<BlogPost>[] = [
    {
      key: 'title',
      header: t('colTitle'),
      primary: true,
      sortBy: (post) => nameOf(post),
      cell: (post) => (
        <span className="flex flex-col">
          <span className="font-medium">{nameOf(post)}</span>
          <span className="font-mono text-xs text-ink-tertiary">/ratgeber/{post.slug}</span>
        </span>
      ),
    },
    {
      key: 'author',
      header: t('colAuthor'),
      sortBy: (post) => post.authorId,
      cell: (post) => {
        const author = team.find((member) => member.id === post.authorId);
        return (
          <span className="text-ink-secondary">
            {author ? `${author.firstName} ${author.lastName}` : '—'}
          </span>
        );
      },
    },
    {
      key: 'reading',
      header: t('colReading'),
      align: 'end',
      sortBy: (post) => readingMinutes(post, locale),
      cell: (post) => (
        <span data-numeric className="text-ink-secondary">
          {readingMinutes(post, locale)}′
        </span>
      ),
    },
    {
      /* Counted over all four routing locales, like the catalogue's column —
         and it counts a *whole* language, not a field. A post with an English
         title and German sections renders as a broken article rather than an
         untranslated one, which is worse. */
      key: 'languages',
      header: t('colLanguages'),
      align: 'end',
      sortBy: (post) => missingLocales(post, routing.locales).length,
      cell: (post) => {
        const missing = missingLocales(post, routing.locales).length;
        return missing === 0 ? (
          <span className="text-sm text-ink-tertiary">—</span>
        ) : (
          <span className="rounded-sm border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-xs text-status-warning-fg">
            {t('translationGap', { n: missing })}
          </span>
        );
      },
    },
    {
      key: 'date',
      header: t('colDate'),
      align: 'end',
      sortBy: (post) => post.publishedAt ?? post.updatedAt,
      cell: (post) => (
        <span data-numeric className="text-ink-secondary">
          {format.dateTime(new Date(post.publishedAt ?? post.updatedAt), 'short')}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      sortBy: (post) => post.status,
      cell: (post) => <StatusBadge entity="blogPost" state={post.status} size="sm" />,
    },
  ];

  const copy = pending
    ? {
        publish: {
          title: t('publishTitle', { name: nameOf(pending.post) }),
          body: t('publishBody'),
          action: t('publishConfirm'),
        },
        withdraw: {
          title: t('withdrawTitle', { name: nameOf(pending.post) }),
          body: t('withdrawBody'),
          action: t('withdrawConfirm'),
        },
        delete: {
          title: t('deleteTitle', { name: nameOf(pending.post) }),
          body: t('deleteBody'),
          action: t('deleteConfirm'),
        },
      }[pending.kind]
    : null;

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        back={{ href: '/admin/inhalte', label: t('back') }}
        actions={
          <Button onClick={create}>
            <Plus className="size-4" aria-hidden />
            {t('createAction')}
          </Button>
        }
      />

      <Toolbar
        className="mt-8"
        search={{
          value: query,
          onChange: setQuery,
          label: t('search'),
          placeholder: t('searchPlaceholder'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: visible.length, total: posts.length })
            : appT('resultsAll', { total: posts.length })
        }
        filters={
          <label className="min-w-44">
            <span className="sr-only">{t('filterStatus')}</span>
            <Select
              dense
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">
                {t('filterStatus')}: {t('filterAll')}
              </option>
              {BLOG_STATUSES.map((state) => (
                <option key={state} value={state}>
                  {t('filterStatus')}: {t(`status.${state}` as 'status.draft')}
                </option>
              ))}
            </Select>
          </label>
        }
      />

      <DataView
        className="mt-4"
        items={visible}
        columns={columns}
        getKey={(post) => post.id}
        caption={t('title')}
        openLabel={t('rowEdit')}
        rowActions={(post) => (
          <RowActions>
            <RowAction href={`/admin/inhalte/ratgeber/${post.slug}`} label={t('rowEdit')}>
              <ActionIcon.edit aria-hidden />
            </RowAction>
            {isPublished(post) && (
              <RowAction external href={`/ratgeber/${post.slug}`} label={t('rowView')}>
                <ActionIcon.customerView aria-hidden />
              </RowAction>
            )}
            <RowActionsDivider />
            {isPublished(post) ? (
              <RowActionButton
                label={t('rowWithdraw')}
                onClick={() => setPending({ kind: 'withdraw', post })}
              >
                <ActionIcon.hide aria-hidden />
              </RowActionButton>
            ) : (
              <RowActionButton
                label={t('rowPublish')}
                onClick={() => setPending({ kind: 'publish', post })}
              >
                <ActionIcon.activate aria-hidden />
              </RowActionButton>
            )}
            <RowActionButton
              tone="danger"
              label={t('rowDelete')}
              onClick={() => setPending({ kind: 'delete', post })}
            >
              <ActionIcon.delete aria-hidden />
            </RowActionButton>
          </RowActions>
        )}
        empty={
          <EmptyState
            headingLevel={2}
            title={filtering ? t('searchEmptyTitle') : t('emptyTitle')}
            body={filtering ? t('searchEmptyBody', { query: query.trim() }) : t('emptyBody')}
            action={
              filtering ? undefined : <Button onClick={create}>{t('createAction')}</Button>
            }
          />
        }
      />

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy?.title}</DialogTitle>
            <DialogDescription>{copy?.body}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPending(null)}>
              {actionsT('cancel')}
            </Button>
            <Button
              variant={pending?.kind === 'delete' ? 'danger' : 'primary'}
              onClick={confirmPending}
            >
              {copy?.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
