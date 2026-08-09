'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { AlertTriangle, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/field';
import { useHydrated, useStore } from '@/mock/store';
import type { Review, ReviewStatus } from '@/mock/schema';
import { cn } from '@/lib/cn';

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn(
            'size-3.5',
            n <= rating ? 'fill-accent text-accent' : 'text-ink-tertiary',
          )}
        />
      ))}
    </span>
  );
}

/**
 * Screen 78 — review moderation.
 *
 * Critical reviews (≤ 3 stars) are held back with a note explaining why: an
 * answered critical review does less damage than a deleted one, and on a
 * profile with no reviews at all, a single unanswered one-star is fatal.
 * The reply field sits inside the card so replying is the path of least
 * resistance, not an extra screen.
 */
export default function AdminReviewsPage() {
  const t = useTranslations('admin.reviews');
  const format = useFormatter();
  const hydrated = useHydrated();

  const reviews = useStore((s) => s.data.reviews);
  const customers = useStore((s) => s.data.customers);
  const patchData = useStore((s) => s.patchData);

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const setStatus = (review: Review, status: ReviewStatus) =>
    patchData({
      reviews: reviews.map((r) =>
        r.id === review.id
          ? { ...r, status, ownerReply: drafts[review.id] ?? r.ownerReply }
          : r,
      ),
    });

  const customerName = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName.charAt(0)}.` : '—';
  };

  const groups: { status: ReviewStatus; title: string }[] = [
    { status: 'pending', title: t('pendingTitle') },
    { status: 'published', title: t('publishedTitle') },
    { status: 'rejected', title: t('rejectedTitle') },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      {reviews.length === 0 ? (
        <EmptyState className="mt-10" title={t('emptyTitle')} body={t('emptyBody')} />
      ) : (
        groups.map((group) => {
          const items = reviews.filter((r) => r.status === group.status);
          if (items.length === 0) return null;
          return (
            <section key={group.status} className="mt-10">
              <h2 className="label-type text-ink-secondary">{group.title}</h2>
              <ul className="mt-4 space-y-4">
                {items.map((review) => {
                  const critical = review.rating <= 3;
                  return (
                    <li key={review.id} className="surface-card p-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Stars
                            rating={review.rating}
                            label={t('starsLabel', { n: review.rating })}
                          />
                          <span className="font-medium">
                            {customerName(review.customerId)}
                          </span>
                        </span>
                        <span data-numeric className="text-sm text-ink-tertiary">
                          {format.dateTime(new Date(review.submittedAt), {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <p className="mt-3 max-w-[var(--measure)] text-ink-secondary">
                        {review.text}
                      </p>

                      {critical && review.status === 'pending' && (
                        <div className="mt-5 flex gap-3 border-l-2 border-status-warning-line bg-status-warning p-4">
                          <AlertTriangle
                            className="mt-0.5 size-4 shrink-0 text-status-warning-fg"
                            aria-hidden
                          />
                          <div>
                            <h3 className="text-sm font-medium text-status-warning-fg">
                              {t('negativeTitle')}
                            </h3>
                            <p className="mt-1 text-sm text-status-warning-fg">
                              {t('negativeBody')}
                            </p>
                          </div>
                        </div>
                      )}

                      {review.status === 'published' && review.ownerReply ? (
                        <div className="mt-5 border-l-2 border-rule pl-4">
                          <p className="label-type text-ink-tertiary">{t('replyLabel')}</p>
                          <p className="mt-1.5 text-sm text-ink-secondary">
                            {review.ownerReply}
                          </p>
                        </div>
                      ) : null}

                      {review.status === 'pending' && (
                        <>
                          <Field
                            label={t('replyLabel')}
                            hint={t('replyHint')}
                            className="mt-5"
                          >
                            {(props) => (
                              <Textarea
                                rows={3}
                                value={drafts[review.id] ?? review.ownerReply ?? ''}
                                onChange={(e) =>
                                  setDrafts({ ...drafts, [review.id]: e.target.value })
                                }
                                {...props}
                              />
                            )}
                          </Field>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Button
                              onClick={() => setStatus(review, 'published')}
                              disabled={
                                critical && !(drafts[review.id] ?? review.ownerReply)?.trim()
                              }
                            >
                              {t('publish')}
                            </Button>
                            <Button
                              variant="quiet"
                              onClick={() => setStatus(review, 'rejected')}
                            >
                              {t('reject')}
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
