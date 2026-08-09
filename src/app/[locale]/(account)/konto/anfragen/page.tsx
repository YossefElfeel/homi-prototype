'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useStore } from '@/mock/store';
import type { ServiceRequest } from '@/mock/schema';

/** Screen 36 — the customer's own requests, newest first. */
export default function AccountRequestsPage() {
  const t = useTranslations('account.requests');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const { requests, properties } = useAccount();
  const services = useStore((s) => s.services);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const columns: Column<ServiceRequest>[] = [
    {
      key: 'reference',
      header: t('colReference'),
      primary: true,
      cell: (r) => <span data-numeric>{r.reference}</span>,
    },
    {
      key: 'service',
      header: t('colService'),
      cell: (r) => services.find((s) => s.slug === r.serviceSlug)?.name[locale] ?? '—',
    },
    {
      key: 'property',
      header: t('colProperty'),
      tableOnly: true,
      cell: (r) => (
        <span className="text-ink-secondary">
          {properties.find((p) => p.id === r.propertyId)?.street ?? '—'}
        </span>
      ),
    },
    {
      key: 'created',
      header: t('colCreated'),
      align: 'end',
      cell: (r) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {format.dateTime(new Date(r.createdAt), 'short')}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      cell: (r) => <StatusBadge entity="request" state={r.status} size="sm" />,
    },
  ];

  return (
    <>
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <DataView
        className="mt-8"
        items={[...requests].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))}
        columns={columns}
        getKey={(r) => r.id}
        onSelect={(r) => router.push(`/konto/anfragen/${r.id}`)}
        caption={t('title')}
        empty={
          <EmptyState
            title={t('emptyTitle')}
            body={t('emptyBody')}
            action={
              <Button asChild>
                <Link href="/anfrage">
                  {t('emptyAction')}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            }
          />
        }
      />
    </>
  );
}
