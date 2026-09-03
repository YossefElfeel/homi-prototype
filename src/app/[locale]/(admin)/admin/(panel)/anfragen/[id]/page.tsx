'use client';

import { use, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  FileText,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  RotateCcw,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';

import { toast } from 'sonner';

import { Link, useRouter } from '@/i18n/navigation';
import { RejectRequestDialog } from '@/components/admin/reject-request-dialog';
import { RevisionRequest } from '@/components/admin/revision-request';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Money } from '@/components/ui/money';
import { canReissue, daysLeft, offerTotal } from '@/mock/engines/offers';
import { offerState } from '@/lib/offer-facts';
import { ConfirmDialog, useDismissLabel } from '@/components/ui/confirm-dialog';
import { CollapsibleSection, SectionGroup } from '@/components/ui/collapsible-section';
import { Lifecycle } from '@/components/ui/lifecycle';
import { quoteStages } from '@/lib/quote-lifecycle';
import { offerBooking, offerPayment } from '@/lib/offer-facts';
import { SecretValue } from '@/components/ui/secret-value';
import { StatusBadge } from '@/components/ui/status-badge';
import { Field, Textarea } from '@/components/ui/field';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { areaLabel, figure } from '@/lib/property-size';
import { estimateHours } from '@/mock/engines/pricing';
import { checkCoverage } from '@/mock/engines/coverage';
import { durationFacts, hasEnoughToPrice, serviceNeeds } from '@/lib/service-flow';
import { useHydrated, useNow, useStore } from '@/mock/store';

const ACCESS_LABELS: Record<string, string> = {
  'customer-present': 'Kunde ist da',
  'key-left': 'Schlüssel liegt bereit',
  'key-box': 'Schlüsselkasten mit Code',
  'other-person': 'Andere Person ist da',
};

/**
 * Screen 53 — everything the customer sent, in one place.
 *
 * Two things the brief singles out are built here rather than described:
 *
 *  · access codes are masked by default with an explicit reveal, and the note
 *    beside them states the actual rule — you see them always, the person
 *    doing the job only on the day;
 *  · the internal note is visually separated from everything the customer can
 *    see, because "لازم يبان الفرق ده بصرياً" is the difference between a
 *    private reminder and an accident.
 */
