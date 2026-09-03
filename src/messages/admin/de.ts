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
      expenses: 'Ausgaben',
      /* Eigene Zeile statt eines Tabs in «Ausgaben»: jeder Screen im Panel ist
         eine Zeile in dieser Liste, und eine Gruppe, die anders navigiert,
         wäre eine zweite Sache zum Lernen ohne Gegenwert. */
      workforce: 'Arbeitszeit',
      analytics: 'Auswertung',
      catalogue: 'Leistungen',
      addons: 'Zusatzleistungen',
      coupons: 'Gutscheine',
      reviews: 'Bewertungen',
      templates: 'Vorlagen',
      applications: 'Bewerbungen',
      postings: 'Stellen',
      /* War «Team». Der Eintrag heisst jetzt nach dem, was auf der Seite
         entschieden wird — wer sich anmelden darf und was er danach sieht —
         und nicht mehr nach der Personengruppe, die zufällig darauf steht. */
      users: 'Benutzer',
      settings: 'Einstellungen',
      changelog: 'Protokoll',
    },
    groups: {
      operations: 'Betrieb',
      /* War «Kunden & Geld». Das Geld ist ausgezogen — es hat jetzt eine
         eigene Gruppe mit drei Zeilen darin. */
      customers: 'Kunden',
      finance: 'Finanzen',
      content: 'Inhalt',
      hiring: 'Personal',
      system: 'System',
    },
    search: 'Suchen',
    notifications: 'Benachrichtigungen',
    signOut: 'Abmelden',
    menu: 'Menü',

    /* Die Rolle, wie sie in der Fusszeile der Seitenleiste steht. Dieselben
       Wörter wie auf der Benutzerliste — zwei Bezeichnungen für dieselbe
       Rolle wären zwei Rollen für jeden, der beides liest. */
    roles: {
      owner: 'Geschäftsleitung',
      contractor: 'Mitarbeitende:r',
      office: 'Büro',
    },

    /*
     * Vier Sperren, vier Sätze.
     *
     * Vorher gab es einen: «Nur für den Inhaber». Der stimmte, solange genau
     * eine Person hineindurfte. Jetzt sind es vier verschiedene Gründe, und
     * nur wer weiss, welcher davon zutrifft, kann etwas dagegen tun.
     */
    gateTitle: 'Anmeldung nötig',
    gateBody:
      'Die Verwaltung ist Mitarbeitenden vorbehalten. Wechseln Sie die Rolle in der Demo-Steuerung unten rechts, um sie zu sehen.',
    gateCurrent: 'Aktuelle Rolle: {role}',
    gateSignIn: 'Anmelden',
    gateHome: 'Zur Startseite',

    gateDeactivatedTitle: 'Dieses Konto ist deaktiviert',
    gateDeactivatedBody:
      'Die Anmeldung wurde deaktiviert. Erfasste Daten bleiben erhalten — wenden Sie sich an die Geschäftsleitung, wenn das ein Versehen ist.',

    gateNoAccessTitle: 'Für Sie ist hier nichts freigegeben',
    gateNoAccessBody:
      'Ihr Konto hat noch keinen Bereich der Verwaltung freigeschaltet. Die Geschäftsleitung vergibt das unter «Benutzer».',
    gateFieldView: 'Zu meinen Einsätzen',

    /* Der fünfte Fall, und der einzige *innerhalb* der Verwaltung: jemand darf
       herein, nur nicht in dieses Zimmer. Der Bereichsname steht drin, sonst
       liest sich die Sperre wie ein Fehler statt wie eine Entscheidung. */
    areaLockedTitle: '«{area}» ist für Sie nicht freigegeben',
    areaLockedBody:
      'Ihr Konto hat für diesen Bereich keine Freigabe. Die Geschäftsleitung kann sie unter «Benutzer» erteilen.',
    areaLockedAction: 'Zur Startseite der Verwaltung',
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
    statRenewals: 'Abos laufen aus',
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
    /* Hervorgehoben, nicht nur ergänzt: ein Einsatz von heute ohne Namen ist
       genau die Zeile, die dieser Bildschirm vor dem Morgen finden soll. */
    unassigned: 'Nicht zugewiesen',
    renewalsTitle: 'Abos, die bald auslaufen',
    addRequest: 'Anfrage erfassen',
    renewalsEmptyTitle: 'Keine Abo-Termine',
    renewalsEmptyBody: 'In den nächsten 30 Tagen läuft kein Abo aus.',

    /* Der Fall, den es vor der Rechtevergabe nicht gab: jemand ist
       angemeldet, darf aber keinen der vier Blöcke auf dieser Seite sehen.
       Ohne diesen Text wäre die Startseite eine Begrüssung und dann nichts. */
    quietTitle: 'Hier steht heute nichts für Sie',
    quietBody:
      'Diese Übersicht zeigt Anfragen, Einsätze und auslaufende Abos — nichts davon ist für Ihr Konto freigegeben. Ihre Bereiche stehen links in der Seitenleiste.',
    termEnds: 'Läuft ab am {date}',
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
    statRenewalsHint: 'Nächste 30 Tage',
    statRenewalsLink: 'Abos öffnen',
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
    optionalOn: 'Wählbar, an',
    optionalOff: 'Wählbar, aus',
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
    coverageTitle: 'Deckung',
    coverageSubscriptionLead: 'Dieser Einsatz ist im laufenden Abo enthalten.',
    coveragePlan: 'Abo',
    coverageVisits: 'Einsätze im Paket',
    coverageVisitsValue: 'Noch {left} von {total}',
    coverageValidUntil: 'Abo gültig bis',
    coverageSkips: 'Freie Aussetzer',
    coverageSkipsValue: '{left} von {total} diesen Monat',
    coverageOpenPlan: 'Abo öffnen',
    paymentFailed: 'Fehlgeschlagen: {reason}',
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
    contractTitle: 'Vertrag',
    contractLead:
      'Homivaro unterschreibt beim Versand, der Kunde beim Annehmen. Beide Unterschriften gehören zu dieser Version der Offerte.',
    contractCompany: 'Für Homivaro',
    contractCustomer: 'Auftraggeber',
    contractCompanyPending: 'Wird beim Versand gesetzt',
    contractCustomerPending: 'Noch nicht unterschrieben',
  },

  /**
   * The other half of screen 48. The customer could already write; nothing in
   * the panel could read it, so every reply was unanswerable.
   */
  messages: {
    title: 'Nachrichten',
    lead: 'Nach Referenz gebündelt, nicht nach Datum — ein Auftrag ist ein Gespräch.',
    threads: 'Gespräche',
    /* Zwei Zustände, zwei Wörter. «Ungelesen» hiess auf diesem Bildschirm
       lange «der Kunde hat zuletzt geschrieben» — ein Gespräch, das der
       Inhaber gelesen und bewusst auf morgen gelegt hatte, blieb damit für
       immer ungelesen. */
    unread: 'Ungelesen',
    waiting: 'Wartet auf Antwort',
    search: 'Nach Name oder Referenz suchen',
    /* Aus dem Auswahlfeld «Gelesen: Alle» wurden drei Reiter. Der Lesestatus
       sagt, welche Liste man ansieht — Suche und Zeitraum grenzen sie ein. */
    tabAll: 'Alle',
    tabUnread: 'Ungelesen',
    tabRead: 'Gelesen',
    filterFrom: 'Von',
    filterTo: 'Bis',
    filterReset: 'Filter zurücksetzen',
    emptyTitle: 'Keine Nachrichten',
    emptyBody:
      'Sobald jemand aus dem Kundenkonto schreibt, erscheint das Gespräch hier.',
    filterEmptyTitle: 'Kein Gespräch gefunden',
    filterEmptyBody: 'Kein Gespräch passt zu Suche und Zeitraum zusammen.',
    /* Nichts Ungelesenes ist das gute Ergebnis — «Kein Gespräch gefunden»
       hätte es zum schlechten gemacht. */
    unreadEmptyTitle: 'Alles gelesen',
    unreadEmptyBody:
      'Kein Gespräch wartet darauf, geöffnet zu werden. Neue Nachrichten erscheinen hier, sobald sie ankommen.',
    readEmptyTitle: 'Noch nichts gelesen',
    readEmptyBody:
      'Ein Gespräch landet hier, sobald Sie es einmal geöffnet haben.',
    /* Eine Nachricht darf aus einem Anhang allein bestehen. In der Liste
       stünde sonst eine leere Zeile da, wo etwas angekommen ist. */
    attachmentOnly: 'Nur ein Anhang',
    pickTitle: 'Gespräch auswählen',
    pickBody: 'Wählen Sie links ein Gespräch aus, um es zu lesen und zu antworten.',
    fromCustomer: 'Kunde',
    fromUs: 'Homivaro',
    replyLabel: 'Antwort',
    replyPlaceholder: 'Antwort schreiben …',
    send: 'Antworten',
    sent: 'Antwort gesendet.',
    openCustomer: 'Kundenakte öffnen',
    lastMessage: 'Zuletzt {time}',
  },

  requests: {
    title: 'Anfragen',
    lead: 'Alles, was hereinkommt, bis eine Offerte daraus wird — oder bis feststeht, dass keine daraus wird.',
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
    filterReset: 'Filter zurücksetzen',
    /* «Nur überfällig» war ein Schalter zwischen den Filtern, die Zahl dazu
       stand in der Ergebniszeile. Jetzt sind es zwei Ansichten mit der Zahl
       am Reiter — der Schalter und das, worüber er entscheidet, an einem Ort. */
    tabAll: 'Alle',
    tabOverdue: 'Überfällig',
    overdueEmptyTitle: 'Nichts überfällig',
    overdueEmptyBody:
      'Jede offene Anfrage liegt innerhalb der Antwortfrist. Wird eine überschritten, erscheint sie hier — und die Zahl am Reiter zählt mit.',
    /* Zeilenaktionen: vorher führte jede Zeile an genau einen Ort, und alles
       andere — Offerte schreiben, ablehnen, einen Entwurf wegwerfen — kostete
       den Umweg über die Detailseite. */
    rowActions: 'Aktionen',
    rowOpen: 'Details ansehen',
    rowQuote: 'Offerte schreiben',
    rowReject: 'Ablehnen',
    rowContinue: 'Entwurf weiterbearbeiten',
    rowDiscard: 'Entwurf verwerfen',
    rowDiscardConfirmTitle: 'Entwurf verwerfen?',
    rowDiscardConfirm:
      'Am Entwurf hängt weder Offerte noch Buchung noch Rechnung — es geht nichts anderes mit verloren. Rückgängig machen lässt es sich trotzdem nicht.',
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
    customerBlocked: 'gesperrt',
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
    /* Replaces the radio group when the service already answered it. */
    kindFromService: '{service} — wir rechnen mit einem Büro.',
    /* Der zweite Halt. Steht im Objekt-Abschnitt, weil der die Frage «wohin
       schicke ich jemanden» beantwortet — bei einer Montage sind das zwei
       Orte. */
    pickupToggle: 'Möbel werden zuerst woanders abgeholt',
    pickupNote: 'Hinweis zur Abholung',
    pickupOutside:
      'Ausserhalb des Einsatzgebiets. Anfahrt nach §5.1 von Hand in der Offerte ausweisen.',
    area: 'Fläche m²',
    rooms: 'Zimmer',
    roomsOffice: 'Räume',
    bathrooms: 'Bäder',
    bathroomsOffice: 'Toiletten',
    floor: 'Stockwerk',
    elevator: 'Lift vorhanden',
    pets: 'Haustiere im Haushalt',
    effort: 'Stark verschmutzt',
    coverageInside: 'Im Einsatzgebiet — {region}.',
    coverageOutsideTitle: 'Ausserhalb des Einsatzgebiets',
    coverageOutsideBody:
      '{postcode} liegt nicht in den acht Gemeinden. Für diese Adresse lässt sich keine Anfrage erfassen — als Entwurf speichern geht, absenden nicht.',
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
    estimateWaitingWindows:
      'Leistung und Anzahl Fensterflügel fehlen noch — sobald beides steht, rechnet der Rahmen mit.',
    estimateWaitingPieces:
      'Leistung und Anzahl Möbelstücke fehlen noch — sobald beides steht, rechnet der Rahmen mit.',
    estimateHint: 'Richtwert wie auf der Website. Verbindlich wird erst die Offerte.',
    estimateHours: 'Geplante Dauer',
    hoursValue: '{hours} Std.',

    missingTitle: 'Es fehlt noch etwas',
    missingCustomer: 'Kunde',
    missingProperty: 'Objekt',
    missingOutOfArea: 'Adresse ausserhalb des Einsatzgebiets',
    missingService: 'Leistung',
    save: 'Anfrage erfassen',
    saveAndQuote: 'Erfassen und Offerte schreiben',
    cancel: 'Abbrechen',
    done: 'Anfrage {reference} erfasst.',
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
    draftDiscardConfirmTitle: 'Entwurf verwerfen?',
    draftDiscardConfirm:
      'Alles am Telefon Aufgenommene ist damit weg. Rückgängig machen lässt sich das nicht.',
    draftDiscardDone: 'Entwurf verworfen.',
    draftNotFound: 'Diesen Entwurf gibt es nicht mehr.',
    draftPromote: 'Anfrage erfassen',
  },

  request: {
    back: 'Alle Anfragen',
    received: 'Eingegangen',
    replyWithQuote: 'Mit Offerte antworten',
    reject: 'Ablehnen',
    restore: 'Ablehnung zurücknehmen',
    restored: 'Die Anfrage liegt wieder in der Warteschlange.',
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
    windowCount: 'Anzahl Fensterflügel',
    furniturePieces: 'Anzahl Möbelstücke',
    estimated: 'Geschätzte Dauer',
    estimatedNote: 'Vom System aus Fläche, Bädern und Zustand berechnet.',
    /* The §5.2 matrix is not consulted for a service billed by count, so the
       note that names its inputs would be describing arithmetic that did not
       happen. */
    estimatedNoteCount: 'Vom System aus der erfassten Anzahl berechnet.',
    estimatedNoArea: 'Keine Fläche erfasst',
    /* Der zweite Halt. Steht im Objekt-Block, weil der die Frage «wohin
       schicke ich jemanden» beantwortet — und hier lautet die Antwort: an zwei
       Orte. */
    pickupTitle: 'Abholadresse',
    pickupNote: 'Hinweis zur Abholung',
    pickupOutside:
      'Ausserhalb des Einsatzgebiets. Anfahrt nach §5.1 von Hand in der Offerte ausweisen.',
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
    /* Hiess «Ablauf», während das Kundenkonto dieselbe Leiste «Verlauf»
       nannte. Beide zeichnen `quoteStages` — ein Name, sonst liest sich eine
       Ableitung wie zwei verschiedene Auskünfte. */
    lifecycleTitle: 'Fortschritt der Anfrage',
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
    colOptional: 'Wählbar',
    optionalFixed: 'Fix',
    optionalOn: 'Wählbar, an',
    optionalOff: 'Wählbar, aus',
    optionalHint:
      '«Wählbar» heisst: der Kunde entscheidet selbst. «An» steht schon im Betrag, «aus» kommt erst dazu, wenn er sie wählt — Preis und geplante Dauer bewegen sich mit.',
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
    blockedTitle: 'Dieser Kunde ist gesperrt.',
    blockedBody:
      'An {name} kann keine Offerte gesendet werden. Die Sperre lässt sich im Kundendatensatz aufheben.',
    messageTitle: 'Begleittext',
    signatureTitle: 'Geht unterschrieben raus',
    signatureEdit: 'Unterschrift ändern',
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
    /* Früher eine eigene Erfolgsseite, deren einzige Weiter-Aktion zurück
       dorthin führte, wo man ohnehin schon war. Der Dialog schliesst sich und
       die Zeile dahinter wechselt auf «abgelehnt» — die Bestätigung ist ein
       Toast, keine Seite. */
    sentTitle: 'Absage ist unterwegs',
    sentBody:
      'Der Kunde hat Ihre Nachricht erhalten. Die Anfrage ist als abgelehnt erfasst.',
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
    colTotal: 'Betrag',
    colPayment: 'Zahlung',
    colMethod: 'Zahlungsart',
    filterService: 'Leistung',
    colValidity: 'Versendet / Gültig',
    colStatus: 'Status',
    version: 'V{n}',
    expiresIn: 'in {days} T.',
    expired: 'abgelaufen',
    paymentNotDue: 'Nichts offen',
    /* `method` stand hier und beschrieb etwas, das nicht dieser Liste gehört.
       Jetzt `status.method`, neben den Zahlungszuständen. */
    rowActions: 'Aktionen',
    rowOpen: 'Details ansehen',
    rowConfirmSlot: 'Termin bestätigen',
    rowOpenBooking: 'Buchung {reference} öffnen',
    rowOpenRequest: 'Anfrage öffnen',
    rowOpenAsCustomer: 'Kundenansicht öffnen',
    emptyTitle: 'Noch keine Offerten',
    emptyBody: 'Sobald Sie auf eine Anfrage mit einer Offerte antworten, steht sie hier.',
  },

  /*
   * Vorher / Nachher auf der Offerte — steht erst da, wenn der Einsatz fertig
   * ist. Vorher gibt es nichts zu zeigen, und eine leere Karte auf jeder
   * offenen Offerte wäre Lärm auf genau den Bildschirmen, wo noch gewartet
   * wird.
   */
  jobPhotos: {
    title: 'Vorher / Nachher',
    lead: 'Wie der Einsatz ausgegangen ist. Ziehen Sie den Trenner oder nehmen Sie die Pfeiltasten.',
    before: 'Vorher',
    after: 'Nachher',
    compare: 'Zum Vergleichen ziehen',
    /* Sagt, wer sie freigibt — nicht bloss, dass sie nicht freigegeben sind.
       Die Zustimmung gehört der Kundschaft (§20.6), und der Schalter dafür
       steht in ihrem Konto, nicht hier. */
    consentReleased: 'Für die Website freigegeben',
    consentInternal: 'Nur intern',
    unpaired: '{side} — ohne Gegenstück aufgenommen',
    emptyTitle: 'Keine Bilder zu diesem Einsatz',
    emptyBody:
      'Der Einsatz ist abgeschlossen, aber es wurde nichts fotografiert. Bilder entstehen auf dem Einsatz-Bildschirm beim Ein- und Auschecken.',
  },

  /**
   * §11 — der Plan *ist* der Rhythmus. Ein zweites Intervallfeld neben dem Abo
   * hätte irgendwann etwas anderes behauptet als die Rechnung.
   */
  rhythm: {
    oneTime: 'Einmalig',
    monthly: 'Monatlich',
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
    /* Woher die Zahl kommt. Eine unterschriebene Offerte, eine gestellte
       Rechnung, ein Abo-Anteil und eine Schätzung sind vier verschiedene
       Grade von Sicherheit — als blosse Franken nebeneinander sähe die
       Schätzung aus wie eine Forderung. */
    amount_offer: 'Offerte',
    amount_invoice: 'Rechnung',
    amount_plan: 'Abo-Anteil',
    amount_estimate: 'Schätzung',
    colPaid: 'Bezahlt',
    filterPaid: 'Zahlung',
    paid_paid: 'Bezahlt',
    paid_pending: 'Offen',
    paid_unpaid: 'Nicht bezahlt',
    paid_covered: 'Im Abo',
    colInvoice: 'Rechnung',
    colStatus: 'Status',
    /* Wer den Einsatz macht, stand auf keiner Liste — und die gearbeitete Zeit
       steckte als Satzteil in einem Verlaufseintrag. Beide sind dieselbe
       Frage: «wer war da, und wie lange». */
    colAssignee: 'Ausführung',
    unassigned: 'Nicht zugewiesen',
    workedHours: '{hours} Std. gearbeitet',
    filterAssignee: 'Ausführung',
    rowAssign: 'Zuweisen',
    sourceSubscription: 'Abo',
    sourceManual: 'Manuell',
    hours: '{hours} Std.',
    openCalendar: 'Im Kalender',
    rowActions: 'Aktionen',
    rowOpen: 'Buchung öffnen',
    rowReschedule: 'Verschieben',
    rowOpenOffer: 'Offerte {reference} öffnen',
    rowOpenInvoice: 'Rechnung {reference} öffnen',
    emptyTitle: 'Noch keine Buchungen',
    emptyBody:
      'Eine Buchung entsteht, sobald eine Offerte bezahlt ist oder ein Abo-Einsatz ansteht. Bis dahin bleibt diese Liste leer.',
    emptyAction: 'Offerten ansehen',
  },

  calendar: {
    title: 'Kalender',
    lead: 'Einsätze, Termine, reservierte Zeit und Betriebsferien — alles, was einen Tag belegt, in einer Ansicht.',
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
    /* Der Monat zeigte Punkte. Jetzt zeigt er dieselben Kacheln wie die
       Woche, und eine Zelle mit vier Einträgen muss sagen, was sie weglässt. */
    monthMore: '+{count} weitere',

    /* Die Legende. Der Kalender zeichnete in Woche und Monat jeden Eintrag in
       derselben Akzentfarbe — neun Buchungszustände, drei Terminarten, Ferien
       und eine reservierte Zeit, alle gleich. Eine Legende ohne Farben zu
       erklären wäre sinnlos gewesen; beides gehört zusammen. */
    legendTitle: 'Legende',
    /* Die Legende erklärte eine Farbe und hörte da auf — was eine halbe
       Antwort ist: Man liest sie, weil man die grauen *sucht*, und musste sie
       danach im Monatsraster von Hand zusammensuchen. */
    legendFilterHint: 'Auf eine Farbe tippen, um nur diese zu sehen.',
    filterActive: 'Gefiltert — nicht alles wird angezeigt.',
    filterClear: 'Alle anzeigen',
    filterEmptyTitle: 'Nichts in diesen Farben',
    filterEmptyBody:
      'In dieser Ansicht gibt es keinen Eintrag in der gewählten Farbe. Der Tag kann trotzdem voll sein.',
    legendJobs: 'Einsätze',
    legendEvents: 'Termine ohne Einsatz',
    /* «Übriges» ist weg — eine reservierte Zeit und Betriebsferien erklären
       sich im Raster von selbst. Der Hinweistext bleibt: er steht unter einer
       reservierten Zeit in der Tagesliste, nicht in der Legende. */
    legendHoldHint:
      'Der Kunde hat 48 Stunden Zeit. Die Zeit ist blockiert, der Einsatz entsteht erst mit der Zahlung.',

    addAction: 'Termin eintragen',

    eventsTitle: 'Termine',
    holdTitle: 'Reservierte Zeit',
    closureTitle: 'Betriebsferien',
    closureBody: 'In dieser Zeit wird nicht gearbeitet. Grund: {reason}.',

    /* Hiess «Einsatz öffnen» in einem ⋯-Menü. Es steht jetzt als Auge am
       Zeilenende — dieselbe Bedeutung, dieselbe Beschriftung wie in jeder
       Tabelle im Panel. */
    rowOpen: 'Details ansehen',
  },

  /* Der Kalender konnte nur Buchungen halten, und eine Buchung entstand nur
     aus einer bezahlten Offerte. Alles dazwischen — der telefonisch vereinbarte
     Einsatz, der zugesagte Rückruf, die Besichtigung vor der Offerte — hatte
     keinen Platz. «Rückruf zugesagt» steht zweimal in den Demodaten, ohne
     Datum, auf keinem Bildschirm wiederfindbar. */
  newAppointment: {
    back: 'Kalender',
    title: 'Termin eintragen',
    lead: 'Was steht an?',
    kindLegend: 'Art',
    kindJob: 'Einsatz',
    kindJobHint: 'Arbeit beim Kunden. Ohne Offerte — für den Auftrag, der am Telefon zustande kommt.',
    kindCall: 'Anruf oder Besichtigung',
    kindCallHint: 'Rückruf, Nachfassen, Besichtigung. Zählt nicht gegen die zwei Einsätze pro Tag.',

    customerLabel: 'Kunde',
    customerPlaceholder: 'Kunde wählen',
    customerNone: 'Noch kein Kunde — nur Name und Telefon',
    propertyLabel: 'Objekt',
    propertyPlaceholder: 'Objekt wählen',
    serviceLabel: 'Leistung',
    startLabel: 'Beginn',
    durationLabel: 'Dauer',
    durationHours: '{n} Std.',
    durationMinutes: '{n} Min.',
    assigneeLabel: 'Ausführung',
    titleLabel: 'Betreff',
    titlePlaceholder: 'Rückruf wegen Erdgeschoss',
    contactNameLabel: 'Name',
    contactPhoneLabel: 'Telefon',
    eventKindLabel: 'Terminart',
    noteLabel: 'Notiz',

    submitJob: 'Einsatz eintragen',
    submitEvent: 'Termin eintragen',
    cancel: 'Abbrechen',

    doneJob: 'Einsatz {reference} eingetragen.',
    doneEvent: 'Termin eingetragen.',

    /* Dieselbe Prüfung, die auch der Kunde bekommt. Eine Regel, um die das
       Büro herumklicken kann, ist keine Regel — siehe /open-questions. */
    blockedTitle: 'Dieser Tag geht nicht',
    blockedClosedDay: 'Sonntag. Gearbeitet wird Montag bis Samstag.',
    blockedClosurePeriod: 'In dieser Zeit sind Betriebsferien eingetragen.',
    blockedTooSoon: 'Zu kurzfristig — es braucht {hours} Stunden Vorlauf.',
    blockedAtCapacity: 'An diesem Tag stehen schon {max} Einsätze. Mehr trägt der Kalender nicht.',
    blockedHint: 'Ferien und Tagesgrenze lassen sich in den Einstellungen ändern.',

    noCustomersTitle: 'Noch kein Kunde erfasst',
    noCustomersBody:
      'Ein Einsatz braucht einen Kunden und ein Objekt. Erfassen Sie zuerst den Kunden — der Termin lässt sich danach in einem Zug eintragen.',
    noCustomersAction: 'Kunde erfassen',
  },

  event: {
    back: 'Kalender',
    kindContactCall: 'Anruf',
    kindFollowUp: 'Nachfassen',
    kindViewing: 'Besichtigung',
    detailsTitle: 'Details',
    notFoundTitle: 'Termin nicht gefunden',
    notFoundBody:
      'Diesen Kalendereintrag gibt es nicht mehr, oder der Link ist veraltet. Im Kalender stehen alle aktuellen Termine.',
    slotTitle: 'Termin & Dauer',
    whenTitle: 'Wann',
    durationTitle: 'Dauer',
    /* Stand als graue Kachel neben dem Titel. Die Art ist eine Angabe zum
       Eintrag, keine Ergänzung zu seinem Namen — sie gehört zu den übrigen
       Angaben. */
    kindTitle: 'Art',
    minutes: '{n} Min.',
    contactTitle: 'Kontakt',
    contactName: 'Name',
    contactPhone: 'Telefon',
    contactAddress: 'Adresse',
    contactAssignee: 'Zuständig',
    noteTitle: 'Notiz',
    historyTitle: 'Verlauf',
    actionsTitle: 'Aktionen',
    customerLink: 'Kundenakte öffnen',
    requestLink: 'Anfrage {reference} öffnen',

    /* Hiess «Ergebnis» und lag hinter einem Knopf. Es ist das Einzige, was
       nach einem Anruf geschrieben wird — und der Text, der in die Anfrage
       übergeht. Ein Feld, kein Modus. */
    messageTitle: 'Nachricht',
    messageHint: 'Was im Gespräch gesagt wurde. Dieser Text geht in die Anfrage über.',
    messagePlaceholder: 'Zum Beispiel: Grundreinigung vor der Übergabe, Termin Ende Monat.',
    messageSave: 'Nachricht speichern',
    messageSaved: 'Nachricht gespeichert.',

    /* Die Übersicht zur Anfrage — vor und nach dem Erfassen dieselbe Karte.
       Vorher stand hier nur ein Absatz darüber, was der Knopf tut; womit die
       Anfrage vorbelegt wird, war erst im Formular zu sehen. */
    requestTitle: 'Anfrage',
    requestOpenLead:
      'Das geht in die Anfrage über. Fehlt etwas, ergänzen Sie es hier, bevor Sie erfassen.',
    requestDoneLead: 'Aus diesem Termin ist eine Anfrage geworden.',
    requestReference: 'Nummer',
    requestService: 'Leistung',
    requestCreated: 'Erfasst am',
    requestAmount: 'Betrag',
    requestNoAmount: 'Noch keine Offerte',
    requestMissing: 'Fehlt noch',
    convertAction: 'Anfrage erfassen',

    markDone: 'Als erledigt markieren',
    markNoReply: 'Niemanden erreicht',
    markNoReplyHint: 'Bleibt offen — nicht erreicht ist nicht erledigt.',
    cancel: 'Termin absagen',
    reopen: 'Wieder öffnen',
    dismiss: 'Abbrechen',

    doneToast: 'Als erledigt markiert.',
    noReplyToast: 'Notiert — niemand erreicht.',
    /* Der Bestätigungstext war der Text des Erfassen-Knopfes: «Erfassen Sie
       die Anfrage …» stand über einem roten Absagen-Knopf. */
    cancelConfirmTitle: 'Termin absagen?',
    cancelConfirmBody:
      'Der Termin verschwindet aus dem Kalender. Der Eintrag bleibt lesbar und kann wieder geöffnet werden.',
    cancelToast: 'Termin abgesagt.',
    reopenToast: 'Termin wieder offen.',
  },

  booking: {
    back: 'Buchungen',
    title: 'Buchung',
    /* Der Block hatte gar keine Überschrift, weil er keine Karte war. Als
       Karte braucht er einen Namen — und «Termin» allein wäre der Name der
       ersten Zelle, nicht des Blocks. */
    scheduleTitle: 'Termin & Dauer',
    whenTitle: 'Termin',
    windowTitle: 'Ankunftsfenster',
    durationTitle: 'Dauer',
    overviewTitle: 'Übersicht',
    customerName: 'Name',
    customerPhone: 'Telefon',
    customerEmail: 'E-Mail',
    propertyAddress: 'Adresse',
    propertyArea: 'Fläche',
    serviceTitle: 'Leistung',
    moneyTitle: 'Betrag & Belege',
    /* Was der Einsatz an Leuten gekostet hat — die andere Hälfte der
       Geldkarte, die bis jetzt nur sagen konnte, was er einbringt. */
    labourTitle: 'Arbeitszeit',
    labourTotal: '{hours} Std. von {n} Personen',
    labourTotalOne: '{hours} Std. von einer Person',
    labourOpen: 'Davon noch nicht ausbezahlt: {amount}.',
    /* «verrechnet», nicht «erfasst». Links auf derselben Seite kann seit
       Welle 84 «Gemeldet: 6.5 Std.» stehen — «noch keine Stunden erfasst»
       daneben widerspricht dem einfach. Diese Karte handelt vom Lohn, nicht
       von der Meldung. */
    labourEmpty: 'Für diesen Einsatz ist noch keine Arbeitszeit verrechnet.',
    labourAdd: 'Arbeitszeit erfassen',
    labourAll: 'Alle Einträge',
    labourHours: '{hours} Std.',
    /* Hiess `amountOnPlan` und wurde immer dann gezeigt, wenn keine Offerte
       da war — also auch für den telefonisch gebuchten Einsatz, der weder
       Offerte noch Abo hat. B-1044 behauptete, eine Monatsgebühr decke ihn,
       und verlinkte darunter die Rechnung, die ihn verrechnet hat. */
    amountBasis_offer: 'Aus der Offerte.',
    amountBasis_invoice: 'So verrechnet.',
    amountBasis_plan: 'Im Abo enthalten — die monatliche Belastung deckt diesen Einsatz.',
    amountBasis_estimate: 'Schätzung nach Stunden. Noch nichts verrechnet.',
    hours: '{hours} Std.',
    /* §2a kam zurück: die Zuweisung ist wieder ein Feld, das ein Bildschirm
       schreiben kann — mit Stunden, Warnungen und einer Aktion daneben. */
    workTitle: 'Ausführung',
    assigneeLabel: 'Zugewiesen an',
    unassigned: 'Nicht zugewiesen',
    memberInactive: 'inaktiv',
    assign: 'Zuweisen',
    reassign: 'Zuweisung ändern',
    assignSave: 'Zuweisung speichern',
    assignDone: 'Einsatz zugewiesen.',
    unassignDone: 'Zuweisung entfernt.',
    assignClosed: 'Dieser Einsatz ist {state} — die Zuweisung lässt sich nicht mehr ändern.',
    plannedLabel: 'Geplant',
    /* «Gemeldet», nicht «Gearbeitet». Rechts auf derselben Seite steht die
       Karte «Arbeitszeit» aus Welle 83 — die verrechneten Stunden mit ihrem
       Franken-Betrag. Zwei Kästen mit «Gearbeitet: 6.5 Std.» nebeneinander,
       und der Leser weiss nicht, welcher die Meldung ist und welcher die
       Kosten. Links steht, was die ausführende Person gemeldet hat und was
       das Büro freigibt (§5.3); rechts, was daraus an Lohn wurde. */
    workedLabel: 'Gemeldet',
    /* Mit Namen, weil ein Einsatz weitergegeben werden kann: die Stunden
       bleiben bei der Person, die sie gearbeitet hat. */
    workedBy: 'Gemeldet — {name}',
    noHours: 'Noch nichts gemeldet',
    varianceLabel: 'Differenz',
    varianceOver: '{hours} Std. über der Planung',
    varianceUnder: '{hours} Std. unter der Planung',
    /* Nie eine Sperre — das Büro weiss Dinge, die im Datensatz nicht stehen.
       Aber schweigen darf der Bildschirm nicht: ein Einsatz bei jemandem, der
       zur selben Stunde an einer anderen Adresse steht, ist ein Auto, das
       nicht kommt. */
    warn_clash: '{name} hat zur gleichen Zeit bereits einen anderen Einsatz.',
    warn_skill: '{name} ist für diese Leistung nicht freigegeben.',
    warn_region: 'Diese Adresse liegt ausserhalb des Einsatzgebiets von {name}.',
    warn_inactive: '{name} ist als inaktiv markiert.',
    hoursCorrect: 'Stunden korrigieren',
    hoursAdd: 'Stunden erfassen',
    hoursFieldLabel: 'Gearbeitete Stunden — {name}',
    hoursFieldHint:
      'Die Korrektur des Büros. Im Verlauf steht danach, dass sie vom Büro kommt und nicht von der ausführenden Person.',
    hoursInvalid: 'Zwischen 0.5 und {max} Stunden.',
    hoursSave: 'Stunden speichern',
    hoursSaved: 'Stunden gespeichert.',
    approveHours: 'Gemeldet: {worked} Std. — geplant waren {planned} Std.',
    approveNoHours: 'Es wurde keine Zeit gemeldet.',
    customerTitle: 'Kunde',
    propertyTitle: 'Objekt',
    accessTitle: 'Zutritt',
    amountTitle: 'Betrag',
    actionsTitle: 'Aktionen',
    reschedule: 'Verschieben',
    rescheduleLabel: 'Neuer Termin',
    rescheduleSave: 'Termin verschieben',
    rescheduledTo: 'Verschoben auf {date}, {time}',
    /* Der Badge sagt «Verschoben» und kann kein Datum tragen. Was das Büro vor
       dem Rückruf braucht, ist genau das eine, was fehlte: was der Kunde
       vorher im Kalender stehen hatte. */
    movedTitle: 'Dieser Einsatz wurde verschoben',
    movedBody: 'Von {fromDate}, {fromTime} auf {toDate}, {toTime}.',
    movedNotified: '{name} wurde am {at} im Kundenkonto benachrichtigt.',
    movedShort: 'Stand vorher auf {date}, {time}.',
    /* Landet im Nachrichtenverlauf des Kunden unter der Buchungsnummer — also
       neben allem anderen zu diesem Einsatz, nicht in einem Postfach, das im
       Produkt niemand öffnen kann. */
    noticeBody:
      'Guten Tag\n\nwir mussten Ihren Einsatz verschieben: statt {fromDate}, {fromTime} kommen wir neu am {toDate}, {toTime}.\n\nPasst Ihnen der neue Termin nicht, antworten Sie einfach hier — wir finden einen anderen.\n\nFreundliche Grüsse\nHomivaro',
    rescheduleDone: 'Termin verschoben.',
    dismiss: 'Abbrechen',
    cancel: 'Stornieren',
    cancelConfirmTitle: 'Einsatz stornieren?',
    cancelConfirmBody:
      'Der Termin wird abgesagt und aus dem Kalender genommen. Der Kunde wird benachrichtigt — das lässt sich nicht rückgängig machen.',
    cancelConfirmAction: 'Einsatz stornieren',
    cancelEvent: 'Einsatz storniert',
    cancelDone: 'Einsatz storniert.',
    /* Hiess «Kein Zutritt erfassen». Ein Reviewer las das als zwei Dinge —
       einen «Erfassen»-Knopf, der «keinen Zutritt/keine Aktion» hat. Wenn ein
       Label so gelesen werden kann, ist es das Label, das falsch ist. */
    markNoAccess: 'Kein Zutritt melden',
    noAccessHint: 'Meldet {percent}% Gebühr, mit Foto und Zeitstempel.',
    /* Die Knöpfe waren bei einem abgeschlossenen Einsatz deaktiviert und sagten
       nicht warum — was von aussen wie ein toter Knopf aussieht. */
    settledHint:
      'Dieser Einsatz ist {state}. Verschieben, Zuweisen und Stornieren sind damit zu — der Verlauf unten bleibt lesbar.',
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
    /* Stand vorher «prüfen Sie den Verlauf» — schickte also zum Suchen nach
       einer Zahl, die seit dieser Welle direkt darunter steht. */
    approveBody:
      'Der Einsatz ist ausgecheckt. Die gemeldete Zeit steht unten, die Differenz zur Planung daneben. Nach der Freigabe ist der Einsatz verrechenbar — was ein Mehraufwand kostet, entscheiden Sie auf der Rechnung.',
    approveAction: 'Einsatz freigeben',
    approveEvent: 'Freigegeben',
    approveDone: 'Einsatz freigegeben.',
  },
};
