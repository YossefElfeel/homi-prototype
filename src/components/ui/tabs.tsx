'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/cn';

/**
 * The calendar built its own tab strip with a hand-rolled roving tabindex, and
 * styled the active tab with the *sidebar's* active-nav classes — so "which
 * calendar view am I in" and "which section am I in" looked identical.
 *
 * Radix Tabs was already a dependency. This gives the arrow-key and Home/End
 * behaviour for free, and a visually distinct active state: a seated pill,
 * not a nav highlight.
 */
export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-sunken p-1',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium whitespace-nowrap',
        'text-ink-secondary transition-colors duration-[var(--motion-fast)]',
        'hover:text-ink',
        'data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-[var(--shadow-sm)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
        'disabled:pointer-events-none disabled:opacity-45',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'mt-app focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
        className,
      )}
      {...props}
    />
  );
}
