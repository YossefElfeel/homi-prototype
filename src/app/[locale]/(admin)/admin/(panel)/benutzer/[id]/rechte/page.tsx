'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { SwitchField } from '@/components/ui/switch';
import {
  AREAS,
  GRANTABLE_PERMISSIONS,
  PERMISSION_GROUPS,
  PRESETS,
  PRESET_KEYS,
  areasInGroup,
  matchingPreset,
  type PresetKey,
} from '@/lib/admin-permissions';
import { fullName, userPermission } from '@/lib/user-facts';
import { useHydrated, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';
import type { AdminPermission } from '@/mock/schema';

/**
 * Screen U5 — what one account may open.
 *
 * The matrix is generated, not written. Its rows are `AREAS` — the same list
 * the sidebar is built from — so a screen cannot appear in the navigation
 * without appearing here to be granted, and a right cannot be offered here for
 * a screen that does not exist. That is the whole of "scalable": adding a tab
 * next month is adding one string to `ADMIN_PERMISSIONS`, and this page grows a
 * row on its own.
 *
 * Switches, not checkboxes, and no save button. Every flip is written the
 * moment it is made — which is honest, because that is when it takes effect:
 * the person on the other end has the row in their sidebar or does not, and a
 * staged draft would let the office believe otherwise while they typed. The
 * change log coalesces the writes so granting four areas files one entry rather
 * than four (see `setTeamMemberPermissions`).
 *
 * Two rights are shown but cannot be flipped. Hiding them would have been
 * easier and would have made «Voller Zugriff» a claim this screen quietly does
 * not honour — so they are here, off, with the reason beside them.
 */
export default function UserRightsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.users.rights');
  const navT = useTranslations('admin.shell.nav');
  const groupT = useTranslations('admin.shell.groups');
  const areaT = useTranslations('admin.users.areas');
  const hydrated = useHydrated();

  const team = useStore((s) => s.data.team);
  const memberId = useStore((s) => s.demo.currentMemberId);
  const setPermissions = useStore((s) => s.setTeamMemberPermissions);

  if (!hydrated) return <SkeletonPage label={t('back')} />;

  const member = team.find((m) => m.id === id);
  if (!member) return <p className="text-ink-tertiary">—</p>;

  const actor = team.find((m) => m.id === memberId);
  const allowed = userPermission('permissions', { actor, target: member });
  const current = member.permissions;
  const preset = matchingPreset(current);

  const backLink = { href: `/admin/benutzer/${member.id}`, label: t('back') };

  /*
   * Two screens that are not a matrix, and they are different refusals.
   *
   * The owner has no stored rights to edit — theirs follow from the role, so
   * there is nothing here to render. Your own account is a refusal of a
   * different kind: the rights exist, they are just not yours to widen.
   */
  if (!allowed.allowed) {
    return (
      <div>
        <PageHeader title={t('title', { name: fullName(member) })} back={backLink} />
        <Alert
          tone="neutral"
          icon={Lock}
          title={allowed.because === 'owner' ? t('ownerTitle') : t('selfTitle')}
        >
          {allowed.because === 'owner' ? t('ownerBody') : t('selfBody')}
        </Alert>
      </div>
    );
  }

  function apply(next: AdminPermission[]) {
    /* Sorted into `AREAS` order rather than click order, so the record's own
       list reads down the sidebar and `matchingPreset` can compare sets without
       caring which switch was flipped first. */
    const ordered = AREAS.filter((area) => next.includes(area.permission)).map(
      (area) => area.permission,
    );
    setPermissions(member!.id, ordered);
  }

  function toggle(permission: AdminPermission, on: boolean) {
    apply(on ? [...current, permission] : current.filter((p) => p !== permission));
  }

  function applyPreset(key: PresetKey) {
    apply([...PRESETS[key]]);
    toast.success(t('presetApplied', { preset: t(`presets.${key}`) }));
  }

  const total = GRANTABLE_PERMISSIONS.length;
  const count = current.length;
  const lockedAreas = AREAS.filter((area) => area.ownerOnly);

  return (
    <div>
      <PageHeader
        title={t('title', { name: fullName(member) })}
        lead={t('lead')}
        back={backLink}
        meta={
          <span data-numeric className="text-sm text-ink-tertiary">
            {count === 0
              ? t('countNone')
              : count === 1
                ? t('countOne', { total })
                : t('count', { n: count, total })}
          </span>
        }
      />

      <Card>
        <CardHeader
          title={t('presetsTitle')}
          description={t('presetsHint')}
          actions={
            count > 0 ? (
              <Button size="sm" variant="ghost" onClick={() => apply([])}>
                {t('clearAll')}
              </Button>
            ) : undefined
          }
        />
        <CardBody className="flex flex-wrap gap-2">
          {PRESET_KEYS.map((key) => (
            <Button
              key={key}
              size="sm"
              /* The active preset is stated rather than merely highlighted —
                 «Eigene Auswahl» below covers the case where none matches, so
                 the reader is never left guessing whether one is in force. */
              variant={preset === key ? 'quiet' : 'secondary'}
              onClick={() => applyPreset(key)}
            >
              {t(`presets.${key}`)}
            </Button>
          ))}
          <span className="flex items-center px-2 text-sm text-ink-tertiary">
            {preset ? t(`presets.${preset}`) : t('custom')}
          </span>
        </CardBody>
      </Card>

      {count === 0 && (
        <Alert tone="warning" title={t('emptyNoticeTitle')} className="mt-app-section">
          {t('emptyNoticeBody')}
          {member.role === 'contractor' && ` ${t('emptyNoticeField')}`}
        </Alert>
      )}

      <p className="mt-app-section text-sm text-ink-tertiary">{t('savedHint')}</p>

      {PERMISSION_GROUPS.map((group) => {
        const areas = areasInGroup(group).filter((area) => !area.ownerOnly);
        if (areas.length === 0) return null;
        const allOn = areas.every((area) => current.includes(area.permission));

        return (
          <Card key={group} className="mt-4">
            <CardHeader
              title={groupT(group)}
              actions={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    apply(
                      allOn
                        ? current.filter(
                            (p) => !areas.some((area) => area.permission === p),
                          )
                        : [...current, ...areas.map((area) => area.permission)],
                    )
                  }
                >
                  {t('selectAll')}
                </Button>
              }
            />
            <CardBody className="divide-y divide-line-subtle">
              {areas.map((area) => (
                <SwitchField
                  key={area.permission}
                  className="py-3 first:pt-0 last:pb-0"
                  label={navT(area.permission)}
                  hint={areaT(area.permission)}
                  checked={current.includes(area.permission)}
                  onCheckedChange={(on) => toggle(area.permission, on)}
                />
              ))}
            </CardBody>
          </Card>
        );
      })}

      {/*
        The two that cannot be granted, listed last and switched off.

        A `SwitchField` that is `disabled` would read as "not yet" — a control
        waiting for something. These are never going to move, so they are not
        drawn as controls at all: a locked line with the reason on it.
      */}
      <Card tone="muted" className="mt-app-section">
        <CardHeader title={t('lockedTitle')} description={t('lockedNote')} />
        <CardBody className="space-y-3">
          {lockedAreas.map((area) => (
            <div key={area.permission} className="flex gap-3">
              <Lock className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
              <div className="min-w-0">
                <p className={cn('text-sm font-medium text-ink-secondary')}>
                  {navT(area.permission)}
                </p>
                <p className="mt-0.5 text-sm text-ink-tertiary">
                  {area.ownerOnly === 'privacy' ? t('lockedPrivacy') : t('lockedEscalation')}
                </p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="mt-app-section">
        <Button asChild variant="secondary">
          <Link href={backLink.href}>{backLink.label}</Link>
        </Button>
      </div>
    </div>
  );
}
