'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { Clock, Download, Plus, RefreshCw, Users, Wallet } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import {
  ConfirmDialog,
  useConfirmTarget,
  useDismissLabel,
} from '@/components/ui/confirm-dialog';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { Money, formatChf } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { RecordLink } from '@/components/ui/record-link';
import { RowAction, RowActionButton, RowActions, RowActionsDivider } from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { ExpensePaidDialog, useExpensePayment } from '@/components/admin/expense-paid-dialog';
import { ActionIcon } from '@/lib/action-icons';
import { buildCsv, exportFilename } from '@/lib/csv';
import {
  EXPENSE_CATEGORIES,
  effectiveExpenseStatus,
  isExpenseOutstanding,
  type ExpenseState,
} from '@/lib/expense-facts';
import { labourExpenses, memberName } from '@/lib/labour-facts';
import { METHOD_ICONS } from '@/lib/payment-methods';
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
 *
 * The people half is new and stays deliberately thin here. A labour row wears
 * its hours on the row and its job in a column, and the third filter narrows to
 * one person — enough to find a receipt. Reading the hours *as hours* is a
 * different table with different columns, and it is one row down in the
 * sidebar rather than a second mode of this one.
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
  const bookings = useStore((s) => s.data.bookings);
  const team = useStore((s) => s.data.team);
  const markExpensePaid = useStore((s) => s.markExpensePaid);
  const deleteExpense = useStore((s) => s.deleteExpense);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState<'all' | ExpenseCategory>('all');
  const [worker, setWorker] = useState<'all' | string>('all');

  /* Two dialogs, two held rows — `useConfirmTarget` rather than `useState` for
     the reason the invoice list gives: Radix keeps the box mounted through its
     exit, and clearing the row on the dismissing click blanks the sentence
     naming the receipt while it fades. */
  const paying = useExpensePayment();
  const deleting = useConfirmTarget<Expense>();

  const jobReference = (expense: Expense) =>
    expense.bookingId
      ? (bookings.find((b) => b.id === expense.bookingId)?.reference ?? '')
      : '';

  /**
   * The people the filter offers, and only the ones with a row behind them.
   *
   * The whole roster would put two names in the list that empty the table
   * whichever way they are picked — the rule `costsByCategory` follows, and the
   * reason the analytics screen leaves out a category nobody spent under.
   */
  const workers = useMemo(() => {
    const seen = new Set(labourExpenses(expenses).map((e) => e.labour.workerId));
    return team
      .filter((m) => seen.has(m.id))
      .sort((a, b) => memberName(a).localeCompare(memberName(b)));
  }, [expenses, team]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses
      .filter((e) => (category === 'all' ? true : e.category === category))
      /* A person is a labour fact, so this filter drops everything else by
         construction — which is the honest answer to «was hat Marta gekostet»
         rather than a list that also carries the month's diesel. */
      .filter((e) => (worker === 'all' ? true : e.labour?.workerId === worker))
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
               the bookkeeper reads out, the note is what the office wrote when
               the receipt was still in a pocket — and the job reference is how
               «was hat dieser Einsatz gekostet» is asked out loud, which until
               now the box could not answer at all. */
            [e.supplier, e.reference, e.note ?? '', jobReference(e)]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => b.incurredAt.localeCompare(a.incurredAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, bookings, category, worker, status, query, now]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering =
    status !== 'all' || category !== 'all' || worker !== 'all' || query.trim() !== '';

  function resetFilters() {
    setQuery('');
    setStatus('all');
    setCategory('all');
    setWorker('all');
  }

  function confirmPaid(expense: Expense, method: PaymentMethod) {
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
   *
   * The five people-and-hours columns are written for *every* row, blank on the
   * ones that are not labour. A column that only exists on some rows is a
   * column that shifts the whole table halfway down a spreadsheet.
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
        t('colJob'),
        t('colHours'),
        t('colWorker'),
        t('colPaidBy'),
        t('colResponsible'),
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
        jobReference(e),
        /* Same rule as the amount: a decimal a spreadsheet can add up, not
           «4.5 Std.» */
        e.labour ? String(e.labour.hours) : '',
        e.labour ? memberName(team.find((m) => m.id === e.labour!.workerId)) : '',
        e.labour ? memberName(team.find((m) => m.id === e.labour!.paidById)) : '',
        e.labour ? memberName(team.find((m) => m.id === e.labour!.responsibleId)) : '',
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
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
          {/* The hours ride on the name rather than taking a column, so they
              survive the card rendering below lg — where a labour row is
              otherwise a person's name and an amount, which is the one shape
              this category exists to stop. */}
          {e.labour && (
            <Chip tone="accent" icon={Clock}>
              {t('hours', { hours: e.labour.hours })}
            </Chip>
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
      /*
       * The job, and it is not only a labour column.
       *
       * `bookingId` has been on this record since the day it was written and
       * appeared on no list — so a cost attributed to a job was attributed
       * where nobody could see it, and the attribution may as well not have
       * been made. Labour rows always carry one; the detergent bought for one
       * move-out clean may.
       */
      key: 'job',
      header: t('colJob'),
      tableOnly: true,
      sortBy: (e) => jobReference(e),
      cell: (e) => {
        const reference = jobReference(e);
        if (!reference) return <span className="text-ink-tertiary">—</span>;
        return (
          <RecordLink href={`/admin/buchungen/${e.bookingId}`} numeric>
            {reference}
          </RecordLink>
        );
      },
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
          <RowActionButton label={t('rowMarkPaid')} onClick={() => paying.ask(expense)}>
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
            {/* The way to the people side. It is a sidebar row too — this is
                the link for somebody who is already standing on the list and
                has just found out that half of it is hours. */}
            <Button asChild variant="secondary">
              <Link href="/admin/ausgaben/arbeitszeit">
                <Users className="size-4" aria-hidden />
                {t('workforceAction')}
              </Link>
            </Button>
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
            {/* Only once somebody has hours against their name. On a company
                that has never booked labour this is a select with one option
                in it, which is a control that cannot do anything — so it is
                not drawn at all. */}
            {workers.length > 0 && (
              <label className="min-w-40">
                <span className="sr-only">{t('filterWorker')}</span>
                <Select dense value={worker} onChange={(e) => setWorker(e.target.value)}>
                  <option value="all">
                    {t('filterWorker')}: {t('filterAll')}
                  </option>
                  {workers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {t('filterWorker')}: {memberName(m)}
                    </option>
                  ))}
                </Select>
              </label>
            )}
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
                <Button variant="secondary" onClick={resetFilters}>
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
          that fact a click alone would drop. Shared with the workforce board,
          which settles the same records. */}
      <ExpensePaidDialog payment={paying} onConfirm={confirmPaid} />

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
