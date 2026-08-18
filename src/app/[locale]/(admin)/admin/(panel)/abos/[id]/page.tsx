'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { AlertTriangle, ArrowLeft, Lock, Pause, Play, SkipForward } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { CustomerLink } from '@/components/ui/record-link';
import { Field, Select, Textarea } from '@/components/ui/field';
import { ConfirmPanel } from '@/components/ui/confirm-panel';
import type { PlanTier } from '@/mock/schema';
import { PLAN_RHYTHM } from '@/lib/offer-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';

/**
 * Screen 70 — one plan.
 *
 * Two rules from the specification are visible rather than silent: the monthly
 * free skip is shown as a remaining count (§11.2), and a cancellation inside
 * the minimum term is routed to the owner to decide rather than processed
 * automatically (§20.4).
 */
export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.subscription');
  /* The second copy of the hardcoded German `FREQUENCY` map lived here. */
  const rhythmT = useTranslations('admin.rhythm');
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const subscriptions = useStore((s) => s.data.subscriptions);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const bookings = useStore((s) => s.data.bookings);
  const settings = useStore((s) => s.settings);
  const data = useStore((s) => s.data);
  const patchData = useStore((s) => s.patchData);

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const sub = subscriptions.find((s) => s.id === id);
  if (!sub) return <p className="text-ink-tertiary">—</p>;

  const customer = customers.find((c) => c.id === sub.customerId)!;
  const property = properties.find((p) => p.id === sub.propertyId);
  const visits = bookings
    .filter((b) => b.subscriptionId === sub.id)
    .sort((a, b) => a.start.localeCompare(b.start));
  const upcoming = visits.filter((v) => new Date(v.start) >= now);
  const past = visits.filter((v) => new Date(v.start) < now);
  const skipsLeft = Math.max(0, settings.monthlyFreeSkips - sub.skipsUsedThisMonth);

  /**
   * There is no per-entity store action for subscriptions — `patchData` is the
   * escape hatch the customer side already uses (konto/abo). Everything on this
   * screen writes through here so the list, the badge and the banners all read
   * the same record.
   */
  function patchSub(patch: Partial<typeof sub>) {
    patchData({
      subscriptions: data.subscriptions.map((s) =>
        s.id === sub!.id ? { ...s, ...patch } : s,
      ),
    });
  }

  const setNotes = (notes: string) => patchSub({ internalNotes: notes });

  const paused = sub.status === 'paused';
  /** A cancellation already filed, or a dead plan, closes every other action. */
  const settled = sub.status === 'cancellationPending' || sub.status === 'cancelled';

  return (
    <div className="max-w-5xl">
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/abos">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="display-type text-3xl">
          <CustomerLink
            id={customer.id}
            name={`${customer.firstName} ${customer.lastName}`}
          />
        </h1>
        <StatusBadge entity="subscription" state={sub.status} />
      </div>
      <p className="mt-2 text-ink-secondary">
        <span className="capitalize">{sub.plan}</span> · {rhythmT(PLAN_RHYTHM[sub.plan])} ·{' '}
        <Link
          href={`/admin/kunden/${customer.id}`}
          className="underline decoration-from-font underline-offset-4"
        >
          {t('viewCustomer')}
        </Link>
      </p>

      {sub.status === 'pastDue' && (
        <div className="mt-6 flex gap-3 rounded-[var(--radius-md)] border border-status-danger-line bg-status-danger p-5 text-status-danger-fg">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <h2 className="font-medium">{t('pastDueTitle')}</h2>
            <p className="mt-1.5 text-sm">{t('pastDueBody', { days: 7 })}</p>
          </div>
        </div>
      )}

      {sub.status === 'cancellationPending' && (
        <div className="mt-6 flex gap-3 border-l-2 border-rule bg-sunken p-5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
          <div>
            <h2 className="font-medium">{t('cancelRequestTitle')}</h2>
            <p className="mt-1.5 text-sm text-ink-secondary">
              {t('cancelRequestBody', {
                date: format.dateTime(new Date(sub.commitmentEndsAt), 'full'),
              })}
            </p>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          <dl className="grid gap-px border border-line-subtle bg-line-subtle sm:grid-cols-2">
            <div className="bg-page p-5">
              <dt className="label-type text-ink-tertiary">{t('startedAt')}</dt>
              <dd data-numeric className="mt-2">
                {format.dateTime(new Date(sub.startDate), 'full')}
              </dd>
            </div>
            <div className="bg-page p-5">
              <dt className="label-type text-ink-tertiary">{t('commitmentUntil')}</dt>
              <dd data-numeric className="mt-2">
                {format.dateTime(new Date(sub.commitmentEndsAt), 'full')}
              </dd>
            </div>
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
                  {property.street}, <span data-numeric>{property.postcode}</span>{' '}
                  {property.city}
                </span>
              </Link>
            </section>
          )}

          <section>
            <h2 className="display-type text-xl">{t('visitsTitle')}</h2>
            {visits.length === 0 ? (
              <p className="mt-3 text-sm text-ink-tertiary">{t('visitsEmpty')}</p>
            ) : (
              <>
                <h3 className="label-type mt-4 text-ink-tertiary">{t('upcoming')}</h3>
                <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
                  {upcoming.map((visit) => (
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
                {past.length > 0 && (
                  <>
                    <h3 className="label-type mt-6 text-ink-tertiary">{t('past')}</h3>
                    <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
                      {past.map((visit) => (
                        <li key={visit.id} className="flex items-center justify-between gap-4 py-3">
                          <span data-numeric className="text-ink-secondary">
                            {format.dateTime(new Date(visit.start), 'short')}
                          </span>
                          <StatusBadge entity="booking" state={visit.status} size="sm" />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <div className="surface-card p-5">
            <h2 className="label-type text-ink-tertiary">{t('paymentTitle')}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-tertiary">{t('lastCharge')}</dt>
                <dd data-numeric>
                  {sub.lastChargedAt
                    ? format.dateTime(new Date(sub.lastChargedAt), 'short')
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-tertiary">{t('nextCharge')}</dt>
                <dd data-numeric>
                  {sub.nextChargeAt
                    ? format.dateTime(new Date(sub.nextChargeAt), 'short')
                    : '—'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="surface-card p-5">
            <h2 className="label-type text-ink-tertiary">{t('skipTitle')}</h2>
            <p data-numeric className="mt-2 text-sm text-ink-secondary">
              {skipsLeft > 0 ? t('skipRemaining', { n: skipsLeft }) : t('skipNone')}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              disabled={skipsLeft === 0 || paused || settled}
              onClick={() => {
                patchSub({ skipsUsedThisMonth: sub.skipsUsedThisMonth + 1 });
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
              {changingPlan ? (
                <div className="surface-card space-y-3 p-4">
                  <Field label={t('changePlanLabel')}>
                    {(props) => (
                      <Select
                        {...props}
                        defaultValue={sub.plan}
                        onChange={(e) => {
                          patchSub({ plan: e.target.value as PlanTier });
                          setChangingPlan(false);
                          toast.success(t('planChanged'));
                        }}
                      >
                        {(['basic', 'premium', 'vip'] as PlanTier[]).map((tier) => (
                          <option key={tier} value={tier}>
                            {t(`plans.${tier}`)}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Button variant="ghost" size="sm" onClick={() => setChangingPlan(false)}>
                    {t('dismiss')}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  block
                  disabled={settled}
                  onClick={() => setChangingPlan(true)}
                >
                  {t('changePlan')}
                </Button>
              )}

              <Button
                variant="secondary"
                block
                disabled={settled}
                onClick={() => {
                  patchSub({ status: paused ? 'active' : 'paused' });
                  toast.success(paused ? t('resumeDone') : t('pauseDone'));
                }}
              >
                {paused ? (
                  <Play className="size-4" aria-hidden />
                ) : (
                  <Pause className="size-4" aria-hidden />
                )}
                {paused ? t('resume') : t('pause')}
              </Button>

              {confirmingCancel ? (
                <ConfirmPanel
                  title={t('cancelConfirmTitle')}
                  body={t('cancelConfirmBody', {
                    date: format.dateTime(new Date(sub.commitmentEndsAt), 'full'),
                  })}
                  action={t('cancelConfirmAction')}
                  dismiss={t('dismiss')}
                  onConfirm={() => {
                    patchSub({
                      status: 'cancellationPending',
                      cancellationRequestedAt: now.toISOString(),
                    });
                    setConfirmingCancel(false);
                    toast.success(t('cancelDone'));
                  }}
                  onDismiss={() => setConfirmingCancel(false)}
                />
              ) : (
                <Button
                  variant="danger"
                  block
                  disabled={settled}
                  onClick={() => setConfirmingCancel(true)}
                >
                  {t('cancel')}
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-dashed border-line bg-sunken p-5">
            <h2 className="flex items-center gap-2 font-medium">
              <Lock className="size-4 text-ink-tertiary" aria-hidden />
              {t('notesTitle')}
            </h2>
            <Textarea
              className="mt-3 min-h-20 bg-page"
              value={sub.internalNotes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
