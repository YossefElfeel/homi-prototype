'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Car,
  FileText,
  Mail,
  Phone,
  RotateCcw,
  Trash2,
  UserCheck,
} from 'lucide-react';

import { toast } from 'sonner';

import { Link, useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ConfirmDialog, useDismissLabel } from '@/components/ui/confirm-dialog';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Field, Select, Textarea } from '@/components/ui/field';
import { StatusBadge } from '@/components/ui/status-badge';
import { canSeeApplicants, useHydrated, useStore } from '@/mock/store';

const REASONS = [
  { value: 'permit', key: 'reasonPermit' },
  { value: 'experience', key: 'reasonExperience' },
  { value: 'availability', key: 'reasonAvailability' },
  { value: 'region', key: 'reasonRegion' },
  { value: 'language', key: 'reasonLanguage' },
  { value: 'filled', key: 'reasonFilled' },
  { value: 'other', key: 'reasonOther' },
] as const;

const PERMIT_KEY = {
  ch: 'permitCh',
  c: 'permitC',
  b: 'permitB',
  g: 'permitG',
  l: 'permitL',
  other: 'permitOther',
  none: 'permitNone',
} as const;

const LEVEL_KEY = {
  none: 'levelNone',
  basic: 'levelBasic',
  conversational: 'levelConversational',
  fluent: 'levelFluent',
  native: 'levelNative',
} as const;

/**
 * Screen H2 — one application.
 *
 * Three things this screen refuses to be vague about:
 *
 *  · A missing work permit is stated as a hard stop, not a soft warning. §20
 *    leaves no discretion there, and a screen that implies otherwise invites
 *    an employment the business cannot legally make.
 *  · Turning somebody down requires a reason from a fixed list. The reason is
 *    internal; the message that goes out is written once in the templates, so
 *    the wording is consistent instead of improvised at 22:00.
 *  · Deleting is a real deletion with a confirmation, not an archive flag.
 *    revDSG asks for erasure, and an "archived" record is still a record.
 */
