import type { Locale } from '@/i18n/routing';
import type {
  AddOn,
  MessageTemplate,
  Service,
  Settings,
  TemplateChannel,
  TemplateFlow,
} from './schema';

/**
 * Seed catalogue and settings.
 *
 * French and Italian are declared everywhere but carry the German string until
 * translation lands — spec §20.6 requires German as the fallback, and this
 * makes the gap visible in the admin content screens rather than silent.
 */
function l(de: string, en: string): Record<Locale, string> {
  return { de, en, fr: de, it: de };
}

/**
 * The seven services. Derived from the pricing rules in §5.1 plus the four
 * columns of the §5.2 duration matrix — the documents never list them in one
 * place. Editable from the admin "Leistungen & Preise" screen.
 */
export const SEED_SERVICES: Service[] = [
  {
    id: 'svc_unterhalt',
    slug: 'unterhaltsreinigung',
    name: l('Unterhaltsreinigung', 'Regular cleaning'),
    short: l(
      'Die wiederkehrende Reinigung, die Ihr Zuhause in Form hält.',
      'The recurring clean that keeps your home in shape.',
    ),
    calc: 'hourly',
    durationProfile: 'standard',
    basePrice: 49,
    minDuration: 2,
    handoverGuarantee: false,
    active: true,
    order: 1,
  },
  {
    id: 'svc_einmal',
    slug: 'einmalreinigung',
    name: l('Einmalreinigung', 'One-off cleaning'),
    short: l(
      'Einmal gründlich durch — ohne Abo, ohne Verpflichtung.',
      'One thorough clean — no plan, no commitment.',
    ),
    calc: 'hourly',
    durationProfile: 'standard',
    basePrice: 49,
    minDuration: 2,
    handoverGuarantee: false,
    active: true,
    order: 2,
  },
  {
    id: 'svc_grund',
    slug: 'grundreinigung',
    name: l('Grundreinigung', 'Deep cleaning'),
    short: l(
      'Tiefenreinigung bis in die Ecken, die sonst niemand sieht.',
      'A deep clean that reaches the corners nobody else sees.',
    ),
    calc: 'hourly',
    durationProfile: 'deep',
    basePrice: 49,
    minDuration: 3,
    handoverGuarantee: false,
    active: true,
    order: 3,
  },
  {
    id: 'svc_umzug',
    slug: 'umzugsreinigung',
    name: l('Umzugsreinigung', 'Move-out cleaning'),
    short: l(
      'Mit Abnahmegarantie: Besteht die Wohnung die Abnahme nicht, kommen wir kostenlos zurück.',
      'With a handover guarantee: if the flat fails inspection, we come back free of charge.',
    ),
    calc: 'hourly',
    durationProfile: 'moveout',
    basePrice: 49,
    minDuration: 3,
    handoverGuarantee: true,
    active: true,
    order: 4,
  },
  {
    id: 'svc_fenster',
    slug: 'fensterreinigung',
    name: l('Fensterreinigung', 'Window cleaning'),
    short: l(
      'Rahmen, Glas und Sims — pro Fenster abgerechnet.',
      'Frames, glass and sills — billed per window.',
    ),
    calc: 'perUnit',
    durationProfile: 'none',
    // Counted per window, but still billed by the hour: five windows are half
    // an hour (§5.1), so the rate here is the hourly rate like every other
    // service. A separate per-window price would contradict §21 item 1 and
    // would be the first place the numbers drift apart.
    basePrice: 49,
    minDuration: 2,
    handoverGuarantee: false,
    active: true,
    order: 5,
  },
  {
    id: 'svc_buero',
    slug: 'bueroreinigung',
    name: l('Büroreinigung', 'Office cleaning'),
    short: l(
      'Regelmässige Reinigung für kleine Büros, mit ordentlicher Rechnung.',
      'Regular cleaning for small offices, with a proper invoice.',
    ),
    calc: 'hourly',
    durationProfile: 'office',
    basePrice: 49,
    minDuration: 2,
    handoverGuarantee: false,
    active: true,
    order: 6,
  },
  {
    id: 'svc_montage',
    slug: 'moebelmontage',
    name: l('Möbelmontage', 'Furniture assembly'),
    short: l(
      'Aufgebaut, ausgerichtet, Verpackung entsorgt.',
      'Assembled, levelled, packaging taken away.',
    ),
    calc: 'hourly',
    durationProfile: 'none',
    basePrice: 49,
    minDuration: 2,
    handoverGuarantee: false,
    active: true,
    order: 7,
  },
];

