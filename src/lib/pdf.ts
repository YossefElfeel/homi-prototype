/**
 * A PDF writer, in about a hundred lines and with no dependency.
 *
 * The prototype had one answer for every "download as PDF" in the product:
 * `toast.info('no file is generated yet')`. That is honest on an invoice,
 * where the document is the whole point and a stand-in would be worse than
 * nothing. It is not honest on an applicant's CV, because the question that
 * screen has to answer is whether the button hands you a file at all — and a
 * toast cannot answer it. Pulling in a PDF library to find out would be a
 * dependency the rest of the app never uses.
 *
 * So this writes the smallest real PDF: one page, Helvetica, WinAnsi. The
 * bytes it produces open in Preview, Acrobat and every browser viewer. What
 * it deliberately does not do is typeset — no font metrics, no images, no
 * second page. A document that needs any of those needs a real library, and
 * this file should not grow into one.
 */

/**
 * One paragraph of the page — it may wrap onto several lines. `size` is the
 * point size; `lead` is the extra gap left *after* it, on top of the line
 * spacing, so a heading can breathe without a blank entry in the list.
 */
export interface PdfLine {
  text: string;
  size?: number;
  lead?: number;
}

/**
 * Helvetica's WinAnsi encoding stops at byte 255, and the applicant names in
 * this market do not — Petrović and Şahin are ordinary here. Decomposing and
 * dropping the combining marks turns those into `Petrovic` and `Sahin` rather
 * than into the blank boxes a raw byte cast would produce. Anything still
 * outside the range becomes `?`, which at least reads as "a character was
 * lost" instead of silently shifting the rest of the line.
 */
function toWinAnsi(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^ -ÿ]/g, '?');
}

/** `(`, `)` and `\` end or escape a PDF string literal, so they cannot travel raw. */
function escapeText(text: string): string {
  return toWinAnsi(text).replace(/([\\()])/g, '\\$1');
}

const PAGE_WIDTH = 595; // A4 at 72 dpi
const PAGE_HEIGHT = 842;
const MARGIN = 64;

/**
 * Wrapping without font metrics.
 *
 * Helvetica's average glyph is a little under half its point size, so a run
 * of `n` characters at `size` points is roughly `n * size / 2` wide. That is
 * too wide for a line of commas and too narrow for a line of capital Ws, and
 * it is still worth doing: without it a caller has to hand-tune every string
 * to the page width, and the first translator to write a longer sentence
 * pushes it off the right edge with nothing to show that it happened.
 */
function wrap(text: string, size: number): string[] {
  const budget = Math.floor((PAGE_WIDTH - 2 * MARGIN) / (size * 0.5));
  const out: string[] = [];
  let line = '';

  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > budget && line) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  return line ? [...out, line] : out;
}

/**
 * The xref table addresses every object by its byte offset from the start of
 * the file, so the file has to be assembled as bytes and measured as bytes.
 * It is built as latin1 for that reason: after `toWinAnsi` every code point
 * is one byte, so `string.length` is the offset the table needs. Written as
 * UTF-8 an umlaut would take two bytes, every offset past it would be short,
 * and the reader would reject the file.
 */
export function buildTextPdf(lines: PdfLine[]): Blob {
  let y = PAGE_HEIGHT - MARGIN;
  const drawn: string[] = [];

  for (const line of lines) {
    const size = line.size ?? 11;
    /* An empty `text` is a deliberate blank line and `wrap` returns nothing
       for it, so the gap still has to be taken off `y`. */
    for (const piece of wrap(line.text, size)) {
      drawn.push(`BT /F1 ${size} Tf ${MARGIN} ${y} Td (${escapeText(piece)}) Tj ET`);
      y -= size * 1.35;
    }
    y -= line.lead ?? size * 0.6;
  }

  const content = drawn.join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      '/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];

  let file = '%PDF-1.4\n';
  const offsets: number[] = [];

  objects.forEach((body, i) => {
    offsets.push(file.length);
    file += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const startxref = file.length;
  /* Every xref entry is exactly twenty bytes wide — that is what makes the
     table seekable, and a missing trailing space silently breaks it. */
  file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    file += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  file += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  file += `startxref\n${startxref}\n%%EOF\n`;

  const bytes = new Uint8Array(file.length);
  for (let i = 0; i < file.length; i += 1) bytes[i] = file.charCodeAt(i) & 0xff;

  return new Blob([bytes], { type: 'application/pdf' });
}

/**
 * Hands the file to the browser and lets go of it again.
 *
 * Without the `revokeObjectURL` the blob stays alive for the life of the
 * document, which on a screen where you open five applicants in a row and
 * download three attachments from each is a leak you can watch grow.
 */
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
