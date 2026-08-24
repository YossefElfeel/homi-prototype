'use client';

import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/ui/money';
import { planRhythm } from '@/lib/offer-facts';
import { planSaving, plansByService, recommendedPlan } from '@/lib/plan-facts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Plan } from '@/mock/schema';
import { useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

/**
 * The plans, as the visitor sees them.
 *
 * This used to be a hardcoded array of three tiers reading a discount out of
 * `SEED_SETTINGS` — a frozen import, not the store. So the marketing page was
 * unreachable from the panel twice over: an admin could not change what it
 * said, and could not stop it saying it. Retiring a plan left it advertised,
 * and the brief's question about who controls visibility had no answer because
 * nobody did.
 *
 * `visibleOnSite` is the filter, and it is a plan's own flag rather than a list
 * kept here.
 */
export function PlanCards({
  compact = false,
  /**
   * One rail per service, each under the service's name.
   *
   * Off on the homepage, where the block is a teaser and shows the first
   * service's plans only. Flattening every plan into one rail put the two
   * office plans in the household row with nothing to say they were for a
   * different thing, and moved the "recommended" badge onto whichever card
   * happened to be the middle of five.
   */
  byService = false,
}: {
  compact?: boolean;
  byService?: boolean;
}) {
  const t = useTranslations('site.plans');
  const locale = useLocale() as Locale;
  const plans = useStore((s) => s.plans);
  const services = useStore((s) => s.services);

  const groups = plansByService(plans, services);
  if (groups.length === 0) return null;

  /* Tabbed, matching the comparison below it — the two blocks answer the same
     question about the same five plans, and reading one as a switcher and the
     other as a stack makes them look like different sets. Nothing here reveals
     on scroll, so the panels can stay mounted. */
  if (byService && groups.length > 1) {
    return (
      <Tabs defaultValue={groups[0]!.service.slug}>
        <TabsList aria-label={t('byServiceNav')}>
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
          <TabsContent
            key={group.service.slug}
            value={group.service.slug}
            forceMount
            className="data-[state=inactive]:hidden"
          >
            <p className="mb-6 text-sm text-ink-secondary">{group.service.short[locale]}</p>
            <Rail plans={group.plans} compact={compact} />
          </TabsContent>
        ))}
      </Tabs>
    );
  }

  return <Rail plans={groups[0]!.plans} compact={compact} />;
}

function Rail({ plans: shown, compact }: { plans: Plan[]; compact: boolean }) {
  const t = useTranslations('site.plans');
  const rhythmT = useTranslations('admin.rhythm');
  const locale = useLocale() as Locale;
  const recommended = recommendedPlan(shown);

  return (
    <ul className={cn('grid gap-5', shown.length > 2 ? 'lg:grid-cols-3' : 'lg:grid-cols-2')}>
      {shown.map((plan) => {
        // Same answer the comparison table marks. See `recommendedPlan`.
        const featured = recommended?.id === plan.id;
        const saving = planSaving(plan);

        return (
          <li
            key={plan.id}
            className={cn(
              'surface-card relative flex flex-col p-7',
              featured && 'border-line-strong',
            )}
          >
            {featured && (
              <span className="label-type absolute -top-2.5 left-7 bg-rule px-2 py-1 text-white">
                {t('recommended')}
              </span>
            )}

            <h3 className="subhead-type text-2xl">{plan.name[locale]}</h3>
            <p className="mt-1.5 text-ink-secondary">{rhythmT(planRhythm(plan))}</p>

            {/* The same saving the other direction shows, in this one's
                register: no badge, no motion, just the two figures and which
                is which. A price with nothing to compare it to is the argument
                for a plan left unmade. */}
            {saving && (
              <p className="mt-6 flex items-center gap-2.5 text-sm">
                <span className="sr-only">{t('wasPrice')}</span>
                <s data-numeric className="text-ink-tertiary">
                  <Money amount={saving.listPrice} />
                </s>
                <span className="label-type text-eco">
                  {t('saveBadge', { percent: saving.percent })}
                </span>
              </p>
            )}

            <p data-numeric className={cn('text-4xl', saving ? 'mt-1.5' : 'mt-6')}>
              <Money amount={plan.price} />
            </p>
            {/* The term, immediately under the price and not in a footnote.
                This is a year paid in one go — the single most consequential
                fact on the card, and the one a reader will assume is monthly
                unless told otherwise. */}
            <p className="mt-1 text-sm text-ink-tertiary">
              {t('priceNote', { months: plan.validityMonths, visits: plan.includedVisits })}
            </p>

            {!compact && plan.features.length > 0 && (
              <ul className="mt-6 space-y-2.5 border-t border-line-subtle pt-6 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-eco" aria-hidden />
                    <span className="text-ink-secondary">{feature[locale] || feature.de}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-7 flex-1" />
            <Button asChild block variant={featured ? 'primary' : 'secondary'}>
              <Link href={`/anfrage?abo=${plan.id}`}>{t('cta')}</Link>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