/** The seven add-ons from §8.1 step 3. */
export const SEED_ADDONS: AddOn[] = [
  {
    id: 'add_fenster',
    slug: 'fenster',
    name: l('Fenster innen & aussen', 'Windows inside & out'),
    short: l('Bis zu fünf Fenster inklusive Rahmen.', 'Up to five windows including frames.'),
    price: 45,
    extraDuration: 0.5,
    services: ['unterhaltsreinigung', 'einmalreinigung', 'grundreinigung', 'umzugsreinigung'],
    active: true,
  },
  {
    id: 'add_backofen',
    slug: 'backofen',
    name: l('Backofen', 'Oven'),
    short: l('Innenreinigung inklusive Roste.', 'Interior clean including racks.'),
    price: 39,
    extraDuration: 0.5,
    services: ['unterhaltsreinigung', 'einmalreinigung', 'grundreinigung', 'umzugsreinigung'],
    active: true,
  },
  {
    id: 'add_kuehlschrank',
    slug: 'kuehlschrank',
    name: l('Kühlschrank', 'Fridge'),
    short: l('Ausgeräumt, gereinigt, eingeräumt.', 'Emptied, cleaned, put back.'),
    price: 29,
    extraDuration: 0.5,
    services: ['unterhaltsreinigung', 'einmalreinigung', 'grundreinigung', 'umzugsreinigung'],
    active: true,
  },
  {
    id: 'add_balkon',
    slug: 'balkon',
    name: l('Balkon oder Terrasse', 'Balcony or terrace'),
    short: l('Boden, Geländer und Möbel.', 'Floor, railing and furniture.'),
    price: 35,
    extraDuration: 0.5,
    services: ['unterhaltsreinigung', 'einmalreinigung', 'grundreinigung', 'umzugsreinigung'],
    active: true,
  },
  {
    id: 'add_schraenke',
    slug: 'schraenke',
    name: l('Schränke innen', 'Inside cupboards'),
    short: l('Ausgeräumt und ausgewischt.', 'Emptied and wiped out.'),
    price: 49,
    extraDuration: 1,
    services: ['grundreinigung', 'umzugsreinigung'],
    active: true,
  },
  {
    id: 'add_waesche',
    slug: 'waesche',
    name: l('Bügeln & Wäsche', 'Ironing & laundry'),
    short: l('Eine Maschine und der zugehörige Bügelstapel.', 'One load and the ironing that comes with it.'),
    price: 45,
    extraDuration: 1,
    services: ['unterhaltsreinigung', 'einmalreinigung'],
    active: true,
  },
  {
    id: 'add_keller',
    slug: 'keller',
    name: l('Keller oder Garage', 'Cellar or garage'),
    short: l('Gefegt, gewischt, Spinnweben weg.', 'Swept, mopped, cobwebs gone.'),
    price: 55,
    extraDuration: 1,
    services: ['grundreinigung', 'umzugsreinigung', 'einmalreinigung'],
    active: true,
  },
];

/**
 * §15 — the messages the business sends.
 *
 * German and English are written; French and Italian are left out on purpose.
 * They fall back to German (§20.6), which is the behaviour the templates screen
 * has to make visible rather than hide.
 *
 * Subjects are new. The eleven texts shipped as bare bodies, which was fine
 * while nothing sent them — the moment a picker offers a list, a template with
 * no subject has no name, and "Guten Tag {name}…" is the same name eleven
 * times over. The subject is the name and the email header at once.
 *
 * `tpl` fills the shape so a template that is only German-and-English does not
 * have to spell out two absent locales.
 */
function tpl(
  id: string,
  input: {
    event?: MessageTemplate['event'];
    flow: TemplateFlow;
    tags: string[];
    channels: TemplateChannel[];
    subject: { de: string; en: string };
    body: { de: string; en: string };
  },
): MessageTemplate {
  return {
    id,
    event: input.event,
    flow: input.flow,
    tags: input.tags,
    channels: input.channels,
    subject: input.subject,
    body: input.body,
    /* Every seeded event ships exactly one template, so each is its own
       default. A second template on the same event is something the admin
       adds, and `addTemplate` leaves this false for it. */
    isDefault: true,
  };
}

