'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { RotateCcw, Star } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  ConfirmDialog,
  useConfirmTarget,
  useDismissLabel,
} from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { CustomerLink } from '@/components/ui/record-link';
import { ActionIcon } from '@/lib/action-icons';
import { statesOf } from '@/lib/status-registry';
import { useHydrated, useStore } from '@/mock/store';
import type { Review, ReviewStatus } from '@/mock/schema';
import { cn } from '@/lib/cn';

/** §17.2 — three stars or fewer is the review the owner has to answer first. */
const CRITICAL_AT = 3;

type StateFilter = 'all' | ReviewStatus;

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
 *
 * The screen decides one thing — what the public can see — and until this wave
 * it could only say two of the four answers to it. Taking a published review
 * down sent it back to «Wartet auf Freigabe», which is the queue of reviews
 * nobody has read yet, so a decision the owner had already made was filed as
 * one they had not; and nothing on the screen could remove a review at all,
 * which is the one thing §20.6 obliges the office to do when the person who
 * wrote it withdraws their consent. `hidden` is the first of those, and it
 * keeps the reply so putting it back is one button. Deleting is the second,
 * and it is real — the Protokoll keeps the trace, not the text.
 *
 * The list itself was four `<section>`s, one per status, each headed with the
 * name of the state its cards were in. That reads well at five reviews and
 * stops working at fifty: there was nothing to search, nothing to filter by,
 * and the answer to "what did the Roth household write" was to scroll. It is
 * one list now, ordered queue-first, with the state on the card instead of
 * over it — which is what makes filtering possible at all, since a filtered
 * list has no groups left to head.
 */
