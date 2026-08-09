/**
 * German text-expansion stress mode.
 *
 * The screen-map risk table names late translation as the single most common
 * cause of rework: German runs 20–35% longer than English and breaks layouts
 * that were only ever tested in English. This grows every string by roughly
 * that much using real German morphemes, so wrapping, ellipsis and hyphenation
 * behave the way they will in production — and it breaks *while we build*
 * instead of after handoff.
 *
 * Driven by a cookie so server and client render identically (no hydration
 * mismatch, no flash of un-stressed text).
 */

const MORPHEMES = ['ungs', 'lich', 'keits', 'schaft', 'ver', 'heits'] as const;

/** Target growth over the original string length. */
const TARGET_GROWTH = 1.32;

/** Tokens carrying ICU syntax or markup must survive untouched. */
const PROTECTED = /[{}<>#]/;

function expandWord(word: string, seed: number): string {
  if (word.length < 4 || PROTECTED.test(word)) return word;
  const morpheme = MORPHEMES[seed % MORPHEMES.length]!;
  // Insert before the final character so capitalisation and most punctuation
  // stay where they were.
  return word.slice(0, -1) + morpheme + word.slice(-1);
}

export function stressString(value: string): string {
  if (!value || PROTECTED.test(value)) return value;

  const target = value.length * TARGET_GROWTH;
  const words = value.split(' ');
  const out = [...words];
  let seed = 0;

  for (let i = 0; i < words.length && out.join(' ').length < target; i += 1) {
    out[i] = expandWord(words[i]!, seed);
    seed += 1;
  }

  // Very short strings ("OK", "Ja") can't grow by word expansion — the layout
  // risk there is real too, so lengthen them directly.
  const grown = out.join(' ');
  if (grown.length < target) {
    return grown + MORPHEMES[0];
  }
  return grown;
}

function walk(value: unknown): unknown {
  if (typeof value === 'string') return stressString(value);
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) out[key] = walk(item);
    return out;
  }
  return value;
}

/** Structure-preserving: nesting, arrays and non-string leaves all survive. */
export function stressMessages<T>(messages: T): T {
  return walk(messages) as T;
}