const SEED_TEMPLATES: MessageTemplate[] = [
  tpl('tpl_request_received', {
    event: 'request-received',
    flow: 'requests',
    tags: ['Bestätigung'],
    channels: ['email'],
    subject: {
      de: 'Ihre Anfrage {reference} ist eingegangen',
      en: 'We have your request {reference}',
    },
    body: {
      de: 'Guten Tag {name}\n\nIhre Anfrage ist bei uns eingegangen — Referenz {reference}. Wir melden uns innerhalb von 24 Stunden mit einer Offerte.\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nWe have your request — reference {reference}. You will hear back from us with a quote within 24 hours.\n\nKind regards\nHomivaro',
    },
  }),
  tpl('tpl_offer_sent', {
    event: 'offer-sent',
    flow: 'quotes',
    tags: ['Offerte'],
    channels: ['email', 'sms'],
    subject: { de: 'Ihre Offerte von Homivaro', en: 'Your quote from Homivaro' },
    body: {
      de: 'Guten Tag {name}\n\nIhre Offerte ist bereit: {link}\nSie ist bis {validUntil} gültig. Termin wählen und bestätigen können Sie direkt darin.\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nYour quote is ready: {link}\nIt is valid until {validUntil}. You can pick a slot and confirm inside it.\n\nKind regards\nHomivaro',
    },
  }),
  tpl('tpl_offer_reminder', {
    event: 'offer-reminder',
    flow: 'quotes',
    tags: ['Offerte', 'Erinnerung'],
    channels: ['email'],
    subject: {
      de: 'Ihre Offerte läuft am {validUntil} ab',
      en: 'Your quote expires on {validUntil}',
    },
    body: {
      de: 'Guten Tag {name}\n\nIhre Offerte läuft am {validUntil} ab. Falls Sie Fragen haben, antworten Sie einfach auf diese Nachricht.\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nYour quote expires on {validUntil}. If anything is unclear, simply reply to this message.\n\nKind regards\nHomivaro',
    },
  }),
  tpl('tpl_booking_confirmed', {
    event: 'booking-confirmed',
    flow: 'bookings',
    tags: ['Termin', 'Bestätigung'],
    channels: ['email', 'sms'],
    subject: { de: 'Termin bestätigt: {date}', en: 'Appointment confirmed: {date}' },
    body: {
      de: 'Guten Tag {name}\n\nIhr Termin ist bestätigt: {date}, Ankunft zwischen {windowStart} und {windowEnd}. Referenz {reference}.\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nYour appointment is confirmed: {date}, arrival between {windowStart} and {windowEnd}. Reference {reference}.\n\nKind regards\nHomivaro',
    },
  }),
  tpl('tpl_appointment_reminder', {
    event: 'appointment-reminder',
    flow: 'bookings',
    tags: ['Termin', 'Erinnerung'],
    channels: ['sms'],
    subject: { de: 'Erinnerung an Ihren Termin', en: 'Appointment reminder' },
    body: {
      de: 'Erinnerung: morgen, {date}, Ankunft zwischen {windowStart} und {windowEnd}. Kostenlose Absage noch bis {freeUntil}.',
      en: 'Reminder: tomorrow, {date}, arrival between {windowStart} and {windowEnd}. Free cancellation until {freeUntil}.',
    },
  }),
  tpl('tpl_on_the_way', {
    event: 'on-the-way',
    flow: 'bookings',
    tags: ['Termin'],
    channels: ['sms'],
    subject: { de: 'Wir sind unterwegs', en: 'On the way' },
    body: {
      de: '{member} ist unterwegs zu Ihnen und trifft voraussichtlich um {eta} ein.',
      en: '{member} is on the way and should arrive around {eta}.',
    },
  }),
  tpl('tpl_job_done', {
    event: 'job-done',
    flow: 'bookings',
    tags: ['Abschluss'],
    channels: ['email'],
    subject: { de: 'Die Arbeiten sind abgeschlossen', en: 'The work is finished' },
    body: {
      de: 'Guten Tag {name}\n\nDie Arbeiten sind abgeschlossen. Bericht und Fotos: {link}\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nThe work is finished. Report and photos: {link}\n\nKind regards\nHomivaro',
    },
  }),
  tpl('tpl_invoice_sent', {
    event: 'invoice-sent',
    flow: 'invoices',
    tags: ['Rechnung'],
    channels: ['email'],
    subject: { de: 'Rechnung {invoiceNumber}', en: 'Invoice {invoiceNumber}' },
    body: {
      de: 'Guten Tag {name}\n\nRechnung {invoiceNumber} über {amount}, zahlbar bis {dueDate}. QR-Rechnung im Anhang.\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nInvoice {invoiceNumber} for {amount}, due {dueDate}. QR invoice attached.\n\nKind regards\nHomivaro',
    },
  }),
  tpl('tpl_payment_reminder', {
    event: 'payment-reminder',
    flow: 'invoices',
    tags: ['Rechnung', 'Erinnerung'],
    channels: ['email'],
    subject: {
      de: 'Rechnung {invoiceNumber} ist noch offen',
      en: 'Invoice {invoiceNumber} is still open',
    },
    body: {
      de: 'Guten Tag {name}\n\nRechnung {invoiceNumber} über {amount} ist seit {dueDate} offen. Falls sie sich überschnitten hat, betrachten Sie diese Nachricht als gegenstandslos.\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nInvoice {invoiceNumber} for {amount} has been open since {dueDate}. If your payment crossed with this message, please disregard it.\n\nKind regards\nHomivaro',
    },
  }),
  tpl('tpl_cancellation', {
    event: 'cancellation',
    flow: 'bookings',
    tags: ['Stornierung'],
    channels: ['email', 'sms'],
    subject: {
      de: 'Ihr Termin am {date} ist storniert',
      en: 'Your appointment on {date} is cancelled',
    },
    body: {
      de: 'Guten Tag {name}\n\nIhr Termin am {date} ist storniert. {feeNote}\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nYour appointment on {date} is cancelled. {feeNote}\n\nKind regards\nHomivaro',
    },
  }),
  tpl('tpl_review_request', {
    event: 'review-request',
    flow: 'reviews',
    tags: ['Bewertung'],
    channels: ['email'],
    subject: { de: 'Waren Sie zufrieden?', en: 'Were you happy with the work?' },
    body: {
      de: 'Guten Tag {name}\n\nWaren Sie zufrieden? Eine kurze Rückmeldung hilft uns sehr: {link}\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nWere you happy with the work? A short review helps us a great deal: {link}\n\nKind regards\nHomivaro',
    },
  }),
  /*
   * The brief names "Pricing List" as a category beside Send Quote and Send
   * Invoice. Nothing in the system answered to it: no event sends a price list,
   * so under the fixed-eleven shape it could not have existed at all. It is the
   * first template with no `event` — which is what makes the manual half of the
   * list real rather than a field nothing uses. {priceList} resolves from the
   * service catalogue, so an edited price reaches this text without anyone
   * remembering to retype it.
   */
  {
    id: 'tpl_pricing_list',
    flow: 'general',
    tags: ['Preise'],
    channels: ['email'],
    subject: { de: 'Unsere Preise auf einen Blick', en: 'Our prices at a glance' },
    body: {
      de: 'Guten Tag {name}\n\nGerne unsere aktuellen Preise:\n\n{priceList}\n\nDie Preise verstehen sich inklusive Anfahrt innerhalb unseres Einzugsgebiets. Für eine verbindliche Offerte melden Sie sich jederzeit.\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nHere are our current prices:\n\n{priceList}\n\nPrices include travel within our service area. Get in touch any time for a binding quote.\n\nKind regards\nHomivaro',
    },
    isDefault: false,
  },
];

