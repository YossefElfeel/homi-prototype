/**
 * Every word on the website, as an editable record.
 *
 * The prototype had three different answers to "who writes this sentence?" and
 * none of them was the owner. Interface copy lived in `src/messages`, editorial
 * copy in `src/content`, and the catalogue's own names and prices in the store —
 * so the admin panel could change what a service *costs* and not what its page
 * *says*. `content/services.ts` has carried a comment since wave 1 promising
 * that its lead paragraphs and FAQs would be «editable per language on the
 * admin Leistungen screen (§17.2)». They were not. This is that screen's
 * source of truth.
 *
 * **It is filed by page, not by file.** The first version of this registry had
 * one surface per top-level message namespace — `site`, `booking`, `offer`,
 * `admin` — which is how the dictionaries are stored and is nobody's idea of
 * where a sentence lives. «Wo steht der Text auf der Preisseite» has an obvious
 * answer and `site` was not it. Each surface below is a place a reader can
 * *open in a browser*, and it collects every source that feeds that place:
 * the dictionary keys, the editorial file, and the display headlines, which
 * were three different files for one page.
 *
 * Three more things it deliberately is:
 *
 *  · **A catalogue, not a copy.** Every field's default still comes from the
 *    file or dictionary that owned it before. Nothing was moved out of
 *    `src/messages` or `src/content`, so a developer reading the code still
 *    finds the German next to the component that renders it, and a string this
 *    registry has never heard of still renders.
 *  · **A diff, not a snapshot.** `ContentEdit` in the store holds only what
 *    somebody changed. Copying four thousand strings into localStorage at
 *    first paint would make «zurücksetzen» impossible to define and the store
 *    impossible to read.
 *  · **Honest about locale.** §20.6 makes German the fallback for everything,
 *    which means a missing English string is invisible on the site — it just
 *    renders German. `resolveContent` reports *why* a value is what it is, so
 *    the editor can show a gap instead of a sentence that looks fine.
 *
 * And one thing it refuses to be: a list of fields that edit nothing. Two
 * blocks in `content/landing.ts` — the plan tiers and the coverage towns — are
 * dead copy, overtaken by the store's own `plans` and `regions`. They are not
 * offered here. A CMS whose fields do not all reach the page is worse than a
 * smaller one, because the reader cannot tell which half is which.
 *
 * What it is not: a live feed to the marketing site. /leistungen, /gebiete and
 * the homepage are statically rendered, so an edit here is the copy the *next
 * build* ships. That is the same boundary §17.2b already draws for add-ons,
 * and it is why the screen offers an export rather than pretending.
 */

import { de as deMessages, en as enMessages } from '@/messages';
import { contact, landingContent, type Content, type HeadlinePart } from '@/content/landing';
import { getServiceContent } from '@/content/services';
import { getCareersContent } from '@/content/careers';
import { LEGAL_SLUGS, getLegalDocument } from '@/content/legal';
import { WORK_PHOTOS } from '@/content/bau';
import { SERVICE_SLUGS } from '@/mock/schema';
import type {
  ContentEdit,
  ContentHeadlinePart,
  ContentKind,
  ContentQA,
  ContentValue,
  Service,
  ServiceSlug,
} from '@/mock/schema';
import { isOffered, publicHref } from '@/lib/service-catalogue';
import { routing, type Locale } from '@/i18n/routing';

/* ---- the shape of the catalogue -------------------------------------- */

/**
 * Which board a surface belongs to.
 *
 * Four of the five are places on the website. `system` is the fifth and is
 * separated because its strings are not *on* a page — they are the words the
 * product says everywhere at once, and changing one changes forty screens.
 * Somebody rewriting the About page should not have to scroll past them.
 */
export type ContentGroup = 'pages' | 'services' | 'legal' | 'flows' | 'system';

/** Whether a reader can see this text without signing in. */
export type ContentScope = 'site' | 'panel';

