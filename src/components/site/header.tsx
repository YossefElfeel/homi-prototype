'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, Phone, X } from 'lucide-react';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/site/logo';
import type { Theme } from '@/lib/theme';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/leistungen', key: 'services' },
  { href: '/preise', key: 'pricing' },
  { href: '/abos', key: 'packages' },
  { href: '/referenzen', key: 'gallery' },
  { href: '/ueber-uns', key: 'about' },
  { href: '/kontakt', key: 'contact' },
] as const;

/** Where the bar leaves the hero and becomes a floating one. */
const DETACH_AT = 140;

export function SiteHeader({ theme }: { theme?: Theme }) {
  const t = useTranslations('nav');
  const brand = useTranslations('brand');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const hv = theme === 'homivaro';
  /* Only the homepage has a hero for the bar to start inside. Everywhere else
     it is a floating bar from the first pixel, which is also why it is sticky
     there and fixed here — a fixed bar over a page with no hero would need
     every page to reserve its height. */
  const overHero = hv && pathname === '/';

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > DETACH_AT);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overHero]);

  /* Transparent over the photograph, frosted once it has left it. */
  const floating = hv && (!overHero || scrolled);
  /* White type only while the bar is genuinely over the photograph. */
  const onDark = hv && !floating;

  return (
    <header
      className={cn(
        'z-40',
        hv
          ? [
              'transition-[background-color,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-standard)]',
              overHero
                ? 'fixed inset-x-3 top-3 sm:inset-x-7 sm:top-7'
                : 'sticky top-3 mx-3 sm:top-7 sm:mx-7',
              floating
                ? 'rounded-[var(--radius-action)] bg-page/92 shadow-[var(--shadow-md)] backdrop-blur-md'
                : 'bg-transparent',
            ]
          : 'sticky top-0 border-b border-line-subtle bg-page/92 backdrop-blur-sm',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
      >
        {t('skipToContent')}
      </a>

      <div
        className={cn(
          'mx-auto flex items-center gap-6',
          hv ? 'h-17 max-w-none px-5 sm:px-7' : 'h-18 max-w-7xl px-gutter',
        )}
      >
        <Link
          href="/"
          aria-label={brand('name')}
          className={cn('shrink-0', onDark && 'text-ink-inverse')}
        >
          <Logo />
        </Link>

        <nav aria-label="Hauptnavigation" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'px-3 py-2 text-sm transition-colors',
                      /* The design fills the active item rather than
                         underlining it. Not a shared-layout pill that tracks
                         the section in view: this nav points at six other
                         pages, not at anchors on this one, so there is no
                         section for it to follow. */
                      hv ? 'rounded-[var(--radius-action)]' : 'rounded-[var(--radius-sm)]',
                      active && hv && !onDark && 'bg-sunken font-medium text-ink',
                      active && hv && onDark && 'bg-white/15 font-medium text-ink-inverse',
                      active && !hv && 'font-medium text-ink',
                      !active && onDark && 'text-ink-inverse/75 hover:text-ink-inverse',
                      !active && !onDark && 'text-ink-secondary hover:text-ink',
                    )}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <a
            href={`tel:${brand('phone').replace(/\s/g, '')}`}
            className={cn(
              'hidden items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors xl:inline-flex',
              onDark ? 'text-ink-inverse/75 hover:text-ink-inverse' : 'text-ink-secondary hover:text-ink',
            )}
          >
            <Phone className="size-4" aria-hidden />
            <span data-numeric>{brand('phone')}</span>
          </a>

          <LocaleSwitcher onDark={onDark} />

          {/* Neither the header nor the footer linked to sign-in, so /anmelden
              and /passwort formed an island you could only reach by URL. */}
          <Link
            href="/anmelden"
            className={cn(
              'hidden rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors sm:inline-flex',
              onDark ? 'text-ink-inverse/75 hover:text-ink-inverse' : 'text-ink-secondary hover:text-ink',
            )}
          >
            {t('login')}
          </Link>

          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/anfrage">{t('requestQuote')}</Link>
          </Button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t('menu')}
            className={cn(
              'inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] transition-colors lg:hidden',
              onDark ? 'text-ink-inverse hover:bg-white/15' : 'text-ink hover:bg-sunken',
            )}
          >
            <Menu className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-page lg:hidden">
          <div className="flex h-18 items-center justify-between border-b border-line-subtle px-gutter">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('close')}
              className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-ink transition-colors hover:bg-sunken"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <nav aria-label="Hauptnavigation" className="px-gutter py-6">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-[var(--radius-sm)] px-3 py-3.5 text-lg text-ink transition-colors hover:bg-sunken"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 space-y-3 border-t border-line-subtle pt-6">
              <Button asChild block size="lg">
                <Link href="/anfrage" onClick={() => setOpen(false)}>
                  {t('requestQuote')}
                </Link>
              </Button>
              <Button asChild block variant="secondary" size="lg">
                <a href={`tel:${brand('phone').replace(/\s/g, '')}`}>
                  <Phone className="size-4" aria-hidden />
                  <span data-numeric>{brand('phone')}</span>
                </a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function LocaleSwitcher({ onDark = false }: { onDark?: boolean }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="relative">
      <span className="sr-only">Sprache</span>
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
        className={cn(
          'h-11 cursor-pointer appearance-none rounded-[var(--radius-sm)] bg-transparent py-2 pr-6 pl-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
          onDark ? 'text-ink-inverse/75 hover:text-ink-inverse' : 'text-ink-secondary hover:text-ink',
        )}
      >
        {routing.locales.map((value) => (
          <option key={value} value={value}>
            {value.toUpperCase()}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-xs text-ink-tertiary"
      >
        ▾
      </span>
      <span className="sr-only">{LOCALE_LABELS[locale]}</span>
    </label>
  );
}
