import type { Locale } from '@/i18n/routing';
import type {
  AddOn,
  MessageTemplate,
  Plan,
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
 * The seven live services, plus one draft and one deactivated. Derived from
 * the pricing rules in §5.1 plus the four columns of the §5.2 duration matrix
 * — the documents never list them in one place. Editable from the admin
 * "Leistungen & Preise" screen, which can now also add to them.
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
    order: 7,
  },
  /*
   * The eighth is a draft, and it is here for the same reason one add-on ships
   * switched off: a state nothing is ever *in* is a state you cannot see
   * working. It is also the only `flat` service in the file — the billing
   * method the schema has always declared and the seed could never set, since
   * every price the business quotes today is an hourly one.
   *
   * Being a draft, it reaches no customer: the website, the sitemap and the
   * request flow all ask `isOffered`, which only `active` satisfies. What it
   * does reach is /admin/leistungen, where the owner can finish pricing it and
   * put it on sale — which is the flow this seed exists to demonstrate.
   */
  {
    id: 'svc_teppich',
    slug: 'teppichreinigung',
    name: l('Teppichreinigung', 'Carpet cleaning'),
    short: l(
      'Tiefenreinigung von Teppichen und Polstern, pro Auftrag verrechnet.',
      'Deep cleaning for carpets and upholstery, billed per job.',
    ),
    calc: 'flat',
    durationProfile: 'none',
    basePrice: 180,
    minDuration: 2,
    handoverGuarantee: false,
    status: 'draft',
    order: 8,
  },
  /*
   * The ninth is deactivated, and it completes the set: one row in each of the
   * three states, so none of them is a filter option that returns nothing.
   *
   * A draft and a deactivated service look identical to a customer — both are
   * simply not there — and that is exactly why they need to look different
   * here. This one was on sale and came off it: the business stopped taking
   * facade work when the equipment went, and the record stays so the price is
   * still there if it ever comes back. Deleting it would have been the other
   * option, and it is the one the confirm dialog argues against.
   */
  {
    id: 'svc_fassade',
    slug: 'fassadenreinigung',
    name: l('Fassadenreinigung', 'Facade cleaning'),
    short: l(
      'Aussenreinigung von Fassaden, Balkonen und Sitzplätzen.',
      'Exterior cleaning for facades, balconies and terraces.',
    ),
    calc: 'hourly',
    durationProfile: 'none',
    basePrice: 62,
    minDuration: 4,
    handoverGuarantee: false,
    status: 'inactive',
    order: 9,
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
 * have to spell out two absent locales. `fr` and `it` are opt-in per template
 * rather than absent everywhere: with the gap universal, the templates screen
 * could only ever render "2 fehlen" and its own "Vollständig" state was
 * unreachable — a badge no data could produce.
 */
function tpl(
  id: string,
  input: {
    event?: MessageTemplate['event'];
    flow: TemplateFlow;
    tags: string[];
    channels: TemplateChannel[];
    subject: { de: string; en: string; fr?: string; it?: string };
    body: { de: string; en: string; fr?: string; it?: string };
    /**
     * Left off for the second template on an event. Exactly one default per
     * event is the store's invariant, so the seed has to respect it too.
     */
    isDefault?: boolean;
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
    isDefault: input.isDefault ?? true,
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
  /* Complete in all four languages, unlike its neighbours. Short enough that
     French and Italian could be written properly rather than guessed, and it is
     the SMS that goes to every customer the day before — the one worth having in
     the language they chose. */
  tpl('tpl_appointment_reminder', {
    event: 'appointment-reminder',
    flow: 'bookings',
    tags: ['Termin', 'Erinnerung'],
    channels: ['sms'],
    subject: {
      de: 'Erinnerung an Ihren Termin',
      en: 'Appointment reminder',
      fr: 'Rappel de votre rendez-vous',
      it: 'Promemoria del vostro appuntamento',
    },
    body: {
      de: 'Erinnerung: morgen, {date}, Ankunft zwischen {windowStart} und {windowEnd}. Kostenlose Absage noch bis {freeUntil}.',
      en: 'Reminder: tomorrow, {date}, arrival between {windowStart} and {windowEnd}. Free cancellation until {freeUntil}.',
      fr: 'Rappel : demain, {date}, arrivée entre {windowStart} et {windowEnd}. Annulation gratuite jusqu\'au {freeUntil}.',
      it: 'Promemoria: domani, {date}, arrivo tra le {windowStart} e le {windowEnd}. Disdetta gratuita fino al {freeUntil}.',
    },
  }),
  tpl('tpl_on_the_way', {
    event: 'on-the-way',
    flow: 'bookings',
    tags: ['Termin'],
    channels: ['sms'],
    subject: {
      de: 'Wir sind unterwegs',
      en: 'On the way',
      fr: 'Nous sommes en route',
      it: 'Siamo in arrivo',
    },
    body: {
      de: '{member} ist unterwegs zu Ihnen und trifft voraussichtlich um {eta} ein.',
      en: '{member} is on the way and should arrive around {eta}.',
      fr: '{member} est en route et devrait arriver vers {eta}.',
      it: '{member} è in arrivo e dovrebbe essere da voi verso le {eta}.',
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
   * The three below are second templates on events that already have one, and
   * they are the reason this list is not eleven rows of one.
   *
   * Without them every event owns exactly one template, and three things the
   * product declares cannot happen: nothing can be promoted to default, the
   * "delete the default and choose its heir" confirm has no heir to offer, and
   * `isDefault` is a field whose false value never occurs. A flag that is always
   * true is not a flag. They are also the realistic case — a business does not
   * write one covering letter and use it for four years.
   */
  tpl('tpl_offer_sent_short', {
    event: 'offer-sent',
    flow: 'quotes',
    tags: ['Offerte', 'Kurz'],
    channels: ['email', 'sms'],
    isDefault: false,
    subject: { de: 'Ihre Offerte ist bereit', en: 'Your quote is ready' },
    body: {
      de: 'Guten Tag {name}\n\nOfferte: {link} — gültig bis {validUntil}.\n\nHomivaro',
      en: 'Hello {name}\n\nQuote: {link} — valid until {validUntil}.\n\nHomivaro',
    },
  }),
  /*
   * Deliberately carries {link}, which the invoice screen has no value for: the
   * customer's invoice page is not something that screen knows a URL to. So this
   * is the template that demonstrates the block — preview shows {link} still in
   * its braces, "Direkt senden" greys out, and editing is the only way on. It is
   * the one seeded row that proves the gate is real rather than decorative.
   */
  tpl('tpl_payment_reminder_final', {
    event: 'payment-reminder',
    flow: 'invoices',
    tags: ['Rechnung', 'Erinnerung', 'Letzte Mahnung'],
    channels: ['email'],
    isDefault: false,
    subject: {
      de: 'Letzte Erinnerung: Rechnung {invoiceNumber}',
      en: 'Final reminder: invoice {invoiceNumber}',
    },
    body: {
      de: 'Guten Tag {name}\n\nRechnung {invoiceNumber} über {amount} ist seit {dueDate} offen. Wir bitten Sie, den Betrag innert zehn Tagen zu begleichen: {link}\n\nBei Fragen zur Rechnung melden Sie sich bitte — eine Ratenzahlung lässt sich in der Regel einrichten.\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nInvoice {invoiceNumber} for {amount} has been open since {dueDate}. Please settle it within ten days: {link}\n\nIf anything about the invoice is unclear, do get in touch — instalments can usually be arranged.\n\nKind regards\nHomivaro',
    },
  }),
  tpl('tpl_booking_confirmed_subscription', {
    event: 'booking-confirmed',
    flow: 'bookings',
    tags: ['Termin', 'Bestätigung', 'Abo'],
    channels: ['email'],
    isDefault: false,
    subject: {
      de: 'Ihr nächster Abo-Termin: {date}',
      en: 'Your next plan visit: {date}',
    },
    body: {
      de: 'Guten Tag {name}\n\nIhr nächster Termin im Abo: {date}, Ankunft zwischen {windowStart} und {windowEnd}.\n\nPasst der Termin nicht, können Sie ihn im Konto verschieben oder einmal pro Monat kostenlos aussetzen.\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nYour next visit on the plan: {date}, arrival between {windowStart} and {windowEnd}.\n\nIf it does not suit, you can move it in your account, or skip once a month at no charge.\n\nKind regards\nHomivaro',
    },
  }),
  /*
   * A second manual-only template beside the price list, so filtering by the
   * General area and by a tag both return more than a single row — a filter that
   * can only ever return one thing does not show whether it works.
   */
  tpl('tpl_area_declined', {
    flow: 'general',
    tags: ['Absage', 'Gebiet'],
    channels: ['email'],
    subject: {
      de: 'Leider ausserhalb unseres Einsatzgebiets',
      en: 'Outside our service area, unfortunately',
    },
    body: {
      de: 'Guten Tag {name}\n\nVielen Dank für Ihre Anfrage {reference}. Ihre Adresse liegt leider ausserhalb des Gebiets, das wir zuverlässig bedienen — wir sagen das lieber offen, als einen Termin zu versprechen, den wir nicht halten können.\n\nSollten wir das Gebiet erweitern, melden wir uns gerne.\n\nFreundliche Grüsse\nHomivaro',
      en: 'Hello {name}\n\nThank you for request {reference}. Your address falls outside the area we can serve reliably — we would rather say so than promise a date we cannot keep.\n\nIf that changes, we will gladly be in touch.\n\nKind regards\nHomivaro',
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

/**
 * Marco Brunner's mark, as it would be after he drew it once in settings.
 *
 * Authored rather than captured, because the seed has to produce the same
 * signature on every machine — a pad-drawn one would differ per reviewer and
 * the screenshots in the brief would stop matching.
 */
const OWNER_SIGNATURE = {
  name: 'Marco Brunner',
  role: 'Inhaber',
  path: [
    'M 56 176 C 58 104 64 60 76 58 C 88 56 94 100 102 136 C 108 162 116 168 124 158 C 134 146 142 98 152 62 C 158 40 168 40 172 60 C 178 90 174 140 172 176',
    'M 214 178 C 208 124 208 82 214 58 C 218 44 234 40 248 48 C 264 58 264 84 246 96 C 234 104 224 104 218 102 C 240 98 268 106 276 126 C 284 148 270 168 248 172 C 236 174 226 172 220 168',
    'M 300 118 C 294 140 292 158 296 172 C 298 146 304 124 316 112 C 324 104 332 108 334 120 C 330 142 330 158 336 168 C 342 176 352 172 358 160 C 364 148 368 128 370 112 C 368 136 370 156 376 166 C 382 174 392 170 396 158 C 400 144 402 126 404 112 C 402 134 404 154 410 164 C 416 172 426 168 430 156 C 434 142 436 124 438 112 C 436 134 438 154 444 164 C 450 172 460 168 466 156 C 476 136 490 122 506 118 C 518 116 524 124 520 134 C 514 146 496 152 478 152',
    'M 520 186 C 566 168 618 158 664 162',
  ].join(' '),
};

/**
 * The three plans, as records rather than as a type.
 *
 * Each is a prepaid package: the price is paid once, buys `includedVisits`
 * visits of one service, and those visits stay usable for a year. The
 * arithmetic is deliberately checkable against the catalogue — a Basic visit is
 * three hours at the CHF 49 base rate, twenty-six times, less the ten per cent
 * the package earns for being paid up front. A price that cannot be re-derived
 * from the hourly rate is a price nobody can defend on the phone.
 *
 * `listPrice` is that same arithmetic *before* the discount — 26 × 3 h × CHF 49
 * — which is what makes the saving on the marketing card a subtraction anybody
 * can redo rather than a number chosen because it looks large. Büro Kompakt
 * carries none: its per-visit figure sits above the catalogue rate, so there is
 * no saving to claim and the card must not invent one.
 *
 * The rhythms are the ones the marketing page has always promised, kept rather
 * than quietly reduced. What that makes visible is the size of the up-front
 * payment — see the open question this raised on /open-questions, which the
 * business has to answer before any of this is real.
 */
export const SEED_PLANS: Plan[] = [
  {
    id: 'pln_basic',
    reference: 'P-001',
    name: l('Basic', 'Basic'),
    description: l(
      'Alle zwei Wochen eine Unterhaltsreinigung, ein Jahr im Voraus bezahlt.',
      'A regular clean every two weeks, paid a year in advance.',
    ),
    features: [
      l('26 Einsätze im Jahr', '26 visits a year'),
      l('10 % auf jede weitere Leistung', '10% off any further service'),
      l('Ein kostenloses Aussetzen pro Monat', 'One free skip a month'),
    ],
    price: 3440,
    listPrice: 3822,
    includedVisits: 26,
    validityMonths: 12,
    serviceSlug: 'unterhaltsreinigung',
    extraDiscountPercent: 10,
    active: true,
    visibleOnSite: true,
    order: 1,
  },
  {
    id: 'pln_premium',
    reference: 'P-002',
    name: l('Premium', 'Premium'),
    description: l(
      'Wöchentlich, mit Vorrang bei der Terminvergabe.',
      'Weekly, with priority when dates are handed out.',
    ),
    features: [
      l('52 Einsätze im Jahr', '52 visits a year'),
      l('15 % auf jede weitere Leistung', '15% off any further service'),
      l('Vorrang bei der Terminvergabe', 'Priority when dates are handed out'),
      l('Ein kostenloses Aussetzen pro Monat', 'One free skip a month'),
    ],
    price: 6500,
    listPrice: 7644,
    includedVisits: 52,
    validityMonths: 12,
    serviceSlug: 'unterhaltsreinigung',
    extraDiscountPercent: 15,
    active: true,
    visibleOnSite: true,
    order: 2,
  },
  {
    id: 'pln_vip',
    reference: 'P-003',
    name: l('VIP', 'VIP'),
    description: l(
      'Zweimal wöchentlich, immer dasselbe Team.',
      'Twice a week, always the same team.',
    ),
    features: [
      l('104 Einsätze im Jahr', '104 visits a year'),
      l('20 % auf jede weitere Leistung', '20% off any further service'),
      l('Immer dasselbe Team', 'Always the same team'),
      l('Vorrang bei der Terminvergabe', 'Priority when dates are handed out'),
    ],
    price: 12230,
    listPrice: 15288,
    includedVisits: 104,
    validityMonths: 12,
    serviceSlug: 'unterhaltsreinigung',
    extraDiscountPercent: 20,
    active: true,
    visibleOnSite: true,
    order: 3,
  },
  {
    /*
     * Retired, and kept that way on purpose.
     *
     * `active: false` is the only thing that proves the toggle does something,
     * and this plan still has a subscriber in the seed — which is the case the
     * flag exists for. Retiring a product must not cancel the year somebody
     * already paid for.
     */
    id: 'pln_buero',
    reference: 'P-004',
    name: l('Büro Kompakt', 'Office Compact'),
    description: l(
      'Zwölf Büroreinigungen im Jahr. Nicht mehr im Verkauf.',
      'Twelve office cleans a year. No longer sold.',
    ),
    features: [
      l('12 Einsätze im Jahr', '12 visits a year'),
      l('10 % auf jede weitere Leistung', '10% off any further service'),
    ],
    price: 1980,
    includedVisits: 12,
    validityMonths: 12,
    serviceSlug: 'bueroreinigung',
    extraDiscountPercent: 10,
    active: false,
    visibleOnSite: false,
    order: 4,
  },
  /*
   * The office line, alive again and sold as two.
   *
   * /abos showed three plans, all of them the same service, and never said so
   * — a business asking about their office read the household rhythms and the
   * household price and had no way to tell whether any of it applied to them.
   * One plan on its own does not fix that either: a single card has nothing to
   * compare with, which is the whole reason somebody opens a plans page.
   *
   * Same arithmetic as the household plans, at the office duration: an office
   * visit is two and a half hours at the CHF 49 rate, so `listPrice` is that
   * times the visits and `price` is that less the package discount. Nothing
   * here is a number chosen to look right.
   */
  {
    id: 'pln_buero_standard',
    reference: 'P-005',
    name: l('Büro Standard', 'Office Standard'),
    description: l(
      'Alle zwei Wochen durchs Büro, ein Jahr im Voraus bezahlt.',
      'Through the office every two weeks, paid a year in advance.',
    ),
    features: [
      l('26 Einsätze im Jahr', '26 visits a year'),
      l('10 % auf jede weitere Leistung', '10% off any further service'),
      l('Rechnung auf die Firma', 'Invoiced to the company'),
    ],
    price: 2865,
    listPrice: 3185,
    includedVisits: 26,
    validityMonths: 12,
    serviceSlug: 'bueroreinigung',
    extraDiscountPercent: 10,
    active: true,
    visibleOnSite: true,
    order: 5,
  },
  {
    id: 'pln_buero_plus',
    reference: 'P-006',
    name: l('Büro Plus', 'Office Plus'),
    description: l(
      'Wöchentlich, mit Vorrang bei der Terminvergabe.',
      'Weekly, with priority when dates are handed out.',
    ),
    features: [
      l('52 Einsätze im Jahr', '52 visits a year'),
      l('15 % auf jede weitere Leistung', '15% off any further service'),
      l('Vorrang bei der Terminvergabe', 'Priority when dates are handed out'),
      l('Rechnung auf die Firma', 'Invoiced to the company'),
    ],
    price: 5410,
    listPrice: 6370,
    includedVisits: 52,
    validityMonths: 12,
    serviceSlug: 'bueroreinigung',
    extraDiscountPercent: 15,
    active: true,
    visibleOnSite: true,
    order: 6,
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
  planCancellationDays: 14,
  monthlyFreeSkips: 1, // §11.2
  creditValidityMonths: 12, // §11.3
  // §21 item 12 — key holding stays locked until a policy exists.
  hasLiabilityInsurance: false,
  applicationRetentionMonths: 6, // revDSG
  // §9.2 — drawn once on the settings screen, applied by `sendOffer`.
  ownerSignature: OWNER_SIGNATURE,
  messageTemplates: SEED_TEMPLATES,
};
