'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';
import { Button } from './button';

/**
 * Kept deliberately plain: previous, next, and where you are.
 *
 * No numbered page buttons. The admin lists here are filtered and sorted
 * before they are paged — nobody navigates to "page 4" of requests, they
 * narrow the filter. Numbered pages would be six more controls in service of
 * a journey no one takes.
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  label,
  previousLabel,
  nextLabel,
  summary,
  className,
}: {
  /** 1-based. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label: string;
  previousLabel: string;
  nextLabel: string;
  /** "41–60 of 128", rendered by the caller so it translates properly. */
  summary?: React.ReactNode;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label={label}
      className={cn('mt-app flex flex-wrap items-center justify-between gap-3', className)}
    >
      {summary ? (
        <p data-numeric className="text-sm text-ink-tertiary">
          {summary}
        </p>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" aria-hidden />
          {previousLabel}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
        >
          {nextLabel}
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}

/** Slices a list for the current page. Keeps the arithmetic in one place. */
export function paginate<T>(items: T[], page: number, perPage: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  /* A filter can shrink the list under the current page — clamp rather than
     rendering an empty table with a Next button that does nothing. */
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const from = (safePage - 1) * perPage;
  return {
    page: safePage,
    pageCount,
    slice: items.slice(from, from + perPage),
    from: items.length === 0 ? 0 : from + 1,
    to: Math.min(from + perPage, items.length),
    total: items.length,
  };
}
