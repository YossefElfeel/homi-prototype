import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { Toaster } from 'sonner';

import { routing } from '@/i18n/routing';
import { fontVariables } from '@/app/fonts';
import {
  DEFAULT_DENSITY,
  DEFAULT_THEME,
  DENSITY_COOKIE,
  STRESS_COOKIE,
  THEME_COOKIE,
  isDensity,
  isTheme,
} from '@/lib/theme';
import { DemoBar } from '@/components/demo/demo-bar';
import '@/app/globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brand' });

  return {
    // SEO targets the eight municipalities actually served (spec §6) — not
    // the city of Zurich, which is outside the coverage list.
    title: {
      default: `${t('name')} — ${t('tagline')}`,
      template: `%s · ${t('name')}`,
    },
    description: t('tagline'),
    metadataBase: new URL('https://homivaro.ch'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isTheme(themeCookie) ? themeCookie : DEFAULT_THEME;
  const stress = cookieStore.get(STRESS_COOKIE)?.value === 'on' ? 'on' : 'off';
  const densityCookie = cookieStore.get(DENSITY_COOKIE)?.value;
  const density = isDensity(densityCookie) ? densityCookie : DEFAULT_DENSITY;

  return (
    <html
      lang={locale}
      data-theme={theme}
      data-stress={stress}
      data-density={density}
      className={fontVariables}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-page text-ink antialiased">
        <NextIntlClientProvider>
          {children}
          <DemoBar initialTheme={theme} initialStress={stress === 'on'} />
          {/* Sonner ships its own greys. Bind it to the token system instead,
              so a toast in Zuhause is not a Raster toast on a warm page. */}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--surface-card)',
                color: 'var(--content-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                fontFamily: 'var(--font-body)',
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
