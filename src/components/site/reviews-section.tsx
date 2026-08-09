'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Section, SectionHeading } from '@/components/signature/section-heading';
import { useHydrated, useStore } from '@/mock/store';
import type { Theme } from '@/lib/theme';

/**
 * Renders nothing until there are published reviews.
 *
 * That is the point. At launch there are none, and a carousel announcing "no
 * reviews yet" costs more trust than it could ever earn — the written promise
 * block above carries the load instead. Load the `busy` scenario to see this
 * section appear on its own.
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
      <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
