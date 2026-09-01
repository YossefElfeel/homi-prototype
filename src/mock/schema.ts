/**
 * Entity model — spec §3, plus the three hiring entities added in wave 7.
 *
 * Dates are ISO strings throughout so the whole store survives a round trip
 * through localStorage without a revive step.
 */

import type { Locale } from '@/i18n/routing';

export type ID = string;
export type ISODate = string;

/* --------------------------------------------------------------- catalogue */

export const SERVICE_SLUGS = [
  'unterhaltsreinigung',
  'einmalreinigung',
  'umzugsreinigung',
  'grundreinigung',
  'fensterreinigung',
  'bueroreinigung',
  'moebelmontage',
] as const;
/**
 * The seven the business launched with — the ones every other module names by
 * hand: the icon map, the marketing copy, the pricing order, the seeded
 * scenarios. `Service.slug` is deliberately *not* this type. The catalogue is
 * editable, and once an owner can add a service the set of slugs stops being
 * knowable at compile time; keeping the union here means the modules that
 * really do only know these seven still say so.
 */
export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

/**
 * How a service turns into money.
 *
 * §21 item 1 makes the hour the pricing unit for cleaning: area, rooms and
 * bathrooms are *inputs to a duration estimate*, never independent price units
 * — that is what makes a plan's per-visit price and its discount computable at
 * all.
 * `perUnit` counts a thing (windows) and converts the count into hours, and
 * `flat` is one fixed price for the whole job. No seeded service is flat, but
 * the type has carried the case since §5.1 and nothing could ever set it.
 */
export type CalcMethod = 'hourly' | 'perUnit' | 'flat';

/** Column of the §5.2 duration matrix a service reads from. */
export type DurationProfile = 'standard' | 'deep' | 'moveout' | 'office' | 'none';

/**
 * Three states, because `active: boolean` could only hold two of them.
 *
 * `draft` is the one that was missing, and its absence is what made adding a
 * service something you had to finish in one sitting: the moment the record
 * existed it was either on the website or switched off, and "switched off"
 * already means something else — a service the office retired, or paused for
 * the season. A half-written price list wearing the same badge as a withdrawn
 * service is two different facts in one colour.
 */
export type ServiceStatus = 'active' | 'inactive' | 'draft';

export interface Service {
  id: ID;
  /**
   * Free-form, not `ServiceSlug`. It is the URL segment under /leistungen and
   * the key a request is filed under, and an owner creating «Fassadenreinigung»
   * needs a slug for it — a closed union made the create flow impossible
   * rather than merely unbuilt.
   */
  slug: string;
  name: Record<Locale, string>;
  short: Record<Locale, string>;
  calc: CalcMethod;
  durationProfile: DurationProfile;
  /** CHF per hour, per counted unit, or for the whole job — see `calc`. */
  basePrice: number;
  /** Hours. The global floor is 2h (§5.1); a service may set a higher one. */
  minDuration: number;
  /**
   * No price until somebody has looked at the job.
   *
   * `basePrice` is required and every public surface prints it, which was
   * sound while the catalogue was nine cleaning services resting on one hourly
   * rate. Construction does not: the same room is three days or three weeks
   * depending on what is above the plaster. A number here would be an invented
   * one, and `basePrice: 0` printing «CHF 0.–» is worse than inventing it — so
   * the fact that there is no price is stated rather than encoded in a zero.
   */
  quotedIndividually?: boolean;
  /** Move-out cleaning carries the handover guarantee (§12). */
  handoverGuarantee: boolean;
  status: ServiceStatus;
  order: number;
}

export interface AddOn {
  id: ID;
  slug: string;
  name: Record<Locale, string>;
  short: Record<Locale, string>;
  price: number;
  /** Extra hours added to the estimate. */
  extraDuration: number;
  /** Which services offer it, by `Service.slug`. */
  services: string[];
  active: boolean;
}

/* ---------------------------------------------------------------- customer */

/**
 * `inactive` is a closed account — the person left, or the owner parked them.
 * `blocked` is a decision about them: no new work is taken, the quote builder
 * refuses to send, and their own account area is shut. Two different facts that
 * one boolean had to carry between them, so "left us" and "we are not serving
 * this person" were the same row in the list.
 */
export type CustomerStatus = 'active' | 'inactive' | 'blocked';
export type LoginMethod = 'password' | 'phone' | 'google' | 'apple' | 'magic-link';

export interface NotificationPrefs {
  operational: boolean; // §15 — cannot be switched off
  marketing: boolean;
  channelEmail: boolean;
  channelSms: boolean;
}

/**
 * The postal half of an address, with no service facts attached.
 *
 * Deliberately a subset of `Property`'s fields and deliberately not the same
 * type: a property is somewhere work happens, and it carries a size, an access
 * method and a floor. A contact address carries none of those and must not
 * grow them — the moment the two become one type, every customer needs a
 * square-metre figure before they can be stored.
 */
export interface ContactAddress {
  street: string;
  /** Floor, entrance, bell — the half that gets somebody to the door. */
  addressDetail?: string;
  postcode: string;
  city: string;
}

export interface Customer {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: Locale;
  loginMethod: LoginMethod;
  status: CustomerStatus;
  createdAt: ISODate;
  notifications: NotificationPrefs;
  internalNotes?: string;
  /**
   * Where the person is, as opposed to where the work is.
   *
   * Every address in this app was a `Property`, and a property is a thing that
   * gets cleaned. That left the office with nowhere to write down where a
   * customer actually lives: a record typed in from a phone call had a name, a
   * number and no postcode, so there was no address on file until the first
   * job created one.
   *
   * Optional because the call comes before the address does. A name and a
   * number is a real customer, and refusing to save one without a street loses
   * the person who just rang.
   */
  address?: ContactAddress;
  /**
   * Out of the working list, still in the data. Deleting outright is not
   * available: `customerId` is dereferenced with `!` on three admin screens
   * and the invoices have to survive anyway (§15). Archiving is what "delete"
   * means here, and the archive tab is where it is honest about that.
   */
  archivedAt?: ISODate;
}

/* ---------------------------------------------------------------- property */

export type PropertyKind = 'apartment' | 'house' | 'office';
export type AccessMethod = 'customer-present' | 'key-left' | 'key-box' | 'other-person';

