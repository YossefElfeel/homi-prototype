'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import type { InvoiceLine } from '@/mock/schema';

const linesTotal = (lines: InvoiceLine[]) =>
  lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

/**
 * The positions on an invoice — the same table before and after it exists.
 *
 * Screen 72 owned this outright, which left the create screen a choice between
 * a second implementation of "quantity × unit price, editable" and no line
 * editing until after the invoice is saved. Both are wrong: two tables drift on
 * the first change to a line, and a create screen that cannot itemise is not
 * creating the document, only naming it.
 *
 * `editable` is the whole difference between the two renderings, and the caller
 * decides it from `invoice-permissions` rather than from a status check made
 * here — otherwise this file becomes a third place with an opinion about when
 * an invoice is still open.
 */
export function InvoiceLines({
  lines,
  editable,
  lockedHint,
  onChange,
  onAdd,
  onRemove,
  className,
}: {
  lines: InvoiceLine[];
  editable: boolean;
  /** Why it cannot be edited, when it cannot — shown under the heading. */
  lockedHint?: string;
  onChange: (index: number, patch: Partial<InvoiceLine>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  className?: string;
}) {
  const t = useTranslations('admin.invoice');

  return (
    <Card pad="none" className={className}>
      <CardHeader
        className="p-card"
        title={t('linesTitle')}
        description={editable ? t('editHint') : lockedHint}
        actions={
          editable ? (
            <Button variant="secondary" size="sm" onClick={onAdd}>
              <Plus className="size-4" aria-hidden />
              {t('addLine')}
            </Button>
          ) : undefined
        }
      />
      <div className="overflow-x-auto border-t border-line-subtle">
        <table className="w-full min-w-xl border-collapse text-left">
          <thead>
            <tr className="border-b border-line-subtle">
              <th scope="col" className="label-type px-card py-2.5 font-medium text-ink-tertiary">
                {t('colDescription')}
              </th>
              <th scope="col" className="label-type px-3 py-2.5 text-right font-medium text-ink-tertiary">
                {t('colQuantity')}
              </th>
              <th scope="col" className="label-type px-3 py-2.5 text-right font-medium text-ink-tertiary">
                {t('colUnit')}
              </th>
              <th scope="col" className="label-type px-card py-2.5 text-right font-medium text-ink-tertiary">
                {t('colTotal')}
              </th>
              {editable && <th scope="col" className="w-12" />}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              /*
               * Keyed by position, not by label.
               *
               * It used to be `${line.label}-${index}`, which changes on every
               * keystroke in the description cell — React then discards the
               * input and mounts a new one, and the caret jumps to the end
               * after each letter typed. The index alone is stable, and it is
               * also the identity the store's own line mutators use.
               */
              <tr key={index} className="border-b border-line-subtle last:border-0">
                <td className="px-card py-row">
                  {editable ? (
                    <Input
                      dense
                      value={line.label}
                      placeholder={t('linePlaceholder')}
                      aria-label={t('colDescription')}
                      onChange={(e) => onChange(index, { label: e.target.value })}
                    />
                  ) : (
                    line.label
                  )}
                </td>
                <td className="px-3 py-row text-right">
                  {editable ? (
                    <Quantity
                      value={line.quantity}
                      onChange={(quantity) => onChange(index, { quantity })}
                    />
                  ) : (
                    <span data-numeric className="text-ink-secondary">
                      {line.quantity}
                    </span>
                  )}
                </td>
                <td className="px-3 py-row text-right">
                  {editable ? (
                    <NumberCell
                      value={line.unitPrice}
                      label={t('colUnit')}
                      onChange={(unitPrice) => onChange(index, { unitPrice })}
                    />
                  ) : (
                    <Money amount={line.unitPrice} emphasis="quiet" />
                  )}
                </td>
                <td className="px-card py-row text-right">
                  <Money amount={line.quantity * line.unitPrice} />
                </td>
                {editable && (
                  <td className="pr-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('removeLine')}
                      /* Disabled rather than dropped on the last line: an
                         invoice with no positions is a bill for nothing, and a
                         button that disappears one row before you need it
                         reads as a rendering fault. */
                      disabled={lines.length === 1}
                      onClick={() => onRemove(index)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-line-subtle p-card">
        <p className="flex items-baseline justify-between gap-4">
          <span className="font-medium">{t('total')}</span>
          <Money amount={linesTotal(lines)} emphasis="strong" className="text-2xl" />
        </p>
        <p className="mt-1 text-right text-xs text-ink-tertiary">{t('noVat')}</p>
      </div>
    </Card>
  );
}

/**
 * A quantity with its two buttons.
 *
 * "Bill one hour less" had exactly one answer: select the cell and retype the
 * number. Fine at a desk, hostile on the phone the owner actually carries —
 * a numeric keypad thrown over a table, for an edit that is almost always ±1.
 * The field stays, because 2.5 hours is typed rather than stepped.
 *
 * Half-hours are the step, since every hourly line in the catalogue is quoted
 * in them. Never below zero: a negative quantity is a credit note, and that is
 * a document this prototype does not have.
 */
function Quantity({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useTranslations('admin.invoice');
  /* Rounded to the half after adding, so a line typed as 1.3 steps to 2 rather
     than to 1.8 and stays off the grid for ever. */
  const step = (by: number) => onChange(Math.max(0, Math.round((value + by) * 2) / 2));

  return (
    <span className="inline-flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('quantityDown')}
        disabled={value <= 0}
        onClick={() => step(-0.5)}
      >
        <Minus className="size-4" aria-hidden />
      </Button>
      <NumberCell
        value={value}
        label={t('colQuantity')}
        className="w-16 text-center"
        onChange={onChange}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('quantityUp')}
        onClick={() => step(0.5)}
      >
        <Plus className="size-4" aria-hidden />
      </Button>
    </span>
  );
}

/**
 * A number cell that survives being cleared.
 *
 * `Number(e.target.value) || 0` is used across the admin forms, and it means
 * selecting a price and pressing backspace to retype it writes 0 to the live
 * record between keystrokes. On a settings screen that silently zeroes the
 * Saturday surcharge; here it zeroes a line on a real invoice. Empty is held
 * as empty and only committed as a number once it parses.
 *
 * Not `NumberField`, which does the same job with `type="number"`: the spinner
 * a number input draws would sit beside the two buttons above and offer the
 * same action a third time, in a control a phone keyboard cannot reach.
 */
function NumberCell({
  value,
  label,
  className,
  onChange,
}: {
  value: number;
  label: string;
  className?: string;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState<string | null>(null);

  return (
    <Input
      dense
      inputMode="decimal"
      aria-label={label}
      className={className ?? 'text-right'}
      value={text ?? String(value)}
      onChange={(e) => {
        setText(e.target.value);
        const parsed = Number(e.target.value);
        if (e.target.value.trim() !== '' && Number.isFinite(parsed)) onChange(parsed);
      }}
      onBlur={() => setText(null)}
    />
  );
}
