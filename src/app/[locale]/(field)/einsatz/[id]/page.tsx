'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Check,
  DoorClosed,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  PawPrint,
  Phone,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { BottomActionBar, BottomActionBarSpacer } from '@/components/ui/bottom-action-bar';
import { canSeeAccessCodes, useHydrated, useNow, useStore } from '@/mock/store';

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const METHOD_KEY = {
  'customer-present': 'method.customer-present',
  'key-left': 'method.key-left',
  'key-box': 'method.key-box',
  'other-person': 'method.other-person',
} as const;

/**
 * Screen 86 — one job.
 *
 * This is the screen §13 exists for. The access block reads
 * `canSeeAccessCodes(role, { assignedToday })` — the same function the admin
 * key log reads — so moving the demo clock off the job day genuinely empties
 * it. The locked state says the rule out loud rather than showing dots, and
 * says it cannot be worked around, because a contractor who thinks it is a
 * glitch will phone the office to ask for the code.
 *
 * Codes stay masked until tapped even on the day, and the reveal notes that
 * access is logged. Both are cheap; both change how carefully a code is
 * treated.
 */
export default function FieldJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('field.job');
  const pt = useTranslations('account.property');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const now = useNow();

  const role = useStore((s) => s.demo.role);
  const memberId = useStore((s) => s.demo.currentMemberId);
  const bookings = useStore((s) => s.data.bookings);
  const properties = useStore((s) => s.data.properties);
  const services = useStore((s) => s.services);

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  if (!hydrated) return <p className="py-10 text-ink-tertiary">…</p>;

  const booking = bookings.find((b) => b.id === id);
  if (!booking) return <p className="py-10 text-ink-tertiary">—</p>;

  const property = properties.find((p) => p.id === booking.propertyId);
  const assignedToday =
    booking.assigneeId === memberId && sameDay(new Date(booking.start), now);
  const canSee = canSeeAccessCodes(role, { assignedToday });

  const end = new Date(new Date(booking.start).getTime() + booking.arrivalWindow * 60_000);
  const checkedIn = Boolean(booking.checkInAt);
  const finished = Boolean(booking.checkOutAt);

  const secret = (key: string, value: string) => (
    <div className="flex items-center justify-between gap-3 border-b border-line-subtle py-3">
      <span className="text-sm text-ink-secondary">{key}</span>
      <span className="flex items-center gap-2">
        <span data-numeric className="font-mono text-lg">
          {revealed[key] ? value : '••••'}
        </span>
        <button
          type="button"
          onClick={() => setRevealed({ ...revealed, [key]: !revealed[key] })}
          aria-label={revealed[key] ? t('hide') : t('reveal')}
          className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-sunken"
        >
          {revealed[key] ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </span>
    </div>
  );

  const plain = (key: string, value: string) => (
    <div className="flex items-start justify-between gap-3 border-b border-line-subtle py-3">
      <span className="shrink-0 text-sm text-ink-secondary">{key}</span>
      <span className="text-end">{value}</span>
    </div>
  );

  return (
    <div className="py-6">
      <Button asChild variant="link" className="mb-4">
        <Link href="/einsatz">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <h1 className="display-type text-2xl">{property?.street ?? '—'}</h1>
      <p className="mt-1 text-ink-secondary">
        {property && (
          <>
            <span data-numeric>{property.postcode}</span> {property.city}
          </>
        )}
      </p>
      <p data-numeric className="mt-3 text-ink-secondary">
        {t('arrival', {
          from: format.dateTime(new Date(booking.start), 'time'),
          to: format.dateTime(end, 'time'),
        })}
      </p>
      <p data-numeric className="text-sm text-ink-tertiary">
        {t('duration', { hours: booking.duration / 60 })}
      </p>

      {property && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            `${property.street}, ${property.postcode} ${property.city}`,
          )}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-line px-4 text-sm font-medium transition-colors hover:bg-sunken"
        >
          <MapPin className="size-4" aria-hidden />
          {t('navigate')}
        </a>
      )}

      <section className="mt-8">
        <h2 className="label-type text-ink-tertiary">{t('tasksTitle')}</h2>
        <p className="mt-2">
          {services.find((s) => s.slug === booking.serviceSlug)?.name[locale] ?? '—'}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 label-type text-ink-tertiary">
          <DoorClosed className="size-3.5" aria-hidden />
          {t('accessTitle')}
        </h2>

        {!canSee ? (
          <div className="mt-3 flex gap-3 border-l-2 border-rule bg-sunken p-4">
            <Lock className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
            <div>
              <h3 className="text-sm font-medium">{t('accessLockedTitle')}</h3>
              <p className="mt-1 text-sm text-ink-secondary">{t('accessLockedBody')}</p>
            </div>
          </div>
        ) : property?.access ? (
          <div className="mt-2">
            {plain(t('accessMethod'), pt(METHOD_KEY[property.access.method]))}
            {property.access.keyLocation &&
              plain(t('keyLocation'), property.access.keyLocation)}
            {property.access.boxLocation &&
              plain(t('boxLocation'), property.access.boxLocation)}
            {property.access.boxCode && secret(t('boxCode'), property.access.boxCode)}
            {property.access.alarmCode &&
              secret(t('alarmCode'), property.access.alarmCode)}
            {property.access.keyReturnLocation &&
              plain(t('keyReturn'), property.access.keyReturnLocation)}
            {property.access.personName &&
              plain(
                t('contactPerson'),
                `${property.access.personName}${
                  property.access.personRelation
                    ? ` (${property.access.personRelation})`
                    : ''
                }`,
              )}
            {(property.access.contactPhone ?? property.access.emergencyPhone) && (
              <a
                href={`tel:${(
                  property.access.contactPhone ?? property.access.emergencyPhone
                )?.replace(/\s/g, '')}`}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-line px-4 text-sm font-medium transition-colors hover:bg-sunken"
              >
                <Phone className="size-4" aria-hidden />
                <span data-numeric>
                  {property.access.contactPhone ?? property.access.emergencyPhone}
                </span>
              </a>
            )}
            <p className="mt-3 text-sm text-ink-tertiary">{t('revealNote')}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-tertiary">—</p>
        )}
      </section>

      {property?.permanentNotes && (
        <section className="mt-8">
          <h2 className="label-type text-ink-tertiary">{t('notesTitle')}</h2>
          <p className="mt-2 text-ink-secondary">{property.permanentNotes}</p>
          {property.hasPets && (
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-secondary">
              <PawPrint className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
              {t('petNote')}
            </p>
          )}
        </section>
      )}

      {finished ? (
        <div className="mt-10 flex gap-3 border-l-2 border-status-success-line bg-status-success p-5">
          <Check className="mt-0.5 size-4 shrink-0 text-status-success-fg" aria-hidden />
          <div>
            <h2 className="font-medium text-status-success-fg">{t('doneTitle')}</h2>
            <p className="mt-1 text-sm text-status-success-fg">{t('doneBody')}</p>
          </div>
        </div>
      ) : (
        <>
          <BottomActionBarSpacer className="h-[calc(8rem+env(safe-area-inset-bottom))]" />
          <BottomActionBar
            visibility="always"
            className="mx-auto max-w-[26rem]"
          >
            <div className="w-full space-y-2">
              <Button asChild block size="lg">
                <Link href={`/einsatz/${booking.id}/check`}>
                  {checkedIn ? t('checkOutAction') : t('checkInAction')}
                </Link>
              </Button>
              <Button asChild block variant="quiet">
                <Link href={`/einsatz/${booking.id}/kein-zutritt`}>
                  {t('noAccessAction')}
                </Link>
              </Button>
            </div>
          </BottomActionBar>
        </>
      )}
    </div>
  );
}
