'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Check, ChevronDown, Columns3, Rows3, X } from 'lucide-react';

import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Money, formatChf } from '@/components/ui/money';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanComparisonTable } from '@/components/site/plan-comparison';
import { cn } from '@/lib/cn';
import { planRhythm } from '@/lib/offer-facts';
import {
  perVisitPrice,
  planOf,
  planSaving,
  plansByService,
  propertyOptions,
  recommendedPlan,
  upgradesFor,
} from '@/lib/plan-facts';
import { useAccount } from '@/lib/use-account';
import { useNow, useStore } from '@/mock/store';
import type { Plan, Subscription } from '@/mock/schema';
import type { SubscribeIntent } from './subscribe-dialog';

/**
 * How the rail is laid out, and it is a real choice rather than a preference.
 *
 * `side` is the comparison shape — three packages in three columns, the prices
 * on one line, the eye moving across them. It is also the shape that gives each
 * card a third of the width, so a features list is a narrow column and a long
 * feature wraps to three lines.
 *
 * `stacked` gives every plan the full width and turns the card on its side:
 * name and features on the left, price and button on the right. That is the
 * shape for reading one plan properly, and the only usable one on a phone —
 * which is why below `lg` the rail stacks whichever mode is selected. The
 * control does not disappear there, because the layout still changes: stacked
 * keeps the price beside the name at `sm`, side-by-side puts it underneath.
 */
export type PlanView = 'side' | 'stacked';

/**
 * Every plan on sale, inside the account.
 *
 * Screen 43 showed the plans this customer *holds* and nothing else, which
 * made it a receipt rather than a dashboard. There was no answer on it to
 * "what else do you sell", "what would the bigger one give me", or "what does
 * mine actually include compared with the others" — all three were on the
 * marketing site, signed out, at `/abos`, and getting there meant leaving the
 * account.
 *
 * The comparison table is the marketing page's own, not a copy: the rows are
 * the fields every plan has, and a second table built here would have been a
 * second set of rows to keep in step with the first.
 */
