import type { Locale } from '@/i18n/routing';
import type { ServiceSlug } from '@/mock/schema';
import { stressString } from '@/i18n/stress';

/**
 * Long-form service content — deliberately *not* in the message dictionary.
 *
 * next-intl messages are a tree of strings; these are lists and question/answer
 * pairs, which is editorial content rather than interface copy. Modelling it as
 * content keeps the dictionaries reviewable and matches where this will
 * actually live in production: the admin "Leistungen" screen, editable per
 * language (§17.2).
 *
 * The "what is not included" list is the important one. The brief is explicit:
 * "القسم ده بيمنع نص المشاكل قبل ما تحصل، متشيلهوش".
 */
export interface ServiceContent {
  lead: string;
  included: string[];
  notIncluded: string[];
  faq: { q: string; a: string }[];
}

type ContentMap = Record<ServiceSlug, ServiceContent>;

const DE: ContentMap = {
  unterhaltsreinigung: {
    lead: 'Die wiederkehrende Reinigung, die Ihr Zuhause in Form hält — im Rhythmus, den Sie bestimmen.',
    included: [
      'Böden saugen und feucht wischen',
      'Küche: Arbeitsflächen, Spüle, Aussenflächen der Geräte',
      'Bäder: WC, Dusche oder Wanne, Lavabo, Spiegel, Armaturen',
      'Staub wischen auf erreichbaren Flächen',
      'Abfall entsorgen und Behälter reinigen',
      'Spiegel und Glastüren',
    ],
    notIncluded: [
      'Fenster (als Zusatzleistung buchbar)',
      'Schränke von innen',
      'Aufräumen persönlicher Gegenstände',
      'Arbeiten auf Leitern über zwei Meter',
    ],
    faq: [
      {
        q: 'Muss ich zuhause sein?',
        a: 'Nein. Die meisten Kundinnen und Kunden hinterlegen einen Schlüssel oder einen Schlüsselkasten. Ein- und Austrittszeit werden in beiden Fällen protokolliert.',
      },
      {
        q: 'Bringen Sie die Reinigungsmittel mit?',
        a: 'Ja, umweltverträgliche Mittel und Geräte sind im Preis enthalten. Wenn Sie eigene Produkte bevorzugen, verwenden wir diese.',
      },
      {
        q: 'Wie oft ist sinnvoll?',
        a: 'Für einen Haushalt mit zwei bis drei Personen meist wöchentlich oder alle zwei Wochen. Nach dem ersten Einsatz sagen wir Ihnen ehrlich, was reicht.',
      },
    ],
  },
  einmalreinigung: {
    lead: 'Einmal gründlich durch — ohne Abo, ohne Verpflichtung.',
    included: [
      'Vollständige Reinigung aller vereinbarten Räume',
      'Küche inklusive Aussenflächen der Geräte',
      'Bäder vollständig',
      'Böden, Staub, Spiegel, Glastüren',
    ],
    notIncluded: [
      'Fenster, Backofen, Kühlschrank (als Zusatzleistungen buchbar)',
      'Schränke von innen',
      'Entrümpelung',
    ],
    faq: [
      {
        q: 'Wie lange dauert das?',
        a: 'Für eine 3.5-Zimmer-Wohnung rund drei Stunden. Die genaue Dauer steht in Ihrer Offerte.',
      },
      {
        q: 'Kann ich daraus ein Abo machen?',
        a: 'Jederzeit. Viele starten mit einer Einmalreinigung und entscheiden danach.',
      },
    ],
  },
  grundreinigung: {
    lead: 'Tiefenreinigung bis in die Ecken, die bei der wöchentlichen Runde nicht drankommen.',
    included: [
      'Alles aus der Einmalreinigung',
      'Kalk in Dusche, Wanne und Armaturen',
      'Fugen und Silikon',
      'Hinter und unter beweglichen Möbeln',
      'Sockelleisten, Türrahmen, Lichtschalter',
      'Heizkörper zwischen den Rippen',
    ],
    notIncluded: [
      'Fassaden- oder Aussenarbeiten',
      'Teppich- oder Polstertiefenreinigung',
      'Schimmelsanierung',
    ],
    faq: [
      {
        q: 'Wie unterscheidet sich das von einer normalen Reinigung?',
        a: 'Wir rechnen etwa die anderthalbfache Zeit und arbeiten die Stellen ab, die sonst liegen bleiben: Kalk, Fugen, hinter Möbeln, Heizkörper.',
      },
      { q: 'Wie oft braucht man das?', a: 'Ein- bis zweimal jährlich, oder vor einem Einzug.' },
    ],
  },
  umzugsreinigung: {
    lead: 'Reinigung zur Wohnungsabgabe — mit schriftlicher Abnahmegarantie.',
    included: [
      'Vollständige Reinigung inklusive Schränke von innen',
      'Backofen, Kochfeld, Dampfabzug und Filter',
      'Kühlschrank abgetaut und gereinigt',
      'Fenster inklusive Rahmen und Storen, soweit erreichbar',
      'Kalk, Fugen, Sockelleisten, Türen',
      'Keller- oder Estrichabteil',
      'Nachreinigung kostenlos, falls die Abnahme nicht besteht',
    ],
    notIncluded: [
      'Entrümpelung und Entsorgung von Mobiliar',
      'Reparaturen und Malerarbeiten',
      'Aussenstoren und Fassade',
    ],
    faq: [
      {
        q: 'Wie funktioniert die Abnahmegarantie genau?',
        a: 'Beanstandet die Verwaltung bei der Abnahme die Reinigung, kommen wir vor dem Übergabetermin kostenlos zurück. Voraussetzung ist, dass die Wohnung zwischen unserem Einsatz und der Abnahme leer bleibt.',
      },
      {
        q: 'Wann soll ich buchen?',
        a: 'Am besten ein bis zwei Tage vor der Abnahme, und wenn die Wohnung bereits leer ist.',
      },
      {
        q: 'Muss die Wohnung leer sein?',
        a: 'Ja. Möbel und Kartons müssen raus, sonst können wir die Garantie nicht geben.',
      },
    ],
  },
  fensterreinigung: {
    lead: 'Glas, Rahmen und Sims — gezählt, nicht geschätzt.',
    included: ['Glas innen und aussen', 'Rahmen und Fensterbank', 'Griffe und Dichtungen abgewischt'],
    notIncluded: [
      'Fenster, die nur von aussen über eine Leiter über zwei Meter erreichbar sind',
      'Storen und Rollläden von aussen',
      'Wintergärten und Dachverglasungen',
    ],
    faq: [
      {
        q: 'Wie wird gerechnet?',
        a: 'Fünf Fenster entsprechen einer halben Stunde. Zählen Sie die Fensterflügel, nicht die Räume — bei einem Fenster mit zwei Flügeln sind das zwei.',
      },
      {
        q: 'Auch bei Regen?',
        a: 'Innen ja. Aussenarbeiten verschieben wir bei starkem Regen, ohne Kosten für Sie.',
      },
    ],
  },
  bueroreinigung: {
    lead: 'Regelmässige Reinigung für kleine Büros — mit ordentlicher Rechnung.',
    included: [
      'Arbeitsplätze und Besprechungsräume',
      'Küche und Kaffeebereich',
      'WC-Anlagen inklusive Verbrauchsmaterial auffüllen',
      'Böden, Abfall, Glastüren',
      'Empfangs- und Wartebereich',
    ],
    notIncluded: [
      'Reinigung an oder in Serverräumen',
      'Aufräumen von Unterlagen und Schreibtischen',
      'Fenster ab dem zweiten Obergeschoss von aussen',
    ],
    faq: [
      {
        q: 'Reinigen Sie ausserhalb der Bürozeiten?',
        a: 'Ja, bis 18 Uhr. Einsätze ab dem späten Nachmittag haben einen Zuschlag, der als eigene Zeile in der Offerte steht.',
      },
      { q: 'Erhalten wir eine Firmenrechnung?', a: 'Ja, mit QR-Rechnung auf die Firmenadresse.' },
    ],
  },
  moebelmontage: {
    lead: 'Aufgebaut, ausgerichtet, Verpackung entsorgt.',
    included: [
      'Aufbau nach Herstelleranleitung',
      'Ausrichten und Prüfen der Stabilität',
      'Wandbefestigung bei Kippgefahr',
      'Verpackung zusammengelegt und mitgenommen',
    ],
    notIncluded: [
      'Elektro- und Sanitäranschlüsse',
      'Bohrungen in Fliesen oder Beton ohne Vorabsprache',
      'Demontage bestehender Einbauten',
      'Transport der Möbel zum Objekt',
    ],
    faq: [
      {
        q: 'Woher wissen Sie, wie lange es dauert?',
        a: 'Sagen Sie uns in der Anfrage, welche Möbel es sind — ein Foto der Verpackung genügt. Wir rechnen pro Stück und nennen die Gesamtdauer in der Offerte.',
      },
      {
        q: 'Bringen Sie Werkzeug mit?',
        a: 'Ja, inklusive Akkuschrauber, Wasserwaage und Dübelmaterial für gängige Wände.',
      },
    ],
  },
};

