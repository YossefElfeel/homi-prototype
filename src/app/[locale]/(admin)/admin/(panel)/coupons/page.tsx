'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { Archive, Info, Plus, TicketPercent } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
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
import {
  RowAction,
  RowActionButton,
  RowActions,
  RowActionsDivider,
} from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toolbar } from '@/components/ui/toolbar';
import { ActionIcon } from '@/lib/action-icons';
import { couponServiceNames, couponState, type CouponState } from '@/lib/coupon-facts';
import { statesOf } from '@/lib/status-registry';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Coupon } from '@/mock/schema';

type StateFilter = 'all' | CouponState;
type Tab = 'active' | 'archived';

/**
 * Screen 76 — coupons.
 *
 * The list used to be empty in every scenario, and the empty state argued that
 * this was the point: discount messaging reads cheap in this market rather
 * than attractive. That argument is still on the screen, under the heading,
 * where the office reads it before writing a code. What it can no longer do is
 * stand in for the table — a recommendation to use something sparingly is not
 * a reason for the screen that manages it to have never been seen holding a
 * row.
 *
 * Five seeded codes now carry the five states between them, which is what
 * turned the status column from a ternary into a registry entry: expired,
 * fully redeemed and disabled had been sharing one grey chip, and "starts
 * later" did not exist at all — a code written for a campaign three weeks out
 * read as valid today.
 *
 * With rows in it the table needed the three things every other admin list
 * has: something to search, something to filter by, and the one decision that
 * is worth taking without opening a record.
 *
 * The row ended in a chevron, which is where every other admin list keeps its
 * actions menu. A chevron is a picture of the click the whole row already
 * takes — it names nothing and it can hold nothing — so a code that was over
 * had no way off this screen at all: the office switched it off and left it in
 * the table for ever, which is how a list of five codes becomes a list of
 * thirty nobody reads. It is now the same one-button menu the rest of the
 * panel carries.
 *
 * What that menu offers is «archivieren», not «löschen», and the difference is
 * the whole point. A redeemed code is the only record of why an invoice that
 * went out months ago carries a deduction, so deleting one from the working
 * list destroys an explanation to tidy a table. Archiving takes the row off
 * the desk and keeps the record; the «Archiv» tab is where it lands, and
 * deleting for good is offered there and only there — the same position
 * /admin/customers takes, for the same reason.
 */
