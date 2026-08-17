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
export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

/**
 * §21 item 1: the hour is the single pricing unit. Area, rooms and bathrooms
 * are *inputs to a duration estimate*, never independent price units — that is
 * what makes package credits and discounts computable at all.
 */
export type CalcMethod = 'hourly' | 'perUnit' | 'flat';

/** Column of the §5.2 duration matrix a service reads from. */
export type DurationProfile = 'standard' | 'deep' | 'moveout' | 'office' | 'none';

export interface Service {
  id: ID;
  slug: ServiceSlug;
  name: Record<Locale, string>;
  short: Record<Locale, string>;
  calc: CalcMethod;
  durationProfile: DurationProfile;
  /** CHF per hour, or per unit for perUnit services. */
  basePrice: number;
  /** Hours. The global floor is 2h (§5.1); a service may set a higher one. */
  minDuration: number;
  /** Move-out cleaning carries the handover guarantee (§12). */
  handoverGuarantee: boolean;
  active: boolean;
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
  services: ServiceSlug[];
  active: boolean;
}

/* ---------------------------------------------------------------- customer */

export type CustomerStatus = 'active' | 'inactive';
export type LoginMethod = 'password' | 'phone' | 'google' | 'apple' | 'magic-link';

export interface NotificationPrefs {
  operational: boolean; // §15 — cannot be switched off
  marketing: boolean;
  channelEmail: boolean;
  channelSms: boolean;
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
  postcode: string;
  city: string;
  kind: PropertyKind;
  area: number; // m²
  rooms: number;
  bathrooms: number;
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
  serviceSlug: ServiceSlug;
  addOnIds: ID[];
  /** Windows are billed per unit (§5.1: 0.5h per five windows). */
  windowCount?: number;
  furniturePieces?: number;
  preferred: PreferredTime;
  photoIds: ID[];
  customerNote?: string;
  internalNote?: string;
  status: RequestStatus;
  /** True when the postcode falls outside the served list (§6). */
  outOfArea: boolean;
  createdAt: ISODate;
  openedAt?: ISODate;
  respondedAt?: ISODate;
  subscriptionIntent?: PlanTier;
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
  serviceSlug: ServiceSlug | null;
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
  subscriptionIntent: PlanTier | null;
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
  status: OfferStatus;
  issuedAt?: ISODate;
  expiresAt?: ISODate;
  signedAt?: ISODate;
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

export interface Booking {
  id: ID;
  reference: string;
  offerId?: ID;
  subscriptionId?: ID;
  customerId: ID;
  propertyId: ID;
  serviceSlug: ServiceSlug;
  start: ISODate;
  /** Minutes. */
  duration: number;
  /** Minutes of slack shown to the customer as the arrival window (§7.1). */
  arrivalWindow: number;
  assigneeId?: ID;
  status: BookingStatus;
  checkInAt?: ISODate;
  checkOutAt?: ISODate;
  photoIds: ID[];
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

/* ------------------------------------------------------------ subscription */

export type PlanTier = 'basic' | 'premium' | 'vip';

export type SubscriptionStatus =
  | 'active'
  | 'pastDue'
  | 'paused'
  | 'cancellationPending'
  | 'cancelled';

export interface Subscription {
  id: ID;
  reference: string;
  customerId: ID;
  propertyId: ID;
  plan: PlanTier;
  serviceSlug: ServiceSlug;
  startDate: ISODate;
  /** One year minimum commitment (§11.2, reaffirmed). */
  commitmentEndsAt: ISODate;
  status: SubscriptionStatus;
  skipsUsedThisMonth: number;
  lastChargedAt?: ISODate;
  nextChargeAt?: ISODate;
  cancellationRequestedAt?: ISODate;
  internalNotes?: string;
}

export interface CreditLedgerEntry {
  at: ISODate;
  hours: number;
  reason: string;
  bookingId?: ID;
}

export interface PackageCredit {
  id: ID;
  customerId: ID;
  propertyId: ID;
  hoursRemaining: number;
  purchasedAt: ISODate;
  expiresAt: ISODate;
  ledger: CreditLedgerEntry[];
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
  issuedAt: ISODate;
  dueAt: ISODate;
  paidAt?: ISODate;
  /** Swiss QR-bill reference (§10). */
  qrReference: string;
  cancelReason?: string;
}

export type PaymentMethod = 'twint' | 'card' | 'apple-pay' | 'google-pay';

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
  kind: PaymentMethod;
  /** "Visa · 4242", "+41 79 ··· 66" — never the full number. */
  label: string;
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
  minOrder?: number;
  services: ServiceSlug[];
  validFrom: ISODate;
  validTo: ISODate;
  maxUses?: number;
  usedCount: number;
  active: boolean;
}

/* ------------------------------------------------------- proof and content */

export type ReviewStatus = 'pending' | 'published' | 'rejected';

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
  returnedAt?: ISODate;
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
  skills: ServiceSlug[];
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
  subscriptionCommitmentMonths: number;
  subscriptionNoticeMonths: number;
  monthlyFreeSkips: number;
  planDiscounts: Record<PlanTier, number>;
  creditValidityMonths: number;
  /**
   * §21 item 12 — permanent key holding stays locked until a liability policy
   * exists. Toggling this in the demo bar switches the key-log screen between
   * its locked and active states, and adds or removes the insurance claim on
   * the About page. Neither state ever claims cover that isn't there.
   */
  hasLiabilityInsurance: boolean;
  applicationRetentionMonths: number;
  /**
   * §15 — the automatic messages, per event and language.
   *
   * French and Italian are deliberately absent rather than copied from German.
   * §20.6 makes German the fallback, so an untranslated message still sends;
   * modelling the gap as missing keys is what lets the templates screen count
   * it and the language switcher expose it.
   */
  messageTemplates: Record<MessageTemplateKey, Partial<Record<Locale, string>>>;
}
