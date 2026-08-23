'use client';

import { use, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { ArrowRight, CalendarClock, CalendarX, Send } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { OfferShell } from '@/components/offer/offer-shell';
import { HoldTimer } from '@/components/offer/hold-timer';
import { useOffer } from '@/components/offer/use-offer';
import {
  addMinutes,
  availabilityCalendar,
  startOfDay,
  type Slot,
} from '@/mock/engines/availability';
import { offerHours } from '@/mock/engines/offers';
import { arrivalWindowMinutes } from '@/mock/engines/pricing';
import { isReturningCustomer } from '@/lib/offer-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

const DAYS_SHOWN = 28;
/** §—: a first job is proposed, not taken. Three is enough to be useful and
 *  few enough that the office can decide in one look. */
const MAX_PROPOSALS = 3;

/**
 * Screen 25 — the live availability picker.
 *
 * This replaced the three fixed proposals of §21 item 5 on the client's
 * instruction. Two consequences are visible here:
 *
 *  · every slot shown is genuinely bookable — it comes from the same engine
 *    that will refuse a conflicting booking, travel buffers included;
 *  · picking one starts a 15-minute hold, because a live picker makes the
 *    §20.2 double-booking race far more likely than three curated slots did.
 *
 * Blocked days are shown disabled with a reason rather than hidden. "Why can I
 * not pick Sunday" should never be a mystery.
 *
 * The screen now has two modes, decided by whether we have served this person
 * before. A returning customer books outright: we know the place, the access
 * and the history, so there is nothing left to check and making them wait for
 * a confirmation mail would be theatre. A first-time customer proposes up to
 * three dates and the office picks one — the first job is the one worth a look
 * before the calendar is spent, and a single take-it-or-leave-it slot offered
 * to somebody with no relationship yet is how a quote quietly dies.
 */
export default function SlotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('offer.slot');
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const data = useOffer(id);
  const settings = useStore((s) => s.settings);
  const bookings = useStore((s) => s.data.bookings);
  const properties = useStore((s) => s.data.properties);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const credits = useStore((s) => s.data.credits);
  const closures = useStore((s) => s.data.closures);
  const events = useStore((s) => s.data.events);
  const holds = useStore((s) => s.holds);
  const holdOfferSlot = useStore((s) => s.holdOfferSlot);
  const proposeOfferSlots = useStore((s) => s.proposeOfferSlots);

  const [openDay, setOpenDay] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  const hours = data ? offerHours(data.offer) : 0;
  const duration = Math.round(hours * 60);

  const calendar = useMemo(() => {
    if (!data) return [];
    return availabilityCalendar({
      from: startOfDay(now),
      days: DAYS_SHOWN,
      durationMinutes: duration,
      property: data.property,
      bookings,
      // A customer must not be blocked by their own hold.
      holds: holds.filter((h) => h.offerId !== data.offer.id),
      closures,
      /* A viewing the office booked is time the owner is standing somewhere
         else. Without this the picker offers it and the day double-books. */
      events,
      properties,
      settings,
      now,
    });
  }, [data, now, duration, bookings, holds, closures, events, properties, settings]);

  if (!hydrated) return <div className="p-gutter text-ink-tertiary">…</div>;
  if (!data) return null;

  const { offer, hold, customer } = data;
  const returning = isReturningCustomer(customer.id, bookings, subscriptions, credits);
  const proposals = offer.proposedSlots ?? [];
  /* Sent in, nothing back yet. Nothing on this page is actionable in that
     state and pretending otherwise — leaving the grid live — invites a second
     set of dates that would contradict the first. */
  const awaitingOffice = proposals.length > 0 && !offer.slotConfirmedAt;

  const totalSlots = calendar.reduce((sum, day) => sum + day.slots.length, 0);
  const selectedDay = openDay ?? calendar.find((d) => d.slots.length > 0)?.date ?? null;
  const daySlots = calendar.find((d) => d.date === selectedDay)?.slots ?? [];

  function pick(slot: Slot) {
    if (returning) {
      holdOfferSlot(offer.id, slot, now);
      return;
    }
    setPicked((current) =>
      current.includes(slot.start)
        ? current.filter((s) => s !== slot.start)
        : current.length >= MAX_PROPOSALS
          ? current
          : [...current, slot.start],
    );
  }

  function sendProposals() {
    proposeOfferSlots(offer.id, picked);
  }

  const blockedLabel = (reason: string | null) =>
    reason === 'too-soon'
      ? t('dayTooSoon')
      : reason === 'closure-period'
        ? t('dayClosure')
        : reason === 'at-capacity'
          ? t('dayFull')
          : t('dayClosed');

  if (awaitingOffice) {
    return (
      <OfferShell offer={offer} step="termin">
        <div className="max-w-2xl">
          <h1 className="display-type text-[clamp(1.75rem,3.6vw,2.75rem)]">
            {t('waitingTitle')}
          </h1>
          <p className="mt-4 text-ink-secondary">
            {t('waitingBody', { hours: settings.responseTimeHours })}
          </p>
          <ul className="mt-8 space-y-2">
            {proposals.map((start, i) => (
              <li
                key={start}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-sunken px-4 py-3"
              >
                <CalendarClock className="size-4 shrink-0 text-ink-secondary" aria-hidden />
                <span data-numeric>
                  {t('proposalN', { n: i + 1 })} ·{' '}
                  {format.dateTime(new Date(start), 'full')},{' '}
                  {format.dateTime(new Date(start), 'time')}
                </span>
              </li>
            ))}
          </ul>
          {/* The way back out. Without it the only exit from this state is the
              browser's back button, which lands on a quote that now looks
              unanswered. */}
          <Button
            variant="secondary"
            className="mt-8"
            onClick={() => proposeOfferSlots(offer.id, [])}
          >
            {t('waitingChange')}
          </Button>
        </div>
      </OfferShell>
    );
  }

  return (
    <OfferShell offer={offer} step="termin">
      <div className="max-w-3xl">
        <h1 className="display-type text-[clamp(1.75rem,3.6vw,2.75rem)]">
          {returning ? t('title') : t('titleProposal')}
        </h1>
        <p className="mt-4 text-ink-secondary">
          {returning ? t('lead') : t('leadProposal', { max: MAX_PROPOSALS })}
        </p>
        <p data-numeric className="mt-2 text-sm text-ink-tertiary">
          {t('durationNote', { hours })}
        </p>
      </div>

      {totalSlots === 0 ? (
        <EmptyState
          icon={CalendarX}
          className="mt-10"
          title={t('noneTitle')}
          body={t('noneBody')}
        />
      ) : (
        <>
          <ul className="mt-10 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
            {calendar.map((day) => {
              const date = new Date(day.date);
              const disabled = Boolean(day.blocked) || day.slots.length === 0;
              const active = selectedDay === day.date;
              /* A day already carrying one of the picks needs to say so — the
                 picks live on the slot buttons, which are a click away. */
              const chosenHere = picked.some((s) => s.startsWith(day.date));
              return (
                <li key={day.date}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpenDay(day.date)}
                    aria-pressed={active}
                    className={cn(
                      'flex h-full w-full flex-col items-center rounded-[var(--radius-md)] border px-2 py-3 text-center transition-colors',
                      disabled
                        ? 'cursor-not-allowed border-line-subtle bg-sunken text-ink-tertiary opacity-60'
                        : 'border-line hover:bg-sunken',
                      active && !disabled && 'border-line-strong bg-accent-subtle',
                      chosenHere && !active && 'border-line-strong',
                    )}
                  >
                    <span className="label-type text-ink-tertiary">
                      {format.dateTime(date, { weekday: 'short' })}
                    </span>
                    <span data-numeric className="mt-1 text-lg">
                      {format.dateTime(date, { day: 'numeric' })}
                    </span>
                    <span className="text-xs text-ink-tertiary">
                      {format.dateTime(date, { month: 'short' })}
                    </span>
                    <span className="mt-1 text-[0.625rem] leading-tight text-ink-tertiary">
                      {day.blocked ? (
                        blockedLabel(day.blocked)
                      ) : day.slots.length === 0 ? (
                        t('dayFull')
                      ) : (
                        <span data-numeric>{day.slots.length} ×</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selectedDay && (
            <section className="mt-10">
              <h2 className="subhead-type text-xl">
                {t('slotsFor', {
                  date: format.dateTime(new Date(selectedDay), 'dayMonth'),
                })}
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {daySlots.map((slot) => {
                  const start = new Date(slot.start);
                  const windowEnd = addMinutes(start, arrivalWindowMinutes(hours));
                  const active = returning
                    ? hold?.start === slot.start
                    : picked.includes(slot.start);
                  /* Greyed rather than hidden once three are chosen: a slot
                     that vanishes reads as "no longer free". */
                  const full = !returning && !active && picked.length >= MAX_PROPOSALS;
                  return (
                    <li key={slot.start}>
                      <button
                        type="button"
                        onClick={() => pick(slot)}
                        disabled={full}
                        aria-pressed={active}
                        className={cn(
                          'flex flex-col items-start rounded-[var(--radius-md)] border px-4 py-3 text-left transition-colors',
                          active
                            ? 'border-line-strong bg-accent-subtle'
                            : 'border-line hover:bg-sunken',
                          full && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                        )}
                      >
                        <span data-numeric className="font-medium">
                          {format.dateTime(start, 'time')}
                        </span>
                        <span data-numeric className="text-xs text-ink-tertiary">
                          {t('arrivalWindow', {
                            from: format.dateTime(start, 'time'),
                            to: format.dateTime(windowEnd, 'time'),
                          })}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {returning && hold && (
        <div className="mt-10 max-w-2xl space-y-5">
          <HoldTimer hold={hold} />
          <Button
            size="lg"
            onClick={() => router.push(`/offerte/${offer.id}/unterschrift`)}
          >
            {t('continue')}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}

      {/* The office has answered: one date, reserved, and the flow rejoins the
          returning customer's at exactly this point. */}
      {!returning && offer.slotConfirmedAt && hold && (
        <div className="mt-10 max-w-2xl space-y-5">
          <HoldTimer hold={hold} />
          <Button
            size="lg"
            onClick={() => router.push(`/offerte/${offer.id}/unterschrift`)}
          >
            {t('continue')}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}

      {!returning && !offer.slotConfirmedAt && (
        <div className="mt-10 max-w-2xl space-y-4">
          <p data-numeric className="text-sm text-ink-secondary">
            {t('pickedCount', { n: picked.length, max: MAX_PROPOSALS })}
          </p>
          <Button size="lg" disabled={picked.length === 0} onClick={sendProposals}>
            {t('sendProposals')}
            <Send className="size-4" aria-hidden />
          </Button>
          <p className="text-sm text-ink-tertiary">{t('proposalHint')}</p>
        </div>
      )}
    </OfferShell>
  );
}
