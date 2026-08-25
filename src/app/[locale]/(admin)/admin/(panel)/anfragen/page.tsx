'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { Plus, Search, X } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { RejectRequestDialog } from '@/components/admin/reject-request-dialog';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  ConfirmDialog,
  useConfirmTarget,
  useDismissLabel,
} from '@/components/ui/confirm-dialog';
import { DataView, type Column } from '@/components/ui/data-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import {
  RowAction,
  RowActionButton,
  RowActions,
  RowActionsDivider,
} from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toolbar } from '@/components/ui/toolbar';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { ActionIcon } from '@/lib/action-icons';
import { statesOf } from '@/lib/status-registry';
import { deadlineFor, elapsed, overdueDays } from '@/lib/elapsed';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { ServiceRequest } from '@/mock/schema';
import { cn } from '@/lib/cn';

/** Statuses still waiting on us, and so the only ones that can breach §4.1. */
const OPEN_STATES: readonly string[] = ['new', 'inReview'];

/**
 * Screen 52 — the queue.
 *
 * A list of requests sorted by arrival is a log, not a queue. What makes it a
 * queue is knowing which one is late: §4.1 promises an answer inside a stated
 * window, so every open request has a deadline and the ones past it are the
 * work. Both are derived from `settings.responseTimeHours` rather than stored,
 * which means changing the promise re-prioritises the whole list instead of
 * only what arrives after the change.
 *
 * "What is late" is a tab rather than a filter, because it is a different
 * queue and not a narrower one — see `tab` below. The filters underneath it
 * are the four questions asked of whichever queue is open: status, service,
 * area and date range. Each narrows the count in the toolbar, so a filter that
 * matched nothing reads as a filter rather than as a broken screen.
 */
