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
  /**
   * And `defaultLocale` now actually decides.
   *
   * It did not. next-intl negotiates before it falls back: the `NEXT_LOCALE`
   * cookie first, then the `accept-language` header, and only then the default
   * — so `defaultLocale: 'en'` was the answer nobody got. A browser that asks
   * for German was sent to /de, and worse, the cookie is sticky: one visit to
   * a /de URL — a link somebody pasted, a screen opened once to check a
   * translation — pinned that visitor to German on every later visit to the
   * bare domain, with nothing on screen explaining why.
   *
   * That is the right behaviour for the live site and the wrong one for a
   * prototype being reviewed, where "which language do I get" has to be a
   * property of the build rather than of whoever's browser is open. Off, the
   * unprefixed URL always resolves to English.
   *
   * The switcher is untouched: it navigates to a prefixed path, and
   * `localePrefix: 'always'` keeps the locale in the URL, so a language chosen
   * on screen still holds for as long as you stay in that URL space.
   *
   * TODO:launch — this goes back to `true` together with the default above.
   * Detection is what serves a Zürichsee visitor German without being asked.
   */
  localeDetection: false,
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
