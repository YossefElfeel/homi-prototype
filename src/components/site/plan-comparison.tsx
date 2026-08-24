'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { Locale } from '@/i18n/routing';
import type { Plan } from '@/mock/schema';
import { formatChf } from '@/components/ui/money';
import { planRhythm } from '@/lib/offer-facts';
import { planSaving, plansByService } from '@/lib/plan-facts';
import { useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

/**
 * The comparison table, built from whatever plans are on sale.
 *
 * It used to be a literal seven-row array naming Basic, Premium and VIP in the
 * markup. Adding a plan meant editing this file, and retiring one left it in
 * the table advertising a product the site would then refuse to sell. The rows
 * are the fields every plan has, so the table cannot go out of step with the
 * cards above it — both read the same records.
 *
 * **One table per service, not one table.** Comparing an office plan's
 * fifty-two visits against a household plan's twenty-six on the same row reads
 * as a difference in size when it is a difference in kind: they are visits to
 * different places, sold to different people. Plans are only comparable within
 * the service they buy.
 *
 * The saving row is new and is the reason to read the table at all — it is the
 * one number that differs between plans in a way the price alone does not
 * show. It is omitted when no plan in the group has a list price, rather than
 * printing a column of dashes.
 */
export function PlanComparison() {
  const locale = useLocale() as Locale;
  const plans = useStore((s) => s.plans);
  const services = useStore((s) => s.services);

  const groups = plansByService(plans, services);
  if (groups.length === 0) return null;

  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <section key={group.service.slug}>
          <h3 className="subhead-type text-xl">{group.service.name[locale]}</h3>
          <ComparisonTable plans={group.plans} />
        </section>
      ))}
    </div>
  );
}

function ComparisonTable({ plans }: { plans: Plan[] }) {
  const t = useTranslations('site.plans');
  const rhythmT = useTranslations('admin.rhythm');
  const locale = useLocale() as Locale;
  const settings = useStore((s) => s.settings);

  const anySaving = plans.some((p) => planSaving(p));

  const rows: { label: string; value: (plan: Plan) => string; strong?: boolean }[] = [
    { label: t('rowPrice'), value: (p) => formatChf(p.price, locale), strong: true },
    ...(anySaving
      ? [
          {
            label: t('rowSaving'),
            value: (p: Plan) => {
              const s = planSaving(p);
              // An em dash, not "0%" — this plan has no list price, which is
              // not the same claim as a saving of nothing.
              return s ? `${formatChf(s.saved, locale)} · ${s.percent}%` : '—';
            },
          },
        ]
      : []),
    { label: t('rowVisits'), value: (p) => String(p.includedVisits) },
    { label: t('rowFrequency'), value: (p) => rhythmT(planRhythm(p)) },
    { label: t('rowTerm'), value: (p) => t('months', { n: p.validityMonths }) },
    { label: t('rowDiscount'), value: (p) => `−${p.extraDiscountPercent}%` },
    { label: t('rowSkips'), value: () => t('skips', { n: settings.monthlyFreeSkips }) },
    {
      label: t('rowCancellation'),
      value: () => t('cancellationDays', { n: settings.planCancellationDays }),
    },
  ];

  return (
    <>
      {/*
       * Desktop: a real comparison table, on its own white card.
       *
       * It used to sit bare on the section's grey slab, and its rules were
       * `border-line-subtle` — #e4e4e4 on #f1f1f1, a contrast of about 1.07:1.
       * Every dividing line in the comparison was invisible, so the table read
       * as three columns of loose text with nothing tying a row together: the
       * one screen on the site whose entire job is to line values up, and it
       * did not appear to line anything up at all. White under it gives the
       * rules something to be seen against.
       */}
      <div className="surface-card mt-6 hidden overflow-x-auto p-2 lg:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{t('compareTitle')}</caption>
          <thead>
            <tr className="border-b border-line-strong">
              <th scope="col" className="label-type px-4 py-4 text-ink-tertiary">
                &nbsp;
              </th>
              {plans.map((plan) => (
                <th key={plan.id} scope="col" className="subhead-type px-4 py-4 text-xl">
                  {plan.name[locale]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-0">
                <th scope="row" className="px-4 py-3.5 font-normal text-ink-secondary">
                  {row.label}
                </th>
                {plans.map((plan) => (
                  <td
                    key={plan.id}
                    data-numeric
                    className={cn('px-4 py-3.5', row.strong && 'text-lg font-medium')}
                  >
                    {row.value(plan)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Below lg: the same rows as one block per plan. The brief rules out the
          usual shortcut in as many words — separate cards on mobile, not a
          squeezed table. */}
      <div className="mt-6 space-y-5 lg:hidden">
        {plans.map((plan) => (
          <div key={plan.id} className="surface-card p-6">
            <h4 className="subhead-type text-xl">{plan.name[locale]}</h4>
            <dl className="mt-4 divide-y divide-line border-t border-line">
              {rows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-sm text-ink-secondary">{row.label}</dt>
                  <dd data-numeric className={cn('text-right', row.strong && 'font-medium')}>
                    {row.value(plan)}
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
