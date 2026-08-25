'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { AlertTriangle, Lock, Pause, Play, RefreshCw, SkipForward } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, useDismissLabel } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { CustomerLink } from '@/components/ui/record-link';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/field';
import { planRhythm } from '@/lib/offer-facts';
import {
  cancelBlock,
  cancelDeadline,
  skipsLeft,
  subscriptionState,
  visitsLeft,
} from '@/lib/plan-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';

/**
 * Screen 70a — one subscriber's plan.
 *
 * Split out of screen 70, which used to be this and nothing else. The plan
 * itself now owns that route; this is the record for one customer on it, and it
 * is where the brief's "subscription and payment history, renewal dates, and
 * how many times it has been renewed" is answered — none of which had anywhere
 * to be read from before, because a subscription carried no history at all.
 */
export default function SubscriberPage({
  params,
}: {
  params: Promise<{ id: string; subId: string }>;
}) {
  const { id, subId } = use(params);
  const t = useTranslations('admin.subscriber');
  const dismissLabel = useDismissLabel();
  const rhythmT = useTranslations('admin.rhythm');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const now = useNow();
  const hydrated = useHydrated();

  const subscription = useStore((s) => s.data.subscriptions.find((x) => x.id === subId));
  const plan = useStore((s) => s.plans.find((p) => p.id === id));
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const bookings = useStore((s) => s.data.bookings);
  const invoices = useStore((s) => s.data.invoices);
  const settings = useStore((s) => s.settings);
  const data = useStore((s) => s.data);
  const patchData = useStore((s) => s.patchData);
  const pauseSubscription = useStore((s) => s.pauseSubscription);
  const resumeSubscription = useStore((s) => s.resumeSubscription);
  const skipNextVisit = useStore((s) => s.skipNextVisit);
  const cancelSubscription = useStore((s) => s.cancelSubscription);
  const renewSubscription = useStore((s) => s.renewSubscription);

  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;
  if (!subscription || !plan) {
    return (
      <div>
        <PageHeader title={t('missingTitle')} back={{ href: '/admin/abos', label: t('backAll') }} />
        <EmptyState title={t('missingTitle')} body={t('missingBody')} />
      </div>
    );
  }

  const customer = customers.find((c) => c.id === subscription.customerId);
  const property = properties.find((p) => p.id === subscription.propertyId);
  const state = subscriptionState(subscription, now);
  const left = visitsLeft(subscription, plan);
  const skips = skipsLeft(subscription, settings, now);
  const block = cancelBlock(subscription, settings, now);

  /* Every invoice raised against this plan, which is what "payment history"
     means for a product paid once a term. A renewal adds one. */
  const planInvoices = invoices
    .filter((i) => i.subscriptionId === subscription.id)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  const visits = bookings
    .filter((b) => b.subscriptionId === subscription.id)
    .sort((a, b) => b.start.localeCompare(a.start));

  const paused = state === 'paused';
  const settled = state === 'cancelled' || state === 'expired';

  const setNotes = (notes: string) =>
    patchData({
      subscriptions: data.subscriptions.map((x) =>
        x.id === subscription.id ? { ...x, internalNotes: notes } : x,
      ),
    });

  return (
    <div>
      <PageHeader
        title={
          customer ? (
            <CustomerLink id={customer.id} name={`${customer.firstName} ${customer.lastName}`} />
          ) : (
            '—'
          )
        }
        back={{ href: `/admin/abos/${plan.id}`, label: t('backToPlan') }}
        meta={
          <>
            <span data-numeric className="text-ink-tertiary">
              {subscription.reference}
            </span>
            <StatusBadge entity="subscription" state={state} />
          </>
        }
        lead={
          <>
            <Link href={`/admin/abos/${plan.id}`} className="hover:underline">
              {plan.name[locale]}
            </Link>{' '}
            · {rhythmT(planRhythm(plan))}
          </>
        }
      />

      {state === 'expired' && (
        <div className="mb-app flex gap-3 border-l-2 border-rule bg-sunken p-5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
          <div>
            <h2 className="font-medium">{t('expiredTitle')}</h2>
            {/* The unused visits are named rather than quietly dropped. They
                are the number the customer will bring up, and a screen that
                does not mention them makes the office look like it hoped
                nobody would notice. */}
            <p className="mt-1.5 text-sm text-ink-secondary">
              {left > 0
                ? t('expiredWithLeft', {
                    n: left,
                    date: format.dateTime(new Date(subscription.endDate), 'full'),
                  })
                : t('expiredSpent', {
                    date: format.dateTime(new Date(subscription.endDate), 'full'),
                  })}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-app lg:grid-cols-12">
        <div className="space-y-app-section lg:col-span-7">
          <dl className="grid gap-px border border-line-subtle bg-line-subtle sm:grid-cols-2">
            <Fact label={t('startedAt')}>
              <span data-numeric>{format.dateTime(new Date(subscription.startDate), 'full')}</span>
            </Fact>
            <Fact label={t('endsAt')}>
              <span data-numeric>{format.dateTime(new Date(subscription.endDate), 'full')}</span>
            </Fact>
            <Fact label={t('renewals')}>
              <span data-numeric>{subscription.renewalCount}</span>
              <span className="mt-0.5 block text-sm text-ink-tertiary">
                {t('renewalsHint')}
              </span>
            </Fact>
            <Fact label={t('paid')}>
              <Money amount={plan.price} />
              <span className="mt-0.5 block text-sm text-ink-tertiary">
                {t('paidHint', { months: plan.validityMonths })}
              </span>
            </Fact>
          </dl>

          {property && (
            <section>
              <h2 className="display-type text-xl">{t('propertyTitle')}</h2>
              <Link
                href={`/admin/objekte/${property.id}`}
                className="surface-card mt-4 block p-4 transition-colors hover:bg-sunken"
              >
                <span className="block font-medium">{property.label}</span>
                <span className="block text-sm text-ink-secondary">
                  {property.street}, <span data-numeric>{property.postcode}</span> {property.city}
                </span>
              </Link>
            </section>
          )}

          <section>
            <h2 className="display-type text-xl">{t('paymentsTitle')}</h2>
            {planInvoices.length === 0 ? (
              <p className="mt-3 text-sm text-ink-tertiary">{t('paymentsEmpty')}</p>
            ) : (
              <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
                {planInvoices.map((invoice) => (
                  <li key={invoice.id}>
                    <Link
                      href={`/admin/rechnungen/${invoice.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-sunken"
                    >
                      <span>
                        <span data-numeric className="font-medium">
                          {invoice.reference}
                        </span>
                        <span data-numeric className="block text-sm text-ink-tertiary">
                          {format.dateTime(new Date(invoice.issuedAt), 'short')}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <Money
                          amount={invoice.lines.reduce(
                            (sum, line) => sum + line.quantity * line.unitPrice,
                            0,
                          )}
                        />
                        <StatusBadge entity="invoice" state={invoice.status} size="sm" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="display-type text-xl">{t('historyTitle')}</h2>
            <ol className="mt-4 space-y-3 border-s border-line-subtle ps-5">
              {[...subscription.history].reverse().map((event, i) => (
                <li key={`${event.at}-${i}`} className="relative">
                  <span
                    className="absolute -start-[1.4rem] top-2 size-1.5 rounded-full bg-line"
                    aria-hidden
                  />
                  <p className="text-sm">{event.label}</p>
                  <p data-numeric className="text-sm text-ink-tertiary">
                    {format.dateTime(new Date(event.at), 'full')}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="display-type text-xl">{t('visitsTitle')}</h2>
            {visits.length === 0 ? (
              <p className="mt-3 text-sm text-ink-tertiary">{t('visitsEmpty')}</p>
            ) : (
              <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
                {visits.map((visit) => (
                  <li key={visit.id}>
                    <Link
                      href={`/admin/buchungen/${visit.id}`}
                      className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-sunken"
                    >
                      <span data-numeric>
                        {format.dateTime(new Date(visit.start), 'full')},{' '}
                        {format.dateTime(new Date(visit.start), 'time')}
                      </span>
                      <StatusBadge entity="booking" state={visit.status} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:col-span-5">
          <div className="surface-card p-5">
            <h2 className="label-type text-ink-tertiary">{t('visitsCounterTitle')}</h2>
            <p data-numeric className="mt-3 text-2xl">
              {t('visitsOf', { used: subscription.visitsUsed, total: plan.includedVisits })}
            </p>
            <Progress
              className="mt-3"
              value={subscription.visitsUsed}
              max={plan.includedVisits}
              label={t('visitsOf', {
                used: subscription.visitsUsed,
                total: plan.includedVisits,
              })}
            />
            <p data-numeric className="mt-2 text-sm text-ink-secondary">
              {t('visitsLeft', { n: left })}
            </p>
          </div>

          <div className="surface-card p-5">
            <h2 className="label-type text-ink-tertiary">{t('skipTitle')}</h2>
            <p data-numeric className="mt-2 text-sm text-ink-secondary">
              {skips > 0 ? t('skipRemaining', { n: skips }) : t('skipNone')}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              disabled={skips === 0 || paused || settled}
              onClick={() => {
                skipNextVisit(subscription.id, now);
                toast.success(t('skipDone'));
              }}
            >
              <SkipForward className="size-3.5" aria-hidden />
              {t('skipAction')}
            </Button>
          </div>

          <div>
            <h2 className="label-type text-ink-tertiary">{t('actionsTitle')}</h2>
            <div className="mt-3 space-y-2">
              {/*
                Renewing is the exit an expired plan actually has. It was
                unreachable before — nothing could add a term — so a plan that
                ran out simply stopped, and the customer had to be re-sold from
                scratch. A retired plan cannot be renewed into, which is what
                `Plan.active` means.
              */}
              {state === 'expired' && (
                <Button
                  block
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
              )}

              <Button
                variant="secondary"
                block
                disabled={settled}
                onClick={() => {
                  if (paused) {
                    resumeSubscription(subscription.id, now);
                    toast.success(t('resumeDone'));
                  } else {
                    pauseSubscription(subscription.id, now);
                    toast.success(t('pauseDone'));
                  }
                }}
              >
                {paused ? (
                  <Play className="size-4" aria-hidden />
                ) : (
                  <Pause className="size-4" aria-hidden />
                )}
                {paused ? t('resume') : t('pause')}
              </Button>

              <Button
                variant="danger"
                block
                disabled={block !== null}
                onClick={() => setConfirmingCancel(true)}
              >
                {t('cancel')}
              </Button>
              {/*
                The reason sits under the button rather than in a tooltip.
                This is the one control on the screen whose availability is a
                rule the customer will ask about, and "you may cancel until the
                3rd" is not something to make anyone hover for.
              */}
              <p className="text-sm text-ink-tertiary">
                {block === null
                  ? t('cancelUntil', {
                      date: format.dateTime(cancelDeadline(subscription, settings), 'short'),
                    })
                  : t(`cancelBlocked.${block}`)}
              </p>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-dashed border-line bg-sunken p-5">
            <h2 className="flex items-center gap-2 font-medium">
              <Lock className="size-4 text-ink-tertiary" aria-hidden />
              {t('notesTitle')}
            </h2>
            <Textarea
              className="mt-3 min-h-20 bg-page"
              value={subscription.internalNotes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </aside>
      </div>

      {/* Cancelling a plan inside its cooling-off period refunds money. That
          used to be asked by a panel that replaced the button in a narrow
          column, taking the «kündbar bis» line with it. */}
      <ConfirmDialog
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title={t('cancelConfirmTitle')}
        body={t('cancelConfirmBody', { amount: plan.price })}
        action={t('cancelConfirmAction')}
        dismiss={dismissLabel}
        onConfirm={() => {
          const refused = cancelSubscription(subscription.id, now);
          setConfirmingCancel(false);
          if (refused) toast.error(t(`cancelBlocked.${refused}`));
          else toast.success(t('cancelDone'));
        }}
      />
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-page p-5">
      <dt className="label-type text-ink-tertiary">{label}</dt>
      <dd className="mt-2">{children}</dd>
    </div>
  );
}
