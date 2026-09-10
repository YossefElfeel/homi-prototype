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
    countBlockedTitle: '«{name}» hat noch keine Frage',
    countBlockedBody:
      'Die Leistung wird nach Anzahl abgerechnet, aber es steht nirgends, wonach gezählt wird. Aufgeschaltet würde die Anfragestrecke ein Zahlenfeld ohne Beschriftung zeigen. Tragen Sie die Frage unter «Zähleinheiten» ein — danach lässt sie sich aufschalten.',
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

    /* Sagt «endgültig» wie jedes andere Löschen im Panel — dieselbe Handlung
       zweimal verschieden benannt liest sich wie zwei Handlungen. Und der Text
       nennt jetzt zuerst, was tatsächlich weggeht: «Das ist endgültig» nannte
       gar nichts. */
    deleteTitle: '«{name}» endgültig löschen?',
    deleteBody:
      'Die Leistung wird aus dem Katalog entfernt, samt Preis und Übersetzungen. Das lässt sich nicht rückgängig machen. Wenn Sie sie nur vorübergehend nicht anbieten wollen, deaktivieren Sie sie stattdessen — dann bleibt alles erhalten.',
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
    countTitle: 'Zähleinheiten',
    countCardHint:
      'Was die Anfragestrecke fragt, wenn diese Leistung nach Anzahl abgerechnet wird — eine Frage pro Sache, die gezählt wird. Ein Fensterputz zählt Flügel; eine Montage zählt Möbelstücke und Wandbefestigungen getrennt.',
    countEmpty:
      'Noch keine Einheit. Solange keine da ist, hat die Strecke nichts zu fragen und die Leistung bleibt ein Entwurf.',
    countUnitN: 'Einheit {n}',
    countAdd: 'Weitere Einheit',
    countRemove: 'Diese Einheit entfernen',
    countLabelField: 'Die Frage',
    countLabelHint: 'Zum Beispiel «Wie viele Fensterflügel?». Steht über dem Zahlenfeld.',
    countHintField: 'Der Hinweis darunter',
    countHintHint: 'Hier sagt man, was als eine Einheit zählt. Genau der Satz, der die Diskussion an der Tür verhindert.',
    countNounField: 'Die Einheit im Plural',
    countNounHint: 'Steht auf der Zusammenfassung, in der Anfrage und auf der Offerte. «18» allein beantwortet nichts.',
    countBlockOf: 'Je wie viele?',
    countBlockOfHint:
      'Bei Fenstern fünf: fünf Flügel sind eine halbe Stunde. Steht hier 1, wird jedes Stück einzeln gerechnet.',
    countMinutes: 'Minuten dafür',
    countMinutesHint:
      'Wie lange ein solcher Block dauert. Angefangene Blöcke zählen ganz — sechs Flügel kosten so viel wie zehn.',
    countRule: 'Je {units} Stück rechnet die Offerte {minutes} Minuten. Angefangene Blöcke zählen ganz.',
    countMissing:
      'Eine Einheit hat noch keine Frage: die Strecke zeigte sonst ein Zahlenfeld ohne Beschriftung. Solange sie fehlt, bleibt die Leistung ein Entwurf.',
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
    slugPreview: 'URL wird: /services/{slug}',
    saveDraft: 'Als Entwurf speichern',
    saveActive: 'Anlegen und aufschalten',
    createNote:
      'Ein Entwurf erscheint nirgends ausser hier. Aufschalten stellt die Leistung sofort in die Anfragestrecke.',
    countRequired:
      'Aufschalten geht erst, wenn jede Zähleinheit ihre Frage hat — sonst stünde in der Anfragestrecke ein Zahlenfeld ohne Beschriftung. Als Entwurf speichern geht jederzeit.',
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
    maxDiscountShort: 'max. {amount}',
    newAction: 'Gutschein anlegen',
    /* Hiess «Gutschein öffnen», solange die Zeile nur einen Pfeil hatte. Im
       Menü steht der Eintrag neben «Archivieren» — und dort ist entscheidend,
       dass Öffnen auch Ändern heisst. Dieselbe Zeile wie bei den
       Zusatzleistungen. */
    rowOpen: 'Öffnen und bearbeiten',
    rowArchive: 'Archivieren',
    rowRestore: 'Wiederherstellen',
    /* Nicht nur «Löschen»: dieser Eintrag steht ausschliesslich im Archiv, und
       dort ist er der einzige Schritt, der nicht mehr zurückgeht. Das Wort
       muss das sagen, bevor jemand darauf klickt. */
    rowDelete: 'Endgültig löschen',

    tabActive: 'Aktiv',
    tabArchived: 'Archiv',
    colArchivedAt: 'Archiviert',

    /* Das Ausschalten steht im Text, weil es die Hälfte der Handlung ist, die
       im Wort «archivieren» nicht drinsteckt. */
    archiveConfirmTitle: '{code} archivieren?',
    archiveConfirm:
      'Der Code verschwindet aus der Arbeitsliste und wird ausgeschaltet — einlösen lässt er sich danach nicht mehr. Der Datensatz bleibt mit allen Einlösungen im Archiv bestehen, und von dort holen Sie ihn jederzeit zurück.',
    archiveDone: '{code} liegt jetzt im Archiv und ist ausgeschaltet.',
    restoreDone: '{code} steht wieder in der Liste — ausgeschaltet, bis Sie ihn einschalten.',

    deleteConfirmTitle: '{code} endgültig löschen?',
    deleteConfirm:
      'Das geht nicht mehr zurück. Dieser Code wurde nie eingelöst, es hängt also keine Rechnung daran — im Archiv kostet er nichts, wenn Sie ihn lieber behalten.',
    /* Nennt die Zahl statt nur zu warnen: ein Code mit 31 Einlösungen ist ein
       anderer Fall als einer mit einer, und genau daran entscheidet der
       Inhaber, ob er ihn wirklich wegwirft. */
    deleteConfirmRedeemed:
      'Das geht nicht mehr zurück. Der Code wurde {n} Mal eingelöst. Eine Offerte merkt sich ihn als Text, nicht als Verweis — verschwindet der Datensatz, steht auf einer längst versendeten Rechnung ein Abzug, den niemand mehr erklären kann. Im Archiv liegen lassen kostet nichts.',
    deleteDone: '{code} wurde endgültig gelöscht.',
    deleteBlocked: 'Gelöscht wird nur aus dem Archiv.',

    archivedEmptyTitle: 'Das Archiv ist leer',
    archivedEmptyBody:
      'Hier landen Codes, die Sie aus der Arbeitsliste nehmen — abgelaufene Aktionen, die Sie nicht löschen wollen, weil die Einlösungen zu bereits versendeten Rechnungen gehören. Über das Menü einer Zeile archivieren Sie den ersten.',
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
    archivedTitle: 'Dieser Gutschein liegt im Archiv',
    archivedBody:
      'Archiviert am {date}. Er steht nicht in der Arbeitsliste und lässt sich nicht einlösen. Änderungen speichern Sie hier ganz normal; zurück in die Liste holen Sie ihn im Tab «{tab}».',
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
    sectionCodeTitle: 'Code und Rabatt',
    sectionDatesTitle: 'Daten und Grenzen',
    sectionStatusTitle: 'Status',
    codeLabel: 'Code',
    codeHint: 'Wird beim Eingeben nicht zwischen Gross- und Kleinschreibung unterschieden.',
    kindLabel: 'Art',
    kindPercent: 'Prozent',
    kindAmount: 'Fixbetrag',
    valueLabel: 'Wert',
    minOrderLabel: 'Mindestbestellwert',
    /* «Maximaler Rabatt», nicht «Obergrenze» — das Wort steht schon auf der
       Einlösungsgrenze darunter, und zwei Felder mit demselben Namen auf einem
       Bildschirm sind zwei Felder, die verwechselt werden. */
    maxDiscountLabel: 'Maximaler Rabatt CHF',
    maxDiscountHint: 'Leer lassen für unbegrenzt.',
    maxDiscountFrom: 'Greift ab einem Auftragswert von {amount}.',
    maxDiscountZero: 'Ein Maximum von 0 wäre ein Code, der nichts abzieht. Feld leeren für unbegrenzt.',
    servicesLabel: 'Gilt für',
    servicesAll: 'Alle Leistungen',
    validFrom: 'Erstellt am',
    validTo: 'Gültig bis',
    maxUsesLabel: 'Maximale Einlösungen',
    maxUsesHint: 'Leer lassen für unbegrenzt.',
    activeLabel: 'Aktiv',
    activeHint: 'Ausgeschaltet lässt sich der Code nicht einlösen. Der Schalter wirkt erst mit dem Speichern.',
    save: 'Speichern',
  },

  /* Bildschirm 85 — «Unsere Arbeiten», aus dem Büro. */
  gallery: {
    title: 'Referenzen',
    lead: 'Welche Vorher/Nachher-Paare auf /work erscheinen. Ein Paar ist ein Einsatz — freigegeben wird immer beides zusammen.',

    /* §20.6 ist der ganze Rahmen dieses Bildschirms, also steht er oben und
       nicht als Beipackzettel an einem Schalter. */
    consentTitle: 'Fotos sind intern, bis jemand zustimmt',
    consentBody:
      'Freigeben heisst hier: die schriftliche Einwilligung der Kundschaft liegt vor. Der Schalter hält das fest — er ersetzt sie nicht.',

    tabReleased: 'Auf der Website',
    tabWaiting: 'Ohne Freigabe',
    tabUnpairable: 'Kein Paar',

    before: 'Vorher',
    after: 'Nachher',
    unknownCustomer: 'Ohne Kundenzuordnung',
    unknownService: 'Ohne Leistung',

    addAction: 'Referenz hinzufügen',
    addTitle: 'Referenz hinzufügen',
    addBody:
      'Fotos kommen sonst vom Team über die Einsatz-Screens. Hier lässt sich eine Arbeit von Hand anlegen — für Bilder, die per Mail kamen oder auf einem Telefon liegen.',
    addBooking: 'Zu welchem Einsatz gehört das?',
    addBookingHint:
      'Nur abgeschlossene Einsätze ohne Referenz. Der Einsatz liefert Leistung und Datum — ohne ihn wäre es ein Stockfoto.',
    addBookingPlaceholder: 'Einsatz wählen',
    addNote: 'Notiz',
    addNoteHint: 'Optional. Steht unter dem Paar, nur intern.',
    addSameImage: 'Vorher und Nachher dürfen nicht dasselbe Bild sein.',
    addConsentNote:
      'Wird als Entwurf angelegt und erscheint nicht auf der Website. Das Freigeben ist ein eigener Schritt mit eigener Rückfrage.',
    addNoCandidates:
      'Jeder abgeschlossene Einsatz hat bereits eine Referenz. Neue Einsätze erscheinen hier, sobald sie fertig sind.',
    addDone: 'Referenz angelegt — noch nicht freigegeben.',

    remove: 'Entfernen',
    removeTitle: 'Referenz entfernen?',
    removeBody:
      'Beide Bilder werden gelöscht. Das gilt nur für Referenzen, die im Büro angelegt wurden — Fotos vom Team gehören zum Einsatzprotokoll und bleiben.',
    removeDone: 'Referenz entfernt.',

    release: 'Freigeben',
    withdraw: 'Zurückziehen',
    viewOnSite: 'Auf der Website ansehen',
    openBooking: 'Einsatz öffnen',
    openCustomer: 'Kundendatensatz öffnen',

    releaseTitle: 'Auf die Website stellen?',
    releaseBody:
      'Beide Bilder dieses Einsatzes erscheinen unter /referenzen. Voraussetzung ist die schriftliche Einwilligung von {name} — mit dem Freigeben bestätigen Sie, dass sie vorliegt.',
    withdrawTitle: 'Von der Website nehmen?',
    withdrawBody:
      'Das Paar verschwindet sofort aus den Referenzen. Die Bilder bleiben am Einsatz erhalten und lassen sich jederzeit wieder freigeben.',
    releaseDone: 'Der Einsatz steht in den Referenzen.',
    withdrawDone: 'Der Einsatz ist nicht mehr öffentlich.',

    reason: {
      context: 'Kontextaufnahme',
      noPartner: 'Gegenstück fehlt',
    },
    reasonBody: {
      context:
        'Vom Team aufgenommen, um etwas festzuhalten — eine verschlossene Tür, ein Schaden. War nie für die Website gedacht.',
      noPartner:
        'Es gibt nur eine Hälfte. Ein Referenzeintrag braucht ein Vorher und ein Nachher vom selben Einsatz.',
    },

    emptyTitle: 'Noch keine Fotos',
    emptyBody:
      'Sobald das Team bei einem Einsatz Vorher/Nachher-Bilder aufnimmt, stehen sie hier zur Freigabe bereit.',
    releasedEmptyTitle: 'Noch nichts freigegeben',
    releasedEmptyBody:
      'Unter /work steht derzeit nichts. Der Tab «Ohne Freigabe» zeigt, was bereitliegt.',
    waitingEmptyTitle: 'Nichts offen',
    waitingEmptyBody: 'Für jedes Paar ist entschieden. Neue Einsätze landen hier.',
    looseEmptyTitle: 'Alles paart sich',
    looseEmptyBody: 'Jedes Foto gehört zu einem Vorher/Nachher-Paar.',
  },
  /* Bildschirm 86 — die Bau-Referenzen, aus dem Büro. */
  /* Bildauswahl — dieselben zwei Hälften überall, wo ein Bild gewählt wird. */
  imagePicker: {
    fromDevice: 'Vom Computer wählen',
    fromDeviceHint:
      'Wird beim Hochladen auf 1600 px verkleinert und im Browser gespeichert — es gibt keinen Server, der sie sonst behalten könnte.',
    uploading: 'Wird verarbeitet …',
    uploadFailed: 'Das Bild konnte nicht gespeichert werden. Versuchen Sie ein anderes.',
    notAnImage: 'Das ist keine Bilddatei.',
    fromThisDevice: 'Von diesem Gerät hochgeladen',
    orChoose: 'Oder eines der {n} vorhandenen Bilder',
    fromUrl: 'Stattdessen eine Adresse aus dem Netz einfügen',
    urlLabel: 'Bildadresse',
    urlHint:
      'Vollständige Adresse, mit https. Bilder von aussen werden unverändert eingebunden — ohne die Grössenoptimierung, die Dateien im Projekt bekommen.',
  },
  construction: {
    title: 'Bau — Referenzen',
    lead: 'Welche Bilder auf /construction stehen, in welcher Gruppe und in welcher Reihenfolge. Anders als bei den Kundenreferenzen hängt hier keine Einwilligung dran: das sind unsere eigenen Aufnahmen unserer eigenen Arbeiten.',
    viewPage: 'Seite ansehen',

    sectionEdit: 'Abschnitt bearbeiten',
    sectionHeadings: 'Überschriften dieses Abschnitts',
    sectionHeadingsHint:
      'Die Reihenfolge der Pfeile rechts ist die Reihenfolge auf der Seite. Deutsch genügt — die anderen Sprachen fallen darauf zurück (§20.6).',
    sectionTitle: 'Überschrift',
    sectionTitleHint: 'Für die Richtungen, die einfarbig setzen.',
    /* Zwei Hälften, weil die grosse Überschrift zweifarbig ist — welche Wörter
       rot sind, ist eine Schreibentscheidung und keine Formatierung. */
    sectionLead: 'Grosse Überschrift — dunkel',
    sectionLeadHint: 'Der erste Teil, in Navy.',
    sectionAccent: 'Grosse Überschrift — rot',
    sectionAccentHint: 'Der zweite Teil. Leer lassen, wenn die Zeile einfarbig bleiben soll.',
    sectionBody: 'Text unter der Überschrift',
    sectionBodyHint: 'Ein Absatz. Steht zwischen Überschrift und Bildern.',
    sectionUp: 'Abschnitt nach vorne',
    sectionDown: 'Abschnitt nach hinten',

    sectionNew: 'Neuer Abschnitt',
    sectionNewTitle: 'Neuen Abschnitt anlegen',
    sectionNewBody:
      'Ein Abschnitt ist eine Überschrift mit Bildern darunter. Auf /construction erscheint er, sobald das erste Bild drin steht.',
    sectionNewHint: 'Auf Deutsch. Die grosse Überschrift und der Text kommen gleich danach.',
    sectionDuplicate: 'Ein Abschnitt mit diesem Titel gibt es schon — zwei gleich benannte Reiter kann niemand auseinanderhalten.',
    sectionAdd: 'Abschnitt anlegen',
    sectionAddDone: 'Abschnitt angelegt — Überschriften stehen offen.',

    sectionRemove: 'Abschnitt löschen',
    sectionBlocked:
      'Der Abschnitt hält noch {n} Bilder. Verschieben Sie sie zuerst in einen anderen Abschnitt — eine Überschrift zu löschen ist eine Beschriftungsfrage, die Arbeiten darunter zu löschen ist keine.',
    sectionRemoveDone: 'Abschnitt gelöscht.',

    hiddenCount: '{n} ausgeblendet',

    visible: 'Sichtbar',
    hidden: 'Ausgeblendet',
    moveUp: 'Nach vorne',
    moveDown: 'Nach hinten',
    edit: 'Bildtext',
    doneEditing: 'Fertig',
    groupField: 'Gruppe',
    /* Der Bildtext ist das, was eine Vorlesehilfe bekommt — fehlt er, hört
       jemand an dieser Stelle gar nichts. */
    uploadedHere: 'Von diesem Gerät hochgeladen',
    noAlt: 'Kein Bildtext',

    addAction: 'Bild hinzufügen',
    addTitle: 'Bild hinzufügen',
    addBody: 'Kommt in die Gruppe «{group}», ans Ende.',
    addFile: 'Datei',
    addFileHint: 'Vom eigenen Rechner, aus dem Projekt, oder eine Adresse aus dem Netz. Bereits vergebene Bilder stehen nicht zur Auswahl.',
    addFilePlaceholder: 'Datei wählen',
    addNoFiles: 'Alle vorhandenen Dateien sind bereits einer Gruppe zugeordnet.',
    addAlt: 'Bildtext',
    addAltHint: 'Was auf dem Bild zu sehen ist. Deutsch genügt — die anderen Sprachen fallen darauf zurück (§20.6).',
    addDone: 'Bild hinzugefügt.',

    remove: 'Entfernen',
    removeTitle: 'Bild entfernen?',
    removeBody:
      'Das Bild verschwindet aus der Gruppe. Die Datei bleibt im Projekt und lässt sich jederzeit wieder hinzufügen — soll es nur vorübergehend weg, ist «Ausblenden» der kürzere Weg.',
    removeDone: 'Bild entfernt.',

    emptyTitle: 'Keine Bilder in dieser Gruppe',
    emptyBody:
      'Auf /construction erscheint diese Gruppe erst, wenn ein Bild darin steht — eine Überschrift ohne Bilder darunter liest sich wie ein Ladefehler.',
  },
  reviews: {
    title: 'Bewertungen',
    lead: 'Jede Bewertung wird von Ihnen freigegeben, bevor sie auf der Website erscheint.',
    /* Die vier Überschriften sind weg — der Status steht jetzt auf der Karte,
       weil eine gefilterte Liste keine Gruppen mehr hat, über die er passen
       würde. */
    search: 'Suchen',
    searchPlaceholder: 'Text, Antwort oder Name',
    filterEmptyTitle: 'Keine Bewertung passt dazu',
    filterEmptyBody:
      'Mit dieser Suche und diesem Status bleibt nichts übrig. Die Bewertungen sind da — nur nicht diese.',
    filterReset: 'Filter zurücksetzen',
    starsLabel: '{n} von 5 Sternen',
    publish: 'Veröffentlichen',
    republish: 'Wieder veröffentlichen',
    reject: 'Nicht veröffentlichen',
    negativeTitle: 'Kritische Bewertung',
    negativeBody:
      'Diese Bewertung wird nicht automatisch veröffentlicht. Rufen Sie zuerst an — eine beantwortete kritische Bewertung schadet weniger als eine gelöschte, und das Gespräch findet nicht mehr hier statt.',
    emptyTitle: 'Noch keine Bewertungen',
    emptyBody:
      'Nach abgeschlossener Zahlung wird die Kundschaft um eine Bewertung gebeten. Bis dahin zeigt die Website das Versprechen statt Sterne.',
    /* Abgelehnte Bewertungen waren eine Sackgasse — ein Fehlklick war
       endgültig. Und ohne Einwilligung darf gar nicht veröffentlicht werden. */
    restore: 'Zurück zur Prüfung',
    restored: 'Bewertung wartet wieder auf Freigabe.',
    /* Hiess «Zurückziehen» und schickte die Bewertung zurück in die
       Warteschlange — also unter eine Überschrift, die sagt, dass sie noch
       niemand gelesen hat. Sie war gelesen, freigegeben und beantwortet. */
    hide: 'Ausblenden',
    hiddenDone: 'Bewertung ist nicht mehr auf der Website.',
    published: 'Bewertung veröffentlicht.',
    rejected: 'Bewertung nicht veröffentlicht.',
    tabDeleted: 'Gelöscht',

    delete: 'Löschen',
    deleteConfirmTitle: 'Bewertung löschen?',
    /* Nennt beim Namen, was verschwindet. Es sind die Worte einer anderen
       Person — die Rückfrage darf nicht klingen, als ginge es um eine Zeile
       in einer Tabelle. */
    deleteConfirmBody:
      'Die Bewertung von {name} ({stars} Sterne) verschwindet sofort von der Website und wandert in den Tab «Gelöscht». Von dort lässt sie sich zurückholen.',
    deleteInstead:
      'Soll sie nur vorübergehend weg, tut «Ausblenden» dasselbe, ohne sie aus der Arbeitsliste zu nehmen.',
    deleteDone: 'Bewertung von {name} gelöscht.',

    restoreFromBin: 'Zurückholen',
    /* Kommt als «Ausgeblendet» zurück, nicht als «Wartet auf Freigabe»: eine
       Bewertung, welche die Geschäftsleitung schon gelesen hat, darf nicht
       wieder unter der Überschrift für ungelesene landen. */
    restoreDone: 'Bewertung von {name} ist zurück.',

    erase: 'Endgültig löschen',
    eraseConfirmTitle: 'Endgültig löschen — ohne Weg zurück?',
    eraseConfirmBody:
      'Das ist der Fall, für den §20.6 diesen Knopf verlangt: Die Person, die das geschrieben hat, hat ihre Einwilligung zurückgezogen. Text und Antwort werden gelöscht und lassen sich nicht wiederherstellen. Im Protokoll bleibt vermerkt, dass gelöscht wurde, nicht was drinstand.',
    eraseDone: 'Bewertung endgültig gelöscht.',
    deletedNote: 'Gelöscht am {date}',
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
    usageNote: 'Wo dieser Text tatsächlich rausgeht.',
    usageChannels: 'Versand über',
    usageNoChannels:
      'Kein Kanal ausgewählt — so kann diese Vorlage nirgends versendet werden.',
    usageScreens: 'Auswahllisten',
    usageNoScreens:
      'Keine Auswahlliste bietet diesen Bereich an — diese Vorlage geht nur automatisch raus.',
    usageUnused:
      'Nichts versendet diese Vorlage: kein automatischer Anlass, und keine Auswahlliste bietet diesen Bereich an.',
    usage: {
      quote: 'Offerten',
      invoice: 'Rechnungen',
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
    sectionSetupTitle: 'Einordnung',
    sectionSetupHint:
      'Entscheidet, wo die Vorlage auftaucht und worüber sie rausgeht.',
    sectionTextTitle: 'Texte',
    sectionTextHint:
      'Alle vier Sprachen auf einer Seite. Fehlt eine, wird der deutsche Text versendet (§20.6).',
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
      'Die Stadt Zürich gehört bewusst nicht dazu. Die Gebietsseiten und die Suchmaschinenoptimierung zielen auf diese Gemeinden.',

    /* Die Liste war acht Zeilen lang und konnte nur acht Zeilen lang sein.
       «Wir reinigen jetzt auch in Zollikon» war bis zu dieser Welle eine
       Codeänderung — der Bildschirm, der aussah, als verwalte er das
       Einsatzgebiet, konnte Teile davon nur abschalten. */
    regionsAdd: 'Gemeinde aufnehmen',
    regionsAddTitle: 'Neue Gemeinde',
    regionsAddLead:
      'Sie gilt sofort: die Anfragestrecke nimmt Adressen mit dieser PLZ ab dem Speichern an. Die Gebietsseite dazu entsteht beim nächsten Aufschalten der Website.',
    regionsEditTitle: '«{name}» bearbeiten',
    regionsFieldPostcode: 'Postleitzahl',
    regionsFieldPostcodeHint: 'Vier Ziffern. Entscheidet, welche Adressen als «im Gebiet» gelten.',
    regionsFieldName: 'Gemeinde',
    regionsFieldNameHint: 'Steht auf der Gebietsseite und in der Adressprüfung.',
    regionsFieldSlug: 'Adresse der Seite',
    regionsFieldSlugHint: 'Ergibt /areas/{slug}. Wird aus dem Namen gebildet.',
    regionsFieldLat: 'Breitengrad',
    regionsFieldLng: 'Längengrad',
    /* Der einzige Hinweis auf diesem Bildschirm zu einer Zahl, die niemand
       sieht. Ohne Koordinaten liegt die Gemeinde bei (0, 0) — 5000 km vor der
       Küste Westafrikas — und der Terminplaner rechnet jeden Einsatz dort aus
       der kostenlosen Anfahrt heraus. Das sieht hier nach nichts aus und auf
       dem Kalender nach einem Fehler. */
    regionsCoordsHint:
      'Ungefährer Mittelpunkt der Gemeinde. Daraus rechnet die Planung die Fahrzeit zwischen zwei Einsätzen — ohne stimmige Koordinaten fällt jeder Auftrag hier aus der kostenlosen Anfahrt.',
    regionsSave: 'Aufnehmen',
    regionsSaveEdit: 'Änderungen übernehmen',
    regionsCancel: 'Abbrechen',
    regionsEdit: 'Bearbeiten',
    regionsRemove: 'Entfernen',
    regionsRemoveTitle: '«{name}» aus dem Einsatzgebiet nehmen?',
    regionsRemoveBody:
      'Die Gemeinde verschwindet aus der Liste und aus der Adressprüfung. Bereits erfasste Objekte und Aufträge bleiben — sie liegen dann in einem Ort, den die Firma nicht mehr als Einsatzgebiet führt.',
    regionsRemoveSeeded:
      'Diese Gemeinde hat eine eigene Seite unter /areas/{slug}. Die bleibt bis zum nächsten Aufschalten online und wirbt weiter für einen Ort, den die Anfragestrecke ab sofort ablehnt.',
    regionsRemoveConfirm: 'Entfernen',
    regionsRemoveBlockedTitle: '«{name}» wird noch verwendet',
    regionsRemoveBlockedBody:
      '{n} Einträge liegen in dieser Gemeinde: {breakdown}. Solange das so ist, lässt sich die PLZ nicht löschen — jede dieser Adressen würde ab dann als «ausserhalb des Einsatzgebiets» gelesen, ohne dass irgendwo ein Fehler erschiene. Schalten Sie die Gemeinde stattdessen ab: das stoppt neue Anfragen und lässt die Vergangenheit stehen.',
    regionsUsageProperties: '{n} Objekte',
    regionsUsageCustomers: '{n} Kundenadressen',
    regionsUsageApplications: '{n} Bewerbungen',
    regionsRemoveBlockedClose: 'Verstanden',
    regionsErrorPostcodeFormat: 'Eine Postleitzahl hat vier Ziffern.',
    regionsErrorPostcodeTaken: 'Diese PLZ steht schon in der Liste.',
    regionsErrorNameRequired: 'Ohne Namen bleibt die Kachel auf der Gebietsseite leer.',
    regionsErrorSlugTaken:
      'Diese Adresse ist vergeben. Zwei Gemeinden auf einer URL heisst: eine davon ist nicht erreichbar.',
    regionsErrorCoordinates:
      'Die Koordinaten liegen ausserhalb der Schweiz. Prüfen Sie Breiten- und Längengrad — die Planung rechnet damit.',
    regionsAdded: '«{name}» ist im Einsatzgebiet.',
    regionsRemoved: '«{name}» wurde entfernt.',
    regionsCount: '{n} Gemeinden, {on} davon aktiv',
    regionsBuildNote:
      'Neue Gemeinden gelten sofort für Anfragen, Offerten und Planung. Ihre eigene Seite unter /areas bekommen sie beim nächsten Aufschalten der Website.',

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


  /* Bildschirme R3 und R4 — der Blog, aus dem Büro. */
  blog: {
    title: 'Blog',
    lead: 'Beiträge schreiben, übersetzen und aufschalten. Der Blog ist die einzige Seite der Website, auf der etwas steht, das kein Preis ist.',
    back: 'Zurück zu den Website-Texten',
    backToList: 'Zurück zum Blog',
    createAction: 'Beitrag anlegen',
    untitled: 'Ohne Titel',

    search: 'Beitrag suchen',
    searchPlaceholder: 'Titel, Einleitung oder Adresse',
    filterStatus: 'Status',
    filterAll: 'alle',
    status: {
      draft: 'Entwurf',
      published: 'Aufgeschaltet',
    },

    colTitle: 'Beitrag',
    colAuthor: 'Von',
    colReading: 'Lesezeit',
    colLanguages: 'Sprachen',
    colDate: 'Datum',
    colStatus: 'Status',
    translationGap: '{n} Sprachen fehlen',

    rowEdit: 'Bearbeiten',
    rowView: 'Auf der Website ansehen',
    rowPublish: 'Aufschalten',
    rowWithdraw: 'Zurückziehen',
    rowDelete: 'Löschen',

    /* Der Titel nennt den Beitrag, nicht die Handlung — die steht schon auf
       dem Knopf. Wer die Rückfrage liest, muss vor allem wissen, welcher der
       Beiträge gemeint ist. */
    publishTitle: '«{name}» aufschalten?',
    publishBody:
      'Der Beitrag erscheint im Blog und in der Sitemap. Beides passiert beim nächsten Aufschalten der Website — nicht sofort.',
    publishConfirm: 'Aufschalten',
    publishDone: '«{name}» ist aufgeschaltet.',
    withdrawTitle: '«{name}» zurückziehen?',
    withdrawBody:
      'Der Beitrag wird wieder zum Entwurf. Das Veröffentlichungsdatum bleibt stehen — wer ihn später wieder aufschaltet, bekommt keinen neuen Beitrag, sondern denselben.',
    withdrawConfirm: 'Zurückziehen',
    withdrawDone: '«{name}» ist wieder ein Entwurf.',
    deleteTitle: '«{name}» löschen?',
    deleteBody:
      'Der Beitrag wird endgültig entfernt. Anders als bei einem Kunden gibt es hier kein Archiv: an einem Text hängt keine Rechnung, also gibt es nichts, was ihn überleben müsste.',
    deleteConfirm: 'Löschen',
    deleteDone: '«{name}» wurde gelöscht.',

    emptyTitle: 'Noch keine Beiträge',
    emptyBody:
      'Der Blog ist das günstigste Marketing, das eine Reinigungsfirma hat: die Fragen beantworten, die ohnehin zwanzigmal die Woche am Telefon gestellt werden.',
    searchEmptyTitle: 'Kein Beitrag gefunden',
    searchEmptyBody: 'Für «{query}» gibt es keinen Beitrag.',

    /* ---- R4 ---- */
    editorLead: 'Alles speichert beim Tippen. Aufgeschaltet wird in der Liste — das ist die eine Entscheidung, die kein Tastendruck treffen soll.',
    localeTab: 'Sprache',
    gapShort: 'fehlt',
    basicsTitle: 'Der Beitrag',
    fieldTitle: 'Titel',
    fieldExcerpt: 'Einleitung',
    fieldExcerptHint:
      'Steht auf der Übersicht unter dem Titel und ist die Beschreibung für Suchmaschinen.',
    fieldSlug: 'Adresse der Seite',
    fieldSlugHint: 'Ergibt /blog/{slug}. Gilt für alle Sprachen — vier URLs für einen Text teilen den Suchwert durch vier.',
    fieldAuthor: 'Verfasst von',
    fieldAuthorHint: 'Der Name steht unter dem Titel. Ein Beitrag ohne Namen liest sich wie Füllmaterial.',
    fieldService: 'Passende Leistung',
    fieldServiceHint: 'Setzt den Kasten am Ende des Beitrags, der zur Anfrage führt. Ohne Auswahl gibt es keinen.',
    serviceNone: 'Keine',
    coverTitle: 'Bild',
    fieldCover: 'Titelbild',
    fieldCoverHint: 'Vom eigenen Rechner oder aus den vorhandenen Bildern. Steht auf der Übersicht und über dem Beitrag.',
    fieldCoverAlt: 'Bildbeschreibung',
    fieldAltHint: 'Was auf dem Bild zu sehen ist — für alle, die es nicht sehen.',
    imageNone: 'Kein Bild',
    fieldImage: 'Bild im Abschnitt',
    fieldImageAlt: 'Bildbeschreibung',
    moveUp: 'Nach oben',
    moveDown: 'Nach unten',
    fieldHeading: 'Überschrift',

    /* Der Weg vom Textbrett hierher. */
    /* ---- der Block-Editor ---- */
    blocksTitle: 'Der Beitrag',
    blocksLead:
      'Ein Beitrag besteht aus Blöcken. Jeder trägt seinen eigenen Text pro Sprache — so können Deutsch und Englisch unterschiedlich lang sein und trotzdem derselbe Artikel bleiben.',
    blocksEmpty:
      'Noch kein Block. Fangen Sie mit einer Überschrift an, dann einem Absatz — die Reihenfolge lässt sich jederzeit ändern.',
    addBlock: 'Block hinzufügen:',
    removeBlock: 'Block entfernen',
    kind: {
      paragraph: 'Absatz',
      heading: 'Überschrift',
      list: 'Liste',
      numbered: 'Nummeriert',
      quote: 'Zitat',
      image: 'Bild',
      cta: 'Aufruf',
    },
    /* «fett» und «kursiv» stehen auf den Knöpfen; die Zeichen tippt niemand
       selbst. Der Hinweis nennt sie trotzdem, weil sie im Feld sichtbar sind
       und sonst wie ein Fehler aussehen. */
    marksHint:
      'Markieren und formatieren: fett, kursiv, Link. Die Sternchen im Text sind die Formatierung — sie erscheinen nicht auf der Website.',
    markBold: 'Fett',
    markItalic: 'Kursiv',
    markLink: 'Link einfügen',
    fieldText: 'Text',
    fieldLevel: 'Ebene',
    levelSection: 'Abschnitt',
    levelSub: 'Unterpunkt',
    fieldItems: 'Punkte',
    fieldItemsHint: 'Ein Punkt pro Zeile.',
    fieldAttribution: 'Wer sagt das?',
    fieldAttributionHint: 'Optional. Ein Zitat ohne Namen ist völlig normal.',
    fieldImageHint: 'Vom eigenen Rechner oder aus den vorhandenen Bildern.',
    fieldCtaText: 'Der Satz davor',
    fieldCtaTextHint: 'Optional. Ein Satz, der erklärt, wohin der Knopf führt.',
    fieldCtaLabel: 'Knopfbeschriftung',
    fieldCtaHref: 'Ziel',
    fieldCtaHrefHint: 'Ein Pfad auf dieser Website, z. B. /request oder /abos.',
    boardTitle: 'Blog',
    boardBody: '{n} Beiträge, davon {drafts} im Entwurf.',
    boardAction: 'Beiträge verwalten',
  },
  changelog: {
    title: 'Änderungsprotokoll',
    lead: 'Wer was wann geändert hat.',
    colWhen: 'Wann',
    colActor: 'Wer',
    colEntity: 'Was',
    colSummary: 'Änderung',
    search: 'Wer, was oder welche Änderung',
    searchEmptyTitle: 'Keine Einträge gefunden',
    searchEmptyBody: 'Für «{query}» steht nichts im Protokoll.',
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
