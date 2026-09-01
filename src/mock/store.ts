'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState, useSyncExternalStore } from 'react';

import type { Locale } from '@/i18n/routing';
import type {
  AddOn,
  AdminPermission,
  Application,
  ApplicationDraft,
  ApplicationStatus,
  Booking,
  CalendarEvent,
  CalendarEventKind,
  CalendarEventStatus,
  ContactAddress,
  Customer,
  CustomerMessage,
  Expense,
  ExpenseCategory,
  ID,
  Invoice,
  InvoiceLine,
  LabourEntry,
  MessageAttachment,
  MessageTemplate,
  JobPosting,
  TeamMember,
  TeamRole,
  Offer,
  OfferLine,
  Payment,
  PaymentMethod,
  Plan,
  PreferredTime,
  Subscription,
  Property,
  RequestDraft,
  ReviewStatus,
  SavedMethodKind,
  Service,
  ServiceRequest,
  ServiceStatus,
  Settings,
  SlotHold,
  ISODate,
} from './schema';
import { SEED_ADDONS, SEED_PLANS, SEED_SERVICES, SEED_SETTINGS } from './seed';
import { defaultFor, planDelete, textFor } from '@/lib/templates';
import {
  cancelBlock,
  nextPlanVisit,
  upgradeBlock,
  upgradeQuote,
  type CancelBlock,
  type UpgradeBlock,
} from '@/lib/plan-facts';
import { normaliseAddress } from '@/lib/contact-address';
import { isCompleteLabour, memberName } from '@/lib/labour-facts';
import { propertyUsage } from '@/lib/property-facts';
import { serviceUsage, slugify, uniqueSlug } from '@/lib/service-catalogue';
import { addOnUsage, uniqueAddOnSlug } from '@/lib/addon-catalogue';
import { RESET_LINK_HOURS } from '@/lib/user-facts';
import { buildScenario, seedHolds, type DataSet, type ScenarioName } from './scenarios';
import { checkCoverage } from './engines/coverage';
import {
  createHold,
  dayBlockReason,
  type DayBlockReason,
  type Slot,
} from './engines/availability';
import { CONFIRMED_HOLD_HOURS, requestCoverage } from '@/lib/offer-facts';
import { buildOfferLines, canReissue, offerHours, offerTotal } from './engines/offers';
import { arrivalWindowMinutes } from './engines/pricing';

/** Used only if the "offer-sent" template has been emptied on screen 79. */
const DEFAULT_OFFER_MESSAGE = `Guten Tag

vielen Dank für Ihre Anfrage. Nachfolgend finden Sie unsere Offerte, Position für Position aufgeschlüsselt. Der Betrag ist verbindlich; Zuschläge und Anfahrt sind – falls zutreffend – separat ausgewiesen.

Wählen Sie einen freien Termin, und wir bestätigen ihn sofort.

Freundliche Grüsse
Marco Brunner`;

/**
 * The prototype's single source of truth.
 *
 * Persisted to localStorage so a reviewer can submit a request, switch to the
 * owner, answer it with a quote, switch back to the customer and see it —
 * across reloads. `SCHEMA_VERSION` throws the store away when the shape moves,
 * which is the right trade for a prototype.
 */
// Bump whenever the shape of DataSet or the draft changes. `migrate` returns
// undefined, which makes Zustand discard the stored state and re-seed — the
// right trade for a prototype, and it prevents a stale localStorage from
// crashing on a field that did not exist yet.
/* 7: Review gained publishConsent and OfferLine gained displayLabel. A store
   persisted under 6 has reviews with no consent recorded, which the moderation
   screen would have to read as "not consented" — correct, but it would look
   like the seed was wrong rather than stale. Re-seeding is cleaner.

   8: The shape did not move this time — the data did. Every seeded customer
   used to share one phone number, which was invisible until the request list
   started printing it in every row. A store persisted under 7 keeps the old
   numbers, so the column would show four identical values and look like the
   bug this bump exists to clear.

   9: `Offer` gained proposedSlots/confirmedSlot/slotConfirmedAt, `SlotHold`
   gained `confirmed`, and the seed finally carries payments and a quote →
   booking link. A store persisted under 8 has none of it — the quote list's
   four new columns would render "—" down every row, which is exactly the
   "columns are real, data is not" failure this wave exists to remove.

   10: `Offer` gained `revisionNote`, and a change request no longer writes over
   `message`. A store persisted under 9 can hold the bug itself — an offer whose
   covering note was destroyed by a customer's change request — and re-seeding
   is the only way to get that text back. Leaving it would show the corrected
   screen still printing a complaint under "Covering note".

   11: `DataSet` gained `events` — the calls, follow-ups and viewings the
   calendar had no way to hold. A store persisted under 10 has no such array
   at all, and every calendar view would read `undefined.filter` on first
   paint. This one is not a preference; it is a crash.

   12: `CustomerStatus` gained `blocked` and `Customer` gained `archivedAt`.
   A store persisted under 11 has neither, so the customer list's archive tab
   would be permanently empty and the block action would have nothing to
   undo — which reads as a dead control rather than an empty state.

   13: `Settings.messageTemplates` went from a keyed object to an array, so
   templates can be added and deleted. This is the crash kind again, and a
   worse one than 11: a store persisted under 12 holds an object, and every
   `.filter` in `lib/templates.ts` reads `undefined` on it — which takes down
   the templates screen, both message pickers and the quote builder at once.

   15: The plan model was rebuilt end to end. `Subscription` lost `plan`,
   `serviceSlug`, `commitmentEndsAt`, `skipsUsedThisMonth`, `lastChargedAt`,
   `nextChargeAt` and `cancellationRequestedAt`, and gained `planId`,
   `endDate`, `visitsUsed`, `renewalCount` and `history`; the store gained a
   `plans` slice that did not exist; `Settings` lost `planDiscounts` and both
   subscription-term fields. This is the crash kind and the worst of them: a
   store persisted under 14 holds subscriptions with no `planId`, so
   `plans.find(...)` returns undefined on every plan screen, `history` is
   `undefined` where `skipsUsedThisMonth` counts it, and the customer's own
   plan page reads `undefined.filter` on first paint.

   16: `CustomerMessage` gained `readByAdmin` and `attachments`. Not the crash
   kind — a blob from 15 reads `undefined`, which is falsy — but the flag's
   only job is to tell read from unread, and a store carried over would open
   the panel with every thread marked unread, including the ones the owner
   answered themselves. A read state that is wrong on arrival is worse than
   none, because the filter sitting above it still looks like it works.

   17: `CalendarEventStatus` was renamed — `planned` → `upcoming`, `noReply` →
   `pending`, `converted` → `inProgress`. A blob from 16 holds the old three,
   and both registries are keyed by the value: `statusTone` falls through to
   neutral, so every planned call turns grey, and `status.calendarEvent` has no
   message under those keys at all — next-intl renders the missing key as its
   own path. The calendar would open on a legend that matches nothing in the
   grid beside it.

   18: Not a shape change — a data one, and the mildest kind. RE-2026-0050 was
   added so B-1053's «50% verrechnet» has an invoice behind it. A blob from 17
   simply does not contain it, so the row keeps reading «Schätzung / Nicht
   bezahlt» on a reviewer's machine while it reads «Rechnung / Offen» on a
   fresh one, and the two would disagree for as long as the blob lives.

   19: `Booking` gained `reschedule`, and the seed moved with it — B-1044 is
   now a moved job with the notice that told the customer, B-1055 sits inside
   the current month, and two calendar events were added for `done` and
   `cancelled`. A blob from 18 has none of it: every moved booking loses the
   date it was moved from, so the note on /admin/buchungen/[id] and the one on
   the customer's dashboard both vanish, and two legend rows filter to
   nothing. Not a crash — a reviewer quietly looking at the old product.

   20: `SavedPaymentMethod` gained `expiresAt`, and cus_1 — the one customer in
   the seed on a plan — finally has the card that plan is charged to. A blob
   from 19 opens her record on «Nichts hinterlegt», which is the empty state
   the whole change exists to remove.

   21: Both kinds at once, which is why this one is not optional. `KeyLogEntry`
   gained `returnedBy`, `returnedTo` and `returnNote`, and the seed went from a
   key log that was effectively one address to five entries across three
   customers, three held and two returned.

   A blob from 20 has neither, and the failure is quiet rather than loud: the
   register renders, the search box renders, the status filter renders — over
   whatever few rows that reviewer's localStorage happens to hold. So the two
   controls this wave added look built and broken at the same time, the return
   dialog writes fields into a record whose siblings have none, and a returned
   key still prints a bare date because the names it should carry were never in
   the blob. Nothing crashes and nothing says why, which makes it exactly the
   "reviewer quietly looking at the old product" case 18 and 19 were bumped
   for — and it was caught by a reviewer reporting the row count had not
   moved, not by the build.

   22: `Invoice.createdAt`. A blob from 21 has none, and `merge` cannot help —
   it fills in whole collections that are missing, not a field missing from
   every row of one that is present. The new «Erstellt» column would then read
   «Invalid Date» on every invoice, and sorting the list by it would order them
   at random.

   23: `Service.active` became `Service.status`. A blob from 22 has seven
   services each carrying a boolean the code no longer reads: `isOffered` would
   find no `status` on any of them, every service would drop off the website
   and out of the request flow, and the new status filter would return nothing
   for all three states. Silent and total — the worst shape a stale store
   takes.

   24: The shape held and the data moved — the catalogue gained a draft row and
   a deactivated one, so each of the three states has a service in it. `merge`
   cannot help here either: `services` is present in a blob from 23, so it is
   kept whole and the two new rows never arrive. The result reads as the bug
   this seed exists to disprove — two of the three filter options returning an
   empty table on a screen built to show all three.

   25: Same again, one level down — the add-ons gained two withdrawn rows so
   «Nicht verfügbar» has data behind it. `merge` cannot help: `addOns` is
   present in a blob from 24, so it is kept whole and the two never arrive.
   The status filter would then have an option that empties the table every
   time, on a screen whose whole point this wave is that availability is
   readable.

   26: Same again, and this time the empty table was the *whole* screen. The
   coupon list went from `coupons: []` in every scenario to five seeded codes,
   one per state. `merge` cannot help — and here it is worth being exact about
   why, because it is the one case that looks like it should be covered:
   `merge` fills in collections that are *missing* from the persisted blob, and
   `coupons` is not missing. It is present and empty, which is a value, so it
   is kept whole and the five never arrive.

   The result is the worst possible reading of this wave. A blob from 25 opens
   /admin/gutscheine on the empty state — and that empty state used to say the
   list was deliberately empty, so the screen would argue, convincingly, that
   the seed was working as intended. Every state badge, the search box, the
   filter and the switch would sit on a table with nothing in them, and the
   edit screen would be unreachable again for exactly the reason this wave
   existed to fix.

   27: Both kinds at once. `ReviewStatus` gained `hidden`, and `reviews` went
   from `[]` in the default scenario to five seeded records — the same «present
   and empty, so `merge` keeps it whole» case as 26, one screen along.

   The shape half is the quieter of the two and worth naming, because a blob
   from 26 does not crash on it: no persisted review carries `hidden`, so the
   group is simply never rendered and the new button looks like it writes into
   nothing. The data half is the loud one. /admin/bewertungen would open on
   «Noch keine Bewertungen» for a reviewer who had opened the app before and on
   five cards for one who had not — and that empty state explains itself well
   (reviews arrive after payment), so the screen would argue the seed was
   working. That is exactly the reading 26 was bumped to stop.

   28: Data only, and the third instance of the same case — `postings` went
   from six to eleven and `applications` from fourteen to twenty. No shape
   moved, so nothing crashes and nothing looks obviously wrong, which is what
   makes this one worth a bump rather than a shrug: `merge` fills in
   collections that are *missing*, and both of these are present in any blob
   written since the hiring seed moved into `baseData`. A reviewer who had
   opened the app before would keep the old six and fourteen for ever.

   The states the new records exist for are the ones nothing else reaches —
   the jobs list past its ten-row page, `createPosting`'s own untouched output,
   an accepted application with no account behind it yet, a record three days
   from erasure. Every one of them would have been invisible to exactly the
   person most likely to be checking for them.

   29: Both kinds again, and this time the shape half is a whole entity.
   `DataSet` gained `expenses`, and `invoices` gained the twelve months of the
   office contract that the finance screen reads them against. `Coupon` gained
   `maxDiscount` and `Property` gained `addressDetail`.

   `merge` covers exactly one of those four. It fills in collections that are
   *missing*, so `expenses` would arrive from the defaults — the new screens
   would not crash on a stale blob. The other three are the case this list
   keeps re-learning: `invoices` and `coupons` are present in any blob from 28,
   so they are kept whole and neither the year of revenue nor the ceiling on
   WELCOME10 ever lands.

   What that reads as is the worst version of this wave. /admin/finanzen would
   draw eleven empty months and one bar — the exact "the chart is broken" first
   impression the revenue history was seeded to prevent — while /admin/ausgaben
   beside it showed a full year of costs, so the profit line would be a loss in
   every month. And the coupon form's third field would render for a reader who
   had opened the app before with nothing in it, on the one screen this wave
   added it to. */
/* 31: two shape changes landed in the same version number on two branches, so
   this is 31 rather than either of their 30s — and both reasons still apply,
   because a blob from 29 is missing both.

   `Expense` gained `labour`, `ExpenseCategory` gained the heading that carries
   it, and `baseData` gained the labour rows on the seeded jobs. `merge` fills in
   collections that are *missing*; `expenses` is present in any blob from 29, so
   it would be kept whole and not one of those rows would ever land — and
   /admin/ausgaben/arbeitszeit, the screen that wave is about, would open on its
   empty state for a reviewer who had used the app before and on a full board for
   one who had not. The empty state argues its own case well («noch keine
   Arbeitszeit erfasst»), so nothing on screen would say the data was stale.

   And every `TeamMember` grew a `permissions` array that the panel now reads to
   decide what a signed-in account may open. `team` is present in a stale blob
   too, so its four members would arrive without the field, reach
   `grantedPermissions`, and turn every screen in the console into a locked door.
   `TeamRole` gained a third value in the same change. */
const SCHEMA_VERSION = 31;

/**
 * §10 — the default payment term.
 *
 * Not in Settings: the settings screen is the owner's, and nothing in the
 * specification lets them move this. It is no longer the *only* term — the
 * create screen offers four and this is what it opens on, and what a reissued
 * invoice inherits. The seeded invoices use the same 30 days.
 */
const INVOICE_TERM_DAYS = 30;

/**
 * What each close-out writes into a calendar entry's timeline.
 *
 * English, like every other seeded and store-written label in this file: the
 * timeline is data, not UI text. It is written once, in the language the office
 * runs in, and never re-read through a dictionary — so translating it at write
 * time would freeze whichever language the owner happened to be using into the
 * record, and translating it at read time would rewrite history.
 */
const EVENT_STATUS_EVENT: Record<CalendarEventStatus, string> = {
  upcoming: 'Reopened',
  done: 'Done',
  pending: 'Nobody reached',
  inProgress: 'Turned into a request',
  cancelled: 'Cancelled',
};

/**
 * Swiss QR-bill reference, schematic — the real one is a 27-digit number with
 * a mod-10 check digit. Enough to look right on screen 72 and to be searchable
 * on screen 84, which is all the prototype claims (see its own qrNote).
 */
function buildQrReference(seq: number) {
  const body = String(seq).padStart(21, '0');
  return `21 ${body.slice(0, 5)} ${body.slice(5, 10)} ${body.slice(10, 15)} ${body.slice(15, 20)} ${body.slice(20)}0000`.trim();
}

/**
 * The next invoice number.
 *
 * Was `52 + invoices.length` — a headcount, so a scenario seeded with numbers
 * in the 0100s produced RE-2026-0060 next and two invoices apparently issued
 * years apart sat side by side in the list. Highest ever seen plus one, with
 * the seed's own first number as the floor.
 *
 * Deleting the newest draft does hand its number back to the next invoice.
 * That is survivable exactly because deleting is draft-only: a draft's number
 * has been in front of nobody. Anything that has been sent can only be
 * cancelled, and a cancelled invoice stays in the list holding its number.
 */
function nextInvoiceSeq(invoices: Invoice[]) {
  return (
    invoices.reduce((highest, invoice) => {
      const tail = Number(invoice.reference.slice(invoice.reference.lastIndexOf('-') + 1));
      return Number.isFinite(tail) ? Math.max(highest, tail) : highest;
    }, 51) + 1
  );
}

/**
 * The same counter for costs, and it starts at zero rather than at 51.
 *
 * `nextInvoiceSeq` opens at 51 because the seeded invoices are numbered from
 * RE-2026-0047 and a company that has been trading has a number behind it.
 * The expense ledger begins where this seed begins — AUS-0001 is the first
 * cost, and pretending to fifty earlier ones would be a claim the data does
 * not carry.
 */
function nextExpenseSeq(expenses: Expense[]) {
  return (
    expenses.reduce((highest, expense) => {
      const tail = Number(expense.reference.slice(expense.reference.lastIndexOf('-') + 1));
      return Number.isFinite(tail) ? Math.max(highest, tail) : highest;
    }, 0) + 1
  );
}

/**
 * Give the job back.
 *
 * `createInvoice` moves a booking to `invoiced`, and the create screen offers
 * «finished jobs with no live invoice». Cancelling or deleting that invoice
 * without undoing the move left the job billed according to the booking and
 * unbilled according to the invoices — and reachable from neither screen, so a
 * job wrongly invoiced once could never be invoiced correctly.
 *
 * `closed` is deliberately left alone: that state was reached by the money
 * arriving, and a cancellation does not un-arrive it.
 */
function releaseBooking(bookings: Booking[], invoice: Invoice): Booking[] {
  if (!invoice.bookingId) return bookings;
  return bookings.map((b) =>
    b.id !== invoice.bookingId || b.status !== 'invoiced'
      ? b
      : { ...b, status: 'completed' as const },
  );
}

export type DemoRole = 'visitor' | 'customer' | 'owner' | 'contractor';

interface DemoState {
  role: DemoRole;
  scenario: ScenarioName;
  /** ISO date the app should treat as "now". Drives lead-time and closure tests. */
  dateOverride: string | null;
  currentCustomerId: string;
  currentMemberId: string;
}

export function emptyDraft(): RequestDraft {
  return {
    serviceSlug: null,
    propertyId: null,
    property: {
      street: '',
      postcode: '',
      city: '',
      kind: 'apartment',
      area: null,
      rooms: null,
      bathrooms: null,
      floor: 0,
      hasElevator: false,
      hasPets: false,
      needsExtraEffort: false,
    },
    addOnIds: [],
    windowCount: null,
    furniturePieces: null,
    access: null,
    preferred: { flexible: false },
    photos: [],
    customerNote: '',
    contact: { firstName: '', lastName: '', email: '', phone: '', language: 'de' },
    acceptedTerms: false,
    acceptedPrivacy: false,
    planIntent: null,
    updatedAt: null,
  };
}

export function emptyApplicationDraft(): ApplicationDraft {
  return {
    postingId: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postcode: '',
    city: '',
    permit: null,
    languages: {},
    hasDrivingLicence: false,
    hasCar: false,
    yearsExperience: null,
    experienceAreas: [],
    availability: { days: [], earliest: '07:00', latest: '18:00' },
    startFrom: '',
    references: [],
    documents: [],
    motivation: '',
    consent: false,
    updatedAt: null,
  };
}

