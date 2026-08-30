'use client';

import { useLocale, useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { DataView, type Column } from '@/components/ui/data-view';
import { RowAction, RowActions } from '@/components/ui/row-actions';
import { ActionIcon } from '@/lib/action-icons';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Money } from '@/components/ui/money';
import { StatusBadge } from '@/components/ui/status-badge';
import { offerBadgeState } from '@/lib/offer-label';
import { offerTotal } from '@/mock/engines/offers';
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

  if (!hydrated) return <SkeletonPage label={t('title')} />;

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
      // Offer states are a subset of the request vocabulary — all but one.
      // A quote that has gone out is `sent`, and the request registry calls
      // that `offerSent`, so this printed the literal «status.request.sent»
      // in the pill on every open quote. The two other screens that badge a
      // quote had each fixed it inline; the rule lives in `offer-label` now.
      cell: (o) => (
        <StatusBadge entity="request" state={offerBadgeState(o, now)} size="sm" />
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t('title')} />
      <DataView
        items={offers.filter((o) => o.status !== 'draft')}
        columns={columns}
        getKey={(o) => o.id}
        onSelect={(o) => router.push(`/offerte/${o.id}`)}
        caption={t('title')}
        /* The quote and the request it answers are the two records a customer
           compares when a price surprises them, and until now getting from one
           to the other meant leaving for the menu and coming back. */
        rowActions={(o) => (
          <RowActions>
            <RowAction href={`/offerte/${o.id}`} label={t('rowOpen')}>
              <ActionIcon.open aria-hidden />
            </RowAction>
            <RowAction
              href={`/konto/anfragen/${o.requestId}`}
              label={t('rowRequest')}
            >
              <ActionIcon.request aria-hidden />
            </RowAction>
          </RowActions>
        )}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </>
  );
}
