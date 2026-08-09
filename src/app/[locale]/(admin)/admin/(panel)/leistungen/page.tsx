'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ShieldCheck } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { routing, TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { useHydrated, useStore } from '@/mock/store';
import type { Service } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * Screen 73 — the service catalogue.
 *
 * §17.2: changes here reach the website and the request flow immediately, so
 * the lead line says so. The translation-gap count is surfaced per row rather
 * than hidden in the editor: §20.6 makes German the fallback, which means a
 * missing translation degrades quietly and would otherwise never be noticed.
 */
export default function AdminServicesPage() {
  const t = useTranslations('admin.services');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const services = useStore((s) => s.services);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const missingTranslations = (service: Service) =>
    routing.locales.filter(
      (l) => !TRANSLATED_LOCALES.includes(l) || !service.name[l] || !service.short[l],
    ).length;

  const columns: Column<Service>[] = [
    {
      key: 'name',
      header: t('colName'),
      primary: true,
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
      cell: (s) => (
        <span
          className={cn(
            'rounded-sm border px-1.5 py-0.5 text-xs',
            s.active
              ? 'border-status-success-line bg-status-success text-status-success-fg'
              : 'border-status-neutral-line bg-status-neutral text-status-neutral-fg',
          )}
        >
          {s.active ? t('active') : t('inactive')}
        </span>
      ),
    },
    {
      key: 'calc',
      header: t('colCalc'),
      cell: (s) => (
        <span className="text-ink-secondary">
          {s.calc === 'perUnit' ? t('calcPerUnit') : t('calcHourly')}
        </span>
      ),
    },
    {
      key: 'base',
      header: t('colBase'),
      align: 'end',
      cell: (s) => <Money amount={s.basePrice} per="hour" />,
    },
    {
      key: 'min',
      header: t('colMin'),
      align: 'end',
      cell: (s) => (
        <span data-numeric className="text-ink-secondary">
          {s.minDuration} h
        </span>
      ),
    },
    {
      key: 'translations',
      header: 'i18n',
      align: 'end',
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

  return (
    <div className="max-w-6xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      <DataView
        className="mt-8"
        items={[...services].sort((a, b) => a.order - b.order)}
        columns={columns}
        getKey={(s) => s.id}
        onSelect={(s) => router.push(`/admin/leistungen/${s.slug}`)}
        caption={t('title')}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
