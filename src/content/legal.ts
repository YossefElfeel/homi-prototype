import type { Locale } from '@/i18n/routing';

/**
 * Legal pages.
 *
 * TODO:legal — the substance here is representative, not reviewed. Every
 * placeholder is marked so it is impossible to ship one by accident:
 *
 *   · registered office and address
 *   · UID (CHE-…)
 *   · legal form and commercial-register entry
 *
 * An Imprint is a legal requirement in Switzerland, so these must be filled in
 * before anything goes live. The text length is deliberately realistic — the
 * template has to survive a long document without becoming tiring to read
 * (screen 10).
 */
export const LEGAL_SLUGS = ['agb', 'datenschutz', 'impressum'] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
  list?: string[];
  /** Rendered with the placeholder warning banner. */
  placeholder?: boolean;
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const DE: Record<LegalSlug, LegalDocument> = {
  agb: {
    title: 'Allgemeine Geschäftsbedingungen',
    updated: '2026-08-01',
    intro:
      'Diese Bedingungen gelten für alle Reinigungs- und Montagearbeiten, die Homivaro für private und geschäftliche Auftraggeber am rechten Zürichseeufer erbringt.',
    sections: [
      {
        id: 'geltung',
        heading: '1. Geltungsbereich',
        paragraphs: [
          'Mit der Annahme einer Offerte kommt ein Vertrag zwischen dem Auftraggeber und Homivaro zustande. Abweichende Bedingungen des Auftraggebers gelten nur, wenn sie schriftlich bestätigt wurden.',
        ],
      },
      {
        id: 'offerte',
        heading: '2. Offerte und Preise',
        paragraphs: [
          'Die Offerte weist alle Positionen einzeln aus und ist während der darin genannten Frist verbindlich. Abgerechnet wird nach Stunden; Fläche, Zimmer und Bäder dienen ausschliesslich der Schätzung des Zeitaufwands.',
          'Zuschläge für Samstage und Einsätze am späten Nachmittag sowie allfällige Anfahrtskosten werden als eigene Position ausgewiesen und nie in einer Gesamtsumme verrechnet.',
          'Homivaro ist nicht mehrwertsteuerpflichtig. Der in der Offerte genannte Betrag ist der Endbetrag.',
        ],
      },
      {
        id: 'zahlung',
        heading: '3. Zahlung',
        paragraphs: [
          'Der Rechnungsbetrag ist bei Annahme der Offerte vollständig zu bezahlen. Der Termin wird erst nach Zahlungseingang verbindlich reserviert.',
          'Zahlungsmittel sind TWINT, Kredit- und Debitkarten sowie Apple Pay und Google Pay. Für wiederkehrende Abo-Belastungen wird eine hinterlegte Karte benötigt; TWINT eignet sich dafür nicht.',
        ],
      },
      {
        id: 'termine',
        heading: '4. Termine, Absagen und Verschiebungen',
        paragraphs: [
          'Termine können bis 24 Stunden vor Beginn kostenlos abgesagt oder verschoben werden.',
        ],
        list: [
          'Absage früher als 24 Stunden vor Beginn: kostenlos, vollständige Rückerstattung.',
          'Absage innerhalb von 24 Stunden: 50% des Leistungsbetrags, der Rest wird zurückerstattet.',
          'Verschiebung früher als 24 Stunden vor Beginn: kostenlos und gilt nicht als Absage.',
          'Verschiebung innerhalb von 24 Stunden: wie eine späte Absage.',
          'Kein Zutritt zum Objekt: 50% des Leistungsbetrags, dokumentiert mit Foto und Zeitstempel.',
          'Absage durch Homivaro: vollständige Rückerstattung und ein Rabatt auf den nächsten Einsatz.',
        ],
      },
      {
        id: 'zutritt',
        heading: '5. Zutritt zum Objekt',
        paragraphs: [
          'Der Auftraggeber stellt sicher, dass Homivaro zum vereinbarten Zeitpunkt Zugang zum Objekt hat. Zugangsdaten wie Schlüsselorte, Codes von Schlüsselkästen und Alarmcodes werden verschlüsselt gespeichert und ausschliesslich der ausführenden Person am Einsatztag angezeigt.',
          'Eine dauerhafte Aufbewahrung von Kundenschlüsseln erfolgt nur nach separater schriftlicher Vereinbarung.',
        ],
      },
      {
        id: 'garantie',
        heading: '6. Abnahmegarantie bei Umzugsreinigung',
        paragraphs: [
          'Wird die Reinigung bei der Wohnungsabnahme durch die Verwaltung beanstandet, reinigt Homivaro vor dem Übergabetermin kostenlos nach. Voraussetzung ist, dass das Objekt zwischen dem Einsatz und der Abnahme unbewohnt und leer bleibt und die Beanstandung unverzüglich gemeldet wird.',
        ],
      },
      {
        id: 'haftung',
        heading: '7. Haftung',
        paragraphs: [
          'Schäden sind unverzüglich zu melden und werden fotografisch dokumentiert. Die Regulierung erfolgt schriftlich.',
        ],
        placeholder: true,
      },
      {
        id: 'abo',
        heading: '8. Abonnements',
        paragraphs: [
          'Abonnements haben eine Mindestlaufzeit von zwölf Monaten und eine Kündigungsfrist von einem Monat. Die Abrechnung erfolgt monatlich im Voraus.',
          'Ein Einsatz pro Monat kann kostenlos ausgesetzt werden. Weitere ausgesetzte Einsätze gelten als erbracht. Ein Upgrade wirkt sofort, ein Downgrade ab der nächsten Abrechnungsperiode.',
        ],
      },
      {
        id: 'recht',
        heading: '9. Anwendbares Recht und Gerichtsstand',
        paragraphs: [
          'Es gilt schweizerisches Recht. Gerichtsstand ist der Sitz von Homivaro.',
        ],
        placeholder: true,
      },
    ],
  },

  datenschutz: {
    title: 'Datenschutzerklärung',
    updated: '2026-08-01',
    intro:
      'Homivaro bearbeitet Personendaten nach dem revidierten Schweizer Datenschutzgesetz (revDSG). Diese Erklärung beschreibt, welche Daten wir erheben, wozu wir sie verwenden und wie lange wir sie aufbewahren.',
    sections: [
      {
        id: 'verantwortlich',
        heading: '1. Verantwortliche Stelle',
        paragraphs: [
          'Verantwortlich für die Bearbeitung der Personendaten ist Homivaro.',
        ],
        placeholder: true,
      },
      {
        id: 'daten',
        heading: '2. Welche Daten wir bearbeiten',
        paragraphs: ['Wir erheben ausschliesslich Daten, die wir für die Leistung benötigen:'],
        list: [
          'Kontaktdaten: Name, E-Mail-Adresse, Telefonnummer, bevorzugte Sprache.',
          'Objektdaten: Adresse, Fläche, Zimmer, Bäder, Stockwerk, Lift, Haustiere.',
          'Zutrittsdaten: Schlüsselort, Code des Schlüsselkastens, Alarmcode, Notfallkontakt.',
          'Auftragsdaten: Anfragen, Offerten, Termine, Rechnungen, Zahlungen.',
          'Fotos vor und nach dem Einsatz.',
          'Bewerbungsunterlagen, sofern Sie sich bei uns bewerben.',
        ],
      },
      {
        id: 'zutrittsdaten',
        heading: '3. Zutrittsdaten',
        paragraphs: [
          'Zutrittsdaten sind besonders schützenswert. Sie werden verschlüsselt gespeichert und ausschliesslich der Person angezeigt, die den Einsatz ausführt, und nur am Tag des Einsatzes. Nach Abschluss des Auftrags sind sie für ausführende Personen nicht mehr einsehbar.',
        ],
      },
      {
        id: 'fotos',
        heading: '4. Fotos',
        paragraphs: [
          'Fotos vom Einsatz sind standardmässig intern. Eine Veröffentlichung, etwa in der Referenzgalerie, erfolgt ausschliesslich mit Ihrer ausdrücklichen schriftlichen Zustimmung, die wir dokumentieren. Sie können diese Zustimmung jederzeit widerrufen.',
        ],
      },
      {
        id: 'bewerbungen',
        heading: '5. Bewerbungen',
        paragraphs: [
          'Bewerbungsunterlagen werden ausschliesslich zur Prüfung der Bewerbung verwendet, sind nur für die Geschäftsleitung einsehbar und werden nach sechs Monaten gelöscht, sofern Sie einer längeren Aufbewahrung nicht ausdrücklich zustimmen.',
        ],
      },
      {
        id: 'rechte',
        heading: '6. Ihre Rechte',
        paragraphs: [
          'Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer Daten sowie auf Datenherausgabe. Bei einer Löschung bewahren wir jene Daten auf, zu deren Aufbewahrung wir gesetzlich verpflichtet sind, insbesondere Rechnungen.',
        ],
      },
      {
        id: 'aufbewahrung',
        heading: '7. Aufbewahrung',
        paragraphs: [
          'Nicht abgesendete Anfragen werden nach 30 Tagen gelöscht. Buchhaltungsrelevante Unterlagen bewahren wir während der gesetzlichen Frist von zehn Jahren auf.',
        ],
      },
    ],
  },

  impressum: {
    title: 'Impressum',
    updated: '2026-08-01',
    intro: 'Angaben gemäss den Anforderungen an die Betreiberkennzeichnung.',
    sections: [
      {
        id: 'firma',
        heading: 'Firma',
        paragraphs: [
          'Homivaro',
          'Rechtsform: noch einzusetzen',
          'Adresse: noch einzusetzen',
          'UID: CHE-… (noch einzusetzen)',
          'Handelsregister: noch einzusetzen',
        ],
        placeholder: true,
      },
      {
        id: 'kontakt',
        heading: 'Kontakt',
        paragraphs: [
          'Telefon: +41 44 599 91 36',
          'Mobile und WhatsApp: 076 227 79 66',
          'E-Mail: info@homivaro.ch',
          'Erreichbarkeit: Montag bis Samstag, 07:00–18:00',
        ],
      },
      {
        id: 'haftungsausschluss',
        heading: 'Haftungsausschluss',
        paragraphs: [
          'Die Inhalte dieser Website werden mit Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität wird keine Gewähr übernommen.',
        ],
      },
    ],
  },
};

// ASSUMPTION §20.6: EN, FR and IT fall back to the German documents until
// legally reviewed translations exist. A machine-translated contract would be
// worse than none.
export function getLegalDocument(slug: LegalSlug, _locale: Locale): LegalDocument {
  return DE[slug];
}
