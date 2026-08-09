import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { ServiceGrid } from '@/components/site/service-grid';
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
