import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * A small qualifier attached to something else — the postcode on an
 * out-of-area request, a translation gap count, a language tag.
 *
 * Deliberately *not* StatusBadge. A badge reports the state of a record and
 * its colour comes from the status registry; a chip annotates. Keeping them
 * apart is what stops the registry's colours leaking onto things that have no
 * state. Both were being hand-typed with the same class string anyway, in two
 * files that had already drifted.
 *
 * Always static markup. An interactive chip is a button — see the compact
 * label rules in the UX guidelines.
 */
const TONE = {
  neutral: 'border-status-neutral-line bg-status-neutral text-status-neutral-fg',
  info: 'border-status-info-line bg-status-info text-status-info-fg',
  warning: 'border-status-warning-line bg-status-warning text-status-warning-fg',
  danger: 'border-status-danger-line bg-status-danger text-status-danger-fg',
  success: 'border-status-success-line bg-status-success text-status-success-fg',
  accent: 'border-transparent bg-accent-quiet text-ink-accent',
} as const;

export function Chip({
  tone = 'neutral',
  icon: Icon,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof TONE;
  icon?: LucideIcon;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-xs)] border px-1.5 py-0.5 text-2xs whitespace-nowrap',
        TONE[tone],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="size-3 shrink-0" aria-hidden />}
      {children}
    </span>
  );
}
