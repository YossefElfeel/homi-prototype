'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * Feedback for the screens that save as you type.
 *
 * The audit found four different vocabularies for "this was saved": a toast, a
 * transient inline chip, a full success screen, and — on nineteen screens —
 * nothing at all. Toast is right for a discrete act you chose to perform
 * (send this invoice, publish this review). It is wrong for autosave: a toast
 * per keystroke is thirty toasts to change a price.
 *
 * So the autosaving screens get this instead: a quiet status that appears
 * while a change settles and fades once it has. Same component everywhere,
 * which is what stops the fourth vocabulary growing back.
 */
export function SaveIndicator({
  /** Bump on every mutation — usually the value being edited, or a counter. */
  signal,
  savingLabel,
  savedLabel,
  className,
}: {
  signal: unknown;
  savingLabel: string;
  savedLabel: string;
  className?: string;
}) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  /* The first render is not a save — it is the screen opening. */
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      return;
    }

    setState('saving');
    const settle = window.setTimeout(() => setState('saved'), 350);
    const clear = window.setTimeout(() => setState('idle'), 2200);
    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(clear);
    };
  }, [signal]);

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 text-sm transition-opacity duration-[var(--motion-base)]',
        state === 'idle' ? 'opacity-0' : 'opacity-100',
        state === 'saved' ? 'text-status-success-fg' : 'text-ink-tertiary',
        className,
      )}
    >
      {state === 'saved' ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      )}
      {state === 'saved' ? savedLabel : savingLabel}
    </p>
  );
}
