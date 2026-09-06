import type { BlogPost, BlogSection, BlogStatus } from '@/mock/schema';
import type { Locale } from '@/i18n/routing';

/**
 * The Ratgeber's rules, in one place.
 *
 * Same argument as `service-catalogue.ts`: the moment two screens each decide
 * for themselves what "published" means, one of them is wrong and no type will
 * say which. The public index, the article route, the sitemap and the admin
 * list all ask these four questions, and they ask them here.
 */

export const BLOG_STATUSES: BlogStatus[] = ['draft', 'published'];

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
  const words = post.sections.reduce((total, section) => {
    const heading = textFor(section.heading, locale);
    const body = listFor(section.paragraphs, locale).join(' ');
    return total + `${heading} ${body}`.trim().split(/\s+/).filter(Boolean).length;
  }, 0);
  return Math.max(1, Math.round(words / 200));
}

/**
 * Which languages this post is actually written in.
 *
 * The admin list prints the gap the same way the catalogue does. A post whose
 * English is missing still *renders* in English — §20.6 hands the reader the
 * German — so the gap is invisible on the website by design and has to be
 * counted somewhere the office looks.
 *
 * A language counts as written only when the title, the excerpt and every
 * section heading are there. A half-translated article is worse than an
 * untranslated one: the reader gets an English headline and German body and
 * concludes the site is broken rather than that the piece is not translated.
 */
export function missingLocales(post: BlogPost, locales: readonly Locale[]): Locale[] {
  return locales.filter((locale) => {
    if (!post.title[locale]?.trim()) return true;
    if (!post.excerpt[locale]?.trim()) return true;
    return post.sections.some((section) => !section.heading[locale]?.trim());
  });
}

/** A blank section, for the editor's «Abschnitt hinzufügen». */
export function emptySection(index: number): BlogSection {
  return {
    id: `sec_${Date.now().toString(36)}_${index}`,
    heading: {},
    paragraphs: {},
  };
}

/**
 * The pictures a post may use.
 *
 * A fixed list of what is already in `/public/img`, because there is no upload
 * in this prototype and a file input that writes nowhere is a control that
 * lies. Naming them here rather than reading the directory keeps the choice a
 * decision — the avatars and the logo are in that folder too, and neither
 * belongs at the top of an article.
 */
export const BLOG_IMAGES: string[] = [
  '/img/hero.webp',
  '/img/service-1.webp',
  '/img/service-2.webp',
  '/img/service-3.webp',
];
