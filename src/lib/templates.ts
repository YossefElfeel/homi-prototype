/**
 * Message templates — lookup, language fallback, and placeholder filling.
 *
 * Screen 79 used to be the only file that knew anything about templates, and it
 * knew it in a shape nothing else could reuse: the channel table was a `const`
 * in the component, the picker on screen 48 kept its own copy of the event
 * order, and the quote builder hard-coded the one key it wanted. Three copies
 * of the same knowledge is how `offer-reminder` ended up unreachable — nobody
 * had to delete it, it simply never appeared in a list anyone maintained.
 *
 * The important function here is `fill`. The old pickers deliberately inserted
 * raw text and left `{name}` visible, on the reasoning that a half-filled
 * placeholder reaching a customer is worse than retyping the sentence. That was
 * the right call *given that nothing resolved placeholders* — but it also meant
 * "send" could never be one click, because every insert needed a human to
 * finish it. Resolving against the actual record removes the reason for the
 * compromise: on a concrete invoice we know the number, the amount and the due
 * date, so the only placeholders left unfilled are ones with genuinely no
 * source. `fill` returns those by name, and the send buttons stay disabled
 * while the list is non-empty. The old rule is kept, in other words, and
 * enforced by the type instead of by discipline.
 */

import type { Locale } from '@/i18n/routing';
import type {
  MessageTemplate,
  MessageTemplateKey,
  TemplateChannel,
  TemplateFlow,
} from '@/mock/schema';

/* ------------------------------------------------------------ text lookup */

/**
 * §20.6 — German is the fallback for every locale, so a template with no text
 * in the customer's language still sends something rather than an empty box.
 * Every read of a template body or subject goes through here.
 */
export function textFor(
  field: Partial<Record<Locale, string>>,
  locale: Locale,
): string {
  const own = field[locale];
  if (own && own.trim()) return own;
  return field.de ?? '';
}

/**
 * What the pickers and lists call this template.
 *
 * The subject doubles as the name, so an untitled template is possible and has
 * to read as something. It falls back to the first line of the body before it
 * falls back to a placeholder label — an admin who typed a body and no subject
 * still recognises their own template in the list.
 */
export function templateLabel(
  template: MessageTemplate,
  locale: Locale,
  untitled: string,
): string {
  const subject = textFor(template.subject, locale).trim();
  if (subject) return subject;
  const firstLine = textFor(template.body, locale).trim().split('\n')[0];
  if (firstLine) return firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine;
  return untitled;
}

/** How many of the four locales have text. Screen 79 surfaces the gap. */
export function filledLocales(
  template: MessageTemplate,
  locales: readonly Locale[],
): number {
  return locales.filter((l) => (template.body[l] ?? '').trim().length > 0).length;
}

/* -------------------------------------------------------------- selection */

/**
 * The template an automatic send uses for an event.
 *
 * Falls back to any template on the event rather than returning nothing when
 * `isDefault` has somehow been lost — an event with templates but no default
 * should still send. `deleteTemplate` maintains the flag; this is the belt to
 * its braces, because the alternative failure is silent.
 */
export function defaultFor(
  templates: MessageTemplate[],
  event: MessageTemplateKey,
): MessageTemplate | undefined {
  const own = templates.filter((t) => t.event === event);
  return own.find((t) => t.isDefault) ?? own[0];
}

export function byId(
  templates: MessageTemplate[],
  id: string,
): MessageTemplate | undefined {
  return templates.find((t) => t.id === id);
}

/**
 * What a given screen offers in its picker.
 *
 * Automatic-only events are excluded by the caller through `exclude`, not here:
 * `on-the-way` and `appointment-reminder` fire on their own, and offering them
 * again in a manual picker is how a customer gets told twice that the cleaner
 * is on the way.
 */
