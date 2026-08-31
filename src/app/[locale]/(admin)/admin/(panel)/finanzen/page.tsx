'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { BarChart3, Download, Info, Receipt, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatGrid, StatTile } from '@/components/ui/stat';
import { FinanceTabs } from '@/components/admin/finance-tabs';
import { buildCsv, exportFilename } from '@/lib/csv';
import { costsByCategory, monthlyCommitment } from '@/lib/expense-facts';
import { billedInvoices, financeMonths, monthKey, outstandingSum } from '@/lib/finance-facts';
import { downloadBlob } from '@/lib/pdf';
import { cn } from '@/lib/cn';
import { useHydrated, useNow, useStore } from '@/mock/store';

/** Three windows, and twelve is the one that shows a whole year of seasons. */
const RANGES = [3, 6, 12] as const;
type Range = (typeof RANGES)[number];

/**
 * Screen 71b — what is actually left.
 *
 * The panel could say what came in (screen 71) and, as of this wave, what went
 * out (71c). Neither answers the question an owner opens a money section to
 * ask, because that question is the two of them subtracted — and until now it
 * was answered in a banking app, monthly, from memory.
 *
 * Three things are on the screen and nothing else is:
 *
 *  1. the four numbers, for the chosen window
 *  2. the year as a shape, so a bad month is seen rather than searched for
 *  3. where the costs go, largest first
 *
 * The arithmetic is not here — it is in `lib/finance-facts.ts`, with the
 * counting rule written out. Both sides are counted by the month the work
 * happened in rather than the month the money moved, which is the only way one
 * month is comparable to the one before it. That decision is also *on the
 * screen*, in a card above the numbers: a margin whose basis is invisible is a
 * number the reader will quietly assume the wrong thing about.
 */
