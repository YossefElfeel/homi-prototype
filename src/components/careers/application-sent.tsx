'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { ArrowRight, Check } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCareersContent } from '@/content/careers';
import { Button } from '@/components/ui/button';
import { useHydrated, useStore } from '@/mock/store';

/**
 * Screen C5 — the receipt.
 *
 * The reference number is the only thing on this page the applicant has to
 * keep, so it gets the weight. The retention date is stated here rather than
 * only in the privacy policy: §14 asks for consent, and consent that hides its
 * own expiry is not informed.
 */
export function ApplicationSent({ reference }: { reference: string }) {
  const t = useTranslations('careers.sent');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();

  const application = useStore((s) => s.data.applications).find(
    (a) => a.reference === reference,
  );
  const content = getCareersContent(locale);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  return (
    <div className="max-w-2xl">
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-status-success text-status-success-fg">
        <Check className="size-5" aria-hidden />
      </span>

      <h1 className="display-type mt-6 text-[clamp(2.25rem,3.4vw,2.5rem)]">{t('title')}</h1>

      <div className="surface-card mt-8 p-6">
        <p className="label-type text-ink-tertiary">{t('reference')}</p>
        <p data-numeric className="subhead-type mt-2 text-3xl">
          {reference}
        </p>
        <p className="mt-3 text-sm text-ink-secondary">{t('referenceHint')}</p>
      </div>

      <section className="mt-10">
        <h2 className="subhead-type text-xl">{t('nextTitle')}</h2>
        <ol className="mt-5 space-y-4">
          {content.next.map((line, index) => (
            <li key={line} className="flex gap-4">
              <span
                data-numeric
                aria-hidden
                className="mt-0.5 shrink-0 text-sm text-ink-tertiary"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="max-w-[var(--measure)] text-ink-secondary">{line}</span>
            </li>
          ))}
        </ol>
      </section>

      {application && (
        <p className="mt-10 border-l-2 border-rule bg-sunken p-5 text-sm text-ink-secondary">
          {t('retention', {
            date: format.dateTime(new Date(application.retainUntil), {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }),
          })}
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/jobs/status?ref=${reference}`}>
            {t('statusAction')}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">{t('homeAction')}</Link>
        </Button>
      </div>
    </div>
  );
}
