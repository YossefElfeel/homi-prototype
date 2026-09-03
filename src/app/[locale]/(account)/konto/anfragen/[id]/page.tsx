'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowRight, CircleSlash, Clock, FileQuestion } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { BeforeAfter } from '@/components/account/before-after';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmPanel } from '@/components/ui/confirm-panel';
import { DetailList, DetailRow } from '@/components/ui/detail-list';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/field';
import { Lifecycle } from '@/components/ui/lifecycle';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { areaLabel, figure } from '@/lib/property-size';
import { quoteStages } from '@/lib/quote-lifecycle';
import { requestBadgeState } from '@/lib/offer-label';
import { isExpired } from '@/mock/engines/offers';
import { offerBooking, offerPayment } from '@/lib/offer-facts';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';

/**
 * Screen 37 — one request, from the customer's side.
 *
 * The waiting state carries the promise with a number in it (§4.1: an answer
 * within 24 hours). "We'll be in touch" is what every competitor says; a stated
 * deadline is the only version that reduces the follow-up call this whole
 * system exists to avoid.
 *
 * The screen used to be a column of bare `<section className="mt-10">` blocks
 * on the page ground — a label, some text, ten units of air, the next label.
 * Nothing was grouped, so «Leistung», «Objekt» and «Ihre Angaben» read as three
 * unrelated things rather than one description of one request, and on a wide
 * monitor the whole record ran the full width of the window in a single
 * column. It is the same cards the admin console uses now, in the same
 * main/aside split, so a customer and the office are looking at one layout.
 *
 * That likeness now goes as far as the rail: it reads left to right across the
 * top of both screens, under one name in both dictionaries.
 * Everything on the screen is a white card — the waiting notice and the
 * withdrawn notice were tinted `Alert`s, which put a coloured box on a screen
 * whose whole subject is a status the badge in the header already states.
 */
