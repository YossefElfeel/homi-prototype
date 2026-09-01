'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { Lock } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { ConfirmDialog, useConfirmTarget, useDismissLabel } from '@/components/ui/confirm-dialog';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { RowAction, RowActionButton, RowActions, RowActionsDivider } from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { ActionIcon } from '@/lib/action-icons';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { may } from '@/lib/admin-permissions';
import type { Application, ApplicationStatus } from '@/mock/schema';
import { cn } from '@/lib/cn';

const STATUSES: ApplicationStatus[] = ['new', 'inReview', 'accepted', 'rejected'];

/**
 * Screen H1 — applications.
 *
 * Gated on the owner role, and the gate is the same one the key log uses:
 * revDSG makes applicant data owner-only, so a contractor switching roles in
 * the demo bar loses this screen entirely rather than seeing a redacted
 * version. A redacted version would still leak that a person applied.
 *
 * The retention flag is on the list, not buried in the detail. An expiring
 * record is an obligation with a date on it.
 *
 * **This list is now filtered the way every other admin list is.** It had a
 * row of status chips it had invented for itself and no search at all, which
 * was survivable at seven rows and is not at twenty: "did the Kosovan
 * applicant from last week ever get an answer" meant reading two pages. Both
 * controls now come from `Toolbar`, and the status chips are a `Select`
 * beside a second filter the chips could never have expressed — which job the
 * application names — because a chip strip grows with the postings table and
 * this one is eleven rows long.
 */
