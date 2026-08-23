import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import NotFound from '@/app/[locale]/not-found';

/**
 * Catch-all so unmatched URLs reach *our* 404.
 *
 * Without it, `/en/anything` falls through to Next's built-in page — a bare
 * "404 | This page could not be found" with no header, no exits and no
 * translation.
 *
 * It renders the designed 404 directly rather than calling `notFound()`, for
 * two reasons that only show up from outside the browser:
 *
 * · **It can carry its own metadata.** A page that throws never resolves any,
 *   so every wrong URL used to answer with the brand's default title — the tab
 *   said "Homivaro — Sauber. Zuverlässig." on a page that exists to say the
 *   opposite. Now it says so.
 *
 * · **The `noindex` becomes ours.** Next does inject one for a not-found
 *   boundary and it does survive into the rendered DOM, which is what keeps
 *   these URLs out of an index today. But that is Next's internal behaviour,
 *   and the one protection standing between a stale link and the search
 *   results should not be an implementation detail of the framework.
 *
 * **On the status code.** This answers 200, not 404, and that is not fixable
 * from here. Every HTML response in this app streams, and the status is
 * committed at the first flush — which happens while the `[locale]` layout
 * renders, long before the router knows the path is wrong. Measured, not
 * assumed: `notFound()` from that layout (an unknown locale) *does* answer
 * 404, because it runs before the flush; the same call from any page below it
 * answers 200, and so does Next's own built-in 404 with this file deleted.
 *
 * Ruled out along the way: the next-intl proxy (a path excluded by its matcher
 * behaves identically), `loading.tsx` (removing it changes nothing), and the
 * absence of a root layout (adding one changes nothing).
 *
 * The shell flushes early because `[locale]/layout.tsx` reads five cookies to
 * paint the right theme on the first frame — a deliberate decision, and the
 * price of undoing it is a flash of the wrong theme on every page of the site,
 * for ever, to correct a status line on the wrong ones. `noindex` already
 * prevents the harm the status would cause. Left as it is on purpose.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'errors' });

  return {
    title: t('notFoundTitle'),
    robots: { index: false, follow: true },
  };
}

export default async function CatchAllNotFound({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NotFound />;
}
