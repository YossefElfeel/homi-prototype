'use client';

import * as SeparatorPrimitive from '@radix-ui/react-separator';

import { cn } from '@/lib/cn';

/**
 * Decorative by default, so it stays out of the accessibility tree. Pass
 * `decorative={false}` only when the rule genuinely separates two groups a
 * screen reader should hear as distinct.
 */
export function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      decorative={decorative}
      className={cn(
        'shrink-0 bg-line-subtle',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  );
}
