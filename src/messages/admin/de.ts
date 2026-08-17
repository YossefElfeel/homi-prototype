/**
 * Admin panel — screens 50–63.
 *
 * Written for one person reading this on a phone between two jobs. Labels are
 * short, numbers lead, and nothing needs a manual. The owner is not a user of
 * this software so much as someone whose day it either saves or wastes.
 */
export const adminDe = {
  meta: { title: 'Verwaltung' },

  shell: {
    title: 'Verwaltung',
    nav: {
      dashboard: 'Start',
      requests: 'Anfragen',
      offers: 'Offerten',
      bookings: 'Buchungen',
      calendar: 'Kalender',
      customers: 'Kunden',
      messages: 'Nachrichten',
      properties: 'Objekte',
      keys: 'Schlüssel',
      subscriptions: 'Abos',
      invoices: 'Rechnungen',
      catalogue: 'Leistungen',
      addons: 'Zusatzleistungen',
      coupons: 'Gutscheine',
      reviews: 'Bewertungen',
      templates: 'Vorlagen',
      applications: 'Bewerbungen',
      postings: 'Stellen',
      teamMembers: 'Team',
      settings: 'Einstellungen',
      changelog: 'Protokoll',
    },
    groups: {
      operations: 'Betrieb',
      customers: 'Kunden & Geld',
      content: 'Inhalt',
      hiring: 'Personal',
      system: 'System',
    },
    search: 'Suchen',
    notifications: 'Benachrichtigungen',
    signOut: 'Abmelden',
    menu: 'Menü',
    gateTitle: 'Nur für den Inhaber',
    gateBody:
      'Diese Ansicht ist der Rolle «Inhaber» vorbehalten. Wechseln Sie die Rolle in der Demo-Steuerung unten rechts, um sie zu sehen.',
    gateCurrent: 'Aktuelle Rolle: {role}',
    gateSignIn: 'Als Inhaber anmelden',
    gateHome: 'Zur Startseite',
  },

  login: {
    title: 'Anmelden',
    lead: 'Verwaltung Homivaro',
    email: 'E-Mail',
    password: 'Passwort',
    remember: 'Angemeldet bleiben',
    forgot: 'Passwort vergessen?',
    submit: 'Anmelden',
    submitting: 'Wird geprüft …',
    error: 'E-Mail oder Passwort stimmen nicht.',
    demoHint: 'Prototyp: beliebige Angaben funktionieren.',
  },

  dashboard: {
    title: 'Guten Morgen, {name}',
    lead: 'Das steht heute an.',
    statWaiting: 'Anfragen warten',
    statToday: 'Heute',
    statTomorrow: 'Morgen',
    statRenewals: 'Abos diese Woche',
    waitingTitle: 'Anfragen, die auf Antwort warten',
    waitingLead: 'Älteste zuerst. Die Antwortfrist beträgt {hours} Stunden.',
    waitingEmptyTitle: 'Keine offenen Anfragen',
    waitingEmptyBody:
      'Alles beantwortet. Neue Anfragen erscheinen hier, sobald sie eintreffen.',
    elapsed: 'seit {time}',
    overdue: 'Frist überschritten',
    reply: 'Antworten',
    todayTitle: 'Heute',
    tomorrowTitle: 'Morgen',
    dayEmptyTitle: 'Nichts geplant',
    dayEmptyBody: 'Für diesen Tag ist kein Einsatz eingetragen.',
    renewalsTitle: 'Abos in den nächsten Tagen',
    renewalsEmptyTitle: 'Keine Abo-Termine',
    renewalsEmptyBody: 'In den nächsten sieben Tagen steht kein Abo-Einsatz an.',
    nextCharge: 'Abbuchung {date}',
    viewAll: 'Alle ansehen',
    /* Each number now says what it means and where it is acted on. A bare
       count leaves the owner to work out both. */
    statWaitingHintOk: 'Alles innerhalb der Frist',
    statWaitingHintLate:
      '{n, plural, one {# über der Frist} other {# über der Frist}}',
    statWaitingLink: 'Anfragen öffnen',
    statTodayHint: 'Erster Einsatz {time}',
    statTodayHintEmpty: 'Nichts eingetragen',
    statTodayLink: 'Tag ansehen',
    statTomorrowHint: 'Erster Einsatz {time}',
    statTomorrowLink: 'Morgen ansehen',
    statRenewalsHint: 'Nächste sieben Tage',
    statRenewalsLink: 'Abos öffnen',
    outOfArea: 'Ausserhalb Gebiet',
  },

  /**
   * Screen 57 had a list and no detail, so every row left the panel for the
   * customer-facing quote page — whose only exit is the public home page.
   */
  offerDetail: {
    back: 'Zu den Offerten',
    notFoundTitle: 'Offerte nicht gefunden',
    notFoundBody: 'Diese Offerte gibt es nicht mehr oder der Link ist veraltet.',
    customer: 'Kunde',
    request: 'Anfrage',
    issued: 'Versendet',
    expires: 'Gültig bis',
    expiredNote: 'Diese Offerte ist abgelaufen.',
    version: 'Version {n}',
    linesTitle: 'Positionen',
    colLine: 'Position',
    colQuantity: 'Menge',
    colUnitPrice: 'Ansatz',
    colSum: 'Summe',
    optional: 'Optional',
    notSelected: 'Nicht gewählt',
    subtotal: 'Zwischentotal',
    discount: 'Rabatt',
    total: 'Total',
    hours: 'Geplante Zeit',
    messageTitle: 'Begleittext',
    revisionTitle: 'Änderungswunsch',
    revisionLead:
      '{name} wünscht etwas anderes. Eine neue Version ist die Antwort darauf.',
    openAsCustomer: 'Kundenansicht öffnen',
    openRequest: 'Anfrage öffnen',
    reissue: 'Neue Version ausstellen',
    reissued: 'Neue Version erstellt.',
    service: 'Leistung',
    rhythm: 'Rhythmus',
    /* Nur zum Lesen. Hier gibt es keine Karte einzugeben und nichts
       zurückzuerstatten — die eine Auskunft, die diese Seite schuldet, ist ob
       das Geld da ist, und die kostete bisher den Umweg über die Rechnungen. */
    payment: 'Zahlung',
    paymentNone: 'Noch nicht bezahlt',
    paymentFailed: 'Fehlgeschlagen: {reason}',
    coverage: 'Abgedeckt durch',
    bookingTitle: 'Daraus wurde',
    bookingOpen: 'Buchung öffnen',
    /* Ein Erstkunde schlägt drei Termine vor und wartet dann. Ohne dieses Feld
       sieht die Offerte aus, als läge sie beim Kunden — dabei liegt sie bei
       uns. */
    slotTitle: 'Termin bestätigen',
    slotLead: '{name} hat drei Termine vorgeschlagen. Einer davon wird reserviert.',
    slotChoice: 'Vorschlag {n}',
    slotHint:
      'Der bestätigte Termin ist 48 Stunden reserviert. Der Kunde unterschreibt und bezahlt danach.',
    slotConfirmed: 'Termin auf {date} bestätigt.',
  },

  /**
   * The other half of screen 48. The customer could already write; nothing in
   * the panel could read it, so every reply was unanswerable.
   */
  messages: {
    title: 'Nachrichten',
    lead: 'Nach Referenz gebündelt, nicht nach Datum — ein Auftrag ist ein Gespräch.',
    threads: 'Gespräche',
    unread: 'Ungelesen',
    search: 'Nach Name oder Referenz suchen',
    emptyTitle: 'Keine Nachrichten',
    emptyBody:
      'Sobald jemand aus dem Kundenkonto schreibt, erscheint das Gespräch hier.',
    searchEmptyTitle: 'Kein Gespräch gefunden',
    searchEmptyBody: 'Für «{query}» gibt es kein Gespräch.',
    pickTitle: 'Gespräch auswählen',
    pickBody: 'Wählen Sie links ein Gespräch aus, um es zu lesen und zu antworten.',
    fromCustomer: 'Kunde',
    fromUs: 'Homivaro',
    /* Elf Vorlagen liegen in den Einstellungen, und genau eine wurde je
       benutzt — die Offerte. Wer hier antwortete, tippte jedes Mal neu, was
       auf Screen 79 längst steht. */
    templateLabel: 'Vorlage einsetzen',
    templatePlaceholder: 'Vorlage wählen …',
    templateHint:
      /* `{"{"}` ist JSX-Escaping in einem reinen String — ICU liest die
         Klammern als Platzhalter und wirft MALFORMED_ARGUMENT, was den
         ganzen Bildschirm 48 beim Rendern abbrechen liess. In ICU wird eine
         wörtliche Klammer mit einfachen Anführungszeichen geschützt. */
      "Setzt den Text in der Sprache des Kunden ein. Platzhalter wie '{'name'}' bleiben stehen — bitte vor dem Senden ersetzen.",
    templateOverwrite: 'Der angefangene Text wird ersetzt. Fortfahren?',
    templateInserted: 'Vorlage eingesetzt.',
    replyLabel: 'Antwort',
    replyPlaceholder: 'Antwort schreiben …',
    send: 'Antworten',
    sent: 'Antwort gesendet.',
    openCustomer: 'Kundenakte öffnen',
    lastMessage: 'Zuletzt {time}',
  },

  requests: {
    title: 'Anfragen',
    filterStatus: 'Status',
    filterAll: 'Alle',
    filterRegion: 'Gebiet',
    search: 'Nach Name oder Referenz suchen',
    colReference: 'Referenz',
    colCustomer: 'Kunde',
    colService: 'Leistung',
    colRegion: 'Gebiet',
    colReceived: 'Eingegangen',
    colStatus: 'Status',
    outOfArea: 'Ausserhalb Gebiet',
    colContact: 'Kontakt',
    colKind: 'Art',
    colDeadline: 'Frist',
    /* Die Liste zeigte nur, wie lange etwas wartet. «3 Tage» ist eine Tatsache,
       keine Priorität — die Frist macht eine daraus, und der Verzug macht sie
       sortierbar. */
    kindOneOff: 'Einmalig',
    kindRecurring: 'Abo gewünscht',
    kindSubscriber: 'Abo-Kunde',
    kindDraft: 'Entwurf',
    overdueBy: '{days, plural, one {# Tag} other {# Tage}} über Frist',
    dueToday: 'Heute fällig',
    dueIn: 'Frist {date}',
    noDeadline: '—',
    filterService: 'Leistung',
    filterFrom: 'Von',
    filterTo: 'Bis',
    filterOverdue: 'Nur überfällig',
    filterReset: 'Filter zurücksetzen',
    overdueCount: '{n} überfällig',
    /* Zeilenaktionen: vorher führte jede Zeile an genau einen Ort, und alles
       andere — Offerte schreiben, ablehnen, einen Entwurf wegwerfen — kostete
       den Umweg über die Detailseite. */
    rowActions: 'Aktionen',
    rowOpen: 'Details ansehen',
    rowQuote: 'Offerte schreiben',
    rowReject: 'Ablehnen',
    rowContinue: 'Entwurf weiterbearbeiten',
    rowDiscard: 'Entwurf verwerfen',
    rowDiscardConfirm: 'Entwurf verwerfen? Das lässt sich nicht rückgängig machen.',
    rowDiscardDone: 'Entwurf verworfen.',
    rowOffer: 'Offerte ansehen',
    emptyTitle: 'Noch keine Anfragen',
    emptyBody:
      'Sobald über die Website eine Anfrage eintrifft, erscheint sie hier — mit der Zeit, die seit dem Eingang vergangen ist. Wer anruft, wird von Hand erfasst.',
    searchEmptyTitle: 'Keine Treffer',
    searchEmptyBody: 'Für «{query}» wurde nichts gefunden.',
    addAction: 'Anfrage erfassen',
  },

  /**
   * Screen 52a — die telefonische Anfrage.
   *
   * Eine Seite statt acht Schritte: der Assistent führt jemanden, der das
   * Formular nie gesehen hat. Am Telefon ist genau das im Weg.
   */
  requestNew: {
    back: 'Alle Anfragen',
    title: 'Anfrage erfassen',
    lead: 'Für Anrufe. Es entsteht dieselbe Anfrage wie über die Website — gleiche Prüfung, gleicher Preisrahmen, gleicher Weg zur Offerte.',
    openAll: 'Alle öffnen',
    closeAll: 'Alle schliessen',
    optional: 'optional',

    customerTitle: 'Kunde',
    customerPick: 'Kunde',
    customerPlaceholder: 'Kunde suchen …',
    customerNone: 'Noch kein Kunde gewählt',
    customerNew: 'Neuen Kunden erfassen',
    customerEmptyTitle: 'Noch keine Kunden',
    customerEmptyBody:
      'Eine Anfrage gehört immer zu einer Person. Erfassen Sie zuerst den Kunden — danach kommen Sie hierher zurück.',

    propertyTitle: 'Objekt',
    propertyNone: 'Noch kein Objekt gewählt',
    propertySaved: 'Hinterlegte Objekte',
    propertyNew: 'Neues Objekt erfassen',
    propertyNewShort: 'Neues Objekt',
    propertyPickFirst: 'Bitte zuerst den Kunden wählen.',
    street: 'Strasse und Nummer',
    postcode: 'PLZ',
    city: 'Ort',
    postcodeInvalid: 'Vierstellige PLZ',
    kind: 'Objektart',
    kindApartment: 'Wohnung',
    kindHouse: 'Haus',
    kindOffice: 'Büro',
    area: 'Fläche m²',
    rooms: 'Zimmer',
    bathrooms: 'Bäder',
    floor: 'Stockwerk',
    elevator: 'Lift vorhanden',
    pets: 'Haustiere im Haushalt',
    effort: 'Stark verschmutzt',
    coverageInside: 'Im Einsatzgebiet — {region}.',
    coverageOutsideTitle: 'Ausserhalb des Einsatzgebiets',
    coverageOutsideBody:
      '{postcode} liegt nicht in den acht Gemeinden. Die Anfrage lässt sich trotzdem erfassen — sie wird markiert, und die Anfahrt gehört in die Offerte.',
    accessTitle: 'Zutritt',
    accessOnFile: 'Hinterlegt: {method}',
    accessNone: 'Nichts hinterlegt',
    accessEditHint:
      'Zutrittsangaben gehören zum Objekt und werden dort geändert — nicht an einer einzelnen Anfrage.',
    accessOpenProperty: 'Objekt öffnen',

    serviceTitle: 'Leistung',
    serviceNone: 'Noch keine Leistung gewählt',
    windowCount: 'Anzahl Fenster',
    furniturePieces: 'Anzahl Möbelstücke',
    countHint: 'Ohne Anzahl lässt sich kein Preis rechnen.',

    extrasTitle: 'Zusatzleistungen',
    extrasNone: 'Keine',
    extrasCount: '{n, plural, one {# Zusatz} other {# Zusätze}}',
    extrasEmpty: 'Für diese Leistung gibt es keine Zusätze.',
    extrasPickService: 'Bitte zuerst die Leistung wählen.',

    timeTitle: 'Wunschtermin',
    timeNone: 'Noch kein Wunsch erfasst',
    timeFlexible: 'Kunde ist flexibel',
    timeLead: 'Ein Wunsch, keine Buchung — der verbindliche Termin kommt mit der Offerte.',
    timeLeadHint: 'Frühestens in {hours} Stunden.',
    timeDate: 'Wunschdatum',
    timeBand: 'Tageszeit',
    bandMorning: 'Vormittag',
    bandMidday: 'Mittag',
    bandAfternoon: 'Nachmittag',
    timeBlockedClosed: 'Dieser Tag ist geschlossen — bitte einen anderen wählen.',
    timeBlockedSoon: 'Zu kurzfristig — die Vorlaufzeit beträgt {hours} Stunden.',

    notesTitle: 'Notizen',
    notesNone: 'Keine Notiz',
    customerNote: 'Was der Kunde gesagt hat',
    customerNoteHint: 'Erscheint auf der Anfrage wie ein Text aus dem Formular.',
    customerNotePlaceholder: 'z. B. Backofen ist das Hauptthema, letzte Reinigung im Frühling …',
    internalNote: 'Interne Notiz',
    internalNoteHint: 'Nur für Sie. Weder Kunde noch Mitarbeitende sehen das.',
    internalNotePlaceholder: 'z. B. klang eilig, Rückruf bis Freitag zugesagt …',

    estimateTitle: 'Preisrahmen',
    estimateWaiting: 'Leistung und Fläche fehlen noch — sobald beides steht, rechnet der Rahmen mit.',
    estimateHint: 'Richtwert wie auf der Website. Verbindlich wird erst die Offerte.',
    estimateHours: 'Geplante Dauer',
    hoursValue: '{hours} Std.',

    missingTitle: 'Es fehlt noch etwas',
    missingCustomer: 'Kunde',
    missingProperty: 'Objekt',
    missingService: 'Leistung',
    save: 'Anfrage erfassen',
    saveAndQuote: 'Erfassen und Offerte schreiben',
    cancel: 'Abbrechen',
    done: 'Anfrage {reference} erfasst.',
    doneOutOfArea: 'Anfrage {reference} erfasst — ausserhalb des Gebiets, bitte Anfahrt prüfen.',
    /* Ein Anruf endet nicht immer dort, wo das Formular fertig ist: «Ich frage
       meinen Mann und melde mich.» Ohne Entwurf blieb nur, den Rest zu
       erfinden oder das Getippte wegzuwerfen. */
    saveDraft: 'Als Entwurf speichern',
    saveDraftHint: 'Auch unvollständig. Erscheint in der Liste als Entwurf.',
    draftSaved: 'Entwurf {reference} gespeichert.',
    draftUpdated: 'Entwurf gespeichert.',
    draftTitle: 'Entwurf weiterbearbeiten',
    draftBadge: 'Entwurf',
    draftLead:
      'Dieser Entwurf steht in keiner Warteschlange und der Kunde sieht ihn nicht. Erst «Anfrage erfassen» macht daraus eine echte Anfrage — und startet die Antwortfrist.',
    draftDiscard: 'Entwurf verwerfen',
    draftDiscardConfirm: 'Entwurf verwerfen? Das lässt sich nicht rückgängig machen.',
    draftDiscardDone: 'Entwurf verworfen.',
    draftNotFound: 'Diesen Entwurf gibt es nicht mehr.',
    draftPromote: 'Anfrage erfassen',
  },

  request: {
    back: 'Alle Anfragen',
    received: 'Eingegangen',
    replyWithQuote: 'Mit Offerte antworten',
    reject: 'Ablehnen',
    customerTitle: 'Kunde',
    call: 'Anrufen',
    whatsapp: 'WhatsApp',
    email: 'E-Mail',
    language: 'Sprache',
    propertyTitle: 'Objekt',
    kind: 'Art',
    area: 'Fläche',
    rooms: 'Zimmer',
    bathrooms: 'Bäder',
    floor: 'Stock',
    elevator: 'Lift',
    pets: 'Haustiere',
    effort: 'Mehraufwand',
    serviceTitle: 'Leistung',
    addOns: 'Zusatzleistungen',
    noAddOns: 'Keine',
    estimated: 'Geschätzte Dauer',
    estimatedNote: 'Vom System aus Fläche, Bädern und Zustand berechnet.',
    preferredTitle: 'Wunschtermin',
    flexible: 'Flexibel',
    /*
     * «Kunde» und «Zutritt» standen beide unbeschriftet nebeneinander, und
     * beide handeln von einer Person — die eine davon, wen man erreicht, die
     * andere davon, wie man hineinkommt. Ohne einen Satz dazu liest sich das
     * als zweimal dasselbe, und die Zugangsdaten wirken wie Kundendaten, die
     * sie ausdrücklich nicht sind: sie gehören zum Objekt und unterliegen
     * §13.1.
     */
    customerLead: 'Wen Sie zu dieser Anfrage erreichen. Gehört zum Kundenkonto.',
    customerOpen: 'Kundenakte öffnen',
    accessTitle: 'Zutritt zum Objekt',
    accessLead:
      'Wie die ausführende Person hineinkommt. Gehört zum Objekt, nicht zum Kunden — geändert wird das am Objekt.',
    accessOpenProperty: 'Objekt öffnen',
    accessReveal: 'Zugangsdaten anzeigen',
    accessHide: 'Verbergen',
    accessGuard:
      'Sichtbar für Sie jederzeit, für die ausführende Person nur am Einsatztag.',
    photosTitle: 'Fotos vom Kunden',
    photosEmpty: 'Keine Fotos angehängt.',
    customerNote: 'Notiz des Kunden',
    internalTitle: 'Interne Notiz',
    internalHint: 'Nur für Sie. Der Kunde sieht das nie.',
    internalPlaceholder: 'Was Sie sich merken wollen …',
    historyTitle: 'Verlauf',
    historyCreated: 'Eingegangen',
    historyOpened: 'Geöffnet',
    historyReplied: 'Beantwortet',
    /* Der Status stand als Etikett oben und sonst nirgends: woher die Anfrage
       kam und was als Nächstes ansteht, musste man aus dem Wort erraten. */
    lifecycleTitle: 'Ablauf',
    /* Die Detailseite war eine Rolle von fünf Blöcken — auf 1280px hiess das
       scrollen, um zu sehen, ob überhaupt Fotos dabei sind. Eingeklappt steht
       die Zusammenfassung in der Kopfzeile, und man öffnet nur das, was man
       wirklich lesen will. */
    expandAll: 'Alle öffnen',
    collapseAll: 'Alle schliessen',
    photosCount: '{n, plural, =0 {Keine Fotos} one {# Foto} other {# Fotos}}',
    accessSummaryNone: 'Nichts hinterlegt',
    noNote: 'Keine Notiz',
    /* Der Ablauf endete bei «Antwort des Kunden» — Termin, Unterschrift,
       Zahlung und Buchung steckten alle in diesem einen Wort. Wer wissen
       wollte, ob das Geld da ist, musste zwei andere Bildschirme öffnen. */
    stageReceived: 'Eingegangen',
    stageReviewed: 'In Prüfung',
    stageDrafted: 'Offerte erstellt',
    stageQuoted: 'Offerte versendet',
    stageRevision: 'Änderung angefragt',
    stageScheduled: 'Termin bestätigt',
    stageSigned: 'Unterschrieben',
    stagePaid: 'Bezahlt',
    stageBooked: 'Gebucht',
    stageDeclined: 'Abgelehnt',
    stageCancelled: 'Storniert',
    stageExpired: 'Abgelaufen',
    /* «Ablehnen» heisst: wir machen das nicht — das gilt für eine offene
       Anfrage. Ist die Offerte schon draussen, ist Ablehnen das falsche Wort
       und war zugleich das einzige, was es gab. Stornieren schliesst die
       Anfrage *und* die Offerte, die sonst versendet und unterschreibbar
       stehen bliebe. */
    cancelAction: 'Anfrage stornieren',
    cancelTitle: 'Anfrage stornieren?',
    cancelBody:
      'Die Anfrage wird geschlossen und die versendete Offerte verfällt — der Kunde kann sie danach nicht mehr unterschreiben. Der Grund bleibt intern am Datensatz.',
    cancelReason: 'Grund',
    cancelReasonPlaceholder: 'z. B. Kunde telefonisch abgesagt, Objekt verkauft …',
    cancelConfirm: 'Stornieren',
    cancelDismiss: 'Abbrechen',
    cancelDone: 'Anfrage {reference} storniert.',
  },

  builder: {
    title: 'Offerte erstellen',
    back: 'Zurück zur Anfrage',
    linesTitle: 'Positionen',
    linesLead: 'Vorausgefüllt aus der Anfrage. Alles ist überschreibbar.',
    colDescription: 'Position',
    colCalc: 'Art',
    colQuantity: 'Menge',
    colUnit: 'Preis',
    colTotal: 'Betrag',
    calcHourly: 'Stunden',
    calcFlat: 'Pauschal',
    calcUnit: 'Stück',
    optional: 'Wählbar',
    optionalHint: 'Der Kunde kann diese Position ab- oder zuwählen.',
    addLine: 'Position hinzufügen',
    removeLine: 'Entfernen',
    newLineLabel: 'Neue Position',
    discountTitle: 'Rabatt',
    discountPercent: 'Prozent',
    discountAmount: 'Betrag',
    discountNone: 'Kein Rabatt',
    planDiscount: 'Abo-Rabatt {percent}% automatisch berücksichtigt',
    subtotal: 'Zwischensumme',
    total: 'Gesamtbetrag',
    hoursTotal: 'Geplante Dauer',
    availabilityTitle: 'Freie Zeiten',
    /*
     * Stand vorher nur: «Der Kunde wählt selbst.» Das beantwortet, *wer*
     * wählt, aber nicht, woher die Liste kommt — und genau das war die Frage:
     * sucht das System die Zeiten oder tut es der Mensch? Es sucht sie, nach
     * fünf Regeln, und keine davon ist erfunden: alle stehen in §5.3/§20.5.
     */
    availabilityLead:
      'Vom System berechnet, nicht von Hand gewählt — und nur zur Orientierung: buchen tut der Kunde selbst aus derselben Liste.',
    availabilityCriteria: 'Ein Termin erscheint, wenn alle fünf zutreffen:',
    availabilityRuleHours: 'Innerhalb der Öffnungszeiten ({from}–{to})',
    availabilityRuleLead: 'Frühestens in {hours} Stunden (Vorlaufzeit)',
    availabilityRuleClosed: 'Kein Sonntag und keine Betriebsferien',
    availabilityRuleDuration: 'Die geschätzte Dauer passt am Stück hinein',
    availabilityRuleTravel: 'Die Fahrzeit zum Nachbarauftrag geht auf (§20.5)',
    availabilityRouteHint:
      '«+Min. Fahrt» zeigt, was ein Termin die Tagesroute kostet — nicht, was er den Kunden kostet.',
    availabilityNone: 'Für diese Dauer ist in den nächsten Wochen nichts frei.',
    routeCost: '+{minutes} Min. Fahrt',
    messageTitle: 'Nachricht',
    messageHint: 'Aus einer Vorlage vorausgefüllt. Anpassen, wenn nötig.',
    validityTitle: 'Gültigkeit',
    validityDays: '{days} Tage',
    previewSend: 'Vorschau & senden',
    shortcutHint: 'Tipp: {key} sendet direkt.',
    savedDraft: 'Entwurf gespeichert',
  },

  preview: {
    title: 'Vorschau & senden',
    back: 'Bearbeiten',
    channelsTitle: 'Kanäle',
    channelEmail: 'E-Mail',
    channelSms: 'SMS',
    channelWhatsapp: 'WhatsApp',
    channelHint: 'Die Offerte wird als Link versendet, in der Sprache des Kunden.',
    previewTitle: 'So sieht es der Kunde',
    openPreview: 'Kundenansicht öffnen',
    send: 'Offerte senden',
    sending: 'Wird gesendet …',
    sentTitle: 'Offerte ist unterwegs.',
    sentBody:
      'An {name} über {channels}. Sie erhalten eine Benachrichtigung, sobald geantwortet wird.',
    sentAccount:
      'Für {name} wurde automatisch ein Konto erstellt — der Aktivierungslink liegt der Offerte bei.',
    toDashboard: 'Zurück zur Startseite',
    nextRequest: 'Nächste Anfrage',
  },

  reject: {
    title: 'Anfrage ablehnen',
    lead: 'Der Kunde erhält eine kurze Nachricht mit dem Grund. Das ist besser als keine Antwort.',
    reasonLabel: 'Grund',
    reasonOutOfArea: 'Ausserhalb des Einsatzgebiets',
    reasonCapacity: 'Keine Kapazität im gewünschten Zeitraum',
    reasonScope: 'Leistung wird nicht angeboten',
    reasonOther: 'Anderer Grund',
    noteLabel: 'Nachricht an den Kunden',
    noteHint: 'Wird so übernommen, wie Sie es schreiben.',
    suggestLabel: 'Alternative vorschlagen',
    suggestHint: 'Optional — z. B. ein anderer Zeitraum oder ein Partnerbetrieb.',
    submit: 'Ablehnen und senden',
    submitting: 'Wird gesendet …',
    cancel: 'Abbrechen',
    /* Die Erfolgsseite hat vorher Titel und Lead des Formulars wiederverwendet
       und ihre einzige Weiter-Aktion «Abbrechen» genannt. */
    sentTitle: 'Absage ist unterwegs',
    sentBody:
      'Der Kunde hat Ihre Nachricht erhalten. Die Anfrage ist als abgelehnt erfasst.',
    sentToList: 'Zurück zu den Anfragen',
    sentToRequest: 'Anfrage ansehen',
  },

  /*
   * Die Liste beantwortete vier Fragen — wer, wie viel, wann raus, wann
   * abgelaufen. Was offeriert wurde, ob es sich wiederholt, ob das Geld da ist
   * und ob der Einsatz überhaupt verrechnet wird: alles vier war ableitbar,
   * keines stand da, und jedes kostete den Weg auf eine andere Liste.
   */
  offers: {
    title: 'Offerten',
    lead: 'Was offeriert wurde, wie es abgerechnet wird und wo das Geld steht.',
    search: 'Suche nach Referenz, Name oder E-Mail',
    filterStatus: 'Status',
    filterPayment: 'Zahlung',
    filterPaymentNone: 'Noch keine Zahlung',
    filterAll: 'Alle',
    filterReset: 'Filter zurücksetzen',
    searchEmptyTitle: 'Keine Offerte gefunden',
    searchEmptyBody:
      'Mit diesen Filtern bleibt nichts übrig. Filter zurücksetzen und neu beginnen.',
    colReference: 'Referenz',
    colCustomer: 'Kunde',
    colService: 'Leistung',
    colCoverage: 'Abgedeckt',
    colTotal: 'Betrag',
    colPayment: 'Zahlung',
    colValidity: 'Versendet / Gültig',
    colStatus: 'Status',
    version: 'V{n}',
    expiresIn: 'in {days} T.',
    expired: 'abgelaufen',
    coveragePackage: 'Paket · {hours} Std. übrig',
    coverageSubscription: 'Im Abo',
    paymentNotDue: 'Nichts offen',
    method: {
      twint: 'TWINT',
      card: 'Karte',
      'apple-pay': 'Apple Pay',
      'google-pay': 'Google Pay',
    },
    rowActions: 'Aktionen',
    rowOpen: 'Details ansehen',
    rowConfirmSlot: 'Termin bestätigen',
    rowOpenBooking: 'Buchung {reference} öffnen',
    rowOpenRequest: 'Anfrage öffnen',
    rowOpenAsCustomer: 'Kundenansicht öffnen',
    emptyTitle: 'Noch keine Offerten',
    emptyBody: 'Sobald Sie auf eine Anfrage mit einer Offerte antworten, steht sie hier.',
  },

  /**
   * §11 — der Plan *ist* der Rhythmus. Ein zweites Intervallfeld neben dem Abo
   * hätte irgendwann etwas anderes behauptet als die Rechnung.
   */
  rhythm: {
    oneTime: 'Einmalig',
    biweekly: 'Alle zwei Wochen',
    weekly: 'Wöchentlich',
    twiceWeekly: 'Zweimal wöchentlich',
  },

  /**
   * Buchungen — neu.
   *
   * Die Buchung war die einzige grosse Entität ohne eigene Liste. Sie stand im
   * Kalender, und der beantwortet «was ist am Dienstag» — nicht «welche
   * Einsätze kommen aus Offerten», nicht «was wartet auf Freigabe», nicht
   * «welcher fertige Einsatz hat noch keine Rechnung».
   */
  bookings: {
    title: 'Buchungen',
    lead: 'Jeder Einsatz als Zeile — woher er kommt, was er wert ist, wo die Rechnung steht.',
    search: 'Nach Referenz oder Name suchen',
    filterStatus: 'Status',
    filterAll: 'Alle',
    filterReset: 'Filter zurücksetzen',
    filterEmptyTitle: 'Keine Buchung passt',
    filterEmptyBody: 'Mit diesen Filtern bleibt nichts übrig. Setzen Sie sie zurück.',
    colReference: 'Referenz',
    colCustomer: 'Kunde',
    colService: 'Leistung',
    colSource: 'Herkunft',
    colWhen: 'Termin',
    colAmount: 'Betrag',
    colInvoice: 'Rechnung',
    colStatus: 'Status',
    sourceSubscription: 'Abo',
    sourceManual: 'Manuell',
    hours: '{hours} Std.',
    openCalendar: 'Im Kalender',
    rowActions: 'Aktionen',
    rowOpen: 'Buchung öffnen',
    rowOpenOffer: 'Offerte {reference} öffnen',
    rowOpenInvoice: 'Rechnung {reference} öffnen',
    emptyTitle: 'Noch keine Buchungen',
    emptyBody:
      'Eine Buchung entsteht, sobald eine Offerte bezahlt ist oder ein Abo-Einsatz ansteht. Bis dahin bleibt diese Liste leer.',
    emptyAction: 'Offerten ansehen',
  },

  calendar: {
    title: 'Kalender',
    viewDay: 'Tag',
    viewWeek: 'Woche',
    viewMonth: 'Monat',
    viewAgenda: 'Agenda',
    today: 'Heute',
    previous: 'Zurück',
    next: 'Weiter',
    travel: 'Fahrt {minutes} Min.',
    conflictTitle: 'Fahrzeit reicht nicht',
    conflictBody:
      'Zwischen {a} und {b} liegen {available} Min., benötigt werden {needed} Min.',
    closed: 'Geschlossen',
    closurePeriod: 'Betriebsferien',
    capacity: '{used} von {max} Einsätzen',
    emptyDayTitle: 'Nichts geplant',
    emptyDayBody: 'Für diesen Tag ist kein Einsatz eingetragen.',
    emptyAgendaTitle: 'Keine kommenden Einsätze',
    emptyAgendaBody: 'Sobald eine Buchung bestätigt ist, erscheint sie hier.',
    weekTotal: '{count} Einsätze · {hours} Std.',
  },

  map: {
    title: 'Route',
    lead: 'Die Einsätze von {date} in der Reihenfolge des Tages.',
    stop: 'Halt {n}',
    driveTime: '{minutes} Min. Fahrt',
    totalDrive: 'Fahrzeit gesamt',
    emptyTitle: 'Keine Einsätze an diesem Tag',
    emptyBody: 'Die Route erscheint, sobald für diesen Tag etwas gebucht ist.',
    mapNote: 'Prototyp: schematische Darstellung, keine echte Karte.',
    /* Die Pfeile hiessen «−1» und «+1» — ein Screenreader las «minus eins,
       Schaltfläche». Zurück, Heute und Min. standen fest im Code. */
    back: 'Kalender',
    previousDay: 'Vorheriger Tag',
    nextDay: 'Nächster Tag',
    today: 'Heute',
    minutes: '{n} Min.',
    routeAction: 'Route',
  },

  booking: {
    back: 'Buchungen',
    title: 'Buchung',
    whenTitle: 'Termin',
    windowTitle: 'Ankunftsfenster',
    durationTitle: 'Dauer',
    assigneeTitle: 'Ausführung',
    unassigned: 'Nicht zugewiesen',
    customerTitle: 'Kunde',
    propertyTitle: 'Objekt',
    accessTitle: 'Zutritt',
    amountTitle: 'Betrag',
    actionsTitle: 'Aktionen',
    reschedule: 'Verschieben',
    rescheduleLabel: 'Neuer Termin',
    rescheduleSave: 'Termin verschieben',
    rescheduledTo: 'Verschoben auf {date}, {time}',
    rescheduleDone: 'Termin verschoben.',
    assign: 'Zuweisen',
    assignLabel: 'Ausführung',
    assignedTo: '{name} zugewiesen',
    assignDone: 'Zuweisung gespeichert.',
    dismiss: 'Abbrechen',
    cancel: 'Stornieren',
    cancelConfirmTitle: 'Einsatz stornieren?',
    cancelConfirmBody:
      'Der Termin wird abgesagt und aus dem Kalender genommen. Der Kunde wird benachrichtigt — das lässt sich nicht rückgängig machen.',
    cancelConfirmAction: 'Einsatz stornieren',
    cancelEvent: 'Einsatz storniert',
    cancelDone: 'Einsatz storniert.',
    markNoAccess: 'Kein Zutritt erfassen',
    noAccessHint: 'Erfasst {percent}% Gebühr, mit Foto und Zeitstempel.',
    noAccessConfirmTitle: 'Kein Zutritt erfassen?',
    noAccessConfirmBody:
      'Der Einsatz gilt als nicht erbracht und es werden {percent}% des Betrags verrechnet. Der Kunde erhält die Begründung mit Zeitstempel.',
    noAccessEvent: 'Kein Zutritt — {percent}% verrechnet',
    noAccessDone: 'Kein Zutritt erfasst.',
    offerLink: 'Offerte ansehen',
    invoiceLink: 'Rechnung {reference} ansehen',
    historyTitle: 'Verlauf',
    /* §5.3: die ausführende Person meldet Mehraufwand, das Büro bewertet ihn.
       Der Meldeteil war gebaut, der Bewertungsteil nicht — «wartet auf Freigabe»
       war ein Endzustand ohne Ausgang, und «abgeschlossen» war von keinem
       Bildschirm aus erreichbar. */
    approveTitle: 'Wartet auf Freigabe',
    approveBody:
      'Der Einsatz ist ausgecheckt. Prüfen Sie den Verlauf — gemeldeter Mehraufwand steht dort mit Zeitstempel — und geben Sie ihn frei. Danach ist er verrechenbar.',
    approveAction: 'Einsatz freigeben',
    approveEvent: 'Freigegeben',
    approveDone: 'Einsatz freigegeben.',
  },
};
