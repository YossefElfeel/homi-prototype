'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Star } from 'lucide-react';

import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/cn';
import { useAccount } from '@/lib/use-account';
import { useStore } from '@/mock/store';

/**
 * What became of the reviews this customer wrote.
 *
 * Screen 46 could take a review and had no way of ever giving one back. You
 * rated a job, pressed send, got a thank-you — and the next time you opened
 * the screen it offered the *next* job, as though the first review had never
 * existed. `ReviewStatus` has four values and the person who wrote the words
 * could see none of them.
 *
 * Two of the four are the reason this is worth building. A review sitting in
 * `pending` for a fortnight and one that was `rejected` outright look
 * identical from outside the office — which is silence — and §20.6 turns on
 * the customer being able to see what was done with their words at all.
 *
 * A binned review (`deletedAt`) is deliberately left out. The bin is
 * mid-decision by design — recoverable, with an undo on the moderation queue —
 * so reporting it here would tell the customer something that may be untrue by
 * tomorrow. What happens when the office bins a review *for good* is §20.6b on
 * /open-questions; today `eraseReview` removes the record, so it leaves this
 * list by leaving the data.
 *
 * A card rather than a screen of its own: it belongs beside the form that
 * produces it, and a nav entry for a list most customers will never have more
 * than two rows in is a permanent cost for an occasional need.
 */
export function MyReviews() {
  const t = useTranslations('account.review');
  const format = useFormatter();
  const locale = useLocale() as Locale;

  const { reviews, bookings } = useAccount();
  const services = useStore((s) => s.services);

  const mine = reviews
    .filter((r) => !r.deletedAt)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));

  return (
    <Card>
      <CardHeader title={t('mineTitle')} description={t('mineLead')} />
      <CardBody>
        {mine.length === 0 ? (
          <EmptyState
            compact
            icon={Star}
            title={t('mineEmptyTitle')}
            body={t('mineEmptyBody')}
          />
        ) : (
          <ul className="space-y-6">
            {mine.map((review) => {
              const booking = bookings.find((b) => b.id === review.bookingId);
              const service = booking
                ? (services.find((s) => s.slug === booking.serviceSlug)?.name[locale] ??
                  booking.serviceSlug)
                : undefined;

              /*
               * What the state means for the person who wrote it.
               *
               * `pending` splits on consent, and the split matters: without it
               * a review that can never be published — because publication was
               * never agreed to — reads as one still queued behind a decision.
               * That is the office appearing slow for a choice the customer
               * made themselves.
               */
              const note =
                review.status === 'pending'
                  ? review.publishConsent
                    ? t('minePending')
                    : t('mineConsentOff')
                  : review.status === 'published'
                    ? t('minePublished')
                    : review.status === 'hidden'
                      ? t('mineHidden')
                      : t('mineRejected');

              return (
                <li key={review.id} className="border-t border-line pt-6 first:border-0 first:pt-0">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div>
                      {/* The rating as it was given. Not buttons — this is a
                          record of what was sent, and a control here would
                          invite an edit the moderation queue cannot take. */}
                      <div className="flex gap-0.5" role="img" aria-label={t('mineStars', { n: review.rating })}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={cn(
                              'size-4',
                              n <= review.rating
                                ? 'fill-accent text-accent'
                                : 'text-ink-tertiary',
                            )}
                            aria-hidden
                          />
                        ))}
                      </div>
                      {booking && (
                        <p data-numeric className="mt-1.5 text-sm text-ink-tertiary">
                          {t('mineOn', {
                            date: format.dateTime(new Date(booking.start), 'short'),
                            service: service ?? '—',
                          })}
                        </p>
                      )}
                    </div>
                    <StatusBadge entity="review" state={review.status} size="sm" />
                  </div>

                  <p className="mt-3 max-w-[var(--measure)] text-ink-secondary">
                    {review.text}
                  </p>
                  <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-tertiary">
                    {note}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
