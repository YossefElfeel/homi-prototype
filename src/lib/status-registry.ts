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
  | 'calendarEvent'
  | 'subscription'
  | 'invoice'
  | 'review'
  | 'application'
  | 'payment'
  | 'key'
  | 'service'
  | 'addOn'
  | 'coupon';

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
  /*
   * Calls, follow-ups and viewings.
   *
   * `pending` is warning rather than danger: nobody picking up is not a
   * failure, it is a thing that is still outstanding — the same weight as
   * `rescheduled` on a booking, and for the same reason.
   *
   * `inProgress` was `converted` and coloured success, on the reasoning that
   * a call becoming a request is the outcome the call existed to produce. It
   * is progress: the request it opened still has to be quoted, booked and
   * paid, and a green badge said that work was finished when it had just
   * started.
   */
  calendarEvent: {
    upcoming: 'info',
    pending: 'warning',
    inProgress: 'progress',
    done: 'success',
    cancelled: 'neutral',
  },
  // §4.3
  /* §11 — four states, and every one of them reachable from a screen.
     `pastDue` and `cancellationPending` left with the monthly-charge model that
     produced them: a plan is paid once, so no collection can fall behind, and a
     cancellation is either immediate or refused. `expired` is the state every
     plan reaches on its own — neutral rather than a warning, because a term
     running its course is not a problem. */
  subscription: {
    active: 'success',
    paused: 'warning',
    expired: 'neutral',
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
  /*
   * §10. `Payment` was the one status union in the schema with no entry here,
   * because until the quote list showed payment state nothing rendered it —
   * and the first screen to need it would have hand-typed its own colours.
   *
   * `refunded` is neutral, not danger: money going back is an outcome, not a
   * fault, and colouring it red puts a warning on the screen for a case that
   * is usually the company keeping its word.
   */
  payment: {
    pending: 'progress',
    succeeded: 'success',
    failed: 'danger',
    refunded: 'neutral',
  },
  /*
   * §13.2. The key log wrote these two colours inline — `status-info` against
   * `status-neutral`, hand-typed in the cell — and the property record drew the
   * same two states as a `Chip` with its own tones. Two screens, one state, two
   * places to get it wrong, which is precisely what this file exists to stop.
   *
   * `returned` is neutral rather than success: handing a key back is the record
   * closing, not something going well. Green would put the same weight on it as
   * a paid invoice, and read as an outcome to aim for — the office is normally
   * holding keys on purpose.
   */
  key: {
    held: 'info',
    returned: 'neutral',
  },
  /*
   * §17.2. The catalogue drew its own two colours inline — a hand-typed
   * `bg-status-success` against a hand-typed `bg-status-neutral` in the cell —
   * for the two states a boolean could hold. Adding a third made that
   * untenable, which is the good reason to move it here rather than add a
   * branch to the ternary.
   *
   * `draft` is warning, not neutral: an unfinished service is the one row on
   * the list that is asking for something. `inactive` is neutral, because a
   * service the office retired is a decision that has already been made — the
   * same reasoning that keeps a cancelled invoice grey.
   */
  service: {
    draft: 'warning',
    active: 'success',
    inactive: 'neutral',
  },
  /*
   * An add-on has two states, not three, and that is deliberate rather than an
   * omission. A service can be a draft because its price is argued about for
   * days before it is sold; an add-on is a name, a price and half an hour, and
   * the thing that would be a draft is simply one that is switched off. Adding
   * `draft` here would put a third state on the badge that no screen could
   * write — the exact shape of lie this registry exists to make impossible.
   *
   * The colours are the service ones, unchanged: withdrawn is neutral because
   * it is a decision already made, not a warning about unfinished work.
   */
  addOn: {
    active: 'success',
    inactive: 'neutral',
  },
  /*
   * §9.4. The coupon list drew its own badge — one ternary, `success` for
   * valid and `neutral` for everything else — which meant three genuinely
   * different situations shared one grey chip. Expired, aufgebraucht and
   * deaktiviert are not the same news, and the column headed «Status» was the
   * only place the office would ever find out which one it was.
   *
   * `used-up` is the warning, and it is the only one. A cap hit while the
   * window is still open is a code customers are being turned away from today
   * — the office either raises the ceiling or lets it die, but it has to know.
   * Expiry is neither: a campaign reaching its end date did what it was
   * written to do, so it is neutral for the same reason a plan that ran its
   * term is. `scheduled` is info — a code waiting for its start date is not
   * asking for anything, it just is not live yet, and green would have said it
   * was.
   */
  coupon: {
    scheduled: 'info',
    active: 'success',
    'used-up': 'warning',
    expired: 'neutral',
    inactive: 'neutral',
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
