'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CalendarX2 } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { BeforeAfter } from '@/components/account/before-after';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmPanel } from '@/components/ui/confirm-panel';
import { DetailList, DetailRow } from '@/components/ui/detail-list';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { bookingCancelWindow, customerVisibleEvents } from '@/lib/booking-facts';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';

/**
 * Screen 51 — one appointment, from the customer's side.
 *
 * Two things only exist here.
 *
 * The first is the **cancel button**, which §12 has been promising since the
 * first wave. `quote/[id]/payment` lists «kostenlos bis {hours} h vorher,
 * danach {percent} %» before the customer pays and the dashboard repeats the
 * deadline every time they sign in — and until this wave neither sentence had
 * a control anywhere behind it. The only way to act on either was the
 * telephone, which is the call this account exists to prevent.
 *
 * The second is a **sentence per status**. Nine of them, and the badge alone
 * was never going to carry the two that put money on an invoice: «Kein
 * Zutritt» is a fee under §4.2 and «Storniert» may be one under §12. A word in
 * a coloured pill does not explain a charge; the line under it does.
 *
 * `awaitingApproval` is the state to look at to see what this screen is *not*.
 * §5.3 gives that decision to the office — the customer is not being asked
 * anything — so it gets the sentence and no control at all. A screen that
 * offered a button there would be inventing a decision the customer is not
 * allowed to make.
 */
/** One dictionary key per kind the customer may see. See `customerVisibleEvents`. */
const HISTORY_LABEL = {
  created: 'historyCreated',
  rescheduled: 'historyRescheduled',
  checkIn: 'historyCheckIn',
  checkOut: 'historyCheckOut',
  noAccess: 'historyNoAccess',
  completed: 'historyCompleted',
  invoiced: 'historyInvoiced',
  closed: 'historyClosed',
  cancelled: 'historyCancelled',
} as const;

