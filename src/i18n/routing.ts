import { defineRouting } from 'next-intl/routing';

/**
 * German is the market language of the right Zürichsee shore and stays the
 * default. English ships complete. French and Italian are declared here so
 * the switcher, the routing and every message key exist from day one — their
 * dictionaries fall back to German until translation lands (spec §20.6).
 */
export const routing = defineRouting({
  locales: ['de', 'en', 'fr', 'it'],
  /**
   * English is the entry locale for the prototype so reviewers land on
   * something they can read. German is complete and one click away.
   *
   * TODO:launch — flip this back to 'de' before anything goes live. German is
   * the market language of the right Zürichseeufer; shipping an English
   * default to that audience would be a mistake.
   */
  defaultLocale: 'en',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

/** Locales whose dictionaries are actually written. */
export const TRANSLATED_LOCALES: Locale[] = ['de', 'en'];

export const LOCALE_LABELS: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
};

/** BCP-47 tags used for Intl formatting — Swiss variants, not the generic ones. */
export const INTL_LOCALES: Record<Locale, string> = {
  de: 'de-CH',
  en: 'en-CH',
  fr: 'fr-CH',
  it: 'it-CH',
};
