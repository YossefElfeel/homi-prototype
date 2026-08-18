import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

/**
 * A record named on a screen that is not its own.
 *
 * Every list and detail in the panel prints references and customer names, and
 * almost none of them let you go there. The quote list linked its customer;
 * fourteen other screens showed the same person as plain text, so "what else
 * has this customer had?" meant reading the name, opening the customer list and
 * searching for it — with the answer already on screen, one click away.
 *
 * Two things this fixes that a bare `<Link>` at each call site would not:
 *
 *  · **The click is stopped from reaching the row.** A `DataView` row navigates
 *    on click, so a link inside one is a coin flip between two destinations.
 *    Every call site would have to remember `stopPropagation`; one of them
 *    eventually would not.
 *  · **A missing record renders as an em dash, not a dead link.** A booking
 *    whose customer was deleted has a name to print and nowhere to point.
 */
export function RecordLink({
  href,
  numeric = false,
  className,
  children,
}: {
  /** Omit for a record that no longer resolves — renders plain text instead. */
  href?: string;
  /** Tabular figures, for a reference or an amount rather than a name. */
  numeric?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <span data-numeric={numeric || undefined} className={cn('text-ink-tertiary', className)}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      data-numeric={numeric || undefined}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'rounded-[var(--radius-xs)] text-ink-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** The customer, by name, wherever another record mentions them. */
export function CustomerLink({
  id,
  name,
  className,
}: {
  id?: string;
  name: string;
  className?: string;
}) {
  return (
    <RecordLink href={id ? `/admin/kunden/${id}` : undefined} className={className}>
      {name}
    </RecordLink>
  );
}
