import { formatDistanceStrict } from 'date-fns';
import { de, enGB, fr, it } from 'date-fns/locale';
import type { Locale } from '@/i18n/routing';

const LOCALES = { de, en: enGB, fr, it };

/**
 * How long a request has been waiting.
 *
 * This is the number the dashboard is built around: the owner's day is judged
 * on whether anything has been sitting unanswered past the promised window,
 * and the brief asks for it to stand out once it has.
 */
export function elapsed(from: string | Date, now: Date, locale: Locale) {
  return formatDistanceStrict(new Date(from), now, { locale: LOCALES[locale] });
}

export function hoursSince(from: string | Date, now: Date) {
  return (now.getTime() - new Date(from).getTime()) / 3_600_000;
}

/**
 * When an answer is owed.
 *
 * §4.1 promises a quote within a stated window, and the request list was
 * showing only how long something had been waiting — "3 days" is a fact, not a
 * priority. The deadline turns it into one, and it is derived rather than
 * stored so that moving `responseTimeHours` in settings re-prioritises the
 * whole queue instead of only the requests taken after the change.
 */
export function deadlineFor(createdAt: string | Date, responseTimeHours: number) {
  return new Date(new Date(createdAt).getTime() + responseTimeHours * 3_600_000);
}

/**
 * Whole days past the deadline, or 0 while still inside it.
 *
 * Whole days on purpose: "2 days late" is what gets a request answered, and a
 * queue sorted by fractional hours reorders itself while being read.
 */
export function overdueDays(
  createdAt: string | Date,
  responseTimeHours: number,
  now: Date,
) {
  const late = now.getTime() - deadlineFor(createdAt, responseTimeHours).getTime();
  return late <= 0 ? 0 : Math.floor(late / 86_400_000);
}
