import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Check } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getHasInsurance, getTheme } from '@/lib/theme-server';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { SEED_SETTINGS } from '@/mock/seed';
import { formatChf } from '@/components/ui/money';
import { Button } from '@/components/ui/button';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { CtaBand } from '@/components/signature/cta-band';
import { Masthead } from '@/components/landing/Masthead';
import { SectionHead } from '@/components/landing/PageSection';
import Image from 'next/image';

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
  const pricing = await getTranslations('site.pricing');

  const commitments = [
    t('c1'),
    t('c2'),
    t('c3'),
    t('c4'),
    hasInsurance ? t('c5') : t('c5None'),
  ];

  const d = await getTranslations('site.display.about');
  const hv = theme === 'homivaro';

  return (
    <>
      {hv ? (
        /* The three numbers this page is asking to be believed on, in the
           column that was empty navy. A page of reassurance whose masthead
           states no fact is asking for trust and offering none — and all three
           are read from settings and the coverage list rather than typed here,
           so none of them can drift from what the rest of the site says. */
        <Masthead
          lines={d.raw('lines')}
          lead={t('lead')}
          stats={[
            {
              value: formatChf(SEED_SETTINGS.hourlyRate, locale as Locale),
              label: pricing('rateLabel'),
            },
            { value: `${SEED_SETTINGS.responseTimeHours} h`, label: t('factResponse') },
            { value: String(SERVED_REGIONS.length), label: t('factRegions') },
          ]}
        />
      ) : null}

      <Section>
        {/* Stretched, not top-aligned.
            The story is two short paragraphs and the photograph was locked to
            4:5, so the row was as tall as the picture and the left column
            ended two thirds of the way up — around 400px of nothing under the
            text on a desktop. The picture fills the row now and the row is as
            tall as whichever side needs more. */}
        <div className="grid gap-12 lg:grid-cols-12 lg:items-stretch">
          <div className="lg:col-span-7">
            {/* The masthead above already carries the h1 in this direction,
                and a page with two of them has no outline. */}
            {!hv ? (
              <SectionHeading
                theme={theme}
                eyebrow={t('eyebrow')}
                title={t('title')}
                align="start"
                level={1}
              />
            ) : null}
            {/* The story had no heading of its own in this direction — the
                masthead carries the h1, so the column opened on body copy with
                nothing to say what it was. `storyTitle` already existed and
                only the other direction was using it. */}
            {hv ? <SectionHead lines={d.raw('storyLines')} /> : null}
            <div className={`space-y-5 text-lg text-ink-secondary ${hv ? 'mt-6' : 'mt-8'}`}>
              <p className="max-w-[var(--measure)]">{t('story1')}</p>
              <p className="max-w-[var(--measure)]">{t('story2')}</p>
            </div>
          </div>
          {hv ? (
            /*
             * A real photograph instead of the pastel placeholder, which was
             * the last element on the site with a palette of its own.
             *
             * Worth stating: this is a picture of the work, not of the person
             * the copy beside it is about. It reads as adjacent rather than
             * exact, and it is still the better of the two — a coral-and-sage
             * geometric panel in a navy-and-red system belongs to no one. The
             * moment a portrait exists this is a one-line swap.
             */
            <div className="relative aspect-4/3 min-h-[320px] overflow-hidden rounded-[var(--radius-lg)] lg:col-span-5 lg:aspect-auto">
              <Image
                src="/img/service-1.webp"
                alt={t('imageAlt')}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          ) : (
            <ImagePlaceholder
              seed="about-portrait"
              alt="Homivaro"
              className="aspect-4/5 rounded-[var(--radius-lg)] lg:col-span-5"
            />
          )}
        </div>
      </Section>

      <Section tone="sunken">
        {hv ? (
          <SectionHead lines={d.raw('valuesLines')} />
        ) : (
          <SectionHeading theme={theme} title={t('valuesTitle')} align="start" />
        )}
        {/* Cards, and numbered.
            Three headings and three paragraphs loose on a grey slab read as
            one block of prose that happens to be in columns — nothing said
            where a value ended, and nothing said there were three of them.
            The numeral is the cheapest way to say "three things, in order",
            and it is set in the display face because that is what this
            direction does with numerals. */}
        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          {(['v1', 'v2', 'v3'] as const).map((key, i) => (
            <div key={key} className="surface-card flex flex-col p-7">
              <span
                data-numeric
                aria-hidden
                className={hv ? 'display-type text-ink-accent text-4xl leading-none' : 'label-type text-ink-accent'}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <dt className="subhead-type mt-5 text-xl">{t(`${key}Title`)}</dt>
              <dd className="mt-3 text-ink-secondary">{t(`${key}Body`)}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            {hv ? (
              <SectionHead lines={d.raw('regionLines')} />
            ) : (
              <h2 className="subhead-type text-2xl">{t('regionTitle')}</h2>
            )}
            <p className="mt-4 max-w-[var(--measure)] text-ink-secondary">
              {t('regionBody')}
            </p>
            {/* Chips, matching /kontakt and /gebiete. Eight underlined words
                wrapped across two lines read as a sentence somebody had
                linkified, not as eight places you can go. */}
            <ul className="mt-6 flex flex-wrap gap-2">
              {SERVED_REGIONS.map((region) => (
                <li key={region.slug}>
                  <Link
                    href={`/gebiete/${region.slug}`}
                    className="border-line inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors hover:border-line-strong hover:bg-sunken"
                  >
                    {region.name}
                    <span data-numeric className="text-ink-tertiary">
                      {region.postcode}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            {/* Bebas, like every other heading in this direction. It was the
                one section heading on the page still set in Geist at 24px, and
                it stood over the list the whole page is built to deliver —
                the quietest heading carrying the loudest content. */}
            {hv ? (
              <SectionHead lines={d.raw('commitmentsLines')} />
            ) : (
              <h2 className="subhead-type text-2xl">{t('commitmentsTitle')}</h2>
            )}
            {/* On a card, and the tick in the accent rather than the eco
                green. Five promises on hairline rules over white was the
                quietest presentation on the page, and it is the list the page
                is *for* — "دي صفحة طمأنة" is a list of things somebody can
                hold us to, not a footnote. */}
            <ul className="surface-card mt-6 divide-y divide-line">
              {commitments.map((commitment) => (
                <li key={commitment} className="flex gap-3.5 p-5">
                  <span className="bg-accent-subtle text-ink-accent mt-0.5 grid size-6 shrink-0 place-items-center rounded-full">
                    <Check className="size-3.5" aria-hidden />
                  </span>
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
            {hv ? (
              <SectionHead lines={d.raw('careersLines')} />
            ) : (
              <h2 className="subhead-type text-2xl">{t('careersTitle')}</h2>
            )}
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
