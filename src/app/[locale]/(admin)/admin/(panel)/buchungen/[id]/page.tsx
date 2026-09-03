'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  Check,
  Clock,
  DoorClosed,
  Lock,
  Plus,
  User,
  Users,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { CollapsibleSection, SectionGroup } from '@/components/ui/collapsible-section';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money, formatChf } from '@/components/ui/money';
import { Field, Input, Select } from '@/components/ui/field';
import { ConfirmDialog, useDismissLabel } from '@/components/ui/confirm-dialog';
import { SecretValue } from '@/components/ui/secret-value';
import type { Booking, TimelineEvent } from '@/mock/schema';
import { addMinutes } from '@/mock/engines/availability';
import { bookingAmount } from '@/lib/offer-facts';
/* `memberName` is not in this list, though wave 83 imported it from here: it
   is one implementation in `workforce.ts` now, and this screen would
   otherwise import two functions of the same name with different fallbacks —
   see the note on `labour-facts.memberName`. */
import { labourAmount, labourExpenses, labourHours, unpaidLabour } from '@/lib/labour-facts';
import { fromZoned, zonedParts } from '@/lib/business-time';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { areaLabel } from '@/lib/property-size';
import { serviceNeeds } from '@/lib/service-flow';
import {
  assignableTeam,
  assignmentWarnings,
  hasWorkRecord,
  hoursOf,
  isValidWorkHours,
  MAX_WORK_HOURS,
  memberById,
  memberName,
  minutesOf,
  varianceMinutes,
  workedMinutes,
} from '@/lib/workforce';

/** Not a member id and not "nobody" — see `assigning` below. */
const CURRENT = '\u0000current';

const ACCESS_LABELS: Record<string, string> = {
  'customer-present': 'Kunde ist da',
  'key-left': 'Schlüssel liegt bereit',
  'key-box': 'Schlüsselkasten mit Code',
  'other-person': 'Andere Person ist da',
};

