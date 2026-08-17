'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/cn';

/**
 * Only ever a *supplement*. Anything a tooltip says must already be reachable
 * without hover — the console is used on touch screens too, and an icon button
 * whose meaning lives in a hover state has no meaning on a phone. Icon buttons
 * carry their own aria-label; this is the sighted-pointer echo of it.
 */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-hv="pop"
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-64 rounded-[var(--radius-sm)] bg-inverse px-2.5 py-1.5 text-2xs text-ink-inverse shadow-[var(--shadow-md)]',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

/** The common case in one call: a trigger, a label, done. */
export function Hint({
  label,
  side = 'bottom',
  children,
}: {
  label: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
