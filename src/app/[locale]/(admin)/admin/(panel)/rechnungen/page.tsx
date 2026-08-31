'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { Download, Plus, Receipt, Send } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  ConfirmDialog,
  useConfirmTarget,
  useDismissLabel,
} from '@/components/ui/confirm-dialog';
import { DataView, type Column } from '@/components/ui/data-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select, Textarea } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import {
  RowAction,
  RowActionButton,
  RowActions,
  RowActionsDivider,
} from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Toolbar } from '@/components/ui/toolbar';
import { ActionIcon } from '@/lib/action-icons';
import { buildCsv, exportFilename } from '@/lib/csv';
import { downloadBlob } from '@/lib/pdf';
import { invoiceTotal } from '@/lib/customer-history';
import {
  effectiveInvoiceStatus,
  isInvoiceOutstanding,
  mayInvoice,
} from '@/lib/invoice-permissions';
import { METHOD_ICONS, invoicePayment } from '@/lib/payment-methods';
import { statesOf } from '@/lib/status-registry';
import { cn } from '@/lib/cn';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Invoice, InvoiceStatus } from '@/mock/schema';

/** «Alle», «offen», or one exact status. See the filter's own note below. */
type StatusFilter = 'all' | 'outstanding' | InvoiceStatus;

/**
 * Screen 71 — drafts awaiting approval, sent, overdue and settled in one list.
 *
 * The list was six unfiltered, unsearchable columns with one bulk action on
 * them. Four questions the office asks it every day had no answer here:
 *
 *  · «wo ist RE-2026-0049» — no search, so finding one invoice meant reading
 *    the table, and the reference a customer reads out over the phone is as
 *    often the QR reference off their bank statement as the invoice number.
 *  · «was ist noch offen» — no filter, and «offen» is not a status: it spans
 *    draft, sent and overdue.
 *  · «wie ist die bezahlt worden» — the method was recorded by
 *    `markInvoicePaid` and shown on no list at all.
 *  · «seit wann liegt dieser Entwurf hier» — `issuedAt` is re-stamped on
 *    approval, so the column labelled «Ausgestellt» could not say.
 *
 * And every row had exactly one thing you could do to it: open it. Approving,
 * cancelling and deleting all meant opening the invoice first, which is why
 * the bulk-approve checkbox existed — a batch action standing in for the row
 * actions that were missing.
 */
