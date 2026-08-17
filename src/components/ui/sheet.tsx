'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';
import { DialogOverlay } from './dialog';

/**
 * A panel that slides in from an edge. Same Radix Dialog underneath, so it
 * inherits the focus trap, the escape key, the scroll lock and the inert
 * background — all four of which the hand-rolled mobile nav drawer was
 * missing.
 *
 * `side` sets both the geometry and the slide direction; the keyframes read
 * --hv-sheet-from so one pair of animations covers all four edges.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

const SIDE = {
  left: {
    axis: 'inline',
    from: '-100%',
    box: 'inset-y-0 left-0 h-dvh w-[min(20rem,85vw)] border-r',
  },
  right: {
    axis: 'inline',
    from: '100%',
    box: 'inset-y-0 right-0 h-dvh w-[min(24rem,90vw)] border-l',
  },
  bottom: {
    axis: 'block',
    from: '100%',
    box: 'inset-x-0 bottom-0 max-h-[85dvh] w-full rounded-t-[var(--radius-xl)] border-t',
  },
} as const;

export function SheetContent({
  side = 'left',
  className,
  children,
  showClose = true,
  closeLabel = 'Close',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: keyof typeof SIDE;
  showClose?: boolean;
  closeLabel?: string;
}) {
  const { axis, from, box } = SIDE[side];

  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-hv="sheet"
        data-hv-axis={axis}
        style={{ '--hv-sheet-from': from } as React.CSSProperties}
        className={cn(
          'fixed z-50 flex flex-col overflow-y-auto border-line-subtle bg-card shadow-[var(--shadow-lg)]',
          box,
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-ink-tertiary transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
            aria-label={closeLabel}
          >
            <X className="size-4" aria-hidden />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-b border-line-subtle px-5 py-4 pr-14', className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('display-type text-base', className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('mt-1 text-sm text-ink-secondary', className)}
      {...props}
    />
  );
}
