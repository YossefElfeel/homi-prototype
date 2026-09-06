import type { BlogBlock, BlogBlockKind, BlogPost, BlogStatus } from '@/mock/schema';
import type { Locale } from '@/i18n/routing';

/**
 * The blog's rules, in one place.
 *
 * Same argument as `service-catalogue.ts`: the moment two screens each decide
 * for themselves what "published" means, one of them is wrong and no type will
 * say which. The public index, the article route, the sitemap and the admin
 * list all ask these questions, and they ask them here.
 */

export const BLOG_STATUSES: BlogStatus[] = ['draft', 'published'];

/** Every kind, in the order the «add a block» menu offers them. */
export const BLOG_BLOCK_KINDS: BlogBlockKind[] = [
  'paragraph',
  'heading',
  'list',
  'numbered',
  'quote',
  'image',
  'cta',
];

/**
 * Whether a visitor may see it.
 *
 * A date as well as a status, deliberately. `publishedAt` survives a post
 * being pulled back to a draft — «im März veröffentlicht, im Mai
 * zurückgezogen» is a fact about the article — so a post could carry a
 * publication date and not be on sale. Reading the status alone is the whole
 * rule; the date is only ever printed.
 */
export function isPublished(post: BlogPost): boolean {
  return post.status === 'published';
}

/**
 * The posts a visitor gets, newest first.
 *
 * Sorted by `publishedAt` and not by `updatedAt`: fixing a typo in a two-year
 * old article must not throw it back to the top of the index, which is what an
 * "updated" sort does and is how a blog ends up looking like it only ever
 * writes about one thing.
 */