export interface ContentField {
  key: string;
  kind: ContentKind;
  /**
   * What to call it on screen.
   *
   * A message key under `admin.website.fields` for the editorial blocks, whose
   * names are worth writing («Was nicht dazugehört»). For a dictionary string
   * it is `null` and the dotted key is the label — inventing a German name for
   * `site.services.includedTitle` would be a second name for the same thing,
   * and the dotted one is the one a developer can search for.
   */
  labelKey: string | null;
  /** Shown under the label. The dotted key, or where on the page it lands. */
  hint: string;
  /**
   * The two halves of a paired entry, for `kind: 'qa'`.
   *
   * Defaults to question/answer. The careers steps are title/body pairs with
   * the same shape and a different meaning, and labelling them «Frage» would
   * be a lie on the one screen whose job is to be read.
   */
  pairKeys?: { first: string; second: string };
  /**
   * The last segment of the dotted key, for a label when there is no written
   * one — `title`, `lead`, `emptyBody`.
   *
   * The screen used to print the whole dotted path as the field's name, which
   * turned an editor's page into 87 rows reading «site.pricing.title». There
   * are 999 distinct segments across the site-facing dictionary and 859 of
   * them occur exactly once, so hand-naming every one is not a thing anybody
   * will keep up to date; naming the ~70 that carry most of the volume, and
   * deriving the rest, is. The full path stays underneath either way, because
   * it is the only name a developer can grep for.
   */
  tail?: string;
  /**
   * The path between the surface and the field, so the editor can put a
   * heading above each group — `meta`, `hero`, `table`, `faq`.
   *
   * `null` for a field that sits directly on the surface. Dictionary order is
   * already grouped, so rendering a heading whenever this changes needs no
   * sorting and survives paging.
   */
  section?: string | null;
  defaults: Partial<Record<Locale, ContentValue>>;
}

export interface ContentSurface {
  id: string;
  group: ContentGroup;
  scope: ContentScope;
  /**
   * The name, when the surface takes it from a record — a service, a legal
   * document. `null` means the name is written copy and lives in `nameKey`.
   */
  name: string | null;
  /** A key under `admin.website.surfaces`, for the surfaces that are not records. */
  nameKey: string | null;
  /**
   * The route this copy renders on, with a real id in it — never `[slug]`.
   * `null` where the copy is spread across the whole product (buttons, status
   * words, errors) and there is no one page to send somebody to.
   */
  href: string | null;
  fields: ContentField[];
}

/* ---- resolving a value ----------------------------------------------- */

/**
 * Why a field reads the way it does.
 *
 * `fallback` is the state that matters and the one a plain string cannot
 * express: the English page renders German, correctly and silently, and looks
 * finished. Every count on the index is built from this.
 */
export type ContentSource = 'edited' | 'default' | 'fallback' | 'missing';

export interface ResolvedContent {
  value: ContentValue;
  source: ContentSource;
}

const EMPTY_FOR: Record<ContentKind, ContentValue> = {
  line: '',
  text: '',
  list: [],
  qa: [],
  headline: [],
};

export type ContentEdits = Record<string, ContentEdit>;

/** The store's array as a map, built once per render rather than per field. */
export function editMap(edits: ContentEdit[]): ContentEdits {
  return Object.fromEntries(edits.map((edit) => [edit.key, edit]));
}

export function resolveContent(
  field: ContentField,
  locale: Locale,
  edits: ContentEdits,
): ResolvedContent {
  const edited = edits[field.key]?.values[locale];
  if (edited !== undefined) return { value: edited, source: 'edited' };

  const own = field.defaults[locale];
  if (own !== undefined) return { value: own, source: 'default' };

  /* §20.6 — German carries everything that has not been translated, and an
     edited German is what the site would fall back *to*, so the edit has to
     win here as well. Reading the file default instead would show the editor
     a sentence the site no longer renders. */
  const german = edits[field.key]?.values.de ?? field.defaults.de;
  if (german !== undefined) return { value: german, source: 'fallback' };

  return { value: EMPTY_FOR[field.kind], source: 'missing' };
}

/** Whether a resolved value has anything in it at all. */
export function isBlank(value: ContentValue): boolean {
  if (typeof value === 'string') return value.trim() === '';
  return value.length === 0;
}

/** A field's text, flattened, for searching. */
export function contentText(value: ContentValue): string {
  if (typeof value === 'string') return value;
  return value
    .map((item) => (typeof item === 'string' ? item : Object.values(item).join(' ')))
    .join(' ');
}

export interface SurfaceCounts {
  fields: number;
  edited: number;
  /** Fields where this locale is only borrowing German. */
  gaps: number;
}

export function countSurface(
  surface: ContentSurface,
  locale: Locale,
  edits: ContentEdits,
): SurfaceCounts {
  let edited = 0;
  let gaps = 0;
  for (const field of surface.fields) {
    const resolved = resolveContent(field, locale, edits);
    if (resolved.source === 'edited') edited += 1;
    if (resolved.source === 'fallback' || resolved.source === 'missing') gaps += 1;
  }
  return { fields: surface.fields.length, edited, gaps };
}

/* ---- reading the message dictionaries -------------------------------- */

