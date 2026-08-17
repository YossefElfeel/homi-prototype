'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { Plus, RefreshCw } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select } from '@/components/ui/field';
import { addDays, bookingsOnDay, startOfDay } from '@/mock/engines/availability';
import { PLAN_RHYTHM } from '@/lib/offer-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { PlanTier, Subscription } from '@/mock/schema';

/** Screen 69 — plans, their payment state and the next visit. */
export default function SubscriptionsPage() {
  const t = useTranslations('admin.subscriptions');
  /* Was a local `FREQUENCY` map of hardcoded German, and an identical one sat
     in the detail screen. Two places both claiming how often a plan is
     visited disagree eventually — and neither of them translated, on a panel
     that ships in four languages. */
  const rhythmT = useTranslations('admin.rhythm');
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const subscriptions = useStore((s) => s.data.subscriptions);
  const customers = useStore((s) => s.data.customers);
  const bookings = useStore((s) => s.data.bookings);
  const properties = useStore((s) => s.data.properties);
  const services = useStore((s) => s.services);
  const patchData = useStore((s) => s.patchData);
  const locale = useLocale() as Locale;

  const [adding, setAdding] = useState(false);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const eligibleCustomers = customers.filter((c) =>
    properties.some((p) => p.customerId === c.id),
  );

  const nextVisit = (sub: Subscription) => {
    for (let i = 0; i < 30; i += 1) {
      const jobs = bookingsOnDay(addDays(startOfDay(now), i), bookings).filter(
        (b) => b.subscriptionId === sub.id,
      );
      if (jobs[0]) return new Date(jobs[0].start);
    }
    return null;
  };

  const columns: Column<Subscription>[] = [
    {
      key: 'customer',
      header: t('colCustomer'),
      primary: true,
      cell: (s) => {
        const c = customers.find((x) => x.id === s.customerId);
        return c ? `${c.firstName} ${c.lastName}` : '—';
      },
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (s) => <StatusBadge entity="subscription" state={s.status} size="sm" />,
    },
    {
      key: 'plan',
      header: t('colPlan'),
      cell: (s) => <span className="capitalize">{s.plan}</span>,
    },
    {
      key: 'frequency',
      header: t('colFrequency'),
      cell: (s) => <span className="text-ink-secondary">{rhythmT(PLAN_RHYTHM[s.plan])}</span>,
    },
    {
      key: 'next',
      header: t('colNextVisit'),
      cell: (s) => {
        const next = nextVisit(s);
        return (
          <span data-numeric className="text-ink-secondary">
            {next ? format.dateTime(next, 'short') : '—'}
          </span>
        );
      },
    },
    {
      key: 'payment',
      header: t('colPayment'),
      align: 'end',
      cell: (s) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {s.nextChargeAt ? format.dateTime(new Date(s.nextChargeAt), 'short') : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <div className="text-right">
          <Button size="sm" disabled={adding} onClick={() => setAdding(true)}>
            <Plus className="size-3.5" aria-hidden />
            {t('addAction')}
          </Button>
          <p className="mt-1.5 max-w-56 text-xs text-ink-tertiary">{t('addHint')}</p>
        </div>
      </div>

      {adding && (
        <form
          className="surface-card mt-8 p-6 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const customerId = String(form.get('customerId') ?? '');
            const property = properties.find((p) => p.customerId === customerId);
            if (!customerId || !property) return;

            // Length first: `now` only ticks every 30s, so a bare timestamp
            // collides for two plans added in one sitting.
            const id = `sub_${subscriptions.length}_${now.getTime().toString(36).slice(-4)}`;
            const year = new Date(now);
            year.setFullYear(year.getFullYear() + 1);
            const nextCharge = new Date(now);
            nextCharge.setMonth(nextCharge.getMonth() + 1);

            patchData({
              subscriptions: [
                ...subscriptions,
                {
                  id,
                  reference: `AB-${String(subscriptions.length + 1).padStart(4, '0')}`,
                  customerId,
                  propertyId: property.id,
                  plan: String(form.get('plan') ?? 'basic') as PlanTier,
                  serviceSlug: String(form.get('serviceSlug') ?? '') as Subscription['serviceSlug'],
                  startDate: now.toISOString(),
                  commitmentEndsAt: year.toISOString(),
                  status: 'active',
                  skipsUsedThisMonth: 0,
                  nextChargeAt: nextCharge.toISOString(),
                },
              ],
            });
            setAdding(false);
            toast.success(t('addDone'));
            router.push(`/admin/abos/${id}`);
          }}
        >
          <h2 className="display-type text-xl">{t('newTitle')}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <Field label={t('colCustomer')}>
              {(props) => (
                <Select {...props} name="customerId" required defaultValue="">
                  <option value="" disabled>
                    {t('newCustomerPlaceholder')}
                  </option>
                  {/*
                    Only customers who have a property. A plan needs one, and
                    offering a customer who has none would let the form submit
                    into silence — the exact failure this wave exists to remove.
                  */}
                  {eligibleCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('colPlan')}>
              {(props) => (
                <Select {...props} name="plan" defaultValue="basic">
                  {(['basic', 'premium', 'vip'] as PlanTier[]).map((tier) => (
                    <option key={tier} value={tier}>
                      {tier} — {rhythmT(PLAN_RHYTHM[tier])}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('newService')}>
              {(props) => (
                <Select {...props} name="serviceSlug" required defaultValue="">
                  <option value="" disabled>
                    {t('newServicePlaceholder')}
                  </option>
                  {services.map((service) => (
                    <option key={service.slug} value={service.slug}>
                      {service.name[locale]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <p className="mt-4 text-sm text-ink-tertiary">
            {eligibleCustomers.length === 0 ? t('newNoCustomers') : t('newPropertyNote')}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit" disabled={eligibleCustomers.length === 0}>
              {t('newSave')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              {t('dismiss')}
            </Button>
          </div>
        </form>
      )}

      <DataView
        className="mt-8"
        items={subscriptions}
        columns={columns}
        getKey={(s) => s.id}
        onSelect={(s) => router.push(`/admin/abos/${s.id}`)}
        caption={t('title')}
        empty={<EmptyState icon={RefreshCw} title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