export const SEED_SETTINGS: Settings = {
  hourlyRate: 49, // §5.1
  minimumHours: 2, // §5.1
  // §5.1 leaves the threshold open — working hours end at 18:00, so "evening"
  // needs a definition. Configurable here; 17:00 is the default.
  eveningSurchargeFrom: '17:00',
  eveningSurchargePercent: 20,
  saturdaySurchargePercent: 25,
  freeTravelKm: 50, // §5.1
  workingDays: [1, 2, 3, 4, 5, 6], // §1.2 — Mon–Sat
  dayStart: '07:00',
  dayEnd: '18:00',
  minLeadHours: 24, // §1.2 — no same-day bookings
  maxJobsPerDay: 2, // §1.2 — the hard ceiling on this business
  servedPostcodes: ['8132', '8627', '8634', '8700', '8706', '8707', '8708', '8712'], // §6
  offerValidityDays: 14,
  responseTimeHours: 24, // §4.1
  cancellationFreeHours: 24, // §12
  lateCancellationPercent: 50, // §12
  noAccessFeePercent: 50, // §4.2
  subscriptionCommitmentMonths: 12, // §11.2 — reaffirmed
  subscriptionNoticeMonths: 1, // §11.2
  monthlyFreeSkips: 1, // §11.2
  planDiscounts: { basic: 10, premium: 15, vip: 20 }, // §11.1
  creditValidityMonths: 12, // §11.3
  // §21 item 12 — key holding stays locked until a policy exists.
  hasLiabilityInsurance: false,
  applicationRetentionMonths: 6, // revDSG
  messageTemplates: SEED_TEMPLATES,
};