/**
 * Sensitive by definition (§13.1). Encrypted at rest in production; here it is
 * gated by role *and date* in the selectors so the demo actually proves the
 * rule rather than just claiming it.
 */
export interface AccessDetails {
  method: AccessMethod;
  contactPhone?: string;
  keyLocation?: string;
  keyLocationPhotoId?: ID;
  keyReturnLocation?: string;
  boxLocation?: string;
  boxCode?: string;
  personName?: string;
  personPhone?: string;
  personRelation?: string;
  alarmCode?: string;
  emergencyName?: string;
  emergencyPhone?: string;
}

export interface Property {
  id: ID;
  customerId: ID;
  label: string;
  street: string;
  /**
   * The half of an address that gets somebody to the door.
   *
   * A street and a number reach the building; «3. OG links, Klingel Meier,
   * Hintereingang über den Hof» is what reaches the flat. It was being typed
   * into `permanentNotes` — the standing-note field that also carries "dog in
   * the living room" — so the one line a cleaner needs *before* they arrive
   * sat in a block the job sheet prints at the bottom, if at all.
   *
   * Optional, because a detached house genuinely has nothing to add. Empty is
   * "there is nothing more to say", never an unfinished record — which is why
   * nothing validates it.
   */
  addressDetail?: string;
  postcode: string;
  city: string;
  kind: PropertyKind;
  /**
   * The three facts that decide the price — and the three the office does not
   * always have yet.
   *
   * They became optional when an address could first be recorded without a
   * survey. A customer created from a phone call gets a street and a postcode,
   * and «how many square metres?» is not the second question you ask somebody
   * who has just rung. Absent means unmeasured: no screen prints a figure for
   * it, and `computeEstimate` returns null rather than pricing the job.
   *
   * Zero was the cheap way to spell this, and it is a lie the type system
   * cannot catch — 0 m² reads as a measurement, sorts as the smallest flat on
   * the list, and prices.
   */
  area?: number; // m²
  rooms?: number;
  bathrooms?: number;
  floor: number;
  hasElevator: boolean;
  hasPets: boolean;
  needsExtraEffort: boolean;
  access?: AccessDetails;
  permanentNotes?: string;
}

/* ----------------------------------------------------------------- request */

export type RequestStatus =
  | 'draft'
  | 'new'
  | 'inReview'
  | 'offerSent'
  | 'revisionRequested'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelledByCustomer'
  | 'cancelledByCompany';

export type TimeBand = 'morning' | 'midday' | 'afternoon';

export interface PreferredTime {
  date?: ISODate;
  band?: TimeBand;
  flexible: boolean;
}

export interface ServiceRequest {
  id: ID;
  reference: string;
  customerId: ID;
  propertyId: ID;
  /** A `Service.slug`, not one of the seven — the catalogue is open. */
  serviceSlug: string;
  addOnIds: ID[];
  /** Windows are billed per unit (§5.1: 0.5h per five windows). */
  windowCount?: number;
  furniturePieces?: number;
  preferred: PreferredTime;
  photoIds: ID[];
  customerNote?: string;
  internalNote?: string;
  status: RequestStatus;
  /*
   * `outOfArea` was here, and it is gone rather than kept and always false:
   * §6 is now enforced at intake, so no path can write `true` — and a stored
   * flag nothing can set is exactly the kind of lie the type system does not
   * catch. The area is a property of the address, and `Property.postcode` is
   * where it can still be checked against `settings.servedPostcodes`.
   */
  createdAt: ISODate;
  openedAt?: ISODate;
  respondedAt?: ISODate;
  /** The plan the customer asked for, by id. */
  planIntent?: ID;
}

/**
 * The in-progress request.
 *
 * §20.1: a visitor who leaves mid-flow keeps their answers — the draft is held
 * for 30 days, with a reminder after 24 hours. Persisting this in the store is
 * what makes "back without losing data" and the autosave notice real rather
 * than decorative.
 */
export interface PropertyInput {
  street: string;
  postcode: string;
  city: string;
  kind: PropertyKind;
  area: number | null;
  rooms: number | null;
  bathrooms: number | null;
  floor: number;
  hasElevator: boolean;
  hasPets: boolean;
  needsExtraEffort: boolean;
}

export interface DraftPhoto {
  id: ID;
  name: string;
  note: string;
}

export interface RequestDraft {
  serviceSlug: string | null;
  /** Set when a signed-in customer picks one of their saved properties. */
  propertyId: ID | null;
  property: PropertyInput;
  addOnIds: ID[];
  windowCount: number | null;
  furniturePieces: number | null;
  access: AccessDetails | null;
  preferred: PreferredTime;
  photos: DraftPhoto[];
  customerNote: string;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    language: Locale;
  };
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  planIntent: ID | null;
  updatedAt: ISODate | null;
}

/* ------------------------------------------------------------------- offer */

export interface OfferLine {
  id: ID;
  /**
   * The catalogue slug for a line that came from a service or add-on, and free
   * text for a line the owner typed. It is the *identity* of the line — what
   * links it back to the catalogue — so it is never what an editable field
   * writes to.
   */
  label: string;
  /**
   * What the customer reads, when the owner has reworded it for this quote.
   *
   * Without this, typing in the quote builder's description cell wrote the
   * resolved German name straight over the slug, and the line's link to the
   * catalogue was gone for good after a single keystroke.
   */
  displayLabel?: string;
  calc: CalcMethod;
  /** Hours for hourly lines, pieces for per-unit lines. */
  quantity: number;
  unitPrice: number;
  /**
   * Calendar time this line consumes, which is not always what it bills.
   * An add-on charges a flat price but still takes half an hour; switching it
   * off has to shorten the visit as well as lower the total.
   */
  hours: number;
  optional: boolean;
  /** Optional lines the customer has switched on (§9.1). */
  selected: boolean;
  note?: string;
}

export type OfferStatus =
  | 'draft'
  | 'sent'
  | 'revisionRequested'
  | 'accepted'
  | 'rejected'
  | 'expired';

/**
 * One party's mark on a contract — §9.2.
 *
 * Stored as SVG path data rather than a raster, for two reasons that both
 * showed up immediately. Ink drawn in the light theme is invisible in the dark
 * one unless the mark can inherit `currentColor`, which a PNG cannot; and a
 * contract is a document, so the mark has to survive being enlarged.
 *
 * `name` and `role` travel with it because a signature that only carries a
 * timestamp does not say who signed — and on a two-party contract that is the
 * whole question.
 */
