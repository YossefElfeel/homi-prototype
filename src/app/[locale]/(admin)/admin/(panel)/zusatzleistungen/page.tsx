'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, PackagePlus, Plus } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
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
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { RowAction, RowActions, RowActionsDivider, RowActionButton } from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Switch } from '@/components/ui/switch';
import { Toolbar } from '@/components/ui/toolbar';
import { ActionIcon } from '@/lib/action-icons';
import { addOnReach, addOnServiceNames, addOnUsage } from '@/lib/addon-catalogue';
import { useHydrated, useStore } from '@/mock/store';
import type { AddOn } from '@/mock/schema';

type StatusFilter = 'all' | 'active' | 'inactive';

/** Deleting is the one decision here that stops and asks. */
type Pending =
  | { kind: 'delete'; addOn: AddOn }
  | { kind: 'deleteBlocked'; addOn: AddOn; used: number }
  | null;

/**
 * Screen 75 — add-ons.
 *
 * It was a five-column table and a checkbox, and it assumed the reader already
 * knew what an add-on *is*. Three things were missing, and they compound:
 *
 *  · **you could not add one.** The list was whatever `SEED_ADDONS` said it
 *    was — seven rows, for ever. Deciding to sell «Teppichshampoonieren» for
 *    CHF 60 was a code change, exactly the gap screen 73a closed for services.
 *  · **you could not tell what the checkbox did.** A checkbox promises a save
 *    button somewhere; this one wrote to the store on the spot. Worse, the
 *    column was headed «Status» — so a control that *sets* availability was
 *    sitting under a word that reads as a label describing it.
 *  · **nothing said where an add-on goes.** The lead named its two fields.
 *    Which service it hangs off, which screen a customer meets it on, whether
 *    its price is per hour or per job, and what happens to the half hour it
 *    adds — all of that lived in `pricing.ts` and the request flow, neither of
 *    which the owner can open. A four-step card above the table said it and
 *    was cut on review: a permanent explainer between the heading and the
 *    toolbar pushes the rows below the fold on a laptop, and this screen is
 *    opened far more often to change a price than to learn what an add-on is.
 *    The same facts are still carried where they are acted on — the lead, the
 *    unit on the price, and the hint under every field on 75a and 75b.
 *
 * Availability applies on the click here, where the equivalent on screen 73
 * opens a confirm first. That is a real difference, not an inconsistency:
 * withdrawing a *service* takes away the thing a customer is halfway through
 * choosing and empties its public page, while hiding an add-on removes one
 * optional line from a step that is optional to begin with — and the switch is
 * its own undo, one click away in the same place.
 */
