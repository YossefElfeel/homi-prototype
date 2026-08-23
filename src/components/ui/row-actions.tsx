'use client';

import { MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

/**
 * A row's actions, behind one menu button.
 *
 * They were an inline icon strip, on the argument that a menu costs two clicks
 * and hides how many actions a row has. What that argument left out is what
 * the strip costs every other row: the actions column is as wide as the
 * *busiest* row's strip, and a request with five of them set the width for a
 * table where most rows have two. On a queue that is six columns of data, the
 * strip was taking width from the data it exists to act on — and it grew every
 * time a screen gained an action.
 *
 * A menu also gives the actions their names back. Icon-only in the table meant
 * the label lived in `title`, which is a pointer affordance: on a phone the
 * strip was a row of unnamed buttons, so the card rendering had to carry a
 * second, text-bearing variant of every action. One menu is the same control
 * with the same words on both, and the label is read rather than guessed.
 *
 * Which glyph goes on which action is still a convention rather than a
 * per-screen choice — see `lib/action-icons.ts`. The icon is now a hint beside
 * the name instead of the whole message, but the same picture must still mean
 * the same thing in every list.
 */
export function RowActions({
  children,
  label,
}: {
  children: React.ReactNode;
  /** Overrides the trigger's accessible name. Defaults to «Aktionen». */
  label?: string;
}) {
  const t = useTranslations('app');
  const name = label ?? t('rowActions');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={name}
          aria-label={name}
          className="ms-auto inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-ink-tertiary transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus data-[state=open]:bg-sunken data-[state=open]:text-ink"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ActionProps {
  /** The item's visible text — and so its accessible name. */
  label: string;
  tone?: 'default' | 'danger';
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
  const body = (
    <>
      {children}
      <span>{label}</span>
    </>
  );

  return (
    <DropdownMenuItem asChild tone={tone} className={className}>
      {external ? (
        <a href={href} target="_blank" rel="noreferrer">
          {body}
        </a>
      ) : (
        <Link href={href}>{body}</Link>
      )}
    </DropdownMenuItem>
  );
}

/** For the actions that do something rather than go somewhere. */
export function RowActionButton({
  onClick,
  label,
  tone = 'default',
  disabled = false,
  className,
  children,
}: ActionProps & {
  onClick: () => void;
  /**
   * For an action this particular row cannot take.
   *
   * Dropping the item instead would be worse: the strip would then be a
   * different length per row, and the reader would have to notice an absence
   * to learn that something is impossible. The item stays, and the *label* is
   * where the reason goes — a greyed line with the same word on it explains
   * nothing, and `pointer-events-none` means a `title` tooltip would never
   * fire to explain it either.
   */
  disabled?: boolean;
}) {
  return (
    <DropdownMenuItem
      tone={tone}
      disabled={disabled}
      className={className}
      /*
       * Deferred by a tick rather than run inside `onSelect`.
       *
       * Radix closes the menu after this handler and returns focus to the
       * trigger. Half these actions open a Dialog and the rest raise a
       * `window.confirm` — both take focus, and both were taking it *before*
       * the menu had finished handing it back, so the restore landed last and
       * pulled focus out of the thing that had just opened. Letting the close
       * complete first costs nothing visible and makes the order deterministic.
       */
      onSelect={() => setTimeout(onClick, 0)}
    >
      {children}
      <span>{label}</span>
    </DropdownMenuItem>
  );
}

/**
 * A hairline before the destructive end of the menu.
 *
 * Without it "open the quote" and "decline" are two adjacent lines of the same
 * weight, and the only thing marking the second as irreversible is its colour.
 */
export function RowActionsDivider({ className }: { className?: string }) {
  return <DropdownMenuSeparator className={cn(className)} />;
}
