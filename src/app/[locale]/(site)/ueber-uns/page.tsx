import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Check } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getHasInsurance, getTheme } from '@/lib/theme-server';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { Button } from '@/components/ui/button';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { CtaBand } from '@/components/signature/cta-band';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site.about' });
  return { title: t('meta.title'), description: t('story1') };
}

/**
 * Screen 7 — About.
 *
 * "دي مش صفحة معلومات، دي صفحة طمأنة." Structured accordingly: the story is
 * short, the commitments list is long and specific.
 *
 * The insurance commitment appears only when a policy exists (§21 item 12).
 * With the toggle off it is replaced by a commitment that is true today. The
 * page never claims cover it does not have — that would be a legal problem,
 * not a copy problem.
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [theme, hasInsurance] = await Promise.all([getTheme(), getHasInsurance()]);
  const t = await getTranslations('site.about');

  const commitments = [
    t('c1'),
    t('c2'),
    t('c3'),
    t('c4'),
    hasInsurance ? t('c5') : t('c5None'),
  ];

  return (
    <>
      <Section>
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <SectionHeading
              theme={theme}
              eyebrow={t('eyebrow')}
              title={t('title')}
              align="start"
          level={1}
        />
            <div className="mt-8 space-y-5 text-lg text-ink-secondary">
              <p className="max-w-[var(--measure)]">{t('story1')}</p>
              <p className="max-w-[var(--measure)]">{t('story2')}</p>
            </div>
          </div>
          <ImagePlaceholder
            seed="about-portrait"
            alt="Homivaro"
            className="aspect-4/5 rounded-[var(--radius-lg)] lg:col-span-5"
          />
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeading theme={theme} title={t('valuesTitle')} align="start" />
        <dl className="mt-10 grid gap-8 sm:grid-cols-3">
          {(['v1', 'v2', 'v3'] as const).map((key) => (
            <div key={key}>
              <dt className="display-type text-xl">{t(`${key}Title`)}</dt>
              <dd className="mt-3 text-ink-secondary">{t(`${key}Body`)}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="display-type text-2xl">{t('regionTitle')}</h2>
            <p className="mt-4 max-w-[var(--measure)] text-ink-secondary">
              {t('regionBody')}
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
              {SERVED_REGIONS.map((region) => (
                <li key={region.slug}>
                  <Link
                    href={`/gebiete/${region.slug}`}
                    className="text-sm text-ink-secondary underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                  >
                    {region.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            <h2 className="display-type text-2xl">{t('commitmentsTitle')}</h2>
            <ul className="mt-6 divide-y divide-line-subtle border-y border-line-subtle">
              {commitments.map((commitment) => (
                <li key={commitment} className="flex gap-3 py-4">
                  <Check className="mt-1 size-4 shrink-0 text-eco" aria-hidden />
                  <span className="text-ink-secondary">{commitment}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section tone="sunken">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="display-type text-2xl">{t('careersTitle')}</h2>
            <p className="mt-3 max-w-[var(--measure)] text-ink-secondary">
              {t('careersBody')}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/jobs">
              {t('careersCta')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>

      <CtaBand theme={theme} />
    </>
  );
}
