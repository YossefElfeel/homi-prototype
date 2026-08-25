'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/cn';

/**
 * Used where a number has a ceiling the reader needs to feel: visits used
 * against the ones a plan includes, free skips used this month, photos taken
 * against the three a check-out requires. A bare "2 of 3" makes you do the
 * arithmetic.
 */
const TONE = {
  default: 'bg-accent',
  warning: 'bg-status-warning-fg',
  danger: 'bg-status-danger-fg',
  success: 'bg-status-success-fg',
} as const;

export function Progress({
  value,
  max = 100,
  tone = 'default',
  label,
  className,
}: {
  value: number;
  max?: number;
  tone?: keyof typeof TONE;
  /** Accessible name. Required — a bare bar announces nothing useful. */
  label: string;
  className?: string;
}) {
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = (clamped / safeMax) * 100;

  return (
    <ProgressPrimitive.Root
      value={clamped}
      max={safeMax}
      aria-label={label}
      className={cn(
        'relative h-1.5 w-full overflow-hidden rounded-full bg-sunken',
        className,
      )}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full rounded-full transition-[width] duration-[var(--motion-slow)] ease-[var(--ease-standard)]',
          TONE[tone],
        )}
        style={{ width: `${percent}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
