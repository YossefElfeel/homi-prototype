/** Admin — content, marketing and settings (screens 73–84). */
export const adminContentDe = {
  services: {
    title: 'Leistungen & Preise',
    lead: 'Aktive Leistungen stehen sofort in der Anfragestrecke zur Auswahl. Entwürfe bleiben intern, bis Sie sie aufschalten.',
    search: 'Leistung suchen',
    searchPlaceholder: 'Name, Slug oder Kurzbeschreibung',
    colName: 'Leistung',
    colType: 'Art',
    colCalc: 'Abrechnung',
    colBase: 'Ansatz',
    colMin: 'Minimum',
    colStatus: 'Status',
    colActivate: 'Aufschalten',
    /* Nicht «i18n». Die Spalte hiess so, weil sie jemand benannt hat, der den
       Code schreibt — für alle anderen ist es kein Wort. Sie war die einzige
       Spaltenüberschrift des Bildschirms, die gar nicht erst übersetzt war. */
    colLanguages: 'Sprachen',
    filterStatus: 'Status',
    filterType: 'Art',
    filterAll: 'alle',
    calcHourly: 'Nach Stunden',
    calcPerUnit: 'Nach Anzahl',
    calcFlat: 'Pauschal',
    guarantee: 'Mit Abnahmegarantie',
    translationGap: '{n} Übersetzungen fehlen',

    createAction: 'Leistung anlegen',

    rowOpen: 'Details ansehen',
    rowEdit: 'Bearbeiten',
    rowCustomerView: 'Auf der Website ansehen',
    rowActivate: 'Aufschalten',
    rowDeactivate: 'Deaktivieren',
    rowDelete: 'Löschen',

    /* Der Titel nennt die Leistung, nicht die Handlung — die steht schon auf
       dem Knopf. Wer die Rückfrage liest, muss vor allem wissen, welche der
       acht Zeilen gemeint ist. */
    activateTitle: '«{name}» aufschalten?',
    activateBody:
      'Die Leistung steht danach in der Anfragestrecke zur Auswahl, mit dem hinterlegten Ansatz — der ist damit gegenüber Kunden verbindlich. Die Marketing-Seiten werden beim Build aus dem Katalog erzeugt und ziehen erst beim nächsten Deploy nach.',
    activateConfirm: 'Aufschalten',
    activateDone: '«{name}» ist aufgeschaltet.',

    deactivateTitle: '«{name}» deaktivieren?',
    deactivateBody:
      'Die Leistung verschwindet aus der Anfragestrecke, niemand kann sie mehr anfragen. Laufende Aufträge und Rechnungen bleiben unberührt — sie sind bereits erteilt.',
    deactivateConfirm: 'Deaktivieren',
    deactivateDone: '«{name}» ist deaktiviert.',

    deleteTitle: '«{name}» löschen?',
    deleteBody:
      'Das ist endgültig. Wenn Sie die Leistung nur vorübergehend nicht anbieten wollen, deaktivieren Sie sie stattdessen — dann bleibt sie samt Preis erhalten.',
    deleteConfirm: 'Endgültig löschen',
    deleteDone: '«{name}» wurde gelöscht.',
    /* Sagt die Zahl, nicht nur «geht nicht»: eine Leistung mit 14 Aufträgen
       daran ist ein anderer Fall als eine mit einem, und der Inhaber
       entscheidet danach, ob er deaktiviert oder die Aufträge zuerst abschliesst. */
    deleteBlockedTitle: '«{name}» kann nicht gelöscht werden',
    deleteBlockedBody:
      '{n} Anfragen, Aufträge oder Abos verweisen darauf. Würde die Leistung verschwinden, stünde in jedem davon ein Name, den nichts mehr auflösen kann. Deaktivieren nimmt sie ebenso vom Markt und lässt die Historie lesbar.',
    deleteBlocked: 'Diese Leistung ist noch in Verwendung.',

    detailsTitle: 'Leistung im Überblick',
    detailsBack: 'Alle Leistungen',
    detailsLocaleHint:
      'Deutsch und Englisch sind gepflegt. Französisch und Italienisch sind angelegt, aber nicht übersetzt — dort zeigt die Website den deutschen Text (§20.6).',
    detailsFallback: 'nicht übersetzt — zeigt Deutsch',
    detailsUsageHint: 'Was auf diese Leistung zeigt und deshalb ihrem Löschen im Weg steht.',
    detailsUsageRequests: 'Anfragen',
    detailsUsageBookings: 'Aufträge',
    detailsUsagePlans: 'Abos',
    detailsDangerTitle: 'Leistung löschen',
    detailsSlug: 'Slug (URL)',
    detailsNames: 'Bezeichnung',
    detailsShort: 'Kurzbeschreibung',
    detailsPricing: 'Abrechnung',
    detailsProfile: 'Dauer-Schätzung',
    detailsGuarantee: 'Abnahmegarantie',
    detailsGuaranteeYes: 'Ja — kostenlose Nachreinigung bei nicht bestandener Abnahme',
    detailsGuaranteeNo: 'Nein',
    detailsMissing: 'fehlt — Website zeigt Deutsch',
    detailsUsage: 'Verwendung',
    detailsUsageBody: '{n} Anfragen, Aufträge und Abos verweisen darauf.',
    detailsUsageNone: 'Noch nirgends verwendet.',
    close: 'Schliessen',

    filterEmptyTitle: 'Keine Leistung passt',
    filterEmptyBody:
      'Suchbegriff und Filter zusammen ergeben keine Zeile. Der Katalog selbst ist nicht leer.',
    filterReset: 'Filter zurücksetzen',
    emptyTitle: 'Keine Leistungen',
    emptyBody: 'Ohne Leistung kann niemand eine Anfrage senden. Legen Sie mindestens eine an.',
  },

  service: {
    back: 'Alle Leistungen',
    nameTitle: 'Bezeichnung',
    nameHint: 'Erscheint auf der Website und in der Offerte, in der Sprache des Kunden.',
    shortTitle: 'Kurzbeschreibung',
    shortHint:
      'Der Satz unter dem Namen auf der Leistungsseite und in der Kachel auf der Startseite.',
    pricingTitle: 'Preis',
    pricingHint:
      'Wonach abgerechnet wird, bestimmt, was der Ansatz bedeutet — pro Stunde, pro Stück oder pauschal für den ganzen Auftrag.',
    calcLabel: 'Abrechnungsart',
    calcHourly: 'Nach Stunden — Ansatz × geschätzte Dauer',
    calcPerUnit: 'Nach Anzahl — gezählte Stück werden in Stunden umgerechnet',
    calcFlat: 'Pauschal — ein Festpreis für den ganzen Auftrag',
    basePrice: 'Ansatz',
    basePriceHourly: 'Franken pro Stunde.',
    basePricePerUnit: 'Franken pro Stunde; die gezählten Stück ergeben die Stunden (§5.1).',
    basePriceFlat: 'Franken für den ganzen Auftrag, unabhängig von der Dauer.',
    minDuration: 'Mindestdauer in Stunden',
    minDurationHint: 'Der Boden liegt bei 2 Stunden; hier lässt sich nur nach oben abweichen.',
    slugLabel: 'Slug (URL)',
    slugHint: 'Aus dem deutschen Namen abgeleitet und danach fest — Links darauf sollen halten.',
    profileTitle: 'Dauer-Schätzung',
    profileHint:
      'Bestimmt, aus welcher Spalte der Dauertabelle das System die Stunden vorschlägt.',
    profileStandard: 'Unterhalt',
    profileDeep: 'Grundreinigung',
    profileMoveout: 'Umzug',
    profileOffice: 'Büro',
    profileNone: 'Keine — nach Anzahl',
    guaranteeLabel: 'Abnahmegarantie anbieten',
    guaranteeHint:
      'Verpflichtet zur kostenlosen Nachreinigung, wenn die Abnahme nicht besteht.',
    statusTitle: 'Sichtbarkeit',
    statusHint:
      'Nur «Aktiv» steht Kunden in der Anfragestrecke zur Auswahl und geht beim nächsten Build auf die Marketing-Seiten. Entwurf und Deaktiviert sind beide unsichtbar — der Unterschied ist, ob die Leistung noch nie draussen war oder zurückgezogen wurde.',
    statusPending: 'Ausstehende Änderung: {from} → {to}',
    statusApply: 'Änderung übernehmen',
    statusDiscard: 'Verwerfen',
    missingTitle: 'Fehlende Übersetzungen',
    missingBody:
      'Fehlt eine Sprache, zeigt die Website den deutschen Text. Das ist die vorgesehene Rückfallebene, aber es fällt auf.',
    save: 'Speichern',
    saved: 'Gespeichert',
  },

  serviceNew: {
    title: 'Neue Leistung',
    lead: 'Nichts wird geschrieben, bis Sie unten speichern. Als Entwurf gespeichert bleibt die Leistung intern, bis Preis und Texte stehen.',
    back: 'Alle Leistungen',
    nameRequired: 'Ohne deutsche Bezeichnung gibt es keinen Namen und keinen Slug.',
    slugPreview: 'URL wird: /leistungen/{slug}',
    saveDraft: 'Als Entwurf speichern',
    saveActive: 'Anlegen und aufschalten',
    createNote:
      'Ein Entwurf erscheint nirgends ausser hier. Aufschalten stellt die Leistung sofort in die Anfragestrecke.',
    createdDraft: '«{name}» als Entwurf angelegt.',
    createdActive: '«{name}» angelegt und aufgeschaltet.',
    activateTitle: '«{name}» direkt aufschalten?',
    activateBody:
      'Die Leistung steht sofort in der Anfragestrecke zur Auswahl — mit dem Ansatz, der oben steht. Als Entwurf speichern geht auch, und aufschalten können Sie danach jederzeit.',
    activateConfirm: 'Anlegen und aufschalten',
    dismiss: 'Zurück',
  },

  addons: {
    title: 'Zusatzleistungen',
    /* Sagte «Preis und Zeitbedarf» und setzte damit voraus, dass der Leser
       bereits weiss, was eine Zusatzleistung ist. Der erste Satz muss das Ding
       benennen, nicht seine zwei Felder aufzählen. */
    lead: 'Eine Zusatzleistung ist eine Position, die auf eine Leistung aufgesetzt wird — ein Festpreis für den Auftrag plus die Zeit, die sie den Einsatz länger macht. Verrechnet wird der Preis; die Zeit wird nur eingeplant.',


    search: 'Zusatzleistung suchen',
    searchPlaceholder: 'Bezeichnung, Slug oder Kurzbeschreibung',
    colName: 'Zusatzleistung',
    colPrice: 'Preis',
    colDuration: 'Zeitbedarf',
    colServices: 'Gilt für',
    colStatus: 'Status',
    colAvailable: 'Verfügbar',
    filterStatus: 'Status',
    filterService: 'Leistung',
    filterAll: 'alle',

    createAction: 'Zusatzleistung anlegen',

    rowOpen: 'Öffnen und bearbeiten',
    rowDelete: 'Löschen',

    /* Ein Schalter kann «an» zeigen und die Zusatzleistung trotzdem nirgends
       erscheinen lassen — nämlich dann, wenn keine der angehängten Leistungen
       aufgeschaltet ist. Ohne diesen Hinweis ist das ein grünes Abzeichen über
       einer Zeile, die kein Kunde je zu sehen bekommt. */
    unreachable: 'erreicht niemanden',
    unreachableNone: 'An keine Leistung gehängt — sie erscheint in keiner Anfrage.',
    unreachableInactive:
      'Alle angehängten Leistungen sind Entwurf oder deaktiviert — sie erscheint in keiner Anfrage.',

    switchOn: '«{name}» verfügbar machen',
    switchOff: '«{name}» ausblenden',
    switchHint:
      'Wirkt sofort. Verfügbar heisst: steht im Schritt «Extras» zur Auswahl. Ausgeblendet verschwindet sie aus neuen Anfragen — bereits erteilte Aufträge und versendete Offerten bleiben unberührt.',
    switchedOn: '«{name}» steht jetzt in der Anfragestrecke zur Auswahl.',
    switchedOff: '«{name}» ist ausgeblendet. Laufende Aufträge bleiben unberührt.',

    deleteTitle: '«{name}» löschen?',
    deleteBody:
      'Das ist endgültig. Wenn Sie sie nur vorübergehend nicht anbieten wollen, blenden Sie sie mit dem Schalter aus — dann bleiben Preis, Text und Zuordnung erhalten.',
    deleteConfirm: 'Endgültig löschen',
    deleteDone: '«{name}» wurde gelöscht.',
    /* Nennt die Zahl statt nur «geht nicht»: eine Zusatzleistung auf zwölf
       Offerten ist ein anderer Fall als eine auf einer, und der Inhaber
       entscheidet danach, ob er ausblendet oder wartet. */
    deleteBlockedTitle: '«{name}» kann nicht gelöscht werden',
    deleteBlockedBody:
      '{n} Anfragen und Offerten verweisen darauf. Eine Offertenzeile merkt sich den Slug, nicht die Bezeichnung — verschwindet der Datensatz, liest eine bereits versendete Rechnung «{slug}» statt «{name}». Ausblenden nimmt sie ebenso aus dem Angebot und lässt die Dokumente lesbar.',
    deleteBlocked: 'Diese Zusatzleistung ist noch in Verwendung.',

    filterEmptyTitle: 'Keine Zusatzleistung passt',
    filterEmptyBody:
      'Suchbegriff und Filter zusammen ergeben keine Zeile. Die Liste selbst ist nicht leer.',
    filterReset: 'Filter zurücksetzen',
    emptyTitle: 'Keine Zusatzleistungen',
    emptyBody:
      'Ohne Zusatzleistung überspringt der Kunde den Schritt «Extras» — die Anfrage funktioniert, aber es gibt nichts dazuzukaufen. Legen Sie die erste an.',
  },

  addon: {
    back: 'Alle Zusatzleistungen',
    nameTitle: 'Bezeichnung',
    nameHint: 'Die Zeile, die der Kunde im Schritt «Extras» anklickt, in seiner Sprache.',
    shortTitle: 'Kurzbeschreibung',
    shortHint:
      'Der Satz darunter. Er beantwortet «was genau bekomme ich dafür» — «Bis zu fünf Fenster inklusive Rahmen», nicht «Fensterreinigung».',
    pricingTitle: 'Preis und Zeitbedarf',
    pricingHint:
      'Die beiden Zahlen bedeuten Verschiedenes: der Preis wird einmal pro Auftrag verrechnet, der Zeitbedarf verlängert nur den Termin.',
    priceLabel: 'Preis',
    priceHint:
      'Franken, einmal pro Auftrag — unabhängig von Fläche, Dauer und Stundenansatz der Leistung.',
    durationLabel: 'Zeitbedarf in Stunden',
    durationHint:
      'Wie viel länger der Einsatz dauert. Geht in die Planung, nicht in die Rechnung — der Preis oben deckt diese Zeit bereits ab. 0 für etwas, das keine zusätzliche Zeit kostet.',
    servicesTitle: 'Gilt für',
    servicesHint:
      'Unter welchen Leistungen sie im Schritt «Extras» auftaucht. Ohne mindestens eine erscheint sie nirgends.',
    servicesRequired: 'Ohne eine Leistung kann diese Zusatzleistung niemand auswählen.',
    servicesInactive: 'nicht aufgeschaltet',
    availabilityTitle: 'Verfügbarkeit',
    availabilityLabel: 'In der Anfragestrecke zur Auswahl stellen',
    availabilityHint:
      'Wirkt sofort und ist mit demselben Schalter zurückgenommen. Ausgeblendet verschwindet sie aus neuen Anfragen; laufende Aufträge und versendete Offerten bleiben, wie sie sind.',
    slugLabel: 'Slug',
    slugHint:
      'Aus der deutschen Bezeichnung abgeleitet und danach fest. Offertenzeilen merken sich diesen Slug — änderte er sich, verlöre jede bereits erstellte Zeile ihren Namen.',
    usageTitle: 'Verwendung',
    usageHint: 'Was darauf zeigt und deshalb dem Löschen im Weg steht.',
    usageRequests: 'Anfragen',
    usageOffers: 'Offerten und Rechnungen',
    usageBody: '{n} Anfragen und Offerten verweisen darauf.',
    usageNone: 'Noch nirgends verwendet.',
    localeHint:
      'Deutsch ist Pflicht. Fehlt eine andere Sprache, zeigt die Anfragestrecke den deutschen Text (§20.6) — vorgesehen, aber es fällt auf.',
    dangerTitle: 'Zusatzleistung löschen',
    save: 'Änderungen speichern',
    saved: '«{name}» gespeichert.',
    unsaved: 'Ungespeicherte Änderungen. Der Schalter oben wirkt sofort, die Felder hier erst beim Speichern.',
    discard: 'Verwerfen',
    notFound: 'Diese Zusatzleistung gibt es nicht mehr.',
  },

  addonNew: {
    title: 'Neue Zusatzleistung',
    lead: 'Etwas, das ein Kunde zu einer Leistung dazukaufen kann. Nichts wird geschrieben, bis Sie unten speichern.',
    back: 'Alle Zusatzleistungen',
    nameRequired: 'Ohne deutsche Bezeichnung gibt es keinen Namen und keinen Slug.',
    slugPreview: 'Slug wird: {slug}',
    saveHidden: 'Speichern, noch nicht anbieten',
    saveActive: 'Anlegen und anbieten',
    createNote:
      'Ausgeblendet erscheint sie nur hier im Panel. Anbieten stellt sie sofort in den Schritt «Extras» der laufenden Anfragestrecke.',
    createdHidden: '«{name}» angelegt, noch nicht sichtbar.',
    createdActive: '«{name}» angelegt und in der Anfragestrecke sichtbar.',
    activateTitle: '«{name}» direkt anbieten?',
    activateBody:
      'Sie steht danach sofort im Schritt «Extras» — mit dem Preis, der oben steht, und der Kunde kann sie in derselben Minute mitbestellen. Ausgeblendet speichern geht auch; anbieten können Sie danach jederzeit mit einem Klick.',
    activateConfirm: 'Anlegen und anbieten',
    dismiss: 'Zurück',
  },

  coupons: {
    title: 'Gutscheine',
    lead: 'Rabattcodes, wie lange sie laufen und wie oft sie schon eingelöst wurden.',
    colCode: 'Code',
    colValue: 'Rabatt',
    colValidity: 'Gültig',
    colUsage: 'Eingelöst',
    colStatus: 'Status',
    colServices: 'Gilt für',
    colActive: 'Eingeschaltet',
    servicesAll: 'Alle Leistungen',
    newAction: 'Gutschein anlegen',
    rowOpen: 'Gutschein öffnen',
    search: 'Gutscheine durchsuchen',
    searchPlaceholder: 'Code oder Leistung',
    filterState: 'Zustand',
    filterAll: 'alle',
    filterEmptyTitle: 'Kein Gutschein passt',
    filterEmptyBody:
      'Zur Suche und zum gewählten Zustand gibt es hier nichts. Abgelaufene Codes bleiben in der Liste stehen — setzen Sie den Filter zurück, bevor Sie einen neuen anlegen.',
    filterReset: 'Filter zurücksetzen',
    switchHint: 'Schaltet den Code sofort ein oder aus.',
    switchOn: '{code} einschalten',
    switchOff: '{code} ausschalten',
    switchedOn: '{code} ist eingeschaltet.',
    switchedOff: '{code} ist ausgeschaltet. Er lässt sich jetzt nicht mehr einlösen.',
    stackingNote:
      'Ein Gutschein und ein Abo-Rabatt werden nie addiert — es gilt der höhere.',
    emptyTitle: 'Keine Gutscheine',
    emptyBody:
      'Es hat noch niemand einen angelegt. Das darf ruhig eine Weile so bleiben: In diesem Markt wirkt Rabattwerbung eher billig als attraktiv — ein Code wirkt am besten für eine einzelne Aktion statt dauerhaft.',
  },

  coupon: {
    back: 'Alle Gutscheine',
    newTitle: 'Neuer Gutschein',
    newLead: 'Gespeichert wird erst mit dem Klick auf «Speichern».',
    notFoundTitle: 'Diesen Gutschein gibt es nicht mehr',
    notFoundBody:
      'Er wurde gelöscht, oder der Link stammt aus älteren Demodaten. In der Liste stehen alle Gutscheine, die es jetzt gibt.',
    codeTaken: 'Diesen Code verwendet bereits ein anderer Gutschein.',
    datesBackwards: 'Das Enddatum liegt vor dem Startdatum.',
    maxUsesRemaining: 'Noch {n} Einlösungen bis zur aktuellen Obergrenze.',
    usageCapped: '{used} von {max} Einlösungen verbraucht.',
    usageUncapped: '{used} Mal eingelöst. Keine Obergrenze.',
    unsaved: 'Diese Änderungen sind noch nicht gespeichert.',
    discard: 'Änderungen verwerfen',
    cancel: 'Abbrechen',
    created: 'Gutschein {code} angelegt.',
    saved: 'Gutschein {code} gespeichert.',
    codeLabel: 'Code',
    codeHint: 'Wird beim Eingeben nicht zwischen Gross- und Kleinschreibung unterschieden.',
    kindLabel: 'Art',
    kindPercent: 'Prozent',
    kindAmount: 'Betrag',
    valueLabel: 'Wert',
    minOrderLabel: 'Mindestbestellwert',
    servicesLabel: 'Gilt für',
    servicesAll: 'Alle Leistungen',
    validFrom: 'Gültig ab',
    validTo: 'Gültig bis',
    maxUsesLabel: 'Maximale Einlösungen',
    maxUsesHint: 'Leer lassen für unbegrenzt.',
    activeLabel: 'Aktiv',
    save: 'Speichern',
  },

  reviews: {
    title: 'Bewertungen',
    lead: 'Jede Bewertung wird von Ihnen freigegeben, bevor sie auf der Website erscheint.',
    pendingTitle: 'Wartet auf Freigabe',
    publishedTitle: 'Veröffentlicht',
    rejectedTitle: 'Nicht veröffentlicht',
    starsLabel: '{n} von 5 Sternen',
    publish: 'Veröffentlichen',
    reject: 'Nicht veröffentlichen',
    replyLabel: 'Ihre Antwort',
    replyHint: 'Erscheint unter der Bewertung.',
    negativeTitle: 'Kritische Bewertung',
    negativeBody:
      'Diese Bewertung wird nicht automatisch veröffentlicht. Antworten Sie zuerst — eine beantwortete kritische Bewertung schadet weniger als eine gelöschte.',
    emptyTitle: 'Noch keine Bewertungen',
    emptyBody:
      'Nach abgeschlossener Zahlung wird die Kundschaft um eine Bewertung gebeten. Bis dahin zeigt die Website das Versprechen statt Sterne.',
    /* Abgelehnte Bewertungen waren eine Sackgasse — ein Fehlklick war
       endgültig. Und ohne Einwilligung darf gar nicht veröffentlicht werden. */
    restore: 'Zurück zur Prüfung',
    restored: 'Bewertung wartet wieder auf Freigabe.',
    unpublish: 'Zurückziehen',
    unpublished: 'Bewertung ist nicht mehr öffentlich.',
    editReply: 'Antwort bearbeiten',
    published: 'Bewertung veröffentlicht.',
    rejected: 'Bewertung nicht veröffentlicht.',
    replySaved: 'Antwort gespeichert.',
    noConsentTitle: 'Keine Einwilligung',
    noConsentBody:
      'Diese Kundin oder dieser Kunde hat der Veröffentlichung nicht zugestimmt. Die Bewertung bleibt intern — das ist keine Ermessensfrage (§20.6).',
    emptyAction: 'Zu den Einsätzen',
  },

  templates: {
    title: 'Textvorlagen',
    lead: 'Jeder Text, den wir versenden — automatisch oder von Hand ausgewählt.',
    searchLabel: 'Suchen',
    searchPlaceholder: 'Betreff, Text oder Schlagwort',
    filterFlow: 'Bereich',
    filterTag: 'Schlagwort',
    filterAll: 'Alle',
    newAction: 'Neue Vorlage',
    colSubject: 'Betreff',
    colFlow: 'Bereich',
    colChannels: 'Kanäle',
    colLanguages: 'Sprachen',
    complete: 'Vollständig',
    missing: '{n} fehlen',
    editAction: 'Bearbeiten',
    deleteAction: 'Löschen',
    untitled: 'Ohne Betreff',
    automatic: 'Automatisch',
    automaticOn: 'Automatisch bei: {event}',
    manual: 'Nur manuell',
    standard: 'Standard',
    makeStandard: 'Als Standard setzen',
    standardDone: 'Diese Vorlage geht ab jetzt automatisch raus.',
    count: '{n} von {total} Vorlagen',
    fallbackNote: 'Fehlt eine Sprache, wird der deutsche Text versendet.',
    channelEmail: 'E-Mail',
    channelSms: 'SMS',
    smsWarning: 'Über {limit} Zeichen — wird als zwei SMS verrechnet.',
    placeholderNote: 'Platzhalter in geschweiften Klammern werden beim Versand ersetzt.',
    emptyForLocale: 'Kein Text — es wird die deutsche Fassung versendet.',
    emptyTitle: 'Keine Vorlage gefunden',
    emptyBody:
      'Die Suche oder die Filter schliessen alle Vorlagen aus. Filter zurücksetzen oder eine neue Vorlage anlegen.',
    emptyAction: 'Filter zurücksetzen',

    deleteTitle: 'Vorlage löschen?',
    deleteBody: 'Der Text ist danach weg. Das lässt sich nicht rückgängig machen.',
    deleteConfirm: 'Endgültig löschen',
    deleteCancel: 'Behalten',
    /* The two cases where deleting touches an automatic send. Both name the
       consequence before it happens — that is the whole point of the step. */
    deleteReplaceTitle: 'Standardvorlage löschen?',
    deleteReplaceBody:
      'Diese Vorlage geht bei "{event}" automatisch raus. Wählen Sie, welche Vorlage die Aufgabe übernimmt.',
    deleteReplaceLabel: 'Übernimmt ab jetzt',
    deleteLastTitle: 'Letzte Vorlage für "{event}" löschen?',
    deleteLastBody:
      'Für diesen Anlass bleibt keine Vorlage übrig. Damit "{event}" weiterhin versendet, stellen wir den Originaltext wieder her — Ihre Änderungen daran gehen verloren.',
    deleteLastConfirm: 'Löschen und Originaltext wiederherstellen',
    deleteDone: 'Vorlage gelöscht.',
    restoreDone: 'Vorlage gelöscht — Originaltext wiederhergestellt.',

    usageTitle: 'Wird verwendet in',
    usageNote:
      'Diese Vorlage steht in den Auswahllisten der folgenden Bereiche zur Verfügung.',
    usage: {
      messages: 'Nachrichten',
      quote: 'Offerten',
      invoice: 'Rechnungen',
      booking: 'Einsätze',
      review: 'Bewertungen',
      request: 'Anfragen',
    },

    flows: {
      requests: 'Anfragen',
      quotes: 'Offerten',
      bookings: 'Einsätze',
      invoices: 'Rechnungen',
      reviews: 'Bewertungen',
      general: 'Allgemein',
    },

    events: {
      'request-received': 'Anfrage eingegangen',
      'offer-sent': 'Offerte versendet',
      'offer-reminder': 'Offerte läuft ab',
      'booking-confirmed': 'Termin bestätigt',
      'appointment-reminder': 'Erinnerung 24 Stunden vorher',
      'on-the-way': 'Auf dem Weg',
      'job-done': 'Auftrag abgeschlossen',
      'invoice-sent': 'Rechnung versendet',
      'payment-reminder': 'Zahlungserinnerung',
      cancellation: 'Stornierung',
      'review-request': 'Bewertung anfragen',
    },
  },

  template: {
    back: 'Zurück zu den Vorlagen',
    newTitle: 'Neue Vorlage',
    saveAction: 'Speichern',
    savedDone: 'Vorlage gespeichert.',
    createdDone: 'Vorlage angelegt.',

    flowLabel: 'Bereich',
    flowHint:
      'Bestimmt, in welchen Auswahllisten die Vorlage auftaucht — nicht nur, wie sie sortiert wird.',
    eventLabel: 'Automatischer Anlass',
    eventNone: 'Keiner — nur manuell auswählbar',
    eventHint:
      'Mit einem Anlass kann diese Vorlage automatisch versendet werden. Ohne Anlass steht sie nur in den Auswahllisten.',
    channelsLabel: 'Kanäle',
    tagsLabel: 'Schlagwörter',
    tagsHint: 'Mit Komma trennen. Sie erscheinen als Filter in der Übersicht.',
    subjectLabel: 'Betreff',
    bodyLabel: 'Text',
    subjectMissing: 'Ohne Betreff hat die Vorlage in der Auswahlliste keinen Namen.',

    placeholderTitle: 'Platzhalter',
    placeholderNote:
      'Beim Versand durch die echten Werte ersetzt. Was wir nicht kennen, bleibt in Klammern stehen und blockiert den Direktversand.',
    placeholderInsert: 'Einfügen',

    requiredTitle: 'Deutscher Text fehlt',
    requiredBody:
      'Deutsch ist die Rückfallsprache (§20.6). Ohne deutschen Text hat diese Vorlage in drei von vier Sprachen nichts zu senden.',
  },

  templatePicker: {
    label: 'Vorlage',
    placeholder: 'Vorlage wählen …',
    empty: 'Für diesen Bereich ist keine Vorlage angelegt.',
    manage: 'Vorlagen verwalten',
    previewTitle: 'Vorschau',
    subjectLabel: 'Betreff',
    sendDirect: 'Direkt senden',
    editFirst: 'Vor dem Senden bearbeiten',
    insertDone: 'Vorlage eingesetzt — Text vor dem Senden prüfen.',
    sentDone: 'Nachricht versendet.',
    overwriteTitle: 'Begonnenen Text ersetzen?',
    overwrite: 'Was Sie bereits geschrieben haben, wird durch die Vorlage überschrieben.',
    overwriteAction: 'Ersetzen',
    /* The gate that lets "send directly" exist at all. */
    unresolvedTitle: 'Direktversand nicht möglich',
    unresolvedBody:
      'Für {fields} kennen wir hier keinen Wert. Der Platzhalter würde so beim Kunden ankommen — bitte vor dem Senden ausfüllen.',
    resolvedNote: 'Alle Platzhalter sind gefüllt.',
  },


  settings: {
    title: 'Einstellungen',
    lead: 'Preise, Zeiten, Gebiete und Regeln. Änderungen greifen sofort — es gibt keinen Speichern-Knopf.',
    tabRegions: 'Gebiete',
    tabHours: 'Zeiten',
    tabFees: 'Gebühren & Regeln',
    tabContract: 'Vertrag',
    contractTitle: 'Unterschrift auf der Offerte',
    contractLead:
      'Jede Offerte geht unterschrieben raus — Ihre Unterschrift wird beim Versand gesetzt, der Kunde unterschreibt beim Annehmen. Hier steht, was dabei auf das Dokument kommt.',
    signatureName: 'Name unter der Unterschrift',
    signatureRole: 'Funktion',
    signatureRoleHint: 'Steht neben dem Namen auf dem Vertrag.',
    signatureCurrent: 'Aktuelle Unterschrift',
    signatureRedraw: 'Neu unterschreiben',
    signatureLabel: 'Hier unterschreiben',
    signatureHint: 'Mit der Maus oder dem Finger.',
    signatureClearLabel: 'Nochmals',
    signatureSave: 'Unterschrift übernehmen',
    signatureCancel: 'Abbrechen',
    signatureNote:
      'Gilt für Offerten, die ab jetzt versendet werden. Bereits unterschriebene Verträge behalten die Unterschrift, mit der sie geschlossen wurden.',

    regionsTitle: 'Einsatzgebiet',
    regionsLead:
      'Postleitzahlen, die als «im Gebiet» gelten. Anfragen von ausserhalb werden nicht blockiert — sie kommen markiert herein.',
    regionsColPostcode: 'PLZ',
    regionsColName: 'Gemeinde',
    regionsColStatus: 'Status',
    regionsIncluded: 'Im Gebiet',
    regionsExcluded: 'Ausserhalb',
    regionsZurichNote:
      'Die Stadt Zürich gehört bewusst nicht dazu. Die Gebietsseiten und die Suchmaschinenoptimierung zielen auf diese acht Gemeinden.',

    hoursTitle: 'Arbeitszeiten',
    hoursDays: 'Arbeitstage',
    hoursFrom: 'Von',
    hoursTo: 'Bis',
    hoursCapacity: 'Einsätze pro Tag',
    hoursCapacityHint:
      'Die härteste Grenze im ganzen System. Der Terminkalender bietet nie mehr an.',
    hoursLead: 'Mindestvorlauf in Stunden',
    hoursLeadHint: 'Keine Buchung am selben Tag.',
    closuresTitle: 'Schliesszeiten',
    closuresLead:
      'Ferien und Feiertage. Abo-Einsätze in diesen Zeiträumen werden automatisch verschoben, und die Kundschaft wird informiert.',
    closuresFrom: 'Von',
    closuresTo: 'Bis',
    closuresReason: 'Grund',
    closuresYearly: 'Jährlich',
    closuresAdd: 'Schliesszeit hinzufügen',
    closuresRemove: 'Entfernen',
    closuresEmpty: 'Keine Schliesszeiten erfasst.',

    feesTitle: 'Zuschläge',
    feeSaturday: 'Samstagszuschlag',
    feeEvening: 'Zuschlag später Nachmittag',
    feeEveningFrom: 'Gilt ab',
    feeEveningNote:
      'Die Dokumente definieren «Abend» nicht — der Arbeitstag endet um 18:00. Dieser Wert ist die getroffene Annahme.',
    feeTravel: 'Kostenlose Anfahrt bis',
    rulesTitle: 'Stornierung',
    ruleFreeUntil: 'Kostenlos bis',
    ruleLate: 'Danach verrechnet',
    ruleNoAccess: 'Kein Zutritt',
    subscriptionTitle: 'Abo',
    ruleCancellation: 'Widerrufsfrist',
    ruleCancellationHint:
      'So lange nach dem Kauf darf ein Abo storniert und erstattet werden — solange kein Einsatz stattgefunden hat.',
    days: 'Tage',
    subscriptionMoved:
      'Laufzeit und Rabatt stehen jetzt beim einzelnen Abo, nicht mehr hier: zwei Abos dürfen sich in beidem unterscheiden. Was hier steht, gilt für alle.',
    ruleSkips: 'Freie Aussetzer pro Monat',
    insuranceTitle: 'Betriebshaftpflicht',
    insuranceLabel: 'Gültige Betriebshaftpflicht vorhanden',
    insuranceHint:
      'Schaltet die dauerhafte Schlüsselaufbewahrung frei und erlaubt der Website, die Versicherung zu nennen.',
    months: 'Monate',
    hours: 'Stunden',
    save: 'Speichern',
    saved: 'Gespeichert',
  },

  changelog: {
    title: 'Änderungsprotokoll',
    lead: 'Wer was wann geändert hat.',
    colWhen: 'Wann',
    colActor: 'Wer',
    colEntity: 'Was',
    colSummary: 'Änderung',
    emptyTitle: 'Noch keine Einträge',
    emptyBody: 'Jede Änderung an Preisen, Einstellungen und Aufträgen wird hier erfasst.',
  },

  search: {
    title: 'Suche',
    placeholder: 'Kunde, Referenz, Adresse oder Rechnungsnummer',
    lead: 'Eine Suche über Kunden, Anfragen, Offerten, Rechnungen und Objekte.',
    groupCustomers: 'Kunden',
    groupRequests: 'Anfragen',
    groupOffers: 'Offerten',
    groupInvoices: 'Rechnungen',
    groupProperties: 'Objekte',
    resultCount: '{n} Treffer',
    idleTitle: 'Wonach suchen Sie?',
    idleBody: 'Ein Name, eine Referenz, eine Strasse oder eine Rechnungsnummer genügt.',
    emptyTitle: 'Keine Treffer',
    emptyBody: 'Für «{query}» wurde nichts gefunden.',
  },
};