export default function AdminAddOnsPage() {
  const t = useTranslations('admin.addons');
  const appT = useTranslations('app');
  const actionsT = useTranslations('actions');
  const statusT = useTranslations('status.addOn');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const addOns = useStore((s) => s.addOns);
  const services = useStore((s) => s.services);
  const data = useStore((s) => s.data);
  const setAddOnActive = useStore((s) => s.setAddOnActive);
  const deleteAddOn = useStore((s) => s.deleteAddOn);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [service, setService] = useState('all');
  const [pending, setPending] = useState<Pending>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return addOns
      .filter((a) => (status === 'all' ? true : status === 'active' ? a.active : !a.active))
      .filter((a) => (service === 'all' ? true : a.services.includes(service)))
      .filter((a) =>
        q
          ? /* The slug is searchable because it is what a quote line stores:
               «welche Zusatzleistung ist `backofen`» is the question the office
               asks when a line on an old offer has to be traced back. */
            [
              ...routing.locales.map((l) => a.name[l]),
              ...routing.locales.map((l) => a.short[l]),
              a.slug,
            ]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      );
  }, [addOns, status, service, query]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = status !== 'all' || service !== 'all' || query.trim() !== '';

  function toggle(addOn: AddOn) {
    const next = !addOn.active;
    setAddOnActive(addOn.id, next);
    toast.success(
      t(next ? 'switchedOn' : 'switchedOff', { name: addOn.name[locale] }),
    );
  }

  /**
   * Asking to delete, which is not the same as deleting.
   *
   * The count is read here so the refusal can name a number. It is read again
   * inside the store, which is not redundant: this one is a render old, and a
   * quote could have been written against the add-on in between.
   */
  function askDelete(addOn: AddOn) {
    const used = addOnUsage(addOn, data).total;
    setPending(used > 0 ? { kind: 'deleteBlocked', addOn, used } : { kind: 'delete', addOn });
  }

  function confirmDelete() {
    if (pending?.kind !== 'delete') return;
    const name = pending.addOn.name[locale];
    if (!deleteAddOn(pending.addOn.id)) {
      toast.error(t('deleteBlocked'));
    } else {
      toast.success(t('deleteDone', { name }));
    }
    setPending(null);
  }

  const columns: Column<AddOn>[] = [
    {
      key: 'name',
      header: t('colName'),
      primary: true,
      sortBy: (a) => a.name[locale],
      cell: (a) => {
        const reach = addOnReach(a, services);
        return (
          <span className="flex flex-wrap items-center gap-2">
            {a.name[locale]}
            {/*
              Switched on and still invisible.

              An add-on attached to nothing — or only to services that are
              drafts or withdrawn — reaches no customer, and the state badge
              beside it says «Verfügbar» in green regardless. That is the exact
              shape of unreachable state /flows exists to surface, so it is
              flagged on the row rather than left for someone to work out from
              the «Gilt für» column.
            */}
            {a.active && !reach.reachable && (
              <span
                title={a.services.length === 0 ? t('unreachableNone') : t('unreachableInactive')}
                className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-2xs text-status-warning-fg"
              >
                <AlertTriangle className="size-3" aria-hidden />
                {t('unreachable')}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      sortBy: (a) => (a.active ? 0 : 1),
      cell: (a) => <StatusBadge entity="addOn" state={a.active ? 'active' : 'inactive'} size="sm" />,
    },
    {
      /*
       * The control, in its own column and headed with what it does.
       *
       * It was a `<Checkbox>` under a «Status» header — a control shaped like
       * "tick this and submit" sitting under a word that reads as a
       * description. A Switch is the honest shape for a binary that takes
       * effect the moment it moves, and the state badge next to it stays,
       * because a switch alone is read by its position and a badge is read by
       * its word.
       *
       * `tableOnly` because below lg the list renders as cards and a card's
       * body is one <button>; a switch inside it would be a control nested in
       * a control. The phone's path to the same decision is the add-on's own
       * screen, which carries it as a labelled row.
       */
      key: 'available',
      header: t('colAvailable'),
      tableOnly: true,
      align: 'end',
      cell: (a) => (
        <span
          className="inline-flex"
          title={t('switchHint')}
          /* The row navigates on click. Without this, reaching for the switch
             opens the editor as well as flipping the state. */
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            checked={a.active}
            onCheckedChange={() => toggle(a)}
            aria-label={t(a.active ? 'switchOff' : 'switchOn', { name: a.name[locale] })}
          />
        </span>
      ),
    },
    {
      key: 'price',
      header: t('colPrice'),
      align: 'end',
      sortBy: (a) => a.price,
      /* `per="visit"` rather than a bare figure. The whole point the screen has
         to carry is that this price is charged once for the job and not by the
         hour — printing it naked next to an hours column invited exactly the
         reading the pricing engine refuses. */
      cell: (a) => <Money amount={a.price} per="visit" />,
    },
    {
      key: 'duration',
      header: t('colDuration'),
      align: 'end',
      sortBy: (a) => a.extraDuration,
      cell: (a) => (
        <span data-numeric className="text-ink-secondary">
          {a.extraDuration > 0 ? `+${a.extraDuration} h` : '—'}
        </span>
      ),
    },
    {
      key: 'services',
      header: t('colServices'),
      tableOnly: true,
      cell: (a) => (
        <span className="text-sm text-ink-secondary">
          {a.services.length === 0 ? '—' : addOnServiceNames(a, services, locale).join(', ')}
        </span>
      ),
    },
  ];

  const createButton = (
    <Button asChild>
      <Link href="/admin/zusatzleistungen/neu">
        <Plus className="size-4" aria-hidden />
        {t('createAction')}
      </Link>
    </Button>
  );

  const blocked = pending?.kind === 'deleteBlocked';

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} actions={createButton} />

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
            ? appT('results', { shown: visible.length, total: addOns.length })
            : appT('resultsAll', { total: addOns.length })
        }
        filters={
          <>
            <label className="min-w-44">
              <span className="sr-only">{t('filterStatus')}</span>
              <Select
                dense
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
              >
                <option value="all">
                  {t('filterStatus')}: {t('filterAll')}
                </option>
                <option value="active">
                  {t('filterStatus')}: {statusT('active')}
                </option>
                <option value="inactive">
                  {t('filterStatus')}: {statusT('inactive')}
                </option>
              </Select>
            </label>
            {/* Filtering by service is the question this screen is actually
                asked — «was kann man zur Umzugsreinigung dazubuchen» — and it
                was answerable before only by reading the «Gilt für» column
                row by row. */}
            <label className="min-w-44">
              <span className="sr-only">{t('filterService')}</span>
              <Select dense value={service} onChange={(e) => setService(e.target.value)}>
                <option value="all">
                  {t('filterService')}: {t('filterAll')}
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {t('filterService')}: {s.name[locale]}
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
        getKey={(a) => a.id}
        onSelect={(a) => router.push(`/admin/zusatzleistungen/${a.slug}`)}
        caption={t('title')}
        openLabel={t('rowOpen')}
        rowActions={(a) => (
          <RowActions>
            <RowAction href={`/admin/zusatzleistungen/${a.slug}`} label={t('rowOpen')}>
              <ActionIcon.edit aria-hidden />
            </RowAction>
            <RowActionsDivider />
            <RowActionButton tone="danger" label={t('rowDelete')} onClick={() => askDelete(a)}>
              <ActionIcon.delete aria-hidden />
            </RowActionButton>
          </RowActions>
        )}
        empty={
          filtering ? (
            /* A filter that empties the table is not the same news as a list
               with nothing in it, and the action that helps is clearing the
               filter — not writing an add-on. */
            <EmptyState
              icon={PackagePlus}
              title={t('filterEmptyTitle')}
              body={t('filterEmptyBody')}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setStatus('all');
                    setService('all');
                  }}
                >
                  {t('filterReset')}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={PackagePlus}
              title={t('emptyTitle')}
              body={t('emptyBody')}
              action={createButton}
            />
          )
        }
      />

      {/*
        Only deleting opens this. The refusal is the same dialog with a title,
        a body and deliberately no confirm button, so the only way out of it is
        the one that changes nothing.
      */}
      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent closeLabel={actionsT('close')}>
          <DialogHeader>
            <DialogTitle>
              {pending &&
                t(blocked ? 'deleteBlockedTitle' : 'deleteTitle', {
                  name: pending.addOn.name[locale],
                })}
            </DialogTitle>
            <DialogDescription>
              {pending &&
                (pending.kind === 'deleteBlocked'
                  ? t('deleteBlockedBody', {
                      n: pending.used,
                      slug: pending.addOn.slug,
                      name: pending.addOn.name[locale],
                    })
                  : t('deleteBody'))}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>
              {blocked ? actionsT('close') : actionsT('cancel')}
            </Button>
            {!blocked && (
              <Button variant="danger" onClick={confirmDelete}>
                {t('deleteConfirm')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
