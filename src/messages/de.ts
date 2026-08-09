/**
 * German is the source of truth for the message shape. Every other locale is
 * typed against it, so a missing key is a compile error rather than a blank
 * label discovered in review.
 */
export const de = {
  brand: {
    name: 'Homivaro',
    tagline: 'Sauber. Zuverlässig. Schweizer Qualität.',
    region: 'Rechtes Zürichseeufer',
    phone: '+41 44 599 91 36',
    mobile: '076 227 79 66',
    email: 'info@homivaro.ch',
  },

  nav: {
    services: 'Leistungen',
    pricing: 'Preise',
    packages: 'Abos',
    gallery: 'Referenzen',
    about: 'Über uns',
    contact: 'Kontakt',
    careers: 'Jobs',
    login: 'Anmelden',
    requestQuote: 'Offerte anfordern',
    menu: 'Menü',
    close: 'Schliessen',
    skipToContent: 'Zum Inhalt springen',
  },

  actions: {
    next: 'Weiter',
    back: 'Zurück',
    cancel: 'Abbrechen',
    save: 'Speichern',
    send: 'Senden',
    submit: 'Absenden',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    confirm: 'Bestätigen',
    close: 'Schliessen',
    skip: 'Überspringen',
    retry: 'Erneut versuchen',
    showMore: 'Mehr anzeigen',
    showLess: 'Weniger anzeigen',
    reveal: 'Anzeigen',
    hide: 'Verbergen',
    copy: 'Kopieren',
    download: 'Herunterladen',
    search: 'Suchen',
    filter: 'Filtern',
    reset: 'Zurücksetzen',
    apply: 'Anwenden',
    viewDetails: 'Details ansehen',
    callNow: 'Anrufen',
    whatsapp: 'WhatsApp',
  },

  common: {
    loading: 'Wird geladen …',
    optional: 'optional',
    required: 'Pflichtfeld',
    yes: 'Ja',
    no: 'Nein',
    from: 'ab',
    perHour: 'pro Stunde',
    hours: '{count, plural, one {# Stunde} other {# Stunden}}',
    minutes: '{count, plural, one {# Minute} other {# Minuten}}',
    estimate: 'Richtwert',
    estimateNote: 'Der verbindliche Preis steht in Ihrer Offerte.',
    of: 'von',
    step: 'Schritt {current} von {total}',
    notSet: '—',
    internalOnly: 'Nur intern',
  },

  money: {
    /** CHF 49.– / Std. — unit and audience always travel with the number. */
    perHour: '{amount} / Std.',
    perUnit: '{amount} / Stk.',
    perMonth: '{amount} / Monat',
    perVisit: '{amount} / Einsatz',
    total: 'Total',
    noVat: 'Keine MwSt. — Endpreis',
  },

  /** One colour, one label per state, everywhere. See lib/status-registry.ts. */
  status: {
    request: {
      draft: 'Entwurf',
      new: 'Neu',
      inReview: 'In Prüfung',
      offerSent: 'Offerte versendet',
      revisionRequested: 'Änderung angefragt',
      accepted: 'Angenommen',
      rejected: 'Abgelehnt',
      expired: 'Abgelaufen',
      cancelledByCustomer: 'Vom Kunden storniert',
      cancelledByCompany: 'Von uns storniert',
    },
    booking: {
      scheduled: 'Geplant',
      rescheduled: 'Verschoben',
      inProgress: 'In Ausführung',
      noAccess: 'Kein Zutritt',
      awaitingApproval: 'Freigabe ausstehend',
      completed: 'Abgeschlossen',
      invoiced: 'Verrechnet',
      closed: 'Geschlossen',
    },
    subscription: {
      active: 'Aktiv',
      pastDue: 'Zahlung überfällig',
      paused: 'Pausiert',
      cancellationPending: 'Kündigung eingegangen',
      cancelled: 'Gekündigt',
    },
    invoice: {
      draft: 'Entwurf',
      sent: 'Versendet',
      paid: 'Bezahlt',
      overdue: 'Überfällig',
      cancelled: 'Storniert',
    },
    review: {
      pending: 'Zur Prüfung',
      published: 'Veröffentlicht',
      rejected: 'Abgelehnt',
    },
    application: {
      new: 'Neu',
      inReview: 'In Prüfung',
      accepted: 'Angenommen',
      rejected: 'Abgesagt',
    },
  },

  form: {
    errorRequired: 'Dieses Feld wird benötigt.',
    errorEmail: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    errorPhone: 'Bitte geben Sie eine gültige Telefonnummer ein.',
    errorPostcode: 'Bitte geben Sie eine vierstellige Postleitzahl ein.',
    errorNumber: 'Bitte geben Sie eine Zahl ein.',
    errorMin: 'Mindestens {min}.',
    errorMax: 'Höchstens {max}.',
    errorFileType: 'Dieses Dateiformat wird nicht unterstützt. Erlaubt: JPG, PNG, PDF.',
    errorFileSize: 'Die Datei ist zu gross. Maximal {max} MB.',
    savedDraft: 'Ihre Angaben sind gespeichert. Sie können jederzeit weitermachen.',
  },

  empty: {
    genericTitle: 'Noch nichts vorhanden',
    genericBody: 'Sobald hier etwas eintrifft, sehen Sie es an dieser Stelle.',
    searchTitle: 'Keine Treffer',
    searchBody: 'Für «{query}» haben wir nichts gefunden. Versuchen Sie einen anderen Begriff.',
  },

  errors: {
    genericTitle: 'Das hat nicht geklappt',
    genericBody: 'Bitte versuchen Sie es noch einmal. Bleibt es dabei, rufen Sie uns an.',
    notFoundTitle: 'Diese Seite gibt es nicht',
    notFoundBody: 'Der Link ist möglicherweise veraltet. Diese Wege führen weiter:',
    retry: 'Nochmals versuchen',
    home: 'Zur Startseite',
    callUs: 'Anrufen',
    reference: 'Fehlerkennung {id}',
    referenceHint: 'Nennen Sie diese Kennung, wenn Sie anrufen.',
    loading: 'Wird geladen',
  },

  footer: {
    servicesHeading: 'Leistungen',
    companyHeading: 'Unternehmen',
    legalHeading: 'Rechtliches',
    contactHeading: 'Kontakt',
    terms: 'AGB',
    privacy: 'Datenschutz',
    imprint: 'Impressum',
    areasHeading: 'Einsatzgebiet',
    hours: 'Mo–Sa, 07:00–18:00',
    rights: '© {year} Homivaro. Alle Rechte vorbehalten.',
    careersCta: 'Wir suchen Verstärkung',
  },

  /** Prototype-only control surface. Never part of the product. */
  demo: {
    title: 'Demo-Steuerung',
    open: 'Demo-Steuerung öffnen',
    close: 'Demo-Steuerung schliessen',
    theme: 'Richtung',
    locale: 'Sprache',
    role: 'Rolle',
    scenario: 'Szenario',
    today: 'Heute ist',
    insurance: 'Haftpflichtversicherung',
    stress: 'DE-Stresstest',
    stressHint: 'Verlängert jeden Text um ~30% — deckt Layoutbrüche jetzt auf.',
    reset: 'Demo zurücksetzen',
    resetConfirm: 'Alle Demo-Daten auf den Ausgangszustand zurücksetzen?',
    screens: 'Screen-Index',
    openQuestions: 'Offene Fragen',
    roles: {
      visitor: 'Besucher',
      customer: 'Kunde',
      owner: 'Inhaber',
      contractor: 'Mitarbeiter',
    },
    scenarios: {
      demo: 'Standard',
      fresh: 'Tag 1 — alles leer',
      busy: 'Volle Woche',
      overdue: 'Offene Rechnungen',
      away: 'Inhaber abwesend',
      conflict: 'Termin-Kollision',
      hiring: 'Bewerbungen',
    },
  },
};

/**
 * Deliberately no `as const`: the shape (every key, nested) is what other
 * locales must satisfy, not the German strings themselves.
 */
export type Messages = typeof de;
