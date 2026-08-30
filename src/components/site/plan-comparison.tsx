'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { Locale } from '@/i18n/routing';
import type { ID, Plan } from '@/mock/schema';
import { formatChf } from '@/components/ui/money';
import { planRhythm } from '@/lib/offer-facts';
import { planSaving, plansByService, recommendedPlan } from '@/lib/plan-facts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const t = useTranslations('site.plans');
  const locale = useLocale() as Locale;
  const plans = useStore((s) => s.plans);
  const services = useStore((s) => s.services);

  const groups = plansByService(plans, services);
  if (groups.length === 0) return null;

  /* One service, no tabs. A tab strip with a single tab is a control that
     cannot be operated, and it would still take a row of the page to say so. */
  if (groups.length === 1) return <PlanComparisonTable plans={groups[0]!.plans} />;

  return (
    <Tabs defaultValue={groups[0]!.service.slug}>
      <TabsList tone="card" aria-label={t('compareTabsLabel')}>
        {groups.map((group) => (
          <TabsTrigger key={group.service.slug} tone="card" value={group.service.slug}>
            {group.service.name[locale]}
            <span data-numeric className="opacity-60">
              {group.plans.length}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {groups.map((group) => (
        <TabsContent
          key={group.service.slug}
          value={group.service.slug}
          /*
           * Kept in the DOM when it is not the open tab.
           *
           * Tabs hide content, and this is the only place on the site where an
           * office plan's visits, term and saving are written out — the rails
           * above show one service at a time too. Unmounted, a crawler and a
           * reader with the page saved to a file would both see three
           * household plans and no sign the other two exist. There is no
           * reveal animation on a table, so nothing here depends on the panel
           * having been on screen when it mounted.
           */
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <PlanComparisonTable plans={group.plans} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

/**
 * The table on its own, for callers that already know which plans to compare.
 *
 * The account's plan catalogue asks the same question the marketing page does —
 * what is the difference between these packages — about the same records, and
 * building a second table for it would have been a second set of rows to keep
 * in step with the first. The one difference is that a signed-in reader has a
 * plan already, and the column that is *theirs* is the one they are comparing
 * everything else against: without it marked, the table answers "which is best"
 * when the question is "what would change".
 */
export function PlanComparisonTable({
  plans,
  currentPlanId,
}: {
  plans: Plan[];
  currentPlanId?: ID;
}) {
  const t = useTranslations('site.plans');
  const rhythmT = useTranslations('admin.rhythm');
  const locale = useLocale() as Locale;
  const settings = useStore((s) => s.settings);

  const anySaving = plans.some((p) => planSaving(p));
  /*
   * The same plan the cards above raise and ribbon, marked here too.
   *
   * The rails crowned one plan and the table gave no sign of it — a reader who
   * had just been told which one we suggest arrived at seven rows of numbers
   * with all three columns weighted equally, and had to remember rather than
   * see it. Worse, a table is where somebody goes to argue with the
   * recommendation: this is the screen where the suggestion has to be visible
   * *next to* the figures that justify or refute it.
   *
   * Read from `recommendedPlan` rather than re-derived, so the column that is
   * tinted here is by construction the card that is raised there.
   */
  const recommended = recommendedPlan(plans);
  /* The reader's own plan outranks the suggestion on its column. A header
     carrying both «Empfohlen» and «Ihr Abo» says the second thing loudest and
     the first one pointlessly — nobody needs recommending what they hold. */
  const marker = (plan: Plan) =>
    plan.id === currentPlanId ? t('yourPlan') : recommended?.id === plan.id ? t('recommended') : null;
  const tinted = (plan: Plan) => plan.id === currentPlanId || recommended?.id === plan.id;

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
                <th
                  key={plan.id}
                  scope="col"
                  className={cn(
                    'subhead-type px-4 pb-4 text-xl',
                    // The tint runs the height of the column, so the header
                    // cell opens it rather than sitting on top of it.
                    tinted(plan)
                      ? 'rounded-t-[var(--radius-md)] bg-accent-subtle pt-3'
                      : 'pt-4',
                  )}
                >
                  {marker(plan) && (
                    <span className="label-type mb-1.5 block text-ink-accent">
                      {marker(plan)}
                    </span>
                  )}
                  {plan.name[locale]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.label} className="border-b border-line last:border-0">
                <th scope="row" className="px-4 py-3.5 font-normal text-ink-secondary">
                  {row.label}
                </th>
                {plans.map((plan) => (
                  <td
                    key={plan.id}
                    data-numeric
                    className={cn(
                      'px-4 py-3.5',
                      row.strong && 'text-lg font-medium',
                      tinted(plan) && 'bg-accent-subtle',
                      // Closes the tinted column on the last row. `last:` on
                      // the cell would match the last cell of every row.
                      tinted(plan) &&
                        rowIndex === rows.length - 1 &&
                        'rounded-b-[var(--radius-md)]',
                    )}
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
          <div
            key={plan.id}
            className={cn(
              'surface-card p-6',
              // No column to tint on a phone, so the block itself carries it.
              tinted(plan) && 'border-line-strong bg-accent-subtle',
            )}
          >
            {marker(plan) && (
              <p className="label-type mb-1.5 text-ink-accent">{marker(plan)}</p>
            )}
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
