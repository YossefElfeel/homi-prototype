'use client';

import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, ArrowLeft, ArrowRight, FileText, Plus, Trash2 } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea, Checkbox } from '@/components/ui/field';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { LanguageLevel, WorkPermit } from '@/mock/schema';
import { cn } from '@/lib/cn';

/** §20 — the permit list is Swiss-specific and not a free-text field. */
const PERMITS = [
  { value: 'ch', key: 'permitCh' },
  { value: 'c', key: 'permitC' },
  { value: 'b', key: 'permitB' },
  { value: 'g', key: 'permitG' },
  { value: 'l', key: 'permitL' },
  { value: 'other', key: 'permitOther' },
  { value: 'none', key: 'permitNone' },
] as const satisfies readonly { value: WorkPermit; key: string }[];

const LEVELS = [
  { value: '', key: 'levelNone' },
  { value: 'basic', key: 'levelBasic' },
  { value: 'conversational', key: 'levelConversational' },
  { value: 'fluent', key: 'levelFluent' },
  { value: 'native', key: 'levelNative' },
] as const;

const DAYS = [1, 2, 3, 4, 5, 6] as const;
const MAX_KB = 5 * 1024;

/**
 * Screens C3 and C4 — the application, in two steps.
 *
 * Two decisions worth defending:
 *
 *  · The work permit is the first question, not the last. It is the only
 *    answer with no room to move, and asking it after four minutes of typing
 *    wastes the applicant's evening.
 *  · Answering "no permit yet" does not block the send. It shows what it means
 *    and lets the application through, because the alternative — a dead end
 *    with no explanation — teaches people to lie on the form.
 *
 * Consent (§14) is never pre-ticked and is not carried across a reset.
 */
