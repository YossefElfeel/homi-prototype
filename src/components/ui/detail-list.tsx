import { cn } from '@/lib/cn';

/**
 * A labelled fact and its value, on one baseline.
 *
 * Eleven screens had written their own `Row` — same flex, same hairline, and
 * not the same padding: `py-1.5` on one record, `py-2` on the next, `py-2.5`
 * on a third. Read one after the other they look like three different kinds of
 * data rather than the same kind on three subjects.
 *
 * The rule sits on the row, not on the list, so a single `<DetailRow>` inside
 * a card still reads as a row and a two-column list keeps a rule under every
 * item in both columns — a `divide-y` on the grid would only draw between grid
 * *rows* and leave the left column's last item bare.
 *
 * The final rule comes off whenever the list is actually one column wide. A
 * lone hairline hanging under the last fact, with card padding below it, reads
 * as a table that was cut off; two columns ending on the same rule read as a
 * table that finished. So `columns={2}` keeps its rules only where it really
 * has two columns — the grid fills left-to-right, so above `sm` `:last-child`
 * is the right-hand column alone, and below it the grid has already collapsed
 * and `:last-child` is the genuine last row.
 */
export function DetailList({
  columns = 1,
  className,
  ...props
}: React.HTMLAttributes<HTMLDListElement> & { columns?: 1 | 2 }) {
  return (
    <dl
      className={cn(
        'text-sm',
        columns === 2
          ? 'grid gap-x-10 max-sm:[&>*:last-child]:border-b-0 sm:grid-cols-2'
          : 'grid [&>*:last-child]:border-b-0',
        className,
      )}
      {...props}
    />
  );
}

export function DetailRow({
  label,
  className,
  children,
}: {
  label: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 border-b border-line-subtle py-2',
        className,
      )}
    >
      <dt className="shrink-0 text-ink-tertiary">{label}</dt>
      {/* The value is what the eye scans down, so it holds the right edge and
          breaks inside itself rather than pushing the label off the row. */}
      <dd className="min-w-0 text-right [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
