import {
  Archive,
  ArchiveRestore,
  Ban,
  CalendarClock,
  CalendarDays,
  CalendarSync,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck,
  FileText,
  Home,
  Pencil,
  Power,
  PowerOff,
  Receipt,
  Send,
  ShieldCheck,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';

/**
 * The single source of truth for what a row action looks like.
 *
 * `status-registry.ts` exists because one state wearing two colours on two
 * screens is a bug review keeps missing. A row action strip had the same
 * problem the other way round: the *same* meaning drew a different glyph on
 * every list, and one glyph carried different meanings depending on the list.
 * Opening a quote was a `Receipt` on the requests table, a `FileText` on the
 * bookings table and a `FileText` again on the quotes table — where it meant
 * "open this row", not "open a quote". Following the request behind a quote
 * was a `RefreshCw`, which is the universal glyph for "retry".
 *
 * None of that is catchable by types, so it lives here instead: a meaning maps
 * to exactly one icon, and a screen that needs a new meaning has to add it
 * here where the collision is visible.
 *
 * The two rules the set is built on:
 *
 * 1. `open` is the row's *own* record — every table, no exception. A customer
 *    who learns the eye once never has to learn it again.
 * 2. A cross-link to a record of another type wears that record type's icon,
 *    never the eye. Two eyes in one strip would be two buttons that claim to
 *    do the same thing and do not.
 */
export const ActionIcon = {
  /** This row's own record. Rule 1 — never used for anything else. */
  open: Eye,

  /* Rule 2 — one glyph per record type, wherever it is linked from. */
  request: FileText,
  offer: FileCheck,
  booking: CalendarDays,
  invoice: Receipt,
  /* The same `Home` the sidebar puts on «Objekte», so the item in a key's menu
     and the nav entry it lands on are visibly the same destination. Not the
     eye: a key row is not a property, and rule 1 keeps the eye for the row's
     own record — which a key does not have, since it has no screen of its own. */
  property: Home,

  /** Leaves the panel for the page the customer sees. */
  customerView: ExternalLink,

  sendOffer: Send,
  confirmSlot: CalendarClock,
  /* Not `confirmSlot`'s CalendarClock, even though both are about a slot:
     confirming settles a date and moving one un-settles it, and one glyph for
     both would make the strip say the same thing for opposite outcomes. */
  reschedule: CalendarSync,
  edit: Pencil,

  /* Reversible pairs. Each reversal is a distinct glyph rather than the same
     one greyed out, because the strip shows only one of the pair at a time —
     the icon *is* the answer to "which state is this row in". */
  block: Ban,
  unblock: ShieldCheck,
  archive: Archive,
  restore: ArchiveRestore,

  /*
   * Putting a service on sale, and taking it off again.
   *
   * The original note here said this pair did not belong: two ends of one axis
   * are a Switch in the row, not glyphs in a menu. That turned out to be right
   * about the *list* and wrong about everywhere else. /admin/leistungen gives
   * availability a column with a Switch in it — and the Switch does not apply
   * on the click, it opens the confirm, because publishing a price is not
   * something a control should promise is instant.
   *
   * So these two are not menu items any more. They label the buttons on the
   * service's details screen, which is the phone's path to the same decision:
   * below lg the list renders as cards, and a card's body is one <button>, so
   * a Switch cannot live inside it.
   */
  activate: Power,
  deactivate: PowerOff,

  /* Giving a held thing back to whoever owns it. Deliberately not `restore`:
     that one is the reversal of `archive` and puts the row back where it was,
     while this closes the record for good — the key leaves the building. */
  handBack: Undo2,

  /*
   * Taking something off the public site again.
   *
   * Deliberately half a pair. The reverse of hiding a review is publishing it,
   * and publishing already has a button with a name on it — giving the return
   * trip an `Eye` would put rule 1's glyph on an action that is not "open this
   * row", on the one screen where "what the public sees" and "what I am
   * looking at" are different questions.
   */
  hide: EyeOff,

  /* Destructive. Both carry `tone="danger"` at the call site. */
  decline: X,
  delete: Trash2,
} as const;
