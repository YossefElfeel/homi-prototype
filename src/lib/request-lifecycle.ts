import type { Stage } from '@/components/ui/lifecycle';
import type { Offer, ServiceRequest } from '@/mock/schema';

export const REQUEST_STAGES = ['received', 'reviewed', 'quoted', 'settled'] as const;
export type RequestStage = (typeof REQUEST_STAGES)[number];

/**
 * The four stages of a request, derived from the record rather than stored.
 *
 * Shared by the panel (screen 53) and the customer's own view (screen 37) on
 * purpose. Both screens answer the same question — "where is this?" — and the
 * one thing worse than neither of them showing it is the two of them showing
 * different answers because each derived it from a slightly different rule.
 *
 * `draft` gets no lifecycle at all: it has not entered one. The caller checks
 * for that, because a rail whose every dot is grey is a rail that says the
 * record is stuck when in fact it has not started.
 */
export function requestStages(
  request: ServiceRequest,
  offer: Offer | undefined,
  labels: {
    received: string;
    reviewed: string;
    quoted: string;
    accepted: string;
    declined: string;
    cancelled: string;
    settled: string;
  },
  formatAt: (iso: string) => string,
): Stage[] {
  const s = request.status;

  const declined = s === 'rejected' || s === 'expired';
  const cancelled = s === 'cancelledByCustomer' || s === 'cancelledByCompany';
  const accepted = s === 'accepted';
  /* Any status that ends the request, however it ended. */
  const over = declined || cancelled || accepted;

  const quoteSent = Boolean(offer?.issuedAt) || s === 'offerSent' || s === 'revisionRequested';
  /* `new` is the only status that means nobody has looked yet. Everything past
     it implies the request was read, whether or not `openedAt` was stamped —
     a request answered before the flag was set is still a request that was
     read, and drawing that stage as pending would be a lie about the office. */
  const reviewed = s !== 'new' && s !== 'draft';

  return [
    {
      key: 'received',
      label: labels.received,
      detail: formatAt(request.createdAt),
      state: 'done',
    },
    {
      key: 'reviewed',
      label: labels.reviewed,
      detail: request.openedAt ? formatAt(request.openedAt) : undefined,
      state: reviewed ? (quoteSent || over ? 'done' : 'current') : 'pending',
    },
    {
      key: 'quoted',
      label: labels.quoted,
      detail: offer?.issuedAt ? formatAt(offer.issuedAt) : undefined,
      state: quoteSent
        ? over
          ? 'done'
          : 'current'
        : /* Declined or cancelled before a quote ever went out — this stage is
             not pending, it is never going to happen. */
          over
          ? 'skipped'
          : 'pending',
    },
    {
      key: 'settled',
      label: accepted
        ? labels.accepted
        : cancelled
          ? labels.cancelled
          : declined
            ? labels.declined
            : labels.settled,
      detail: request.respondedAt && over ? formatAt(request.respondedAt) : undefined,
      state: accepted ? 'done' : declined || cancelled ? 'failed' : 'pending',
    },
  ];
}
