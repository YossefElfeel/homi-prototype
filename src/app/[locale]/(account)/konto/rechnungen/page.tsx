'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { RowAction, RowActions } from '@/components/ui/row-actions';
import { ActionIcon } from '@/lib/action-icons';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Money } from '@/components/ui/money';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { invoiceTotal } from '@/lib/customer-history';
import {
  effectiveInvoiceStatus,
  isInvoiceOutstanding,
  mayInvoice,
} from '@/lib/invoice-permissions';
import { statesOf } from '@/lib/status-registry';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow } from '@/mock/store';
import type { Invoice, InvoiceStatus } from '@/mock/schema';

/** «Alle», «offen», or one exact status. The same three-part filter the office has. */
type StatusFilter = 'all' | 'outstanding' | InvoiceStatus;

/**
 * Screen 39 — invoices.
 *
 * The list had no filter, and the question a customer opens it with is «was
 * schulde ich noch». Answering it meant reading every badge — and the badges
 * were the wrong ones to read: the status column printed the *stored* status,
 * and «überfällig» is never stored. Nothing writes it; it is a date passing.
 * So no row here could ever turn red, while the sidebar three centimetres to
 * the left counted the overdue ones with `effectiveInvoiceStatus` and the
 * detail screen drew the same invoice a red badge and a red notice. A red
 * count on «Rechnungen» opening onto a list of calm blue «Versendet».
 *
 * The badge and the filter read that one derivation now, which is also the
 * only way an overdue filter can mean anything.
 *
 * The search box beside it is the office's, minus the half that does not apply
 * here — see the note on what it matches.
 */
export default function AccountInvoicesPage() {
  const t = useTranslations('account.invoices');
  const statusT = useTranslations('status.invoice');
  const appT = useTranslations('app');
  const format = useFormatter();
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const { invoices } = useAccount();

  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');

  const mine = useMemo(
    () =>
      invoices
        /* §10 — a draft invoice is internal until the owner approves it.
           Showing one here would let a customer read a number that can still
           change. This was an inline `!== 'draft'`; the rule belongs to
           `invoice-permissions`, the same table the detail screen turns a
           typed-in draft id away with. */
        .filter((invoice) => mayInvoice('read', 'customer', invoice.status))
        .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1)),
    [invoices],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mine
      .filter((invoice) => {
        const state = effectiveInvoiceStatus(invoice, now);
        if (status === 'all') return true;
        if (status === 'outstanding') return isInvoiceOutstanding(state);
        return state === status;
      })
      .filter((invoice) =>
        q
          ? /* The invoice number and the QR reference, and nothing else. The
               office's version of this box also searches the customer name,
               which here would only ever match the one person doing the
               searching. The QR reference earns its place for the opposite
               reason: it is the line that appears on the *bank statement*, so
               «wofür war diese Zahlung» is answered by pasting the number the
               bank shows rather than by opening invoices one at a time. */
            [invoice.reference, invoice.qrReference]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      );
  }, [mine, status, query, now]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = status !== 'all' || query.trim() !== '';

  function clearFilters() {
    setStatus('all');
    setQuery('');
  }

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
      /* Derived, not stored — see the note at the top of this file. A row the
         filter answered «überfällig» for has to say so on the row as well. */
      cell: (i) => (
        <StatusBadge entity="invoice" state={effectiveInvoiceStatus(i, now)} size="sm" />
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t('title')} />

      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('search'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: visible.length, total: mine.length })
            : appT('resultsAll', { total: mine.length })
        }
        filters={
          <label className="min-w-44">
            <span className="sr-only">{t('filterStatus')}</span>
            {/*
              «Offen» sits in the same select as the exact statuses rather than
              beside them. It is the same question at a coarser grain — money
              that has not left the account yet, whether or not the date has
              passed — and two controls would let «bezahlt» and «offen» be
              picked together, a pair that empties the table and explains
              nothing about why. The exact states come from `status-registry`,
              so the filter and the badge it filters can never read
              differently, and `mayInvoice` drops «Entwurf» from them: a filter
              that can only ever return nothing is a control that lies about
              what it does.
            */}
            <Select
              dense
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">
                {t('filterStatus')}: {t('filterAll')}
              </option>
              <option value="outstanding">
                {t('filterStatus')}: {t('filterOutstanding')}
              </option>
              {statesOf('invoice')
                .filter((state) => mayInvoice('read', 'customer', state as InvoiceStatus))
                .map((state) => (
                  <option key={state} value={state}>
                    {t('filterStatus')}: {statusT(state)}
                  </option>
                ))}
            </Select>
          </label>
        }
      />

      <DataView
        items={visible}
        columns={columns}
        getKey={(i) => i.id}
        onSelect={(i) => router.push(`/konto/rechnungen/${i.id}`)}
        caption={t('title')}
        /* One action, and it still earns the column: without it this is the
           only list in the account with no visible way in. */
        rowActions={(i) => (
          <RowActions>
            <RowAction href={`/konto/rechnungen/${i.id}`} label={t('rowOpen')}>
              <ActionIcon.open aria-hidden />
            </RowAction>
          </RowActions>
        )}
        empty={
          filtering ? (
            /* «Keine überfälligen Rechnungen» is good news rather than an
               empty account, and the way out of it is dropping the filter — so
               the button does that instead of leaving the reader to work out
               which of the two controls emptied the table. */
            <EmptyState
              title={t('filterEmptyTitle')}
              body={t('filterEmptyBody')}
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  {t('filterReset')}
                </Button>
              }
            />
          ) : (
            <EmptyState title={t('emptyTitle')} body={t('emptyBody')} />
          )
        }
      />
    </>
  );
}
