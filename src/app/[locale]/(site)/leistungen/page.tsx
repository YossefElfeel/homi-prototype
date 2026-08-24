import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { ServiceGrid } from '@/components/site/service-grid';
import { CtaBand } from '@/components/signature/cta-band';
import { Masthead } from '@/components/landing/Masthead';
import { PageSection } from '@/components/landing/PageSection';
import { ServiceMosaic } from '@/components/landing/ServiceMosaic';
import { serviceFromPrice } from '@/components/site/service-grid';
import { formatChf } from '@/components/ui/money';
import { SEED_SERVICES } from '@/mock/seed';
import { isOffered } from '@/lib/service-catalogue';
import type { Locale } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site.services' });
  return { title: t('meta.title') };
}

export default async function ServicesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const theme = await getTheme();
  const t = await getTranslations('site.services');
  const d = await getTranslations('site.display.services');
  const home = await getTranslations('site.home.hero');
  const active = SEED_SERVICES.filter(isOffered);

  if (theme === 'homivaro') {
    return (
      <>
        <Masthead
          lines={d.raw('lines')}
          lead={t('listLead')}
          action={{ label: home('primary'), href: '/anfrage' }}
          /* Counted and computed, never typed: retire a service in the panel
             and this says six. */
          stats={[
            { value: String(active.length), label: d('factServices') },
            {
              value: formatChf(
                Math.min(...active.map((svc) => serviceFromPrice(svc.minDuration))),
                locale as Locale,
              ),
              label: d('factFrom'),
            },
          ]}
        />
        <PageSection>
          <ServiceMosaic />
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
          eyebrow={t('meta.title')}
          title={t('listTitle')}
          lead={t('listLead')}
          align="start"
          level={1}
        />
        <div className="mt-10 border border-line-subtle">
          {/* Directly under the page h1 — the cards are the top level here. */}
          <ServiceGrid headingLevel={2} />
        </div>
      </Section>
      <CtaBand theme={theme} />
    </>
  );
}
