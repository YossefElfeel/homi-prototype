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
    linkWorkforce: 'Nach Person aufschlüsseln',

    title: 'Auswertung',
    lead: 'Was reingekommen ist, was rausgegangen ist, und was übrig bleibt.',

    /* Steht über den Zahlen, nicht darunter: wer eine Marge liest, muss vorher
       wissen, welche Kosten nicht drin sind. */
    basisTitle: 'Wie gerechnet wird',
    basisBody:
      'Gezählt wird nach dem Monat, in dem gearbeitet wurde — nicht nach dem Tag, an dem das Geld kam. Ein Einsatz im März gehört zum März, auch wenn die Rechnung erst im Mai bezahlt wird. Entwürfe und stornierte Rechnungen zählen nicht.',
    /* Die Einschränkung am Ende ist neu und nötig: seit es «Arbeitszeit» gibt,
       kann der eigene Lohn sehr wohl in den Kosten landen — nämlich dann, wenn
       jemand Stunden auf die Geschäftsleitung bucht. Der Satz ohne diesen
       Zusatz wäre auf genau dem Screen falsch, auf dem er steht. */
    basisOwner:
      'Der eigene Lohn steckt nicht in den Kosten — ausser er wird als Arbeitszeit auf einen Einsatz gebucht. Was als «Gewinn» steht, ist das, was vor Eigenlohn und Steuern übrig bleibt.',

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
    /* Der Einsatz steht jetzt mit drin, weil «was hat B-1052 gekostet» die
       Frage ist, die man laut stellt — und die das Feld vorher nicht
       beantworten konnte. */
    search: 'Lieferant, Nummer, Notiz oder Einsatz',
    searchPlaceholder: 'z. B. Garage Rüegg oder B-1052',
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
    /* Nur bei Arbeitszeit gefüllt — und im Export für jede Zeile vorhanden, weil
       eine Spalte, die je nach Zeile fehlt, die Tabelle im Excel verschiebt. */
    colHours: 'Stunden',
    colWorker: 'Person',
    colPaidBy: 'Bezahlt von',
    colResponsible: 'Verantwortlich',
    colJob: 'Einsatz',
    filterWorker: 'Person',
    hours: '{hours} Std.',
    workforceAction: 'Arbeitszeit',
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
      /* «Arbeitszeit», nicht «Löhne 2»: das eine sind Stunden auf einem
         Einsatz, das andere die Auszahlung am Monatsende. Zwei Zeilen, weil es
         zwei verschiedene Fragen sind. */
      labour: 'Arbeitszeit',
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
    categoryHintLabour:
      '«Arbeitszeit» ist eine Person auf einem Einsatz. «Löhne» ist die Auszahlung am Monatsende, ohne Einsatz dahinter.',
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
    bookingHintLabour:
      'Bei Arbeitszeit Pflicht. Stunden ohne Einsatz sind eine Auszahlung — dafür ist «Löhne» da.',
    bookingNone: 'Keinem Einsatz zugeordnet',
    bookingNoneLabour: 'Einsatz wählen',

    sectionLabourTitle: 'Wer hat gearbeitet',
    sectionLabourLead:
      'Die Kette, die diese Kategorie überhaupt erfassbar macht: Einsatz → Person → Stunden → Betrag → wer bezahlt → wer verantwortet.',
    workerLabel: 'Person',
    workerHint: 'Wer die Stunden gemacht hat. Steht danach in der Liste, wo sonst der Lieferant steht.',
    workerNone: 'Person wählen',
    hoursLabel: 'Stunden',
    hoursHint: 'Dezimal — 3.5, nicht 3:30.',
    /* Der Einsatz weiss es schon: Check-in bis Check-out steht auf der Buchung.
       Vorgeschlagen statt eingetragen — wer vergisst auszuchecken, hätte sonst
       einen Elf-Stunden-Tag im Beleg. */
    hoursOnSite: 'Vor Ort waren es {hours} Std. — Check-in bis Check-out.',
    hoursUse: 'Übernehmen',
    paidByLabel: 'Bezahlt von',
    paidByHint: 'Wessen Konto das Geld verlässt. Ob es schon raus ist, sagt der Status.',
    responsibleLabel: 'Verantwortlich',
    responsibleHint: 'Wem die Kosten gehören — wer sie freigegeben hat.',
    rateHint: 'Macht {rate} pro Stunde.',
    rateHintNone: 'Sobald Betrag und Stunden stehen, steht hier der Stundensatz.',
    inactiveMember: '{name} (inaktiv)',

    errorWorker: 'Pflichtfeld.',
    errorHours: 'Muss grösser als 0 sein.',
    errorBooking: 'Bei Arbeitszeit Pflicht.',
    errorPaidBy: 'Pflichtfeld.',
    errorResponsible: 'Pflichtfeld.',
    noTeamTitle: 'Noch niemand im Team',
    noTeamBody:
      'Arbeitszeit braucht eine Person. Sobald eine Bewerbung angenommen ist, lässt sich hier buchen.',
    noJobTitle: 'Noch kein erledigter Einsatz',
    noJobBody:
      'Arbeitszeit hängt an einem Einsatz. Erst wenn einer gelaufen ist, gibt es etwas zu buchen.',

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

  /*
   * Screen 71e — die Personenseite der Ausgaben.
   *
   * Eigener Namespace statt Keys in `expenses`, weil es eine andere Frage ist:
   * die Ausgabenliste zeigt Belege, dieser Screen zeigt Menschen und Einsätze.
   * Dieselben Keys für beide hiesse, dass eine Spaltenüberschrift auf einem der
   * zwei Screens irgendwann falsch wird.
   */
  workforce: {
    title: 'Arbeitszeit',
    lead: 'Wer auf welchem Einsatz war, wie lange, was es gekostet hat — und wer es bezahlt.',
    back: 'Alle Ausgaben',

    rangeLabel: 'Zeitraum',
    range3: 'Letzte 3 Monate',
    range6: 'Letzte 6 Monate',
    range12: 'Letzte 12 Monate',

    statHours: 'Stunden',
    statHoursHint: '{n} Einträge auf {jobs} Einsätzen.',
    statHoursNone: 'Im Zeitraum nichts erfasst.',
    statCost: 'Lohnkosten',
    statCostHint: 'Zählt in der Auswertung unter «Arbeitszeit».',
    statRate: 'Ø Stundensatz',
    statRateHint: 'Betrag geteilt durch Stunden — kein hinterlegter Tarif.',
    statRateNone: 'Ohne Stunden kein Satz.',
    statOpen: 'Noch nicht ausbezahlt',
    statOpenHint: 'Erfasst und noch offen — im gewählten Zeitraum.',
    statOpenNone: 'Alles ausbezahlt.',
    statPeople: 'Personen',
    linkAnalytics: 'In der Auswertung',

    search: 'Person, Einsatz oder Nummer',
    searchPlaceholder: 'z. B. Marta',
    filterWorker: 'Person',
    filterStatus: 'Status',
    filterAll: 'Alle',
    filterOutstanding: 'Offen',
    filterReset: 'Filter zurücksetzen',

    tableTitle: 'Einsatz für Einsatz',
    tableLead: 'Eine Zeile pro erfasster Person auf einem Einsatz. Zwei Leute auf einem Auftrag sind zwei Zeilen.',
    colJob: 'Einsatz',
    colWhen: 'Datum',
    colWorker: 'Person',
    colHours: 'Stunden',
    colAmount: 'Betrag',
    colRate: 'Satz',
    colPaidBy: 'Bezahlt von',
    colResponsible: 'Verantwortlich',
    colStatus: 'Status',
    hours: '{hours} Std.',
    perHour: '{rate}/Std.',

    rowOpen: 'Beleg öffnen',
    rowJob: 'Einsatz öffnen',
    rowPerson: 'Person öffnen',
    rowMarkPaid: 'Als bezahlt erfassen',

    peopleTitle: 'Nach Person',
    peopleLead: 'Meiste Stunden zuerst. Wer im Zeitraum nichts gebucht hat, fehlt.',
    colPerson: 'Person',
    colJobs: 'Einsätze',
    colOutstanding: 'Offen',
    jobsCount: '{n} Einsätze',
    jobsCountOne: '1 Einsatz',

    jobsTitle: 'Nach Einsatz',
    jobsLead: 'Was ein Auftrag an Leuten gekostet hat. Neuester zuerst.',
    colCrew: 'Wer',
    crewMore: '+{n}',

    newAction: 'Arbeitszeit erfassen',
    downloadAction: 'Arbeitszeit herunterladen',
    downloadEmpty: 'Nichts zum Herunterladen — die Liste ist leer.',
    downloadDone: '{n} Einträge heruntergeladen.',

    emptyTitle: 'Noch keine Arbeitszeit erfasst',
    emptyBody:
      'Solange keine Stunden auf einem Einsatz stehen, sagt die Auswertung nur, was ein Auftrag eingebracht hat — nicht, was er an Leuten gekostet hat.',
    filterEmptyTitle: 'Kein Eintrag passt',
    filterEmptyBody: 'Suche und Filter schliessen alles aus. Zurücksetzen zeigt wieder alle.',
    windowEmptyTitle: 'Im Zeitraum nichts erfasst',
    windowEmptyBody: 'In diesen Monaten wurden keine Stunden gebucht. Ein längerer Zeitraum zeigt vielleicht mehr.',
  },
};
