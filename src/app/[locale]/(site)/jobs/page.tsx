import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Search } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getStressMode, getTheme } from '@/lib/theme-server';
import { getCareersContent } from '@/content/careers';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { Masthead } from '@/components/landing/Masthead';
import { JobList } from '@/components/careers/job-list';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'careers.index' });
  return { title: t('title'), description: t('lead') };
}

/**
 * Screen C1 — open roles.
 *
 * Reached from the footer and from the About page, never from the main
 * navigation: that nav belongs to customers, and diluting it with a careers
 * link costs conversions to serve a different audience.
 *
 * "How we choose" is written for both audiences at once. An applicant reads it
 * as the process; a customer reads it as the answer to "who is coming into my
 * home?" — the market's loudest objection, per §21.
 */
export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const theme = await getTheme();
  const stressed = await getStressMode();
  const t = await getTranslations('careers.index');
  const content = getCareersContent(locale as Locale, stressed);

  const d = await getTranslations('site.display.careers');
  const hv = theme === 'homivaro';

  return (
    <>
      {hv ? <Masthead lines={d.raw('lines')} lead={t('lead')} /> : null}

      <Section>
        {!hv ? (
          <SectionHeading
            theme={theme}
            eyebrow={t('eyebrow')}
            title={t('title')}
            lead={t('lead')}
            level={1}
          />
        ) : null}
        <h2 className="label-type mt-16 text-ink-tertiary">{t('openTitle')}</h2>
        <div className="mt-6">
          <JobList />
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeading theme={theme} title={t('howTitle')} lead={t('howLead')} />
        <ol className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {content.how.map((step, index) => (
            <li key={step.title} className="rule-accent pt-5">
              <p data-numeric className="label-type text-ink-tertiary">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <div className="surface-card flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="subhead-type text-xl">{t('statusTitle')}</h2>
            <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">
              {t('statusBody')}
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link href="/jobs/status">
              <Search className="size-4" aria-hidden />
              {t('statusAction')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
