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
  DoorClosed,
  Lock,
  User,
  UserPlus,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { CollapsibleSection, SectionGroup } from '@/components/ui/collapsible-section';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { Field, Input, Select } from '@/components/ui/field';
import { ConfirmPanel } from '@/components/ui/confirm-panel';
import { SecretValue } from '@/components/ui/secret-value';
import type { Booking, TimelineEvent } from '@/mock/schema';
import { addMinutes } from '@/mock/engines/availability';
import { offerTotal } from '@/mock/engines/offers';
import { useHydrated, useNow, useStore } from '@/mock/store';

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
   * The calendar's row menu offers reschedule, assign and cancel directly. It
   * could not perform them there — a confirmation panel inside a dropdown is a
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
  const rt = useTranslations('admin.request');
  const statusT = useTranslations('status.booking');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();

  const bookings = useStore((s) => s.data.bookings);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const offers = useStore((s) => s.data.offers);
  const team = useStore((s) => s.data.team);
  const invoices = useStore((s) => s.data.invoices);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const patchData = useStore((s) => s.patchData);
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
  const [assigning, setAssigning] = useState(() => action === 'assign');
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
  const assignee = team.find((m) => m.id === booking.assigneeId);
  const invoice = invoices.find((i) => i.bookingId === booking.id);

  const start = new Date(booking.start);
  const access = property.access;
  const assigneeName = assignee
    ? `${assignee.firstName} ${assignee.lastName}`
    : t('unassigned');

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
              patchBooking(
                { status: 'completed' },
                { kind: 'approved', label: t('approveEvent') },
              );
              toast.success(t('approveDone'));
            }}
          >
            <Check className="size-4" aria-hidden />
            {t('approveAction')}
          </Button>
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
              <dl className="grid gap-5 sm:grid-cols-2">
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
                  <dd data-numeric className="mt-1.5 text-lg">
                    {booking.duration / 60} Std.
                  </dd>
                </div>
                {/*
                  Who is doing it is part of the plan for the day, not a card of
                  its own — it was one line of text taking a whole surface, and
                  the button under it is an action, so it has gone to where the
                  actions are.
                */}
                <div>
                  <dt className="label-type text-ink-tertiary">{t('assigneeTitle')}</dt>
                  <dd className="mt-1.5 text-lg">{assigneeName}</dd>
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
                  <span data-numeric>{property.area} m²</span>
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
              {offer ? (
                <p className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-ink-secondary">{t('amountTitle')}</span>
                  <Money amount={offerTotal(offer)} emphasis="strong" />
                </p>
              ) : (
                /* A plan visit has no amount of its own — the monthly charge
                   covers it, and printing a total here would count it twice. */
                <p className="text-sm text-ink-secondary">{t('amountOnPlan')}</p>
              )}
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
              {assigning ? (
                <div className="surface-card p-4">
                  <Field label={t('assignLabel')}>
                    {(props) => (
                      <Select
                        {...props}
                        defaultValue={booking.assigneeId ?? ''}
                        onChange={(e) => {
                          const memberId = e.target.value;
                          const member = team.find((m) => m.id === memberId);
                          patchBooking(
                            { assigneeId: memberId || undefined },
                            {
                              kind: 'assigned',
                              label: member
                                ? t('assignedTo', {
                                    name: `${member.firstName} ${member.lastName}`,
                                  })
                                : t('unassigned'),
                            },
                          );
                          setAssigning(false);
                          toast.success(t('assignDone'));
                        }}
                      >
                        <option value="">{t('unassigned')}</option>
                        {team.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() => setAssigning(false)}
                  >
                    {t('dismiss')}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  block
                  disabled={settled}
                  onClick={() => setAssigning(true)}
                >
                  <UserPlus className="size-4" aria-hidden />
                  {t('assign')}
                </Button>
              )}

              {rescheduling ? (
                <form
                  className="surface-card space-y-3 p-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const value = new FormData(e.currentTarget).get('start');
                    if (typeof value !== 'string' || !value) return;
                    const next = new Date(value);
                    patchBooking(
                      { start: next.toISOString(), status: 'rescheduled' },
                      {
                        kind: 'rescheduled',
                        label: t('rescheduledTo', {
                          date: format.dateTime(next, 'full'),
                          time: format.dateTime(next, 'time'),
                        }),
                      },
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
                        defaultValue={booking.start.slice(0, 16)}
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

              {confirming === 'noAccess' ? (
                <ConfirmPanel
                  title={t('noAccessConfirmTitle')}
                  body={t('noAccessConfirmBody', { percent: settings.noAccessFeePercent })}
                  action={t('markNoAccess')}
                  dismiss={t('dismiss')}
                  onConfirm={() => {
                    patchBooking(
                      { status: 'noAccess' },
                      {
                        kind: 'noAccess',
                        label: t('noAccessEvent', {
                          percent: settings.noAccessFeePercent,
                        }),
                      },
                    );
                    setConfirming(null);
                    toast.success(t('noAccessDone'));
                  }}
                  onDismiss={() => setConfirming(null)}
                />
              ) : (
                <>
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
                </>
              )}

              {confirming === 'cancel' ? (
                <ConfirmPanel
                  title={t('cancelConfirmTitle')}
                  body={t('cancelConfirmBody')}
                  action={t('cancelConfirmAction')}
                  dismiss={t('dismiss')}
                  onConfirm={() => {
                    patchBooking(
                      { status: 'cancelled' },
                      { kind: 'cancelled', label: t('cancelEvent') },
                    );
                    setConfirming(null);
                    toast.success(t('cancelDone'));
                  }}
                  onDismiss={() => setConfirming(null)}
                />
              ) : (
                <Button
                  variant="danger"
                  block
                  disabled={settled}
                  onClick={() => setConfirming('cancel')}
                >
                  {t('cancel')}
                </Button>
              )}
            </div>
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
