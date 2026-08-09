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
    keptPrices:
      'Versendete Offerten behalten ihren Preis bis zum Ablaufdatum. Danach rechnen wir neu.',
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
  },

  sign: {
    title: 'Offerte unterschreiben',
    lead: 'Mit Ihrer Unterschrift bestätigen Sie Leistung, Termin und Betrag.',
    canvasLabel: 'Hier unterschreiben',
    canvasHint: 'Mit der Maus oder dem Finger.',
    clear: 'Nochmals',
    summaryService: 'Leistung',
    summaryDate: 'Termin',
    summaryAmount: 'Betrag',
    confirm: 'Ich habe die Offerte gelesen und akzeptiere die AGB.',
    continue: 'Weiter zur Zahlung',
    required: 'Bitte unterschreiben Sie, um fortzufahren.',
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
