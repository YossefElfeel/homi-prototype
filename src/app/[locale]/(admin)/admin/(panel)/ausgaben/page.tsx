'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { Download, Plus, RefreshCw, Wallet } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  ConfirmDialog,
  useConfirmTarget,
  useDismissLabel,
} from '@/components/ui/confirm-dialog';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select } from '@/components/ui/field';
import { Money, formatChf } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { RowAction, RowActionButton, RowActions, RowActionsDivider } from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { ActionIcon } from '@/lib/action-icons';
import { buildCsv, exportFilename } from '@/lib/csv';
import {
  EXPENSE_CATEGORIES,
  effectiveExpenseStatus,
  isExpenseOutstanding,
  type ExpenseState,
} from '@/lib/expense-facts';
import { EXPENSE_METHODS, METHOD_ICONS } from '@/lib/payment-methods';
import { downloadBlob } from '@/lib/pdf';
import { statesOf } from '@/lib/status-registry';
import { cn } from '@/lib/cn';
import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Expense, ExpenseCategory, PaymentMethod } from '@/mock/schema';

/** «Alle», «offen», or one exact state — the same three-way the invoice filter is. */
type StatusFilter = 'all' | 'outstanding' | ExpenseState;

/**
 * Screen 71c — what the company pays out.
 *
 * The panel could say what came in and nothing at all about what went out, so
 * the one number an owner opens a money section to find — what is left at the
 * end of the month — was not computable anywhere in the app. It was read off a
 * banking app instead, which is also where the answer to «haben wir die Garage
 * schon bezahlt» lived.
 *
 * Built as the invoice list's mirror rather than as a new kind of screen: same
 * toolbar, same two filters, same row menu, same confirm, same page size. The
 * two are read one after the other — the tab strip above puts them a click
 * apart — and a list that behaved differently on the outgoing side would make
 * the reader learn the section twice.
 *
 * What is deliberately *not* mirrored is the draft. An invoice has one because
 * the amount is argued about internally before it goes to a customer; a
 * supplier's bill arrives finished. So a cost is open or paid, and «überfällig»
 * is derived from the date the way it is on an invoice.
 */