interface StoreState {
  data: DataSet;
  settings: Settings;
  services: Service[];
  addOns: AddOn[];
  /*
   * Catalogue, not scenario data. A plan is a product the office sells — it
   * outlives any one dataset, the same way services and add-ons do, and putting
   * it in `DataSet` would mean switching demo scenario silently rewrote the
   * price list.
   */
  plans: Plan[];
  holds: SlotHold[];
  demo: DemoState;
  draft: RequestDraft;
  applicationDraft: ApplicationDraft;

  updateDraft: (patch: Partial<RequestDraft>) => void;
  resetDraft: () => void;
  /**
   * Turns the draft into a request. Returns the reference for the receipt, or
   * `null` when the address is outside the service area — the one case where
   * there is no request to give a reference for.
   */
  submitDraft: (now: Date) => { reference: string } | null;

  /* ---- admin-side intake (screens 64 + 52) ----
     A customer could only ever come into being as a side effect of the public
     wizard: `submitDraft` invents one from the contact step. So the owner of a
     phone-first local business had no way to write down the person who just
     called, and on day one — the empty scenario — /admin/kunden was a list with
     no way to put anything in it. */
  createCustomer: (
    input: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      language: Locale;
      internalNotes?: string;
      /** Where the person is. Absent when the call ended before the address. */
      address?: ContactAddress;
    },
    now: Date,
  ) => ID;
  updateCustomer: (id: ID, patch: Partial<Customer>) => void;
  /** Shared by the admin property form and by admin intake. */
  createProperty: (
    input: Omit<Property, 'id'>,
    now: Date,
  ) => ID;
  /**
   * A property could be created and read and nothing else. An address typed
   * wrong on the call that produced it stayed wrong on every job, quote and
   * invoice that hung off it, and the one field the panel could change was
   * the standing note — which is the field the customer never sees.
   */
  updateProperty: (id: ID, patch: Partial<Property>) => void;
  /**
   * Removes an address nothing has used yet, and refuses otherwise.
   *
   * `propertyUsage` is the guard, not a warning the caller may skip: six
   * record types carry a `propertyId` and three dereference it with `!`, so a
   * delete that ignored them would not leave a gap in a list, it would crash
   * the screen that opened the booking behind it. Returns whether the row
   * went, so the caller can say which of the two happened.
   */
  deleteProperty: (id: ID) => boolean;
  /* ---- the key register (screen 68) ----
     §13.2. Both halves of a key's life used to be a `patchData` written on the
     screen: the intake spread a new entry onto the array, and the return
     mapped over it flipping a string. Neither reached the change log, so the
     one record in the app that exists to say who had physical access to a
     customer's home left no trace of who wrote it. */
  recordKey: (
    input: { propertyId: ID; receivedBy: string; storageLocation: string },
    now: Date,
  ) => ID;
  /**
   * Closes a key record, and refuses to close one twice.
   *
   * The guard is here rather than on the screen because the menu item that
   * calls it is rendered from a snapshot: a second tab returning the same key
   * would otherwise overwrite the first handover's names and date with the
   * second's, and the log would carry two returns of one key.
   */
  returnKey: (
    id: ID,
    input: { returnedAt: ISODate; returnedBy: string; returnedTo: string; returnNote?: string },
  ) => boolean;
  /**
   * The same request the public wizard produces, entered by the owner on
   * behalf of a customer who phoned. Runs the identical coverage check, so an
   * out-of-area address is flagged here exactly as it is there.
   */
  createRequestForCustomer: (
    input: {
      customerId: ID;
      propertyId: ID;
      serviceSlug: string;
      addOnIds: ID[];
      windowCount?: number | null;
      furniturePieces?: number | null;
      preferred: PreferredTime;
      customerNote?: string;
      internalNote?: string;
      planIntent?: ID | null;
      /**
       * A call that ended before the answers did. `RequestStatus` has carried
       * `draft` since the first wave — labelled, coloured, and written by
       * nothing, so a half-taken call had to be either invented in full or
       * thrown away.
       */
      asDraft?: boolean;
    },
    now: Date,
  ) => { id: ID; reference: string } | null;
  /** Edits a request in place. Only ever used while it is still a draft. */
  updateRequest: (id: ID, patch: Partial<ServiceRequest>) => void;
  /** Draft → a real request in the queue. */
  submitRequestDraft: (id: ID, now: Date) => void;
  /** Discards a draft outright. Refuses anything further along. */
  discardRequestDraft: (id: ID) => void;

  /* ---- ending a request or a quote ----
     RequestStatus declared `cancelledByCustomer` and `cancelledByCompany`, the
     status registry gave both a colour and both were translated into DE and
     EN — and nothing in the app could reach either. Same for OfferStatus
     'rejected': the only exits from a quote were accept and request-a-change,
     so a customer who simply did not want it had no way to say so. */
  cancelRequest: (
    requestId: ID,
    by: 'customer' | 'company',
    reason: string,
    now: Date,
  ) => void;
  declineOffer: (offerId: ID, reason: string, now: Date) => void;

  /* ---- quote building (screens 54–56) ---- */
  /** Idempotent: returns the existing draft for a request, or creates one. */
  ensureDraftOffer: (requestId: ID, now: Date) => ID;
  updateOffer: (offerId: ID, patch: Partial<Offer>) => void;
  updateOfferLine: (offerId: ID, lineId: ID, patch: Partial<OfferLine>) => void;
  addOfferLine: (offerId: ID) => void;
  removeOfferLine: (offerId: ID, lineId: ID) => void;
  sendOffer: (offerId: ID, now: Date) => void;
  rejectRequest: (requestId: ID, reason: string, now: Date) => void;
  /**
   * The way back out of a decline.
   *
   * §4.1 makes declining a real answer with a reason attached, which is why
   * it is one click behind a dialog — but it was also one-way. A request
   * declined by a mis-click was finished: "Offerte schreiben" turns itself
   * off the moment a request counts as answered, and the only remaining
   * button on the screen was Decline again. The moderation queue already
   * had this exact control and this exact reason written beside it.
   *
   * Lands on `inReview`, not `new`: somebody has plainly seen this one.
   * The reason stays in `internalNote` — it is the record of what happened,
   * and the mistake is part of the record too.
   */
  restoreRequest: (requestId: ID) => void;

  /* ---- offer acceptance (screens 23–31) ---- */
  toggleOfferLine: (offerId: ID, lineId: ID) => void;
  holdOfferSlot: (offerId: ID, slot: Slot, now: Date) => void;
  /**
   * A first-time customer's up-to-three preferred dates. Nothing is blocked in
   * the calendar — see `Offer.proposedSlots`.
   */
  proposeOfferSlots: (offerId: ID, starts: ISODate[]) => void;
  /** The office picks one of them, which is what turns it into a real hold. */
  confirmOfferSlot: (offerId: ID, start: ISODate, now: Date) => void;
  /**
   * §9.2 — the customer's half. Takes the drawn mark because the pad used to
   * throw its own drawing away the moment it was submitted: what reached the
   * store was a timestamp, so nothing downstream could show what was signed.
   */
  signOffer: (offerId: ID, signature: { name: string; path: string }, now: Date) => void;
  /** Mock gateway. `outcome` decides which of the two states we land in. */
  payOffer: (
    offerId: ID,
    method: PaymentMethod,
    outcome: 'succeeded' | 'failed',
    now: Date,
  ) => { bookingReference?: string; failureReason?: string };
  /** Lands in `Offer.revisionNote`, never in `message` — see the schema. */
  requestOfferChange: (offerId: ID, note: string) => void;
  /** `false` when the quote is not one a new version applies to (`canReissue`). */
  reissueOffer: (offerId: ID, now: Date) => boolean;

  /* ---- hiring (screens C3–C6, H1–H7) ---- */
  updateApplicationDraft: (patch: Partial<ApplicationDraft>) => void;
  resetApplicationDraft: () => void;
  /** Turns the draft into an application. Returns the reference for the receipt. */
  submitApplication: (now: Date) => { reference: string };
  setApplicationStatus: (id: ID, status: ApplicationStatus) => void;
  rejectApplication: (id: ID, reason: string) => void;
  /** revDSG — a real deletion, not an archive flag. */
  deleteApplication: (id: ID) => void;
  /** §2 — an accepted applicant becomes a contractor account. */
  convertApplicant: (id: ID, now: Date) => ID;
  updateApplication: (id: ID, patch: Partial<Application>) => void;
  /**
   * H3 had no create path at all — no button on the list, no action in its
   * empty state — and the default scenario seeds zero postings. So the screen
   * a reviewer lands on was terminal, and H4 (the editor) was unreachable
   * without switching scenario.
   */
  createPosting: (now: Date) => { id: ID; slug: string };
  updatePosting: (id: ID, patch: Partial<JobPosting>) => void;
  updateTeamMember: (id: ID, patch: Partial<TeamMember>) => void;

  /* ---- users & rights (screens U1–U5) ----
     The team could only be *joined*, through an accepted application, and once
     inside, the only thing about a member that could change was a checkbox.
     There was no way to add the bookkeeper who never applied for anything, no
     way to take somebody's access away without deleting the person, and no way
     to say what any of them were allowed to open. All five gaps are one entity,
     so they are one block of actions. */

  /**
   * A user typed in by hand — the path `/flows` carried as deliberately open.
   *
   * Deliberately not `convertApplicant` with the applicant made optional. That
   * one exists to tie a contractor's rights to a record somebody checked, and
   * it should keep meaning exactly that; an office account has no application
   * behind it and pretending otherwise would put an empty «Aus Bewerbung» link
   * on half the roster.
   */
  createTeamMember: (
    input: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      role: TeamRole;
      permissions: AdminPermission[];
      skills?: string[];
      regions?: string[];
    },
    now: Date,
  ) => ID;

  /**
   * The one writer of `active` and `deactivatedAt`, so the flag and the date it
   * changed cannot disagree. Nothing else is touched — see the schema note:
   * rights are kept while an account is off, because switching somebody back on
   * has to restore what they had.
   */
  setTeamMemberActive: (id: ID, active: boolean, now: Date) => void;

  setTeamMemberPermissions: (id: ID, permissions: AdminPermission[]) => void;

  /** Real, and refused by the screen wherever anything still names the person. */
  deleteTeamMember: (id: ID) => void;

  /**
   * Mints a reset link and remembers it was minted. Returns the token so the
   * screen can show the link once; the record keeps enough to answer "did I
   * already send Sandra one?" after a reload.
   */
  issuePasswordReset: (id: ID, now: Date) => string;

  /* ---- change log (screen 83) ----
     Nothing wrote to data.changeLog before this; the only entries in the whole
     app came from the seed. So the screen that promises to answer "since when
     has Saturday cost 25%?" could never answer it. */
  logChange: (entry: {
    entity: string;
    entityId: ID;
    summary: string;
    actor?: string;
    /** Replace the previous entry for the same record instead of appending —
        for autosaving screens, which would otherwise log every keystroke. */
    coalesce?: boolean;
  }) => void;

  /* ---- invoicing (screens 71, 71a, 72) ----
     data.invoices used to be read-only: no path created one, no path edited a
     draft, and the word "paid" appeared nowhere outside the seed. Then there
     was one path, and it started from a finished job — so the half of billing
     that is not a finished job still had none. */
  /**
   * The one way an invoice comes into being.
   *
   * It used to be `createInvoiceForBooking(bookingId)` and nothing else, so
   * everything a cleaning company bills that is not a finished job — a
   * call-out fee, a material charge, a correction after a complaint — had no
   * route into the product at all. The office's answer is to write those in
   * the accounting system, which is how a customer ends up holding an invoice
   * this app has never heard of.
   *
   * So the job became an *input* rather than the entry point. Given one, the
   * invoice hangs off it and moves it to `invoiced`; without one it is a
   * standalone bill. Seeding the lines from the accepted quote stayed on the
   * screen — it is the screen that can turn a catalogue slug into a name in
   * the reader's language, and by the time this runs the owner has edited
   * them anyway.
   */
  createInvoice: (
    input: {
      customerId: ID;
      bookingId?: ID;
      lines: InvoiceLine[];
      /** Days until it is due, counted from approval. */
      termDays: number;
    },
    now: Date,
  ) => ID | null;
  /**
   * Off the record entirely — draft only.
   *
   * §15 keeps anything that has been in front of a customer, so a sent invoice
   * is cancelled and never deleted. A draft has been in front of nobody: it is
   * a number the office typed and does not want, and forcing it to live for
   * ever as «storniert» buries the real cancellations under clerical noise.
   * Returns false when the invoice is past draft, so the screen cannot talk
   * the store into it.
   */
  deleteInvoice: (id: ID) => boolean;
  /**
   * Cancel this one and open its replacement in the same move.
   *
   * The honest answer to "can I fix a sent invoice": no — but the correction
   * has to go somewhere. Cancelling alone left the owner to rebuild every line
   * by hand on a new draft, which is exactly when a wrong amount gets typed
   * twice. Both documents keep their own number and each points at the other.
   */
  reissueInvoice: (id: ID, now: Date, reason: string) => ID | null;
  updateInvoice: (id: ID, patch: Partial<Invoice>) => void;
  updateInvoiceLine: (id: ID, index: number, patch: Partial<InvoiceLine>) => void;
  addInvoiceLine: (id: ID) => void;
  removeInvoiceLine: (id: ID, index: number) => void;
  sendInvoice: (id: ID, now: Date) => void;
  /**
   * `method` is required, and is why `PaymentMethod` grew `qr-bill` and
   * `cash`. Marking an invoice paid used to flip the status and write nothing
   * else — no `Payment` record, so the data had a settled invoice and no trace
   * of how it settled. Every screen that wanted to print "paid by" had to
   * either guess from the customer's saved card or leave the column blank.
   */
  markInvoicePaid: (id: ID, now: Date, method: PaymentMethod) => void;
  /**
   * The booking goes back to `completed` when its invoice is cancelled.
   *
   * It was left on `invoiced`, and the invoice screen's billable list is
   * «completed jobs with no invoice» — so cancelling the only invoice for a
   * job made that job permanently unbillable in the app. A wrongly-issued
   * invoice is the ordinary case for cancelling, and re-issuing it is the
   * ordinary thing to do next.
   */
  cancelInvoice: (id: ID, reason: string) => void;

  /* ---- costs (screens 71b, 71c) ----
     `invoices` said what came in and nothing said what went out, so the one
     question an owner opens the money section to ask — «was bleibt am
     Monatsende» — had no answer anywhere in the app. These four are the
     smallest set that makes a cost a record rather than a note: raise it,
     correct it, settle it, and remove one that should never have been typed. */
  /**
   * The reference is minted here, not by the form.
   *
   * Same rule as `createInvoice`: highest number ever seen plus one, so a
   * scenario seeded in the 0040s cannot hand out an 0004 next and two costs
   * cannot share a number the bookkeeper is meant to look them up by.
   */
  createExpense: (
    input: {
      category: ExpenseCategory;
      /** Ignored on a labour cost — the worker's name is written instead. */
      supplier: string;
      note?: string;
      amount: number;
      incurredAt: ISODate;
      dueAt?: ISODate;
      bookingId?: ID;
      recurring?: boolean;
      /**
       * Required when the category is `labour`, and refused on anything else.
       *
       * The type cannot express that — see `Expense.labour` — so this is the
       * place it is actually true. A labour cost with nobody on it, no job or
       * no hours is not a half-record to be tidied up later: it is a row the
       * workforce board would count in a total and be unable to attribute.
       */
      labour?: LabourEntry;
    },
    now: Date,
  ) => ID | null;
  /**
   * Corrections, and the two the merge is not allowed to produce.
   *
   * A patch that would leave a labour row without a complete crew is refused
   * rather than written, and a row that stops being labour loses the crew with
   * the category — otherwise «Arbeitszeit» changed to «Material» would keep
   * three people and a job attached to a receipt from the wholesaler, invisible
   * on screen and still summed by the workforce board.
   */
  updateExpense: (id: ID, patch: Partial<Expense>) => void;
  /** `method` is required for the reason it is on an invoice: "paid" with no
      route is a fact with the useful half missing. */
  markExpensePaid: (id: ID, now: Date, method: PaymentMethod) => void;
  /**
   * Gone, at any status — and that is the difference from an invoice.
   *
   * §15 keeps an invoice past draft because somebody outside the company is
   * holding a copy of it. Nobody has ever been handed one of these: it is the
   * office's own note of a bill it received, and one entered twice is clerical
   * noise, not a document. Returns false only for an id that is not there.
   */
  deleteExpense: (id: ID) => boolean;

  /* ---- field check in / out (screen 87) ----
     The screen enforced a three-photo minimum and then threw the photos away,
     along with the note and the reported extra hours. Nothing reached the
     store, and no timeline event was appended — so the booking detail in the
     panel showed no trace that anyone had been there. */
  recordCheck: (
    bookingId: ID,
    input: {
      kind: 'in' | 'out';
      photos: string[];
      note: string;
      /** §5.3 — reported for the office to price. Never charged here. */
      extraHours?: number | null;
    },
    now: Date,
  ) => void;

  /* ---- saved payment methods (screen 45) ----
     Add, remove and set-default were all local component state, so every
     change vanished on navigation. */
  addPaymentMethod: (
    input: { customerId: ID; kind: SavedMethodKind; label: string; expiresAt?: string },
    now: Date,
  ) => void;
  removePaymentMethod: (id: ID) => void;
  setDefaultPaymentMethod: (id: ID) => void;

  /* ---- plans, the catalogue (screens 69, 69a, 70) ----
     There was no catalogue. `PlanTier` was three string literals, so a plan
     could not be added, renamed, repriced or retired without a deploy — and
     "Add Plan" had nothing to add to. */
  createPlan: (
    input: Omit<Plan, 'id' | 'reference' | 'order'>,
    now: Date,
  ) => ID;
  updatePlan: (id: ID, patch: Partial<Plan>) => void;
  /** Stops it being sold. Leaves every existing subscriber untouched. */
  setPlanActive: (id: ID, active: boolean) => void;
  setPlanVisible: (id: ID, visibleOnSite: boolean) => void;

  /* ---- plans, the subscribers (screens 43 + 70) ---- */
  /**
   * Opens a plan against a paid quote. Returns null if the plan is retired or
   * the property already holds one — both are refusals, not silent no-ops.
   */
  openSubscription: (
    input: { customerId: ID; propertyId: ID; planId: ID; method: PaymentMethod },
    now: Date,
  ) => ID | null;
  /** Buys another term. Returns the id of the invoice raised for it. */
  renewSubscription: (id: ID, now: Date) => ID | null;
  pauseSubscription: (id: ID, now: Date) => void;
  resumeSubscription: (id: ID, now: Date) => void;
  /** Cancels the coming visit and records the skip against the allowance. */
  skipNextVisit: (id: ID, now: Date) => void;
  /**
   * Accepts a finished job — and spends the plan visit it used, if it used one.
   *
   * The approval itself was a `patchData` on the booking screen, which was
   * fine while nothing else depended on it. A plan counts visits now, and
   * "a visit is spent when the office accepts the job" is a rule about the
   * business, not about that screen: left there, the plan would still read
   * zero used after a year of work booked from anywhere else.
   */
  approveBooking: (id: ID, label: string, now: Date) => void;
  /**
   * Moving a confirmed job — and telling the customer, in the same call.
   *
   * The booking screen did this inline: patch `start`, patch `status`, push a
   * timeline line. Nothing reached the customer. Their next appointment simply
   * read a different date the next time they opened the account, which is the
   * one thing §15 calls an operational notice — the kind they cannot switch
   * off, because it is not marketing, it is a van arriving on a different day.
   *
   * It lives here rather than on the screen so the two halves cannot come
   * apart. A reschedule that moved the job and forgot the message would look
   * identical in the store and be a phone call on the day.
   */
  rescheduleBooking: (
    input: {
      id: ID;
      start: ISODate;
      historyLabel: string;
      /** Keyed by the booking reference, so it lands in that thread. */
      notice: { subject: string; body: string };
    },
    now: Date,
  ) => void;
  /**
   * Cancels and refunds, or returns why it may not be. The caller gets the
   * reason rather than a boolean because "already used" and "window closed"
   * are different things to tell a customer.
   */
  cancelSubscription: (id: ID, now: Date) => CancelBlock | null;
  /**
   * Moves a running plan up to a bigger package on the same service.
   *
   * `UpgradeBlock` rather than a boolean, for the same reason `CancelBlock` is
   * one: "your plan is paused", "that package is not sold any more" and "that
   * is not a bigger plan" are three different sentences to a customer, and a
   * button that just fails to do anything says none of them.
   */
  upgradeSubscription: (
    input: { id: ID; toPlanId: ID; method: PaymentMethod },
    now: Date,
  ) => { invoiceId: ID } | { blocked: UpgradeBlock };

  /* ---- reviews (screens 46 + 78) ---- */
  submitReview: (
    input: {
      bookingId: ID;
      customerId: ID;
      rating: number;
      text: string;
      publishConsent: boolean;
    },
    now: Date,
  ) => void;
  /* Was the three statuses written out by hand, which is how `hidden` could be
     added to the union in `schema.ts` and still be unwritable from anywhere. */
  setReviewStatus: (id: ID, status: ReviewStatus) => void;
  replyToReview: (id: ID, reply: string) => void;
  /**
   * Gone, not archived — the same position the applicant screen takes, and for
   * the same law. A review is somebody else's words about their own household;
   * when they withdraw them (§20.6 consent is revocable, revDSG art. 32), the
   * office has to be able to make the record go away rather than move it to a
   * status the customer would still call "you kept it". `hidden` is the state
   * for a review the office is parking; this is for one that must not exist.
   *
   * The Protokoll keeps the trace, which is the point of deleting *here*
   * rather than out of localStorage by hand: the entry records that a review
   * was removed and by whom, and carries no word of what it said.
   */
  deleteReview: (id: ID) => void;

  /** Screen 88 — the no-access report, including whether the wait was shown. */
  recordNoAccess: (
    bookingId: ID,
    input: { reason: string; note: string; photo: boolean },
    now: Date,
  ) => void;

  /* ---- customer messages (screen 48 + its missing admin counterpart) ---- */
  sendMessage: (
    input: {
      customerId: ID;
      subject: string;
      body: string;
      from: CustomerMessage['from'];
      attachments?: MessageAttachment[];
    },
    now: Date,
  ) => void;
  /**
   * `new` means nobody has looked. Reading the request is what stops that
   * being true, so it is the request screen that says so — not the quote
   * builder, which used to be the only writer. The office's own screen said
   * "Neu" while somebody was sitting on it reading it, and the customer was
   * told nobody had opened their request until a quote was already being
   * priced.
   */
  markRequestOpened: (id: ID, now: Date) => void;
  /**
   * Which end of the thread has read it has to be said, not assumed.
   *
   * This took no `side` and always wrote `readByCustomer`, and its only caller
   * was the *admin* screen — so the owner opening a thread cleared the unread
   * badge in the customer's own sidebar for messages the customer had never
   * seen. A parameter the caller must fill is what stops that being a typo
   * away from coming back.
   */
  markThreadRead: (
    customerId: ID,
    subject: string,
    side: 'customer' | 'admin',
  ) => void;

  setRole: (role: DemoRole) => void;
  setScenario: (scenario: ScenarioName) => void;
  setDateOverride: (iso: string | null) => void;
  setCurrentCustomer: (id: string) => void;
  /**
   * Which account the panel is signed in as.
   *
   * The mirror of `setCurrentCustomer`, and it exists for exactly the reason
   * that one does. `repoint` picks the *first* contractor whenever the role
   * changes, so with rights now deciding what the console shows, four of the
   * five seeded accounts had states — no rights at all, three finance areas,
   * deactivated — that nothing on screen could reach.
   */
  setCurrentMember: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;

  /* ---- message templates (screen 79) ----
     The eleven texts were a fixed Record, so the screen could edit them and
     nothing else. Adding a twelfth, deleting one, or having two versions of
     the quote mail were all impossible — not unbuilt, impossible. */
  addTemplate: (template: MessageTemplate) => void;
  updateTemplate: (id: ID, patch: Partial<MessageTemplate>) => void;
  /**
   * Delete, with the one invariant that matters kept: an event that sends
   * automatically never ends up with no text.
   *
   * `replacementId` is the template that takes over as default when the one
   * being deleted held that job. The screen makes the admin choose it, rather
   * than picking silently here, because "which of these two goes out from now
   * on" is a business decision and the store guessing it is how the wrong mail
   * ships for a month before anyone notices.
   *
   * Deleting the last template of an event restores the seeded text instead of
   * leaving the event mute. That is a real deletion — the admin's edits are
   * gone — and the confirm step names it before it happens.
   */
  deleteTemplate: (id: ID, replacementId?: ID) => void;
  /** Promote one template of an event over its siblings. */
  setDefaultTemplate: (id: ID) => void;
  /**
   * §17.2 — the whole catalogue at once.
   *
   * Kept for the callers that genuinely replace the list; a screen editing one
   * service should use `updateService`, which cannot write its own stale copy
   * of the other seven back over a change made in another tab.
   *
   * "Edits reach the site immediately" is what this comment used to claim and
   * it is only half true: the request flow reads the store and follows at
   * once, while /leistungen, /preise and the homepage are rendered statically
   * from the seed and move at the next build.
   */
  setServices: (services: Service[]) => void;
  /**
   * A service the owner wrote, rather than one the seed shipped.
   *
   * There was no way to add one. The catalogue screen could edit seven rows
   * and change nothing about how many there were — so «wir machen jetzt auch
   * Teppichreinigung» was a code change, and the price list the business
   * actually sells from lived somewhere this app has never seen.
   *
   * Returns the created record so the caller can route to it by slug: the slug
   * is derived here from the German name and may have been suffixed to avoid a
   * collision, which means the caller cannot know it in advance.
   */
  createService: (input: Omit<Service, 'id' | 'slug' | 'order'>) => Service;
  /** One record, by id — so a screen editing a service cannot rewrite the rest. */
  updateService: (id: ID, patch: Partial<Omit<Service, 'id'>>) => void;
  /**
   * Draft → active → inactive, on its own rather than through `updateService`.
   *
   * Publishing is the one edit on this screen with an audience: it puts a price
   * on the website and opens the service in the request flow. It is logged as
   * the decision it is instead of coalescing into «Leistungskatalog
   * bearbeitet» with the twelve keystrokes that preceded it.
   */
  setServiceStatus: (id: ID, status: ServiceStatus) => void;
  /**
   * Refuses when a request, booking or plan still names the slug — see
   * `serviceUsage`. Returns false so the caller can say why rather than
   * silently doing nothing.
   */
  deleteService: (id: ID) => boolean;
  /**
   * An add-on the owner wrote, rather than one the seed shipped.
   *
   * `setAddOns` was the whole API: one setter taking the entire array, which
   * is all a screen needs when the only thing it can change is a checkbox. It
   * made creating impossible in practice — the caller would have had to mint
   * the id and the slug itself — and it logged every change, however small, as
   * «Add-on services edited».
   *
   * Returns the record because the slug is derived here from the German name
   * and may carry a collision suffix, so the caller cannot know in advance
   * where to route.
   */
  createAddOn: (input: Omit<AddOn, 'id' | 'slug'>) => AddOn;
  /** One record, by id — so a screen editing an add-on cannot rewrite the rest. */
  updateAddOn: (id: ID, patch: Partial<Omit<AddOn, 'id' | 'slug'>>) => void;
  /**
   * Availability, on its own rather than through `updateAddOn`.
   *
   * It is the one edit here with an audience — it puts a price in the request
   * flow or takes an option away — so it is logged as that decision instead of
   * coalescing into the keystrokes that happened to precede it.
   */
  setAddOnActive: (id: ID, active: boolean) => void;
  /**
   * Refuses while a request or a quote line still names it — see `addOnUsage`.
   * Returns false so the caller can say why rather than silently doing nothing.
   */
  deleteAddOn: (id: ID) => boolean;
  /* ---- the calendar's own entries (screens 58a, 63a) ----
     A booking could only ever come out of a paid quote, and the calendar could
     only ever show bookings. Between those two facts sat everything the owner
     actually does with a day: a job taken over the phone, a callback promised,
     a viewing before quoting. The seed says so out loud — "Rückruf zugesagt"
     is written into two internalNote fields, with no date and no screen that
     would ever show it again. */

  /**
   * A job the owner entered directly, with no quote behind it.
   *
   * /admin/buchungen has printed a "Manuell" source label since it was built,
   * for a kind of booking nothing in the app could produce. This is what makes
   * that label true. Refuses the same things the customer-facing picker
   * refuses — the daily ceiling, the notice period, closures — because a rule
   * the office can walk around is not a rule.
   */
  createManualBooking: (
    input: {
      customerId: ID;
      propertyId: ID;
      serviceSlug: string;
      start: ISODate;
      /** Minutes. */
      duration: number;
      assigneeId?: ID;
      note?: string;
    },
    now: Date,
  ) => { id: ID; reference: string } | { error: 'blocked'; reason: DayBlockReason };

  createCalendarEvent: (
    input: {
      kind: CalendarEventKind;
      title: string;
      start: ISODate;
      duration: number;
      customerId?: ID;
      contactName?: string;
      contactPhone?: string;
      propertyId?: ID;
      note?: string;
      assigneeId?: ID;
    },
    now: Date,
  ) => ID;
  /** Every close-out goes through here so the timeline records who and when. */
  setCalendarEventStatus: (
    id: ID,
    status: CalendarEventStatus,
    now: Date,
    outcome?: string,
  ) => void;
  updateCalendarEvent: (id: ID, patch: Partial<CalendarEvent>) => void;
  /**
   * The deal path: the call produced work, so it becomes a request and stops
   * being a thing to do. Marks the event `converted` and keeps the link both
   * ways — without it the call would sit on the calendar as an open promise
   * that has in fact already been kept.
   */
  linkEventToRequest: (id: ID, requestId: ID, now: Date) => void;

  /**
   * A coupon switched on or off, on its own rather than through `patchData`.
   *
   * Screen 76 flips this from the list, where it is the whole action rather
   * than one field of an edit — so it is the one coupon change with an
   * audience, and the only one worth a line in the Protokoll. Everything else
   * on a coupon goes through the edit screen's draft and lands in one write
   * when the button is pressed.
   */
  setCouponActive: (id: ID, active: boolean) => void;

  patchData: (patch: Partial<DataSet>) => void;
  addHold: (hold: SlotHold) => void;
  releaseHold: (id: string) => void;
  reset: () => void;
}

