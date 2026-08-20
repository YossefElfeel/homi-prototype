'use client';

import { use, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { Check, Search, Users } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { ActionIcon } from '@/lib/action-icons';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { RowAction, RowActionButton, RowActions } from '@/components/ui/row-actions';
import { StatusBadge } from '@/components/ui/status-badge';
import { SwitchField } from '@/components/ui/switch';
import { Toolbar } from '@/components/ui/toolbar';
import { planRhythm } from '@/lib/offer-facts';
import { subscribersOf, subscriptionState, visitsLeft } from '@/lib/plan-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Subscription } from '@/mock/schema';

/**
 * Screen 70 — one plan, and who is on it.
 *
 * The brief asks for the subscriber list to live here, with each customer's
 * used and remaining visits and a way to cancel one. It could not exist before:
 * a plan was a string literal, so there was nothing for a subscriber to belong
 * *to*, and visits were not counted at all — the plan simply covered whatever
 * it touched for a year.
 */
export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.plan');
  const rhythmT = useTranslations('admin.rhythm');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const now = useNow();
  const hydrated = useHydrated();

  const plan = useStore((s) => s.plans.find((p) => p.id === id));
  const subscriptions = useStore((s) => s.data.subscriptions);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const setPlanActive = useStore((s) => s.setPlanActive);
  const setPlanVisible = useStore((s) => s.setPlanVisible);
  const cancelSubscription = useStore((s) => s.cancelSubscription);

  const [query, setQuery] = useState('');

  const subscribers = useMemo(
    () => (plan ? subscribersOf(plan.id, subscriptions) : []),
    [plan, subscriptions],
  );

  const nameOf = (s: Subscription) => {
    const c = customers.find((x) => x.id === s.customerId);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) => {
      const property = properties.find((p) => p.id === s.propertyId);
      return [nameOf(s), s.reference, property?.label ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribers, query, properties, customers]);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;
  if (!plan) {
    return (
      <div>
        <PageHeader title={t('missingTitle')} back={{ href: '/admin/abos', label: t('back') }} />
        <EmptyState title={t('missingTitle')} body={t('missingBody')} />
      </div>
    );
  }

  const serviceName =
    services.find((s) => s.slug === plan.serviceSlug)?.name[locale] ?? plan.serviceSlug;

  function cancel(subscription: Subscription) {
    const block = cancelSubscription(subscription.id, now);
    /* The store decides, and it says which rule refused. A button that just
       fails is a button somebody presses three times before phoning. */
    if (block) {
      toast.error(t(`cancelBlocked.${block}`));
      return;
    }
    toast.success(t('cancelDone', { name: nameOf(subscription) }));
  }

  const columns: Column<Subscription>[] = [
    {
      key: 'customer',
      header: t('colCustomer'),
      primary: true,
      cell: (s) => (
        <Link
          href={`/admin/abos/${plan.id}/${s.id}`}
          className="rounded-[var(--radius-xs)] font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
        >
          {nameOf(s)}
          <span data-numeric className="ms-2 text-sm font-normal text-ink-tertiary">
            {s.reference}
          </span>
        </Link>
      ),
    },
    {
      /*
       * The property, on every row.
       *
       * A customer can hold a plan on their flat and another on their office,
       * and the two are told apart by nothing else — same name, same plan, same
       * dates. Without this column the office cannot answer "which address is
       * this one for?" from the list at all.
       */
      key: 'property',
      header: t('colProperty'),
      cell: (s) => {
        const property = properties.find((p) => p.id === s.propertyId);
        return property ? (
          <Link
            href={`/admin/objekte/${property.id}`}
            className="text-ink-secondary hover:underline"
          >
            {property.label}
            <span data-numeric className="block text-sm text-ink-tertiary">
              {property.postcode} {property.city}
            </span>
          </Link>
        ) : (
          <span className="text-ink-tertiary">—</span>
        );
      },
    },
    {
      key: 'visits',
      header: t('colVisits'),
      sortBy: (s) => s.visitsUsed,
      cell: (s) => (
        <span className="block min-w-32">
          <span data-numeric className="text-sm text-ink-secondary">
            {t('visitsOf', { used: s.visitsUsed, total: plan.includedVisits })}
          </span>
          <Progress
            className="mt-1.5"
            value={s.visitsUsed}
            max={plan.includedVisits}
            label={t('visitsOf', { used: s.visitsUsed, total: plan.includedVisits })}
          />
          <span data-numeric className="mt-1 block text-sm text-ink-tertiary">
            {t('visitsLeft', { n: visitsLeft(s, plan) })}
          </span>
        </span>
      ),
    },
    {
      key: 'term',
      header: t('colTerm'),
      align: 'end',
      sortBy: (s) => s.endDate,
      cell: (s) => (
        <span data-numeric className="text-sm text-ink-secondary">
          {format.dateTime(new Date(s.startDate), 'short')} –{' '}
          {format.dateTime(new Date(s.endDate), 'short')}
          {s.renewalCount > 0 && (
            <span className="block text-ink-tertiary">
              {t('renewedTimes', { n: s.renewalCount })}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (s) => (
        <StatusBadge entity="subscription" state={subscriptionState(s, now)} size="sm" />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={plan.name[locale]}
        lead={plan.description[locale] || undefined}
        back={{ href: '/admin/abos', label: t('back') }}
        meta={
          <>
            <span data-numeric className="text-ink-tertiary">
              {plan.reference}
            </span>
            <Chip tone={plan.active ? 'success' : 'neutral'}>
              {t(plan.active ? 'active' : 'retired')}
            </Chip>
            {plan.active && !plan.visibleOnSite && <Chip tone="warning">{t('hidden')}</Chip>}
          </>
        }
        actions={
          <Button asChild variant="secondary">
            <Link href={`/admin/abos/${plan.id}/bearbeiten`}>
              <ActionIcon.edit className="size-4" aria-hidden />
              {t('edit')}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-app lg:grid-cols-12">
        <div className="space-y-app lg:col-span-8">
          <dl className="grid gap-px border border-line-subtle bg-line-subtle sm:grid-cols-2">
            <Fact label={t('price')}>
              <Money amount={plan.price} />
              <span className="mt-0.5 block text-sm text-ink-tertiary">
                {t('perTerm', { months: plan.validityMonths })}
              </span>
            </Fact>
            <Fact label={t('perVisit')}>
              <Money amount={plan.price / Math.max(1, plan.includedVisits)} per="visit" />
            </Fact>
            <Fact label={t('includedVisits')}>
              <span data-numeric>{plan.includedVisits}</span>
              <span className="mt-0.5 block text-sm text-ink-tertiary">
                {rhythmT(planRhythm(plan))}
              </span>
            </Fact>
            <Fact label={t('service')}>
              <Link href={`/admin/leistungen/${plan.serviceSlug}`} className="hover:underline">
                {serviceName}
              </Link>
              {/* The brief asks for the service id to be visible where one
                  applies. It is what a plan is drawn against, so it belongs
                  next to the name rather than behind the link. */}
              <span data-numeric className="mt-0.5 block text-sm text-ink-tertiary">
                {plan.serviceSlug}
              </span>
            </Fact>
            <Fact label={t('extraDiscount')}>
              <span data-numeric>{plan.extraDiscountPercent}%</span>
              <span className="mt-0.5 block text-sm text-ink-tertiary">
                {t('extraDiscountHint')}
              </span>
            </Fact>
            <Fact label={t('cancellationWindow')}>
              <span data-numeric>{t('days', { n: settings.planCancellationDays })}</span>
              <span className="mt-0.5 block text-sm text-ink-tertiary">
                {t('cancellationHint')}
              </span>
            </Fact>
          </dl>

          {plan.features.length > 0 && (
            <section>
              <h2 className="display-type text-xl">{t('featuresTitle')}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-eco" aria-hidden />
                    <span className="text-ink-secondary">{feature[locale] || feature.de}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <div className="surface-card space-y-4 p-5">
            <h2 className="label-type text-ink-tertiary">{t('availabilityTitle')}</h2>
            <SwitchField
              label={t('activeLabel')}
              hint={t('activeHint')}
              checked={plan.active}
              onCheckedChange={(active) => {
                setPlanActive(plan.id, active);
                toast.success(t(active ? 'activatedDone' : 'retiredDone'));
              }}
            />
            <SwitchField
              label={t('visibleLabel')}
              /* Answers the brief's question about who controls whether a plan
                 shows on the site, in the place the answer is acted on. */
              hint={plan.active ? t('visibleHint') : t('visibleBlockedHint')}
              checked={plan.visibleOnSite}
              disabled={!plan.active}
              onCheckedChange={(visible) => {
                setPlanVisible(plan.id, visible);
                toast.success(t(visible ? 'shownDone' : 'hiddenDone'));
              }}
            />
          </div>
        </aside>
      </div>

      <section className="mt-app-section">
        <h2 className="display-type text-2xl">{t('subscribersTitle')}</h2>

        {subscribers.length > 0 && (
          <Toolbar
            className="mt-4"
            search={{
              value: query,
              onChange: setQuery,
              label: t('searchLabel'),
              placeholder: t('searchPlaceholder'),
              clearLabel: t('searchClear'),
            }}
            count={t('count', { shown: filtered.length, total: subscribers.length })}
          />
        )}

        <DataView
          className={subscribers.length > 0 ? undefined : 'mt-4'}
          items={filtered}
          columns={columns}
          getKey={(s) => s.id}
          caption={t('subscribersTitle')}
          defaultSort={{ key: 'term', dir: 'desc' }}
          rowActions={(s) => (
            <RowActions>
              <RowAction href={`/admin/abos/${plan.id}/${s.id}`} label={t('rowView')}>
                <ActionIcon.open aria-hidden />
              </RowAction>
              {/*
                Always offered, never disabled. The interesting cases here are
                the refusals — a plan half used, a window that closed last week
                — and a greyed-out button explains neither. Pressing it says
                which rule stopped it, which is the sentence the office has to
                repeat to the customer anyway.
              */}
              <RowActionButton
                tone="danger"
                label={t('rowCancel')}
                onClick={() => cancel(s)}
              >
                <ActionIcon.decline aria-hidden />
              </RowActionButton>
            </RowActions>
          )}
          empty={
            query.trim() ? (
              <EmptyState
                icon={Search}
                title={t('searchEmptyTitle')}
                body={t('searchEmptyBody', { query })}
              />
            ) : (
              <EmptyState
                icon={Users}
                title={t('subscribersEmptyTitle')}
                body={
                  plan.active ? t('subscribersEmptyBody') : t('subscribersEmptyRetiredBody')
                }
                action={
                  plan.active ? (
                    <Button asChild variant="secondary">
                      <Link href="/admin/anfragen/neu">{t('subscribersEmptyAction')}</Link>
                    </Button>
                  ) : undefined
                }
              />
            )
          }
        />
      </section>
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
