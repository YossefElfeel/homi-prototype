'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Plus, RefreshCw } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { addDays, bookingsOnDay, startOfDay } from '@/mock/engines/availability';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Subscription } from '@/mock/schema';

const FREQUENCY: Record<string, string> = {
  basic: 'Alle zwei Wochen',
  premium: 'Wöchentlich',
  vip: 'Zweimal wöchentlich',
};

/** Screen 69 — plans, their payment state and the next visit. */
export default function SubscriptionsPage() {
  const t = useTranslations('admin.subscriptions');
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const subscriptions = useStore((s) => s.data.subscriptions);
  const customers = useStore((s) => s.data.customers);
  const bookings = useStore((s) => s.data.bookings);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

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
      cell: (s) => <span className="text-ink-secondary">{FREQUENCY[s.plan]}</span>,
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
          <Button size="sm">
            <Plus className="size-3.5" aria-hidden />
            {t('addAction')}
          </Button>
          <p className="mt-1.5 max-w-56 text-xs text-ink-tertiary">{t('addHint')}</p>
        </div>
      </div>

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
