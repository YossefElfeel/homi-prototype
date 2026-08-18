'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { AlertTriangle, RotateCcw, Star } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { CustomerLink } from '@/components/ui/record-link';
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
  const setReviewStatus = useStore((s) => s.setReviewStatus);
  const replyToReview = useStore((s) => s.replyToReview);

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  /* Was silent: the card re-rendered in a different group and that was the
     only feedback that anything had happened. */
  const setStatus = (review: Review, status: ReviewStatus) => {
    const reply = drafts[review.id];
    if (reply?.trim()) replyToReview(review.id, reply);
    setReviewStatus(review.id, status);
    toast.success(
      status === 'published'
        ? t('published')
        : status === 'rejected'
          ? t('rejected')
          : t('restored'),
    );
  };

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
      <PageHeader title={t('title')} lead={t('lead')} />

      {reviews.length === 0 ? (
        <EmptyState
          title={t('emptyTitle')}
          body={t('emptyBody')}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/kalender">{t('emptyAction')}</Link>
            </Button>
          }
        />
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
                            <CustomerLink
                              id={review.customerId}
                              name={customerName(review.customerId)}
                            />
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

                      {/*
                        Neither of these groups had a single control. A review
                        rejected by mistake could not be restored, and a
                        published one could not be taken down or its reply
                        corrected — on the one screen whose whole job is
                        deciding what the public sees.
                      */}
                      {review.status === 'rejected' && (
                        <div className="mt-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setStatus(review, 'pending')}
                          >
                            <RotateCcw className="size-4" aria-hidden />
                            {t('restore')}
                          </Button>
                        </div>
                      )}

                      {review.status === 'published' && (
                        <div className="mt-4">
                          <Button
                            variant="quiet"
                            size="sm"
                            onClick={() => {
                              setReviewStatus(review.id, 'pending');
                              toast.success(t('unpublished'));
                            }}
                          >
                            {t('unpublish')}
                          </Button>
                        </div>
                      )}

                      {review.status === 'pending' && !review.publishConsent && (
                        <Alert
                          tone="danger"
                          className="mt-4"
                          title={t('noConsentTitle')}
                        >
                          {t('noConsentBody')}
                        </Alert>
                      )}

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
                              /* Two gates, and they are different in kind: a
                                 critical review needs a reply first (owner's
                                 judgement), a review with no recorded consent
                                 cannot be published at all (§20.6). */
                              disabled={
                                !review.publishConsent ||
                                (critical &&
                                  !(drafts[review.id] ?? review.ownerReply)?.trim())
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
