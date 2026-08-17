'use client';

import { useState } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export interface AppNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only the area root needs an exact match; every other item owns a subtree. */
  exact?: boolean;
  badge?: number;
}

export interface AppNavGroup {
  key: string;
  /** Omitted on the first group — its items are the obvious ones. */
  label?: string;
  items: AppNavItem[];
  /** Groups a given role rarely opens start folded. */
  defaultCollapsed?: boolean;
}

/**
 * One nav item, one definition.
 *
 * The admin and account shells carried byte-identical copies of this class
 * string — including the badge span — in two files. They had already started
 * to drift in the surrounding markup (admin grouped and labelled, account
 * separated by an `<hr>` with no labels).
 *
 * The active state gains an indicator bar. A tint alone is easy to miss on a
 * list of nineteen, and it read the same as the calendar's active tab, so
 * "which section" and "which view" looked like the same signal.
 */
export function NavItem({
  item,
  active,
  onNavigate,
}: {
  item: AppNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative flex min-h-10 items-center gap-3 rounded-[var(--radius-sm)] py-2 pr-2 pl-3 text-sm',
          'transition-colors duration-[var(--motion-fast)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
          active
            ? 'bg-accent-subtle font-medium text-ink'
            : 'text-ink-secondary hover:bg-sunken hover:text-ink',
        )}
      >
        {active && (
          <span
            aria-hidden
            className="absolute inset-y-1.5 -left-3 w-0.5 rounded-full bg-accent"
          />
        )}
        <Icon
          className={cn('size-4 shrink-0', active ? 'text-ink-accent' : 'text-ink-tertiary')}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <span
            data-numeric
            className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-2xs font-medium text-on-accent"
          >
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}

/** A labelled, collapsible block of nav items. */
export function NavGroup({
  group,
  isActive,
  onNavigate,
  collapseLabel,
}: {
  group: AppNavGroup;
  isActive: (item: AppNavItem) => boolean;
  onNavigate?: () => void;
  collapseLabel: string;
}) {
  const [collapsed, setCollapsed] = useState(Boolean(group.defaultCollapsed));
  const badgeTotal = group.items.reduce((sum, item) => sum + (item.badge ?? 0), 0);
  /* Never fold away the group you are standing in. */
  const holdsActive = group.items.some(isActive);
  const open = !collapsed || holdsActive;

  return (
    <div className="pl-3">
      {group.label && (
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={open}
          aria-label={collapseLabel}
          className="mb-1 flex w-full items-center gap-1.5 rounded-[var(--radius-xs)] py-1 pr-2 text-2xs font-medium text-ink-tertiary transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
        >
          <ChevronDown
            className={cn(
              'size-3 transition-transform duration-[var(--motion-fast)]',
              !open && '-rotate-90',
            )}
            aria-hidden
          />
          <span className="flex-1 text-left">{group.label}</span>
          {!open && badgeTotal > 0 && (
            <span
              data-numeric
              className="rounded-full bg-accent px-1.5 py-px text-2xs text-on-accent"
            >
              {badgeTotal}
            </span>
          )}
        </button>
      )}
      {open && (
        <ul className="space-y-0.5">
          {group.items.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isActive(item)}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