/**
 * A dictionary leaf, and what kind of editor it needs.
 *
 * `null` means "not text" and is a real answer rather than a failure. The
 * landing content carries a `counter: (i, n) => string` — a function, because
 * «Leistung 3 von 7» is two numbers in a sentence and interpolating it in the
 * copy would put a format string in front of an editor. Skipping it is the
 * honest outcome; pretending it is a text box is not.
 */
function kindOf(value: unknown): ContentKind | null {
  if (typeof value === 'string') {
    /* A paragraph gets a box that grows and a heading gets one line. The
       threshold is a guess, and the cost of guessing wrong is a slightly
       wrong-shaped input rather than a wrong string, so it stays a guess. */
    return value.includes('\n') || value.length > 90 ? 'text' : 'line';
  }
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === 'string')) return 'list';
    if (
      value.every(
        (item) =>
          item !== null && typeof item === 'object' && ('lead' in item || 'accent' in item),
      )
    ) {
      return 'headline';
    }
    if (
      value.every(
        (item) => item !== null && typeof item === 'object' && 'q' in item && 'a' in item,
      )
    ) {
      return 'qa';
    }
  }
  return null;
}

function at(source: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, key) =>
        node !== null && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined,
      source,
    );
}

interface Leaf {
  path: string;
  kind: ContentKind;
  de?: ContentValue;
  en?: ContentValue;
}

/**
 * Walks a subtree of both dictionaries at once.
 *
 * Both, rather than German and then English, because a key present in one and
 * absent in the other is the whole point of the gap count — walking them
 * separately and merging afterwards loses which side was missing.
 */
function walk(deNode: unknown, enNode: unknown, prefix: string, out: Leaf[]) {
  const kind = kindOf(deNode) ?? kindOf(enNode);
  if (kind) {
    out.push({
      path: prefix,
      kind,
      de: kindOf(deNode) ? (deNode as ContentValue) : undefined,
      en: kindOf(enNode) ? (enNode as ContentValue) : undefined,
    });
    return;
  }
  if (deNode === null || typeof deNode !== 'object' || Array.isArray(deNode)) return;

  const enObject =
    enNode !== null && typeof enNode === 'object' && !Array.isArray(enNode)
      ? (enNode as Record<string, unknown>)
      : {};

  for (const [key, child] of Object.entries(deNode as Record<string, unknown>)) {
    walk(child, enObject[key], prefix ? `${prefix}.${key}` : key, out);
  }
}

const rootCache = new Map<string, ContentField[]>();

/**
 * Every string under a dotted path in the dictionaries, as fields.
 *
 * Cached because the dictionaries are frozen imports and the panel's subtree
 * alone is 2547 leaves — rebuilding it on every keystroke in the editor's
 * search box is the difference between a list that filters and one that
 * stutters.
 */
function fieldsUnder(root: string): ContentField[] {
  const cached = rootCache.get(root);
  if (cached) return cached;

  const leaves: Leaf[] = [];
  walk(at(deMessages, root), at(enMessages, root), '', leaves);

  const fields = leaves.map((leaf) => {
    const parts = leaf.path.split('.').filter(Boolean);
    return {
      key: `ui.${root}${leaf.path ? `.${leaf.path}` : ''}`,
      kind: leaf.kind,
      labelKey: null,
      hint: `${root}${leaf.path ? `.${leaf.path}` : ''}`,
      tail: parts[parts.length - 1] ?? root.split('.').pop() ?? root,
      section: parts.length > 1 ? parts.slice(0, -1).join('.') : null,
      defaults: { de: leaf.de, en: leaf.en },
    };
  });

  rootCache.set(root, fields);
  return fields;
}

function fieldsUnderAll(roots: string[]): ContentField[] {
  return roots.flatMap(fieldsUnder);
}

/* ---- the editorial sources ------------------------------------------- */

/** Turn `{ title, body }` steps into the paired shape the `qa` editor draws. */
function asPairs(items: { title: string; body: string }[]): ContentQA[] {
  return items.map((item) => ({ q: item.title, a: item.body }));
}

/** Turn a two-colour landing heading into the shared headline shape. */
function asHeadline(parts: { navy?: string; red?: string }[]): ContentHeadlinePart[] {
  return parts.map((part) => ({ lead: part.navy, accent: part.red }));
}

/**
 * The hero heading — lines of parts, flattened to one entry per line.
 *
 * `HeadlinePart[][]` is lines, each of which is fragments carrying an
 * `outline` flag; `ContentHeadlinePart` is a line carrying a plain half and an
 * accented half. Every line in the design has at most one of each, so the two
 * shapes are the same information written twice, and this is the join. A line
 * that interleaved them — plain, outlined, plain — would lose its order here,
 * which is why the editor draws exactly two boxes per line and no more.
 */
