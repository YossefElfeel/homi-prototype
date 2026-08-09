import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AlertTriangle, Check, Minus } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { SEED_SETTINGS } from '@/mock/seed';
import { Button } from '@/components/ui/button';
import { Faq } from '@/components/ui/accordion';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { CtaBand } from '@/components/signature/cta-band';
import { PlanCards } from '@/components/site/plan-cards';

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
 * The twelve-month commitment gets its own callout above the fold rather than
 * a footnote. It is the single most consequential thing on this page and
 * burying it would be the kind of small dishonesty this brand cannot afford.
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
  const d = SEED_SETTINGS.planDiscounts;

  const rows = [
    { label: t('rowFrequency'), basic: t('freqBasic'), premium: t('freqPremium'), vip: t('freqVip') },
    { label: t('rowDiscount'), basic: `−${d.basic}%`, premium: `−${d.premium}%`, vip: `−${d.vip}%` },
    { label: t('rowPriority'), basic: false, premium: true, vip: true },
    { label: t('rowSameTeam'), basic: false, premium: false, vip: t('sameTeamAlways') },
    { label: t('rowSkips'), basic: t('skips'), premium: t('skips'), vip: t('skips') },
    { label: t('rowCommitment'), basic: t('commitment'), premium: t('commitment'), vip: t('commitment') },
    { label: t('rowNotice'), basic: t('notice'), premium: t('notice'), vip: t('notice') },
  ];

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
          <PlanCards />
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeading theme={theme} title={t('compareTitle')} align="start" />

        {/* Desktop: a real comparison table. */}
        <div className="mt-8 hidden lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="label-type py-4 pr-4 text-ink-tertiary">
                  &nbsp;
                </th>
                {(['Basic', 'Premium', 'VIP'] as const).map((name) => (
                  <th key={name} scope="col" className="display-type py-4 pr-4 text-xl">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-line-subtle">
                  <th scope="row" className="py-4 pr-4 font-normal text-ink-secondary">
                    {row.label}
                  </th>
                  {([row.basic, row.premium, row.vip] as const).map((value, i) => (
                    <td key={i} data-numeric className="py-4 pr-4">
                      <CellValue value={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Below lg: the same rows as one block per plan. */}
        <div className="mt-8 space-y-5 lg:hidden">
          {(['Basic', 'Premium', 'VIP'] as const).map((name, planIndex) => (
            <div key={name} className="surface-card p-6">
              <h3 className="display-type text-xl">{name}</h3>
              <dl className="mt-4 divide-y divide-line-subtle border-t border-line-subtle">
                {rows.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-sm text-ink-secondary">{row.label}</dt>
                    <dd data-numeric className="text-right">
                      <CellValue
                        value={[row.basic, row.premium, row.vip][planIndex] as string | boolean}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="display-type text-2xl">{t('faqTitle')}</h2>
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

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="size-4 text-eco" aria-label="Ja" />;
  if (value === false) return <Minus className="size-4 text-ink-tertiary" aria-label="Nein" />;
  return <>{value}</>;
}
