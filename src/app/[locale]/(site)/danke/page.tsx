import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Check } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site.thanks' });
  return { title: t('meta.title'), robots: { index: false } };
}

/** Screen 12 — contact-form confirmation. */
export default async function ThanksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('site.thanks');

  return (
    <div className="mx-auto max-w-2xl px-gutter py-section">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-status-success text-status-success-fg">
        <Check className="size-6" aria-hidden />
      </span>
      <h1 className="display-type mt-7 text-[clamp(36px,5vw,64px)]">{t('title')}</h1>
      <p className="mt-5 text-lg text-ink-secondary">{t('lead')}</p>

      <h2 className="label-type mt-12 text-ink-tertiary">{t('nextTitle')}</h2>
      <ol className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
        {(['n1', 'n2', 'n3'] as const).map((key, i) => (
          <li key={key} className="flex gap-4 py-4">
            <span data-numeric className="label-type pt-0.5 text-ink-tertiary">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-ink-secondary">{t(key)}</span>
          </li>
        ))}
      </ol>

      <Button asChild variant="secondary" className="mt-10">
        <Link href="/">{t('home')}</Link>
      </Button>
    </div>
  );
}
