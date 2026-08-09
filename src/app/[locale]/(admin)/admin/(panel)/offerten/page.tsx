'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { DataView, type Column } from '@/components/ui/data-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { daysLeft, isExpired, offerTotal } from '@/mock/engines/offers';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Offer } from '@/mock/schema';
import { cn } from '@/lib/cn';

/** Screen 57 — quote states, versions and expiry dates in one list (§17.2). */
export default function OffersPage() {
  const t = useTranslations('admin.offers');
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const offers = useStore((s) => s.data.offers);
  const requests = useStore((s) => s.data.requests);
  const customers = useStore((s) => s.data.customers);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const visible = offers
    .filter((o) => o.status !== 'draft')
    .sort((a, b) => (b.issuedAt ?? '').localeCompare(a.issuedAt ?? ''));

  const nameOf = (offer: Offer) => {
    const request = requests.find((r) => r.id === offer.requestId);
    const customer = customers.find((c) => c.id === request?.customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : '—';
  };

  const columns: Column<Offer>[] = [
    { key: 'customer', header: t('colCustomer'), primary: true, cell: nameOf },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (o) => (
        <StatusBadge
          entity="request"
          state={
            isExpired(o, now) && o.status === 'sent'
              ? 'expired'
              : o.status === 'sent'
                ? 'offerSent'
                : o.status === 'accepted'
                  ? 'accepted'
                  : o.status === 'revisionRequested'
                    ? 'revisionRequested'
                    : o.status === 'rejected'
                      ? 'rejected'
                      : 'expired'
          }
          size="sm"
        />
      ),
    },
    {
      key: 'reference',
      header: t('colReference'),
      cell: (o) => (
        <span data-numeric className="text-ink-secondary">
          {o.reference}
          {o.version > 1 && (
            <span className="ml-2 rounded-sm bg-sunken px-1.5 py-0.5 text-xs">
              {t('version', { n: o.version })}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'total',
      header: t('colTotal'),
      align: 'end',
      cell: (o) => <Money amount={offerTotal(o)} />,
    },
    {
      key: 'issued',
      header: t('colIssued'),
      cell: (o) => (
        <span data-numeric className="text-ink-secondary">
          {o.issuedAt ? format.dateTime(new Date(o.issuedAt), 'short') : '—'}
        </span>
      ),
    },
    {
      key: 'expires',
      header: t('colExpires'),
      align: 'end',
      cell: (o) => {
        const left = daysLeft(o, now);
        const gone = left !== null && left <= 0;
        return (
          <span
            data-numeric
            className={cn('text-sm', gone ? 'text-status-danger-fg' : 'text-ink-tertiary')}
          >
            {left === null ? '—' : gone ? t('expired') : t('expiresIn', { days: left })}
          </span>
        );
      },
    },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <DataView
        className="mt-8"
        items={visible}
        columns={columns}
        getKey={(o) => o.id}
        onSelect={(o) => router.push(`/offerte/${o.id}`)}
        caption={t('title')}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
