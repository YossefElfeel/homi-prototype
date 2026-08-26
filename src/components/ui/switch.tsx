'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/cn';

/**
 * For settings that take effect the moment you flip them — publishing consent,
 * an add-on going live, a region being served. A checkbox promises a save
 * button somewhere; a switch does not, which is the honest signal for the
 * autosaving screens in this app.
 *
 * One screen deliberately breaks that: the coupon editor stages everything in a
 * draft, so its switch has to say in its hint that the flip waits for save. A
 * switch inside a draft form needs that sentence — without it the control
 * promises something the screen does not do.
 */
export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent p-0.5',
        'transition-colors duration-[var(--motion-base)] ease-[var(--ease-standard)]',
        'bg-line data-[state=checked]:bg-accent',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
        'disabled:pointer-events-none disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-card shadow-[var(--shadow-sm)]',
          'transition-transform duration-[var(--motion-base)] ease-[var(--ease-standard)]',
          'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

/** Switch on the right, label and explanation on the left. */
export function SwitchField({
  label,
  hint,
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  label: string;
  hint?: string;
}) {
  const id = props.id ?? `switch-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint && (
          <p id={hintId} className="mt-0.5 text-sm text-ink-tertiary">
            {hint}
          </p>
        )}
      </div>
      <Switch id={id} aria-describedby={hintId} {...props} />
    </div>
  );
}
