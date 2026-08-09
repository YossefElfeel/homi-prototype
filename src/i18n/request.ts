import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { cookies } from 'next/headers';
import { routing, INTL_LOCALES, TRANSLATED_LOCALES, type Locale } from './routing';
import { stressMessages } from './stress';
import { DATE_FORMATS, NUMBER_FORMATS, TIME_ZONE } from './formats';
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
    // These presets stay declared for anything that reaches for next-intl's
    // own formatter, but dates are rendered through @/i18n/format, which binds
    // the Swiss tag (en-CH, de-CH, …). The routing locales are URL segments,
    // and bare "en" formats dates the American way.
    formats: {
      dateTime: DATE_FORMATS,
      number: NUMBER_FORMATS,
    },
    now: new Date(),
    timeZone: TIME_ZONE,
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
