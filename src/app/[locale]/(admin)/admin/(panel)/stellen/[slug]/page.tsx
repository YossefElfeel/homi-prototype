'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { LOCALE_LABELS, TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { SwitchField } from '@/components/ui/switch';
import { Field, Input, Select, Textarea, Checkbox } from '@/components/ui/field';
import { KIND_KEY } from '@/components/careers/job-list';
import { regionByPostcode } from '@/mock/engines/coverage';
import { useHydrated, useStore } from '@/mock/store';
import type { EmploymentKind, JobPosting } from '@/mock/schema';

const KINDS: EmploymentKind[] = ['permanent', 'part-time', 'temporary', 'freelance'];

const LISTS = ['responsibilities', 'requirements', 'offer'] as const;

/**
 * Screen H4 — writing a job, which is also the create flow: «Stelle anlegen»
 * makes an unpublished record and lands here, so this page is the only place a
 * job is ever composed.
 *
 * The three content blocks are edited as plain lines rather than a rich-text
 * field. A job is a list of short statements, and every rich-text editor in a
 * system this size eventually produces one job with three font sizes in it.
 *
 * Only German and English are editable here. French and Italian fall back to
 * German (§20.6) and pretending otherwise would put four empty boxes in front
 * of a person who has no way to fill them.
 *
 * **Two things about the layout, both of them the same problem.** The form was
 * a flat run of `<section>`s on the grey page ground — no surface under it, so
 * nothing said where "what the job is called" ended and "where it is worked"
 * began, on a form with sixteen fields. And the two languages were stacked, so
 * writing the English of a line meant scrolling away from the German it is a
 * translation of. Every list made it worse: three blocks times two languages
 * is six full-width textareas in a column, and the pair that belong together
 * were never on screen together. They sit side by side now, one card per
 * decision — the idiom the coupon form moved to for the same reason.
 */
