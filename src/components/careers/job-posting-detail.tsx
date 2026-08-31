'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { ArrowLeft, ArrowRight, Check, MapPin, Phone } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { KIND_KEY } from '@/components/careers/job-list';
import { regionByPostcode } from '@/mock/engines/coverage';
import { useHydrated, useStore } from '@/mock/store';

/**
 * Screen C2 — one role.
 *
 * "What you bring" comes before "what we offer" deliberately. In this market
 * the filter that matters most is the work permit, and burying requirements
 * under benefits produces applications that have to be turned down on the
 * first line — wasted time on both sides.
 */
export function JobPostingDetail({ slug }: { slug: string }) {
  const t = useTranslations('careers.posting');
  const index = useTranslations('careers.index');
  const brand = useTranslations('brand');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();

  const posting = useStore((s) => s.data.postings).find((p) => p.slug === slug);

  /* A skeleton rather than a bare «…». The ellipsis was the entire page while
     the store rehydrated, on a route whose masthead now renders server-side —
     so what a visitor saw was a finished heading above one grey character. */
  if (!hydrated) {
    return (
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]" role="status">
        <span className="sr-only">{t('loading')}</span>
        <div className="space-y-4" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse rounded-[var(--radius-sm)] bg-sunken h-5" />
          ))}
        </div>
        <div aria-hidden className="animate-pulse rounded-[var(--radius-sm)] bg-sunken h-72" />
      </div>
    );
  }

  if (!posting) {
    return (
      <div>
        <EmptyState
          title={index('emptyTitle')}
          body={index('emptyBody')}
          action={
            <Button asChild>
              <Link href="/jobs/bewerbung">{index('spontaneousAction')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const lists = [
    { key: 'responsibilities', items: posting.responsibilities[locale] },
    { key: 'requirements', items: posting.requirements[locale] },
    { key: 'offer', items: posting.offer[locale] },
  ] as const;

  return (
    <div>
      <Button asChild variant="link" className="mb-8">
        <Link href="/jobs">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        {/* The title and the summary are the page's masthead now, rendered on
            the server — see the route. Repeating them here would print the
            role twice on every posting. */}
        <div className="min-w-0">
          {lists.map(
            ({ key, items }, i) =>
              items.length > 0 && (
                <section key={key} className={i === 0 ? '' : 'mt-12'}>
                  <h2 className="subhead-type text-xl">{t(key)}</h2>
                  <ul className="mt-5 space-y-3">
                    {items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <Check
                          className="mt-1 size-4 shrink-0 text-ink-tertiary"
                          aria-hidden
                        />
                        <span className="max-w-[var(--measure)] text-ink-secondary">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ),
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface-card p-6">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="label-type text-ink-tertiary">{t('kind')}</dt>
                <dd className="mt-1">{index(KIND_KEY[posting.kind])}</dd>
              </div>
              <div>
                <dt className="label-type text-ink-tertiary">{t('workload')}</dt>
                <dd data-numeric className="mt-1">
                  {posting.workload[0]}–{posting.workload[1]}%
                </dd>
              </div>
              <div>
                <dt className="label-type text-ink-tertiary">{t('regions')}</dt>
                <dd className="mt-1 flex items-start gap-1.5">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-tertiary" aria-hidden />
                  <span>
                    {posting.regions
                      .map((code) => regionByPostcode(code)?.name ?? code)
                      .join(', ')}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="label-type text-ink-tertiary">{t('published')}</dt>
                <dd data-numeric className="mt-1">
                  {format.dateTime(new Date(posting.createdAt), {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
            </dl>

            <Button asChild className="mt-6 w-full">
              <Link href={`/jobs/bewerbung?stelle=${posting.slug}`}>
                {t('apply')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <p className="mt-3 text-sm text-ink-tertiary">{t('applyNote')}</p>
          </div>

          <div className="mt-6 border-l-2 border-rule bg-sunken rounded-[var(--radius-lg)] p-5">
            <h2 className="font-medium">{t('contactTitle')}</h2>
            <p className="mt-2 text-sm text-ink-secondary">{t('contactBody')}</p>
            <a
              href={`tel:${brand('phone').replace(/\s/g, '')}`}
              className="mt-3 inline-flex min-h-11 items-center gap-2 font-medium underline-offset-4 hover:underline"
            >
              <Phone className="size-4" aria-hidden />
              <span data-numeric>{brand('phone')}</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
