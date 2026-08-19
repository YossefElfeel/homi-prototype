'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * A masked value with its own reveal — §13.1.
 *
 * The reveal used to be one button in the section header governing every
 * secret under it, which is the wrong grain twice over. It made "show me the
 * alarm code" also put the key-box code on the display, on a screen somebody
 * is often reading with a customer beside them; and it put the control a
 * heading away from the thing it acts on, so what it was about had to be
 * inferred.
 *
 * Per value, next to the value. Each opens alone and closes alone, and the
 * masked state is the default every time the screen is opened — nothing here
 * is remembered between visits.
 */
export function SecretValue({
  value,
  revealLabel,
  hideLabel,
  className,
}: {
  value: string;
  /** Both the tooltip and the accessible name — the icon has no text. */
  revealLabel: string;
  hideLabel: string;
  className?: string;
}) {
  const [shown, setShown] = useState(false);

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        data-numeric
        className={cn(
          'rounded-sm px-1.5 py-0.5',
          shown ? 'bg-status-warning text-status-warning-fg' : 'bg-sunken tracking-widest',
        )}
      >
        {shown ? value : '••••'}
      </span>
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        title={shown ? hideLabel : revealLabel}
        aria-label={shown ? hideLabel : revealLabel}
        aria-pressed={shown}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-ink-tertiary transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
      >
        {shown ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </span>
  );
}
