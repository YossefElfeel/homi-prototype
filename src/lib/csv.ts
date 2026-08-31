/**
 * A table, as a file the bookkeeper can open.
 *
 * `lib/pdf.ts` already hands the browser a real document, and it says plainly
 * what it will not do: one page, no typesetting, no second page. That is the
 * right tool for a CV and the wrong one for a list — twenty invoices run off
 * the bottom of an A4 and the rows that fall off do so silently, which is the
 * one failure mode a finance export must not have.
 *
 * So a list downloads as CSV. It is also what the file is *for*: the office
 * does not read the export, it opens it in a spreadsheet next to the bank
 * statement. `downloadBlob` in `pdf.ts` is shared — the part that hands a file
 * over is the same either way.
 */

/**
 * Excel needs telling, and on this market it needs telling twice.
 *
 * A German Windows Excel splits on `;`, not `,` — a comma-separated file opens
 * as one column per row and looks like the export is broken. And without the
 * BOM it reads the bytes as the system codepage, so «Bürolokal» arrives as
 * «BÃ¼rolokal». Both are one-line fixes that are invisible until somebody
 * double-clicks the file, which is not something a typecheck will catch.
 */
const DELIMITER = ';';
const BOM = '﻿';

/**
 * `;` and `"` and newlines all end a field, and a leading `=` or `+` makes
 * Excel treat the cell as a formula — which is how a note beginning with a
 * minus sign becomes `#NAME?`. Quoting handles the first three; the apostrophe
 * handles the last, and it is the convention a spreadsheet already understands
 * as "this is text".
 */
function cell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const text = String(value);
  const escaped = text.replace(/"/g, '""');
  const risky = /^[=+\-@]/.test(text);
  return `"${risky ? `'${escaped}` : escaped}"`;
}

export function buildCsv(headers: string[], rows: (string | number | undefined | null)[][]): Blob {
  const lines = [headers, ...rows].map((row) => row.map(cell).join(DELIMITER));
  /* CRLF, because that is what a spreadsheet on this market writes and reads,
     and a bare LF makes some versions treat the whole file as one row. */
  return new Blob([BOM + lines.join('\r\n') + '\r\n'], {
    type: 'text/csv;charset=utf-8',
  });
}

/**
 * `rechnungen-2026-08-31.csv`.
 *
 * Dated, because the export is a snapshot and two of them in a downloads
 * folder with the same name are two files nobody can tell apart. The date is
 * built from the demo clock the caller passes, not from `Date.now()` — pinning
 * the date in the demo bar and downloading has to produce the file that
 * matches what is on screen.
 */
export function exportFilename(stem: string, at: Date): string {
  const iso = at.toISOString().slice(0, 10);
  return `${stem}-${iso}.csv`;
}
