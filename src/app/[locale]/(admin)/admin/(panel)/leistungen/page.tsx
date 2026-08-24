'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus, ShieldCheck, Sparkles } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { routing, TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
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
import {
  RowAction,
  RowActionButton,
  RowActions,
  RowActionsDivider,
} from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Switch } from '@/components/ui/switch';
import { Toolbar } from '@/components/ui/toolbar';
import { ActionIcon } from '@/lib/action-icons';
import {
  DURATION_PROFILES,
  calcUnit,
  hasPublicPage,
  isOffered,
  serviceUsage,
} from '@/lib/service-catalogue';
import { statesOf } from '@/lib/status-registry';
import { useHydrated, useStore } from '@/mock/store';
import type { DurationProfile, Service, ServiceStatus } from '@/mock/schema';

type StatusFilter = 'all' | ServiceStatus;
type TypeFilter = 'all' | DurationProfile;

/** The three decisions that must not happen on one click, and their subject. */
type Pending =
  | { kind: 'activate' | 'deactivate' | 'delete'; service: Service }
  | { kind: 'deleteBlocked'; service: Service; used: number }
  | null;

/**
 * Screen 73 — the service catalogue.
 *
 * It listed seven rows and let you open them. That was the whole screen, and
 * it left the owner four things they could not do at all:
 *
 *  · **add a service.** «wir machen jetzt auch Teppichreinigung» was a code
 *    change. The catalogue was as long as the seed said it was, for ever.
 *  · **write one without selling it.** `active` was a boolean, so the moment a
 *    record existed it was either on the website or switched off — and
 *    "switched off" already means a service that was withdrawn, which is not
 *    what a half-written price list is.
 *  · **act on a row.** No actions column: activating, deactivating and
 *    deleting all meant opening the editor first, and deleting was not
 *    anywhere at all.
 *  · **find one.** Seven rows need no search. This screen can now hold as many
 *    as the business has.
 *
 * The billing column was also lying. `calc` is a three-way union and the cell
 * was a two-way ternary, so a flat-rate service would have printed «Nach
 * Stunden» — and the rate beside it was hardcoded `per="hour"`, which made
 * window cleaning's per-window price read as an hourly one. Both now come from
 * `service-catalogue`, which is the only place that answers the unit question.
 *
 * §17.2: activating puts a price in front of customers and deactivating takes
 * a service away mid-request, so availability is a switch that *asks* — it
 * shows the state in its own column and opens a confirm instead of applying on
 * the click.
 */
