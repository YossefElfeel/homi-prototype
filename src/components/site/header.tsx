'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, Phone, X } from 'lucide-react';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/site/logo';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/leistungen', key: 'services' },
  { href: '/preise', key: 'pricing' },
  { href: '/abos', key: 'packages' },
  { href: '/referenzen', key: 'gallery' },
  { href: '/ueber-uns', key: 'about' },
  { href: '/kontakt', key: 'contact' },
] as const;

export function SiteHeader() {
  const t = useTranslations('nav');
  const brand = useTranslations('brand');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line-subtle bg-page/92 backdrop-blur-sm">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
      >
        {t('skipToContent')}
      </a>

      <div className="mx-auto flex h-18 max-w-7xl items-center gap-6 px-gutter">
        <Link href="/" aria-label={brand('name')} className="shrink-0">
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
                      'rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
                      active
                        ? 'text-ink font-medium'
                        : 'text-ink-secondary hover:text-ink',
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
            className="hidden items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-ink-secondary transition-colors hover:text-ink xl:inline-flex"
          >
            <Phone className="size-4" aria-hidden />
            <span data-numeric>{brand('phone')}</span>
          </a>

          <LocaleSwitcher />

          {/* Neither the header nor the footer linked to sign-in, so /anmelden
              and /passwort formed an island you could only reach by URL. */}
          <Link
            href="/anmelden"
            className="hidden rounded-[var(--radius-sm)] px-3 py-2 text-sm text-ink-secondary transition-colors hover:text-ink sm:inline-flex"
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
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-ink transition-colors hover:bg-sunken lg:hidden"
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

function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="relative">
      <span className="sr-only">Sprache</span>
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
        className="h-11 cursor-pointer appearance-none rounded-[var(--radius-sm)] bg-transparent py-2 pr-6 pl-3 text-sm text-ink-secondary transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
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
