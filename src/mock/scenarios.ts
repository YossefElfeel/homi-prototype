import type {
  Application,
  Booking,
  ChangeLogEntry,
  ClosurePeriod,
  Coupon,
  Customer,
  Invoice,
  JobPosting,
  KeyLogEntry,
  CustomerMessage,
  PackageCredit,
  Offer,
  Payment,
  PropertyKind,
  RequestStatus,
  SavedPaymentMethod,
  Photo,
  Property,
  Review,
  ServiceRequest,
  ServiceSlug,
  SlotHold,
  Subscription,
  TeamMember,
} from './schema';
import { SERVICE_SLUGS } from './schema';
import type { Locale } from '@/i18n/routing';
import { SEED_ADDONS, SEED_SERVICES, SEED_SETTINGS } from './seed';
import { buildOfferLines, offerTotal } from './engines/offers';
import { businessWeekday, fromZoned, zonedParts } from '@/lib/business-time';

/**
 * Demo scenarios.
 *
 * `fresh` is the important one: it is the company on launch day, and walking
 * every screen in it is how we prove the empty states are designed rather than
 * left blank. The brief is blunt about this — "مش صفحة بيضا مكتوب عليها لا يوجد
 * بيانات".
 */
export const SCENARIOS = [
  'demo',
  'fresh',
  'busy',
  'overdue',
  'away',
  'conflict',
  'hiring',
  /**
   * Every declared state, at once.
   *
   * The other scenarios each stage one situation. This one stages none: it
   * exists so that every value in every status union in `schema.ts` has a
   * record carrying it, and so a badge, a filter option or a lifecycle branch
   * can be *seen* rather than reasoned about. `/flows` claims two states are
   * deliberately unreachable — this is the data set that shows the other
   * forty-odd are not.
   */
  'states',
] as const;
export type ScenarioName = (typeof SCENARIOS)[number];

