/** Careers — public track (screens C1–C6). */
export const careersDe = {
  index: {
    eyebrow: 'Arbeiten bei Homivaro',
    title: 'Wir suchen Leute, denen man den Schlüssel gibt',
    lead: 'Homivaro reinigt Privathaushalte und montiert Möbel am rechten Zürichseeufer. Feste Kundschaft, ein enges Einsatzgebiet, und Arbeit, die man am Ergebnis misst.',
    openTitle: 'Offene Stellen',
    workload: 'Pensum',
    regions: 'Einsatzgebiet',
    kindPermanent: 'Festanstellung',
    kindPartTime: 'Teilzeit',
    kindTemporary: 'Befristet',
    kindFreelance: 'Auf Abruf',
    view: 'Stelle ansehen',

    emptyTitle: 'Zurzeit keine offene Stelle',
    emptyBody:
      'Das ändert sich regelmässig. Schicken Sie uns eine Spontanbewerbung — wir melden uns, sobald etwas passt.',
    spontaneousAction: 'Spontan bewerben',

    // §21 — this section speaks to two audiences at once: people who might
    // apply, and customers asking "who is coming into my home?". The four
    // steps themselves live in content/careers.ts, because a list of
    // title/body pairs is editorial content, not interface copy.
    howTitle: 'Wie wir auswählen',
    howLead:
      'Dieselben Angaben, die wir von Bewerbenden verlangen, sind die Antwort auf die häufigste Kundenfrage: Wer steht vor meiner Tür?',

    statusTitle: 'Schon beworben?',
    statusBody: 'Mit Ihrer Referenznummer sehen Sie jederzeit, wo Ihre Bewerbung steht.',
    statusAction: 'Status abfragen',
  },

  posting: {
    back: 'Alle Stellen',
    workload: 'Pensum',
    regions: 'Einsatzgebiet',
    kind: 'Anstellung',
    published: 'Ausgeschrieben seit',
    responsibilities: 'Ihre Aufgaben',
    requirements: 'Was Sie mitbringen',
    offer: 'Was wir bieten',
    apply: 'Jetzt bewerben',
    applyNote: 'Zwei Schritte, rund fünf Minuten. Sie können zwischendurch aufhören.',
    contactTitle: 'Fragen vorab?',
    contactBody:
      'Rufen Sie an, bevor Sie schreiben — bei uns geht die Geschäftsleitung selbst ans Telefon.',
  },

  form: {
    stepOf: 'Schritt {step} von 2',
    step1Title: 'Zu Ihrer Person',
    step2Title: 'Erfahrung und Verfügbarkeit',
    spontaneousTitle: 'Spontanbewerbung',
    forPosting: 'Bewerbung für: {title}',

    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail',
    phone: 'Telefon',
    postcode: 'PLZ',
    city: 'Ort',

    permitTitle: 'Arbeitsbewilligung',
    permitHint:
      'Wir fragen das zuerst, weil es die einzige Angabe ist, bei der wir keinen Spielraum haben.',
    permitCh: 'Schweizer Staatsangehörigkeit',
    permitC: 'Ausweis C (Niederlassung)',
    permitB: 'Ausweis B (Aufenthalt)',
    permitG: 'Ausweis G (Grenzgänger)',
    permitL: 'Ausweis L (Kurzaufenthalt)',
    permitOther: 'Andere Bewilligung',
    permitNone: 'Noch keine Bewilligung',
    permitNoneWarning:
      'Ohne gültige Bewilligung können wir Sie nicht anstellen. Sie können die Bewerbung trotzdem senden — wir melden uns, wenn sich das ändert.',

    languagesTitle: 'Sprachen',
    languagesHint: 'Deutsch brauchen Sie für den Kontakt mit der Kundschaft.',
    levelNone: '—',
    levelBasic: 'Grundkenntnisse',
    levelConversational: 'Gut',
    levelFluent: 'Fliessend',
    levelNative: 'Muttersprache',

    mobilityTitle: 'Mobilität',
    licence: 'Führerausweis',
    car: 'Eigenes Fahrzeug',
    mobilityHint: 'Kein Muss, aber im Einsatzgebiet ein deutlicher Vorteil.',

    experienceTitle: 'Erfahrung',
    years: 'Jahre Berufserfahrung',
    areas: 'Bereiche',
    areaCleaning: 'Reinigung',
    areaAssembly: 'Möbelmontage',

    availabilityTitle: 'Verfügbarkeit',
    availabilityDays: 'Mögliche Tage',
    availabilityFrom: 'Ab',
    availabilityTo: 'Bis',
    startFrom: 'Frühester Eintritt',

    referencesTitle: 'Referenzen',
    referencesHint: 'Wir rufen an. Zwei genügen.',
    referenceName: 'Name',
    referenceCompany: 'Firma',
    referencePhone: 'Telefon',
    referenceAdd: 'Referenz hinzufügen',
    referenceRemove: 'Entfernen',

    documentsTitle: 'Unterlagen',
    documentsHint: 'Lebenslauf als PDF. Arbeitszeugnisse, wenn Sie welche haben.',
    documentsAdd: 'Datei auswählen',
    documentsEmpty: 'Noch keine Datei ausgewählt.',
    documentsRemove: 'Entfernen',
    documentsDemo: 'Im Prototyp wird nichts hochgeladen — die Datei wird nur aufgeführt.',
    documentsTooLarge: 'Diese Datei ist grösser als 5 MB und wurde nicht übernommen.',

    motivation: 'Warum Homivaro?',
    motivationHint: 'Ein paar Sätze genügen. Kein Anschreiben nötig.',

    consentTitle: 'Einverständnis',
    consentLabel:
      'Ich bin einverstanden, dass Homivaro meine Angaben zur Prüfung dieser Bewerbung speichert.',
    consentRetention:
      'Wir löschen Ihre Bewerbung nach {months} Monaten automatisch. Sie können früher löschen lassen — eine Nachricht genügt.',

    back: 'Zurück',
    next: 'Weiter',
    submit: 'Bewerbung senden',
    required: 'Dieses Feld wird benötigt.',
    invalidEmail: 'Bitte prüfen Sie die E-Mail-Adresse.',
    consentRequired: 'Ohne Einverständnis können wir die Bewerbung nicht entgegennehmen.',
  },

  sent: {
    title: 'Ihre Bewerbung ist eingegangen',
    reference: 'Referenznummer',
    referenceHint: 'Notieren Sie sie — damit fragen Sie den Status ab.',
    nextTitle: 'Was jetzt passiert',
    retention: 'Ihre Angaben werden bis {date} aufbewahrt und danach gelöscht.',
    statusAction: 'Status abfragen',
    homeAction: 'Zur Startseite',
  },

  status: {
    title: 'Status Ihrer Bewerbung',
    lead: 'Geben Sie Ihre Referenznummer ein.',
    referenceLabel: 'Referenznummer',
    referencePlaceholder: 'BW-0031',
    check: 'Abfragen',
    notFoundTitle: 'Keine Bewerbung gefunden',
    notFoundBody:
      'Prüfen Sie die Nummer. Sie steht in der Bestätigung, die Sie nach dem Senden gesehen haben.',
    foundTitle: 'Bewerbung {reference}',
    submitted: 'Eingegangen am',
    stateNew: 'Ihre Bewerbung liegt bei uns. Wir melden uns innerhalb von fünf Arbeitstagen.',
    stateInReview: 'Wir prüfen Ihre Unterlagen und rufen Sie an.',
    stateAccepted: 'Willkommen im Team. Die Details haben wir Ihnen zugeschickt.',
    stateRejected:
      'Diesmal hat es nicht gepasst. Ihre Unterlagen bleiben bis zum Ablauf der Frist bei uns — melden Sie sich gern wieder.',
  },
};