export default function AdminReviewsPage() {
  const t = useTranslations('admin.reviews');
  const appT = useTranslations('app');
  const statusT = useTranslations('status.review');
  const format = useFormatter();
  const hydrated = useHydrated();
  const dismissLabel = useDismissLabel();

  const reviews = useStore((s) => s.data.reviews);
  const customers = useStore((s) => s.data.customers);
  const setReviewStatus = useStore((s) => s.setReviewStatus);
  const replyToReview = useStore((s) => s.replyToReview);
  const deleteReview = useStore((s) => s.deleteReview);

  const [query, setQuery] = useState('');
  const [state, setState] = useState<StateFilter>('all');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const deleting = useConfirmTarget<Review>();

  const order = statesOf('review');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews
      .filter((r) => (state === 'all' ? true : r.status === state))
      .filter((r) => {
        if (!q) return true;
        const customer = customers.find((c) => c.id === r.customerId);
        /*
         * The full name, not the initial the card prints.
         *
         * A moderation queue is searched after a phone call — «die Frau
         * Bachmann hat angerufen wegen ihrer Bewertung» — and «Simone B.» is
         * what the *public* is allowed to see, not what the office knows. The
         * reply is in here too, because the other half of that call is "what
         * did we already write back".
         */
        return [r.text, r.ownerReply, customer?.firstName, customer?.lastName]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        /* Queue first, not newest first. The pending group was at the top of
           the screen when this was four sections, and that ordering was the
           one thing about the sections worth keeping: the reviews waiting on
           a decision are the reason the owner opened the screen. */
        const byState = order.indexOf(a.status) - order.indexOf(b.status);
        return byState !== 0 ? byState : (a.submittedAt < b.submittedAt ? 1 : -1);
      });
  }, [reviews, customers, state, query, order]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = state !== 'all' || query.trim() !== '';

  const customerName = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName.charAt(0)}.` : '—';
  };

  /* Was silent: the card re-rendered in a different group and that was the
     only feedback that anything had happened. */
  const setStatus = (review: Review, status: ReviewStatus) => {
    const reply = drafts[review.id];
    if (reply?.trim()) replyToReview(review.id, reply);
    setReviewStatus(review.id, status);
    toast.success(
      status === 'published'
        ? t('published')
        : status === 'hidden'
          ? t('hiddenDone')
          : status === 'rejected'
            ? t('rejected')
            : t('restored'),
    );
  };

  function confirmDelete() {
    const review = deleting.target;
    if (!review) return;
    deleting.dismiss();
    deleteReview(review.id);
    toast.success(t('deleteDone', { name: customerName(review.customerId) }));
  }

  function resetFilters() {
    setQuery('');
    setState('all');
  }

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} />

      {reviews.length === 0 ? (
        <EmptyState
          title={t('emptyTitle')}
          body={t('emptyBody')}
          headingLevel={2}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/kalender">{t('emptyAction')}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Toolbar
            search={{
              value: query,
              onChange: setQuery,
              label: t('search'),
              placeholder: t('searchPlaceholder'),
              clearLabel: appT('clearSearch'),
            }}
            count={
              filtering
                ? appT('results', { shown: visible.length, total: reviews.length })
                : appT('resultsAll', { total: reviews.length })
            }
            filters={
              <label>
                <span className="sr-only">{t('filterState')}</span>
                <Select
                  dense
                  value={state}
                  onChange={(e) => setState(e.target.value as StateFilter)}
                >
                  <option value="all">
                    {t('filterState')}: {t('filterAll')}
                  </option>
                  {order.map((s) => (
                    <option key={s} value={s}>
                      {t('filterState')}: {statusT(s)}
                    </option>
                  ))}
                </Select>
              </label>
            }
          />

          {visible.length === 0 ? (
            /* A filter that empties the list is not the same news as having no
               reviews, and the action that helps is clearing the filter — not
               waiting for a customer to write one. */
            <EmptyState
              icon={Star}
              title={t('filterEmptyTitle')}
              body={t('filterEmptyBody')}
              headingLevel={2}
              compact
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  {t('filterReset')}
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {visible.map((review) => {
                const critical = review.rating <= CRITICAL_AT;
                /* The two states from which the next step is publishing. Both
                   need the reply box for the same reason: a critical review
                   cannot go up without an answer, and a hidden one that
                   arrived there without a reply would otherwise show a
                   permanently disabled button and no way to enable it. */
                const beforePublic =
                  review.status === 'pending' || review.status === 'hidden';
                const reply = drafts[review.id] ?? review.ownerReply ?? '';
                /*
                 * Closed unless there is a reason to open it.
                 *
                 * The editor is the tallest thing on a card by some way — a
                 * label, a hint and three rows — and it was on every pending
                 * card whether or not anybody meant to answer, so four reviews
                 * filled a screen and a half. It opens on the click, and it
                 * opens by itself for the one case where the card cannot be
                 * cleared without it: a critical review with no answer yet,
                 * whose publish button is disabled until there is one.
                 */
                const replyOpen =
                  openReplies[review.id] ??
                  (beforePublic && critical && !review.ownerReply);

                return (
                  <li key={review.id} className="surface-card p-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      {/* On the card rather than over the list. The heading it
                          replaces only said what state the cards under it were
                          in — which a filtered list, having no groups, could
                          no longer say anywhere. */}
                      <StatusBadge entity="review" state={review.status} size="sm" />
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
                      <span
                        data-numeric
                        className="ms-auto text-sm text-ink-tertiary"
                      >
                        {format.dateTime(new Date(review.submittedAt), {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="mt-2.5 max-w-[var(--measure)] text-sm text-ink-secondary">
                      {review.text}
                    </p>

                    {/* The reply the office already wrote, wherever the review
                        has come to rest. It used to be shown only under a
                        published one, so taking a review down hid the answer
                        as well — including from the person deciding whether to
                        put it back. */}
                    {!replyOpen && review.ownerReply ? (
                      <div className="mt-3 border-l-2 border-rule ps-3">
                        <p className="label-type text-ink-tertiary">{t('replyLabel')}</p>
                        <p className="mt-1 text-sm text-ink-secondary">
                          {review.ownerReply}
                        </p>
                      </div>
                    ) : null}

                    {/* Was a hand-written copy of `Alert` — the component that
                        exists so a warning is the same amber everywhere. Also
                        on a hidden card now: a critical review can reach that
                        state without a reply, and there its publish button is
                        disabled with no visible reason unless this says what
                        the missing thing is. */}
                    {critical && beforePublic && (
                      <Alert tone="warning" className="mt-3" title={t('negativeTitle')}>
                        {t('negativeBody')}
                      </Alert>
                    )}

                    {beforePublic && !review.publishConsent && (
                      <Alert tone="danger" className="mt-3" title={t('noConsentTitle')}>
                        {t('noConsentBody')}
                      </Alert>
                    )}

                    {beforePublic && replyOpen && (
                      <Field label={t('replyLabel')} hint={t('replyHint')} className="mt-4">
                        {(props) => (
                          <Textarea
                            rows={2}
                            value={reply}
                            onChange={(e) =>
                              setDrafts({ ...drafts, [review.id]: e.target.value })
                            }
                            {...props}
                          />
                        )}
                      </Field>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {beforePublic && (
                        <Button
                          size="sm"
                          onClick={() => setStatus(review, 'published')}
                          /* Two gates, and they are different in kind: a
                             critical review needs a reply first (owner's
                             judgement), a review with no recorded consent
                             cannot be published at all (§20.6). */
                          disabled={!review.publishConsent || (critical && !reply.trim())}
                        >
                          {review.status === 'hidden' ? t('republish') : t('publish')}
                        </Button>
                      )}

                      {beforePublic && !replyOpen && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setOpenReplies({ ...openReplies, [review.id]: true })
                          }
                        >
                          {review.ownerReply ? t('editReply') : t('replyAction')}
                        </Button>
                      )}

                      {/* Off the website, and still a released review. This was
                          «Zurückziehen» and it sent the card back to «Wartet
                          auf Freigabe» — the heading for reviews nobody has
                          read yet — so a decision the owner had already made
                          was filed as one they had not, and the reply went
                          back into an editor with it. */}
                      {review.status === 'published' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setStatus(review, 'hidden')}
                        >
                          <ActionIcon.hide className="size-4" aria-hidden />
                          {t('hide')}
                        </Button>
                      )}

                      {beforePublic && (
                        <Button
                          variant="quiet"
                          size="sm"
                          onClick={() => setStatus(review, 'rejected')}
                        >
                          {t('reject')}
                        </Button>
                      )}

                      {/* This state had no control at all: a review refused by
                          a mis-click was refused for good. */}
                      {review.status === 'rejected' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setStatus(review, 'pending')}
                        >
                          <RotateCcw className="size-4" aria-hidden />
                          {t('restore')}
                        </Button>
                      )}

                      {/* Last in the row and last in the tab order, on every
                          card. Deleting is the only action here that is not a
                          change of mind — see the dialog for why it is offered
                          at all. */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ms-auto"
                        onClick={() => deleting.ask(review)}
                      >
                        <ActionIcon.delete className="size-4" aria-hidden />
                        {t('delete')}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleting.open}
        onOpenChange={(open) => !open && deleting.dismiss()}
        title={t('deleteConfirmTitle')}
        body={
          deleting.target
            ? t('deleteConfirmBody', {
                name: customerName(deleting.target.customerId),
                stars: deleting.target.rating,
              })
            : undefined
        }
        action={t('delete')}
        dismiss={dismissLabel}
        onConfirm={confirmDelete}
      >
        {/* The alternative, named in the box. Most reasons to reach for delete
            are really reasons to hide — and the difference matters here more
            than on other screens, because this record is somebody else's words
            and there is no undo. */}
        <p className="text-sm text-ink-secondary">{t('deleteInstead')}</p>
      </ConfirmDialog>
    </div>
  );
}