export interface Signature {
  name: string;
  /** «Inhaber» / «Kundin» — which side of the agreement this is. */
  role: string;
  /** Path data in the 720×220 box both pads draw in. */
  path: string;
  at: ISODate;
}

export interface Offer {
  id: ID;
  reference: string;
  requestId: ID;
  version: number;
  lines: OfferLine[];
  discountKind?: 'percent' | 'amount';
  discountValue?: number;
  couponCode?: string;
  message: string;
  /**
   * What the customer asked to have changed (§20.1) — and why it is not
   * `message`.
   *
   * The two used to share one field, on the reasoning that both are "the text
   * attached to this quote". They travel in opposite directions: `message` goes
   * out with the quote and is the first thing the customer reads on
   * `/offerte/[id]`; this comes back and only the office reads it. One field
   * meant that asking a question silently deleted the note the office had
   * written, and the panel then printed the customer's complaint under the
   * heading "Covering note".
   */
  revisionNote?: string;
  status: OfferStatus;
  issuedAt?: ISODate;
  expiresAt?: ISODate;
  signedAt?: ISODate;
  /**
   * §9.2 — the company signs first, and the quote goes out already signed.
   *
   * `sendOffer` stamps this by copying `settings.ownerSignature`. Copied, not
   * referenced: redrawing the stored mark has to change what the *next* quote
   * carries and nothing about a contract already signed.
   */
  ownerSignature?: Signature;
  /**
   * Drawn on screen 26, and what closes the agreement.
   *
   * `signedAt` stays beside it: the lifecycle, the quote list and
   * `offer-facts` all read that one timestamp, and this adds the mark rather
   * than moving the milestone.
   */
  customerSignature?: Signature;
  /** Estimated hours the scheduler must fit, derived from the hourly lines. */
  estimatedHours: number;
  /**
   * Up to three dates a *new* customer proposed, waiting for the office to
   * pick one.
   *
   * A returning customer books a slot outright — we know their place, their
   * access and their history, so the live picker can commit on the spot. A
   * first job is the one where the office wants a look before the calendar is
   * spent, and offering a single take-it-or-leave-it slot to someone with no
   * relationship yet is how a quote quietly dies. These are *preferences*, not
   * holds: nothing is blocked in the calendar until the office confirms one.
   */
  proposedSlots?: ISODate[];
  /** Which of `proposedSlots` the office picked. */
  confirmedSlot?: ISODate;
  /** When it picked it. Both, because the hold is rebuilt from the pair. */
  slotConfirmedAt?: ISODate;
}

/* ----------------------------------------------------------------- booking */

export type BookingStatus =
  | 'scheduled'
  | 'rescheduled'
  | 'inProgress'
  | 'noAccess'
  | 'awaitingApproval'
  | 'completed'
  | 'invoiced'
  | 'closed'
  /** Called off by the company. `closed` means finished, which is not this. */
  | 'cancelled';

/**
 * The office moved this job, and where it stood before.
 *
 * `status: 'rescheduled'` said *that* it moved and nothing else. The badge
 * cannot carry a date, and the one line that could — the timeline entry — is
 * three collapsed sections down the booking screen, which is not where anybody
 * looks before phoning a customer back. On the customer's side it was worse
 * than invisible: the date on their dashboard simply changed under them, with
 * no record that it had ever been anything else.
 *
 * Only the most recent move. The full chain stays in `history`; this is the
 * one fact a note has to state — what the customer had in their diary before
 * we touched it.
 */
export interface BookingReschedule {
  /** Where the job stood before the move. */
  from: ISODate;
  /** When the office moved it — also when the customer was told. */
  at: ISODate;
}

/**
 * What one person actually spent on one job.
 *
 * §5.3 has always split the job in two — the person on site reports the time,
 * the office prices it — and only the reporting half existed. It reported into
 * a *sentence*: check-out folded the hours into the timeline label as
 * «Ausgecheckt · +1 h reported», which no screen can add up, filter on or
 * correct. So the one number the office is asked to approve was the one number
 * the record did not hold.
 *
 * A list on the booking rather than a field, and every entry naming its own
 * member, for two reasons that are the same reason: a job is not permanently
 * one person's. Reassigning it must not move somebody else's afternoon onto a
 * new name, and the day two people clean a house together the model already
 * says so.
 */
export interface WorkEntry {
  id: ID;
  /** Whose hours these are — never read back off `Booking.assigneeId`. */
  memberId: ID;
  /**
   * Minutes, like `Booking.duration`.
   *
   * The two are subtracted on every screen that shows this, and a record
   * holding one of them in hours and the other in minutes is a bug waiting for
   * the first half-hour anybody works.
   */
  minutes: number;
  /** The person on the job, or the office correcting them. Both are legitimate
      and they are not the same claim — see §5.3 on /open-questions. */
  source: 'field' | 'office';
  recordedAt: ISODate;
  note?: string;
}

export interface Booking {
  id: ID;
  reference: string;
  offerId?: ID;
  subscriptionId?: ID;
  customerId: ID;
  propertyId: ID;
  serviceSlug: string;
  start: ISODate;
  /** Minutes. */
  duration: number;
  /** Minutes of slack shown to the customer as the arrival window (§7.1). */
  arrivalWindow: number;
  assigneeId?: ID;
  status: BookingStatus;
  checkInAt?: ISODate;
  checkOutAt?: ISODate;
  reschedule?: BookingReschedule;
  photoIds: ID[];
  /**
   * Hours actually worked, per person. Optional because "nobody has recorded
   * anything yet" and "somebody recorded zero" are different facts, and a
   * scheduled job has to be able to say the first one.
   */
  work?: WorkEntry[];
  history: TimelineEvent[];
}

export interface TimelineEvent {
  at: ISODate;
  kind: string;
  label: string;
  actor?: string;
}

/**
 * A slot held while the customer is paying. The live picker replaced the three
 * fixed proposals, which makes the §20.2 double-booking race far more likely —
 * this is what stops it.
 */
