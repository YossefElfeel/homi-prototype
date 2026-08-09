import { getTranslations } from 'next-intl/server';
import { X } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/site/logo';

/**
 * Deliberately stripped chrome: no main navigation, no footer, no floating
 * WhatsApp button. Someone mid-request should have exactly one way forward and
 * one clearly-marked way out — the site nav here would just leak people out of
 * the highest-value flow on the site.
 */
export default async function BookingLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('actions');
  const brand = await getTranslations('brand');

  return (
    <>
      <header className="border-b border-line-subtle">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-gutter">
          <Link href="/" aria-label={brand('name')}>
            <Logo />
          </Link>
          {/* Neutral label: the "your answers are saved" reassurance belongs on
              the step itself, where it is true — after submitting, the draft is
              gone and that line would be a small lie. */}
          <Link
            href="/"
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