function heroHeadline(lines: HeadlinePart[][]): ContentHeadlinePart[] {
  return lines.map((line) => ({
    lead: line
      .filter((part) => !part.outline)
      .map((part) => part.t)
      .join(' '),
    accent: line
      .filter((part) => part.outline)
      .map((part) => part.t)
      .join(' '),
  }));
}

/** One editorial field, declared with both languages at once. */
function editorial(
  key: string,
  kind: ContentKind,
  labelKey: string,
  hint: string,
  de: ContentValue | undefined,
  en: ContentValue | undefined,
  pairKeys?: { first: string; second: string },
): ContentField {
  return {
    key,
    kind,
    labelKey,
    hint,
    pairKeys,
    tail: hint.split('.').pop() ?? hint,
    section: null,
    defaults: { de, en },
  };
}

/**
 * The homepage's own copy, from `content/landing.ts`.
 *
 * This file is a verbatim clone of the approved design build, which is why it
 * sits outside the message dictionaries — and why it was the least reachable
 * copy in the product. Everything a visitor reads above the fold was here, and
 * nothing in the panel could touch a word of it.
 *
 * Two blocks are absent on purpose. `plans.items` and `coverage.items` are
 * dead: the plan tiles render from the store's `plans` and the coverage tiles
 * now render from its `regions`, so both arrays are copies nobody displays.
 * Offering them would be four fields that edit nothing.
 */
function homeFields(): ContentField[] {
  const de = landingContent('de') as Content;
  const en = landingContent('en') as Content;

  const pair = { first: 'pairTitle', second: 'pairBody' };

  return [
    editorial(
      'page.home.hero.headline',
      'headline',
      'home.heroHeadline',
      'hero.headline',
      heroHeadline(de.hero.headline),
      heroHeadline(en.hero.headline),
    ),
    editorial('page.home.hero.sub', 'text', 'home.heroSub', 'hero.sub', de.hero.sub, en.hero.sub),
    editorial(
      'page.home.hero.tags',
      'list',
      'home.heroTags',
      'hero.tags',
      de.hero.tags,
      en.hero.tags,
    ),
    editorial(
      'page.home.hero.badge',
      'list',
      'home.heroBadge',
      'hero.badge',
      [de.hero.badge.line1, de.hero.badge.line2, de.hero.badge.count],
      [en.hero.badge.line1, en.hero.badge.line2, en.hero.badge.count],
    ),
    editorial(
      'page.home.stats',
      'qa',
      'home.stats',
      'stats',
      de.stats.map((row) => ({ q: row.value, a: row.label })),
      en.stats.map((row) => ({ q: row.value, a: row.label })),
      { first: 'pairFigure', second: 'pairCaption' },
    ),
    editorial(
      'page.home.services.headline',
      'headline',
      'home.servicesHeadline',
      'services.headline',
      asHeadline(de.services.headline),
      asHeadline(en.services.headline),
    ),
    editorial(
      'page.home.services.body',
      'text',
      'home.servicesBody',
      'services.body',
      de.services.body,
      en.services.body,
    ),
    editorial(
      'page.home.services.items',
      'qa',
      'home.servicesItems',
      'services.items',
      de.services.items.map((item) => ({ q: item.name, a: item.price })),
      en.services.items.map((item) => ({ q: item.name, a: item.price })),
      { first: 'pairName', second: 'pairPrice' },
    ),
    editorial(
      'page.home.promises.headline',
      'headline',
      'home.promisesHeadline',
      'promises.headline',
      asHeadline([de.promises.headline]),
      asHeadline([en.promises.headline]),
    ),
    editorial(
      'page.home.promises',
      'qa',
      'home.promises',
      'promises.items',
      asPairs(de.promises.items),
      asPairs(en.promises.items),
      pair,
    ),
    editorial(
      'page.home.steps.headline',
      'headline',
      'home.stepsHeadline',
      'steps.headline',
      asHeadline([de.steps.headline]),
      asHeadline([en.steps.headline]),
    ),
    editorial(
      'page.home.steps',
      'qa',
      'home.steps',
      'steps.items',
      asPairs(de.steps.items),
      asPairs(en.steps.items),
      pair,
    ),
    editorial(
      'page.home.coverage.headline',
      'headline',
      'home.coverageHeadline',
      'coverage.headline',
      asHeadline([de.coverage.headline]),
      asHeadline([en.coverage.headline]),
    ),
    editorial(
      'page.home.coverage.body',
      'text',
      'home.coverageBody',
      'coverage.body',
      de.coverage.body,
      en.coverage.body,
    ),
    editorial(
      'page.home.plans.headline',
      'headline',
      'home.plansHeadline',
      'plans.headline',
      asHeadline([de.plans.headline]),
      asHeadline([en.plans.headline]),
    ),
    editorial(
      'page.home.plans.discountLabel',
      'line',
      'home.plansDiscount',
      'plans.discountLabel',
      de.plans.discountLabel,
      en.plans.discountLabel,
    ),
    editorial(
      'page.home.cta',
      'headline',
      'home.ctaHeadline',
      'cta',
      [{ lead: `${de.cta.before} `, accent: de.cta.outline }, { lead: de.cta.after }],
      [{ lead: `${en.cta.before} `, accent: en.cta.outline }, { lead: en.cta.after }],
    ),
    editorial('page.home.cta.body', 'text', 'home.ctaBody', 'cta.body', de.cta.body, en.cta.body),
    editorial(
      'page.home.testimonials.eyebrow',
      'line',
      'home.testimonialsEyebrow',
      'testimonials.eyebrow',
      de.testimonials.eyebrow,
      en.testimonials.eyebrow,
    ),
    editorial(
      'page.home.testimonials.headline',
      'line',
      'home.testimonialsHeadline',
      'testimonials.headline',
      de.testimonials.headline,
      en.testimonials.headline,
    ),
    editorial(
      'page.home.testimonials.rating',
      'line',
      'home.testimonialsRating',
      'testimonials.rating',
      de.testimonials.rating,
      en.testimonials.rating,
    ),
    /* The biggest number on the homepage. It was typed into `Testimonials.tsx`
       rather than written anywhere a person could reach — copy in a component,
       which is the one kind of content no CMS can find. */
    editorial(
      'page.home.testimonials.count',
      'line',
      'home.testimonialsCount',
      'testimonials.count',
      de.testimonials.count,
      en.testimonials.count,
    ),
    editorial(
      'page.home.testimonials.starsLabel',
      'line',
      'home.testimonialsStars',
      'testimonials.starsLabel',
      de.testimonials.starsLabel,
      en.testimonials.starsLabel,
    ),
    editorial(
      'page.home.testimonials',
      'qa',
      'home.testimonials',
      'testimonials.items',
      de.testimonials.items.map((item) => ({
        q: `${item.name} · ${item.country}`,
        a: item.quote,
      })),
      en.testimonials.items.map((item) => ({
        q: `${item.name} · ${item.country}`,
        a: item.quote,
      })),
      { first: 'pairName', second: 'pairQuote' },
    ),
    ...fieldsUnder('site.home'),
  ];
}