export default function RequestsPage() {
  const t = useTranslations('admin.requests');
  const appT = useTranslations('app');
  const statusLabel = useTranslations('status.request');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const requests = useStore((s) => s.data.requests);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const offers = useStore((s) => s.data.offers);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const discardRequestDraft = useStore((s) => s.discardRequestDraft);

  const dismissLabel = useDismissLabel();
  const discarding = useConfirmTarget<ServiceRequest>();
  const [status, setStatus] = useState('all');
  const [service, setService] = useState('all');
  const [region, setRegion] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  /*
   * "Which of these is late" is a view of the queue, not a filter on it. As a
   * toggle among the selects it read as one more narrowing — and the count it
   * answers sat somewhere else entirely, in the result line under the toolbar,
   * so the number and the switch that acts on it never appeared together. Two
   * tabs put them in the same control, the way /admin/kunden already does.
   */
  const [tab, setTab] = useState<'all' | 'overdue'>('all');
  const [query, setQuery] = useState('');
  /* Declining used to be a page. It is a decision made about a row while
     looking at the queue, so it happens over the queue — see the dialog. */
  const [rejecting, setRejecting] = useState<string | null>(null);

  const customerOf = (id: string) => customers.find((c) => c.id === id);
  const nameOf = (id: string) => {
    const c = customerOf(id);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };
  const propertyOf = (id: string) => properties.find((p) => p.id === id);

  /** Whole days past the promise. 0 for anything already answered or drafted. */
  const lateDays = (r: ServiceRequest) =>
    OPEN_STATES.includes(r.status)
      ? overdueDays(r.createdAt, settings.responseTimeHours, now)
      : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    /* <input type="date"> gives YYYY-MM-DD and createdAt is a full ISO string;
       comparing the first ten characters keeps the range on calendar days
       rather than drifting by a timezone offset. */
    const fromKey = from || null;
    const toKey = to || null;

    return requests
      .filter((r) => (status === 'all' ? true : r.status === status))
      .filter((r) => (service === 'all' ? true : r.serviceSlug === service))
      .filter((r) =>
        region === 'all' ? true : propertyOf(r.propertyId)?.postcode === region,
      )
      .filter((r) => (fromKey ? r.createdAt.slice(0, 10) >= fromKey : true))
      .filter((r) => (toKey ? r.createdAt.slice(0, 10) <= toKey : true))
      .filter((r) => (tab === 'overdue' ? lateDays(r) > 0 : true))
      .filter((r) => {
        if (!q) return true;
        const c = customerOf(r.customerId);
        return (
          r.reference.toLowerCase().includes(q) ||
          nameOf(r.customerId).toLowerCase().includes(q) ||
          (c?.email ?? '').toLowerCase().includes(q) ||
          (c?.phone ?? '').includes(q)
        );
      })
      .sort((a, b) => {
        /* Late first, most overdue at the top — the list opens on the work.
           Ties keep the newest-first order the screen had before. */
        const diff = lateDays(b) - lateDays(a);
        return diff !== 0 ? diff : b.createdAt.localeCompare(a.createdAt);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    requests,
    customers,
    properties,
    status,
    service,
    region,
    from,
    to,
    tab,
    query,
    settings.responseTimeHours,
    now,
  ]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  /* The tab is deliberately not in here. It picks which queue you are looking
     at; these pick which rows survive inside it — so an empty overdue tab has
     to say "nothing is late", not "no result for your filters", and «Filter
     zurücksetzen» must not silently move you back to the other tab. */
  const filtering =
    Boolean(query) ||
    status !== 'all' ||
    service !== 'all' ||
    region !== 'all' ||
    Boolean(from) ||
    Boolean(to);

  const overdueTotal = requests.filter((r) => lateDays(r) > 0).length;
  /* "3 von 18" has to count against the tab you are in, not the whole queue —
     on the overdue tab the queue total is not a denominator anything on screen
     adds up to. */
  const tabTotal = tab === 'overdue' ? overdueTotal : requests.length;

  /** One-off, plan wanted, or already on a plan — §3 prices these apart. */
  const kindOf = (r: ServiceRequest) => {
    if (r.status === 'draft') return { label: t('kindDraft'), tone: 'neutral' as const };
    if (r.planIntent) return { label: t('kindRecurring'), tone: 'accent' as const };
    if (subscriptions.some((s) => s.customerId === r.customerId && s.status === 'active'))
      return { label: t('kindSubscriber'), tone: 'accent' as const };
    return { label: t('kindOneOff'), tone: 'quiet' as const };
  };

  function reset() {
    setStatus('all');
    setService('all');
    setRegion('all');
    setFrom('');
    setTo('');
    setQuery('');
  }

  const addButton = (
    <Button asChild>
      <Link href="/admin/anfragen/neu">
        <Plus className="size-4" aria-hidden />
        {t('addAction')}
      </Link>
    </Button>
  );

  /*
   * The date range sits beside the CTA rather than in the filter row.
   *
   * That row was carrying eight controls, and the two date inputs are the
   * widest things in it by a distance — so on an ordinary panel width they
   * pushed everything after them onto a second line, which is how the
   * overdue toggle ended up orphaned at the end of a row it did not look
   * like it belonged to. Up here the range balances a header that was a
   * title and one button, and the row below is one line of same-shaped
   * controls again.
   *
   * «Clear filters» still clears it: a range is a filter wherever it is
   * drawn, and leaving it behind would mean the reset button lies.
   */
  const dateRange = (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-sm">
        <span className="text-ink-tertiary">{t('filterFrom')}</span>
        <Input
          dense
          type="date"
          value={from}
          max={to || undefined}
          className="w-auto"
          onChange={(e) => setFrom(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-1.5 text-sm">
        <span className="text-ink-tertiary">{t('filterTo')}</span>
        <Input
          dense
          type="date"
          value={to}
          min={from || undefined}
          className="w-auto"
          onChange={(e) => setTo(e.target.value)}
        />
      </label>
    </div>
  );

  const columns: Column<ServiceRequest>[] = [
    {
      key: 'reference',
      header: t('colReference'),
      sortBy: (r) => r.reference,
      cell: (r) => (
        <span data-numeric className="text-ink-secondary">
          {r.reference}
        </span>
      ),
    },
    {
      key: 'customer',
      header: t('colCustomer'),
      primary: true,
      sortBy: (r) => nameOf(r.customerId),
      /* The name, and nothing beside it. It used to carry a warning chip with
         the postcode whenever the request was out of area — a flag on the
         *person* for something about the address, on a queue where such a
         request can no longer arrive: the coverage check now refuses it at
         intake, on both the public wizard and the phone form. */
      cell: (r) => nameOf(r.customerId),
    },
    {
      /* The office rings back far more often than it writes. Having the number
         in the row is the difference between one click and three — and the
         links stop propagation so tapping a number does not also open the row. */
      key: 'contact',
      header: t('colContact'),
      tableOnly: true,
      sortBy: (r) => customerOf(r.customerId)?.email ?? '',
      cell: (r) => {
        const c = customerOf(r.customerId);
        if (!c) return <span className="text-ink-tertiary">—</span>;
        return (
          <span className="block max-w-52 text-sm">
            <a
              href={`tel:${c.phone.replace(/\s/g, '')}`}
              data-numeric
              className="block text-ink-secondary underline-offset-4 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {c.phone}
            </a>
            <a
              href={`mailto:${c.email}`}
              className="block truncate text-ink-tertiary underline-offset-4 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {c.email}
            </a>
          </span>
        );
      },
    },
    {
      key: 'service',
      header: t('colService'),
      sortBy: (r) => r.serviceSlug,
      cell: (r) => services.find((s) => s.slug === r.serviceSlug)?.name[locale] ?? '—',
    },
    {
      key: 'kind',
      header: t('colKind'),
      sortBy: (r) => kindOf(r).label,
      cell: (r) => {
        const kind = kindOf(r);
        return (
          <span
            className={cn(
              'text-sm',
              kind.tone === 'accent' && 'text-ink-accent',
              kind.tone === 'quiet' && 'text-ink-secondary',
              kind.tone === 'neutral' && 'text-ink-tertiary',
            )}
          >
            {kind.label}
          </span>
        );
      },
    },
    {
      key: 'region',
      header: t('colRegion'),
      tableOnly: true,
      sortBy: (r) => propertyOf(r.propertyId)?.city ?? '',
      cell: (r) => propertyOf(r.propertyId)?.city ?? '—',
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      sortBy: (r) => r.status,
      cell: (r) => <StatusBadge entity="request" state={r.status} size="sm" />,
    },
    {
      key: 'received',
      header: t('colReceived'),
      align: 'end',
      sortBy: (r) => r.createdAt,
      cell: (r) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {elapsed(r.createdAt, now, locale)}
        </span>
      ),
    },
    {
      key: 'deadline',
      header: t('colDeadline'),
      align: 'end',
      /* Sorts by lateness rather than by date: the column exists to answer
         "which one next", and two requests can share a deadline. */
      sortBy: (r) => lateDays(r),
      cell: (r) => {
        if (!OPEN_STATES.includes(r.status)) {
          return <span className="text-sm text-ink-tertiary">{t('noDeadline')}</span>;
        }
        const days = lateDays(r);
        const due = deadlineFor(r.createdAt, settings.responseTimeHours);
        if (days > 0) {
          return (
            <span
              data-numeric
              className="text-sm font-medium text-status-danger-fg"
              title={t('dueIn', { date: format.dateTime(due, 'short') })}
            >
              {t('overdueBy', { days })}
            </span>
          );
        }
        const sameDay = due.toDateString() === now.toDateString();
        return (
          <span
            data-numeric
            className={cn('text-sm', sameDay ? 'text-status-warning-fg' : 'text-ink-tertiary')}
          >
            {sameDay ? t('dueToday') : t('dueIn', { date: format.dateTime(due, 'short') })}
          </span>
        );
      },
    },
  ];

  /* One list, rendered under whichever tab is open. Radix wants a panel per
     trigger, and the rows are the same rows — only `filtered` differs. */
  const list = (
    <DataView
      items={filtered}
      columns={columns}
      getKey={(r) => r.id}
      onSelect={(r) =>
        /* A draft opens where it was left, not on a detail screen that would
           show a half-filled record as if it were a real request. */
        router.push(
          r.status === 'draft'
            ? `/admin/anfragen/neu?draft=${r.id}`
            : `/admin/anfragen/${r.id}`,
        )
      }
      caption={t('title')}
      /*
       * Every way out of a row is on the row — including the two that end it.
       * They were behind a menu, which cost two clicks and a guess about what
       * the menu held.
       *
       * What keeps "decline" from being a mis-click away from "open": it is
       * last, behind a divider, and it turns red under the pointer. Neither
       * one fires on the spot either — decline opens a dialog that asks for
       * a reason, discard asks first.
       */
      rowActions={(r) => {
        const offer = offers.find((o) => o.requestId === r.id && o.status !== 'draft');
        const answerable = r.status === 'new' || r.status === 'inReview';
        const draft = r.status === 'draft';

        return (
          <RowActions>
            {draft ? (
              <>
                <RowAction
                  href={`/admin/anfragen/neu?draft=${r.id}`}
                  label={t('rowContinue')}
                >
                  <ActionIcon.edit aria-hidden />
                </RowAction>
                <RowActionsDivider />
                <RowActionButton
                  tone="danger"
                  label={t('rowDiscard')}
                  onClick={() => discarding.ask(r)}
                >
                  <ActionIcon.delete aria-hidden />
                </RowActionButton>
              </>
            ) : (
              <>
                <RowAction href={`/admin/anfragen/${r.id}`} label={t('rowOpen')}>
                  <ActionIcon.open aria-hidden />
                </RowAction>
                {answerable && (
                  <RowAction
                    href={`/admin/anfragen/${r.id}/offerte`}
                    label={t('rowQuote')}
                  >
                    <ActionIcon.sendOffer aria-hidden />
                  </RowAction>
                )}
                {offer && (
                  <RowAction
                    href={`/admin/offerten/${offer.id}`}
                    label={t('rowOffer')}
                  >
                    <ActionIcon.offer aria-hidden />
                  </RowAction>
                )}
                {answerable && (
                  <>
                    <RowActionsDivider />
                    <RowActionButton
                      onClick={() => setRejecting(r.id)}
                      label={t('rowReject')}
                      tone="danger"
                    >
                      <ActionIcon.decline aria-hidden />
                    </RowActionButton>
                  </>
                )}
              </>
            )}
          </RowActions>
        );
      }}
      empty={
        filtering ? (
          <EmptyState
            icon={Search}
            title={t('searchEmptyTitle')}
            body={t('searchEmptyBody', { query: query || '—' })}
            action={
              <Button variant="secondary" onClick={reset}>
                {t('filterReset')}
              </Button>
            }
          />
        ) : tab === 'overdue' ? (
          /* Nothing late is the good outcome, and the queue's own empty state
             would have called it the bad one — "Noch keine Anfragen" on a
             screen listing eighteen of them. It offers the way back to the
             full queue rather than "record a request", because the answer to
             an empty overdue tab is not to create work. */
          <EmptyState
            title={t('overdueEmptyTitle')}
            body={t('overdueEmptyBody')}
            action={
              <Button variant="secondary" onClick={() => setTab('all')}>
                {t('tabAll')}
              </Button>
            }
          />
        ) : (
          <EmptyState title={t('emptyTitle')} body={t('emptyBody')} action={addButton} />
        )
      }
    />
  );

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        actions={
          <>
            {dateRange}
            {addButton}
          </>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
      >
        <Toolbar
          search={{
            value: query,
            onChange: setQuery,
            label: t('search'),
            clearLabel: appT('clearSearch'),
          }}
          /* Where "18 Einträge" used to sit on its own. That line restated a
             total the tabs now carry, and the overdue count was appended to it
             in red — a number the screen exists to keep at zero, printed three
             centimetres from the only control that acts on it. */
          views={
            <TabsList className="p-0.5">
              <TabsTrigger value="all" className="h-8 gap-1.5 px-2.5 py-0">
                {t('tabAll')}
                <span data-numeric className="text-ink-tertiary">
                  {requests.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="overdue" className="h-8 gap-1.5 px-2.5 py-0">
                {t('tabOverdue')}
                {overdueTotal > 0 && (
                  <span data-numeric className="font-medium text-status-danger-fg">
                    {overdueTotal}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          }
          /* Only while filtering. Unfiltered it read "18 Einträge" beside a tab
             already saying 18; under a filter it is the one thing on screen
             that confirms the search box did anything, so it stays. */
          count={
            filtering
              ? appT('results', { shown: filtered.length, total: tabTotal })
              : null
          }
          filters={
            <>
              <label className="min-w-36">
                <span className="sr-only">{t('filterStatus')}</span>
                <Select
                  dense
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">
                    {t('filterStatus')}: {t('filterAll')}
                  </option>
                  {/* Labels come from the status registry, not the enum — the
                      filter and the badge it filters must read identically. */}
                  {statesOf('request').map((state) => (
                    <option key={state} value={state}>
                      {statusLabel(state)}
                    </option>
                  ))}
                </Select>
              </label>
  
              <label className="min-w-36">
                <span className="sr-only">{t('filterService')}</span>
                <Select
                  dense
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="all">
                    {t('filterService')}: {t('filterAll')}
                  </option>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name[locale]}
                    </option>
                  ))}
                </Select>
              </label>
  
              <label className="min-w-36">
                <span className="sr-only">{t('filterRegion')}</span>
                <Select
                  dense
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="all">
                    {t('filterRegion')}: {t('filterAll')}
                  </option>
                  {SERVED_REGIONS.map((r) => (
                    <option key={r.postcode} value={r.postcode}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </label>
  
              {filtering && (
                <Button size="sm" variant="ghost" onClick={reset}>
                  <X className="size-3.5" aria-hidden />
                  {t('filterReset')}
                </Button>
              )}
            </>
          }
        />

        {/* `mt-app` off both panels: the Toolbar already carries `mb-app`, and
            stacking the two put a double gap between the filter row and the
            first row of the table. */}
        <TabsContent value="all" className="mt-0">
          {list}
        </TabsContent>
        <TabsContent value="overdue" className="mt-0">
          {list}
        </TabsContent>
      </Tabs>

      <RejectRequestDialog requestId={rejecting} onClose={() => setRejecting(null)} />

      {/* Was a `window.confirm`, which is the one control on this screen the
          theme could not reach and the dictionary could not translate. */}
      <ConfirmDialog
        open={discarding.open}
        onOpenChange={(open) => !open && discarding.dismiss()}
        title={t('rowDiscardConfirmTitle')}
        body={t('rowDiscardConfirm')}
        action={t('rowDiscard')}
        dismiss={dismissLabel}
        onConfirm={() => {
          const draft = discarding.target;
          if (!draft) return;
          discarding.dismiss();
          /* A draft has no quote, booking or invoice hanging off it, which is
             the only reason a straight delete is safe here. The store guards
             the same rule. */
          discardRequestDraft(draft.id);
          toast.success(t('rowDiscardDone'));
        }}
      />
    </div>
  );
}
