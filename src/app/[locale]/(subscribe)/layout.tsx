import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { X } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/site/logo';

/**
 * On the layout rather than the page, because the page is a client component
 * and cannot export one. The group holds a single flow, so a title set once
 * here is the title of every screen in it.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site.subscribe' });
  return { title: t('meta.title') };
}

/**
 * Chrome for the plan checkout, stripped the same way the request wizard and
 * the quote flow are stripped — no main navigation, no footer, no floating
 * WhatsApp button.
 *
 * Its own group rather than living under `(site)`: this is the only page on the
 * marketing site that takes money, and the site header carries the full nav.
 * Putting a row of links across the top of a four-figure checkout is an exit
 * offered at the one moment nobody needs one.
 *
 * The way out points at /plans rather than the homepage. Somebody who abandons
 * a package is almost always comparing it with the next one up, and the
 * wizard's own close button already proved the homepage is the wrong landing:
 * it is the one screen that does not answer the question they left over.
 */
export default async function SubscribeLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('actions');
  const brand = await getTranslations('brand');

  return (
    <>
      <header className="border-b border-line-subtle">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-gutter">
          <Link href="/" aria-label={brand('name')}>
            <Logo />
          </Link>
          <Link
            href="/plans"
            aria-label={t('close')}
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-ink-tertiary transition-colors hover:bg-sunken hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </Link>
        </div>
      </header>
      <main id="main">{children}</main>
    </>
  );
}
