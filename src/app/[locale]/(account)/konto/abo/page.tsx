'use client';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Check, Pause, RefreshCw, SkipForward } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { DetailList, DetailRow } from '@/components/ui/detail-list';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { planRhythm } from '@/lib/offer-facts';
import {
  cancelBlock,
  cancelDeadline,
  planOf,
  skipsLeft,
  subscriptionState,
  visitsLeft,
} from '@/lib/plan-facts';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Plan, Subscription } from '@/mock/schema';

/**
 * Screen 43 — the plans this customer holds.
 *
 * Plans, plural, and that is the change. This screen did
 * `subscriptions.find((s) => s.status !== 'cancelled')` — it took the first one
 * and threw the rest away, and it never named the property. A customer with a
 * flat and an office therefore saw one plan, could not tell which address it
 * was for, and had no way to reach the other.
 *
 * What each card has to answer is what the plan is *worth now*: how many of the
 * visits are left, when the year ends, and what the two things the customer
 * came here to do — skip a visit, get out — actually cost them.
 */
export default function AccountSubscriptionPage() {
  const t = useTranslations('account.subscription');
  const hydrated = useHydrated();
  const now = useNow();

  const { subscriptions } = useAccount();
  const plans = useStore((s) => s.plans);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  /* Cancelled plans are gone — refunded, nothing to show. Expired ones stay,
     because renewing is done from the card and a plan that vanished the day it
     ran out would take its renew button with it. */
  const held = subscriptions
    .filter((s) => s.status !== 'cancelled')
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  if (held.length === 0) {
    return (
      <>
        <PageHeader title={t('title')} />
        <EmptyState
          title={t('emptyTitle')}
          body={t('emptyBody')}
          action={
            <Button asChild>
              <Link href="/abos">{t('emptyAction')}</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={held.length > 1 ? t('leadMany', { n: held.length }) : t('leadOne')}
      />

      <div className="space-y-app-section">
        {held.map((subscription) => (
          <PlanCard
            key={subscription.id}
            subscription={subscription}
            plan={planOf(subscription, plans)}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  subscription,
  plan,
  now,
}: {
  subscription: Subscription;
  plan: Plan | undefined;
  now: Date;
}) {
  const t = useTranslations('account.subscription');
  const rhythmT = useTranslations('admin.rhythm');
  const format = useFormatter();
  const locale = useLocale() as Locale;

  const properties = useStore((s) => s.data.properties);
  const plans = useStore((s) => s.plans);
  const settings = useStore((s) => s.settings);
  const resumeSubscription = useStore((s) => s.resumeSubscription);
  const skipNextVisit = useStore((s) => s.skipNextVisit);
  const cancelSubscription = useStore((s) => s.cancelSubscription);
  const renewSubscription = useStore((s) => s.renewSubscription);

  if (!plan) return null;

  const property = properties.find((p) => p.id === subscription.propertyId);
  const state = subscriptionState(subscription, now);
  const left = visitsLeft(subscription, plan);
  const skips = skipsLeft(subscription, settings, now);
  const block = cancelBlock(subscription, settings, now);
  const paused = state === 'paused';
  const expired = state === 'expired';

  /* A better plan on the same service, for the upgrade link. Offering "change
     plan" with nothing to change to is a dead end; offering it across services
     would swap what the plan is for. */
  const upgrades = plans.filter(
    (p) =>
      p.active &&
      p.visibleOnSite &&
      p.serviceSlug === plan.serviceSlug &&
      p.includedVisits > plan.includedVisits,
  );

  /*
   * One card per section, not one card per plan.
   *
   * This was a single slab with five blocks stacked inside it, separated by
   * hairlines and headed by hand-set `h3`s — so «Besuch auslassen» and «Abo
   * kündigen», two irreversible actions, read as paragraphs of the plan rather
   * than as things you do. The plan's own name was set four steps larger than
   * every other card title in the account, which made this the one screen whose
   * heading scale nothing else shared.
   *
   * The cards belonging to one plan sit closer together than two plans do
   * (`space-y-app` inside, `space-y-app-section` between), so a customer with a
   * flat and an office can still see which actions belong to which address.
   */
  return (
    <section className="space-y-app">
      <Card>
        <CardHeader
          title={plan.name[locale]}
          /*
            The property, directly under the name. A customer with two plans is
            looking at two nearly identical cards, and the address is the only
            thing that tells them apart.
          */
          description={
            property ? (
              <Link href={`/konto/objekte/${property.id}`} className="hover:underline">
                {property.label}
                <span className="text-ink-tertiary">
                  {' '}
                  · {property.street}, {property.city}
                </span>
              </Link>
            ) : (
              t('propertyUnknown')
            )
          }
          actions={<StatusBadge entity="subscription" state={state} />}
        />
        <CardBody className="space-y-app">
          {paused && (
            <Alert
              tone="info"
              icon={Pause}
              title={t('pausedTitle')}
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    resumeSubscription(subscription.id, now);
                    toast.success(t('resumed'));
                  }}
                >
                  {t('resume')}
                </Button>
              }
            >
              {t('pausedBody')}
            </Alert>
          )}

          {/* Used and left, as a number and a bar. This is the question the
              screen exists to answer. It sat between two hairlines inside the
              slab; it is the lead fact of the card now. */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">{t('visitsTitle')}</p>
              <p data-numeric className="text-sm text-ink-secondary">
                {t('visitsOf', {
                  used: subscription.visitsUsed,
                  total: plan.includedVisits,
                })}
              </p>
            </div>
            <Progress
              className="mt-3"
              value={subscription.visitsUsed}
              max={plan.includedVisits}
              tone={left === 0 ? 'warning' : 'default'}
              label={t('visitsOf', {
                used: subscription.visitsUsed,
                total: plan.includedVisits,
              })}
            />
            <p data-numeric className="mt-2 text-sm text-ink-secondary">
              {left > 0 ? t('visitsLeft', { n: left }) : t('visitsNone')}
            </p>
          </div>

          {/* Was a local `Row` — the same flex and hairline as `DetailRow` at a
              different padding, so the facts here lined up with nothing on the
              request or invoice screens. */}
          <DetailList columns={2}>
            <DetailRow label={t('rhythm')}>{rhythmT(planRhythm(plan))}</DetailRow>
            <DetailRow label={t('paid')}>
              <Money amount={plan.price} />
            </DetailRow>
            <DetailRow label={t('validUntil')}>
              <span data-numeric>
                {format.dateTime(new Date(subscription.endDate), 'short')}
              </span>
            </DetailRow>
            <DetailRow label={t('discount')}>
              <span data-numeric>{plan.extraDiscountPercent}%</span>
            </DetailRow>
            {subscription.renewalCount > 0 && (
              <DetailRow label={t('renewals')}>
                <span data-numeric>{subscription.renewalCount}</span>
              </DetailRow>
            )}
          </DetailList>

          {plan.features.length > 0 && (
            <div>
              <h3 className="text-sm font-medium">{t('benefitsTitle')}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-eco" aria-hidden />
                    <span className="text-ink-secondary">
                      {feature[locale] || feature.de}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>

      {expired ? (
        <Card>
          <CardHeader
            title={t('expiredTitle')}
            description={
              left > 0
                ? t('expiredWithLeft', {
                    n: left,
                    date: format.dateTime(new Date(subscription.endDate), 'short'),
                  })
                : t('expiredBody', {
                    date: format.dateTime(new Date(subscription.endDate), 'short'),
                  })
            }
            actions={
              <Button
                disabled={!plan.active}
                onClick={() => {
                  const invoiceId = renewSubscription(subscription.id, now);
                  toast[invoiceId ? 'success' : 'error'](
                    invoiceId ? t('renewDone') : t('renewBlocked'),
                  );
                }}
              >
                <RefreshCw className="size-4" aria-hidden />
                {t('renew')}
              </Button>
            }
          />
          {!plan.active && (
            <CardBody>
              <p className="text-sm text-ink-tertiary">{t('renewRetired')}</p>
            </CardBody>
          )}
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title={t('skipTitle')}
              description={t('skipBody', {
                used: settings.monthlyFreeSkips - skips,
                free: settings.monthlyFreeSkips,
              })}
              /* The button rides the header rather than sitting under it: title,
                 consequence and control on one line is the shape every other
                 action card in the account uses. */
              actions={
                skips > 0 ? (
                  <Button
                    disabled={paused}
                    onClick={() => {
                      skipNextVisit(subscription.id, now);
                      toast.success(t('skipped'));
                    }}
                  >
                    <SkipForward className="size-4" aria-hidden />
                    {t('skipAction')}
                  </Button>
                ) : undefined
              }
            />
            {skips <= 0 && (
              <CardBody>
                <Alert tone="warning">{t('skipBlocked')}</Alert>
              </CardBody>
            )}
          </Card>

          {/*
            Changing plan, which this screen never offered at all. /open-questions
            §21.7 settled the rule long ago — upgrade now, downgrade at the next
            term — and the customer had no way to ask for either, so the answer
            only existed on paper.
          */}
          {upgrades.length > 0 && (
            <Card>
              <CardHeader title={t('upgradeTitle')} description={t('upgradeBody')} />
              <CardBody className="flex flex-wrap gap-3">
                {upgrades.map((option) => (
                  <Button key={option.id} asChild variant="secondary">
                    <Link href={`/kontakt?abo=${option.id}`}>
                      {t('upgradeTo', { name: option.name[locale] })}
                    </Link>
                  </Button>
                ))}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader
              title={t('cancelTitle')}
              description={
                block === null
                  ? t('cancelBody', {
                      date: format.dateTime(cancelDeadline(subscription, settings), 'short'),
                    })
                  : /* The rule, stated, rather than a button that is not there.
                       "Why can I not cancel?" is the whole question at this
                       point, and silence reads as the option having been taken
                       away. */
                    t(`cancelBlocked.${block}`)
              }
              actions={
                block === null ? (
                  <Button
                    variant="quiet"
                    onClick={() => {
                      const refused = cancelSubscription(subscription.id, now);
                      if (refused) toast.error(t(`cancelBlocked.${refused}`));
                      else toast.success(t('cancelDone'));
                    }}
                  >
                    {t('cancelAction')}
                  </Button>
                ) : undefined
              }
            />
          </Card>
        </>
      )}
    </section>
  );
}
