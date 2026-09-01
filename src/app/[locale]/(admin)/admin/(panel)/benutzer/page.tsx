'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { KeyRound, Plus, Search, ShieldUser, UserX } from 'lucide-react';
import { toast } from 'sonner';

import { Link, useRouter } from '@/i18n/navigation';
import { ActionIcon } from '@/lib/action-icons';
import { Button } from '@/components/ui/button';
import {
  ConfirmDialog,
  useConfirmTarget,
  useDismissLabel,
} from '@/components/ui/confirm-dialog';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import {
  RowAction,
  RowActionButton,
  RowActions,
  RowActionsDivider,
} from '@/components/ui/row-actions';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toolbar } from '@/components/ui/toolbar';
import { grantedPermissions } from '@/lib/admin-permissions';
import {
  fullName,
  upcomingJobs,
  userHistory,
  userPermission,
  type UserDenial,
} from '@/lib/user-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { TeamMember, TeamRole } from '@/mock/schema';

/**
 * Screen U1 — every account that can sign in.
 *
 * The list this replaces was «Team», and it answered one question — who works
 * here — with a read-only table. Everything the office actually needed to *do*
 * with a colleague was missing: no way to add the bookkeeper who never applied
 * for a job, no way to take somebody's access away without deleting the person,
 * no way to say what any of them were allowed to open. The rights column was
 * four sentences of prose that were the same four sentences for everyone.
 *
 * So the subject changed. This is not the roster; it is who may sign in and
 * what they see afterwards, which is why it sits under «System» beside the
 * settings and the change log rather than under «Personal» beside the job
 * adverts. Field facts — skills, regions, the week ahead — did not go
 * anywhere; they are on the record, one click away, where they belong to a
 * person rather than to a permission.
 *
 * Two tabs rather than a status filter, for the same reason the customer list
 * has them: a switched-off account is not a variant of a live one, it is a
 * different list, and mixing them is how somebody grants rights to a colleague
 * who left in March.
 */