/**
 * The header and the footer — the copy that is on every page and belongs to
 * none of them.
 *
 * Filed as its own surface for exactly that reason. Putting the navigation
 * under «Startseite» because that is where a reader first meets it would mean
 * somebody fixing a footer typo has to guess which page owns the footer.
 */
function chromeFields(): ContentField[] {
  const de = landingContent('de') as Content;
  const en = landingContent('en') as Content;

  return [
    editorial(
      'page.chrome.nav',
      'list',
      'chrome.nav',
      'nav',
      de.nav.map((item) => item.label),
      en.nav.map((item) => item.label),
    ),
    editorial(
      'page.chrome.footer.tagline',
      'list',
      'chrome.tagline',
      'footer.tagline',
      de.footer.tagline,
      en.footer.tagline,
    ),
    editorial(
      'page.chrome.footer.services',
      'list',
      'chrome.footerServices',
      'footer.services',
      de.footer.services,
      en.footer.services,
    ),
    editorial(
      'page.chrome.footer.company',
      'list',
      'chrome.footerCompany',
      'footer.company',
      de.footer.company,
      en.footer.company,
    ),
    editorial(
      'page.chrome.footer.legal',
      'list',
      'chrome.footerLegal',
      'footer.legal',
      de.footer.legal,
      en.footer.legal,
    ),
    editorial(
      'page.chrome.footer.hours',
      'line',
      'chrome.hours',
      'footer.hours',
      de.footer.hours,
      en.footer.hours,
    ),
    editorial(
      'page.chrome.footer.copyright',
      'line',
      'chrome.copyright',
      'footer.copyright',
      de.footer.copyright,
      en.footer.copyright,
    ),
    /* The three column headings above the footer's link lists, plus the two
       lines beside them. The lists themselves were editable and their headings
       were not, which is the sort of gap that only shows up when somebody
       renames a column and cannot. */
    editorial(
      'page.chrome.footer.servicesTitle',
      'line',
      'chrome.footerServicesTitle',
      'footer.servicesTitle',
      de.footer.servicesTitle,
      en.footer.servicesTitle,
    ),
    editorial(
      'page.chrome.footer.companyTitle',
      'line',
      'chrome.footerCompanyTitle',
      'footer.companyTitle',
      de.footer.companyTitle,
      en.footer.companyTitle,
    ),
    editorial(
      'page.chrome.footer.supportTitle',
      'line',
      'chrome.footerSupportTitle',
      'footer.supportTitle',
      de.footer.supportTitle,
      en.footer.supportTitle,
    ),
    editorial(
      'page.chrome.footer.social',
      'line',
      'chrome.footerSocial',
      'footer.social',
      de.footer.social,
      en.footer.social,
    ),
    editorial(
      'page.chrome.footer.madeIn',
      'line',
      'chrome.madeIn',
      'footer.madeIn',
      de.footer.madeIn,
      en.footer.madeIn,
    ),
    /*
     * The telephone number, the mobile and the address the site is contacted
     * on. They are the same in both languages — one business, one number — so
     * they are declared once and the English column borrows the German, which
     * is what §20.6 does for everything else and is honest here rather than a
     * gap: a phone number is not untranslated, it is the same.
     */
    editorial('page.chrome.contact.phone', 'line', 'chrome.phone', 'contact.phone', contact.phone, contact.phone),
    editorial('page.chrome.contact.mobile', 'line', 'chrome.mobile', 'contact.mobile', contact.mobile, contact.mobile),
    editorial('page.chrome.contact.email', 'line', 'chrome.email', 'contact.email', contact.email, contact.email),
    /* The twelve button labels the landing direction carries of its own. They
       keep their dotted names: «actions.comparePlans» is what the button is
       called in the code and inventing a German noun for it would be a second
       name for one string. */
    ...(Object.keys(de.actions) as (keyof Content['actions'])[]).map((name) =>
      editorial(
        `page.chrome.actions.${name}`,
        'line',
        '',
        `actions.${name}`,
        de.actions[name],
        en.actions[name],
      ),
    ),
    ...fieldsUnderAll(['nav', 'footer', 'brand']),
  ].map((field) => (field.labelKey === '' ? { ...field, labelKey: null } : field));
}