/**
 * Re-point "who am I" after the dataset is rebuilt.
 *
 * Switching scenario or moving the clock throws the data away and builds it
 * again, which can delete the very customer or team member the demo bar is
 * currently standing in. Left alone, the account screens greet nobody and the
 * field screens show an empty day that looks like a bug rather than a state.
 *
 * A contractor with no contractor in the scenario resolves to *nobody* rather
 * than falling back to the owner: showing the owner's day through a
 * contractor's permissions is exactly the confusion the role gate exists to
 * prevent, and "no jobs" is the honest answer for a company that has not hired
 * anyone yet.
 */
function repoint(demo: DemoState, data: DataSet): DemoState {
  const wantsOwner = demo.role !== 'contractor';
  /*
   * "Not the owner" rather than "is a contractor".
   *
   * `DemoRole` has four values and `TeamRole` now has three, so the two lists
   * stopped lining up the day the office account arrived: matching on
   * `role === 'contractor'` threw Sandra away on every scenario switch and
   * dropped the demo back onto Marta. Which is exactly what the member picker
   * in the demo bar exists to prevent — four of the five seeded accounts have
   * a permission state nothing else on screen can reach.
   */
  const fits = (m: TeamMember) => (wantsOwner ? m.role === 'owner' : m.role !== 'owner');
  const current = data.team.find((m) => m.id === demo.currentMemberId);

  return {
    ...demo,
    currentCustomerId: data.customers.some((c) => c.id === demo.currentCustomerId)
      ? demo.currentCustomerId
      : (data.customers[0]?.id ?? ''),
    currentMemberId:
      current && fits(current)
        ? demo.currentMemberId
        : (data.team.find(fits)?.id ?? ''),
  };
}

function initialDemo(): DemoState {
  return {
    role: 'visitor',
    scenario: 'demo',
    dateOverride: null,
    // The demo account. cus_2 is the only seeded customer with a request, a
    // subscription and an invoice at once, so every account screen has
    // something to show without switching customer first.
    currentCustomerId: 'cus_2',
    currentMemberId: 'tm_owner',
  };
}

/**
 * Built once so the initial `data` and the initial `holds` describe the same
 * world. Calling `buildScenario` twice would produce two datasets whose ids
 * happen to match and whose timestamps do not.
 */
