import { useId, useState } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The form contract, enforced once here rather than per screen:
 *
 *  · every field has a visible label above it — never a placeholder standing
 *    in for one (the brief: "كل حقل له عنوان ظاهر فوقه مش placeholder بس")
 *  · optional fields are marked; required is the default, so it is not
 *    labelled and does not add noise
 *  · errors render next to the field and are wired with aria-describedby and
 *    aria-invalid, not just coloured red
 */
export function Field({
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline gap-2 text-sm font-medium">
        {label}
        {optional && (
          <span className="text-xs font-normal text-ink-tertiary">optional</span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-ink-tertiary">
          {hint}
        </p>
      )}
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error && (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-sm text-status-danger-fg"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

/*
 * Resting, hover and focus used to be one state: the border never moved, and
 * the only feedback was the global focus ring. A control that looks identical
 * whether or not the caret is in it is the thing that makes a dense form feel
 * dead. Hover lifts, focus moves the border to the focus colour — the outline
 * ring still fires on top for keyboard users.
 */
const controlBase = [
  /* hv-field is a theme hook, not a style. The Homivaro direction has no form
     in its design file, so the field shape was derived: the card surface at
     the small radius, because a 999px pill collapses on a textarea and reads
     as a search box on one line. Defined only under that theme and reset
     inside the console, so the other three and every admin screen are
     untouched — see globals.css. */
  'hv-field',
  'w-full rounded-[var(--radius-sm)] border border-line bg-card px-3.5 text-ink',
  'transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] ease-[var(--ease-standard)]',
  'placeholder:text-ink-tertiary',
  'hover:shadow-[var(--shadow-sm)]',
  'focus:border-line-focus',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
  'disabled:cursor-not-allowed disabled:bg-sunken disabled:opacity-70',
  'aria-[invalid=true]:border-status-danger-line aria-[invalid=true]:bg-status-danger/40',
];

/** `dense` is for admin tables and toolbars only; forms keep the 44px target. */
const height = (dense?: boolean) => (dense ? 'h-9' : 'h-11');

export interface InputProps extends React.ComponentProps<'input'> {
  /**
   * Glyph inside the control. Named `leading`/`trailing` rather than
   * prefix/suffix because `prefix` is a real HTML attribute and would collide.
   * Six screens were faking this with `className="pl-10"` plus an absolutely
   * positioned icon they each re-typed.
   */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  dense?: boolean;
}

export function Input({ className, leading, trailing, dense, ...props }: InputProps) {
  const control = (
    <input
      className={cn(
        controlBase,
        height(dense),
        leading && 'pl-10',
        trailing && 'pr-10',
        className,
      )}
      {...props}
    />
  );

  if (!leading && !trailing) return control;

  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-ink-tertiary [&_svg]:size-4">
          {leading}
        </span>
      )}
      {control}
      {trailing && (
        <span className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-tertiary [&_svg]:size-4">
          {trailing}
        </span>
      )}
    </div>
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea className={cn(controlBase, 'min-h-32 py-3', className)} {...props} />
  );
}

/**
 * Still a native <select>. Radix Select is in the dependency list and was
 * considered, but the native control is the better answer on a phone — it
 * opens the platform picker — and every one of the ~24 call sites passes plain
 * <option> children. What was missing was the affordance: the browser's own
 * arrow ignores the token system. So the arrow is ours and the rest is native.
 */
export function Select({
  className,
  dense,
  ...props
}: React.ComponentProps<'select'> & { dense?: boolean }) {
  return (
    <div className="relative">
      <select
        className={cn(
          controlBase,
          height(dense),
          'cursor-pointer appearance-none pr-9',
          className,
        )}
        {...props}
      />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-tertiary"
        aria-hidden
      />
    </div>
  );
}

/**
 * A number input that survives being cleared.
 *
 * Every numeric field in the admin panel was `Number(e.target.value) || 0`
 * against a store that autosaves per keystroke. Selecting "25" and pressing
 * backspace to retype it writes **0** to the live record in between — which on
 * the settings screen silently zeroes the Saturday surcharge, and on the
 * service catalogue prices the next quote at CHF 0.
 *
 * Empty is held locally as empty and only committed once it parses, so the
 * intermediate state of an edit never reaches the data.
 */
export function NumberField({
  value,
  onCommit,
  min,
  max,
  className,
  ...props
}: Omit<InputProps, 'value' | 'onChange' | 'type'> & {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const [text, setText] = useState<string | null>(null);

  return (
    <Input
      {...props}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      className={className}
      value={text ?? String(value)}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        if (next.trim() === '') return;
        const parsed = Number(next);
        if (!Number.isFinite(parsed)) return;
        if (min !== undefined && parsed < min) return;
        if (max !== undefined && parsed > max) return;
        onCommit(parsed);
      }}
      /* Blur re-syncs with the store, so an abandoned half-edit ("2" of "25")
         snaps back to what was actually saved rather than lingering. */
      onBlur={() => setText(null)}
    />
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: React.ComponentProps<'input'> & { label: React.ReactNode }) {
  const id = useId();
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-6 shrink-0 accent-[var(--accent-solid)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
        {...props}
      />
      <label htmlFor={id} className="text-sm text-ink-secondary">
        {label}
      </label>
    </div>
  );
}