export function pickable(
  templates: MessageTemplate[],
  options: { flow?: TemplateFlow; exclude?: MessageTemplateKey[] } = {},
): MessageTemplate[] {
  const excluded = new Set(options.exclude ?? []);
  return templates.filter(
    (t) =>
      (options.flow === undefined || t.flow === options.flow) &&
      !(t.event !== undefined && excluded.has(t.event)),
  );
}

/** Events that go out on their own — never offered for a second manual send. */
export const AUTOMATIC_ONLY: MessageTemplateKey[] = [
  'appointment-reminder',
  'on-the-way',
];

/**
 * Search and filter for screen 79, in one place so the empty state can say
 * which of the three narrowed the list to nothing.
 */
export function searchTemplates(
  templates: MessageTemplate[],
  locale: Locale,
  { query, flow, tag }: { query?: string; flow?: TemplateFlow | 'all'; tag?: string },
): MessageTemplate[] {
  const q = (query ?? '').trim().toLowerCase();
  return templates.filter((t) => {
    if (flow && flow !== 'all' && t.flow !== flow) return false;
    if (tag && !t.tags.includes(tag)) return false;
    if (!q) return true;
    /* Searching the body as well as the subject, because the thing an admin
       remembers about a template is usually a phrase inside it. */
    const haystack = [
      templateLabel(t, locale, ''),
      textFor(t.body, locale),
      ...t.tags,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function allTags(templates: MessageTemplate[]): string[] {
  return [...new Set(templates.flatMap((t) => t.tags))].sort();
}

/* ----------------------------------------------------------- placeholders */

/** Every placeholder the seed texts use, so the editor can list them. */
export const PLACEHOLDERS = [
  'name',
  'reference',
  'link',
  'validUntil',
  'date',
  'windowStart',
  'windowEnd',
  'freeUntil',
  'member',
  'eta',
  'invoiceNumber',
  'amount',
  'dueDate',
  'feeNote',
  'priceList',
] as const;

export type PlaceholderName = (typeof PLACEHOLDERS)[number];

export type TemplateVars = Partial<Record<PlaceholderName, string>>;

export interface FilledText {
  text: string;
  /**
   * Placeholders the record had no value for, in the order they appear. While
   * this is non-empty the text is not safe to send unread, and every send
   * button that offers one-click sending is disabled on it.
   */
  unresolved: string[];
}

const PLACEHOLDER_RE = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

/**
 * Substitute what we know and report what we do not.
 *
 * An empty-string value counts as unresolved on purpose. "Invoice {amount}"
 * with an amount of `''` reads as a finished sentence with a word missing,
 * which is exactly the failure that is hard to notice in a preview — whereas an
 * unfilled `{amount}` is obvious. So a blank value keeps its braces and gets
 * reported.
 */
export function fill(text: string, vars: TemplateVars): FilledText {
  const unresolved: string[] = [];
  const out = text.replace(PLACEHOLDER_RE, (whole, key: string) => {
    const value = vars[key as PlaceholderName];
    if (value === undefined || value.trim() === '') {
      if (!unresolved.includes(key)) unresolved.push(key);
      return whole;
    }
    return value;
  });
  return { text: out, unresolved };
}

/** Body and subject filled together — they share one unresolved list. */
export function fillTemplate(
  template: MessageTemplate,
  locale: Locale,
  vars: TemplateVars,
): { subject: FilledText; body: FilledText; unresolved: string[] } {
  const subject = fill(textFor(template.subject, locale), vars);
  const body = fill(textFor(template.body, locale), vars);
  return {
    subject,
    body,
    unresolved: [...new Set([...subject.unresolved, ...body.unresolved])],
  };
}

/* ----------------------------------------------------------------- delete */

/**
 * What deleting a template would actually do.
 *
 * The screen needs this to decide which of three confirm dialogs to show; the
 * store needs it to carry the change out. Both had it, separately, which is a
 * confirm step promising one outcome while the store performs another — the
 * quietest possible way for "the automatic send still works" to stop being
 * true. One function, two callers, no drift.
 *
 * Pure and total: it returns the next list rather than mutating, so the store's
 * job is reduced to `set` plus a log line.
 */
export type DeletePlan =
  | { kind: 'missing' }
  /** No automatic send depends on this one. */
  | { kind: 'plain'; next: MessageTemplate[]; removed: MessageTemplate }
  /** It held the automatic send and a sibling takes over. */
  | { kind: 'promote'; next: MessageTemplate[]; removed: MessageTemplate; heir: MessageTemplate }
  /**
   * It was the last text for an automatic event. The seeded original comes
   * back, because an event with no template does not fail loudly — it goes
   * silent at the moment a customer is waiting to hear from us.
   */
  | { kind: 'restore'; next: MessageTemplate[]; removed: MessageTemplate; restored: MessageTemplate };

export function planDelete(
  templates: MessageTemplate[],
  id: string,
  /** The seeded list, so the restore path has an original to fall back to. */
  seed: MessageTemplate[],
  /** Which sibling the admin chose to take over the automatic send. */
  replacementId?: string,
): DeletePlan {
  const removed = templates.find((t) => t.id === id);
  if (!removed) return { kind: 'missing' };

  const rest = templates.filter((t) => t.id !== id);

  if (removed.event) {
    const siblings = rest.filter((t) => t.event === removed.event);

    if (siblings.length === 0) {
      const original = seed.find((t) => t.event === removed.event);
      if (original) {
        const restored = { ...original, isDefault: true };
        return { kind: 'restore', next: [...rest, restored], removed, restored };
      }
      /* No seeded original to restore — nothing left to protect, so this is an
         ordinary delete rather than a promise we cannot keep. */
      return { kind: 'plain', next: rest, removed };
    }

    if (removed.isDefault) {
      const heir = siblings.find((t) => t.id === replacementId) ?? siblings[0]!;
      return {
        kind: 'promote',
        next: rest.map((t) =>
          t.event === removed.event ? { ...t, isDefault: t.id === heir.id } : t,
        ),
        removed,
        heir,
      };
    }
  }

  return { kind: 'plain', next: rest, removed };
}

/* ------------------------------------------------------------------ usage */

/**
 * Where each flow's templates are actually offered.
 *
 * The brief's last point asks admins to be told where a template is used. This
 * is that answer, and it is a registry rather than a sentence in the copy for
 * the reason every other registry in `lib/` exists: a hard-coded list of
 * screens goes stale the first time a picker moves, and nothing fails when it
 * does. The pickers read `flow` from here too, so a screen that stops offering
 * a flow stops claiming to offer it in the same edit.
 */
export interface TemplateUsage {
  /** Key into `admin.templates.usage` for the screen's name. */
  key: 'messages' | 'quote' | 'invoice' | 'booking' | 'review' | 'request';
  href: string;
}

export const USAGE: Record<TemplateFlow, TemplateUsage[]> = {
  requests: [{ key: 'messages', href: '/admin/nachrichten' }],
  quotes: [
    { key: 'quote', href: '/admin/offerten' },
    { key: 'messages', href: '/admin/nachrichten' },
  ],
  bookings: [
    { key: 'booking', href: '/admin/buchungen' },
    { key: 'messages', href: '/admin/nachrichten' },
  ],
  invoices: [
    { key: 'invoice', href: '/admin/rechnungen' },
    { key: 'messages', href: '/admin/nachrichten' },
  ],
  reviews: [{ key: 'messages', href: '/admin/nachrichten' }],
  general: [{ key: 'messages', href: '/admin/nachrichten' }],
};

/** SMS is one segment at 160 characters; past that it silently bills as two. */
export const SMS_LIMIT = 160;

export function overSmsLimit(
  template: MessageTemplate,
  locale: Locale,
): boolean {
  return (
    template.channels.includes('sms') &&
    textFor(template.body, locale).length > SMS_LIMIT
  );
}

export const CHANNELS: TemplateChannel[] = ['email', 'sms'];
