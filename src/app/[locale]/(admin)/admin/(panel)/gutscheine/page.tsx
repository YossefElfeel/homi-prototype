'use client';

import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { Info, Plus } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Coupon } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * Screen 76 — coupons.
 *
 * Empty in the default scenario on purpose, and the empty state says why:
 * in this market discount messaging reads cheap rather than attractive. The
 * mechanism exists because §9.4 asks for it; the recommendation not to lean on
 * it belongs next to the button, not in a slide deck nobody opens.
 */
export default function AdminCouponsPage() {
  const t = useTranslations('admin.coupons');
  const format = useFormatter();
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const coupons = useStore((s) => s.data.coupons);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const state = (c: Coupon) => {
    if (!c.active) return 'inactive' as const;
    if (new Date(c.validTo) < now) return 'expired' as const;
    if (c.maxUses !== undefined && c.usedCount >= c.maxUses) return 'used-up' as const;
    return 'active' as const;
  };

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: t('colCode'),
      primary: true,
      cell: (c) => <span className="font-mono tracking-wide">{c.code}</span>,
    },
    {
      key: 'value',
      header: t('colValue'),
      align: 'end',
      cell: (c) =>
        c.kind === 'percent' ? (
          <span data-numeric>{c.value}%</span>
        ) : (
          <Money amount={c.value} />
        ),
    },
    {
      key: 'validity',
      header: t('colValidity'),
      tableOnly: true,
      cell: (c) => (
        <span data-numeric className="text-sm text-ink-secondary">
          {format.dateTime(new Date(c.validFrom), { day: '2-digit', month: '2-digit' })} –{' '}
          {format.dateTime(new Date(c.validTo), {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'usage',
      header: t('colUsage'),
      align: 'end',
      cell: (c) => (
        <span data-numeric className="text-ink-secondary">
          {c.usedCount}
          {c.maxUses !== undefined ? ` / ${c.maxUses}` : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      cell: (c) => {
        const s = state(c);
        return (
          <span
            className={cn(
              'rounded-sm border px-1.5 py-0.5 text-xs',
              s === 'active'
                ? 'border-status-success-line bg-status-success text-status-success-fg'
                : 'border-status-neutral-line bg-status-neutral text-status-neutral-fg',
            )}
          >
            {t(`state.${s}` as 'state.active')}
          </span>
        );
      },
    },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <Button asChild>
          <Link href="/admin/gutscheine/neu">
            <Plus className="size-4" aria-hidden />
            {t('newAction')}
          </Link>
        </Button>
      </div>

      <p className="mt-6 flex max-w-[var(--measure)] items-start gap-2 text-sm text-ink-secondary">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('stackingNote')}
      </p>

      <DataView
        className="mt-8"
        items={coupons}
        columns={columns}
        getKey={(c) => c.id}
        onSelect={(c) => router.push(`/admin/gutscheine/${c.id}`)}
        caption={t('title')}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
