import type {
  Application,
  Booking,
  CalendarEvent,
  CalendarEventKind,
  CalendarEventStatus,
  ChangeLogEntry,
  ClosurePeriod,
  Coupon,
  Customer,
  Invoice,
  JobPosting,
  KeyLogEntry,
  CustomerMessage,
  ID,
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
  messages: CustomerMessage[];
  coupons: Coupon[];
  changeLog: ChangeLogEntry[];
  reviews: Review[];
  photos: Photo[];
  closures: ClosurePeriod[];
  /** Calls, follow-ups and viewings — everything on the calendar that is not
      a job. See `CalendarEvent` for why they are not bookings. */
  events: CalendarEvent[];
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
  messages: [],
  coupons: [],
  changeLog: [],
  reviews: [],
  photos: [],
  closures: [],
  events: [],
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

/**
 * `openDay` for a date behind us.
 *
 * Stepping *forward* off a Sunday is right for a slot being offered and wrong
 * for one that already happened: from last Sunday it lands on today, on top of
 * whatever is already booked there. A finished job moves back a day instead.
 */
const pastOpenDay = (from: Date, n: number) => {
  const out = days(from, n);
  return businessWeekday(out) === 7 ? days(out, -1) : out;
};

/**
 * A calendar entry that is not a job.
 *
 * Written as a factory because every scenario needs a handful and they differ
 * only in when, who and how it ended. The `history` is built from the status
 * rather than passed in — a call marked `done` with an empty timeline is a
 * record that claims an outcome nobody ever recorded, and the detail screen
 * would print an empty list under "Verlauf".
 */
function calendarEvent(
  now: Date,
  input: {
    id: string;
    ref: string;
    kind: CalendarEventKind;
    title: string;
    /** Offset in open days from today; negative for the past. */
    inDays: number;
    hour: number;
    minute?: number;
    duration?: number;
    status?: CalendarEventStatus;
    customerId?: string;
    contactName?: string;
    contactPhone?: string;
    propertyId?: string;
    note?: string;
    outcome?: string;
    requestId?: string;
    createdDaysAgo?: number;
  },
): CalendarEvent {
  const status = input.status ?? 'upcoming';
  const start = at(openDay(now, input.inDays), input.hour, input.minute ?? 0);
  const createdAt = days(now, -(input.createdDaysAgo ?? Math.max(1, input.inDays + 2)));

  const history: CalendarEvent['history'] = [
    { at: iso(createdAt), kind: 'created', label: 'Created' },
  ];
  if (status === 'done') {
    history.push({ at: iso(start), kind: 'done', label: 'Done' });
  } else if (status === 'pending') {
    history.push({ at: iso(start), kind: 'pending', label: 'Nobody reached' });
  } else if (status === 'cancelled') {
    history.push({ at: iso(start), kind: 'cancelled', label: 'Cancelled' });
  } else if (status === 'inProgress') {
    history.push({ at: iso(start), kind: 'inProgress', label: 'Turned into a request' });
  }

  return {
    id: input.id,
    reference: input.ref,
    kind: input.kind,
    title: input.title,
    start: iso(start),
    duration: input.duration ?? 30,
    status,
    customerId: input.customerId,
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    propertyId: input.propertyId,
    note: input.note,
    outcome: input.outcome,
    requestId: input.requestId,
    assigneeId: 'tm_owner',
    createdAt: iso(createdAt),
    history,
  };
}

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
      label: 'Home',
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
        boxLocation: 'Right of the front door, under the letterbox',
        boxCode: '4417',
        keyReturnLocation: 'Back into the key safe',
        alarmCode: '90210',
        emergencyName: 'Andrea Keller',
        emergencyPhone: '+41 79 000 00 01',
      },
      permanentNotes: 'The dog (Nala) is at home during the day, very friendly.',
    },
    {
      id: 'prp_2',
      customerId: 'cus_2',
      label: 'Flat',
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
      /*
       * The demo customer's office.
       *
       * Every seeded customer had exactly one address, so "which property is
       * this plan for?" was a question the data could not make anyone ask.
       * cus_2 now holds two plans on two addresses — a flat and an office, on
       * different services — which is the case the property line on screen 43
       * exists for.
       */
      id: 'prp_2b',
      customerId: 'cus_2',
      label: 'Seestrasse office',
      street: 'Seestrasse 104',
      postcode: '8706',
      city: 'Meilen',
      kind: 'office',
      area: 140,
      rooms: 5,
      bathrooms: 2,
      floor: 1,
      hasElevator: true,
      hasPets: false,
      needsExtraEffort: false,
      access: {
        method: 'other-person',
        personName: 'Empfang Seestrasse 104',
        personPhone: '+41 44 000 00 12',
        personRelation: 'Empfang im Erdgeschoss',
      },
    },
    {
      id: 'prp_3',
      customerId: 'cus_3',
      label: 'Old flat',
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
      label: 'Office',
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
        'Handover is on the 20th and the management is strict. The oven is the critical point.',
      /*
       * `off_2` hangs off this request, was issued 20 days ago and ran out 6
       * days ago — and the request said `new`. So screen 53 opened on a
       * lifecycle that read "Eingegangen gestern → Offerte versendet vor 20
       * Tagen", offered "Offerte schreiben" for a quote that had already been
       * written, and offered "Ablehnen" on something the calendar had closed.
       * The request ends where its quote ended.
       */
      status: 'expired',
      createdAt: iso(days(now, -21)),
      openedAt: iso(days(now, -20)),
      respondedAt: iso(days(now, -20)),
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
      createdAt: iso(new Date(now.getTime() - 1000 * 60 * 60 * 3)),
      planIntent: 'pln_premium',
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
      history: [{ at: iso(days(now, -14)), kind: 'created', label: 'Plan visit scheduled' }],
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
      /*
       * The one moved job that belongs to the demo *account*.
       *
       * B-1050 already carried `rescheduled`, and it belongs to cus_m3 — a
       * customer nobody can log in as. So the half of a reschedule that faces
       * the customer (the notice in the bell, the note on the dashboard) had
       * no seeded example at all: you could only see it by moving a job
       * yourself and then switching roles.
       */
      status: 'rescheduled',
      reschedule: { from: iso(at(days(now, 0), 8, 30)), at: iso(days(now, -1)) },
      photoIds: [],
      history: [
        { at: iso(days(now, -3)), kind: 'created', label: 'Booked' },
        {
          at: iso(days(now, -1)),
          kind: 'rescheduled',
          label: 'Moved to tomorrow 08:30 — someone off sick',
        },
      ],
    },
    /*
     * Done, invoiced, and the money has not arrived — the only one of the four
     * payment states the seed could not produce.
     *
     * Every other booking here is either paid at the quote, settled by the
     * plan, or sitting on a draft invoice, so the bookings list could show a
     * "Zahlung" filter with an option that matched nothing in the scenario a
     * reviewer opens on. A filter whose option is always empty reads as a
     * broken filter, not an empty result.
     */
    {
      id: 'bkg_3',
      reference: 'B-1048',
      customerId: 'cus_2',
      propertyId: 'prp_2',
      serviceSlug: 'fensterreinigung',
      start: iso(at(days(now, -6), 13)),
      duration: 120,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'invoiced',
      photoIds: [],
      history: [
        { at: iso(days(now, -13)), kind: 'created', label: 'Booked' },
        { at: iso(days(now, -6)), kind: 'completed', label: 'Job finished' },
        { at: iso(days(now, -5)), kind: 'invoiced', label: 'Invoice sent' },
      ],
    },
    /*
     * sub_1's next visit — the plan case with nothing owed on it.
     *
     * bkg_1 is the same plan and already carries a draft invoice, so before
     * this every scenario built on `baseData` had a plan visit that read as
     * money outstanding and none that read as settled by the monthly charge.
     * That is the whole reason `covered` exists as a state.
     */
    {
      id: 'bkg_4',
      reference: 'B-1049',
      customerId: 'cus_1',
      propertyId: 'prp_1',
      serviceSlug: 'unterhaltsreinigung',
      subscriptionId: 'sub_1',
      start: iso(at(days(now, 8), 9)),
      duration: 300,
      arrivalWindow: 120,
      assigneeId: 'tm_owner',
      status: 'scheduled',
      photoIds: [],
      history: [{ at: iso(days(now, -7)), kind: 'created', label: 'Plan visit scheduled' }],
    },

    /*
     * The other six BookingStatus values.
     *
     * `states` has carried all nine since it was written, and nobody opens
     * `states` — the default scenario is `demo`, and its bookings list was
     * three "Geplant", one "Verrechnet" and one "Storniert". So /admin/buchungen
     * shipped with a status filter whose other six options matched nothing, and
     * the booking screen's approval banner, no-access fee and settled-actions
     * notice could not be looked at without first producing each state by hand.
     *
     * Each one carries the timeline that state implies rather than a bare
     * `created` line: an `awaitingApproval` job with no reported hours in its
     * history asks the owner to approve something with nothing to read, which
     * is the screen showing a state without showing what happened in it.
     *
     * Placed on days `baseData` leaves free, so seeding the lifecycle does not
     * push a day past the two-job ceiling (§1.2) or invent a travel conflict.
     * The exception is `inProgress`, which has to be today to mean anything:
     * it sits in the afternoon, an hour clear of the morning's plan visit, and
     * both are in Küsnacht.
     */
    {
      id: 'bkg_5',
      reference: 'B-1050',
      customerId: 'cus_m3',
      propertyId: 'prp_m3',
      serviceSlug: 'einmalreinigung',
      start: iso(at(openDay(now, 3), 13)),
      duration: 210,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'rescheduled',
      /* The timeline said it moved; nothing said what it moved *from*, so the
         note above the reschedule button had nothing to print. */
      reschedule: { from: iso(at(openDay(now, 1), 9)), at: iso(days(now, -2)) },
      photoIds: [],
      history: [
        { at: iso(days(now, -9)), kind: 'created', label: 'Booked' },
        {
          at: iso(days(now, -2)),
          kind: 'rescheduled',
          label: 'Moved at her request — tradesmen in the house',
        },
      ],
    },
    {
      id: 'bkg_6',
      reference: 'B-1051',
      customerId: 'cus_m9',
      propertyId: 'prp_m9',
      serviceSlug: 'einmalreinigung',
      start: iso(at(days(now, 0), 15)),
      duration: 180,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'inProgress',
      photoIds: [],
      checkInAt: iso(at(days(now, 0), 15, 4)),
      history: [
        { at: iso(days(now, -5)), kind: 'created', label: 'Booked and paid' },
        { at: iso(at(days(now, 0), 15, 4)), kind: 'checkIn', label: 'Checked in' },
      ],
    },
    {
      id: 'bkg_7',
      reference: 'B-1052',
      customerId: 'cus_m6',
      propertyId: 'prp_m6',
      serviceSlug: 'grundreinigung',
      start: iso(at(pastOpenDay(now, -1), 9)),
      duration: 300,
      arrivalWindow: 90,
      assigneeId: 'tm_owner',
      status: 'awaitingApproval',
      photoIds: [],
      checkInAt: iso(at(pastOpenDay(now, -1), 9, 6)),
      checkOutAt: iso(at(pastOpenDay(now, -1), 15, 40)),
      history: [
        { at: iso(days(now, -16)), kind: 'created', label: 'Booked' },
        { at: iso(at(pastOpenDay(now, -1), 9, 6)), kind: 'checkIn', label: 'Checked in' },
        {
          at: iso(at(pastOpenDay(now, -1), 15, 40)),
          kind: 'checkOut',
          /* §5.3 — reported by the person on site, priced by the office. This
             is the sentence the approval button is asking about. */
          label: 'Checked out · +1.5 h reported · garage was agreed on top',
        },
      ],
    },
    {
      id: 'bkg_8',
      reference: 'B-1053',
      customerId: 'cus_m8',
      propertyId: 'prp_m8',
      serviceSlug: 'einmalreinigung',
      start: iso(at(pastOpenDay(now, -4), 10)),
      duration: 180,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'noAccess',
      photoIds: [],
      history: [
        { at: iso(days(now, -12)), kind: 'created', label: 'Booked' },
        {
          at: iso(at(pastOpenDay(now, -4), 10, 22)),
          kind: 'noAccess',
          label: 'No access — waited 20 min, 50% charged',
        },
      ],
    },
    {
      id: 'bkg_9',
      reference: 'B-1054',
      customerId: 'cus_m10',
      propertyId: 'prp_m10',
      serviceSlug: 'fensterreinigung',
      start: iso(at(pastOpenDay(now, -8), 9)),
      duration: 180,
      arrivalWindow: 60,
      assigneeId: 'tm_owner',
      status: 'completed',
      photoIds: [],
      checkInAt: iso(at(pastOpenDay(now, -8), 9, 2)),
      checkOutAt: iso(at(pastOpenDay(now, -8), 12, 10)),
      history: [
        { at: iso(days(now, -19)), kind: 'created', label: 'Booked' },
        { at: iso(at(pastOpenDay(now, -8), 12, 10)), kind: 'checkOut', label: 'Checked out' },
        { at: iso(days(now, -7)), kind: 'approved', label: 'Approved' },
      ],
    },
    {
      id: 'bkg_10',
      reference: 'B-1055',
      customerId: 'cus_m7',
      propertyId: 'prp_m7',
      serviceSlug: 'bueroreinigung',
      /*
       * Was thirty days back, which put the only `closed` job outside the
       * month grid the calendar opens on — so the legend's grey row explained
       * a colour that was nowhere on the screen, and now that the row is also
       * a filter it explained a filter that returned nothing. Thirteen days
       * keeps the story (finished, invoiced, paid, closed) and puts it inside
       * the month you are already looking at.
       */
      start: iso(at(pastOpenDay(now, -13), 8)),
      duration: 360,
      arrivalWindow: 120,
      assigneeId: 'tm_owner',
      status: 'closed',
      photoIds: [],
      history: [
        { at: iso(days(now, -27)), kind: 'created', label: 'Booked' },
        { at: iso(at(pastOpenDay(now, -13), 14)), kind: 'checkOut', label: 'Checked out' },
        { at: iso(days(now, -12)), kind: 'closed', label: 'Closed and paid' },
      ],
    },
  ];

  const subscriptions: Subscription[] = [
    {
      id: 'sub_1',
      reference: 'S-0012',
      customerId: 'cus_1',
      propertyId: 'prp_1',
      planId: 'pln_premium',
      startDate: iso(days(now, -60)),
      endDate: iso(days(now, 305)),
      status: 'active',
      visitsUsed: 8,
      invoiceId: 'inv_plan_1',
      renewalCount: 0,
      history: [
        { at: iso(days(now, -60)), kind: 'started', label: 'Plan started — Premium' },
        { at: iso(days(now, -60)), kind: 'paid', label: 'Paid — RE-0060' },
        { at: iso(days(now, -18)), kind: 'skipped', label: 'Visit skipped' },
      ],
    },
    {
      /*
       * The demo account's own plan.
       *
       * `initialDemo` has always claimed cus_2 is "the only seeded customer
       * with a request, a subscription and an invoice at once", and the
       * subscription was the one part that was not true — the only seeded plan
       * belonged to cus_1. So the plan screen every reviewer opens first showed
       * its empty state.
       */
      id: 'sub_2',
      reference: 'S-0013',
      customerId: 'cus_2',
      propertyId: 'prp_2',
      planId: 'pln_basic',
      startDate: iso(days(now, -400)),
      endDate: iso(days(now, 330)),
      status: 'active',
      visitsUsed: 3,
      invoiceId: 'inv_plan_2',
      /* Bought a second time — this is what the renewal count on screen 70
         reads, and it is why the term runs past the first year's end. */
      renewalCount: 1,
      history: [
        { at: iso(days(now, -400)), kind: 'started', label: 'Plan started — Basic' },
        { at: iso(days(now, -400)), kind: 'paid', label: 'Paid — RE-0058' },
        { at: iso(days(now, -35)), kind: 'renewed', label: 'Renewed for 12 months' },
        { at: iso(days(now, -35)), kind: 'paid', label: 'Paid — RE-0059' },
      ],
    },
    {
      /* The same customer, a different address, a different service — and a
         plan that is no longer on sale. Retiring a product left this year
         alone, which is the whole point of `Plan.active`. */
      id: 'sub_3',
      reference: 'S-0014',
      customerId: 'cus_2',
      propertyId: 'prp_2b',
      planId: 'pln_buero',
      startDate: iso(days(now, -90)),
      endDate: iso(days(now, 275)),
      status: 'active',
      visitsUsed: 11,
      invoiceId: 'inv_plan_3',
      renewalCount: 0,
      history: [
        { at: iso(days(now, -90)), kind: 'started', label: 'Plan started — Office Compact' },
        { at: iso(days(now, -90)), kind: 'paid', label: 'Paid — RE-0061' },
      ],
    },
    /*
     * Two terms about to run out.
     *
     * The start screen's third block is "Abos, die bald auslaufen", and every
     * seeded plan ran for another nine to eleven months — so the block a plan
     * business is supposed to open its morning on showed its empty state in the
     * default scenario, every day, and the number above it was a permanent
     * zero. A package is paid once for a year and the customer has to renew it
     * themselves, so a term ending unnoticed is a customer quietly lost: this
     * is the one block on that screen that costs money when it stays empty by
     * accident.
     *
     * One inside the week and one three weeks out, because the block covers 30
     * days and a single entry could not show that the list is ordered at all.
     */
    {
      id: 'sub_4',
      reference: 'S-0015',
      customerId: 'cus_m1',
      propertyId: 'prp_m1',
      planId: 'pln_premium',
      startDate: iso(days(now, -359)),
      endDate: iso(days(now, 6)),
      status: 'active',
      visitsUsed: 22,
      renewalCount: 0,
      internalNotes: 'Runs out next week. Call before it ends, not after.',
      history: [
        { at: iso(days(now, -359)), kind: 'started', label: 'Plan started — Premium' },
        { at: iso(days(now, -359)), kind: 'paid', label: 'Paid — RE-0051' },
      ],
    },
    {
      id: 'sub_5',
      reference: 'S-0016',
      customerId: 'cus_m5',
      propertyId: 'prp_m5',
      planId: 'pln_basic',
      startDate: iso(days(now, -346)),
      endDate: iso(days(now, 19)),
      status: 'active',
      visitsUsed: 9,
      renewalCount: 1,
      history: [
        { at: iso(days(now, -711)), kind: 'started', label: 'Plan started — Basic' },
        { at: iso(days(now, -346)), kind: 'renewed', label: 'Renewed for 12 months' },
        { at: iso(days(now, -346)), kind: 'paid', label: 'Paid — RE-0052' },
      ],
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
      note: 'Oven — a lot of this is burnt on.',
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
      note: 'Bathroom, grouting.',
      requestId: 'req_1',
      takenAt: iso(days(now, -1)),
    },
    /*
     * Three finished jobs whose customers signed the consent, so /referenzen
     * has something to be.
     *
     * §20.6 has not moved: a photo reaches the public gallery only with
     * recorded written consent, and the two request photos above still do not
     * have it. What changed is that "nobody has ever consented" stopped being
     * the only state the page could be in. It was the launch state and it was
     * also the *permanent* state of the prototype — the grid, the pairing, the
     * expanded view and the dialog were all unreachable without hand-editing
     * the store, so the screen this page exists for had never been looked at
     * by anyone reviewing the build.
     *
     * The empty state stays reachable, and by the control that governs it:
     * a customer turns consent off in /konto/fotos and the work disappears
     * from here. That is the rule working, not a fixture being deleted.
     */
    ...(
      [
        /*
         * One photograph per job, and the same file on both sides of the pair.
         *
         * TODO:asset — real before-and-after pairs replace these. We have three
         * photographs of the right rooms and no second frame of any of them, so
         * the "before" is the same picture carried by `.hv-unclean`: the
         * comparison slider, the drag, the labels and the grid are all real and
         * reviewable, and the only thing standing in is the state of the room.
         * Faking it with an unrelated photograph would be worse — a slider
         * between two different rooms reads as a broken component.
         *
         * The day is the day the job actually ran, not a day near it. A photo
         * dated before its own booking is the kind of detail a reviewer spots.
         */
        ['bkg_3', '/img/service-3.webp', 'Fensterreinigung, Wohnung Meilen', -6],
        ['bkg_9', '/img/service-1.webp', 'Fensterreinigung, Wohnzimmer', -8],
        ['bkg_10', '/img/service-2.webp', 'Office cleaning, reception and kitchen', -13],
      ] as const
    ).flatMap(([bookingId, src, note, daysAgo]) =>
      (['before', 'after'] as const).map((kind) => ({
        id: `pho_${bookingId}_${kind}`,
        src,
        source: 'field' as const,
        kind,
        visibleToCustomer: true,
        publishConsent: true,
        note,
        bookingId,
        takenAt: iso(days(now, daysAgo)),
      })),
    ),
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

  /*
   * §13.2 — a key held permanently for a subscription customer gets its own
   * record: when it was taken, by whom, and where it is kept.
   *
   * Three of the five sit on prp_1, because that is the record screen 67 is
   * linked from everywhere. One key was a card with a single unlabelled line on
   * it, which could not show the difference between "we hold this" and "we gave
   * it back" — the one thing the card is asked. Those three carry a held house
   * key, its spare, and a returned cellar key, so both `KeyStatus` values are
   * on the record a reviewer opens first.
   *
   * The other two are on other addresses, and that is the point of them: with
   * every key on one property the register was a list that answered every
   * question the same way. Nothing could be told apart by customer, the status
   * filter had one row on one side of it, and searching for an address that was
   * not Seestrasse 44 returned nothing — so neither control could be seen
   * working. Five entries across three customers, three held and two returned,
   * is the smallest set where the filter, the search and the customer column
   * each have something to do.
   */
  const keyLog: KeyLogEntry[] = [
    {
      id: 'key_1',
      propertyId: 'prp_1',
      receivedAt: iso(days(now, -58)),
      receivedBy: 'Marco Brunner',
      storageLocation: 'Office key cabinet, slot 3',
      status: 'held',
    },
    {
      id: 'key_2',
      propertyId: 'prp_1',
      receivedAt: iso(days(now, -58)),
      receivedBy: 'Marco Brunner',
      storageLocation: 'Spare key — safe, slot 1',
      status: 'held',
    },
    /* The closed record, carrying the return in full — who handed it over, who
       signed for it, and why only this one went back. A `returned` entry used
       to be a timestamp and nothing else, which meant the reviewer's first look
       at the state showed a card that could not say where the key went. */
    {
      id: 'key_3',
      propertyId: 'prp_1',
      receivedAt: iso(days(now, -120)),
      receivedBy: 'Anna Suter',
      storageLocation: 'Cellar key — office key cabinet, slot 3',
      returnedAt: iso(days(now, -74)),
      returnedBy: 'Anna Suter',
      returnedTo: 'Andrea Keller',
      returnNote: 'The cellar is no longer cleaned — we keep the main key and the spare.',
      status: 'returned',
    },
    /* A commercial address, held on an open contract. The office key is the
       normal case for §13.2 — a business cannot have somebody there to let the
       crew in at six in the morning — and every key in the set being a private
       flat made the register look like a domestic-only arrangement. */
    {
      id: 'key_4',
      propertyId: 'prp_2b',
      receivedAt: iso(days(now, -35)),
      receivedBy: 'Marco Brunner',
      storageLocation: 'Office key cabinet, slot 7',
      status: 'held',
    },
    /* Closed because the contract ended, which is the ordinary way a key goes
       back — not the handover-to-a-third-party case the `states` scenario
       stages. Handed over by somebody other than the person who took it in, so
       «übernommen von» and «zurückgegeben durch» are visibly two fields rather
       than one printed twice. */
    {
      id: 'key_5',
      propertyId: 'prp_4',
      receivedAt: iso(days(now, -210)),
      receivedBy: 'Marco Brunner',
      storageLocation: 'Office key cabinet, slot 9',
      returnedAt: iso(days(now, -12)),
      returnedBy: 'Anna Suter',
      returnedTo: 'James Whitfield',
      returnNote: 'Contract ended at the end of the month, key handed over at reception.',
      status: 'returned',
    },
  ];

  const invoices: Invoice[] = [
    {
      id: 'inv_draft',
      reference: 'RE-2026-0051',
      customerId: 'cus_1',
      bookingId: 'bkg_1',
      lines: [{ label: 'Regular cleaning', quantity: 5, unitPrice: 49 }],
      // §10 — generated automatically after the job, then waits for approval.
      status: 'draft',
      createdAt: iso(days(now, -1)),
      issuedAt: iso(days(now, -1)),
      dueAt: iso(days(now, 29)),
      qrReference: '21 00000 00003 13947 14300 09017',
    },
    {
      id: 'inv_paid',
      reference: 'RE-2026-0048',
      customerId: 'cus_2',
      bookingId: 'bkg_2',
      lines: [{ label: 'One-off cleaning', quantity: 3, unitPrice: 49 }],
      status: 'paid',
      createdAt: iso(days(now, -27)),
      issuedAt: iso(days(now, -26)),
      dueAt: iso(days(now, 4)),
      paidAt: iso(days(now, -19)),
      qrReference: '21 00000 00003 13947 14300 08994',
    },
    {
      id: 'inv_sent',
      reference: 'RE-2026-0049',
      customerId: 'cus_2',
      bookingId: 'bkg_3',
      lines: [{ label: 'Window cleaning', quantity: 2, unitPrice: 49 }],
      status: 'sent',
      createdAt: iso(days(now, -6)),
      issuedAt: iso(days(now, -5)),
      dueAt: iso(days(now, 25)),
      qrReference: '21 00000 00003 13947 14300 09008',
    },
    /* §4.2 charges half a job when nobody lets us in, and B-1053's timeline
       already said so — «20 Min. gewartet, 50% verrechnet». Without the
       invoice behind it that sentence was the only trace of the money: the
       bookings list priced the row off the hourly rate and marked it a
       Schätzung, and the payment column said nobody owed us anything. */
    {
      id: 'inv_noaccess',
      reference: 'RE-2026-0050',
      customerId: 'cus_m8',
      bookingId: 'bkg_8',
      lines: [{ label: 'One-off cleaning — no access (50%)', quantity: 1.5, unitPrice: 49 }],
      status: 'sent',
      createdAt: iso(days(now, -12)),
      issuedAt: iso(days(now, -11)),
      dueAt: iso(days(now, 19)),
      qrReference: '21 00000 00003 13947 14300 09024',
    },
    /* What `closed` means, spelled out. B-1055's timeline says "Abgeschlossen
       und bezahlt"; without the invoice behind it the bookings list would put
       "Nicht bezahlt" on the same row, and one of the two would be lying. */
    {
      id: 'inv_closed',
      reference: 'RE-2026-0047',
      customerId: 'cus_m7',
      bookingId: 'bkg_10',
      lines: [{ label: 'Office cleaning', quantity: 6, unitPrice: 55 }],
      status: 'paid',
      createdAt: iso(days(now, -14)),
      issuedAt: iso(days(now, -13)),
      dueAt: iso(days(now, 17)),
      paidAt: iso(days(now, -12)),
      qrReference: '21 00000 00003 13947 14300 09007',
    },
    /*
     * The four invoices that paid for the seeded plans.
     *
     * A plan is bought outright, so each of these is a single line for the
     * whole term rather than a monthly charge — and each carries the
     * `subscriptionId` that makes "payment history" on screen 70 something
     * that can be read rather than promised. RE-0058 and RE-0059 are the same
     * plan bought twice, which is what its renewal count counts.
     */
    {
      id: 'inv_plan_2',
      reference: 'RE-2025-0058',
      customerId: 'cus_2',
      subscriptionId: 'sub_2',
      lines: [{ label: 'Basic plan — 26 visits, 12 months', quantity: 1, unitPrice: 3440 }],
      status: 'paid',
      createdAt: iso(days(now, -400)),
      issuedAt: iso(days(now, -400)),
      dueAt: iso(days(now, -400)),
      paidAt: iso(days(now, -400)),
      qrReference: '21 00000 00003 13947 14300 09058',
    },
    {
      id: 'inv_plan_2r',
      reference: 'RE-2026-0059',
      customerId: 'cus_2',
      subscriptionId: 'sub_2',
      lines: [{ label: 'Basic plan — renewal, 12 months', quantity: 1, unitPrice: 3440 }],
      status: 'paid',
      createdAt: iso(days(now, -35)),
      issuedAt: iso(days(now, -35)),
      dueAt: iso(days(now, -35)),
      paidAt: iso(days(now, -35)),
      qrReference: '21 00000 00003 13947 14300 09059',
    },
    {
      id: 'inv_plan_1',
      reference: 'RE-2026-0060',
      customerId: 'cus_1',
      subscriptionId: 'sub_1',
      lines: [{ label: 'Premium plan — 52 visits, 12 months', quantity: 1, unitPrice: 6500 }],
      status: 'paid',
      createdAt: iso(days(now, -60)),
      issuedAt: iso(days(now, -60)),
      dueAt: iso(days(now, -60)),
      paidAt: iso(days(now, -60)),
      qrReference: '21 00000 00003 13947 14300 09060',
    },
    {
      id: 'inv_plan_3',
      reference: 'RE-2026-0062',
      customerId: 'cus_2',
      subscriptionId: 'sub_3',
      lines: [
        { label: 'Office Compact plan — 12 visits, 12 months', quantity: 1, unitPrice: 1980 },
      ],
      status: 'paid',
      createdAt: iso(days(now, -90)),
      issuedAt: iso(days(now, -90)),
      dueAt: iso(days(now, -90)),
      paidAt: iso(days(now, -90)),
      qrReference: '21 00000 00003 13947 14300 09062',
    },
  ];

  const changeLog: ChangeLogEntry[] = [
    {
      id: 'chg_1',
      at: iso(days(now, -12)),
      actor: 'Marco Brunner',
      entity: 'Einstellungen',
      entityId: 'settings',
      summary: 'Saturday surcharge raised from 20% to 25%',
    },
    {
      id: 'chg_2',
      at: iso(days(now, -30)),
      actor: 'Marco Brunner',
      entity: 'Leistung',
      entityId: 'svc_grund',
      summary: 'Deep cleaning: minimum duration set to 3 hours',
    },
  ];

  /*
   * Nine conversations, not one.
   *
   * The screen groups by reference, orders by newest message, chips the
   * threads where the customer wrote last, and searches by name or reference —
   * and the seed handed it one thread the office had already closed. The chip,
   * the search box and the sort all rendered against a single row, so none of
   * them could look wrong on screen no matter how wrong they were.
   *
   * What these stage: a first message nobody has answered, a thread that ran
   * to six turns, French alongside English, and subjects that are not all
   * A-… — a job, a quote and an invoice each start conversations of their own,
   * and the customer never restates which one they mean.
   *
   * The French thread stays French on purpose. A customer writes in their own
   * language whatever the office runs in, and cus_3 is seeded `fr` — a seed
   * where every thread is in one language cannot show that the screen copes.
   *
   * Every subject below is a reference that exists elsewhere in this seed. A
   * thread hanging off a reference no screen can open reads fine in the list
   * and dead-ends the moment somebody follows it.
   */
  const hoursAgo = (n: number) => iso(new Date(now.getTime() - n * 3_600_000));

  const messages: CustomerMessage[] = [
    {
      id: 'msg_1',
      customerId: 'cus_2',
      subject: requests[2]!.reference,
      from: 'homivaro',
      body: 'Good afternoon Mr Widmer, thank you for your enquiry. You will find the quote in your account. If anything is unclear, write to me directly.',
      at: iso(days(now, -3)),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_2',
      customerId: 'cus_2',
      subject: requests[2]!.reference,
      from: 'customer',
      body: 'Thanks — does an hour later work for the appointment as well?',
      at: iso(days(now, -2)),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_3',
      customerId: 'cus_2',
      subject: requests[2]!.reference,
      from: 'homivaro',
      body: 'Yes, that works. I have moved the appointment to 09:00 and updated the confirmation.',
      at: iso(days(now, -2)),
      readByCustomer: false,
      readByAdmin: true,
    },

    /*
     * The notice B-1044's move sent.
     *
     * Unread on purpose: it is what puts a number on the bell in the account
     * shell, which is the whole of "the customer was told" in this prototype.
     * Keyed by the booking reference, so it lands in that job's thread rather
     * than in the request thread above.
     */
    {
      id: 'msg_moved_1044',
      customerId: 'cus_2',
      subject: 'B-1044',
      from: 'homivaro',
      body: 'Good morning Mr Widmer\n\nwe have had to move your job — instead of today at 08:30 we will now come tomorrow at 08:30. A colleague is off sick.\n\nIf the new time does not suit you, just reply here.\n\nKind regards\nHomivaro',
      at: iso(days(now, -1)),
      readByCustomer: false,
      readByAdmin: true,
    },

    /* The demo account writes about more than its open request. Two threads on
       one customer is what proves the list groups by reference — grouped by
       person, these two would fold into each other. */
    {
      id: 'msg_inv_1',
      customerId: 'cus_2',
      subject: 'RE-2026-0048',
      from: 'customer',
      body: 'Could you send me this invoice again? I cannot find it in my mail any more.',
      at: hoursAgo(196),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_inv_2',
      customerId: 'cus_2',
      subject: 'RE-2026-0048',
      from: 'homivaro',
      body: 'Of course. It is also in your account under «Invoices» — you can download it as a PDF there at any time.',
      at: hoursAgo(194),
      readByCustomer: true,
      readByAdmin: true,
    },

    /* Unanswered, three hours old, in English. The most useful thing this
       screen can show its owner is a question nobody has replied to yet, and
       the seed had not one. */
    {
      id: 'msg_en_1',
      customerId: 'cus_4',
      subject: 'A-2482',
      from: 'customer',
      body: 'One more thing on the office request: the invoice has to go to Whitfield & Partners, not to me personally. Is that a problem?',
      at: hoursAgo(3),
      readByCustomer: true,
      readByAdmin: false,
    },

    /* The quote ran out before the handover did, and req_1 is `expired` — the
       one thread where the answer is a new quote rather than a reply. */
    {
      id: 'msg_fr_1',
      customerId: 'cus_3',
      subject: 'A-2481',
      from: 'homivaro',
      body: 'Bonjour Madame Marchand\n\nvotre offre pour le nettoyage de fin de bail se trouve dans votre compte. Elle est valable quatorze jours.\n\nCordialement\nMarco Brunner',
      at: iso(days(now, -20)),
      readByCustomer: true,
      readByAdmin: true,
      attachments: [
        { id: 'att_off_2481', name: 'Quote-A-2481.pdf', kind: 'document', size: 214_000 },
      ],
    },
    {
      id: 'msg_fr_2',
      customerId: 'cus_3',
      subject: 'A-2481',
      from: 'customer',
      body: 'L’offre a expiré et la remise des clés est dans neuf jours. Pouvez-vous la refaire ? Le four reste le point critique.',
      at: hoursAgo(5),
      readByCustomer: true,
      readByAdmin: false,
    },

    /* Six turns on one job. Every other thread here is two or three, and a
       transcript that never gets long is one whose scrolling, spacing and
       speaker alternation nobody has actually looked at. */
    {
      id: 'msg_abo_1',
      customerId: 'cus_1',
      subject: 'B-1043',
      from: 'customer',
      body: 'Hello, I have changed the code on the key safe. Nala is at home as always.',
      at: hoursAgo(148),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_abo_2',
      customerId: 'cus_1',
      subject: 'B-1043',
      from: 'homivaro',
      body: 'Thanks for letting us know — please do not put the code here, but in your account under «Property». It is masked there and only the team sees it.',
      at: hoursAgo(146),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_abo_3',
      customerId: 'cus_1',
      subject: 'B-1043',
      from: 'customer',
      body: 'Done. And one more thing: could you do the conservatory windows next time?',
      at: hoursAgo(101),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_abo_4',
      customerId: 'cus_1',
      subject: 'B-1043',
      from: 'homivaro',
      body: 'Window cleaning is not included in the plan, I would have to quote for it separately. Shall I?',
      at: hoursAgo(99),
      readByCustomer: true,
      readByAdmin: true,
      attachments: [
        { id: 'att_fenster', name: 'Preisliste-Fensterreinigung.pdf', kind: 'document', size: 96_400 },
      ],
    },
    {
      id: 'msg_abo_5',
      customerId: 'cus_1',
      subject: 'B-1043',
      from: 'customer',
      body: 'Yes please — but not until spring.',
      at: hoursAgo(74),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_abo_6',
      customerId: 'cus_1',
      subject: 'B-1043',
      from: 'homivaro',
      body: 'Noted, I will come back to you in March. The plan visit stays as scheduled.',
      at: hoursAgo(72),
      readByCustomer: true,
      readByAdmin: true,
    },

    /* The declined card, from the customer's side. `pay_failed` sits in the
       seed already and the person behind it had no way to say anything about
       it — which is exactly when somebody writes instead of trying a third
       time. */
    {
      id: 'msg_pay_1',
      customerId: 'cus_m5',
      subject: 'O-2494-1',
      from: 'homivaro',
      body: 'Good morning Ms Meier\n\nthe quote for the move-out clean is on its way. As soon as the payment goes through we will hold the date.\n\nKind regards\nMarco Brunner',
      at: iso(days(now, -3)),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_pay_2',
      customerId: 'cus_m5',
      subject: 'O-2494-1',
      from: 'customer',
      body: 'The card was declined twice and the bank says it is not their end. Would an invoice work instead?',
      at: hoursAgo(20),
      readByCustomer: true,
      readByAdmin: true,
      attachments: [
        { id: 'att_bank', name: 'Bank-Ablehnung.png', kind: 'image', size: 512_300 },
      ],
    },

    /* Waiting on us, with the customer's own deadline in it. The chip says a
       reply is owed; only the message says by when. */
    {
      id: 'msg_rev_1',
      customerId: 'cus_m2',
      subject: 'A-2495',
      from: 'homivaro',
      body: 'Good morning Mr Schoch, your change has come through. I will take the windows out and send the new quote.',
      at: iso(days(now, -4)),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_rev_2',
      customerId: 'cus_m2',
      subject: 'A-2495',
      from: 'customer',
      body: 'Is there any news on this yet? I have to confirm with the management by Friday.',
      at: hoursAgo(30),
      readByCustomer: true,
      readByAdmin: false,
    },

    /* An office, asking the one thing offices ask. Answered, so it carries no
       chip — the list needs both kinds to show the chip means anything. */
    {
      id: 'msg_buero_1',
      customerId: 'cus_m7',
      subject: 'A-2502',
      from: 'customer',
      body: 'There is nobody in the building after 18:00. Can the cleaning be done after hours?',
      at: hoursAgo(70),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_buero_2',
      customerId: 'cus_m7',
      subject: 'A-2502',
      from: 'homivaro',
      body: 'Yes, we clean offices in the evening regularly. I have set the proposed times accordingly.',
      at: hoursAgo(68),
      readByCustomer: true,
      readByAdmin: true,
    },

    /* The refunded booking, in English. `bkg_off_refund` was cancelled and
       paid back in the seed with nothing anywhere saying why. */
    {
      id: 'msg_ref_1',
      customerId: 'cus_m11',
      subject: 'B-1047',
      from: 'customer',
      body: 'We have to cancel the clean — the office move got pushed back a month. Can we have the payment returned?',
      at: hoursAgo(96),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_ref_2',
      customerId: 'cus_m11',
      subject: 'B-1047',
      from: 'homivaro',
      body: 'Done — the full amount is on its way back to the card you paid with, it takes two to three working days. Just write when the new date is set.',
      at: hoursAgo(94),
      readByCustomer: true,
      readByAdmin: true,
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
    queueRequest(now, { id: 'req_q_draft', ref: 'A-2490', n: 3, service: 'einmalreinigung', status: 'draft', agedHours: 30, note: undefined, internal: 'Called, floor area still unclear. Call back agreed.' }),
    queueRequest(now, { id: 'req_q_new1', ref: 'A-2491', n: 1, service: 'unterhaltsreinigung', status: 'new', agedHours: 5, intent: 'pln_basic' }),
    queueRequest(now, { id: 'req_q_new2', ref: 'A-2492', n: 8, service: 'fensterreinigung', status: 'new', agedHours: 20, preferredInDays: 9 }),
    /* One day past the promise — the row the red deadline state exists for. */
    queueRequest(now, { id: 'req_q_late', ref: 'A-2493', n: 6, service: 'grundreinigung', status: 'inReview', agedHours: 52 }),
    queueRequest(now, { id: 'req_q_offer', ref: 'A-2494', n: 5, service: 'umzugsreinigung', status: 'offerSent', agedDays: 3, preferredInDays: 12 }),
    queueRequest(now, { id: 'req_q_revision', ref: 'A-2495', n: 2, service: 'grundreinigung', status: 'revisionRequested', agedDays: 5, note: 'Could you take the windows out of the price?' }),
    queueRequest(now, { id: 'req_q_accepted', ref: 'A-2496', n: 9, service: 'einmalreinigung', status: 'accepted', agedDays: 12 }),
    queueRequest(now, { id: 'req_q_rejected', ref: 'A-2497', n: 12, service: 'einmalreinigung', status: 'rejected', agedDays: 8, internal: 'Declined: a Sunday was the only date possible, and we do not work Sundays.' }),
    queueRequest(now, { id: 'req_q_expired', ref: 'A-2498', n: 10, service: 'fensterreinigung', status: 'expired', agedDays: 38 }),
    queueRequest(now, { id: 'req_q_cancel', ref: 'A-2499', n: 4, service: 'bueroreinigung', status: 'cancelledByCustomer', agedDays: 6, internal: 'Withdrawn: solved internally.' }),
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
    queueRequest(now, { id: 'req_q_propose', ref: 'A-2501', n: 8, service: 'fensterreinigung', status: 'offerSent', agedDays: 2, note: 'First job — please do the blind boxes too.' }),
    queueRequest(now, { id: 'req_q_confirm', ref: 'A-2502', n: 7, service: 'bueroreinigung', status: 'offerSent', agedDays: 4 }),
    queueRequest(now, { id: 'req_q_recurring', ref: 'A-2503', n: 6, service: 'unterhaltsreinigung', status: 'offerSent', agedDays: 3, intent: 'pln_premium' }),
    queueRequest(now, { id: 'req_q_refund', ref: 'A-2504', n: 11, service: 'bueroreinigung', status: 'accepted', agedDays: 16, internal: 'Appointment cancelled, amount refunded.' }),
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
      customerNote: 'The windows on the lake side, before the weekend if possible.',
      status: 'offerSent',
      createdAt: iso(days(now, -2)),
      openedAt: iso(days(now, -2)),
      respondedAt: iso(days(now, -1)),
    },
    /*
     * cus_1 on prp_1 with unterhaltsreinigung — the exact three fields sub_1
     * matches on, so this quote comes out covered by the running plan.
     *
     * It is here because the quote detail draws a different card per coverage
     * kind, and the plan card had nowhere to be seen: the only plan-covered
     * quote in the whole seed lived in `states`, which is not the scenario
     * anyone opens the panel on.
     */
    {
      id: 'req_q_plan',
      reference: 'A-2506',
      customerId: 'cus_1',
      propertyId: 'prp_1',
      serviceSlug: 'unterhaltsreinigung',
      addOnIds: [],
      preferred: { flexible: true },
      photoIds: [],
      customerNote: 'The cellar as well this time, if there is time for it.',
      status: 'offerSent',
      createdAt: iso(days(now, -1)),
      openedAt: iso(days(now, -1)),
      respondedAt: iso(days(now, -1)),
      planIntent: 'pln_premium',
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
    /* Covered by the plan rather than the balance: nothing to charge, and the
       detail says which plan and how many skips are left on it. */
    quoteFor('off_plan', 'req_q_plan', { issuedDaysAgo: 1, validDays: 14 }),
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
      history: [{ at: iso(days(now, -10)), kind: 'created', label: 'Booked and paid' }],
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
        { at: iso(days(now, -14)), kind: 'created', label: 'Booked and paid' },
        { at: iso(days(now, -4)), kind: 'cancelled', label: 'Cancelled by the customer' },
        { at: iso(days(now, -4)), kind: 'refunded', label: 'Full amount refunded' },
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
    /* What actually settled each plan invoice. Without these the payment
       history on screen 70 could say when a plan was paid but not how, which
       is the one thing the office is asked on the phone. */
    {
      id: 'pay_plan_2',
      invoiceId: 'inv_plan_2',
      amount: 3440,
      method: 'card',
      at: iso(days(now, -400)),
      status: 'succeeded',
      gatewayRef: 'mock_CD058',
    },
    {
      id: 'pay_plan_2r',
      invoiceId: 'inv_plan_2r',
      amount: 3440,
      method: 'card',
      at: iso(days(now, -35)),
      status: 'succeeded',
      gatewayRef: 'mock_CD059',
    },
    {
      id: 'pay_plan_1',
      invoiceId: 'inv_plan_1',
      amount: 6500,
      method: 'twint',
      at: iso(days(now, -60)),
      status: 'succeeded',
      gatewayRef: 'mock_TW060',
    },
    {
      id: 'pay_plan_3',
      invoiceId: 'inv_plan_3',
      amount: 1980,
      method: 'qr-bill',
      at: iso(days(now, -90)),
      status: 'succeeded',
      gatewayRef: 'mock_QR062',
    },
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
    /*
     * The one payment in the seed that settles an *invoice* rather than a
     * quote. `inv_paid` said `paid` and carried nothing to say how, which was
     * fine while nothing rendered it and wrong the moment the customer record
     * grew a "Zahlweg" column — a paid invoice was reporting itself as open.
     *
     * QR-bill, because §10 puts one on every invoice and the bank transfer is
     * how a Swiss invoice comes back. The card on file pays the plan.
     */
    {
      id: 'pay_inv_paid',
      invoiceId: 'inv_paid',
      amount: 3 * 49,
      method: 'qr-bill',
      at: iso(days(now, -19)),
      status: 'succeeded',
      gatewayRef: 'qr_2100000000313947143000899',
    },
    /* The money behind RE-2026-0047. `test:crm` refuses a paid invoice with no
       payment under it, and it is right to: an invoice that says `paid` with
       nothing recording how is the customer record reporting its own state
       instead of what happened. */
    {
      id: 'pay_inv_closed',
      invoiceId: 'inv_closed',
      amount: 6 * 55,
      method: 'qr-bill',
      at: iso(days(now, -29)),
      status: 'succeeded',
      gatewayRef: 'qr_2100000000313947143000907',
    },
  ];

  /*
   * The calls.
   *
   * Two of the request records in this seed carry "Rückruf zugesagt" in an
   * internal note — a promise with no date on it, in a field no screen sorts
   * by. Those two are the reason this entity exists, so the seed now keeps the
   * promise somewhere it can be seen: `cev_draft` is the callback for the
   * half-taken call in `req_q_draft`, and `cev_converted` is the one that
   * already turned into work.
   */
  const events: CalendarEvent[] = [
    calendarEvent(now, {
      id: 'cev_today',
      ref: 'K-400',
      kind: 'contact-call',
      title: 'Call back about the ground-floor price',
      inDays: 0,
      hour: 11,
      customerId: 'cus_m3',
      note: 'Wanted the price for the ground floor. Floor area was still unclear on the phone.',
      createdDaysAgo: 1,
    }),
    calendarEvent(now, {
      id: 'cev_draft',
      ref: 'K-401',
      kind: 'follow-up',
      title: 'Ask for the floor area — draft A-2490',
      inDays: 1,
      hour: 9,
      duration: 15,
      customerId: 'cus_m3',
      note: 'The draft is in the queue, only the floor area is missing.',
    }),
    /* A first job is worth looking at before it is priced. The only kind that
       blocks a slot — see `occupiesSlot`. */
    calendarEvent(now, {
      id: 'cev_viewing',
      ref: 'K-402',
      kind: 'viewing',
      title: 'Viewing before the quote',
      inDays: 2,
      hour: 16,
      duration: 45,
      customerId: 'cus_m8',
      propertyId: 'prp_m8',
      note: 'Look at the blind boxes before the quote goes out.',
    }),
    /* The deal path, already walked. Without one seeded record carrying it,
       `inProgress` would be a state only reachable by doing the whole flow. */
    calendarEvent(now, {
      id: 'cev_converted',
      ref: 'K-403',
      kind: 'contact-call',
      title: 'Call about a move-out clean',
      inDays: -3,
      hour: 10,
      status: 'inProgress',
      customerId: 'cus_m5',
      outcome: 'Moving out at the end of the month, 4.5-room flat. Quote promised.',
      requestId: 'req_q_offer',
      createdDaysAgo: 7,
    }),
    /*
     * `done` and `cancelled` had no seeded record between them.
     *
     * Both are rows in the legend, and the legend is a filter now — so two of
     * its ten rows explained a colour the calendar never drew and, clicked,
     * emptied the screen. A state the seed cannot produce is a state nobody
     * reviews.
     */
    calendarEvent(now, {
      id: 'cev_done',
      ref: 'K-405',
      kind: 'contact-call',
      title: 'Call back about a kitchen deep clean',
      inDays: -2,
      hour: 15,
      status: 'done',
      customerId: 'cus_m6',
      outcome: 'Everything discussed, she will get in touch herself after the holidays.',
      createdDaysAgo: 6,
    }),
    calendarEvent(now, {
      id: 'cev_cancelled',
      ref: 'K-406',
      kind: 'viewing',
      title: 'Viewing, penthouse flat',
      inDays: -5,
      hour: 10,
      duration: 45,
      status: 'cancelled',
      customerId: 'cus_m11',
      note: 'Cancelled at short notice — the flat is not empty yet after all.',
      createdDaysAgo: 12,
    }),
    calendarEvent(now, {
      id: 'cev_noreply',
      ref: 'K-404',
      kind: 'follow-up',
      title: 'Follow up quote A-2494',
      inDays: -1,
      hour: 14,
      status: 'pending',
      customerId: 'cus_m5',
      note: 'Second attempt. In writing after that.',
    }),
  ];

  return {
    ...EMPTY,
    customers: [...customers, ...extraCustomers(now)],
    properties: [...properties, ...extraProperties()],
    requests: [...queue, ...quoteRequests, ...requests],
    offers: [...offers, ...quoteOffers],
    bookings: [...bookings, ...quoteBookings],
    events,
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
        expiresAt: '09/28',
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
      /*
       * cus_1 had nothing on file, and she is the one customer in the seed on
       * a *plan* — §11.2 charges a plan to a card every month, so the empty
       * state on her record was claiming a year's subscription was being
       * collected from no instrument at all. The screen that answers "what do
       * we have saved for this person" opened on «Nichts hinterlegt» for the
       * only person it certainly had something for.
       */
      {
        id: 'pm_card_1',
        customerId: 'cus_1',
        kind: 'card' as const,
        label: 'Mastercard · 5410',
        /* Runs out inside the plan's term. The office finding that out from
           the record beats finding it out from a declined charge. */
        expiresAt: '02/27',
        isDefault: true,
        addedAt: iso(days(now, -400)),
      },
      {
        id: 'pm_twint_1',
        customerId: 'cus_1',
        kind: 'twint' as const,
        label: 'TWINT · 076 ··· 12',
        isDefault: false,
        addedAt: iso(days(now, -95)),
      },
      /* Apple Pay exists in the union and appeared on no record, so the row it
         draws — and the icon it shares with TWINT — had never been looked at. */
      {
        id: 'pm_apple_m9',
        customerId: 'cus_m9',
        kind: 'apple-pay' as const,
        label: 'Apple Pay · iPhone',
        isDefault: true,
        addedAt: iso(days(now, -18)),
      },
    ],
    keyLog,
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
      'Hello\n\nthank you for your enquiry. Our quote is below, broken down line by line. The amount is binding; surcharges and travel are shown separately where they apply.\n\nPick a free date and we will confirm it straight away.\n\nKind regards\nMarco Brunner',
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
        reason: 'Company holidays',
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
      internalNotes: 'Phone call on the 12th: can start straight away, looking for 60–80%.',
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
        { name: 'Mr Bühler', company: 'Bühler Building Services', phone: '+41 79 000 00 15' },
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
        'I have been assembling furniture on the side for four years and am looking for regular work in the area.',
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
      motivation: 'I am looking to return to work and like working independently.',
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
  unterhaltsreinigung: 'Every two weeks would be ideal, mornings preferably.',
  einmalreinigung: 'One proper clean through, then we will see.',
  grundreinigung: 'It has not been done in a long time — the kitchen and the bathroom are the issue.',
  umzugsreinigung: 'The handover is coming up and the management is exacting.',
  fensterreinigung: 'Sprossenfenster, teilweise schwer erreichbar.',
  bueroreinigung: 'After office hours, from 18:00. Invoice to the company.',
  moebelmontage: 'New furniture delivered, still needs assembling.',
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
    /* Was 8004 Zürich, staging the out-of-area chip on the queue. The area is
       a gate now, so that household could not have a request at all — and the
       row it was there to fill still has to exist, which is why it moved into
       the eight rather than being deleted. */
  { n: 12, first: 'Sandra', last: 'Kunz', lang: 'de', phone: '+41 44 261 55 09', since: 21, street: 'Seehaldenstrasse 12', postcode: '8132', city: 'Egg', kind: 'apartment', area: 64, rooms: 2.5, baths: 1, floor: 3, lift: false, effort: true },
];

const extraCustomers = (now: Date): Customer[] =>
  EXTRA_PEOPLE.map((p) => person(`cus_m${p.n}`, p.first, p.last, p.lang, now, p.since, p.phone));

const extraProperties = (): Property[] =>
  EXTRA_PEOPLE.map((p) => ({
    id: `prp_m${p.n}`,
    customerId: `cus_m${p.n}`,
    label: p.kind === 'office' ? 'Office' : p.kind === 'house' ? 'House' : 'Flat',
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
            boxLocation: 'Next to the front door',
            boxCode: `${4000 + p.n * 7}`,
            keyReturnLocation: 'Back into the box',
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
    intent?: ID;
    preferredInDays?: number;
  },
): ServiceRequest {
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
    createdAt,
    openedAt: read ? createdAt : undefined,
    respondedAt: read && input.agedDays != null ? iso(days(now, -Math.max(1, input.agedDays - 1))) : undefined,
    planIntent: input.intent,
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
      internalNotes: 'Account closed by the customer — moved away, no property left in the area.',
    },
  ];

  const properties: Property[] = [
    ...data.properties,
    {
      id: 'prp_5',
      customerId: 'cus_5',
      label: 'Terraced house',
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
        keyLocation: 'Key safe at the garden gate',
        keyReturnLocation: 'Back into the safe',
      },
    },
    {
      id: 'prp_6',
      customerId: 'cus_6',
      /* Was Langstrasse 140, 8004 Zürich — deliberately outside the eight, to
         give `req_s_rejected` an out-of-area reason. The area is refused at
         intake now, so a request against this address could not exist and the
         matrix would have been staging an impossible row. */
      label: 'Meilen flat',
      street: 'Dorfstrasse 24',
      postcode: '8706',
      city: 'Meilen',
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
      internalNote: 'Called on Tuesday, wanted a price for the ground floor. Call back promised.',
      /* No openedAt: a draft has not arrived, so no clock has started. The
         deadline column has to print "—" here, not a breach. */
      status: 'draft',
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
      customerNote: 'The flat was let for a long time and is fairly worn.',
      status: 'new',
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
      createdAt: iso(days(now, -3)),
      openedAt: iso(days(now, -3)),
      respondedAt: iso(days(now, -3)),
      planIntent: 'pln_basic', // "plan wanted" in the type column
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
      customerNote: 'Could you take the windows out of the price? The rest is fine.',
      status: 'revisionRequested',
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
      internalNote: 'Declined: no capacity left this week.',
      status: 'rejected',
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
      internalNote: 'Withdrawn by the customer: solved another way.',
      status: 'cancelledByCustomer',
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
      internalNote: 'Cancelled by us: property sold, handover called off.',
      status: 'cancelledByCompany',
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
  const matrixPayments: Payment[] = [];

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
            ? 'Called, the details are still incomplete. Call back promised.'
            : status === 'rejected'
              ? 'Declined: does not fit the route.'
              : status === 'cancelledByCustomer'
                ? 'Withdrawn by the customer.'
                : status === 'cancelledByCompany'
                  ? 'Storniert durch uns.'
                  : undefined,
        status,
        createdAt,
        openedAt,
        respondedAt: settled ? iso(days(now, -Math.max(1, settledDays - 1))) : undefined,
        /* Regular cleaning is the plan service, so that is where an intent
           belongs — it drives the "plan wanted" value in the type column. */
        planIntent: slug === 'unterhaltsreinigung' ? 'pln_basic' : undefined,
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
            { at: iso(days(now, -settledDays)), kind: 'created', label: 'Booked' },
            ...(bookingStatus === 'awaitingApproval'
              ? [
                  {
                    at: iso(at(start, 13, 30)),
                    kind: 'checkOut',
                    label: 'Checked out · +1 h reported',
                  },
                ]
              : []),
          ],
        });

        /* Only the two states that mean money has been billed. A `completed`
           job is billable and deliberately has no invoice yet — that is the
           row the invoice screen's create action exists for. */
        if (bookingStatus === 'invoiced' || bookingStatus === 'closed') {
          const invoiceId = `inv_m_${SHORT[slug]}`;
          const amount = (3 + si) * SEED_SETTINGS.hourlyRate;
          matrixInvoices.push({
            id: invoiceId,
            reference: `RE-2026-01${String(si + 10).padStart(2, '0')}`,
            customerId: request.customerId,
            bookingId,
            lines: [{ label: 'Cleaning', quantity: 3 + si, unitPrice: SEED_SETTINGS.hourlyRate }],
            status: bookingStatus === 'closed' ? 'paid' : 'sent',
            createdAt: iso(days(now, -(si + 2))),
            issuedAt: iso(days(now, -(si + 1))),
            dueAt: iso(days(now, 29 - si)),
            paidAt: bookingStatus === 'closed' ? iso(days(now, -si)) : undefined,
            qrReference: `21 00000 00003 13947 14300 09${String(200 + seq)}`,
          });

          /*
           * A paid invoice with no payment behind it reads as unpaid on any
           * screen that prints how it was settled — and this is the scenario
           * whose entire promise is that every declared value has a record
           * carrying it. Rotating the three routes an invoice can actually
           * come back by is what puts `qr-bill` and `cash` on screen at all.
           */
          if (bookingStatus === 'closed') {
            matrixPayments.push({
              id: `pay_${invoiceId}`,
              invoiceId,
              amount,
              /* QR-bill flat rather than rotated. §10 puts a slip on every
                 invoice, so it is the honest default for a generated row —
                 the other two routes are carried by the hand-written records
                 below, where the story behind each one is visible. */
              method: 'qr-bill',
              at: iso(days(now, -si)),
              status: 'succeeded',
              gatewayRef: `manual_RE-2026-01${String(si + 10).padStart(2, '0')}`,
            });
          }
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
    /* The only seeded quote carrying a `revisionNote`. Without it the
       "Änderungswunsch" card on the quote detail has no way in, and the field
       would be one more declared state no screen can show. */
    {
      ...makeOffer('off_s_revision', find('req_s_revision'), prop('prp_2'), now, {
        issuedDaysAgo: 4,
        validDays: 14,
        status: 'revisionRequested',
        reference: 'O-2607-1',
      }),
      revisionNote:
        'Scope: could you take the windows out of the price? The rest is fine as it is, we would like to book this week.',
    },
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
        { at: iso(days(now, -6)), kind: 'created', label: 'Booked' },
        { at: iso(days(now, -1)), kind: 'rescheduled', label: 'Moved at his request' },
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
        { at: iso(days(now, -5)), kind: 'created', label: 'Booked' },
        { at: iso(at(days(now, 0), 8, 5)), kind: 'checkIn', label: 'Checked in' },
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
        { at: iso(days(now, -8)), kind: 'created', label: 'Booked' },
        { at: iso(at(days(now, -1), 9, 3)), kind: 'checkIn', label: 'Checked in' },
        {
          at: iso(at(days(now, -1), 15, 20)),
          kind: 'checkOut',
          /* §5.3 — reported by the person on site, priced by the office. This
             is the sentence the approval button is asking about. */
          label: 'Checked out · +1.5 h reported · cellar was agreed on top',
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
        { at: iso(days(now, -11)), kind: 'created', label: 'Booked' },
        {
          at: iso(at(days(now, -3), 10, 25)),
          kind: 'noAccess',
          label: 'No access — waited 20 min, 50% charged',
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
        { at: iso(days(now, -12)), kind: 'created', label: 'Booked' },
        { at: iso(at(days(now, -6), 13, 10)), kind: 'checkOut', label: 'Checked out' },
        { at: iso(days(now, -5)), kind: 'approved', label: 'Approved' },
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
      history: [{ at: iso(days(now, -20)), kind: 'checkOut', label: 'Checked out' }],
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
      history: [{ at: iso(days(now, -47)), kind: 'closed', label: 'Closed and paid' }],
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
        { at: iso(days(now, -10)), kind: 'created', label: 'Booked' },
        { at: iso(days(now, -2)), kind: 'cancelled', label: 'Cancelled — property sold' },
      ],
    },
  ];

  /* All four SubscriptionStatus values. `paused`, `expired` and `cancelled`
     are all reachable from a screen now — this set exists so a reviewer can
     open each without first having to produce it. */
  const subscriptions: Subscription[] = [
    ...data.subscriptions,
    {
      id: 'sub_s_paused',
      reference: 'S-0022',
      customerId: 'cus_5',
      propertyId: 'prp_5',
      planId: 'pln_basic',
      startDate: iso(days(now, -120)),
      endDate: iso(days(now, 245)),
      status: 'paused',
      visitsUsed: 6,
      renewalCount: 0,
      history: [
        { at: iso(days(now, -120)), kind: 'started', label: 'Plan started — Basic' },
        { at: iso(days(now, -9)), kind: 'paused', label: 'Plan paused' },
      ],
    },
    {
      /* Ran its full year out with visits still on it. The screen has to say
         so plainly — eleven unused visits is the number an argument starts
         over, and hiding it does not make it go away. */
      id: 'sub_s_expired',
      reference: 'S-0023',
      customerId: 'cus_3',
      propertyId: 'prp_3',
      planId: 'pln_vip',
      startDate: iso(days(now, -400)),
      endDate: iso(days(now, -35)),
      status: 'expired',
      visitsUsed: 93,
      renewalCount: 0,
      history: [
        { at: iso(days(now, -400)), kind: 'started', label: 'Plan started — VIP' },
        { at: iso(days(now, -35)), kind: 'expired', label: 'Term expired' },
      ],
    },
    {
      /* Cancelled inside the window and refunded — the exit the office is
         allowed to take, and the only one that returns money. */
      id: 'sub_s_cancelled',
      reference: 'S-0024',
      customerId: 'cus_6',
      propertyId: 'prp_6',
      planId: 'pln_basic',
      startDate: iso(days(now, -20)),
      endDate: iso(days(now, 345)),
      status: 'cancelled',
      visitsUsed: 0,
      renewalCount: 0,
      cancelledAt: iso(days(now, -12)),
      history: [
        { at: iso(days(now, -20)), kind: 'started', label: 'Plan started — Basic' },
        { at: iso(days(now, -12)), kind: 'cancelled', label: 'Cancelled and refunded' },
      ],
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
      lines: [{ label: 'One-off cleaning', quantity: 4, unitPrice: 49 }],
      status: 'sent',
      createdAt: iso(days(now, -5)),
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
        { label: 'Deep cleaning', quantity: 5, unitPrice: 49 },
        { label: 'Oven cleaning', quantity: 1, unitPrice: 45 },
      ],
      status: 'overdue',
      createdAt: iso(days(now, -53)),
      issuedAt: iso(days(now, -52)),
      dueAt: iso(days(now, -22)),
      qrReference: '21 00000 00003 13947 14300 09088',
    },
    {
      id: 'inv_s_cancelled',
      reference: 'RE-2026-0058',
      customerId: 'cus_3',
      bookingId: 'bkg_s_cancelled',
      lines: [{ label: 'Move-out cleaning', quantity: 6, unitPrice: 49 }],
      status: 'cancelled',
      createdAt: iso(days(now, -15)),
      issuedAt: iso(days(now, -14)),
      dueAt: iso(days(now, 16)),
      cancelReason: 'Job cancelled — property sold, never carried out.',
      qrReference: '21 00000 00003 13947 14300 09104',
    },
    /*
     * `bkg_s_closed` had none, and `closed` is the status `markInvoicePaid`
     * writes on a booking whose invoice has been settled — so the one booking
     * in this scenario claiming to be paid for had nothing that was paid.
     */
    {
      id: 'inv_s_paid_cash',
      /* Not 0044. `inv_1` in the `overdue` scenario already wears that number,
         and a follow-up event there names it out loud — "Rechnung RE-2026-0044
         — zweite Mahnung besprechen". Two invoices behind one reference is not
         a crash: it is a reminder about a bill that was paid in cash, which
         only ever goes wrong on the phone. */
      reference: 'RE-2026-0041',
      customerId: 'cus_3',
      bookingId: 'bkg_s_closed',
      lines: [{ label: 'Move-out cleaning', quantity: 6, unitPrice: 49 }],
      status: 'paid',
      createdAt: iso(days(now, -48)),
      issuedAt: iso(days(now, -47)),
      dueAt: iso(days(now, -17)),
      paidAt: iso(days(now, -47)),
      qrReference: '21 00000 00003 13947 14300 09077',
    },
  ];

  /*
   * Paid at the door on the day, which is the case the QR-bill never covers
   * and the one an owner most wants written down — "did they pay you or is it
   * still out?" is the question a slip answers by existing and cash does not.
   */
  const statePayments: Payment[] = [
    {
      id: 'pay_s_cash',
      invoiceId: 'inv_s_paid_cash',
      amount: 6 * 49,
      method: 'cash',
      at: iso(days(now, -47)),
      status: 'succeeded',
      gatewayRef: 'manual_RE-2026-0041',
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
      text: 'Very thorough, and everything we agreed was exactly right.',
      status: 'published',
      submittedAt: iso(days(now, -5)),
      ownerReply: 'Thank you, Ms Keller — until next time.',
      publishConsent: true,
    },
    {
      id: 'rev_s_pending',
      bookingId: 'bkg_s_invoiced',
      customerId: 'cus_2',
      rating: 3,
      text: 'Good work, but they arrived almost an hour later than announced.',
      status: 'pending',
      submittedAt: iso(days(now, -2)),
      publishConsent: true,
    },
    {
      id: 'rev_s_rejected',
      bookingId: 'bkg_s_noaccess',
      customerId: 'cus_6',
      rating: 1,
      text: 'Nobody turned up and we were charged anyway.',
      status: 'rejected',
      submittedAt: iso(days(now, -3)),
      ownerReply:
        'The appointment was confirmed, nobody was there for 20 minutes, and that is documented with a photo and a timestamp. The fee is set out in §8 of our terms.',
      publishConsent: true,
    },
  ];

  /* A sixth key, and the only one handed to somebody who is not the customer.
     The base set already carries `returned` on two addresses, so this is not
     here to make the state reachable — it is here for the case «übergeben an»
     exists for at all. With only the customer's own name ever in the data that
     field reads as a duplicate of the customer column. */
  const keyLog: KeyLogEntry[] = [
    ...data.keyLog,
    {
      id: 'key_s_returned',
      propertyId: 'prp_3',
      receivedAt: iso(days(now, -60)),
      receivedBy: 'Marco Brunner',
      storageLocation: 'Office key cabinet, slot 5',
      returnedAt: iso(days(now, -46)),
      returnedBy: 'Marco Brunner',
      /* Not the customer. Somebody else collecting is the case the return
         dialog asks «übergeben an» for at all — with only the customer's own
         name ever in the data, the field looks like a duplicate of the
         customer column and the reason for it is invisible. */
      returnedTo: 'The incoming tenant, Ms Bühler (authorised by mail)',
      returnNote: 'Flat handed over, final clean finished.',
      status: 'returned',
    },
  ];

  /* Two more on top of the base set, both on records only this scenario
     carries: the disputed invoice and the request cus_5 is waiting on. */
  const messages: CustomerMessage[] = [
    ...data.messages,
    {
      id: 'msg_s_1',
      customerId: 'cus_5',
      subject: 'A-2606',
      from: 'customer',
      body: 'Hello, does the 11th work in the afternoon rather than at midday?',
      at: iso(days(now, -1)),
      readByCustomer: true,
      readByAdmin: false,
    },
    {
      id: 'msg_s_2',
      customerId: 'cus_6',
      subject: 'RE-2026-0055',
      from: 'customer',
      body: 'I dispute this invoice — nobody was on site.',
      at: iso(days(now, -2)),
      readByCustomer: true,
      readByAdmin: true,
    },
    {
      id: 'msg_s_3',
      customerId: 'cus_6',
      subject: 'RE-2026-0055',
      from: 'homivaro',
      body: 'Good morning Mr Huber\n\nThe job is documented with a photo and a timestamp. I am happy to send you the picture.\n\nKind regards\nMarco Brunner',
      at: iso(days(now, -2)),
      readByCustomer: false,
      readByAdmin: true,
      attachments: [
        { id: 'att_einsatz', name: 'job-kitchen-units.jpg', kind: 'image', size: 1_840_000 },
        { id: 'att_protokoll', name: 'Zeitprotokoll-RE-2026-0055.pdf', kind: 'document', size: 48_900 },
      ],
    },
  ];

  const stateEvents: CalendarEvent[] = [
    calendarEvent(now, {
      id: 'cev_s_planned',
      ref: 'K-500',
      kind: 'contact-call',
      title: 'Call back — scheduled',
      inDays: 1,
      hour: 10,
      customerId: 'cus_1',
    }),
    calendarEvent(now, {
      id: 'cev_s_done',
      ref: 'K-501',
      kind: 'contact-call',
      title: 'Call back — done',
      inDays: -2,
      hour: 11,
      status: 'done',
      customerId: 'cus_2',
      outcome: 'Appointment moved to Thursday, the confirmation has gone out.',
    }),
    calendarEvent(now, {
      id: 'cev_s_noreply',
      ref: 'K-502',
      kind: 'follow-up',
      title: 'Follow-up — nobody reached',
      inDays: -1,
      hour: 15,
      status: 'pending',
      customerId: 'cus_5',
    }),
    calendarEvent(now, {
      id: 'cev_s_converted',
      ref: 'K-503',
      kind: 'contact-call',
      title: 'Call — it turned into a request',
      inDays: -4,
      hour: 9,
      status: 'inProgress',
      customerId: 'cus_5',
      outcome: 'Deep clean before the handover. Request recorded.',
      requestId: 'req_s_new',
    }),
    calendarEvent(now, {
      id: 'cev_s_cancelled',
      ref: 'K-504',
      kind: 'viewing',
      title: 'Viewing — cancelled',
      inDays: -1,
      hour: 13,
      duration: 45,
      status: 'cancelled',
      customerId: 'cus_6',
      propertyId: 'prp_6',
    }),
    /* The one without a customer record. A person who has phoned once is not
       a customer, and the detail screen has to render a bare name and number
       rather than a broken link. */
    calendarEvent(now, {
      id: 'cev_s_lead',
      ref: 'K-505',
      kind: 'contact-call',
      title: 'New enquiry',
      inDays: 2,
      hour: 8,
      contactName: 'Petra Lüthi',
      contactPhone: '+41 79 604 18 22',
      note: 'Called through the website, wants a price range for 3.5 rooms.',
    }),
    /* On site, and therefore blocking. This is the record that proves
       `occupiesSlot` does something — the picker refuses this window. */
    calendarEvent(now, {
      id: 'cev_s_viewing',
      ref: 'K-506',
      kind: 'viewing',
      title: 'Office viewing',
      inDays: 3,
      hour: 14,
      duration: 60,
      customerId: 'cus_4',
      propertyId: 'prp_4',
    }),
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
    /* Every CalendarEventStatus, and every kind, at once — the whole point of
       this scenario. Without it `cancelled` and `pending` would be colours in
       the legend with no record anywhere carrying them, which is precisely the
       "declared but unreachable" failure /flows exists to track. */
    events: [...stateEvents, ...data.events],
    subscriptions,
    invoices: [...matrixInvoices, ...invoices],
    payments: [...matrixPayments, ...statePayments, ...data.payments],
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

/**
 * §9.2 — a quote that left the office carries the company's signature, and a
 * quote the customer accepted carries theirs.
 *
 * Applied here rather than typed onto forty offer literals, because the rule
 * is what matters: `issuedAt` implies the company signed, `signedAt` implies
 * the customer did. Writing it once is what stops the next scenario from
 * quietly shipping an unsigned contract — `scripts/seed-test.mts` asserts the
 * same two implications back.
 */
const CUSTOMER_MARK = [
  'M 70 160 C 74 108 82 74 96 72 C 108 70 112 106 112 140 C 112 160 118 166 128 158 C 142 146 154 112 164 84 C 170 68 180 70 182 90 C 184 116 178 146 176 164',
  'M 214 120 C 210 142 210 158 214 168 C 218 146 226 124 240 114 C 250 108 258 112 258 126 C 258 146 254 160 256 168 C 262 176 274 172 284 158 C 300 136 318 122 338 118 C 350 116 356 124 350 134 C 342 148 320 154 300 152 C 322 150 348 154 366 164',
  'M 380 176 C 424 158 470 150 508 156',
].join(' ');

function seedSignatures(data: DataSet): DataSet {
  const nameFor = (offer: Offer) => {
    const request = data.requests.find((r) => r.id === offer.requestId);
    const customer = data.customers.find((c) => c.id === request?.customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : '—';
  };

  return {
    ...data,
    offers: data.offers.map((offer) => ({
      ...offer,
      ownerSignature: offer.issuedAt
        ? { ...SEED_SETTINGS.ownerSignature, at: offer.issuedAt }
        : undefined,
      customerSignature: offer.signedAt
        ? {
            name: nameFor(offer),
            role: 'Auftraggeber',
            path: CUSTOMER_MARK,
            at: offer.signedAt,
          }
        : undefined,
    })),
  };
}

export function buildScenario(name: ScenarioName, now: Date): DataSet {
  return seedSignatures(rawScenario(name, now));
}

function rawScenario(name: ScenarioName, now: Date): DataSet {
  switch (name) {
    case 'fresh':
      /* Launch day. One person, no customers, no reviews, nothing booked — and
         deliberately no calendar entries either. The empty calendar is the
         deliverable here, not a gap: it is the only place the day, week, month
         and agenda empty states can be seen, and "Termin eintragen" is the
         action that fills it. Seeding a call would take that away. */
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
          intent: i % 7 === 0 ? 'pln_basic' : undefined,
          preferredInDays: i % 4 === 0 ? undefined : 4 + (i % 10),
        }),
      );
      const reviews: Review[] = [
        {
          id: 'rev_1',
          bookingId: 'bkg_1',
          customerId: 'cus_1',
          rating: 5,
          text: 'On time, thorough, and you can tell they think ahead. Highly recommended.',
          status: 'published',
          submittedAt: iso(days(now, -20)),
          publishConsent: true,
        },
        {
          id: 'rev_2',
          bookingId: 'bkg_2',
          customerId: 'cus_2',
          rating: 5,
          text: 'The final clean passed the handover first time. Exactly what was promised.',
          status: 'published',
          submittedAt: iso(days(now, -6)),
          publishConsent: true,
        },
        {
          id: 'rev_3',
          bookingId: 'bkg_3',
          customerId: 'cus_3',
          rating: 4,
          text: 'Very clean work. They arrived a little later than announced, but they told us beforehand.',
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
          text: 'Two windows were missed and the kitchen was only done superficially. My message was not answered until the next day.',
          status: 'pending',
          submittedAt: iso(days(now, -1)),
          // Deliberately withheld: the moderation screen has to show the case
          // where publishing is not the owner's to decide (§20.6).
          publishConsent: false,
        },
      ];
      // §20.6 — only photos with recorded written consent reach the public
      // gallery. Two more consented pairs on top of the three the base data
      // carries, so the busy week fills the grid rather than repeating it.
      const consented: Photo[] = (['bkg_1', 'bkg_2'] as const).flatMap((bookingId, i) =>
        (['before', 'after'] as const).map((kind) => ({
          id: `pho_${bookingId}_${kind}`,
          src: `/placeholder/${bookingId}-${kind}.svg`,
          source: 'field' as const,
          kind,
          visibleToCustomer: true,
          publishConsent: true,
          note: i === 0 ? 'Kitchen, Küsnacht' : 'Badezimmer, Meilen',
          bookingId,
          takenAt: iso(days(now, -20 + i * 14)),
        })),
      );

      /*
       * A busy week that the calendar can actually show.
       *
       * This scenario added twenty-four requests and not one booking, so the
       * screen named for being under load opened on four jobs: the week grid
       * was mostly white space, the month view had a handful of dots, and the
       * route screen — whose entire subject is ordering a day with several
       * stops in it — drew a single stop and a total drive of zero.
       *
       * Two jobs a day is the ceiling (§1.2), so a full fortnight is exactly
       * that: two a day, alternating households so consecutive stops are
       * genuinely apart, with the statuses a real fortnight carries — finished
       * behind, running today, booked ahead.
       */
      const BUSY_SERVICES_JOB: ServiceSlug[] = [
        'unterhaltsreinigung',
        'einmalreinigung',
        'fensterreinigung',
        'bueroreinigung',
        'grundreinigung',
        'umzugsreinigung',
      ];
      const busyBookings: Booking[] = Array.from({ length: 28 }, (_, i) => {
        const offset = Math.floor(i / 2) - 7;
        const second = i % 2 === 1;
        const day = openDay(now, offset);
        const household = (i % 11) + 1;
        const past = offset < 0;
        const duration = second ? 180 : 240;
        return {
          id: `bkg_bz_${i}`,
          reference: `B-12${String(10 + i).padStart(2, '0')}`,
          customerId: `cus_m${household}`,
          propertyId: `prp_m${household}`,
          serviceSlug: BUSY_SERVICES_JOB[i % BUSY_SERVICES_JOB.length]!,
          start: iso(at(day, second ? 14 : 8, second ? 30 : 0)),
          duration,
          arrivalWindow: 60,
          assigneeId: 'tm_owner',
          /* Behind us it is finished, ahead of us it is booked. A fortnight
             where every job reads "scheduled" would make the past look like a
             backlog nobody has done. */
          /* `invoiced` only where an invoice is written for it below. It used
             to be every fifth past job unconditionally, and nothing raised the
             bill — so those jobs read «verrechnet» with no invoice anywhere,
             and the create screen offers «finished jobs with no live invoice»,
             which means they could never be billed either. */
          status: past ? (i % 5 === 0 ? 'invoiced' : 'completed') : 'scheduled',
          photoIds: [],
          history: [
            {
              at: iso(days(day, -6)),
              kind: 'created',
              label: i % 3 === 0 ? 'Plan visit scheduled' : 'Booked and paid',
            },
            ...(past
              ? [{ at: iso(at(day, second ? 17 : 12)), kind: 'checkOut', label: 'Checked out' }]
              : []),
          ],
        } satisfies Booking;
      });

      /*
       * The bills behind the jobs marked «verrechnet».
       *
       * A busy week is also a busy invoice list, and this scenario had the same
       * nine invoices as the quiet one — so the list's search, its status
       * filter and its second page had nothing here to work on. Statuses are
       * spread rather than uniform: one still out, one past its date, one
       * settled in cash, which is what the «Zahlweg» column and the «offen»
       * filter exist to tell apart.
       */
      const busyInvoiced = busyBookings.filter((b) => b.status === 'invoiced');
      const busyInvoices: Invoice[] = busyInvoiced.map((booking, i) => {
        const age = 30 + i * 12;
        const paid = i % 3 === 2;
        return {
          id: `inv_bz_${i}`,
          reference: `RE-2026-02${String(10 + i).padStart(2, '0')}`,
          customerId: booking.customerId,
          bookingId: booking.id,
          lines: [
            {
              label: 'Cleaning',
              quantity: booking.duration / 60,
              unitPrice: SEED_SETTINGS.hourlyRate,
            },
          ],
          /* The middle one is past its due date and still says `sent`: overdue
             is derived when the list is read, never stored — see
             `effectiveInvoiceStatus`. Storing it would need a nightly sweep. */
          status: paid ? 'paid' : 'sent',
          createdAt: iso(days(now, -(age + 1))),
          issuedAt: iso(days(now, -age)),
          dueAt: iso(days(now, 30 - age)),
          paidAt: paid ? iso(days(now, -(age - 4))) : undefined,
          qrReference: `21 00000 00003 13947 14300 093${String(10 + i)}`,
        };
      });
      /* A paid invoice with no payment behind it prints a dash in the «Zahlweg»
         column next to a green «Bezahlt» badge — which looks like data. */
      const busyPayments: Payment[] = busyInvoices
        .filter((invoice) => invoice.status === 'paid')
        .map((invoice, i) => ({
          id: `pay_bz_${i}`,
          invoiceId: invoice.id,
          amount: invoice.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
          method: 'cash' as const,
          at: invoice.paidAt!,
          status: 'succeeded' as const,
          gatewayRef: `manual_${invoice.reference}`,
        }));

      /* Calls between the jobs, which is what a busy week actually looks like
         — the phone does not stop because the calendar is full. */
      const busyEvents: CalendarEvent[] = Array.from({ length: 9 }, (_, i) =>
        calendarEvent(now, {
          id: `cev_bz_${i}`,
          ref: `K-42${i}`,
          kind: i % 3 === 0 ? 'follow-up' : 'contact-call',
          title:
            i % 3 === 0
              ? 'Follow up the quote'
              : i % 3 === 1
                ? 'Call back to move an appointment'
                : 'Request by phone',
          inDays: i - 3,
          hour: i % 2 === 0 ? 12 : 17,
          duration: 15,
          customerId: `cus_m${(i % 11) + 1}`,
          status: i - 3 < 0 ? (i % 2 === 0 ? 'done' : 'pending') : 'upcoming',
        }),
      );

      return {
        ...data,
        requests: [...data.requests, ...extra],
        bookings: [...data.bookings, ...busyBookings],
        invoices: [...busyInvoices, ...data.invoices],
        payments: [...data.payments, ...busyPayments],
        events: [...data.events, ...busyEvents],
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
          /*
           * Deliberately no `bookingId`.
           *
           * It used to carry `bkg_2`, and the base data this scenario appends
           * to already bills that job with `inv_paid` — so the seed held two
           * live invoices against one visit, one settled and one being chased.
           * The chasing events name this reference and this customer, and
           * neither needs a job behind it: a standalone invoice is a first
           * class thing since the create screen stopped requiring one.
           */
          lines: [{ label: 'One-off cleaning', quantity: 3, unitPrice: 49 }],
          status: 'overdue',
          createdAt: iso(days(now, -45)),
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
        queueRequest(now, { id: 'req_ov_4', ref: 'A-2524', n: 10, service: 'unterhaltsreinigung', status: 'inReview', agedHours: 268, intent: 'pln_premium' }),
      ];

      /*
       * Chasing.
       *
       * A business owed money spends its week on the phone, and this scenario
       * had the debt without the chasing — an overdue invoice, a past-due plan
       * and a calendar that looked like a quiet week. Two of these go
       * unanswered on purpose: people who owe money are the people who stop
       * picking up, which is exactly why `pending` is not `done`.
       */
      const chasing: CalendarEvent[] = [
        calendarEvent(now, {
          id: 'cev_ov_1',
          ref: 'K-460',
          kind: 'follow-up',
          title: 'Invoice RE-2026-0044 — discuss the second reminder',
          inDays: 0,
          hour: 9,
          customerId: 'cus_2',
          note: '14 days overdue. Call before the reminder, not after.',
        }),
        calendarEvent(now, {
          id: 'cev_ov_2',
          ref: 'K-461',
          kind: 'follow-up',
          title: 'Plan payment failed — renew the card',
          inDays: -1,
          hour: 16,
          status: 'pending',
          customerId: 'cus_1',
          note: 'Direct debit declined. Without a new card the next visit is paused.',
        }),
        calendarEvent(now, {
          id: 'cev_ov_3',
          ref: 'K-462',
          kind: 'follow-up',
          title: 'Request A-2524 — 11 days without an answer',
          inDays: -2,
          hour: 11,
          status: 'pending',
          customerId: 'cus_m10',
          note: 'Third attempt. Close it in writing after that.',
        }),
        calendarEvent(now, {
          id: 'cev_ov_4',
          ref: 'K-463',
          kind: 'contact-call',
          title: 'Payment plan offered',
          inDays: -4,
          hour: 14,
          status: 'done',
          customerId: 'cus_2',
          outcome: 'Paying in two instalments, the first at the end of the month. Confirmed in writing.',
        }),
      ];

      return {
        ...data,
        requests: [...lateRequests, ...data.requests],
        // Appended, not replaced: the point of this scenario is an overdue
        // invoice sitting next to normal ones, not a world with only one.
        invoices: [...invoices, ...data.invoices],
        events: [...chasing, ...data.events],
        /* The plans are deliberately untouched. A plan is paid once and in
           full, so it cannot fall behind — what is overdue in this scenario is
           invoices, and forcing every subscription into an arrears state was
           only ever possible while the model pretended they were billed
           monthly. */
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
        queueRequest(now, { id: 'req_aw_1', ref: 'A-2531', n: 1, service: 'unterhaltsreinigung', status: 'new', agedHours: 30, preferredInDays: 5, note: 'Would the 5th be possible? We are back from then.' }),
        queueRequest(now, { id: 'req_aw_2', ref: 'A-2532', n: 8, service: 'einmalreinigung', status: 'new', agedHours: 54, preferredInDays: 7, note: 'As soon as you can, we have guests coming.' }),
        queueRequest(now, { id: 'req_aw_3', ref: 'A-2533', n: 5, service: 'fensterreinigung', status: 'new', agedHours: 96 }),
        queueRequest(now, { id: 'req_aw_4', ref: 'A-2534', n: 3, service: 'grundreinigung', status: 'inReview', agedHours: 140, internal: 'Seen, cannot be answered until after the holidays.' }),
      ];
      /*
       * What a closure does to the calls.
       *
       * The closure runs day 2 → day 12, so nothing is placed inside it — a
       * callback scheduled during the holiday would be the seed contradicting
       * the scenario it belongs to. What actually happens is the other three
       * things: promises made before leaving, promises parked until the
       * return, and the one appointment the holiday ran over.
       */
      const aroundAbsence: CalendarEvent[] = [
        calendarEvent(now, {
          id: 'cev_aw_1',
          ref: 'K-470',
          kind: 'contact-call',
          title: 'Before the holidays: confirm the appointments',
          inDays: 1,
          hour: 8,
          customerId: 'cus_1',
          note: 'Last working day. Move the plan visit inside the holiday window.',
        }),
        /* The one the holiday ran over. `cancelled` had no record outside
           `states` — this is the case it exists for. */
        calendarEvent(now, {
          id: 'cev_aw_2',
          ref: 'K-471',
          kind: 'viewing',
          title: 'Viewing — falls inside the company holidays',
          inDays: 5,
          hour: 10,
          duration: 45,
          status: 'cancelled',
          customerId: 'cus_m5',
          propertyId: 'prp_m5',
          note: 'Agreed before the holidays, rearranged afterwards.',
          createdDaysAgo: 9,
        }),
        calendarEvent(now, {
          id: 'cev_aw_3',
          ref: 'K-472',
          kind: 'follow-up',
          title: 'After coming back: answer A-2531',
          inDays: 13,
          hour: 9,
          customerId: 'cus_m1',
          note: 'Waiting since the first day of the holidays. Call first, then quote.',
          createdDaysAgo: 1,
        }),
        calendarEvent(now, {
          id: 'cev_aw_4',
          ref: 'K-473',
          kind: 'follow-up',
          title: 'After coming back: answer A-2533',
          inDays: 13,
          hour: 10,
          customerId: 'cus_m5',
          createdDaysAgo: 1,
        }),
      ];

      return {
        ...data,
        requests: [...duringAbsence, ...data.requests],
        events: [...aroundAbsence, ...data.events],
      };
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
        /* A viewing wedged into the same overloaded day.

           The conflict banner reads travel time between two *jobs*; this is the
           other half of the same squeeze, and the one the picker has to honour
           when a quote is written against this day. Without a record like it,
           `occupiesSlot` was a rule with nothing anywhere exercising it. */
        events: [
          ...data.events,
          calendarEvent(now, {
            id: 'cev_cf_viewing',
            ref: 'K-450',
            kind: 'viewing',
            title: 'Viewing in between',
            inDays: 0,
            hour: 12,
            duration: 45,
            customerId: 'cus_m2',
            propertyId: 'prp_m2',
            note: 'Agreed before the second job that day was set.',
          }),
        ],
        /* Two requests asking for the day that is already double-booked, one at
           each end of the lake. Quoting either of them is where the travel
           buffer in `slotsForDay` has to refuse a slot the calendar looks free
           for — and there was no request to quote from. */
        requests: [
          queueRequest(now, { id: 'req_cf_1', ref: 'A-2541', n: 1, service: 'einmalreinigung', status: 'new', agedHours: 8, preferredInDays: 0, note: 'Today if there is any way at all.' }),
          queueRequest(now, { id: 'req_cf_2', ref: 'A-2542', n: 8, service: 'grundreinigung', status: 'new', agedHours: 15, preferredInDays: 0 }),
          ...data.requests,
        ],
      };
    }

    case 'hiring': {
      const data = withHiring(baseData(now), now);
      /*
       * Interviews.
       *
       * The hiring track staged applications, a posting and a conversion, and
       * the step between reading a CV and offering a contract — talking to the
       * person — happened nowhere. These carry `contactName`/`contactPhone`
       * rather than a `customerId`: an applicant is not a customer, and
       * inventing a customer record to hold a phone number would put them in
       * /admin/kunden, which is wrong in a way that is hard to undo.
       */
      const interviews: CalendarEvent[] = [
        calendarEvent(now, {
          id: 'cev_hr_1',
          ref: 'K-480',
          kind: 'contact-call',
          title: 'First interview, Elena Ferreira',
          inDays: 1,
          hour: 15,
          duration: 45,
          contactName: 'Elena Ferreira',
          contactPhone: '+41 78 000 00 11',
          note: 'Application app_1. Clarify the work permit and availability.',
        }),
        calendarEvent(now, {
          id: 'cev_hr_2',
          ref: 'K-481',
          kind: 'contact-call',
          title: 'Check the reference — Ms Hunziker',
          inDays: 2,
          hour: 11,
          duration: 15,
          contactName: 'Frau Hunziker',
          contactPhone: '+41 79 000 00 12',
          note: 'Reference for Elena Ferreira.',
        }),
        calendarEvent(now, {
          id: 'cev_hr_3',
          ref: 'K-482',
          kind: 'contact-call',
          title: 'First interview, Dritan Krasniqi',
          inDays: -2,
          hour: 14,
          duration: 45,
          status: 'done',
          contactName: 'Dritan Krasniqi',
          contactPhone: '+41 78 000 00 13',
          outcome: 'Experienced, has a car, available from next month. Through to the second round.',
        }),
        calendarEvent(now, {
          id: 'cev_hr_4',
          ref: 'K-483',
          kind: 'contact-call',
          title: 'Discuss the rejection — Amara Diallo',
          inDays: -1,
          hour: 17,
          duration: 15,
          status: 'pending',
          contactName: 'Amara Diallo',
          contactPhone: '+41 78 000 00 17',
          note: 'Rejection by phone rather than by mail.',
        }),
      ];
      return { ...data, events: [...interviews, ...data.events] };
    }

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