const INITIAL_DATA = buildScenario('demo', new Date());

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      data: INITIAL_DATA,
      settings: SEED_SETTINGS,
      services: SEED_SERVICES,
      addOns: SEED_ADDONS,
      plans: SEED_PLANS,
      holds: seedHolds(INITIAL_DATA, new Date()),
      demo: initialDemo(),
      draft: emptyDraft(),
      applicationDraft: emptyApplicationDraft(),

      updateDraft: (patch) =>
        set((s) => ({
          draft: { ...s.draft, ...patch, updatedAt: new Date().toISOString() },
        })),

      resetDraft: () => set({ draft: emptyDraft() }),

      /**
       * §8.3 — a request can be sent as a guest. The account is created when
       * the *quote* is sent, not here; matching on email or phone links the
       * request to an existing customer instead of creating a duplicate
       * (§20.1, "حسابان بنفس الشخص").
       */
      submitDraft: (now) => {
        const state = get();
        const { draft, data, settings } = state;

        const existing = data.customers.find(
          (c) =>
            c.email.toLowerCase() === draft.contact.email.toLowerCase() ||
            (draft.contact.phone && c.phone === draft.contact.phone),
        );

        /*
         * Length-prefixed, like every other id in this store. A bare stamp is
         * not unique here: `useNow` ticks every 30 seconds, and the demo clock
         * can be pinned outright — with a fixed date, two requests submitted
         * in one session came out with the same id, and the second shadowed
         * the first everywhere `find` is used.
         */
        const stamp = now.getTime().toString(36).slice(-4);
        const customerId = existing?.id ?? `cus_${data.customers.length}_${stamp}`;
        const customers = existing
          ? data.customers
          : [
              ...data.customers,
              {
                id: customerId,
                firstName: draft.contact.firstName,
                lastName: draft.contact.lastName,
                email: draft.contact.email,
                phone: draft.contact.phone,
                language: draft.contact.language,
                loginMethod: 'magic-link' as const,
                status: 'active' as const,
                createdAt: now.toISOString(),
                notifications: {
                  operational: true,
                  marketing: false,
                  channelEmail: true,
                  channelSms: true,
                },
              },
            ];

        let propertyId = draft.propertyId;
        let properties = data.properties;
        if (!propertyId) {
          propertyId = `prp_${data.properties.length}_${stamp}`;
          const input = draft.property;
          const property: Property = {
            id: propertyId,
            customerId,
            label: input.street || 'Property',
            street: input.street,
            postcode: input.postcode,
            city: input.city,
            kind: input.kind,
            area: input.area ?? 0,
            rooms: input.rooms ?? 0,
            bathrooms: input.bathrooms ?? 1,
            floor: input.floor,
            hasElevator: input.hasElevator,
            hasPets: input.hasPets,
            needsExtraEffort: input.needsExtraEffort,
            access: draft.access ?? undefined,
          };
          properties = [...properties, property];
        }

        /*
         * The last gate, not the first. `/anfrage/objekt` already refuses to
         * continue on an out-of-area postcode, but the wizard's later steps are
         * addressable URLs and the draft survives a reload — so the rule has to
         * hold in the one place every path goes through. Nothing is committed:
         * the customer and property built above are still locals here.
         */
        const postcode =
          properties.find((p) => p.id === propertyId)?.postcode ?? draft.property.postcode;
        if (checkCoverage(postcode, settings.servedPostcodes).state !== 'inside') return null;

        const reference = `A-${(2500 + data.requests.length).toString()}`;
        const request: ServiceRequest = {
          id: `req_${data.requests.length}_${stamp}`,
          reference,
          customerId,
          propertyId,
          serviceSlug: draft.serviceSlug!,
          addOnIds: draft.addOnIds,
          windowCount: draft.windowCount ?? undefined,
          furniturePieces: draft.furniturePieces ?? undefined,
          preferred: draft.preferred,
          photoIds: draft.photos.map((p) => p.id),
          customerNote: draft.customerNote || undefined,
          status: 'new',
          createdAt: now.toISOString(),
          planIntent: draft.planIntent ?? undefined,
        };

        set({
          data: {
            ...data,
            customers,
            properties,
            requests: [request, ...data.requests],
            photos: [
              ...data.photos,
              ...draft.photos.map((p) => ({
                id: p.id,
                src: `/placeholder/${p.id}.svg`,
                source: 'customer' as const,
                kind: 'context' as const,
                visibleToCustomer: true,
                publishConsent: false,
                note: p.note || undefined,
                requestId: request.id,
                takenAt: now.toISOString(),
              })),
            ],
          },
          draft: emptyDraft(),
          demo: { ...state.demo, currentCustomerId: customerId },
        });

        return { reference };
      },

      /* ---------------------------------------------- admin-side intake ---- */

      createCustomer: (input, now) => {
        const s = get();
        /*
         * Length first, then the clock. `useNow` ticks every 30 seconds and
         * the demo clock can be pinned outright, so a bare timestamp is not
         * unique — add a customer and their property in one sitting and both
         * ids come out identical. `find` then returns the wrong record and the
         * request quietly points at somebody else's address. The subscription
         * screen already learned this; the same shape is used here.
         */
        const id = `cus_${s.data.customers.length}_${now.getTime().toString(36).slice(-4)}`;

        const customer: Customer = {
          id,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: input.email.trim(),
          phone: input.phone.trim(),
          language: input.language,
          /*
           * §8.3 — the same login method `submitDraft` gives a customer it
           * invents. A record the office typed in is not a record that chose a
           * password, and offering one here would put a credential on file
           * that the person themselves never set.
           */
          loginMethod: 'magic-link',
          status: 'active',
          createdAt: now.toISOString(),
          notifications: {
            operational: true,
            marketing: false,
            channelEmail: true,
            channelSms: true,
          },
          internalNotes: input.internalNotes?.trim() || undefined,
          /* Absent rather than a record of empty strings — the detail screen
             tests the whole address for truthiness before it renders the
             block, the same way it treats the internal note. */
          address: normaliseAddress(input.address),
        };

        set({ data: { ...s.data, customers: [customer, ...s.data.customers] } });
        get().logChange({
          entity: 'customer',
          entityId: id,
          summary: `Customer created: ${customer.firstName} ${customer.lastName}`,
        });
        return id;
      },

      updateCustomer: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            customers: s.data.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          },
        })),

      createProperty: (input, now) => {
        const s = get();
        const id = `prp_${s.data.properties.length}_${now.getTime().toString(36).slice(-4)}`;

        set({
          data: { ...s.data, properties: [...s.data.properties, { ...input, id }] },
        });
        get().logChange({
          entity: 'property',
          entityId: id,
          summary: `Property created: ${input.label || input.street}`,
        });
        return id;
      },

      updateProperty: (id, patch) => {
        const s = get();
        const before = s.data.properties.find((p) => p.id === id);
        if (!before) return;

        set({
          data: {
            ...s.data,
            properties: s.data.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          },
        });
        get().logChange({
          entity: 'property',
          entityId: id,
          summary: `Property edited: ${patch.label ?? before.label ?? before.street}`,
          /* The detail screen writes the standing note on every keystroke.
             Without this the log would carry one entry per character typed. */
          coalesce: true,
        });
      },

      deleteProperty: (id) => {
        const s = get();
        const property = s.data.properties.find((p) => p.id === id);
        if (!property) return false;
        if (propertyUsage(s.data, id).total > 0) return false;

        set({
          data: { ...s.data, properties: s.data.properties.filter((p) => p.id !== id) },
        });
        get().logChange({
          entity: 'property',
          entityId: id,
          summary: `Property deleted: ${property.label || property.street}`,
        });
        return true;
      },

      recordKey: (input, now) => {
        const s = get();
        /* Length first, then the clock. `now` only ticks every 30 seconds, so
           two keys taken in one sitting — a front door and its spare, which is
           the normal case — would collide on a bare timestamp. */
        const id = `key_${s.data.keyLog.length}_${now.getTime().toString(36).slice(-4)}`;
        const property = s.data.properties.find((p) => p.id === input.propertyId);

        set({
          data: {
            ...s.data,
            keyLog: [
              ...s.data.keyLog,
              { ...input, id, receivedAt: now.toISOString(), status: 'held' },
            ],
          },
        });
        get().logChange({
          entity: 'key',
          entityId: id,
          summary: `Key taken in: ${property?.label || property?.street || input.propertyId} — ${input.storageLocation}`,
          actor: input.receivedBy,
        });
        return id;
      },

      returnKey: (id, input) => {
        const s = get();
        const entry = s.data.keyLog.find((k) => k.id === id);
        if (!entry || entry.status === 'returned') return false;

        const property = s.data.properties.find((p) => p.id === entry.propertyId);

        set({
          data: {
            ...s.data,
            keyLog: s.data.keyLog.map((k) =>
              k.id === id ? { ...k, ...input, status: 'returned' as const } : k,
            ),
          },
        });
        get().logChange({
          entity: 'key',
          entityId: id,
          summary: `Key returned: ${property?.label || property?.street || entry.propertyId} — to ${input.returnedTo}`,
          actor: input.returnedBy,
        });
        return true;
      },

      createRequestForCustomer: (input, now) => {
        const s = get();
        const property = s.data.properties.find((p) => p.id === input.propertyId);
        /*
         * The phone is not an exception to the area. Intake used to record the
         * request and mark it, which made the office the one path that could
         * still put an unservable address into the queue — and the queue then
         * had to carry a warning chip for a job nobody was ever going to do.
         * A draft is exempt: it is a note taken mid-call, before the address
         * is necessarily right, and the check runs again when it is submitted.
         */
        if (
          !input.asDraft &&
          checkCoverage(property?.postcode ?? '', s.settings.servedPostcodes).state !== 'inside'
        ) {
          return null;
        }

        const id = `req_${s.data.requests.length}_${now.getTime().toString(36).slice(-4)}`;
        /* Same counter the wizard uses, so a phoned-in request and a
           self-service one are indistinguishable downstream — which is the
           point: the pipeline after intake must not care where it came from. */
        const reference = `A-${(2500 + s.data.requests.length).toString()}`;

        const request: ServiceRequest = {
          id,
          reference,
          customerId: input.customerId,
          propertyId: input.propertyId,
          serviceSlug: input.serviceSlug,
          addOnIds: input.addOnIds,
          windowCount: input.windowCount ?? undefined,
          furniturePieces: input.furniturePieces ?? undefined,
          preferred: input.preferred,
          photoIds: [],
          customerNote: input.customerNote?.trim() || undefined,
          internalNote: input.internalNote?.trim() || undefined,
          /*
           * `inReview` rather than `new`. "New" means nobody has looked at it;
           * the person who typed this one was on the phone with the customer
           * while doing so, and leaving it in the unread bucket would make the
           * response-time counter on screen 52 flag a request that was in fact
           * answered the moment it arrived.
           */
          status: input.asDraft ? 'draft' : 'inReview',
          createdAt: now.toISOString(),
          /* A draft has not been opened, because it has not arrived. Stamping
             it would start the response clock against a note to self. */
          openedAt: input.asDraft ? undefined : now.toISOString(),
          planIntent: input.planIntent ?? undefined,
        };

        set({ data: { ...s.data, requests: [request, ...s.data.requests] } });
        get().logChange({
          entity: 'request',
          entityId: id,
          summary: input.asDraft
            ? `Request saved as a draft: ${reference}`
            : `Request taken by phone: ${reference}`,
        });
        return { id, reference };
      },

      updateRequest: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            requests: s.data.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          },
        })),

      submitRequestDraft: (id, now) => {
        const s = get();
        const request = s.data.requests.find((r) => r.id === id);
        if (!request || request.status !== 'draft') return;

        /* Where the draft's exemption ends. The address may have been half
           written down when the call was taken; this is the moment it becomes
           a request, so it is the moment the area has to hold. */
        const property = s.data.properties.find((p) => p.id === request.propertyId);
        if (
          checkCoverage(property?.postcode ?? '', s.settings.servedPostcodes).state !== 'inside'
        ) {
          return;
        }

        set({
          data: {
            ...s.data,
            requests: s.data.requests.map((r) =>
              r.id !== id
                ? r
                : {
                    ...r,
                    status: 'inReview' as const,
                    /* The clock starts here, not when the draft was opened.
                       Dating it from the draft would show a request that
                       breached the response window before anyone saw it. */
                    createdAt: now.toISOString(),
                    openedAt: now.toISOString(),
                  },
            ),
          },
        });
        get().logChange({
          entity: 'request',
          entityId: id,
          summary: `Draft turned into a request: ${request.reference}`,
        });
      },

      discardRequestDraft: (id) =>
        set((s) => {
          const request = s.data.requests.find((r) => r.id === id);
          /* Guarded rather than trusted: this deletes outright, and the only
             thing that makes that safe is that a draft has no quote, no
             booking and no invoice hanging off it. */
          if (!request || request.status !== 'draft') return {};
          return {
            data: { ...s.data, requests: s.data.requests.filter((r) => r.id !== id) },
          };
        }),

      /* -------------------------------------- ending a request or quote ---- */

      cancelRequest: (requestId, by, reason, now) =>
        set((s) => ({
          data: {
            ...s.data,
            requests: s.data.requests.map((r) =>
              r.id !== requestId
                ? r
                : {
                    ...r,
                    status:
                      by === 'customer'
                        ? ('cancelledByCustomer' as const)
                        : ('cancelledByCompany' as const),
                    respondedAt: now.toISOString(),
                    internalNote: [r.internalNote, reason].filter(Boolean).join('\n'),
                  },
            ),
            /*
             * A cancelled request must take its open quote with it. Leaving a
             * `sent` offer behind would keep it live on /konto/offerten and
             * still be signable — the customer would be booking a job they had
             * just called off.
             */
            offers: s.data.offers.map((o) =>
              o.requestId === requestId && (o.status === 'draft' || o.status === 'sent')
                ? { ...o, status: 'rejected' as const }
                : o,
            ),
          },
        })),

      declineOffer: (offerId, reason, now) =>
        set((s) => {
          const offer = s.data.offers.find((o) => o.id === offerId);
          if (!offer) return {};
          return {
            data: {
              ...s.data,
              offers: s.data.offers.map((o) =>
                o.id === offerId ? { ...o, status: 'rejected' as const } : o,
              ),
              /*
               * The request goes with it. §4.1 asks for a reason on the way
               * out in the other direction; the same courtesy applies here,
               * and the reason is the one thing that tells the owner whether
               * to follow up or let it go.
               */
              requests: s.data.requests.map((r) =>
                r.id !== offer.requestId
                  ? r
                  : {
                      ...r,
                      status: 'rejected' as const,
                      respondedAt: now.toISOString(),
                      internalNote: [r.internalNote, reason].filter(Boolean).join('\n'),
                    },
              ),
            },
            /* Whatever slot the customer was holding goes back to the calendar
               the moment they decline — otherwise it stays reserved for a job
               that will never happen until the 15-minute hold lapses. */
            holds: s.holds.filter((h) => h.offerId !== offerId),
          };
        }),

      /* ----------------------------------------------- quote building ---- */

      /**
       * §9.1 — the quote screen opens with lines already filled in. This is
       * that pre-fill, and it runs through the same buildOfferLines the
       * customer-facing quote uses, so the two can never disagree.
       */
      ensureDraftOffer: (requestId, now) => {
        const s = get();
        const existing = s.data.offers.find(
          (o) => o.requestId === requestId && o.status === 'draft',
        );
        if (existing) return existing.id;

        const request = s.data.requests.find((r) => r.id === requestId)!;
        const property = s.data.properties.find((p) => p.id === request.propertyId)!;
        const service = s.services.find((x) => x.slug === request.serviceSlug)!;
        const { lines, estimatedHours } = buildOfferLines({
          request,
          property,
          service,
          addOns: s.addOns,
          settings: s.settings,
        });

        const id = `off_${now.getTime().toString(36).toUpperCase().slice(-5)}`;
        const offer: Offer = {
          id,
          reference: `O-${request.reference.replace('A-', '')}-1`,
          requestId,
          version: 1,
          lines,
          // §17.2 — the quote opens with whatever screen 79 currently holds,
          // in the customer's language, falling back to German (§20.6). Reading
          // the event's *default* rather than a fixed key is what lets an admin
          // keep two covering letters and switch which one new quotes open with.
          message: (() => {
            const template = defaultFor(s.settings.messageTemplates, 'offer-sent');
            const language =
              s.data.customers.find((c) => c.id === request.customerId)?.language ?? 'de';
            return template
              ? textFor(template.body, language) || DEFAULT_OFFER_MESSAGE
              : DEFAULT_OFFER_MESSAGE;
          })(),
          status: 'draft',
          estimatedHours,
        };

        set({
          data: {
            ...s.data,
            offers: [offer, ...s.data.offers],
            /* Screen 53 normally gets here first. This stays as the backstop
               for the paths that skip it — the list writes a quote straight
               from the row — so a priced request can never still read "Neu". */
            requests: s.data.requests.map((r) =>
              r.id === requestId && r.status === 'new'
                ? { ...r, status: 'inReview' as const, openedAt: now.toISOString() }
                : r,
            ),
          },
        });

        return id;
      },

      updateOffer: (offerId, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) => (o.id === offerId ? { ...o, ...patch } : o)),
          },
        })),

      updateOfferLine: (offerId, lineId, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) =>
              o.id !== offerId
                ? o
                : {
                    ...o,
                    lines: o.lines.map((line) =>
                      line.id !== lineId
                        ? line
                        : {
                            ...line,
                            ...patch,
                            // Editing the hours of an hourly line has to move
                            // the scheduled time with it, or the calendar and
                            // the invoice stop agreeing.
                            hours:
                              patch.hours ??
                              (line.calc === 'hourly' && patch.quantity !== undefined
                                ? patch.quantity
                                : line.hours),
                          },
                    ),
                  },
            ),
          },
        })),

      addOfferLine: (offerId) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) =>
              o.id !== offerId
                ? o
                : {
                    ...o,
                    lines: [
                      ...o.lines,
                      {
                        /*
                         * Was `oli_new_${o.lines.length}`. Add a line, remove
                         * a different one, add again — same id. React saw a
                         * duplicate key, and updateOfferLine/removeOfferLine
                         * matched both rows, so editing one edited the other.
                         * The timestamp suffix is the pattern the key log
                         * already uses correctly.
                         */
                        id: `oli_${Date.now().toString(36)}_${o.lines.length}`,
                        label: '',
                        calc: 'hourly' as const,
                        quantity: 1,
                        unitPrice: s.settings.hourlyRate,
                        hours: 1,
                        optional: false,
                        selected: true,
                      },
                    ],
                  },
            ),
          },
        })),

      removeOfferLine: (offerId, lineId) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) =>
              o.id !== offerId ? o : { ...o, lines: o.lines.filter((l) => l.id !== lineId) },
            ),
          },
        })),

      sendOffer: (offerId, now) =>
        set((s) => {
          const offer = s.data.offers.find((o) => o.id === offerId);
          if (!offer) return {};
          return {
            data: {
              ...s.data,
              offers: s.data.offers.map((o) =>
                o.id !== offerId
                  ? o
                  : {
                      ...o,
                      status: 'sent' as const,
                      issuedAt: now.toISOString(),
                      expiresAt: new Date(
                        now.getTime() + s.settings.offerValidityDays * 86_400_000,
                      ).toISOString(),
                      /*
                       * §9.2 — the company signs first, so a quote is never
                       * in the customer's hands unsigned. Copied off settings
                       * rather than read from it at render time: redrawing the
                       * mark next year must not restate what was agreed today.
                       */
                      ownerSignature: {
                        ...s.settings.ownerSignature,
                        at: now.toISOString(),
                      },
                    },
              ),
              requests: s.data.requests.map((r) =>
                r.id === offer.requestId
                  ? { ...r, status: 'offerSent' as const, respondedAt: now.toISOString() }
                  : r,
              ),
            },
          };
        }),

      // §4.1 — a decline sends a reason. Silence is the one answer that is
      // never acceptable.
      rejectRequest: (requestId, reason, now) =>
        set((s) => ({
          data: {
            ...s.data,
            requests: s.data.requests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    status: 'rejected' as const,
                    respondedAt: now.toISOString(),
                    internalNote: [r.internalNote, reason].filter(Boolean).join('\n'),
                  }
                : r,
            ),
          },
        })),

      restoreRequest: (requestId) =>
        set((s) => ({
          data: {
            ...s.data,
            requests: s.data.requests.map((r) =>
              r.id !== requestId || r.status !== 'rejected'
                ? r
                : {
                    ...r,
                    status: 'inReview' as const,
                    /* The answer is withdrawn, so the response clock has to
                       start running again — leaving the stamp would show a
                       request that was answered and is still waiting. */
                    respondedAt: undefined,
                  },
            ),
          },
        })),

      /* -------------------------------------------- offer acceptance ---- */

      // §9.1 — switching an optional line off updates the total immediately,
      // and (via offerHours) genuinely shortens the visit. Price and duration
      // must move together or the scheduler books time nobody paid for.
      toggleOfferLine: (offerId, lineId) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((offer) =>
              offer.id !== offerId
                ? offer
                : {
                    ...offer,
                    lines: offer.lines.map((line) =>
                      line.id === lineId ? { ...line, selected: !line.selected } : line,
                    ),
                  },
            ),
          },
        })),

      holdOfferSlot: (offerId, slot, now) =>
        set((s) => ({
          // One hold per offer — re-picking replaces it rather than stacking.
          holds: [...s.holds.filter((h) => h.offerId !== offerId), createHold(offerId, slot, now)],
        })),

      /*
       * Preferences, not holds.
       *
       * Three dates blocked in a one-person calendar for as long as it takes
       * somebody to read their mail is two thirds of a week thrown away on a
       * job that may never happen. So nothing is reserved here; the race the
       * hold exists to prevent is fought once, at `confirmOfferSlot`, where
       * the office is looking at the calendar anyway.
       */
      proposeOfferSlots: (offerId, starts) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) =>
              o.id === offerId
                ? {
                    ...o,
                    proposedSlots: starts.slice(0, 3),
                    confirmedSlot: undefined,
                    slotConfirmedAt: undefined,
                  }
                : o,
            ),
          },
          holds: s.holds.filter((h) => h.offerId !== offerId),
        })),

      confirmOfferSlot: (offerId, start, now) =>
        set((s) => {
          const offer = s.data.offers.find((o) => o.id === offerId);
          if (!offer) return {};

          const duration = Math.round(offerHours(offer) * 60);
          const slot: Slot = {
            start,
            end: new Date(new Date(start).getTime() + duration * 60_000).toISOString(),
            durationMinutes: duration,
            routeCost: 0,
          };

          return {
            data: {
              ...s.data,
              offers: s.data.offers.map((o) =>
                o.id === offerId
                  ? { ...o, confirmedSlot: start, slotConfirmedAt: now.toISOString() }
                  : o,
              ),
            },
            holds: [
              ...s.holds.filter((h) => h.offerId !== offerId),
              createHold(offerId, slot, now, {
                minutes: CONFIRMED_HOLD_HOURS * 60,
                confirmed: true,
              }),
            ],
          };
        }),

      signOffer: (offerId, signature, now) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((offer) =>
              offer.id === offerId
                ? {
                    ...offer,
                    signedAt: now.toISOString(),
                    customerSignature: {
                      name: signature.name,
                      role: 'Auftraggeber',
                      path: signature.path,
                      at: now.toISOString(),
                    },
                  }
                : offer,
            ),
          },
        })),

      /**
       * §10 — payment in full on acceptance, then the slot becomes a booking.
       *
       * On failure the offer stays accepted-but-unpaid and the slot is NOT
       * booked (§20.2); the hold keeps running so the customer can retry
       * without losing the time they picked.
       */
      payOffer: (offerId, method, outcome, now) => {
        const s = get();
        const offer = s.data.offers.find((o) => o.id === offerId);
        const hold = s.holds.find((h) => h.offerId === offerId);
        if (!offer) return {};

        const stamp = now.getTime().toString(36).toUpperCase().slice(-4);
        const amount = offerTotal(offer);
        const request = s.data.requests.find((r) => r.id === offer.requestId)!;
        const hours = offerHours(offer);

        /*
         * §11.3 — a visit the plan already paid for is not charged again.
         *
         * The quote list gained a column saying whether a job is covered by a
         * plan, and a column that says "covered" over a gateway that then takes
         * the full amount is worse than no column at all. So coverage is
         * decided here, by the same function the column reads, and a covered
         * job books without a Payment record: the plan spends one of its
         * included visits and no second charge is raised for work the customer
         * has already paid for.
         */
        const coverage = requestCoverage(request, s.data.subscriptions, s.plans, now);
        const covered = coverage.kind !== 'payable';

        const payment: Payment = {
          id: `pay_${stamp}`,
          offerId,
          amount,
          method,
          at: now.toISOString(),
          status: outcome,
          gatewayRef: `mock_${stamp}`,
          failureReason: outcome === 'failed' ? 'card_declined' : undefined,
        };

        if (!covered && outcome === 'failed') {
          set({ data: { ...s.data, payments: [...s.data.payments, payment] } });
          return { failureReason: 'card_declined' };
        }

        const duration = Math.round(hours * 60);
        const reference = `B-${1050 + s.data.bookings.length}`;

        const booking: Booking = {
          id: `bkg_${stamp}`,
          reference,
          offerId,
          subscriptionId: coverage.kind === 'subscription' ? coverage.sourceId : undefined,
          customerId: request.customerId,
          propertyId: request.propertyId,
          serviceSlug: request.serviceSlug,
          start: hold?.start ?? now.toISOString(),
          duration,
          arrivalWindow: arrivalWindowMinutes(hours),
          status: 'scheduled',
          photoIds: [],
          history: [
            {
              at: now.toISOString(),
              kind: 'created',
              label:
                coverage.kind === 'subscription'
                  ? 'Booked — included in the plan'
                  : 'Booked and paid',
            },
          ],
        };

        set({
          data: {
            ...s.data,
            payments: covered ? s.data.payments : [...s.data.payments, payment],
            bookings: [booking, ...s.data.bookings],
            offers: s.data.offers.map((o) =>
              o.id === offerId ? { ...o, status: 'accepted' as const } : o,
            ),
            requests: s.data.requests.map((r) =>
              r.id === offer.requestId ? { ...r, status: 'accepted' as const } : r,
            ),
          },
          // The hold has done its job; releasing it frees the slot record.
          holds: s.holds.filter((h) => h.offerId !== offerId),
        });

        /*
         * The plan the customer actually asked for, opened now that the quote
         * behind it is paid.
         *
         * After the `set` above rather than inside it, because
         * `openSubscription` writes an invoice and a payment of its own and
         * needs to read the state this call just produced. Deliberately last:
         * if the plan is retired between the quote going out and the customer
         * paying, the booking still stands — refusing the job because a product
         * was withdrawn would punish them for our timing.
         */
        if (request.planIntent && outcome === 'succeeded') {
          get().openSubscription(
            {
              customerId: request.customerId,
              propertyId: request.propertyId,
              planId: request.planIntent,
              method,
            },
            now,
          );
        }

        return { bookingReference: reference };
      },

      // §20.1 — a negotiation produces a new version and voids the current one.
      requestOfferChange: (offerId, note) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) =>
              o.id === offerId
                ? { ...o, status: 'revisionRequested' as const, revisionNote: note }
                : o,
            ),
            requests: s.data.requests.map((r) =>
              r.id === s.data.offers.find((o) => o.id === offerId)?.requestId
                ? { ...r, status: 'revisionRequested' as const }
                : r,
            ),
          },
          holds: s.holds.filter((h) => h.offerId !== offerId),
        })),

      /*
       * §20.1 — a lapsed quote can be reissued in one action.
       *
       * Guarded here and not only in the button, because the action rewrites
       * `status` and drops `signedAt`: called on an accepted quote it would
       * strand the payment and the booking that quote already produced. The
       * caller gets `false` rather than a silent no-op — a success toast over
       * a state that did not move is the worse failure of the two.
       */
      reissueOffer: (offerId, now) => {
        const offer = get().data.offers.find((o) => o.id === offerId);
        if (!offer || !canReissue(offer, now)) return false;

        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) =>
              o.id === offerId
                ? {
                    ...o,
                    version: o.version + 1,
                    reference: o.reference.replace(/-\d+$/, `-${o.version + 1}`),
                    status: 'sent' as const,
                    issuedAt: now.toISOString(),
                    expiresAt: new Date(
                      now.getTime() + s.settings.offerValidityDays * 86_400_000,
                    ).toISOString(),
                    /*
                     * A new version is a new contract, so both marks start
                     * again: the customer's is cleared, and the company's is
                     * restamped now rather than carried over from a document
                     * with different numbers on it.
                     */
                    signedAt: undefined,
                    customerSignature: undefined,
                    ownerSignature: {
                      ...s.settings.ownerSignature,
                      at: now.toISOString(),
                    },
                  }
                : o,
            ),
          },
        }));

        return true;
      },

      /* ------------------------------------------------------- hiring */

      updateApplicationDraft: (patch) =>
        set((s) => ({
          applicationDraft: {
            ...s.applicationDraft,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        })),

      resetApplicationDraft: () => set({ applicationDraft: emptyApplicationDraft() }),

      submitApplication: (now) => {
        const s = get();
        const d = s.applicationDraft;
        // Continue the existing series rather than counting rows: deleting an
        // application (§14) must not hand its number to the next applicant.
        const highest = s.data.applications.reduce(
          (max, a) => Math.max(max, Number(a.reference.replace('BW-', '')) || 0),
          0,
        );
        const reference = `BW-${String(10_000 + highest + 1).slice(1)}`;

        const retain = new Date(now);
        retain.setMonth(retain.getMonth() + s.settings.applicationRetentionMonths);

        const application: Application = {
          id: `app_${now.getTime().toString(36).toUpperCase().slice(-5)}`,
          reference,
          postingId: d.postingId ?? undefined,
          spontaneous: d.postingId === null,
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
          phone: d.phone,
          postcode: d.postcode,
          city: d.city,
          permit: d.permit ?? 'other',
          languages: d.languages,
          hasDrivingLicence: d.hasDrivingLicence,
          hasCar: d.hasCar,
          yearsExperience: d.yearsExperience ?? 0,
          experienceAreas: d.experienceAreas,
          availability: d.availability,
          startFrom: d.startFrom || undefined,
          references: d.references,
          documents: d.documents,
          motivation: d.motivation || undefined,
          status: 'new',
          submittedAt: now.toISOString(),
          // §14 — the retention window is recorded at submission, from the
          // value that was in force then. Changing the setting later must not
          // silently extend how long an existing record is kept.
          retainUntil: retain.toISOString(),
          consentGivenAt: now.toISOString(),
        };

        set({
          data: { ...s.data, applications: [application, ...s.data.applications] },
          applicationDraft: emptyApplicationDraft(),
        });

        return { reference };
      },

      updateApplication: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            applications: s.data.applications.map((a) =>
              a.id === id ? { ...a, ...patch } : a,
            ),
          },
        })),

      setApplicationStatus: (id, status) => get().updateApplication(id, { status }),

      rejectApplication: (id, reason) =>
        get().updateApplication(id, { status: 'rejected', rejectionReason: reason }),

      deleteApplication: (id) =>
        set((s) => ({
          data: {
            ...s.data,
            applications: s.data.applications.filter((a) => a.id !== id),
          },
        })),

      /**
       * The bridge from applicant to contractor.
       *
       * The new member starts with the regions the applicant lives near and no
       * skills beyond cleaning — a furniture assembler is granted assembly
       * explicitly, because the field screens read `skills` to decide which
       * jobs a person may open.
       */
      convertApplicant: (id, now) => {
        const s = get();
        const app = s.data.applications.find((a) => a.id === id)!;
        if (app.convertedTeamMemberId) return app.convertedTeamMemberId;

        const memberId = `tm_${now.getTime().toString(36).toUpperCase().slice(-5)}`;
        const member: TeamMember = {
          id: memberId,
          firstName: app.firstName,
          lastName: app.lastName,
          email: `${app.firstName.toLowerCase()}.${app.lastName.toLowerCase()}@homivaro.ch`,
          phone: app.phone,
          role: 'contractor',
          active: true,
          /*
           * None, and the conversion screen has always said so — its four
           * sentences describe somebody who works from the field interface and
           * never opens the console. Handing a new hire console rights as a
           * side effect of being hired would make that screen's copy false at
           * the moment it is read. Rights are granted afterwards, deliberately,
           * on the account's own rights screen.
           */
          permissions: [],
          regions: s.settings.servedPostcodes,
          skills: app.experienceAreas.includes('assembly')
            ? ['moebelmontage']
            : ['unterhaltsreinigung', 'einmalreinigung'],
          startedAt: now.toISOString(),
          fromApplicationId: app.id,
        };

        set({
          data: {
            ...s.data,
            team: [...s.data.team, member],
            applications: s.data.applications.map((a) =>
              a.id === id
                ? { ...a, status: 'accepted' as const, convertedTeamMemberId: memberId }
                : a,
            ),
          },
        });

        return memberId;
      },

      createPosting: (now) => {
        const s = get();
        const stamp = now.getTime().toString(36);
        const slug = `neue-stelle-${stamp.slice(-4)}`;
        /* Unpublished, and deliberately titled rather than blank: a row with
           no title in a list is indistinguishable from a rendering fault. */
        const blank = { de: '', en: '', fr: '', it: '' };
        const blankList = { de: [], en: [], fr: [], it: [] };

        const posting: JobPosting = {
          id: `job_${stamp}`,
          slug,
          title: { ...blank, de: 'Neue Stelle', en: 'New job' },
          kind: 'part-time',
          workload: [40, 80],
          regions: [],
          summary: { ...blank },
          responsibilities: { ...blankList },
          requirements: { ...blankList },
          offer: { ...blankList },
          published: false,
          createdAt: now.toISOString(),
        };

        set({ data: { ...s.data, postings: [posting, ...s.data.postings] } });
        get().logChange({
          entity: 'posting',
          entityId: posting.id,
          summary: 'Job posting created',
        });
        return { id: posting.id, slug };
      },

      updatePosting: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            postings: s.data.postings.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          },
        })),

      updateTeamMember: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            team: s.data.team.map((m) => (m.id === id ? { ...m, ...patch } : m)),
          },
        })),

      createTeamMember: (input, now) => {
        const s = get();
        /* Length before the clock, for the reason `createCustomer` spells out:
           `useNow` ticks every 30 seconds and the demo clock can be pinned, so
           two accounts added in one sitting would otherwise share an id. */
        const id = `tm_${s.data.team.length}_${now.getTime().toString(36).slice(-4)}`;

        const member: TeamMember = {
          id,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: input.email.trim(),
          phone: input.phone.trim(),
          role: input.role,
          active: true,
          permissions: input.permissions,
          /* An office account gets neither, and the form does not ask: skills
             and regions decide which jobs somebody may be handed, and a
             bookkeeper is handed none. */
          regions: input.regions ?? [],
          skills: input.skills ?? [],
          startedAt: now.toISOString(),
        };

        set({ data: { ...s.data, team: [...s.data.team, member] } });
        get().logChange({
          entity: 'user',
          entityId: id,
          summary: `User created: ${member.firstName} ${member.lastName}`,
        });
        return id;
      },

      setTeamMemberActive: (id, active, now) => {
        const member = get().data.team.find((m) => m.id === id);
        if (!member) return;

        set((s) => ({
          data: {
            ...s.data,
            team: s.data.team.map((m) =>
              m.id === id
                ? {
                    ...m,
                    active,
                    /* Cleared on the way back in, so «deaktiviert am» can never
                       be printed under a live account. */
                    deactivatedAt: active ? undefined : now.toISOString(),
                  }
                : m,
            ),
          },
        }));

        get().logChange({
          entity: 'user',
          entityId: id,
          summary: `${active ? 'Reactivated' : 'Deactivated'} ${member.firstName} ${member.lastName}`,
        });
      },

      setTeamMemberPermissions: (id, permissions) => {
        const member = get().data.team.find((m) => m.id === id);
        if (!member) return;

        set((s) => ({
          data: {
            ...s.data,
            team: s.data.team.map((m) => (m.id === id ? { ...m, permissions } : m)),
          },
        }));

        get().logChange({
          entity: 'user',
          entityId: id,
          summary: `Access changed for ${member.firstName} ${member.lastName}: ${
            permissions.length === 0 ? 'no areas' : `${permissions.length} areas`
          }`,
          /* The rights screen writes on every flip. Without this, granting four
             areas one switch at a time files four entries and the log reads as
             an argument somebody had with themselves. */
          coalesce: true,
        });
      },

      deleteTeamMember: (id) => {
        const member = get().data.team.find((m) => m.id === id);
        if (!member) return;

        set((s) => ({
          data: { ...s.data, team: s.data.team.filter((m) => m.id !== id) },
        }));

        /* Logged *after* the row is gone, and the entry keeps the name rather
           than pointing at an id nothing resolves any more. The log is the only
           thing left that says this account ever existed. */
        get().logChange({
          entity: 'user',
          entityId: id,
          summary: `User deleted: ${member.firstName} ${member.lastName}`,
        });
      },

      issuePasswordReset: (id, now) => {
        const member = get().data.team.find((m) => m.id === id);
        if (!member) return '';

        /* Not random. `Math.random` inside a persisted store would hand a
           different token to the server render and the client one, and the
           prototype has no secret to protect — what the link has to be is
           unguessable-looking and stable for as long as the screen shows it. */
        const token = `rst_${now.getTime().toString(36)}${id.replace(/[^a-z0-9]/gi, '')}`
          .toUpperCase()
          .slice(0, 24);
        const expiresAt = new Date(now.getTime() + RESET_LINK_HOURS * 3600_000);

        set((s) => ({
          data: {
            ...s.data,
            team: s.data.team.map((m) =>
              m.id === id
                ? {
                    ...m,
                    passwordReset: {
                      token,
                      issuedAt: now.toISOString(),
                      expiresAt: expiresAt.toISOString(),
                    },
                  }
                : m,
            ),
          },
        }));

        get().logChange({
          entity: 'user',
          entityId: id,
          summary: `Password reset link issued for ${member.firstName} ${member.lastName}`,
        });

        return token;
      },

      /**
       * Switching role also picks somebody to *be* — see `repoint`. The field
       * screens read `currentMemberId`, and leaving it on the owner would show
       * the owner's whole day through a contractor's permissions.
       */
      /**
       * §17 — every price, rule and catalogue edit lands here.
       *
       * `coalesce` exists because the settings and catalogue screens autosave
       * on every keystroke. Without it, changing "25" to "30" writes three
       * entries (2, 3, 30) and the log becomes unreadable — which is worse
       * than the empty log it replaced. Same record, same actor, inside two
       * minutes: the entry is rewritten rather than stacked.
       */
      logChange: ({ entity, entityId, summary, actor, coalesce }) =>
        set((s) => {
          const now = effectiveNow(s.demo.dateOverride);
          const member = s.data.team.find((m) => m.id === s.demo.currentMemberId);
          const who =
            actor ?? (member ? `${member.firstName} ${member.lastName}` : 'System');

          const entry = {
            id: `chg_${now.getTime().toString(36)}_${s.data.changeLog.length}`,
            at: now.toISOString(),
            actor: who,
            entity,
            entityId,
            summary,
          };

          const head = s.data.changeLog[0];
          const mergeable =
            coalesce &&
            head &&
            head.entity === entity &&
            head.entityId === entityId &&
            head.actor === who &&
            now.getTime() - new Date(head.at).getTime() < 120_000;

          return {
            data: {
              ...s.data,
              changeLog: mergeable
                ? [{ ...entry, id: head.id }, ...s.data.changeLog.slice(1)]
                : [entry, ...s.data.changeLog],
            },
          };
        }),

      /**
       * §10 — the invoice, whether a finished job produced it or somebody
       * typed it.
       *
       * There was no create path at all once: the screens could send, cancel
       * and read an invoice, but the only ones that ever existed came from the
       * seed. Then there was exactly one — «bill this finished job», lines
       * copied from the accepted quote — which is the common case and not the
       * only one. Everything else a cleaning company charges for went into the
       * accounting system by hand instead.
       *
       * Lines arrive already resolved and already edited: the create screen
       * seeds them from the accepted quote when a job is picked, because it is
       * the screen that can turn a catalogue slug into a name in the reader's
       * language. What is enforced here is what a screen must not be trusted
       * with — the customer exists, the job is not being billed twice, and the
       * thing that comes out is a draft.
       */
      createInvoice: ({ customerId, bookingId, lines, termDays }, now) => {
        const s = get();
        if (!s.data.customers.some((c) => c.id === customerId)) return null;

        /* A cancelled invoice does not hold its job hostage — see
           `cancelInvoice`. A live one does: two open invoices against one job
           is a double charge, and the create screen can be reached twice in
           two tabs. */
        if (bookingId) {
          const live = s.data.invoices.find(
            (i) => i.bookingId === bookingId && i.status !== 'cancelled',
          );
          if (live) return live.id;
        }

        const seq = nextInvoiceSeq(s.data.invoices);
        const due = new Date(now);
        due.setDate(due.getDate() + termDays);

        const invoice: Invoice = {
          /* The sequence is in the id, not only the clock.
             Two invoices raised in the same millisecond used to come out with
             the same id — `inv_${stamp}` is four base-36 digits of the clock and
             nothing else. Through the UI that takes a click each and cannot
             collide; `reissueInvoice` cancels and re-creates in one call, and
             the invoice test raises several against a fixed clock. Both got a
             second record wearing the first one's id, which then shadowed it in
             every `find`. The sequence is unique by construction, so putting it
             in front removes the possibility rather than making it unlikely. */
          id: `inv_${seq}${now.getTime().toString(36).toUpperCase().slice(-4)}`,
          reference: `RE-${now.getFullYear()}-${String(seq).padStart(4, '0')}`,
          customerId,
          bookingId,
          /* An invoice with no lines is a bill for nothing. One empty line is
             what the draft editor opens on, so the owner types into a row
             instead of hunting for «Position hinzufügen» first. */
          lines: lines.length > 0 ? lines : [{ label: '', quantity: 1, unitPrice: 0 }],
          /* Draft, not sent. §10: the owner approves before it goes out. */
          status: 'draft',
          createdAt: now.toISOString(),
          issuedAt: now.toISOString(),
          dueAt: due.toISOString(),
          qrReference: buildQrReference(seq),
        };

        set({
          data: {
            ...s.data,
            invoices: [invoice, ...s.data.invoices],
            bookings: s.data.bookings.map((b) =>
              b.id !== bookingId ? b : { ...b, status: 'invoiced' as const },
            ),
          },
        });
        get().logChange({
          entity: 'invoice',
          entityId: invoice.id,
          summary: `Invoice ${invoice.reference} created`,
        });
        return invoice.id;
      },

      deleteInvoice: (id) => {
        const s = get();
        const invoice = s.data.invoices.find((i) => i.id === id);
        /* Re-checked here rather than trusted from the menu: the item is only
           offered on a draft, and a second tab could have approved it between
           the render and the click. */
        if (!invoice || invoice.status !== 'draft') return false;

        set({
          data: {
            ...s.data,
            invoices: s.data.invoices.filter((i) => i.id !== id),
            bookings: releaseBooking(s.data.bookings, invoice),
          },
        });
        /* The log entry outlives the record on purpose. A draft that quietly
           vanishes is the one shape of "where did that invoice go" nobody can
           answer afterwards, and /admin/protokoll prints the summary rather
           than dereferencing the id. */
        get().logChange({
          entity: 'invoice',
          entityId: id,
          summary: `Invoice draft ${invoice.reference} deleted`,
        });
        return true;
      },

      reissueInvoice: (id, now, reason) => {
        const s = get();
        const invoice = s.data.invoices.find((i) => i.id === id);
        /* Only the two states where the customer holds a wrong bill. A draft
           is simply edited, a cancelled one is already gone, and a paid one is
           a refund — which /flows still lists as open, and inventing it here
           would move money nobody has agreed to move. */
        if (!invoice || (invoice.status !== 'sent' && invoice.status !== 'overdue')) return null;

        get().cancelInvoice(id, reason);
        const replacementId = get().createInvoice(
          {
            customerId: invoice.customerId,
            bookingId: invoice.bookingId,
            /* Copied, not shared: editing the new draft must not rewrite the
               lines of the document the customer already has. */
            lines: invoice.lines.map((line) => ({ ...line })),
            termDays: INVOICE_TERM_DAYS,
          },
          now,
        );
        if (!replacementId) return null;

        const replacement = get().data.invoices.find((i) => i.id === replacementId);
        /* Each document names the other. Without this the cancelled one reads
           as an invoice the office simply dropped, and the new one as a second
           bill for the same work. */
        get().updateInvoice(id, {
          cancelReason: `${reason} — ersetzt durch ${replacement?.reference ?? ''}`.trim(),
        });
        get().logChange({
          entity: 'invoice',
          entityId: replacementId,
          summary: `Invoice ${replacement?.reference ?? ''} replaces ${invoice.reference}`,
        });
        return replacementId;
      },

      updateInvoice: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          },
        })),

      updateInvoiceLine: (id, index, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((invoice) =>
              invoice.id !== id
                ? invoice
                : {
                    ...invoice,
                    lines: invoice.lines.map((line, i) =>
                      i === index ? { ...line, ...patch } : line,
                    ),
                  },
            ),
          },
        })),

      addInvoiceLine: (id) =>
        set((s) => ({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((invoice) =>
              invoice.id !== id
                ? invoice
                : {
                    ...invoice,
                    lines: [
                      ...invoice.lines,
                      { label: '', quantity: 1, unitPrice: s.settings.hourlyRate },
                    ],
                  },
            ),
          },
        })),

      removeInvoiceLine: (id, index) =>
        set((s) => ({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((invoice) =>
              invoice.id !== id
                ? invoice
                : { ...invoice, lines: invoice.lines.filter((_, i) => i !== index) },
            ),
          },
        })),

      sendInvoice: (id, now) => {
        const s = get();
        const invoice = s.data.invoices.find((i) => i.id === id);
        if (!invoice || invoice.status !== 'draft') return;

        const due = new Date(now);
        due.setDate(due.getDate() + INVOICE_TERM_DAYS);

        set({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((i) =>
              i.id !== id
                ? i
                : {
                    ...i,
                    status: 'sent' as const,
                    issuedAt: now.toISOString(),
                    dueAt: due.toISOString(),
                  },
            ),
          },
        });
        get().logChange({
          entity: 'invoice',
          entityId: id,
          summary: `Invoice ${invoice.reference} sent`,
        });
      },

      /** §10 — there was no path to 'paid' anywhere in the app. */
      markInvoicePaid: (id, now, method) => {
        const s = get();
        const invoice = s.data.invoices.find((i) => i.id === id);
        if (!invoice || invoice.status === 'paid' || invoice.status === 'cancelled') return;

        const amount = invoice.lines.reduce(
          (sum, line) => sum + line.quantity * line.unitPrice,
          0,
        );

        set({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((i) =>
              i.id !== id
                ? i
                : { ...i, status: 'paid' as const, paidAt: now.toISOString() },
            ),
            bookings: s.data.bookings.map((b) =>
              b.id !== invoice.bookingId ? b : { ...b, status: 'closed' as const },
            ),
            /*
             * The money moving is a fact of its own, not an adjective on the
             * invoice. Recorded here so the customer record can say what was
             * paid and how — and so `succeeded` is the only status this path
             * can produce: the owner is confirming money that has already
             * arrived, not attempting a charge that might fail.
             */
            payments: [
              ...s.data.payments,
              {
                id: `pay_${id}_${now.getTime().toString(36)}`,
                invoiceId: id,
                amount,
                method,
                at: now.toISOString(),
                status: 'succeeded' as const,
                gatewayRef: `manual_${invoice.reference}`,
              },
            ],
          },
        });
        get().logChange({
          entity: 'invoice',
          entityId: id,
          summary: `Invoice ${invoice.reference} marked as paid (${method})`,
        });
      },

      cancelInvoice: (id, cancelReason) => {
        const s = get();
        const invoice = s.data.invoices.find((i) => i.id === id);
        if (!invoice) return;

        set({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((i) =>
              i.id !== id ? i : { ...i, status: 'cancelled' as const, cancelReason },
            ),
            bookings: releaseBooking(s.data.bookings, invoice),
          },
        });
        get().logChange({
          entity: 'invoice',
          entityId: id,
          summary: `Invoice ${invoice.reference} cancelled — ${cancelReason}`,
        });
      },

      createExpense: (input, now) => {
        const s = get();
        /* A cost of nothing is a row that adds nothing to a total and hides in
           every list sorted by amount. Refused rather than saved as zero — the
           form blocks it too, and this is the half a second tab cannot talk
           its way past. */
        if (!(input.amount > 0)) return null;

        /*
         * The labour half, and it is all-or-nothing on purpose.
         *
         * Three people and a job have to resolve against the data we hold, not
         * merely be non-empty strings. An id that points at nobody is worse
         * than a blank: the workforce board would print an em dash where a
         * name goes and still count the hours under it, so «wer hat diese 40
         * Stunden gemacht» would have a number and no answer.
         */
        const labour = input.category === 'labour' ? input.labour : undefined;
        const worker = labour && s.data.team.find((m) => m.id === labour.workerId);
        if (input.category === 'labour') {
          if (!isCompleteLabour(labour, input.bookingId)) return null;
          if (!worker) return null;
          if (!s.data.team.some((m) => m.id === labour!.paidById)) return null;
          if (!s.data.team.some((m) => m.id === labour!.responsibleId)) return null;
          if (!s.data.bookings.some((b) => b.id === input.bookingId)) return null;
        }

        /*
         * On a labour row the supplier *is* the worker, so it is written from
         * the id rather than typed.
         *
         * That keeps every existing reader working with no special case — the
         * list's first column, the search box, the CSV and the delete confirm
         * all print `supplier` and none of them has to learn what a category
         * is. The cost of a copied name is a rename going stale, and nothing
         * in this app renames a team member.
         */
        const supplier = worker ? memberName(worker) : input.supplier.trim();
        if (supplier === '') return null;

        const seq = nextExpenseSeq(s.data.expenses);
        const expense: Expense = {
          /* The sequence in front of the clock, for the reason `createInvoice`
             gives: two costs entered in the same millisecond used to be
             possible only in a test, and then `reissueInvoice` proved
             otherwise. Unique by construction beats unlikely. */
          id: `exp_${seq}${now.getTime().toString(36).toUpperCase().slice(-4)}`,
          reference: `AUS-${now.getFullYear()}-${String(seq).padStart(4, '0')}`,
          category: input.category,
          supplier,
          note: input.note?.trim() || undefined,
          amount: input.amount,
          incurredAt: input.incurredAt,
          dueAt: input.dueAt,
          bookingId: input.bookingId,
          labour,
          recurring: input.recurring,
          /* Open, always. A cost that was settled at the till is marked paid in
             the next move — one path to `paid`, so the payment method can never
             be skipped on the way in. */
          status: 'open',
        };

        set({ data: { ...s.data, expenses: [expense, ...s.data.expenses] } });
        get().logChange({
          entity: 'expense',
          entityId: expense.id,
          /* The hours and the job on the entry, not only the name. The log is
             read when a month's costs are being reconciled against a bank
             statement, and «Marta Nowak» three times over says nothing about
             which three of them this was. */
          summary: labour
            ? `Expense ${expense.reference} recorded — ${labour.hours} h by ${expense.supplier} on ${
                s.data.bookings.find((b) => b.id === expense.bookingId)?.reference ?? expense.bookingId
              }`
            : `Expense ${expense.reference} recorded — ${expense.supplier}`,
        });
        return expense.id;
      },

      updateExpense: (id, patch) => {
        const s = get();
        const before = s.data.expenses.find((e) => e.id === id);
        if (!before) return;

        const next: Expense = { ...before, ...patch };

        if (next.category === 'labour') {
          /* Refused rather than half-written, for the reason `createExpense`
             gives: a labour row nobody can attribute is counted in a total the
             board cannot explain. The form cannot get here — this is the path
             a second tab or a stale draft takes. */
          if (!isCompleteLabour(next.labour, next.bookingId)) return;
          const worker = s.data.team.find((m) => m.id === next.labour!.workerId);
          if (!worker) return;
          if (!s.data.team.some((m) => m.id === next.labour!.paidById)) return;
          if (!s.data.team.some((m) => m.id === next.labour!.responsibleId)) return;
          next.supplier = memberName(worker);
        } else {
          /* The crew leaves with the category. Kept, it would be three people
             attached to a receipt from the wholesaler — off the screen, and
             still inside `labourExpenses`. */
          next.labour = undefined;
        }

        next.supplier = next.supplier.trim();
        /* `createExpense` refuses a nameless cost and so does this: a row whose
           first column is blank is unfindable in a list that is searched by
           supplier and sorted by it. */
        if (next.supplier === '') return;

        set({
          data: {
            ...s.data,
            expenses: s.data.expenses.map((e) => (e.id === id ? next : e)),
          },
        });
        get().logChange({
          entity: 'expense',
          entityId: id,
          summary: `Expense ${before.reference} edited`,
          coalesce: true,
        });
      },

      markExpensePaid: (id, now, method) => {
        const s = get();
        const expense = s.data.expenses.find((e) => e.id === id);
        /* Already settled is not an error and not a second entry either — the
           row's menu stops offering it, and a second tab that still shows the
           item finds nothing left to do. */
        if (!expense || expense.status === 'paid') return;

        set({
          data: {
            ...s.data,
            expenses: s.data.expenses.map((e) =>
              e.id !== id
                ? e
                : { ...e, status: 'paid' as const, paidAt: now.toISOString(), method },
            ),
          },
        });
        get().logChange({
          entity: 'expense',
          entityId: id,
          summary: `Expense ${expense.reference} marked as paid (${method})`,
        });
      },

      deleteExpense: (id) => {
        const s = get();
        const expense = s.data.expenses.find((e) => e.id === id);
        if (!expense) return false;

        set({ data: { ...s.data, expenses: s.data.expenses.filter((e) => e.id !== id) } });
        /* The entry outlives the record, the same way a deleted invoice draft's
           does: a cost that quietly vanishes out of a month somebody has
           already read the profit for is the one deletion nobody can account
           for afterwards. */
        get().logChange({
          entity: 'expense',
          entityId: id,
          summary: `Expense ${expense.reference} deleted — ${expense.supplier}, CHF ${expense.amount}`,
        });
        return true;
      },

      /**
       * §4.2 — the before/after pair is the evidence behind the handover
       * guarantee, which is why check-out refuses to complete without three
       * photos. It then discarded them, so the guarantee had nothing behind
       * it and the customer's own before/after screen could never fill.
       *
       * Photos are written as real Photo records carrying both the booking and
       * the property, which is what makes them findable from the account side.
       * They stay internal until someone consents to publishing (§20.6).
       */
      recordCheck: (bookingId, { kind, photos, note, extraHours }, now) =>
        set((s) => {
          const booking = s.data.bookings.find((b) => b.id === bookingId);
          if (!booking) return s;

          const stamp = now.getTime().toString(36);
          const records = photos.map((src, i) => ({
            id: `pho_${stamp}_${i}`,
            src,
            source: 'field' as const,
            kind: kind === 'in' ? ('before' as const) : ('after' as const),
            visibleToCustomer: true,
            publishConsent: false,
            bookingId,
            propertyId: booking.propertyId,
            takenAt: now.toISOString(),
          }));

          const parts = [
            kind === 'in' ? 'Eingecheckt' : 'Ausgecheckt',
            photos.length > 0 ? `${photos.length} Fotos` : null,
            extraHours ? `+${extraHours} h reported` : null,
            note.trim() || null,
          ].filter(Boolean);

          return {
            data: {
              ...s.data,
              photos: [...s.data.photos, ...records],
              bookings: s.data.bookings.map((b) =>
                b.id !== bookingId
                  ? b
                  : {
                      ...b,
                      ...(kind === 'in'
                        ? { checkInAt: now.toISOString(), status: 'inProgress' as const }
                        : {
                            checkOutAt: now.toISOString(),
                            status: 'awaitingApproval' as const,
                          }),
                      photoIds: [...b.photoIds, ...records.map((p) => p.id)],
                      /* Without this the panel's booking detail showed nothing
                         at all for either end of the job. */
                      history: [
                        ...b.history,
                        {
                          at: now.toISOString(),
                          kind: kind === 'in' ? ('checkIn' as const) : ('checkOut' as const),
                          label: parts.join(' · '),
                        },
                      ],
                    },
              ),
            },
          };
        }),

      addPaymentMethod: ({ customerId, kind, label, expiresAt }, now) =>
        set((s) => {
          const mine = s.data.paymentMethods.filter((m) => m.customerId === customerId);
          return {
            data: {
              ...s.data,
              paymentMethods: [
                ...s.data.paymentMethods,
                {
                  id: `pm_${now.getTime().toString(36)}_${s.data.paymentMethods.length}`,
                  customerId,
                  kind,
                  label,
                  expiresAt,
                  /* The first one saved is the default — otherwise the
                     customer ends up with a method and nothing marked. */
                  isDefault: mine.length === 0,
                  addedAt: now.toISOString(),
                },
              ],
            },
          };
        }),

      removePaymentMethod: (id) =>
        set((s) => {
          const removed = s.data.paymentMethods.find((m) => m.id === id);
          const rest = s.data.paymentMethods.filter((m) => m.id !== id);
          /* Removing the default promotes the next one rather than leaving the
             customer with methods on file and no default among them. */
          const orphaned =
            removed?.isDefault &&
            !rest.some((m) => m.customerId === removed.customerId && m.isDefault);
          const heir = orphaned
            ? rest.find((m) => m.customerId === removed.customerId)
            : undefined;

          return {
            data: {
              ...s.data,
              paymentMethods: rest.map((m) =>
                heir && m.id === heir.id ? { ...m, isDefault: true } : m,
              ),
            },
          };
        }),

      setDefaultPaymentMethod: (id) =>
        set((s) => {
          const target = s.data.paymentMethods.find((m) => m.id === id);
          if (!target) return s;
          return {
            data: {
              ...s.data,
              paymentMethods: s.data.paymentMethods.map((m) =>
                m.customerId !== target.customerId
                  ? m
                  : { ...m, isDefault: m.id === id },
              ),
            },
          };
        }),

      /* ---- plans, the catalogue side ---- */

      createPlan: (input, now) => {
        const s = get();
        const id = `pln_${now.getTime().toString(36).slice(-5)}`;
        const plan: Plan = {
          ...input,
          id,
          reference: `P-${String(s.plans.length + 1).padStart(3, '0')}`,
          order: s.plans.length + 1,
        };
        set({ plans: [...s.plans, plan] });
        get().logChange({
          entity: 'plan',
          entityId: id,
          summary: `Plan ${plan.name.en} created`,
        });
        return id;
      },

      updatePlan: (id, patch) =>
        set((s) => ({ plans: s.plans.map((plan) => (plan.id === id ? { ...plan, ...patch } : plan)) })),

      /**
       * Retiring a plan stops it being sold. It does not touch anybody holding
       * one.
       *
       * That distinction is the whole reason `active` is a flag rather than a
       * delete: a plan is a year somebody paid for up front, and taking the
       * product off the price list cannot reach backwards into it. The
       * subscribers keep their visits, and the plan keeps existing so their
       * screens still have something to name.
       */
      setPlanActive: (id, active) => {
        set((s) => ({
          plans: s.plans.map((plan) =>
            plan.id !== id
              ? plan
              : {
                  ...plan,
                  active,
                  // A plan nobody can buy has no business advertising itself.
                  visibleOnSite: active ? plan.visibleOnSite : false,
                },
          ),
        }));
        const plan = get().plans.find((x) => x.id === id);
        get().logChange({
          entity: 'plan',
          entityId: id,
          summary: `Plan ${plan?.name.en ?? id} ${active ? 'activated' : 'deactivated'}`,
        });
      },

      setPlanVisible: (id, visibleOnSite) =>
        set((s) => ({
          plans: s.plans.map((plan) =>
            /* An inactive plan cannot be put back on the site without being
               reactivated first — otherwise the marketing page advertises
               something the booking flow then refuses to sell. */
            plan.id !== id ? plan : { ...plan, visibleOnSite: visibleOnSite && plan.active },
          ),
        })),

      /* ---- plans, the subscriber side ---- */

      /**
       * Opens the plan an accepted quote was signed for.
       *
       * This is the join that was missing. A visitor picked a plan on the
       * marketing page, the wizard carried it as far as `planIntent` on the
       * request, the quote applied its discount — and then nothing. No code
       * path anywhere created a `Subscription` except the panel's own manual
       * form, so every customer who signed up for a plan on the site ended up
       * without one, and the office found out when they phoned.
       *
       * The invoice is written here too rather than left for later. A plan is
       * paid in one go at sign-up, so the money and the record arrive together;
       * an invoice raised afterwards by hand is an invoice that can be
       * forgotten, and `Invoice.subscriptionId` existed on the model and was
       * read in two places without anything ever writing it.
       */
      openSubscription: ({ customerId, propertyId, planId, method }, now) => {
        const s = get();
        const plan = s.plans.find((x) => x.id === planId);
        if (!plan || !plan.active) return null;

        /* One plan per property. A second one on the same address would give
           two packages the same visits to argue over, and neither the customer
           screen nor coverage could say which one a job came out of. */
        const existing = s.data.subscriptions.find(
          (x) =>
            x.propertyId === propertyId &&
            x.status !== 'cancelled' &&
            new Date(x.endDate) > now,
        );
        if (existing) return null;

        const stamp = now.getTime().toString(36).toUpperCase().slice(-4);
        const id = `sub_${stamp}`;
        const end = new Date(now);
        end.setMonth(end.getMonth() + plan.validityMonths);

        const seq = 52 + s.data.invoices.length;
        const invoice: Invoice = {
          id: `inv_${stamp}`,
          reference: `RE-${now.getFullYear()}-${String(seq).padStart(4, '0')}`,
          customerId,
          subscriptionId: id,
          lines: [
            {
              label: `Plan ${plan.name.en} — ${plan.includedVisits} visits, ${plan.validityMonths} months`,
              quantity: 1,
              unitPrice: plan.price,
            },
          ],
          /* Paid, not draft. The plan only opens once the money is in — see
             `payOffer`, which is the only caller — so an invoice sitting in
             draft would describe a payment that has already happened. */
          status: 'paid',
          /* Raised and issued in the same instant — nothing waits for approval
             when the money has already arrived. */
          createdAt: now.toISOString(),
          issuedAt: now.toISOString(),
          dueAt: now.toISOString(),
          paidAt: now.toISOString(),
          qrReference: buildQrReference(seq),
        };

        const payment: Payment = {
          id: `pay_${stamp}P`,
          invoiceId: invoice.id,
          amount: plan.price,
          method,
          at: now.toISOString(),
          status: 'succeeded',
          gatewayRef: `mock_${stamp}P`,
        };

        const subscription: Subscription = {
          id,
          reference: `S-${String(1000 + s.data.subscriptions.length + 15).slice(-4)}`,
          customerId,
          propertyId,
          planId,
          startDate: now.toISOString(),
          endDate: end.toISOString(),
          status: 'active',
          visitsUsed: 0,
          invoiceId: invoice.id,
          renewalCount: 0,
          history: [
            { at: now.toISOString(), kind: 'started', label: `Plan started — ${plan.name.en}` },
            { at: now.toISOString(), kind: 'paid', label: `Paid — ${invoice.reference}` },
          ],
        };

        set({
          data: {
            ...s.data,
            subscriptions: [subscription, ...s.data.subscriptions],
            invoices: [invoice, ...s.data.invoices],
            payments: [...s.data.payments, payment],
          },
        });
        get().logChange({
          entity: 'subscription',
          entityId: id,
          summary: `Plan ${subscription.reference} opened — ${plan.name.en}`,
        });
        return id;
      },

      /**
       * Buys the same package again for another term.
       *
       * The visits reset because a new package was bought, and `renewalCount`
       * goes up because that is the number screen 70 is asked for. Deliberately
       * not automatic: nothing here charges a card on a schedule, and inventing
       * a renewal the customer never agreed to would be worse than making them
       * press a button.
       */
      renewSubscription: (id, now) => {
        const s = get();
        const subscription = s.data.subscriptions.find((x) => x.id === id);
        const plan = subscription && s.plans.find((x) => x.id === subscription.planId);
        if (!subscription || !plan || !plan.active) return null;

        const stamp = now.getTime().toString(36).toUpperCase().slice(-4);
        const end = new Date(now);
        end.setMonth(end.getMonth() + plan.validityMonths);

        const seq = 52 + s.data.invoices.length;
        const invoice: Invoice = {
          id: `inv_${stamp}R`,
          reference: `RE-${now.getFullYear()}-${String(seq).padStart(4, '0')}`,
          customerId: subscription.customerId,
          subscriptionId: id,
          lines: [
            {
              label: `Plan ${plan.name.en} — renewal ${plan.validityMonths} months`,
              quantity: 1,
              unitPrice: plan.price,
            },
          ],
          /* Sent, not paid: a renewal is a bill the customer still has to
             settle. The first term is different because it is paid at
             checkout — this one has nobody standing at a card reader. */
          status: 'sent',
          createdAt: now.toISOString(),
          issuedAt: now.toISOString(),
          dueAt: now.toISOString(),
          qrReference: buildQrReference(seq),
        };

        set({
          data: {
            ...s.data,
            invoices: [invoice, ...s.data.invoices],
            subscriptions: s.data.subscriptions.map((x) =>
              x.id !== id
                ? x
                : {
                    ...x,
                    status: 'active' as const,
                    startDate: now.toISOString(),
                    endDate: end.toISOString(),
                    visitsUsed: 0,
                    invoiceId: invoice.id,
                    renewalCount: x.renewalCount + 1,
                    history: [
                      ...x.history,
                      {
                        at: now.toISOString(),
                        kind: 'renewed',
                        label: `Renewed for ${plan.validityMonths} months`,
                      },
                      { at: now.toISOString(), kind: 'invoiced', label: `Invoice ${invoice.reference}` },
                    ],
                  },
            ),
          },
        });
        return invoice.id;
      },

      rescheduleBooking: ({ id, start, historyLabel, notice }, now) => {
        const booking = get().data.bookings.find((b) => b.id === id);
        if (!booking) return;

        set((s) => ({
          data: {
            ...s.data,
            bookings: s.data.bookings.map((b) =>
              b.id !== id
                ? b
                : {
                    ...b,
                    start,
                    status: 'rescheduled' as const,
                    /* `b.start`, read before the patch lands — the date the
                       customer had in their diary. */
                    reschedule: { from: b.start, at: now.toISOString() },
                    history: [
                      ...b.history,
                      { at: now.toISOString(), kind: 'rescheduled', label: historyLabel },
                    ],
                  },
            ),
          },
        }));

        /* `sendMessage` rather than a second message built here: one writer
           for both ends of a thread is the whole reason it exists. */
        get().sendMessage(
          {
            customerId: booking.customerId,
            subject: notice.subject,
            body: notice.body,
            from: 'homivaro',
          },
          now,
        );
      },

      approveBooking: (id, label, now) =>
        set((s) => {
          const booking = s.data.bookings.find((b) => b.id === id);
          if (!booking) return s;

          return {
            data: {
              ...s.data,
              bookings: s.data.bookings.map((b) =>
                b.id !== id
                  ? b
                  : {
                      ...b,
                      status: 'completed' as const,
                      history: [...b.history, { at: now.toISOString(), kind: 'approved', label }],
                    },
              ),
              /* Only a job that actually came out of a plan spends one of its
                 visits. A job the same customer paid for separately at the same
                 address does not, which is why this keys off the booking's own
                 `subscriptionId` rather than looking one up by address. */
              subscriptions: !booking.subscriptionId
                ? s.data.subscriptions
                : s.data.subscriptions.map((x) =>
                    x.id !== booking.subscriptionId
                      ? x
                      : {
                          ...x,
                          visitsUsed: x.visitsUsed + 1,
                          history: [
                            ...x.history,
                            {
                              at: now.toISOString(),
                              kind: 'visitUsed',
                              label: `Visit ${booking.reference} counted`,
                            },
                          ],
                        },
                  ),
            },
          };
        }),

      pauseSubscription: (id, now) =>
        set((s) => ({
          data: {
            ...s.data,
            subscriptions: s.data.subscriptions.map((x) =>
              x.id !== id
                ? x
                : {
                    ...x,
                    status: 'paused' as const,
                    history: [
                      ...x.history,
                      { at: now.toISOString(), kind: 'paused', label: 'Plan paused' },
                    ],
                  },
            ),
          },
        })),

      resumeSubscription: (id, now) =>
        set((s) => ({
          data: {
            ...s.data,
            subscriptions: s.data.subscriptions.map((x) =>
              x.id !== id
                ? x
                : {
                    ...x,
                    status: 'active' as const,
                    history: [
                      ...x.history,
                      { at: now.toISOString(), kind: 'resumed', label: 'Plan resumed' },
                    ],
                  },
            ),
          },
        })),

      /**
       * §11 — a free skip has to skip something.
       *
       * Both ends only ever did `skipsUsedThisMonth + 1`: the counter moved,
       * the visit did not, and the booking stayed in the calendar — so the team
       * still turned up at a job the customer believed they had skipped.
       *
       * The booking it picks is now restricted to this plan's own. It used to
       * take the customer's next scheduled job at that address whatever it
       * was, which on an address holding a plan *and* a one-off booking
       * cancelled the one-off — a paid job, silently, using a free plan skip.
       */
      skipNextVisit: (id, now) =>
        set((s) => {
          const subscription = s.data.subscriptions.find((x) => x.id === id);
          if (!subscription) return s;

          /* The same booking the screen named before the customer pressed the
             button. Picked here by the same rule, from the same function —
             two copies of "the next visit" is two chances for the one that is
             cancelled to differ from the one that was promised. */
          const next = nextPlanVisit(subscription.id, s.data.bookings, now);

          return {
            data: {
              ...s.data,
              subscriptions: s.data.subscriptions.map((x) =>
                x.id !== id
                  ? x
                  : {
                      ...x,
                      history: [
                        ...x.history,
                        {
                          at: now.toISOString(),
                          kind: 'skipped',
                          label: next
                            ? `Visit ${next.reference} skipped`
                            : 'Next visit skipped',
                        },
                      ],
                    },
              ),
              bookings: next
                ? s.data.bookings.map((b) =>
                    b.id !== next.id
                      ? b
                      : {
                          ...b,
                          status: 'cancelled' as const,
                          history: [
                            ...b.history,
                            {
                              at: now.toISOString(),
                              kind: 'skipped',
                              label: 'Plan visit skipped',
                            },
                          ],
                        },
                  )
                : s.data.bookings,
            },
          };
        }),

      /**
       * Cancels a plan and gives the money back — or refuses, and says why.
       *
       * The old pair of actions modelled a notice period: the customer filed a
       * cancellation, the plan sat in `cancellationPending`, and the term ran
       * out anyway. That describes a monthly subscription. This one is a year
       * bought outright, so there is nothing to give notice *of*: either it is
       * untouched and inside the cooling-off window, in which case it is undone
       * completely, or it is not, in which case it stands.
       *
       * The guard lives here and not only in the button. Both ends call this,
       * and a rule that only exists in a disabled attribute is a rule a URL
       * walks past.
       */
      cancelSubscription: (id, now) => {
        const s = get();
        const subscription = s.data.subscriptions.find((x) => x.id === id);
        if (!subscription) return 'notActive';

        const block = cancelBlock(subscription, s.settings, now);
        if (block) return block;

        const stamp = now.getTime().toString(36).toUpperCase().slice(-4);
        /* The payment that settled the term, refunded rather than deleted.
           §20.2 keeps the failed and the succeeded attempt side by side; a
           refund is the same idea — what happened stays on the record. */
        const paid = s.data.payments.find((x) => x.invoiceId === subscription.invoiceId);
        const refund: Payment | null = paid
          ? {
              id: `pay_${stamp}X`,
              invoiceId: paid.invoiceId,
              amount: paid.amount,
              method: paid.method,
              at: now.toISOString(),
              status: 'refunded',
              gatewayRef: `mock_${stamp}X`,
            }
          : null;

        set({
          data: {
            ...s.data,
            payments: refund ? [...s.data.payments, refund] : s.data.payments,
            invoices: s.data.invoices.map((i) =>
              i.id !== subscription.invoiceId
                ? i
                : { ...i, status: 'cancelled' as const, cancelReason: 'Plan cancelled and refunded' },
            ),
            subscriptions: s.data.subscriptions.map((x) =>
              x.id !== id
                ? x
                : {
                    ...x,
                    status: 'cancelled' as const,
                    cancelledAt: now.toISOString(),
                    refundedPaymentId: refund?.id,
                    history: [
                      ...x.history,
                      {
                        at: now.toISOString(),
                        kind: 'cancelled',
                        label: refund ? 'Cancelled and refunded' : 'Cancelled',
                      },
                    ],
                  },
            ),
          },
        });
        get().logChange({
          entity: 'subscription',
          entityId: id,
          summary: `Plan ${subscription.reference} cancelled${refund ? ' and refunded' : ''}`,
        });
        return null;
      },

      /**
       * Moves a running plan up to a bigger package, and bills the difference.
       *
       * §21.7 settled the rule — upgrade now, downgrade at the next term — and
       * the screen offering it linked to the contact form, so the rule only
       * ever existed on paper. What was missing was never the button: it was
       * that nothing decided what happens to the year already paid for.
       *
       * It is the *same* subscription, not a second one. The address keeps one
       * plan, its reference and its history carry on, and every screen that
       * already renders a subscription renders this one unchanged. Opening a
       * new record instead would have meant closing the old one, and the only
       * status available for that is `cancelled` — which every screen reads as
       * "refunded", because that is the one way this product is cancelled.
       *
       * The term restarts because a whole package was bought: 52 visits handed
       * to somebody with ten months left would be 52 visits that cannot
       * physically be taken. The credit for what is left of the old one is
       * `upgradeQuote`, and it goes on the invoice as its own line — a customer
       * comparing the amount against the plan price has to be able to see where
       * the difference went.
       */
      upgradeSubscription: ({ id, toPlanId, method }, now) => {
        const s = get();
        const subscription = s.data.subscriptions.find((x) => x.id === id);
        if (!subscription) return { blocked: 'notActive' as const };

        const from = s.plans.find((x) => x.id === subscription.planId);
        const to = s.plans.find((x) => x.id === toPlanId);
        const block = upgradeBlock(subscription, from, to, now);
        if (block || !from || !to) return { blocked: block ?? ('notAnUpgrade' as const) };

        const { credit, due, visitsLeft: left } = upgradeQuote(subscription, from, to);

        const stamp = now.getTime().toString(36).toUpperCase().slice(-4);
        const end = new Date(now);
        end.setMonth(end.getMonth() + to.validityMonths);

        const seq = 52 + s.data.invoices.length;
        const invoice: Invoice = {
          id: `inv_${stamp}U`,
          reference: `RE-${now.getFullYear()}-${String(seq).padStart(4, '0')}`,
          customerId: subscription.customerId,
          subscriptionId: id,
          lines: [
            {
              label: `Plan ${to.name.en} — ${to.includedVisits} visits, ${to.validityMonths} months`,
              quantity: 1,
              unitPrice: to.price,
            },
            /* The credit as its own negative line rather than folded into the
               price. An invoice reading "CHF 3456.92" against a plan the site
               sells at CHF 6500 is an invoice the customer has to phone about. */
            {
              label: `Credit — ${left} unused visits from ${from.name.en}`,
              quantity: 1,
              unitPrice: -credit,
            },
          ],
          /* Paid, like `openSubscription` and unlike `renewSubscription`: this
             one is settled at the moment the customer confirms it, with a
             method they already have on file. */
          status: 'paid',
          createdAt: now.toISOString(),
          issuedAt: now.toISOString(),
          dueAt: now.toISOString(),
          paidAt: now.toISOString(),
          qrReference: buildQrReference(seq),
        };

        /* No payment record when the credit covers the whole package. A
           `Payment` of nought francs is not a payment that happened. */
        const payment: Payment | null =
          due > 0
            ? {
                id: `pay_${stamp}U`,
                invoiceId: invoice.id,
                amount: due,
                method,
                at: now.toISOString(),
                status: 'succeeded',
                gatewayRef: `mock_${stamp}U`,
              }
            : null;

        set({
          data: {
            ...s.data,
            invoices: [invoice, ...s.data.invoices],
            payments: payment ? [...s.data.payments, payment] : s.data.payments,
            subscriptions: s.data.subscriptions.map((x) =>
              x.id !== id
                ? x
                : {
                    ...x,
                    planId: to.id,
                    startDate: now.toISOString(),
                    endDate: end.toISOString(),
                    /* Reset, because a new package was bought. The visits
                       already delivered are not lost from the record — they
                       are what the credit was calculated against, and the
                       history line names them. */
                    visitsUsed: 0,
                    invoiceId: invoice.id,
                    history: [
                      ...x.history,
                      {
                        at: now.toISOString(),
                        kind: 'upgraded',
                        label: `Upgraded — ${from.name.en} → ${to.name.en}, ${left} visits credited`,
                      },
                      { at: now.toISOString(), kind: 'paid', label: `Paid — ${invoice.reference}` },
                    ],
                  },
            ),
          },
        });
        get().logChange({
          entity: 'subscription',
          entityId: id,
          summary: `Plan ${subscription.reference} upgraded — ${from.name.en} → ${to.name.en}`,
        });
        return { invoiceId: invoice.id };
      },

      submitReview: ({ bookingId, customerId, rating, text, publishConsent }, now) =>
        set((s) => ({
          data: {
            ...s.data,
            reviews: [
              ...s.data.reviews,
              {
                /* Was `rev_${reviews.length + 1}` — the same collision class as
                   the quote lines: delete one, add another, and two records
                   share an id. */
                id: `rev_${now.getTime().toString(36)}_${s.data.reviews.length}`,
                bookingId,
                customerId,
                rating,
                text,
                status: 'pending' as const,
                submittedAt: now.toISOString(),
                publishConsent,
              },
            ],
          },
        })),

      setReviewStatus: (id, status) => {
        const review = get().data.reviews.find((r) => r.id === id);
        if (!review) return;
        /* §20.6 is not the moderation screen's rule to keep — it is the data's.
           The button is disabled without consent, and so is the second tab. */
        if (status === 'published' && !review.publishConsent) return;

        set((s) => ({
          data: {
            ...s.data,
            reviews: s.data.reviews.map((r) => (r.id === id ? { ...r, status } : r)),
          },
        }));
        /* What the public can see is a published decision, and until now the
           one screen that changes it wrote nothing anywhere. «Wer hat die
           Ein-Stern-Bewertung runtergenommen, und wann» had no answer. */
        get().logChange({
          entity: 'review',
          entityId: id,
          summary: `Review ${review.rating}★ → ${status}`,
        });
      },

      replyToReview: (id, ownerReply) =>
        set((s) => ({
          data: {
            ...s.data,
            reviews: s.data.reviews.map((r) => (r.id === id ? { ...r, ownerReply } : r)),
          },
        })),

      deleteReview: (id) => {
        const review = get().data.reviews.find((r) => r.id === id);
        if (!review) return;

        set((s) => ({
          data: { ...s.data, reviews: s.data.reviews.filter((r) => r.id !== id) },
        }));
        /* The rating and nothing else. A log entry quoting the text would keep
           the deleted review in the app under a different heading, which is
           the one outcome an erasure request cannot end in. */
        get().logChange({
          entity: 'review',
          entityId: id,
          summary: `Review ${review.rating}★ deleted`,
        });
      },

      /**
       * §4.2 — the no-access fee "only stands if the wait actually happened",
       * and the screen asks for a photo to show it did. That flag was held in
       * local state and never persisted, so the one piece of evidence behind a
       * charge was gone the moment the screen unmounted.
       */
      recordNoAccess: (bookingId, { reason, note, photo }, now) =>
        set((s) => {
          const booking = s.data.bookings.find((b) => b.id === bookingId);
          if (!booking) return s;

          const stamp = now.getTime().toString(36);
          const evidence = photo
            ? [
                {
                  id: `pho_${stamp}_na`,
                  src: `pho_noaccess_${bookingId}`,
                  source: 'field' as const,
                  kind: 'issue' as const,
                  visibleToCustomer: true,
                  publishConsent: false,
                  note: reason,
                  bookingId,
                  propertyId: booking.propertyId,
                  takenAt: now.toISOString(),
                },
              ]
            : [];

          return {
            data: {
              ...s.data,
              photos: [...s.data.photos, ...evidence],
              bookings: s.data.bookings.map((b) =>
                b.id !== bookingId
                  ? b
                  : {
                      ...b,
                      status: 'noAccess' as const,
                      photoIds: [...b.photoIds, ...evidence.map((p) => p.id)],
                      history: [
                        ...b.history,
                        {
                          at: now.toISOString(),
                          kind: 'noAccess' as const,
                          label: [reason, note.trim() || null, photo ? 'Foto erfasst' : null]
                            .filter(Boolean)
                            .join(' — '),
                        },
                      ],
                    },
              ),
            },
          };
        }),

      /**
       * §14 — one writer for both ends of a thread.
       *
       * The customer could already send; nothing could read it back, because
       * no admin screen touched data.messages. A reply written here was
       * genuinely unanswerable.
       */
      sendMessage: ({ customerId, subject, body, from, attachments }, now) =>
        set((s) => {
          const message: CustomerMessage = {
            id: `msg_${now.getTime().toString(36)}_${s.data.messages.length}`,
            customerId,
            subject,
            from,
            body,
            at: now.toISOString(),
            /* Each side has trivially read what it just wrote itself, and has
               not yet read what the other side just sent. */
            readByCustomer: from === 'customer',
            readByAdmin: from === 'homivaro',
            attachments: attachments?.length ? attachments : undefined,
          };
          return { data: { ...s.data, messages: [...s.data.messages, message] } };
        }),

      markRequestOpened: (id, now) =>
        set((s) => {
          const request = s.data.requests.find((r) => r.id === id);
          /* Only ever `new` → `inReview`. Re-stamping `openedAt` on every
             visit would move the response clock every time the owner came
             back to re-read something. */
          if (!request || request.status !== 'new') return {};
          return {
            data: {
              ...s.data,
              requests: s.data.requests.map((r) =>
                r.id !== id
                  ? r
                  : { ...r, status: 'inReview' as const, openedAt: now.toISOString() },
              ),
            },
          };
        }),

      markThreadRead: (customerId, subject, side) =>
        set((s) => ({
          data: {
            ...s.data,
            messages: s.data.messages.map((m) =>
              m.customerId === customerId && m.subject === subject
                ? { ...m, [side === 'admin' ? 'readByAdmin' : 'readByCustomer']: true }
                : m,
            ),
          },
        })),

      setRole: (role) => set((s) => ({ demo: repoint({ ...s.demo, role }, s.data) })),

      setScenario: (scenario) =>
        set((s) => {
          const at = effectiveNow(s.demo.dateOverride);
          const data = buildScenario(scenario, at);
          /* Was `holds: []`, which wiped a confirmed date on every switch and
             made the propose-and-confirm flow unreachable from seed data. */
          return { demo: repoint(s.demo, data), data, holds: seedHolds(data, at) };
        }),

      setDateOverride: (dateOverride) =>
        set((s) => {
          // Seed data is written relative to "now", so moving the clock has to
          // rebuild it — otherwise today's jobs would sit in the past.
          const at = effectiveNow(dateOverride);
          const data = buildScenario(s.demo.scenario, at);
          return {
            demo: { ...repoint(s.demo, data), dateOverride },
            data,
            holds: seedHolds(data, at),
          };
        }),

      setCurrentCustomer: (currentCustomerId) =>
        set((s) => ({ demo: { ...s.demo, currentCustomerId } })),

      /* Sets the role alongside, so picking the owner from the list does not
         leave the demo standing in a contractor session wearing the owner's
         name — `repoint` would then swap the member back on the next reload. */
      setCurrentMember: (currentMemberId) =>
        set((s) => {
          const member = s.data.team.find((m) => m.id === currentMemberId);
          return {
            demo: {
              ...s.demo,
              currentMemberId,
              role: member?.role === 'owner' ? 'owner' : 'contractor',
            },
          };
        }),

      /*
       * These three are the ones screen 83 exists to report on — prices,
       * rules and the catalogue. They log themselves rather than trusting
       * every call site to remember, and coalesce because all three screens
       * autosave per keystroke.
       */
      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        const keys = Object.keys(patch);
        get().logChange({
          entity: 'settings',
          entityId: keys[0] ?? 'settings',
          summary: `Setting changed: ${keys.join(', ')}`,
          coalesce: true,
        });
      },

      addTemplate: (template) => {
        set((s) => ({
          settings: {
            ...s.settings,
            messageTemplates: [...s.settings.messageTemplates, template],
          },
        }));
        get().logChange({
          entity: 'template',
          entityId: template.id,
          summary: `Template "${textFor(template.subject, 'en') || template.id}" created`,
        });
      },

      updateTemplate: (id, patch) => {
        set((s) => ({
          settings: {
            ...s.settings,
            messageTemplates: s.settings.messageTemplates.map((t) =>
              t.id === id ? { ...t, ...patch } : t,
            ),
          },
        }));
        const next = get().settings.messageTemplates.find((t) => t.id === id);
        get().logChange({
          entity: 'template',
          entityId: id,
          summary: `Template "${next ? textFor(next.subject, 'en') || id : id}" edited`,
          /* The editor autosaves like every other settings screen, so without
             this the log would carry one entry per keystroke. */
          coalesce: true,
        });
      },

      deleteTemplate: (id, replacementId) => {
        const s = get();
        const plan = planDelete(
          s.settings.messageTemplates,
          id,
          SEED_SETTINGS.messageTemplates,
          replacementId,
        );
        if (plan.kind === 'missing') return;

        set({ settings: { ...s.settings, messageTemplates: plan.next } });

        const label = textFor(plan.removed.subject, 'en') || id;
        const summary =
          plan.kind === 'restore'
            ? `Template "${label}" deleted — the original text is back, so the occasion still sends`
            : plan.kind === 'promote'
              ? `Template "${label}" deleted — "${textFor(plan.heir.subject, 'en') || plan.heir.id}" is the default now`
              : `Template "${label}" deleted`;

        get().logChange({ entity: 'template', entityId: id, summary });
      },

      setDefaultTemplate: (id) => {
        const s = get();
        const chosen = s.settings.messageTemplates.find((t) => t.id === id);
        if (!chosen?.event) return;
        set({
          settings: {
            ...s.settings,
            messageTemplates: s.settings.messageTemplates.map((t) =>
              t.event === chosen.event ? { ...t, isDefault: t.id === id } : t,
            ),
          },
        });
        get().logChange({
          entity: 'template',
          entityId: id,
          summary: `"${textFor(chosen.subject, 'de') || id}" ist neu die Standardvorlage`,
        });
      },

      setServices: (services) => {
        set({ services });
        get().logChange({
          entity: 'service',
          entityId: 'catalogue',
          summary: 'Service catalogue edited',
          coalesce: true,
        });
      },

      createService: (input) => {
        const s = get();
        const slug = uniqueSlug(
          /* An owner who has typed a German name and nothing else still gets a
             usable URL. Falling back to the id would give «leistung-m3k7» on
             the website, which is worse than a duplicate to disambiguate. */
          slugify(input.name.de) || 'leistung',
          s.services,
        );
        /*
         * §20.6 makes German the fallback for an untranslated locale, and the
         * seed spells that out per record — `l()` writes the German string
         * into `fr` and `it`. A service typed into the create form did not:
         * the two locales came through as empty strings, which is not the same
         * thing as absent. `name.fr` is read straight into a heading, so a
         * French visitor would have got a blank `<h1>` rather than the German
         * one the fallback promises.
         */
        const fallback = (text: Record<Locale, string>): Record<Locale, string> => ({
          de: text.de,
          en: text.en || text.de,
          fr: text.fr || text.de,
          it: text.it || text.de,
        });

        const service: Service = {
          ...input,
          name: fallback(input.name),
          short: fallback(input.short),
          id: `svc_${Date.now().toString(36)}`,
          slug,
          /* Last in the list. The order column is what the website sorts by,
             and dropping a new service into the middle of a running catalogue
             would silently re-rank the seven that are already selling. */
          order: Math.max(0, ...s.services.map((x) => x.order)) + 1,
        };
        set({ services: [...s.services, service] });
        get().logChange({
          entity: 'service',
          entityId: service.id,
          summary:
            service.status === 'draft'
              ? `"${service.name.en}" created as a draft`
              : `"${service.name.en}" created and put on sale`,
        });
        return service;
      },

      updateService: (id, patch) => {
        set((s) => ({
          services: s.services.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
        const service = get().services.find((x) => x.id === id);
        get().logChange({
          entity: 'service',
          entityId: id,
          summary: `"${service?.name.en ?? id}" edited`,
          /* The editor autosaves per keystroke, so without this the log is
             one entry per letter typed into the price field. */
          coalesce: true,
        });
      },

      setServiceStatus: (id, status) => {
        const service = get().services.find((x) => x.id === id);
        if (!service || service.status === status) return;
        set((s) => ({
          services: s.services.map((x) => (x.id === id ? { ...x, status } : x)),
        }));
        const WORD: Record<ServiceStatus, string> = {
          active: 'put on sale',
          inactive: 'taken off sale',
          draft: 'set back to draft',
        };
        get().logChange({
          entity: 'service',
          entityId: id,
          summary: `"${service.name.en}" ${WORD[status]}`,
        });
      },

      deleteService: (id) => {
        const s = get();
        const service = s.services.find((x) => x.id === id);
        if (!service) return false;
        /* Re-checked here rather than trusted from the menu: the confirm panel
           read the count one render ago, and the store is the only place that
           can be sure nothing has since been booked against it. */
        if (serviceUsage(service.slug, s.data, s.plans).total > 0) return false;
        set({ services: s.services.filter((x) => x.id !== id) });
        get().logChange({
          entity: 'service',
          entityId: id,
          summary: `"${service.name.en}" deleted`,
        });
        return true;
      },

      createAddOn: (input) => {
        const s = get();
        const slug = uniqueAddOnSlug(slugify(input.name.de) || 'zusatz', s.addOns);
        /* §20.6 makes German the fallback for an untranslated locale, and the
           seed spells that out per record. A record typed into the create form
           did not: `fr` and `it` arrived as empty strings, which is not the
           same thing as absent — an add-on's name is read straight into the
           request flow's list, so a French customer would have seen a blank row
           with a price beside it. Same fix as `createService`. */
        const fallback = (text: Record<Locale, string>): Record<Locale, string> => ({
          de: text.de,
          en: text.en || text.de,
          fr: text.fr || text.de,
          it: text.it || text.de,
        });

        const addOn: AddOn = {
          ...input,
          name: fallback(input.name),
          short: fallback(input.short),
          id: `add_${Date.now().toString(36)}`,
          slug,
        };
        /* Last in the list. Add-ons render in array order on every screen that
           shows them, so inserting anywhere else would silently re-rank the
           ones a customer is already reading. */
        set({ addOns: [...s.addOns, addOn] });
        get().logChange({
          entity: 'addOn',
          entityId: addOn.id,
          summary: addOn.active
            ? `"${addOn.name.en}" created and switched on`
            : `"${addOn.name.en}" created, switched off`,
        });
        return addOn;
      },

      updateAddOn: (id, patch) => {
        set((s) => ({
          addOns: s.addOns.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
        const addOn = get().addOns.find((x) => x.id === id);
        get().logChange({
          entity: 'addOn',
          entityId: id,
          summary: `"${addOn?.name.en ?? id}" edited`,
          /* The editor saves per keystroke, so without this the log is one
             entry per letter typed into the price field. */
          coalesce: true,
        });
      },

      setAddOnActive: (id, active) => {
        const addOn = get().addOns.find((x) => x.id === id);
        if (!addOn || addOn.active === active) return;
        set((s) => ({
          addOns: s.addOns.map((x) => (x.id === id ? { ...x, active } : x)),
        }));
        get().logChange({
          entity: 'addOn',
          entityId: id,
          summary: `"${addOn.name.en}" ${active ? 'switched on' : 'switched off'}`,
        });
      },

      deleteAddOn: (id) => {
        const s = get();
        const addOn = s.addOns.find((x) => x.id === id);
        if (!addOn) return false;
        /* Re-checked here rather than trusted from the menu: the confirm read
           the count one render ago, and the store is the only place that can be
           sure nothing has since been quoted against it. */
        if (addOnUsage(addOn, s.data).total > 0) return false;
        set({ addOns: s.addOns.filter((x) => x.id !== id) });
        get().logChange({
          entity: 'addOn',
          entityId: id,
          summary: `"${addOn.name.en}" deleted`,
        });
        return true;
      },

      createManualBooking: (input, now) => {
        const s = get();
        const start = new Date(input.start);

        /*
         * The same gate the customer meets, deliberately.
         *
         * It is tempting to let the office override — they are on the phone
         * with the person, they know why this Tuesday matters. But
         * `maxJobsPerDay` is two because that is how much cleaning one person
         * can do, and a third job entered by hand does not create a third
         * person. The override the owner actually needs is to move a closure
         * or raise the ceiling in settings, and both of those already exist.
         */
        const blocked = dayBlockReason(start, {
          bookings: s.data.bookings,
          closures: s.data.closures,
          settings: s.settings,
          now,
        });
        if (blocked) return { error: 'blocked' as const, reason: blocked };

        const stamp = now.getTime().toString(36).toUpperCase().slice(-4);
        const reference = `B-${1050 + s.data.bookings.length}`;
        const id = `bkg_m_${s.data.bookings.length}_${stamp}`;

        const booking: Booking = {
          id,
          reference,
          customerId: input.customerId,
          propertyId: input.propertyId,
          serviceSlug: input.serviceSlug,
          start: input.start,
          duration: input.duration,
          arrivalWindow: arrivalWindowMinutes(input.duration / 60),
          assigneeId: input.assigneeId,
          status: 'scheduled',
          photoIds: [],
          history: [
            {
              at: now.toISOString(),
              kind: 'created',
              /* Says where it came from. A job with no quote behind it has no
                 amount and no signature, and six weeks later the difference
                 between "booked and paid" and this one is the whole answer to
                 "why is there no invoice". */
              label: input.note?.trim()
                ? `Von Hand erfasst — ${input.note.trim()}`
                : 'Von Hand erfasst',
            },
          ],
        };

        set({ data: { ...s.data, bookings: [booking, ...s.data.bookings] } });
        get().logChange({
          entity: 'booking',
          entityId: id,
          summary: `Job entered by hand: ${reference}`,
        });
        return { id, reference };
      },

      createCalendarEvent: (input, now) => {
        const s = get();
        const stamp = now.getTime().toString(36).slice(-4);
        const id = `cev_${s.data.events.length}_${stamp}`;
        const reference = `K-${(400 + s.data.events.length).toString()}`;

        const event: CalendarEvent = {
          id,
          reference,
          kind: input.kind,
          title: input.title.trim(),
          start: input.start,
          duration: input.duration,
          status: 'upcoming',
          customerId: input.customerId,
          contactName: input.contactName?.trim() || undefined,
          contactPhone: input.contactPhone?.trim() || undefined,
          propertyId: input.propertyId,
          note: input.note?.trim() || undefined,
          assigneeId: input.assigneeId,
          createdAt: now.toISOString(),
          history: [{ at: now.toISOString(), kind: 'created', label: 'Created' }],
        };

        set({ data: { ...s.data, events: [event, ...s.data.events] } });
        get().logChange({
          entity: 'event',
          entityId: id,
          summary: `Calendar entry created: ${reference} — ${event.title}`,
        });
        return id;
      },

      setCalendarEventStatus: (id, status, now, outcome) =>
        set((s) => ({
          data: {
            ...s.data,
            events: s.data.events.map((e) =>
              e.id !== id
                ? e
                : {
                    ...e,
                    status,
                    outcome: outcome?.trim() || e.outcome,
                    history: [
                      ...e.history,
                      {
                        at: now.toISOString(),
                        kind: status,
                        label: EVENT_STATUS_EVENT[status],
                      },
                    ],
                  },
            ),
          },
        })),

      updateCalendarEvent: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            events: s.data.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          },
        })),

      linkEventToRequest: (id, requestId, now) => {
        const s = get();
        const request = s.data.requests.find((r) => r.id === requestId);
        if (!request) return;

        set({
          data: {
            ...s.data,
            events: s.data.events.map((e) =>
              e.id !== id
                ? e
                : {
                    ...e,
                    status: 'inProgress' as const,
                    requestId,
                    history: [
                      ...e.history,
                      {
                        at: now.toISOString(),
                        kind: 'inProgress',
                        label: `Request ${request.reference} created`,
                      },
                    ],
                  },
            ),
          },
        });
      },

      setCouponActive: (id, active) => {
        const coupon = get().data.coupons.find((c) => c.id === id);
        /* No entry when nothing moved. The switch is idempotent by nature —
           the list re-renders on every store write — and a log that records
           "switched off" twice makes the Protokoll unreadable. */
        if (!coupon || coupon.active === active) return;
        set((s) => ({
          data: {
            ...s.data,
            coupons: s.data.coupons.map((c) => (c.id === id ? { ...c, active } : c)),
          },
        }));
        get().logChange({
          entity: 'coupon',
          entityId: id,
          summary: `"${coupon.code}" ${active ? 'switched on' : 'switched off'}`,
        });
      },

      patchData: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),

      addHold: (hold) => set((s) => ({ holds: [...s.holds, hold] })),

      releaseHold: (id) => set((s) => ({ holds: s.holds.filter((h) => h.id !== id) })),

      reset: () => {
        const at = new Date();
        const data = buildScenario('demo', at);
        set({
          data,
          settings: SEED_SETTINGS,
          services: SEED_SERVICES,
          addOns: SEED_ADDONS,
          holds: seedHolds(data, at),
          demo: initialDemo(),
          draft: emptyDraft(),
          applicationDraft: emptyApplicationDraft(),
        });
      },
    }),
    {
      name: 'homivaro-prototype',
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: () => undefined as never,
      /**
       * Defensive rehydrate.
       *
       * Bumping SCHEMA_VERSION handles a *known* shape change, but relying on
       * remembering to bump it is how a reviewer's stale localStorage ends up
       * crashing a screen on `undefined.length`. Any collection missing from
       * the persisted blob is filled from the current defaults, so a new
       * entity can never take a page down.
       */
      merge: (persisted, current) => {
        const saved = persisted as Partial<StoreState> | undefined;
        if (!saved) return current;
        return {
          ...current,
          ...saved,
          data: { ...current.data, ...(saved.data ?? {}) },
          settings: {
            ...current.settings,
            ...(saved.settings ?? {}),
            /* Shape guard, not a missing-key guard. `messageTemplates` is the
               first field whose *type* changed, and spreading a stale object
               over the array would satisfy TypeScript and crash at runtime. */
            messageTemplates: Array.isArray(saved.settings?.messageTemplates)
              ? saved.settings.messageTemplates
              : current.settings.messageTemplates,
          },
          demo: { ...current.demo, ...(saved.demo ?? {}) },
          draft: { ...current.draft, ...(saved.draft ?? {}) },
          applicationDraft: {
            ...current.applicationDraft,
            ...(saved.applicationDraft ?? {}),
          },
        };
      },
    },
  ),
);