export default function AdminApplicationsPage() {
  const t = useTranslations('admin.applications');
  const appT = useTranslations('app');
  const statusLabel = useTranslations('status.application');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();
  const dismissLabel = useDismissLabel();

  const signedInAs = useStore((s) => s.data.team.find((m) => m.id === s.demo.currentMemberId));
  const applications = useStore((s) => s.data.applications);
  const postings = useStore((s) => s.data.postings);
  const setApplicationStatus = useStore((s) => s.setApplicationStatus);
  const deleteApplication = useStore((s) => s.deleteApplication);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | 'all'>('all');
  /* «spontan» is a value the postings select has to carry but the postings
     table cannot supply: a speculative application names no job, and "show me
     the ones nobody was recruiting for" is the question behind it. */
  const [posting, setPosting] = useState<string>('all');
  /* The row has to outlive the click that dismisses the dialog — see
     `useConfirmTarget`. Deletion is real here, as it is on the detail screen:
     revDSG asks for erasure, and there is no archive to fall back on. */
  const deleting = useConfirmTarget<Application>();

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return applications
      .filter((a) => status === 'all' || a.status === status)
      .filter((a) =>
        posting === 'all'
          ? true
          : posting === 'spontaneous'
            ? !a.postingId
            : a.postingId === posting,
      )
      .filter((a) =>
        needle
          ? [a.firstName, a.lastName, a.email, a.city, a.postcode, a.reference]
              .join(' ')
              .toLowerCase()
              .includes(needle)
          : true,
      )
      .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  }, [applications, status, posting, query]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  /* See the note on the detail screen: AdminShell has already gated this, so
     rendering a second lock screen here was dead code. */
  if (!may(signedInAs, 'applications')) return null;

  const daysLeft = (iso: string) =>
    Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);

  const filtering = query.trim() !== '' || status !== 'all' || posting !== 'all';

  const columns: Column<Application>[] = [
    {
      key: 'name',
      header: t('colName'),
      primary: true,
      sortBy: (a) => `${a.lastName} ${a.firstName}`,
      cell: (a) => `${a.firstName} ${a.lastName}`,
    },
    {
      key: 'for',
      header: t('colFor'),
      cell: (a) => {
        const named = postings.find((p) => p.id === a.postingId);
        return (
          <span className="text-ink-secondary">
            {named ? named.title[locale] : t('spontaneous')}
          </span>
        );
      },
    },
    {
      key: 'permit',
      header: t('colPermit'),
      tableOnly: true,
      cell: (a) => (
        <span
          className={cn(
            'text-sm',
            a.permit === 'none' ? 'text-status-danger-fg' : 'text-ink-secondary',
          )}
        >
          {a.permit === 'none' ? '—' : a.permit.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'experience',
      header: t('colExperience'),
      align: 'end',
      tableOnly: true,
      sortBy: (a) => a.yearsExperience,
      cell: (a) => (
        <span data-numeric className="text-ink-secondary">
          {t('years', { n: a.yearsExperience })}
        </span>
      ),
    },
    {
      key: 'submitted',
      header: t('colSubmitted'),
      align: 'end',
      sortBy: (a) => a.submittedAt,
      cell: (a) => (
        <span className="flex flex-col items-end gap-1">
          <span data-numeric className="text-sm text-ink-tertiary">
            {format.dateTime(new Date(a.submittedAt), {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
          {daysLeft(a.retainUntil) <= 30 && (
            <span className="rounded-sm border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-[0.6875rem] text-status-warning-fg">
              {t('retentionSoon', { days: daysLeft(a.retainUntil) })}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      cell: (a) => <StatusBadge entity="application" state={a.status} size="sm" />,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={
          <span className="flex items-start gap-2">
            <Lock className="mt-1 size-4 shrink-0" aria-hidden />
            {t('lead')}
          </span>
        }
      />

      {/*
        The filter row sat on the bare page ground while the rows it filtered
        sat on a card, so the control and the thing it controlled read as two
        unrelated blocks. `Toolbar` is the surface every other admin list puts
        this row on — and it brings the result count with it, which is what
        answers "did that filter do anything" without counting rows.
      */}
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
            ? appT('results', { shown: items.length, total: applications.length })
            : appT('resultsAll', { total: applications.length })
        }
        filters={
          <>
            <label>
              {/* The visible name is the first option, so the closed select
                  still says which question it answers. */}
              <span className="sr-only">{t('filterStatus')}</span>
              <Select
                dense
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus | 'all')}
              >
                <option value="all">
                  {t('filterStatus')}: {t('filterAll')}
                </option>
                {/* Read from the namespace the badge reads, so a filter option
                    and the badge it selects can never disagree. */}
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <span className="sr-only">{t('filterPosting')}</span>
              <Select dense value={posting} onChange={(e) => setPosting(e.target.value)}>
                <option value="all">{t('filterPostingAll')}</option>
                <option value="spontaneous">{t('filterSpontaneous')}</option>
                {postings.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title[locale] || '—'}
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
        getKey={(a) => a.id}
        onSelect={(a) => router.push(`/admin/bewerbungen/${a.id}`)}
        caption={t('title')}
        defaultSort={{ key: 'submitted', dir: 'desc' }}
        /*
          The chevron said "this row opens" and nothing else, so every action
          on an application was two screens deep — including moving one into
          review, which is the whole of what the owner does on a Monday. The
          menu is the same control the rest of the panel uses, and it keeps
          the row itself clickable.
        */
        rowActions={(a) => (
          <RowActions>
            <RowAction href={`/admin/bewerbungen/${a.id}`} label={t('rowView')}>
              <ActionIcon.open aria-hidden />
            </RowAction>
            {a.status === 'new' && (
              <RowActionButton
                label={t('rowStartReview')}
                onClick={() => setApplicationStatus(a.id, 'inReview')}
              >
                <ActionIcon.edit aria-hidden />
              </RowActionButton>
            )}
            <RowActionsDivider />
            {/*
              Turning somebody down needs a reason from a fixed list, and that
              list is a dialog on the detail screen. It is deliberately not
              copied here: an irreversible decision that wants a reason should
              not be reachable from a row without reading the row first.
            */}
            <RowActionButton tone="danger" label={t('rowDelete')} onClick={() => deleting.ask(a)}>
              <ActionIcon.delete aria-hidden />
            </RowActionButton>
          </RowActions>
        )}
        empty={
          filtering ? (
            <EmptyState title={t('searchEmptyTitle')} body={t('searchEmptyBody')} />
          ) : (
            <EmptyState title={t('emptyTitle')} body={t('emptyBody')} />
          )
        }
      />

      <ConfirmDialog
        open={deleting.open}
        onOpenChange={(open) => !open && deleting.dismiss()}
        title={t('deleteConfirmTitle')}
        body={t('deleteConfirmBody', {
          name: deleting.target ? `${deleting.target.firstName} ${deleting.target.lastName}` : '',
        })}
        action={t('deleteConfirm')}
        dismiss={dismissLabel}
        onConfirm={() => {
          if (deleting.target) deleteApplication(deleting.target.id);
          deleting.dismiss();
        }}
      />
    </div>
  );
}
