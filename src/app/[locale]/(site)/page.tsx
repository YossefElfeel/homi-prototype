import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, ClipboardList, FileText, CalendarCheck, Sparkles } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getHasInsurance, getTheme } from '@/lib/theme-server';
import { Button } from '@/components/ui/button';
import { Hero } from '@/components/signature/hero';
import { CtaBand } from '@/components/signature/cta-band';
import { ProofBlock } from '@/components/signature/proof-block';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { ServiceGrid } from '@/components/site/service-grid';
import { PlanCards } from '@/components/site/plan-cards';
import { ReviewsSection } from '@/components/site/reviews-section';
import { Hero as LandingHero } from '@/components/landing/Hero';
import { Stats } from '@/components/landing/Stats';
import { Services } from '@/components/landing/Services';
import { Promises } from '@/components/landing/Promises';
import { CtaBand as LandingCtaBand } from '@/components/landing/CtaBand';
import { Steps } from '@/components/landing/Steps';
import { Coverage } from '@/components/landing/Coverage';
import { Plans } from '@/components/landing/Plans';
import { Testimonials } from '@/components/landing/Testimonials';
import { SERVED_REGIONS } from '@/mock/engines/coverage';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site.home.meta' });
  return { title: t('title'), description: t('description') };
}

/** Screen 1 — the first impression and the highest-leverage screen on the site. */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [theme, hasInsurance] = await Promise.all([getTheme(), getHasInsurance()]);
  const t = await getTranslations('site.home');

  /*
   * The approved design, cloned. Same sections in the same order with the same
   * copy, motion and imagery as the design build — this page is the landing
   * page, not a page influenced by it.
   *
   * Three things had to change to make a one-page comp work inside a site with
   * seventeen routes, and nothing else did:
   *
   *   · the nav points at real pages instead of scrolling to anchors on this one
   *   · "Request a quote" goes to /anfrage, the actual quote flow, rather than
   *     to the closing band, which is a red panel with a phone number on it
   *   · the language comes from the URL rather than from localStorage
   */
  if (theme === 'homivaro') {
    return (
      <>
        <LandingHero />
        <Stats />
        <Services />
        <Promises />
        <LandingCtaBand />
        <Steps />
        <Coverage />
        <Plans />
        <Testimonials />
      </>
    );
  }

  return (
    <>
      <Hero theme={theme} />

      <Section id="leistungen">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            theme={theme}
            eyebrow={t('services.eyebrow')}
            title={t('services.title')}
            lead={t('services.lead')}
            align="start"
          />
        </div>
        <div className="mt-10 border border-line-subtle">
          <ServiceGrid />
        </div>
      </Section>

      <Section tone="sunken">
        <div className="grid gap-12 lg:grid-cols-12">
          <SectionHeading
            theme={theme}
            eyebrow={t('why.eyebrow')}
            title={t('why.title')}
            align="start"
            className="lg:col-span-4"
          />
          <ul className="grid gap-8 sm:grid-cols-2 lg:col-span-8">
            {(['price', 'time', 'proof', 'access'] as const).map((key) => (
              <li key={key}>
                <h3 className="font-medium">{t(`why.${key}Title`)}</h3>
                <p className="mt-2 text-ink-secondary">{t(`why.${key}Body`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <SectionHeading
          theme={theme}
          eyebrow={t('steps.eyebrow')}
          title={t('steps.title')}
        />
        <ol className="mt-10 grid gap-px bg-line-subtle sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ['s1', ClipboardList],
              ['s2', FileText],
              ['s3', CalendarCheck],
              ['s4', Sparkles],
            ] as const
          ).map(([key, Icon], i) => (
            <li key={key} className="bg-page p-7">
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-ink-accent" aria-hidden />
                <span data-numeric aria-hidden className="label-type text-ink-tertiary">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-5 font-medium">{t(`steps.${key}Title`)}</h3>
              <p className="mt-2 text-sm text-ink-secondary">{t(`steps.${key}Body`)}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="sunken">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            theme={theme}
            eyebrow={t('plans.eyebrow')}
            title={t('plans.title')}
            lead={t('plans.lead')}
            align="start"
          />
          <Button asChild variant="secondary">
            <Link href="/abos">
              {t('plans.cta')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
        <div className="mt-10">
          <PlanCards compact />
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          <SectionHeading
            theme={theme}
            eyebrow={t('coverage.eyebrow')}
            title={t('coverage.title')}
            lead={t('coverage.lead')}
            align="start"
            className="lg:col-span-5"
          />
          <div className="lg:col-span-7">
            <ul className="grid grid-cols-2 gap-px border border-line-subtle bg-line-subtle sm:grid-cols-3">
              {SERVED_REGIONS.map((region) => (
                <li key={region.slug} className="bg-page">
                  <Link
                    href={`/gebiete/${region.slug}`}
                    className="block p-4 transition-colors hover:bg-accent-subtle"
                  >
                    <span className="block font-medium">{region.name}</span>
                    <span data-numeric className="block text-sm text-ink-tertiary">
                      {region.postcode}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-ink-secondary">{t('coverage.outside')}</p>
          </div>
        </div>
      </Section>

      {/* The promise block is permanent. Reviews are additive and appear above
          nothing when there are none — no empty carousel at launch. */}
      <ProofBlock theme={theme} hasInsurance={hasInsurance} />
      <ReviewsSection theme={theme} />

      <CtaBand theme={theme} />
    </>
  );
}
