'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowUp, Check, Pause, RefreshCw, SkipForward } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { PlanCatalogue, type PlanView } from '@/components/account/plan-catalogue';
import { SubscribeDialog, type SubscribeIntent } from '@/components/account/subscribe-dialog';
import { planRhythm } from '@/lib/offer-facts';
import {
  cancelBlock,
  cancelDeadline,
  nextPlanVisit,
  planOf,
  skipsLeft,
  subscriptionState,
  upgradesFor,
  visitsLeft,
} from '@/lib/plan-facts';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Plan, Subscription } from '@/mock/schema';

/**
 * Screen 43 — the plans this customer holds, and the ones they could.
 *
 * Plans, plural, was the last change. This one is the other half: the screen
 * knew what the customer had bought and nothing whatever about what was on
 * sale. Every question that follows from holding a plan — what else do you
 * offer, what would the bigger one give me, how does mine compare — was
 * answered only on the marketing site, signed out, and the two controls that
 * pointed that way both left the account. "Change plan" pointed at
 * `/kontakt?abo=<id>`, a contact form that never read the parameter.
 *
 * So the screen is now two halves. Above: the packages held, what each is worth
 * *now*, and the three things a holder does — skip, move up, get out. Below:
 * everything on sale, comparable, and buyable without leaving the page.
 */
export default function AccountSubscriptionPage() {
  const t = useTranslations('account.subscription');
  const hydrated = useHydrated();
  const now = useNow();

  const { subscriptions } = useAccount();
  const plans = useStore((s) => s.plans);

  /* Three pieces of screen state, all of them about the catalogue below, and
     all of them owned here because the cards above write to two of them: the
     "move up" button on a held plan is what filters the rail, and the buy
     button on a rail card is what opens the dialog. */
  const [view, setView] = useState<PlanView>('side');
  const [upgradeFor, setUpgradeFor] = useState<Subscription | null>(null);
  const [intent, setIntent] = useState<SubscribeIntent | null>(null);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  /* Cancelled plans are gone — refunded, nothing to show. Expired ones stay,
     because renewing is done from the card and a plan that vanished the day it
     ran out would take its renew button with it. */
  const held = subscriptions
    .filter((s) => s.status !== 'cancelled')
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  function startUpgrade(subscription: Subscription) {
    setUpgradeFor(subscription);
    /* The rail is below the fold on a card this tall, and a filter applied to
       something the reader cannot see reads as a button that did nothing. */
    document.getElementById('abo-katalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={
          held.length === 0
            ? t('leadNone')
            : held.length > 1
              ? t('leadMany', { n: held.length })
              : t('leadOne')
        }
      />

      {held.length === 0 ? (
        /*
         * The empty state keeps its explanation and loses its exit.
         *
         * It used to end at a link to `/abos` — out of the account, onto the
         * marketing page, into the six-step request wizard, for somebody whose
         * address and card are both already on file. The packages are on this
         * page now, so the empty state says what a plan is and the catalogue
         * directly under it sells one.
         */
        <EmptyState
          className="mb-app-section"
          headingLevel={2}
          title={t('emptyTitle')}
          body={t('emptyBody')}
        />
      ) : (
        <div className="mb-app-section space-y-app-section">
          {held.map((subscription) => (
            <PlanCard
              key={subscription.id}
              subscription={subscription}
              plan={planOf(subscription, plans)}
              now={now}
              onUpgrade={() => startUpgrade(subscription)}
            />
          ))}
        </div>
      )}

      <PlanCatalogue
        upgradeFor={upgradeFor}
        onClearUpgrade={() => setUpgradeFor(null)}
        onPick={setIntent}
        view={view}
        onViewChange={setView}
      />

      <SubscribeDialog
        intent={intent}
        onClose={() => {
          setIntent(null);
          /* The filter clears with the purchase: after an upgrade the plan it
             was filtering for no longer exists on that address, so leaving it
             on would show a rail of upgrades for a package nobody holds. */
          setUpgradeFor(null);
        }}
      />
    </div>
  );
}

