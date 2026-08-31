/**
 * Quote and payment — screens 23–31.
 *
 * The client confirmed payment in full on acceptance, so this is the heaviest
 * moment in the product: a stranger paying a company with no reviews before
 * anyone has entered their home. The copy carries that weight — every step
 * says what happens next and what it does not commit you to.
 */
export const offerDe = {
  meta: { title: 'Ihre Offerte' },

  shell: {
    reference: 'Offerte',
    version: 'Version {n}',
    validUntil: 'Gültig bis',
    daysLeft: '{days, plural, one {noch # Tag} other {noch # Tage}}',
    expiresSoon: 'Läuft bald ab',
    issued: 'Erstellt am',
    for: 'Für',
    steps: {
      offer: 'Offerte',
      termin: 'Termin',
      unterschrift: 'Unterschrift',
      zahlung: 'Zahlung',
    },
  },

  detail: {
    /* Die Nicht-gefunden-Ansicht war fest auf Deutsch im Code — auf einer
       Seite, die in vier Sprachen ausgeliefert wird. */
    notFoundTitle: 'Offerte nicht gefunden',
    notFoundBody:
      'Der Link ist möglicherweise veraltet oder die Offerte wurde ersetzt. Melden Sie sich kurz bei uns — wir senden sie sofort neu.',
    notFoundCall: 'Anrufen',
    notFoundContact: 'Kontakt aufnehmen',
    title: 'Ihre Offerte',
    for: 'Für',
    intro: 'Nachricht',
    linesTitle: 'Positionen',
    colDescription: 'Position',
    colQuantity: 'Menge',
    colUnit: 'Einzelpreis',
    colTotal: 'Betrag',
    hours: '{n} Std.',
    pieces: '{n} Stk.',
    optionalTitle: 'Wählbare Positionen',
    optionalLead:
      'Diese Positionen können Sie ab- oder zuwählen. Der Betrag und die geplante Dauer passen sich sofort an.',
    optionalBadge: 'Wählbar',
    subtotal: 'Zwischensumme',
    discount: 'Rabatt',
    total: 'Gesamtbetrag',
    noVat: 'Keine MwSt. — das ist der Endbetrag.',
    durationNote: 'Geplante Dauer: {hours} Std. · Ankunftsfenster {window}',
    accept: 'Offerte annehmen',
    requestChange: 'Änderung anfragen',
    downloadPdf: 'Als PDF herunterladen',
    /* Annehmen und «Änderung anfragen» waren die einzigen zwei Ausgänge. Wer
       die Offerte schlicht nicht wollte, hatte keinen — der Status «rejected»
       existierte im Modell und war von hier aus nie erreichbar. Ein Nein ohne
       Knopf wird zum unbeantworteten Angebot, das drei Wochen später als
       «abgelaufen» in der Statistik steht und niemandem sagt, warum. */
    decline: 'Offerte ablehnen',
    declineTitle: 'Offerte ablehnen?',
    declineBody:
      'Die Offerte wird geschlossen und ein reservierter Termin wird sofort wieder freigegeben. Rückgängig machen können Sie das nicht — eine neue Anfrage ist jederzeit möglich.',
    declineReason: 'Warum nicht?',
    declineReasonHint: 'Freiwillig, und wir lesen es wirklich.',
    declineReasonPlaceholder: 'z. B. zu teuer, Termin passt nicht, anders gelöst …',
    declineConfirm: 'Ablehnen',
    declineDismiss: 'Zurück',
    declineDone: 'Offerte abgelehnt. Danke für die Rückmeldung.',
    declinedTitle: 'Offerte abgelehnt',
    declinedBody:
      'Diese Offerte ist geschlossen. Wenn sich etwas ändert, stellen Sie jederzeit eine neue Anfrage.',
    declinedAction: 'Neue Anfrage',
    declinedOn: 'Abgelehnt am',
    downloadNote: 'Prototyp: das PDF wird nicht erzeugt.',
    guaranteeTitle: 'Abnahmegarantie inbegriffen',
    guaranteeBody:
      'Besteht die Wohnung die Abnahme nicht, reinigen wir vor dem Übergabetermin kostenlos nach.',
    notBookedTitle: 'Noch ist nichts gebucht',
    notBookedBody:
      'Wenn Sie annehmen, wählen Sie zuerst einen freien Termin. Verbindlich wird er erst nach der Zahlung.',
  },

  expired: {
    badge: 'Abgelaufen',
    title: 'Diese Offerte ist abgelaufen.',
    body: 'Sie war bis zum {date} gültig. Preise können sich seither geändert haben, deshalb erstellen wir Ihnen lieber eine neue — das dauert keine Minute.',
    action: 'Neue Offerte anfragen',
    reissued: 'Neue Version erstellt. Sie können jetzt fortfahren.',
    /* Der Knopf hat den Rückgabewert von `reissueOffer` ignoriert. Bei einer
       Offerte, für die keine neue Version gilt, passierte schlicht nichts —
       kein Hinweis, keine Meldung. Ein Hauptknopf, der stillschweigend nichts
       tut, ist schlimmer als gar keiner. */
    reissueRefused:
      'Für diese Offerte lässt sich keine neue Version erstellen. Melden Sie sich kurz bei uns.',
    lapsedOn: 'Abgelaufen am',
    keptPrices:
      'Versendete Offerten behalten ihren Preis bis zum Ablaufdatum. Danach rechnen wir neu.',
  },

  /**
   * Die angenommene Offerte — vorher gab es diesen Zustand auf dem Kundenbild
   * gar nicht.
   *
   * Sie fiel auf die lebende Offerte durch: «Offerte annehmen» auf einem
   * unterschriebenen, bezahlten und terminierten Auftrag, daneben «Noch ist
   * nichts gebucht». Und sobald das Ablaufdatum vorbei war — was bei jeder
   * angenommenen Offerte irgendwann eintritt —, meldete der Bildschirm
   * «abgelaufen» und bot eine neue Offerte an.
   */
  accepted: {
    badge: 'Angenommen',
    title: 'Offerte angenommen',
    body: 'Sie haben diese Offerte am {date} unterschrieben. Damit ist sie verbindlich — hier steht, was vereinbart wurde und wo der Auftrag steht.',
    /* Angenommen, aber ohne Unterschrift im Datensatz: möglich, wenn die
       Annahme am Telefon erfolgt ist. Ein Datum zu erfinden wäre schlimmer,
       als keines zu nennen. */
    bodyUnsigned:
      'Diese Offerte ist angenommen und verbindlich — hier steht, was vereinbart wurde und wo der Auftrag steht.',
    signedOn: 'Unterschrieben am',
    bookingTitle: 'Termin',
    bookingOpen: 'Buchungsbestätigung',
    bookingNone: 'Der Termin ist noch nicht gesetzt. Wir melden uns bei Ihnen.',
    bookingCancelled: 'Dieser Termin wurde storniert.',
    paymentTitle: 'Zahlung',
    paymentNone: 'Für diese Offerte ist keine Zahlung erfasst.',
    paymentRefunded: 'Der Betrag wurde vollständig zurückerstattet.',
    toOffers: 'Zu meinen Offerten',
  },

  /**
   * Die Offerte als Beleg — für die drei Zustände, in denen man nichts mehr
   * tun kann: abgelehnt, abgelaufen, angenommen.
   *
   * Eine geschlossene Offerte war eine Überschrift und ein Satz. Keine
   * Leistung, keine Adresse, keine Position, kein Franken — wer acht Wochen
   * später nachschauen wollte, *was* er abgelehnt hat, fand eine Seite, die es
   * ihm nicht sagen konnte.
   */
  record: {
    title: 'Was in dieser Offerte stand',
    reference: 'Referenz',
    version: 'Version {n}',
    service: 'Leistung',
    address: 'Adresse',
    issued: 'Erstellt am',
    duration: 'Geplante Dauer',
    durationValue: '{hours} Std.',
    message: 'Begleittext',
    linesTitle: 'Positionen',
    colDescription: 'Position',
    colQuantity: 'Menge',
    colUnit: 'Einzelpreis',
    colTotal: 'Betrag',
    hours: '{n} Std.',
    /* Auf einer geschlossenen Offerte ist eine wählbare Position keine Wahl
       mehr, sondern eine Tatsache: sie war drin oder sie war draussen. */
    optionalOn: 'Wählbar · enthalten',
    optionalOff: 'Wählbar · nicht enthalten',
    subtotal: 'Zwischensumme',
    discount: 'Rabatt',
    total: 'Gesamtbetrag',
    noVat: 'Keine MwSt. — das war der Endbetrag.',
  },

  slot: {
    title: 'Wann sollen wir kommen?',
    lead: 'Das sind die tatsächlich freien Zeiten. Was Sie hier sehen, können Sie auch buchen.',
    durationNote: 'Geplant sind {hours} Std. Angezeigt werden nur Zeiten, die dafür reichen.',
    noneTitle: 'In den nächsten Wochen ist nichts frei',
    noneBody:
      'Das kommt bei zwei Einsätzen pro Tag vor. Melden Sie sich kurz — wir finden einen Weg.',
    dayClosed: 'Geschlossen',
    dayClosure: 'Betriebsferien',
    dayTooSoon: 'Zu kurzfristig',
    dayFull: 'Ausgebucht',
    slotsFor: 'Freie Zeiten am {date}',
    arrivalWindow: 'Ankunft zwischen {from} und {to}',
    selected: 'Gewählt',
    holdTitle: 'Termin für Sie reserviert',
    holdBody:
      'Wir halten diesen Termin {minutes} Minuten für Sie frei, während Sie abschliessen.',
    holdRemaining: 'Noch {time}',
    holdExpiredTitle: 'Die Reservation ist abgelaufen',
    holdExpiredBody:
      'Der Termin ist wieder freigegeben. Wählen Sie einen neuen — meistens ist derselbe noch frei.',
    holdExpiredAction: 'Termin neu wählen',
    continue: 'Weiter zur Unterschrift',
    /*
     * Erstauftrag: vorschlagen statt buchen.
     *
     * Beim Stammkunden kennen wir Objekt, Zutritt und Verlauf — da wäre eine
     * Bestätigungsschlaufe reines Theater. Beim ersten Einsatz will das Büro
     * einmal draufschauen, bevor der Kalender vergeben ist.
     */
    titleProposal: 'Wann würde es Ihnen passen?',
    leadProposal:
      'Wählen Sie bis zu {max} Termine, die Ihnen passen. Wir bestätigen einen davon — so ist sicher, dass wir es auch schaffen.',
    pickedCount: '{n} von {max} gewählt',
    sendProposals: 'Termine vorschlagen',
    proposalHint: 'Nichts ist bisher verbindlich. Erst die Bestätigung reserviert den Termin.',
    proposalN: 'Vorschlag {n}',
    waitingTitle: 'Ihre Termine sind bei uns',
    waitingBody:
      'Wir melden uns innerhalb von {hours} Stunden mit einer Bestätigung. Danach unterschreiben und bezahlen Sie — nicht vorher.',
    waitingChange: 'Andere Termine wählen',
    confirmedTitle: 'Termin bestätigt',
    confirmedBody:
      '{date} ist für Sie reserviert. Die Reservation hält {hours} Stunden — danach unterschreiben und bezahlen Sie.',
  },

  /*
   * §9.2 — der Vertrag steht jetzt auf der Seite, auf der er unterschrieben
   * wird. Vorher waren es drei Eckdaten und ein Link auf die AGB: drei
   * Eckdaten prüft man, unterschreiben tut man ein Dokument.
   */
  contract: {
    title: 'Dienstleistungsvertrag',
    versionLabel: 'Version {n}',
    partiesHeading: 'Vertragsparteien',
    contractor: 'Auftragnehmerin',
    client: 'Auftraggeber',
    serviceHeading: 'Leistung und Termin',
    serviceLabel: 'Leistung',
    addressLabel: 'Einsatzort',
    dateLabel: 'Termin',
    dateOpen: 'Noch offen — wird vor der Zahlung festgelegt',
    durationLabel: 'Geplante Dauer',
    hours: '{n} Std.',
    priceHeading: 'Vergütung',
    discount: 'Rabatt',
    subtotal: 'Zwischensumme',
    total: 'Gesamtbetrag',
    priceNote:
      'Homivaro ist nicht mehrwertsteuerpflichtig. Der genannte Betrag ist der Endbetrag.',
  },

  sign: {
    title: 'Vertrag unterschreiben',
    lead: 'Homivaro hat bereits unterschrieben. Mit Ihrer Unterschrift ist der Vertrag geschlossen.',
    canvasLabel: 'Hier unterschreiben',
    canvasHint: 'Mit der Maus oder dem Finger.',
    clear: 'Nochmals',
    summaryService: 'Leistung',
    summaryDate: 'Termin',
    summaryAmount: 'Betrag',
    confirm: 'Ich habe den Vertrag gelesen und akzeptiere ihn.',
    continue: 'Weiter zur Zahlung',
    required: 'Bitte unterschreiben Sie, um fortzufahren.',
    documentTitle: 'Der Vertrag',
    documentHint: 'Der ganze Text steht hier — scrollen Sie, um ihn zu lesen.',
    signaturesTitle: 'Unterschriften',
    companyCaption: 'Für Homivaro',
    customerCaption: 'Auftraggeber',
    companyPending: 'Wird beim Versand gesetzt',
    customerPending: 'Ihre Unterschrift fehlt noch',
  },

  payment: {
    title: 'Zahlung',
    lead: 'Der Betrag wird vollständig belastet. Danach ist Ihr Termin verbindlich reserviert.',
    methodTitle: 'Zahlungsmittel',
    twint: 'TWINT',
    card: 'Karte',
    applePay: 'Apple Pay',
    googlePay: 'Google Pay',
    cardNumber: 'Kartennummer',
    cardExpiry: 'Gültig bis',
    cardCvc: 'CVC',
    cardName: 'Name auf der Karte',
    twintHint: 'Sie werden zur TWINT-App weitergeleitet.',
    walletHint: 'Bestätigung erfolgt auf Ihrem Gerät.',
    amountDue: 'Zu zahlen',

    /* The card directly above the pay button. Payment in full up front was
       confirmed by the client, so this is where the design has to carry the
       trust: what happens next, the cancellation rule as a number, and who
       gets in touch. Never in a footer, never behind a link. */
    beforeTitle: 'Was jetzt passiert',
    before1: 'Ihr Termin am {date} wird verbindlich reserviert.',
    before2: 'Sie erhalten sofort eine Bestätigung per E-Mail.',
    before3: 'Bis 24 Stunden vor dem Termin können Sie kostenlos absagen oder verschieben.',
    before4: 'Danach werden {percent}% verrechnet, der Rest wird zurückerstattet.',
    beforeContact: 'Bei Fragen meldet sich {name} persönlich — {phone}.',

    pay: 'Jetzt {amount} bezahlen',
    processing: 'Zahlung wird verarbeitet …',
    mockNotice:
      'Prototyp: es wird kein Geld belastet. Wählen Sie unten, welchen Ausgang Sie sehen möchten.',
    mockSucceed: 'Erfolgreiche Zahlung',
    mockFail: 'Fehlgeschlagene Zahlung',
    /* §11.3 — ein Einsatz, den das Abo schon bezahlt hat, wird nicht zweimal
       verrechnet. Ohne das hier verlangte der Ablauf eine Karte und belastete
       den vollen Betrag für einen Einsatz, der im Abo enthalten ist. */
    coveredTitle: 'Für diesen Einsatz ist nichts zu bezahlen',
    coveredSubscription:
      'Dieser Einsatz gehört zu Ihrem Abo. Abgerechnet wird wie gewohnt monatlich.',
    coveredConfirm: 'Termin verbindlich buchen',
    secure: 'Verschlüsselte Verbindung',
  },

  failed: {
    badge: 'Fehlgeschlagen',
    title: 'Die Zahlung ist nicht durchgegangen.',
    body: 'Ihre Karte wurde abgelehnt. Es wurde nichts belastet, und Ihre Offerte bleibt gültig.',
    holdTitle: 'Ihr Termin ist noch reserviert',
    holdBody: 'Noch {time}. Danach geben wir ihn wieder frei.',
    holdLostTitle: 'Der Termin wurde freigegeben',
    holdLostBody: 'Wählen Sie einen neuen Termin — meistens ist derselbe noch frei.',
    pickNewSlot: 'Neuen Termin wählen',
    retry: 'Erneut versuchen',
    otherMethod: 'Anderes Zahlungsmittel',
    help: 'Klappt es nicht? Rufen Sie uns an: {phone}',
  },

  confirmed: {
    missingTitle: 'Diese Buchung finden wir nicht',
    missingBody:
      'Der Link gehört zu einer Offerte, zu der noch keine Buchung besteht — oder sie wurde storniert. Die Offerte selbst ist weiterhin abrufbar.',
    missingAction: 'Offerte öffnen',
    badge: 'Gebucht',
    title: 'Ihr Termin steht.',
    reference: 'Buchung',
    dateTitle: 'Termin',
    windowTitle: 'Ankunftsfenster',
    windowBody: 'Wir treffen zwischen {from} und {to} ein.',
    addressTitle: 'Adresse',
    accessTitle: 'Zutritt',
    amountTitle: 'Bezahlt',
    nextTitle: 'Was als Nächstes passiert',
    next1: 'Sie erhalten eine Bestätigung per E-Mail.',
    next2: 'Wir erinnern Sie 24 Stunden vorher.',
    next3: 'Nach dem Einsatz erhalten Sie Fotos und die Rechnung.',
    cancelTitle: 'Absagen oder verschieben',
    cancelBody:
      'Bis 24 Stunden vorher kostenlos, über Ihren Kundenbereich oder telefonisch.',
    toAccount: 'Zu meinen Terminen',
    addCalendar: 'Zum Kalender hinzufügen',
    calendarNote: 'Prototyp: die Datei wird nicht erzeugt.',
  },

  change: {
    title: 'Änderung anfragen',
    lead: 'Sagen Sie uns, was nicht passt. Wir erstellen eine neue Version — die aktuelle bleibt bis dahin gültig.',
    reasonLabel: 'Worum geht es?',
    reasonPrice: 'Der Preis',
    reasonScope: 'Der Leistungsumfang',
    reasonDate: 'Der Termin',
    reasonOther: 'Etwas anderes',
    messageLabel: 'Ihre Nachricht',
    messageHint: 'Je konkreter, desto schneller können wir antworten.',
    submit: 'Anfrage senden',
    submitting: 'Wird gesendet …',
    sentTitle: 'Ihre Anfrage ist angekommen.',
    sentBody:
      'Wir melden uns innert {hours} Stunden mit einer angepassten Offerte. Die bisherige Version bleibt bis dahin gültig.',
    back: 'Zurück zur Offerte',
  },
};
