'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SkeletonRows } from './skeleton';

/**
 * One column definition, two renderings.
 *
 * The admin panel is fully responsive, and the brief rules out the usual
 * shortcut in as many words: "أي جدول في لوحة الإدارة له نسخة كروت على
 * الموبايل. الجدول المضغوط مش حل."
 *
 * So this takes a single column list and renders a real table at lg and above,
 * and real cards below it. Writing the two by hand per screen is how they
 * drift apart — here they cannot.
 *
 * `primary` marks the column that becomes the card's title. `trailing` sits on
 * the card's title row (a status badge, an amount). Everything else becomes a
 * label/value pair inside the card.
 */
export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  /** Card title. Exactly one column should set this. */
  primary?: boolean;
  /** Rendered next to the title on the card rather than as a labelled row. */
  trailing?: boolean;
  /** Hidden on the card — for columns that only make sense in a dense table. */
  tableOnly?: boolean;
  align?: 'start' | 'end';
  width?: string;
  /**
   * Makes the column sortable. Return the value to compare — a timestamp, an
   * amount, a name. Sorting applies to both renderings, so the phone shows the
   * same order as the desk.
   */
  sortBy?: (item: T) => string | number | null | undefined;
}

export type SortState = { key: string; dir: 'asc' | 'desc' };

/**
 * Bulk selection. Deliberately opt-in: a checkbox column on a list with no
 * bulk action is a control that does nothing, which is the whole class of
 * problem this refactor exists to remove. Only pass it with a `bar`.
 */
export interface Selection {
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Accessible name for a row's checkbox, e.g. "Select invoice". */
  rowLabel: string;
  allLabel: string;
  /** The action bar shown while anything is selected. */
  bar: (ids: string[]) => React.ReactNode;
  /** Rows that cannot be acted on in bulk — a sent invoice, a published review. */
  isSelectable?: (key: string) => boolean;
}

