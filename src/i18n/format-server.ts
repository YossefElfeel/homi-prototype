import { getLocale } from 'next-intl/server';

import { buildFormatter, type SwissFormatter } from './format';
import type { Locale } from './routing';

/**
 * The server-component half of @/i18n/format, split out for the same reason
 * theme-server.ts is split from theme.ts: `next-intl/server` reaches for
 * `next/headers`, which throws the moment it is pulled into a client bundle.
 */
export async function getFormatter(): Promise<SwissFormatter> {
  return buildFormatter((await getLocale()) as Locale);
}
