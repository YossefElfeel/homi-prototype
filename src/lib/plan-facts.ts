/**
 * The facts about a plan that are not stored on it.
 *
 * A subscription stores what happened — when it started, how many visits were
 * spent, what it was bought for. Everything a screen actually asks it is a
 * question about *now*: is it still running, how many visits are left, may this
 * one still be cancelled. Storing those answers would mean a nightly job to
 * keep them true, and the prototype has no such job — so a stored `expired`
 * flag would simply be wrong every morning until someone opened the page.
 *
 * They are derived here, once, rather than re-implemented on each of the five
 * screens that need them. That is the same reason `offer-facts` exists, and the
 * same reason the invoice list derives "overdue" from the due date instead of
 * writing it down.
 */

import { isOffered } from '@/lib/service-catalogue';
import type {
  ID,
  Plan,
  Service,
  Settings,
  Subscription,
  SubscriptionStatus,
} from '@/mock/schema';

export function planOf(subscription: Subscription, plans: Plan[]): Plan | undefined {
  return plans.find((p) => p.id === subscription.planId);
}

/**
 * The plan a group leads with, or nothing when the group has no middle.
 *
 * The middle one, not the dearest one: a "recommended" badge on the top tier
 * reads as a sales tactic to this audience, and picking by position rather
 * than by name is what lets the office add or retire a plan without the ribbon
 * landing on nothing. Three or more, because a pair has no middle — on two
 * plans the old test crowned the cheaper one, which is an accident of rounding
 * an index rather than a recommendation.
 *
 * Derived here rather than computed in each view, because three views make the
 * claim: the marketing rail, the other direction's rail, and the comparison
 * table. Two of them had the rule written out and the third had nothing at
 * all, so the table gave no sign which column the cards above it had just
 * pointed at. Three copies of a rule is two chances to change one and not the
 * others.
 */
export function recommendedPlan(plans: Plan[]): Plan | undefined {
  if (plans.length < 3) return undefined;
  return plans[Math.floor((plans.length - 1) / 2)];
}

/**
 * What the package saves against buying the same visits one at a time, or
 * nothing if it saves nothing.
 *
 * Derived rather than stored, for the usual reason: a stored percentage and a
 * changed price drift apart the first time somebody edits one and not the
 * other, and the screen that shows them both is the screen that has to be
 * right. It is `null` — not zero — when `listPrice` is missing or is not
 * actually higher, so a card cannot render a struck-through price equal to the
 * one beside it, or a saving of nought per cent.
 */
export function planSaving(
  plan: Plan,
): { listPrice: number; saved: number; percent: number } | null {
  const listPrice = plan.listPrice;
  if (listPrice === undefined || listPrice <= plan.price) return null;

  const saved = listPrice - plan.price;
  /*
   * Rounded to the nearest point, not down.
   *
   * Down was the first instinct — never overstate a saving — and on real
   * numbers it read as a lie in the other direction: Basic saves 9.99 % and
   * the card said "Save 9%" for a package the business sells as ten. Nearest
   * is what a reader does with a percentage anyway, and it still refuses to
   * round 9.4 up. The guard against overstating is `listPrice` being a figure
   * the office entered, not this line.
   */
  return { listPrice, saved, percent: Math.round((saved / listPrice) * 100) };
}

/**
 * The plans a visitor can buy, grouped by the service they buy it for.
 *
 * A plan has always named a `serviceSlug` and no marketing screen has ever
 * shown it, so /abos read as three plans for the whole business when all three
 * were regular household cleaning. Somebody asking about their office found
 * household rhythms, a household price, and no way to tell that none of it
 * applied to them.
 *
 * Grouped rather than filtered by a picker: the number of services carrying
 * plans is two and might be one tomorrow, and a filter whose control has a
 * single option is a control that should not be there. A group with no plans
 * never appears — not every service *can* carry one, since a plan is a rhythm
 * and a move-out clean happens once.
 */
