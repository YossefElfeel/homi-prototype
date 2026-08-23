/**
 * A display headline, already broken into lines and split by colour.
 *
 * Two decisions live in the copy rather than in the component, and both are
 * forced by this direction:
 *
 * · **Where the line breaks.** Headings are set in Bebas caps at up to 88px on
 *   an interior page. At that size the browser's wrap points are wrong often
 *   enough to matter, and in German it will hyphenate a compound
 *   (*Umzugs-reinigung*) across two lines of capitals. Each line also rises out
 *   of its own clipping mask, so an automatic wrap would clip mid-line.
 *
 * · **Which half is red.** Every display headline here is two colours — navy
 *   states the thing, red carries the half with the feeling. Which words those
 *   are is a writing decision, not a slice index.
 *
 * `lead` is navy on light ground and white on dark; `accent` is red.
 */
export interface HeadlineLine {
  lead?: string;
  accent?: string;
}

/**
 * Reads a `lines` array out of a message file.
 *
 * next-intl hands back `unknown` from `raw()`, and these arrays are the one
 * place the message shape is not a plain string — so a bad edit would be a
 * runtime crash on a live page rather than a type error. A heading that
 * renders empty is bad; a heading that throws is worse.
 */
export function headlineLines(value: unknown): HeadlineLine[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (line): line is HeadlineLine =>
      typeof line === 'object' && line !== null && ('lead' in line || 'accent' in line),
  );
}

/** The whole heading as one sentence, for assistive tech. */
export function spokenHeadline(lines: HeadlineLine[]) {
  return lines.map((l) => [l.lead, l.accent].filter(Boolean).join(' ')).join(' ');
}