export default function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  /**
   * Which panel to open on arrival. Declining is a dialog now rather than a
   * page of its own, and a step that only exists as component state is a step
   * nothing can link to — /screens and /flows both point at it.
   * `?action=reject` keeps it addressable without giving it a second
   * implementation.
   */
  searchParams: Promise<{ action?: string }>;
}) {
  const { id } = use(params);
  const { action } = use(searchParams);
  const t = useTranslations('admin.request');
  const dismissLabel = useDismissLabel();
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();

  const requests = useStore((s) => s.data.requests);
  const offers = useStore((s) => s.data.offers);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const photos = useStore((s) => s.data.photos);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);
  const settings = useStore((s) => s.settings);
  const patchData = useStore((s) => s.patchData);
  const data = useStore((s) => s.data);

  const cancelRequest = useStore((s) => s.cancelRequest);
  const restoreRequest = useStore((s) => s.restoreRequest);
  const markRequestOpened = useStore((s) => s.markRequestOpened);
  const reissueOffer = useStore((s) => s.reissueOffer);
  const holds = useStore((s) => s.holds);
  const now = useNow();
  const router = useRouter();

  /*
   * Opening this screen is the review. It used to be the quote builder that
   * flipped the status, which is a screen further on — so a request could be
   * read here, and here is where it still said "Neu".
   */
  useEffect(() => {
    if (!hydrated) return;
    markRequestOpened(id, now);
    // Once per request. `now` ticks every 30s and would re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, id]);

  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rejecting, setRejecting] = useState(() => action === 'reject');
  /*
   * Access starts folded — the codes are the most sensitive thing on the
   * screen (§13.1) and the owner opens that section only when they need it, so
   * arriving here does not put a key code on the display. Everything else is
   * what you came to read, so it is open.
   */
  const [openSections, setOpenSections] = useState<string[]>([
    'service',
    'property',
    'preferred',
    'photos',
  ]);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const request = requests.find((r) => r.id === id);
  if (!request) return <p className="text-ink-tertiary">—</p>;

  const customer = customers.find((c) => c.id === request.customerId)!;
  const property = properties.find((p) => p.id === request.propertyId)!;
  const service = services.find((s) => s.slug === request.serviceSlug)!;
  const chosen = addOns.filter((a) => request.addOnIds.includes(a.id));
  const requestPhotos = photos.filter((p) => p.requestId === request.id);
  /* The rail now has a stage of its own for a quote still being written, so it
     wants the draft as well — that is how "Offerte erstellt, noch nicht
     versendet" becomes visible instead of the request looking untouched since
     it was read. Issued wins where both exist: a reissue leaves the old draft
     behind and the live one is the one that answers for the request. */
  const offer =
    offers.find((o) => o.requestId === request.id && o.status !== 'draft') ??
    offers.find((o) => o.requestId === request.id);

  /*
   * Null when the answers this service is priced on are not all there.
   *
   * The gate used to be «no area, no hours», which was right for a deep clean
   * and wrong for the two services priced from a count: a window clean carries
   * no area by design now, so the office would have opened a perfectly
   * complete request and found the planned duration blank — on the one screen
   * where that figure is read out loud. Asking the service what it needs gets
   * both cases right. Defaulting the area to 0 is still refused: `areaTier(0)`
   * is the cheapest bracket, and an hour figure built on nothing reads exactly
   * like one built on a measurement.
   */
  const duration = !hasEnoughToPrice(service, {
    area: property.area,
    windowCount: request.windowCount,
    furniturePieces: request.furniturePieces,
  })
    ? null
    : estimateHours(
        {
          service,
          addOns: chosen,
          ...durationFacts(service, property),
          windowCount: request.windowCount,
          furniturePieces: request.furniturePieces,
        },
        settings,
      );

  const needs = serviceNeeds(service);
  const office = needs.vocabulary === 'office';
  /* Whether the hours came off a count rather than off the §5.2 matrix. */
  const countPriced = needs.asksWindowCount || needs.asksFurniturePieces;

  const access = property.access;

  function setInternalNote(note: string) {
    patchData({
      requests: data.requests.map((r) =>
        r.id === request!.id ? { ...r, internalNote: note } : r,
      ),
    });
  }

  const answered = request.status !== 'new' && request.status !== 'inReview';
  /*
   * `rejected` has two authors. `declineOffer` writes it when the *customer*
   * turns a quote down, and that is not the office's decline to take back —
   * the answer there is a new version, which the quote screen already offers.
   * Only the office's own decline gets an undo here.
   */
  const officeDeclined = request.status === 'rejected' && offer?.status !== 'rejected';

  /*
   * Declining and cancelling are not the same act, and only one of them
   * existed. "Ablehnen" answers an open request with a no; once the quote is
   * out, the honest word is cancel — and it has to take the live offer down
   * with it, which declining never did.
   */
  const cancellable =
    request.status === 'offerSent' || request.status === 'revisionRequested';

  /*
   * A decline is an answer, so it needs a question still open. The button was
   * the `else` of every other branch, which meant it was also what an already
   * finished request offered: "Ablehnen" sat on an expired one, on a request
   * the customer had withdrawn, and on one that was accepted. Pressing it
   * there would have overwritten the real ending with `rejected` and lost how
   * the request actually closed.
   *
   * It is `!answered` on purpose: that is the same test the queue's row action
   * already used, and two screens disagreeing about whether a request can
   * still be declined is how the row hides the button and the detail behind it
   * keeps offering it.
   */
  const declinable = !answered;

  /*
   * The quote this request produced, and what state it is actually in.
   *
   * `offerState` rather than `offer.status` for the reason it exists: a quote
   * whose validity window closed is never written `expired`, so reading the
   * stored field here would have this screen and the quote list one click away
   * badging the same record two ways.
   */
  const offerBadgeState = offer ? offerState(offer, data.bookings, now) : null;
  const awaitingRevision = offerBadgeState === 'revisionRequested';
  const offerDaysLeft = offer ? daysLeft(offer, now) : null;

  /*
   * The answer to a change request, on the screen where the change request is
   * read — the same action the quote detail offers, called the same way.
   *
   * Not a second implementation: `reissueOffer` is the store's, it refuses on
   * a quote a new version does not apply to, and the route it lands on is the
   * builder that writes the new version.
   */
  function reissue() {
    if (!offer || !reissueOffer(offer.id, now)) return;
    toast.success(t('reissued'));
    router.push(`/admin/anfragen/${request!.id}/offerte`);
  }

  /* Read twice — once as the closed header's summary, once as the row inside.
     Deriving it once keeps the two from ever disagreeing. */
  const preferredSummary = request.preferred.flexible
    ? t('flexible')
    : request.preferred.date
      ? `${format.dateTime(new Date(request.preferred.date), 'dayMonth')}${
          request.preferred.band ? ` · ${request.preferred.band}` : ''
        }`
      : '—';

  /*
   * What "all" means for the button — and `access` is not in it.
   *
   * The screen opens with four of five sections already unfolded, so it looked
   * open and the button underneath said «Alle ausklappen». Pressing it did do
   * something: it opened the fifth, which is the one holding the key-box code
   * and the alarm code. A bulk control that puts an alarm code on the display
   * as a side effect of "tidy this up for me" is the same wrong grain
   * `SecretValue` exists to fix — §13.1 wants that section opened on purpose,
   * once, by somebody who meant to.
   *
   * So the toggle governs the four readable sections, and its label now tells
   * the truth on arrival: everything it controls is open, so it offers to
   * close them.
   */
  const BULK_SECTIONS = ['service', 'property', 'preferred', 'photos'];
  /* `every`, not a length comparison — the old test was true for any five
     strings, so a section renamed anywhere else would have left the label
     stuck on "collapse". */
  const allOpen = BULK_SECTIONS.every((s) => openSections.includes(s));

  const stages = quoteStages(
    {
      request,
      offer,
      hold: holds.find((h) => h.offerId === offer?.id),
      payment: offer ? offerPayment(offer.id, data.payments) : undefined,
      booking: offer ? offerBooking(offer.id, data.bookings) : undefined,
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
    (iso) =>
      `${format.dateTime(new Date(iso), 'short')}, ${format.dateTime(new Date(iso), 'time')}`,
  );

  return (
    <div>
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/anfragen">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 data-numeric className="display-type text-3xl">
              {request.reference}
            </h1>
            <StatusBadge entity="request" state={request.status} />
          </div>
          <p data-numeric className="mt-2 text-sm text-ink-secondary">
            {t('received')} {format.dateTime(new Date(request.createdAt), 'full')},{' '}
            {format.dateTime(new Date(request.createdAt), 'time')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/*
            Hidden rather than disabled while a change request is open, because
            here it was worse than a dead control — it was the *only* thing the
            screen offered. A request in «Änderung angefragt» counts as
            `answered`, so the one constructive button greyed itself out and
            what remained was a red «Stornieren»: the office arrived at a
            customer asking for a cheaper quote and the screen's advice was to
            call the job off. The action that does apply is in the card below,
            next to the sentence asking for it.
          */}
          {!awaitingRevision && (
            <Button asChild disabled={answered}>
              <Link href={`/admin/anfragen/${request.id}/offerte`}>
                <FileText className="size-4" aria-hidden />
                {t('replyWithQuote')}
              </Link>
            </Button>
          )}
          {/* A decline was one-way: "Offerte schreiben" disables itself as
              soon as a request counts as answered, so the screen left after
              a mis-click offered exactly one thing — declining it again. */}
          {officeDeclined ? (
            <Button
              variant="secondary"
              onClick={() => {
                restoreRequest(request.id);
                toast.success(t('restored'));
              }}
            >
              <RotateCcw className="size-4" aria-hidden />
              {t('restore')}
            </Button>
          ) : cancellable ? (
            <Button variant="danger" onClick={() => setCancelling(true)}>
              <X className="size-4" aria-hidden />
              {t('cancelAction')}
            </Button>
          ) : declinable ? (
            <Button variant="danger" onClick={() => setRejecting(true)}>
              <X className="size-4" aria-hidden />
              {t('reject')}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Was an inline panel below the header, which on this screen opened
          above the whole record — so agreeing to cancel meant reading a
          question with the thing it was about pushed off the screen. */}
      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title={t('cancelTitle')}
        body={t('cancelBody')}
        action={t('cancelConfirm')}
        dismiss={dismissLabel}
        disabled={!cancelReason.trim()}
        onConfirm={() => {
          cancelRequest(request.id, 'company', cancelReason, now);
          setCancelling(false);
          toast.success(t('cancelDone', { reference: request.reference }));
        }}
      >
        {/* Required here, unlike the customer's own withdrawal: this one is
            the company acting on somebody else's job, and a month later the
            only account of why is whatever was typed in this box. */}
        <Field label={t('cancelReason')}>
          {(props) => (
            <Textarea
              {...props}
              className="min-h-20"
              value={cancelReason}
              placeholder={t('cancelReasonPlaceholder')}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          )}
        </Field>
      </ConfirmDialog>

      {/*
        Above the rail, because it outranks it.

        The rail says where the request is; this says what to do about it, and
        on the one status where those differ the second question is the one
        being asked. Until now this screen answered neither: a request in
        «Änderung angefragt» showed the warning badge in the header and then
        went on to print the service, the property and the access codes as if
        nothing had happened — the customer's objection, the quote it is about
        and the price they are objecting to were all on other screens, and
        nothing here even said a quote existed.
      */}
      {offer && awaitingRevision && (
        <RevisionRequest
          offer={offer}
          customerName={customer.firstName}
          now={now}
          className="mt-8"
          action={
            canReissue(offer, now) && (
              <Button onClick={reissue}>
                <RotateCcw className="size-4" aria-hidden />
                {t('reissue')}
              </Button>
            )
          }
        />
      )}

      {/*
        Was first in the right-hand column, which made "where is this request?"
        a question you answered by looking sideways — and on a narrow screen,
        by scrolling past the whole request to reach it. It is the one fact
        that frames everything below it, so it reads across the top, in the
        order the process runs.
      */}
      <div className="surface-card mt-10 p-6">
        <h2 className="label-type text-ink-tertiary">{t('lifecycleTitle')}</h2>
        <Lifecycle
          className="mt-4"
          orientation="horizontal"
          label={t('lifecycleTitle')}
          stages={stages}
        />
      </div>

      <div className="mt-app grid gap-10 lg:grid-cols-12">
        {/*
          Five stacked blocks meant scrolling past the property to find out
          whether any photos were attached at all. Folded, each header carries
          its own summary, so the whole request is readable without opening
          anything — and only what is actually needed gets opened.
        */}
        <div className="lg:col-span-7">
          <div className="mb-app flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setOpenSections((current) =>
                  allOpen
                    ? /* Leave `access` exactly as the reader left it. Folding
                         it is harmless, but so is not touching it, and this
                         button has no business having an opinion about it. */
                      current.filter((s) => !BULK_SECTIONS.includes(s))
                    : [...new Set([...current, ...BULK_SECTIONS])],
                )
              }
            >
              {allOpen ? t('collapseAll') : t('expandAll')}
            </Button>
          </div>

          <SectionGroup value={openSections} onValueChange={setOpenSections}>
            <CollapsibleSection
              value="service"
              icon={Sparkles}
              title={t('serviceTitle')}
              summary={service.name[locale]}
            >
              <dl className="divide-y divide-line-subtle border-y border-line-subtle">
                <Row label={t('serviceTitle')}>{service.name[locale]}</Row>
                {/*
                  The count the whole quote rests on, and it was on no office
                  screen at all: the panel showed the service name, the add-ons
                  and the hours, and the customer's «18 Fensterflügel» lived
                  only inside the arithmetic. Now that the same request carries
                  no floor area either, the row underneath it reads «—» and the
                  number that replaced it has to be visible.
                */}
                {request.windowCount != null && (
                  <Row label={t('windowCount')}>
                    <span data-numeric>{request.windowCount}</span>
                  </Row>
                )}
                {request.furniturePieces != null && (
                  <Row label={t('furniturePieces')}>
                    <span data-numeric>{request.furniturePieces}</span>
                  </Row>
                )}
                <Row label={t('addOns')}>
                  {chosen.length ? chosen.map((a) => a.name[locale]).join(', ') : t('noAddOns')}
                </Row>
                <Row label={t('estimated')}>
                  {duration ? (
                    <span data-numeric>{duration.scheduledHours} Std.</span>
                  ) : (
                    <span className="text-ink-tertiary">{t('estimatedNoArea')}</span>
                  )}
                </Row>
              </dl>
              {/* The note names the inputs that were actually used. It said
                  «aus Fläche, Bädern und Zustand» for every request, which is
                  a description of the §5.2 matrix — and the matrix is not
                  consulted at all for a service priced by count. */}
              <p className="pt-3 text-xs text-ink-tertiary">
                {countPriced ? t('estimatedNoteCount') : t('estimatedNote')}
              </p>
            </CollapsibleSection>

            <CollapsibleSection
              value="property"
              icon={Building2}
              title={t('propertyTitle')}
              summary={`${property.street}, ${property.postcode} ${property.city}`}
            >
              <dl className="divide-y divide-line-subtle border-y border-line-subtle">
                <Row label="Adresse">
                  {property.street}, <span data-numeric>{property.postcode}</span>{' '}
                  {property.city}
                </Row>
                <Row label={t('kind')}>{property.kind}</Row>
                {/*
                  Only the answers this service was asked for.

                  Six rows reading «—» and «Nein» on a window clean is not an
                  empty record, it is a record of questions that were never put
                  — and «Haustiere: Nein» in particular reads as an answer the
                  customer gave. The floor and the lift stay for every service:
                  they are how somebody reaches the door, not §5.2 inputs.
                */}
                {needs.asksArea && (
                  <Row label={t('area')}>
                    <span data-numeric>{areaLabel(property.area)}</span>
                  </Row>
                )}
                {needs.asksRooms && (
                  <Row label={t(office ? 'roomsOffice' : 'rooms')}>
                    <span data-numeric>{figure(property.rooms)}</span>
                  </Row>
                )}
                {needs.asksBathrooms && (
                  <Row label={t(office ? 'bathroomsOffice' : 'bathrooms')}>
                    <span data-numeric>{figure(property.bathrooms)}</span>
                  </Row>
                )}
                <Row label={t('floor')}>
                  <span data-numeric>{property.floor}</span>
                </Row>
                <Row label={t('elevator')}>{property.hasElevator ? 'Ja' : 'Nein'}</Row>
                {needs.asksPets && (
                  <Row label={t('pets')}>{property.hasPets ? 'Ja' : 'Nein'}</Row>
                )}
                {needs.asksCondition && (
                  <Row label={t('effort')}>{property.needsExtraEffort ? 'Ja' : 'Nein'}</Row>
                )}
              </dl>

              {/*
                A second stop changes how the day is planned before it changes
                anything else, so it sits inside the property panel rather than
                in the notes — the office reads this block to answer "where am
                I sending somebody", and on these jobs the answer is two places.
              */}
              {request.pickup && (
                <div className="mt-6 border-t border-line-subtle pt-5">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <Truck className="size-4 text-ink-tertiary" aria-hidden />
                    {t('pickupTitle')}
                  </h3>
                  <dl className="mt-3 divide-y divide-line-subtle border-y border-line-subtle">
                    <Row label="Adresse">
                      {request.pickup.street},{' '}
                      <span data-numeric>{request.pickup.postcode}</span>{' '}
                      {request.pickup.city}
                    </Row>
                    <Row label={t('floor')}>
                      <span data-numeric>{request.pickup.floor}</span>
                    </Row>
                    <Row label={t('elevator')}>{request.pickup.hasElevator ? 'Ja' : 'Nein'}</Row>
                    {request.pickup.note && (
                      <Row label={t('pickupNote')}>{request.pickup.note}</Row>
                    )}
                  </dl>
                  {/* §5.1 rather than a silent number: the flow takes the
                      request and the travel is priced by hand on the quote —
                      so the person writing the quote has to be told. */}
                  {checkCoverage(request.pickup.postcode, settings.servedPostcodes).state !==
                    'inside' && (
                    <p className="mt-3 text-xs text-status-warning-fg">{t('pickupOutside')}</p>
                  )}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              value="preferred"
              icon={CalendarClock}
              title={t('preferredTitle')}
              summary={preferredSummary}
            >
              <dl className="divide-y divide-line-subtle border-y border-line-subtle">
                <Row label={t('preferredTitle')}>{preferredSummary}</Row>
              </dl>
            </CollapsibleSection>

            {/*
              §13.1 — masked by default, and now folded by default too. The
              codes are the most sensitive thing on the screen and the owner
              opens this section only when they need it, so leaving it shut is
              one fewer surface with a key code sitting on it. The closed
              summary states the *method* and never the code.
            */}
            <CollapsibleSection
              value="access"
              icon={KeyRound}
              title={t('accessTitle')}
              summary={
                access ? ACCESS_LABELS[access.method] : t('accessSummaryNone')
              }
            >
              <p className="max-w-[var(--measure)] text-sm text-ink-secondary">
                {t('accessLead')}
              </p>

              {/* The reveal is on each code now rather than one button over
                  all of them — see `SecretValue`. Showing the alarm code
                  should not also put the key-box code on a screen somebody is
                  reading with the customer standing next to them. */}
              <dl className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
                <Row label="Methode">{access ? ACCESS_LABELS[access.method] : '—'}</Row>
                {access?.keyLocation && <Row label="Ort">{access.keyLocation}</Row>}
                {access?.boxLocation && <Row label="Kasten">{access.boxLocation}</Row>}
                {access?.boxCode && (
                  <Row label="Code">
                    <SecretValue
                      value={access.boxCode}
                      revealLabel={t('accessReveal')}
                      hideLabel={t('accessHide')}
                    />
                  </Row>
                )}
                {access?.alarmCode && (
                  <Row label="Alarmcode">
                    <SecretValue
                      value={access.alarmCode}
                      revealLabel={t('accessReveal')}
                      hideLabel={t('accessHide')}
                    />
                  </Row>
                )}
                {access?.personName && (
                  <Row label="Person">
                    {access.personName} · <span data-numeric>{access.personPhone}</span>
                  </Row>
                )}
                {access?.emergencyName && (
                  <Row label="Notfall">
                    {access.emergencyName} · <span data-numeric>{access.emergencyPhone}</span>
                  </Row>
                )}
              </dl>

              <p className="mt-3 flex gap-2 text-xs text-ink-tertiary">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {t('accessGuard')}
              </p>

              {/* Where these details are actually edited. Saying they belong to
                  the property and then not linking to it leaves the reader to
                  find it, which is how they get edited on the wrong screen. */}
              <Button asChild variant="link" className="mt-3">
                <Link href={`/admin/objekte/${property.id}`}>{t('accessOpenProperty')}</Link>
              </Button>
            </CollapsibleSection>

            <CollapsibleSection
              value="photos"
              icon={ImageIcon}
              title={t('photosTitle')}
              summary={t('photosCount', { n: requestPhotos.length })}
            >
              {requestPhotos.length === 0 ? (
                <p className="text-sm text-ink-tertiary">{t('photosEmpty')}</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-3">
                  {requestPhotos.map((photo) => (
                    <li key={photo.id}>
                      <ImagePlaceholder
                        seed={photo.id}
                        alt={photo.note ?? ''}
                        className="aspect-4/3 rounded-[var(--radius-md)]"
                      />
                      {photo.note && (
                        <p className="mt-2 text-sm text-ink-secondary">{photo.note}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {request.customerNote && (
                <div className="mt-6">
                  <h3 className="label-type text-ink-tertiary">{t('customerNote')}</h3>
                  <p className="mt-2 text-ink-secondary">{request.customerNote}</p>
                </div>
              )}
            </CollapsibleSection>
          </SectionGroup>
        </div>

        <aside className="space-y-8 lg:col-span-5">
          {/*
            What we quoted — the one fact this screen was missing entirely.

            The record held the offer all along: the lifecycle rail reads it to
            draw «Offerte versendet», and the page then never named it. So a
            request that had been answered showed a rail claiming a quote
            existed and offered no reference for it, no price, no state, and no
            way to open it — «was haben wir denn angeboten?» was a trip through
            /admin/offerten and a search by customer name. It sits first in the
            column because on every status past `inReview` it is the next thing
            asked after "who is this".
          */}
          {offer && offerBadgeState && (
            <Card>
              <CardHeader
                title={t('quoteTitle')}
                actions={<StatusBadge entity="request" state={
                  offerBadgeState === 'sent' ? 'offerSent' : offerBadgeState
                } size="sm" />}
              />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span data-numeric className="text-ink-secondary">
                  {offer.reference}
                </span>
                {offer.version > 1 && (
                  <Chip tone="neutral">{t('quoteVersion', { n: offer.version })}</Chip>
                )}
              </div>
              <dl className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
                <Row label={t('quoteTotal')}>
                  <Money amount={offerTotal(offer)} emphasis="strong" />
                </Row>
                <Row label={t('quoteIssued')}>
                  <span data-numeric>
                    {offer.issuedAt
                      ? format.dateTime(new Date(offer.issuedAt), 'short')
                      : t('quoteNotSent')}
                  </span>
                </Row>
                {/* Only while it can still run out. On an accepted, declined or
                    already lapsed quote the date is a fact about a window that
                    closed, and printing «gültig bis» over it invites the reader
                    to act on a deadline that no longer governs anything. */}
                {offer.expiresAt && offerDaysLeft !== null && offerDaysLeft > 0 && (
                  <Row label={t('quoteExpires')}>
                    <span data-numeric>
                      {format.dateTime(new Date(offer.expiresAt), 'short')}
                    </span>
                  </Row>
                )}
              </dl>
              <Button asChild block variant="secondary" className="mt-4">
                <Link href={`/admin/offerten/${offer.id}`}>{t('quoteOpen')}</Link>
              </Button>
            </Card>
          )}

          <div className="surface-card p-6">
            <h2 className="label-type text-ink-tertiary">{t('customerTitle')}</h2>
            {/* One line saying what this block is for, because the block below
                it is also about a person and the two were indistinguishable. */}
            <p className="mt-1 text-xs text-ink-tertiary">{t('customerLead')}</p>
            <p className="mt-3 text-lg font-medium">
              {customer.firstName} {customer.lastName}
            </p>
            <p data-numeric className="mt-1 text-sm text-ink-secondary">
              {customer.phone}
            </p>
            <p className="text-sm text-ink-secondary">{customer.email}</p>
            <p className="mt-1 text-sm text-ink-tertiary">
              {t('language')}: {customer.language.toUpperCase()}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary">
                <a href={`tel:${customer.phone.replace(/\s/g, '')}`}>
                  <Phone className="size-3.5" aria-hidden />
                  {t('call')}
                </a>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}>
                  <MessageCircle className="size-3.5" aria-hidden />
                  {t('whatsapp')}
                </a>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <a href={`mailto:${customer.email}`}>
                  <Mail className="size-3.5" aria-hidden />
                  {t('email')}
                </a>
              </Button>
            </div>

            {/* The block said whose request this was and gave no way to reach
                the record — history, plan, invoices, everything else about
                them was two searches away. */}
            <Button asChild variant="link" className="mt-4">
              <Link href={`/admin/kunden/${customer.id}`}>{t('customerOpen')}</Link>
            </Button>
          </div>

          {/* Deliberately not a card: dashed, tinted, and labelled, so it can
              never be mistaken for something the customer sees. */}
          <div className="rounded-[var(--radius-lg)] border border-dashed border-line bg-sunken p-5">
            <h2 className="flex items-center gap-2 font-medium">
              <Lock className="size-4 text-ink-tertiary" aria-hidden />
              {t('internalTitle')}
            </h2>
            <p className="mt-1 text-xs text-ink-tertiary">{t('internalHint')}</p>
            <Textarea
              className="mt-3 min-h-24 bg-page"
              placeholder={t('internalPlaceholder')}
              value={request.internalNote ?? ''}
              onChange={(e) => setInternalNote(e.target.value)}
            />
          </div>

        </aside>
      </div>

      {/* `?action=reject` is a link, and a link can be followed to a request
          that has already ended. It opens the dialog on the same condition the
          button appears under, so the deep link cannot reach a decline the
          screen itself refuses to offer. */}
      <RejectRequestDialog
        requestId={rejecting && declinable ? request.id : null}
        onClose={() => setRejecting(false)}
      />
    </div>
  );
}

/* `Section` is gone — every block on this screen is a CollapsibleSection now,
   and a second heading idiom sitting unused beside it is how the next person
   ends up with half the page in each. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-ink-tertiary">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}


