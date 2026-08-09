'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Receipt } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { DataView, type Column } from '@/components/ui/data-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Invoice } from '@/mock/schema';
import { cn } from '@/lib/cn';

const invoiceTotal = (invoice: Invoice) =>
  invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

/** Screen 71 — drafts awaiting approval, sent, and overdue in one list. */
export default function InvoicesPage() {
  const t = useTranslations('admin.invoices');
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const invoices = useStore((s) => s.data.invoices);
  const customers = useStore((s) => s.data.customers);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const sorted = [...invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  const columns: Column<Invoice>[] = [
    {
      key: 'customer',
      header: t('colCustomer'),
      primary: true,
      cell: (i) => {
        const c = customers.find((x) => x.id === i.customerId);
        return c ? `${c.firstName} ${c.lastName}` : '—';
      },
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (i) => <StatusBadge entity="invoice" state={i.status} size="sm" />,
    },
    {
      key: 'reference',
      header: t('colReference'),
      cell: (i) => (
        <span data-numeric className="text-ink-secondary">
          {i.reference}
        </span>
      ),
    },
    {
      key: 'amount',
      header: t('colAmount'),
      align: 'end',
      cell: (i) => <Money amount={invoiceTotal(i)} />,
    },
    {
      key: 'issued',
      header: t('colIssued'),
      cell: (i) => (
        <span data-numeric className="text-ink-secondary">
          {format.dateTime(new Date(i.issuedAt), 'short')}
        </span>
      ),
    },
    {
      key: 'due',
      header: t('colDue'),
      align: 'end',
      cell: (i) => {
        const days = Math.ceil(
          (new Date(i.dueAt).getTime() - now.getTime()) / 86_400_000,
        );
        const overdue = days < 0 && i.status !== 'paid';
        return (
          <span
            data-numeric
            className={cn('text-sm', overdue ? 'font-medium text-status-danger-fg' : 'text-ink-tertiary')}
          >
            {i.status === 'paid'
              ? format.dateTime(new Date(i.dueAt), 'short')
              : overdue
                ? t('overdueBy', { days: Math.abs(days) })
                : t('dueIn', { days })}
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
        items={sorted}
        columns={columns}
        getKey={(i) => i.id}
        onSelect={(i) => router.push(`/admin/rechnungen/${i.id}`)}
        caption={t('title')}
        empty={<EmptyState icon={Receipt} title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
