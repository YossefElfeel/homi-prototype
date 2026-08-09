'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/site/logo';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/cn';
import { daysLeft } from '@/mock/engines/offers';
import { useNow } from '@/mock/store';
import type { Offer } from '@/mock/schema';

const STEPS = ['offer', 'termin', 'unterschrift', 'zahlung'] as const;
export type OfferStepName = (typeof STEPS)[number];

/**
 * Chrome for the quote flow.
 *
 * Like the request wizard it drops the site navigation: someone reading a
 * quote should be deciding on the quote, not browsing. The reference, the
 * version and the expiry sit in the header on every step, because "is this
 * still valid?" is the question behind most of the hesitation here.
 */
export function OfferShell({
  offer,
  step,
  children,
}: {
  offer: Offer;
  step?: OfferStepName;
  children: React.ReactNode;
}) {
  const t = useTranslations('offer.shell');
  const brand = useTranslations('brand');
  const format = useFormatter();
  const now = useNow();

  const remaining = daysLeft(offer, now);
  const expiringSoon = remaining !== null && remaining > 0 && remaining <= 3;
  const index = step ? STEPS.indexOf(step) : -1;

  return (
    <>
      <header className="border-b border-line-subtle">
        <div className="mx-auto max-w-5xl px-gutter py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" aria-label={brand('name')}>
              <Logo />
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge entity="request" state={offerStateToRequestState(offer)} size="sm" />
              <span data-numeric className="label-type text-ink-tertiary">
                {t('reference')} {offer.reference}
              </span>
              {offer.version > 1 && (
                <span data-numeric className="label-type text-ink-tertiary">
                  {t('version', { n: offer.version })}
                </span>
              )}
            </div>
          </div>

          {offer.expiresAt && offer.status !== 'accepted' && (
            <p
              className={cn(
                'mt-2 flex items-center gap-2 text-sm',
                expiringSoon ? 'text-status-warning-fg' : 'text-ink-tertiary',
              )}
            >
              {expiringSoon && <AlertTriangle className="size-3.5 shrink-0" aria-hidden />}
              {t('validUntil')}{' '}
              <time data-numeric dateTime={offer.expiresAt}>
                {format.dateTime(new Date(offer.expiresAt), 'full')}
              </time>
              {remaining !== null && remaining > 0 && (
                <span data-numeric>· {t('daysLeft', { days: remaining })}</span>
              )}
            </p>
          )}

          {index >= 0 && (
            <nav aria-label={t('steps.offer')} className="mt-4">
              <ol className="flex gap-1.5">
                {STEPS.map((name, i) => (
                  <li
                    key={name}
                    aria-current={i === index ? 'step' : undefined}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i <= index ? 'bg-accent' : 'bg-sunken',
                    )}
                  >
                    <span className="sr-only">{t(`steps.${name}`)}</span>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-gutter py-block">
        {children}
      </main>
    </>
  );
}

/** The request status registry already covers these — no second colour scheme. */
function offerStateToRequestState(offer: Offer) {
  switch (offer.status) {
    case 'accepted':
      return 'accepted';
    case 'expired':
      return 'expired';
    case 'revisionRequested':
      return 'revisionRequested';
    case 'rejected':
      return 'rejected';
    default:
      return 'offerSent';
  }
}
