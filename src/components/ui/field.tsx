import { useId } from 'react';
import { AlertCircle } from 'lucide-react';
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

const controlBase =
  'w-full rounded-[var(--radius-sm)] border bg-card px-3.5 text-ink transition-colors placeholder:text-ink-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus aria-[invalid=true]:border-status-danger-line aria-[invalid=true]:bg-status-danger/40';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(controlBase, 'h-11 border-line', className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(controlBase, 'min-h-32 border-line py-3', className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(controlBase, 'h-11 cursor-pointer border-line pr-9', className)}
      {...props}
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
        className="mt-0.5 size-5 shrink-0 accent-[var(--accent-solid)]"
        {...props}
      />
      <label htmlFor={id} className="text-sm text-ink-secondary">
        {label}
      </label>
    </div>
  );
}