export interface SlotHold {
  id: ID;
  offerId: ID;
  start: ISODate;
  duration: number;
  expiresAt: ISODate;
  /**
   * Set when the hold came from the office confirming a proposed date rather
   * than from the customer picking one at checkout.
   *
   * The two need different lifetimes and different words. A checkout hold is
   * fifteen minutes and is drawn as a countdown, because the customer is on
   * the page right now. A confirmed date has to survive the customer closing
   * the tab, reading the mail tomorrow and paying the day after — drawn as a
   * countdown it would read as pressure on a decision that is already made.
   */
  confirmed?: boolean;
}

/* -------------------------------------------------------- calendar events */

/**
 * What goes on the calendar that is not a job.
 *
 * The calendar read `bookings` and `closures` and nothing else. So a promise
 * made on the phone — "ich rufe Sie Dienstag zurück" — had nowhere to live but
 * free text in a request's `internalNote`, with no date on it and no screen
 * that would ever surface it again. That sentence is in the seed twice; neither
 * copy is findable, and both are the kind of promise a small business loses
 * work by forgetting.
 *
 * Deliberately not a `Booking`. A booking has an address to drive to, a price,
 * an arrival window, a check-in and a contractor. A call has none of those, and
 * folding one into the booking table would spend one of the two daily job slots
 * (§1.2) on a five-minute phone call and put that call in the contractor's day.
 */
export type CalendarEventKind =
  | 'contact-call'
  /** Chasing something already in flight — a quote, an unpaid invoice. */
  | 'follow-up'
  /** On site, before quoting. The only kind that occupies the owner's day. */
  | 'viewing';

/**
 * The five an appointment can stand in, named for where it stands rather than
 * for what was last done to it.
 *
 * The old names were `planned`, `noReply` and `converted`, and the calendar
 * legend built out of them read "Planned · Done · No reply · Became a request ·
 * Called off" — a list of events, not a list of states, which is the one thing
 * a legend cannot be. No meaning moved here; only what each is called.
 */
export type CalendarEventStatus =
  /** Ahead of us, still to happen. Was `planned`. */
  | 'upcoming'
  | 'done'
  /**
   * Rang, nobody picked up. Not `done` — it still has to happen, which is
   * exactly why it is pending rather than a closing state. Was `noReply`.
   */
  | 'pending'
  /**
   * It became a request and the work is running there now. `requestId` says
   * which one — this is the deal path. Was `converted`.
   */
  | 'inProgress'
  | 'cancelled';

export interface CalendarEvent {
  id: ID;
  reference: string;
  kind: CalendarEventKind;
  title: string;
  start: ISODate;
  /** Minutes. */
  duration: number;
  status: CalendarEventStatus;
  /**
   * Set once the person on the other end is a customer. Someone who phoned
   * once and has not booked anything is not one, and inventing a `Customer`
   * record for every enquiry would fill /admin/kunden with people who are not
   * customers yet.
   */
  customerId?: ID;
  contactName?: string;
  contactPhone?: string;
  /** A viewing has an address. A call usually does not. */
  propertyId?: ID;
  note?: string;
  /** Written after the fact — what actually came out of it. */
  outcome?: string;
  /** The request this turned into. */
  requestId?: ID;
  assigneeId?: ID;
  createdAt: ISODate;
  history: TimelineEvent[];
}

/* -------------------------------------------------------------------- plan */

/**
 * How often a plan's visits are meant to land. Derived from the plan rather
 * than stored on it — see `planRhythm` in `lib/offer-facts`.
 */
export type RhythmKey = 'oneTime' | 'monthly' | 'biweekly' | 'weekly' | 'twiceWeekly';

/**
 * A plan is a product the office can edit, not a tier baked into the types.
 *
 * What a plan *was* lived in four places at once and not one of them was
 * reachable from the panel: its identity in a `PlanTier` union of three string
 * literals, its discount in `Settings.planDiscounts`, its rhythm in a
 * `PLAN_RHYTHM` map, and its feature list hardcoded in the marketing card. So
 * adding a fourth plan, retiring one, or changing what one costs each meant a
 * deploy — which is why the "Add Plan" the brief asks for had nothing it could
 * add to.
 *
 * It is a prepaid package, not a recurring charge: one payment at sign-up buys
 * `includedVisits` visits, usable for `validityMonths`. That is why no
 * next-charge date appears anywhere on this model, and why `Subscription`
 * counts visits instead of billing periods.
 */
export interface Plan {
  id: ID;
  reference: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  /** The selling points, in the order the customer reads them. */
  features: Record<Locale, string>[];
  /** Paid once, at sign-up — not per month. */
  price: number;
  /**
   * What the same visits cost bought one at a time — the figure `price` is
   * measured against, and the only honest way to put a saving on the card.
   *
   * Optional, and it has to stay optional. A plan whose price is simply its
   * price has no "before", and manufacturing one is the discount theatre this
   * brand cannot afford. Where it is set it must exceed `price`; the site
   * ignores it otherwise rather than advertising a negative saving.
   */
  listPrice?: number;
  /** How many visits that price buys. */
  includedVisits: number;
  /** How long those visits stay usable, from the day the plan is paid for. */
  validityMonths: number;
  /** The service the included visits are drawn against. */
  serviceSlug: string;
  /**
   * Applied to work *outside* the package — an extra visit once the included
   * ones are spent, or a different service entirely. Inside the package there
   * is nothing left to discount: those visits are already paid for.
   */
  extraDiscountPercent: number;
  /**
   * Two flags rather than one, because they answer different questions.
   *
   * `active` decides whether anyone can still subscribe or renew. Turning it
   * off has to leave existing subscribers untouched — they paid for a term,
   * and retiring a product cannot reach back and take that away.
   *
   * `visibleOnSite` decides only whether the marketing page lists it. That is
   * how a plan gets sold by phone before it is announced, and how a retired
   * plan stops being advertised while the people holding it keep using it.
   */
  active: boolean;
  visibleOnSite: boolean;
  order: number;
}

/* ------------------------------------------------------------ subscription */

/**
 * `pastDue` and `cancellationPending` are gone rather than kept and unused.
 *
 * Both described a monthly-charge product this is not. A plan is paid once, so
 * there is no recurring collection left to fail; and a cancellation is either
 * inside the refund window — in which case it happens immediately — or refused,
 * so nothing stays pending. A status no screen can write is exactly the kind of
 * lie the type system does not catch.
 *
 * `expired` replaces them, and it is the one every plan reaches eventually:
 * the term ran out, whether or not visits were left on it.
 */
