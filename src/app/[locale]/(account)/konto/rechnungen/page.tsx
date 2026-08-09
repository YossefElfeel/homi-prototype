'use client';

import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAccount } from '@/lib/use-account';
import { useHydrated } from '@/mock/store';
import type { Invoice } from '@/mock/schema';

const invoiceTotal = (invoice: Invoice) =>
  invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

/** Screen 39 — invoices. */
export default function AccountInvoicesPage() {
  const t = useTranslations('account.invoices');
  const format = useFormatter();
  const router = useRouter();
  const hydrated = useHydrated();

  const { invoices } = useAccount();

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const columns: Column<Invoice>[] = [
    {
      key: 'reference',
      header: t('colReference'),
      primary: true,
      cell: (i) => <span data-numeric>{i.reference}</span>,
    },
    {
      key: 'issued',
      header: t('colIssued'),
      tableOnly: true,
      cell: (i) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {format.dateTime(new Date(i.issuedAt), 'short')}
        </span>
      ),
    },
    {
      key: 'due',
      header: t('colDue'),
      cell: (i) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {format.dateTime(new Date(i.dueAt), 'short')}
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
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      cell: (i) => <StatusBadge entity="invoice" state={i.status} size="sm" />,
    },
  ];

  return (
    <>
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <DataView
        className="mt-8"
        // §10 — a draft invoice is internal until the owner approves it. Showing
        // one here would let a customer read a number that can still change.
        items={invoices
          .filter((i) => i.status !== 'draft')
          .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1))}
        columns={columns}
        getKey={(i) => i.id}
        onSelect={(i) => router.push(`/konto/rechnungen/${i.id}`)}
        caption={t('title')}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </>
  );
}
