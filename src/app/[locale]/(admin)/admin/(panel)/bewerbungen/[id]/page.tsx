'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import {
  AlertTriangle,
  ArrowRight,
  Car,
  Download,
  FileText,
  Mail,
  MapPin,
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
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { ConfirmDialog, useDismissLabel } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Field, Select, Textarea } from '@/components/ui/field';
import { StatusBadge } from '@/components/ui/status-badge';
import { buildTextPdf, downloadBlob } from '@/lib/pdf';
import { canSeeApplicants, useHydrated, useStore } from '@/mock/store';
import type { ApplicantDocument } from '@/mock/schema';

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

const DOC_KIND_KEY = {
  cv: 'docCv',
  certificate: 'docCertificate',
  reference: 'docReference',
  other: 'docOther',
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
 *
 * **What changed here.** The whole record was one flat run of `<section>`s on
 * the grey page ground, and it read as one undifferentiated column of facts
 * about a stranger. Two costs, both of them the same cost:
 *
 *  · **the personal details were scattered.** Name was in the `<h1>`, email
 *    and phone and postcode were a wrapped row of links, the permit was its
 *    own section two blocks down, the languages a third — four places for the
 *    eight answers of step one of the public form. They are one card now, in
 *    the form's own order and under the form's own labels, because they are
 *    one thing: what this person told us about themselves.
 *  · **the attachments were text.** A CV was a filename, a file icon and a
 *    size in KB, with nothing to click. The one action the owner actually
 *    wants from an application — read the CV — was the one thing the screen
 *    could not do. Each document downloads now, and really does produce a
 *    file; see `lib/pdf.ts` for what is and is not in it.
 */
export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('admin.application');
  /* «3 Jahre» is worded once, in the namespace the list column already reads
     it from. A second copy here is a second thing to keep in step. */
  const listT = useTranslations('admin.applications');
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

  /*
   * The file is generated here rather than fetched, because there is nothing
   * to fetch — `ApplicantDocument` carries a name, a kind and a size, and no
   * bytes. Saying so on the first page of the PDF is the point: a stand-in
   * that does not announce itself is worse than the toast it replaced.
   */
  function download(doc: ApplicantDocument) {
    downloadBlob(
      doc.name,
      buildTextPdf([
        { text: doc.name, size: 18, lead: 14 },
        { text: t('pdfStandIn'), size: 9, lead: 22 },
        { text: `${t('pdfApplicant')}: ${application!.firstName} ${application!.lastName}` },
        { text: `${t('pdfReference')}: ${application!.reference}` },
        { text: `${t('pdfSubmitted')}: ${longDate(application!.submittedAt)}` },
        { text: `${t('pdfKind')}: ${t(DOC_KIND_KEY[doc.kind])}` },
        { text: `${t('pdfSize')}: ${doc.sizeKb} KB` },
      ]),
    );
    toast.success(t('downloaded', { name: doc.name }));
  }

  return (
    <div>
      <PageHeader
        title={`${application.firstName} ${application.lastName}`}
        back={{ href: '/admin/bewerbungen', label: t('back') }}
        meta={<StatusBadge entity="application" state={application.status} />}
        lead={
          <>
            {posting
              ? t('forPosting', { title: posting.title[locale] })
              : t('spontaneous')}
            {' · '}
            <span data-numeric>{application.reference}</span>
            {' · '}
            {t('submittedOn', { date: longDate(application.submittedAt) })}
          </>
        }
      />

      <div className="space-y-app-section">
        {application.status === 'rejected' && application.rejectionReason && (
          <Alert tone="neutral">
            {t('rejectedWith', { reason: reasonLabel(application.rejectionReason) ?? '—' })}
          </Alert>
        )}

        {member && (
          <Alert
            tone="success"
            title={t('convertedTitle')}
            action={
              <Button asChild variant="secondary" size="sm">
                <Link href={`/admin/team/${member.id}`}>
                  {t('convertedLink')}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            }
          >
            {t('convertedBody', { date: longDate(member.startedAt) })}
          </Alert>
        )}

        {/*
          Step one of the public form, in the public form's order and reading
          its labels out of `careers.form` rather than a second copy in the
          admin namespace. One namespace means «PLZ» cannot become «Postleitzahl»
          on the screen that reads the answer back.
        */}
        <Card>
          <CardHeader title={t('personalTitle')} description={t('personalHint')} />
          <CardBody>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Detail label={form('firstName')} value={application.firstName} />
              <Detail label={form('lastName')} value={application.lastName} />
              <Detail
                label={form('email')}
                value={
                  <a
                    href={`mailto:${application.email}`}
                    className="inline-flex items-center gap-2 break-all underline-offset-4 hover:underline"
                  >
                    <Mail className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                    {application.email}
                  </a>
                }
              />
              <Detail
                label={form('phone')}
                value={
                  <a
                    href={`tel:${application.phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                  >
                    <Phone className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                    <span data-numeric>{application.phone}</span>
                  </a>
                }
              />
              <Detail
                label={form('postcode')}
                value={<span data-numeric>{application.postcode}</span>}
              />
              <Detail
                label={form('city')}
                value={
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                    {application.city}
                  </span>
                }
              />
              <Detail
                label={form('permitTitle')}
                value={form(PERMIT_KEY[application.permit])}
              />
              <Detail
                label={form('languagesTitle')}
                value={
                  routing.locales
                    .filter((l) => application.languages[l])
                    .map(
                      (l) =>
                        `${LOCALE_LABELS[l]} — ${form(LEVEL_KEY[application.languages[l] ?? 'none'])}`,
                    )
                    .join(' · ') || '—'
                }
              />
            </dl>

            {application.permit === 'none' && (
              <Alert tone="danger" icon={AlertTriangle} className="mt-6">
                {t('permitNoneWarning')}
              </Alert>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('profileTitle')} />
          <CardBody>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Detail
                label={t('experienceTitle')}
                value={
                  <>
                    <span data-numeric>
                      {listT('years', { n: application.yearsExperience })}
                    </span>
                    {application.experienceAreas.length > 0 && (
                      <>
                        {' · '}
                        {application.experienceAreas
                          .map((a) =>
                            a === 'cleaning' ? form('areaCleaning') : form('areaAssembly'),
                          )
                          .join(', ')}
                      </>
                    )}
                  </>
                }
              />
              <Detail
                label={t('mobilityTitle')}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Car className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                    {t('licence')}: {application.hasDrivingLicence ? t('yes') : t('no')}
                    {' · '}
                    {t('car')}: {application.hasCar ? t('yes') : t('no')}
                  </span>
                }
              />
              <Detail
                label={t('availabilityTitle')}
                value={
                  <span data-numeric>
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
                  </span>
                }
              />
              {/* Asked for on the public form and shown nowhere until now — so
                  "can this person start before the end of the month" was a
                  question the record could answer and the screen could not. */}
              <Detail
                label={form('startFrom')}
                value={
                  application.startFrom ? longDate(application.startFrom) : '—'
                }
              />
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('referencesTitle')} />
          <CardBody>
            {application.references.length === 0 ? (
              <p className="text-sm text-ink-tertiary">{t('referencesEmpty')}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {application.references.map((ref) => (
                  <li key={ref.phone} className="flex flex-wrap gap-x-3">
                    <span className="font-medium">{ref.name}</span>
                    {ref.company && (
                      <span className="text-ink-secondary">{ref.company}</span>
                    )}
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
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('documentsTitle')} description={t('documentsHint')} />
          <CardBody>
            {application.documents.length === 0 ? (
              <p className="text-sm text-ink-tertiary">{t('documentsEmpty')}</p>
            ) : (
              <ul className="space-y-2">
                {application.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-md)] border border-line-subtle bg-sunken p-3"
                  >
                    <FileText className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                    <span className="min-w-0 flex-1 break-all text-sm">
                      {doc.name}
                      <span className="ms-2 text-ink-tertiary">
                        {t(DOC_KIND_KEY[doc.kind])}
                        {' · '}
                        <span data-numeric>{doc.sizeKb} KB</span>
                      </span>
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={t('downloadLabel', { name: doc.name })}
                      onClick={() => download(doc)}
                    >
                      <Download className="size-4" aria-hidden />
                      {t('download')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {application.motivation && (
          <Card>
            <CardHeader title={t('motivationTitle')} />
            <CardBody>
              <p className="max-w-[var(--measure)] text-ink-secondary">
                {application.motivation}
              </p>
            </CardBody>
          </Card>
        )}

        {/* No CardHeader on this one: the field carries its own visible label
            and hint, and a card title above them would be the same words a
            second time. */}
        <Card>
          <Field label={t('notesTitle')} hint={t('notesHint')}>
            {(props) => (
              <Textarea
                rows={3}
                value={application.internalNotes ?? ''}
                onChange={(e) =>
                  updateApplication(application.id, { internalNotes: e.target.value })
                }
                {...props}
              />
            )}
          </Field>
        </Card>

        {application.status !== 'accepted' && (
          <Card>
            <CardHeader title={t('actionsTitle')} />
            <CardBody className="flex flex-wrap items-center gap-2">
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
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title={t('retentionTitle')} />
          <CardBody>
            <p className="max-w-[var(--measure)] text-sm text-ink-secondary">
              {t('retentionBody', {
                date: longDate(application.retainUntil),
                consent: longDate(application.consentGivenAt),
              })}
            </p>
          </CardBody>
          <CardFooter>
            <Button variant="quiet" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" aria-hidden />
              {t('deleteAction')}
            </Button>
          </CardFooter>
        </Card>
      </div>

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

/**
 * One answer, with the question above it.
 *
 * A `<dl>` rather than a two-column table of `<div>`s because that is what
 * this is — and it is what lets a screen reader read "Arbeitsbewilligung,
 * Ausweis B" as a pair instead of as two loose strings on the same row.
 */
function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="label-type text-ink-tertiary">{label}</dt>
      <dd className="mt-1 min-h-6">{value}</dd>
    </div>
  );
}