export function PlanCatalogue({
  upgradeFor,
  onClearUpgrade,
  onPick,
  view,
  onViewChange,
}: {
  /** Set by "move up a plan" on a card above. Narrows the rail to the packages
      that subscription can actually move to. */
  upgradeFor: Subscription | null;
  onClearUpgrade: () => void;
  onPick: (intent: SubscribeIntent) => void;
  view: PlanView;
  onViewChange: (view: PlanView) => void;
}) {
  const t = useTranslations('account.subscription');
  const locale = useLocale() as Locale;
  const now = useNow();

  const plans = useStore((s) => s.plans);
  const services = useStore((s) => s.services);
  const { properties, subscriptions } = useAccount();

  const groups = useMemo(() => plansByService(plans, services), [plans, services]);
  const [tab, setTab] = useState(() => groups[0]?.service.slug ?? '');

  const currentPlan = upgradeFor ? planOf(upgradeFor, plans) : undefined;
  const upgrades = useMemo(
    () => (upgradeFor ? upgradesFor(currentPlan, plans) : []),
    [upgradeFor, currentPlan, plans],
  );

  /* Clearing the filter puts the reader back on the service they were just
     looking at, not on the first tab. The upgrade rail has no tab strip — the
     service is decided by the plan being replaced — so without this, leaving it
     drops somebody who was reading about office packages into the household
     ones with no sign that anything moved. */
  function clearUpgrade() {
    if (currentPlan) setTab(currentPlan.serviceSlug);
    onClearUpgrade();
  }

  /*
   * Whether anything can be bought at all, which is a property of the account
   * rather than of a plan.
   *
   * One package per address is the store's rule, so a customer whose every
   * address already carries a plan cannot buy any of these — and four buy
   * buttons that all end in the same refusal is four ways to waste somebody's
   * time. The rail still renders: what is on sale and what it costs is worth
   * reading whether or not today is the day to buy it.
   */
  const freeAddresses = useMemo(
    () => propertyOptions(properties, subscriptions, now).filter((o) => !o.heldBy).length,
    [properties, subscriptions, now],
  );
  const canBuy = freeAddresses > 0;

  const held = useMemo(
    () =>
      new Map(
        subscriptions
          .filter((s) => s.status !== 'cancelled' && new Date(s.endDate) > now)
          .map((s) => [s.planId, s] as const),
      ),
    [subscriptions, now],
  );

  const controls = (
    <ViewSwitch
      value={view}
      onChange={onViewChange}
      label={t('viewLabel')}
      labels={{ side: t('viewSide'), stacked: t('viewStacked') }}
    />
  );

  if (groups.length === 0) {
    return (
      /* The id stays on every branch. It is the target the "move up a plan"
         button scrolls to, and a heading that answers to it in three cases out
         of four is a button that silently does nothing in the fourth. */
      <section id="abo-katalog" className="scroll-mt-24">
        <Header title={t('catalogueTitle')} lead={t('catalogueLead')} />
        <EmptyState title={t('catalogueEmptyTitle')} body={t('catalogueEmptyBody')} />
      </section>
    );
  }

  /* Filtered to one subscription's upgrades: no tabs, because the service is
     decided by the plan being replaced, and a strip whose other tabs are all
     unreachable is a control that lies about what it does. */
  if (upgradeFor && currentPlan) {
    return (
      <section id="abo-katalog" className="scroll-mt-24">
        <Header
          title={t('upgradeRailTitle', { name: currentPlan.name[locale] })}
          lead={t('upgradeRailLead')}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {controls}
              <Button variant="ghost" size="sm" onClick={clearUpgrade}>
                <X className="size-4" aria-hidden />
                {t('upgradeClear')}
              </Button>
            </div>
          }
        />
        {upgrades.length === 0 ? (
          <Alert tone="neutral" className="mt-5">
            {t('upgradeNoneBody', { name: currentPlan.name[locale] })}
          </Alert>
        ) : (
          <>
            <Rail
              plans={upgrades}
              view={view}
              held={held}
              onPick={(plan) => onPick({ plan, upgradeOn: upgradeFor })}
              ctaKey="upgradePick"
              /* The address is fixed and the new package replaces the old one,
                 so "one plan per address" is satisfied by construction. */
              canBuy
            />
            <Comparison plans={[currentPlan, ...upgrades]} currentPlanId={currentPlan.id} />
          </>
        )}
      </section>
    );
  }

  const single = groups.length === 1;

  return (
    <section id="abo-katalog" className="scroll-mt-24">
      <Header title={t('catalogueTitle')} lead={t('catalogueLead')} actions={controls} />

      {properties.length === 0 ? (
        <Alert tone="neutral" className="mt-5">
          {t('noProperties')}
        </Alert>
      ) : (
        !canBuy && (
          <Alert tone="neutral" className="mt-5">
            {t('allPropertiesTaken')}
          </Alert>
        )
      )}

      {single ? (
        <>
          <Rail
            plans={groups[0]!.plans}
            view={view}
            held={held}
            onPick={(plan) => onPick({ plan })}
            ctaKey="cataloguePick"
            canBuy={canBuy}
          />
          <Comparison plans={groups[0]!.plans} />
        </>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="mt-5">
          <TabsList aria-label={t('catalogueTabs')}>
            {groups.map((group) => (
              <TabsTrigger key={group.service.slug} value={group.service.slug}>
                {group.service.name[locale]}
                <span data-numeric className="opacity-60">
                  {group.plans.length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {groups.map((group) => (
            <TabsContent key={group.service.slug} value={group.service.slug}>
              <p className="mt-5 text-sm text-ink-secondary">{group.service.short[locale]}</p>
              <Rail
                plans={group.plans}
                view={view}
                held={held}
                onPick={(plan) => onPick({ plan })}
                ctaKey="cataloguePick"
                canBuy={canBuy}
              />
              <Comparison plans={group.plans} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </section>
  );
}

function Header({
  title,
  lead,
  actions,
}: {
  title: string;
  lead: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div>
        <h2 className="display-type text-xl">{title}</h2>
        <p className="mt-1.5 max-w-[var(--measure)] text-sm text-ink-secondary">{lead}</p>
      </div>
      {actions}
    </div>
  );
}

/**
 * The two layouts, as one control with two pressed states.
 *
 * Not a `Tabs` strip: tabs choose *what* is shown and this chooses how the same
 * thing is drawn, so the tab semantics would announce a panel change to a
 * screen reader that never happens. Two toggle buttons in a group, each saying
 * whether it is on.
 */
function ViewSwitch({
  value,
  onChange,
  label,
  labels,
}: {
  value: PlanView;
  onChange: (view: PlanView) => void;
  label: string;
  labels: Record<PlanView, string>;
}) {
  const OPTIONS: { value: PlanView; icon: typeof Rows3 }[] = [
    { value: 'stacked', icon: Rows3 },
    { value: 'side', icon: Columns3 },
  ];

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-sunken p-1"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium',
              'transition-colors duration-[var(--motion-fast)]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
              active
                ? 'bg-card text-ink shadow-[var(--shadow-sm)]'
                : 'text-ink-secondary hover:text-ink',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {/* The label is not decoration on a two-icon control: nobody can
                tell "rows" from "columns" as glyphs at 16px without it. It
                folds down to the accessible name only where the row would
                otherwise wrap — `not-sr-only` rather than a second copy of the
                word, which is a second thing to translate and reads twice to
                anything walking the text. */}
            <span className="sr-only sm:not-sr-only">{labels[option.value]}</span>
          </button>
        );
      })}
    </div>
  );
}

function Rail({
  plans,
  view,
  held,
  onPick,
  ctaKey,
  canBuy,
}: {
  plans: Plan[];
  view: PlanView;
  held: Map<string, Subscription>;
  onPick: (plan: Plan) => void;
  ctaKey: 'cataloguePick' | 'upgradePick';
  canBuy: boolean;
}) {
  const recommended = recommendedPlan(plans);

  return (
    <ul
      className={cn(
        'mt-5',
        view === 'side'
          ? cn('grid gap-4', plans.length > 2 ? 'lg:grid-cols-3' : 'lg:grid-cols-2')
          : 'space-y-4',
      )}
    >
      {plans.map((plan) => (
        <PlanOfferCard
          key={plan.id}
          plan={plan}
          view={view}
          featured={recommended?.id === plan.id}
          heldBy={held.get(plan.id)}
          onPick={() => onPick(plan)}
          ctaKey={ctaKey}
          canBuy={canBuy}
        />
      ))}
    </ul>
  );
}

function PlanOfferCard({
  plan,
  view,
  featured,
  heldBy,
  onPick,
  ctaKey,
  canBuy,
}: {
  plan: Plan;
  view: PlanView;
  featured: boolean;
  heldBy: Subscription | undefined;
  onPick: () => void;
  ctaKey: 'cataloguePick' | 'upgradePick';
  canBuy: boolean;
}) {
  const t = useTranslations('account.subscription');
  /* The product vocabulary comes from the marketing page's own dictionary
     rather than a second copy under `account`. "26 Einsätze · 12 Monate ·
     einmalig zahlbar" is a claim about what a plan *is*, and the account
     saying it in slightly different words from the page that sold it is how a
     customer starts wondering whether they bought the same thing. */
  const planT = useTranslations('site.plans');
  const rhythmT = useTranslations('admin.rhythm');
  const locale = useLocale() as Locale;
  const settings = useStore((s) => s.settings);
  const [open, setOpen] = useState(false);

  const saving = planSaving(plan);
  const side = view === 'side';

  const price = (
    <div className={cn(side ? 'mt-6' : 'sm:text-right')}>
      {saving && (
        <p className={cn('flex items-center gap-2.5 text-sm', !side && 'sm:justify-end')}>
          <span className="sr-only">{planT('wasPrice')}</span>
          <s data-numeric className="text-ink-tertiary">
            <Money amount={saving.listPrice} />
          </s>
          <span className="label-type text-eco">
            {planT('saveBadge', { percent: saving.percent })}
          </span>
        </p>
      )}
      <p data-numeric className={cn('text-3xl', saving && 'mt-1')}>
        <Money amount={plan.price} />
      </p>
      {/* The term under the price, never in a footnote. This is a year paid in
          one instalment, and a reader will assume it is monthly unless told. */}
      <p className="mt-1 text-sm text-ink-tertiary">
        {planT('priceNote', { visits: plan.includedVisits, months: plan.validityMonths })}
      </p>
      <p data-numeric className="mt-0.5 text-sm text-ink-tertiary">
        {t('perVisit', { amount: formatChf(perVisitPrice(plan), locale) })}
      </p>
    </div>
  );

  /*
   * Holding a package does not put it out of reach.
   *
   * The first version replaced the button with "you are already on this one",
   * which is true of the address it runs on and false of every other address
   * the customer owns — a flat on Basic and an empty second flat could not buy
   * Basic for the second flat, on the screen built to sell it. The badge says
   * they hold it; the button says they may hold it again somewhere else.
   */
  const cta = !canBuy ? (
    heldBy ? (
      <p className="flex items-center gap-2 text-sm font-medium text-ink-accent">
        <Check className="size-4 shrink-0" aria-hidden />
        {t('alreadyHeld')}
      </p>
    ) : null
  ) : (
    <Button variant={featured ? 'primary' : 'secondary'} block={side} onClick={onPick}>
      {/*
        Only in the open catalogue does holding a plan change the label.
        In the upgrade rail the button moves *this* address up whether or not
        the same package also runs on another one — labelling it "for another
        address" there would name the opposite of what pressing it does. Found
        by buying Premium for a third address and then opening the upgrade rail
        on Basic: the button offering the upgrade read as a second purchase.
      */}
      {heldBy && ctaKey === 'cataloguePick' ? t('catalogueAnother') : t(ctaKey)}
    </Button>
  );

  return (
    <li
      className={cn(
        'surface-card relative p-6',
        side && 'flex flex-col',
        (featured || heldBy) && 'border-line-strong',
      )}
    >
      {(heldBy || featured) && (
        <span className="label-type absolute -top-2.5 left-6 bg-rule px-2 py-1 text-white">
          {heldBy ? t('alreadyHeldBadge') : planT('recommended')}
        </span>
      )}

      <div className={cn(!side && 'flex flex-wrap items-start justify-between gap-x-8 gap-y-4')}>
        <div className={cn(!side && 'min-w-[16rem] flex-1')}>
          <h3 className="subhead-type text-xl">{plan.name[locale]}</h3>
          <p className="mt-1 text-sm text-ink-secondary">{rhythmT(planRhythm(plan))}</p>
          <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
            {plan.description[locale] || plan.description.de}
          </p>

          {plan.features.length > 0 && (
            <ul
              className={cn(
                'mt-4 space-y-2 text-sm',
                side && 'border-t border-line-subtle pt-4',
              )}
            >
              {plan.features.map((feature, i) => (
                <li key={i} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-eco" aria-hidden />
                  <span className="text-ink-secondary">{feature[locale] || feature.de}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!side && (
          <div className="flex flex-col items-start gap-4 sm:items-end">
            {price}
            {cta}
          </div>
        )}
      </div>

      {side && (
        <>
          {price}
          <div className="mt-6 flex-1" />
          {cta && <div className="mt-2">{cta}</div>}
        </>
      )}

      {/* Details, folded. Everything above is what a plan is *for*; this is the
          small print a buyer checks once and then never again — the allowance,
          the cooling-off window, what the discount applies to. Printed open on
          every card it would bury the difference between them. */}
      <div className={cn('border-t border-line-subtle', side ? 'mt-6 pt-4' : 'mt-5 pt-4')}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`plan-details-${plan.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
        >
          {t('detailsToggle')}
          <ChevronDown
            className={cn(
              'size-4 transition-transform duration-[var(--motion-fast)]',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
        {open && (
          <dl id={`plan-details-${plan.id}`} className="mt-3 divide-y divide-line-subtle text-sm">
            <Detail label={t('detailReference')}>{plan.reference}</Detail>
            <Detail label={t('detailVisits')}>{plan.includedVisits}</Detail>
            <Detail label={t('detailTerm')}>
              {planT('months', { n: plan.validityMonths })}
            </Detail>
            <Detail label={t('detailRhythm')}>{rhythmT(planRhythm(plan))}</Detail>
            <Detail label={t('detailDiscount')}>{`−${plan.extraDiscountPercent}%`}</Detail>
            <Detail label={t('detailSkips')}>
              {planT('skips', { n: settings.monthlyFreeSkips })}
            </Detail>
            <Detail label={t('detailCancellation')}>
              {planT('cancellationDays', { n: settings.planCancellationDays })}
            </Detail>
          </dl>
        )}
      </div>
    </li>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-ink-secondary">{label}</dt>
      <dd data-numeric>{children}</dd>
    </div>
  );
}

/**
 * The comparison, behind a disclosure.
 *
 * Open by default it would be the largest thing on a screen whose subject is
 * the plan the customer already has. Closed it is one line, and the line says
 * how many packages it puts side by side — which is the only thing anybody
 * needs in order to decide whether to open it.
 */
function Comparison({ plans, currentPlanId }: { plans: Plan[]; currentPlanId?: string }) {
  const t = useTranslations('account.subscription');
  const [open, setOpen] = useState(false);

  if (plans.length < 2) return null;

  return (
    <div className="mt-6">
      <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <ArrowUpRight className="size-4" aria-hidden />
        {open ? t('compareHide') : t('compareShow', { n: plans.length })}
      </Button>
      {open && <PlanComparisonTable plans={plans} currentPlanId={currentPlanId} />}
    </div>
  );
}
