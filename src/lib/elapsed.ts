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
