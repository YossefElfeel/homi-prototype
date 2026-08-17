import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

/**
 * The number row at the top of a dashboard.
 *
 * What it replaces: a `grid gap-px bg-line-subtle` whose 1px gaps faked
 * hairline dividers, duplicated in 13 files, rendering a label and a bare
 * number. A number with no icon, no context sentence and no way to reach the
 * thing it counts is a decoration — you read "2", think "two what, and now
 * what", and go find the list yourself.
 *
 * So a tile carries four things: what it counts, the number, one line of
 * context, and a link to the screen that acts on it.
 *
 * The dl/dt/dd pair lives *inside* each tile rather than wrapping the grid,
 * because a whole-tile link cannot legally sit between dl and dt.
 */
export function StatGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('gap-app grid grid-cols-2 lg:grid-cols-4', className)}>
      {children}
    </div>
  );
}

const TONE_VALUE = {
  default: 'text-ink',
  danger: 'text-status-danger-fg',
  warning: 'text-status-warning-fg',
  success: 'text-status-success-fg',
} as const;

const TONE_ICON = {
  default: 'bg-accent-quiet text-ink-accent',
  danger: 'bg-status-danger text-status-danger-fg',
  warning: 'bg-status-warning text-status-warning-fg',
  success: 'bg-status-success text-status-success-fg',
} as const;

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  href,
  linkLabel,
  tone = 'default',
  className,
}: {
  label: string;
  value: React.ReactNode;
  /** One line saying what the number means. "Oldest waiting 19 hours." */
  hint?: React.ReactNode;
  icon?: LucideIcon;
  /** Where the number is acted on. Omit only when there is genuinely nowhere. */
  href?: string;
  linkLabel?: string;
  tone?: keyof typeof TONE_VALUE;
  className?: string;
}) {
  const body = (
    <>
      <dl>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-sm font-medium text-ink-secondary">{label}</dt>
          {Icon && (
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]',
                TONE_ICON[tone],
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
          )}
        </div>
        <dd
          data-numeric
          className={cn(
            'display-type mt-3 text-3xl leading-none font-semibold',
            TONE_VALUE[tone],
          )}
        >
          {value}
        </dd>
      </dl>
      {hint && <p className="mt-2 text-sm text-ink-tertiary">{hint}</p>}
      {href && linkLabel && (
        <p className="mt-3 flex items-center gap-1 text-sm font-medium text-ink-accent">
          {linkLabel}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </p>
      )}
    </>
  );

  const shell = cn('surface-card p-card', className);

  if (!href) return <div className={shell}>{body}</div>;

  return (
    <Link
      href={href}
      className={cn(
        shell,
        'block transition-[box-shadow,border-color,transform] duration-[var(--motion-base)] ease-[var(--ease-standard)]',
        'hover:border-line hover:shadow-[var(--shadow-md)]',
        'active:translate-y-px active:shadow-[var(--shadow-sm)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
      )}
    >
      {body}
    </Link>
  );
}
