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

/**
 * Which plane the strip is standing on.
 *
 * `sunken` is the console's: a grey track with the selected tab lifted out of
 * it in white. That inverts to nothing on a `tone="sunken"` section — grey
 * track on a grey slab, white pill on grey, which is the same disappearing act
 * the plan comparison and the add-on cards were doing. `card` is the version
 * for those sections: a white track, and the selected tab in navy so it is the
 * darkest thing in the strip rather than the lightest.
 */
type Tone = 'sunken' | 'card';

export function TabsList({
  className,
  tone = 'sunken',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { tone?: Tone }) {
  return (
    <TabsPrimitive.List
      className={cn(
        /* Radius from the token, not `rounded-full`: Raster renders its
           controls square, and hard-coding a pill here would round the tab
           strips on every console screen that uses this. */
        'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-[var(--radius-md)] p-1',
        tone === 'sunken' ? 'bg-sunken' : 'border border-line bg-card',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  tone = 'sunken',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { tone?: Tone }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium whitespace-nowrap',
        'text-ink-secondary transition-colors duration-[var(--motion-fast)]',
        'hover:text-ink',
        tone === 'sunken'
          ? 'data-[state=active]:bg-card data-[state=active]:text-ink data-[state=active]:shadow-[var(--shadow-sm)]'
          : 'data-[state=active]:bg-inverse data-[state=active]:text-ink-inverse',
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
