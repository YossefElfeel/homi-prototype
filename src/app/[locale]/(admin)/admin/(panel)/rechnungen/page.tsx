'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { Plus, Receipt, Send } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Invoice } from '@/mock/schema';
import { cn } from '@/lib/cn';

const invoiceTotal = (invoice: Invoice) =>
  invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

/** Screen 71 — drafts awaiting approval, sent, and overdue in one list. */
export default function InvoicesPage() {
  const t = useTranslations('admin.invoices');
  const invoiceT = useTranslations('admin.invoice');
  const appT = useTranslations('app');
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const invoices = useStore((s) => s.data.invoices);
  const customers = useStore((s) => s.data.customers);
  const bookings = useStore((s) => s.data.bookings);
  const createInvoiceForBooking = useStore((s) => s.createInvoiceForBooking);
  const sendInvoice = useStore((s) => s.sendInvoice);

  const [creating, setCreating] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const sorted = [...invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  const nameOf = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };

  /*
   * §10 says an invoice follows a finished job. Nothing in the app created
   * one, so this is the missing half: the jobs that are done and not yet
   * billed. Lines come from the accepted quote inside the store mutator, so
   * what was agreed and what is billed cannot diverge here.
   */
  const billable = bookings.filter(
    (b) =>
      (b.status === 'completed' || b.status === 'awaitingApproval') &&
      !invoices.some((i) => i.bookingId === b.id),
  );

  function create() {
    const id = createInvoiceForBooking(bookingId, now);
    setCreating(false);
    setBookingId('');
    if (!id) return;
    const reference = useStore.getState().data.invoices.find((i) => i.id === id)?.reference;
    toast.success(invoiceT('createDone', { reference: reference ?? '' }));
    router.push(`/admin/rechnungen/${id}`);
  }

  function sendSelected(ids: string[]) {
    ids.forEach((id) => sendInvoice(id, now));
    setSelected([]);
    toast.success(invoiceT('sentDone'));
  }

  const columns: Column<Invoice>[] = [
    {
      key: 'customer',
      header: t('colCustomer'),
      primary: true,
      sortBy: (i) => nameOf(i.customerId),
      cell: (i) => nameOf(i.customerId),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      sortBy: (i) => i.status,
      cell: (i) => <StatusBadge entity="invoice" state={i.status} size="sm" />,
    },
    {
      key: 'reference',
      header: t('colReference'),
      sortBy: (i) => i.reference,
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
      sortBy: (i) => invoiceTotal(i),
      cell: (i) => <Money amount={invoiceTotal(i)} />,
    },
    {
      key: 'issued',
      header: t('colIssued'),
      sortBy: (i) => i.issuedAt,
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
      sortBy: (i) => i.dueAt,
      cell: (i) => {
        const days = Math.ceil(
          (new Date(i.dueAt).getTime() - now.getTime()) / 86_400_000,
        );
        const overdue = days < 0 && i.status !== 'paid';
        return (
          <span
            data-numeric
            className={cn(
              'text-sm',
              overdue ? 'font-medium text-status-danger-fg' : 'text-ink-tertiary',
            )}
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

  const createButton = (
    <Button onClick={() => setCreating(true)} disabled={billable.length === 0}>
      <Plus className="size-4" aria-hidden />
      {invoiceT('createAction')}
    </Button>
  );

  return (
    <div className="mx-auto max-w-[100rem]">
      <PageHeader title={t('title')} actions={createButton} />

      <DataView
        items={sorted}
        columns={columns}
        getKey={(i) => i.id}
        onSelect={(i) => router.push(`/admin/rechnungen/${i.id}`)}
        caption={t('title')}
        /* Drafts are the only status a bulk action makes sense on: approving
           several at once is the actual job, and nothing else on this list can
           be batched without losing the per-invoice decision. */
        selection={{
          selected,
          onChange: setSelected,
          rowLabel: t('colReference'),
          allLabel: t('title'),
          isSelectable: (id) =>
            sorted.find((i) => i.id === id)?.status === 'draft',
          bar: (ids) => (
            <>
              <span className="text-sm text-ink-secondary">
                {appT('selected', { n: ids.length })}
              </span>
              <Button size="sm" onClick={() => sendSelected(ids)}>
                <Send className="size-4" aria-hidden />
                {invoiceT('sendAction')}
              </Button>
            </>
          ),
        }}
        empty={
          <EmptyState
            icon={Receipt}
            title={t('emptyTitle')}
            body={
              billable.length > 0 ? t('emptyBody') : invoiceT('createEmptyBody')
            }
            /* Was an empty state with no action, on a screen whose registry
               entry lists `empty` as a required state. */
            action={billable.length > 0 ? createButton : undefined}
          />
        }
      />

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent closeLabel={invoiceT('dismiss')}>
          <DialogHeader>
            <DialogTitle>{invoiceT('createTitle')}</DialogTitle>
            <DialogDescription>{invoiceT('createLead')}</DialogDescription>
          </DialogHeader>

          {billable.length === 0 ? (
            <EmptyState
              compact
              icon={Receipt}
              title={invoiceT('createEmptyTitle')}
              body={invoiceT('createEmptyBody')}
            />
          ) : (
            <Field label={invoiceT('createPick')}>
              {(props) => (
                <Select
                  {...props}
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                >
                  <option value="">—</option>
                  {billable.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.reference} · {nameOf(b.customerId)} ·{' '}
                      {format.dateTime(new Date(b.start), 'short')}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              {invoiceT('dismiss')}
            </Button>
            <Button onClick={create} disabled={!bookingId}>
              {invoiceT('createAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
