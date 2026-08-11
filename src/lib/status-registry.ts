/**
 * The single source of truth for state colour and label.
 *
 * The brief is explicit: "لون ثابت لكل حالة عبر كل الشاشات. الحالة الواحدة
 * ملهاش لونين في مكانين". Every badge across all 101 screens reads from here,
 * which makes the two-colours-for-one-state bug structurally impossible rather
 * than something review has to catch.
 *
 * Tones map to the theme-stable --status-* tokens in globals.css. Status is
 * information, not decoration, so it does not change between the three visual
 * directions.
 */

export type StatusTone = 'neutral' | 'info' | 'progress' | 'success' | 'warning' | 'danger';

export type StatusEntity =
  | 'request'
  | 'booking'
  | 'subscription'
  | 'invoice'
  | 'review'
  | 'application';

const TONES: Record<StatusEntity, Record<string, StatusTone>> = {
  // §4.1
  request: {
    draft: 'neutral',
    new: 'info',
    inReview: 'progress',
    offerSent: 'progress',
    revisionRequested: 'warning',
    accepted: 'success',
    rejected: 'danger',
    expired: 'neutral',
    cancelledByCustomer: 'danger',
    cancelledByCompany: 'danger',
  },
  // §4.2
  booking: {
    scheduled: 'info',
    rescheduled: 'warning',
    inProgress: 'progress',
    noAccess: 'danger',
    awaitingApproval: 'warning',
    completed: 'success',
    invoiced: 'info',
    closed: 'neutral',
    // A job the company called off. Distinct from `closed`, which is neutral
    // and reads as "finished" — the opposite of what happened here.
    cancelled: 'danger',
  },
  // §4.3
  subscription: {
    active: 'success',
    pastDue: 'danger',
    paused: 'warning',
    cancellationPending: 'warning',
    cancelled: 'neutral',
  },
  // §4.4
  invoice: {
    draft: 'neutral',
    sent: 'info',
    paid: 'success',
    overdue: 'danger',
    cancelled: 'neutral',
  },
  // §16
  review: {
    pending: 'progress',
    published: 'success',
    rejected: 'neutral',
  },
  // Hiring — basic pipeline only.
  application: {
    new: 'info',
    inReview: 'progress',
    accepted: 'success',
    rejected: 'neutral',
  },
};

export function statusTone(entity: StatusEntity, state: string): StatusTone {
  return TONES[entity][state] ?? 'neutral';
}

/** Tailwind classes per tone, bound to the theme-stable status tokens. */
export const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-status-neutral text-status-neutral-fg border-status-neutral-line',
  info: 'bg-status-info text-status-info-fg border-status-info-line',
  progress: 'bg-status-progress text-status-progress-fg border-status-progress-line',
  success: 'bg-status-success text-status-success-fg border-status-success-line',
  warning: 'bg-status-warning text-status-warning-fg border-status-warning-line',
  danger: 'bg-status-danger text-status-danger-fg border-status-danger-line',
};

/** Every state a given entity can be in, in the order a human reads them. */
export function statesOf(entity: StatusEntity): string[] {
  return Object.keys(TONES[entity]);
}
