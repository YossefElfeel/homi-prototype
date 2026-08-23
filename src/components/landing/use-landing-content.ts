'use client';

import { useLocale as useRoutingLocale } from 'next-intl';

import { landingContent, type Content } from '@/content/landing';

/**
 * The bridge between the cloned landing page and this app's i18n.
 *
 * The design build kept the chosen language in `localStorage` and re-rendered
 * on the client. This app cannot: locales are URL segments (`/de`, `/en`,
 * `/fr`, `/it`), the middleware routes on them, and `<html lang>` is set by
 * the server. Reading the language from storage here would give a German
 * visitor on `/de` an English page whenever their storage said `en`, and would
 * put the wrong `lang` on the document.
 *
 * So the copy is the design's, verbatim, and only the way a language is picked
 * changes. Everything downstream still calls `useContent()`, which is why the
 * ported sections needed no edits for it.
 */
export function useContent(): Content {
  return landingContent(useRoutingLocale());
}

/**
 * Kept for the `key={locale}` prop the sections use to replay their reveals
 * when the copy changes. Under URL routing a language change is a navigation
 * rather than a re-render, so it rarely fires now — it stays because it is
 * still correct and costs nothing.
 */
export function useLocale(): { locale: string } {
  return { locale: useRoutingLocale() };
}
