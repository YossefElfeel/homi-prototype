'use client';

import { Search, X } from 'lucide-react';

import { cn } from '@/lib/cn';
import { Input } from './field';

/**
 * The row above a list: search, filters, and how many rows survived them.
 *
 * Every admin list screen built this by hand — a bare `flex flex-wrap gap-3`
 * sitting directly on the page background, with the search icon absolutely
 * positioned over an `<Input className="pl-10" />`. None of them showed a
 * result count, so "did the filter do anything" was answered by counting rows.
 */
export function Toolbar({
  search,
  filters,
  views,
  count,
  actions,
  className,
}: {
  search?: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder?: string;
    clearLabel?: string;
  };
  filters?: React.ReactNode;
  /**
   * Which list you are looking at, as opposed to which rows survive a filter —
   * a tab strip, normally. It shares the line under the search row with the
   * count, because the two answer the same question from opposite ends: the
   * tab says how many are in this view, the count says how many the filters
   * left. Its own slot rather than part of `count`, which is a `<p>` and
   * cannot legally hold a `role="tablist"` div.
   */
  views?: React.ReactNode;
  /** "12 of 40" — rendered by the caller so it can be translated properly. */
  count?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-app rounded-[var(--radius-lg)] border border-line-subtle bg-card p-3 shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      {/*
        Every filter on every screen is a bare <label> carrying a `min-w-*`,
        and `min-width` does nothing on an inline box — so those widths were
        silently dropped and each select sat at whatever its longest option
        happened to measure. Six screens asked; none of them got it. Setting it
        on the children here fixes all six at once instead of asking each to
        remember a rule it cannot enforce.

        The search box is what absorbs the slack. It used to be capped at
        `lg:max-w-sm`, which was right when this row carried eight controls and
        wrong everywhere else: on a panel carrying search and nothing else, the
        cap left a 24rem box sitting in a card twice that wide with nothing
        beside it. The filters keep their natural width, so a wide panel grows
        the one control that has any use for the room — and a narrow one, like
        the thread list on /admin/nachrichten, wraps its filters underneath
        rather than crushing the search.
      */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 [&>label]:inline-flex [&>label]:min-w-44 [&>label]:flex-col">
        {search && (
          <div className="relative min-w-56 flex-1">
            <Input
              type="search"
              dense
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              aria-label={search.label}
              placeholder={search.placeholder ?? search.label}
              leading={<Search aria-hidden />}
              trailing={
                search.value ? (
                  <button
                    type="button"
                    onClick={() => search.onChange('')}
                    aria-label={search.clearLabel ?? search.label}
                    className="pointer-events-auto inline-flex size-6 items-center justify-center rounded-full transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
        {filters}
        {actions && <div className="ms-auto flex items-center gap-2">{actions}</div>}
      </div>

      {(views != null || count != null) && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1">
          {views}
          {count != null && (
            <p
              data-numeric
              /* aria-live, because the count is the only confirmation that
                 typing in the search box changed anything. */
              aria-live="polite"
              className="text-sm text-ink-tertiary"
            >
              {count}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
