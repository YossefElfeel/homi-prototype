/**
 * Benutzer & Rechte — Screens U1–U5.
 *
 * Zwei Leserinnen: die Inhaberin, die morgens jemandem Zugriff geben will, und
 * die Person, die vor der Sperre steht und wissen muss, warum. Beide Sätze
 * stehen hier — deshalb liegen die Texte der Zugangssperre («gate…») in
 * `admin.shell` und nicht hier: sie gehören zum Rahmen, nicht zum Formular.
 *
 * `areas` ist die einzige Stelle, an der ein Bereich beschrieben wird. Die
 * Namen selbst kommen aus `admin.shell.nav` — dieselbe Liste wie in der
 * Seitenleiste, damit ein Bereich in der Rechtematrix nicht anders heisst als
 * im Menü, auf das er Zugriff gibt.
 */
export const adminUsersDe = {
  /*
   * One namespace, five screens. Nested rather than five siblings on
   * `admin`, because `admin.detail` and `admin.edit` are names any screen
   * could have claimed — and the dictionaries are merged flat, so the first
   * one to claim it would have silently won.
   */
  users: {
    /** Ein Satz pro Bereich: was die Person damit tatsächlich sieht. */
    areas: {
      requests: 'Eingehende Anfragen lesen und beantworten.',
      offers: 'Offerten schreiben, versenden und nachfassen.',
      bookings: 'Alle Einsätze mit Adresse, Zeit und Zustand.',
      calendar: 'Der Kalender mit allen Terminen und Zuteilungen.',
      customers: 'Kundendaten, Kontakt und Verlauf.',
      messages: 'Der Nachrichtenverlauf mit der Kundschaft.',
      properties: 'Objekte samt Zutrittsart und Notizen.',
      keys: 'Wer welchen Schlüssel hat — inklusive Aufbewahrungsort.',
      subscriptions: 'Abos, Laufzeiten und Verlängerungen.',
      invoices: 'Rechnungen erstellen, freigeben und als bezahlt markieren.',
      expenses: 'Ausgaben erfassen und Belege ablegen.',
      analytics: 'Umsatz, Kosten und Marge über alle Monate.',
      catalogue: 'Leistungen und Preise ändern.',
      addons: 'Zusatzleistungen und deren Preise.',
      coupons: 'Gutscheincodes anlegen und beenden.',
      reviews: 'Bewertungen freigeben, beantworten und ausblenden.',
      templates: 'Die Textbausteine für automatische Nachrichten.',
      applications: 'Bewerbungsunterlagen inklusive Ausweis und Bewilligung.',
      postings: 'Stelleninserate auf der Jobseite.',
      users: 'Konten anlegen, sperren und Rechte vergeben.',
      settings: 'Zeiten, Zuschläge, Gebiete und Regeln.',
      changelog: 'Wer wann was geändert hat.',
    },

    roles: {
      owner: 'Geschäftsleitung',
      contractor: 'Mitarbeitende:r',
      /* «Büro», nicht «Administration». Das Wort beschreibt, wo die Person
         sitzt, und genau das ist der Unterschied zur mitarbeitenden Person: sie
         fährt nicht raus und taucht deshalb in keiner Einsatzzuteilung auf. */
      office: 'Büro',
    },
    roleHints: {
      owner: 'Sieht alles. Rechte lassen sich nicht einschränken.',
      contractor: 'Fährt raus. Bekommt Einsätze zugeteilt.',
      office: 'Arbeitet im Büro. Bekommt keine Einsätze zugeteilt.',
    },

    /* -------------------------------------------------------- U1 — die Liste */
    list: {
      title: 'Benutzer',
      lead: 'Wer sich anmelden kann — und was diese Person danach öffnen darf.',
      addAction: 'Benutzer anlegen',
      search: 'Name oder E-Mail',
      filterRole: 'Rolle',
      filterAll: 'Alle',
      tabActive: 'Aktiv',
      tabDeactivated: 'Deaktiviert',

      colName: 'Name',
      colRole: 'Rolle',
      colAccess: 'Zugriff',
      colContact: 'Kontakt',
      colSince: 'Dabei seit',
      colDeactivated: 'Deaktiviert am',
      colStatus: 'Status',

      /* «Alles» statt einer Zahl: die Geschäftsleitung hat keine gespeicherte
         Liste, und «22 von 22» wäre eine Zahl, die nächsten Monat still falsch
         wird. */
      accessAll: 'Alles',
      accessNone: 'Kein Zugriff',
      accessCount: '{n} Bereiche',
      accessOne: '1 Bereich',

      rowOpen: 'Benutzer öffnen',
      rowEdit: 'Daten bearbeiten',
      rowRights: 'Rechte',
      rowReset: 'Passwort-Link erstellen',
      rowDeactivate: 'Deaktivieren',
      rowReactivate: 'Reaktivieren',
      rowDelete: 'Löschen',

      /* Die Begründungen, die im Menü *am Eintrag* stehen, wenn er nicht geht.
         Ein ausgegrauter Eintrag ohne Satz daneben erzeugt genau den Anruf, den
         dieser Satz verhindert. */
      denySelf: 'Nicht am eigenen Konto',
      denyOwner: 'Nicht bei der Geschäftsleitung',
      denyHistory: 'Hat Einträge — bitte deaktivieren',
      denyInactive: 'Konto ist deaktiviert',

      emptyTitle: 'Nur Sie',
      emptyBody:
        'Legen Sie das erste Konto an, oder nehmen Sie eine Bewerbung an — beides landet hier.',
      deactivatedEmptyTitle: 'Niemand deaktiviert',
      deactivatedEmptyBody:
        'Deaktivierte Konten bleiben hier stehen, mit allem, was sie erfasst haben. Gelöscht wird nichts.',
      searchEmptyTitle: 'Nichts gefunden',
      searchEmptyBody: 'Kein Konto passt zu «{query}».',
      filterEmptyBody: 'Kein Konto passt zu dieser Rolle.',
    },

    /* ------------------------------------------------------- U2 — das Konto */
    detail: {
      back: 'Alle Benutzer',
      contactTitle: 'Kontakt',
      since: 'Dabei seit',
      deactivatedOn: 'Deaktiviert am {date}',
      fromApplication: 'Aus Bewerbung {reference}',
      editAction: 'Bearbeiten',
      rightsAction: 'Rechte ändern',

      accessTitle: 'Zugriff auf die Verwaltung',
      accessLead: 'Diese Bereiche stehen in der Seitenleiste dieser Person.',
      accessOwner:
        'Die Geschäftsleitung sieht alles. Diese Rechte lassen sich nicht einschränken.',
      accessNoneTitle: 'Kein Zugriff auf die Verwaltung',
      accessNoneBody:
        'Diese Person arbeitet nur über die Einsatzansicht auf dem Handy. Beim Öffnen der Verwaltung erscheint eine Sperre mit genau diesem Hinweis.',
      accessNoneOffice:
        'Dieses Konto kann sich anmelden, sieht danach aber nichts. Vergeben Sie Rechte, sonst ist es ein Konto ohne Zweck.',

      statusTitle: 'Status',
      deactivateAction: 'Konto deaktivieren',
      reactivateAction: 'Konto reaktivieren',
      deactivatedNoteTitle: 'Dieses Konto ist deaktiviert',
      deactivatedNoteBody:
        'Anmelden geht nicht mehr. Alles, was die Person erfasst hat, steht weiterhin da — und die Rechte sind gespeichert, falls sie zurückkommt.',

      passwordTitle: 'Passwort',
      passwordLead: 'Homivaro verschickt keine Passwörter. Sie erstellen einen Link und geben ihn weiter.',
      passwordAction: 'Passwort-Link erstellen',
      passwordAgain: 'Neuen Link erstellen',
      passwordNever: 'Bisher wurde kein Link erstellt.',
      passwordIssued: 'Erstellt {when} · gültig bis {until}',
      passwordExpired: 'Der letzte Link vom {when} ist abgelaufen.',
      passwordCopy: 'Link kopieren',
      passwordCopied: 'Link kopiert',
      passwordOpen: 'Seite öffnen',
      passwordReveal: 'Link anzeigen',
      passwordHide: 'Link verbergen',
      passwordDone: 'Link für {name} erstellt — er gilt {hours} Stunden.',
      passwordWarning:
        'Der Link steht nur, solange diese Seite offen ist. Danach lässt sich ein neuer erstellen, aber dieser hier ist weg.',

      /* «Das bleibt» — die Zusage, die diese ganze Funktion trägt, als Zahlen
         statt als Satz. Ein Versprechen im Dialogtext ist gratis; eine Liste
         gezählter Einträge lässt sich nachprüfen. */
      historyTitle: 'Das bleibt in jedem Fall',
      historyLead:
        'Ein deaktiviertes Konto verliert nichts davon. Auch ein gelöschtes würde diese Einträge nicht mitnehmen — deshalb geht Löschen erst, wenn hier nichts mehr steht.',
      historyBookings: 'Einsätze',
      historyEvents: 'Kalendereinträge',
      historyLog: 'Protokolleinträge',
      historyNone: 'Dieses Konto hat noch nichts erfasst.',
      historyOpenLog: 'Im Protokoll ansehen',

      fieldTitle: 'Einsatz',
      regionsTitle: 'Einsatzgebiet',
      skillsTitle: 'Freigegebene Leistungen',
      skillsHint: 'Nur freigegebene Leistungen lassen sich zuteilen.',
      jobsTitle: 'Kommende Einsätze',
      jobsEmpty: 'Zurzeit keine Einsätze zugeteilt.',
      officeNoteTitle: 'Keine Einsätze',
      officeNoteBody:
        'Ein Bürokonto taucht in keiner Zuteilung auf — weder im Kalender noch beim Anlegen eines Einsatzes.',

      dangerTitle: 'Konto löschen',
      dangerBody:
        'Löschen ist endgültig und legt nichts ins Archiv. Für alle, die schon einmal etwas erfasst haben, ist Deaktivieren der richtige Weg.',
      deleteAction: 'Konto löschen',
      deleteBlockedHistory:
        'Geht nicht: {n} Einträge tragen diesen Namen. Deaktivieren Sie das Konto — alles bleibt erhalten.',
      deleteBlockedSelf: 'Sie können Ihr eigenes Konto nicht löschen.',
      deleteBlockedOwner: 'Das Konto der Geschäftsleitung lässt sich nicht löschen.',
    },

    /* -------------------------------------------------------- Bestätigungen */
    confirm: {
      deactivateTitle: '{name} deaktivieren?',
      deactivateBody:
        'Die Anmeldung geht ab sofort nicht mehr. Erfasste Einsätze, Ausgaben und Protokolleinträge bleiben unverändert stehen.',
      deactivateJobs:
        'Achtung: {n} kommende Einsätze sind dieser Person zugeteilt. Sie werden weder abgesagt noch umverteilt — bitte im Kalender neu zuteilen.',
      deactivateJobsLink: 'Einsätze im Kalender ansehen',
      deactivateAction: 'Deaktivieren',
      deactivateDone: '{name} ist deaktiviert.',
      reactivateDone: '{name} kann sich wieder anmelden.',

      deleteTitle: '{name} löschen?',
      deleteBody:
        'Das Konto wird entfernt und lässt sich nicht zurückholen. Es steht kein Eintrag darauf — sonst ginge das hier nicht.',
      deleteAction: 'Endgültig löschen',
      deleteDone: '{name} wurde gelöscht.',
    },

    /* ---------------------------------------------------------- U3 — anlegen */
    create: {
      title: 'Benutzer anlegen',
      lead: 'Für alle, die nicht über eine Bewerbung ins Team gekommen sind — Büro, Buchhaltung, Aushilfe.',
      back: 'Alle Benutzer',
      personTitle: 'Person',
      firstName: 'Vorname',
      lastName: 'Nachname',
      email: 'E-Mail',
      emailHint: 'Damit meldet sich die Person an.',
      phone: 'Telefon',
      roleTitle: 'Rolle',
      roleHint: 'Entscheidet, ob diese Person Einsätze zugeteilt bekommt — nicht, was sie sehen darf.',
      accessTitle: 'Zugriff',
      accessHint: 'Ein Ausgangspunkt. Feineinstellungen danach auf der Rechte-Seite.',
      accessFullHint: 'Alle {n} vergebbaren Bereiche — ausser {except}.',
      accessSummaryNone: 'Kein Zugriff auf die Verwaltung.',
      accessSummary: '{n} Bereiche: {areas}',
      save: 'Anlegen',
      cancel: 'Abbrechen',
      done: '{name} wurde angelegt.',
      errorRequired: 'Bitte ausfüllen.',
      errorEmail: 'Diese E-Mail sieht nicht richtig aus.',
      duplicateTitle: 'Diese E-Mail gibt es schon',
      duplicateBody: '{name} nutzt {email} bereits. Zwei Konten mit derselben Adresse können sich nicht beide anmelden.',
      duplicateOpen: 'Bestehendes Konto öffnen',
    },

    /* -------------------------------------------------------- U4 — bearbeiten */
    edit: {
      title: '{name} bearbeiten',
      lead: 'Name, Kontakt und Rolle. Rechte stehen auf einer eigenen Seite.',
      back: 'Zurück zum Konto',
      save: 'Speichern',
      cancel: 'Abbrechen',
      done: 'Gespeichert.',
      roleLockedOwner: 'Die Rolle der Geschäftsleitung lässt sich nicht ändern.',
      roleChangeWarning:
        'Als «Büro» verschwindet diese Person aus jeder Einsatzzuteilung. Bereits zugeteilte Einsätze bleiben, wo sie sind.',
    },

    /* ------------------------------------------------------------ U5 — Rechte */
    rights: {
      title: 'Rechte — {name}',
      lead: 'Jeder Schalter ist ein Eintrag in der Seitenleiste dieser Person. Was nicht an ist, ist auch über die Adresszeile nicht erreichbar.',
      back: 'Zurück zum Konto',
      presetsTitle: 'Vorlage anwenden',
      presetsHint: 'Setzt die Schalter unten. Danach lässt sich jeder einzeln ändern.',
      presets: {
        full: 'Voller Zugriff',
        operations: 'Betrieb',
        finance: 'Buchhaltung',
        content: 'Inhalt & Marketing',
        field: 'Nur eigener Einsatzplan',
      },
      presetApplied: 'Vorlage «{preset}» angewendet.',
      custom: 'Eigene Auswahl',
      selectAll: 'Alle in dieser Gruppe',
      clearAll: 'Alles abwählen',
      countNone: 'Kein Bereich ausgewählt',
      countOne: '1 von {total} Bereichen',
      count: '{n} von {total} Bereichen',
      saved: 'Gespeichert',
      savedHint: 'Änderungen greifen sofort — es gibt keinen Speichern-Knopf.',

      ownerTitle: 'Die Geschäftsleitung sieht alles',
      ownerBody:
        'Für dieses Konto gibt es keine Matrix. Die Rechte sind nicht gespeichert, sondern folgen aus der Rolle — sonst würde jeder neue Bereich die Inhaberin aussperren, bis jemand ihn nachträgt.',

      selfTitle: 'Das eigene Konto',
      selfBody:
        'Eigene Rechte lassen sich hier nicht ändern. Wer sich selbst mehr geben kann, für den ist die Matrix nur Dekoration.',

      /* Eigene Überschrift, nicht noch einmal «System»: die Sperrliste steht
         direkt unter der Systemgruppe, und zwei gleich benannte Karten
         hintereinander lesen sich wie ein Darstellungsfehler. */
      lockedTitle: 'Nicht vergebbar',
      lockedPrivacy: 'Nur Geschäftsleitung — Bewerbungsunterlagen (revDSG).',
      lockedEscalation: 'Nur Geschäftsleitung — wer Rechte vergibt, vergibt sich alle.',
      lockedNote:
        'Zwei Bereiche stehen bewusst nicht zur Wahl. Sie sind unten aufgeführt, damit «Voller Zugriff» nicht behauptet, was es nicht hält.',

      /* Der Zustand, der sonst nirgends vorkommt: alles abgewählt heisst nicht
         «Konto kaputt», sondern «arbeitet nur im Feld». */
      emptyNoticeTitle: 'Kein Zugriff auf die Verwaltung',
      emptyNoticeBody:
        'Anmelden geht weiterhin. Statt der Verwaltung sieht diese Person eine Sperre mit dem Hinweis, sich an die Geschäftsleitung zu wenden.',
      emptyNoticeField: 'Die Einsatzansicht auf dem Handy bleibt davon unberührt.',
    },
  },
};