function effectiveNow(override: string | null) {
  return override ? new Date(override) : new Date();
}

/**
 * The clock every screen and engine reads.
 *
 * Real `Date.now()` unless the demo bar has pinned a date — that is how the
 * 24-hour lead time, closure periods and "contractor sees the alarm code only
 * on the job's own day" rule become testable instead of asserted.
 */
export function useNow(): Date {
  const override = useStore((s) => s.demo.dateOverride);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    if (override) return;
    const id = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [override]);

  return override ? new Date(override) : new Date(tick);
}

/**
 * Persisted state and the server render disagree by definition. Screens gate
 * on this and show their skeleton until the store is live, so we never ship a
 * hydration mismatch.
 *
 * `useSyncExternalStore` rather than an effect: hydration *is* an external
 * store, and setting state from an effect body here caused a cascading render
 * on every gated screen.
 */
const subscribeHydration = (onChange: () => void) =>
  useStore.persist.onFinishHydration(onChange);
const hydratedSnapshot = () => useStore.persist.hasHydrated();
const serverSnapshot = () => false;

export function useHydrated() {
  return useSyncExternalStore(subscribeHydration, hydratedSnapshot, serverSnapshot);
}

/* ------------------------------------------------------------- selectors */

export function useRole() {
  return useStore((s) => s.demo.role);
}

export function useSettings() {
  return useStore((s) => s.settings);
}

/**
 * §13.1 — access codes are visible to the owner at all times, to the assigned
 * contractor **only on the day of the job**, and never to the customer-facing
 * surfaces. Enforced here rather than described in a note, so the demo can
 * prove it by moving the clock.
 */
export function canSeeAccessCodes(
  role: DemoRole,
  opts: { assignedToday: boolean } = { assignedToday: false },
) {
  if (role === 'owner') return true;
  if (role === 'contractor') return opts.assignedToday;
  return false;
}

/** revDSG: applicant data is owner-only. Contractors never see it. */
export function canSeeApplicants(role: DemoRole) {
  return role === 'owner';
}