export default function AdminServicesPage() {
  const t = useTranslations('admin.services');
  const serviceT = useTranslations('admin.service');
  const statusT = useTranslations('status.service');
  const appT = useTranslations('app');
  const actionsT = useTranslations('actions');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const services = useStore((s) => s.services);
  const plans = useStore((s) => s.plans);
  const data = useStore((s) => s.data);
  const setServiceStatus = useStore((s) => s.setServiceStatus);
  const deleteService = useStore((s) => s.deleteService);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [type, setType] = useState<TypeFilter>('all');
  const [pending, setPending] = useState<Pending>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...services]
      .filter((s) => (status === 'all' ? true : s.status === status))
      .filter((s) => (type === 'all' ? true : s.durationProfile === type))
      .filter((s) =>
        q
          ? /* The slug is in here because it is the URL, and «welche Leistung
               ist /leistungen/umzugsreinigung» is a question the office asks
               when a customer reads a link out over the phone. Names in all
               four languages, because the English one is what a reviewer
               searching this screen will type. */
            [
              ...routing.locales.map((l) => s.name[l]),
              ...routing.locales.map((l) => s.short[l]),
              s.slug,
            ]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => a.order - b.order);
  }, [services, status, type, query]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = status !== 'all' || type !== 'all' || query.trim() !== '';

  const missingTranslations = (service: Service) =>
    routing.locales.filter(
      (l) => !TRANSLATED_LOCALES.includes(l) || !service.name[l] || !service.short[l],
    ).length;

  const profileLabel = (profile: DurationProfile) =>
    serviceT(
      `profile${profile.charAt(0).toUpperCase()}${profile.slice(1)}` as 'profileStandard',
    );

  const calcLabel = (service: Service) =>
    t(
      service.calc === 'perUnit'
        ? 'calcPerUnit'
        : service.calc === 'flat'
          ? 'calcFlat'
          : 'calcHourly',
    );

  /**
   * Asking to delete, which is not the same as deleting.
   *
   * The usage count is read here so the refusal can name a number. It is read
   * *again* inside the store, which is not redundant: this one is a render old,
   * and a second tab could have booked the service in between.
   */
  function askDelete(service: Service) {
    const used = serviceUsage(service.slug, data, plans).total;
    setPending(used > 0 ? { kind: 'deleteBlocked', service, used } : { kind: 'delete', service });
  }

  function confirmPending() {
    if (!pending) return;
    const { service } = pending;

    if (pending.kind === 'activate' || pending.kind === 'deactivate') {
      const next: ServiceStatus = pending.kind === 'activate' ? 'active' : 'inactive';
      setServiceStatus(service.id, next);
      toast.success(
        t(pending.kind === 'activate' ? 'activateDone' : 'deactivateDone', {
          name: service.name[locale],
        }),
      );
    } else if (pending.kind === 'delete') {
      if (!deleteService(service.id)) {
        toast.error(t('deleteBlocked'));
      } else {
        toast.success(t('deleteDone', { name: service.name[locale] }));
      }
    }

    setPending(null);
  }

  const columns: Column<Service>[] = [
    {
      key: 'name',
      header: t('colName'),
      primary: true,
      sortBy: (s) => s.name[locale],
      cell: (s) => (
        <span className="flex flex-wrap items-center gap-2">
          {s.name[locale]}
          {s.handoverGuarantee && (
            <span
              title={t('guarantee')}
              className="inline-flex items-center gap-1 rounded-sm bg-status-success px-1.5 py-0.5 text-[0.6875rem] text-status-success-fg"
            >
              <ShieldCheck className="size-3" aria-hidden />
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      sortBy: (s) => s.status,
      /* Was two hand-typed colour pairs in this cell, which held two states and
         could not have held a third. The registry is the only place a state's
         colour is decided now — same badge here, on the details screen and on
         the editor. */
      cell: (s) => <StatusBadge entity="service" state={s.status} size="sm" />,
    },
    {
      /*
       * Availability, as a control rather than a menu item three clicks deep.
       *
       * The switch answers one question — can a customer ask for this today —
       * so it is binary even though the status is not. Draft and Deactivated
       * both read as off, and the badge beside it is what distinguishes «never
       * been out» from «taken off sale»; flipping a draft on is the same act
       * as publishing it, which is why both land on the same confirm.
       *
       * And it does *not* apply on the click. A Switch normally promises that
       * it does, which is exactly the promise this one must not make: it puts
       * a price in front of customers, or takes a service away mid-request. So
       * the switch opens the dialog and the dialog moves the switch — the
       * control stays showing the truth until the decision is made.
       *
       * `tableOnly` because below lg the list renders as cards and a card's
       * body is one <button>; a switch inside it would be a control nested in
       * a control. The phone's path to the same decision is the details
       * screen, which carries it as a button.
       */
      key: 'availability',
      header: t('colActivate'),
      tableOnly: true,
      sortBy: (s) => (isOffered(s) ? 0 : 1),
      cell: (s) => (
        <span
          className="inline-flex"
          /* The row navigates on click. Without this, reaching for the switch
             opens the details screen underneath the dialog. */
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            checked={isOffered(s)}
            onCheckedChange={() =>
              setPending({
                kind: isOffered(s) ? 'deactivate' : 'activate',
                service: s,
              })
            }
            aria-label={
              isOffered(s)
                ? t('rowDeactivate')
                : t('rowActivate')
            }
          />
        </span>
      ),
    },
    {
      /* The column the «Art» filter filters. Added with it rather than after:
         a filter over an attribute no column shows is a control whose effect
         the reader has to infer from which rows vanished. */
      key: 'type',
      header: t('colType'),
      sortBy: (s) => s.durationProfile,
      cell: (s) => <span className="text-ink-secondary">{profileLabel(s.durationProfile)}</span>,
    },
    {
      key: 'calc',
      header: t('colCalc'),
      sortBy: (s) => s.calc,
      cell: (s) => <span className="text-ink-secondary">{calcLabel(s)}</span>,
    },
    {
      key: 'base',
      header: t('colBase'),
      align: 'end',
      sortBy: (s) => s.basePrice,
      cell: (s) => <Money amount={s.basePrice} per={calcUnit(s.calc)} />,
    },
    {
      key: 'min',
      header: t('colMin'),
      align: 'end',
      sortBy: (s) => s.minDuration,
      cell: (s) => (
        <span data-numeric className="text-ink-secondary">
          {s.minDuration} h
        </span>
      ),
    },
    {
      key: 'translations',
      header: t('colLanguages'),
      align: 'end',
      sortBy: (s) => missingTranslations(s),
      cell: (s) => {
        const missing = missingTranslations(s);
        return missing === 0 ? (
          <span className="text-sm text-ink-tertiary">—</span>
        ) : (
          <span className="rounded-sm border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-xs text-status-warning-fg">
            {t('translationGap', { n: missing })}
          </span>
        );
      },
    },
  ];

  const createButton = (
    <Button asChild>
      <Link href="/admin/leistungen/neu">
        <Plus className="size-4" aria-hidden />
        {t('createAction')}
      </Link>
    </Button>
  );

  /**
   * One row's menu.
   *
   * Availability is deliberately not in here any more — it has a column of its
   * own, where the current state is readable without opening anything. What is
   * left is the three items that go somewhere or destroy something.
   *
   * «Details» and «Bearbeiten» are two entries because they are two different
   * things to want: one is a screen you read, the other autosaves every
   * keystroke. The public link is offered only on an active service that also
   * has a page to open — a draft has none, and neither does a service the
   * owner added, because the marketing pages are built from the seed. An
   * action that lands on a 404 every time is worse than an absent one.
   */
  function menu(service: Service) {
    return (
      <RowActions>
        <RowAction
          href={`/admin/leistungen/${service.slug}/details`}
          label={t('rowOpen')}
        >
          <ActionIcon.open aria-hidden />
        </RowAction>
        <RowAction href={`/admin/leistungen/${service.slug}`} label={t('rowEdit')}>
          <ActionIcon.edit aria-hidden />
        </RowAction>
        {hasPublicPage(service) && (
          <RowAction
            external
            href={`/leistungen/${service.slug}`}
            label={t('rowCustomerView')}
          >
            <ActionIcon.customerView aria-hidden />
          </RowAction>
        )}
        <RowActionsDivider />
        <RowActionButton
          tone="danger"
          label={t('rowDelete')}
          onClick={() => askDelete(service)}
        >
          <ActionIcon.delete aria-hidden />
        </RowActionButton>
      </RowActions>
    );
  }

  const blocked = pending?.kind === 'deleteBlocked';
  const confirmCopy = pending
    ? {
        activate: {
          title: t('activateTitle', { name: pending.service.name[locale] }),
          body: t('activateBody'),
          action: t('activateConfirm'),
        },
        deactivate: {
          title: t('deactivateTitle', { name: pending.service.name[locale] }),
          body: t('deactivateBody'),
          action: t('deactivateConfirm'),
        },
        delete: {
          title: t('deleteTitle', { name: pending.service.name[locale] }),
          body: t('deleteBody'),
          action: t('deleteConfirm'),
        },
        deleteBlocked: {
          title: t('deleteBlockedTitle', { name: pending.service.name[locale] }),
          body: t('deleteBlockedBody', {
            n: pending.kind === 'deleteBlocked' ? pending.used : 0,
          }),
          action: '',
        },
      }[pending.kind]
    : null;

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
            ? appT('results', { shown: visible.length, total: services.length })
            : appT('resultsAll', { total: services.length })
        }
        filters={
          <>
            <label className="min-w-44">
              <span className="sr-only">{t('filterStatus')}</span>
              {/* The three states come from the status registry rather than
                  being listed here, so the filter can never offer a state the
                  badge does not draw — or miss one it does. */}
              <Select
                dense
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
              >
                <option value="all">
                  {t('filterStatus')}: {t('filterAll')}
                </option>
                {statesOf('service').map((state) => (
                  <option key={state} value={state}>
                    {t('filterStatus')}: {statusT(state)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="min-w-44">
              <span className="sr-only">{t('filterType')}</span>
              <Select dense value={type} onChange={(e) => setType(e.target.value as TypeFilter)}>
                <option value="all">
                  {t('filterType')}: {t('filterAll')}
                </option>
                {DURATION_PROFILES.map((profile) => (
                  <option key={profile} value={profile}>
                    {t('filterType')}: {profileLabel(profile)}
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
        getKey={(s) => s.id}
        /* The row opens what it *is*, not what you might do to it. It used to
           land on the editor, which autosaves — so clicking a row to check a
           price put the record one stray key away from changing. */
        onSelect={(s) => router.push(`/admin/leistungen/${s.slug}/details`)}
        caption={t('title')}
        openLabel={t('rowOpen')}
        rowActions={menu}
        empty={
          filtering ? (
            /* A filter that empties the table is not the same news as a
               catalogue with nothing in it, and the action that helps is
               clearing the filter — not writing a service. */
            <EmptyState
              icon={Sparkles}
              title={t('filterEmptyTitle')}
              body={t('filterEmptyBody')}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setStatus('all');
                    setType('all');
                  }}
                >
                  {t('filterReset')}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Sparkles}
              title={t('emptyTitle')}
              body={t('emptyBody')}
              action={createButton}
            />
          )
        }
      />

      {/*
        Nothing on this screen changes on one click.

        Activating publishes a price to the website; deactivating withdraws a
        service customers may be halfway through choosing; deleting is
        irreversible. The same dialog carries all three because the decision is
        the same shape each time — and the fourth case it carries is the
        refusal, which has a title and a body and deliberately no confirm
        button, so the only way out is the one that changes nothing.
      */}
      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent closeLabel={actionsT('close')}>
          <DialogHeader>
            <DialogTitle>{confirmCopy?.title}</DialogTitle>
            <DialogDescription>{confirmCopy?.body}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>
              {blocked ? actionsT('close') : actionsT('cancel')}
            </Button>
            {!blocked && (
              <Button
                variant={pending?.kind === 'delete' ? 'danger' : 'primary'}
                onClick={confirmPending}
              >
                {confirmCopy?.action}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
