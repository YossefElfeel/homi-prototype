import type { Locale } from '@/i18n/routing';
import type { AddOn, Service, Settings } from './schema';

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
};