export function plansByService(
  plans: Plan[],
  services: Service[],
): { service: Service; plans: Plan[] }[] {
  const sellable = plans
    .filter((p) => p.active && p.visibleOnSite)
    .sort((a, b) => a.order - b.order);

  return services
    .filter(isOffered)
    .sort((a, b) => a.order - b.order)
    .map((service) => ({
      service,
      plans: sellable.filter((p) => p.serviceSlug === service.slug),
    }))
    .filter((group) => group.plans.length > 0);
}

/**
 * The status to show, which is not always the status stored.
 *
 * `cancelled` and `paused` are decisions somebody made and they stay put.
 * `expired` is not a decision — it is a date passing — so it is read off
 * `endDate` rather than written by anything. Nothing has to run at midnight for
 * a plan to be correctly expired the next time it is looked at.
 */
export function subscriptionState(
  subscription: Subscription,
  now: Date,
): SubscriptionStatus {
  if (subscription.status === 'cancelled') return 'cancelled';
  if (new Date(subscription.endDate) <= now) return 'expired';
  return subscription.status;
}

/** Visits bought and not yet spent. Never negative — an over-spend is a bug
    to see in the used count, not a negative balance to puzzle over. */
export function visitsLeft(subscription: Subscription, plan: Plan | undefined): number {
  return Math.max(0, (plan?.includedVisits ?? 0) - subscription.visitsUsed);
}

/**
 * Free skips taken this calendar month, counted off the history.
 *
 * This was a stored `skipsUsedThisMonth` counter that nothing ever reset. Every
 * screen presented it as a monthly allowance and no code path made it monthly,
 * so a customer's free skips ran out once and never came back. Counting the
 * events cannot drift out of step with them.
 */
export function skipsUsedThisMonth(subscription: Subscription, now: Date): number {
  return subscription.history.filter((event) => {
    if (event.kind !== 'skipped') return false;
    const at = new Date(event.at);
    return at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth();
  }).length;
}

export function skipsLeft(
  subscription: Subscription,
  settings: Settings,
  now: Date,
): number {
  return Math.max(0, settings.monthlyFreeSkips - skipsUsedThisMonth(subscription, now));
}

/**
 * Why a plan cannot be cancelled, or nothing if it can.
 *
 * The rule the business set is narrow on purpose: a plan is a year bought
 * outright, and it comes back only while it is still untouched and still fresh.
 * Both halves matter and they fail for different reasons, so they are reported
 * separately — "you have already used it" and "the window closed" are not the
 * same conversation, and a single disabled button that says neither is how a
 * customer ends up phoning to ask.
 */
export type CancelBlock = 'used' | 'windowClosed' | 'notActive';

export function cancelBlock(
  subscription: Subscription,
  settings: Settings,
  now: Date,
): CancelBlock | null {
  if (subscriptionState(subscription, now) !== 'active') return 'notActive';
  if (subscription.visitsUsed > 0) return 'used';

  const deadline = new Date(subscription.startDate);
  deadline.setDate(deadline.getDate() + settings.planCancellationDays);
  if (now > deadline) return 'windowClosed';

  return null;
}

/** The last day a refund is still possible — shown next to the button, because
    a deadline nobody can see is a deadline everybody misses. */
export function cancelDeadline(subscription: Subscription, settings: Settings): Date {
  const deadline = new Date(subscription.startDate);
  deadline.setDate(deadline.getDate() + settings.planCancellationDays);
  return deadline;
}

/** Subscribers of one plan, newest first. */
export function subscribersOf(planId: ID, subscriptions: Subscription[]): Subscription[] {
  return subscriptions
    .filter((s) => s.planId === planId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

/**
 * How many people a plan is currently carrying.
 *
 * Counted on the effective status rather than the stored one, so a plan whose
 * subscribers' terms all ran out last month does not still report them as
 * active on the list screen.
 */
export function activeSubscriberCount(
  planId: ID,
  subscriptions: Subscription[],
  now: Date,
): number {
  return subscriptions.filter(
    (s) => s.planId === planId && subscriptionState(s, now) === 'active',
  ).length;
}
