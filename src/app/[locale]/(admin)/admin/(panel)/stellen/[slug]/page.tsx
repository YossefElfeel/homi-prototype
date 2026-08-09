'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, ExternalLink } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { LOCALE_LABELS, TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea, Checkbox } from '@/components/ui/field';
import { KIND_KEY } from '@/components/careers/job-list';
import { regionByPostcode } from '@/mock/engines/coverage';
import { useHydrated, useStore } from '@/mock/store';
import type { EmploymentKind, JobPosting } from '@/mock/schema';

const KINDS: EmploymentKind[] = ['permanent', 'part-time', 'temporary', 'freelance'];

const LISTS = ['responsibilities', 'requirements', 'offer'] as const;

/**
 * Screen H4 — editing a posting.
 *
 * The three content blocks are edited as plain lines rather than a rich-text
 * field. A posting is a list of short statements, and every rich-text editor
 * in a system this size eventually produces one posting with three font sizes
 * in it.
 *
 * Only German and English are editable here. French and Italian fall back to
 * German (§20.6) and pretending otherwise would put four empty boxes in front
 * of a person who has no way to fill them.
 */
export default function EditPostingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations('admin.posting');
  const careers = useTranslations('careers.index');
  const hydrated = useHydrated();

  const postings = useStore((s) => s.data.postings);
  const settings = useStore((s) => s.settings);
  const updatePosting = useStore((s) => s.updatePosting);
  const [saved, setSaved] = useState(false);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const posting = postings.find((p) => p.slug === slug);
  if (!posting) return <p className="text-ink-tertiary">—</p>;

  function patch(next: Partial<JobPosting>) {
    updatePosting(posting!.id, next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="max-w-3xl">
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/stellen">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-type text-3xl">{posting.title.de}</h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-status-success px-2 py-1 text-xs text-status-success-fg">
              <Check className="size-3.5" aria-hidden />
              {t('saved')}
            </span>
          )}
          <Button asChild variant="secondary" size="sm">
            <Link href={`/jobs/${posting.slug}`}>
              {t('preview')}
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>

      <section className="mt-10 space-y-5">
        {TRANSLATED_LOCALES.map((l) => (
          <Field key={l} label={`${t('titleLabel')} — ${LOCALE_LABELS[l as Locale]}`}>
            {(props) => (
              <Input
                value={posting.title[l as Locale]}
                onChange={(e) => patch({ title: { ...posting.title, [l]: e.target.value } })}
                {...props}
              />
            )}
          </Field>
        ))}

        <div className="grid gap-5 sm:grid-cols-3">
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
        </div>

        {TRANSLATED_LOCALES.map((l) => (
          <Field
            key={l}
            label={`${t('summaryLabel')} — ${LOCALE_LABELS[l as Locale]}`}
          >
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
      </section>

      <section className="mt-10">
        <h2 className="display-type text-xl">{t('regionsLabel')}</h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
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
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display-type text-xl">{t('listsTitle')}</h2>
        <div className="mt-5 space-y-5">
          {LISTS.map((key) =>
            TRANSLATED_LOCALES.map((l) => (
              <Field
                key={`${key}-${l}`}
                label={`${t(key)} — ${LOCALE_LABELS[l as Locale]}`}
                hint={t('listHint')}
              >
                {(props) => (
                  <Textarea
                    rows={4}
                    value={posting[key][l as Locale].join('\n')}
                    onChange={(e) =>
                      patch({
                        [key]: {
                          ...posting[key],
                          [l]: e.target.value.split('\n').filter((line) => line.trim()),
                        },
                      } as Partial<JobPosting>)
                    }
                    {...props}
                  />
                )}
              </Field>
            )),
          )}
        </div>
      </section>

      <div className="mt-10 border-t border-line-subtle pt-6">
        <Checkbox
          label={t('publishedLabel')}
          checked={posting.published}
          onChange={(e) => patch({ published: e.target.checked })}
        />
      </div>
    </div>
  );
}
