'use client';

import * as Primitive from '@radix-ui/react-accordion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * FAQ disclosure. Radix handles the keyboard and ARIA contract; the geometry
 * and motion come from theme tokens, so this works in all three directions
 * without a branch.
 */
export function Faq({
  items,
  className,
}: {
  items: { q: string; a: string }[];
  className?: string;
}) {
  return (
    <Primitive.Root type="single" collapsible className={cn('border-t border-line-subtle', className)}>
      {items.map((item, i) => (
        <Primitive.Item
          key={item.q}
          value={`item-${i}`}
          className="border-b border-line-subtle"
        >
          <Primitive.Header>
            <Primitive.Trigger className="group flex w-full items-start justify-between gap-6 py-5 text-left transition-colors hover:text-ink-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus">
              <span className="font-medium">{item.q}</span>
              <Plus
                className="mt-0.5 size-5 shrink-0 text-ink-tertiary transition-transform duration-[var(--motion-base)] ease-[var(--ease-standard)] group-data-[state=open]:rotate-45"
                aria-hidden
              />
            </Primitive.Trigger>
          </Primitive.Header>
          <Primitive.Content className="overflow-hidden data-[state=closed]:animate-none">
            <p className="max-w-[var(--measure)] pr-10 pb-6 text-ink-secondary">{item.a}</p>
          </Primitive.Content>
        </Primitive.Item>
      ))}
    </Primitive.Root>
  );
}