export type SubscriptionStatus = 'active' | 'paused' | 'expired' | 'cancelled';

export interface Subscription {
  id: ID;
  reference: string;
  customerId: ID;
  propertyId: ID;
  planId: ID;
  startDate: ISODate;
  /**
   * `startDate` plus the plan's `validityMonths`. The package ends here
   * whether or not visits remain — that is what was bought, and implying
   * leftovers roll over is how a refund argument starts.
   */
  endDate: ISODate;
  status: SubscriptionStatus;
  /**
   * Counted, not derived from bookings. A booking can be cancelled, moved or
   * deleted; a visit that was delivered stays spent. `history` records which
   * booking spent which visit, so the number can still be audited.
   */
  visitsUsed: number;
  /** The invoice that paid for the current term. */
  invoiceId?: ID;
  /** How many times this package has been bought again after the first term. */
  renewalCount: number;
  cancelledAt?: ISODate;
  /** The refunded payment, when a cancellation landed inside the window. */
  refundedPaymentId?: ID;
  internalNotes?: string;
  /*
   * Every other entity here carries a history and this one did not, which is
   * why "when was it renewed, and how many times" had nothing to read.
   * `skipsUsedThisMonth` also lived here as a stored counter that nothing ever
   * reset — so a customer's free skips ran out permanently, once. Skips are
   * counted off these events instead.
   */
  history: TimelineEvent[];
}

/**
 * §16 — the message thread a customer sees in their account.
 *
 * Not a chat. Everything the business sends is already recorded against a
 * request, a quote or a booking; this is the same trail, readable, with the
 * customer able to reply in context. Modelling it as a flat list keyed by a
 * subject reference is enough for that and keeps §22's "no live chat" honest.
 */
export interface CustomerMessage {
  id: ID;
  customerId: ID;
  /** The reference the thread hangs off — A-…, O-…, B-… or RE-…. */
  subject: string;
  from: 'customer' | 'homivaro';
  body: string;
  at: ISODate;
  readByCustomer: boolean;
  /**
   * The office's own read state — a different question from `readByCustomer`,
   * and a different question again from who wrote last.
   *
   * The admin list had one chip reading «Ungelesen» that actually measured
   * "the customer wrote last", so a thread the owner had read and deliberately
   * parked until tomorrow stayed marked unread for ever, and one they had
   * never opened but had auto-answered looked handled. Two states, two flags.
   */
  readByAdmin: boolean;
  /** Absent and empty mean the same thing; nothing distinguishes them. */
  attachments?: MessageAttachment[];
}

/**
 * A file sent alongside a message.
 *
 * Deliberately not a `Photo`. A photo in this system is evidence about a job:
 * it carries `visibleToCustomer` and `publishConsent` because §20.6 makes
 * showing one to anybody a recorded decision. An attachment is the opposite —
 * the office chose this file and put it in a thread addressed to one named
 * customer, so "who may see it" was answered by the act of sending. Reusing
 * `Photo` would have put a consent step in front of every reply that has an
 * invoice stapled to it, and `Photo` cannot hold the PDF half of "files and
 * images" at all.
 */
export interface MessageAttachment {
  id: ID;
  name: string;
  /** An image gets a preview; anything else gets a row with its size. */
  kind: 'image' | 'document';
  /** Bytes. Shown before it is opened, which is the point of showing it. */
  size: number;
}

/* ----------------------------------------------------------------- billing */

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLine {
  label: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: ID;
  reference: string;
  customerId: ID;
  bookingId?: ID;
  subscriptionId?: ID;
  lines: InvoiceLine[];
  status: InvoiceStatus;
  /**
   * When the draft was raised — which is not when it was issued.
   *
   * `sendInvoice` re-stamps `issuedAt` on approval so the payment term counts
   * from the day the customer actually got the bill. That made `issuedAt` the
   * only date on the record and a moving one, so «dieser Entwurf liegt seit
   * drei Wochen hier» — the one thing an invoice list exists to catch — could
   * not be asked at all. This one never moves.
   */
  createdAt: ISODate;
  issuedAt: ISODate;
  dueAt: ISODate;
  paidAt?: ISODate;
  /** Swiss QR-bill reference (§10). */
  qrReference: string;
  cancelReason?: string;
}

/**
 * A method that can be kept on file. Cash cannot, and neither can a QR-bill —
 * a slip is a way to settle one invoice, not a token we hold.
 */
export type SavedMethodKind = 'twint' | 'card' | 'apple-pay' | 'google-pay';

/**
 * How money actually moved.
 *
 * The union used to be the four savable ones, which meant the two ways an
 * invoice is normally settled in this market did not exist: the QR-bill (§10 —
 * every invoice carries one) and cash at the door. So `markInvoicePaid` had
 * nothing it could honestly write and wrote no `Payment` at all, and the
 * question "how was this one paid?" had no answer anywhere in the data.
 */
export type PaymentMethod = SavedMethodKind | 'qr-bill' | 'cash';

/**
 * A method the customer has kept on file (screen 45).
 *
 * The screen managed these entirely in local component state: adding,
 * removing and setting a default all worked on screen and were gone the moment
 * you navigated away — on the one screen whose whole subject is "what we have
 * saved for you".
 */
export interface SavedPaymentMethod {
  id: ID;
  customerId: ID;
  kind: SavedMethodKind;
  /** "Visa · 4242", "+41 79 ··· 66" — never the full number. */
  label: string;
  /**
   * "09/28". Cards only, and the only field of a card worth keeping besides
   * the brand and the last four: it is what tells the office a plan is about
   * to fail to charge, which is a phone call worth making a week early.
   *
   * The number itself and the security code are deliberately not here. They
   * are typed into the form and thrown away at the point of save — a record
   * that stores them is one nobody in this market may legally keep, and
   * modelling it in a prototype invites building it for real.
   */
  expiresAt?: string;
  isDefault: boolean;
  addedAt: ISODate;
}

export interface Payment {
  id: ID;
  invoiceId?: ID;
  offerId?: ID;
  amount: number;
  method: PaymentMethod;
  at: ISODate;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  gatewayRef: string;
  failureReason?: string;
}

