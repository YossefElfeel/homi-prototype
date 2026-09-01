'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { Banknote, Clock, Download, Gauge, Plus, Users } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { RowAction, RowActionButton, RowActions } from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatGrid, StatTile } from '@/components/ui/stat';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { ExpensePaidDialog, useExpensePayment } from '@/components/admin/expense-paid-dialog';
import { ActionIcon } from '@/lib/action-icons';
import { buildCsv, exportFilename } from '@/lib/csv';
import {
  effectiveExpenseStatus,
  isExpenseOutstanding,
  type ExpenseState,
} from '@/lib/expense-facts';
import { financeMonths, monthKey } from '@/lib/finance-facts';
import {
  byJob,
  byWorker,
  labourExpenses,
  labourTotals,
  memberName,
  rateOf,
  type JobTotal,
  type LabourExpense,
  type WorkerTotal,
} from '@/lib/labour-facts';
import { downloadBlob } from '@/lib/pdf';
import { statesOf } from '@/lib/status-registry';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Expense, PaymentMethod } from '@/mock/schema';

/** The same three windows the analytics screen offers, so the two agree. */
const RANGES = [3, 6, 12] as const;
type Range = (typeof RANGES)[number];

type StatusFilter = 'all' | 'outstanding' | ExpenseState;

/**
 * Screen 71e — the people behind the costs.
 *
 * The expense list answers «was haben wir bezahlt» and can never answer the
 * question underneath it: what did a job cost us in people, and who is still
 * owed. Both were unanswerable before this wave for a plain reason — the hours
 * did not exist as data. Wages were one monthly lump with a name typed into the
 * supplier box, so «wie viele Stunden hat Marta im März gemacht» was a question
 * for a phone, and «was hat dieser Umzug an Leuten gekostet» had no answer at
 * all.
 *
 * Three tables and they are three different questions, in the order they get
 * asked:
 *
 *  1. every entry — job, person, hours, money, payer, responsible. The chain,
 *     one row at a time, and the only table that can be acted on.
 *  2. by person — «wer hat wie viel gearbeitet, und wer wartet noch aufs Geld»
 *  3. by job — «was hat dieser Auftrag an Leuten gekostet»
 *
 * A separate screen rather than a second mode of /admin/ausgaben, because the
 * columns have nothing in common: that list is receipts and this one is hours.
 * A view switch would have made the category filter above it apply to one shape
 * and not the other. It is one row in the sidebar like every other screen in
 * this panel — the money group carries four now instead of three.
 *
 * Everything on the screen reads one window, chosen at the top. Tiles that
 * summed a year while the table under them showed a quarter is the specific
 * failure the analytics screen wrote its own note about.
 */