export default function AdminUsersPage() {
  const t = useTranslations('admin.users.list');
  const roles = useTranslations('admin.users.roles');
  const confirmT = useTranslations('admin.users.confirm');
  const appT = useTranslations('app');
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const data = useStore((s) => s.data);
  const memberId = useStore((s) => s.demo.currentMemberId);
  const setActive = useStore((s) => s.setTeamMemberActive);
  const removeUser = useStore((s) => s.deleteTeamMember);
  const issueReset = useStore((s) => s.issuePasswordReset);

  const dismissLabel = useDismissLabel();
  /* Two questions, two held rows — see `useConfirmTarget` on why the row has to
     outlive the click that dismisses it. */
  const deactivating = useConfirmTarget<TeamMember>();
  const deleting = useConfirmTarget<TeamMember>();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'active' | 'deactivated'>('active');
  const [role, setRole] = useState<'all' | TeamRole>('all');

  const team = data.team;
  const actor = team.find((m) => m.id === memberId);

  const inTab = useMemo(
    () => team.filter((m) => (tab === 'deactivated' ? !m.active : m.active)),
    [team, tab],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inTab
      .filter((m) => (role === 'all' ? true : m.role === role))
      .filter((m) =>
        q ? [m.firstName, m.lastName, m.email, m.phone].join(' ').toLowerCase().includes(q) : true,
      );
  }, [inTab, query, role]);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const deactivatedCount = team.filter((m) => !m.active).length;
  const filtering = role !== 'all' || Boolean(query.trim());

  const historyFor = (m: TeamMember) => userHistory(m, data);

  /** The refusal, in the label. See `RowActionButton` on why not a tooltip. */
  const reason = (because: UserDenial) =>
    because === 'self'
      ? t('denySelf')
      : because === 'owner'
        ? t('denyOwner')
        : because === 'history'
          ? t('denyHistory')
          : t('denyInactive');

  const columns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: t('colName'),
      primary: true,
      sortBy: (m) => fullName(m),
      cell: (m) => (
        <Link
          href={`/admin/benutzer/${m.id}`}
          className="rounded-[var(--radius-xs)] font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
        >
          {fullName(m)}
        </Link>
      ),
    },
    {
      key: 'role',
      header: t('colRole'),
      sortBy: (m) => m.role,
      cell: (m) => <span className="text-ink-secondary">{roles(m.role)}</span>,
    },
    {
      /*
       * The column the old team list did not have, and the reason this screen
       * exists. «22 Bereiche» is not a number anybody acts on — what the office
       * scans this column for is the two extremes: who has everything, and who
       * has nothing and probably should not.
       */
      key: 'access',
      header: t('colAccess'),
      sortBy: (m) => (m.role === 'owner' ? 999 : grantedPermissions(m).length),
      cell: (m) => {
        if (m.role === 'owner')
          return <span className="text-ink-secondary">{t('accessAll')}</span>;
        /* Read off the record rather than through `grantedPermissions`: that
           one returns nothing for a switched-off account, and a «Deaktiviert»
           row printing «Kein Zugriff» would hide what comes back on when
           somebody is reactivated. */
        const n = m.permissions.length;
        if (n === 0) return <span className="text-ink-tertiary">{t('accessNone')}</span>;
        return (
          <span data-numeric className="text-ink-secondary">
            {n === 1 ? t('accessOne') : t('accessCount', { n })}
          </span>
        );
      },
    },
    {
      key: 'contact',
      header: t('colContact'),
      tableOnly: true,
      cell: (m) => (
        <span className="text-ink-secondary">
          {m.email}
          <span data-numeric className="block text-sm text-ink-tertiary">
            {m.phone}
          </span>
        </span>
      ),
    },
    {
      key: 'since',
      header: tab === 'deactivated' ? t('colDeactivated') : t('colSince'),
      align: 'end',
      sortBy: (m) => (tab === 'deactivated' ? (m.deactivatedAt ?? '') : m.startedAt),
      cell: (m) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {format.dateTime(
            new Date(tab === 'deactivated' ? (m.deactivatedAt ?? m.startedAt) : m.startedAt),
            'short',
          )}
        </span>
      ),
    },
    /* Last, i.e. hard against the action strip — the position `DataView` asks
       every table to put state in. */
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (m) => <StatusBadge entity="user" state={m.active ? 'active' : 'deactivated'} size="sm" />,
    },
  ];

  const addButton = (
    <Button asChild>
      <Link href="/admin/benutzer/neu">
        <Plus className="size-4" aria-hidden />
        {t('addAction')}
      </Link>
    </Button>
  );

  function askDeactivate(m: TeamMember) {
    /* Reactivating asks nothing. It is the reversal, and a confirm in front of
       an undo makes the undo feel as heavy as the act it undoes — the same
       reasoning the customer list uses for unblocking. */
    if (!m.active) {
      setActive(m.id, true, now);
      toast.success(confirmT('reactivateDone', { name: fullName(m) }));
      return;
    }
    deactivating.ask(m);
  }

  function confirmDeactivate() {
    const m = deactivating.target;
    if (!m) return;
    deactivating.dismiss();
    setActive(m.id, false, now);
    toast.success(confirmT('deactivateDone', { name: fullName(m) }));
  }

  function confirmDelete() {
    const m = deleting.target;
    if (!m) return;
    deleting.dismiss();
    removeUser(m.id);
    toast.success(confirmT('deleteDone', { name: fullName(m) }));
  }

  function reset(m: TeamMember) {
    issueReset(m.id, now);
    /* Straight to the record rather than showing the link in a toast. The link
       is the point of the action and it has to be copied, opened and read —
       none of which a notification that fades after four seconds allows. */
    router.push(`/admin/benutzer/${m.id}#passwort`);
  }

  const list = (
    <DataView
      items={filtered}
      columns={columns}
      getKey={(m) => m.id}
      caption={t('title')}
      onSelect={(m) => router.push(`/admin/benutzer/${m.id}`)}
      rowActions={(m) => {
        const history = historyFor(m);
        const can = (action: Parameters<typeof userPermission>[0]) =>
          userPermission(action, { actor, target: m, history });
        const deactivate = can(m.active ? 'deactivate' : 'reactivate');
        const remove = can('delete');
        const link = can('reset');

        return (
          <RowActions>
            <RowAction href={`/admin/benutzer/${m.id}`} label={t('rowOpen')}>
              <ActionIcon.open aria-hidden />
            </RowAction>
            <RowAction href={`/admin/benutzer/${m.id}/bearbeiten`} label={t('rowEdit')}>
              <ActionIcon.edit aria-hidden />
            </RowAction>
            {/* Not behind the divider: changing what somebody may open is the
                everyday act on this list, not the dangerous end of it. */}
            <RowAction href={`/admin/benutzer/${m.id}/rechte`} label={t('rowRights')}>
              <ShieldUser aria-hidden />
            </RowAction>
            <RowActionButton
              label={link.allowed ? t('rowReset') : `${t('rowReset')} — ${reason(link.because)}`}
              disabled={!link.allowed}
              onClick={() => reset(m)}
            >
              <KeyRound aria-hidden />
            </RowActionButton>

            <RowActionsDivider />

            <RowActionButton
              tone={m.active ? 'danger' : 'default'}
              label={
                deactivate.allowed
                  ? t(m.active ? 'rowDeactivate' : 'rowReactivate')
                  : `${t(m.active ? 'rowDeactivate' : 'rowReactivate')} — ${reason(deactivate.because)}`
              }
              disabled={!deactivate.allowed}
              onClick={() => askDeactivate(m)}
            >
              {m.active ? <ActionIcon.deactivate aria-hidden /> : <ActionIcon.activate aria-hidden />}
            </RowActionButton>
            <RowActionButton
              tone="danger"
              label={
                remove.allowed ? t('rowDelete') : `${t('rowDelete')} — ${reason(remove.because)}`
              }
              disabled={!remove.allowed}
              onClick={() => deleting.ask(m)}
            >
              <ActionIcon.delete aria-hidden />
            </RowActionButton>
          </RowActions>
        );
      }}
      empty={
        filtering ? (
          <EmptyState
            icon={Search}
            title={t('searchEmptyTitle')}
            body={query ? t('searchEmptyBody', { query }) : t('filterEmptyBody')}
          />
        ) : tab === 'deactivated' ? (
          <EmptyState
            icon={UserX}
            title={t('deactivatedEmptyTitle')}
            body={t('deactivatedEmptyBody')}
          />
        ) : (
          <EmptyState title={t('emptyTitle')} body={t('emptyBody')} action={addButton} />
        )
      }
    />
  );

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} actions={addButton} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <Toolbar
          search={{
            value: query,
            onChange: setQuery,
            label: t('search'),
            clearLabel: appT('clearSearch'),
          }}
          views={
            <TabsList className="p-0.5">
              <TabsTrigger value="active" className="h-8 gap-1.5 px-2.5 py-0">
                {t('tabActive')}
              </TabsTrigger>
              <TabsTrigger value="deactivated" className="h-8 gap-1.5 px-2.5 py-0">
                {t('tabDeactivated')}
                {deactivatedCount > 0 && (
                  <span data-numeric className="text-ink-tertiary">
                    {deactivatedCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          }
          count={
            filtering
              ? appT('results', { shown: filtered.length, total: inTab.length })
              : appT('resultsAll', { total: inTab.length })
          }
          filters={
            <label className="min-w-36">
              <span className="sr-only">{t('filterRole')}</span>
              <Select
                dense
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
              >
                <option value="all">
                  {t('filterRole')}: {t('filterAll')}
                </option>
                <option value="owner">{roles('owner')}</option>
                <option value="contractor">{roles('contractor')}</option>
                <option value="office">{roles('office')}</option>
              </Select>
            </label>
          }
        />

        <TabsContent value="active">{list}</TabsContent>
        <TabsContent value="deactivated">{list}</TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deactivating.open}
        onOpenChange={(open) => !open && deactivating.dismiss()}
        title={confirmT('deactivateTitle', {
          name: deactivating.target ? fullName(deactivating.target) : '',
        })}
        body={confirmT('deactivateBody')}
        action={confirmT('deactivateAction')}
        dismiss={dismissLabel}
        onConfirm={confirmDeactivate}
      >
        {/*
          The jobs already on somebody's calendar, said out loud before the
          switch is flipped.

          Deactivating does not cancel them and does not hand them on — that is
          a decision about a customer's Tuesday, not about an account, and this
          screen refuses to make it silently. What it can do is stop the office
          finding out on Tuesday.
        */}
        {deactivating.target &&
          (() => {
            const jobs = upcomingJobs(deactivating.target, data.bookings, now);
            if (jobs.length === 0) return null;
            const day = jobs[0]!.start.slice(0, 10);
            return (
              <div className="rounded-[var(--radius-md)] border border-status-warning-line bg-status-warning p-4 text-sm text-status-warning-fg">
                <p>{confirmT('deactivateJobs', { n: jobs.length })}</p>
                <Link
                  href={`/admin/kalender?tag=${day}`}
                  className="mt-2 inline-block font-medium underline-offset-4 hover:underline"
                >
                  {confirmT('deactivateJobsLink')}
                </Link>
              </div>
            );
          })()}
      </ConfirmDialog>

      <ConfirmDialog
        open={deleting.open}
        onOpenChange={(open) => !open && deleting.dismiss()}
        title={confirmT('deleteTitle', {
          name: deleting.target ? fullName(deleting.target) : '',
        })}
        body={confirmT('deleteBody')}
        action={confirmT('deleteAction')}
        dismiss={dismissLabel}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
