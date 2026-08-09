'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Briefcase, MapPin } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { regionByPostcode } from '@/mock/engines/coverage';
import { useHydrated, useStore } from '@/mock/store';
import type { EmploymentKind } from '@/mock/schema';

export const KIND_KEY = {
  permanent: 'kindPermanent',
  'part-time': 'kindPartTime',
  temporary: 'kindTemporary',
  freelance: 'kindFreelance',
} as const satisfies Record<EmploymentKind, string>;

/**
 * Screen C1's body.
 *
 * The empty state is the important half. With no open role the page must not
 * read "nothing here" — it invites a speculative application instead, which is
 * how a one-person business actually builds a bench. The default scenario has
 * no postings, so that state is what a reviewer sees first.
 */
export function JobList() {
  const t = useTranslations('careers.index');
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();

  const postings = useStore((s) => s.data.postings).filter((p) => p.published);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  if (postings.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title={t('emptyTitle')}
        body={t('emptyBody')}
        action={
          <Button asChild>
            <Link href="/jobs/bewerbung">
              {t('spontaneousAction')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="space-y-4">
      {postings.map((posting) => (
        <li key={posting.id}>
          <Link
            href={`/jobs/${posting.slug}`}
            className="surface-card group flex flex-col gap-4 p-6 transition-colors hover:bg-sunken sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <h3 className="display-type text-xl">{posting.title[locale]}</h3>
              <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">
                {posting.summary[locale]}
              </p>
              <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-tertiary">
                <span>{t(KIND_KEY[posting.kind])}</span>
                <span data-numeric>
                  {t('workload')} {posting.workload[0]}–{posting.workload[1]}%
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden />
                  {posting.regions
                    .map((code) => regionByPostcode(code)?.name ?? code)
                    .slice(0, 3)
                    .join(', ')}
                  {posting.regions.length > 3 && ' …'}
                </span>
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 font-medium">
              {t('view')}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
