'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { Locale } from '@/i18n/routing';
import { formatChf } from '@/components/ui/money';
import { planRhythm } from '@/lib/offer-facts';
import { useStore } from '@/mock/store';

/**
 * The comparison table, built from whatever plans are on sale.
 *
 * It used to be a literal seven-row array naming Basic, Premium and VIP in the
 * markup. Adding a plan meant editing this file, and retiring one left it in
 * the table advertising a product the site would then refuse to sell.
 *
 * The rows are the fields every plan has, so the table cannot go out of step
 * with the cards above it — both read the same records.
 */
export function PlanComparison() {
  const t = useTranslations('site.plans');
  const rhythmT = useTranslations('admin.rhythm');
  const locale = useLocale() as Locale;
  const plans = useStore((s) => s.plans);
  const settings = useStore((s) => s.settings);

  const shown = plans
    .filter((p) => p.active && p.visibleOnSite)
    .sort((a, b) => a.order - b.order);

  if (shown.length === 0) return null;

  const rows: { label: string; value: (index: number) => string }[] = [
    { label: t('rowPrice'), value: (i) => formatChf(shown[i]!.price, locale) },
    { label: t('rowVisits'), value: (i) => String(shown[i]!.includedVisits) },
    { label: t('rowFrequency'), value: (i) => rhythmT(planRhythm(shown[i]!)) },
    {
      label: t('rowTerm'),
      value: (i) => t('months', { n: shown[i]!.validityMonths }),
    },
    {
      label: t('rowDiscount'),
      value: (i) => `−${shown[i]!.extraDiscountPercent}%`,
    },
    { label: t('rowSkips'), value: () => t('skips', { n: settings.monthlyFreeSkips }) },
    {
      label: t('rowCancellation'),
      value: () => t('cancellationDays', { n: settings.planCancellationDays }),
    },
  ];

  return (
    <>
      {/* Desktop: a real comparison table. */}
      <div className="mt-8 hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="label-type py-4 pr-4 text-ink-tertiary">
                &nbsp;
              </th>
              {shown.map((plan) => (
                <th key={plan.id} scope="col" className="display-type py-4 pr-4 text-xl">
                  {plan.name[locale]}
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
                {shown.map((plan, i) => (
                  <td key={plan.id} data-numeric className="py-4 pr-4">
                    {row.value(i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Below lg: the same rows as one block per plan. */}
      <div className="mt-8 space-y-5 lg:hidden">
        {shown.map((plan, planIndex) => (
          <div key={plan.id} className="surface-card p-6">
            <h3 className="subhead-type text-xl">{plan.name[locale]}</h3>
            <dl className="mt-4 divide-y divide-line-subtle border-t border-line-subtle">
              {rows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-sm text-ink-secondary">{row.label}</dt>
                  <dd data-numeric className="text-right">
                    {row.value(planIndex)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
