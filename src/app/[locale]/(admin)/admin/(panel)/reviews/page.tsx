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

import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { CustomerLink } from '@/components/ui/record-link';
import { ActionIcon } from '@/lib/action-icons';
import { statesOf } from '@/lib/status-registry';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Review, ReviewStatus } from '@/mock/schema';
import { cn } from '@/lib/cn';

/** §17.2 — three stars or fewer is the review the owner has to answer first. */
const CRITICAL_AT = 3;


/**
 * The three answers to "what is on the website?", which is the question this
 * screen exists for.
 *
 * The status filter underneath still exists and still does something
 * different: it separates «Wartet auf Freigabe» from «Zurückgezogen» *within*
 * the unpublished tab. The tab is the coarse question the owner arrives with;
 * the filter is the fine one they reach for once they are inside it.
 */
/**
 * One tab per state, plus the bin.
 *
 * The first cut had three — published, «not published», deleted — with a
 * status filter beside the search to split the middle one. That was two
 * controls doing one job, and the coarse one hid `hidden`: a review the owner
 * had taken down sat in the same tab as one nobody had read yet, and telling
 * them apart meant reaching for the second control.
 *
 * Derived from `statesOf('review')` rather than listed here, so the tab strip
 * cannot fall out of step with the status registry — a fifth review state
 * would get a tab without anybody remembering this line.
 */
type Tab = ReviewStatus | 'deleted';

