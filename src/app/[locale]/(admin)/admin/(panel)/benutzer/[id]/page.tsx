'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import {
  ArrowRight,
  CalendarDays,
  History,
  KeyRound,
  Mail,
  Phone,
  ShieldUser,
} from 'lucide-react';
import { toast } from 'sonner';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import {
  ConfirmDialog,
  useConfirmTarget,
  useDismissLabel,
} from '@/components/ui/confirm-dialog';
import { DetailList, DetailRow } from '@/components/ui/detail-list';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { AREAS, grantedPermissions } from '@/lib/admin-permissions';
import {
  RESET_LINK_HOURS,
  fullName,
  resetLinkExpired,
  resetLinkPath,
  upcomingJobs,
  userHistory,
  userPermission,
} from '@/lib/user-facts';
import { regionByPostcode } from '@/mock/engines/coverage';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { TeamMember } from '@/mock/schema';

/**
 * Screen U2 — one account.
 *
 * The old team record answered "what can this person open?" with the same four
 * sentences for everybody, and it answered nothing else. Four blocks were
 * missing and each one was a thing the office had to do by ringing somebody:
 * what they may actually see, whether the account is switched on, how a person
 * who has forgotten their password gets a new one, and — the one this feature
 * turns on — what a deactivation is about to leave alone.
 *
 * The order is the order the questions arrive in. Access first, because it is
 * why anybody opens this screen. Status second, because it is the decision.
 * The password below both, because it is a chore rather than a decision. The
 * field half last: it is about the person, not the account, and on an office
 * record it is not there at all.
 */