export default function AccountRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('account.request');
  const pt = useTranslations('account.property');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();

  const now = useNow();
  const { requests, offers, properties, payments, bookings, photos } = useAccount();
  const holds = useStore((s) => s.holds);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const cancelRequest = useStore((s) => s.cancelRequest);

  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');

  if (!hydrated) return <SkeletonPage label={t('back')} />;

  const request = requests.find((r) => r.id === id);
  /* Was a bare em-dash on the page ground: a request id that no longer
     resolves left the customer on an empty screen with no way back but the
     nav. Same shape as the invoice screen's, which had already answered it. */
  if (!request) {
    return (
      <EmptyState
        icon={FileQuestion}
        headingLevel={1}
        title={t('missingTitle')}
        body={t('missingBody')}
        action={
          <Button asChild variant="secondary">
            <Link href="/konto/anfragen">{t('back')}</Link>
          </Button>
        }
      />
    );
  }

  const property = properties.find((p) => p.id === request.propertyId);
  const service = services.find((s) => s.slug === request.serviceSlug);
  const offer = offers.find((o) => o.requestId === request.id && o.status !== 'draft');

  /*
   * The state everything below reads, rather than the one on the record.
   *
   * `expired` is never written down — §9.3 makes the date end a quote, and a
   * date cannot set a field. So a request whose quote had quietly run out still
   * said «Offerte erhalten» here and on the list, while /konto/offerten and the
   * office's own queue both called the same quote «Abgelaufen». One record,
   * three screens, two answers.
   */
  const state = requestBadgeState(request, offer, now);

  /* Still something the customer can act on, as opposed to a quote that is now
     only a record: accepted, declined and expired are all `offer` and none of
     them is waiting for an answer. The date counts as one of the ways it
     closes — the quote below is still worth opening, but nothing on this screen
     may go on calling it live. */
  const offerOpen = Boolean(
    offer &&
      !isExpired(offer, now) &&
      (offer.status === 'sent' || offer.status === 'revisionRequested'),
  );

  /* Hoisted out of the lifecycle rail, which used to be the only thing that
     needed it. The job is also what the photographs hang off — they carry a
     `bookingId`, not a `requestId` — so the two readers have to agree on which
     booking this request became. */
  const booking = offer ? offerBooking(offer.id, bookings) : undefined;

  /* Screen 47 was a tab listing every job the customer ever had; the pair for
     one job belongs on that job. `requestId` is here as well as `bookingId`
     because a photograph sent in with the request itself carries the former —
     the field app and the seeds both attach one or the other, never both. */
  const jobPhotos = photos.filter(
    (p) =>
      (p.kind === 'before' || p.kind === 'after') &&
      ((booking && p.bookingId === booking.id) || p.requestId === request.id),
  );

  /*
   * Open means "still ours to call off". Once a quote has been signed the job
   * is booked and cancelling belongs to the booking, under its own notice
   * period (§11) — offering "withdraw" here would quietly bypass that. A
   * request whose quote has lapsed is over too: withdrawing it is an action
   * with nothing left to act on.
   */
  const cancellable =
    state === 'new' ||
    state === 'inReview' ||
    state === 'offerSent' ||
    state === 'revisionRequested';

  const cancelled = state === 'cancelledByCustomer' || state === 'cancelledByCompany';

  return (
    <div>
      <PageHeader
        back={{ href: '/konto/anfragen', label: t('back') }}
        title={<span data-numeric>{request.reference}</span>}
        meta={<StatusBadge entity="request" state={state} />}
        lead={
          <>
            {t('sentOn')}{' '}
            <span data-numeric>
              {format.dateTime(new Date(request.createdAt), 'full')}
            </span>
          </>
        }
      />

      {/*
        Where the request has got to, read across the top the way the office's
        own screen reads it — same derivation, same orientation, same name.
        It used to be a vertical rail in the aside, which put "wo steht meine
        Anfrage?" beside the record instead of above it, and on a phone below
        the whole thing.
      */}
      <Card className="mb-app-section">
        <CardHeader title={t('progressTitle')} />
        <CardBody>
          <Lifecycle
            orientation="horizontal"
            label={t('progressTitle')}
            stages={quoteStages(
              {
                /*
                 * The derived state, not the stored one. `quoteStages` reads
                 * `request.status` to decide whether the rail ends in a failure
                 * mark, and it has no clock of its own — so a quote that ran
                 * out by date left the rail drawing grey dots the reader was
                 * invited to wait for. Normalising here rather than teaching
                 * the function about `now` keeps its signature, and the office
                 * screen that shares it, exactly as they are.
                 */
                request: { ...request, status: state },
                offer,
                hold: holds.find((h) => h.offerId === offer?.id),
                payment: offer ? offerPayment(offer.id, payments) : undefined,
                booking,
              },
              {
                received: t('stageReceived'),
                reviewed: t('stageReviewed'),
                drafted: t('stageDrafted'),
                sent: t('stageQuoted'),
                revision: t('stageRevision'),
                scheduled: t('stageScheduled'),
                signed: t('stageSigned'),
                paid: t('stagePaid'),
                booked: t('stageBooked'),
                declined: t('stageDeclined'),
                cancelled: t('stageCancelled'),
                expired: t('stageExpired'),
              },
              /* `full` while the rail was vertical, and it does not survive
                 the turn: «Freitag, 28. August 2026» under a dot two words
                 wide wrapped to three lines and pushed the stage labels apart.
                 `dayDate` is the same date abbreviated — the preset that
                 exists for exactly this, a whole date in the width of a
                 heading. */
              (iso) => format.dateTime(new Date(iso), 'dayDate'),
            )}
          />
        </CardBody>
      </Card>

      {/*
        The one thing the customer came to find out, above the split rather
        than inside a column of it. In the aside it would sit below the whole
        record on a phone, which is where the quote they are waiting for is
        least use.

        All three states are the same white card now. Two of them used to be
        tinted `Alert`s and the third a card, so the slot that answers one
        question — is my quote here? — changed shape depending on the answer,
        and the two tinted ones read as warnings about something rather than as
        the status of the thing.
      */}
      {cancelled ? (
        <Card className="mb-app-section">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <CircleSlash className="size-4 text-ink-tertiary" aria-hidden />
                {t('cancelledTitle')}
              </span>
            }
            description={t('cancelledBody')}
            actions={
              <Button asChild variant="secondary">
                <Link href="/anfrage">{t('cancelledAction')}</Link>
              </Button>
            }
          />
        </Card>
      ) : offer ? (
        <Card className="mb-app-section">
          <CardHeader
            title={t('offerTitle')}
            /* «Die Offerte liegt bereit» was printed over every quote this
               request ever had, including the ones that had run out or been
               turned down — so an expired quote invited the customer to go and
               accept it. The quote is still worth opening, which is why the
               button stays; what changes is the sentence that used to promise
               it was live. */
            description={offerOpen ? t('offerBody') : t('offerClosedBody')}
            actions={
              <Button asChild variant={offerOpen ? 'primary' : 'secondary'}>
                <Link href={`/offerte/${offer.id}`}>
                  {t('offerAction')}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="mb-app-section">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Clock className="size-4 text-ink-tertiary" aria-hidden />
                {t('waitingTitle')}
              </span>
            }
            description={t('waitingBody', { hours: settings.responseTimeHours })}
          />
        </Card>
      )}

      {/* The main column keeps its seven of twelve whether or not the aside
          has anything in it: the withdraw card only exists while the request
          is still open, and a record that reflowed to full width the moment it
          was answered would read as a different screen. */}
      <div className="gap-app-section grid lg:grid-cols-12">
        <div className="space-y-app-section lg:col-span-7">
          <Card>
            <CardHeader title={t('detailsTitle')} />
            <CardBody>
              {/*
                Service, address and the property's measurements were three
                separate sections a screenful apart. They are one answer to one
                question — what did I ask for, and for where — so they are one
                list, and the labels that used to be section headings are the
                row labels they always read as.
              */}
              <DetailList columns={2}>
                <DetailRow label={t('serviceTitle')}>
                  {service?.name[locale] ?? '—'}
                </DetailRow>
                <DetailRow label={t('propertyTitle')}>
                  {property ? (
                    <Link
                      href={`/konto/objekte/${property.id}`}
                      className="underline decoration-from-font underline-offset-4"
                    >
                      {property.street}, <span data-numeric>{property.postcode}</span>{' '}
                      {property.city}
                    </Link>
                  ) : (
                    '—'
                  )}
                </DetailRow>
                {property && (
                  <>
                    <DetailRow label={pt('area')}>
                      <span data-numeric>{areaLabel(property.area)}</span>
                    </DetailRow>
                    <DetailRow label={pt('rooms')}>
                      <span data-numeric>{figure(property.rooms)}</span>
                    </DetailRow>
                    <DetailRow label={pt('bathrooms')}>
                      <span data-numeric>{figure(property.bathrooms)}</span>
                    </DetailRow>
                    <DetailRow label={pt('floor')}>
                      <span data-numeric>{property.floor}</span>
                    </DetailRow>
                  </>
                )}
                {/* The customer asked for two stops, so the record of what
                    they asked for has to show two. Without it the request they
                    open later is missing the half of the job they were most
                    likely to be nervous about. */}
                {request.pickup && (
                  /* Full width. Every other row in this list is a number or a
                     word; an address in half a column with a long label beside
                     it hits `overflow-wrap: anywhere` and breaks mid-street. */
                  <DetailRow label={pt('pickupTitle')} className="sm:col-span-2">
                    {request.pickup.street},{' '}
                    <span data-numeric>{request.pickup.postcode}</span>{' '}
                    {request.pickup.city}
                  </DetailRow>
                )}
              </DetailList>
            </CardBody>
          </Card>

          {request.customerNote && (
            <Card>
              <CardHeader title={t('noteTitle')} />
              <CardBody>
                <p className="max-w-[var(--measure)] text-ink-secondary">
                  {request.customerNote}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Last in the column because it is the last thing that happens: the
              record above says what was asked for, this says how it came out.
              It renders itself away on every request that has not run yet. */}
          <BeforeAfter photos={jobPhotos} />
        </div>

        {/* The rail used to hold this column and the withdraw card sat under
            the record, which put the one irreversible thing on the screen at
            the end of a scroll through addresses and floor areas. It is beside
            the record now, the way the panel keeps its own actions beside the
            request rather than after it. */}
        {cancellable && (
          <aside className="lg:col-span-5">
            <Card>
              <CardHeader
                title={t('cancelAction')}
                /* The consequence, stated before the click rather than only
                   after it — but not twice: once the danger panel is open it
                   carries the same sentence, and both on screen at once reads
                   as a rendering fault. */
                description={cancelling ? undefined : t('cancelBody')}
              />
              <CardBody>
                {cancelling ? (
                  <ConfirmPanel
                    title={t('cancelTitle')}
                    body={t('cancelBody')}
                    action={t('cancelConfirm')}
                    dismiss={t('cancelDismiss')}
                    onDismiss={() => setCancelling(false)}
                    onConfirm={() => {
                      cancelRequest(request.id, 'customer', reason, now);
                      setCancelling(false);
                      toast.success(t('cancelDone', { reference: request.reference }));
                    }}
                  >
                    {/* Optional on purpose. Requiring a reason to leave is a dark
                        pattern with a form field on it — and an empty box is more
                        honest than a mandatory dropdown nobody means. */}
                    <Field
                      label={t('cancelReason')}
                      hint={t('cancelReasonHint')}
                      optional
                    >
                      {(props) => (
                        <Textarea
                          {...props}
                          className="min-h-20 bg-card"
                          value={reason}
                          placeholder={t('cancelReasonPlaceholder')}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      )}
                    </Field>
                  </ConfirmPanel>
                ) : (
                  <Button variant="quiet" onClick={() => setCancelling(true)}>
                    {t('cancelAction')}
                  </Button>
                )}
              </CardBody>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}