export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('admin.application');
  const dismissLabel = useDismissLabel();
  const form = useTranslations('careers.form');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const role = useStore((s) => s.demo.role);
  const applications = useStore((s) => s.data.applications);
  const postings = useStore((s) => s.data.postings);
  const team = useStore((s) => s.data.team);
  const setApplicationStatus = useStore((s) => s.setApplicationStatus);
  const rejectApplication = useStore((s) => s.rejectApplication);
  const deleteApplication = useStore((s) => s.deleteApplication);
  const updateApplication = useStore((s) => s.updateApplication);

  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState<string>('experience');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!hydrated) return <SkeletonPage label={t('back')} />;

  /*
   * Unreachable: AdminShell already returns its own gate for any role other
   * than owner, and canSeeApplicants is `role === 'owner'`. Kept as a
   * belt-and-braces check on the revDSG-sensitive screens rather than deleted,
   * but it can no longer render a second, differently-worded lock screen — it
   * returns nothing, which is what "already handled upstream" looks like.
   */
  if (!canSeeApplicants(role)) return null;

  const application = applications.find((a) => a.id === id);
  if (!application) return <p className="text-ink-tertiary">—</p>;

  const posting = postings.find((p) => p.id === application.postingId);
  const member = team.find((m) => m.id === application.convertedTeamMemberId);
  const reasonLabel = (value?: string) => {
    const found = REASONS.find((r) => r.value === value);
    return found ? t(found.key) : value;
  };

  const longDate = (iso: string) =>
    format.dateTime(new Date(iso), { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div>
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/bewerbungen">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-type text-3xl">
          {application.firstName} {application.lastName}
        </h1>
        <StatusBadge entity="application" state={application.status} />
      </div>
      <p className="mt-2 text-ink-secondary">
        {posting ? t('forPosting', { title: posting.title[locale] }) : t('spontaneous')}
        {' · '}
        <span data-numeric>{application.reference}</span>
      </p>

      {application.status === 'rejected' && application.rejectionReason && (
        <p className="mt-6 border-l-2 border-rule bg-sunken p-4 text-sm text-ink-secondary">
          {t('rejectedWith', { reason: reasonLabel(application.rejectionReason) ?? '—' })}
        </p>
      )}

      {member && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-l-2 border-status-success-line bg-status-success p-5">
          <div>
            <h2 className="font-medium text-status-success-fg">{t('convertedTitle')}</h2>
            <p className="mt-1 text-sm text-status-success-fg">
              {t('convertedBody', { date: longDate(member.startedAt) })}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/admin/team/${member.id}`}>
              {t('convertedLink')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      )}

      <section className="mt-10">
        <h2 className="label-type text-ink-tertiary">{t('contactTitle')}</h2>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
          <a
            href={`mailto:${application.email}`}
            className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"
          >
            <Mail className="size-4 text-ink-tertiary" aria-hidden />
            {application.email}
          </a>
          <a
            href={`tel:${application.phone.replace(/\s/g, '')}`}
            className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"
          >
            <Phone className="size-4 text-ink-tertiary" aria-hidden />
            <span data-numeric>{application.phone}</span>
          </a>
          <span className="inline-flex min-h-11 items-center gap-2 text-ink-secondary">
            <span data-numeric>{application.postcode}</span> {application.city}
          </span>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="label-type text-ink-tertiary">{t('permitTitle')}</h2>
        <p className="mt-2 text-lg">{form(PERMIT_KEY[application.permit])}</p>
        {application.permit === 'none' && (
          <Alert tone="danger" icon={AlertTriangle} className="mt-3">
            {t('permitNoneWarning')}
          </Alert>
        )}
      </section>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="label-type text-ink-tertiary">{t('languagesTitle')}</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            {routing.locales
              .filter((l) => application.languages[l])
              .map((l) => (
                <div key={l} className="flex justify-between gap-4">
                  <dt className="text-ink-secondary">{LOCALE_LABELS[l]}</dt>
                  <dd>{form(LEVEL_KEY[application.languages[l] ?? 'none'])}</dd>
                </div>
              ))}
          </dl>
        </section>

        <section>
          <h2 className="label-type text-ink-tertiary">{t('mobilityTitle')}</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="flex items-center gap-2">
              <Car className="size-4 text-ink-tertiary" aria-hidden />
              {t('licence')}: {application.hasDrivingLicence ? t('yes') : t('no')}
            </li>
            <li className="ps-6">
              {t('car')}: {application.hasCar ? t('yes') : t('no')}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="label-type text-ink-tertiary">{t('experienceTitle')}</h2>
          <p data-numeric className="mt-3 text-sm">
            {application.yearsExperience} · {application.experienceAreas
              .map((a) => (a === 'cleaning' ? form('areaCleaning') : form('areaAssembly')))
              .join(', ') || '—'}
          </p>
        </section>

        <section>
          <h2 className="label-type text-ink-tertiary">{t('availabilityTitle')}</h2>
          <p data-numeric className="mt-3 text-sm">
            {application.availability.days
              .map((day) =>
                new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', {
                  weekday: 'short',
                  timeZone: 'UTC',
                }).format(new Date(Date.UTC(2024, 0, day))),
              )
              .join(', ')}
            {' · '}
            {application.availability.earliest}–{application.availability.latest}
          </p>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="label-type text-ink-tertiary">{t('referencesTitle')}</h2>
        {application.references.length === 0 ? (
          <p className="mt-3 text-sm text-ink-tertiary">{t('referencesEmpty')}</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {application.references.map((ref) => (
              <li key={ref.phone} className="flex flex-wrap gap-x-3">
                <span className="font-medium">{ref.name}</span>
                {ref.company && <span className="text-ink-secondary">{ref.company}</span>}
                <a
                  href={`tel:${ref.phone.replace(/\s/g, '')}`}
                  data-numeric
                  className="underline-offset-4 hover:underline"
                >
                  {ref.phone}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="label-type text-ink-tertiary">{t('documentsTitle')}</h2>
        {application.documents.length === 0 ? (
          <p className="mt-3 text-sm text-ink-tertiary">{t('documentsEmpty')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {application.documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2.5 text-sm">
                <FileText className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                <span>{doc.name}</span>
                <span data-numeric className="text-ink-tertiary">
                  {doc.sizeKb} KB
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {application.motivation && (
        <section className="mt-8">
          <h2 className="label-type text-ink-tertiary">{t('motivationTitle')}</h2>
          <p className="mt-3 max-w-[var(--measure)] text-ink-secondary">
            {application.motivation}
          </p>
        </section>
      )}

      <Field label={t('notesTitle')} hint={t('notesHint')} className="mt-8">
        {(props) => (
          <Textarea
            rows={3}
            value={application.internalNotes ?? ''}
            onChange={(e) => updateApplication(application.id, { internalNotes: e.target.value })}
            {...props}
          />
        )}
      </Field>

      {application.status !== 'accepted' && (
        <section className="mt-10 border-t border-line-subtle pt-8">
          <h2 className="display-type text-xl">{t('actionsTitle')}</h2>

          <div className="mt-5 flex flex-wrap gap-3">
              {application.status === 'new' && (
                <Button
                  variant="secondary"
                  onClick={() => setApplicationStatus(application.id, 'inReview')}
                >
                  {t('startReview')}
                </Button>
              )}
              {/*
                The doc comment above this screen calls the missing-permit
                banner "a hard stop, not a soft warning" — and Accept was
                completely ungated, as was the account-creation screen behind
                it. Someone with no right to work in Switzerland could be
                converted into a team account in two clicks, past a red banner.
              */}
              <Button
                disabled={application.permit === 'none'}
                onClick={() => router.push(`/admin/bewerbungen/${application.id}/konto`)}
              >
                <UserCheck className="size-4" aria-hidden />
                {t('accept')}
              </Button>
              {application.status === 'rejected' ? (
                /* Accept was the only way out of a decline, which makes
                   "undo the mis-click" and "hire this person" the same
                   button. Back to the queue is its own answer. */
                <Button
                  variant="secondary"
                  onClick={() => {
                    setApplicationStatus(application.id, 'inReview');
                    toast.success(t('restored'));
                  }}
                >
                  <RotateCcw className="size-4" aria-hidden />
                  {t('restore')}
                </Button>
              ) : (
                <Button variant="quiet" onClick={() => setRejecting(true)}>
                  {t('reject')}
                </Button>
              )}
          </div>
        </section>
      )}

      <section className="mt-10 border-t border-line-subtle pt-8">
        <h2 className="display-type text-xl">{t('retentionTitle')}</h2>
        <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
          {t('retentionBody', {
            date: longDate(application.retainUntil),
            consent: longDate(application.consentGivenAt),
          })}
        </p>

        <Button variant="quiet" className="mt-5" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-4" aria-hidden />
          {t('deleteAction')}
        </Button>
      </section>

      {/*
        Both decisions used to open a block *underneath* the buttons — a
        hand-written copy of `ConfirmPanel` in one case and of the danger card
        in the other, neither of them the component. Declining pushed the whole
        retention section down the page, and the reason `Select` it opened with
        was easy to walk past on the way to the red button.

        revDSG makes the deletion the heavier of the two: an applicant record
        is personal data with a retention date on it, and there is no archive
        to fall back on.
      */}
      <ConfirmDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title={t('rejectTitle')}
        body={t('rejectHint')}
        action={t('rejectConfirm')}
        dismiss={dismissLabel}
        onConfirm={() => {
          rejectApplication(application.id, reason);
          setRejecting(false);
        }}
      >
        <Field label={t('rejectTitle')}>
          {(props) => (
            <Select value={reason} onChange={(e) => setReason(e.target.value)} {...props}>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {t(r.key)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('deleteConfirmTitle')}
        body={t('deleteConfirmBody')}
        action={t('deleteConfirm')}
        dismiss={dismissLabel}
        onConfirm={() => {
          deleteApplication(application.id);
          router.push('/admin/bewerbungen');
        }}
      />
    </div>
  );
}