export default function EditPostingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations('admin.posting');
  const listT = useTranslations('admin.postings');
  const appT = useTranslations('app');
  const careers = useTranslations('careers.index');
  const hydrated = useHydrated();

  const postings = useStore((s) => s.data.postings);
  const settings = useStore((s) => s.settings);
  const updatePosting = useStore((s) => s.updatePosting);
  /* A counter, not a boolean: two edits in quick succession have to read as
     two saves, and a boolean that is already true cannot say so. */
  const [saveTick, setSaveTick] = useState(0);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const posting = postings.find((p) => p.slug === slug);
  if (!posting) return <p className="text-ink-tertiary">—</p>;

  function patch(next: Partial<JobPosting>) {
    updatePosting(posting!.id, next);
    setSaveTick((n) => n + 1);
  }

  return (
    <div>
      <PageHeader
        title={posting.title.de || t('untitled')}
        back={{ href: '/admin/stellen', label: t('back') }}
        meta={
          <Chip tone={posting.published ? 'success' : 'neutral'}>
            {posting.published ? listT('published') : listT('draft')}
          </Chip>
        }
        actions={
          <>
            {/* One shared save status instead of three hand-rolled chips. */}
            <SaveIndicator
              signal={saveTick}
              savingLabel={appT('saving')}
              savedLabel={appT('saved')}
            />
            <Button asChild variant="secondary" size="sm">
              <Link href={`/jobs/${posting.slug}`}>
                {t('preview')}
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </>
        }
      />

      <div className="space-y-app-section">
        <Card>
          <CardHeader title={t('titleLabel')} description={t('titleHint')} />
          <CardBody className="grid gap-5 sm:grid-cols-2">
            {TRANSLATED_LOCALES.map((l) => (
              <Field key={l} label={LOCALE_LABELS[l as Locale]}>
                {(props) => (
                  <Input
                    value={posting.title[l as Locale]}
                    onChange={(e) => patch({ title: { ...posting.title, [l]: e.target.value } })}
                    {...props}
                  />
                )}
              </Field>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('employmentTitle')} description={t('employmentHint')} />
          <CardBody className="grid gap-5 sm:grid-cols-3">
            <Field label={t('kindLabel')}>
              {(props) => (
                <Select
                  value={posting.kind}
                  onChange={(e) => patch({ kind: e.target.value as EmploymentKind })}
                  {...props}
                >
                  {KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {careers(KIND_KEY[kind])}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('workloadFrom')}>
              {(props) => (
                <Input
                  type="number"
                  inputMode="numeric"
                  value={posting.workload[0]}
                  onChange={(e) =>
                    patch({ workload: [Number(e.target.value) || 0, posting.workload[1]] })
                  }
                  {...props}
                />
              )}
            </Field>
            <Field label={t('workloadTo')}>
              {(props) => (
                <Input
                  type="number"
                  inputMode="numeric"
                  value={posting.workload[1]}
                  onChange={(e) =>
                    patch({ workload: [posting.workload[0], Number(e.target.value) || 0] })
                  }
                  {...props}
                />
              )}
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('summaryLabel')} description={t('summaryHint')} />
          <CardBody className="grid gap-5 sm:grid-cols-2">
            {TRANSLATED_LOCALES.map((l) => (
              <Field key={l} label={LOCALE_LABELS[l as Locale]}>
                {(props) => (
                  <Textarea
                    rows={3}
                    value={posting.summary[l as Locale]}
                    onChange={(e) =>
                      patch({ summary: { ...posting.summary, [l]: e.target.value } })
                    }
                    {...props}
                  />
                )}
              </Field>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('regionsLabel')} description={t('regionsHint')} />
          <CardBody className="grid gap-2.5 sm:grid-cols-2">
            {settings.servedPostcodes.map((code) => (
              <Checkbox
                key={code}
                label={`${code} ${regionByPostcode(code)?.name ?? ''}`}
                checked={posting.regions.includes(code)}
                onChange={(e) =>
                  patch({
                    regions: e.target.checked
                      ? [...posting.regions, code]
                      : posting.regions.filter((c) => c !== code),
                  })
                }
              />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('listsTitle')} description={t('listHint')} />
          <CardBody className="space-y-6">
            {LISTS.map((key) => (
              <div key={key}>
                {/* The block name sits above the pair rather than inside each
                    label: with the two languages side by side, repeating «Ihre
                    Aufgaben» twice on one row names the row instead of the
                    boxes, and the boxes are what differ. */}
                <h3 className="label-type text-ink-tertiary">{t(key)}</h3>
                <div className="mt-3 grid gap-5 sm:grid-cols-2">
                  {TRANSLATED_LOCALES.map((l) => (
                    <Field key={`${key}-${l}`} label={LOCALE_LABELS[l as Locale]}>
                      {(props) => (
                        <ListTextarea
                          rows={5}
                          lines={posting[key][l as Locale]}
                          onCommit={(lines) =>
                            patch({
                              [key]: { ...posting[key], [l]: lines },
                            } as Partial<JobPosting>)
                          }
                          {...props}
                        />
                      )}
                    </Field>
                  ))}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('publishTitle')} />
          <CardBody>
            {/*
              A `Switch`, not the `Checkbox` it shared with the eight area
              ticks two cards up. This is the one control on the page that
              changes what a stranger can see, and it looked like an item in a
              list. Unlike the coupon form, this screen writes on change — so
              the hint says the flip is already live rather than warning that
              it waits for a button.
            */}
            <SwitchField
              label={t('publishedLabel')}
              hint={t('publishedHint')}
              checked={posting.published}
              onCheckedChange={(checked) => patch({ published: checked })}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

/**
 * A one-line-per-item textarea that can actually take a new line.
 *
 * The previous version derived its value from `lines.join('\n')` while its
 * onChange split on '\n' and dropped every empty entry. Pressing Enter created
 * a trailing empty line, the filter removed it, the join collapsed it, and the
 * caret jumped back — so none of the six list fields could gain a bullet.
 *
 * The fix is to stop deriving the value while the field has focus: the raw
 * text is local state, and only the parsed list is committed to the store.
 */
function ListTextarea({
  lines,
  onCommit,
  ...props
}: Omit<React.ComponentProps<typeof Textarea>, 'value' | 'onChange'> & {
  lines: string[];
  onCommit: (lines: string[]) => void;
}) {
  const [text, setText] = useState<string | null>(null);

  return (
    <Textarea
      {...props}
      value={text ?? lines.join('\n')}
      onChange={(e) => {
        setText(e.target.value);
        onCommit(e.target.value.split('\n').filter((line) => line.trim()));
      }}
      onBlur={() => setText(null)}
    />
  );
}
