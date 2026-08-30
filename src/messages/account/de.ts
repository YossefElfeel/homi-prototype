/** Customer dashboard (screens 32–49). */
export const accountDe = {
  shell: {
    title: 'Mein Konto',
    nav: {
      dashboard: 'Übersicht',
      requests: 'Anfragen',
      offers: 'Offerten',
      invoices: 'Rechnungen',
      properties: 'Objekte',
      subscription: 'Abo',
      payment: 'Zahlungsmittel',
      review: 'Bewertung abgeben',
      messages: 'Nachrichten',
      profile: 'Profil',
    },
    groups: {
      jobs: 'Aufträge',
      account: 'Konto',
    },
    menu: 'Menü',
    signOut: 'Abmelden',
    blockedTitle: 'Ihr Konto ist gesperrt.',
    blockedBody:
      'Bitte melden Sie sich bei uns, damit wir das klären. Ihre Rechnungen und Ihr Verlauf bleiben erhalten.',
    gateTitle: 'Nur für angemeldete Kundschaft',
    gateBody:
      'Diese Ansicht gehört zum Kundenkonto. Wechseln Sie unten rechts in den Demo-Einstellungen die Rolle auf «Kundin».',
    gateCurrent: 'Aktuelle Rolle: {role}',
    gateAction: 'Anmelden',
  },

  signIn: {
    title: 'Anmelden',
    lead: 'Mit E-Mail-Link oder Passwort — beides führt zum selben Konto.',
    emailLabel: 'E-Mail',
    passwordLabel: 'Passwort',
    linkAction: 'Link per E-Mail senden',
    passwordAction: 'Mit Passwort anmelden',
    usePassword: 'Stattdessen Passwort verwenden',
    useLink: 'Stattdessen Link per E-Mail',
    forgot: 'Passwort vergessen?',
    sentTitle: 'Link versendet',
    sentBody:
      'Wir haben Ihnen einen Anmeldelink an {email} geschickt. Er ist 15 Minuten gültig.',
    sentAgain: 'Erneut senden',
    errorTitle: 'Anmeldung nicht möglich',
    errorBody: 'E-Mail oder Passwort stimmen nicht. Prüfen Sie beides.',
    noAccountTitle: 'Noch kein Konto?',
    noAccountBody:
      'Ein Konto entsteht automatisch, sobald wir Ihnen die erste Offerte senden. Senden Sie einfach eine Anfrage.',
    noAccountAction: 'Offerte anfordern',
    demoNote: 'Prototyp: jede Eingabe führt zum Demo-Konto.',
  },

  activate: {
    title: 'Konto aktivieren',
    lead: 'Vergeben Sie ein Passwort — oder melden Sie sich künftig per E-Mail-Link an.',
    passwordLabel: 'Neues Passwort',
    repeatLabel: 'Passwort wiederholen',
    rulesTitle: 'Anforderungen',
    ruleLength: 'Mindestens 10 Zeichen',
    ruleMatch: 'Beide Eingaben stimmen überein',
    submit: 'Konto aktivieren',
    skip: 'Ohne Passwort fortfahren',
    skipHint: 'Sie melden sich dann jedes Mal mit einem E-Mail-Link an.',
  },

  reset: {
    title: 'Passwort zurücksetzen',
    lead: 'Wir senden Ihnen einen Link zum Zurücksetzen.',
    emailLabel: 'E-Mail',
    submit: 'Link senden',
    sentTitle: 'Wenn es dieses Konto gibt, ist der Link unterwegs',
    sentBody:
      'Aus Datenschutzgründen bestätigen wir nicht, ob zu dieser Adresse ein Konto besteht.',
    back: 'Zurück zur Anmeldung',
  },

  dashboard: {
    greeting: 'Guten Tag, {name}',
    nextTitle: 'Ihr nächster Termin',
    nextNone: 'Zurzeit ist kein Termin gebucht.',
    nextAction: 'Termin ansehen',
    arrival: 'Ankunft zwischen {from} und {to}',
    cancelFreeUntil: 'Kostenlose Absage bis {date}',
    /* Vorher änderte sich einfach das Datum. Ein verschobener Einsatz sah
       genauso aus wie einer, der immer an diesem Tag war. */
    movedNote: 'Wir haben diesen Termin am {at} verschoben. Vorher: {from}.',
    openTitle: 'Wartet auf Sie',
    openOffer: 'Offerte {reference} — gültig bis {date}',
    openInvoice: 'Rechnung {reference} — fällig am {date}',
    openMessage: '{n, plural, one {# ungelesene Nachricht} other {# ungelesene Nachrichten}}',
    openNone: 'Nichts offen.',
    quickTitle: 'Schnellzugriff',
    quickRequest: 'Neue Anfrage',
    quickProperties: 'Objekte verwalten',
    quickInvoices: 'Rechnungen',
    emptyTitle: 'Willkommen bei Homivaro',
    emptyBody:
      'Sobald Ihre erste Anfrage unterwegs ist, sehen Sie hier Termine, Offerten und Rechnungen an einem Ort.',
    emptyAction: 'Offerte anfordern',
  },

  requests: {
    title: 'Meine Anfragen',
    colReference: 'Referenz',
    colService: 'Leistung',
    colProperty: 'Objekt',
    colCreated: 'Gesendet',
    colStatus: 'Status',
    rowOpen: 'Details ansehen',
    rowOffer: 'Offerte ansehen',
    search: 'Referenz, Leistung oder Adresse',
    filterStatus: 'Status',
    filterService: 'Leistung',
    filterAll: 'Alle',
    filterReset: 'Filter zurücksetzen',
    filterEmptyTitle: 'Keine Anfrage in dieser Auswahl',
    /* Nennt bewusst weder Status noch Leistung: die beiden Menüs wirken
       zusammen, und ein Text, der nur eines von beiden nennt, schickt beim
       Suchen nach dem Fehler in die falsche Zeile. */
    filterEmptyBody:
      'Zu dieser Auswahl gehört gerade keine Ihrer Anfragen. Filter zurücksetzen zeigt wieder alle.',
    searchEmptyTitle: 'Nichts gefunden',
    searchEmptyBody:
      'Zu «{query}» gibt es keine Anfrage. Gesucht wird in Referenz, Leistung und Adresse.',
    emptyTitle: 'Noch keine Anfrage',
    emptyBody: 'Ihre Anfragen und der jeweilige Stand erscheinen hier.',
    emptyAction: 'Offerte anfordern',
  },

  request: {
    back: 'Alle Anfragen',
    /* Eine Anfrage, die es nicht mehr gibt, endete auf einem nackten
       Gedankenstrich — dieselbe Sackgasse, die der Rechnungsbildschirm
       längst gelöst hatte. */
    missingTitle: 'Diese Anfrage finden wir nicht',
    missingBody:
      'Vielleicht ist der Link nicht mehr aktuell. In der Übersicht stehen alle Anfragen, die zu Ihrem Konto gehören.',
    sentOn: 'Gesendet am',
    serviceTitle: 'Leistung',
    propertyTitle: 'Objekt',
    detailsTitle: 'Ihre Angaben',
    noteTitle: 'Ihre Nachricht',
    /* «Verlauf» hiess hier, was im Panel «Ablauf» hiess — ein und dieselbe
       Leiste, aus derselben Ableitung, unter zwei Namen. Wer zwischen den
       beiden Bildschirmen wechselt, musste raten, ob er dasselbe sieht. Ein
       Name für beide, und er sagt, was die Leiste beantwortet: wie weit ist
       die Anfrage. */
    progressTitle: 'Fortschritt der Anfrage',
    /* Die Leiste war definiert und wurde von nichts gerendert — der Kunde
       sah nur ein Etikett und «Wir sind dran». Dieselben Stufen wie im Panel,
       aus derselben Ableitung: zwei Antworten auf «wo steht das?» wären
       schlimmer als gar keine. */
    stageReceived: 'Eingegangen',
    stageReviewed: 'Wird geprüft',
    /* Der Entwurf ist Sache des Büros und erreicht den Kunden nie — die Stufe
       steht trotzdem hier, weil «Offerte wird erstellt» eine ehrlichere
       Auskunft ist als ein zweiter Tag Stillstand auf «wird geprüft». */
    stageDrafted: 'Offerte wird erstellt',
    stageQuoted: 'Offerte erhalten',
    stageRevision: 'Änderung angefragt',
    stageScheduled: 'Termin steht',
    stageSigned: 'Unterschrieben',
    stagePaid: 'Bezahlt',
    stageBooked: 'Gebucht',
    stageDeclined: 'Abgelehnt',
    stageCancelled: 'Zurückgezogen',
    stageExpired: 'Abgelaufen',
    offerTitle: 'Ihre Offerte',
    offerBody: 'Die Offerte zu dieser Anfrage liegt bereit.',
    /* Angenommen, abgelehnt, abgelaufen — drei Ausgänge, und «liegt bereit»
       stand über allen dreien. Nachlesen kann man sie weiter, annehmen nicht
       mehr. */
    offerClosedBody: 'Diese Offerte ist abgeschlossen. Nachlesen können Sie sie weiterhin.',
    offerAction: 'Offerte öffnen',
    waitingTitle: 'Wir sind dran',
    waitingBody: 'Sie erhalten die Offerte innerhalb von {hours} Stunden.',
    /* «Vom Kunden storniert» war als Status deklariert, übersetzt und
       eingefärbt — und von keinem Bildschirm aus erreichbar. Wer es sich
       anders überlegt hatte, musste anrufen. */
    cancelAction: 'Anfrage zurückziehen',
    cancelTitle: 'Anfrage zurückziehen?',
    cancelBody:
      'Die Anfrage wird geschlossen und eine allfällige Offerte dazu verfällt. Rückgängig machen können Sie das nicht — eine neue Anfrage ist jederzeit möglich.',
    cancelReason: 'Grund',
    cancelReasonHint: 'Freiwillig. Hilft uns, das nächste Mal besser zu treffen.',
    cancelReasonPlaceholder: 'z. B. Termin passt nicht mehr, anders gelöst …',
    cancelConfirm: 'Zurückziehen',
    cancelDismiss: 'Behalten',
    cancelDone: 'Anfrage {reference} zurückgezogen.',
    cancelledTitle: 'Zurückgezogen',
    cancelledBody: 'Diese Anfrage ist geschlossen. Eine neue können Sie jederzeit stellen.',
    cancelledAction: 'Neue Anfrage',
  },

  offers: {
    title: 'Meine Offerten',
    colReference: 'Referenz',
    colService: 'Leistung',
    colTotal: 'Betrag',
    colValid: 'Gültig bis',
    colStatus: 'Status',
    expiresSoon: 'Läuft in {days} Tagen ab',
    rowOpen: 'Details ansehen',
    rowRequest: 'Anfrage öffnen',
    /* Referenz und Leistung — genau das, was in der Zeile steht. Der Betrag
       nicht: nach «1200» zu suchen findet die Offerte über 1'200.50 nicht, und
       das liest sich wie ein kaputtes Feld. */
    search: 'Referenz oder Leistung',
    filterStatus: 'Status',
    filterAll: 'Alle',
    filterReset: 'Filter zurücksetzen',
    filterEmptyTitle: 'Keine Offerte in dieser Auswahl',
    filterEmptyBody:
      'Zu dieser Auswahl gehört gerade keine Ihrer Offerten. Filter zurücksetzen zeigt wieder alle.',
    searchEmptyTitle: 'Nichts gefunden',
    searchEmptyBody:
      'Zu «{query}» gibt es keine Offerte. Gesucht wird in Referenz und Leistung.',
    emptyTitle: 'Keine Offerten',
    emptyBody: 'Sobald wir auf eine Anfrage antworten, finden Sie die Offerte hier.',
    /* Eine Offerte kann man nicht selbst auslösen — die Anfrage, die zu einer
       führt, schon. */
    emptyAction: 'Offerte anfordern',
  },

  invoices: {
    title: 'Meine Rechnungen',
    colReference: 'Nummer',
    colIssued: 'Datum',
    colDue: 'Fällig',
    colAmount: 'Betrag',
    colStatus: 'Status',
    rowOpen: 'Details ansehen',
    /* Die QR-Referenz steht drin, weil sie auf dem Kontoauszug erscheint: die
       Nummer aus dem E-Banking hierher zu kopieren beantwortet «wofür war
       diese Zahlung». */
    search: 'Nummer oder QR-Referenz',
    filterStatus: 'Status',
    filterAll: 'Alle',
    /* «Offen» ist kein Status, sondern die Frage dahinter — und für die Kundin
       die eigentliche: versendet und überfällig sind beides Geld, das noch zu
       zahlen ist. */
    filterOutstanding: 'Offen',
    filterReset: 'Filter zurücksetzen',
    emptyTitle: 'Keine Rechnungen',
    emptyBody: 'Rechnungen erscheinen hier, sobald ein Auftrag abgeschlossen ist.',
    /* Eine Rechnung stellen wir — auslösen lässt sich hier also nur der
       Auftrag, aus dem eine wird. */
    emptyAction: 'Offerte anfordern',
    /* Keine überfällige Rechnung zu haben ist eine gute Nachricht und kein
       leeres Konto — deshalb ein eigener Text statt «Keine Rechnungen». */
    filterEmptyTitle: 'Keine Rechnung in dieser Auswahl',
    filterEmptyBody:
      'Zu dieser Auswahl gehört gerade keine Ihrer Rechnungen. Zurücksetzen zeigt wieder alle.',
    /* Die Suche kann sagen, woran sie gescheitert ist; der Filter nur, welche
       Menüs stehen. Zwei Texte, weil es zwei verschiedene Nichts sind. */
    searchEmptyTitle: 'Nichts gefunden',
    searchEmptyBody:
      'Zu «{query}» gibt es keine Rechnung. Gesucht wird in Nummer und QR-Referenz.',
  },

  invoice: {
    back: 'Alle Rechnungen',
    /* Eine Rechnung, die es nicht gibt, und eine, die noch nicht freigegeben
       ist, landen bewusst beim selben Text: «die gibt es, Sie dürfen sie nur
       nicht sehen» verrät genau das, was zurückgehalten wird. */
    missingTitle: 'Diese Rechnung finden wir nicht',
    missingBody:
      'Vielleicht ist der Link nicht mehr aktuell. In der Übersicht stehen alle Rechnungen, die zu Ihrem Konto gehören.',
    issued: 'Rechnungsdatum',
    due: 'Zahlbar bis',
    paidOn: 'Bezahlt am',
    linesTitle: 'Positionen',
    total: 'Total',
    qrTitle: 'QR-Rechnung',
    qrBody:
      'Zahlbar über E-Banking mit der Referenz unten. Der Betrag ist bereits hinterlegt.',
    reference: 'Referenz',
    download: 'Als PDF herunterladen',
    downloadNote: 'Prototyp: es wird keine Datei erzeugt.',
    downloadToast: 'Im Prototyp wird noch keine PDF-Datei erzeugt.',
    overdueTitle: 'Überfällig',
    overdueBody: 'Diese Rechnung war am {date} fällig. Falls Sie bereits bezahlt haben, ist diese Meldung gegenstandslos.',
  },

  properties: {
    title: 'Meine Objekte',
    lead: 'Objekte, die Sie hinterlegt haben. Angaben hier sparen bei jeder Anfrage Zeit.',
    rooms: '{n} Zimmer',
    bathrooms: '{n} Bäder',
    area: '{n} m²',
    colLabel: 'Bezeichnung',
    colAddress: 'Adresse',
    colKind: 'Art',
    colSize: 'Grösse',
    colNextVisit: 'Nächster Termin',
    nothingBooked: 'Nichts gebucht',
    rowOpen: 'Details ansehen',
    search: 'Bezeichnung oder Adresse',
    filterKind: 'Art',
    filterAll: 'Alle',
    filterReset: 'Filter zurücksetzen',
    filterEmptyTitle: 'Kein Objekt in dieser Auswahl',
    filterEmptyBody:
      'Zu dieser Auswahl gehört gerade keines Ihrer Objekte. Filter zurücksetzen zeigt wieder alle.',
    searchEmptyTitle: 'Nichts gefunden',
    searchEmptyBody:
      'Zu «{query}» gibt es kein Objekt. Gesucht wird in Bezeichnung und Adresse.',
    addAction: 'Objekt hinzufügen',
    addDone: 'Objekt erfasst.',
    newTitle: 'Objekt erfassen',
    newLead: 'Diese Angaben brauchen wir für die Offerte. Sie können sie später ändern.',
    newLabel: 'Bezeichnung',
    newLabelHint: 'z. B. Wohnung Küsnacht',
    newKind: 'Art',
    newStreet: 'Strasse und Nummer',
    newPostcode: 'PLZ',
    newCity: 'Ort',
    newArea: 'Fläche in m²',
    newRooms: 'Zimmer',
    newBathrooms: 'Bäder',
    newSave: 'Objekt speichern',
    dismiss: 'Abbrechen',
    kinds: {
      apartment: 'Wohnung',
      house: 'Haus',
      office: 'Büro',
    },
    emptyTitle: 'Noch kein Objekt',
    emptyBody:
      'Beim ersten Auftrag legen wir das Objekt automatisch an. Sie können es auch jetzt schon erfassen.',
  },

  property: {
    back: 'Alle Objekte',
    missingTitle: 'Dieses Objekt finden wir nicht',
    missingBody:
      'Vielleicht ist der Link nicht mehr aktuell. In der Übersicht stehen alle Objekte, die zu Ihrem Konto gehören.',
    factsTitle: 'Eckdaten',
    kind: 'Art',
    area: 'Fläche',
    rooms: 'Zimmer',
    bathrooms: 'Bäder',
    floor: 'Etage',
    elevator: 'Lift',
    pets: 'Haustiere',
    yes: 'Ja',
    no: 'Nein',
    accessTitle: 'Zutritt',
    accessBody: 'Wie wir ins Objekt kommen. Diese Angaben sind besonders geschützt.',
    accessNone: 'Noch keine Zutrittsangaben hinterlegt.',
    method: {
      'customer-present': 'Sie sind zuhause',
      'key-left': 'Schlüssel deponiert',
      'key-box': 'Schlüsselsafe',
      'other-person': 'Eine andere Person öffnet',
    },
    accessEdit: 'Zutritt bearbeiten',
    accessMethodLabel: 'Wie kommen wir rein',
    accessKeyLocationLabel: 'Wo liegt der Schlüssel',
    accessBoxLocationLabel: 'Wo hängt der Safe',
    accessPersonLabel: 'Wer öffnet',
    accessPhoneLabel: 'Telefon dieser Person',
    accessCodeNote:
      'Codes nehmen wir nicht hier entgegen — die besprechen wir telefonisch und legen sie verschlüsselt ab.',
    accessSave: 'Zutritt speichern',
    accessSaved: 'Zutritt gespeichert.',
    dismiss: 'Abbrechen',
    accessWhoTitle: 'Wer sieht das',
    accessWho:
      'Die Geschäftsleitung jederzeit. Die ausführende Person nur am Einsatztag und nur für diesen Einsatz.',
    notesTitle: 'Dauerhafte Hinweise',
    notesHint: 'Zum Beispiel: Katze nicht rauslassen, Ersatzschlüssel beim Nachbarn.',
    historyTitle: 'Einsätze an diesem Objekt',
    historyEmpty: 'Noch keine Einsätze.',
  },

  subscription: {
    title: 'Meine Abos',
    leadOne: 'Was in Ihrem Paket steckt, wie viel davon noch offen ist, und bis wann.',
    leadMany:
      '{n} Abos auf verschiedenen Objekten. Jede Karte zeigt, für welche Adresse sie gilt.',
    propertyUnknown: 'Objekt nicht hinterlegt',
    visitsTitle: 'Einsätze in Ihrem Paket',
    visitsOf: '{used} von {total} genutzt',
    visitsLeft: 'Noch {n} Einsätze offen',
    visitsNone: 'Alle Einsätze aufgebraucht. Weitere Einsätze rechnen wir mit Ihrem Rabatt ab.',
    rhythm: 'Rhythmus',
    paid: 'Bezahlt',
    validUntil: 'Gültig bis',
    discount: 'Ihr Rabatt ausserhalb des Pakets',
    renewals: 'Bereits verlängert',
    benefitsTitle: 'Was enthalten ist',
    skipTitle: 'Termin überspringen',
    skipBody: '{used} von {free} kostenlosen Verschiebungen in diesem Monat genutzt.',
    skipAction: 'Nächsten Termin überspringen',
    skipBlocked:
      'Die kostenlose Verschiebung für diesen Monat ist aufgebraucht. Ein weiterer Ausfall wird als Einsatz gerechnet.',
    skipped: 'Nächster Einsatz übersprungen.',
    pausedTitle: 'Abo pausiert',
    pausedBody: 'Es werden keine Termine geplant. Ihre offenen Einsätze bleiben erhalten.',
    resume: 'Abo fortsetzen',
    resumed: 'Abo läuft wieder.',
    upgradeTitle: 'Grösseres Abo',
    upgradeBody:
      'Ein Wechsel nach oben gilt sofort, ein Wechsel nach unten ab der nächsten Laufzeit. Schreiben Sie uns, wir rechnen die schon bezahlten Einsätze an.',
    upgradeTo: 'Auf {name} wechseln',
    expiredTitle: 'Laufzeit abgelaufen',
    expiredBody: 'Ihr Abo ist am {date} ausgelaufen. Verlängern Sie es hier.',
    expiredWithLeft:
      'Ihr Abo ist am {date} ausgelaufen — mit {n} nicht genutzten Einsätzen. Die verfallen mit der Laufzeit.',
    renew: 'Um ein Jahr verlängern',
    renewDone: 'Verlängert. Die Rechnung liegt in Ihrem Konto.',
    renewBlocked: 'Dieses Abo wird nicht mehr angeboten.',
    renewRetired: 'Dieses Abo wird nicht mehr angeboten. Sehen Sie sich die aktuellen an.',
    cancelTitle: 'Stornieren',
    cancelBody:
      'Solange kein Einsatz stattgefunden hat, stornieren wir bis zum {date} und erstatten den vollen Betrag.',
    cancelAction: 'Stornieren und erstatten lassen',
    cancelDone: 'Storniert. Der Betrag wird erstattet.',
    cancelBlocked: {
      used: 'Eine Stornierung ist nicht mehr möglich — es hat bereits ein Einsatz stattgefunden. Ihre offenen Einsätze bleiben Ihnen bis zum Ende der Laufzeit.',
      windowClosed:
        'Die Widerrufsfrist ist abgelaufen. Ihre offenen Einsätze bleiben Ihnen bis zum Ende der Laufzeit.',
      notActive: 'Nur ein laufendes Abo kann storniert werden.',
    },
    emptyTitle: 'Kein laufendes Abo',
    emptyBody:
      'Ein Abo ist ein Paket Einsätze, das Sie einmal bezahlen und ein Jahr lang abrufen — mit Rabatt auf alles darüber hinaus.',
    emptyAction: 'Pakete ansehen',
  },

  payment: {
    title: 'Zahlungsmittel',
    lead: 'Für einmalige Aufträge und für die Abbuchung im Abo.',
    savedTitle: 'Hinterlegt',
    savedNone: 'Noch kein Zahlungsmittel hinterlegt.',
    expires: 'gültig bis {date}',
    addTitle: 'Hinzufügen',
    /* Die vier Knöpfe legten früher direkt los. Dass jetzt ein Formular kommt,
       steht hier — sonst wirkt der erste Klick wie ein Fehlgriff. */
    addLead: 'Jede Art fragt nach dem, was sie braucht.',
    addDialogTitle: '{method} hinterlegen',
    addLeadCard: 'Für einmalige Aufträge und für die monatliche Abbuchung im Abo.',
    addLeadOneOff: 'Für einmalige Aufträge. Das Abo wird davon nicht abgebucht.',
    card: 'Karte',
    twint: 'TWINT',
    applePay: 'Apple Pay',
    googlePay: 'Google Pay',
    recurringTitle: 'Für das Abo',
    twintBlockedTitle: 'TWINT nicht für wiederkehrende Zahlungen',
    twintBlockedBody:
      'TWINT unterstützt keine automatische Abbuchung. Für das Abo brauchen wir eine Karte; einzelne Aufträge können Sie weiterhin mit TWINT bezahlen.',
    defaultLabel: 'Standard',
    makeDefault: 'Als Standard',
    remove: 'Entfernen',
    demoNote: 'Prototyp: es werden keine echten Zahlungsdaten erfasst.',
    added: 'Zahlungsmittel hinterlegt.',
    removed: 'Zahlungsmittel entfernt.',
    defaultSet: 'Als Standard gesetzt.',
  },

  review: {
    title: 'Bewertung schreiben',
    lead: 'Für den Einsatz am {date}, {service}.',
    ratingLabel: 'Wie zufrieden waren Sie?',
    star: '{n} von 5 Sternen',
    textLabel: 'Ihre Rückmeldung',
    textHint: 'Was hat gepasst, was nicht? Zwei Sätze helfen uns mehr als fünf Sterne.',
    publishLabel: 'Bewertung darf auf der Website erscheinen',
    publishHint: 'Nur mit Ihrem Vornamen und dem ersten Buchstaben des Nachnamens.',
    submit: 'Bewertung senden',
    thanksTitle: 'Danke',
    thanksBody:
      'Wir lesen jede Rückmeldung. Kritik beantworten wir, bevor sie veröffentlicht wird.',
    emptyTitle: 'Noch nichts zu bewerten',
    emptyBody: 'Nach dem ersten abgeschlossenen Einsatz fragen wir Sie hier nach Ihrer Meinung.',
    /* Die Dankesseite war eine Sackgasse: Häkchen, Titel, Text — kein Link. */
    thanksToOverview: 'Zur Übersicht',
    /* Hiess «Vorher / Nachher ansehen» und führte auf den eigenen Bereich, den
       es nicht mehr gibt. Die Fotos liegen jetzt auf der Anfrage, aus der der
       Auftrag entstanden ist — der Weg dahin führt über die Liste. */
    thanksToRequests: 'Zu Ihren Anfragen',
    emptyAction: 'Anfragen ansehen',
  },

  /* War ein eigener Bereich mit Titel, Lead und Leerzustand. Jetzt eine Karte
     auf der Anfrage, die den Auftrag hervorgebracht hat — «Fotos, die das Team
     bei Ihren Einsätzen aufgenommen hat» galt für eine Liste über alle
     Aufträge hinweg und stimmt für einen einzelnen nicht mehr. */
  photos: {
    title: 'Vorher / Nachher',
    before: 'Vorher',
    after: 'Nachher',
    consentBody:
      'Diese Fotos gehören Ihnen. Auf der Website erscheinen sie nur, wenn Sie schriftlich zustimmen — und ohne erkennbare Details.',
    consentLabel: 'Diese Fotos dürfen auf der Website erscheinen',
  },

  messages: {
    title: 'Nachrichten',
    lead: 'Alles, was zu Ihren Aufträgen geschrieben wurde — an einem Ort.',
    /* «Betreff {reference}» stand als Überschrift über jedem Gespräch, als
       noch alle offen untereinander standen. Die Liste links nennt das
       Gespräch bereits — die Überschrift wiederholte nur die Zeile, die man
       gerade angeklickt hat. */
    unread: 'Ungelesen',
    /* Referenz *und* Text: die Referenz ist eine Nummer, und niemand weiss
       auswendig, unter welcher der gesuchte Satz steht. Hiess «Betreff oder
       Text» — das Wort steht nun nirgends mehr auf dem Bildschirm. */
    search: 'Referenz oder Text',
    tabAll: 'Alle',
    /* Woran ein Gespräch hängt. Die Referenz allein — «O-2494-1» — sagt einer
       Kundin nichts; das Wort davor schon. */
    kind: {
      request: 'Anfrage',
      offer: 'Offerte',
      booking: 'Auftrag',
      invoice: 'Rechnung',
      other: 'Sonstiges',
    },
    filterReset: 'Suche leeren',
    searchEmptyTitle: 'Nichts gefunden',
    searchEmptyBody:
      'Zu «{query}» gibt es keine Nachricht. Gesucht wird in Referenz und Text.',
    pickTitle: 'Gespräch auswählen',
    pickBody: 'Wählen Sie links ein Gespräch aus, um es zu lesen und zu antworten.',
    /* Eine Nachricht darf aus einem Anhang allein bestehen. In der Liste
       stünde sonst eine leere Zeile da, wo etwas angekommen ist. */
    attachmentOnly: 'Nur ein Anhang',
    replyLabel: 'Antworten',
    replyPlaceholder: 'Ihre Nachricht',
    send: 'Senden',
    fromUs: 'Homivaro',
    fromYou: 'Sie',
    noteTitle: 'Kein Live-Chat',
    noteBody:
      'Wir antworten innerhalb eines Arbeitstags. Dringendes bitte telefonisch — die Geschäftsleitung geht selbst ans Telefon.',
    emptyTitle: 'Keine Nachrichten',
    emptyBody: 'Sobald zu einem Auftrag etwas geschrieben wird, erscheint es hier.',
    sent: 'Nachricht gesendet.',
    /* Die leere Liste war eine Sackgasse: es gab keine Möglichkeit, ein
       Gespräch zu beginnen — nur auf ein bestehendes zu antworten. */
    emptyAction: 'Zu Ihren Anfragen',
  },

  profile: {
    title: 'Profil & Benachrichtigungen',
    personalTitle: 'Ihre Angaben',
    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail',
    phone: 'Telefon',
    language: 'Sprache',
    languageHint: 'Bestimmt, in welcher Sprache Sie von uns hören.',
    notificationsTitle: 'Benachrichtigungen',
    operational: 'Zu Ihren Aufträgen',
    operationalHint:
      'Terminbestätigungen, Erinnerungen, Rechnungen. Diese lassen sich nicht abschalten — ohne sie wüssten Sie nicht, wann jemand vor der Tür steht.',
    marketing: 'Angebote und Neuigkeiten',
    marketingHint: 'Selten. Jederzeit abschaltbar.',
    channelTitle: 'Kanäle',
    channelEmail: 'E-Mail',
    channelSms: 'SMS',
    dataTitle: 'Ihre Daten',
    dataBody:
      'Sie können jederzeit eine Kopie Ihrer Daten anfordern oder Ihr Konto löschen lassen.',
    dataExport: 'Daten anfordern',
    dataDelete: 'Konto löschen',
    dataDeleteNote:
      'Offene Rechnungen und gesetzliche Aufbewahrungsfristen bleiben davon unberührt.',
    dataExportToast:
      'Ihre Datenkopie ist angefordert. Sie erhalten sie innert 30 Tagen per E-Mail.',
    deleteConfirmTitle: 'Konto wirklich schliessen?',
    deleteConfirmBody:
      'Ihr Zugang wird sofort geschlossen und Sie werden abgemeldet. Rechnungen und laufende Einsätze bleiben aus gesetzlichen Gründen erhalten. Für eine Rückkehr melden Sie sich bei uns.',
    deleteConfirmAction: 'Konto schliessen',
    dismiss: 'Abbrechen',
    saved: 'Gespeichert',
  },
};
