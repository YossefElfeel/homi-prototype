'use client';

import { useLocale, useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { useHydrated, useStore } from '@/mock/store';
import type { TeamMember } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * Screen H6 — the team.
 *
 * Deliberately short: §22 puts payroll, hours and attendance out of scope, so
 * this is a permissions screen, not an HR module. What each row answers is
 * "what can this person open?" — which is the question that matters when the
 * job carries a customer's alarm code.
 */
export default function AdminTeamPage() {
  const t = useTranslations('admin.team');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const team = useStore((s) => s.data.team);
  const services = useStore((s) => s.services);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const columns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: t('colName'),
      primary: true,
      cell: (m) => `${m.firstName} ${m.lastName}`,
    },
    {
      key: 'role',
      header: t('colRole'),
      cell: (m) => (
        <span className="text-ink-secondary">
          {m.role === 'owner' ? t('roleOwner') : t('roleContractor')}
        </span>
      ),
    },
    {
      key: 'regions',
      header: t('colRegions'),
      align: 'end',
      tableOnly: true,
      cell: (m) => (
        <span data-numeric className="text-ink-secondary">
          {m.regions.length}
        </span>
      ),
    },
    {
      key: 'skills',
      header: t('colSkills'),
      tableOnly: true,
      cell: (m) => (
        <span className="text-sm text-ink-secondary">
          {m.skills
            .map((slug) => services.find((s) => s.slug === slug)?.name[locale] ?? slug)
            .join(', ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      cell: (m) => (
        <span
          className={cn(
            'rounded-sm border px-1.5 py-0.5 text-xs',
            m.active
              ? 'border-status-success-line bg-status-success text-status-success-fg'
              : 'border-status-neutral-line bg-status-neutral text-status-neutral-fg',
          )}
        >
          {m.active ? t('active') : t('inactive')}
        </span>
      ),
    },
  ];

  return (
    <div>
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      <DataView
        className="mt-8"
        items={team}
        columns={columns}
        getKey={(m) => m.id}
        onSelect={(m) => router.push(`/admin/team/${m.id}`)}
        caption={t('title')}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