export function publishedPosts(posts: BlogPost[]): BlogPost[] {
  return posts
    .filter(isPublished)
    .slice()
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

export function postBySlug(posts: BlogPost[], slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}

/**
 * German where a translation is missing — §20.6, applied to the record rather
 * than to the dictionary.
 *
 * Returns an empty string rather than `undefined` for a post that has neither,
 * because every caller is putting this straight into JSX and `undefined` there
 * is a silent blank where a missing translation should be visible as one.
 */
export function textFor(
  field: Partial<Record<Locale, string>> | undefined,
  locale: Locale,
): string {
  return field?.[locale] ?? field?.de ?? '';
}

export function listFor(
  field: Partial<Record<Locale, string[]>> | undefined,
  locale: Locale,
): string[] {
  return field?.[locale] ?? field?.de ?? [];
}

/**
 * Everything in a block that is words, as one string.
 *
 * Used for counting and for the gap check, never for rendering — the renderer
 * needs to know which words were a heading. Kept here rather than inline in
 * both callers so a new block kind is added in one place; forgetting it in
 * this function makes an article read shorter than it is, which nothing else
 * would catch.
 */
export function blockText(block: BlogBlock, locale: Locale): string {
  return [
    textFor(block.text, locale),
    listFor(block.items, locale).join(' '),
    textFor(block.attribution, locale),
    textFor(block.label, locale),
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * How long it takes to read, in minutes.
 *
 * Computed, never stored. A reading time on the record is a number that goes
 * stale the first time somebody adds a paragraph and nobody remembers to
 * change it — and it is the kind of staleness no screen can detect, because
 * "6 min" is a plausible answer for any article.
 *
 * 200 words a minute is the usual figure for German prose, and the floor is
 * one: «0 Min. Lesezeit» on a short post reads as a rendering fault.
 */
export function readingMinutes(post: BlogPost, locale: Locale): number {
  const words = post.blocks.reduce(
    (total, block) => total + blockText(block, locale).split(/\s+/).filter(Boolean).length,
    0,
  );
  return Math.max(1, Math.round(words / 200));
}

/**
 * Which languages this post is actually written in.
 *
 * A language counts as written only when the title, the excerpt and every
 * block that carries words carry them. A half-translated article is worse than
 * an untranslated one: the reader gets an English headline over German
 * paragraphs and concludes the site is broken rather than that the piece is
 * not translated.
 *
 * An `image` block with no alt text in a language is not a gap in that
 * language — it is a gap full stop, and the editor flags it on the block
 * rather than on the tab, so a picture nobody described does not make English
 * look untranslated.
 */
export function missingLocales(post: BlogPost, locales: readonly Locale[]): Locale[] {
  return locales.filter((locale) => {
    if (!post.title[locale]?.trim()) return true;
    if (!post.excerpt[locale]?.trim()) return true;
    return post.blocks.some((block) => {
      if (block.kind === 'image') return false;
      return !blockText(block, locale);
    });
  });
}

/** A new block of a given kind, ready for the editor. */
export function emptyBlock(kind: BlogBlockKind): BlogBlock {
  const id = `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  if (kind === 'list' || kind === 'numbered') return { id, kind, items: {} };
  if (kind === 'image') return { id, kind };
  if (kind === 'heading') return { id, kind, text: {}, level: 2 };
  if (kind === 'cta') return { id, kind, text: {}, label: {}, href: '/anfrage' };
  return { id, kind, text: {} };
}

/**
 * The pictures a post may use.
 *
 * A fixed list of what is already in `/public/img`, because there is no upload
 * in this prototype and a file input that writes nowhere is a control that
 * lies. Naming them here rather than reading the directory keeps the choice a
 * decision — the avatars and the logo are in that folder too, and neither
 * belongs in the middle of an article.
 */
export const BLOG_IMAGES: string[] = [
  '/img/hero.webp',
  '/img/service-1.webp',
  '/img/service-2.webp',
  '/img/service-3.webp',
];

/* ---- inline marks ------------------------------------------------------ */

/**
 * The three marks a writer can put inside a paragraph, and nothing else.
 *
 * `**fett**`, `*kursiv*`, `[Wort](/pfad)`. They exist because a blog
 * without a bold phrase or a link to the service it is about is a wall, and a
 * full rich-text surface was the other way to get them — which would have made
 * the stored value one HTML blob per language and given up knowing which half
 * of a translation is missing.
 *
 * The writer never types them: the toolbar wraps the selection. They are a
 * storage format that happens to be legible, not a syntax anybody is asked to
 * learn — which is the distinction that made markdown the wrong answer here.
 */
export type Mark =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'italic'; text: string }
  | { kind: 'link'; text: string; href: string };

/* Ordered: the bold pattern has to be tried before the italic one, or `**x**`
   matches as an italic wrapping `*x*`. */
const MARK_PATTERN = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Splits a stored string into marks.
 *
 * Deliberately forgiving: anything that is not one of the three patterns is
 * text, including a stray asterisk. A parser that threw on «5 * 3 Stunden»
 * would take down a published page over a multiplication sign.
 *
 * Link targets are restricted to this site — a path beginning `/`. An article
 * is written by the office, so this is not a sanitiser against an attacker; it
 * is a guard against `javascript:` arriving by paste, and against the panel
 * quietly becoming a way to publish outbound links nobody reviewed.
 */
export function parseMarks(input: string): Mark[] {
  const out: Mark[] = [];
  let last = 0;

  for (const match of input.matchAll(MARK_PATTERN)) {
    const at = match.index ?? 0;
    if (at > last) out.push({ kind: 'text', text: input.slice(last, at) });

    if (match[1] !== undefined) out.push({ kind: 'bold', text: match[1] });
    else if (match[2] !== undefined) out.push({ kind: 'italic', text: match[2] });
    else if (match[3] !== undefined && match[4] !== undefined) {
      const href = match[4];
      if (href.startsWith('/')) out.push({ kind: 'link', text: match[3], href });
      /* Not a link, and not silently dropped either — the words stay, because
         losing a sentence is worse than losing its underline. */
      else out.push({ kind: 'text', text: match[3] });
    }

    last = at + match[0].length;
  }

  if (last < input.length) out.push({ kind: 'text', text: input.slice(last) });
  return out;
}

/** Wraps a selection in a mark, for the editor's toolbar. */
export function applyMark(
  value: string,
  start: number,
  end: number,
  mark: 'bold' | 'italic' | 'link',
  href = '/anfrage',
): { value: string; caret: number } {
  const selected = value.slice(start, end);
  /* Nothing selected is not nothing to do: the writer pressed a formatting
     button meaning "start writing in bold", so the marks go in with the caret
     between them. */
  const inner = selected || '';
  const wrapped =
    mark === 'bold' ? `**${inner}**` : mark === 'italic' ? `*${inner}*` : `[${inner}](${href})`;

  return {
    value: value.slice(0, start) + wrapped + value.slice(end),
    caret: start + wrapped.length - (mark === 'link' ? href.length + 3 : mark === 'bold' ? 2 : 1),
  };
}
