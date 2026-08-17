'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';

export interface CommandItem {
  id: string;
  label: string;
  detail?: string;
  href?: string;
  onSelect?: () => void;
  icon?: LucideIcon;
}

export interface CommandGroup {
  key: string;
  label: string;
  items: CommandItem[];
}

/**
 * Opens the palette on ⌘K / Ctrl+K, and on "/" when the caret is not already
 * in a field. Returns the open state so the shell can also drive it from the
 * topbar button — a keyboard-only entry point is invisible to most people.
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const cmdK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);

      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;
      const slash = event.key === '/' && !typing && !event.metaKey && !event.ctrlKey;

      if (cmdK || slash) {
        event.preventDefault();
        setOpen((v) => (cmdK ? !v : true));
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return { open, setOpen };
}

/**
 * Search and jump, from anywhere in the console.
 *
 * The unified search already existed as its own screen, which meant reaching
 * it was itself a navigation — two clicks before you could start typing the
 * thing you were looking for. Same matching logic (lib/admin-search.ts),
 * reachable from any screen without leaving it.
 *
 * The parent owns the query and computes the groups, so the palette stays a
 * presentation layer over whatever the shell decides is findable.
 */
export function CommandPalette({
  open,
  onOpenChange,
  groups,
  query,
  onQueryChange,
  label,
  placeholder,
  emptyLabel,
  hintLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
  query: string;
  onQueryChange: (query: string) => void;
  label: string;
  placeholder: string;
  emptyLabel: string;
  /** "Enter to open" — shown next to the highlighted row. */
  hintLabel: string;
}) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  /* One flat list for the arrow keys; the groups are only a rendering. */
  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  /*
   * Results change under the cursor as you type, so the highlight goes back to
   * the top rather than pointing at whatever now occupies row 7.
   *
   * Adjusted during render rather than in an effect: an effect would render
   * once with the stale highlight before correcting it, which is visible as a
   * flicker on the row the pointer is over.
   */
  const [lastKey, setLastKey] = useState(`${open}:${query}`);
  const key = `${open}:${query}`;
  if (lastKey !== key) {
    setLastKey(key);
    setActive(0);
  }

  function run(item: CommandItem) {
    onOpenChange(false);
    onQueryChange('');
    item.onSelect?.();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (flat.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = flat[active];
      if (item) run(item);
    }
  }

  /* Keep the highlighted row in view when the arrow keys walk past the fold. */
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  let index = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[12vh] max-w-xl translate-y-0 overflow-hidden p-0"
        showClose={false}
        onKeyDown={onKeyDown}
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only">{placeholder}</DialogDescription>

        <div className="flex items-center gap-3 border-b border-line-subtle px-4">
          <Search className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            aria-label={label}
            aria-controls="command-results"
            className="h-13 w-full bg-transparent text-base outline-none placeholder:text-ink-tertiary"
          />
        </div>

        <div
          id="command-results"
          ref={listRef}
          role="listbox"
          aria-label={label}
          className="max-h-[min(24rem,50dvh)] overflow-y-auto p-2"
        >
          {flat.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-ink-tertiary">
              {emptyLabel}
            </p>
          ) : (
            groups.map((group) =>
              group.items.length === 0 ? null : (
                <div key={group.key} className="mb-1 last:mb-0">
                  <p className="px-3 py-1.5 text-2xs font-medium text-ink-tertiary">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    index += 1;
                    const isActive = index === active;
                    const Icon = item.icon;
                    const at = index;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        data-active={isActive}
                        onMouseMove={() => setActive(at)}
                        onClick={() => run(item)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm',
                          isActive ? 'bg-sunken' : 'bg-transparent',
                        )}
                      >
                        {Icon && (
                          <Icon className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.detail && (
                          <span className="shrink-0 truncate text-xs text-ink-tertiary">
                            {item.detail}
                          </span>
                        )}
                        {isActive && (
                          <span className="flex shrink-0 items-center gap-1 text-2xs text-ink-tertiary">
                            <CornerDownLeft className="size-3" aria-hidden />
                            {hintLabel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ),
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
