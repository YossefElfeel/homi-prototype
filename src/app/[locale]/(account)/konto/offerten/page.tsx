'use client';

import { useLocale, useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { StatusBadge } from '@/components/ui/status-badge';
import { isExpired, offerTotal } from '@/mock/engines/offers';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Offer } from '@/mock/schema';

/**
 * Screen 38 — quotes.
 *
 * The expiry warning appears at seven days rather than on the last day. §9.3
 * gives a quote a fixed life, and a customer who finds out it lapsed on the
 * morning it lapsed has been told too late to act.
 */
export default function AccountOffersPage() {
  const t = useTranslations('account.offers');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const { offers, requests } = useAccount();
  const services = useStore((s) => s.services);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const daysLeft = (iso?: string) =>
    iso ? Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000) : null;

  const columns: Column<Offer>[] = [
    {
      key: 'reference',
      header: t('colReference'),
      primary: true,
      cell: (o) => <span data-numeric>{o.reference}</span>,
    },
    {
      key: 'service',
      header: t('colService'),
      tableOnly: true,
      cell: (o) => {
        const request = requests.find((r) => r.id === o.requestId);
        return services.find((s) => s.slug === request?.serviceSlug)?.name[locale] ?? '—';
      },
    },
    {
      key: 'total',
      header: t('colTotal'),
      align: 'end',
      cell: (o) => <Money amount={offerTotal(o)} />,
    },
    {
      key: 'valid',
      header: t('colValid'),
      align: 'end',
      cell: (o) => {
        const left = daysLeft(o.expiresAt);
        return (
          <span className="flex flex-col items-end gap-1">
            <span data-numeric className="text-sm text-ink-tertiary">
              {o.expiresAt ? format.dateTime(new Date(o.expiresAt), 'short') : '—'}
            </span>
            {o.status === 'sent' && left !== null && left <= 7 && left >= 0 && (
              <span className="rounded-sm border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-[0.6875rem] text-status-warning-fg">
                {t('expiresSoon', { days: left })}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      cell: (o) => (
        // Offer states are a subset of the request vocabulary, so they read
        // from the same registry entry rather than a parallel one that could
        // drift. An expired quote is shown as expired even while stored as
        // sent — §9.3 makes the date, not a job, the thing that ends it.
        <StatusBadge
          entity="request"
          state={isExpired(o, now) && o.status === 'sent' ? 'expired' : o.status}
          size="sm"
        />
      ),
    },
  ];

  return (
    <>
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <DataView
        className="mt-8"
        items={offers.filter((o) => o.status !== 'draft')}
        columns={columns}
        getKey={(o) => o.id}
        onSelect={(o) => router.push(`/offerte/${o.id}`)}
        caption={t('title')}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </>
  );
}