export default function WorkforcePage() {
  const t = useTranslations('admin.workforce');
  /* The settle toast comes from the expense list's own namespace, because it
     is the same sentence about the same record — a second wording for «als
     bezahlt erfasst» would make one action read as two. */
  const listT = useTranslations('admin.expenses');
  const appT = useTranslations('app');
  const statusT = useTranslations('status.expense');
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const expenses = useStore((s) => s.data.expenses);
  const bookings = useStore((s) => s.data.bookings);
  const properties = useStore((s) => s.data.properties);
  const team = useStore((s) => s.data.team);
  const markExpensePaid = useStore((s) => s.markExpensePaid);

  const [range, setRange] = useState<Range>(12);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [worker, setWorker] = useState<'all' | string>('all');

  const paying = useExpensePayment();

  const all = useMemo(() => labourExpenses(expenses), [expenses]);

  /*
   * The window, built from the same month keys the analytics chart is drawn
   * from — `financeMonths` ignores the invoices when it comes to which months
   * exist, so passing none of them asks it only for the calendar. That is what
   * makes «Arbeitszeit» here and the «Arbeitszeit» row on /admin/finanzen the
   * same number for the same period rather than two answers a reader has to
   * reconcile.
   */
  const inWindow = useMemo(() => {
    const keys = new Set(financeMonths([], expenses, now, range).map((m) => m.key));
    return all.filter((e) => keys.has(monthKey(new Date(e.incurredAt))));
  }, [all, expenses, now, range]);

  const nameOf = (id: string) => memberName(team.find((m) => m.id === id));

  const jobOf = (id: string) => bookings.find((b) => b.id === id);
  const jobReference = (id: string) => jobOf(id)?.reference ?? '—';
  const jobAddress = (id: string) => {
    const property = properties.find((p) => p.id === jobOf(id)?.propertyId);
    return property ? `${property.street}, ${property.city}` : '—';
  };

  /** Only people with hours in the window — the rule `byWorker` follows. */
  const workers = useMemo(() => {
    const seen = new Set(inWindow.map((e) => e.labour.workerId));
    return team
      .filter((m) => seen.has(m.id))
      .sort((a, b) => memberName(a).localeCompare(memberName(b)));
  }, [inWindow, team]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inWindow
      .filter((e) => (worker === 'all' ? true : e.labour.workerId === worker))
      .filter((e) => {
        const state = effectiveExpenseStatus(e, now);
        if (status === 'all') return true;
        if (status === 'outstanding') return isExpenseOutstanding(state);
        return state === status;
      })
      .filter((e) =>
        q
          ? [e.supplier, e.reference, jobReference(e.bookingId), e.note ?? '']
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => b.incurredAt.localeCompare(a.incurredAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inWindow, bookings, worker, status, query, now]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = status !== 'all' || worker !== 'all' || query.trim() !== '';
  const totals = labourTotals(visible, now);
  const people = byWorker(visible, now);
  const jobs = byJob(visible);

  function resetFilters() {
    setQuery('');
    setStatus('all');
    setWorker('all');
  }

  function confirmPaid(expense: Expense, method: PaymentMethod) {
    markExpensePaid(expense.id, now, method);
    toast.success(listT('paidDone', { reference: expense.reference }));
  }

  /** What is on screen, not everything ever booked — the rule the two other
      finance exports already follow. */
  function download() {
    if (visible.length === 0) {
      toast.error(t('downloadEmpty'));
      return;
    }

    const csv = buildCsv(
      [
        t('colJob'),
        t('colWhen'),
        t('colWorker'),
        t('colHours'),
        t('colAmount'),
        t('colRate'),
        t('colPaidBy'),
        t('colResponsible'),
        t('colStatus'),
      ],
      visible.map((e) => {
        const rate = rateOf(e);
        return [
          jobReference(e.bookingId),
          e.incurredAt.slice(0, 10),
          nameOf(e.labour.workerId),
          /* Plain decimals for both, because the file is opened next to a bank
             statement and summed — «6.5 Std.» is text a spreadsheet refuses to
             add. The units are in the headers. */
          String(e.labour.hours),
          e.amount.toFixed(2),
          rate === null ? '' : rate.toFixed(2),
          nameOf(e.labour.paidById),
          nameOf(e.labour.responsibleId),
          statusT(effectiveExpenseStatus(e, now)),
        ];
      }),
    );

    downloadBlob(exportFilename('arbeitszeit', now), csv);
    toast.success(t('downloadDone', { n: visible.length }));
  }

  const createButton = (
    <Button asChild>
      <Link href="/admin/ausgaben/neu?kategorie=arbeitszeit">
        <Plus className="size-4" aria-hidden />
        {t('newAction')}
      </Link>
    </Button>
  );

  /*
   * The job leads every table, because the chain starts there. It is plain
   * text rather than a link on purpose: `DataView` wraps the primary cell in a
   * button so the row is reachable by keyboard, and an anchor inside a button
   * is a control with two destinations. «Einsatz öffnen» is in the row menu,
   * where every other cross-link in this panel lives.
   */
  const jobCell = (bookingId: string) => (
    <span className="flex flex-col gap-0.5">
      <span data-numeric>{jobReference(bookingId)}</span>
      <span className="text-sm font-normal text-ink-tertiary">{jobAddress(bookingId)}</span>
    </span>
  );

  const entryColumns: Column<LabourExpense>[] = [
    {
      key: 'job',
      header: t('colJob'),
      primary: true,
      sortBy: (e) => jobReference(e.bookingId),
      cell: (e) => jobCell(e.bookingId),
    },
    {
      key: 'when',
      header: t('colWhen'),
      sortBy: (e) => e.incurredAt,
      cell: (e) => (
        <span data-numeric className="text-ink-secondary">
          {format.dateTime(new Date(e.incurredAt), 'short')}
        </span>
      ),
    },
    {
      key: 'worker',
      header: t('colWorker'),
      sortBy: (e) => e.supplier,
      cell: (e) => <span className="font-medium">{nameOf(e.labour.workerId)}</span>,
    },
    {
      key: 'hours',
      header: t('colHours'),
      align: 'end',
      sortBy: (e) => e.labour.hours,
      cell: (e) => <span data-numeric>{t('hours', { hours: e.labour.hours })}</span>,
    },
    {
      key: 'amount',
      header: t('colAmount'),
      align: 'end',
      sortBy: (e) => e.amount,
      cell: (e) => <Money amount={e.amount} />,
    },
    {
      /* Derived, never typed — there is no rate card behind it. `tableOnly`
         because it is the one column a reader can reconstruct from the two
         beside it, and a card with six rows on a phone is already long. */
      key: 'rate',
      header: t('colRate'),
      align: 'end',
      tableOnly: true,
      sortBy: (e) => rateOf(e) ?? 0,
      cell: (e) => {
        const rate = rateOf(e);
        return rate === null ? (
          <span className="text-ink-tertiary">—</span>
        ) : (
          <Money amount={rate} per="hour" emphasis="quiet" />
        );
      },
    },
    {
      key: 'paidBy',
      header: t('colPaidBy'),
      sortBy: (e) => nameOf(e.labour.paidById),
      cell: (e) => <span className="text-sm text-ink-secondary">{nameOf(e.labour.paidById)}</span>,
    },
    {
      key: 'responsible',
      header: t('colResponsible'),
      sortBy: (e) => nameOf(e.labour.responsibleId),
      cell: (e) => (
        <span className="text-sm text-ink-secondary">{nameOf(e.labour.responsibleId)}</span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      sortBy: (e) => statesOf('expense').indexOf(effectiveExpenseStatus(e, now)),
      cell: (e) => <StatusBadge entity="expense" state={effectiveExpenseStatus(e, now)} size="sm" />,
    },
  ];

  const peopleColumns: Column<WorkerTotal>[] = [
    {
      key: 'person',
      header: t('colPerson'),
      primary: true,
      sortBy: (r) => nameOf(r.workerId),
      cell: (r) => (
        <span className="flex flex-col gap-0.5">
          {nameOf(r.workerId)}
          <span className="text-sm font-normal text-ink-tertiary">
            {r.jobs === 1 ? t('jobsCountOne') : t('jobsCount', { n: r.jobs })}
          </span>
        </span>
      ),
    },
    {
      key: 'hours',
      header: t('colHours'),
      align: 'end',
      sortBy: (r) => r.hours,
      cell: (r) => <span data-numeric>{t('hours', { hours: r.hours })}</span>,
    },
    {
      key: 'rate',
      header: t('colRate'),
      align: 'end',
      tableOnly: true,
      sortBy: (r) => r.rate ?? 0,
      cell: (r) =>
        r.rate === null ? (
          <span className="text-ink-tertiary">—</span>
        ) : (
          <Money amount={r.rate} per="hour" emphasis="quiet" />
        ),
    },
    {
      /* What this person is still owed. Its own column rather than a footnote
         on the amount: it is the only number on this card somebody has to act
         on, and it is the reason a person is looked up at all. */
      key: 'outstanding',
      header: t('colOutstanding'),
      align: 'end',
      sortBy: (r) => r.outstanding,
      cell: (r) =>
        r.outstanding > 0 ? (
          <Money amount={r.outstanding} className="text-status-warning-fg" />
        ) : (
          <span className="text-ink-tertiary">—</span>
        ),
    },
    {
      key: 'amount',
      header: t('colAmount'),
      align: 'end',
      trailing: true,
      sortBy: (r) => r.amount,
      cell: (r) => <Money amount={r.amount} />,
    },
  ];

  const jobColumns: Column<JobTotal>[] = [
    {
      key: 'job',
      header: t('colJob'),
      primary: true,
      sortBy: (r) => jobReference(r.bookingId),
      cell: (r) => jobCell(r.bookingId),
    },
    {
      key: 'when',
      header: t('colWhen'),
      sortBy: (r) => r.latestAt,
      cell: (r) => (
        <span data-numeric className="text-ink-secondary">
          {format.dateTime(new Date(r.latestAt), 'short')}
        </span>
      ),
    },
    {
      /* Everybody on the job, which is the fact a booking cannot hold: it has
         one `assigneeId`, and a Saturday has two people on it. */
      key: 'crew',
      header: t('colCrew'),
      cell: (r) => (
        <span className="text-sm text-ink-secondary">
          {r.workerIds.slice(0, 2).map(nameOf).join(', ')}
          {r.workerIds.length > 2 && ` ${t('crewMore', { n: r.workerIds.length - 2 })}`}
        </span>
      ),
    },
    {
      key: 'hours',
      header: t('colHours'),
      align: 'end',
      sortBy: (r) => r.hours,
      cell: (r) => <span data-numeric>{t('hours', { hours: r.hours })}</span>,
    },
    {
      key: 'amount',
      header: t('colAmount'),
      align: 'end',
      trailing: true,
      sortBy: (r) => r.amount,
      cell: (r) => <Money amount={r.amount} />,
    },
  ];

  function entryMenu(entry: LabourExpense) {
    return (
      <RowActions>
        <RowAction href={`/admin/ausgaben/${entry.id}`} label={t('rowOpen')}>
          <ActionIcon.open aria-hidden />
        </RowAction>
        {/* Rule 2 in `action-icons.ts`: a cross-link wears the record type's
            own glyph, never the eye. */}
        <RowAction href={`/admin/buchungen/${entry.bookingId}`} label={t('rowJob')}>
          <ActionIcon.booking aria-hidden />
        </RowAction>
        {entry.status !== 'paid' && (
          <RowActionButton label={t('rowMarkPaid')} onClick={() => paying.ask(entry)}>
            <ActionIcon.invoice aria-hidden />
          </RowActionButton>
        )}
      </RowActions>
    );
  }

  /* Nothing booked anywhere, ever — a different sentence from «nothing in these
     three months», and the only one where the useful action is to record the
     first entry rather than to widen the window. */
  const nothingAtAll = all.length === 0;

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        back={{ href: '/admin/ausgaben', label: t('back') }}
        actions={
          <>
            <label className="inline-flex flex-col">
              <span className="sr-only">{t('rangeLabel')}</span>
              <Select
                dense
                value={String(range)}
                onChange={(e) => setRange(Number(e.target.value) as Range)}
              >
                {RANGES.map((r) => (
                  <option key={r} value={r}>
                    {t(`range${r}`)}
                  </option>
                ))}
              </Select>
            </label>
            <Button variant="secondary" onClick={download}>
              <Download className="size-4" aria-hidden />
              {t('downloadAction')}
            </Button>
            {createButton}
          </>
        }
      />

      {nothingAtAll ? (
        <EmptyState
          icon={Users}
          headingLevel={2}
          title={t('emptyTitle')}
          body={t('emptyBody')}
          action={createButton}
        />
      ) : (
        <>
          <StatGrid className="mb-app-section">
            <StatTile
              label={t('statHours')}
              value={<span data-numeric>{t('hours', { hours: totals.hours })}</span>}
              hint={
                totals.entries === 0
                  ? t('statHoursNone')
                  : t('statHoursHint', { n: totals.entries, jobs: totals.jobs })
              }
              icon={Clock}
            />
            <StatTile
              label={t('statCost')}
              value={<Money amount={totals.amount} />}
              hint={t('statCostHint')}
              icon={Banknote}
              href="/admin/finanzen"
              linkLabel={t('linkAnalytics')}
            />
            <StatTile
              label={t('statRate')}
              value={
                totals.rate === null ? '—' : <Money amount={totals.rate} per="hour" />
              }
              hint={totals.rate === null ? t('statRateNone') : t('statRateHint')}
              icon={Gauge}
            />
            <StatTile
              label={t('statOpen')}
              value={<Money amount={totals.outstanding} />}
              hint={totals.outstanding > 0 ? t('statOpenHint') : t('statOpenNone')}
              icon={Users}
              tone={totals.outstanding > 0 ? 'warning' : 'default'}
            />
          </StatGrid>

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
                ? appT('results', { shown: visible.length, total: inWindow.length })
                : appT('resultsAll', { total: inWindow.length })
            }
            filters={
              <>
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

          <Card className="mb-app-section">
            <CardHeader title={t('tableTitle')} description={t('tableLead')} />
            <CardBody>
              <DataView
                items={visible}
                columns={entryColumns}
                surface="plain"
                stickyHeader={false}
                getKey={(e) => e.id}
                onSelect={(e) => router.push(`/admin/ausgaben/${e.id}`)}
                caption={t('tableTitle')}
                openLabel={t('rowOpen')}
                rowActions={entryMenu}
                empty={
                  filtering ? (
                    <EmptyState
                      icon={Users}
                      compact
                      headingLevel={3}
                      title={t('filterEmptyTitle')}
                      body={t('filterEmptyBody')}
                      action={
                        <Button variant="secondary" onClick={resetFilters}>
                          {t('filterReset')}
                        </Button>
                      }
                    />
                  ) : (
                    /* The window is empty but the company is not — so the way
                       out is a longer period, not a new entry. */
                    <EmptyState
                      icon={Clock}
                      compact
                      headingLevel={3}
                      title={t('windowEmptyTitle')}
                      body={t('windowEmptyBody')}
                    />
                  )
                }
              />
            </CardBody>
          </Card>

          <div className="grid gap-app-section lg:grid-cols-12">
            <Card className="lg:col-span-6">
              <CardHeader title={t('peopleTitle')} description={t('peopleLead')} />
              <CardBody>
                <DataView
                  items={people}
                  columns={peopleColumns}
                  surface="plain"
                  stickyHeader={false}
                  getKey={(r) => r.workerId}
                  onSelect={(r) => router.push(`/admin/benutzer/${r.workerId}`)}
                  caption={t('peopleTitle')}
                  openLabel={t('rowPerson')}
                  empty={
                    <EmptyState
                      icon={Users}
                      compact
                      headingLevel={3}
                      title={t('windowEmptyTitle')}
                      body={t('windowEmptyBody')}
                    />
                  }
                />
              </CardBody>
            </Card>

            <Card className="lg:col-span-6">
              <CardHeader title={t('jobsTitle')} description={t('jobsLead')} />
              <CardBody>
                <DataView
                  items={jobs}
                  columns={jobColumns}
                  surface="plain"
                  stickyHeader={false}
                  getKey={(r) => r.bookingId}
                  onSelect={(r) => router.push(`/admin/buchungen/${r.bookingId}`)}
                  caption={t('jobsTitle')}
                  openLabel={t('rowJob')}
                  empty={
                    <EmptyState
                      icon={Clock}
                      compact
                      headingLevel={3}
                      title={t('windowEmptyTitle')}
                      body={t('windowEmptyBody')}
                    />
                  }
                />
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {/* The same dialog the expense list settles with, so a payout marked here
          and one marked there record the same two facts. */}
      <ExpensePaidDialog payment={paying} onConfirm={confirmPaid} />
    </div>
  );
}
