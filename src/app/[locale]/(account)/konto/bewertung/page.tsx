'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Star } from 'lucide-react';

import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea, Checkbox } from '@/components/ui/field';
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
 */
export default function AccountReviewPage() {
  const t = useTranslations('account.review');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const now = useNow();

  const { bookings, reviews, customerId } = useAccount();
  const services = useStore((s) => s.services);
  const patchData = useStore((s) => s.patchData);
  const allReviews = useStore((s) => s.data.reviews);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [publish, setPublish] = useState(false);
  const [sent, setSent] = useState(false);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

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
      <div className="max-w-2xl">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-status-success text-status-success-fg">
          <Check className="size-5" aria-hidden />
        </span>
        <h1 className="display-type mt-6 text-3xl">{t('thanksTitle')}</h1>
        <p className="mt-3 max-w-[var(--measure)] text-ink-secondary">{t('thanksBody')}</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <>
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <EmptyState
          className="mt-8"
          icon={Star}
          title={t('emptyTitle')}
          body={t('emptyBody')}
        />
      </>
    );
  }

  function send() {
    if (!booking) return;
    patchData({
      reviews: [
        ...allReviews,
        {
          id: `rev_${allReviews.length + 1}`,
          bookingId: booking.id,
          customerId,
          rating,
          text,
          status: 'pending' as const,
          submittedAt: now.toISOString(),
        },
      ],
    });
    setSent(true);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 text-ink-secondary">
        {t('lead', {
          date: format.dateTime(new Date(booking.start), 'full'),
          service:
            services.find((s) => s.slug === booking.serviceSlug)?.name[locale] ?? '—',
        })}
      </p>

      <fieldset className="mt-10">
        <legend className="text-sm font-medium">{t('ratingLabel')}</legend>
        <div className="mt-3 flex gap-1">
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

      <Field label={t('textLabel')} hint={t('textHint')} className="mt-8">
        {(props) => (
          <Textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            {...props}
          />
        )}
      </Field>

      <Checkbox
        className="mt-8"
        label={
          <>
            {t('publishLabel')}
            <span className="mt-1 block text-xs text-ink-tertiary">{t('publishHint')}</span>
          </>
        }
        checked={publish}
        onChange={(e) => setPublish(e.target.checked)}
      />

      <Button className="mt-8" disabled={rating === 0 || !text.trim()} onClick={send}>
        {t('submit')}
      </Button>
    </div>
  );
}