export function DataView<T>({
  items,
  columns,
  getKey,
  onSelect,
  empty,
  caption,
  openLabel,
  className,
  loading = false,
  rowActions,
  defaultSort,
  stickyHeader = true,
  surface = 'card',
  selection,
}: {
  items: T[];
  columns: Column<T>[];
  getKey: (item: T) => string;
  onSelect?: (item: T) => void;
  empty: React.ReactNode;
  caption?: string;
  /**
   * Header text for the open-row column, read only by screen readers. The
   * row's own button already carries the item's name, so this is a refinement
   * rather than the fix — omit it and the row is still reachable.
   */
  openLabel?: string;
  className?: string;
  /** Reserves the table's shape while the persisted store rehydrates. */
  loading?: boolean;
  /**
   * Per-row actions. Use `RowActions` from `./row-actions` — icons in the
   * table, icon-and-label on the card, and the same set in both.
   */
  rowActions?: (item: T) => React.ReactNode;
  defaultSort?: SortState;
  stickyHeader?: boolean;
  /** `plain` for tables already inside a Card that owns the surface. */
  surface?: 'card' | 'plain';
  selection?: Selection;
}) {
  const [sort, setSort] = useState<SortState | null>(defaultSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return items;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortBy) return items;
    const read = column.sortBy;

    /* Slice first — Array.sort mutates, and `items` is a store-derived array
       that other renders are still holding. */
    return [...items].sort((a, b) => {
      const av = read(a);
      const bv = read(b);
      /* Missing values sink to the bottom in both directions. An empty cell is
         not "smallest", it is "not applicable". */
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [items, columns, sort]);

  if (loading) {
    return <SkeletonRows rows={5} className={className} />;
  }

  if (items.length === 0) return <>{empty}</>;

  const primary = columns.find((c) => c.primary) ?? columns[0]!;
  const trailing = columns.filter((c) => c.trailing);
  const rest = columns.filter((c) => !c.primary && !c.trailing && !c.tableOnly);
  const hasTrailingCell = Boolean(onSelect || rowActions);

  const selectableKeys = selection
    ? sorted
        .map(getKey)
        .filter((key) => selection.isSelectable?.(key) ?? true)
    : [];
  const selectedSet = new Set(selection?.selected ?? []);
  const selectedHere = selectableKeys.filter((key) => selectedSet.has(key));
  const allSelected =
    selectableKeys.length > 0 && selectedHere.length === selectableKeys.length;

  function toggleRow(key: string) {
    if (!selection) return;
    selection.onChange(
      selectedSet.has(key)
        ? selection.selected.filter((id) => id !== key)
        : [...selection.selected, key],
    );
  }

  function toggleAll() {
    if (!selection) return;
    /* Only ever touches the rows currently on screen — a filter is a promise
       that you are acting on what you can see. */
    selection.onChange(allSelected ? [] : selectableKeys);
  }

  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, dir: 'asc' };
      if (current.dir === 'asc') return { key, dir: 'desc' };
      /* Third click clears rather than cycling back to ascending, so the
         list's own meaningful default order (oldest first, newest first) is
         always one click away. */
      return null;
    });
  }

  return (
    <div className={className}>
      {selection && selectedHere.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-line-subtle bg-accent-subtle px-4 py-2.5">
          <p data-numeric className="text-sm font-medium">
            {selectedHere.length}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {selection.bar(selectedHere)}
          </div>
        </div>
      )}

      {/* lg and up: a table. */}
      <div
        className={cn(
          'hidden lg:block',
          surface === 'card' &&
            'rounded-[var(--radius-lg)] border border-line-subtle bg-card shadow-[var(--shadow-sm)]',
        )}
      >
        <table className="w-full border-collapse text-left">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {selection && (
                <th
                  scope="col"
                  className={cn(
                    'w-12 border-b border-line-subtle bg-card px-4',
                    stickyHeader && 'sticky top-topbar z-10',
                    surface === 'card' && 'rounded-tl-[var(--radius-lg)]',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      /* Some but not all: the header box is neither on nor
                         off, and only the DOM property can say so. */
                      if (el)
                        el.indeterminate =
                          selectedHere.length > 0 && !allSelected;
                    }}
                    onChange={toggleAll}
                    aria-label={selection.allLabel}
                    className="size-4 accent-[var(--accent-solid)]"
                  />
                </th>
              )}
              {columns.map((column) => {
                const active = sort?.key === column.key;
                const SortIcon = !active
                  ? ArrowUpDown
                  : sort.dir === 'asc'
                    ? ArrowUp
                    : ArrowDown;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    aria-sort={
                      active
                        ? sort.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : column.sortBy
                          ? 'none'
                          : undefined
                    }
                    className={cn(
                      'label-type border-b border-line-subtle bg-card px-4 py-2.5 font-medium text-ink-tertiary',
                      stickyHeader && 'sticky top-topbar z-10',
                      column.align === 'end' && 'text-right',
                      /* Round with the card so the header does not square off
                         the corners it sits in. */
                      surface === 'card' &&
                        'first:rounded-tl-[var(--radius-lg)] last:rounded-tr-[var(--radius-lg)]',
                    )}
                  >
                    {column.sortBy ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
                          active && 'text-ink',
                          column.align === 'end' && 'flex-row-reverse',
                        )}
                      >
                        {column.header}
                        <SortIcon className="size-3" aria-hidden />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {hasTrailingCell && (
                <th
                  scope="col"
                  className={cn(
                    /* `w-px` is the shrink-to-content idiom: the column takes
                       exactly what its cell needs and the data columns keep the
                       rest. It was a fixed `w-14`, which fits one menu button
                       and clips the moment a screen puts its row actions on
                       screen as icons instead of hiding them behind a menu. */
                    'w-px border-b border-line-subtle bg-card',
                    stickyHeader && 'sticky top-topbar z-10',
                    surface === 'card' && 'rounded-tr-[var(--radius-lg)]',
                  )}
                >
                  {openLabel && <span className="sr-only">{openLabel}</span>}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr
                key={getKey(item)}
                onClick={onSelect ? () => onSelect(item) : undefined}
                className={cn(
                  'border-b border-line-subtle last:border-0',
                  onSelect &&
                    'cursor-pointer transition-colors duration-[var(--motion-fast)] hover:bg-sunken has-[:focus-visible]:bg-sunken',
                )}
              >
                {selection && (
                  <td className="px-4 py-row" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedSet.has(getKey(item))}
                      disabled={selection.isSelectable?.(getKey(item)) === false}
                      onChange={() => toggleRow(getKey(item))}
                      aria-label={selection.rowLabel}
                      className="size-4 accent-[var(--accent-solid)] disabled:opacity-40"
                    />
                  </td>
                )}
                {columns.map((column) => {
                  const content = column.cell(item);
                  /*
                   * The row keeps its click for pointer users, but the primary
                   * cell carries a real <button> so the row is reachable by
                   * keyboard and announced as one control by a screen reader.
                   * At lg and up the table is the only rendering, so without
                   * this the 14 list screens had no keyboard path into a row at
                   * all. The mobile branch below already does exactly this.
                   *
                   * Not tabIndex + role="button" on the <tr>: that destroys
                   * row/cell semantics and makes the whole row one control name.
                   */
                  const isPrimary = onSelect && column.key === primary.key;

                  return (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-row align-middle',
                        column.align === 'end' && 'text-right',
                      )}
                    >
                      {isPrimary ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(item);
                          }}
                          className="rounded-[var(--radius-xs)] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
                        >
                          {content}
                        </button>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
                {hasTrailingCell && (
                  <td
                    className="px-2 py-row text-right whitespace-nowrap"
                    /* The row's own click would fire underneath an actions
                       menu and navigate away mid-choice. */
                    onClick={rowActions ? (e) => e.stopPropagation() : undefined}
                  >
                    {rowActions ? (
                      rowActions(item)
                    ) : (
                      <ChevronRight
                        className="ml-auto size-4 text-ink-tertiary"
                        aria-hidden
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Below lg: cards. Same columns, different shape — not a squeezed table. */}
      <ul className="space-y-3 lg:hidden">
        {sorted.map((item) => {
          const key = getKey(item);
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 font-medium">{primary.cell(item)}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {trailing.map((column) => (
                    <span key={column.key}>{column.cell(item)}</span>
                  ))}
                </span>
              </div>
              {rest.length > 0 && (
                <dl className="mt-3 space-y-1.5 border-t border-line-subtle pt-3">
                  {rest.map((column) => (
                    <div key={column.key} className="flex justify-between gap-4 text-sm">
                      <dt className="shrink-0 text-ink-tertiary">{column.header}</dt>
                      <dd className="text-right">{column.cell(item)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </>
          );

          return (
            /*
             * The actions get a strip of their own along the bottom.
             *
             * They used to be pinned `absolute top-3 right-3`, which worked
             * only because every screen put a single menu button there. The
             * moment a list shows its actions instead of hiding them, that
             * corner is already occupied by the card's title row — so the
             * surface moved out to the `li` and the actions sit below the
             * content, in flow, where they can be as wide as they need.
             */
            <li key={key} className="surface-card relative overflow-hidden">
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={cn(
                    'block w-full p-4 text-left transition-colors duration-[var(--motion-fast)] hover:bg-sunken',
                    selection && 'pl-11',
                  )}
                >
                  {content}
                </button>
              ) : (
                <div className={cn('p-4', selection && 'pl-11')}>{content}</div>
              )}
              {selection && (selection.isSelectable?.(key) ?? true) && (
                <input
                  type="checkbox"
                  checked={selectedSet.has(key)}
                  onChange={() => toggleRow(key)}
                  aria-label={selection.rowLabel}
                  className="absolute top-4.5 left-4 size-4 accent-[var(--accent-solid)]"
                />
              )}
              {rowActions && (
                <div className="border-t border-line-subtle px-2 py-1.5">
                  {rowActions(item)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