function careersFields(): ContentField[] {
  const de = getCareersContent('de');
  const en = getCareersContent('en');

  return [
    editorial(
      'page.careers.how',
      'qa',
      'careers.how',
      'how',
      asPairs(de.how),
      asPairs(en.how),
      { first: 'pairTitle', second: 'pairBody' },
    ),
    editorial('page.careers.next', 'list', 'careers.next', 'next', de.next, en.next),
    ...fieldsUnderAll(['careers', 'site.display.careers']),
  ];
}

/* One field per photograph rather than one list of alt text. Alt text is a
   property of the picture, and a list would let a reorder silently move every
   description one photo to the left. */
function bauFields(): ContentField[] {
  return [
    ...WORK_PHOTOS.map((photo) =>
      editorial(
        `page.bau.${photo.slug}.alt`,
        'line',
        'bau.alt',
        photo.slug,
        photo.alt.de,
        photo.alt.en,
      ),
    ),
    ...fieldsUnderAll(['site.bau', 'site.display.bau']),
  ];
}

/**
 * A service's page copy — the block §17.2a is about.
 *
 * Built for **every** service in the catalogue, not for the seven that have
 * seeded copy. A service the owner adds has empty defaults here, which is the
 * point: the four blocks exist for it, they are visibly blank rather than
 * absent, and writing them is what turns a priced catalogue row into a page.
 * `hasPublicPage` still refuses the «auf der Website ansehen» link until the
 * next build gives that slug a route — see §17.2a on /open-questions for why
 * the two halves land in different waves.
 */
function serviceSurfaces(services: Service[], locale: Locale): ContentSurface[] {
  const seeded = new Set<string>(SERVICE_SLUGS);

  return services
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((service) => {
      const de = seeded.has(service.slug)
        ? getServiceContent(service.slug as ServiceSlug, 'de')
        : null;
      const en = seeded.has(service.slug)
        ? getServiceContent(service.slug as ServiceSlug, 'en')
        : null;

      const field = (
        name: 'lead' | 'included' | 'notIncluded' | 'faq',
        kind: ContentKind,
      ): ContentField =>
        editorial(
          `service.${service.slug}.${name}`,
          kind,
          `service.${name}`,
          name,
          de?.[name],
          en?.[name],
        );

      return {
        id: `service.${service.slug}`,
        group: 'services' as const,
        scope: 'site' as const,
        name: service.name[locale] || service.name.de || service.slug,
        nameKey: null,
        href: publicHref(service),
        /* A draft gets its four blocks like anything else. Its copy is exactly
           what somebody writes *before* switching it on, and hiding it until
           then would mean a service can only be given a page once it is
           already on sale. */
        fields: [
          field('lead', 'text'),
          field('included', 'list'),
          field('notIncluded', 'list'),
          field('faq', 'qa'),
        ],
      };
    });
}