export default function AdminCouponsPage() {
  const t = useTranslations('admin.coupons');
  const appT = useTranslations('app');
  const statusT = useTranslations('status.coupon');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const coupons = useStore((s) => s.data.coupons);
  const services = useStore((s) => s.services);
  const setCouponActive = useStore((s) => s.setCouponActive);
  const setCouponArchived = useStore((s) => s.setCouponArchived);
  const deleteCoupon = useStore((s) => s.deleteCoupon);
  const dismissLabel = useDismissLabel();
  /* Two questions, two held rows — `useConfirmTarget` keeps the row alive for
     the length of the exit animation, so the code being asked about does not
     vanish out of the sentence asking about it. */
  const archiving = useConfirmTarget<Coupon>();
  const deleting = useConfirmTarget<Coupon>();

  const [query, setQuery] = useState('');
  const [state, setState] = useState<StateFilter>('all');
  /*
   * The archive has to be somewhere you can look. A soft delete with no view
   * of what it swallowed is indistinguishable from a real one — right up to
   * the day somebody asks which code took CHF 40 off an invoice last winter.
   */
  const [tab, setTab] = useState<Tab>('active');

  const inTab = useMemo(
    () => coupons.filter((c) => (tab === 'archived' ? Boolean(c.archivedAt) : !c.archivedAt)),
    [coupons, tab],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inTab
      .filter((c) => (state === 'all' ? true : couponState(c, now) === state))
      .filter((c) =>
        q
          ? /*
             * Code first, because that is what somebody is holding when they
             * ring up — «wir haben hier WELCOME10» is the whole question. The
             * service names are searchable too, so «welcher Code gilt für die
             * Umzugsreinigung» does not mean reading the column row by row;
             * the slug goes in beside them because a quote line stores the
             * slug, not the name.
             */
            [c.code, ...c.services, ...couponServiceNames(c, services, locale)]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      );
  }, [inTab, state, query, now, services, locale]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = state !== 'all' || query.trim() !== '';
  const archivedCount = coupons.filter((c) => c.archivedAt).length;

  /*
   * The switch writes on the click, and this is the one control on either
   * coupon screen that does.
   *
   * That is not an inconsistency with screen 77, where the same field waits
   * for the save button — it is the reason the split exists. Here the flip is
   * the entire action: nothing else is in flight, and the same click puts it
   * back. On the edit screen it sits in a draft beside a half-typed code and a
   * date nobody has committed to, and applying it there on its own would
   * publish a decision out of a record the reader can still see is unfinished.
   */
  function toggle(coupon: Coupon) {
    const next = !coupon.active;
    setCouponActive(coupon.id, next);
    toast.success(t(next ? 'switchedOn' : 'switchedOff', { code: coupon.code }));
  }

  function confirmArchive() {
    const c = archiving.target;
    if (!c) return;
    archiving.dismiss();
    setCouponArchived(c.id, now.toISOString());
    toast.success(t('archiveDone', { code: c.code }));
  }

  /* No confirm on the way back: it puts a row into a list and switches
     nothing on. The question is only ever asked in the direction that takes
     something away. */
  function restore(coupon: Coupon) {
    setCouponArchived(coupon.id, undefined);
    toast.success(t('restoreDone', { code: coupon.code }));
  }

  function confirmDelete() {
    const c = deleting.target;
    if (!c) return;
    deleting.dismiss();
    /* The store checks the row is archived and may still say no — the tab is a
       view, not a promise. Reported rather than assumed. */
    if (deleteCoupon(c.id)) {
      toast.success(t('deleteDone', { code: c.code }));
    } else {
      toast.error(t('deleteBlocked'));
    }
  }

  const createButton = (
    <Button asChild>
      <Link href="/admin/coupons/new">
        <Plus className="size-4" aria-hidden />
        {t('newAction')}
      </Link>
    </Button>
  );

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: t('colCode'),
      primary: true,
      sortBy: (c) => c.code,
      cell: (c) => <span className="font-mono tracking-wide">{c.code}</span>,
    },
    {
      key: 'value',
      header: t('colValue'),
      align: 'end',
      /* Percent and francs in one column cannot be compared as numbers — 25%
         off a deep clean is worth more than CHF 50 off a move-out, and sorting
         them together would put the two kinds in an order that means nothing.
         So it sorts by kind first and only then by figure. */
      sortBy: (c) => `${c.kind}:${String(c.value).padStart(6, '0')}`,
      cell: (c) =>
        c.kind === 'percent' ? (
          <span className="inline-flex flex-col items-end">
            <span data-numeric>{c.value}%</span>
            {/* The ceiling, on the row rather than only inside the record.
                «25%» and «25%, höchstens CHF 80» are different offers, and the
                column headed «Rabatt» was printing the first for both — so the
                one figure that decides what a big job actually costs was
                visible only to somebody who opened the coupon. */}
            {c.maxDiscount !== undefined && (
              <span className="text-2xs text-ink-tertiary">
                {t('maxDiscountShort', { amount: formatChf(c.maxDiscount, locale) })}
              </span>
            )}
          </span>
        ) : (
          <Money amount={c.value} />
        ),
    },
    {
      /*
       * What the code is actually good on.
       *
       * An empty `services` array means every service — a convention the edit
       * screen spells out and the list did not carry at all, so a code valid
       * on the whole catalogue and a code scoped to windows looked the same in
       * every column. It is the second thing anybody asks about a coupon.
       */
      key: 'services',
      header: t('colServices'),
      cell: (c) => {
        const names = couponServiceNames(c, services, locale);
        return (
          <span className="text-sm text-ink-secondary">
            {names.length === 0 ? t('servicesAll') : names.join(', ')}
          </span>
        );
      },
    },
    {
      key: 'validity',
      header: t('colValidity'),
      tableOnly: true,
      sortBy: (c) => c.validTo,
      cell: (c) => (
        <span data-numeric className="text-sm text-ink-secondary">
          {format.dateTime(new Date(c.validFrom), { day: '2-digit', month: '2-digit' })} –{' '}
          {format.dateTime(new Date(c.validTo), {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'usage',
      header: t('colUsage'),
      align: 'end',
      sortBy: (c) => c.usedCount,
      cell: (c) => (
        <span data-numeric className="text-ink-secondary">
          {c.usedCount}
          {c.maxUses !== undefined ? ` / ${c.maxUses}` : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      sortBy: (c) => statesOf('coupon').indexOf(couponState(c, now)),
      cell: (c) => <StatusBadge entity="coupon" state={couponState(c, now)} size="sm" />,
    },
    /*
     * The last column follows the tab, because the switch does.
     *
     * An archived code is switched off by the act of archiving, and it is not
     * switched on again from here — so a switch on those rows would be a
     * control offering the one thing the archive exists to withhold. The date
     * it went takes its place: on the working list the question is «läuft
     * der?», in the archive it is «wann haben wir den weggeräumt?».
     */
    tab === 'archived'
      ? {
          key: 'archivedAt',
          header: t('colArchivedAt'),
          /* Not `tableOnly`, unlike the switch it replaces. That one is hidden
             on the card because a control cannot sit inside the card's own
             <button>; a date has no such problem, and «wann haben wir den
             weggeräumt» is the archive's whole question — the phone should not
             have to open a record to answer it. */
          align: 'end',
          sortBy: (c) => c.archivedAt ?? '',
          cell: (c) => (
            <span data-numeric className="text-sm text-ink-secondary">
              {c.archivedAt ? format.dateTime(new Date(c.archivedAt), 'short') : '—'}
            </span>
          ),
        }
      : {
          /*
           * The switch, in its own column, headed with what it does rather
           * than with what the row is.
           *
           * It sits beside the badge and does not replace it, because the two
           * say different things: the switch is the one field the office
           * controls, the badge is the answer that field is only part of.
           * Switching SPRING25 on does not make it valid — it expired in
           * spring — and a screen with only the switch would have promised
           * that it did.
           *
           * `tableOnly` because below lg the list renders as cards and a
           * card's body is one <button>; a switch inside it would be a control
           * nested in a control. The phone reaches the same decision through
           * the coupon's own screen, where it is a labelled checkbox in the
           * draft.
           */
          key: 'active',
          header: t('colActive'),
          tableOnly: true,
          align: 'end',
          cell: (c) => (
            <span
              className="inline-flex"
              title={t('switchHint')}
              /* The row navigates on click. Without this, reaching for the
                 switch opens the editor as well as flipping the state. */
              onClick={(e) => e.stopPropagation()}
            >
              <Switch
                checked={c.active}
                onCheckedChange={() => toggle(c)}
                aria-label={t(c.active ? 'switchOff' : 'switchOn', { code: c.code })}
              />
            </span>
          ),
        },
  ];

  const list = (
    <DataView
      items={visible}
      columns={columns}
      getKey={(c) => c.id}
      /* Newest window first. A coupon list read top-down is read for what is
         running now, and last spring's campaign is not it. */
      defaultSort={{ key: 'validity', dir: 'desc' }}
      onSelect={(c) => router.push(`/admin/coupons/${c.id}`)}
      caption={t('title')}
      openLabel={t('rowOpen')}
      /*
       * The same menu in the table and on the card — below lg a card's body is
       * one <button>, so this strip is the phone's only way to reach any of
       * this, exactly as it is its only way to reach the switch.
       *
       * What is behind it depends on which side of the archive the row is on,
       * and that is a guard rather than a convenience: «endgültig löschen» is
       * not on the working list at all, so nobody deletes a code from the
       * screen they were reading it on.
       */
      rowActions={(c) => (
        <RowActions>
          <RowAction href={`/admin/coupons/${c.id}`} label={t('rowOpen')}>
            <ActionIcon.edit aria-hidden />
          </RowAction>
          <RowActionsDivider />
          {c.archivedAt ? (
            <>
              <RowActionButton label={t('rowRestore')} onClick={() => restore(c)}>
                <ActionIcon.restore aria-hidden />
              </RowActionButton>
              <RowActionButton
                tone="danger"
                label={t('rowDelete')}
                onClick={() => deleting.ask(c)}
              >
                <ActionIcon.delete aria-hidden />
              </RowActionButton>
            </>
          ) : (
            <RowActionButton
              tone="danger"
              label={t('rowArchive')}
              onClick={() => archiving.ask(c)}
            >
              <ActionIcon.archive aria-hidden />
            </RowActionButton>
          )}
        </RowActions>
      )}
      empty={
        filtering ? (
          /* A filter that empties the table is not the same news as a list
             with nothing in it, and the action that helps is clearing the
             filter — not writing a coupon. */
          <EmptyState
            icon={TicketPercent}
            title={t('filterEmptyTitle')}
            body={t('filterEmptyBody')}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setState('all');
                }}
              >
                {t('filterReset')}
              </Button>
            }
          />
        ) : tab === 'archived' ? (
          /* Not «keine Gutscheine» with a create button under it: the archive
             is empty because nothing has been put away yet, and the answer to
             that is not to write a new code. */
          <EmptyState
            icon={Archive}
            title={t('archivedEmptyTitle')}
            body={t('archivedEmptyBody')}
          />
        ) : (
          <EmptyState
            icon={TicketPercent}
            title={t('emptyTitle')}
            /* The market argument moved here from a claim that the list was
               deliberately empty. It was true of the seed and never of this
               company: on launch day there is no code because nobody has
               written one, and the reason to keep it that way is advice, not
               a description of the table. */
            body={t('emptyBody')}
            action={createButton}
          />
        )
      }
    />
  );

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} actions={createButton} />

      {/* Not the subheading, and it never was: the stacking rule is what the
          office has to know *before* writing a code, not what this screen is
          for. It keeps its icon and its own line under the header. */}
      <p className="mb-app flex max-w-[var(--measure)] items-start gap-2 text-sm text-ink-secondary">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('stackingNote')}
      </p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <Toolbar
          search={{
            value: query,
            onChange: setQuery,
            label: t('search'),
            placeholder: t('searchPlaceholder'),
            clearLabel: appT('clearSearch'),
          }}
          /* In the card with the controls it scopes, not as a bare strip on
             the page above it — the position /admin/customers settled on, and
             this is the same list with the same two sides to it. The count
             beside «Archiv» is what stops the tab reading as a dead feature. */
          views={
            <TabsList className="p-0.5">
              <TabsTrigger value="active" className="h-8 gap-1.5 px-2.5 py-0">
                {t('tabActive')}
              </TabsTrigger>
              <TabsTrigger value="archived" className="h-8 gap-1.5 px-2.5 py-0">
                {t('tabArchived')}
                {archivedCount > 0 && (
                  <span data-numeric className="text-ink-tertiary">
                    {archivedCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          }
          /* Against the tab's own total, not the whole table: «3 von 6» on a
             screen showing the archive would be counting rows the reader
             cannot see. */
          count={
            filtering
              ? appT('results', { shown: visible.length, total: inTab.length })
              : appT('resultsAll', { total: inTab.length })
          }
          filters={
            /*
             * The filter runs on the derived state, not on the `active`
             * boolean, and the difference is the whole reason this screen has
             * a status column. Filtering the raw field would file SPRING25 —
             * switched on, expired four months ago — under "valid", which is
             * precisely the wrong answer the badge was rewritten to stop
             * giving. So the options are the five states as the reader sees
             * them, and "on" and "off" are two of the five rather than the
             * only two.
             */
            <label className="min-w-44">
              <span className="sr-only">{t('filterState')}</span>
              <Select
                dense
                value={state}
                onChange={(e) => setState(e.target.value as StateFilter)}
              >
                <option value="all">
                  {t('filterState')}: {t('filterAll')}
                </option>
                {statesOf('coupon').map((s) => (
                  <option key={s} value={s}>
                    {t('filterState')}: {statusT(s)}
                  </option>
                ))}
              </Select>
            </label>
          }
        />

        <TabsContent value="active">{list}</TabsContent>
        <TabsContent value="archived">{list}</TabsContent>
      </Tabs>

      {/* Archiving switches the code off as it goes, which is the half of the
          act a reader would not guess from the word — so the body says it
          rather than leaving it to be discovered on the row afterwards. */}
      <ConfirmDialog
        open={archiving.open}
        onOpenChange={(open) => !open && archiving.dismiss()}
        title={t('archiveConfirmTitle', { code: archiving.target?.code ?? '' })}
        body={t('archiveConfirm')}
        action={t('rowArchive')}
        dismiss={dismissLabel}
        onConfirm={confirmArchive}
      />

      {/* The one irreversible step on either coupon screen, and the body says
          which of the two cases it is. A code nobody used is a row; a code
          with redemptions behind it is the only explanation for a deduction
          on an invoice that went out months ago. */}
      <ConfirmDialog
        open={deleting.open}
        onOpenChange={(open) => !open && deleting.dismiss()}
        title={t('deleteConfirmTitle', { code: deleting.target?.code ?? '' })}
        body={t(deleting.target?.usedCount ? 'deleteConfirmRedeemed' : 'deleteConfirm', {
          n: deleting.target?.usedCount ?? 0,
        })}
        action={t('rowDelete')}
        dismiss={dismissLabel}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
