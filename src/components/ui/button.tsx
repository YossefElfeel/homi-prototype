import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
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
    'transition-[background-color,color,border-color,transform] ease-[var(--ease-standard)]',
    'duration-[var(--motion-base)]',
    'disabled:pointer-events-none disabled:opacity-45',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent hover:bg-accent-hover',
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
      },
      block: { true: 'w-full', false: '' },
    },
    compoundVariants: [
      { variant: 'link', class: 'h-auto p-0' },
    ],
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(
        button({ variant, size, block }),
        variant !== 'link' && 'rounded-[var(--radius-action)]',
        className,
      )}
      {...props}
    />
  );
}