export default function ExpensesPage() {
  const t = useTranslations('admin.expenses');
  const appT = useTranslations('app');
  const statusT = useTranslations('status.expense');
  const methodT = useTranslations('status.method');
  const dismissLabel = useDismissLabel();
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const expenses = useStore((s) => s.data.expenses);
  const markExpensePaid = useStore((s) => s.markExpensePaid);
  const deleteExpense = useStore((s) => s.deleteExpense);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState<'all' | ExpenseCategory>('all');

  /* Two dialogs, two held rows — `useConfirmTarget` rather than `useState` for
     the reason the invoice list gives: Radix keeps the box mounted through its
     exit, and clearing the row on the dismissing click blanks the sentence
     naming the receipt while it fades. */
  const paying = useConfirmTarget<Expense>();
  const deleting = useConfirmTarget<Expense>();
  const [method, setMethod] = useState<PaymentMethod>('qr-bill');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses
      .filter((e) => (category === 'all' ? true : e.category === category))
      .filter((e) => {
        const state = effectiveExpenseStatus(e, now);
        if (status === 'all') return true;
        if (status === 'outstanding') return isExpenseOutstanding(state);
        return state === status;
      })
      .filter((e) =>
        q
          ? /* The supplier first, because that is what somebody is holding: a
               reminder from the garage with a name on it. The number is what
               the bookkeeper reads out, and the note is what the office wrote
               when the receipt was still in a pocket. */
            [e.supplier, e.reference, e.note ?? ''].join(' ').toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => b.incurredAt.localeCompare(a.incurredAt));
  }, [expenses, category, status, query, now]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = status !== 'all' || category !== 'all' || query.trim() !== '';

  function confirmPaid() {
    const expense = paying.target;
    if (!expense) return;
    paying.dismiss();
    markExpensePaid(expense.id, now, method);
    toast.success(t('paidDone', { reference: expense.reference }));
  }

  function confirmDelete() {
    const expense = deleting.target;
    if (!expense) return;
    deleting.dismiss();
    deleteExpense(expense.id);
    toast.success(t('deleteDone', { reference: expense.reference }));
  }

  /**
   * The rows on screen, not every row in the store.
   *
   * A download that quietly ignores the filter above it is the export version
   * of a search box that does nothing: the office narrows to «Fahrzeug, offen»,
   * presses the button and gets the whole year — and only finds out by opening
   * the file. What is on screen is what comes out, and the count in the toast
   * says how many so the two can be compared without opening anything.
   */
  function download() {
    if (visible.length === 0) {
      toast.error(t('downloadEmpty'));
      return;
    }

    const csv = buildCsv(
      [
        t('colReference'),
        t('colIncurred'),
        t('colSupplier'),
        t('colCategory'),
        t('colNote'),
        t('colAmount'),
        t('colDue'),
        t('colStatus'),
        t('colMethod'),
      ],
      visible.map((e) => [
        e.reference,
        e.incurredAt.slice(0, 10),
        e.supplier,
        t(`categories.${e.category}`),
        e.note ?? '',
        /* The figure written plainly, not through `formatChf`: a spreadsheet
           reads «1'240.50» as text and then refuses to sum the column. The
           currency is in the header instead. */
        e.amount.toFixed(2),
        e.dueAt?.slice(0, 10) ?? '',
        statusT(effectiveExpenseStatus(e, now)),
        e.method ? methodT(e.method) : '',
      ]),
    );

    downloadBlob(exportFilename('ausgaben', now), csv);
    toast.success(t('downloadDone', { n: visible.length }));
  }

  const createButton = (
    <Button asChild>
      <Link href="/admin/ausgaben/neu">
        <Plus className="size-4" aria-hidden />
        {t('newAction')}
      </Link>
    </Button>
  );

  const columns: Column<Expense>[] = [
    {
      key: 'supplier',
      header: t('colSupplier'),
      primary: true,
      sortBy: (e) => e.supplier,
      cell: (e) => (
        <span className="flex flex-wrap items-center gap-x-2">
          {e.supplier}
          {/* A standing cost, marked on the row rather than only inside the
              record. «Was läuft weiter, wenn wir nichts tun» is a question this
              list is read for, and the analytics tile that answers it is one
              screen away — the chip is what makes the rows behind that number
              findable. */}
          {e.recurring && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-tertiary">
              <RefreshCw className="size-3" aria-hidden />
              {t('recurring')}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'reference',
      header: t('colReference'),
      tableOnly: true,
      sortBy: (e) => e.reference,
      cell: (e) => (
        <span data-numeric className="text-ink-secondary">
          {e.reference}
        </span>
      ),
    },
    {
      key: 'category',
      header: t('colCategory'),
      sortBy: (e) => e.category,
      cell: (e) => <span className="text-sm text-ink-secondary">{t(`categories.${e.category}`)}</span>,
    },
    {
      key: 'amount',
      header: t('colAmount'),
      align: 'end',
      sortBy: (e) => e.amount,
      cell: (e) => <Money amount={e.amount} />,
    },
    {
      key: 'incurred',
      header: t('colIncurred'),
      sortBy: (e) => e.incurredAt,
      cell: (e) => (
        <span data-numeric className="text-ink-secondary">
          {format.dateTime(new Date(e.incurredAt), 'short')}
        </span>
      ),
    },
    {
      /*
       * The deadline, and the two cases where there is not one.
       *
       * A paid receipt shows the date it was due and nothing more — counting
       * down to a deadline that has been met is the list telling the office to
       * chase a bill it has already settled. A receipt with no `dueAt` at all
       * was paid at the till, and «ohne Frist» says that rather than leaving a
       * dash the reader has to interpret.
       */
      key: 'due',
      header: t('colDue'),
      align: 'end',
      sortBy: (e) => e.dueAt ?? '',
      cell: (e) => {
        if (!e.dueAt) return <span className="text-sm text-ink-tertiary">{t('noDueDate')}</span>;
        const state = effectiveExpenseStatus(e, now);
        const days = Math.ceil((new Date(e.dueAt).getTime() - now.getTime()) / 86_400_000);
        return (
          <span
            data-numeric
            className={cn(
              'text-sm',
              state === 'overdue' ? 'font-medium text-status-danger-fg' : 'text-ink-tertiary',
            )}
          >
            {state === 'paid'
              ? format.dateTime(new Date(e.dueAt), 'short')
              : state === 'overdue'
                ? t('overdueBy', { days: Math.abs(days) })
                : t('dueIn', { days })}
          </span>
        );
      },
    },
    {
      key: 'method',
      header: t('colMethod'),
      tableOnly: true,
      sortBy: (e) => e.method ?? '',
      cell: (e) => {
        /* Blank until the money has actually left, exactly as on the invoice
           list: printing a route before the payment happened states a fact
           about something that has not occurred. */
        if (!e.method) return <span className="text-ink-tertiary">—</span>;
        const Icon = METHOD_ICONS[e.method];
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-secondary">
            <Icon className="size-3.5 shrink-0" aria-hidden />
            {methodT(e.method)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      sortBy: (e) => statesOf('expense').indexOf(effectiveExpenseStatus(e, now)),
      cell: (e) => <StatusBadge entity="expense" state={effectiveExpenseStatus(e, now)} size="sm" />,
    },
  ];

  function menu(expense: Expense) {
    const settled = expense.status === 'paid';

    return (
      <RowActions>
        <RowAction href={`/admin/ausgaben/${expense.id}`} label={t('rowOpen')}>
          <ActionIcon.open aria-hidden />
        </RowAction>
        <RowAction href={`/admin/ausgaben/${expense.id}`} label={t('rowEdit')}>
          <ActionIcon.edit aria-hidden />
        </RowAction>
        {!settled && (
          <RowActionButton
            label={t('rowMarkPaid')}
            onClick={() => {
              setMethod('qr-bill');
              paying.ask(expense);
            }}
          >
            <ActionIcon.invoice aria-hidden />
          </RowActionButton>
        )}
        <RowActionsDivider />
        <RowActionButton tone="danger" label={t('rowDelete')} onClick={() => deleting.ask(expense)}>
          <ActionIcon.delete aria-hidden />
        </RowActionButton>
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
          placeholder: t('searchPlaceholder'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: visible.length, total: expenses.length })
            : appT('resultsAll', { total: expenses.length })
        }
        filters={
          <>
            <label className="min-w-40">
              <span className="sr-only">{t('filterCategory')}</span>
              <Select
                dense
                value={category}
                onChange={(e) => setCategory(e.target.value as 'all' | ExpenseCategory)}
              >
                <option value="all">
                  {t('filterCategory')}: {t('filterAll')}
                </option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t('filterCategory')}: {t(`categories.${c}`)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="min-w-40">
              <span className="sr-only">{t('filterStatus')}</span>
              {/*
                «Offen» sits inside the same select as the three states, for the
                reason the invoice filter gives: it is the same question at a
                coarser grain — open and overdue are both money still owed — and
                two selects would let «bezahlt» and «offen» be picked together,
                a pair that empties the table and explains nothing about why.
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
                {statesOf('expense').map((s) => (
                  <option key={s} value={s}>
                    {t('filterStatus')}: {statusT(s)}
                  </option>
                ))}
              </Select>
            </label>
          </>
        }
      />

      <DataView
        items={visible}
        columns={columns}
        getKey={(e) => e.id}
        onSelect={(e) => router.push(`/admin/ausgaben/${e.id}`)}
        caption={t('title')}
        openLabel={t('rowOpen')}
        rowActions={menu}
        empty={
          filtering ? (
            /* A filter that empties the table is not the same news as a company
               with no costs, and the action that helps is clearing the filter —
               not entering a receipt that does not exist. */
            <EmptyState
              icon={Wallet}
              title={t('filterEmptyTitle')}
              body={t('filterEmptyBody')}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setStatus('all');
                    setCategory('all');
                  }}
                >
                  {t('filterReset')}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Wallet}
              title={t('emptyTitle')}
              body={t('emptyBody')}
              action={createButton}
            />
          )
        }
      />

      {/* Settling from the row, and the route is required — the same dialog
          shape the invoice detail uses to ask the same question. It is a
          confirm rather than a straight click because «bezahlt» writes a fact
          about money that has left the account, and the method is the half of
          that fact a click alone would drop. */}
      <ConfirmDialog
        open={paying.open}
        onOpenChange={(open) => !open && paying.dismiss()}
        tone="default"
        title={t('paidTitle')}
        body={
          paying.target
            ? t('paidBody', {
                reference: paying.target.reference,
                supplier: paying.target.supplier,
                amount: formatChf(paying.target.amount, locale),
              })
            : ''
        }
        action={t('paidAction')}
        dismiss={dismissLabel}
        onConfirm={confirmPaid}
      >
        <Field label={t('paidMethod')}>
          {(props) => (
            <Select
              {...props}
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              {EXPENSE_METHODS.map((m) => (
                <option key={m} value={m}>
                  {methodT(m)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleting.open}
        onOpenChange={(open) => !open && deleting.dismiss()}
        title={t('deleteConfirmTitle')}
        body={
          deleting.target
            ? t('deleteConfirm', {
                reference: deleting.target.reference,
                supplier: deleting.target.supplier,
                amount: formatChf(deleting.target.amount, locale),
              })
            : ''
        }
        action={t('rowDelete')}
        dismiss={dismissLabel}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
