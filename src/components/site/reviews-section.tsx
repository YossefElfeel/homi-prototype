'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Section, SectionHeading } from '@/components/signature/section-heading';
import { useHydrated, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';
import type { Theme } from '@/lib/theme';

/**
 * Renders nothing until there are published reviews.
 *
 * That is the point. At launch there are none, and a carousel announcing "no
 * reviews yet" costs more trust than it could ever earn — the written promise
 * block above carries the load instead. `fresh` is where that case lives now:
 * the default scenario publishes one review and `busy` three, so the section
 * is on screen by default and the empty case is launch day, which is the only
 * day it is true of a real company.
 *
 * It also reads `status === 'published'` and nothing else, which is what makes
 * «Ausblenden» on screen 78 mean something: a hidden review is off this page
 * within the same render.
 */
export function ReviewsSection({ theme }: { theme: Theme }) {
  const t = useTranslations('site.home.reviews');
  const hydrated = useHydrated();
  const reviews = useStore((s) => s.data.reviews);
  const customers = useStore((s) => s.data.customers);

  const published = hydrated ? reviews.filter((r) => r.status === 'published') : [];
  if (published.length === 0) return null;

  return (
    <Section>
      <SectionHeading theme={theme} eyebrow={t('eyebrow')} title={t('title')} />
      {/* One review is a quote, not a grid. The default scenario publishes a
          single one — a company five months old that has just started asking
          — and a lone card in a three-column grid reads as two cards that
          failed to load rather than as the one review there is. */}
      <ul
        className={cn(
          'mt-10 grid gap-5',
          published.length === 1
            ? 'max-w-xl'
            : 'md:grid-cols-2 lg:grid-cols-3',
        )}
      >
        {published.map((review) => {
          const customer = customers.find((c) => c.id === review.customerId);
          return (
            <li key={review.id} className="surface-card flex flex-col p-6">
              <p
                className="flex gap-0.5"
                aria-label={`${review.rating} / 5`}
                data-numeric
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    aria-hidden
                    className={
                      i < review.rating
                        ? 'size-4 fill-current text-ink-accent'
                        : 'size-4 text-ink-tertiary/30'
                    }
                  />
                ))}
              </p>
              <blockquote className="mt-4 flex-1 text-ink-secondary">
                {review.text}
              </blockquote>
              <p className="mt-5 border-t border-line-subtle pt-4 text-sm text-ink-tertiary">
                {customer ? `${customer.firstName} ${customer.lastName.charAt(0)}.` : '—'}
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