export default function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.users.detail');
  const roles = useTranslations('admin.users.roles');
  const areaT = useTranslations('admin.users.areas');
  const navT = useTranslations('admin.shell.nav');
  const confirmT = useTranslations('admin.users.confirm');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();
  const router = useRouter();
  const now = useNow();

  const data = useStore((s) => s.data);
  const services = useStore((s) => s.services);
  const memberId = useStore((s) => s.demo.currentMemberId);
  const setActive = useStore((s) => s.setTeamMemberActive);
  const removeUser = useStore((s) => s.deleteTeamMember);
  const issueReset = useStore((s) => s.issuePasswordReset);

  const dismissLabel = useDismissLabel();
  const deactivating = useConfirmTarget<TeamMember>();

  /*
   * The link, held for this visit only.
   *
   * The record keeps *that* a link was issued and when it expires; the token
   * itself is shown once and then only from here. That is the honest shape for
   * a credential — a reset URL sitting on a screen anybody with the account
   * open can read is a second password, and the record already answers the
   * question the office actually asks, which is "did I already send one?".
   */
  const [shownToken, setShownToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  /* A plain flag rather than `useConfirmTarget`: there is only one row here,
     and it cannot vanish mid-fade the way a table's can. */
  const [deleting, setDeleting] = useState(false);

  if (!hydrated) return <SkeletonPage label={t('contactTitle')} />;

  const member = data.team.find((m) => m.id === id);
  if (!member) return <p className="text-ink-tertiary">—</p>;

  const actor = data.team.find((m) => m.id === memberId);
  const application = data.applications.find((a) => a.id === member.fromApplicationId);
  const history = userHistory(member, data);
  const jobs = upcomingJobs(member, data.bookings, now).slice(0, 5);
  const granted = grantedPermissions(member);
  const isOwner = member.role === 'owner';

  const may = (action: Parameters<typeof userPermission>[0]) =>
    userPermission(action, { actor, target: member, history });

  const deleteDenial = may('delete');
  const statusChange = may(member.active ? 'deactivate' : 'reactivate');

  const reset = may('reset');
  const lastReset = member.passwordReset;
  const expired = resetLinkExpired(lastReset, now);
  const linkPath = shownToken ? resetLinkPath(shownToken) : null;

  function issue() {
    const token = issueReset(member!.id, now);
    setShownToken(token);
    setCopied(false);
    toast.success(
      t('passwordDone', { name: fullName(member!), hours: RESET_LINK_HOURS }),
    );
  }

  async function copyLink() {
    if (!linkPath) return;
    /* Absolute, because the link leaves this browser — it gets pasted into a
       chat or read out over the phone, and «/passwort?token=…» is not
       something the person on the other end can open. */
    const absolute = `${window.location.origin}/${locale}${linkPath}`;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      toast.success(t('passwordCopied'));
    } catch {
      /* Clipboard access is refused often enough — an insecure origin, a
         browser setting — that failing silently would leave the office
         wondering whether the click registered. The link is on screen either
         way; this only says the shortcut did not work. */
      setCopied(false);
    }
  }

  function confirmDeactivate() {
    deactivating.dismiss();
    setActive(member!.id, false, now);
    toast.success(confirmT('deactivateDone', { name: fullName(member!) }));
  }

  function reactivate() {
    setActive(member!.id, true, now);
    toast.success(confirmT('reactivateDone', { name: fullName(member!) }));
  }

  return (
    <div>
      <PageHeader
        title={fullName(member)}
        back={{ href: '/admin/benutzer', label: t('back') }}
        meta={
          <>
            <StatusBadge entity="user" state={member.active ? 'active' : 'deactivated'} />
            <Chip>{roles(member.role)}</Chip>
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href={`/admin/benutzer/${member.id}/bearbeiten`}>{t('editAction')}</Link>
            </Button>
            {!isOwner && (
              <Button asChild>
                <Link href={`/admin/benutzer/${member.id}/rechte`}>
                  <ShieldUser className="size-4" aria-hidden />
                  {t('rightsAction')}
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <p className="-mt-4 mb-app-section text-sm text-ink-tertiary">
        {t('since')}{' '}
        <span data-numeric>
          {format.dateTime(new Date(member.startedAt), {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </span>
        {member.deactivatedAt && (
          <>
            {' · '}
            <span data-numeric>
              {t('deactivatedOn', {
                date: format.dateTime(new Date(member.deactivatedAt), 'short'),
              })}
            </span>
          </>
        )}
        {application && (
          <>
            {' · '}
            <Link
              href={`/admin/bewerbungen/${application.id}`}
              className="underline-offset-4 hover:underline"
            >
              {t('fromApplication', { reference: application.reference })}
            </Link>
          </>
        )}
      </p>

      {!member.active && (
        <Alert tone="neutral" title={t('deactivatedNoteTitle')} className="mb-app-section">
          {t('deactivatedNoteBody')}
        </Alert>
      )}

      <Card>
        <CardHeader title={t('contactTitle')} />
        <CardBody className="flex flex-wrap gap-x-8 gap-y-1">
          <a
            href={`mailto:${member.email}`}
            className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"
          >
            <Mail className="size-4 text-ink-tertiary" aria-hidden />
            {member.email}
          </a>
          <a
            href={`tel:${member.phone.replace(/\s/g, '')}`}
            className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"
          >
            <Phone className="size-4 text-ink-tertiary" aria-hidden />
            <span data-numeric>{member.phone}</span>
          </a>
        </CardBody>
      </Card>

      {/* ----------------------------------------------------------- access */}
      <Card className="mt-app-section">
        <CardHeader
          title={t('accessTitle')}
          description={isOwner ? undefined : t('accessLead')}
          actions={
            isOwner ? undefined : (
              <Button asChild size="sm" variant="ghost">
                <Link href={`/admin/benutzer/${member.id}/rechte`}>{t('rightsAction')}</Link>
              </Button>
            )
          }
        />
        <CardBody>
          {isOwner ? (
            <p className="text-sm text-ink-secondary">{t('accessOwner')}</p>
          ) : member.permissions.length === 0 ? (
            <Alert tone="neutral" title={t('accessNoneTitle')}>
              {member.role === 'office' ? t('accessNoneOffice') : t('accessNoneBody')}
            </Alert>
          ) : (
            /*
             * The areas themselves, not a count.
             *
             * A number is what the list column shows, because a list is scanned;
             * a record is read, and the only useful answer here is which rooms
             * the key opens. Rendered in `AREAS` order — the sidebar's order —
             * so the reader can hold this list against the menu they are looking
             * at without re-sorting it in their head.
             *
             * Read off the record rather than through `grantedPermissions`, so a
             * deactivated account still shows what comes back when it is
             * switched on again. The one thing that *is* read through the
             * helper is whether a right is being honoured — a granted
             * owner-only right is printed struck through rather than silently
             * dropped.
             */
            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {AREAS.filter((area) => member.permissions.includes(area.permission)).map(
                (area) => {
                  const honoured = granted.includes(area.permission) || !member.active;
                  return (
                    <li key={area.permission} className="flex gap-2.5 text-sm">
                      <span
                        aria-hidden
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                      />
                      <span className="min-w-0">
                        <span className={honoured ? 'font-medium' : 'font-medium line-through'}>
                          {navT(area.permission)}
                        </span>
                        <span className="block text-ink-tertiary">
                          {areaT(area.permission)}
                        </span>
                      </span>
                    </li>
                  );
                },
              )}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ------------------------------------------- status and what it keeps */}
      <Card className="mt-app-section">
        <CardHeader title={t('statusTitle')} />
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={member.active ? 'danger' : 'primary'}
              disabled={!statusChange.allowed}
              onClick={() => (member.active ? deactivating.ask(member) : reactivate())}
            >
              {t(member.active ? 'deactivateAction' : 'reactivateAction')}
            </Button>
            {/* A disabled button with nothing beside it is a dead end. The
                reason sits next to it, in the same words the list's menu uses. */}
            {!statusChange.allowed && (
              <p className="text-sm text-ink-tertiary">
                {statusChange.because === 'owner'
                  ? t('deleteBlockedOwner')
                  : t('deleteBlockedSelf')}
              </p>
            )}
          </div>

          <div className="mt-6 border-t border-line-subtle pt-5">
            <h3 className="font-medium">{t('historyTitle')}</h3>
            <p className="mt-1 max-w-[var(--measure)] text-sm text-ink-secondary">
              {t('historyLead')}
            </p>

            {history.total === 0 ? (
              <p className="mt-3 text-sm text-ink-tertiary">{t('historyNone')}</p>
            ) : (
              <DetailList columns={2} className="mt-4">
                <DetailRow label={t('historyBookings')}>
                  <span data-numeric>{history.bookings}</span>
                </DetailRow>
                <DetailRow label={t('historyEvents')}>
                  <span data-numeric>{history.events}</span>
                </DetailRow>
                <DetailRow label={t('historyLog')}>
                  <span data-numeric>{history.logEntries}</span>
                </DetailRow>
              </DetailList>
            )}

            {history.logEntries > 0 && (
              <Button asChild variant="link" className="mt-2">
                <Link href={`/admin/protokoll?q=${encodeURIComponent(fullName(member))}`}>
                  <History className="size-4" aria-hidden />
                  {t('historyOpenLog')}
                </Link>
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* --------------------------------------------------------- password */}
      <Card className="mt-app-section" id="passwort">
        <CardHeader title={t('passwordTitle')} description={t('passwordLead')} />
        <CardBody>
          {linkPath ? (
            <div className="rounded-[var(--radius-md)] border border-line-subtle bg-sunken p-4">
              <p
                data-numeric
                className="text-sm break-all"
                /* Not a `SecretValue`. That component masks something the
                   reader already has and may reveal again; this is shown once
                   and cannot be got back, so hiding it behind an eye would
                   invite closing the page on an unread link. */
              >
                {linkPath}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={copyLink}>
                  {copied ? t('passwordCopied') : t('passwordCopy')}
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href={linkPath}>{t('passwordOpen')}</Link>
                </Button>
              </div>
              <p className="mt-3 text-sm text-status-warning-fg">{t('passwordWarning')}</p>
            </div>
          ) : (
            <p className="text-sm text-ink-tertiary">
              {!lastReset
                ? t('passwordNever')
                : expired
                  ? t('passwordExpired', {
                      when: format.dateTime(new Date(lastReset.issuedAt), 'short'),
                    })
                  : t('passwordIssued', {
                      when: format.dateTime(new Date(lastReset.issuedAt), 'short'),
                      until: format.dateTime(new Date(lastReset.expiresAt), 'time'),
                    })}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="secondary" disabled={!reset.allowed} onClick={issue}>
              <KeyRound className="size-4" aria-hidden />
              {t(lastReset ? 'passwordAgain' : 'passwordAction')}
            </Button>
            {!reset.allowed && (
              <p className="text-sm text-ink-tertiary">{t('deactivatedNoteTitle')}</p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ------------------------------------------------------- field work */}
      {member.role === 'office' ? (
        <Card className="mt-app-section">
          <CardHeader title={t('fieldTitle')} />
          <CardBody>
            <Alert tone="neutral" title={t('officeNoteTitle')}>
              {t('officeNoteBody')}
            </Alert>
          </CardBody>
        </Card>
      ) : (
        <Card className="mt-app-section">
          <CardHeader title={t('fieldTitle')} />
          <CardBody className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="label-type text-ink-tertiary">{t('skillsTitle')}</h3>
              <p className="mt-1 text-sm text-ink-tertiary">{t('skillsHint')}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {member.skills.map((slug) => (
                  <li key={slug}>
                    {services.find((s) => s.slug === slug)?.name[locale] ?? slug}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="label-type text-ink-tertiary">{t('regionsTitle')}</h3>
              <ul className="mt-3 space-y-1 text-sm">
                {member.regions.map((code) => (
                  <li key={code}>
                    <span data-numeric>{code}</span> {regionByPostcode(code)?.name ?? ''}
                  </li>
                ))}
              </ul>
              {/* An empty region list on a contractor is a real state — nobody has
                  said where this person works yet. An em dash rather than an
                  empty box, so the block reads as answered-with-nothing rather
                  than as a column that failed to render. */}
              {member.regions.length === 0 && (
                <p className="mt-3 text-sm text-ink-tertiary">—</p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {member.role !== 'office' && (
        <Card className="mt-app-section">
          <CardHeader title={t('jobsTitle')} />
          <CardBody>
            {jobs.length === 0 ? (
              <p className="text-sm text-ink-tertiary">{t('jobsEmpty')}</p>
            ) : (
              <ul className="border-t border-line-subtle">
                {jobs.map((booking) => {
                  const property = data.properties.find((p) => p.id === booking.propertyId);
                  return (
                    <li key={booking.id} className="border-b border-line-subtle">
                      <Link
                        href={`/admin/buchungen/${booking.id}`}
                        className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
                      >
                        <span data-numeric className="flex items-center gap-2 text-sm">
                          <CalendarDays className="size-3.5 text-ink-tertiary" aria-hidden />
                          {format.dateTime(new Date(booking.start), {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-sm text-ink-secondary">
                          {property ? `${property.street}, ${property.city}` : '—'}
                        </span>
                        <ArrowRight className="size-4 text-ink-tertiary" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      {/* ------------------------------------------------------ danger zone */}
      <Card tone="danger" className="mt-app-section">
        <CardHeader title={t('dangerTitle')} description={t('dangerBody')} />
        <CardBody>
          {deleteDenial.allowed ? (
            /* Reachable only on an account nothing names — which in the seeded
               data is nobody, and after «Benutzer anlegen» is the account you
               just typed in wrong. That is the whole intended audience. */
            <Button variant="danger" onClick={() => setDeleting(true)}>
              {t('deleteAction')}
            </Button>
          ) : (
            <p className="text-sm text-ink-secondary">
              {deleteDenial.because === 'history'
                ? t('deleteBlockedHistory', { n: history.total })
                : deleteDenial.because === 'owner'
                  ? t('deleteBlockedOwner')
                  : t('deleteBlockedSelf')}
            </p>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={deactivating.open}
        onOpenChange={(open) => !open && deactivating.dismiss()}
        title={confirmT('deactivateTitle', { name: fullName(member) })}
        body={confirmT('deactivateBody')}
        action={confirmT('deactivateAction')}
        dismiss={dismissLabel}
        onConfirm={confirmDeactivate}
      >
        {upcomingJobs(member, data.bookings, now).length > 0 && (
          <div className="rounded-[var(--radius-md)] border border-status-warning-line bg-status-warning p-4 text-sm text-status-warning-fg">
            <p>
              {confirmT('deactivateJobs', {
                n: upcomingJobs(member, data.bookings, now).length,
              })}
            </p>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={confirmT('deleteTitle', { name: fullName(member) })}
        body={confirmT('deleteBody')}
        action={confirmT('deleteAction')}
        dismiss={dismissLabel}
        onConfirm={() => {
          setDeleting(false);
          removeUser(member.id);
          toast.success(confirmT('deleteDone', { name: fullName(member) }));
          /* Back to the list — staying would leave the reader on the record of
             something that no longer exists, which renders as «—». */
          router.push('/admin/benutzer');
        }}
      />
    </div>
  );
}
