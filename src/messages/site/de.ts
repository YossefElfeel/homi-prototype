/**
 * Marketing site copy.
 *
 * Real German, not placeholder — the brief forbids lorem ipsum, and the whole
 * point of the German-first build is that these are the strings the layout has
 * to survive. Every claim here is checkable: no superlatives, no discount
 * language, no urgency. This audience reads those as cheap.
 *
 * Long-form editorial content (service inclusion lists, FAQs) lives in
 * src/content/services.ts — message dictionaries hold interface strings only.
 */

import type { HeadlineLine } from '@/lib/display-headline';

export const siteDe = {
  home: {
    meta: {
      title: 'Reinigung & Möbelmontage am rechten Zürichseeufer',
      description:
        'Reinigung und Möbelmontage in Küsnacht, Meilen, Uetikon, Männedorf, Stäfa, Egg, Grüningen und Hombrechtikon. Fester Stundensatz, verbindliche Offerte innert 24 Stunden.',
    },
    hero: {
      eyebrow: 'Rechtes Zürichseeufer · Küsnacht bis Hombrechtikon',
      title: 'Reinigung und Möbelmontage, ohne Rückfragen.',
      lead: 'Fester Stundensatz von CHF 49. Verbindliche Offerte innert 24 Stunden. Dokumentierte Ein- und Austrittszeiten bei jedem Einsatz.',
      primary: 'Offerte anfordern',
      secondary: 'Preise ansehen',
      imageAlt: 'Helles Wohnzimmer mit Seeblick nach der Reinigung',
    },
    reassurance: {
      guaranteeTitle: 'Abnahmegarantie',
      guaranteeBody: 'Besteht die Wohnung die Abnahme nicht, kommen wir kostenlos zurück.',
      windowTitle: 'Festes Ankunftsfenster',
      windowBody: 'Sie erhalten eine Zeitspanne, kein «irgendwann am Vormittag».',
      teamTitle: 'Immer dieselben Hände',
      teamBody: 'Kein wechselndes Personal. Sie wissen, wer vor der Tür steht.',
    },
    services: {
      eyebrow: 'Leistungen',
      title: 'Was wir machen',
      lead: 'Sieben Leistungen, eine pro Anfrage. Brauchen Sie zwei, senden Sie zwei Anfragen — so bleibt jede Offerte sauber gerechnet.',
      cta: 'Alle Leistungen',
    },
    why: {
      eyebrow: 'Warum Homivaro',
      title: 'Woran Sie uns messen können',
      priceTitle: 'Der Preis steht vorher fest',
      priceBody:
        'Jede Position einzeln aufgeschlüsselt. Anfahrt und Zuschläge stehen als eigene Zeile in der Offerte, nie versteckt in einer Summe.',
      timeTitle: 'Zeiten werden protokolliert',
      timeBody:
        'Ankunft und Abfahrt werden erfasst. Sie sehen, wie lange wir da waren — auch wenn Sie nicht zuhause sind.',
      proofTitle: 'Fotos statt Behauptungen',
      proofBody:
        'Vorher und nachher, bei jedem Einsatz. Was Sie sehen wollen, geben wir frei.',
      accessTitle: 'Zutritt bleibt Ihre Entscheidung',
      accessBody:
        'Schlüssel, Schlüsselkasten oder Sie sind da. Zugangsdaten sind verschlüsselt und nur am Einsatztag sichtbar.',
    },
    steps: {
      eyebrow: 'Ablauf',
      title: 'In vier Schritten',
      s1Title: 'Anfrage senden',
      s1Body: 'Sie beschreiben das Objekt. Dauert etwa drei Minuten.',
      s2Title: 'Offerte erhalten',
      s2Body: 'Innert 24 Stunden, verbindlich, Position für Position.',
      s3Title: 'Termin wählen',
      s3Body: 'Sie wählen aus den freien Terminen. Erst dann ist gebucht.',
      s4Title: 'Wir kommen',
      s4Body: 'Mit Fotos vorher und nachher und protokollierten Zeiten.',
    },
    plans: {
      eyebrow: 'Abos',
      title: 'Regelmässig, ohne jedes Mal neu zu planen',
      lead: 'Drei Rhythmen, fester Rabatt, fester Termin, den Sie jederzeit verschieben können.',
      cta: 'Abos vergleichen',
    },
    coverage: {
      eyebrow: 'Einsatzgebiet',
      title: 'Acht Gemeinden am rechten Seeufer',
      lead: 'Wir arbeiten bewusst in einem engen Gebiet. Kurze Wege heissen pünktliche Termine — und keine Anfahrtspauschale.',
      outside: 'Ihre Gemeinde ist nicht dabei? Senden Sie die Anfrage trotzdem, wir prüfen sie.',
    },
    promise: {
      eyebrow: 'Unser Versprechen',
      title: 'Wir sind neu. Deshalb legen wir uns fest.',
      lead: 'Homivaro hat noch keine Bewertungen gesammelt. Statt Ihnen fremde Sterne zu zeigen, schreiben wir auf, worauf Sie uns behaften können.',
      p1Title: 'Abnahmegarantie schriftlich',
      p1Body:
        'Bei der Umzugsreinigung: Besteht die Wohnung die Abnahme nicht, reinigen wir kostenlos nach.',
      p2Title: 'Ein- und Austritt dokumentiert',
      p2Body: 'Jeder Einsatz wird mit Zeitstempel erfasst — auch in Ihrer Abwesenheit.',
      p3Title: 'Fotos vor und nach dem Einsatz',
      p3Body:
        'Standardmässig intern. Veröffentlicht wird nichts ohne Ihre schriftliche Zustimmung.',
      p4Title: 'Feste Ansprechperson',
      p4Body:
        'Sie sprechen mit der Person, die auch reinigt. Keine Vermittlung, keine Warteschleife.',
      p5Title: 'Haftpflichtversicherung',
      p5Body: 'Schäden an Ihrem Eigentum sind über unsere Betriebshaftpflicht gedeckt.',
    },
    reviews: {
      eyebrow: 'Bewertungen',
      title: 'Was Kundinnen und Kunden sagen',
    },
    finalCta: {
      title: 'Sagen Sie uns, was ansteht.',
      lead: 'Drei Minuten für die Anfrage, eine verbindliche Offerte innert 24 Stunden. Erst wenn der Preis und der Termin stimmen, ist etwas gebucht.',
      primary: 'Offerte anfordern',
      secondary: 'Oder rufen Sie an',
    },
  },

  services: {
    meta: { title: 'Leistungen' },
    listTitle: 'Alle Leistungen',
    listLead:
      'Eine Leistung pro Anfrage. So bleibt jede Offerte nachvollziehbar gerechnet.',
    includedTitle: 'Was enthalten ist',
    notIncludedTitle: 'Was nicht enthalten ist',
    notIncludedLead:
      'Damit es am Einsatztag keine Diskussion gibt — brauchen Sie etwas davon, sagen Sie es in der Anfrage und wir rechnen es ein.',
    addOnsTitle: 'Mögliche Zusatzleistungen',
    calcTitle: 'Wie wir rechnen',
    calcBody:
      'Abgerechnet wird nach Stunden zu CHF 49, Minimum zwei Stunden. Die Dauer schätzen wir aus Fläche, Zimmern und Bädern — den verbindlichen Wert erhalten Sie in der Offerte.',
    faqTitle: 'Häufige Fragen',
    relatedTitle: 'Weitere Leistungen',
    durationLabel: 'Typische Dauer',
    fromLabel: 'Ab',
    guaranteeBadge: 'Mit Abnahmegarantie',
    cta: 'Diese Leistung anfragen',
  },

  pricing: {
    meta: { title: 'Preise' },
    eyebrow: 'Preise',
    title: 'Ein Stundensatz. Keine Pauschalen, die niemand nachrechnen kann.',
    lead: 'Wir rechnen nach Zeit, weil das die einzige Grösse ist, die Sie überprüfen können. Fläche, Zimmer und Bäder bestimmen nur, wie viele Stunden wir ansetzen.',
    rateLabel: 'Stundensatz',
    minimumLabel: 'Mindestbezug',
    minimumValue: '2 Stunden pro Einsatz',
    tableTitle: 'Richtwerte pro Leistung',
    tableService: 'Leistung',
    tableMethod: 'Abrechnung',
    tableFrom: 'Ab',
    methodHourly: 'Nach Stunden',
    methodPerUnit: 'Nach Anzahl',
    durationTitle: 'Woraus wir die Dauer schätzen',
    durationLead:
      'Diese Tabelle nutzt das System, um die Stunden vorzuschlagen. Der Inhaber kann sie in jeder Offerte anpassen.',
    durationArea: 'Fläche',
    durationStandard: 'Unterhalt',
    durationDeep: 'Grundreinigung',
    durationMoveout: 'Umzug',
    durationOffice: 'Büro',
    durationExtras:
      'Dazu je eine halbe Stunde pro zusätzlichem Bad, eine halbe Stunde bei Haustieren und eine Stunde, wenn der Zustand deutlich mehr Aufwand erfordert.',
    extrasTitle: 'Was dazukommen kann',
    extraTravelTitle: 'Anfahrt',
    extraTravelBody:
      'Innerhalb des Einsatzgebiets kostenlos. Weiter entfernt prüfen wir die Anfrage von Hand und weisen die Anfahrt separat aus.',
    extraSaturdayTitle: 'Samstag',
    extraSaturdayBody: 'Zuschlag auf den Leistungsbetrag, als eigene Zeile in der Offerte.',
    extraEveningTitle: 'Später Nachmittag',
    extraEveningBody:
      'Für Einsätze, die nach dem eingestellten Zeitpunkt beginnen. Ebenfalls als eigene Zeile.',
    vatTitle: 'Mehrwertsteuer',
    vatBody:
      'Homivaro ist nicht mehrwertsteuerpflichtig. Der Betrag in der Offerte ist der Endbetrag.',
    noticeTitle: 'Der verbindliche Preis steht in der Offerte',
    noticeBody:
      'Die Zahlen hier sind Richtwerte. Nach Ihrer Anfrage prüfen wir das Objekt und senden innert 24 Stunden eine schriftliche Offerte mit allen Positionen.',
    faqTitle: 'Fragen zum Preis',
    q1: 'Warum sehe ich keinen Sofortpreis?',
    a1: 'Weil er falsch wäre. Zwei gleich grosse Wohnungen brauchen unterschiedlich lange. Wir schauen uns Ihre Angaben und Fotos an und nennen dann einen Preis, an den wir uns halten.',
    q2: 'Kann sich der Preis nachträglich ändern?',
    a2: 'Nur wenn sich der Auftrag ändert. Stellt sich vor Ort heraus, dass deutlich mehr Arbeit anfällt, fragen wir vorher um Freigabe — ohne Ihre Zustimmung wird nichts zusätzlich verrechnet.',
    q3: 'Was beeinflusst die Dauer?',
    a3: 'Fläche, Anzahl Bäder, Haustiere und der Zustand. Jeder dieser Punkte steht als eigene Zeile in der Offerte, damit Sie sehen, woher die Stunden kommen.',
    cta: 'Offerte anfordern',
  },

  plans: {
    meta: { title: 'Abos' },
    eyebrow: 'Abos',
    title: 'Regelmässig reinigen lassen, ohne jedes Mal neu zu planen',
    lead: 'Ein Paket Einsätze, einmal bezahlt, ein Jahr gültig. Den Termin schlagen wir vor, verschieben können Sie ihn jederzeit.',
    recommended: 'Für die meisten Haushalte',
    priceNote: '{visits} Einsätze · {months} Monate gültig · einmalig zahlbar',
    compareTitle: 'Im Vergleich',
    rowPrice: 'Preis',
    rowVisits: 'Enthaltene Einsätze',
    rowFrequency: 'Rhythmus',
    rowTerm: 'Gültigkeit',
    rowDiscount: 'Rabatt auf Zusatzleistungen',
    rowSkips: 'Einsätze aussetzen',
    rowCancellation: 'Widerruf',
    months: '{n} Monate',
    skips: '{n}× pro Monat kostenlos',
    cancellationDays: '{n} Tage',
    commitmentNoticeTitle: 'Was Sie kaufen',
    commitmentNoticeBody:
      'Ein Abo ist ein Paket Einsätze, das Sie beim Abschluss einmal bezahlen und ein Jahr lang abrufen. Wir sagen das hier, weil Sie es vor dem Abschluss wissen sollen und nicht im Kleingedruckten finden.',
    faqTitle: 'Fragen zum Abo',
    q1: 'Kann ich es rückgängig machen?',
    a1: 'Solange kein Einsatz stattgefunden hat und die Widerrufsfrist läuft, stornieren wir das Abo und erstatten den vollen Betrag. Danach steht es — die Einsätze bleiben Ihnen aber das ganze Jahr erhalten.',
    q2: 'Was, wenn ich in den Ferien bin?',
    a2: 'Sie setzen den Einsatz aus. Einmal im Monat ist das kostenlos, darüber hinaus wird er als erbracht gerechnet.',
    q3: 'Was passiert nach einem Jahr?',
    a3: 'Das Abo endet. Sie verlängern es in Ihrem Kundenbereich mit einem Klick — automatisch abgebucht wird nichts.',
    cta: 'Abo starten',
  },

  gallery: {
    meta: { title: 'Referenzen' },
    eyebrow: 'Referenzen',
    title: 'Vorher und nachher',
    lead: 'Alle Bilder sind mit ausdrücklicher schriftlicher Zustimmung der Kundschaft veröffentlicht.',
    before: 'Vorher',
    after: 'Nachher',
    emptyTitle: 'Noch keine freigegebenen Bilder',
    emptyBody:
      'Wir fotografieren jeden Einsatz vor und nach der Arbeit — veröffentlicht wird nur, was die Kundschaft ausdrücklich freigibt. Diese Galerie füllt sich, sobald die ersten Freigaben vorliegen.',
    emptyCta: 'Trotzdem Offerte anfordern',
  },

  about: {
    meta: { title: 'Über uns' },
    eyebrow: 'Über uns',
    title: 'Eine Person, ein Einsatzgebiet, klare Regeln.',
    storyTitle: 'Warum es Homivaro gibt',
    story1:
      'Homivaro ist am rechten Zürichseeufer entstanden, weil hier viele Haushalte dasselbe Problem hatten: Reinigung zu finden, die verlässlich kommt, den Preis vorher nennt und beim nächsten Mal dieselbe Person schickt.',
    story2:
      'Wir sind bewusst klein geblieben und arbeiten in acht Gemeinden. Kurze Wege bedeuten pünktliche Termine. Und ein überschaubarer Kundenkreis bedeutet, dass wir wissen, wo bei Ihnen der Schlüssel liegt und dass der Hund im Wohnzimmer Nala heisst.',
    valuesTitle: 'Wofür wir stehen',
    /* Describes the work, not the person — the photograph is of a finished
       job. Alt text that claimed a portrait would be the wrong caption. */
    imageAlt: 'Ein Wohnzimmer nach einem Einsatz von Homivaro',
    v1Title: 'Verbindlichkeit',
    v1Body: 'Ein genannter Preis und ein zugesagter Termin gelten.',
    v2Title: 'Diskretion',
    v2Body: 'Wir sind in Ihrem Zuhause zu Gast und verhalten uns so.',
    v3Title: 'Verantwortung',
    v3Body:
      'Umweltverträgliche Mittel, sparsam dosiert. Nachhaltigkeit heisst hier weniger Chemie, nicht mehr Marketing.',
    regionTitle: 'Wo wir arbeiten',
    regionBody:
      'Küsnacht, Meilen, Uetikon am See, Männedorf, Stäfa, Egg, Grüningen und Hombrechtikon. Anfragen von ausserhalb prüfen wir einzeln.',
    commitmentsTitle: 'Worauf Sie uns behaften können',
    c1: 'Schriftliche Abnahmegarantie bei der Umzugsreinigung',
    c2: 'Dokumentierte Ein- und Austrittszeiten bei jedem Einsatz',
    c3: 'Zugangsdaten verschlüsselt, nur am Einsatztag sichtbar',
    c4: 'Feste Ansprechperson statt wechselndem Personal',
    c5: 'Betriebshaftpflichtversicherung',
    c5None: 'Schäden werden fotografisch dokumentiert und schriftlich geregelt',
    careersTitle: 'Wir suchen Verstärkung',
    careersBody:
      'Wir stellen selbst ein und vermitteln nicht weiter. Wer bei uns arbeitet, wird von uns eingearbeitet und kommt wieder zur selben Kundschaft.',
    careersCta: 'Offene Stellen ansehen',
    cta: 'Offerte anfordern',
  },

  contact: {
    meta: { title: 'Kontakt' },
    eyebrow: 'Kontakt',
    title: 'Sprechen Sie mit uns',
    lead: 'Für Fragen zu einer laufenden Buchung oder wenn etwas nicht gepasst hat.',
    quoteHintTitle: 'Sie möchten einen Preis?',
    quoteHintBody:
      'Über das Anfrageformular geht es schneller — dort erfassen wir alles, was wir zum Rechnen brauchen.',
    quoteHintCta: 'Zum Anfrageformular',
    phoneLabel: 'Telefon',
    mobileLabel: 'Mobile & WhatsApp',
    emailLabel: 'E-Mail',
    hoursLabel: 'Erreichbarkeit',
    formTitle: 'Nachricht senden',
    fieldName: 'Name',
    fieldEmail: 'E-Mail',
    fieldPhone: 'Telefon',
    fieldSubject: 'Betreff',
    fieldMessage: 'Nachricht',
    consent: 'Ich bin einverstanden, dass meine Angaben zur Bearbeitung gespeichert werden.',
    consentLink: 'Datenschutzerklärung',
    submit: 'Nachricht senden',
    sending: 'Wird gesendet …',
    successTitle: 'Nachricht ist angekommen',
    successBody: 'Wir melden uns innert 24 Stunden — an Werktagen meist deutlich schneller.',
    successAgain: 'Weitere Nachricht senden',
    areasTitle: 'Einsatzgebiet',
  },

  regions: {
    metaTitle: 'Reinigung in {region}',
    metaDescription:
      'Reinigung und Möbelmontage in {region} ({postcode}). Fester Stundensatz von CHF 49, verbindliche Offerte innert 24 Stunden.',
    eyebrow: 'Einsatzgebiet',
    title: 'Reinigung in {region}',
    lead: '{region} gehört zu unserem Kerngebiet. Kurze Wege heissen: pünktliche Termine und keine Anfahrtspauschale.',
    postcodeLabel: 'Postleitzahl',
    travelLabel: 'Anfahrt',
    travelValue: 'Ohne Zuschlag',
    responseLabel: 'Antwortzeit',
    responseValue: 'Innert 24 Stunden',
    servicesTitle: 'Leistungen in {region}',
    otherTitle: 'Weitere Gemeinden',
    cta: 'Offerte für {region} anfordern',
  },

  legal: {
    updated: 'Zuletzt aktualisiert',
    tocTitle: 'Inhalt',
    contactTitle: 'Rechtliche Anfragen',
    contactBody: 'Fragen zu diesen Dokumenten richten Sie bitte an {email}.',
    placeholderNotice:
      'Platzhalter. Die verbindlichen Angaben (Sitz, UID, Rechtsform, Handelsregister) müssen vor einem echten Launch eingesetzt werden.',
  },

  thanks: {
    meta: { title: 'Danke' },
    title: 'Danke — das ist bei uns angekommen.',
    lead: 'Wir melden uns innert 24 Stunden.',
    nextTitle: 'Wie es weitergeht',
    n1: 'Wir schauen uns Ihre Angaben an.',
    n2: 'Sie erhalten eine verbindliche Offerte per E-Mail.',
    n3: 'Passt sie, wählen Sie einen freien Termin.',
    home: 'Zur Startseite',
  },

  /**
   * Display headlines for the interior pages, pre-broken and split by colour.
   *
   * Kept in one block rather than scattered through the namespaces above
   * because they are one decision made once — see lib/display-headline for why
   * the line break and the red half both belong to the writing rather than to
   * a component. The plain `title` strings above are untouched: a direction
   * may change how the site says something, never what it says.
   */
  display: {
    services: {
      lines: [{ lead: 'Sieben Leistungen,' }, { lead: 'eine', accent: 'pro Anfrage.' }] as HeadlineLine[],
      relatedLines: [{ lead: 'Weitere' }, { accent: 'Leistungen.' }] as HeadlineLine[],
      includedLines: [{ lead: 'Was drin ist —' }, { accent: 'und was nicht.' }] as HeadlineLine[],
      addOnsLines: [{ lead: 'Kann' }, { accent: 'dazukommen.' }] as HeadlineLine[],
      faqLines: [{ lead: 'Häufige' }, { accent: 'Fragen.' }] as HeadlineLine[],
      factServices: 'Leistungen, jede einzeln offeriert',
      factFrom: 'Günstigster Einstieg — zwei Stunden zum Stundensatz',
    },
    pricing: {
      lines: [{ lead: 'Ein Stundensatz.' }, { accent: 'Keine Pauschalen.' }] as HeadlineLine[],
      tableLines: [{ lead: 'Richtwerte' }, { accent: 'pro Leistung.' }] as HeadlineLine[],
      durationLines: [{ lead: 'Woraus wir die' }, { accent: 'Dauer schätzen.' }] as HeadlineLine[],
      extrasLines: [{ lead: 'Was' }, { accent: 'dazukommen kann.' }] as HeadlineLine[],
      faqLines: [{ lead: 'Fragen' }, { accent: 'zum Preis.' }] as HeadlineLine[],
    },
    plans: {
      lines: [{ lead: 'Regelmässig sauber,' }, { lead: 'ohne', accent: 'Planung.' }] as HeadlineLine[],
      compareLines: [{ lead: 'Im' }, { accent: 'Vergleich.' }] as HeadlineLine[],
      factCancel: 'Tage Widerrufsfrist, solange kein Einsatz stattgefunden hat',
      factSkip: 'Einsatz pro Monat kostenlos verschiebbar',
      faqLines: [{ lead: 'Fragen' }, { accent: 'zum Abo.' }] as HeadlineLine[],
    },
    gallery: {
      lines: [{ lead: 'Vorher' }, { accent: 'und nachher.' }] as HeadlineLine[],
    },
    about: {
      lines: [{ lead: 'Eine Person, ein Gebiet,' }, { accent: 'klare Regeln.' }] as HeadlineLine[],
      valuesLines: [{ lead: 'Wofür wir' }, { accent: 'stehen.' }] as HeadlineLine[],
      regionLines: [{ lead: 'Wo wir' }, { accent: 'arbeiten.' }] as HeadlineLine[],
      careersLines: [{ lead: 'Bei uns' }, { accent: 'arbeiten.' }] as HeadlineLine[],
    },
    contact: {
      lines: [{ lead: 'Sprechen Sie' }, { accent: 'mit uns.' }] as HeadlineLine[],
    },
    regions: {
      /* The town name is the red half, so the line is assembled in the page
         from this word plus the name — an ICU placeholder cannot live inside
         a raw array. */
      leadWord: 'Reinigung in',
      servicesLines: [{ lead: 'Leistungen' }, { accent: 'vor Ort.' }] as HeadlineLine[],
      otherLines: [{ lead: 'Weitere' }, { accent: 'Gemeinden.' }] as HeadlineLine[],
    },
    careers: {
      lines: [{ lead: 'Leute, denen man' }, { accent: 'den Schlüssel gibt.' }] as HeadlineLine[],
      howLines: [{ lead: 'So läuft die' }, { accent: 'Bewerbung.' }] as HeadlineLine[],
      openLines: [{ lead: 'Offene' }, { accent: 'Stellen.' }] as HeadlineLine[],
    },
    regionsIndex: {
      lines: [{ accent: 'Acht Gemeinden' }, { lead: 'am rechten Ufer.' }] as HeadlineLine[],
      metaTitle: 'Einsatzgebiet',
      metaDescription:
        'Reinigung und Möbelmontage in acht Gemeinden am rechten Zürichseeufer. Prüfen Sie Ihre Postleitzahl.',
      lead: 'Wir arbeiten bewusst in einem engen Gebiet. Kurze Wege heissen pünktliche Termine — und keine Anfahrtspauschale.',
      checkLabel: 'Postleitzahl prüfen',
      checkPlaceholder: '8700',
      checkAction: 'Prüfen',
      inside: 'Ja — {region} gehört zum Einsatzgebiet.',
      outside: 'Die {postcode} liegt ausserhalb. Senden Sie die Anfrage trotzdem, wir schauen sie an.',
      invalid: 'Eine Postleitzahl hat vier Ziffern.',
      gridTitle: 'Alle Gemeinden',
      gridLines: [{ lead: 'Alle' }, { accent: 'Gemeinden.' }] as HeadlineLine[],
      responseLabel: 'Antwort innert',
    },
  },

};