export default function AccountAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('account.appointment');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const now = useNow();

  const { bookings, properties, offers, invoices, subscriptions, photos } = useAccount();
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const cancelBooking = useStore((s) => s.cancelBooking);

  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');

  if (!hydrated) return <SkeletonPage label={t('back')} />;

  const booking = bookings.find((b) => b.id === id);
  /* Same shape as the request and invoice screens': an id that no longer
     resolves leaves the customer somewhere they can get out of. */
  if (!booking) {
    return (
      <EmptyState
        icon={CalendarX2}
        headingLevel={1}
        title={t('missingTitle')}
        body={t('missingBody')}
        action={
          <Button asChild variant="secondary">
            <Link href="/account/appointments">{t('back')}</Link>
          </Button>
        }
      />
    );
  }

  const start = new Date(booking.start);
  const arrivalEnd = new Date(start.getTime() + booking.arrivalWindow * 60_000);
  const property = properties.find((p) => p.id === booking.propertyId);
  const service = services.find((s) => s.slug === booking.serviceSlug);
  const offer = booking.offerId ? offers.find((o) => o.id === booking.offerId) : undefined;
  const invoice = invoices.find((i) => i.bookingId === booking.id);
  const subscription = booking.subscriptionId
    ? subscriptions.find((s) => s.id === booking.subscriptionId)
    : undefined;

  /*
   * The photographs, which had nowhere to live for two of the three kinds of
   * job.
   *
   * Screen 47 became a card on the *request*, and a plan visit has no request
   * — it carries a `subscriptionId` — while `bkg_3` was never quoted either.
   * The screens board recorded both as unreachable "until a job screen
   * exists". This is that screen, so they hang off the job itself, which is
   * where the field app attaches them in the first place.
   */
  const jobPhotos = photos.filter(
    (p) => (p.kind === 'before' || p.kind === 'after') && p.bookingId === booking.id,
  );

  const cancel = bookingCancelWindow(booking, settings, now);
  const events = customerVisibleEvents(booking);
  /* The cancel card sends plan visits to the plan, so the link list below must
     not offer the same destination again under the same words. */
  const showsPlanRedirect = !cancel.may && cancel.reason === 'planVisit';

  const stateNote = {
    scheduled: t('stateScheduled'),
    rescheduled: t('stateRescheduled'),
    inProgress: t('stateInProgress'),
    noAccess: t('stateNoAccess', { percent: settings.noAccessFeePercent }),
    awaitingApproval: t('stateAwaitingApproval'),
    completed: t('stateCompleted'),
    invoiced: t('stateInvoiced'),
    closed: t('stateClosed'),
    cancelled: t('stateCancelled'),
  }[booking.status];

  const hours = Math.round((booking.duration / 60) * 10) / 10;

  function confirmCancel() {
    if (!booking || !cancel.may) return;

    const feeNote = cancel.free
      ? t('cancelFeeNoneNote')
      : t('cancelFeeLateNote', { percent: cancel.feePercent });

    cancelBooking(
      {
        id: booking.id,
        reason,
        historyLabel: t('cancelEvent'),
        notice: {
          /* Keyed by the reference so it lands in this job's thread, the way
             the reschedule notice does. */
          subject: booking.reference,
          body: t('cancelNoticeBody', {
            date: format.dateTime(new Date(booking.start), 'full'),
            feeNote,
          }),
        },
      },
      now,
    );

    setCancelling(false);
    setReason('');
    toast.success(t('cancelDone'));
  }

  return (
    <>
      <PageHeader
        back={{ href: '/account/appointments', label: t('back') }}
        title={<span data-numeric>{booking.reference}</span>}
        meta={<StatusBadge entity="booking" state={booking.status} />}
        lead={<span data-numeric>{format.dateTime(start, 'full')}</span>}
      />

      {/* What the badge means, in a sentence. Above the split rather than in a
          column of it: on a phone the aside lands under the whole record, and
          «wir standen vor verschlossener Tür» is the first thing the reader
          needs, not the last. */}
      <Card className="mb-app-section">
        <CardBody>
          <p className="max-w-[var(--measure)] text-ink-secondary">{stateNote}</p>
        </CardBody>
      </Card>

      <div className="gap-app-section grid lg:grid-cols-12">
        <div className="space-y-app-section lg:col-span-7">
          <Card>
            <CardHeader title={t('whenTitle')} />
            <CardBody>
              <p className="display-type text-2xl">{format.dateTime(start, 'full')}</p>
              <p data-numeric className="mt-2 text-ink-secondary">
                {t('arrival', {
                  from: format.dateTime(start, 'time'),
                  to: format.dateTime(arrivalEnd, 'time'),
                })}
              </p>
              <p className="mt-1 text-sm text-ink-tertiary">
                {t('duration', { hours })}
              </p>

              {/* The same line the dashboard carries, because it is the same
                  fact — a date that changed under the customer has to say so
                  wherever the date is shown. */}
              {booking.reschedule && (
                <Alert tone="info" className="mt-4">
                  <span data-numeric>
                    {t('movedNote', {
                      from: format.dateTime(new Date(booking.reschedule.from), 'full'),
                      at: format.dateTime(new Date(booking.reschedule.at), 'full'),
                    })}
                  </span>
                </Alert>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('whatTitle')} />
            <CardBody>
              <DetailList>
                <DetailRow label={t('serviceLabel')}>
                  {service?.name[locale] ?? booking.serviceSlug}
                </DetailRow>
                <DetailRow label={t('propertyLabel')}>
                  {property ? (
                    <Link
                      className="underline underline-offset-4"
                      href={`/account/properties/${property.id}`}
                    >
                      {property.street}, {property.postcode} {property.city}
                    </Link>
                  ) : (
                    '—'
                  )}
                </DetailRow>
                <DetailRow label={t('referenceLabel')}>
                  <span data-numeric>{booking.reference}</span>
                </DetailRow>
              </DetailList>
            </CardBody>
          </Card>

          {/* Renders nothing when the job has no pair — see the component. */}
          <BeforeAfter photos={jobPhotos} />

          {/*
            Built from the *kind* of each event, never the stored label.

            Those labels belong to the office. Three of them are none of the
            customer's business — which contractor is coming, and the two
            halves of the §5.3 argument about hours, printed directly under a
            sentence promising we would be in touch before billing anything.
            And every one of them is English by `lang-check`, so rendering them
            would have put "Booked and paid" on a German customer's screen. See
            `customerVisibleEvents`.
          */}
          {events.length > 0 && (
            <Card>
              <CardHeader title={t('historyTitle')} />
              <CardBody>
                <ol className="space-y-3">
                  {events.map((event, i) => (
                    <li key={`${event.at}-${i}`} className="flex flex-wrap gap-x-3 text-sm">
                      <span data-numeric className="text-ink-tertiary">
                        {format.dateTime(new Date(event.at), 'short')}
                      </span>
                      <span className="text-ink-secondary">
                        {event.kind === 'note'
                          ? t('historyNote', { text: event.text })
                          : t(HISTORY_LABEL[event.kind])}
                      </span>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          )}
        </div>

        <aside className="space-y-app-section lg:col-span-5">
          {/*
            §12, with a control under it at last.

            The card is here whatever the answer, because "why can I not cancel
            this" is a question with three different answers and a missing card
            gives none of them. A disabled button with no sentence beside it is
            the thing this replaces.
          */}
          <Card>
            <CardHeader title={t('cancelTitle')} />
            <CardBody>
              {cancel.may ? (
                <>
                  <p className="max-w-[var(--measure)] text-sm text-ink-secondary">
                    {cancel.free
                      ? t('cancelFree', {
                          date: format.dateTime(cancel.freeUntil, 'full'),
                        })
                      : t('cancelLate', {
                          date: format.dateTime(cancel.freeUntil, 'full'),
                          percent: cancel.feePercent,
                        })}
                  </p>

                  {cancelling ? (
                    <ConfirmPanel
                      className="mt-4"
                      title={t('cancelConfirmTitle')}
                      body={
                        cancel.free
                          ? t('cancelConfirmBody')
                          : t('cancelConfirmLate', { percent: cancel.feePercent })
                      }
                      action={t('cancelConfirmAction')}
                      dismiss={t('cancelDismiss')}
                      onConfirm={confirmCancel}
                      onDismiss={() => setCancelling(false)}
                    >
                      {/* Optional, and it says so. A reason box that blocks the
                          button turns "I am going away" into a form. */}
                      <Field
                        label={t('cancelReasonLabel')}
                        hint={t('cancelReasonHint')}
                        optional
                      >
                        {(props) => (
                          <Textarea
                            {...props}
                            className="min-h-20 bg-card"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                          />
                        )}
                      </Field>
                    </ConfirmPanel>
                  ) : (
                    <Button
                      variant="secondary"
                      className="mt-4"
                      onClick={() => setCancelling(true)}
                    >
                      {t('cancelAction')}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <p className="max-w-[var(--measure)] text-sm text-ink-secondary">
                    {
                      {
                        running: t('cancelRunning'),
                        finished: t('cancelFinished'),
                        alreadyCancelled: t('cancelAlready'),
                        planVisit: t('cancelPlanVisit'),
                      }[cancel.reason]
                    }
                  </p>
                  {/* The refusal that is really a redirection carries the way
                      there — see `bookingCancelWindow`. */}
                  {cancel.reason === 'planVisit' && (
                    <Button asChild variant="secondary" size="sm" className="mt-4">
                      <Link href="/account/plan">{t('cancelPlanVisitAction')}</Link>
                    </Button>
                  )}
                </>
              )}
            </CardBody>
          </Card>

          {/*
            Everything this job hangs off, in one place.

            A booking is the join in the middle of this data — quote, request,
            invoice, plan, address — and every one of those screens could
            already be opened from somewhere except *from the job*. So "what
            did this visit cost" meant going back to the invoices list and
            matching on a date.
          */}
          <Card>
            <CardBody>
              <ul className="space-y-2 text-sm">
                {offer && (
                  <li>
                    <Link className="underline underline-offset-4" href={`/quote/${offer.id}`}>
                      {t('linkQuote')}
                    </Link>
                  </li>
                )}
                {offer && (
                  <li>
                    <Link
                      className="underline underline-offset-4"
                      href={`/account/requests/${offer.requestId}`}
                    >
                      {t('linkRequest')}
                    </Link>
                  </li>
                )}
                {invoice && (
                  <li>
                    <Link
                      className="underline underline-offset-4"
                      href={`/account/invoices/${invoice.id}`}
                    >
                      {t('linkInvoice')}
                    </Link>
                  </li>
                )}
                {subscription && !showsPlanRedirect && (
                  <li>
                    <Link className="underline underline-offset-4" href="/account/plan">
                      {t('linkPlan')}
                    </Link>
                  </li>
                )}
                {property && (
                  <li>
                    <Link
                      className="underline underline-offset-4"
                      href={`/account/properties/${property.id}`}
                    >
                      {t('linkProperty')}
                    </Link>
                  </li>
                )}
              </ul>
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}
