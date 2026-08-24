import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Info } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { SEED_SETTINGS } from '@/mock/seed';
import { Money } from '@/components/ui/money';
import { Button } from '@/components/ui/button';
import { Faq } from '@/components/ui/accordion';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { CtaBand } from '@/components/signature/cta-band';
import { PriceList } from '@/components/site/price-list';
import { DurationMatrix } from '@/components/site/duration-matrix';
import { Masthead } from '@/components/landing/Masthead';
import { SectionHead } from '@/components/landing/PageSection';
import { formatChf } from '@/components/ui/money';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site.pricing' });
  return { title: t('meta.title'), description: t('lead') };
}

/**
 * Screen 3 — pricing.
 *
 * The duration matrix is published rather than hidden. It is the honest answer
 * to "why can't you just tell me the price": these are the hours we start
 * from, and here is what moves them. A guide price that cannot be traced back
 * to a rule is the thing this audience distrusts.
 */
export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const theme = await getTheme();
  const t = await getTranslations('site.pricing');
  const s = SEED_SETTINGS;

  const d = await getTranslations('site.display.pricing');
  const hv = theme === 'homivaro';

  return (
    <>
      {hv ? (
        /* The rate and the minimum were two hairline boxes under the heading.
           They are the two facts the page exists to state, so they move into
           the masthead's fact column — which is also what fills the half of
           the card that used to be bare navy. */
        <Masthead
          lines={d.raw('lines')}
          lead={t('lead')}
          stats={[
            { value: formatChf(s.hourlyRate, locale as Locale), label: t('rateLabel') },
            { value: t('minimumValue'), label: t('minimumLabel') },
          ]}
        />
      ) : null}

      <Section>
        {!hv ? (
          <SectionHeading
            theme={theme}
            eyebrow={t('eyebrow')}
            title={t('title')}
            lead={t('lead')}
            align="start"
            level={1}
          />
        ) : null}

        {!hv ? (
        <dl className="mt-12 grid gap-px border border-line-subtle bg-line-subtle sm:grid-cols-2">
          <div className="bg-page p-7">
            <dt className="label-type text-ink-tertiary">{t('rateLabel')}</dt>
            <dd className="mt-3 text-4xl">
              <Money amount={s.hourlyRate} per="hour" emphasis="strong" />
            </dd>
          </div>
          <div className="bg-page p-7">
            <dt className="label-type text-ink-tertiary">{t('minimumLabel')}</dt>
            <dd data-numeric className="mt-3 text-4xl">
              {t('minimumValue')}
            </dd>
          </div>
        </dl>
        ) : null}
      </Section>

      <Section tone="sunken">
        {hv ? (
          <SectionHead lines={d.raw('tableLines')} />
        ) : (
          <SectionHeading theme={theme} title={t('tableTitle')} align="start" />
        )}
        <div className="mt-8">
          <PriceList locale={locale as Locale} display={hv} />
        </div>
        {/* The floor, said once and in words. It used to be a column header
            reading "From", which left the reader to work out for themselves
            what the number was the floor of. */}
        <p className="mt-5 max-w-[var(--measure)] text-sm text-ink-secondary">
          {t('tableFloor')}
        </p>
      </Section>

      <Section>
        {hv ? (
          <SectionHead lines={d.raw('durationLines')} lead={t('durationLead')} />
        ) : (
          <SectionHeading
            theme={theme}
            title={t('durationTitle')}
            lead={t('durationLead')}
            align="start"
          />
        )}
        <DurationMatrix />
        <p className="mt-5 max-w-[var(--measure)] text-sm text-ink-secondary">
          {t('durationExtras')}
        </p>
      </Section>

      <Section tone="sunken">
        {hv ? (
          <SectionHead lines={d.raw('extrasLines')} />
        ) : (
          <SectionHeading theme={theme} title={t('extrasTitle')} align="start" />
        )}
        {/*
         * Cards, and the surcharge said as a surcharge.
         *
         * Four columns of loose `dt`/`dd` on a grey slab gave the section no
         * edges at all — the reader had to infer where one surcharge stopped
         * and the next began from the line breaks. And the two that cost money
         * carried their percentage as grey text trailing the heading, quieter
         * than the heading it qualified: on a page about what things cost, the
         * number was the least visible thing in the block.
         *
         * "Free" is a figure too, and it is the answer to the question the
         * travel card is actually asked, so it gets the same badge.
         */}
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { key: 'extraTravel', badge: t('extraFree'), tone: 'quiet' },
              { key: 'extraSaturday', badge: `+${s.saturdaySurchargePercent}%`, tone: 'loud' },
              {
                key: 'extraEvening',
                badge: `+${s.eveningSurchargePercent}%`,
                tone: 'loud',
                note: t('extraFrom', { time: s.eveningSurchargeFrom }),
              },
              { key: 'vat', badge: t('vatBadge'), tone: 'quiet' },
            ] as const
          ).map((item) => (
            <div key={item.key} className="surface-card flex flex-col p-6">
              <span
                data-numeric
                className={`self-start rounded-full px-2.5 py-1 text-sm font-medium ${
                  item.tone === 'loud'
                    ? 'bg-accent-subtle text-ink-accent'
                    : 'bg-sunken text-ink-secondary'
                }`}
              >
                {item.badge}
              </span>
              <dt className="mt-4 font-medium">{t(`${item.key}Title`)}</dt>
              <dd className="mt-2 text-sm text-ink-secondary">
                {t(`${item.key}Body`)}
                {/* The threshold is a setting, so it is written by the
                    translation rather than glued on in JSX — the "(ab 17:00)"
                    it replaces was a German preposition printed on the English
                    page. */}
                {'note' in item ? <span className="mt-1 block">{item.note}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="surface-card flex gap-4 p-6">
              <Info className="mt-0.5 size-5 shrink-0 text-ink-accent" aria-hidden />
              <div>
                <h2 className="font-medium">{t('noticeTitle')}</h2>
                <p className="mt-2 text-sm text-ink-secondary">{t('noticeBody')}</p>
              </div>
            </div>
            <Button asChild size="lg" className="mt-6">
              <Link href="/anfrage">{t('cta')}</Link>
            </Button>
          </div>
          <div className="lg:col-span-7">
            {hv ? (
              <SectionHead lines={d.raw('faqLines')} />
            ) : (
              <h2 className="subhead-type text-2xl">{t('faqTitle')}</h2>
            )}
            <Faq
              className="mt-6"
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
