'use client';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

/**
 * A row's actions, on the row.
 *
 * Every admin list hid them behind a `MoreHorizontal` menu, which costs two
 * clicks and — worse — a guess: nothing on the row said whether the menu held
 * one item or five, so the only way to find out whether a quote had become a
 * booking was to open it. Icons put the answer in the row.
 *
 * Icon-only in the table, icon **and label** on the card below `lg`. That is
 * not a nicety: `title` is a pointer affordance and there is no pointer on a
 * phone, so an icon-only strip there is a row of unnamed buttons. The desk has
 * the tooltip and cannot spare the width; the card has the width and cannot
 * have the tooltip.
 */
export function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex flex-wrap items-center justify-end gap-0.5">{children}</span>
  );
}

const BASE =
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus lg:w-8 lg:px-0 [&_svg]:size-4 [&_svg]:shrink-0';

const TONES = {
  default: 'text-ink-tertiary hover:bg-sunken hover:text-ink',
  /*
   * Declining and discarding sit in the same strip as "open this" now, so the
   * only thing keeping a mis-aimed click from being an irreversible one is that
   * they do not look like their neighbours. Red on hover rather than red at
   * rest: a row of danger-coloured icons on every line reads as an alarm and
   * stops being read at all.
   */
  danger: 'text-ink-tertiary hover:bg-status-danger hover:text-status-danger-fg',
} as const;

interface ActionProps {
  /** Both the tooltip and the accessible name — an icon has no text of its own. */
  label: string;
  tone?: keyof typeof TONES;
  className?: string;
  children: React.ReactNode;
}

export function RowAction({
  href,
  label,
  tone = 'default',
  external = false,
  className,
  children,
}: ActionProps & {
  href: string;
  /**
   * Leaves the panel for the customer-facing flow, so it opens in a new tab
   * and has to be a plain anchor rather than the locale-aware `Link`.
   */
  external?: boolean;
}) {
  const props = {
    title: label,
    'aria-label': label,
    className: cn(BASE, TONES[tone], className),
    children: (
      <>
        {children}
        <Label>{label}</Label>
      </>
    ),
  };

  return external ? (
    <a href={href} target="_blank" rel="noreferrer" {...props} />
  ) : (
    <Link href={href} {...props} />
  );
}

/** For the actions that do something rather than go somewhere. */
export function RowActionButton({
  onClick,
  label,
  tone = 'default',
  className,
  children,
}: ActionProps & { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(BASE, TONES[tone], className)}
    >
      {children}
      <Label>{label}</Label>
    </button>
  );
}

/* `aria-hidden`, because the button already carries the same text as its
   accessible name — without this a screen reader on a phone reads it twice. */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden className="lg:hidden">
      {children}
    </span>
  );
}

/**
 * A hairline before the destructive end of the strip.
 *
 * The menu had `DropdownMenuSeparator` doing exactly this job. Dropping the
 * menu without carrying the separator across would leave "open the quote" and
 * "decline" as two adjacent identical grey squares.
 */
export function RowActionsDivider() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line-subtle" />;
}