/**
 * The three legal documents.
 *
 * Their one honest oddity is preserved rather than papered over:
 * `getLegalDocument` ignores its locale argument and returns the German
 * document for all four, because a machine-translated contract is worse than
 * none. So English shows here as a gap on every field — which is correct, and
 * is now visible instead of being a comment in a file.
 */
function legalSurfaces(): ContentSurface[] {
  return LEGAL_SLUGS.map((slug) => {
    const document = getLegalDocument(slug, 'de');
    const fields: ContentField[] = [
      editorial(`legal.${slug}.title`, 'line', 'legal.title', 'title', document.title, undefined),
      editorial(`legal.${slug}.intro`, 'text', 'legal.intro', 'intro', document.intro, undefined),
    ];

    for (const section of document.sections) {
      fields.push(
        editorial(
          `legal.${slug}.${section.id}.heading`,
          'line',
          'legal.heading',
          section.id,
          section.heading,
          undefined,
        ),
        editorial(
          `legal.${slug}.${section.id}.paragraphs`,
          'list',
          'legal.paragraphs',
          section.id,
          section.paragraphs,
          undefined,
        ),
      );
    }

    return {
      id: `legal.${slug}`,
      group: 'legal' as const,
      scope: 'site' as const,
      name: document.title,
      nameKey: null,
      href: `/rechtliches/${slug}`,
      fields,
    };
  });
}

/* ---- the board ------------------------------------------------------- */

interface SurfaceSpec {
  id: string;
  group: ContentGroup;
  scope: ContentScope;
  href: string | null;
  /** Dotted roots in the dictionaries whose strings belong to this surface. */
  roots?: string[];
  /** Editorial blocks from `src/content`, which the dictionaries do not hold. */
  extra?: () => ContentField[];
}

/**
 * Every place on the website that has words in it, in reading order.
 *
 * The routes are real and openable — `/gebiete/kuesnacht`, not
 * `/gebiete/[slug]`. A row whose «go and look» link lands on a 404 is worse
 * than a row with no link, because the reader concludes the screen is broken
 * rather than that the page is a template.
 */
const SPECS: SurfaceSpec[] = [
  /* ---- pages ---- */
  { id: 'page.home', group: 'pages', scope: 'site', href: '/', extra: homeFields },
  {
    id: 'page.chrome',
    group: 'pages',
    scope: 'site',
    href: '/',
    extra: chromeFields,
  },
  {
    id: 'page.services',
    group: 'pages',
    scope: 'site',
    href: '/leistungen',
    roots: ['site.services', 'site.display.services'],
  },
  {
    id: 'page.pricing',
    group: 'pages',
    scope: 'site',
    href: '/preise',
    roots: ['site.pricing', 'site.display.pricing'],
  },
  {
    id: 'page.plans',
    group: 'pages',
    scope: 'site',
    href: '/abos',
    roots: ['site.plans', 'site.display.plans'],
  },
  {
    id: 'page.gallery',
    group: 'pages',
    scope: 'site',
    href: '/referenzen',
    roots: ['site.gallery', 'site.display.gallery'],
  },
  {
    id: 'page.about',
    group: 'pages',
    scope: 'site',
    href: '/ueber-uns',
    roots: ['site.about', 'site.display.about'],
  },
  {
    id: 'page.contact',
    group: 'pages',
    scope: 'site',
    href: '/kontakt',
    roots: ['site.contact', 'site.display.contact'],
  },
  {
    id: 'page.regionsIndex',
    group: 'pages',
    scope: 'site',
    href: '/gebiete',
    roots: ['site.display.regionsIndex'],
  },
  {
    id: 'page.region',
    group: 'pages',
    scope: 'site',
    href: '/gebiete/kuesnacht',
    roots: ['site.regions', 'site.display.regions'],
  },
  { id: 'page.bau', group: 'pages', scope: 'site', href: '/bau', extra: bauFields },
  { id: 'page.careers', group: 'pages', scope: 'site', href: '/jobs', extra: careersFields },
  {
    id: 'page.thanks',
    group: 'pages',
    scope: 'site',
    href: '/danke',
    roots: ['site.thanks'],
  },
  {
    id: 'page.legalFrame',
    group: 'pages',
    scope: 'site',
    href: '/rechtliches/agb',
    roots: ['site.legal', 'site.display.legal'],
  },

  /* ---- the journeys ---- */
  {
    id: 'flow.booking',
    group: 'flows',
    scope: 'site',
    href: '/anfrage/leistung',
    roots: ['booking'],
  },
  { id: 'flow.offer', group: 'flows', scope: 'site', href: '/offerte/off_1', roots: ['offer'] },
  {
    id: 'flow.account',
    group: 'flows',
    scope: 'site',
    href: '/konto/anfragen',
    roots: ['account'],
  },
  { id: 'flow.field', group: 'flows', scope: 'panel', href: '/einsatz', roots: ['field'] },

  /* ---- the words that are everywhere ---- */
  {
    id: 'system.words',
    group: 'system',
    scope: 'site',
    href: null,
    roots: ['actions', 'common', 'form', 'money', 'empty', 'errors'],
  },
  { id: 'system.status', group: 'system', scope: 'site', href: null, roots: ['status'] },
  {
    id: 'system.payment',
    group: 'system',
    scope: 'site',
    href: '/konto/zahlungsmittel',
    roots: ['paymentForm'],
  },
  {
    id: 'system.panel',
    group: 'system',
    scope: 'panel',
    href: '/admin',
    roots: ['admin', 'app'],
  },
  { id: 'system.demo', group: 'system', scope: 'panel', href: null, roots: ['demo'] },
];

