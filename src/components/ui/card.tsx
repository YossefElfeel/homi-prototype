import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * The surface this codebase had been drawing by hand.
 *
 * Before this there were four competing idioms for "a box with content in it":
 * the `surface-card` utility (41 files), an inline dashed-border variant (24
 * files), a `divide-y` list, and a `gap-px` hairline grid. Each picked its own
 * padding at the call site. This is the one shape, with padding on the density
 * scale so the topbar's compact switch actually reaches it.
 *
 * Geometry and elevation still come from tokens, so a card is a hairline
 * rectangle on the marketing site and a floating panel inside data-scope="app"
 * — same component, no branching.
 */
const card = cva('rounded-[var(--radius-lg)]', {
  variants: {
    tone: {
      default: 'surface-card',
      /** Nested inside another card, or a well the eye should skip. */
      muted: 'border border-line-subtle bg-sunken',
      /** "Nothing here yet, and that is expected" — not an error. */
      dashed: 'border border-dashed border-line',
      danger: 'border border-status-danger-line bg-status-danger',
      warning: 'border border-status-warning-line bg-status-warning',
    },
    pad: {
      none: '',
      sm: 'p-4',
      md: 'p-card',
      lg: 'p-6',
    },
    /** Whole-card link or button. Lifts on hover, seats again on press. */
    interactive: {
      true: [
        'w-full text-left',
        'transition-[box-shadow,border-color,transform] duration-[var(--motion-base)] ease-[var(--ease-standard)]',
        'hover:border-line hover:shadow-[var(--shadow-md)]',
        'active:translate-y-px active:shadow-[var(--shadow-sm)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
      ],
      false: '',
    },
  },
  defaultVariants: { tone: 'default', pad: 'md', interactive: false },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof card> {}

export function Card({ className, tone, pad, interactive, ...props }: CardProps) {
  return <div className={cn(card({ tone, pad, interactive }), className)} {...props} />;
}

/**
 * Title on the left, actions on the right, wrapping to two rows before either
 * side truncates. `divided` is for cards whose body is a table — the rule
 * separates the header from the column headers.
 */
export function CardHeader({
  title,
  description,
  actions,
  divided = false,
  headingLevel = 2,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  divided?: boolean;
  headingLevel?: 2 | 3 | 4;
  className?: string;
  children?: React.ReactNode;
}) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-x-4 gap-y-2',
        divided && 'border-b border-line-subtle pb-4',
        className,
      )}
    >
      <div className="min-w-0">
        {title && (
          <Heading className="display-type text-base leading-snug font-semibold">
            {title}
          </Heading>
        )}
        {description && (
          <p className="mt-1 max-w-[var(--measure)] text-sm text-ink-secondary">
            {description}
          </p>
        )}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Spacing between the header and the body, so call sites stop typing `mt-4`. */
export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-4', className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-4 flex flex-wrap items-center gap-2 border-t border-line-subtle pt-4',
        className,
      )}
      {...props}
    />
  );
}
