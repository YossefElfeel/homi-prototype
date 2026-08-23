import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * One primary action per screen — the brief states it as a rule, and the
 * variants here are named so a second `primary` on a screen is obvious in
 * review.
 *
 * Geometry, motion and elevation all come from theme tokens: Raster renders
 * these square with no shadow, Zuhause rounds them into pills with soft
 * elevation, Goldküste makes them pill-shaped on near-black. Same component.
 *
 * Every size clears the 44px touch target at `md` and above; `sm` is for
 * pointer-dense admin tables only.
 */
const button = cva(
  [
    'inline-flex items-center justify-center gap-2 font-medium',
    'transition-[background-color,color,border-color,box-shadow,transform] ease-[var(--ease-standard)]',
    'duration-[var(--motion-base)]',
    '[&_svg]:shrink-0',
    /* Hook for the Homivaro hover, which is CSS-only and theme-scoped in
       globals.css. It is a class rather than a variant because nothing about
       the component changes — the other four directions never match the
       selector and render exactly as before. Deliberately not the design's
       full gesture: the cursor-magnet third of it needs a spring, a spring
       needs `motion`, and `motion` on the shared button would follow this
       component into all 58 console screens for the sake of a hover. */
    'hv-action',
    /* Disabled arrives two ways. A real <button> gets :disabled; an asChild
       anchor cannot — see the note in the component below — so aria-disabled
       has to carry the same weight or the styling silently does nothing. */
    'disabled:pointer-events-none disabled:opacity-45',
    'aria-disabled:pointer-events-none aria-disabled:opacity-45',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-on-accent shadow-[var(--shadow-sm)] hover:bg-accent-hover hover:shadow-[var(--shadow-md)] active:shadow-[var(--shadow-sm)]',
        secondary:
          'border border-line-strong bg-transparent text-ink hover:bg-accent-quiet',
        quiet: 'bg-accent-quiet text-ink-accent hover:brightness-97',
        ghost: 'bg-transparent text-ink-secondary hover:bg-sunken hover:text-ink',
        danger:
          'border border-status-danger-line bg-status-danger text-status-danger-fg hover:brightness-97',
        link: 'text-ink-accent underline decoration-from-font underline-offset-4 hover:decoration-2',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-13 px-7 text-base',
        icon: 'size-11',
        'icon-sm': 'size-9',
      },
      block: { true: 'w-full', false: '' },
    },
    compoundVariants: [
      { variant: 'link', class: 'h-auto p-0' },
      /* A press should feel like a press. Not on link — nudging inline text
         down a pixel reads as a rendering glitch, not as feedback. */
      { variant: 'primary', class: 'active:translate-y-px' },
      { variant: 'secondary', class: 'active:translate-y-px' },
      { variant: 'quiet', class: 'active:translate-y-px' },
      { variant: 'danger', class: 'active:translate-y-px' },
    ],
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
  /**
   * Swaps the leading glyph for a spinner, disables the control and marks it
   * aria-busy. Every store mutation in this app is instant, so this is for the
   * screens that fake latency and, more importantly, for stopping the second
   * click on a send action.
   *
   * Ignored when `asChild` is set: Slot forwards to a single child, so there
   * is nowhere to put the spinner without discarding that child.
   */
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  const isDisabled = Boolean(disabled) || loading;

  /*
   * `<Button asChild disabled>` used to be silently broken: Slot forwards the
   * prop to the child, the child is an <a>, and `disabled` is not a valid
   * anchor attribute — so :disabled never matched, the styles never applied,
   * and the link stayed fully clickable. The one call site that relied on it
   * (an already-answered request) showed an enabled "reply with quote" button.
   *
   * An anchor is made inert with aria-disabled plus removal from the tab order;
   * pointer-events-none in the base classes stops the click.
   */
  const stateProps = asChild
    ? {
        'aria-disabled': isDisabled || undefined,
        tabIndex: isDisabled ? -1 : undefined,
      }
    : { disabled: isDisabled, 'aria-busy': loading || undefined };

  return (
    <Comp
      className={cn(
        button({ variant, size, block }),
        variant !== 'link' && 'rounded-[var(--radius-action)]',
        className,
      )}
      {...stateProps}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}
