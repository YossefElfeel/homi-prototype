'use client';

import { use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import {
  CalendarCheck,
  CalendarClock,
  ExternalLink,
  FileText,
  Package,
  RefreshCw,
  Repeat,
} from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  canReissue,
  daysLeft,
  isExpired,
  offerDiscount,
  offerHours,
  offerSubtotal,
  offerTotal,
} from '@/mock/engines/offers';
import {
  offerBooking,
  offerCoverage,
  offerPayment,
  offerRhythm,
} from '@/lib/offer-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { offerLineLabel } from '@/lib/offer-label';
import type { Locale } from '@/i18n/routing';

/**
 * Screen 57, detail half — new.
 *
 * The list had no detail view, so opening a row pushed the owner to
 * `/offerte/[id]`: the customer's own quote page, whose only way out is a
 * hardcoded German link to the marketing home page. Answering "what did we
 * actually quote here" meant leaving the console and navigating back in.
 *
 * The customer view is still one click away — it is the right screen for
 * checking what they see — but it is now a deliberate trip, not the default.
 */
export default function AdminOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('admin.offerDetail');
  const listT = useTranslations('admin.offers');
  const methodLabel = useTranslations('status.method');
  const rhythmT = useTranslations('admin.rhythm');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const offers = useStore((s) => s.data.offers);
  const requests = useStore((s) => s.data.requests);
  const customers = useStore((s) => s.data.customers);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const credits = useStore((s) => s.data.credits);
  const payments = useStore((s) => s.data.payments);
  const bookings = useStore((s) => s.data.bookings);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);
  const reissueOffer = useStore((s) => s.reissueOffer);
  const confirmOfferSlot = useStore((s) => s.confirmOfferSlot);

  if (!hydrated) return <SkeletonPage label={listT('title')} />;

  const offer = offers.find((o) => o.id === id);

  if (!offer) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={FileText}
          headingLevel={1}
          title={t('notFoundTitle')}
          body={t('notFoundBody')}
          action={
            <Button asChild>
              <Link href="/admin/offerten">{t('back')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const request = requests.find((r) => r.id === offer.requestId);
  const customer = customers.find((c) => c.id === request?.customerId);
  const service = services.find((s) => s.slug === request?.serviceSlug);
  const expired = isExpired(offer, now);
  const left = daysLeft(offer, now);
  const discount = offerDiscount(offer);

  const coverage = offerCoverage(offer, request, subscriptions, credits, now);
  const payment = offerPayment(offer.id, payments);
  const booking = offerBooking(offer.id, bookings);
  const rhythm = offerRhythm(request);
  /* Three dates in, none chosen — see `Offer.proposedSlots`. This is the only
     state on the whole screen that is waiting on the *owner* rather than on
     the customer, so it is the one thing that gets a panel rather than a row. */
  const awaitingSlot = Boolean(offer.proposedSlots?.length && !offer.slotConfirmedAt);

  const state = expired && offer.status === 'sent' ? 'expired' : offer.status;
  /* Not every quote is one a new version applies to — see `canReissue`. The
     button is hidden rather than disabled: on the quotes this excludes, the
     reason is already on screen next to it (a succeeded payment, a booking),
     and a greyed control with no tooltip explains nothing. */
  const reissuable = canReissue(offer, now);

  function reissue() {
    if (!reissueOffer(offer!.id, now)) return;
    toast.success(t('reissued'));
    router.push(`/admin/anfragen/${offer!.requestId}/offerte`);
  }

  function confirmSlot(start: string) {
    confirmOfferSlot(offer!.id, start, now);
    toast.success(
      t('slotConfirmed', {
        date: `${format.dateTime(new Date(start), 'dayMonth')}, ${format.dateTime(new Date(start), 'time')}`,
      }),
    );
  }

  return (
    <div>
      <PageHeader
        back={{ href: '/admin/offerten', label: t('back') }}
        title={offer.reference}
        meta={
          <>
            <StatusBadge
              entity="request"
              state={
                state === 'sent'
                  ? 'offerSent'
                  : state === 'draft'
                    ? 'draft'
                    : state
              }
            />
            {offer.version > 1 && (
              <Chip tone="neutral">{t('version', { n: offer.version })}</Chip>
            )}
          </>
        }
        actions={
          <>
            {reissuable && (
              <Button variant="secondary" onClick={reissue}>
                <RefreshCw className="size-4" aria-hidden />
                {t('reissue')}
              </Button>
            )}
            <Button asChild variant="secondary">
              {/* Deliberately a plain anchor with a new tab: this leaves the
                  console for the customer-facing flow, and coming back should
                  not mean re-navigating the panel. */}
              <a href={`/offerte/${offer.id}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" aria-hidden />
                {t('openAsCustomer')}
              </a>
            </Button>
          </>
        }
      />

      {expired && (
        <Alert tone="warning" className="mb-app">
          {t('expiredNote')}
        </Alert>
      )}

      <div className="gap-app grid lg:grid-cols-12">
        <div className="lg:col-span-8">
          {/*
            The one action on this screen that belongs to the owner.
            A first-time customer sends three dates and then waits — with no
            panel here that wait is invisible, and the quote looks like it is
            sitting with the customer when in fact it is sitting with us.
          */}
          {awaitingSlot && (
            <Card id="termin" className="mb-app border-status-warning-line">
              <CardHeader
                title={t('slotTitle')}
                description={t('slotLead', { name: customer?.firstName ?? '' })}
              />
              <ul className="mt-4 flex flex-wrap gap-2">
                {offer.proposedSlots!.map((start, i) => (
                  <li key={start}>
                    <Button variant="secondary" onClick={() => confirmSlot(start)}>
                      <CalendarClock className="size-4" aria-hidden />
                      <span data-numeric>
                        {t('slotChoice', { n: i + 1 })} ·{' '}
                        {format.dateTime(new Date(start), 'dayMonth')},{' '}
                        {format.dateTime(new Date(start), 'time')}
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-ink-tertiary">{t('slotHint')}</p>
            </Card>
          )}

          <Card pad="none">
            <CardHeader className="p-card" title={t('linesTitle')} />
            <div className="overflow-x-auto border-t border-line-subtle">
              <table className="w-full min-w-xl border-collapse text-left">
                <thead>
                  <tr className="border-b border-line-subtle">
                    <th className="label-type px-card py-2.5 font-medium text-ink-tertiary">
                      {t('colLine')}
                    </th>
                    <th className="label-type px-3 py-2.5 text-right font-medium text-ink-tertiary">
                      {t('colQuantity')}
                    </th>
                    <th className="label-type px-3 py-2.5 text-right font-medium text-ink-tertiary">
                      {t('colUnitPrice')}
                    </th>
                    <th className="label-type px-card py-2.5 text-right font-medium text-ink-tertiary">
                      {t('colSum')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offer.lines.map((line) => (
                    <tr
                      key={line.id}
                      className="border-b border-line-subtle last:border-0"
                    >
                      <td className="px-card py-row">
                        <span className="flex flex-wrap items-center gap-2">
                          {offerLineLabel(line, services, addOns, locale)}
                          {line.optional && (
                            <Chip tone={line.selected ? 'accent' : 'neutral'}>
                              {line.selected ? t('optional') : t('notSelected')}
                            </Chip>
                          )}
                        </span>
                        {line.note && (
                          <span className="mt-0.5 block text-sm text-ink-tertiary">
                            {line.note}
                          </span>
                        )}
                      </td>
                      <td data-numeric className="px-3 py-row text-right">
                        {line.quantity}
                      </td>
                      <td className="px-3 py-row text-right">
                        <Money amount={line.unitPrice} emphasis="quiet" />
                      </td>
                      <td className="px-card py-row text-right">
                        <Money
                          amount={line.unitPrice * line.quantity}
                          emphasis={line.selected ? 'default' : 'quiet'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/*
            What the customer wrote back, which until now had nowhere of its
            own: it was stored over the covering note, so this text appeared
            under the heading "Covering note" and the note the office had
            actually sent was gone. Two headings because they are two
            directions — one is what we said, one is what they answered.
          */}
          {offer.revisionNote && (
            <Card className="mt-app border-status-warning-line">
              <CardHeader
                title={t('revisionTitle')}
                description={t('revisionLead', { name: customer?.firstName ?? '' })}
              />
              <p className="mt-3 max-w-[var(--measure)] whitespace-pre-line text-ink-secondary">
                {offer.revisionNote}
              </p>
            </Card>
          )}

          {offer.message && (
            <Card className="mt-app">
              <CardHeader title={t('messageTitle')} />
              <p className="mt-3 max-w-[var(--measure)] whitespace-pre-line text-ink-secondary">
                {offer.message}
              </p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="space-y-app lg:sticky lg:top-[calc(var(--app-topbar-h)+1rem)]">
            <Card>
              <dl className="space-y-3 text-sm">
                <Row label={t('customer')}>
                  {customer ? (
                    <Link
                      href={`/admin/kunden/${customer.id}`}
                      className="font-medium text-ink-accent hover:underline"
                    >
                      {customer.firstName} {customer.lastName}
                    </Link>
                  ) : (
                    '—'
                  )}
                </Row>
                <Row label={t('request')}>
                  {request ? (
                    <Link
                      href={`/admin/anfragen/${request.id}`}
                      className="font-medium text-ink-accent hover:underline"
                      data-numeric
                    >
                      {request.reference}
                    </Link>
                  ) : (
                    '—'
                  )}
                </Row>
                <Row label={t('issued')}>
                  <span data-numeric>
                    {offer.issuedAt
                      ? format.dateTime(new Date(offer.issuedAt), 'short')
                      : '—'}
                  </span>
                </Row>
                <Row label={t('expires')}>
                  <span data-numeric>
                    {offer.expiresAt
                      ? format.dateTime(new Date(offer.expiresAt), 'short')
                      : '—'}
                    {left !== null && left > 0 && (
                      <span className="ms-2 text-ink-tertiary">
                        {listT('expiresIn', { days: left })}
                      </span>
                    )}
                  </span>
                </Row>
                <Row label={t('hours')}>
                  <span data-numeric>{offerHours(offer).toFixed(1)}</span>
                </Row>
                {/* What was quoted and how often it repeats — the two facts the
                    reference number alone never carried. */}
                <Row label={t('service')}>{service?.name[locale] ?? '—'}</Row>
                <Row label={t('rhythm')}>
                  <span className="inline-flex items-center gap-1">
                    {rhythm !== 'oneTime' && <Repeat className="size-3.5" aria-hidden />}
                    {rhythmT(rhythm)}
                  </span>
                </Row>
              </dl>
            </Card>

            <Card>
              <dl className="space-y-2 text-sm">
                <Row label={t('subtotal')}>
                  <Money amount={offerSubtotal(offer)} emphasis="quiet" />
                </Row>
                {discount > 0 && (
                  <Row label={t('discount')}>
                    <Money amount={-discount} emphasis="quiet" />
                  </Row>
                )}
                <div className="flex items-baseline justify-between gap-4 border-t border-line-subtle pt-3">
                  <dt className="font-medium">{t('total')}</dt>
                  <dd>
                    <Money amount={offerTotal(offer)} emphasis="strong" />
                  </dd>
                </div>

                {/*
                  Read-only, and deliberately so. The owner is not a party to
                  the transaction here — there is no card to enter and no
                  refund to press; the one thing this screen owes them is
                  whether the money arrived, which used to require opening the
                  invoices list and matching by name and date.
                */}
                <div className="space-y-2 border-t border-line-subtle pt-3">
                  {coverage.kind !== 'payable' && (
                    <Row label={t('coverage')}>
                      <Chip
                        tone="accent"
                        icon={coverage.kind === 'package' ? Package : Repeat}
                      >
                        {coverage.kind === 'package'
                          ? listT('coveragePackage', { hours: coverage.hoursRemaining ?? 0 })
                          : listT('coverageSubscription')}
                      </Chip>
                    </Row>
                  )}
                  <Row label={t('payment')}>
                    {payment ? (
                      <span className="inline-flex items-center gap-2">
                        <StatusBadge entity="payment" state={payment.status} size="sm" />
                        <span className="text-ink-tertiary">
                          {methodLabel(payment.method)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-ink-tertiary">
                        {coverage.kind === 'payable'
                          ? t('paymentNone')
                          : listT('paymentNotDue')}
                      </span>
                    )}
                  </Row>
                  {payment?.status === 'failed' && payment.failureReason && (
                    <p className="text-xs text-status-danger-fg">
                      {t('paymentFailed', { reason: payment.failureReason })}
                    </p>
                  )}
                </div>
              </dl>
            </Card>

            {/*
              A paid quote becomes a job, and until now the panel never said
              which one — the link existed in the data and nowhere on screen,
              so "did this actually get done?" started from the calendar.
            */}
            {booking && (
              <Card>
                <CardHeader title={t('bookingTitle')} />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span data-numeric className="text-ink-secondary">
                    {booking.reference}
                  </span>
                  <StatusBadge entity="booking" state={booking.status} size="sm" />
                </div>
                <p data-numeric className="mt-1 text-sm text-ink-tertiary">
                  {format.dateTime(new Date(booking.start), 'full')},{' '}
                  {format.dateTime(new Date(booking.start), 'time')}
                </p>
                <Button asChild block variant="secondary" className="mt-4">
                  <Link href={`/admin/buchungen/${booking.id}`}>
                    <CalendarCheck className="size-4" aria-hidden />
                    {t('bookingOpen')}
                  </Link>
                </Button>
              </Card>
            )}

            <Button asChild block variant="secondary">
              <Link href={`/admin/anfragen/${offer.requestId}`}>
                {t('openRequest')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-ink-tertiary">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
