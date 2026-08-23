'use client';

import { motion } from 'motion/react';
import { useLocale } from 'next-intl';

import { usePathname, useRouter } from '@/i18n/navigation';
import { TRANSLATED_LOCALES, LOCALE_LABELS, type Locale } from '@/i18n/routing';

/**
 * The design's two-up language toggle, on this app's routing.
 *
 * Visually identical to the design build — one pill slides between the options
 * so the change reads as a single movement rather than two fades. What changed
 * underneath is the mechanism: the design wrote the choice to `localStorage`,
 * and here a language is a URL segment, so switching is a navigation that
 * keeps the current path.
 *
 * It offers the two locales that are actually written. French and Italian are
 * declared in `routing.ts` and resolve to German (§20.6), and a toggle that
 * silently hands you German when you press FR is worse than not offering it.
 * They stay reachable by URL, which is what the fallback is for.
 */
export function LocaleSwitch({
  tone = 'light',
  className = '',
}: {
  /** `light` sits on the hero photo, `dark` on white ground. */
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const active = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      role="group"
      aria-label="Language"
      className={`relative flex shrink-0 items-center rounded-full p-0.5 sm:p-1 ${
        tone === 'light' ? 'bg-page/15 backdrop-blur' : 'bg-inverse/6'
      } ${className}`}
    >
      {TRANSLATED_LOCALES.map((code) => {
        const on = active === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => router.replace(pathname, { locale: code })}
            aria-pressed={on}
            title={LOCALE_LABELS[code]}
            className="relative rounded-full px-2.5 py-1.5 text-xs font-semibold tracking-[0.06em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus sm:px-3 sm:text-[13px]"
          >
            {on ? (
              <motion.span
                layoutId={`locale-pill-${tone}`}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className={`absolute inset-0 rounded-full ${
                  tone === 'light' ? 'bg-page' : 'bg-inverse'
                }`}
              />
            ) : null}
            <span
              className={`relative z-10 transition-colors duration-300 ${
                on
                  ? tone === 'light'
                    ? 'text-ink'
                    : 'text-ink-inverse'
                  : tone === 'light'
                    ? 'text-ink-inverse/70 hover:text-ink-inverse'
                    : 'text-ink/55 hover:text-ink'
              }`}
            >
              {code.toUpperCase()}
            </span>
            <span className="sr-only"> — {LOCALE_LABELS[code]}</span>
          </button>
        );
      })}
    </div>
  );
}
