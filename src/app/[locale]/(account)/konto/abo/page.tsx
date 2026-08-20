'use client';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, Check, Pause, RefreshCw, SkipForward } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
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
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <EmptyState
          className="mt-8"
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
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">
        {held.length > 1 ? t('leadMany', { n: held.length }) : t('leadOne')}
      </p>

      <div className="mt-8 space-y-6">
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

  return (
    <section className="surface-card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display-type text-2xl">{plan.name[locale]}</h2>
          {/*
            The property, directly under the name.
            A customer with two plans is looking at two nearly identical cards,
            and the address is the only thing that tells them apart. It is the
            first line, not a detail row further down.
          */}
          <p className="mt-1 text-ink-secondary">
            {property ? (
              <Link href={`/konto/objekte/${property.id}`} className="hover:underline">
                {property.label}
                <span className="text-ink-tertiary">
                  {' '}
                  · {property.street}, {property.city}
                </span>
              </Link>
            ) : (
              t('propertyUnknown')
            )}
          </p>
        </div>
        <StatusBadge entity="subscription" state={state} />
      </div>

      {paused && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-l-2 border-rule bg-sunken p-5">
          <div className="flex gap-3">
            <Pause className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
            <div>
              <h3 className="font-medium">{t('pausedTitle')}</h3>
              <p className="mt-1 text-sm text-ink-secondary">{t('pausedBody')}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              resumeSubscription(subscription.id, now);
              toast.success(t('resumed'));
            }}
          >
            {t('resume')}
          </Button>
        </div>
      )}

      {/* Used and left, as a number and a bar. This is the question the screen
          exists to answer and it had no data behind it at all before. */}
      <div className="mt-6 border-y border-line-subtle py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium">{t('visitsTitle')}</p>
          <p data-numeric className="text-sm text-ink-secondary">
            {t('visitsOf', { used: subscription.visitsUsed, total: plan.includedVisits })}
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

      <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">
        <Row label={t('rhythm')}>{rhythmT(planRhythm(plan))}</Row>
        <Row label={t('paid')}>
          <Money amount={plan.price} />
        </Row>
        <Row label={t('validUntil')}>
          <span data-numeric>{format.dateTime(new Date(subscription.endDate), 'short')}</span>
        </Row>
        <Row label={t('discount')}>
          <span data-numeric>{plan.extraDiscountPercent}%</span>
        </Row>
        {subscription.renewalCount > 0 && (
          <Row label={t('renewals')}>
            <span data-numeric>{subscription.renewalCount}</span>
          </Row>
        )}
      </dl>

      {plan.features.length > 0 && (
        <>
          <h3 className="mt-6 font-medium">{t('benefitsTitle')}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-eco" aria-hidden />
                <span className="text-ink-secondary">{feature[locale] || feature.de}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {expired ? (
        <div className="mt-7 border-t border-line-subtle pt-6">
          <h3 className="font-medium">{t('expiredTitle')}</h3>
          <p className="mt-1.5 max-w-[var(--measure)] text-sm text-ink-secondary">
            {left > 0
              ? t('expiredWithLeft', {
                  n: left,
                  date: format.dateTime(new Date(subscription.endDate), 'short'),
                })
              : t('expiredBody', {
                  date: format.dateTime(new Date(subscription.endDate), 'short'),
                })}
          </p>
          <Button
            className="mt-4"
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
          {!plan.active && (
            <p className="mt-2 text-sm text-ink-tertiary">{t('renewRetired')}</p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-7 border-t border-line-subtle pt-6">
            <h3 className="font-medium">{t('skipTitle')}</h3>
            <p className="mt-1.5 max-w-[var(--measure)] text-sm text-ink-secondary">
              {t('skipBody', {
                used: settings.monthlyFreeSkips - skips,
                free: settings.monthlyFreeSkips,
              })}
            </p>
            {skips <= 0 ? (
              <p className="mt-4 flex gap-2 border-l-2 border-status-warning-line bg-status-warning p-4 text-sm text-status-warning-fg">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t('skipBlocked')}
              </p>
            ) : (
              <Button
                className="mt-4"
                disabled={paused}
                onClick={() => {
                  skipNextVisit(subscription.id, now);
                  toast.success(t('skipped'));
                }}
              >
                <SkipForward className="size-4" aria-hidden />
                {t('skipAction')}
              </Button>
            )}
          </div>

          {/*
            Changing plan, which this screen never offered at all. /open-questions
            §21.7 settled the rule long ago — upgrade now, downgrade at the next
            term — and the customer had no way to ask for either, so the answer
            only existed on paper.
          */}
          {upgrades.length > 0 && (
            <div className="mt-7 border-t border-line-subtle pt-6">
              <h3 className="font-medium">{t('upgradeTitle')}</h3>
              <p className="mt-1.5 max-w-[var(--measure)] text-sm text-ink-secondary">
                {t('upgradeBody')}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {upgrades.map((option) => (
                  <Button key={option.id} asChild variant="secondary">
                    <Link href={`/kontakt?abo=${option.id}`}>
                      {t('upgradeTo', { name: option.name[locale] })}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 border-t border-line-subtle pt-6">
            <h3 className="font-medium">{t('cancelTitle')}</h3>
            {block === null ? (
              <>
                <p className="mt-1.5 max-w-[var(--measure)] text-sm text-ink-secondary">
                  {t('cancelBody', {
                    date: format.dateTime(cancelDeadline(subscription, settings), 'short'),
                  })}
                </p>
                <Button
                  variant="quiet"
                  className="mt-4"
                  onClick={() => {
                    const refused = cancelSubscription(subscription.id, now);
                    if (refused) toast.error(t(`cancelBlocked.${refused}`));
                    else toast.success(t('cancelDone'));
                  }}
                >
                  {t('cancelAction')}
                </Button>
              </>
            ) : (
              /* The rule, stated, rather than a button that is not there.
                 "Why can I not cancel?" is the whole question at this point,
                 and silence reads as the option having been taken away. */
              <p className="mt-1.5 max-w-[var(--measure)] text-sm text-ink-secondary">
                {t(`cancelBlocked.${block}`)}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line-subtle py-2.5 text-sm">
      <dt className="text-ink-secondary">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
