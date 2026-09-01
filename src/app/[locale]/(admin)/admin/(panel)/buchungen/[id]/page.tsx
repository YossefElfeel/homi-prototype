'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Check,
  Clock,
  DoorClosed,
  Lock,
  Plus,
  User,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { CollapsibleSection, SectionGroup } from '@/components/ui/collapsible-section';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money, formatChf } from '@/components/ui/money';
import { Field, Input } from '@/components/ui/field';
import { ConfirmDialog, useDismissLabel } from '@/components/ui/confirm-dialog';
import { SecretValue } from '@/components/ui/secret-value';
import type { Booking, TimelineEvent } from '@/mock/schema';
import { addMinutes } from '@/mock/engines/availability';
import { bookingAmount } from '@/lib/offer-facts';
import {
  labourAmount,
  labourExpenses,
  labourHours,
  memberName,
  unpaidLabour,
} from '@/lib/labour-facts';
import { fromZoned, zonedParts } from '@/lib/business-time';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { areaLabel } from '@/lib/property-size';

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
  const now = useNow();

  /*
   * The slot is open, the other two carry a summary while closed.
   *
   * Three cards of flat text — when, who, where — was most of the screen's
   * height for facts that are read once on arrival and then not again. The
   * name and the address are the two you keep glancing at, so they are the
   * summaries; everything behind them opens when it is actually needed.
   */
  const [openSections, setOpenSections] = useState<string[]>(['slot']);
  const [rescheduling, setRescheduling] = useState(() => action === 'reschedule');
  const [confirming, setConfirming] = useState<'noAccess' | 'cancel' | null>(() =>
    action === 'cancel' ? 'cancel' : action === 'noAccess' ? 'noAccess' : null,
  );

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const booking = bookings.find((b) => b.id === id);
  if (!booking) return <p className="text-ink-tertiary">—</p>;

  const customer = customers.find((c) => c.id === booking.customerId)!;
  const property = properties.find((p) => p.id === booking.propertyId)!;
  const service = services.find((s) => s.slug === booking.serviceSlug)!;
  const offer = offers.find((o) => o.id === booking.offerId);
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
                Three facts, not four. «Ausführung» was here and is gone: this
                is a one-person company, so every job is Marco's and a line
                saying so on every booking is a column of the same name
                repeated down the screen. `assigneeId` stays on the record and
                is still set when a job is created — see /open-questions §2a.
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
                <Row label={t('propertyArea')}>
                  <span data-numeric>{areaLabel(property.area)}</span>
                </Row>
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
                            {memberName(team.find((m) => m.id === entry.labour.workerId))}
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