export interface DataSet {
  customers: Customer[];
  properties: Property[];
  requests: ServiceRequest[];
  offers: Offer[];
  bookings: Booking[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
  paymentMethods: SavedPaymentMethod[];
  keyLog: KeyLogEntry[];
  credits: PackageCredit[];
  messages: CustomerMessage[];
  coupons: Coupon[];
  changeLog: ChangeLogEntry[];
  reviews: Review[];
  photos: Photo[];
  closures: ClosurePeriod[];
  team: TeamMember[];
  postings: JobPosting[];
  applications: Application[];
}

const EMPTY: DataSet = {
  customers: [],
  properties: [],
  requests: [],
  offers: [],
  bookings: [],
  subscriptions: [],
  invoices: [],
  payments: [],
  paymentMethods: [],
  keyLog: [],
  credits: [],
  messages: [],
  coupons: [],
  changeLog: [],
  reviews: [],
  photos: [],
  closures: [],
  team: [],
  postings: [],
  applications: [],
};

const iso = (d: Date) => d.toISOString();
const days = (from: Date, n: number) => {
  const out = new Date(from);
  out.setDate(out.getDate() + n);
  return out;
};
/**
 * A seeded time of day means the Zurich clock.
 *
 * `setHours(9)` meant nine o'clock wherever the seed happened to be built, so
 * the eight-o'clock job showed up at seven for a reviewer an hour ahead and at
 * ten for one an hour behind. Every rendered time is bound to Europe/Zurich,
 * so the seed has to be written in it too or the two disagree by exactly the
 * reviewer's offset.
 */
const at = (d: Date, h: number, m = 0) => {
  const p = zonedParts(d);
  return fromZoned(p.year, p.month, p.day, h, m);
};

/**
 * `days`, but never landing on a Sunday.
 *
 * §7.1 closes Sunday, so the live picker cannot offer one — a seeded slot on a
 * Sunday would be a date the customer could not have chosen, which is seed
 * data contradicting the engine that produced it. The whole seed is relative
 * to "now" and the demo clock moves, so a hand-picked offset is only right on
 * the day it was written.
 */
const openDay = (from: Date, n: number) => {
  const out = days(from, n);
  return businessWeekday(out) === 7 ? days(out, 1) : out;
};

/** The owner. One person — this is the whole company at launch. */
function owner(now: Date): TeamMember {
  return {
    id: 'tm_owner',
    firstName: 'Marco',
    lastName: 'Brunner',
    email: 'marco@homivaro.ch',
    phone: '+41 76 227 79 66',
    role: 'owner',
    active: true,
    regions: ['8700', '8706', '8707', '8708', '8712', '8132', '8627', '8634'],
    skills: [
      'unterhaltsreinigung',
      'einmalreinigung',
      'grundreinigung',
      'umzugsreinigung',
      'fensterreinigung',
      'bueroreinigung',
      'moebelmontage',
    ],
    startedAt: iso(days(now, -120)),
  };
}

function person(
  id: string,
  firstName: string,
  lastName: string,
  language: Locale,
  now: Date,
  daysAgo: number,
  /**
   * Distinct per customer.
   *
   * Every seeded person used to carry `+41 79 000 00 00`. That was invisible
   * while the phone number only appeared on a detail screen — but the request
   * list now puts it in every row, and four identical numbers down a column
   * read as a rendering fault rather than as data. It also made the duplicate
   * check on screen 64a fire against whichever customer happened to be first.
   */
  phone = '+41 79 000 00 00',
): Customer {
  return {
    id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}@example.ch`,
    phone,
    language,
    loginMethod: 'magic-link',
    status: 'active',
    createdAt: iso(days(now, -daysAgo)),
    notifications: {
      operational: true,
      marketing: false,
      channelEmail: true,
      channelSms: true,
    },
  };
}

function baseData(now: Date): DataSet {
  const customers: Customer[] = [
    person('cus_1', 'Andrea', 'Keller', 'de', now, 64, '+41 79 412 08 31'),
    person('cus_2', 'Thomas', 'Widmer', 'de', now, 31, '+41 79 654 21 07'),
    person('cus_3', 'Sophie', 'Marchand', 'fr', now, 12, '+41 78 233 96 44'),
    person('cus_4', 'James', 'Whitfield', 'en', now, 5, '+41 76 810 55 29'),
  ];

  const properties: Property[] = [
    {
      id: 'prp_1',
      customerId: 'cus_1',
      label: 'Zuhause',
      street: 'Seestrasse 44',
      postcode: '8700',
      city: 'Küsnacht',
      kind: 'house',
      area: 180,
      rooms: 6.5,
      bathrooms: 3,
      floor: 0,
      hasElevator: false,
      hasPets: true,
      needsExtraEffort: false,
      access: {
        method: 'key-box',
        boxLocation: 'Rechts neben der Haustür, unter dem Briefkasten',
        boxCode: '4417',
        keyReturnLocation: 'Zurück in den Schlüsselkasten',
        alarmCode: '90210',
        emergencyName: 'Andrea Keller',
        emergencyPhone: '+41 79 000 00 01',
      },
      permanentNotes: 'Hund (Nala) ist tagsüber zuhause, sehr freundlich.',
    },
    {
      id: 'prp_2',
      customerId: 'cus_2',
      label: 'Wohnung',
      street: 'Dorfstrasse 12',
      postcode: '8706',
      city: 'Meilen',
      kind: 'apartment',
      area: 96,
      rooms: 3.5,
      bathrooms: 1,
      floor: 2,
      hasElevator: true,
      hasPets: false,
      needsExtraEffort: false,
      access: { method: 'customer-present', contactPhone: '+41 79 000 00 02' },
    },
    {
      id: 'prp_3',
      customerId: 'cus_3',
      label: 'Alte Wohnung',
      street: 'Bergstrasse 8',
      postcode: '8712',
      city: 'Stäfa',
      kind: 'apartment',
      area: 72,
      rooms: 2.5,
      bathrooms: 1,
      floor: 3,
      hasElevator: false,
      hasPets: false,
      needsExtraEffort: true,
      access: {
        method: 'key-left',
        keyLocation: 'Beim Nachbarn, Wohnung 3b (Herr Sutter)',
        keyReturnLocation: 'Briefkasten',
        emergencyName: 'Sophie Marchand',
        emergencyPhone: '+41 79 000 00 03',
      },
    },
    {
      id: 'prp_4',
      customerId: 'cus_4',
      label: 'Büro',
      street: 'Seestrasse 101',
      postcode: '8708',
      city: 'Männedorf',
      kind: 'office',
      area: 120,
      rooms: 5,
      bathrooms: 2,
      floor: 1,
      hasElevator: true,
      hasPets: false,
      needsExtraEffort: false,
      access: {
        method: 'other-person',
        personName: 'Rita Amrein',
        personPhone: '+41 79 000 00 04',
        personRelation: 'Empfang',
        alarmCode: '1408',
        emergencyName: 'James Whitfield',
        emergencyPhone: '+41 79 000 00 05',
      },
    },
  ];

  const requests: ServiceRequest[] = [
    {
      id: 'req_1',
      reference: 'A-2481',
      customerId: 'cus_3',
      propertyId: 'prp_3',
      serviceSlug: 'umzugsreinigung',
      addOnIds: ['add_backofen', 'add_schraenke'],
      preferred: { date: iso(days(now, 9)), band: 'morning', flexible: false },
      photoIds: ['pho_1', 'pho_2'],
      customerNote:
        'Übergabe ist am 20., die Verwaltung ist streng. Backofen ist der kritische Punkt.',
      status: 'new',
      outOfArea: false,
      createdAt: iso(new Date(now.getTime() - 1000 * 60 * 60 * 19)),
    },
    {
      id: 'req_2',
      reference: 'A-2482',
      customerId: 'cus_4',
      propertyId: 'prp_4',
      serviceSlug: 'bueroreinigung',
      addOnIds: [],
      preferred: { flexible: true },
      photoIds: [],
      customerNote: 'Weekly would be ideal. Invoice must go to the company address.',
      status: 'new',
      outOfArea: false,
      createdAt: iso(new Date(now.getTime() - 1000 * 60 * 60 * 3)),
      subscriptionIntent: 'premium',
    },
    {
      id: 'req_3',
      reference: 'A-2479',
      customerId: 'cus_2',
      propertyId: 'prp_2',
      serviceSlug: 'grundreinigung',
      addOnIds: ['add_fenster'],
      preferred: { date: iso(days(now, 4)), band: 'afternoon', flexible: false },
      photoIds: [],
      status: 'offerSent',
      outOfArea: false,
      createdAt: iso(days(now, -2)),
      openedAt: iso(days(now, -2)),
      respondedAt: iso(days(now, -2)),
    },
  ];

  const bookings: Booking[] = [
    {
      id: 'bkg_1',
      reference: 'B-1043',
      customerId: 'cus_1',
      propertyId: 'prp_1',
      serviceSlug: 'unterhaltsreinigung',
      subscriptionId: 'sub_1',
      start: iso(at(days(now, 0), 9)),
      duration: 300,
      arrivalWindow: 120,
      assigneeId: 'tm_owner',
      status: 'scheduled',
      photoIds: [],
      history: [{ at: iso(days(now, -14)), kind: 'created', label: 'Abo-Termin geplant' }],
    },
    {
      id: 'bkg_2',
      reference: 'B-1044',
      customerId: 'cus_2',
      propertyId: 'prp_2',
      serviceSlug: 'einmalreinigung',
      start: iso(at(days(now, 1), 8, 30)),
      duration: 180,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'scheduled',
      photoIds: [],
      history: [{ at: iso(days(now, -3)), kind: 'created', label: 'Gebucht' }],
    },
  ];

  const subscriptions: Subscription[] = [
    {
      id: 'sub_1',
      reference: 'S-0012',
      customerId: 'cus_1',
      propertyId: 'prp_1',
      plan: 'premium',
      serviceSlug: 'unterhaltsreinigung',
      startDate: iso(days(now, -60)),
      commitmentEndsAt: iso(days(now, 305)),
      status: 'active',
      skipsUsedThisMonth: 0,
      lastChargedAt: iso(days(now, -8)),
      nextChargeAt: iso(days(now, 22)),
    },
  ];

  const photos: Photo[] = [
    {
      id: 'pho_1',
      src: '/placeholder/kitchen.svg',
      source: 'customer',
      kind: 'context',
      visibleToCustomer: true,
      publishConsent: false,
      note: 'Backofen — hier ist einiges eingebrannt.',
      requestId: 'req_1',
      takenAt: iso(days(now, -1)),
    },
    {
      id: 'pho_2',
      src: '/placeholder/bathroom.svg',
      source: 'customer',
      kind: 'context',
      visibleToCustomer: true,
      publishConsent: false,
      note: 'Bad, Fugen.',
      requestId: 'req_1',
      takenAt: iso(days(now, -1)),
    },
  ];

  // A live quote for req_3 and an expired one, so both states of screen 23 are
  // reachable without first walking through the admin quote builder.
  const offers: Offer[] = [
    makeOffer('off_1', requests[2]!, properties[1]!, now, { issuedDaysAgo: 2, validDays: 14 }),
    makeOffer('off_2', requests[0]!, properties[2]!, now, {
      issuedDaysAgo: 20,
      validDays: 14,
      status: 'expired',
      reference: 'O-2481-1',
    }),
  ];

  // §13.2 — a key held permanently for a subscription customer gets its own
  // record: when it was taken, by whom, and where it is kept.
  const keyLog: KeyLogEntry[] = [
    {
      id: 'key_1',
      propertyId: 'prp_1',
      receivedAt: iso(days(now, -58)),
      receivedBy: 'Marco Brunner',
      storageLocation: 'Schlüsselschrank Büro, Fach 3',
      status: 'held',
    },
  ];

  const invoices: Invoice[] = [
    {
      id: 'inv_draft',
      reference: 'RE-2026-0051',
      customerId: 'cus_1',
      bookingId: 'bkg_1',
      lines: [{ label: 'Unterhaltsreinigung', quantity: 5, unitPrice: 49 }],
      // §10 — generated automatically after the job, then waits for approval.
      status: 'draft',
      issuedAt: iso(days(now, -1)),
      dueAt: iso(days(now, 29)),
      qrReference: '21 00000 00003 13947 14300 09017',
    },
    {
      id: 'inv_paid',
      reference: 'RE-2026-0048',
      customerId: 'cus_2',
      bookingId: 'bkg_2',
      lines: [{ label: 'Einmalreinigung', quantity: 3, unitPrice: 49 }],
      status: 'paid',
      issuedAt: iso(days(now, -26)),
      dueAt: iso(days(now, 4)),
      paidAt: iso(days(now, -19)),
      qrReference: '21 00000 00003 13947 14300 08994',
    },
  ];

  const changeLog: ChangeLogEntry[] = [
    {
      id: 'chg_1',
      at: iso(days(now, -12)),
      actor: 'Marco Brunner',
      entity: 'Einstellungen',
      entityId: 'settings',
      summary: 'Samstagszuschlag von 20% auf 25% erhöht',
    },
    {
      id: 'chg_2',
      at: iso(days(now, -30)),
      actor: 'Marco Brunner',
      entity: 'Leistung',
      entityId: 'svc_grund',
      summary: 'Grundreinigung: Mindestdauer auf 3 Stunden gesetzt',
    },
  ];

  // §11.3 — hours bought as a package, spent against bookings. The expiry is
  // the part customers get caught by, so the seed puts one close to it.
  const credits: PackageCredit[] = [
    {
      id: 'cr_1',
      customerId: 'cus_2',
      propertyId: 'prp_2',
      /*
       * 2.5, not 6.5.
       *
       * The quote list now derives "covered by a package" from the hours left
       * against the hours quoted, and at 6.5 this credit silently covered
       * `off_1` — the 4.5-hour Grundreinigung the whole walkthrough runs on.
       * Screens 27 and 31 hang off that quote's payment step, and a covered
       * quote has no payment step, so both went unreachable. The lower balance
       * is also the more useful story: hours that no longer stretch to a deep
       * clean are what the near-expiry warning on screen 43 is for.
       */
      hoursRemaining: 2.5,
      purchasedAt: iso(days(now, -300)),
      expiresAt: iso(days(now, 65)),
      ledger: [
        { at: iso(days(now, -300)), hours: 10, reason: 'Paket 10 Stunden gekauft' },
        { at: iso(days(now, -120)), hours: -2, reason: 'Einsatz', bookingId: 'bkg_2' },
        { at: iso(days(now, -40)), hours: -1.5, reason: 'Einsatz', bookingId: 'bkg_2' },
        { at: iso(days(now, -12)), hours: -4, reason: 'Einsatz', bookingId: 'bkg_2' },
      ],
    },
  ];

  const messages: CustomerMessage[] = [
    {
      id: 'msg_1',
      customerId: 'cus_2',
      subject: requests[2]!.reference,
      from: 'homivaro',
      body: 'Guten Tag Herr Widmer, vielen Dank für Ihre Anfrage. Die Offerte finden Sie in Ihrem Konto. Bei Fragen erreichen Sie mich direkt.',
      at: iso(days(now, -3)),
      readByCustomer: true,
    },
    {
      id: 'msg_2',
      customerId: 'cus_2',
      subject: requests[2]!.reference,
      from: 'customer',
      body: 'Danke — passt der Termin auch eine Stunde später?',
      at: iso(days(now, -2)),
      readByCustomer: true,
    },
    {
      id: 'msg_3',
      customerId: 'cus_2',
      subject: requests[2]!.reference,
      from: 'homivaro',
      body: 'Ja, das geht. Ich habe den Termin auf 09:00 verschoben und die Bestätigung angepasst.',
      at: iso(days(now, -2)),
      readByCustomer: false,
    },
  ];

  /*
   * A workable queue, in every scenario that is not launch day.
   *
   * The four hand-written requests above stage the walkthrough — a new one to
   * quote, a quote already out. That was enough while screen 52 was a list
   * sorted by arrival, and stopped being enough the moment it became a queue:
   * with three rows and nothing overdue, the deadline column, the overdue-first
   * sort, the overdue filter, the draft badge and half the status filter had
   * nothing to act on in *any* scenario except `states`.
   *
   * Ten rows across nine statuses, using the shared households so the queue is
   * not the same three names repeating. `fresh` is built from EMPTY and never
   * reaches this — its empty list is the deliverable.
   */
  const queue: ServiceRequest[] = [
    queueRequest(now, { id: 'req_q_draft', ref: 'A-2490', n: 3, service: 'einmalreinigung', status: 'draft', agedHours: 30, note: undefined, internal: 'Angerufen, Fläche noch unklar. Rückruf abgemacht.' }),
    queueRequest(now, { id: 'req_q_new1', ref: 'A-2491', n: 1, service: 'unterhaltsreinigung', status: 'new', agedHours: 5, intent: 'basic' }),
    queueRequest(now, { id: 'req_q_new2', ref: 'A-2492', n: 8, service: 'fensterreinigung', status: 'new', agedHours: 20, preferredInDays: 9 }),
    /* One day past the promise — the row the red deadline state exists for. */
    queueRequest(now, { id: 'req_q_late', ref: 'A-2493', n: 6, service: 'grundreinigung', status: 'inReview', agedHours: 52 }),
    queueRequest(now, { id: 'req_q_offer', ref: 'A-2494', n: 5, service: 'umzugsreinigung', status: 'offerSent', agedDays: 3, preferredInDays: 12 }),
    queueRequest(now, { id: 'req_q_revision', ref: 'A-2495', n: 2, service: 'grundreinigung', status: 'revisionRequested', agedDays: 5, note: 'Können Sie die Fenster rausrechnen?' }),
    queueRequest(now, { id: 'req_q_accepted', ref: 'A-2496', n: 9, service: 'einmalreinigung', status: 'accepted', agedDays: 12 }),
    queueRequest(now, { id: 'req_q_rejected', ref: 'A-2497', n: 12, service: 'einmalreinigung', status: 'rejected', agedDays: 8, internal: 'Abgelehnt: ausserhalb Gebiet, Anfahrt trägt sich nicht.' }),
    queueRequest(now, { id: 'req_q_expired', ref: 'A-2498', n: 10, service: 'fensterreinigung', status: 'expired', agedDays: 38 }),
    queueRequest(now, { id: 'req_q_cancel', ref: 'A-2499', n: 4, service: 'bueroreinigung', status: 'cancelledByCustomer', agedDays: 6, internal: 'Zurückgezogen: intern gelöst.' }),
  ];

  /*
   * The quote states, staged.
   *
   * Screen 57 gained four derived columns — service and rhythm, coverage,
   * payment, and the job the quote became — and the seed answered "—" in all
   * four for every row: `payments` was an empty array in every scenario, no
   * booking anywhere carried an `offerId`, and no request carried an intent
   * past the queue. The columns were real and the data was not, which is the
   * one failure mode a prototype cannot afford — it reads as a working screen
   * with nothing to show.
   *
   * Seven quotes, each staging exactly one thing the owner's list has to be
   * able to say, hung off the shared households so the list is not the same
   * three names repeating.
   */
  const quoteRequests: ServiceRequest[] = [
    queueRequest(now, { id: 'req_q_propose', ref: 'A-2501', n: 8, service: 'fensterreinigung', status: 'offerSent', agedDays: 2, note: 'Erstauftrag — Storenkasten bitte mitnehmen.' }),
    queueRequest(now, { id: 'req_q_confirm', ref: 'A-2502', n: 7, service: 'bueroreinigung', status: 'offerSent', agedDays: 4 }),
    queueRequest(now, { id: 'req_q_recurring', ref: 'A-2503', n: 6, service: 'unterhaltsreinigung', status: 'offerSent', agedDays: 3, intent: 'premium' }),
    queueRequest(now, { id: 'req_q_refund', ref: 'A-2504', n: 11, service: 'bueroreinigung', status: 'accepted', agedDays: 16, internal: 'Termin abgesagt, Betrag zurückerstattet.' }),
    /* cus_2 rather than a household: the package that covers it is theirs. */
    {
      id: 'req_q_pkg',
      reference: 'A-2505',
      customerId: 'cus_2',
      propertyId: 'prp_2',
      serviceSlug: 'fensterreinigung',
      addOnIds: [],
      windowCount: 8,
      preferred: { flexible: true },
      photoIds: [],
      customerNote: 'Die Fenster zur Seeseite, wenn möglich vor dem Wochenende.',
      status: 'offerSent',
      outOfArea: false,
      createdAt: iso(days(now, -2)),
      openedAt: iso(days(now, -2)),
      respondedAt: iso(days(now, -1)),
    },
  ];

  const allProperties = [...properties, ...extraProperties()];
  const quoteFor = (
    id: string,
    requestId: string,
    opts: Parameters<typeof makeOffer>[4],
  ) => {
    const request = quoteRequests.concat(queue).find((r) => r.id === requestId)!;
    return makeOffer(id, request, allProperties.find((p) => p.id === request.propertyId)!, now, opts);
  };

  const quoteOffers: Offer[] = [
    /* Paid, and the job exists — the only place in the seed where the quote →
       booking link is actually populated. */
    {
      ...quoteFor('off_paid', 'req_q_accepted', {
        issuedDaysAgo: 11,
        validDays: 14,
        status: 'accepted',
      }),
      signedAt: iso(days(now, -10)),
    },
    /* §20.2 — a declined card does not book the slot and does not void the
       quote. The row that proves the payment column shows failures. */
    {
      ...quoteFor('off_retry', 'req_q_offer', { issuedDaysAgo: 3, validDays: 14 }),
      signedAt: iso(days(now, -1)),
    },
    /* First job, three dates in, waiting on the office. The row the "Termin
       bestätigen" panel exists for. */
    {
      ...quoteFor('off_propose', 'req_q_propose', { issuedDaysAgo: 2, validDays: 14 }),
      proposedSlots: [
        iso(at(openDay(now, 4), 9)),
        iso(at(openDay(now, 6), 13)),
        iso(at(openDay(now, 9), 8)),
      ],
    },
    /* Same flow one step on: the office answered, the slot is held for 48
       hours, and the customer has not signed yet. */
    {
      ...quoteFor('off_confirm', 'req_q_confirm', { issuedDaysAgo: 4, validDays: 14 }),
      proposedSlots: [iso(at(openDay(now, 3), 7, 30)), iso(at(openDay(now, 5), 16))],
      confirmedSlot: iso(at(openDay(now, 3), 7, 30)),
      slotConfirmedAt: iso(days(now, -1)),
    },
    /* Recurring. Without an intent anywhere past the queue the rhythm column
       read "Einmalig" on every single row. */
    quoteFor('off_recurring', 'req_q_recurring', { issuedDaysAgo: 3, validDays: 14 }),
    /* Paid, then refunded — the fourth PaymentStatus, and the only one with no
       other way into the UI. */
    {
      ...quoteFor('off_refund', 'req_q_refund', {
        issuedDaysAgo: 15,
        validDays: 14,
        status: 'accepted',
      }),
      signedAt: iso(days(now, -14)),
    },
    /* Covered by the package: two billable hours against 2.5 remaining. There
       is nothing to charge, and the payment step says so instead of asking for
       a card. */
    quoteFor('off_pkg', 'req_q_pkg', { issuedDaysAgo: 1, validDays: 14 }),
  ];

  const quoteBookings: Booking[] = [
    {
      id: 'bkg_off_paid',
      reference: 'B-1046',
      offerId: 'off_paid',
      customerId: 'cus_m9',
      propertyId: 'prp_m9',
      serviceSlug: 'einmalreinigung',
      start: iso(at(days(now, 4), 9)),
      duration: 180,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'scheduled',
      photoIds: [],
      history: [{ at: iso(days(now, -10)), kind: 'created', label: 'Gebucht und bezahlt' }],
    },
    {
      id: 'bkg_off_refund',
      reference: 'B-1047',
      offerId: 'off_refund',
      customerId: 'cus_m11',
      propertyId: 'prp_m11',
      serviceSlug: 'bueroreinigung',
      start: iso(at(days(now, -2), 18)),
      duration: 240,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'cancelled',
      photoIds: [],
      history: [
        { at: iso(days(now, -14)), kind: 'created', label: 'Gebucht und bezahlt' },
        { at: iso(days(now, -4)), kind: 'cancelled', label: 'Vom Kunden abgesagt' },
        { at: iso(days(now, -4)), kind: 'refunded', label: 'Betrag vollständig zurückerstattet' },
      ],
    },
  ];

  /*
   * All four PaymentStatus values.
   *
   * `payments` was `[]` in every scenario including `states`, whose whole
   * purpose is that every declared state has a record carrying it. Nothing
   * rendered payments, so nobody noticed — the quote list is the first screen
   * that does.
   */
  const payments: Payment[] = [
    {
      id: 'pay_paid',
      offerId: 'off_paid',
      amount: offerTotal(quoteOffers[0]!),
      method: 'twint',
      at: iso(days(now, -10)),
      status: 'succeeded',
      gatewayRef: 'mock_TW71A',
    },
    {
      id: 'pay_failed',
      offerId: 'off_retry',
      amount: offerTotal(quoteOffers[1]!),
      method: 'card',
      at: iso(days(now, -1)),
      status: 'failed',
      gatewayRef: 'mock_CD40F',
      failureReason: 'card_declined',
    },
    /* TWINT opened on the phone and never finished — the state the owner needs
       to recognise before chasing someone who has already tried to pay. */
    {
      id: 'pay_pending',
      offerId: 'off_confirm',
      amount: offerTotal(quoteOffers[3]!),
      method: 'twint',
      at: iso(new Date(now.getTime() - 40 * 60_000)),
      status: 'pending',
      gatewayRef: 'mock_TW9C2',
    },
    {
      id: 'pay_refund_in',
      offerId: 'off_refund',
      amount: offerTotal(quoteOffers[5]!),
      method: 'card',
      at: iso(days(now, -14)),
      status: 'succeeded',
      gatewayRef: 'mock_CD118',
    },
    {
      id: 'pay_refund_out',
      offerId: 'off_refund',
      amount: offerTotal(quoteOffers[5]!),
      method: 'card',
      at: iso(days(now, -4)),
      status: 'refunded',
      gatewayRef: 'mock_CD118R',
    },
  ];

  return {
    ...EMPTY,
    customers: [...customers, ...extraCustomers(now)],
    properties: [...properties, ...extraProperties()],
    requests: [...queue, ...quoteRequests, ...requests],
    offers: [...offers, ...quoteOffers],
    bookings: [...bookings, ...quoteBookings],
    payments,
    subscriptions,
    invoices,
    /* Screen 45 used to fake these in component state. cus_2 is the demo
       account, so it carries the card the plan charges plus a TWINT for
       one-off jobs — which is exactly the pair the screen's TWINT-blocked
       explanation needs in order to make sense. */
    paymentMethods: [
      {
        id: 'pm_card_2',
        customerId: 'cus_2',
        kind: 'card' as const,
        label: 'Visa · 4242',
        isDefault: true,
        addedAt: iso(days(now, -120)),
      },
      {
        id: 'pm_twint_2',
        customerId: 'cus_2',
        kind: 'twint' as const,
        label: 'TWINT · 079 ··· 66',
        isDefault: false,
        addedAt: iso(days(now, -60)),
      },
    ],
    keyLog,
    credits,
    messages,
    changeLog,
    photos,
    team: [owner(now)],
  };
}

function makeOffer(
  id: string,
  request: ServiceRequest,
  property: Property,
  now: Date,
  opts: {
    issuedDaysAgo: number;
    validDays: number;
    status?: Offer['status'];
    reference?: string;
  },
): Offer {
  const service = SEED_SERVICES.find((s) => s.slug === request.serviceSlug)!;
  const { lines, estimatedHours } = buildOfferLines({
    request,
    property,
    service,
    addOns: SEED_ADDONS,
    settings: SEED_SETTINGS,
  });

  const issuedAt = days(now, -opts.issuedDaysAgo);

  return {
    id,
    reference: opts.reference ?? `O-${request.reference.replace('A-', '')}-1`,
    requestId: request.id,
    version: 1,
    lines,
    message:
      'Guten Tag\n\nvielen Dank für Ihre Anfrage. Nachfolgend finden Sie unsere Offerte, Position für Position aufgeschlüsselt. Der Betrag ist verbindlich; Zuschläge und Anfahrt sind – falls zutreffend – separat ausgewiesen.\n\nWählen Sie einen freien Termin, und wir bestätigen ihn sofort.\n\nFreundliche Grüsse\nMarco Brunner',
    status: opts.status ?? 'sent',
    issuedAt: iso(issuedAt),
    expiresAt: iso(days(issuedAt, opts.validDays)),
    estimatedHours,
  };
}

/* ------------------------------------------------------------- variations */

function withClosure(data: DataSet, now: Date): DataSet {
  // §14 — the owner is away. Subscription visits inside the window move to the
  // next free slot and the customer is told, with a skip offered instead.
  return {
    ...data,
    closures: [
      {
        id: 'clo_1',
        start: iso(days(now, 2)),
        end: iso(days(now, 12)),
        reason: 'Betriebsferien',
        recurringYearly: false,
      },
    ],
  };
}

function withHiring(data: DataSet, now: Date): DataSet {
  const postings: JobPosting[] = [
    {
      id: 'job_1',
      slug: 'reinigungskraft-teilzeit',
      title: {
        de: 'Reinigungskraft 40–60% (m/w/d)',
        en: 'Cleaner 40–60%',
        fr: 'Reinigungskraft 40–60% (m/w/d)',
        it: 'Reinigungskraft 40–60% (m/w/d)',
      },
      kind: 'part-time',
      workload: [40, 60],
      regions: ['8700', '8706', '8707', '8708', '8712'],
      summary: {
        de: 'Sie reinigen Privathaushalte am rechten Zürichseeufer — feste Kundschaft, planbare Einsätze, Fahrzeug von Vorteil.',
        en: 'You clean private homes on the right shore of Lake Zurich — regular clients, predictable shifts, a car helps.',
        fr: 'Sie reinigen Privathaushalte am rechten Zürichseeufer.',
        it: 'Sie reinigen Privathaushalte am rechten Zürichseeufer.',
      },
      responsibilities: {
        de: [
          'Unterhalts- und Grundreinigungen in Privathaushalten',
          'Arbeiten nach Checkliste, Fotos vor und nach dem Einsatz',
          'Ein- und Auschecken über das Mobiltelefon',
          'Schlüssel und Zutrittscodes vertraulich behandeln',
        ],
        en: [
          'Regular and deep cleaning in private homes',
          'Working to a checklist, photos before and after',
          'Checking in and out from your phone',
          'Handling keys and access codes confidentially',
        ],
        fr: [],
        it: [],
      },
      requirements: {
        de: [
          'Gültige Arbeitsbewilligung für die Schweiz',
          'Deutsch für die Verständigung mit der Kundschaft',
          'Mindestens zwei Jahre Reinigungserfahrung',
          'Zuverlässigkeit — die Kundschaft ist oft nicht zuhause',
        ],
        en: [
          'A valid Swiss work permit',
          'German good enough to talk with clients',
          'At least two years of cleaning experience',
          'Reliability — clients are often not at home',
        ],
        fr: [],
        it: [],
      },
      offer: {
        de: [
          'Feste Einsätze in einem engen Gebiet — keine langen Fahrten',
          'Material und Ausrüstung werden gestellt',
          'Planbare Zeiten, kein Einsatz an Sonntagen',
          'Einarbeitung durch die Geschäftsleitung persönlich',
        ],
        en: [
          'Regular jobs in a compact area — no long drives',
          'Materials and equipment provided',
          'Predictable hours, never on Sundays',
          'Personal onboarding by the owner',
        ],
        fr: [],
        it: [],
      },
      published: true,
      createdAt: iso(days(now, -18)),
    },
    {
      id: 'job_2',
      slug: 'moebelmonteur-aushilfe',
      title: {
        de: 'Möbelmonteur:in auf Abruf',
        en: 'Furniture assembler, on call',
        fr: 'Möbelmonteur:in auf Abruf',
        it: 'Möbelmonteur:in auf Abruf',
      },
      kind: 'freelance',
      workload: [10, 30],
      regions: ['8700', '8706', '8708', '8712', '8132'],
      summary: {
        de: 'Sie montieren Möbel bei Privatkundschaft — einzelne Einsätze, nach Absprache, mit eigenem Werkzeug.',
        en: 'You assemble furniture for private clients — single jobs, by arrangement, with your own tools.',
        fr: 'Sie montieren Möbel bei Privatkundschaft.',
        it: 'Sie montieren Möbel bei Privatkundschaft.',
      },
      responsibilities: {
        de: [
          'Montage von Schränken, Betten, Küchen- und Büromöbeln',
          'Verpackungsmaterial mitnehmen und entsorgen',
          'Abnahme mit der Kundschaft vor Ort',
        ],
        en: [
          'Assembling wardrobes, beds, kitchen and office furniture',
          'Taking the packaging away and disposing of it',
          'Signing off with the client on site',
        ],
        fr: [],
        it: [],
      },
      requirements: {
        de: [
          'Gültige Arbeitsbewilligung für die Schweiz',
          'Eigenes Werkzeug und Fahrzeug',
          'Erfahrung mit gängigen Möbelsystemen',
        ],
        en: [
          'A valid Swiss work permit',
          'Your own tools and a vehicle',
          'Experience with common furniture systems',
        ],
        fr: [],
        it: [],
      },
      offer: {
        de: ['Einsätze nach Absprache', 'Abrechnung pro Einsatz', 'Kein Verkaufsdruck'],
        en: ['Jobs by arrangement', 'Paid per job', 'No sales targets'],
        fr: [],
        it: [],
      },
      published: true,
      createdAt: iso(days(now, -6)),
    },
  ];

  const applications: Application[] = [
    {
      id: 'app_1',
      reference: 'BW-0031',
      postingId: 'job_1',
      spontaneous: false,
      firstName: 'Elena',
      lastName: 'Ferreira',
      email: 'elena.ferreira@example.ch',
      phone: '+41 78 000 00 11',
      postcode: '8706',
      city: 'Meilen',
      permit: 'c',
      languages: { de: 'fluent', en: 'conversational', it: 'native' },
      hasDrivingLicence: true,
      hasCar: true,
      yearsExperience: 6,
      experienceAreas: ['cleaning'],
      availability: { days: [1, 2, 3, 4, 5], earliest: '07:00', latest: '16:00' },
      references: [{ name: 'Frau Hunziker', company: 'Privat', phone: '+41 79 000 00 12' }],
      documents: [{ id: 'doc_1', name: 'Lebenslauf_Ferreira.pdf', kind: 'cv', sizeKb: 240 }],
      status: 'new',
      submittedAt: iso(days(now, -2)),
      retainUntil: iso(days(now, 178)),
      consentGivenAt: iso(days(now, -2)),
    },
    {
      id: 'app_2',
      reference: 'BW-0030',
      spontaneous: true,
      firstName: 'Dritan',
      lastName: 'Krasniqi',
      email: 'd.krasniqi@example.ch',
      phone: '+41 78 000 00 13',
      postcode: '8712',
      city: 'Stäfa',
      permit: 'b',
      languages: { de: 'conversational', en: 'basic' },
      hasDrivingLicence: true,
      hasCar: false,
      yearsExperience: 3,
      experienceAreas: ['cleaning', 'assembly'],
      availability: { days: [1, 2, 3, 4, 5, 6], earliest: '07:00', latest: '18:00' },
      references: [],
      documents: [{ id: 'doc_2', name: 'CV.pdf', kind: 'cv', sizeKb: 180 }],
      status: 'inReview',
      submittedAt: iso(days(now, -9)),
      retainUntil: iso(days(now, 171)),
      consentGivenAt: iso(days(now, -9)),
      internalNotes: 'Telefonat 12.: kann ab sofort, sucht 60–80%.',
    },
    {
      // The one that closes the loop: accepted, converted, and now the
      // contractor whose day the field interface shows.
      id: 'app_3',
      reference: 'BW-0026',
      postingId: 'job_1',
      spontaneous: false,
      firstName: 'Marta',
      lastName: 'Nowak',
      email: 'marta.nowak@example.ch',
      phone: '+41 78 000 00 14',
      postcode: '8708',
      city: 'Männedorf',
      permit: 'c',
      languages: { de: 'fluent', en: 'basic' },
      hasDrivingLicence: true,
      hasCar: true,
      yearsExperience: 9,
      experienceAreas: ['cleaning'],
      availability: { days: [1, 2, 3, 4, 5], earliest: '07:00', latest: '17:00' },
      startFrom: iso(days(now, -40)),
      references: [
        { name: 'Herr Bühler', company: 'Hauswartung Bühler', phone: '+41 79 000 00 15' },
      ],
      documents: [
        { id: 'doc_3', name: 'Lebenslauf_Nowak.pdf', kind: 'cv', sizeKb: 310 },
        { id: 'doc_4', name: 'Arbeitszeugnis_2024.pdf', kind: 'certificate', sizeKb: 520 },
      ],
      status: 'accepted',
      submittedAt: iso(days(now, -62)),
      retainUntil: iso(days(now, 118)),
      consentGivenAt: iso(days(now, -62)),
      convertedTeamMemberId: 'tm_marta',
    },
    {
      id: 'app_4',
      reference: 'BW-0029',
      postingId: 'job_2',
      spontaneous: false,
      firstName: 'Luca',
      lastName: 'Bianchi',
      email: 'l.bianchi@example.ch',
      phone: '+41 78 000 00 16',
      postcode: '8712',
      city: 'Stäfa',
      permit: 'ch',
      languages: { de: 'native', en: 'conversational', it: 'fluent' },
      hasDrivingLicence: true,
      hasCar: true,
      yearsExperience: 4,
      experienceAreas: ['assembly'],
      availability: { days: [4, 5, 6], earliest: '08:00', latest: '18:00' },
      references: [],
      documents: [{ id: 'doc_5', name: 'CV_Bianchi.pdf', kind: 'cv', sizeKb: 205 }],
      motivation:
        'Ich montiere seit vier Jahren nebenberuflich und suche regelmässige Einsätze in der Region.',
      status: 'new',
      submittedAt: iso(days(now, -1)),
      retainUntil: iso(days(now, 179)),
      consentGivenAt: iso(days(now, -1)),
    },
    {
      // No permit. §20 makes this a hard stop, not a judgement call — the
      // rejection reason list has an entry for exactly this.
      id: 'app_5',
      reference: 'BW-0028',
      postingId: 'job_1',
      spontaneous: false,
      firstName: 'Amara',
      lastName: 'Diallo',
      email: 'a.diallo@example.com',
      phone: '+41 78 000 00 17',
      postcode: '8006',
      city: 'Zürich',
      permit: 'none',
      languages: { de: 'basic', en: 'fluent', fr: 'native' },
      hasDrivingLicence: false,
      hasCar: false,
      yearsExperience: 2,
      experienceAreas: ['cleaning'],
      availability: { days: [1, 2, 3, 4, 5], earliest: '09:00', latest: '17:00' },
      references: [],
      documents: [],
      status: 'rejected',
      rejectionReason: 'permit',
      submittedAt: iso(days(now, -21)),
      retainUntil: iso(days(now, 159)),
      consentGivenAt: iso(days(now, -21)),
    },
    {
      id: 'app_6',
      reference: 'BW-0027',
      spontaneous: true,
      firstName: 'Sandra',
      lastName: 'Item',
      email: 'sandra.item@example.ch',
      phone: '+41 78 000 00 18',
      postcode: '8132',
      city: 'Egg',
      permit: 'ch',
      languages: { de: 'native', en: 'conversational' },
      hasDrivingLicence: true,
      hasCar: true,
      yearsExperience: 0,
      experienceAreas: [],
      availability: { days: [2, 3, 4], earliest: '08:30', latest: '15:00' },
      references: [],
      documents: [{ id: 'doc_6', name: 'Bewerbung_Item.pdf', kind: 'other', sizeKb: 96 }],
      motivation: 'Ich suche einen Wiedereinstieg und arbeite gerne selbstständig.',
      status: 'rejected',
      rejectionReason: 'experience',
      submittedAt: iso(days(now, -34)),
      retainUntil: iso(days(now, 146)),
      consentGivenAt: iso(days(now, -34)),
    },
    {
      // Retention expires in nine days — the list flags it, and §21 requires
      // it to be gone rather than quietly kept.
      id: 'app_7',
      reference: 'BW-0019',
      spontaneous: true,
      firstName: 'Peter',
      lastName: 'Schwarz',
      email: 'p.schwarz@example.ch',
      phone: '+41 78 000 00 19',
      postcode: '8634',
      city: 'Hombrechtikon',
      permit: 'ch',
      languages: { de: 'native' },
      hasDrivingLicence: true,
      hasCar: true,
      yearsExperience: 12,
      experienceAreas: ['cleaning', 'assembly'],
      availability: { days: [1, 3, 5], earliest: '07:00', latest: '12:00' },
      references: [],
      documents: [],
      status: 'rejected',
      rejectionReason: 'availability',
      submittedAt: iso(days(now, -171)),
      retainUntil: iso(days(now, 9)),
      consentGivenAt: iso(days(now, -171)),
    },
  ];

  const marta: TeamMember = {
    id: 'tm_marta',
    firstName: 'Marta',
    lastName: 'Nowak',
    email: 'marta.nowak@homivaro.ch',
    phone: '+41 78 000 00 14',
    role: 'contractor',
    active: true,
    regions: ['8700', '8706', '8707', '8708', '8712'],
    skills: ['unterhaltsreinigung', 'einmalreinigung', 'grundreinigung'],
    startedAt: iso(days(now, -40)),
    fromApplicationId: 'app_3',
  };

  // The point of this scenario is the whole arc: applied → accepted → working.
  // Without reassigning the day, "switch to the contractor" would show an
  // empty field screen and the last third of that arc would be untestable.
  const bookings = data.bookings.map((b) => ({ ...b, assigneeId: 'tm_marta' }));

  return {
    ...data,
    postings,
    applications,
    bookings,
    team: [...data.team, marta],
  };
}

/* ------------------------------------------------- the state matrix ------ */

/**
 * The ten request statuses, in lifecycle order.
 *
 * Order matters for reading the queue: the list is generated status-major, so
 * a reviewer scrolling the unfiltered table walks the lifecycle rather than
 * meeting it shuffled.
 */
const MATRIX_STATUSES: RequestStatus[] = [
  'draft',
  'new',
  'inReview',
  'offerSent',
  'revisionRequested',
  'accepted',
  'rejected',
  'expired',
  'cancelledByCustomer',
  'cancelledByCompany',
];

/**
 * Ages in hours for the two statuses that still owe an answer.
 *
 * Explicit rather than computed, because the spread is the point: the queue
 * sorts by lateness and the deadline column has three visual states, and all
 * of them have to be on screen at once. `responseTimeHours` is 24 and
 * `overdueDays` counts *whole* days past the deadline, so an age of 50h is one
 * full day late, not two.
 *
 * One entry per service, so each list is seven long.
 */
const OPEN_AGES: Record<'new' | 'inReview', number[]> = {
  //     inside  inside  due today  1d    2d    3d     6d
  new: [4, 12, 20, 50, 76, 100, 172],
  //     inside  inside  due today  1d    2d    4d     8d
  inReview: [6, 16, 22, 54, 84, 130, 220],
};

/** Age in days for the statuses that are already settled, one per service. */
const SETTLED_AGES: Partial<Record<RequestStatus, number[]>> = {
  draft: [1, 2, 2, 3, 4, 5, 7],
  offerSent: [2, 3, 3, 4, 5, 6, 8],
  revisionRequested: [4, 5, 6, 6, 7, 8, 9],
  accepted: [10, 12, 14, 15, 17, 19, 22],
  rejected: [7, 8, 9, 11, 12, 13, 14],
  expired: [35, 38, 40, 42, 45, 48, 52],
  cancelledByCustomer: [5, 6, 7, 9, 10, 11, 12],
  cancelledByCompany: [6, 7, 8, 10, 12, 14, 15],
};

/** Statuses whose very name says a quote reached the customer. */
const IMPLIES_SENT_OFFER: RequestStatus[] = [
  'offerSent',
  'revisionRequested',
  'accepted',
  'rejected',
  'expired',
];

/** The offer state each request status implies. */
const OFFER_FOR: Partial<Record<RequestStatus, Offer['status']>> = {
  offerSent: 'sent',
  revisionRequested: 'revisionRequested',
  accepted: 'accepted',
  /* A declined request means the customer said no to the quote — §9 has no
     other way to reach `rejected` from `offerSent`. */
  rejected: 'rejected',
  expired: 'expired',
  /* `cancelRequest` closes any live quote as rejected. So a cancelled request
     that had one shows it rejected, which is what the store would have done. */
  cancelledByCustomer: 'rejected',
  cancelledByCompany: 'rejected',
};

/** Per-service notes, so seventy rows do not all read identically. */
const SERVICE_NOTES: Record<ServiceSlug, string> = {
  unterhaltsreinigung: 'Alle zwei Wochen wäre ideal, am liebsten vormittags.',
  einmalreinigung: 'Einmal richtig durch, danach schauen wir weiter.',
  grundreinigung: 'Ist lange nicht gemacht worden — Küche und Bad sind das Thema.',
  umzugsreinigung: 'Übergabe steht an, die Verwaltung nimmt es genau.',
  fensterreinigung: 'Sprossenfenster, teilweise schwer erreichbar.',
  bueroreinigung: 'Nach Büroschluss, ab 18 Uhr. Rechnung an die Firma.',
  moebelmontage: 'Neue Möbel geliefert, Aufbau fehlt noch.',
};

/**
 * Every state in the model, carried by a real record — and every combination
 * of service and request status.
 *
 * Built on top of `withHiring(baseData(…))` rather than from scratch: the
 * applications track already stages all four `ApplicationStatus` values, and
 * duplicating them here would give two sources for the same thing.
 *
 * The seventy requests are generated rather than typed out. Seven services
 * times ten statuses is a table, and a table written by hand acquires holes:
 * the reviewer filters to `accepted` + `Fensterreinigung`, gets an empty
 * screen, and cannot tell a missing fixture from a broken filter. Generating
 * it means the matrix is complete by construction, and the accompanying test
 * reads the unions out of `schema.ts` so a status added later fails the build
 * until data carries it.
 *
 * What is *not* generated is the lifecycle attached to each row: an offer only
 * exists where the status says one was sent, a booking only where the quote
 * was accepted. Inventing more than the status claims would make the data
 * pretty and the screens wrong.
 */
/**
 * Twelve households across the eight served municipalities, plus one in the
 * city.
 *
 * Module scope, because more than one scenario draws on them now: `states`
 * needs all twelve for the matrix, and `busy`, `overdue` and `away` need a
 * slice so their queues stop being the same three names repeating. One source
 * for the person and their property, so the two can never disagree about which
 * town somebody lives in.
 */
const EXTRA_PEOPLE: {
  n: number;
  first: string;
  last: string;
  lang: Locale;
  phone: string;
  since: number;
  street: string;
  postcode: string;
  city: string;
  kind: PropertyKind;
  area: number;
  rooms: number;
  baths: number;
  floor: number;
  lift: boolean;
  pets?: boolean;
  effort?: boolean;
}[] = [
    { n: 1, first: 'Beatrice', last: 'Ammann', lang: 'de', phone: '+41 79 221 64 08', since: 150, street: 'Alte Landstrasse 62', postcode: '8700', city: 'Küsnacht', kind: 'house', area: 205, rooms: 7.5, baths: 3, floor: 0, lift: false, pets: true },
    { n: 2, first: 'Daniel', last: 'Schoch', lang: 'de', phone: '+41 78 445 19 73', since: 132, street: 'Kirchgasse 9', postcode: '8706', city: 'Meilen', kind: 'apartment', area: 104, rooms: 4.5, baths: 2, floor: 3, lift: true },
    { n: 3, first: 'Nadia', last: 'Vogt', lang: 'de', phone: '+41 76 512 88 40', since: 118, street: 'Bergstrasse 21', postcode: '8707', city: 'Uetikon am See', kind: 'apartment', area: 88, rooms: 3.5, baths: 1, floor: 1, lift: false },
    { n: 4, first: 'Roland', last: 'Zuberbühler', lang: 'de', phone: '+41 44 790 33 15', since: 96, street: 'Bahnhofstrasse 3', postcode: '8708', city: 'Männedorf', kind: 'office', area: 165, rooms: 6, baths: 2, floor: 2, lift: true },
    { n: 5, first: 'Claudia', last: 'Meier', lang: 'de', phone: '+41 79 634 07 52', since: 84, street: 'Seestrasse 88', postcode: '8712', city: 'Stäfa', kind: 'house', area: 158, rooms: 6.5, baths: 2, floor: 0, lift: false },
    { n: 6, first: 'Marco', last: 'Steiner', lang: 'de', phone: '+41 78 902 41 66', since: 71, street: 'Forchstrasse 14', postcode: '8132', city: 'Egg', kind: 'house', area: 172, rooms: 5.5, baths: 2, floor: 0, lift: false, effort: true },
    { n: 7, first: 'Simone', last: 'Bachmann', lang: 'de', phone: '+41 44 935 27 91', since: 63, street: 'Städtlistrasse 6', postcode: '8627', city: 'Grüningen', kind: 'office', area: 120, rooms: 5, baths: 2, floor: 1, lift: false },
    { n: 8, first: 'Yannick', last: 'Roth', lang: 'de', phone: '+41 79 483 12 29', since: 55, street: 'Feldbachstrasse 30', postcode: '8634', city: 'Hombrechtikon', kind: 'apartment', area: 92, rooms: 3.5, baths: 1, floor: 2, lift: true, pets: true },
    { n: 9, first: 'Élodie', last: 'Perret', lang: 'fr', phone: '+41 78 116 95 37', since: 47, street: 'Wiesenstrasse 11', postcode: '8700', city: 'Küsnacht', kind: 'apartment', area: 78, rooms: 3, baths: 1, floor: 4, lift: true },
    { n: 10, first: 'Giulia', last: 'Ferrari', lang: 'it', phone: '+41 76 350 78 14', since: 39, street: 'Rebbergweg 5', postcode: '8706', city: 'Meilen', kind: 'apartment', area: 96, rooms: 3.5, baths: 1, floor: 1, lift: false },
    { n: 11, first: 'Oliver', last: 'Hartmann', lang: 'en', phone: '+41 79 708 26 83', since: 28, street: 'Lindenhof 4', postcode: '8712', city: 'Stäfa', kind: 'office', area: 140, rooms: 5, baths: 2, floor: 0, lift: false },
    /* Outside the eight municipalities. §20.1 lets the request through and
       flags it — the list has a chip for exactly this, and it needs a row. */
  { n: 12, first: 'Sandra', last: 'Kunz', lang: 'de', phone: '+41 44 261 55 09', since: 21, street: 'Militärstrasse 76', postcode: '8004', city: 'Zürich', kind: 'apartment', area: 64, rooms: 2.5, baths: 1, floor: 3, lift: false, effort: true },
];

const extraCustomers = (now: Date): Customer[] =>
  EXTRA_PEOPLE.map((p) => person(`cus_m${p.n}`, p.first, p.last, p.lang, now, p.since, p.phone));

const extraProperties = (): Property[] =>
  EXTRA_PEOPLE.map((p) => ({
    id: `prp_m${p.n}`,
    customerId: `cus_m${p.n}`,
    label: p.kind === 'office' ? 'Büro' : p.kind === 'house' ? 'Haus' : 'Wohnung',
    street: p.street,
    postcode: p.postcode,
    city: p.city,
    kind: p.kind,
    area: p.area,
    rooms: p.rooms,
    bathrooms: p.baths,
    floor: p.floor,
    hasElevator: p.lift,
    hasPets: p.pets ?? false,
    needsExtraEffort: p.effort ?? false,
    /* Access rotates through all four methods so the field screens and the
       masked-code rule have every variant to work against. */
    access:
      p.n % 4 === 1
        ? {
            method: 'key-box',
            boxLocation: 'Neben der Haustür',
            boxCode: `${4000 + p.n * 7}`,
            keyReturnLocation: 'Zurück in den Kasten',
          }
        : p.n % 4 === 2
          ? { method: 'customer-present', contactPhone: p.phone }
          : p.n % 4 === 3
            ? {
                method: 'key-left',
                keyLocation: 'Beim Nachbarn im Erdgeschoss',
                keyReturnLocation: 'Briefkasten',
              }
            : {
                method: 'other-person',
                personName: 'Empfang',
                personPhone: p.phone,
                personRelation: p.kind === 'office' ? 'Empfang' : 'Nachbarin',
                alarmCode: `${1200 + p.n * 3}`,
              },
  }));

/* Offices only for office cleaning, homes for everything else — routing a
   Umzugsreinigung to a reception desk would price and schedule fine and read
   as nonsense. */
const OFFICE_IDS = EXTRA_PEOPLE.filter((p) => p.kind === 'office').map((p) => p.n);
const HOME_IDS = EXTRA_PEOPLE.filter((p) => p.kind !== 'office').map((p) => p.n);

/**
 * A request, compactly.
 *
 * The per-scenario queues below would otherwise be four hundred lines of
 * near-identical object literals, which is how a fixture set stops being
 * reviewable. Ages are given the way the screen reads them: `agedHours` for
 * anything still inside or just past the response window, `agedDays` for
 * everything already settled.
 */
function queueRequest(
  now: Date,
  input: {
    id: string;
    ref: string;
    n: number;
    service: ServiceSlug;
    status: RequestStatus;
    agedHours?: number;
    agedDays?: number;
    note?: string;
    internal?: string;
    intent?: 'basic' | 'premium' | 'vip';
    preferredInDays?: number;
  },
): ServiceRequest {
  const p = EXTRA_PEOPLE.find((x) => x.n === input.n)!;
  const createdAt =
    input.agedHours != null
      ? iso(new Date(now.getTime() - input.agedHours * 3_600_000))
      : iso(days(now, -(input.agedDays ?? 2)));
  const read = input.status !== 'new' && input.status !== 'draft';

  return {
    id: input.id,
    reference: input.ref,
    customerId: `cus_m${input.n}`,
    propertyId: `prp_m${input.n}`,
    serviceSlug: input.service,
    addOnIds: [],
    windowCount: input.service === 'fensterreinigung' ? 8 : undefined,
    furniturePieces: input.service === 'moebelmontage' ? 3 : undefined,
    preferred:
      input.preferredInDays != null
        ? { date: iso(days(now, input.preferredInDays)), band: 'morning', flexible: false }
        : { flexible: true },
    photoIds: [],
    customerNote: input.note ?? SERVICE_NOTES[input.service],
    internalNote: input.internal,
    status: input.status,
    outOfArea: p.postcode === '8004',
    createdAt,
    openedAt: read ? createdAt : undefined,
    respondedAt: read && input.agedDays != null ? iso(days(now, -Math.max(1, input.agedDays - 1))) : undefined,
    subscriptionIntent: input.intent,
  };
}

function withAllStates(data: DataSet, now: Date): DataSet {
  /* `baseData` already carries the households — it needs them for its own
     queue. Adding them again here would duplicate every id, and `find` would
     start returning whichever copy came first. */
  const matrixProperties = extraProperties();
  const officeIds = OFFICE_IDS;
  const homeIds = HOME_IDS;

  const customers: Customer[] = [
    ...data.customers,
    person('cus_5', 'Livia', 'Bernasconi', 'it', now, 88, '+41 79 305 77 12'),
    person('cus_6', 'Peter', 'Huber', 'de', now, 41, '+41 44 926 18 03'),
    {
      /* §15 — the customer closed their own account from screen 49. The record
         stays because invoices hang off it; only the status moves. */
      ...person('cus_7', 'Regula', 'Frei', 'de', now, 210, '+41 79 118 40 62'),
      status: 'inactive',
      internalNotes: 'Konto vom Kunden geschlossen — weggezogen, kein Objekt mehr im Gebiet.',
    },
  ];

  const properties: Property[] = [
    ...data.properties,
    {
      id: 'prp_5',
      customerId: 'cus_5',
      label: 'Reihenhaus',
      street: 'Rebbergstrasse 7',
      postcode: '8634',
      city: 'Hombrechtikon',
      kind: 'house',
      area: 142,
      rooms: 5.5,
      bathrooms: 2,
      floor: 0,
      hasElevator: false,
      hasPets: false,
      needsExtraEffort: false,
      access: {
        method: 'key-left',
        keyLocation: 'Schlüsseltresor am Gartentor',
        keyReturnLocation: 'Zurück in den Tresor',
      },
    },
    {
      id: 'prp_6',
      customerId: 'cus_6',
      /* Outside the eight municipalities on purpose — §20.1 lets the request
         through and flags it, and the list has a chip for exactly this. */
      label: 'Wohnung Zürich',
      street: 'Langstrasse 140',
      postcode: '8004',
      city: 'Zürich',
      kind: 'apartment',
      area: 68,
      rooms: 2.5,
      bathrooms: 1,
      floor: 4,
      hasElevator: false,
      hasPets: true,
      needsExtraEffort: true,
    },
  ];

  const hours = (n: number) => iso(new Date(now.getTime() - n * 3_600_000));

  /*
   * The ten RequestStatus values, plus the four positions relative to the
   * response window that the deadline column has to distinguish.
   *
   * `responseTimeHours` is 24 in the seed, and `overdueDays` counts *whole*
   * days past the deadline — so the ages are 24h plus the lateness, not the
   * lateness itself. 6h is inside the promise, 20h comes due today, 50h is one
   * full day late, 150h is five.
   */
  const requests: ServiceRequest[] = [
    {
      id: 'req_s_draft',
      reference: 'A-2601',
      customerId: 'cus_5',
      propertyId: 'prp_5',
      serviceSlug: 'einmalreinigung',
      addOnIds: [],
      preferred: { flexible: false },
      photoIds: [],
      internalNote: 'Angerufen Dienstag, wollte Preis für Erdgeschoss. Rückruf zugesagt.',
      /* No openedAt: a draft has not arrived, so no clock has started. The
         deadline column has to print "—" here, not a breach. */
      status: 'draft',
      outOfArea: false,
      createdAt: hours(50),
    },
    {
      id: 'req_s_new',
      reference: 'A-2602',
      customerId: 'cus_5',
      propertyId: 'prp_5',
      serviceSlug: 'fensterreinigung',
      addOnIds: [],
      windowCount: 14,
      preferred: { date: iso(days(now, 6)), band: 'morning', flexible: false },
      photoIds: [],
      customerNote: 'Sprossenfenster, teilweise sehr hoch.',
      status: 'new',
      outOfArea: false,
      createdAt: hours(6), // inside the window
    },
    {
      id: 'req_s_late1',
      reference: 'A-2603',
      customerId: 'cus_6',
      propertyId: 'prp_6',
      serviceSlug: 'grundreinigung',
      addOnIds: ['add_backofen'],
      preferred: { flexible: true },
      photoIds: [],
      customerNote: 'Wohnung war lange vermietet, ist ziemlich mitgenommen.',
      status: 'new',
      outOfArea: true, // 8004 — outside the eight municipalities
      createdAt: hours(50), // one full day late
    },
    {
      id: 'req_s_late5',
      reference: 'A-2604',
      customerId: 'cus_6',
      propertyId: 'prp_6',
      serviceSlug: 'moebelmontage',
      addOnIds: [],
      furniturePieces: 4,
      preferred: { flexible: true },
      photoIds: [],
      status: 'inReview',
      outOfArea: true,
      createdAt: hours(150), // five days late — sorts to the top
      openedAt: hours(149),
    },
    {
      id: 'req_s_today',
      reference: 'A-2605',
      customerId: 'cus_1',
      propertyId: 'prp_1',
      serviceSlug: 'unterhaltsreinigung',
      addOnIds: [],
      preferred: { flexible: true },
      photoIds: [],
      status: 'inReview',
      outOfArea: false,
      createdAt: hours(20), // comes due today
      openedAt: hours(19),
    },
    {
      id: 'req_s_offer',
      reference: 'A-2606',
      customerId: 'cus_5',
      propertyId: 'prp_5',
      serviceSlug: 'umzugsreinigung',
      addOnIds: ['add_schraenke'],
      preferred: { date: iso(days(now, 11)), band: 'midday', flexible: false },
      photoIds: [],
      status: 'offerSent',
      outOfArea: false,
      createdAt: iso(days(now, -3)),
      openedAt: iso(days(now, -3)),
      respondedAt: iso(days(now, -3)),
      subscriptionIntent: 'basic', // "plan wanted" in the type column
    },
    {
      id: 'req_s_revision',
      reference: 'A-2607',
      customerId: 'cus_2',
      propertyId: 'prp_2',
      serviceSlug: 'grundreinigung',
      addOnIds: ['add_fenster'],
      preferred: { date: iso(days(now, 8)), band: 'afternoon', flexible: false },
      photoIds: [],
      customerNote: 'Können Sie die Fenster rausrechnen? Der Rest passt.',
      status: 'revisionRequested',
      outOfArea: false,
      createdAt: iso(days(now, -5)),
      openedAt: iso(days(now, -5)),
      respondedAt: iso(days(now, -4)),
    },
    {
      id: 'req_s_accepted',
      reference: 'A-2608',
      customerId: 'cus_1',
      propertyId: 'prp_1',
      serviceSlug: 'einmalreinigung',
      addOnIds: [],
      preferred: { date: iso(days(now, -6)), band: 'morning', flexible: false },
      photoIds: [],
      status: 'accepted',
      outOfArea: false,
      createdAt: iso(days(now, -12)),
      openedAt: iso(days(now, -12)),
      respondedAt: iso(days(now, -11)),
    },
    {
      id: 'req_s_rejected',
      reference: 'A-2609',
      customerId: 'cus_6',
      propertyId: 'prp_6',
      /* Was `bueroreinigung` on a 68 m² residential flat — office cleaning
         priced and scheduled fine against it, which is precisely why nothing
         caught it. The matrix carries office/rejected on a real office. */
      serviceSlug: 'einmalreinigung',
      addOnIds: [],
      preferred: { flexible: true },
      photoIds: [],
      internalNote: 'Abgelehnt: ausserhalb Gebiet und Anfahrt trägt sich nicht.',
      status: 'rejected',
      outOfArea: true,
      createdAt: iso(days(now, -9)),
      openedAt: iso(days(now, -9)),
      respondedAt: iso(days(now, -8)),
    },
    {
      id: 'req_s_expired',
      reference: 'A-2610',
      customerId: 'cus_5',
      propertyId: 'prp_5',
      serviceSlug: 'fensterreinigung',
      addOnIds: [],
      windowCount: 8,
      preferred: { flexible: true },
      photoIds: [],
      status: 'expired',
      outOfArea: false,
      createdAt: iso(days(now, -40)),
      openedAt: iso(days(now, -40)),
      respondedAt: iso(days(now, -39)),
    },
    {
      id: 'req_s_cancelcus',
      reference: 'A-2611',
      customerId: 'cus_2',
      propertyId: 'prp_2',
      serviceSlug: 'einmalreinigung',
      addOnIds: [],
      preferred: { flexible: true },
      photoIds: [],
      internalNote: 'Zurückgezogen durch den Kunden: anders gelöst.',
      status: 'cancelledByCustomer',
      outOfArea: false,
      createdAt: iso(days(now, -7)),
      openedAt: iso(days(now, -7)),
      respondedAt: iso(days(now, -6)),
    },
    {
      id: 'req_s_cancelco',
      reference: 'A-2612',
      customerId: 'cus_3',
      propertyId: 'prp_3',
      serviceSlug: 'umzugsreinigung',
      addOnIds: [],
      preferred: { date: iso(days(now, 3)), band: 'morning', flexible: false },
      photoIds: [],
      internalNote: 'Storniert durch uns: Objekt verkauft, Übergabe abgesagt.',
      status: 'cancelledByCompany',
      outOfArea: false,
      createdAt: iso(days(now, -10)),
      openedAt: iso(days(now, -10)),
      respondedAt: iso(days(now, -2)),
    },
  ];

  /* ------------------------------------- the 7 × 10 matrix ------------- */

  const SHORT: Record<ServiceSlug, string> = {
    unterhaltsreinigung: 'reg',
    einmalreinigung: 'one',
    grundreinigung: 'deep',
    umzugsreinigung: 'move',
    fensterreinigung: 'win',
    bueroreinigung: 'off',
    moebelmontage: 'asm',
  };

  const matrixRequests: ServiceRequest[] = [];
  const matrixOffers: Offer[] = [];
  const matrixBookings: Booking[] = [];
  const matrixInvoices: Invoice[] = [];

  let seq = 0;

  MATRIX_STATUSES.forEach((status) => {
    SERVICE_SLUGS.forEach((slug, si) => {
      seq += 1;
      const reference = `A-${2700 + seq}`;
      const id = `req_m_${SHORT[slug]}_${status}`;

      /* Office cleaning goes to an office, everything else to a home. Rotating
         with the service index keeps one household from collecting the whole
         column. */
      const pool = slug === 'bueroreinigung' ? officeIds : homeIds;
      const n = pool[(si + seq) % pool.length]!;
      const property = matrixProperties.find((p) => p.id === `prp_m${n}`)!;

      const openAge =
        status === 'new' || status === 'inReview' ? (OPEN_AGES[status][si] ?? 12) : null;
      const settledDays = SETTLED_AGES[status]?.[si] ?? 3;
      const createdAt = openAge != null ? hours(openAge) : iso(days(now, -settledDays));

      /* `new` is the only status meaning nobody has looked yet, and a draft has
         not arrived at all — everything else was read. */
      const openedAt =
        status === 'draft' || status === 'new'
          ? undefined
          : openAge != null
            ? hours(openAge - 1)
            : iso(days(now, -settledDays));

      const settled = !['draft', 'new', 'inReview'].includes(status);

      const request: ServiceRequest = {
        id,
        reference,
        customerId: `cus_m${n}`,
        propertyId: property.id,
        serviceSlug: slug,
        /* Add-ons only where they apply to the service, so the pricing engine
           is never handed a window clean on a furniture job. */
        addOnIds: SEED_ADDONS.filter(
          (a) => a.active && a.services.includes(slug) && a.slug === 'backofen',
        ).map((a) => a.id),
        windowCount: slug === 'fensterreinigung' ? 6 + si * 3 : undefined,
        furniturePieces: slug === 'moebelmontage' ? 2 + si : undefined,
        preferred:
          si % 3 === 0
            ? { flexible: true }
            : {
                date: iso(days(now, 5 + si)),
                band: si % 3 === 1 ? 'morning' : 'afternoon',
                flexible: false,
              },
        photoIds: [],
        customerNote: status === 'draft' ? undefined : SERVICE_NOTES[slug],
        internalNote:
          status === 'draft'
            ? 'Angerufen, Angaben noch unvollständig. Rückruf zugesagt.'
            : status === 'rejected'
              ? 'Abgelehnt: passt nicht in die Route.'
              : status === 'cancelledByCustomer'
                ? 'Zurückgezogen durch den Kunden.'
                : status === 'cancelledByCompany'
                  ? 'Storniert durch uns.'
                  : undefined,
        status,
        outOfArea: property.postcode === '8004',
        createdAt,
        openedAt,
        respondedAt: settled ? iso(days(now, -Math.max(1, settledDays - 1))) : undefined,
        /* Regular cleaning is the plan service, so that is where an intent
           belongs — it drives the "plan wanted" value in the type column. */
        subscriptionIntent: slug === 'unterhaltsreinigung' ? 'basic' : undefined,
      };
      matrixRequests.push(request);

      /* --- the lifecycle the status implies, and nothing beyond it --- */

      const offerStatus = OFFER_FOR[status];
      /* Cancelled requests only carry a quote for half the services: some calls
         are called off before anything went out, and pretending every one had
         a quote would overstate how far they got. */
      const cancelledWithOffer =
        (status === 'cancelledByCustomer' || status === 'cancelledByCompany') && si % 2 === 0;

      if (offerStatus && (IMPLIES_SENT_OFFER.includes(status) || cancelledWithOffer)) {
        matrixOffers.push(
          makeOffer(`off_m_${SHORT[slug]}_${status}`, request, property, now, {
            issuedDaysAgo: Math.max(1, settledDays - 1),
            validDays: SEED_SETTINGS.offerValidityDays,
            status: offerStatus,
            reference: `O-${reference.replace('A-', '')}-1`,
          }),
        );
      }

      /* A quote being written right now: `inReview` plus an unsent draft. Only
         a couple, and only as a draft — an unsent offer has reached nobody, so
         the lifecycle rail must still show "Offerte versendet" as pending. */
      if (status === 'inReview' && si < 2) {
        matrixOffers.push(
          makeOffer(`off_m_${SHORT[slug]}_draft`, request, property, now, {
            issuedDaysAgo: 0,
            validDays: SEED_SETTINGS.offerValidityDays,
            status: 'draft',
            reference: `O-${reference.replace('A-', '')}-1`,
          }),
        );
      }

      /* Accepted means signed and paid, so there is a job. Statuses rotate
         across the booking lifecycle rather than all landing on `scheduled`. */
      if (status === 'accepted') {
        const BOOKING_ARC: Booking['status'][] = [
          'scheduled',
          'rescheduled',
          'inProgress',
          'awaitingApproval',
          'completed',
          'invoiced',
          'closed',
        ];
        const bookingStatus = BOOKING_ARC[si]!;
        const future = bookingStatus === 'scheduled' || bookingStatus === 'rescheduled';
        const start = future ? at(days(now, 2 + si), 9) : at(days(now, -(si + 2)), 9);
        const bookingId = `bkg_m_${SHORT[slug]}`;

        matrixBookings.push({
          id: bookingId,
          reference: `B-12${String(si + 10).padStart(2, '0')}`,
          customerId: request.customerId,
          propertyId: property.id,
          serviceSlug: slug,
          start: iso(start),
          duration: 180 + si * 30,
          arrivalWindow: 60,
          assigneeId: 'tm_owner',
          status: bookingStatus,
          photoIds: [],
          checkInAt: future ? undefined : iso(at(start, 9, 5)),
          checkOutAt:
            future || bookingStatus === 'inProgress' ? undefined : iso(at(start, 13, 30)),
          history: [
            { at: iso(days(now, -settledDays)), kind: 'created', label: 'Gebucht' },
            ...(bookingStatus === 'awaitingApproval'
              ? [
                  {
                    at: iso(at(start, 13, 30)),
                    kind: 'checkOut',
                    label: 'Ausgecheckt · +1 Std. gemeldet',
                  },
                ]
              : []),
          ],
        });

        /* Only the two states that mean money has been billed. A `completed`
           job is billable and deliberately has no invoice yet — that is the
           row the invoice screen's create action exists for. */
        if (bookingStatus === 'invoiced' || bookingStatus === 'closed') {
          matrixInvoices.push({
            id: `inv_m_${SHORT[slug]}`,
            reference: `RE-2026-01${String(si + 10).padStart(2, '0')}`,
            customerId: request.customerId,
            bookingId,
            lines: [{ label: 'Reinigung', quantity: 3 + si, unitPrice: SEED_SETTINGS.hourlyRate }],
            status: bookingStatus === 'closed' ? 'paid' : 'sent',
            issuedAt: iso(days(now, -(si + 1))),
            dueAt: iso(days(now, 29 - si)),
            paidAt: bookingStatus === 'closed' ? iso(days(now, -si)) : undefined,
            qrReference: `21 00000 00003 13947 14300 09${String(200 + seq)}`,
          });
        }
      }
    });
  });

  const find = (id: string) => requests.find((r) => r.id === id)!;
  const prop = (id: string) => properties.find((p) => p.id === id)!;

  /* All six OfferStatus values. The draft one has no `issuedAt`, which is what
     keeps the lifecycle rail honest: an unsent draft has not reached anybody,
     so the "Offerte versendet" stage must stay pending. */
  const offers: Offer[] = [
    ...data.offers,
    makeOffer('off_s_draft', find('req_s_today'), prop('prp_1'), now, {
      issuedDaysAgo: 0,
      validDays: 14,
      status: 'draft',
      reference: 'O-2605-1',
    }),
    makeOffer('off_s_sent', find('req_s_offer'), prop('prp_5'), now, {
      issuedDaysAgo: 3,
      validDays: 14,
      reference: 'O-2606-1',
    }),
    makeOffer('off_s_revision', find('req_s_revision'), prop('prp_2'), now, {
      issuedDaysAgo: 4,
      validDays: 14,
      status: 'revisionRequested',
      reference: 'O-2607-1',
    }),
    makeOffer('off_s_accepted', find('req_s_accepted'), prop('prp_1'), now, {
      issuedDaysAgo: 11,
      validDays: 14,
      status: 'accepted',
      reference: 'O-2608-1',
    }),
    makeOffer('off_s_rejected', find('req_s_rejected'), prop('prp_6'), now, {
      issuedDaysAgo: 8,
      validDays: 14,
      status: 'rejected',
      reference: 'O-2609-1',
    }),
    makeOffer('off_s_expired', find('req_s_expired'), prop('prp_5'), now, {
      issuedDaysAgo: 39,
      validDays: 14,
      status: 'expired',
      reference: 'O-2610-1',
    }),
  ];

  /* All nine BookingStatus values. `awaitingApproval` is the one worth staging
     with a reported-hours note in its history — it is the state the approval
     action on screen 63 exists for, and without the note the screen asks the
     owner to approve something with nothing to read. */
  const bookings: Booking[] = [
    ...data.bookings,
    {
      id: 'bkg_s_resched',
      reference: 'B-1101',
      customerId: 'cus_5',
      propertyId: 'prp_5',
      serviceSlug: 'einmalreinigung',
      start: iso(at(days(now, 2), 13)),
      duration: 210,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'rescheduled',
      photoIds: [],
      history: [
        { at: iso(days(now, -6)), kind: 'created', label: 'Gebucht' },
        { at: iso(days(now, -1)), kind: 'rescheduled', label: 'Verschoben auf Wunsch des Kunden' },
      ],
    },
    {
      id: 'bkg_s_inprogress',
      reference: 'B-1102',
      customerId: 'cus_1',
      propertyId: 'prp_1',
      serviceSlug: 'unterhaltsreinigung',
      start: iso(at(days(now, 0), 8)),
      duration: 240,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'inProgress',
      photoIds: [],
      checkInAt: iso(at(days(now, 0), 8, 5)),
      history: [
        { at: iso(days(now, -5)), kind: 'created', label: 'Gebucht' },
        { at: iso(at(days(now, 0), 8, 5)), kind: 'checkIn', label: 'Eingecheckt' },
      ],
    },
    {
      id: 'bkg_s_await',
      reference: 'B-1103',
      customerId: 'cus_5',
      propertyId: 'prp_5',
      serviceSlug: 'grundreinigung',
      start: iso(at(days(now, -1), 9)),
      duration: 300,
      arrivalWindow: 90,
      assigneeId: 'tm_owner',
      status: 'awaitingApproval',
      photoIds: [],
      checkInAt: iso(at(days(now, -1), 9, 3)),
      checkOutAt: iso(at(days(now, -1), 15, 20)),
      history: [
        { at: iso(days(now, -8)), kind: 'created', label: 'Gebucht' },
        { at: iso(at(days(now, -1), 9, 3)), kind: 'checkIn', label: 'Eingecheckt' },
        {
          at: iso(at(days(now, -1), 15, 20)),
          kind: 'checkOut',
          /* §5.3 — reported by the person on site, priced by the office. This
             is the sentence the approval button is asking about. */
          label: 'Ausgecheckt · +1.5 Std. gemeldet · Keller war zusätzlich vereinbart',
        },
      ],
    },
    {
      id: 'bkg_s_noaccess',
      reference: 'B-1104',
      customerId: 'cus_6',
      propertyId: 'prp_6',
      serviceSlug: 'einmalreinigung',
      start: iso(at(days(now, -3), 10)),
      duration: 180,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'noAccess',
      photoIds: [],
      history: [
        { at: iso(days(now, -11)), kind: 'created', label: 'Gebucht' },
        {
          at: iso(at(days(now, -3), 10, 25)),
          kind: 'noAccess',
          label: 'Kein Zutritt — 20 Min. gewartet, 50% verrechnet',
        },
      ],
    },
    {
      id: 'bkg_s_completed',
      reference: 'B-1105',
      customerId: 'cus_1',
      propertyId: 'prp_1',
      serviceSlug: 'einmalreinigung',
      start: iso(at(days(now, -6), 9)),
      duration: 240,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'completed',
      photoIds: [],
      checkInAt: iso(at(days(now, -6), 9, 2)),
      checkOutAt: iso(at(days(now, -6), 13, 10)),
      history: [
        { at: iso(days(now, -12)), kind: 'created', label: 'Gebucht' },
        { at: iso(at(days(now, -6), 13, 10)), kind: 'checkOut', label: 'Ausgecheckt' },
        { at: iso(days(now, -5)), kind: 'approved', label: 'Freigegeben' },
      ],
    },
    {
      id: 'bkg_s_invoiced',
      reference: 'B-1106',
      customerId: 'cus_2',
      propertyId: 'prp_2',
      serviceSlug: 'grundreinigung',
      start: iso(at(days(now, -20), 9)),
      duration: 300,
      arrivalWindow: 90,
      assigneeId: 'tm_owner',
      status: 'invoiced',
      photoIds: [],
      history: [{ at: iso(days(now, -20)), kind: 'checkOut', label: 'Ausgecheckt' }],
    },
    {
      id: 'bkg_s_closed',
      reference: 'B-1107',
      customerId: 'cus_3',
      propertyId: 'prp_3',
      serviceSlug: 'umzugsreinigung',
      start: iso(at(days(now, -48), 8)),
      duration: 360,
      arrivalWindow: 120,
      assigneeId: 'tm_owner',
      status: 'closed',
      photoIds: [],
      history: [{ at: iso(days(now, -47)), kind: 'closed', label: 'Abgeschlossen und bezahlt' }],
    },
    {
      id: 'bkg_s_cancelled',
      reference: 'B-1108',
      customerId: 'cus_3',
      propertyId: 'prp_3',
      serviceSlug: 'umzugsreinigung',
      start: iso(at(days(now, 3), 8)),
      duration: 360,
      arrivalWindow: 120,
      status: 'cancelled',
      photoIds: [],
      history: [
        { at: iso(days(now, -10)), kind: 'created', label: 'Gebucht' },
        { at: iso(days(now, -2)), kind: 'cancelled', label: 'Storniert — Objekt verkauft' },
      ],
    },
  ];

  /* All five SubscriptionStatus values. `pastDue` and `cancelled` have no path
     that reaches them in the app — /flows says so — which is exactly why they
     have to exist in data, or screen 70 has states no reviewer can open. */
  const subscriptions: Subscription[] = [
    ...data.subscriptions,
    {
      id: 'sub_s_pastdue',
      reference: 'S-0021',
      customerId: 'cus_5',
      propertyId: 'prp_5',
      plan: 'basic',
      serviceSlug: 'unterhaltsreinigung',
      startDate: iso(days(now, -200)),
      commitmentEndsAt: iso(days(now, 165)),
      status: 'pastDue',
      skipsUsedThisMonth: 0,
      lastChargedAt: iso(days(now, -38)),
      nextChargeAt: iso(days(now, -8)),
    },
    {
      id: 'sub_s_paused',
      reference: 'S-0022',
      customerId: 'cus_2',
      propertyId: 'prp_2',
      plan: 'basic',
      serviceSlug: 'unterhaltsreinigung',
      startDate: iso(days(now, -120)),
      commitmentEndsAt: iso(days(now, 245)),
      status: 'paused',
      skipsUsedThisMonth: 2,
      lastChargedAt: iso(days(now, -20)),
      nextChargeAt: iso(days(now, 10)),
    },
    {
      id: 'sub_s_pending',
      reference: 'S-0023',
      customerId: 'cus_3',
      propertyId: 'prp_3',
      plan: 'vip',
      serviceSlug: 'unterhaltsreinigung',
      startDate: iso(days(now, -300)),
      commitmentEndsAt: iso(days(now, 65)),
      status: 'cancellationPending',
      skipsUsedThisMonth: 1,
      cancellationRequestedAt: iso(days(now, -4)),
      lastChargedAt: iso(days(now, -12)),
      nextChargeAt: iso(days(now, 18)),
    },
    {
      id: 'sub_s_cancelled',
      reference: 'S-0024',
      customerId: 'cus_6',
      propertyId: 'prp_6',
      plan: 'basic',
      serviceSlug: 'unterhaltsreinigung',
      startDate: iso(days(now, -420)),
      commitmentEndsAt: iso(days(now, -55)),
      status: 'cancelled',
      skipsUsedThisMonth: 0,
      lastChargedAt: iso(days(now, -85)),
    },
  ];

  /* All five InvoiceStatus values. `sent`, `overdue` and `cancelled` were the
     three the seed never carried. */
  const invoices: Invoice[] = [
    ...data.invoices,
    {
      id: 'inv_s_sent',
      reference: 'RE-2026-0061',
      customerId: 'cus_5',
      bookingId: 'bkg_s_completed',
      lines: [{ label: 'Einmalreinigung', quantity: 4, unitPrice: 49 }],
      status: 'sent',
      issuedAt: iso(days(now, -4)),
      dueAt: iso(days(now, 26)),
      qrReference: '21 00000 00003 13947 14300 09121',
    },
    {
      id: 'inv_s_overdue',
      reference: 'RE-2026-0055',
      customerId: 'cus_6',
      bookingId: 'bkg_s_invoiced',
      lines: [
        { label: 'Grundreinigung', quantity: 5, unitPrice: 49 },
        { label: 'Backofenreinigung', quantity: 1, unitPrice: 45 },
      ],
      status: 'overdue',
      issuedAt: iso(days(now, -52)),
      dueAt: iso(days(now, -22)),
      qrReference: '21 00000 00003 13947 14300 09088',
    },
    {
      id: 'inv_s_cancelled',
      reference: 'RE-2026-0058',
      customerId: 'cus_3',
      bookingId: 'bkg_s_cancelled',
      lines: [{ label: 'Umzugsreinigung', quantity: 6, unitPrice: 49 }],
      status: 'cancelled',
      issuedAt: iso(days(now, -14)),
      dueAt: iso(days(now, 16)),
      cancelReason: 'Einsatz storniert — Objekt verkauft, nie erbracht.',
      qrReference: '21 00000 00003 13947 14300 09104',
    },
  ];

  /* Published, pending and rejected — the third had no record anywhere, so the
     moderation screen's own filter had an option that matched nothing. */
  const reviews: Review[] = [
    {
      id: 'rev_s_published',
      bookingId: 'bkg_s_completed',
      customerId: 'cus_1',
      rating: 5,
      text: 'Sehr sorgfältig, und die Absprachen haben genau gestimmt.',
      status: 'published',
      submittedAt: iso(days(now, -5)),
      ownerReply: 'Vielen Dank, Frau Keller — bis zum nächsten Mal.',
      publishConsent: true,
    },
    {
      id: 'rev_s_pending',
      bookingId: 'bkg_s_invoiced',
      customerId: 'cus_2',
      rating: 3,
      text: 'Gute Arbeit, aber die Ankunft war fast eine Stunde später als angekündigt.',
      status: 'pending',
      submittedAt: iso(days(now, -2)),
      publishConsent: true,
    },
    {
      id: 'rev_s_rejected',
      bookingId: 'bkg_s_noaccess',
      customerId: 'cus_6',
      rating: 1,
      text: 'Niemand ist gekommen und trotzdem wurde verrechnet.',
      status: 'rejected',
      submittedAt: iso(days(now, -3)),
      ownerReply:
        'Der Termin war bestätigt, es war 20 Minuten niemand da und das ist mit Foto und Zeitstempel dokumentiert. Die Gebühr steht in den AGB §8.',
      publishConsent: true,
    },
  ];

  /* Both KeyStatus values — `returned` existed only as a type. */
  const keyLog: KeyLogEntry[] = [
    ...data.keyLog,
    {
      id: 'key_s_returned',
      propertyId: 'prp_3',
      receivedAt: iso(days(now, -60)),
      receivedBy: 'Marco Brunner',
      storageLocation: 'Schlüsselschrank Büro, Fach 5',
      returnedAt: iso(days(now, -46)),
      status: 'returned',
    },
  ];

  /* Threads for the template picker to answer into — one unread from the
     customer, one the office already replied to. */
  const messages: CustomerMessage[] = [
    ...data.messages,
    {
      id: 'msg_s_1',
      customerId: 'cus_5',
      subject: 'A-2606',
      from: 'customer',
      body: 'Guten Tag, passt der 11. auch am Nachmittag statt am Mittag?',
      at: iso(days(now, -1)),
      readByCustomer: true,
    },
    {
      id: 'msg_s_2',
      customerId: 'cus_6',
      subject: 'RE-2026-0055',
      from: 'customer',
      body: 'Ich bestreite diese Rechnung — es war niemand vor Ort.',
      at: iso(days(now, -2)),
      readByCustomer: true,
    },
    {
      id: 'msg_s_3',
      customerId: 'cus_6',
      subject: 'RE-2026-0055',
      from: 'homivaro',
      body: 'Guten Tag Herr Huber\n\nDer Einsatz ist mit Foto und Zeitstempel dokumentiert. Ich schicke Ihnen die Aufnahme gerne zu.\n\nFreundliche Grüsse\nMarco Brunner',
      at: iso(days(now, -2)),
      readByCustomer: false,
    },
  ];

  return {
    ...data,
    customers,
    properties,
    /* Matrix first: it is status-major, so an unfiltered table opens on the
       lifecycle in order rather than on whatever arrived last. The queue's own
       overdue-first sort still overrides this for the rows that are late. */
    requests: [...matrixRequests, ...requests, ...data.requests],
    offers: [...matrixOffers, ...offers],
    bookings: [...matrixBookings, ...bookings],
    subscriptions,
    invoices: [...matrixInvoices, ...invoices],
    reviews,
    keyLog,
    messages,
  };
}

/**
 * The holds a freshly built scenario starts with.
 *
 * `holds` lives on the store rather than in the DataSet because a checkout
 * hold is transient by nature — fifteen minutes, gone. A date the office has
 * *confirmed* is not transient, and wiping it on every scenario switch and
 * every move of the demo clock would have made the whole propose-and-confirm
 * flow unreachable from seed data. So it is rebuilt from the offer, which is
 * where the decision is actually recorded.
 */
export function seedHolds(data: DataSet, now: Date): SlotHold[] {
  return data.offers
    .filter((o) => o.confirmedSlot && o.status === 'sent')
    .filter((o) => !data.bookings.some((b) => b.offerId === o.id))
    .map((o) => ({
      id: `hold_${o.id}_${o.confirmedSlot}`,
      offerId: o.id,
      start: o.confirmedSlot!,
      duration: Math.round(o.estimatedHours * 60),
      expiresAt: iso(new Date(now.getTime() + 48 * 3_600_000)),
      confirmed: true,
    }));
}

export function buildScenario(name: ScenarioName, now: Date): DataSet {
  switch (name) {
    case 'fresh':
      // Launch day. One person, no customers, no reviews, nothing booked.
      return { ...EMPTY, team: [owner(now)] };

    case 'busy': {
      const data = baseData(now);
      /*
       * A full week, properly.
       *
       * This used to be five spread copies of `requests[0]` — same customer,
       * same service, same note, same everything but the timestamp. Five
       * identical rows do not test a queue; they test whether the table can
       * repeat itself. And at eight rows the list never crossed the 25-row page
       * size, so pagination was unreachable in the one scenario named for being
       * under load.
       *
       * Twenty-four varied requests across all seven services, every household
       * and a spread of ages — enough to fill a second page, with the late ones
       * sorting to the top where the owner needs them.
       */
      const BUSY_SERVICES: ServiceSlug[] = [
        'unterhaltsreinigung',
        'einmalreinigung',
        'grundreinigung',
        'umzugsreinigung',
        'fensterreinigung',
        'moebelmontage',
      ];
      /* Hours old. Six are past the 24-hour promise by a day or more, which is
         what a backlog actually looks like — not a uniform ramp. */
      const BUSY_AGES = [
        2, 5, 8, 11, 14, 17, 20, 22, 26, 31, 38, 44, 50, 56, 63, 71, 78, 84, 92, 101, 118, 134,
        150, 178,
      ];
      const extra: ServiceRequest[] = BUSY_AGES.map((agedHours, i) =>
        queueRequest(now, {
          id: `req_bz_${i}`,
          ref: `A-26${String(20 + i).padStart(2, '0')}`,
          /* Skips the out-of-area household: a busy week is local work, and one
             flagged row already exists in the base queue. */
          n: (i % 11) + 1,
          service: BUSY_SERVICES[i % BUSY_SERVICES.length]!,
          status: i % 3 === 0 ? 'inReview' : 'new',
          agedHours,
          intent: i % 7 === 0 ? 'basic' : undefined,
          preferredInDays: i % 4 === 0 ? undefined : 4 + (i % 10),
        }),
      );
      const reviews: Review[] = [
        {
          id: 'rev_1',
          bookingId: 'bkg_1',
          customerId: 'cus_1',
          rating: 5,
          text: 'Pünktlich, gründlich, und man merkt, dass mitgedacht wird. Sehr empfehlenswert.',
          status: 'published',
          submittedAt: iso(days(now, -20)),
          publishConsent: true,
        },
        {
          id: 'rev_2',
          bookingId: 'bkg_2',
          customerId: 'cus_2',
          rating: 5,
          text: 'Endreinigung hat die Abnahme auf Anhieb bestanden. Genau das, was versprochen war.',
          status: 'published',
          submittedAt: iso(days(now, -6)),
          publishConsent: true,
        },
        {
          id: 'rev_3',
          bookingId: 'bkg_3',
          customerId: 'cus_3',
          rating: 4,
          text: 'Sehr saubere Arbeit. Die Ankunft war etwas später als angekündigt, wurde aber vorher gemeldet.',
          status: 'pending',
          submittedAt: iso(days(now, -2)),
          publishConsent: true,
        },
        {
          // The one the moderation screen exists for. §17.2 leaves publishing
          // to the owner; this is the case where that discretion matters, and
          // the screen refuses to publish it without a reply.
          id: 'rev_4',
          bookingId: 'bkg_4',
          customerId: 'cus_4',
          rating: 2,
          text: 'Zwei Fenster wurden ausgelassen und die Küche war nur oberflächlich gemacht. Auf meine Nachricht kam erst am nächsten Tag eine Antwort.',
          status: 'pending',
          submittedAt: iso(days(now, -1)),
          // Deliberately withheld: the moderation screen has to show the case
          // where publishing is not the owner's to decide (§20.6).
          publishConsent: false,
        },
      ];
      // §20.6 — only photos with recorded written consent reach the public
      // gallery. These two pairs are the ones that have it; the seed photos
      // deliberately do not, so the launch state stays empty.
      const consented: Photo[] = (['bkg_1', 'bkg_2'] as const).flatMap((bookingId, i) =>
        (['before', 'after'] as const).map((kind) => ({
          id: `pho_${bookingId}_${kind}`,
          src: `/placeholder/${bookingId}-${kind}.svg`,
          source: 'field' as const,
          kind,
          visibleToCustomer: true,
          publishConsent: true,
          note: i === 0 ? 'Küche, Küsnacht' : 'Badezimmer, Meilen',
          bookingId,
          takenAt: iso(days(now, -20 + i * 14)),
        })),
      );

      return {
        ...data,
        requests: [...data.requests, ...extra],
        reviews,
        photos: [...data.photos, ...consented],
      };
    }

    case 'overdue': {
      const data = baseData(now);
      const invoices: Invoice[] = [
        {
          id: 'inv_1',
          reference: 'RE-2026-0044',
          customerId: 'cus_2',
          bookingId: 'bkg_2',
          lines: [{ label: 'Einmalreinigung', quantity: 3, unitPrice: 49 }],
          status: 'overdue',
          issuedAt: iso(days(now, -44)),
          dueAt: iso(days(now, -14)),
          qrReference: '21 00000 00003 13947 14300 09017',
        },
      ];
      /*
       * The scenario is named for money, and the request side has the same
       * failure: §4.1 promises an answer inside a window, and a request past it
       * is overdue in exactly the sense the invoice is. Four badly late ones, so
       * the red deadline state, the overdue count in the toolbar and the
       * overdue-only filter all have something to show here too — not only in
       * `states`.
       */
      const lateRequests: ServiceRequest[] = [
        queueRequest(now, { id: 'req_ov_1', ref: 'A-2521', n: 2, service: 'grundreinigung', status: 'new', agedHours: 74 }),
        queueRequest(now, { id: 'req_ov_2', ref: 'A-2522', n: 7, service: 'bueroreinigung', status: 'inReview', agedHours: 122 }),
        queueRequest(now, { id: 'req_ov_3', ref: 'A-2523', n: 6, service: 'umzugsreinigung', status: 'new', agedHours: 196, preferredInDays: 3 }),
        queueRequest(now, { id: 'req_ov_4', ref: 'A-2524', n: 10, service: 'unterhaltsreinigung', status: 'inReview', agedHours: 268, intent: 'premium' }),
      ];

      return {
        ...data,
        requests: [...lateRequests, ...data.requests],
        // Appended, not replaced: the point of this scenario is an overdue
        // invoice sitting next to normal ones, not a world with only one.
        invoices: [...invoices, ...data.invoices],
        subscriptions: data.subscriptions.map((s) => ({ ...s, status: 'pastDue' as const })),
      };
    }

    case 'away': {
      const data = withClosure(baseData(now), now);
      /*
       * §14 — the owner is away, so nothing is being answered. That is the
       * interesting part for screen 52 and it had no data: requests keep
       * arriving during a closure and quietly breach the response window,
       * and two of these ask for a date that falls *inside* the closure, which
       * is the case the scheduler has to refuse when a quote is written.
       */
      const duringAbsence: ServiceRequest[] = [
        queueRequest(now, { id: 'req_aw_1', ref: 'A-2531', n: 1, service: 'unterhaltsreinigung', status: 'new', agedHours: 30, preferredInDays: 5, note: 'Wäre der 5. möglich? Wir sind ab dann zurück.' }),
        queueRequest(now, { id: 'req_aw_2', ref: 'A-2532', n: 8, service: 'einmalreinigung', status: 'new', agedHours: 54, preferredInDays: 7, note: 'Sobald es geht, wir haben Besuch angekündigt.' }),
        queueRequest(now, { id: 'req_aw_3', ref: 'A-2533', n: 5, service: 'fensterreinigung', status: 'new', agedHours: 96 }),
        queueRequest(now, { id: 'req_aw_4', ref: 'A-2534', n: 3, service: 'grundreinigung', status: 'inReview', agedHours: 140, internal: 'Gesehen, kann erst nach den Ferien beantwortet werden.' }),
      ];
      return { ...data, requests: [...duringAbsence, ...data.requests] };
    }

    case 'conflict': {
      // §20.2 — two jobs far apart on the same day, travel time short.
      const data = baseData(now);
      return {
        ...data,
        bookings: [
          ...data.bookings,
          {
            ...data.bookings[0]!,
            id: 'bkg_x',
            reference: 'B-1045',
            propertyId: 'prp_3',
            customerId: 'cus_3',
            start: iso(at(days(now, 0), 14, 15)),
            duration: 180,
            subscriptionId: undefined,
          },
        ],
        /* Two requests asking for the day that is already double-booked, one at
           each end of the lake. Quoting either of them is where the travel
           buffer in `slotsForDay` has to refuse a slot the calendar looks free
           for — and there was no request to quote from. */
        requests: [
          queueRequest(now, { id: 'req_cf_1', ref: 'A-2541', n: 1, service: 'einmalreinigung', status: 'new', agedHours: 8, preferredInDays: 0, note: 'Am liebsten heute noch, falls irgendwie möglich.' }),
          queueRequest(now, { id: 'req_cf_2', ref: 'A-2542', n: 8, service: 'grundreinigung', status: 'new', agedHours: 15, preferredInDays: 0 }),
          ...data.requests,
        ],
      };
    }

    case 'hiring':
      return withHiring(baseData(now), now);

    /* Stacked on hiring rather than on baseData: the applications track
       already carries all four ApplicationStatus values, and staging them a
       second time here would give the same states two sources. */
    case 'states':
      return withAllStates(withHiring(baseData(now), now), now);

    case 'demo':
    default:
      return baseData(now);
  }
}
