/**
 * Die Geldseite — Rechnungen, Ausgaben, Auswertung.
 *
 * Eigene Datei, weil `crm.de.ts` mit den Rechnungen schon bei 700 Zeilen liegt
 * und die zwei neuen Screens zusammen noch einmal so viel bringen. Die
 * Rechnungs-Keys bleiben, wo sie sind: sie werden von Screen 71 gelesen, das
 * seit Wave 74 dort steht, und ein Umzug wäre eine Diff über eine Datei, die
 * mit dieser Änderung nichts zu tun hat.
 */
export const adminFinanceDe = {
  finance: {
    /* Die Beschriftung der zwei Links auf den Kacheln oben. Standen mal im
       Tab-Streifen über der Seite; der ist weg, seit die drei Screens je eine
       eigene Zeile in der Seitenleiste haben. */
    linkInvoices: 'Rechnungen',
    linkExpenses: 'Ausgaben',

    title: 'Auswertung',
    lead: 'Was reingekommen ist, was rausgegangen ist, und was übrig bleibt.',

    /* Steht über den Zahlen, nicht darunter: wer eine Marge liest, muss vorher
       wissen, welche Kosten nicht drin sind. */
    basisTitle: 'Wie gerechnet wird',
    basisBody:
      'Gezählt wird nach dem Monat, in dem gearbeitet wurde — nicht nach dem Tag, an dem das Geld kam. Ein Einsatz im März gehört zum März, auch wenn die Rechnung erst im Mai bezahlt wird. Entwürfe und stornierte Rechnungen zählen nicht.',
    basisOwner:
      'Der eigene Lohn steckt nicht in den Kosten. Was als «Gewinn» steht, ist das, was vor Eigenlohn und Steuern übrig bleibt.',

    rangeLabel: 'Zeitraum',
    range3: 'Letzte 3 Monate',
    range6: 'Letzte 6 Monate',
    range12: 'Letzte 12 Monate',

    statRevenue: 'Umsatz',
    statRevenueHint: '{n} Rechnungen im Zeitraum.',
    statCosts: 'Kosten',
    statCostsHint: '{n} Belege im Zeitraum.',
    statProfit: 'Gewinn',
    statProfitHint: 'Marge {percent}%.',
    statProfitNoRevenue: 'Ohne Umsatz gibt es keine Marge.',
    statLoss: 'Verlust',
    statOutstanding: 'Offen',
    statOutstandingHint: 'Gestellt und noch nicht bezahlt — über alle Zeiträume.',
    statOutstandingNone: 'Nichts offen.',
    statCommitment: 'Fixkosten',
    statCommitmentHint: 'Läuft weiter, auch wenn der Monat leer ist.',

    chartTitle: 'Monat für Monat',
    chartLead: 'Umsatz und Kosten nebeneinander. Der laufende Monat ist noch nicht fertig.',
    chartRevenue: 'Umsatz',
    chartCosts: 'Kosten',
    chartCurrent: 'läuft noch',
    chartEmptyTitle: 'Noch nichts zu rechnen',
    chartEmptyBody:
      'Sobald die erste Rechnung freigegeben oder der erste Beleg erfasst ist, steht hier der Monatsverlauf.',

    downloadAction: 'Monate herunterladen',
    downloadDone: '{n} Monate heruntergeladen.',

    tableTitle: 'Die Zahlen dazu',
    /* Das Diagramm ist die schnelle Antwort, die Tabelle die genaue — und die
       einzige, die sich vorlesen lässt. Beide lesen dieselbe Rechnung. */
    tableLead: 'Dieselben Monate, zum Nachrechnen und Vorlesen.',
    colMonth: 'Monat',
    colRevenue: 'Umsatz',
    colCosts: 'Kosten',
    colProfit: 'Ergebnis',

    categoriesTitle: 'Wohin die Kosten gehen',
    categoriesLead: 'Grösster Posten zuerst. Kategorien ohne Beleg im Zeitraum fehlen.',
    categoriesEmptyTitle: 'Keine Kosten im Zeitraum',
    categoriesEmptyBody: 'In diesen Monaten wurde kein Beleg erfasst.',
    categoryShare: '{percent}% der Kosten',
    categoryCount: '{n} Belege',
    categoryCountOne: '1 Beleg',
  },

  expenses: {
    title: 'Ausgaben',
    lead: 'Was das Geschäft kostet — Material, Fahrzeug, Miete, Versicherung. Die andere Hälfte der Auswertung.',
    search: 'Lieferant, Nummer oder Notiz',
    searchPlaceholder: 'z. B. Garage Rüegg',
    filterCategory: 'Kategorie',
    filterStatus: 'Status',
    filterAll: 'Alle',
    filterOutstanding: 'Offen',
    filterReset: 'Filter zurücksetzen',

    colReference: 'Nummer',
    colSupplier: 'Lieferant',
    colCategory: 'Kategorie',
    colAmount: 'Betrag',
    colIncurred: 'Datum',
    colDue: 'Fällig',
    colMethod: 'Zahlweg',
    colNote: 'Notiz',
    colStatus: 'Status',
    noDueDate: 'Ohne Frist',
    overdueBy: '{days} T. überfällig',
    dueIn: 'in {days} T.',
    recurring: 'Monatlich',

    newAction: 'Ausgabe erfassen',
    rowOpen: 'Ausgabe öffnen',
    rowEdit: 'Ausgabe bearbeiten',
    rowMarkPaid: 'Als bezahlt erfassen',
    rowDelete: 'Ausgabe löschen',
    deleteConfirmTitle: 'Ausgabe löschen?',
    deleteConfirm:
      '{reference} — {supplier}, {amount}. Der Beleg verschwindet aus der Auswertung. Rückgängig geht das nicht.',
    deleteDone: '{reference} gelöscht.',

    paidTitle: 'Als bezahlt erfassen',
    paidBody: '{reference} — {supplier}, {amount}.',
    /* Der Zahlweg ist Pflicht, aus demselben Grund wie bei der Rechnung:
       «bezahlt» ohne Weg ist die Hälfte der Auskunft. */
    paidMethod: 'Wie bezahlt?',
    paidAction: 'Als bezahlt erfassen',
    paidDone: '{reference} als bezahlt erfasst.',

    downloadAction: 'Ausgaben herunterladen',
    downloadEmpty: 'Nichts zum Herunterladen — die Liste ist leer.',
    downloadDone: '{n} Belege heruntergeladen.',

    emptyTitle: 'Noch keine Ausgaben erfasst',
    emptyBody:
      'Ohne Kosten zeigt die Auswertung nur die eine Hälfte. Der erste Beleg — Material, Tanken, Miete — macht den Gewinn lesbar.',
    filterEmptyTitle: 'Keine Ausgabe passt',
    filterEmptyBody: 'Suche und Filter schliessen alles aus. Zurücksetzen zeigt wieder alle.',

    categories: {
      supplies: 'Material',
      vehicle: 'Fahrzeug',
      wages: 'Löhne',
      insurance: 'Versicherung',
      marketing: 'Werbung',
      software: 'Software',
      rent: 'Miete',
      other: 'Sonstiges',
    },
  },

  expense: {
    back: 'Alle Ausgaben',
    newTitle: 'Ausgabe erfassen',
    newLead: 'Ein Beleg, der ins Geschäft gehört. Erst offen — bezahlt wird er im nächsten Schritt.',
    notFoundTitle: 'Diese Ausgabe gibt es nicht',
    notFoundBody: 'Der Beleg wurde gelöscht oder der Link stimmt nicht mehr.',

    sectionWhatTitle: 'Was und für wen',
    supplierLabel: 'Lieferant',
    supplierHint: 'Wer bezahlt wurde — so, wie es auf dem Beleg steht.',
    categoryLabel: 'Kategorie',
    noteLabel: 'Notiz',
    noteHint: 'Wofür genau. Steht später in der Liste und im Export.',

    sectionMoneyTitle: 'Betrag und Fristen',
    amountLabel: 'Betrag CHF',
    amountHint: 'Brutto, so wie er abgebucht wird. Ohne MwSt.-Aufteilung — wir sind nicht MwSt.-pflichtig.',
    incurredLabel: 'Datum',
    incurredHint: 'Der Tag, an dem die Kosten entstanden sind. Danach zählt der Monat.',
    dueLabel: 'Zahlbar bis',
    dueHint: 'Leer lassen, wenn direkt bezahlt wurde — dann kann nichts überfällig werden.',
    recurringLabel: 'Läuft jeden Monat',
    recurringHint:
      'Miete, Versicherung, Abos. Wird in der Auswertung als Fixkosten gezählt. Der nächste Monat wird nicht automatisch angelegt.',

    sectionJobTitle: 'Gehört zu einem Einsatz',
    bookingLabel: 'Einsatz',
    bookingHint: 'Nur, wenn die Kosten wirklich zu einem Auftrag gehören. Tanken gehört zum Monat.',
    bookingNone: 'Keinem Einsatz zugeordnet',

    statusTitle: 'Bezahlt',
    statusPaid: 'Am {date} bezahlt — {method}.',
    statusOpen: 'Noch offen.',
    statusOverdue: 'Seit {days} Tagen überfällig.',

    errorSupplier: 'Pflichtfeld.',
    errorAmount: 'Muss grösser als 0 sein.',
    errorDueBeforeIncurred: 'Die Frist liegt vor dem Datum der Kosten.',

    save: 'Speichern',
    create: 'Ausgabe erfassen',
    cancel: 'Abbrechen',
    discard: 'Änderungen verwerfen',
    unsaved: 'Nicht gespeichert.',
    created: '{reference} erfasst.',
    saved: '{reference} gespeichert.',
  },
};
