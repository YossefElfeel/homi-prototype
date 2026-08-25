'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { Info, Plus, TicketPercent } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Switch } from '@/components/ui/switch';
import { Toolbar } from '@/components/ui/toolbar';
import { couponServiceNames, couponState, type CouponState } from '@/lib/coupon-facts';
import { statesOf } from '@/lib/status-registry';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Coupon } from '@/mock/schema';

type StateFilter = 'all' | CouponState;

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

  const [query, setQuery] = useState('');
  const [state, setState] = useState<StateFilter>('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coupons
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
  }, [coupons, state, query, now, services, locale]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = state !== 'all' || query.trim() !== '';

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

  const createButton = (
    <Button asChild>
      <Link href="/admin/gutscheine/neu">
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
          <span data-numeric>{c.value}%</span>
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
    {
      /*
       * The switch, in its own column, headed with what it does rather than
       * with what the row is.
       *
       * It sits beside the badge and does not replace it, because the two say
       * different things: the switch is the one field the office controls, the
       * badge is the answer that field is only part of. Switching SPRING25 on
       * does not make it valid — it expired in spring — and a screen with only
       * the switch would have promised that it did.
       *
       * `tableOnly` because below lg the list renders as cards and a card's
       * body is one <button>; a switch inside it would be a control nested in
       * a control. The phone reaches the same decision through the coupon's
       * own screen, where it is a labelled checkbox in the draft.
       */
      key: 'active',
      header: t('colActive'),
      tableOnly: true,
      align: 'end',
      cell: (c) => (
        <span
          className="inline-flex"
          title={t('switchHint')}
          /* The row navigates on click. Without this, reaching for the switch
             opens the editor as well as flipping the state. */
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
            ? appT('results', { shown: visible.length, total: coupons.length })
            : appT('resultsAll', { total: coupons.length })
        }
        filters={
          /*
           * The filter runs on the derived state, not on the `active` boolean,
           * and the difference is the whole reason this screen has a status
           * column. Filtering the raw field would file SPRING25 — switched on,
           * expired four months ago — under "valid", which is precisely the
           * wrong answer the badge was rewritten to stop giving. So the
           * options are the five states as the reader sees them, and "on" and
           * "off" are two of the five rather than the only two.
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

      <DataView
        items={visible}
        columns={columns}
        getKey={(c) => c.id}
        /* Newest window first. A coupon list read top-down is read for what is
           running now, and last spring's campaign is not it. */
        defaultSort={{ key: 'validity', dir: 'desc' }}
        onSelect={(c) => router.push(`/admin/gutscheine/${c.id}`)}
        caption={t('title')}
        openLabel={t('rowOpen')}
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
    </div>
  );
}
