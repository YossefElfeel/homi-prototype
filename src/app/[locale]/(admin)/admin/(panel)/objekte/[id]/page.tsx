'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/field';
import { useHydrated, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

const ACCESS_LABELS: Record<string, string> = {
  'customer-present': 'Kunde ist da',
  'key-left': 'Schlüssel liegt bereit',
  'key-box': 'Schlüsselkasten mit Code',
  'other-person': 'Andere Person ist da',
};

/**
 * Screen 67 — the property record.
 *
 * The standing notes matter more than they look: they surface on every job at
 * this address, which is how "the dog is called Nala" stops being something
 * one person happens to remember.
 */
export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.property');
  const rt = useTranslations('admin.request');
  const kt = useTranslations('admin.keys');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();

  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const bookings = useStore((s) => s.data.bookings);
  const keyLog = useStore((s) => s.data.keyLog);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const data = useStore((s) => s.data);
  const patchData = useStore((s) => s.patchData);

  const [revealed, setRevealed] = useState(false);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const property = properties.find((p) => p.id === id);
  if (!property) return <p className="text-ink-tertiary">—</p>;

  const customer = customers.find((c) => c.id === property.customerId);
  const jobs = bookings
    .filter((b) => b.propertyId === property.id)
    .sort((a, b) => b.start.localeCompare(a.start));
  const keys = keyLog.filter((k) => k.propertyId === property.id);
  const access = property.access;
  const hasSecrets = Boolean(access?.boxCode || access?.alarmCode);

  function setNotes(notes: string) {
    patchData({
      properties: data.properties.map((p) =>
        p.id === property!.id ? { ...p, permanentNotes: notes } : p,
      ),
    });
  }

  return (
    <div>
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/objekte">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <h1 className="display-type text-3xl">{property.label}</h1>
      <p className="mt-2 text-ink-secondary">
        {property.street}, <span data-numeric>{property.postcode}</span> {property.city}
        {customer && (
          <>
            {' · '}
            <Link
              href={`/admin/kunden/${customer.id}`}
              className="underline decoration-from-font underline-offset-4"
            >
              {customer.firstName} {customer.lastName}
            </Link>
          </>
        )}
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          <section>
            <h2 className="display-type text-xl">{t('specsTitle')}</h2>
            <dl className="mt-4 grid gap-px border border-line-subtle bg-line-subtle sm:grid-cols-3">
              {[
                [rt('area'), `${property.area} m²`],
                [rt('rooms'), String(property.rooms)],
                [rt('bathrooms'), String(property.bathrooms)],
                [rt('floor'), String(property.floor)],
                [rt('elevator'), property.hasElevator ? 'Ja' : 'Nein'],
                [rt('pets'), property.hasPets ? 'Ja' : 'Nein'],
              ].map(([label, value]) => (
                <div key={label} className="bg-page p-4">
                  <dt className="label-type text-ink-tertiary">{label}</dt>
                  <dd data-numeric className="mt-1.5">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="display-type text-xl">{t('accessTitle')}</h2>
              {hasSecrets && (
                <Button variant="secondary" size="sm" onClick={() => setRevealed((v) => !v)}>
                  {revealed ? (
                    <>
                      <EyeOff className="size-3.5" aria-hidden />
                      {rt('accessHide')}
                    </>
                  ) : (
                    <>
                      <Eye className="size-3.5" aria-hidden />
                      {rt('accessReveal')}
                    </>
                  )}
                </Button>
              )}
            </div>
            <dl className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
              <Row label="Methode">{access ? ACCESS_LABELS[access.method] : '—'}</Row>
              {access?.keyLocation && <Row label="Ort">{access.keyLocation}</Row>}
              {access?.boxLocation && <Row label="Kasten">{access.boxLocation}</Row>}
              {access?.boxCode && (
                <Row label="Code">
                  <Secret value={access.boxCode} revealed={revealed} />
                </Row>
              )}
              {access?.alarmCode && (
                <Row label="Alarmcode">
                  <Secret value={access.alarmCode} revealed={revealed} />
                </Row>
              )}
            </dl>
            <p className="mt-3 flex gap-2 text-xs text-ink-tertiary">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {rt('accessGuard')}
            </p>
          </section>

          <section>
            <h2 className="display-type text-xl">{t('historyTitle')}</h2>
            {jobs.length === 0 ? (
              <p className="mt-3 text-sm text-ink-tertiary">{t('historyEmpty')}</p>
            ) : (
              <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/admin/buchungen/${job.id}`}
                      className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-sunken"
                    >
                      <span>
                        <span data-numeric className="block">
                          {format.dateTime(new Date(job.start), 'full')}
                        </span>
                        <span className="block text-sm text-ink-secondary">
                          {services.find((s) => s.slug === job.serviceSlug)?.name[locale]}
                        </span>
                      </span>
                      <StatusBadge entity="booking" state={job.status} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <div className="surface-card p-5">
            <h2 className="flex items-center gap-2 label-type text-ink-tertiary">
              <KeyRound className="size-3.5" aria-hidden />
              {t('keysTitle')}
            </h2>
            {!settings.hasLiabilityInsurance ? (
              <p className="mt-2 text-sm text-ink-tertiary">{kt('lockedTitle')}</p>
            ) : keys.length === 0 ? (
              <p className="mt-2 text-sm text-ink-tertiary">{kt('emptyTitle')}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {keys.map((key) => (
                  <li key={key.id} className="flex justify-between gap-3">
                    <span className="text-ink-secondary">{key.storageLocation}</span>
                    <span data-numeric className="shrink-0 text-ink-tertiary">
                      {format.dateTime(new Date(key.receivedAt), 'short')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-dashed border-line bg-sunken p-5">
            <h2 className="font-medium">{t('notesTitle')}</h2>
            <p className="mt-1 text-xs text-ink-tertiary">{t('notesHint')}</p>
            <Textarea
              className="mt-3 min-h-24 bg-page"
              placeholder={t('notesPlaceholder')}
              value={property.permanentNotes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-ink-tertiary">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Secret({ value, revealed }: { value: string; revealed: boolean }) {
  return (
    <span
      data-numeric
      className={cn(
        'rounded-sm px-1.5 py-0.5',
        revealed ? 'bg-status-warning text-status-warning-fg' : 'bg-sunken tracking-widest',
      )}
    >
      {revealed ? value : '••••'}
    </span>
  );
}
