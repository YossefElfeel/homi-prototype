'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { Locale } from '@/i18n/routing';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { Checkbox } from '@/components/ui/field';
import { useHydrated, useStore } from '@/mock/store';
import type { AddOn } from '@/mock/schema';

/**
 * Screen 75 — add-ons.
 *
 * The lead line states the rule the pricing engine actually implements: the
 * price is billed, the time is only scheduled. Getting that wrong is what made
 * an add-on cost twice — once as a flat price and again as billed hours.
 */
export default function AdminAddOnsPage() {
  const t = useTranslations('admin.addons');
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();

  const addOns = useStore((s) => s.addOns);
  const services = useStore((s) => s.services);
  const setAddOns = useStore((s) => s.setAddOns);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const serviceName = (slug: string) =>
    services.find((s) => s.slug === slug)?.name[locale] ?? slug;

  const columns: Column<AddOn>[] = [
    { key: 'name', header: t('colName'), primary: true, cell: (a) => a.name[locale] },
    {
      key: 'price',
      header: t('colPrice'),
      align: 'end',
      cell: (a) => <Money amount={a.price} />,
    },
    {
      key: 'duration',
      header: t('colDuration'),
      align: 'end',
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
          {a.services.map(serviceName).join(', ')}
        </span>
      ),
    },
    {
      key: 'active',
      header: t('colStatus'),
      trailing: true,
      align: 'end',
      cell: (a) => (
        <Checkbox
          label={<span className="sr-only">{a.name[locale]}</span>}
          checked={a.active}
          onChange={(e) =>
            setAddOns(
              addOns.map((x) => (x.id === a.id ? { ...x, active: e.target.checked } : x)),
            )
          }
        />
      ),
    },
  ];

  return (
    <div>
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      <DataView
        className="mt-8"
        items={addOns}
        columns={columns}
        getKey={(a) => a.id}
        caption={t('title')}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