export interface Coupon {
  id: ID;
  code: string;
  kind: 'percent' | 'amount';
  value: number;
  /**
   * The ceiling on what a percentage may ever take off, in francs.
   *
   * A percentage has no upper bound of its own, and that is only harmless
   * while every job costs about the same. 10% off a two-hour flat is CHF 25;
   * 10% off a move-out clean with windows and a balcony is CHF 180, on a code
   * that goes out with every first quote. The floor — `minOrder` — was already
   * here and stops the code being used on work too small to bother with. This
   * is the other end, and it was missing.
   *
   * Percentage codes only. A franc amount is already its own ceiling, so a cap
   * on one would be a second number saying the same thing as the first, and
   * the form does not offer it.
   */
  maxDiscount?: number;
  minOrder?: number;
  services: string[];
  validFrom: ISODate;
  validTo: ISODate;
  maxUses?: number;
  usedCount: number;
  active: boolean;
}

/* ------------------------------------------------------------- what goes out */

/**
 * Where the money went.
 *
 * The eight are the ones this business actually books against, in the order
 * the office thinks of them — supplies and vehicle are weekly, the rest are
 * monthly or rarer. `other` is last and is deliberately vague: a category set
 * with no escape hatch gets used wrongly, and a cost filed under the wrong
 * heading is worse than one filed under none.
 *
 * Wages are on the list because they are the largest line in a cleaning
 * company by a distance, and a profit figure that leaves them out is not a
 * profit figure. This prototype has no payroll — the entry is typed by hand
 * like every other cost, which /open-questions says out loud.
 *
 * `labour` is the ninth and it is not a second word for `wages`. The two
 * answer different questions and one heading was answering both, badly.
 * `wages` is the payout: a lump leaving the account at the end of the month
 * with a person's name on it and nothing behind it — no job, no hours, no
 * rate. It stays, because that is genuinely how the standing payroll runs.
 * `labour` is one person's hours on one job, and it carries the four facts
 * that make that a record rather than a note — who worked, how long, who paid,
 * and who carries it. See `LabourEntry`.
 *
 * What that buys is the question neither side could answer before: «was hat
 * uns dieser Umzug an Leuten gekostet». The job knew its price, the month knew
 * its payroll, and nothing joined the two.
 *
 * It sorts first because it is the largest line and the only one with
 * structure behind it — the reader opening this filter wants this heading more
 * often than any other.
 */
export type ExpenseCategory =
  | 'labour'
  | 'supplies'
  | 'vehicle'
  | 'wages'
  | 'insurance'
  | 'marketing'
  | 'software'
  | 'rent'
  | 'other';

/**
 * Two stored states, and the third is derived — exactly like an invoice.
 *
 * `overdue` is not in the union for the same reason it is not stored on an
 * `Invoice`: it is a date passing, and writing it down would need a nightly
 * sweep to stay true. `effectiveExpenseStatus` derives it.
 *
 * There is no `draft`. An invoice has one because the amount is argued about
 * inside the company before it goes to a customer; a supplier's bill arrives
 * finished, and a cost the office has not decided about yet is a cost it has
 * not entered.
 */
export type ExpenseStatus = 'open' | 'paid';

/**
 * Who worked, for how long, who paid them, and who carries it.
 *
 * The chain the workforce screen exists to make readable runs
 * job → worker → hours → cost → payer → responsible, and every link past the
 * second was missing: `Booking.assigneeId` says who was *sent*, and nothing
 * anywhere said what that hour cost or whose money settled it.
 *
 * All three people are ids into `team`, not free text. A name typed into a box
 * cannot be totalled, cannot be linked, and spells itself differently the
 * second time — and the whole point of this record is that «wie viele Stunden
 * hat Marta diesen Monat gemacht» is a sum rather than a search.
 *
 * Why the payer and the responsible are two fields rather than one: they come
 * apart in the ordinary case, not the exotic one. The contractor running a
 * Saturday job settles the second pair of hands out of her own pocket and is
 * reimbursed on Monday — she is the payer, the owner is still who the cost
 * belongs to. One field would make the reimbursement invisible, which is
 * precisely what somebody is looking for when they open this screen.
 */
export interface LabourEntry {
  /** Who did the work. Not necessarily the booking's `assigneeId` — a job can
      carry two people, and each pair of hands is its own record. */
  workerId: ID;
  /** Whose money actually left. Usually the owner; not always. */
  paidById: ID;
  /** Who the cost belongs to — who signed it off and answers for it. */
  responsibleId: ID;
  /**
   * Hours on the job, decimal — 3.5, not 3:30.
   *
   * Decimal because everything derived from it is a multiplication: the
   * effective rate, the month's total, the cost of one job. Storing a clock
   * would mean parsing one before every sum, and the office already writes
   * quarter hours on the timesheet.
   */
  hours: number;
}

/**
 * A cost the company carries — the other half of the finance picture.
 *
 * Nothing modelled it. `Invoice` said what came in, and «was bleibt am
 * Monatsende» was therefore a question the app could not answer at all: the
 * owner read the revenue here and the costs out of a shoebox and a banking
 * app. That is the gap the finance section closes.
 *
 * Gross, in francs, VAT included. The company is under the CHF 100'000
 * threshold and its own invoices carry «Keine MwSt.» — so splitting an
 * expense into net and VAT would model a reclaim that cannot be made.
 */
export interface Expense {
  id: ID;
  /** «AUS-2026-0007». The office's own number, not the supplier's. */
  reference: string;
  category: ExpenseCategory;
  /** Who was paid. Free text: a supplier is not a record in this app. */
  supplier: string;
  note?: string;
  amount: number;
  /** The day the cost arose — what the month is counted by. */
  incurredAt: ISODate;
  dueAt?: ISODate;
  paidAt?: ISODate;
  /** How it was settled. Only present once it is paid. */
  method?: PaymentMethod;
  status: ExpenseStatus;
  /**
   * The job this cost belongs to, when one does.
   *
   * A tank of fuel belongs to the month; the special detergent bought for one
   * move-out clean belongs to that job. Optional, because most costs are the
   * first kind and forcing a job onto them would produce made-up attribution.
   *
   * Required on a `labour` row, and that requirement is what separates the
   * category from `wages`: hours with no job on them are a payout, and a
   * payout is what `wages` is for. Enforced by the store and the form rather
   * than by the type — see `labour` below for why this is not a union.
   */
  bookingId?: ID;
  /**
   * Present exactly when `category === 'labour'`, and so is `bookingId`.
   *
   * Not a discriminated union, and that is a decision rather than an omission.
   * An `Expense` is read by a dozen screens that do not care which kind it is
   * — the list, the export, the month buckets, the profit line — and splitting
   * the type would make every one of them narrow before it could reach
   * `amount`. The pairing is enforced where it can be: the store refuses to
   * write a labour row without it and strips it from a row that stops being
   * labour, and `labourOf` in `lib/labour-facts.ts` is the one reader that
   * asserts the pair for everybody else.
   *
   * `supplier` is derived from `workerId` on these rows rather than typed, so
   * the list, the search and the CSV keep working with no special case — see
   * `createExpense`.
   */
  labour?: LabourEntry;
  /**
   * Recurs every month — rent, insurance, the software subscriptions.
   *
   * A flag rather than a schedule: nothing in this prototype writes next
   * month's copy, and a `RecurringExpense` with no engine behind it would be a
   * record that promises an automation the app does not have. What it is for
   * is reading — «welche Kosten laufen weiter, auch wenn wir nichts tun».
   */
  recurring?: boolean;
}

