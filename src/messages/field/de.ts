/** Field interface — mobile only (screens 85–88). */
export const fieldDe = {
  shell: {
    title: 'Einsätze',
    gateTitle: 'Nur für Mitarbeitende',
    gateBody:
      'Diese Ansicht ist für die ausführende Person. Wechseln Sie unten rechts die Rolle auf «Mitarbeitende:r».',
    gateCurrent: 'Aktuelle Rolle: {role}',
    /* Der zweite Grund, warum diese Ansicht zu ist — und der wichtigere: das
       Konto wurde abgeschaltet. Ohne eigenen Text stünde hier «wechseln Sie
       die Rolle», was für jemanden, der gar nicht mehr hinein soll, wie ein
       Bedienfehler aussieht. */
    gateDeactivatedTitle: 'Dieses Konto ist deaktiviert',
    gateDeactivatedBody:
      'Ihre Einsätze sind nicht mehr abrufbar. Die erfassten Einsätze bleiben erhalten — bitte wenden Sie sich an die Geschäftsleitung.',
    gateHome: 'Zur Startseite',
    jobsLink: 'Zu den Einsätzen',
    exit: 'Homivaro-Website öffnen',
    desktopNote:
      'Diese Ansicht ist für das Mobiltelefon gebaut. Am Bildschirm sehen Sie sie in Handybreite.',
  },

  today: {
    title: 'Heute',
    date: '{date}',
    jobsCount: '{n, plural, one {# Einsatz} other {# Einsätze}}',
    arrival: 'Ankunft {from}–{to}',
    travel: '{minutes} Min. Fahrt',
    open: 'Öffnen',
    doneToday: 'Erledigt',
    tomorrowTitle: 'Morgen',
    emptyTitle: 'Heute nichts eingeteilt',
    emptyBody:
      'Sobald Ihnen ein Einsatz zugewiesen wird, erscheint er hier — mit Adresse und Zutritt.',
    emptyTomorrow: 'Morgen ist ebenfalls nichts eingeteilt.',
  },

  job: {
    back: 'Heute',
    arrival: 'Ankunft zwischen {from} und {to}',
    duration: 'Geplant {hours} Std.',
    addressTitle: 'Adresse',
    navigate: 'Route öffnen',
    accessTitle: 'Zutritt',
    accessLockedTitle: 'Zutrittsangaben noch nicht sichtbar',
    accessLockedBody:
      'Codes und Schlüsselorte erscheinen am Einsatztag. Das ist keine Einstellung, die sich umgehen lässt.',
    accessMethod: 'Zugang',
    keyLocation: 'Schlüssel',
    keyReturn: 'Schlüssel zurück',
    boxLocation: 'Schlüsselsafe',
    boxCode: 'Code Safe',
    alarmCode: 'Alarmcode',
    contactPerson: 'Ansprechperson',
    emergency: 'Notfallkontakt',
    reveal: 'Code anzeigen',
    hide: 'Verbergen',
    revealNote: 'Der Zugriff wird protokolliert.',
    tasksTitle: 'Auftrag',
    notesTitle: 'Hinweise zum Objekt',
    petNote: 'Haustier im Haushalt.',
    checkInAction: 'Einchecken',
    checkOutAction: 'Auschecken',
    noAccessAction: 'Kein Zutritt',
    doneTitle: 'Abgeschlossen',
    doneBody: 'Ein- und ausgecheckt. Der Bericht ist beim Büro.',
    /* Die gemeldete Zeit war nach dem Auschecken nirgends mehr zu sehen —
       ein Vertipper liess sich nur per Telefon korrigieren. */
    hoursTitle: 'Gemeldete Zeit',
    hoursRecorded: '{hours} Std. gemeldet',
    hoursNone: 'Keine Zeit gemeldet.',
    hoursPlanned: 'Geplant waren {hours} Std.',
    hoursCorrect: 'Zeit korrigieren',
    hoursLabel: 'Gearbeitete Stunden',
    hoursInvalid: 'Zwischen 0.5 und {max} Stunden.',
    hoursSave: 'Speichern',
    hoursCancel: 'Abbrechen',
    hoursSaved: 'Zeit aktualisiert.',
    /* Nach der Freigabe ist die Zahl bewertet — sie hier still zu ändern
       würde Geld verschieben. */
    hoursLocked: 'Das Büro hat den Einsatz freigegeben. Änderungen laufen über das Büro.',
  },

  check: {
    backToJob: 'Zum Einsatz',
    inTitle: 'Einchecken',
    outTitle: 'Auschecken',
    inLead: 'Bestätigen Sie den Start, sobald Sie im Objekt sind.',
    outLead: 'Fotos vom Ergebnis, dann abschliessen.',
    timeNow: 'Jetzt: {time}',
    photosTitle: 'Fotos',
    photosBefore: 'Vorher — mindestens {n}',
    photosAfter: 'Nachher — mindestens {n}',
    photosHint: 'Küche, Bad und Wohnbereich genügen. Keine Personen im Bild.',
    photosMissing: 'Noch {n} Foto(s) nötig.',
    addPhoto: 'Foto aufnehmen',
    photoDemo: 'Prototyp: es wird keine Kamera geöffnet.',
    remove: 'Entfernen',
    noteLabel: 'Notiz ans Büro',
    noteHint: 'Nur intern. Zum Beispiel: Backofen war stärker verschmutzt als angegeben.',
    /* Hiess «Mehraufwand» und fragte nach der Differenz — also nach einer
       Subtraktion im Treppenhaus, und die eine Zahl, die das Büro freigibt
       (wie lange der Einsatz gedauert hat), stand nirgends im Datensatz. */
    hoursTitle: 'Gearbeitete Zeit',
    hoursPlanned: 'Geplant waren {hours} Std.',
    hoursLabel: 'Gearbeitete Stunden',
    hoursHint:
      'Wird nicht automatisch verrechnet. Das Büro sieht die Differenz zur Planung und entscheidet.',
    hoursSuggested: 'Vorgeschlagen ist die Zeit seit dem Einchecken — bitte prüfen.',
    hoursInvalid: 'Zwischen 0.5 und {max} Stunden.',
    confirmIn: 'Einsatz starten',
    confirmOut: 'Einsatz abschliessen',
    doneInTitle: 'Eingecheckt um {time}',
    doneOutTitle: 'Abgeschlossen um {time}',
    doneOutBody: 'Der Bericht ist beim Büro. Fahren Sie sicher.',
    doneInBody: 'Startzeit ist erfasst. Die Fotos liegen beim Einsatz.',
    backToDay: 'Zum Tag',
  },

  noAccess: {
    backToJob: 'Zum Einsatz',
    title: 'Kein Zutritt',
    lead: 'Sie stehen vor der Tür und kommen nicht rein. Das Büro übernimmt ab hier.',
    waitTitle: 'Zuerst: {minutes} Minuten warten',
    waitBody:
      'Rufen Sie die Kundschaft an und warten Sie die volle Zeit ab, bevor Sie abbrechen. Das ist die Bedingung, unter der die Ausfallgebühr überhaupt gilt.',
    callCustomer: 'Kundschaft anrufen',
    callOffice: 'Büro anrufen',
    reasonTitle: 'Was ist passiert?',
    reasonNoOne: 'Niemand öffnet',
    reasonWrongCode: 'Code funktioniert nicht',
    reasonNoKey: 'Schlüssel nicht am angegebenen Ort',
    reasonBlocked: 'Zugang versperrt',
    reasonOther: 'Anderes',
    noteLabel: 'Was Sie gesehen haben',
    noteHint: 'Kurz und sachlich. Das Büro liest das der Kundschaft unter Umständen vor.',
    photoTitle: 'Foto',
    photoHint: 'Ein Foto der Tür oder des Schlüsselorts hilft bei der Klärung.',
    feeTitle: 'Was das für die Kundschaft heisst',
    feeBody:
      'Bei bestätigtem Zutrittsproblem werden {percent}% des Auftrags verrechnet. Diese Entscheidung trifft das Büro, nicht Sie.',
    submit: 'Ans Büro melden',
    sentTitle: 'Gemeldet',
    sentBody:
      'Das Büro ist informiert und meldet sich bei der Kundschaft. Sie können weiterfahren.',
    nextJob: 'Nächster Einsatz',
  },
};