/**
 * Every surface, in the order the index lists them.
 *
 * Takes the catalogue rather than reading the store itself, so the same
 * function answers for a screen, for the export and for a test — and so a
 * service added in the panel appears here without this file knowing the store
 * exists.
 */
export function contentSurfaces(services: Service[], locale: Locale): ContentSurface[] {
  const declared = SPECS.map((spec) => ({
    id: spec.id,
    group: spec.group,
    scope: spec.scope,
    name: null,
    nameKey: spec.id,
    href: spec.href,
    fields: [...(spec.extra?.() ?? []), ...fieldsUnderAll(spec.roots ?? [])],
  }));

  /* Services first: they are the pages the catalogue can create and the ones
     most likely to be missing copy, and the board's own warning points at
     them. Legal sits with the pages it belongs to rather than at the end. */
  const pages = declared.filter((s) => s.group === 'pages');
  const rest = declared.filter((s) => s.group !== 'pages');

  return [
    ...serviceSurfaces(services, locale),
    ...pages,
    ...legalSurfaces(),
    ...rest,
  ];
}

export function surfaceById(
  id: string,
  services: Service[],
  locale: Locale,
): ContentSurface | undefined {
  return contentSurfaces(services, locale).find((surface) => surface.id === id);
}

/** The groups, in board order. */
export const CONTENT_GROUPS: ContentGroup[] = [
  'services',
  'pages',
  'legal',
  'flows',
  'system',
];

/**
 * How many services are priced and public but have nothing to put on a page.
 *
 * The one number on the index that is about the product rather than about the
 * text: a service that is active, sells at a price, and whose lead paragraph
 * is blank is a page the marketing site cannot build. It reads as a warning
 * rather than a count because that is what it is.
 */
export function servicesWithoutCopy(
  services: Service[],
  locale: Locale,
  edits: ContentEdits,
): Service[] {
  return services.filter((service) => {
    if (!isOffered(service)) return false;
    const lead = resolveContent(
      {
        key: `service.${service.slug}.lead`,
        kind: 'text',
        labelKey: null,
        hint: '',
        defaults: {
          de: (SERVICE_SLUGS as readonly string[]).includes(service.slug)
            ? getServiceContent(service.slug as ServiceSlug, 'de').lead
            : undefined,
        },
      },
      locale,
      edits,
    );
    return isBlank(lead.value);
  });
}

/* ---- the export ------------------------------------------------------ */

/**
 * The edits, as a file somebody can act on.
 *
 * The marketing site is statically rendered, so nothing typed on the content
 * screen reaches a visitor until the next build. A panel that takes edits and
 * gives nothing back would be a box that swallows work — the export is what
 * makes the boundary a hand-off instead: the office writes, downloads, and the
 * file is what a developer applies. It is deliberately JSON keyed by the same
 * registry keys, so applying it is a lookup rather than a reading exercise.
 */
export function contentExport(edits: ContentEdit[], now: Date) {
  return JSON.stringify(
    {
      exportedAt: now.toISOString(),
      locales: routing.locales,
      note:
        'Homivaro content edits. Keys match lib/content-registry.ts. ' +
        'Applying these to src/content and src/messages is a deploy, not a save.',
      edits: edits
        .slice()
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((edit) => ({ key: edit.key, kind: edit.kind, values: edit.values })),
    },
    null,
    2,
  );
}
