import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Info } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { SEED_SERVICES, SEED_SETTINGS } from '@/mock/seed';
import { DURATION_TIERS } from '@/mock/engines/pricing';
import { Money } from '@/components/ui/money';
import { Button } from '@/components/ui/button';
import { Faq } from '@/components/ui/accordion';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { CtaBand } from '@/components/signature/cta-band';
import { serviceFromPrice } from '@/components/site/service-grid';

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
      </Section>

      <Section tone="sunken">
        <SectionHeading theme={theme} title={t('tableTitle')} align="start" />
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-lg border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="label-type py-3 pr-4 text-ink-tertiary">
                  {t('tableService')}
                </th>
                <th scope="col" className="label-type py-3 pr-4 text-ink-tertiary">
                  {t('tableMethod')}
                </th>
                <th scope="col" className="label-type py-3 text-right text-ink-tertiary">
                  {t('tableFrom')}
                </th>
              </tr>
            </thead>
            <tbody>
              {SEED_SERVICES.filter((service) => service.active)
                .sort((a, b) => a.order - b.order)
                .map((service) => (
                  <tr key={service.slug} className="border-b border-line-subtle">
                    <th scope="row" className="py-4 pr-4 font-normal">
                      <Link
                        href={`/leistungen/${service.slug}`}
                        className="transition-colors hover:text-ink-accent"
                      >
                        {service.name[locale as Locale]}
                      </Link>
                    </th>
                    <td className="py-4 pr-4 text-ink-secondary">
                      {service.calc === 'perUnit' ? t('methodPerUnit') : t('methodHourly')}
                    </td>
                    <td className="py-4 text-right">
                      <Money amount={serviceFromPrice(service.minDuration)} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <SectionHeading
          theme={theme}
          title={t('durationTitle')}
          lead={t('durationLead')}
          align="start"
        />
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-lg border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="label-type py-3 pr-4 text-ink-tertiary">
                  {t('durationArea')}
                </th>
                {(['durationStandard', 'durationDeep', 'durationMoveout', 'durationOffice'] as const).map(
                  (key) => (
                    <th
                      key={key}
                      scope="col"
                      className="label-type py-3 pr-4 text-right text-ink-tertiary"
                    >
                      {t(key)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {DURATION_TIERS.map((tier) => (
                <tr key={tier.label} className="border-b border-line-subtle">
                  <th scope="row" data-numeric className="py-4 pr-4 font-normal">
                    {tier.label}
                  </th>
                  {[tier.standard, tier.deep, tier.moveout, tier.office].map((hours, i) => (
                    <td key={i} data-numeric className="py-4 pr-4 text-right">
                      {hours} h
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 max-w-[var(--measure)] text-sm text-ink-secondary">
          {t('durationExtras')}
        </p>
      </Section>

      <Section tone="sunken">
        <SectionHeading theme={theme} title={t('extrasTitle')} align="start" />
        <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-medium">{t('extraTravelTitle')}</dt>
            <dd className="mt-2 text-sm text-ink-secondary">{t('extraTravelBody')}</dd>
          </div>
          <div>
            <dt className="font-medium">
              {t('extraSaturdayTitle')}
              <span data-numeric className="ml-2 text-ink-tertiary">
                +{s.saturdaySurchargePercent}%
              </span>
            </dt>
            <dd className="mt-2 text-sm text-ink-secondary">{t('extraSaturdayBody')}</dd>
          </div>
          <div>
            <dt className="font-medium">
              {t('extraEveningTitle')}
              <span data-numeric className="ml-2 text-ink-tertiary">
                +{s.eveningSurchargePercent}%
              </span>
            </dt>
            <dd className="mt-2 text-sm text-ink-secondary">
              {t('extraEveningBody')}
              <span data-numeric className="ml-1">
                (ab {s.eveningSurchargeFrom})
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-medium">{t('vatTitle')}</dt>
            <dd className="mt-2 text-sm text-ink-secondary">{t('vatBody')}</dd>
          </div>
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
            <h2 className="display-type text-2xl">{t('faqTitle')}</h2>
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
