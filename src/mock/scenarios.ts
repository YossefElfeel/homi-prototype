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
  Offer,
  Payment,
  Photo,
  Property,
  Review,
  ServiceRequest,
  Subscription,
  TeamMember,
} from './schema';
import type { Locale } from '@/i18n/routing';
import { SEED_ADDONS, SEED_SERVICES, SEED_SETTINGS } from './seed';
import { buildOfferLines } from './engines/offers';

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
  keyLog: KeyLogEntry[];
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
  keyLog: [],
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
const at = (d: Date, h: number, m = 0) => {
  const out = new Date(d);
  out.setHours(h, m, 0, 0);
  return out;
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
): Customer {
  return {
    id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}@example.ch`,
    phone: '+41 79 000 00 00',
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
    person('cus_1', 'Andrea', 'Keller', 'de', now, 64),
    person('cus_2', 'Thomas', 'Widmer', 'de', now, 31),
    person('cus_3', 'Sophie', 'Marchand', 'fr', now, 12),
    person('cus_4', 'James', 'Whitfield', 'en', now, 5),
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

  return {
    ...EMPTY,
    customers,
    properties,
    requests,
    offers,
    bookings,
    subscriptions,
    invoices,
    keyLog,
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

  return { ...data, postings, applications, team: [...data.team, marta] };
}

export function buildScenario(name: ScenarioName, now: Date): DataSet {
  switch (name) {
    case 'fresh':
      // Launch day. One person, no customers, no reviews, nothing booked.
      return { ...EMPTY, team: [owner(now)] };

    case 'busy': {
      const data = baseData(now);
      const extra: ServiceRequest[] = Array.from({ length: 5 }, (_, i) => ({
        ...data.requests[0]!,
        id: `req_b${i}`,
        reference: `A-25${10 + i}`,
        status: 'new' as const,
        createdAt: iso(new Date(now.getTime() - 1000 * 60 * 60 * (26 + i * 4))),
      }));
      const reviews: Review[] = [
        {
          id: 'rev_1',
          bookingId: 'bkg_1',
          customerId: 'cus_1',
          rating: 5,
          text: 'Pünktlich, gründlich, und man merkt, dass mitgedacht wird. Sehr empfehlenswert.',
          status: 'published',
          submittedAt: iso(days(now, -20)),
        },
        {
          id: 'rev_2',
          bookingId: 'bkg_2',
          customerId: 'cus_2',
          rating: 5,
          text: 'Endreinigung hat die Abnahme auf Anhieb bestanden. Genau das, was versprochen war.',
          status: 'published',
          submittedAt: iso(days(now, -6)),
        },
        {
          id: 'rev_3',
          bookingId: 'bkg_3',
          customerId: 'cus_3',
          rating: 4,
          text: 'Sehr saubere Arbeit. Die Ankunft war etwas später als angekündigt, wurde aber vorher gemeldet.',
          status: 'pending',
          submittedAt: iso(days(now, -2)),
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
      return {
        ...data,
        // Appended, not replaced: the point of this scenario is an overdue
        // invoice sitting next to normal ones, not a world with only one.
        invoices: [...invoices, ...data.invoices],
        subscriptions: data.subscriptions.map((s) => ({ ...s, status: 'pastDue' as const })),
      };
    }

    case 'away':
      return withClosure(baseData(now), now);

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
      };
    }

    case 'hiring':
      return withHiring(baseData(now), now);

    case 'demo':
    default:
      return baseData(now);
  }
}
