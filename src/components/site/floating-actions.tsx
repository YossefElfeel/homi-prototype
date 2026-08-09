import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';

import { Link } from '@/i18n/navigation';

/**
 * Spec §19.2: a floating WhatsApp button on every page, and a fixed request
 * button at the bottom of the screen on mobile.
 *
 * The mobile bar sits above the WhatsApp button and both clear the safe area,
 * so neither covers content on a phone with a home indicator. The page adds
 * matching bottom padding (see the site layout) so nothing is ever hidden
 * behind them.
 */
export function FloatingActions() {
  const t = useTranslations('nav');
  const brand = useTranslations('brand');
  const wa = brand('mobile').replace(/\D/g, '');

  return (
    <>
      <a
        href={`https://wa.me/41${wa.replace(/^0/, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp — ${brand('name')}`}
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 inline-flex size-13 items-center justify-center rounded-full bg-eco text-white shadow-[0_10px_28px_-10px_rgba(0,0,0,0.45)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] lg:right-6"
      >
        <MessageCircle className="size-6" aria-hidden />
      </a>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line-subtle bg-page/95 px-gutter pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:hidden">
        <Link
          href="/anfrage"
          className="flex h-12 w-full items-center justify-center rounded-[var(--radius-action)] bg-accent font-medium text-on-accent"
        >
          {t('requestQuote')}
        </Link>
      </div>
    </>
  );
}
