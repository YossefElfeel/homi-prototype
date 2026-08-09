import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { Toaster } from 'sonner';

import { routing } from '@/i18n/routing';
import { fontVariables } from '@/app/fonts';
import { DEFAULT_THEME, STRESS_COOKIE, THEME_COOKIE, isTheme } from '@/lib/theme';
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

  return (
    <html
      lang={locale}
      data-theme={theme}
      data-stress={stress}
      className={fontVariables}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-page text-ink antialiased">
        <NextIntlClientProvider>
          {children}
          <DemoBar initialTheme={theme} initialStress={stress === 'on'} />
          <Toaster position="top-center" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
