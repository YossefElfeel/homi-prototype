'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Check, Star } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Textarea, Checkbox } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

/**
 * Screen 46 — writing a review.
 *
 * The publish checkbox is opt-in and says exactly what would be shown: first
 * name and one initial. §14 needs consent for publishing, and a customer who
 * discovers their full name on a website they never agreed to is a customer
 * lost — along with the review.
 *
 * The prompt asks what worked and what did not, in that order. A form that
 * only invites praise collects praise and learns nothing.
 *
 * The screen also used to open three different ways depending on which branch
 * you landed in: `PageHeader` on the empty state, a hand-set `h1` on the form,
 * and a bare glyph above a heading on the thank-you. One opening now, and the
 * form sits on a surface like every other form in the account.
 */
export default function AccountReviewPage() {
  const t = useTranslations('account.review');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const now = useNow();

  const { bookings, reviews, customerId } = useAccount();
  const services = useStore((s) => s.services);
  const submitReview = useStore((s) => s.submitReview);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [publish, setPublish] = useState(false);
  const [sent, setSent] = useState(false);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const reviewed = new Set(reviews.map((r) => r.bookingId));
  const booking = bookings
    .filter(
      (b) =>
        new Date(b.start) < now &&
        (b.status === 'completed' || b.status === 'invoiced' || b.status === 'closed') &&
        !reviewed.has(b.id),
    )
    .sort((a, b) => (a.start < b.start ? 1 : -1))[0];

  if (sent) {
    return (
      <>
        <PageHeader title={t('thanksTitle')} />
        <Card>
          <CardBody className="mt-0">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-status-success text-status-success-fg">
              <Check className="size-5" aria-hidden />
            </span>
            <p className="mt-4 max-w-[var(--measure)] text-ink-secondary">
              {t('thanksBody')}
            </p>
          </CardBody>
          {/* This screen had a checkmark, a title, a body — and no link and no
              button. The only escape was the shell nav, which does not exist on
              a phone until you open the menu. */}
          <CardFooter>
            <Button asChild>
              <Link href="/konto">{t('thanksToOverview')}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/konto/fotos">{t('thanksToPhotos')}</Link>
            </Button>
          </CardFooter>
        </Card>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <PageHeader title={t('title')} />
        <EmptyState
          icon={Star}
          title={t('emptyTitle')}
          body={t('emptyBody')}
          /* Was an empty state with no action, on a screen whose registry
             entry lists `nothing to review` as a required state. */
          action={
            <Button asChild variant="secondary">
              <Link href="/konto/anfragen">{t('emptyAction')}</Link>
            </Button>
          }
        />
      </>
    );
  }

  function send() {
    if (!booking) return;
    /*
     * `publish` was bound to the checkbox and then never read again — the
     * review went to moderation with no record of whether the customer had
     * agreed to it being published. It travels with the review now, and the
     * moderation screen refuses to publish without it.
     */
    submitReview(
      { bookingId: booking.id, customerId, rating, text, publishConsent: publish },
      now,
    );
    toast.success(t('thanksTitle'));
    setSent(true);
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead', {
          date: format.dateTime(new Date(booking.start), 'full'),
          service:
            services.find((s) => s.slug === booking.serviceSlug)?.name[locale] ?? '—',
        })}
      />

      <div className="space-y-app-section">
        <Card>
          <CardHeader title={t('ratingLabel')} />
          <CardBody>
            <fieldset>
              {/* The card's heading is the question, so the legend only has to
                  reach a screen reader — printing it again would put the same
                  sentence on the card twice. */}
              <legend className="sr-only">{t('ratingLabel')}</legend>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={t('star', { n })}
                    aria-pressed={rating === n}
                    onClick={() => setRating(n)}
                    className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-sunken"
                  >
                    <Star
                      className={cn(
                        'size-6',
                        n <= rating ? 'fill-accent text-accent' : 'text-ink-tertiary',
                      )}
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
            </fieldset>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('textLabel')} description={t('textHint')} />
          <CardBody>
            <Textarea
              rows={5}
              aria-label={t('textLabel')}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Checkbox
              className="mt-6"
              label={
                <>
                  {t('publishLabel')}
                  <span className="mt-1 block text-xs text-ink-tertiary">
                    {t('publishHint')}
                  </span>
                </>
              }
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
            />
          </CardBody>
          <CardFooter>
            <Button disabled={rating === 0 || !text.trim()} onClick={send}>
              {t('submit')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
