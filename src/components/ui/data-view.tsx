'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

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
}) {
  if (items.length === 0) return <>{empty}</>;

  const primary = columns.find((c) => c.primary) ?? columns[0]!;
  const trailing = columns.filter((c) => c.trailing);
  const rest = columns.filter((c) => !c.primary && !c.trailing && !c.tableOnly);

  return (
    <div className={className}>
      {/* lg and up: a table. */}
      <table className="hidden w-full border-collapse text-left lg:table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  'label-type py-3 pr-4 text-ink-tertiary',
                  column.align === 'end' && 'text-right',
                )}
              >
                {column.header}
              </th>
            ))}
            {onSelect && (
              <th scope="col" className="w-10">
                {openLabel && <span className="sr-only">{openLabel}</span>}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={getKey(item)}
              onClick={onSelect ? () => onSelect(item) : undefined}
              className={cn(
                'border-b border-line-subtle',
                onSelect &&
                  'cursor-pointer transition-colors hover:bg-sunken has-[:focus-visible]:bg-sunken',
              )}
            >
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
                    className={cn('py-3.5 pr-4', column.align === 'end' && 'text-right')}
                  >
                    {isPrimary ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(item);
                        }}
                        className="text-left rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
                      >
                        {content}
                      </button>
                    ) : (
                      content
                    )}
                  </td>
                );
              })}
              {onSelect && (
                <td className="py-3.5 text-right">
                  <ChevronRight className="ml-auto size-4 text-ink-tertiary" aria-hidden />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Below lg: cards. Same columns, different shape — not a squeezed table. */}
      <ul className="space-y-3 lg:hidden">
        {items.map((item) => {
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
            <li key={getKey(item)}>
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="surface-card w-full p-4 text-left transition-colors hover:bg-sunken"
                >
                  {content}
                </button>
              ) : (
                <div className="surface-card p-4">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
