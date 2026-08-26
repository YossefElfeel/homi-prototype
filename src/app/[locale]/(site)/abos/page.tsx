import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AlertTriangle } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { Button } from '@/components/ui/button';
import { Faq } from '@/components/ui/accordion';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { CtaBand } from '@/components/signature/cta-band';
import { PlanCards } from '@/components/site/plan-cards';
import { PlanComparison } from '@/components/site/plan-comparison';
import { Masthead } from '@/components/landing/Masthead';
import { PageSection, SectionHead } from '@/components/landing/PageSection';
import { Plans } from '@/components/landing/Plans';
import { SEED_SETTINGS } from '@/mock/seed';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site.plans' });
  return { title: t('meta.title'), description: t('lead') };
}

/**
 * Screen 4 — plans.
 *
 * The comparison table is desktop only; below lg the same content renders as
 * separate cards. The brief rules out the usual shortcut in as many words:
 * "نفس المحتوى ككروت منفصلة على الموبايل مش جدول مضغوط".
 *
 * Both the cards and the table used to be built from a hardcoded list of three
 * tiers and a discount read out of `SEED_SETTINGS` — a frozen import. Neither
 * could be changed from the panel, so an admin could not correct a price here,
 * could not add a plan, and could not stop a retired one being advertised. Both
 * read the store now, which is why they had to become client components.
 *
 * The twelve-month term gets its own callout above the fold rather than a
 * footnote. It is paid in a single instalment at sign-up — the single most
 * consequential thing on this page, and burying it would be the kind of small
 * dishonesty this brand cannot afford.
 */
export default async function PlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const theme = await getTheme();
  const t = await getTranslations('site.plans');
  const d = await getTranslations('site.display.plans');

  if (theme === 'homivaro') {
    return (
      <>
        <Masthead
          lines={d.raw('lines')}
          lead={t('lead')}
          /* The two facts a buyer actually weighs before a year paid up front,
             both read from settings rather than written here. */
          stats={[
            { value: String(SEED_SETTINGS.planCancellationDays), label: d('factCancel') },
            { value: String(SEED_SETTINGS.monthlyFreeSkips), label: d('factSkip') },
          ]}
        />

        {/* The commitment notice comes before the cards, not after them. It is
            the one fact that decides whether a plan is the right purchase, and
            a caveat printed under the buy button is a caveat nobody read. */}
        <PageSection className="!pb-0">
          <div className="hv-card hv-card-light flex max-w-3xl gap-4 p-6">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-ink-accent" aria-hidden />
            <div>
              <h2 className="font-medium">{t('commitmentNoticeTitle')}</h2>
              <p className="mt-1.5 text-body leading-[1.6] text-ink-secondary">
                {t('commitmentNoticeBody')}
              </p>
            </div>
          </div>
        </PageSection>

        {/* The same block the homepage shows, so somebody arriving from the
            CTA there lands on the thing they clicked — but split by service.
            The homepage teases plans; this page has to answer which service
            each one buys, and three cards under one heading answered it for
            household cleaning only. */}
        <Plans byService />

        {/* The target of "compare plans" in the block above, which until now
            was a link to this page from this page. */}
        <PageSection tone="sunken" id="vergleich">
          <SectionHead lines={d.raw('compareLines')} />
          <div className="mt-12">
            <PlanComparison />
          </div>
        </PageSection>

        <PageSection>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHead lines={d.raw('faqLines')} />
            </div>
            <div className="lg:col-span-7">
              <Faq
                items={[
                  { q: t('q1'), a: t('a1') },
                  { q: t('q2'), a: t('a2') },
                  { q: t('q3'), a: t('a3') },
                ]}
              />
            </div>
          </div>
        </PageSection>

        <CtaBand theme={theme} />
      </>
    );
  }

  return (
    <>
      <Section>
        <SectionHeading
          theme={theme}
          eyebrow={t('eyebrow')}
          title={t('title')}
          lead={t('lead')}
          align="start"
          level={1}
        />

        <div className="mt-8 flex max-w-2xl gap-4 border-l-2 border-rule bg-sunken p-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-ink-secondary" aria-hidden />
          <div>
            <h2 className="font-medium">{t('commitmentNoticeTitle')}</h2>
            <p className="mt-1.5 text-sm text-ink-secondary">{t('commitmentNoticeBody')}</p>
          </div>
        </div>

        <div className="mt-12">
          <PlanCards byService />
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeading theme={theme} title={t('compareTitle')} align="start" />
        <PlanComparison />
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="subhead-type text-2xl">{t('faqTitle')}</h2>
            <Button asChild size="lg" className="mt-6">
              <Link href="/anfrage">{t('cta')}</Link>
            </Button>
          </div>
          <div className="lg:col-span-7">
            <Faq
              items={[
                { q: t('q1'), a: t('a1') },
                { q: t('q2'), a: t('a2') },
                { q: t('q3'), a: t('a3') },
              ]}
            />
          </div>
        </div>
      </Section>

      <CtaBand theme={theme} />
    </>
  );
}