export function ApplicationForm({ postingSlug }: { postingSlug?: string }) {
  const t = useTranslations('careers.form');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();
  const fileInput = useRef<HTMLInputElement>(null);

  const draft = useStore((s) => s.applicationDraft);
  const update = useStore((s) => s.updateApplicationDraft);
  const submitApplication = useStore((s) => s.submitApplication);
  const settings = useStore((s) => s.settings);
  const posting = useStore((s) => s.data.postings).find((p) => p.slug === postingSlug);

  const [step, setStep] = useState<1 | 2>(1);
  const [showErrors, setShowErrors] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const emailLooksWrong = draft.email.length > 0 && !/^\S+@\S+\.\S+$/.test(draft.email);
  const errorFor = (value: string) =>
    showErrors && !value.trim() ? t('required') : undefined;

  const step1Valid =
    draft.firstName.trim() &&
    draft.lastName.trim() &&
    draft.email.trim() &&
    !emailLooksWrong &&
    draft.phone.trim() &&
    draft.postcode.trim() &&
    draft.city.trim() &&
    draft.permit !== null;

  function goToStep2() {
    setShowErrors(true);
    if (!step1Valid) return;
    setShowErrors(false);
    setStep(2);
    window.scrollTo({ top: 0 });
  }

  function send() {
    setShowErrors(true);
    if (!draft.consent) return;
    if (posting) update({ postingId: posting.id });
    const { reference } = submitApplication(now);
    router.push(`/jobs/bewerbung/gesendet?ref=${reference}`);
  }

  function addFile(file: File) {
    const sizeKb = Math.round(file.size / 1024);
    if (sizeKb > MAX_KB) {
      setFileError(t('documentsTooLarge'));
      return;
    }
    setFileError(null);
    update({
      documents: [
        ...draft.documents,
        {
          id: `doc_${draft.documents.length + 1}_${sizeKb}`,
          name: file.name,
          kind: draft.documents.length === 0 ? 'cv' : 'other',
          sizeKb,
        },
      ],
    });
  }

  return (
    <div className="max-w-2xl">
      <p className="label-type text-ink-tertiary">{t('stepOf', { step })}</p>
      <h1 className="display-type mt-3 text-[clamp(1.75rem,3.4vw,2.5rem)]">
        {step === 1 ? t('step1Title') : t('step2Title')}
      </h1>
      <p className="mt-3 text-ink-secondary">
        {posting ? t('forPosting', { title: posting.title[locale] }) : t('spontaneousTitle')}
      </p>

      {step === 1 && (
        <div className="mt-10 space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('firstName')} error={errorFor(draft.firstName)}>
              {(props) => (
                <Input
                  value={draft.firstName}
                  onChange={(e) => update({ firstName: e.target.value })}
                  autoComplete="given-name"
                  {...props}
                />
              )}
            </Field>
            <Field label={t('lastName')} error={errorFor(draft.lastName)}>
              {(props) => (
                <Input
                  value={draft.lastName}
                  onChange={(e) => update({ lastName: e.target.value })}
                  autoComplete="family-name"
                  {...props}
                />
              )}
            </Field>
            <Field
              label={t('email')}
              error={
                emailLooksWrong && showErrors ? t('invalidEmail') : errorFor(draft.email)
              }
            >
              {(props) => (
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(e) => update({ email: e.target.value })}
                  autoComplete="email"
                  {...props}
                />
              )}
            </Field>
            <Field label={t('phone')} error={errorFor(draft.phone)}>
              {(props) => (
                <Input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  autoComplete="tel"
                  {...props}
                />
              )}
            </Field>
            <Field label={t('postcode')} error={errorFor(draft.postcode)}>
              {(props) => (
                <Input
                  inputMode="numeric"
                  value={draft.postcode}
                  onChange={(e) => update({ postcode: e.target.value })}
                  autoComplete="postal-code"
                  {...props}
                />
              )}
            </Field>
            <Field label={t('city')} error={errorFor(draft.city)}>
              {(props) => (
                <Input
                  value={draft.city}
                  onChange={(e) => update({ city: e.target.value })}
                  autoComplete="address-level2"
                  {...props}
                />
              )}
            </Field>
          </div>

          <fieldset className="border-t border-line-subtle pt-6">
            <legend className="sr-only">{t('permitTitle')}</legend>
            <Field
              label={t('permitTitle')}
              hint={t('permitHint')}
              error={showErrors && draft.permit === null ? t('required') : undefined}
            >
              {(props) => (
                <Select
                  value={draft.permit ?? ''}
                  onChange={(e) =>
                    update({ permit: (e.target.value || null) as WorkPermit | null })
                  }
                  {...props}
                >
                  <option value="" disabled />
                  {PERMITS.map(({ value, key }) => (
                    <option key={value} value={value}>
                      {t(key)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {draft.permit === 'none' && (
              <p className="mt-3 flex gap-2 border-l-2 border-status-warning-line bg-status-warning p-4 text-sm text-status-warning-fg">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t('permitNoneWarning')}
              </p>
            )}
          </fieldset>

          <fieldset className="border-t border-line-subtle pt-6">
            <legend className="text-sm font-medium">{t('languagesTitle')}</legend>
            <p className="mt-1 text-sm text-ink-tertiary">{t('languagesHint')}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {routing.locales.map((l) => (
                <Field key={l} label={LOCALE_LABELS[l]}>
                  {(props) => (
                    <Select
                      value={draft.languages[l] ?? ''}
                      onChange={(e) =>
                        update({
                          languages: {
                            ...draft.languages,
                            [l]: (e.target.value || undefined) as LanguageLevel | undefined,
                          },
                        })
                      }
                      {...props}
                    >
                      {LEVELS.map((level) => (
                        <option key={level.key} value={level.value}>
                          {t(level.key)}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              ))}
            </div>
          </fieldset>

          <fieldset className="border-t border-line-subtle pt-6">
            <legend className="text-sm font-medium">{t('mobilityTitle')}</legend>
            <p className="mt-1 text-sm text-ink-tertiary">{t('mobilityHint')}</p>
            <div className="mt-4 space-y-3">
              <Checkbox
                label={t('licence')}
                checked={draft.hasDrivingLicence}
                onChange={(e) => update({ hasDrivingLicence: e.target.checked })}
              />
              <Checkbox
                label={t('car')}
                checked={draft.hasCar}
                onChange={(e) => update({ hasCar: e.target.checked })}
              />
            </div>
          </fieldset>

          <div className="border-t border-line-subtle pt-6">
            <Button onClick={goToStep2}>
              {t('next')}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-10 space-y-6">
          <fieldset>
            <legend className="text-sm font-medium">{t('experienceTitle')}</legend>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field label={t('years')}>
                {(props) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={draft.yearsExperience ?? ''}
                    onChange={(e) =>
                      update({
                        yearsExperience: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    {...props}
                  />
                )}
              </Field>
              <div>
                <p className="text-sm font-medium">{t('areas')}</p>
                <div className="mt-3 space-y-3">
                  {(['cleaning', 'assembly'] as const).map((area) => (
                    <Checkbox
                      key={area}
                      label={area === 'cleaning' ? t('areaCleaning') : t('areaAssembly')}
                      checked={draft.experienceAreas.includes(area)}
                      onChange={(e) =>
                        update({
                          experienceAreas: e.target.checked
                            ? [...draft.experienceAreas, area]
                            : draft.experienceAreas.filter((x) => x !== area),
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className="border-t border-line-subtle pt-6">
            <legend className="text-sm font-medium">{t('availabilityTitle')}</legend>
            <p className="label-type mt-4 text-ink-secondary">{t('availabilityDays')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const on = draft.availability.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      update({
                        availability: {
                          ...draft.availability,
                          days: on
                            ? draft.availability.days.filter((d) => d !== day)
                            : [...draft.availability.days, day].sort((a, b) => a - b),
                        },
                      })
                    }
                    className={cn(
                      'min-h-11 rounded-[var(--radius-sm)] border px-4 text-sm transition-colors',
                      on
                        ? 'border-accent bg-accent-subtle font-medium text-ink'
                        : 'border-line text-ink-secondary hover:bg-sunken',
                    )}
                  >
                    {
                      // 2024-01-01 was a Monday; built in UTC so the
                      // Europe/Zurich formatter cannot shift the label.
                      new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-CH', {
                        weekday: 'short',
                        timeZone: 'UTC',
                      }).format(new Date(Date.UTC(2024, 0, day)))
                    }
                  </button>
                );
              })}
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <Field label={t('availabilityFrom')}>
                {(props) => (
                  <Input
                    type="time"
                    value={draft.availability.earliest}
                    onChange={(e) =>
                      update({
                        availability: { ...draft.availability, earliest: e.target.value },
                      })
                    }
                    {...props}
                  />
                )}
              </Field>
              <Field label={t('availabilityTo')}>
                {(props) => (
                  <Input
                    type="time"
                    value={draft.availability.latest}
                    onChange={(e) =>
                      update({
                        availability: { ...draft.availability, latest: e.target.value },
                      })
                    }
                    {...props}
                  />
                )}
              </Field>
              <Field label={t('startFrom')} optional>
                {(props) => (
                  <Input
                    type="date"
                    value={draft.startFrom}
                    onChange={(e) => update({ startFrom: e.target.value })}
                    {...props}
                  />
                )}
              </Field>
            </div>
          </fieldset>

          <fieldset className="border-t border-line-subtle pt-6">
            <legend className="text-sm font-medium">{t('referencesTitle')}</legend>
            <p className="mt-1 text-sm text-ink-tertiary">{t('referencesHint')}</p>
            {draft.references.length > 0 && (
              <ul className="mt-4 space-y-4">
                {draft.references.map((ref, index) => (
                  <li key={index} className="surface-card p-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label={t('referenceName')}>
                        {(props) => (
                          <Input
                            value={ref.name}
                            onChange={(e) =>
                              update({
                                references: draft.references.map((r, i) =>
                                  i === index ? { ...r, name: e.target.value } : r,
                                ),
                              })
                            }
                            {...props}
                          />
                        )}
                      </Field>
                      <Field label={t('referenceCompany')} optional>
                        {(props) => (
                          <Input
                            value={ref.company ?? ''}
                            onChange={(e) =>
                              update({
                                references: draft.references.map((r, i) =>
                                  i === index ? { ...r, company: e.target.value } : r,
                                ),
                              })
                            }
                            {...props}
                          />
                        )}
                      </Field>
                      <Field label={t('referencePhone')}>
                        {(props) => (
                          <Input
                            type="tel"
                            value={ref.phone}
                            onChange={(e) =>
                              update({
                                references: draft.references.map((r, i) =>
                                  i === index ? { ...r, phone: e.target.value } : r,
                                ),
                              })
                            }
                            {...props}
                          />
                        )}
                      </Field>
                    </div>
                    <Button
                      variant="quiet"
                      size="sm"
                      className="mt-4"
                      onClick={() =>
                        update({
                          references: draft.references.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <Trash2 className="size-4" aria-hidden />
                      {t('referenceRemove')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() =>
                update({ references: [...draft.references, { name: '', phone: '' }] })
              }
            >
              <Plus className="size-4" aria-hidden />
              {t('referenceAdd')}
            </Button>
          </fieldset>

          <fieldset className="border-t border-line-subtle pt-6">
            <legend className="text-sm font-medium">{t('documentsTitle')}</legend>
            <p className="mt-1 text-sm text-ink-tertiary">{t('documentsHint')}</p>

            {draft.documents.length === 0 ? (
              <p className="mt-4 text-sm text-ink-tertiary">{t('documentsEmpty')}</p>
            ) : (
              <ul className="mt-4 border-t border-line-subtle">
                {draft.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-4 border-b border-line-subtle py-3"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <FileText className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                      <span className="truncate">{doc.name}</span>
                      <span data-numeric className="shrink-0 text-sm text-ink-tertiary">
                        {doc.sizeKb} KB
                      </span>
                    </span>
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() =>
                        update({ documents: draft.documents.filter((d) => d.id !== doc.id) })
                      }
                    >
                      <Trash2 className="size-4" aria-hidden />
                      <span className="sr-only">{t('documentsRemove')}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {fileError && (
              <p className="mt-3 flex gap-2 text-sm text-status-danger-fg">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {fileError}
              </p>
            )}

            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) addFile(file);
                e.target.value = '';
              }}
            />
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => fileInput.current?.click()}
            >
              <Plus className="size-4" aria-hidden />
              {t('documentsAdd')}
            </Button>
            <p className="mt-2 text-sm text-ink-tertiary">{t('documentsDemo')}</p>
          </fieldset>

          <Field
            label={t('motivation')}
            hint={t('motivationHint')}
            className="border-t border-line-subtle pt-6"
          >
            {(props) => (
              <Textarea
                rows={4}
                value={draft.motivation}
                onChange={(e) => update({ motivation: e.target.value })}
                {...props}
              />
            )}
          </Field>

          <fieldset className="border-t border-line-subtle pt-6">
            <legend className="text-sm font-medium">{t('consentTitle')}</legend>
            <Checkbox
              className="mt-4"
              label={t('consentLabel')}
              checked={draft.consent}
              onChange={(e) => update({ consent: e.target.checked })}
            />
            <p className="mt-3 text-sm text-ink-tertiary">
              {t('consentRetention', { months: settings.applicationRetentionMonths })}
            </p>
            {showErrors && !draft.consent && (
              <p className="mt-3 flex gap-2 text-sm text-status-danger-fg">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t('consentRequired')}
              </p>
            )}
          </fieldset>

          <div className="flex flex-wrap gap-3 border-t border-line-subtle pt-6">
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4" aria-hidden />
              {t('back')}
            </Button>
            <Button onClick={send}>{t('submit')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