export default function InvoicesPage() {
  const t = useTranslations('admin.invoices');
  const invoiceT = useTranslations('admin.invoice');
  const statusT = useTranslations('status.invoice');
  const dismissLabel = useDismissLabel();
  const methodT = useTranslations('status.method');
  const appT = useTranslations('app');
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const role = useStore((s) => s.demo.role);
  const invoices = useStore((s) => s.data.invoices);
  const customers = useStore((s) => s.data.customers);
  const payments = useStore((s) => s.data.payments);
  const sendInvoice = useStore((s) => s.sendInvoice);
  const cancelInvoice = useStore((s) => s.cancelInvoice);
  const deleteInvoice = useStore((s) => s.deleteInvoice);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<string[]>([]);
  /*
   * Two destructive row actions, two held rows.
   *
   * `useConfirmTarget` rather than a plain `useState` because Radix keeps the
   * dialog mounted for the length of its exit: clearing the row on the click
   * that dismisses blanks the sentence naming the invoice while it fades.
   */
  const cancelling = useConfirmTarget<Invoice>();
  const deleting = useConfirmTarget<Invoice>();
  const [reason, setReason] = useState('');

  const nameOf = useMemo(() => {
    const byId = new Map(customers.map((c) => [c.id, `${c.firstName} ${c.lastName}`]));
    return (id: string) => byId.get(id) ?? '—';
  }, [customers]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices
      .filter((invoice) => {
        const state = effectiveInvoiceStatus(invoice, now);
        if (status === 'all') return true;
        if (status === 'outstanding') return isInvoiceOutstanding(state);
        return state === status;
      })
      .filter((invoice) =>
        q
          ? /* The QR reference is in here because it is what a bank statement
               shows: the office reads the number off the payment they have
               received and looks for the invoice it settles. The invoice
               number is what the customer reads out, and the name is what
               everybody else does. */
            [invoice.reference, invoice.qrReference, nameOf(invoice.customerId)]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [invoices, status, query, now, nameOf]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = status !== 'all' || query.trim() !== '';

  function approve(ids: string[]) {
    ids.forEach((id) => sendInvoice(id, now));
    setSelected([]);
    toast.success(invoiceT('sentDone'));
  }

  function confirmDelete() {
    const invoice = deleting.target;
    if (!invoice) return;
    deleting.dismiss();
    /* The store re-checks rather than trusting the menu: the item is only
       offered on a draft, and a second tab could have approved it between the
       render and the click. */
    if (!deleteInvoice(invoice.id)) {
      toast.error(t('deleteBlocked'));
      return;
    }
    toast.success(t('deleteDone', { reference: invoice.reference }));
  }

  function confirmCancel() {
    if (!cancelling.target) return;
    cancelInvoice(cancelling.target.id, reason.trim());
    cancelling.dismiss();
    setReason('');
    toast.success(invoiceT('cancelDone'));
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
      /*
       * How the money came in.
       *
       * `markInvoicePaid` has written a `Payment` with a method since wave 40
       * and nothing outside the invoice's own detail screen read it — so
       * «welche sind bar bezahlt worden» meant opening every paid row. Blank
       * for anything unpaid on purpose: an invoice carries a QR-bill, but
       * printing «QR-Rechnung» before the money arrives would state a fact
       * about a payment that has not happened.
       */
      key: 'method',
      header: t('colMethod'),
      sortBy: (i) => invoicePayment(i.id, payments)?.method ?? '',
      cell: (i) => {
        const payment = invoicePayment(i.id, payments);
        if (!payment) return <span className="text-ink-tertiary">—</span>;
        const Icon = METHOD_ICONS[payment.method];
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-secondary">
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {methodT(payment.method)}
          </span>
        );
      },
    },
    {
      /*
       * Created, not issued — and the third date does not fit.
       *
       * An invoice carries three: raised, issued, due. The column here used to
       * be `issuedAt`, which `sendInvoice` re-stamps on approval, so a draft
       * sitting unapproved for three weeks showed today's date and the age of
       * the pile was invisible. «Ausgestellt» is the one that drops: it stays
       * on the detail screen, and on this list the due date already carries
       * what it would have been read for.
       */
      key: 'created',
      header: t('colCreated'),
      sortBy: (i) => i.createdAt,
      cell: (i) => (
        <span data-numeric className="text-ink-secondary">
          {format.dateTime(new Date(i.createdAt), 'short')}
        </span>
      ),
    },
    {
      key: 'due',
      header: t('colDue'),
      align: 'end',
      sortBy: (i) => i.dueAt,
      cell: (i) => {
        const days = Math.ceil((new Date(i.dueAt).getTime() - now.getTime()) / 86_400_000);
        const state = effectiveInvoiceStatus(i, now);
        /* A cancelled invoice has no deadline left — counting down to one
           nobody owes is the list telling the office to chase a bill it
           withdrew itself. */
        if (state === 'cancelled') return <span className="text-ink-tertiary">—</span>;
        return (
          <span
            data-numeric
            className={cn(
              'text-sm',
              state === 'overdue' ? 'font-medium text-status-danger-fg' : 'text-ink-tertiary',
            )}
          >
            {state === 'paid'
              ? format.dateTime(new Date(i.dueAt), 'short')
              : state === 'overdue'
                ? t('overdueBy', { days: Math.abs(days) })
                : t('dueIn', { days })}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      sortBy: (i) => effectiveInvoiceStatus(i, now),
      /* The badge reads the derived status, not the stored one. It used to
         read `i.status`, so a row whose own «Fällig» column said «12 T.
         überfällig» wore a blue «Versendet» badge beside it. */
      cell: (i) => <StatusBadge entity="invoice" state={effectiveInvoiceStatus(i, now)} size="sm" />,
    },
  ];

  const createButton = mayInvoice('create', role) ? (
    <Button asChild>
      <Link href="/admin/rechnungen/neu">
        <Plus className="size-4" aria-hidden />
        {invoiceT('createAction')}
      </Link>
    </Button>
  ) : undefined;

  /**
   * The rows on screen, as a file.
   *
   * The whole invoice list has always been readable and never portable: the
   * quarterly hand-off to the bookkeeper was «ich lese sie dir vor» or a
   * screenshot. It exports what the filters left, not everything in the store —
   * a download that ignores the toolbar above it is the export version of a
   * search box that does nothing, and the office only finds out by opening the
   * file.
   *
   * CSV rather than the PDF writer `lib/pdf.ts` provides, and that file says
   * why: it is one page and does not paginate, so a list of thirty would lose
   * the rows that fall off the bottom silently. This is also what the file is
   * *for* — it gets opened next to a bank statement, not read.
   */
  function download() {
    if (visible.length === 0) {
      toast.error(t('downloadEmpty'));
      return;
    }

    const csv = buildCsv(
      [
        t('colReference'),
        invoiceT('qrReference'),
        t('colCreated'),
        t('colCustomer'),
        t('colAmount'),
        t('colDue'),
        t('colStatus'),
        t('colMethod'),
      ],
      visible.map((invoice) => [
        invoice.reference,
        invoice.qrReference,
        invoice.createdAt.slice(0, 10),
        nameOf(invoice.customerId),
        /* The figure plainly, not through `formatChf`: a spreadsheet reads
           «1'240.50» as text and then refuses to sum the column. The currency
           rides in the header instead. */
        invoiceTotal(invoice).toFixed(2),
        invoice.dueAt.slice(0, 10),
        statusT(effectiveInvoiceStatus(invoice, now)),
        invoicePayment(invoice.id, payments)?.method
          ? methodT(invoicePayment(invoice.id, payments)!.method)
          : '',
      ]),
    );

    downloadBlob(exportFilename('rechnungen', now), csv);
    toast.success(t('downloadDone', { n: visible.length }));
  }

  /**
   * One row's menu.
   *
   * Every item is gated on `invoice-permissions` rather than on a status test
   * written here, and an item a row cannot use stays in the menu wearing the
   * reason instead of its name — a greyed line with the same word on it
   * explains nothing, and `pointer-events-none` means a tooltip would never
   * fire to explain it either.
   */
  function menu(invoice: Invoice) {
    const state = effectiveInvoiceStatus(invoice, now);
    const canEdit = mayInvoice('editLines', role, state);
    const canApprove = mayInvoice('approve', role, state);
    const canPay = mayInvoice('markPaid', role, state);
    const canCancel = mayInvoice('cancel', role, state);
    const canDelete = mayInvoice('delete', role, state);

    return (
      <RowActions>
        <RowAction href={`/admin/rechnungen/${invoice.id}`} label={t('rowOpen')}>
          <ActionIcon.open aria-hidden />
        </RowAction>
        {canEdit ? (
          <RowAction href={`/admin/rechnungen/${invoice.id}`} label={t('rowEdit')}>
            <ActionIcon.edit aria-hidden />
          </RowAction>
        ) : (
          <RowActionButton disabled label={t('rowEditLocked')} onClick={() => {}}>
            <ActionIcon.edit aria-hidden />
          </RowActionButton>
        )}
        {canApprove && (
          <RowActionButton label={invoiceT('sendAction')} onClick={() => approve([invoice.id])}>
            <Send aria-hidden />
          </RowActionButton>
        )}
        {canPay && (
          /* Straight to the detail screen rather than settling from here: the
             one question «wie ist das Geld gekommen?» has to be answered, and
             a row menu is the wrong place for a form. */
          <RowAction href={`/admin/rechnungen/${invoice.id}`} label={invoiceT('markPaid')}>
            <ActionIcon.invoice aria-hidden />
          </RowAction>
        )}
        {/*
            What the person being billed sees, and it is offered on exactly the
            states where that page still has something on it.

            Not on a draft: §10 keeps an unapproved amount internal and the
            customer's own screen refuses one, so the link would open a page
            that says no. And not once it is settled either — their copy drops
            the payment part when it is paid, so from here the item would
            promise a document and land on a receipt.
        */}
        {state !== 'draft' && state !== 'paid' && (
          <RowAction
            external
            href={`/konto/rechnungen/${invoice.id}`}
            label={t('rowCustomerView')}
          >
            <ActionIcon.customerView aria-hidden />
          </RowAction>
        )}
        {(canCancel || canDelete) && <RowActionsDivider />}
        {canCancel && (
          <RowActionButton
            tone="danger"
            label={invoiceT('cancelAction')}
            onClick={() => {
              setReason('');
              cancelling.ask(invoice);
            }}
          >
            <ActionIcon.decline aria-hidden />
          </RowActionButton>
        )}
        {canDelete && (
          <RowActionButton
            tone="danger"
            label={t('rowDelete')}
            onClick={() => deleting.ask(invoice)}
          >
            <ActionIcon.delete aria-hidden />
          </RowActionButton>
        )}
      </RowActions>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        actions={
          <>
            <Button variant="secondary" onClick={download}>
              <Download className="size-4" aria-hidden />
              {t('downloadAction')}
            </Button>
            {createButton}
          </>
        }
      />

      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('search'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: visible.length, total: invoices.length })
            : appT('resultsAll', { total: invoices.length })
        }
        filters={
          <label className="min-w-44">
            <span className="sr-only">{t('filterStatus')}</span>
            {/*
              «Offen» sits in the same select as the five statuses rather than
              in a second one beside it. It is the same question at a coarser
              grain — draft, sent and overdue are all money not yet in — and
              two selects would let «bezahlt» and «offen» be chosen together,
              a pair that returns an empty table and explains nothing about
              why. The exact statuses come from the status registry, so the
              filter and the badge it filters can never read differently.
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
              {statesOf('invoice').map((state) => (
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
        onSelect={(i) => router.push(`/admin/rechnungen/${i.id}`)}
        caption={t('title')}
        openLabel={t('rowOpen')}
        rowActions={menu}
        /* Drafts are the only status a bulk action makes sense on: approving
           several at once is the actual job, and nothing else on this list can
           be batched without losing the per-invoice decision. */
        selection={{
          selected,
          onChange: setSelected,
          rowLabel: t('colReference'),
          allLabel: t('title'),
          isSelectable: (id) => {
            const invoice = visible.find((i) => i.id === id);
            return invoice
              ? mayInvoice('approve', role, effectiveInvoiceStatus(invoice, now))
              : false;
          },
          bar: (ids) => (
            <>
              <span className="text-sm text-ink-secondary">
                {appT('selected', { n: ids.length })}
              </span>
              <Button size="sm" onClick={() => approve(ids)}>
                <Send className="size-4" aria-hidden />
                {invoiceT('sendAction')}
              </Button>
            </>
          ),
        }}
        empty={
          filtering ? (
            /* A filter that empties the table is not the same news as a
               business with no invoices, and the action that helps is
               dropping the filter — not raising a bill. */
            <EmptyState
              icon={Receipt}
              title={t('filterEmptyTitle')}
              body={t('filterEmptyBody')}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setStatus('all');
                  }}
                >
                  {t('filterReset')}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title={t('emptyTitle')}
              body={t('emptyBody')}
              action={createButton}
            />
          )
        }
      />

      {/*
        Cancelling from the list, reason and all.

        It used to live only on the detail screen, so withdrawing an invoice
        the office had just spotted as wrong meant opening it, scrolling past
        the QR-bill and the message box, and finding a red button below both.
        The reason is still required: a cancellation with no reason is the one
        entry in the books nobody can explain a month later.
      */}
      <ConfirmDialog
        open={cancelling.open}
        onOpenChange={(open) => !open && cancelling.dismiss()}
        title={invoiceT('cancelConfirmTitle')}
        body={t('cancelLead', { reference: cancelling.target?.reference ?? '' })}
        action={invoiceT('cancelConfirmAction')}
        dismiss={dismissLabel}
        disabled={reason.trim() === ''}
        onConfirm={confirmCancel}
      >
        <Field label={invoiceT('cancelReason')} hint={invoiceT('cancelConfirmBody')}>
          {(props) => (
            <Textarea
              {...props}
              className="min-h-24"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </Field>
      </ConfirmDialog>

      {/* Deleting used to raise a `window.confirm` — the browser's box, in the
          browser's language, over a themed panel. */}
      <ConfirmDialog
        open={deleting.open}
        onOpenChange={(open) => !open && deleting.dismiss()}
        title={t('deleteConfirmTitle')}
        body={t('deleteConfirm', { reference: deleting.target?.reference ?? '' })}
        action={t('rowDelete')}
        dismiss={dismissLabel}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
