import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { cookies } from 'next/headers';
import { routing, INTL_LOCALES, TRANSLATED_LOCALES, type Locale } from './routing';
import { stressMessages } from './stress';
import { STRESS_COOKIE } from '@/lib/theme';
import { de, en, type Messages } from '@/messages';

const DICTIONARIES: Record<Locale, Messages> = {
  de,
  en,
  // ASSUMPTION §19.2: French and Italian are in scope but untranslated. Spec
  // §20.6 requires German as the fallback and a gap flag in the admin panel —
  // so they resolve to German rather than to empty keys.
  fr: de,
  it: de,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const cookieStore = await cookies();
  const stressed = cookieStore.get(STRESS_COOKIE)?.value === 'on';

  const base = DICTIONARIES[locale];

  return {
    locale,
    messages: stressed ? stressMessages(base) : base,
    formats: {
      dateTime: {
        full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
        dayMonth: { weekday: 'long', day: 'numeric', month: 'long' },
        short: { day: '2-digit', month: '2-digit', year: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' },
      },
      number: {
        chf: { style: 'currency', currency: 'CHF' },
      },
    },
    // Swiss formatting: CHF 1'234.50 with the apostrophe group separator,
    // and "Donnerstag, 12. September" for dates.
    now: new Date(),
    timeZone: 'Europe/Zurich',
    onError() {
      // Untranslated FR/IT keys fall back to German by design — don't shout.
    },
    getMessageFallback({ key }) {
      return key;
    },
  };
});

export function isTranslated(locale: Locale) {
  return TRANSLATED_LOCALES.includes(locale);
}

export function intlLocale(locale: Locale) {
  return INTL_LOCALES[locale];
}
