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
      <div className="flex flex-wrap items-center gap-2">
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

      {count != null && (
        <p
          data-numeric
          /* aria-live, because the count is the only confirmation that
             typing in the search box changed anything. */
          aria-live="polite"
          className="mt-2 px-1 text-sm text-ink-tertiary"
        >
          {count}
        </p>
      )}
    </div>
  );
}
