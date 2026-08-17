'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { Lock } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { canSeeApplicants, useHydrated, useNow, useStore } from '@/mock/store';
import type { Application, ApplicationStatus } from '@/mock/schema';
import { cn } from '@/lib/cn';

const FILTERS: (ApplicationStatus | 'all')[] = [
  'all',
  'new',
  'inReview',
  'accepted',
  'rejected',
];

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
 */
export default function AdminApplicationsPage() {
  const t = useTranslations('admin.applications');
  const statusLabel = useTranslations('status.application');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const role = useStore((s) => s.demo.role);
  const applications = useStore((s) => s.data.applications);
  const postings = useStore((s) => s.data.postings);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  /* See the note on the detail screen: AdminShell has already gated this, so
     rendering a second lock screen here was dead code. */
  if (!canSeeApplicants(role)) return null;

  const daysLeft = (iso: string) =>
    Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);

  const items = applications
    .filter((a) => filter === 'all' || a.status === filter)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

  const columns: Column<Application>[] = [
    {
      key: 'name',
      header: t('colName'),
      primary: true,
      cell: (a) => `${a.firstName} ${a.lastName}`,
    },
    {
      key: 'for',
      header: t('colFor'),
      cell: (a) => {
        const posting = postings.find((p) => p.id === a.postingId);
        return (
          <span className="text-ink-secondary">
            {posting ? posting.title[locale] : t('spontaneous')}
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
    <div className="max-w-6xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 flex max-w-[var(--measure)] items-start gap-2 text-ink-secondary">
        <Lock className="mt-1 size-4 shrink-0" aria-hidden />
        {t('lead')}
      </p>

      {/*
        A filter, not a tab set: the markup below never changes, it just gets
        fewer rows. role="tab" promises a tabpanel that does not exist, so a
        screen reader announces a control that leads nowhere.
      */}
      <div role="group" aria-label={t('title')} className="mt-8 flex flex-wrap gap-1">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              'min-h-11 rounded-[var(--radius-sm)] px-3 text-sm transition-colors',
              filter === value
                ? 'bg-accent-subtle font-medium text-ink'
                : 'text-ink-secondary hover:bg-sunken',
            )}
          >
            {/* Filter labels read from the same namespace the badge does, so
                a chip and the badge it filters can never disagree. */}
            {value === 'all' ? t('filterAll') : statusLabel(value)}
          </button>
        ))}
      </div>

      <DataView
        className="mt-6"
        items={items}
        columns={columns}
        getKey={(a) => a.id}
        onSelect={(a) => router.push(`/admin/bewerbungen/${a.id}`)}
        caption={t('title')}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
