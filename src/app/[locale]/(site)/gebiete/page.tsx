import type { Metadata } from 'next';

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { SEED_SETTINGS } from '@/mock/seed';
import { ArrowUpRight } from '@/components/landing/icons';
import { Masthead } from '@/components/landing/Masthead';
import { PageSection, SectionHead } from '@/components/landing/PageSection';
import { CoverageCheck } from '@/components/landing/CoverageCheck';
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
  const t = await getTranslations({ locale, namespace: 'site.display.regionsIndex' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

/**
 * The service-area index.
 *
 * **This route did not exist.** There were eight `/gebiete/<slug>` pages — by
 * the region template's own comment, the entire local SEO surface — hanging
 * off a parent URL that returned 404, while `/leistungen` had an index. Anyone
 * truncating the URL, and any crawler walking up from a region page, hit
 * nothing.
 *
 * It is not just a list, though. The question people arrive with is "do you
 * come to me?", so the masthead answers it directly with the same
 * `checkCoverage` gate the request flow uses, and the grid below is the way
 * out for whoever wants to read rather than type.
 */
export default async function RegionsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const theme = await getTheme();
  const t = await getTranslations('site.display.regionsIndex');

  const grid = (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-6">
      {SERVED_REGIONS.map((region, i) => (
        <li
          key={region.slug}
          /* Three, three, then two wider — the homepage's 3-3-2, so the grid
             closes on a full row instead of leaving a gap where a ninth town
             would go. */
          className={`hv-card hv-card-light group overflow-hidden ${
            i >= 6 ? 'sm:col-span-3' : 'sm:col-span-2'
          }`}
        >
          <Link
            href={`/gebiete/${region.slug}`}
            className="flex h-full flex-col justify-between gap-8 p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus sm:p-6"
          >
            <span>
              {/* Same fix as the homepage coverage tiles: "Hombrechtikon" is
                  one unbreakable word needing 121px inside a tile that gives
                  it 108 on a 375px screen, and the tile's `overflow-hidden`
                  was cutting it in half. */}
              <span className="block text-body leading-none font-medium break-words text-ink sm:text-lead">
                {region.name}
              </span>
              <span
                data-numeric
                className="mt-3 block text-sm text-ink-secondary transition-colors duration-[var(--motion-base)] group-hover:text-ink"
              >
                {region.postcode}
              </span>
            </span>
            <span className="flex items-end justify-between gap-3">
              <span data-numeric className="text-sm text-ink-tertiary">
                {t('responseLabel')} {SEED_SETTINGS.responseTimeHours} h
              </span>
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-400 group-hover:scale-110"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  if (theme === 'homivaro') {
    return (
      <>
        <Masthead lines={t.raw('lines')} lead={t('lead')}>
          <CoverageCheck />
        </Masthead>

        <PageSection>
          <SectionHead lines={t.raw('gridLines')} />
          <div className="mt-12">{grid}</div>
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
          eyebrow={t('metaTitle')}
          title={t('gridTitle')}
          lead={t('lead')}
          align="start"
          level={1}
        />
        <div className="mt-10">{grid}</div>
      </Section>
      <CtaBand theme={theme} />
    </>
  );
}
