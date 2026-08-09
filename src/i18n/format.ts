import { useMemo } from 'react';
import { useLocale } from 'next-intl';

import { INTL_LOCALES, type Locale } from './routing';
import { DATE_FORMATS, TIME_ZONE, type DateFormatName } from './formats';

/**
 * Dates, formatted the Swiss way — in every language.
 *
 * next-intl's own `useFormatter` formats with the *routing* locale, and the
 * routing locales are the URL segments: `de`, `en`, `fr`, `it`. Bare `en`
 * resolves to American conventions, so "9 August 2026" came out as
 * `08/09/2026` — a date that reads as 8 September to everyone in this market,
 * on the locale that is now the default. German was only ever correct by
 * accident, because `de` already orders day before month.
 *
 * `INTL_LOCALES` maps each routing locale to its Swiss tag (`en-CH`, `de-CH`,
 * …), which is what `<Money>` has always used. This binds the same tags to
 * dates. Importing `useFormatter` from here instead of from `next-intl` is the
 * whole fix; the call sites are unchanged.
 */
export interface SwissFormatter {
  dateTime(value: Date, format?: DateFormatName | Intl.DateTimeFormatOptions): string;
}

/** Shared with the server helper in ./format-server.ts. */
export function buildFormatter(locale: Locale): SwissFormatter {
  const tag = INTL_LOCALES[locale];
  return {
    dateTime(value, format) {
      const options = typeof format === 'string' ? DATE_FORMATS[format] : format;
      return new Intl.DateTimeFormat(tag, { timeZone: TIME_ZONE, ...options }).format(value);
    },
  };
}

export function useFormatter(): SwissFormatter {
  const locale = useLocale() as Locale;
  return useMemo(() => buildFormatter(locale), [locale]);
}
