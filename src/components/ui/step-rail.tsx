import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

export type Step = { name: string; label: string };

/**
 * Progress through the booking wizard and the quote flow.
 *
 * Both used to render a row of bare 1px bars with the step names in an
 * sr-only span — so a sighted visitor on step 6 of 10 could see *that* there
 * were bars, but not which stage they were at or what came next. The names
 * were already translated; they just never reached the screen.
 *
 * At sm and up the rail carries numbers and labels. Below that it stays a bar
 * with a "Step 6 of 10 · Access" line underneath, because ten labels do not
 * fit on a phone and a truncated label is worse than none.
 */
export function StepRail({
  steps,
  current,
  label,
  caption,
  className,
}: {
  steps: Step[];
  /** Index of the active step. */
  current: number;
  /** Accessible name for the nav landmark. */
  label: string;
  /** The "Step 6 of 10 · Access" line shown on small screens. */
  caption?: React.ReactNode;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      {/* sm and up: numbered, labelled, with the connector doubling as the
          progress bar. */}
      <ol className="hidden items-center sm:flex">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;

          return (
            <li
              key={step.name}
              aria-current={active ? 'step' : undefined}
              className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-2xs font-semibold transition-colors duration-[var(--motion-base)]',
                    done && 'bg-accent text-on-accent',
                    active && 'bg-accent text-on-accent ring-4 ring-accent-quiet',
                    !done && !active && 'bg-sunken text-ink-tertiary',
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                </span>
                <span
                  className={cn(
                    'hidden text-sm whitespace-nowrap lg:inline',
                    active ? 'font-medium text-ink' : 'text-ink-tertiary',
                  )}
                >
                  {step.label}
                </span>
              </span>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'mx-2 h-0.5 flex-1 rounded-full transition-colors duration-[var(--motion-base)]',
                    done ? 'bg-accent' : 'bg-sunken',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Below sm: the bar, plus the caption the labels move into. */}
      <ol className="flex gap-1.5 sm:hidden">
        {steps.map((step, i) => (
          <li
            key={step.name}
            aria-current={i === current ? 'step' : undefined}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-[var(--motion-base)]',
              i <= current ? 'bg-accent' : 'bg-sunken',
            )}
          >
            <span className="sr-only">{step.label}</span>
          </li>
        ))}
      </ol>

      {caption && (
        <p data-numeric className="mt-3 text-sm text-ink-tertiary sm:hidden">
          {caption}
        </p>
      )}
    </nav>
  );
}
