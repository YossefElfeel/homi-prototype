'use client';

import * as Primitive from '@radix-ui/react-accordion';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * A long form folded into one page.
 *
 * The wizard answer — one question per screen — is right for a visitor on a
 * phone who has never seen the form before. It is wrong for the person taking
 * the call, who knows every field by heart and needs to jump to whichever one
 * the customer just answered out of order. So: every section on one page, every
 * section collapsible, and a summary on each closed header so nothing has to be
 * opened to be checked.
 *
 * `type="multiple"` rather than single. On a phone call the office reads the
 * address back while entering the date; a disclosure that closes the section
 * you were just looking at would be actively hostile.
 *
 * Radix supplies the keyboard and ARIA contract (button, aria-expanded, region);
 * the geometry comes from tokens, so this needs no per-theme branch.
 */
export function SectionGroup({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string[];
  onValueChange: (value: string[]) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Primitive.Root
      type="multiple"
      value={value}
      onValueChange={onValueChange}
      className={cn('space-y-3', className)}
    >
      {children}
    </Primitive.Root>
  );
}

export function CollapsibleSection({
  value,
  step,
  icon: Icon,
  title,
  summary,
  complete = false,
  optional = false,
  optionalLabel,
  children,
}: {
  value: string;
  /**
   * Position in a sequence. Only for forms being filled in — it is what makes
   * the intake page still read as an order once every step is on one page.
   */
  step?: number;
  /**
   * Used instead of `step` on screens that are read rather than filled in.
   *
   * A detail screen's sections are not a sequence: numbering "1 Service,
   * 2 Property, 3 Access" claims an order that does not exist, and a tick for
   * "complete" claims the reader did something. A glyph carries the same
   * scanning weight and asserts neither.
   */
  icon?: LucideIcon;
  title: string;
  /** What the section holds, shown while it is closed. */
  summary?: React.ReactNode;
  complete?: boolean;
  optional?: boolean;
  optionalLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Primitive.Item
      value={value}
      className="surface-card overflow-hidden rounded-[var(--radius-lg)]"
    >
      <Primitive.Header>
        <Primitive.Trigger className="group flex w-full items-center gap-4 p-card text-left transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-line-focus">
          {/*
            The tick replaces the number rather than sitting next to it. Two
            indicators for one piece of state is how a form ends up saying
            "step 3" and "done" in the same row and meaning neither.
          */}
          <span
            data-numeric
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full text-sm transition-colors',
              complete && step != null
                ? 'bg-status-success text-status-success-fg'
                : 'bg-sunken text-ink-tertiary',
            )}
          >
            {Icon ? (
              <Icon className="size-4" aria-hidden />
            ) : complete ? (
              <Check className="size-4" aria-hidden />
            ) : (
              step
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="font-medium">{title}</span>
              {optional && optionalLabel && (
                <span className="text-xs font-normal text-ink-tertiary">
                  {optionalLabel}
                </span>
              )}
            </span>
            {summary && (
              <span className="mt-0.5 block truncate text-sm text-ink-secondary group-data-[state=open]:hidden">
                {summary}
              </span>
            )}
          </span>

          <ChevronDown
            className="size-4 shrink-0 text-ink-tertiary transition-transform duration-[var(--motion-base)] ease-[var(--ease-standard)] group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </Primitive.Trigger>
      </Primitive.Header>

      <Primitive.Content className="overflow-hidden">
        <div className="border-t border-line-subtle p-card">{children}</div>
      </Primitive.Content>
    </Primitive.Item>
  );
}
