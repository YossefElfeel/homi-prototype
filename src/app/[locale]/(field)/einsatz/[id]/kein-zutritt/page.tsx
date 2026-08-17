'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ArrowLeft, Camera, Check, Clock, Phone } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { BottomActionBar, BottomActionBarSpacer } from '@/components/ui/bottom-action-bar';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

/** §4.2 — the fee only stands if the wait actually happened. */
const WAIT_MINUTES = 15;

const REASONS = [
  { value: 'no-one', key: 'reasonNoOne' },
  { value: 'wrong-code', key: 'reasonWrongCode' },
  { value: 'no-key', key: 'reasonNoKey' },
  { value: 'blocked', key: 'reasonBlocked' },
  { value: 'other', key: 'reasonOther' },
] as const;

/**
 * Screen 88 — no access.
 *
 * The wait comes first, before the form. §4.2 lets Homivaro charge for a
 * no-access visit, and that charge only holds up if the contractor called and
 * waited — so the screen puts that instruction above everything and gives the
 * phone buttons to do it.
 *
 * The fee is stated plainly, together with who decides it: the office, not the
 * person at the door. A contractor who thinks they are levying a penalty
 * negotiates on the doorstep; one who is filing a report does not.
 */
export default function FieldNoAccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('field.noAccess');
  const hydrated = useHydrated();
  const now = useNow();

  const bookings = useStore((s) => s.data.bookings);
  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const settings = useStore((s) => s.settings);
  const brand = useTranslations('brand');
  const recordNoAccess = useStore((s) => s.recordNoAccess);

  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(false);
  const [sent, setSent] = useState(false);

  if (!hydrated) return <p className="py-10 text-ink-tertiary">…</p>;

  const booking = bookings.find((b) => b.id === id);
  if (!booking) return <p className="py-10 text-ink-tertiary">—</p>;

  const property = properties.find((p) => p.id === booking.propertyId);
  const customer = customers.find((c) => c.id === booking.customerId);

  function submit() {
    if (!booking || !reason) return;
    /*
     * The photo was tracked in local state and never written anywhere. This
     * screen's own copy says the fee "only stands if the wait actually
     * happened" — so the single piece of evidence behind a charge to a
     * customer was being discarded on submit.
     */
    recordNoAccess(booking.id, { reason, note, photo }, now);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="py-10">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-status-success text-status-success-fg">
          <Check className="size-5" aria-hidden />
        </span>
        <h1 className="display-type mt-6 text-2xl">{t('sentTitle')}</h1>
        <p className="mt-3 text-ink-secondary">{t('sentBody')}</p>
        <Button asChild className="mt-8 w-full">
          <Link href="/einsatz">{t('nextJob')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-6">
      <Button asChild variant="link" className="mb-4">
        <Link href={`/einsatz/${booking.id}`}>
          <ArrowLeft className="size-4" aria-hidden />
          {t('backToJob')}
        </Link>
      </Button>

      <h1 className="display-type text-2xl">{t('title')}</h1>
      <p className="mt-2 text-ink-secondary">{t('lead')}</p>

      <section className="mt-8 border-l-2 border-status-warning-line bg-status-warning p-5">
        <h2 className="flex items-center gap-2 font-medium text-status-warning-fg">
          <Clock className="size-4 shrink-0" aria-hidden />
          {t('waitTitle', { minutes: WAIT_MINUTES })}
        </h2>
        <p className="mt-2 text-sm text-status-warning-fg">{t('waitBody')}</p>
        <div className="mt-4 flex flex-col gap-2">
          <a
            href={`tel:${(customer?.phone ?? property?.access?.contactPhone ?? '').replace(/\s/g, '')}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-page px-4 text-sm font-medium"
          >
            <Phone className="size-4" aria-hidden />
            {t('callCustomer')}
          </a>
          <a
            href={`tel:${brand('mobile').replace(/\s/g, '')}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-status-warning-line px-4 text-sm font-medium text-status-warning-fg"
          >
            <Phone className="size-4" aria-hidden />
            {t('callOffice')}
          </a>
        </div>
      </section>

      <fieldset className="mt-8">
        <legend className="label-type text-ink-tertiary">{t('reasonTitle')}</legend>
        <div className="mt-3 space-y-2">
          {REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={reason === r.value}
              onClick={() => setReason(r.value)}
              className={cn(
                'flex min-h-11 w-full items-center rounded-[var(--radius-sm)] border px-4 text-start text-sm transition-colors',
                reason === r.value
                  ? 'border-accent bg-accent-subtle font-medium text-ink'
                  : 'border-line text-ink-secondary hover:bg-sunken',
              )}
            >
              {t(r.key)}
            </button>
          ))}
        </div>
      </fieldset>

      <Field label={t('noteLabel')} hint={t('noteHint')} className="mt-8">
        {(props) => (
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            {...props}
          />
        )}
      </Field>

      <section className="mt-8">
        <h2 className="label-type text-ink-tertiary">{t('photoTitle')}</h2>
        <p className="mt-1 text-sm text-ink-tertiary">{t('photoHint')}</p>
        {photo ? (
          <ImagePlaceholder
            seed={`noaccess_${booking.id}`}
            alt={t('photoTitle')}
            className="mt-3 aspect-[4/3]"
          />
        ) : (
          <Button variant="secondary" className="mt-3 w-full" onClick={() => setPhoto(true)}>
            <Camera className="size-4" aria-hidden />
            {t('photoTitle')}
          </Button>
        )}
      </section>

      <section className="mt-8 flex gap-3 border-l-2 border-rule bg-sunken p-5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
        <div>
          <h2 className="text-sm font-medium">{t('feeTitle')}</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            {t('feeBody', { percent: settings.noAccessFeePercent })}
          </p>
        </div>
      </section>

      <BottomActionBarSpacer />

      <BottomActionBar visibility="always" className="mx-auto max-w-[26rem]">
        <Button block size="lg" disabled={!reason} onClick={submit}>
          {t('submit')}
        </Button>
      </BottomActionBar>
    </div>
  );
}
