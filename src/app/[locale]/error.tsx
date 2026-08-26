'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Phone, RotateCcw } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

/**
 * The error boundary.
 *
 * Two exits, because "try again" only helps when the failure was transient.
 * The phone number is the other one, and it is the real fallback for this
 * business: the owner answers it. `digest` is shown because a caller who can
 * read out an identifier turns "the website broke" into something traceable.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  const brand = useTranslations('brand');

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-gutter py-section">
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-status-warning text-status-warning-fg">
        <AlertTriangle className="size-5" aria-hidden />
      </span>

      <h1 className="subhead-type rule-accent mt-6 text-3xl sm:text-4xl">
        {t('genericTitle')}
      </h1>
      <p className="mt-5 max-w-[var(--measure)] text-lg text-ink-secondary">
        {t('genericBody')}
      </p>

      {error.digest && (
        <p className="mt-6 border-l-2 border-rule bg-sunken rounded-[var(--radius-lg)] p-4 text-sm text-ink-secondary">
          <span data-numeric className="font-mono">
            {t('reference', { id: error.digest })}
          </span>
          <span className="mt-1 block text-ink-tertiary">{t('referenceHint')}</span>
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button onClick={reset}>
          <RotateCcw className="size-4" aria-hidden />
          {t('retry')}
        </Button>
        <Button asChild variant="secondary">
          <a href={`tel:${brand('phone').replace(/\s/g, '')}`}>
            <Phone className="size-4" aria-hidden />
            {t('callUs')}
          </a>
        </Button>
        <Button asChild variant="quiet">
          <Link href="/">{t('home')}</Link>
        </Button>
      </div>
    </main>
  );
}
