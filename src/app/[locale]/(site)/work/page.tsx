import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { CtaBand } from '@/components/signature/cta-band';
import { Gallery } from '@/components/site/gallery';
import { Masthead } from '@/components/landing/Masthead';
import { PageSection } from '@/components/landing/PageSection';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site.gallery' });
  return { title: t('meta.title'), description: t('lead') };
}

/** Screens 5 and 6 — the grid and, inside it, the expanded single work. */
export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const theme = await getTheme();
  const t = await getTranslations('site.gallery');
  const d = await getTranslations('site.display.gallery');

  if (theme === 'homivaro') {
    return (
      <>
        <Masthead lines={d.raw('lines')} lead={t('lead')} />
        {/* The gallery keeps every rule it had. §20.6 makes what appears here
            a recorded decision and its empty state is the launch state — this
            page changes how the work is framed, never what may be shown. */}
        <PageSection>
          <Gallery />
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
        <div className="mt-10">
          <Gallery />
        </div>
      </Section>
      <CtaBand theme={theme} />
    </>
  );
}
