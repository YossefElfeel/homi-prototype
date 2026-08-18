'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { KeyRound, Plus, ShieldAlert } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/field';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { KeyLogEntry } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * Screen 68 — the key log, and the one screen in the admin panel with a
 * genuinely locked state.
 *
 * §21 item 12: holding customer keys permanently is not enabled until a
 * liability policy exists. That is not a nice-to-have gate — without cover the
 * owner carries the risk personally and the customer has none, so the screen
 * says exactly that rather than a generic "feature unavailable".
 *
 * Toggle "Haftpflichtversicherung" in the demo controls to switch between the
 * two states.
 */
export default function KeyLogPage() {
  const t = useTranslations('admin.keys');
  const format = useFormatter();
  const hydrated = useHydrated();

  const keyLog = useStore((s) => s.data.keyLog);
  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const settings = useStore((s) => s.settings);
  const patchData = useStore((s) => s.patchData);
  const now = useNow();

  const [adding, setAdding] = useState(false);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  if (!settings.hasLiabilityInsurance) {
    return (
      <div className="max-w-2xl">
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <div className="mt-8 flex gap-4 rounded-[var(--radius-lg)] border border-status-warning-line bg-status-warning p-6 text-status-warning-fg">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <h2 className="font-medium">{t('lockedTitle')}</h2>
            <p className="mt-2 text-sm">{t('lockedBody')}</p>
          </div>
        </div>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/admin/einstellungen?tab=fees">{t('lockedAction')}</Link>
        </Button>
        <p className="mt-3 text-xs text-ink-tertiary">{t('lockedHint')}</p>
      </div>
    );
  }

  const columns: Column<KeyLogEntry>[] = [
    {
      key: 'property',
      header: t('colProperty'),
      primary: true,
      cell: (k) => properties.find((p) => p.id === k.propertyId)?.label ?? '—',
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      cell: (k) => (
        <span
          className={cn(
            'rounded-sm border px-1.5 py-0.5 text-xs',
            k.status === 'held'
              ? 'border-status-info-line bg-status-info text-status-info-fg'
              : 'border-status-neutral-line bg-status-neutral text-status-neutral-fg',
          )}
        >
          {k.status === 'held' ? t('held') : t('returned')}
        </span>
      ),
    },
    {
      key: 'customer',
      header: t('colCustomer'),
      cell: (k) => {
        const property = properties.find((p) => p.id === k.propertyId);
        const c = customers.find((x) => x.id === property?.customerId);
        return c ? `${c.firstName} ${c.lastName}` : '—';
      },
    },
    {
      key: 'received',
      header: t('colReceived'),
      cell: (k) => (
        <span data-numeric className="text-ink-secondary">
          {format.dateTime(new Date(k.receivedAt), 'short')}
        </span>
      ),
    },
    { key: 'by', header: t('colBy'), cell: (k) => k.receivedBy },
    {
      key: 'storage',
      header: t('colStorage'),
      cell: (k) => <span className="text-ink-secondary">{k.storageLocation}</span>,
    },
    {
      key: 'action',
      header: t('colAction'),
      align: 'end',
      // Safe because this DataView passes no `onSelect` — with one, the mobile
      // branch wraps the whole card in a <button> and this would nest controls.
      cell: (k) =>
        k.status === 'held' ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              patchData({
                keyLog: keyLog.map((entry) =>
                  entry.id === k.id
                    ? { ...entry, status: 'returned' as const, returnedAt: now.toISOString() }
                    : entry,
                ),
              });
              toast.success(t('returnDone'));
            }}
          >
            {t('returnAction')}
          </Button>
        ) : (
          <span data-numeric className="text-sm text-ink-tertiary">
            {k.returnedAt ? format.dateTime(new Date(k.returnedAt), 'short') : '—'}
          </span>
        ),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-type text-3xl">{t('title')}</h1>
          <p className="mt-2 text-ink-secondary">{t('lead')}</p>
        </div>
        <Button size="sm" disabled={adding} onClick={() => setAdding(true)}>
          <Plus className="size-3.5" aria-hidden />
          {t('addAction')}
        </Button>
      </div>

      {adding && (
        <form
          className="surface-card mt-8 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const propertyId = String(form.get('propertyId') ?? '');
            if (!propertyId) return;
            patchData({
              keyLog: [
                ...keyLog,
                {
                  // Length first: `now` only ticks every 30s, so a bare
                  // timestamp collides for two keys added in one sitting.
                  id: `key_${keyLog.length}_${now.getTime().toString(36).slice(-4)}`,
                  propertyId,
                  receivedAt: now.toISOString(),
                  receivedBy: String(form.get('receivedBy') ?? ''),
                  storageLocation: String(form.get('storageLocation') ?? ''),
                  status: 'held',
                },
              ],
            });
            setAdding(false);
            toast.success(t('addDone'));
          }}
        >
          <h2 className="display-type text-xl">{t('newTitle')}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <Field label={t('colProperty')}>
              {(props) => (
                <Select {...props} name="propertyId" required defaultValue="">
                  <option value="" disabled>
                    {t('newPropertyPlaceholder')}
                  </option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} — {p.street}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('colBy')}>
              {(props) => <Input {...props} name="receivedBy" required />}
            </Field>
            <Field label={t('colStorage')} hint={t('newStorageHint')}>
              {(props) => <Input {...props} name="storageLocation" required />}
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit">{t('newSave')}</Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              {t('dismiss')}
            </Button>
          </div>
        </form>
      )}

      <DataView
        className="mt-8"
        items={keyLog}
        columns={columns}
        getKey={(k) => k.id}
        caption={t('title')}
        empty={<EmptyState icon={KeyRound} title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