/** Screen 63 — one booking, and everything that can be done to it. */
export default function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  /**
   * Which panel to open on arrival.
   *
   * The calendar's row menu offers reschedule and cancel directly. It could
   * not perform them there — a confirmation panel inside a dropdown is a
   * dialog inside a menu, and a second copy of each action is how the two
   * screens start disagreeing about what cancelling does. So the menu links
   * here and says which panel it meant, and there is still exactly one
   * implementation of every action.
   */
  searchParams: Promise<{ action?: string }>;
}) {
  const { id } = use(params);
  const { action } = use(searchParams);
  const t = useTranslations('admin.booking');
  const dismissLabel = useDismissLabel();
  const rt = useTranslations('admin.request');
  const statusT = useTranslations('status.booking');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();

  const bookings = useStore((s) => s.data.bookings);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const offers = useStore((s) => s.data.offers);
  const requests = useStore((s) => s.data.requests);
  const invoices = useStore((s) => s.data.invoices);
  const expenses = useStore((s) => s.data.expenses);
  const team = useStore((s) => s.data.team);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const plans = useStore((s) => s.plans);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const patchData = useStore((s) => s.patchData);
  const approveBooking = useStore((s) => s.approveBooking);
  const rescheduleBooking = useStore((s) => s.rescheduleBooking);
  const assignBooking = useStore((s) => s.assignBooking);
  const recordWorkHours = useStore((s) => s.recordWorkHours);
  const now = useNow();

  /*
   * The slot is open, the other two carry a summary while closed.
   *
   * Three cards of flat text — when, who, where — was most of the screen's
   * height for facts that are read once on arrival and then not again. The
   * name and the address are the two you keep glancing at, so they are the
   * summaries; everything behind them opens when it is actually needed.
   */
  const [openSections, setOpenSections] = useState<string[]>(() =>
    /* The list and the calendar both deep-link «Zuweisen» here. Landing on a
       folded section would be a link that appears to do nothing. */
    action === 'assign' ? ['slot', 'work'] : ['slot'],
  );
  const [rescheduling, setRescheduling] = useState(() => action === 'reschedule');
  const [confirming, setConfirming] = useState<'noAccess' | 'cancel' | null>(() =>
    action === 'cancel' ? 'cancel' : action === 'noAccess' ? 'noAccess' : null,
  );
  /*
   * Null while nothing is being edited; the id (or '' for nobody) while the
   * select is open. Not seeded from the record, so an assignment made in
   * another tab cannot be overwritten by a draft nobody meant to submit.
   *
   * `CURRENT` is the deep link's opening state: `?action=assign` has to open
   * the panel on whoever is on the job, and the job is not resolved yet at
   * this point — a `useState` initialiser runs before hydration. It resolves
   * to `booking.assigneeId` on the first render that has one, exactly as
   * pressing the button does.
   */
  const [assigning, setAssigning] = useState<string | null>(() =>
    action === 'assign' ? CURRENT : null,
  );
  /* Which person's hours, and the value being typed — never just the value.
     Correcting somebody's afternoon has to know whose it is. */
  const [editingHours, setEditingHours] = useState<{ memberId: string; value: string } | null>(
    null,
  );

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const booking = bookings.find((b) => b.id === id);
  if (!booking) return <p className="text-ink-tertiary">—</p>;

  const customer = customers.find((c) => c.id === booking.customerId)!;
  const property = properties.find((p) => p.id === booking.propertyId)!;
  const service = services.find((s) => s.slug === booking.serviceSlug)!;
  const offer = offers.find((o) => o.id === booking.offerId);
  /*
   * A `Booking` has no `requestId` — it reaches the request through the quote
   * it came from. Undefined for a plan visit, which has no request at all, and
   * that is the right answer there: a package visit is recurring cleaning, and
   * nothing recurring has a collection stop.
   */
  const jobPickup = offer
    ? requests.find((r) => r.id === offer.requestId)?.pickup
    : undefined;
  const invoice = invoices.find((i) => i.bookingId === booking.id);

  /* Oldest first, so two people on one job read in the order they were
     recorded rather than in store order — which is newest-first and would put
     the second pair of hands above the person who ran the job. */
  const labour = labourExpenses(expenses)
    .filter((e) => e.bookingId === booking.id)
    .sort((a, b) => a.incurredAt.localeCompare(b.incurredAt));
  const labourTotalHours = labourHours(labour);
  const labourPeople = new Set(labour.map((e) => e.labour.workerId)).size;
  const labourOpen = unpaidLabour(labour, now);

  const start = new Date(booking.start);
  const access = property.access;

  /*
   * `<input type="datetime-local">` has no timezone. The browser reads what is
   * typed as the *browser's* wall clock, and everything else in this product —
   * every rendered time, the scheduler, the whole seed — is Europe/Zurich.
   *
   * So the form was off by the reviewer's offset in both directions at once.
   * It opened on `booking.start.slice(0, 16)`, which is the raw UTC string, so
   * a 09:00 job showed as 07:00 in summer; and whatever was typed back was
   * parsed against the browser's zone, so an owner in Cairo typing 10:00 moved
   * the job to 09:00 Zurich. Both halves have to be Zurich or neither is.
   */
  const pad = (n: number) => String(n).padStart(2, '0');
  const localValue = (d: Date) => {
    const p = zonedParts(d);
    return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
  };
  const fromLocalValue = (value: string) => {
    const [date, time] = value.split('T');
    const [y, mo, d] = (date ?? '').split('-').map(Number);
    const [h, mi] = (time ?? '').split(':').map(Number);
    return fromZoned(y!, mo!, d!, h ?? 0, mi ?? 0);
  };

  /* The same derivation the bookings list prints in its amount column. This
     card used to say "no quote → it is on the plan", which is the exact
     mistake `bookingPaymentState` was fixed for one wave earlier: a job taken
     over the phone has no quote either, and B-1044 sat here claiming a monthly
     charge covered it while linking to the invoice that charged for it. */
  const money = bookingAmount(booking, {
    offers,
    invoices,
    subscriptions,
    plans,
    services,
    hourlyRate: settings.hourlyRate,
  });

  /**
   * Every action on this screen writes through here. The history entry is not
   * decoration: the timeline is the only record of who moved a job and why, and
   * the no-access fee in particular has to be traceable back to a timestamp.
   */
  function patchBooking(patch: Partial<Booking>, event?: Omit<TimelineEvent, 'at'>) {
    patchData({
      bookings: bookings.map((b) =>
        b.id === booking!.id
          ? {
              ...b,
              ...patch,
              history: event
                ? [...b.history, { ...event, at: now.toISOString() }]
                : b.history,
            }
          : b,
      ),
    });
  }

  /** A finished job is history — it can be read, not rescheduled or cancelled. */
  const settled = (
    ['completed', 'invoiced', 'closed', 'cancelled', 'noAccess'] as Booking['status'][]
  ).includes(booking.status);

  /* ------------------------------------------------------------ workforce */

  const assignee = memberById(team, booking.assigneeId);
  const roster = assignableTeam(team);
  /*
   * The name on the record even when it is no longer assignable.
   *
   * Deactivating somebody does not un-assign their week. Dropping them from
   * the select would leave the field showing a person the list says does not
   * exist, and the office would have no way to see who to take the job off.
   */
  const options = assignee && !roster.some((m) => m.id === assignee.id)
    ? [...roster, assignee]
    : roster;

  const worked = workedMinutes(booking);
  const variance = varianceMinutes(booking);
  const recorded = hasWorkRecord(booking);

  /*
   * One row per person who worked it, and the office edits the row it means.
   *
   * The first version of this pointed the edit at the assignee, which is right
   * until a finished job is handed on: the hours then belong to the person who
   * left and the field opens empty against the person who arrived, so saving
   * adds a second afternoon to a job that only had one. Editing an *entry*
   * cannot go wrong that way, and it is also the shape a job worked by two
   * people needs.
   */
  const entries = booking.work ?? [];
  const editEntry = editingHours && memberById(team, editingHours.memberId);
  const draftOk = isValidWorkHours(Number(editingHours?.value ?? ''));
  /*
   * Open until the money is on paper.
   *
   * §5.3 leaves the pricing decision with the office, so the office has to be
   * able to correct a five typed for a five and a half — the contractor has
   * gone home. Once an invoice exists the number behind it stops moving, or
   * the bill and the record start disagreeing.
   */
  const hoursOpen = !(
    ['invoiced', 'closed', 'cancelled'] as Booking['status'][]
  ).includes(booking.status);

  const warnings = assignee
    ? assignmentWarnings(assignee, booking, bookings, properties)
    : [];

  /** What the select is showing, with the deep link's sentinel resolved. */
  const picked = assigning === CURRENT ? (booking.assigneeId ?? '') : (assigning ?? '');

  return (
    <div>
      {/* Was `/admin/kalender`, because the calendar was the only way in.
          Now that bookings have a list, sending everyone who arrives from it
          back to a timeline view is a dead end — the list is the place you
          came from and the place the next row is. */}
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/buchungen">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 data-numeric className="display-type text-3xl">
          {booking.reference}
        </h1>
        <StatusBadge entity="booking" state={booking.status} />
      </div>

      {/*
        §5.3 splits the job in two: the contractor reports extra hours, the
        office prices them. Only the reporting half was built — check-out set
        `awaitingApproval` and nothing could ever move a booking out of it, so
        `completed` was a state no screen could reach and the reported hours
        sat in the timeline with nobody able to accept them.
      */}
      {booking.status === 'awaitingApproval' && (
        <div className="mt-6 border-l-2 border-status-warning-line bg-status-warning p-5">
          <h2 className="font-medium">{t('approveTitle')}</h2>
          <p className="mt-1.5 max-w-[var(--measure)] text-sm text-ink-secondary">
            {t('approveBody')}
          </p>
          {/*
            The number being approved, in the banner asking for the approval.
            It used to say "check the history" — so the one figure the button
            commits the office to was three collapsed sections down, in a
            sentence, and the reported hours were not a field anybody could
            read off the record at all.
          */}
          <p data-numeric className="mt-3 text-sm font-medium">
            {recorded
              ? t('approveHours', {
                  worked: hoursOf(worked),
                  planned: booking.duration / 60,
                })
              : t('approveNoHours')}
            {recorded && variance > 0 && ` · ${t('varianceOver', { hours: hoursOf(variance) })}`}
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              approveBooking(booking.id, t('approveEvent'), now);
              toast.success(t('approveDone'));
            }}
          >
            <Check className="size-4" aria-hidden />
            {t('approveAction')}
          </Button>
        </div>
      )}

      {/*
        The move, said out loud.
        `status: 'rescheduled'` is a badge, and a badge cannot say *from when* —
        so the one fact the office needs before phoning the customer back
        ("what did they have in their diary?") was only in a timeline entry
        three collapsed sections down. It stops once the job moves on: a
        checked-in or cancelled booking has news of its own, and this is no
        longer information, it is history.
      */}
      {booking.reschedule && booking.status === 'rescheduled' && (
        <div className="mt-6 border-l-2 border-status-info-line bg-status-info p-5">
          <h2 className="font-medium">{t('movedTitle')}</h2>
          <p data-numeric className="mt-1.5 max-w-[var(--measure)] text-sm text-ink-secondary">
            {t('movedBody', {
              fromDate: format.dateTime(new Date(booking.reschedule.from), 'dayDate'),
              fromTime: format.dateTime(new Date(booking.reschedule.from), 'time'),
              toDate: format.dateTime(start, 'dayDate'),
              toTime: format.dateTime(start, 'time'),
            })}
          </p>
          {/* Not decoration. Whether the customer already knows decides
              whether the next thing the office does is phone them. */}
          <p data-numeric className="mt-2 text-sm text-ink-tertiary">
            {t('movedNotified', {
              name: `${customer.firstName} ${customer.lastName}`,
              at: format.dateTime(new Date(booking.reschedule.at), 'dayDate'),
            })}
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <h2 className="label-type text-ink-tertiary">{t('overviewTitle')}</h2>
          <SectionGroup value={openSections} onValueChange={setOpenSections}>
            <CollapsibleSection
              value="slot"
              icon={CalendarClock}
              title={t('scheduleTitle')}
              summary={
                <span data-numeric>
                  {format.dateTime(start, 'dayMonth')}, {format.dateTime(start, 'time')}
                </span>
              }
            >
              {/*
                Three facts about the slot. «Ausführung» was folded in here
                once, then removed as a line printing the same name on every
                record; it is back as a section of its own, because who does
                the job now varies and carries hours, warnings and an action
                — none of which fit in a cell of this grid. See §2a on
                /open-questions for the whole round trip.
              */}
              <dl className="grid gap-5 sm:grid-cols-3">
                <div>
                  <dt className="label-type text-ink-tertiary">{t('whenTitle')}</dt>
                  <dd data-numeric className="mt-1.5">
                    {format.dateTime(start, 'dayMonth')}
                    <span className="block text-lg">{format.dateTime(start, 'time')}</span>
                  </dd>
                </div>
                <div>
                  <dt className="label-type text-ink-tertiary">{t('windowTitle')}</dt>
                  <dd data-numeric className="mt-1.5 text-lg">
                    {format.dateTime(start, 'time')}–
                    {format.dateTime(addMinutes(start, booking.arrivalWindow), 'time')}
                  </dd>
                </div>
                <div>
                  <dt className="label-type text-ink-tertiary">{t('durationTitle')}</dt>
                  {/* Was a hardcoded «Std.», printed under an English
                      heading on the English site. */}
                  <dd data-numeric className="mt-1.5 text-lg">
                    {t('hours', { hours: booking.duration / 60 })}
                  </dd>
                </div>
              </dl>
            </CollapsibleSection>

            {/*
              Who is doing it, how long it took, and the one control that
              changes either. Second in the group, directly under the slot:
              «when» and «who» are the two facts the office is asked for on
              the phone, and the customer's own details are behind them.
            */}
            <CollapsibleSection
              value="work"
              icon={Users}
              title={t('workTitle')}
              summary={
                assignee ? (
                  memberName(assignee)
                ) : (
                  <span className="text-ink-tertiary">{t('unassigned')}</span>
                )
              }
            >
              <dl className="divide-y divide-line-subtle border-t border-line-subtle">
                <Row label={t('assigneeLabel')}>
                  {assignee ? (
                    <Link
                      href={`/admin/benutzer/${assignee.id}`}
                      className="font-medium text-ink-accent hover:underline"
                    >
                      {memberName(assignee)}
                    </Link>
                  ) : (
                    <span className="text-ink-tertiary">{t('unassigned')}</span>
                  )}
                </Row>
                <Row label={t('plannedLabel')}>
                  <span data-numeric>{t('hours', { hours: booking.duration / 60 })}</span>
                </Row>
                {/* Absent, not zero. A job nobody has checked out of has no
                    hours; printing «0 Std.» would claim somebody worked none.
                    One row per person, named — a total on its own cannot say
                    that the six and a half hours on a reassigned job were
                    worked by whoever left. */}
                {recorded ? (
                  entries.map((entry) => (
                    <Row
                      key={entry.id}
                      label={t('workedBy', {
                        name:
                          memberName(memberById(team, entry.memberId)) || entry.memberId,
                      })}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span data-numeric className="font-medium">
                          {t('hours', { hours: hoursOf(entry.minutes) })}
                        </span>
                        {hoursOpen && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingHours({
                                memberId: entry.memberId,
                                value: String(hoursOf(entry.minutes)),
                              })
                            }
                            className="rounded-[var(--radius-xs)] text-sm text-ink-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
                          >
                            {t('hoursCorrect')}
                          </button>
                        )}
                      </span>
                    </Row>
                  ))
                ) : (
                  <Row label={t('workedLabel')}>
                    <span className="text-ink-tertiary">{t('noHours')}</span>
                  </Row>
                )}
                {recorded && variance !== 0 && (
                  <Row label={t('varianceLabel')}>
                    <span
                      data-numeric
                      className={
                        variance > 0 ? 'text-status-warning-fg' : 'text-ink-secondary'
                      }
                    >
                      {variance > 0
                        ? t('varianceOver', { hours: hoursOf(variance) })
                        : t('varianceUnder', { hours: hoursOf(-variance) })}
                    </span>
                  </Row>
                )}
              </dl>

              {/*
                Never a refusal, always a sentence. The office knows things the
                record does not — the person is driving past anyway, the skill
                list is a fortnight out of date — so the save goes through and
                the screen says what it noticed.
              */}
              {warnings.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {warnings.map((warning) => (
                    <li
                      key={warning}
                      className="flex gap-2 text-sm text-status-warning-fg"
                    >
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {t(`warn_${warning}`, { name: memberName(assignee) })}
                    </li>
                  ))}
                </ul>
              )}

              {assigning === null ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    disabled={settled}
                    onClick={() => setAssigning(booking.assigneeId ?? '')}
                  >
                    {assignee ? t('reassign') : t('assign')}
                  </Button>
                  {/* The actions column says this once for the buttons that
                      live in it. This one is three sections away from that
                      note, and a greyed control with no reason beside it
                      reads as broken rather than closed. */}
                  {settled && (
                    <p className="mt-2 text-sm text-ink-tertiary">
                      {t('assignClosed', { state: statusT(booking.status) })}
                    </p>
                  )}
                </>
              ) : (
                <form
                  className="surface-card mt-4 space-y-3 p-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    assignBooking({ id: booking!.id, memberId: picked || null }, now);
                    setAssigning(null);
                    toast.success(picked ? t('assignDone') : t('unassignDone'));
                  }}
                >
                  <Field label={t('assigneeLabel')}>
                    {(props) => (
                      <Select
                        {...props}
                        value={picked}
                        onChange={(e) => setAssigning(e.target.value)}
                      >
                        {/* First, and not a disabled placeholder: taking a job
                            off somebody is a real choice, not the absence of
                            one — see `assignBooking`. */}
                        <option value="">{t('unassigned')}</option>
                        {options.map((m) => (
                          <option key={m.id} value={m.id}>
                            {memberName(m)}
                            {m.active ? '' : ` — ${t('memberInactive')}`}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  {/* The warnings for the person being *picked*, before the
                      save rather than after it. */}
                  {(() => {
                    const next = memberById(team, picked || undefined);
                    if (!next) return null;
                    const found = assignmentWarnings(next, booking!, bookings, properties);
                    if (found.length === 0) return null;
                    return (
                      <ul className="space-y-2">
                        {found.map((warning) => (
                          <li
                            key={warning}
                            className="flex gap-2 text-sm text-status-warning-fg"
                          >
                            <AlertTriangle
                              className="mt-0.5 size-3.5 shrink-0"
                              aria-hidden
                            />
                            {t(`warn_${warning}`, { name: memberName(next) })}
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm">
                      {t('assignSave')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssigning(null)}
                    >
                      {t('dismiss')}
                    </Button>
                  </div>
                </form>
              )}

              {/*
                The office's own correction, and the second half of §5.3.
                The contractor reports; the office prices — and pricing
                something you cannot correct means phoning somebody who has
                gone home. The timeline records which of the two wrote the
                number, so «reported» and «set by the office» stay different
                claims.
              */}
              {/* Only for the person on the job, and only while they have
                  nothing on it. Every other correction is the pencil beside
                  the row it belongs to. */}
              {hoursOpen &&
                editingHours === null &&
                assignee &&
                !entries.some((w) => w.memberId === assignee.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setEditingHours({ memberId: assignee.id, value: '' })}
                  >
                    {t('hoursAdd')}
                  </Button>
                )}

              {editingHours !== null && (
                <form
                  className="surface-card mt-4 space-y-3 p-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    recordWorkHours(
                      {
                        bookingId: booking!.id,
                        memberId: editingHours.memberId,
                        minutes: minutesOf(Number(editingHours.value)),
                        source: 'office',
                      },
                      now,
                    );
                    setEditingHours(null);
                    toast.success(t('hoursSaved'));
                  }}
                >
                  <Field
                    label={t('hoursFieldLabel', {
                      name: memberName(editEntry || undefined) || editingHours.memberId,
                    })}
                    hint={t('hoursFieldHint')}
                    error={draftOk ? undefined : t('hoursInvalid', { max: MAX_WORK_HOURS })}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        type="number"
                        step={0.5}
                        min={0.5}
                        max={MAX_WORK_HOURS}
                        inputMode="decimal"
                        value={editingHours.value}
                        onChange={(e) =>
                          setEditingHours({ ...editingHours, value: e.target.value })
                        }
                      />
                    )}
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm" disabled={!draftOk}>
                      {t('hoursSave')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingHours(null)}
                    >
                      {t('dismiss')}
                    </Button>
                  </div>
                </form>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              value="customer"
              icon={User}
              title={t('customerTitle')}
              summary={`${customer.firstName} ${customer.lastName}`}
            >
              <dl className="divide-y divide-line-subtle border-t border-line-subtle">
                <Row label={t('customerName')}>
                  <Link
                    href={`/admin/kunden/${customer.id}`}
                    className="font-medium text-ink-accent hover:underline"
                  >
                    {customer.firstName} {customer.lastName}
                  </Link>
                </Row>
                <Row label={t('customerPhone')}>
                  <a
                    href={`tel:${customer.phone.replace(/\s/g, '')}`}
                    data-numeric
                    className="underline-offset-4 hover:underline"
                  >
                    {customer.phone}
                  </a>
                </Row>
                <Row label={t('customerEmail')}>
                  <a
                    href={`mailto:${customer.email}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {customer.email}
                  </a>
                </Row>
              </dl>
            </CollapsibleSection>

            <CollapsibleSection
              value="property"
              icon={Building2}
              title={t('propertyTitle')}
              summary={
                <>
                  {property.street}, <span data-numeric>{property.postcode}</span>{' '}
                  {property.city}
                </>
              }
            >
              <dl className="divide-y divide-line-subtle border-t border-line-subtle">
                <Row label={t('propertyAddress')}>
                  <Link
                    href={`/admin/objekte/${property.id}`}
                    className="text-ink-accent hover:underline"
                  >
                    {property.street}, <span data-numeric>{property.postcode}</span>{' '}
                    {property.city}
                  </Link>
                </Row>
                <Row label={t('serviceTitle')}>{service.name[locale]}</Row>
                {/* Only for the services it is a fact about. A window clean
                    carries no floor area by design, and «—» on a row nobody
                    asked for reads as a gap in the record. */}
                {serviceNeeds(service).asksArea && (
                  <Row label={t('propertyArea')}>
                    <span data-numeric>{areaLabel(property.area)}</span>
                  </Row>
                )}
                {/*
                  Where the day actually starts.

                  The job is scheduled from here, and a visit with a collection
                  stop is a different shape of afternoon from one without —
                  `arrivalWindow` and the travel buffer are both set against an
                  address that is not the only one being driven to.
                */}
                {/* `rt`, not `t`: the label is the request's word for it, and
                    two names for one address is two addresses to whoever reads
                    both screens. */}
                {jobPickup && (
                  <Row label={rt('pickupTitle')}>
                    <span className="block">
                      {jobPickup.street}, <span data-numeric>{jobPickup.postcode}</span>{' '}
                      {jobPickup.city}
                    </span>
                    {jobPickup.note && (
                      <span className="block text-sm text-ink-tertiary">{jobPickup.note}</span>
                    )}
                  </Row>
                )}
              </dl>
            </CollapsibleSection>
          </SectionGroup>

          <Card>
            <CardHeader title={t('accessTitle')} />
            <CardBody>
              {/* Inside a card the outer rules are the card's own edges, so
                  only the rules between the rows are left. */}
              <dl className="divide-y divide-line-subtle border-t border-line-subtle">
                <Row label="Methode">{access ? ACCESS_LABELS[access.method] : '—'}</Row>
                {access?.keyLocation && <Row label="Ort">{access.keyLocation}</Row>}
                {access?.boxLocation && <Row label="Kasten">{access.boxLocation}</Row>}
                {access?.boxCode && (
                  <Row label="Code">
                    <SecretValue
                      value={access.boxCode}
                      revealLabel={rt('accessReveal')}
                      hideLabel={rt('accessHide')}
                    />
                  </Row>
                )}
                {access?.alarmCode && (
                  <Row label="Alarmcode">
                    <SecretValue
                      value={access.alarmCode}
                      revealLabel={rt('accessReveal')}
                      hideLabel={rt('accessHide')}
                    />
                  </Row>
                )}
              </dl>
              <p className="mt-3 flex gap-2 text-xs text-ink-tertiary">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {rt('accessGuard')}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('historyTitle')} />
            <CardBody>
              <ol className="space-y-3 border-l border-line-subtle pl-4">
                {booking.history.map((entry, index) => (
                  // Not keyed on `at` alone: two actions inside one 30s
                  // tick of `useNow` share a timestamp.
                  <li key={`${entry.at}-${index}`} className="relative text-sm">
                    <span
                      aria-hidden
                      className="absolute top-1.5 -left-[1.3125rem] size-2 rounded-full bg-line"
                    />
                    <span className="block">{entry.label}</span>
                    <span data-numeric className="text-ink-tertiary">
                      {format.dateTime(new Date(entry.at), 'short')}
                    </span>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          {/*
            What the job is worth and the two records that carry that money.
            The customer and the property used to share this card; they are
            facts about the job rather than about the money, and they are in
            the overview now.
          */}
          <Card>
            <CardHeader title={t('moneyTitle')} />
            <CardBody>
              <p className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-ink-secondary">{t('amountTitle')}</span>
                <Money
                  amount={money.amount}
                  /* The plan is billed monthly; this is one visit's share of
                     it, and the unit is what stops it reading as a bill. */
                  per={money.basis === 'plan' ? 'visit' : 'none'}
                  emphasis="strong"
                />
              </p>
              <p className="mt-1.5 text-sm text-ink-secondary">
                {t(`amountBasis_${money.basis}`)}
              </p>
              {offer && (
                <Button asChild block variant="secondary" className="mt-4">
                  <Link href={`/admin/offerten/${offer.id}`}>{t('offerLink')}</Link>
                </Button>
              )}
              {invoice && (
                <Button asChild block variant="secondary" className="mt-2">
                  <Link href={`/admin/rechnungen/${invoice.id}`}>
                    {t('invoiceLink', { reference: invoice.reference })}
                  </Link>
                </Button>
              )}
            </CardBody>
          </Card>

          {/*
            What the job cost in people.
            
            The card above says what the job is worth and could never say what
            it took to do — so «haben wir an dem Umzug etwas verdient» stopped
            one subtraction short on the one screen where both halves belong.
            A job can carry more than one person, which is why this is a list
            rather than a line: `assigneeId` holds who was sent, and a Saturday
            has two people on it.
          */}
          <Card>
            <CardHeader
              title={t('labourTitle')}
              actions={
                labour.length > 0 ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/ausgaben/neu?einsatz=${booking.id}`}>
                      <Plus className="size-4" aria-hidden />
                      {t('labourAdd')}
                    </Link>
                  </Button>
                ) : undefined
              }
            />
            <CardBody>
              {labour.length === 0 ? (
                <>
                  <p className="text-sm text-ink-secondary">{t('labourEmpty')}</p>
                  <Button asChild block variant="secondary" className="mt-4">
                    <Link href={`/admin/ausgaben/neu?einsatz=${booking.id}`}>
                      <Plus className="size-4" aria-hidden />
                      {t('labourAdd')}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-ink-secondary">
                      {labourPeople === 1
                        ? t('labourTotalOne', { hours: labourTotalHours })
                        : t('labourTotal', { hours: labourTotalHours, n: labourPeople })}
                    </span>
                    <Money amount={labourAmount(labour)} emphasis="strong" />
                  </p>

                  <ul className="mt-4 divide-y divide-line-subtle border-t border-line-subtle">
                    {labour.map((entry) => (
                      <li key={entry.id} className="py-2.5">
                        <Link
                          href={`/admin/ausgaben/${entry.id}`}
                          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm underline-offset-4 hover:underline"
                        >
                          <span className="font-medium">
                            {memberName(memberById(team, entry.labour.workerId)) || '—'}
                          </span>
                          <span data-numeric className="text-ink-tertiary">
                            {t('labourHours', { hours: entry.labour.hours })}
                          </span>
                          <Money amount={entry.amount} emphasis="quiet" />
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {/* The half that costs something to ignore: hours somebody
                      has worked and not been paid for. */}
                  {labourOpen > 0 && (
                    <p className="mt-3 flex gap-2 text-sm text-status-warning-fg">
                      <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {t('labourOpen', { amount: formatChf(labourOpen, locale) })}
                    </p>
                  )}

                  <Button asChild block variant="secondary" className="mt-4">
                    <Link href="/admin/ausgaben/arbeitszeit">{t('labourAll')}</Link>
                  </Button>
                </>
              )}
            </CardBody>
          </Card>

          <div>
            <h2 className="label-type text-ink-tertiary">{t('actionsTitle')}</h2>
            {/*
              Every action below is disabled once the job is settled, and until
              now none of them said so. A review of this screen read the greyed
              strip as broken rather than closed — which is the correct reading
              of a control that refuses without giving a reason.
            */}
            {settled && (
              <p className="mt-3 rounded-[var(--radius-sm)] bg-sunken p-3 text-sm text-ink-secondary">
                {t('settledHint', { state: statusT(booking.status) })}
              </p>
            )}
            <div className="mt-3 space-y-2">
              {/* The same fact as the banner, in the one place somebody is
                  about to move it a second time. Whoever reaches for this
                  button should not have to scroll up to find out that it has
                  already been pressed once. */}
              {booking.reschedule && (
                <p
                  data-numeric
                  className="rounded-[var(--radius-sm)] bg-sunken p-3 text-sm text-ink-secondary"
                >
                  {t('movedShort', {
                    date: format.dateTime(new Date(booking.reschedule.from), 'dayDate'),
                    time: format.dateTime(new Date(booking.reschedule.from), 'time'),
                  })}
                </p>
              )}
              {rescheduling ? (
                <form
                  className="surface-card space-y-3 p-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const value = new FormData(e.currentTarget).get('start');
                    if (typeof value !== 'string' || !value) return;
                    const next = fromLocalValue(value);
                    /*
                      Was `patchBooking` — a local write that moved the job and
                      told nobody. The store does both halves now, because a
                      reschedule the customer does not hear about is a phone
                      call on the day rather than a record.
                    */
                    rescheduleBooking(
                      {
                        id: booking!.id,
                        start: next.toISOString(),
                        historyLabel: t('rescheduledTo', {
                          date: format.dateTime(next, 'full'),
                          time: format.dateTime(next, 'time'),
                        }),
                        notice: {
                          subject: booking!.reference,
                          body: t('noticeBody', {
                            fromDate: format.dateTime(start, 'full'),
                            fromTime: format.dateTime(start, 'time'),
                            toDate: format.dateTime(next, 'full'),
                            toTime: format.dateTime(next, 'time'),
                          }),
                        },
                      },
                      now,
                    );
                    setRescheduling(false);
                    toast.success(t('rescheduleDone'));
                  }}
                >
                  <Field label={t('rescheduleLabel')}>
                    {(props) => (
                      <Input
                        {...props}
                        name="start"
                        type="datetime-local"
                        required
                        defaultValue={localValue(start)}
                      />
                    )}
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm">
                      {t('rescheduleSave')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRescheduling(false)}
                    >
                      {t('dismiss')}
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="secondary"
                  block
                  disabled={settled}
                  onClick={() => setRescheduling(true)}
                >
                  {t('reschedule')}
                </Button>
              )}

              <Button
                variant="secondary"
                block
                disabled={settled}
                onClick={() => setConfirming('noAccess')}
              >
                <DoorClosed className="size-4" aria-hidden />
                {t('markNoAccess')}
              </Button>
              <p data-numeric className="px-1 text-xs text-ink-tertiary">
                {t('noAccessHint', { percent: settings.noAccessFeePercent })}
              </p>

              <Button
                variant="danger"
                block
                disabled={settled}
                onClick={() => setConfirming('cancel')}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/*
        Both were inline panels that replaced the button they came from — in a
        narrow right-hand column, so the question arrived in a 20rem strip and
        the buttons around it jumped as it opened and closed.
      */}
      <ConfirmDialog
        open={confirming === 'noAccess'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={t('noAccessConfirmTitle')}
        body={t('noAccessConfirmBody', { percent: settings.noAccessFeePercent })}
        action={t('markNoAccess')}
        dismiss={dismissLabel}
        onConfirm={() => {
          patchBooking(
            { status: 'noAccess' },
            {
              kind: 'noAccess',
              label: t('noAccessEvent', { percent: settings.noAccessFeePercent }),
            },
          );
          setConfirming(null);
          toast.success(t('noAccessDone'));
        }}
      />

      <ConfirmDialog
        open={confirming === 'cancel'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={t('cancelConfirmTitle')}
        body={t('cancelConfirmBody')}
        action={t('cancelConfirmAction')}
        dismiss={dismissLabel}
        onConfirm={() => {
          patchBooking(
            { status: 'cancelled' },
            { kind: 'cancelled', label: t('cancelEvent') },
          );
          setConfirming(null);
          toast.success(t('cancelDone'));
        }}
      />
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