function PlanCard({
  subscription,
  plan,
  now,
  onUpgrade,
}: {
  subscription: Subscription;
  plan: Plan | undefined;
  now: Date;
  onUpgrade: () => void;
}) {
  const t = useTranslations('account.subscription');
  const rhythmT = useTranslations('admin.rhythm');
  const format = useFormatter();
  const locale = useLocale() as Locale;

  const properties = useStore((s) => s.data.properties);
  const bookings = useStore((s) => s.data.bookings);
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

  const nextVisit = nextPlanVisit(subscription.id, bookings, now);
  const upgrades = upgradesFor(plan, plans);

  return (
    <Card asChild>
      <section>
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
          <Alert
            tone="info"
            icon={Pause}
            className="mt-5"
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
              {/*
                What skipping *does*, before what it costs.
                The section had only the allowance on it — "1 of 1 free
                reschedules used this month" — which answers a question nobody
                had yet. Nothing said the visit is not deducted, nothing said a
                booking gets cancelled, and nothing said which one. This is also
                the only control in the whole account that calls off a job, so
                a customer who reads it as "move the date" and gets a cancelled
                visit has been misled by the screen rather than by themselves.
              */}
              <p className="mt-1.5 max-w-[var(--measure)] text-sm text-ink-secondary">
                {t('skipExplainer')}
              </p>
              <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
                {t('skipBody', {
                  used: settings.monthlyFreeSkips - skips,
                  free: settings.monthlyFreeSkips,
                })}
              </p>

              {!nextVisit ? (
                /*
                 * Nothing scheduled, so nothing to skip — and no button.
                 *
                 * It used to be offered anyway. With no job in the calendar the
                 * action recorded a skip against the monthly allowance and
                 * cancelled nothing: the customer spent their one free skip of
                 * the month on a visit that did not exist, and the screen
                 * congratulated them for it.
                 */
                <Alert tone="neutral" className="mt-4">
                  {t('skipNothingScheduled')}
                </Alert>
              ) : skips <= 0 ? (
                <Alert tone="warning" className="mt-4">
                  {t('skipBlocked')}
                </Alert>
              ) : (
                <>
                  <p className="mt-4 text-sm">
                    {t('skipTarget', {
                      date: format.dateTime(new Date(nextVisit.start), 'dayMonth'),
                      reference: nextVisit.reference,
                    })}
                  </p>
                  <Button
                    className="mt-3"
                    disabled={paused}
                    onClick={() => {
                      skipNextVisit(subscription.id, now);
                      toast.success(
                        t('skipped', {
                          date: format.dateTime(new Date(nextVisit.start), 'dayMonth'),
                        }),
                      );
                    }}
                  >
                    <SkipForward className="size-4" aria-hidden />
                    {t('skipAction')}
                  </Button>
                </>
              )}
            </div>

            {/*
              Moving up a plan, which this screen offered as a row of links to
              the contact form — one per larger package, none of which carried
              the choice with it. /open-questions §21.7 settled the rule long
              ago, "upgrade now, downgrade at the next term", and the customer
              had no way to do either.

              One button now, not one per plan: the packages themselves are in
              the catalogue below with their prices, their differences and a
              comparison, and a row of buttons naming plans without saying what
              any of them costs was asking for a decision on no information.
            */}
            {upgrades.length > 0 && (
              <div className="mt-7 border-t border-line-subtle pt-6">
                <h3 className="font-medium">{t('upgradeTitle')}</h3>
                <p className="mt-1.5 max-w-[var(--measure)] text-sm text-ink-secondary">
                  {t('upgradeBody', { n: upgrades.length })}
                </p>
                <Button variant="secondary" className="mt-4" onClick={onUpgrade}>
                  <ArrowUp className="size-4" aria-hidden />
                  {t('upgradeAction')}
                </Button>
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
    </Card>
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
