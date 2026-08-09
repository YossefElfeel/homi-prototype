import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { SERVED_REGIONS, regionBySlug } from '@/mock/engines/coverage';
import { SEED_SETTINGS } from '@/mock/seed';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { CtaBand } from '@/components/signature/cta-band';
import { ServiceGrid } from '@/components/site/service-grid';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    SERVED_REGIONS.map((region) => ({ locale, slug: region.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const region = regionBySlug(slug);
  if (!region) return {};
  const t = await getTranslations({ locale, namespace: 'site.regions' });
  return {
    title: t('metaTitle', { region: region.name }),
    description: t('metaDescription', { region: region.name, postcode: region.postcode }),
  };
}

/**
 * Screen 9 — the region template, one page per served municipality.
 *
 * §6 is emphatic and easy to get wrong: **the city of Zurich is not in the
 * coverage list**. These eight pages are the entire local SEO surface, and
 * targeting "Reinigung Zürich" would draw traffic the business cannot serve.
 */
export default async function RegionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const region = regionBySlug(slug);
  if (!region) notFound();

  const theme = await getTheme();
  const t = await getTranslations('site.regions');
  const others = SERVED_REGIONS.filter((r) => r.slug !== region.slug);

  return (
    <>
      <Section>
        <SectionHeading
          theme={theme}
          eyebrow={t('eyebrow')}
          title={t('title', { region: region.name })}
          lead={t('lead', { region: region.name })}
          align="start"
          level={1}
        />

        <dl className="mt-10 grid gap-px border border-line-subtle bg-line-subtle sm:grid-cols-3">
          <div className="bg-page p-6">
            <dt className="label-type text-ink-tertiary">{t('postcodeLabel')}</dt>
            <dd data-numeric className="mt-2 text-2xl">
              {region.postcode}
            </dd>
          </div>
          <div className="bg-page p-6">
            <dt className="label-type text-ink-tertiary">{t('travelLabel')}</dt>
            <dd className="mt-2 text-2xl">{t('travelValue')}</dd>
          </div>
          <div className="bg-page p-6">
            <dt className="label-type text-ink-tertiary">{t('responseLabel')}</dt>
            <dd data-numeric className="mt-2 text-2xl">
              {SEED_SETTINGS.responseTimeHours} h
            </dd>
          </div>
        </dl>

        <Button asChild size="lg" className="mt-10">
          <Link href={`/anfrage?plz=${region.postcode}`}>
            {t('cta', { region: region.name })}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </Section>

      <Section tone="sunken">
        <SectionHeading
          theme={theme}
          title={t('servicesTitle', { region: region.name })}
          align="start"
        />
        <div className="mt-8 border border-line-subtle">
          <ServiceGrid />
        </div>
      </Section>

      <Section>
        <h2 className="display-type text-2xl">{t('otherTitle')}</h2>
        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/gebiete/${other.slug}`}
                className="text-ink-secondary underline decoration-line underline-offset-4 transition-colors hover:text-ink"
              >
                {other.name}
                <span data-numeric className="ml-1.5 text-ink-tertiary">
                  {other.postcode}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand theme={theme} />
    </>
  );
}
