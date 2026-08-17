import type { Stage } from '@/components/ui/lifecycle';
import type { Booking, Offer, Payment, ServiceRequest, SlotHold } from '@/mock/schema';

export const QUOTE_STAGES = [
  'received',
  'reviewed',
  'drafted',
  'sent',
  'scheduled',
  'signed',
  'paid',
  'booked',
] as const;
export type QuoteStage = (typeof QUOTE_STAGES)[number];

export interface QuoteStageLabels {
  received: string;
  reviewed: string;
  drafted: string;
  sent: string;
  /** Replaces `sent` while the customer has asked for a different price. */
  revision: string;
  scheduled: string;
  signed: string;
  paid: string;
  booked: string;
  /** The three ways this ends without a job. */
  declined: string;
  expired: string;
  cancelled: string;
}

export interface QuoteRecord {
  request: ServiceRequest;
  offer?: Offer;
  hold?: SlotHold;
  payment?: Payment;
  booking?: Booking;
}

/**
 * One rail, from the request landing to the job in the calendar.
 *
 * It used to stop four stages early. `received → reviewed → quoted → settled`
 * described the *office's* half and then folded the entire customer half —
 * picking a date, signing, paying, being booked — into the single word
 * "settled". So the screen that was supposed to answer "where is this?" went
 * quiet at exactly the point where the question gets asked: the owner could
 * see a quote had gone out and had been accepted, and had to open two other
 * screens to find out whether the money had arrived or the job existed.
 *
 * Derived, never stored. Both the panel and the customer's own account read
 * this same function, which is the point — the one thing worse than neither of
 * them showing a lifecycle is the two of them showing different ones.
 *
 * `draft` requests get no rail at all: they have not entered one, and a rail
 * whose every dot is grey says "stuck" when the truth is "not started". The
 * caller checks for that.
 */
export function quoteStages(
  record: QuoteRecord,
  labels: QuoteStageLabels,
  formatAt: (iso: string) => string,
): Stage[] {
  const { request, offer, hold, payment, booking } = record;
  const s = request.status;

  const declined = s === 'rejected';
  const cancelled = s === 'cancelledByCustomer' || s === 'cancelledByCompany';
  const lapsed = s === 'expired' || offer?.status === 'expired';
  const failed = declined || cancelled || lapsed;

  /* `new` is the only status meaning nobody has looked yet. Anything past it
     implies the request was read whether or not `openedAt` was ever stamped —
     drawing that stage as pending would be a lie about the office. */
  const reviewed = s !== 'new' && s !== 'draft';
  const sent =
    Boolean(offer?.issuedAt) ||
    s === 'offerSent' ||
    s === 'revisionRequested' ||
    s === 'accepted';

  const marks: { key: QuoteStage; label: string; detail?: string; reached: boolean }[] = [
    {
      key: 'received',
      label: labels.received,
      detail: request.createdAt,
      reached: true,
    },
    {
      key: 'reviewed',
      label: labels.reviewed,
      detail: request.openedAt,
      reached: reviewed,
    },
    {
      /* A draft offer exists but has reached nobody. Keeping it as its own
         stage is what stops `sent` from lighting up on a quote still being
         written — the bug the old rail had no vocabulary to avoid. */
      key: 'drafted',
      label: labels.drafted,
      reached: Boolean(offer),
    },
    {
      key: 'sent',
      label: offer?.status === 'revisionRequested' ? labels.revision : labels.sent,
      detail: offer?.issuedAt,
      reached: sent,
    },
    {
      key: 'scheduled',
      label: labels.scheduled,
      /* The office's confirmation if there was one, otherwise the slot the
         customer took at checkout. */
      detail: offer?.slotConfirmedAt ?? hold?.start ?? booking?.start,
      reached: Boolean(offer?.slotConfirmedAt || hold || booking),
    },
    {
      key: 'signed',
      label: labels.signed,
      detail: offer?.signedAt,
      reached: Boolean(offer?.signedAt),
    },
    {
      key: 'paid',
      label: labels.paid,
      detail: payment?.status === 'succeeded' ? payment.at : undefined,
      reached: payment?.status === 'succeeded',
    },
    {
      key: 'booked',
      label: labels.booked,
      detail: booking?.start,
      reached: Boolean(booking),
    },
  ];

  const lastReached = marks.reduce((last, m, i) => (m.reached ? i : last), -1);
  const complete = marks[marks.length - 1]!.reached;

  const stages: Stage[] = marks.map((m, i) => ({
    key: m.key,
    label: m.label,
    detail: m.detail ? formatAt(m.detail) : undefined,
    state: m.reached ? (i < lastReached || complete ? 'done' : 'current') : 'pending',
  }));

  if (!failed) return stages;

  /*
   * A dead quote does not have "pending" stages — it has stages that are never
   * going to happen. Drawing eight grey dots under a rejected quote invites
   * the reader to wait for them. So the tail is cut and replaced by the one
   * fact that is true: how it ended.
   */
  const kept = stages.slice(0, lastReached + 1).map((stage) => ({ ...stage, state: 'done' as const }));

  return [
    ...kept,
    {
      key: 'ended',
      label: declined ? labels.declined : cancelled ? labels.cancelled : labels.expired,
      detail:
        request.respondedAt
          ? formatAt(request.respondedAt)
          : offer?.expiresAt && lapsed
            ? formatAt(offer.expiresAt)
            : undefined,
      state: 'failed',
    },
  ];
}