const TABS: Tab[] = [...statesOf('review'), 'deleted'] as Tab[];

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
  const deleteReview = useStore((s) => s.deleteReview);
  const restoreReview = useStore((s) => s.restoreReview);
  const eraseReview = useStore((s) => s.eraseReview);
  const now = useNow();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>(
    /* The queue, because the reviews waiting on a decision are the reason
       somebody opens this screen. */
    'pending',
  );
  const deleting = useConfirmTarget<Review>();
  const erasing = useConfirmTarget<Review>();

  const order = statesOf('review');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reviews
      .filter((r) => {
        if (tab === 'deleted') return Boolean(r.deletedAt);
        if (r.deletedAt) return false;
        return r.status === tab;
      })
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
        return [r.text, customer?.firstName, customer?.lastName]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        /* Every tab but the bin now holds one state, so ordering by state has
           nothing left to do there — it still does in «Gelöscht», which is the
           one tab that mixes them. Within a state, newest first. */
        const byState = order.indexOf(a.status) - order.indexOf(b.status);
        return byState !== 0 ? byState : a.submittedAt < b.submittedAt ? 1 : -1;
      });
  }, [reviews, customers, tab, query, order]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = query.trim() !== '';

  const customerName = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName.charAt(0)}.` : '—';
  };

  /* Was silent: the card re-rendered in a different group and that was the
     only feedback that anything had happened. */
  const setStatus = (review: Review, status: ReviewStatus) => {
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
    deleteReview(review.id, now);
    toast.success(t('deleteDone', { name: customerName(review.customerId) }));
  }

  function resetFilters() {
    setQuery('');
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
              <Link href="/admin/calendar">{t('emptyAction')}</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/*
            Tabs, not a fourth value in the status filter.
            «Ist das auf der Website?» is the question the owner opens this
            screen with, and it has three answers. The status filter answers a
            narrower one — whether an unpublished review is waiting for a
            decision or was taken down after one — and folding both into one
            control made the coarse question unanswerable: «alle» mixed live
            reviews with withdrawn ones and, once there was a bin, with deleted
            ones too.
          */}
          {/*
            Underlined, not tinted pills.
            The first cut used the settings screen's pill style and sat it
            directly on top of the search bar, so three tinted buttons above a
            row of filter controls read as more filters — which is exactly what
            they are not. A bottom rule with the active tab sitting on it is the
            oldest tab affordance there is, and it is the one that says «these
            switch the list» rather than «these narrow it».
          */}
          <div
            role="tablist"
            aria-label={t('title')}
            className="flex flex-wrap gap-1 border-b border-line"
          >
            {TABS.map((id) => {
              const count = reviews.filter((r) =>
                id === 'deleted' ? Boolean(r.deletedAt) : !r.deletedAt && r.status === id,
              ).length;

              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`reviews-tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls="reviews-panel"
                  tabIndex={tab === id ? 0 : -1}
                  onKeyDown={(e) => {
                    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                    if (delta === 0) return;
                    e.preventDefault();
                    const next = TABS[(TABS.indexOf(id) + delta + TABS.length) % TABS.length]!;
                    setTab(next);
                    document.getElementById(`reviews-tab-${next}`)?.focus();
                  }}
                  onClick={() => setTab(id)}
                  className={cn(
                    '-mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 py-2 text-sm transition-colors',
                    tab === id
                      ? 'border-accent font-medium text-ink'
                      : 'border-transparent text-ink-secondary hover:border-line-strong hover:text-ink',
                  )}
                >
                  {id === 'deleted' ? t('tabDeleted') : statusT(id)}
                  {/* The count in a chip, so the tab reads «Gelöscht · 1»
                      rather than as two words that might both be labels. */}
                  <span
                    data-numeric
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-xs',
                      tab === id ? 'bg-accent-subtle text-ink' : 'bg-sunken text-ink-tertiary',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <Toolbar
            className="mt-6"
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
                /* The two states from which the next step is publishing. A
                   hidden review is one somebody has already read and taken
                   down, so it goes back up rather than back into the queue. */
                const beforePublic =
                  review.status === 'pending' || review.status === 'hidden';

                return (
                  <li key={review.id} className="surface-card p-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      {/* Only in the bin. Everywhere else the tab above the
                          list already says the state, and repeating it on
                          every card is a word the reader has to skip on every
                          row. «Gelöscht» is the one tab that mixes states, and
                          there the badge is the only thing that says whether a
                          binned review had been published. */}
                      {tab === 'deleted' && (
                        <StatusBadge entity="review" state={review.status} size="sm" />
                      )}
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

                    {/* Was a hand-written copy of `Alert` — the component that
                        exists so a warning is the same amber everywhere. It no
                        longer explains a disabled button; it flags the review
                        the owner has to deal with first, which is what §17.2
                        asked for in the first place. */}
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


                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {beforePublic && (
                        <Button
                          size="sm"
                          onClick={() => setStatus(review, 'published')}
                          /* One gate now, and it is the one that is not a
                             matter of judgement: §20.6 refuses a review with
                             no recorded consent. The second gate used to be
                             «a critical review needs an answer first», and it
                             went with the reply box — see /open-questions
                             §17.2d for what that costs. */
                          disabled={!review.publishConsent}
                        >
                          {review.status === 'hidden' ? t('republish') : t('publish')}
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

                      {/*
                        A binned review carries these two and nothing else.
                        Offering «Veröffentlichen» on a card in the bin would
                        be two decisions in one click — take it out, and put it
                        on the website — and the second is the one that needs
                        somebody to have read it again.
                      */}
                      {review.deletedAt && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              restoreReview(review.id);
                              toast.success(
                                t('restoreDone', { name: customerName(review.customerId) }),
                              );
                            }}
                          >
                            <RotateCcw className="size-4" aria-hidden />
                            {t('restoreFromBin')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ms-auto"
                            onClick={() => erasing.ask(review)}
                          >
                            <ActionIcon.delete className="size-4" aria-hidden />
                            {t('erase')}
                          </Button>
                        </>
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
                      {!review.deletedAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ms-auto"
                          onClick={() => deleting.ask(review)}
                        >
                          <ActionIcon.delete className="size-4" aria-hidden />
                          {t('delete')}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/*
        The one action on this screen with no undo, and the only one that
        should have none: §20.6 obliges the office to remove a review when the
        person who wrote it withdraws consent, and a bin it can be pulled back
        out of does not answer that.
      */}
      <ConfirmDialog
        open={erasing.open}
        onOpenChange={(open) => !open && erasing.dismiss()}
        title={t('eraseConfirmTitle')}
        body={t('eraseConfirmBody')}
        action={t('erase')}
        dismiss={dismissLabel}
        tone="danger"
        onConfirm={() => {
          const review = erasing.target;
          if (!review) return;
          erasing.dismiss();
          eraseReview(review.id);
          toast.success(t('eraseDone'));
        }}
      />

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
