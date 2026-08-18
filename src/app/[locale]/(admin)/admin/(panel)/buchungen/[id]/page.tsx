'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { ArrowLeft, Check, DoorClosed, Eye, EyeOff, Lock, UserPlus } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { Field, Input, Select } from '@/components/ui/field';
import { ConfirmPanel } from '@/components/ui/confirm-panel';
import type { Booking, TimelineEvent } from '@/mock/schema';
import { addMinutes } from '@/mock/engines/availability';
import { offerTotal } from '@/mock/engines/offers';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

const ACCESS_LABELS: Record<string, string> = {
  'customer-present': 'Kunde ist da',
  'key-left': 'Schlüssel liegt bereit',
  'key-box': 'Schlüsselkasten mit Code',
  'other-person': 'Andere Person ist da',
};

/** Screen 63 — one booking, and everything that can be done to it. */
export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.booking');
  const rt = useTranslations('admin.request');
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

  const [revealed, setRevealed] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [confirming, setConfirming] = useState<'noAccess' | 'cancel' | null>(null);

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
  const hasSecrets = Boolean(access?.boxCode || access?.alarmCode);

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
    <div className="max-w-5xl">
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
        {/*
          The three blocks below were the only things on this screen not in
          a card: a hairline grid with no heading at all, then two bare
          sections whose titles floated on the page background while the
          column beside them was cards the whole way down. Reading it, the
          eye had to guess where the access details stopped and the history
          started.

          Same content, same order — one surface idiom, and each block now
          has an edge that says where it ends.
        */}
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <CardHeader title={t('scheduleTitle')} />
            <CardBody>
              <dl className="grid gap-5 sm:grid-cols-3">
                <div>
                  <dt className="label-type text-ink-tertiary">{t('whenTitle')}</dt>
                  <dd data-numeric className="mt-1.5">
                    {format.dateTime(start, 'dayMonth')}
                    <span className="block text-lg">
                      {format.dateTime(start, 'time')}
                    </span>
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
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={t('accessTitle')}
              actions={
                hasSecrets && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setRevealed((v) => !v)}
                  >
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
                )
              }
            />
            <CardBody>
              {/* Inside a card the outer rules are the card's own edges, so
                  only the rules between the rows are left. */}
              <dl className="divide-y divide-line-subtle border-t border-line-subtle">
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
            This card used to be plain text. A job touches a customer, a
            property, a quote and often an invoice — all four have detail
            screens, and none of them was reachable from here.
          */}
          <div className="surface-card p-5">
            <h2 className="label-type text-ink-tertiary">{t('customerTitle')}</h2>
            <Link
              href={`/admin/kunden/${customer.id}`}
              className="mt-2 block font-medium underline decoration-from-font underline-offset-4"
            >
              {customer.firstName} {customer.lastName}
            </Link>
            <p data-numeric className="text-sm text-ink-secondary">
              {customer.phone}
            </p>
            <h3 className="label-type mt-5 text-ink-tertiary">{t('propertyTitle')}</h3>
            <Link
              href={`/admin/objekte/${property.id}`}
              className="mt-1 block text-sm text-ink-secondary underline decoration-from-font underline-offset-4"
            >
              {property.street}, <span data-numeric>{property.postcode}</span>{' '}
              {property.city}
            </Link>
            <p className="mt-1 text-sm text-ink-tertiary">{service.name[locale]}</p>

            {offer && (
              <>
                <p className="mt-5 flex items-baseline justify-between gap-4 border-t border-line-subtle pt-4">
                  <span className="text-sm text-ink-secondary">{t('amountTitle')}</span>
                  <Money amount={offerTotal(offer)} emphasis="strong" />
                </p>
                <Link
                  href={`/offerte/${offer.id}`}
                  className="mt-2 block text-sm underline decoration-from-font underline-offset-4"
                >
                  {t('offerLink')}
                </Link>
              </>
            )}

            {invoice && (
              <Link
                href={`/admin/rechnungen/${invoice.id}`}
                className="mt-2 block text-sm underline decoration-from-font underline-offset-4"
              >
                {t('invoiceLink', { reference: invoice.reference })}
              </Link>
            )}
          </div>

          <div className="surface-card p-5">
            <h2 className="label-type text-ink-tertiary">{t('assigneeTitle')}</h2>
            <p className="mt-2">
              {assignee ? `${assignee.firstName} ${assignee.lastName}` : t('unassigned')}
            </p>
            {assigning ? (
              <Field label={t('assignLabel')} className="mt-4">
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
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                disabled={settled}
                onClick={() => setAssigning(true)}
              >
                <UserPlus className="size-3.5" aria-hidden />
                {t('assign')}
              </Button>
            )}
          </div>

          <div>
            <h2 className="label-type text-ink-tertiary">{t('actionsTitle')}</h2>
            <div className="mt-3 space-y-2">
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