const EN: ContentMap = {
  unterhaltsreinigung: {
    lead: 'The recurring clean that keeps your home in shape — at whatever rhythm you set.',
    included: [
      'Floors vacuumed and mopped',
      'Kitchen: worktops, sink, appliance exteriors',
      'Bathrooms: WC, shower or tub, basin, mirror, fittings',
      'Dusting of reachable surfaces',
      'Bins emptied and cleaned',
      'Mirrors and glass doors',
    ],
    notIncluded: [
      'Windows (available as an add-on)',
      'Inside cupboards',
      'Tidying personal belongings',
      'Work on ladders above two metres',
    ],
    faq: [
      {
        q: 'Do I need to be home?',
        a: 'No. Most customers leave a key or use a key box. Arrival and departure are logged either way.',
      },
      {
        q: 'Do you bring the products?',
        a: 'Yes, environmentally sound products and equipment are included. If you prefer your own, we use those.',
      },
      {
        q: 'How often makes sense?',
        a: 'For a household of two or three, usually weekly or every two weeks. After the first visit we will tell you honestly what is enough.',
      },
    ],
  },
  einmalreinigung: {
    lead: 'One thorough clean — no plan, no commitment.',
    included: [
      'Full clean of all agreed rooms',
      'Kitchen including appliance exteriors',
      'Bathrooms in full',
      'Floors, dusting, mirrors, glass doors',
    ],
    notIncluded: [
      'Windows, oven, fridge (available as add-ons)',
      'Inside cupboards',
      'Clearance work',
    ],
    faq: [
      {
        q: 'How long does it take?',
        a: 'Around three hours for a 3.5-room flat. The exact duration is in your quote.',
      },
      {
        q: 'Can I turn this into a plan?',
        a: 'Any time. Many people start with a one-off and decide afterwards.',
      },
    ],
  },
  grundreinigung: {
    lead: 'A deep clean reaching the places a weekly round never gets to.',
    included: [
      'Everything in the one-off clean',
      'Limescale in shower, tub and fittings',
      'Grout and silicone',
      'Behind and under movable furniture',
      'Skirting boards, door frames, light switches',
      'Radiators between the fins',
    ],
    notIncluded: [
      'Façade or exterior work',
      'Deep cleaning of carpets or upholstery',
      'Mould remediation',
    ],
    faq: [
      {
        q: 'How is this different from a normal clean?',
        a: 'We allow around one and a half times the time and work through what usually gets left: limescale, grout, behind furniture, radiators.',
      },
      { q: 'How often is it needed?', a: 'Once or twice a year, or before moving in.' },
    ],
  },
  umzugsreinigung: {
    lead: 'Cleaning for handing back a flat — with a written handover guarantee.',
    included: [
      'Full clean including the inside of cupboards',
      'Oven, hob, extractor and filters',
      'Fridge defrosted and cleaned',
      'Windows including frames and blinds, where reachable',
      'Limescale, grout, skirting boards, doors',
      'Cellar or attic compartment',
      'A free re-clean if the inspection is not passed',
    ],
    notIncluded: [
      'Clearance and disposal of furniture',
      'Repairs and painting',
      'External blinds and façade',
    ],
    faq: [
      {
        q: 'How exactly does the handover guarantee work?',
        a: 'If the managing agent objects to the cleaning at inspection, we come back free of charge before the handover date. The condition is that the flat stays empty between our visit and the inspection.',
      },
      {
        q: 'When should I book?',
        a: 'Ideally one or two days before the inspection, and once the flat is already empty.',
      },
      {
        q: 'Does the flat have to be empty?',
        a: 'Yes. Furniture and boxes must be out, otherwise we cannot give the guarantee.',
      },
    ],
  },
  fensterreinigung: {
    lead: 'Glass, frames and sills — counted, not guessed.',
    included: ['Glass inside and out', 'Frames and sills', 'Handles and seals wiped'],
    notIncluded: [
      'Windows only reachable from outside via a ladder above two metres',
      'Blinds and shutters from outside',
      'Conservatories and roof glazing',
    ],
    faq: [
      {
        q: 'How is it calculated?',
        a: 'Five windows equal half an hour. Count the sashes, not the rooms — a window with two sashes counts as two.',
      },
      {
        q: 'What about rain?',
        a: 'Inside, yes. Exterior work is rescheduled in heavy rain at no cost to you.',
      },
    ],
  },
  bueroreinigung: {
    lead: 'Regular cleaning for small offices — with a proper invoice.',
    included: [
      'Workstations and meeting rooms',
      'Kitchen and coffee area',
      'Toilets including restocking consumables',
      'Floors, bins, glass doors',
      'Reception and waiting area',
    ],
    notIncluded: [
      'Cleaning at or inside server rooms',
      'Tidying documents and desks',
      'Windows above the first floor from outside',
    ],
    faq: [
      {
        q: 'Do you clean outside office hours?',
        a: 'Yes, until 6 pm. Jobs starting in the late afternoon carry a surcharge, shown as its own line in the quote.',
      },
      { q: 'Do we get a company invoice?', a: 'Yes, with a QR-bill made out to the company address.' },
    ],
  },
  moebelmontage: {
    lead: 'Assembled, levelled, packaging taken away.',
    included: [
      'Assembly per the manufacturer’s instructions',
      'Levelling and a stability check',
      'Wall fixing where there is a tipping risk',
      'Packaging flattened and taken with us',
    ],
    notIncluded: [
      'Electrical and plumbing connections',
      'Drilling into tile or concrete without prior agreement',
      'Removing existing fitted units',
      'Transporting the furniture to the property',
    ],
    faq: [
      {
        q: 'How do you know how long it will take?',
        a: 'Tell us in the request which pieces they are — a photo of the packaging is enough. We estimate per item and state the total in the quote.',
      },
      {
        q: 'Do you bring tools?',
        a: 'Yes, including a cordless driver, spirit level and fixings for common wall types.',
      },
    ],
  },
};

// ASSUMPTION §20.6: FR and IT fall back to German until translated.
const BY_LOCALE: Record<Locale, ContentMap> = { de: DE, en: EN, fr: DE, it: DE };

export function getServiceContent(
  slug: ServiceSlug,
  locale: Locale,
  stressed = false,
): ServiceContent {
  const content = BY_LOCALE[locale][slug];
  if (!stressed) return content;

  // Editorial content sits outside the message pipeline, so the German stress
  // test has to be applied here too — otherwise these blocks would be the one
  // place on the site that never gets tested at full German length.
  return {
    lead: stressString(content.lead),
    included: content.included.map(stressString),
    notIncluded: content.notIncluded.map(stressString),
    faq: content.faq.map((item) => ({ q: stressString(item.q), a: stressString(item.a) })),
  };
}
