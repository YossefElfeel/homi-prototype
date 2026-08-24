'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus, Search, Tags } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { ActionIcon } from '@/lib/action-icons';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { RowAction, RowActions } from '@/components/ui/row-actions';
import { Switch } from '@/components/ui/switch';
import { Toolbar } from '@/components/ui/toolbar';
import { planRhythm } from '@/lib/offer-facts';
import { activeSubscriberCount } from '@/lib/plan-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Plan } from '@/mock/schema';

/**
 * Screen 69 — the plans, as products.
 *
 * This list used to be the *subscribers*: one row per customer, and its only
 * "Add" opened a form that signed somebody up. There was nowhere to see what a
 * plan was, and nothing that could have been shown if there were — a plan was
 * three string literals in a union type. So the questions the office actually
 * has of this screen ("what do we sell, for how much, and is it still on
 * offer?") had no screen at all, and the one it did have could not be searched
 * or filtered.
 *
 * The subscribers moved one level in, to the plan they belong to, which is
 * where "who is on this?" is asked from.
 */
export default function PlansPage() {
  const t = useTranslations('admin.plans');
  const rhythmT = useTranslations('admin.rhythm');
  const locale = useLocale() as Locale;
  const now = useNow();
  const hydrated = useHydrated();

  const plans = useStore((s) => s.plans);
  const services = useStore((s) => s.services);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const setPlanActive = useStore((s) => s.setPlanActive);

  const [query, setQuery] = useState('');
  /*
   * The brief asks for a "Plan Type" filter. On this model the thing that
   * separates one plan from another is the service its visits are drawn
   * against — an office plan and a home plan are not variations of one
   * product, they are two — so that is what the filter filters.
   */
  const [service, setService] = useState<'all' | string>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'retired'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plans
      .filter((p) => (service === 'all' ? true : p.serviceSlug === service))
      .filter((p) =>
        status === 'all' ? true : status === 'active' ? p.active : !p.active,
      )
      .filter((p) =>
        q
          ? [p.name.de, p.name.en, p.reference, p.description[locale]]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      )
      .sort((a, b) => a.order - b.order);
  }, [plans, query, service, status, locale]);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const filtering = status !== 'all' || service !== 'all' || Boolean(query.trim());
  const serviceName = (slug: string) =>
    services.find((s) => s.slug === slug)?.name[locale] ?? slug;

  function toggle(plan: Plan) {
    setPlanActive(plan.id, !plan.active);
    toast.success(
      t(plan.active ? 'retiredDone' : 'activatedDone', { name: plan.name[locale] }),
    );
  }

  const columns: Column<Plan>[] = [
    {
      key: 'name',
      header: t('colName'),
      primary: true,
      sortBy: (p) => p.order,
      cell: (p) => (
        <Link
          href={`/admin/abos/${p.id}`}
          className="rounded-[var(--radius-xs)] font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
        >
          {p.name[locale]}
          <span data-numeric className="ms-2 text-sm font-normal text-ink-tertiary">
            {p.reference}
          </span>
        </Link>
      ),
    },
    {
      key: 'service',
      header: t('colService'),
      cell: (p) => <span className="text-ink-secondary">{serviceName(p.serviceSlug)}</span>,
    },
    {
      key: 'visits',
      header: t('colVisits'),
      align: 'end',
      sortBy: (p) => p.includedVisits,
      cell: (p) => (
        <span className="text-ink-secondary">
          <span data-numeric>{p.includedVisits}</span>
          <span className="block text-sm text-ink-tertiary">
            {rhythmT(planRhythm(p))}
          </span>
        </span>
      ),
    },
    {
      key: 'price',
      header: t('colPrice'),
      align: 'end',
      sortBy: (p) => p.price,
      /* The term is on the price rather than in a footnote. "CHF 3'440" beside
         a row saying 26 visits reads as the price of a visit to anyone
         skim-reading, and that is a factor of twenty-six. */
      cell: (p) => (
        <span>
          <Money amount={p.price} />
          <span className="block text-sm text-ink-tertiary">
            {t('perTerm', { months: p.validityMonths })}
          </span>
        </span>
      ),
    },
    {
      key: 'subscribers',
      header: t('colSubscribers'),
      align: 'end',
      sortBy: (p) => activeSubscriberCount(p.id, subscriptions, now),
      cell: (p) => (
        <span data-numeric className="text-ink-secondary">
          {activeSubscriberCount(p.id, subscriptions, now)}
        </span>
      ),
    },
    {
      /*
       * Last, and a switch rather than a badge, for the same reason the
       * customer list settled on one: active and retired are the two ends of
       * one control, and reporting the state next to a menu that changes it
       * somewhere else makes the reader hunt.
       *
       * The site flag is not a second switch here. It only means anything for
       * an active plan, and two toggles in one cell is how you turn off the
       * wrong one.
       */
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (p) => (
        <span className="inline-flex items-center gap-2">
          <Switch
            checked={p.active}
            onCheckedChange={() => toggle(p)}
            aria-label={t('toggleLabel', { name: p.name[locale] })}
          />
          <span className="text-sm text-ink-secondary">
            {t(p.active ? 'active' : 'retired')}
          </span>
          {p.active && !p.visibleOnSite && <Chip tone="warning">{t('hidden')}</Chip>}
        </span>
      ),
    },
  ];

  const addButton = (
    <Button asChild>
      <Link href="/admin/abos/neu">
        <Plus className="size-4" aria-hidden />
        {t('addAction')}
      </Link>
    </Button>
  );

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} actions={addButton} />

      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('searchLabel'),
          placeholder: t('searchPlaceholder'),
          clearLabel: t('searchClear'),
        }}
        filters={
          <>
            <label>
              <span className="label-type mb-1 text-ink-tertiary">{t('colService')}</span>
              <Select
                dense
                value={service}
                onChange={(e) => setService(e.target.value as typeof service)}
              >
                <option value="all">{t('filterAllServices')}</option>
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name[locale]}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <span className="label-type mb-1 text-ink-tertiary">{t('colStatus')}</span>
              <Select
                dense
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="all">{t('filterAllStatus')}</option>
                <option value="active">{t('active')}</option>
                <option value="retired">{t('retired')}</option>
              </Select>
            </label>
          </>
        }
        count={t('count', { shown: filtered.length, total: plans.length })}
      />

      <DataView
        items={filtered}
        columns={columns}
        getKey={(p) => p.id}
        caption={t('title')}
        defaultSort={{ key: 'name', dir: 'asc' }}
        rowActions={(p) => (
          <RowActions>
            <RowAction href={`/admin/abos/${p.id}`} label={t('rowView')}>
              <ActionIcon.open aria-hidden />
            </RowAction>
            <RowAction href={`/admin/abos/${p.id}/bearbeiten`} label={t('rowEdit')}>
              <ActionIcon.edit aria-hidden />
            </RowAction>
          </RowActions>
        )}
        empty={
          filtering ? (
            <EmptyState
              icon={Search}
              title={t('searchEmptyTitle')}
              body={query ? t('searchEmptyBody', { query }) : t('filterEmptyBody')}
            />
          ) : (
            <EmptyState
              icon={Tags}
              title={t('emptyTitle')}
              body={t('emptyBody')}
              action={addButton}
            />
          )
        }
      />
    </div>
  );
}