/* ------------------------------------------------------- proof and content */

/**
 * §16 — and `hidden` is the state that was missing.
 *
 * The moderation screen's «Zurückziehen» sent a published review back to
 * `pending`, because `pending` was the only state left that is not public.
 * That is a different sentence from the one the owner means: `pending` is
 * "nobody has looked at this yet", and it puts a decided review back into the
 * queue of undecided ones, where it sits under a heading that says it is
 * waiting for a first read. `rejected` is not it either — that is the review
 * the office refused, and a five-star one taken down for a fortnight because
 * the customer's name was about to change is not refused.
 *
 * So: `hidden` is published-and-off-the-site. It keeps the reply, it keeps the
 * fact that it was released once, and putting it back is one button rather
 * than a second trip through moderation.
 */
export type ReviewStatus = 'pending' | 'published' | 'hidden' | 'rejected';

export interface Review {
  id: ID;
  bookingId: ID;
  customerId: ID;
  rating: number;
  text: string;
  status: ReviewStatus;
  submittedAt: ISODate;
  ownerReply?: string;
  /**
   * §20.6 — publishing needs recorded consent.
   *
   * The customer's review form had this checkbox, bound to local state, and
   * never read it: the review was written with no consent field at all, and
   * the moderation screen could publish anything. Of every dead control in
   * this prototype it was the only one carrying legal weight.
   */
  publishConsent: boolean;
}

export type PhotoSource = 'customer' | 'owner' | 'field';
export type PhotoKind = 'before' | 'after' | 'context' | 'key-location' | 'issue';

export interface Photo {
  id: ID;
  src: string;
  source: PhotoSource;
  kind: PhotoKind;
  /** §20.6: internal by default. Publishing needs recorded written consent. */
  visibleToCustomer: boolean;
  publishConsent: boolean;
  note?: string;
  requestId?: ID;
  bookingId?: ID;
  propertyId?: ID;
  takenAt: ISODate;
}

export type KeyStatus = 'held' | 'returned';

export interface KeyLogEntry {
  id: ID;
  propertyId: ID;
  receivedAt: ISODate;
  receivedBy: string;
  storageLocation: string;
  /*
   * The handover back, recorded as fully as the handover in.
   *
   * `receivedAt`/`receivedBy` had a counterpart of one timestamp, so a closed
   * record said a key left the cupboard and could not say who carried it out
   * or who signed for it. That is the half of the trail a liability policy is
   * actually read against (§21 item 12) — "we gave it back" with nobody's name
   * on it is the same as no record.
   */
  returnedAt?: ISODate;
  returnedBy?: string;
  /** Who took it — normally the customer, sometimes whoever they sent. */
  returnedTo?: string;
  returnNote?: string;
  status: KeyStatus;
}

export interface ClosurePeriod {
  id: ID;
  start: ISODate;
  end: ISODate;
  reason: string;
  recurringYearly: boolean;
}

export interface NotificationRecord {
  id: ID;
  event: string;
  recipientId: ID;
  channel: 'email' | 'sms' | 'whatsapp';
  language: Locale;
  status: 'queued' | 'sent' | 'failed';
  at: ISODate;
}

export interface ChangeLogEntry {
  id: ID;
  at: ISODate;
  actor: string;
  entity: string;
  entityId: ID;
  summary: string;
}

/* ------------------------------------------------------- hiring (wave 7) */

export type EmploymentKind = 'permanent' | 'part-time' | 'temporary' | 'freelance';

export interface JobPosting {
  id: ID;
  slug: string;
  title: Record<Locale, string>;
  kind: EmploymentKind;
  /** Percentage workload, Swiss convention (e.g. 60 for 60%). */
  workload: [number, number];
  regions: string[];
  summary: Record<Locale, string>;
  responsibilities: Record<Locale, string[]>;
  requirements: Record<Locale, string[]>;
  offer: Record<Locale, string[]>;
  published: boolean;
  createdAt: ISODate;
}

/** Swiss right-to-work status. Not optional in this market. */
export type WorkPermit = 'ch' | 'c' | 'b' | 'g' | 'l' | 'other' | 'none';
export type LanguageLevel = 'none' | 'basic' | 'conversational' | 'fluent' | 'native';

export type ApplicationStatus = 'new' | 'inReview' | 'accepted' | 'rejected';

export interface ApplicantDocument {
  id: ID;
  name: string;
  kind: 'cv' | 'certificate' | 'reference' | 'other';
  sizeKb: number;
}

export interface Application {
  id: ID;
  reference: string;
  postingId?: ID;
  /** No open role — a Spontanbewerbung. */
  spontaneous: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postcode: string;
  city: string;
  permit: WorkPermit;
  languages: Partial<Record<Locale, LanguageLevel>>;
  hasDrivingLicence: boolean;
  hasCar: boolean;
  yearsExperience: number;
  experienceAreas: ('cleaning' | 'assembly')[];
  availability: { days: number[]; earliest: string; latest: string };
  startFrom?: ISODate;
  references: { name: string; company?: string; phone: string }[];
  documents: ApplicantDocument[];
  motivation?: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  internalNotes?: string;
  submittedAt: ISODate;
  /** revDSG: an explicit deletion date, set from settings at submission. */
  retainUntil: ISODate;
  consentGivenAt: ISODate;
  convertedTeamMemberId?: ID;
}

