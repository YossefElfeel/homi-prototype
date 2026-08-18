'use client';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, Pause, SkipForward } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';

/**
 * Screen 43 — the plan.
 *
 * Skipping is the button the customer came for, so it is the primary action
 * and the free allowance is stated next to it. §11.2 gives a fixed number of
 * free changes a month; hiding the count until it is used up turns a fair rule
 * into a surprise charge.
 *
 * Cancellation is present, plainly, with the notice period spelled out. The
 * one-year commitment was reaffirmed by the client, and a plan that hides its
 * exit is exactly what makes people refuse to sign one.
 */
export default function AccountSubscriptionPage() {
  const t = useTranslations('account.subscription');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const now = useNow();

  const { subscriptions } = useAccount();
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const resumeSubscription = useStore((s) => s.resumeSubscription);
  const skipNextVisit = useStore((s) => s.skipNextVisit);
  const requestCancellation = useStore((s) => s.requestCancellation);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const subscription = subscriptions.find((s) => s.status !== 'cancelled');

  if (!subscription) {
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

  const skipsLeft = settings.monthlyFreeSkips - subscription.skipsUsedThisMonth;
  const paused = subscription.status === 'paused';

  const facts: [string, React.ReactNode][] = [
    [t('plan'), subscription.plan.toUpperCase()],
    [t('rhythm'), services.find((s) => s.slug === subscription.serviceSlug)?.name[locale] ?? '—'],
    [
      t('discount'),
      <span key="d" data-numeric>
        {settings.planDiscounts[subscription.plan]}%
      </span>,
    ],
    [
      t('commitment'),
      <span key="c" data-numeric>
        {format.dateTime(new Date(subscription.commitmentEndsAt), 'short')}
      </span>,
    ],
    [
      t('nextCharge'),
      <span key="n" data-numeric>
        {subscription.nextChargeAt
          ? format.dateTime(new Date(subscription.nextChargeAt), 'short')
          : '—'}
      </span>,
    ],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <StatusBadge entity="subscription" state={subscription.status} />
      </div>

      {paused && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-l-2 border-rule bg-sunken p-5">
          <div className="flex gap-3">
            <Pause className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
            <div>
              <h2 className="font-medium">{t('pausedTitle')}</h2>
              <p className="mt-1 text-sm text-ink-secondary">{t('pausedBody')}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              resumeSubscription(subscription.id);
              toast.success(t('resumed'));
            }}
          >
            {t('resume')}
          </Button>
        </div>
      )}

      <dl className="mt-8 grid gap-x-8 sm:grid-cols-2">
        {facts.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-4 border-b border-line-subtle py-2.5 text-sm"
          >
            <dt className="text-ink-secondary">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <section className="surface-card mt-10 p-6">
        <h2 className="display-type text-xl">{t('skipTitle')}</h2>
        <p className="mt-2 text-sm text-ink-secondary">
          {t('skipBody', {
            used: subscription.skipsUsedThisMonth,
            free: settings.monthlyFreeSkips,
          })}
        </p>
        {skipsLeft <= 0 ? (
          <p className="mt-4 flex gap-2 border-l-2 border-status-warning-line bg-status-warning p-4 text-sm text-status-warning-fg">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('skipBlocked')}
          </p>
        ) : (
          <Button
            className="mt-5"
            /*
             * The `skipped` local flag used to disable this after one use
             * regardless of how many free skips were left, so a plan with two
             * a month behaved as though it had one. The remaining count is the
             * only thing that should gate it — and it already does, above.
             */
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
      </section>

      <section className="mt-10 border-t border-line-subtle pt-8">
        <h2 className="display-type text-xl">{t('cancelTitle')}</h2>
        {subscription.cancellationRequestedAt ? (
          <p className="mt-2 text-sm text-ink-secondary">
            {t('cancelPending', {
              date: format.dateTime(
                new Date(subscription.cancellationRequestedAt),
                'full',
              ),
            })}
          </p>
        ) : (
          <>
            <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
              {t('cancelBody', { months: settings.subscriptionNoticeMonths })}
            </p>
            <Button
              variant="quiet"
              className="mt-4"
              onClick={() => {
                requestCancellation(subscription.id, now);
                toast.success(t('cancelRequested'));
              }}
            >
              {t('cancelAction')}
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