export default function FinanceAnalyticsPage() {
  const t = useTranslations('admin.finance');
  const expenseT = useTranslations('admin.expenses');
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const invoices = useStore((s) => s.data.invoices);
  const expenses = useStore((s) => s.data.expenses);

  const [range, setRange] = useState<Range>(12);

  const months = useMemo(
    () => financeMonths(invoices, expenses, now, range),
    [invoices, expenses, now, range],
  );

  /* The window's own rows, selected by the same month keys the chart is built
     from. Filtering by "later than N months ago" instead would let a receipt
     dated the 31st fall in or out of the tiles without moving on the chart —
     two numbers on one screen disagreeing about which month it is. */
  const inWindow = useMemo(() => {
    const keys = new Set(months.map((m) => m.key));
    return {
      invoices: billedInvoices(invoices).filter((i) => keys.has(monthKey(new Date(i.issuedAt)))),
      expenses: expenses.filter((e) => keys.has(monthKey(new Date(e.incurredAt)))),
    };
  }, [months, invoices, expenses]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const revenue = months.reduce((sum, m) => sum + m.revenue, 0);
  const costs = months.reduce((sum, m) => sum + m.costs, 0);
  const profit = revenue - costs;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : null;

  const outstanding = outstandingSum(invoices, now);
  /* The fixed costs of *one* month, not of the window: «was läuft weiter» is a
     monthly figure, and summing a year of rents would answer a question nobody
     asked with a number four figures too big. */
  const commitment = monthlyCommitment(
    expenses.filter((e) => monthKey(new Date(e.incurredAt)) === monthKey(now)),
  );

  const categories = costsByCategory(inWindow.expenses);
  const scale = Math.max(...months.map((m) => Math.max(m.revenue, m.costs)), 1);
  const current = monthKey(now);
  const nothingYet = revenue === 0 && costs === 0;

  /**
   * The window as a month-by-month file, not the receipts behind it.
   *
   * The two lists already download their own rows; what this button is for is
   * the thing neither of them can produce — the two sides beside each other. It
   * exports what the table below shows, so the file and the screen can be laid
   * side by side and checked against one another.
   */
  function download() {
    const csv = buildCsv(
      [t('colMonth'), t('colRevenue'), t('colCosts'), t('colProfit')],
      months.map((m) => [
        m.key,
        m.revenue.toFixed(2),
        m.costs.toFixed(2),
        m.profit.toFixed(2),
      ]),
    );
    downloadBlob(exportFilename(`finanzen-${range}m`, now), csv);
    toast.success(t('downloadDone', { n: months.length }));
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
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
          </>
        }
      />

      <FinanceTabs />

      <StatGrid className="mb-app-section">
        <StatTile
          label={t('statRevenue')}
          value={<Money amount={revenue} />}
          hint={t('statRevenueHint', { n: inWindow.invoices.length })}
          icon={Receipt}
          href="/admin/rechnungen"
          linkLabel={t('tabs.invoices')}
        />
        <StatTile
          label={t('statCosts')}
          value={<Money amount={costs} />}
          hint={t('statCostsHint', { n: inWindow.expenses.length })}
          icon={Wallet}
          href="/admin/ausgaben"
          linkLabel={t('tabs.expenses')}
        />
        <StatTile
          /* The label changes with the sign rather than the number wearing a
             minus in front of the word «Gewinn». «Gewinn: −CHF 240» is a
             sentence the eye reads as a profit before it reaches the sign. */
          label={profit < 0 ? t('statLoss') : t('statProfit')}
          value={<Money amount={profit} />}
          hint={
            margin === null
              ? t('statProfitNoRevenue')
              : t('statProfitHint', { percent: margin })
          }
          icon={profit < 0 ? TrendingDown : TrendingUp}
          tone={profit < 0 ? 'danger' : 'success'}
        />
        <StatTile
          label={t('statOutstanding')}
          value={<Money amount={outstanding} />}
          hint={outstanding > 0 ? t('statOutstandingHint') : t('statOutstandingNone')}
          icon={Receipt}
          tone={outstanding > 0 ? 'warning' : 'default'}
          href="/admin/rechnungen"
          linkLabel={t('tabs.invoices')}
        />
      </StatGrid>

      {/* The counting rule, above the chart rather than in a footnote under it.
          Anybody who reads a margin has to know first what is not in the costs,
          and «der eigene Lohn steckt nicht drin» is the half that would
          otherwise be assumed the other way. */}
      <Card tone="muted" className="mb-app-section">
        <div className="flex gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
          <div className="min-w-0 space-y-2">
            <h2 className="font-medium">{t('basisTitle')}</h2>
            <p className="max-w-[var(--measure)] text-sm text-ink-secondary">{t('basisBody')}</p>
            <p className="max-w-[var(--measure)] text-sm text-ink-secondary">{t('basisOwner')}</p>
            {commitment > 0 && (
              <p className="text-sm text-ink-secondary">
                {t('statCommitment')}: <Money amount={commitment} per="month" /> —{' '}
                {t('statCommitmentHint')}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="mb-app-section">
        <CardHeader title={t('chartTitle')} description={t('chartLead')} />
        <CardBody>
          {nothingYet ? (
            <EmptyState
              icon={BarChart3}
              compact
              title={t('chartEmptyTitle')}
              body={t('chartEmptyBody')}
            />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="size-3 rounded-[var(--radius-xs)] bg-accent" aria-hidden />
                  {t('chartRevenue')}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-3 rounded-[var(--radius-xs)] bg-ink-tertiary"
                    aria-hidden
                  />
                  {t('chartCosts')}
                </span>
              </div>

              {/*
                The picture, and it is only the picture.

                `aria-hidden`, because the table underneath is the same numbers
                in a form that can be read out — and a bar chart announced as
                fifty-odd unlabelled divs is worse than one skipped. The two are
                built from one array, so they cannot disagree.

                It scrolls rather than squeezing: twelve months of paired bars
                below `sm` would put each one under two pixels wide, which is a
                chart that technically fits and says nothing.
              */}
              <div aria-hidden className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="flex min-w-[34rem] items-end gap-2">
                  {months.map((month) => (
                    <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                      <div className="flex h-40 w-full items-end justify-center gap-1">
                        <span
                          className="w-full max-w-5 rounded-t-[var(--radius-xs)] bg-accent"
                          style={{ height: `${Math.max((month.revenue / scale) * 100, 1)}%` }}
                        />
                        <span
                          className="w-full max-w-5 rounded-t-[var(--radius-xs)] bg-ink-tertiary"
                          style={{ height: `${Math.max((month.costs / scale) * 100, 1)}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          'w-full truncate text-center text-xs',
                          month.key === current ? 'font-medium text-ink' : 'text-ink-tertiary',
                        )}
                      >
                        {format.dateTime(month.at, { month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-app-section lg:grid-cols-12">
        {/*
          The table is the chart's exact half — the one that can be read aloud
          — so on launch day it goes with the chart rather than standing beside
          its empty state printing twelve rows of CHF 0.–.

          Found by looking: the chart said «noch nichts zu rechnen» and the card
          under it answered the same question twelve times with a zero. One
          screen, two answers. The categories card stays: its own empty state is
          a different sentence, about the period rather than about the company.
        */}
        {!nothingYet && (
        <Card className="lg:col-span-7">
          <CardHeader title={t('tableTitle')} description={t('tableLead')} />
          <CardBody>
            {/* A plain table rather than `DataView`: it is twelve rows that are
                never searched, never sorted and never opened, and a card
                rendering of a month's three figures would be three lines where
                one row already fits on a phone. */}
            <div className="-mx-2 overflow-x-auto px-2">
              <table className="w-full min-w-[22rem] border-collapse text-sm">
                <caption className="sr-only">{t('tableTitle')}</caption>
                <thead>
                  <tr className="border-b border-line-subtle text-left">
                    <th scope="col" className="py-2 pe-3 font-medium text-ink-secondary">
                      {t('colMonth')}
                    </th>
                    <th scope="col" className="py-2 pe-3 text-end font-medium text-ink-secondary">
                      {t('colRevenue')}
                    </th>
                    <th scope="col" className="py-2 pe-3 text-end font-medium text-ink-secondary">
                      {t('colCosts')}
                    </th>
                    <th scope="col" className="py-2 text-end font-medium text-ink-secondary">
                      {t('colProfit')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((month) => (
                    <tr key={month.key} className="border-b border-line-subtle last:border-0">
                      <th scope="row" className="py-2 pe-3 text-left font-normal">
                        {format.dateTime(month.at, { month: 'short', year: 'numeric' })}
                        {month.key === current && (
                          <span className="ms-2 text-xs text-ink-tertiary">
                            {t('chartCurrent')}
                          </span>
                        )}
                      </th>
                      <td className="py-2 pe-3 text-end">
                        <Money amount={month.revenue} emphasis="quiet" />
                      </td>
                      <td className="py-2 pe-3 text-end">
                        <Money amount={month.costs} emphasis="quiet" />
                      </td>
                      <td
                        className={cn(
                          'py-2 text-end font-medium',
                          month.profit < 0 && 'text-status-danger-fg',
                        )}
                      >
                        <Money amount={month.profit} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
        )}

        <Card className={nothingYet ? 'lg:col-span-12' : 'lg:col-span-5'}>
          <CardHeader title={t('categoriesTitle')} description={t('categoriesLead')} />
          <CardBody>
            {categories.length === 0 ? (
              <EmptyState
                icon={Wallet}
                compact
                title={t('categoriesEmptyTitle')}
                body={t('categoriesEmptyBody')}
              />
            ) : (
              <ul className="space-y-4">
                {categories.map((row) => (
                  <li key={row.category}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-medium">
                        {expenseT(`categories.${row.category}`)}
                      </span>
                      <Money amount={row.total} />
                    </div>
                    {/* The bar is proportion, not a second number — the figure
                        beside it is already exact, and this is what makes
                        «Löhne sind das Doppelte von Material» readable without
                        dividing. */}
                    <div
                      aria-hidden
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sunken"
                    >
                      <span
                        className="block h-full rounded-full bg-ink-tertiary"
                        style={{ width: `${Math.max(row.share * 100, 1.5)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-sm text-ink-tertiary">
                      {t('categoryShare', { percent: Math.round(row.share * 100) })} ·{' '}
                      {row.count === 1
                        ? t('categoryCountOne')
                        : t('categoryCount', { n: row.count })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