/**
 * The public application, mid-flight.
 *
 * Mirrors `RequestDraft`: the form is two steps, so the answers have to
 * survive the step boundary and a reload. Consent is deliberately not
 * pre-filled and not remembered — §14 wants it given, not inherited.
 */
export interface ApplicationDraft {
  postingId: ID | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postcode: string;
  city: string;
  permit: WorkPermit | null;
  languages: Partial<Record<Locale, LanguageLevel>>;
  hasDrivingLicence: boolean;
  hasCar: boolean;
  yearsExperience: number | null;
  experienceAreas: ('cleaning' | 'assembly')[];
  availability: { days: number[]; earliest: string; latest: string };
  startFrom: string;
  references: { name: string; company?: string; phone: string }[];
  documents: ApplicantDocument[];
  motivation: string;
  consent: boolean;
  updatedAt: ISODate | null;
}

export type TeamRole = 'owner' | 'contractor';

export interface TeamMember {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: TeamRole;
  active: boolean;
  regions: string[];
  skills: string[];
  startedAt: ISODate;
  fromApplicationId?: ID;
}

/* ---------------------------------------------------------------- settings */

/** §15 — the events that trigger an automatic message. */
export type MessageTemplateKey =
  | 'request-received'
  | 'offer-sent'
  | 'offer-reminder'
  | 'booking-confirmed'
  | 'appointment-reminder'
  | 'on-the-way'
  | 'job-done'
  | 'invoice-sent'
  | 'payment-reminder'
  | 'cancellation'
  | 'review-request';

/**
 * Which part of the product a template belongs to.
 *
 * The brief asked for categories by purpose — "Send Quote", "Send Invoice",
 * "Pricing List". Purpose alone would have left the other half of the brief
 * unanswered: it says nothing about *where* a template is used, so an admin
 * would still have to guess which screen offers it. Filing by flow answers both
 * at once, because the flow a template belongs to is the flow whose screen
 * offers it. Purpose finer than the flow — a reminder versus a first send — is
 * a `tag`, which the admin adds without a schema change.
 */
export type TemplateFlow =
  | 'requests'
  | 'quotes'
  | 'bookings'
  | 'invoices'
  | 'reviews'
  | 'general';

export const TEMPLATE_FLOWS: TemplateFlow[] = [
  'requests',
  'quotes',
  'bookings',
  'invoices',
  'reviews',
  'general',
];

export type TemplateChannel = 'email' | 'sms';

/**
 * §15 — one message the business sends, in every language it sends it in.
 *
 * This was a `Record<MessageTemplateKey, …>` of bare strings: eleven fixed
 * slots, no name, no subject, and the channel table written into screen 79's
 * component file where nothing else could read it. That shape made three of the
 * things the brief asks for impossible rather than merely missing — you cannot
 * add a twelfth template to a closed union, you cannot delete one, and you
 * cannot show a subject line that was never stored.
 *
 * `event` is what keeps the automatic sends working through all of that. It is
 * the *link* to a trigger rather than the identity of the row, so one event can
 * own several templates and the admin can delete any single one of them. The
 * only thing the store still enforces is that an event never ends up with none
 * — see `deleteTemplate`.
 */
export interface MessageTemplate {
  id: ID;
  /**
   * The automatic send this template can serve. Absent means manual only: it
   * appears in the pickers and never fires on its own.
   */
  event?: MessageTemplateKey;
  flow: TemplateFlow;
  /** Free labels the admin adds. Filtering reads these alongside `flow`. */
  tags: string[];
  /**
   * Per locale like the body, and for the same reason: a subject in the wrong
   * language is as wrong as a body in the wrong language. The pickers read it
   * as the template's name, so this doubles as the label — a separate `name`
   * would be a second thing to keep in sync with it.
   */
  subject: Partial<Record<Locale, string>>;
  body: Partial<Record<Locale, string>>;
  channels: TemplateChannel[];
  /**
   * Among the templates sharing an `event`, the one an automatic send uses.
   * Meaningless without `event`, and the store keeps exactly one per event.
   */
  isDefault: boolean;
}

export interface Settings {
  hourlyRate: number;
  minimumHours: number;
  /** §5.1 — configurable, shown as its own line in the quote. */
  eveningSurchargeFrom: string; // "17:00"
  eveningSurchargePercent: number;
  saturdaySurchargePercent: number;
  /** §5.1 — free within this radius, manual review beyond. */
  freeTravelKm: number;
  workingDays: number[]; // 1 = Mon … 6 = Sat
  dayStart: string;
  dayEnd: string;
  minLeadHours: number;
  maxJobsPerDay: number;
  servedPostcodes: string[];
  offerValidityDays: number;
  responseTimeHours: number;
  cancellationFreeHours: number;
  lateCancellationPercent: number;
  noAccessFeePercent: number;
  /**
   * How long after paying a customer may still cancel a plan and be refunded.
   *
   * The commitment length and the discount both left this record: they are
   * properties of a *plan* now, and two plans are allowed to differ on both.
   * What stays global is the cooling-off window, because it is a promise the
   * business makes once rather than per product.
   */
  planCancellationDays: number;
  monthlyFreeSkips: number;
  /**
   * §21 item 12 — permanent key holding stays locked until a liability policy
   * exists. Toggling this in the demo bar switches the key-log screen between
   * its locked and active states, and adds or removes the insurance claim on
   * the About page. Neither state ever claims cover that isn't there.
   */
  hasLiabilityInsurance: boolean;
  applicationRetentionMonths: number;
  /**
   * §9.2 — the company's half of every contract, drawn once.
   *
   * The owner signs before the customer does, which makes the mark part of
   * sending rather than a decision per quote: putting a drawing pad between
   * the office and every send, for a mark that never varies, is how the pad
   * becomes something to click through. So it lives here and `sendOffer`
   * applies it.
   */
  ownerSignature: {
    name: string;
    role: string;
    /** Path data in the 720×220 box the settings pad draws in. */
    path: string;
  };
  /**
   * §15 — every message the business sends, automatic or picked by hand.
   *
   * French and Italian are deliberately absent rather than copied from German.
   * §20.6 makes German the fallback, so an untranslated message still sends;
   * modelling the gap as missing keys is what lets the templates screen count
   * it and the language switcher expose it.
   */
  messageTemplates: MessageTemplate[];
}
