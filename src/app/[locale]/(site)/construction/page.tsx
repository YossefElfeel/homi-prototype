import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Phone } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { ConstructionSections } from '@/components/site/construction-sections';
import { Button } from '@/components/ui/button';
import { Masthead } from '@/components/landing/Masthead';
import { PageSection } from '@/components/landing/PageSection';
import { Section, SectionHeading } from '@/components/signature/section-heading';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site.bau' });
  return { title: t('meta.title'), description: t('meta.description') };
}

/**
 * Construction and fit-out — the second trade, and the first page on the site
 * that does not sell a cleaning service.
 *
 * **It does not quote a price, and that is the point.** Every other page here
 * rests on one number: CHF 49 an hour, binding within 24 hours, two-hour
 * minimum. A ceiling is not an hour of work with a known shape — the same
 * room is three days or three weeks depending on what is above the plaster —
 * so repeating the site's promise here would be the one place it is not true.
 * The close asks for a conversation and a site visit instead, and the button
 * goes to /contact rather than the request wizard, which asks how many
 * bathrooms a flat has.
 *
 * The work is grouped by trade rather than by project. The photographs arrived
 * as a single folder with no job attached to any of them, so a project grouping
 * would have been invented; what they genuinely share is the craft.
 */
export default async function ConstructionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const theme = await getTheme();
  const t = await getTranslations('site.bau');
  /* The page masthead only — the section headings moved onto the record. */
  const d = await getTranslations('site.display.bau');
  const brand = await getTranslations('brand');
  const hv = theme === 'homivaro';


  const close = (
    <div className="mx-auto max-w-[var(--measure)] text-center">
      <h2 className="subhead-type text-2xl">{t('quoteTitle')}</h2>
      <p className="mt-4 text-ink-secondary">{t('quoteBody')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/contact">
            {t('quoteCta')}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <a href={`tel:${brand('phone').replace(/\s/g, '')}`}>
            <Phone className="size-4" aria-hidden />
            <span data-numeric>{brand('phone')}</span>
          </a>
        </Button>
      </div>
    </div>
  );

  if (hv) {
    return (
      <>
        <Masthead
          lines={d.raw('lines')}
          lead={t('lead')}
          action={{ label: t('cta'), href: '/contact' }}
        />

        <ConstructionSections theme={theme} />

        <PageSection>{close}</PageSection>
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
      </Section>

      <ConstructionSections theme={theme} />

      <Section>{close}</Section>
    </>
  );
}
