'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Check,
  Clock,
  DoorClosed,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  PawPrint,
  Phone,
  Truck,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { BottomActionBar, BottomActionBarSpacer } from '@/components/ui/bottom-action-bar';
import { canSeeAccessCodes, useHydrated, useNow, useStore } from '@/mock/store';
import {
  hoursOf,
  isValidWorkHours,
  MAX_WORK_HOURS,
  minutesOf,
  workEntryFor,
} from '@/lib/workforce';

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
  const offers = useStore((s) => s.data.offers);
  const requests = useStore((s) => s.data.requests);
  const services = useStore((s) => s.services);
  const recordWorkHours = useStore((s) => s.recordWorkHours);

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  /* Null while the number on the record is the number on screen. Opening the
     box is what starts an edit, so a stale draft cannot survive a correction
     made from the office in between. */
  const [editingHours, setEditingHours] = useState<string | null>(null);

  if (!hydrated) return <p className="py-10 text-ink-tertiary">…</p>;

  const booking = bookings.find((b) => b.id === id);
  if (!booking) return <p className="py-10 text-ink-tertiary">—</p>;

  const property = properties.find((p) => p.id === booking.propertyId);
  /*
   * The collection stop, reached the only way a booking can reach one: through
   * the quote it came from. A plan visit has no request and needs none — a
   * package is recurring cleaning, and nothing recurring is collected first.
   */
  const offer = offers.find((o) => o.id === booking.offerId);
  const pickup = offer ? requests.find((r) => r.id === offer.requestId)?.pickup : undefined;
  const assignedToday =
    booking.assigneeId === memberId && sameDay(new Date(booking.start), now);
  const canSee = canSeeAccessCodes(role, { assignedToday });

  const end = new Date(new Date(booking.start).getTime() + booking.arrivalWindow * 60_000);
  const checkedIn = Boolean(booking.checkInAt);
  const finished = Boolean(booking.checkOutAt);

  /*
   * The hours, and whether they can still be touched.
   *
   * Open until the office accepts the job — a five typed for a five-and-a-half
   * is noticed on the drive home, and the alternative to fixing it here is a
   * phone call. Closed the moment it is approved, because at that point the
   * number has been priced and changing it silently would move money.
   */
  const entry = workEntryFor(booking, memberId);
  const hoursLocked = booking.status !== 'awaitingApproval';
  const draftHours = editingHours ?? String(entry ? hoursOf(entry.minutes) : '');
  const draftOk = isValidWorkHours(Number(draftHours));

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
      {/*
        Directly under the street, above the town — the order somebody standing
        on the pavement reads it in.

        This is the screen the field belongs to. «3. OG links, Klingel Meier»
        used to be typed into the standing notes, which this page prints in a
        block much further down beside "dog in the living room" — so the one
        line that gets a cleaner through the front door arrived after the tasks
        and the access instructions, if it had been written at all.
      */}
      {property?.addressDetail && (
        <p className="mt-1 font-medium text-ink">{property.addressDetail}</p>
      )}
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

      {/*
        The stop before the job.

        This screen is read standing on a pavement, and until now it could only
        name one pavement. A furniture assembly may start at a shop or an old
        flat — and the person who has to go there was the only person in the
        chain who could not see that. It sits above the tasks because it
        happens before them, and it carries its own route link for the same
        reason the address above does: nobody types an address into a phone
        while holding a van key.
      */}
      {pickup && (
        <section className="mt-8 rounded-[var(--radius-lg)] border border-line bg-sunken p-5">
          <h2 className="flex items-center gap-2 label-type text-ink-tertiary">
            <Truck className="size-4" aria-hidden />
            {t('pickupTitle')}
          </h2>
          <p className="mt-2 font-medium">{pickup.street}</p>
          <p className="text-ink-secondary">
            <span data-numeric>{pickup.postcode}</span> {pickup.city}
          </p>
          {/* The floor is the whole difference between twenty minutes and an
              hour, so it is a line rather than a detail further down. */}
          <p data-numeric className="mt-1 text-sm text-ink-tertiary">
            {t('pickupFloor', { floor: pickup.floor })} ·{' '}
            {pickup.hasElevator ? t('pickupLift') : t('pickupNoLift')}
          </p>
          {pickup.note && <p className="mt-3 text-sm text-ink-secondary">{pickup.note}</p>}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${pickup.street}, ${pickup.postcode} ${pickup.city}`,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-line bg-page px-4 text-sm font-medium transition-colors hover:bg-sunken"
          >
            <MapPin className="size-4" aria-hidden />
            {t('navigate')}
          </a>
        </section>
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
          <div className="mt-3 flex gap-3 border-l-2 border-rule bg-sunken rounded-[var(--radius-lg)] p-4">
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
        <>
          <div className="mt-10 flex gap-3 border-l-2 border-status-success-line bg-status-success p-5">
            <Check className="mt-0.5 size-4 shrink-0 text-status-success-fg" aria-hidden />
            <div>
              <h2 className="font-medium text-status-success-fg">{t('doneTitle')}</h2>
              <p className="mt-1 text-sm text-status-success-fg">{t('doneBody')}</p>
            </div>
          </div>

          {/*
            What was reported, and the one chance to fix it.

            Until this wave the number went into the store at check-out and the
            person who typed it never saw it again — so a mistyped afternoon
            could only be corrected by ringing the office, which is exactly the
            workaround the field app exists to remove.
          */}
          <section className="mt-8">
            <h2 className="flex items-center gap-2 label-type text-ink-tertiary">
              <Clock className="size-3.5" aria-hidden />
              {t('hoursTitle')}
            </h2>
            <p data-numeric className="mt-2 text-lg">
              {entry
                ? t('hoursRecorded', { hours: hoursOf(entry.minutes) })
                : t('hoursNone')}
            </p>
            <p data-numeric className="mt-1 text-sm text-ink-tertiary">
              {t('hoursPlanned', { hours: booking.duration / 60 })}
            </p>

            {hoursLocked ? (
              <p className="mt-3 text-sm text-ink-tertiary">{t('hoursLocked')}</p>
            ) : editingHours === null ? (
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setEditingHours(String(entry ? hoursOf(entry.minutes) : ''))}
              >
                {t('hoursCorrect')}
              </Button>
            ) : (
              <div className="mt-4 space-y-3">
                <Field
                  label={t('hoursLabel')}
                  error={draftOk ? undefined : t('hoursInvalid', { max: MAX_WORK_HOURS })}
                >
                  {(props) => (
                    <Input
                      type="number"
                      step={0.5}
                      min={0.5}
                      max={MAX_WORK_HOURS}
                      inputMode="decimal"
                      value={draftHours}
                      onChange={(e) => setEditingHours(e.target.value)}
                      {...props}
                    />
                  )}
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!draftOk}
                    onClick={() => {
                      recordWorkHours(
                        {
                          bookingId: booking.id,
                          memberId,
                          minutes: minutesOf(Number(draftHours)),
                          source: 'field',
                        },
                        now,
                      );
                      setEditingHours(null);
                      toast.success(t('hoursSaved'));
                    }}
                  >
                    {t('hoursSave')}
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingHours(null)}>
                    {t('hoursCancel')}
                  </Button>
                </div>
              </div>
            )}
          </section>
        </>
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
