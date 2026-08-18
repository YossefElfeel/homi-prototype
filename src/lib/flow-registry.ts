/**
 * The flows, as data — the companion to `screen-registry.ts`.
 *
 * /screens answers "does this screen exist". That turned out to be the easier
 * question: all 101 existed and every one of them typechecked, and the app
 * still had places you could walk into and not walk out of. A screen can be
 * built and its flow still be broken — a list with no way to add to it, a state
 * declared in the schema that no button can reach, an entity that only one
 * actor can ever create.
 *
 * So this board asks the other question: for each flow, who starts it, what can
 * be done inside it, and how does it end. `exits` is the load-bearing column —
 * a flow with fewer exits than the real world has outcomes is a flow that will
 * be worked around by phone.
 */

export type ActorId = 'visitor' | 'customer' | 'owner' | 'contractor' | 'applicant';

export type ActionState = 'ok' | 'added' | 'open';

export interface FlowAction {
  label: string;
  /** Where it lives. */
  href?: string;
  state: ActionState;
  note?: string;
}

export interface Flow {
  id: string;
  de: string;
  en: string;
  actors: ActorId[];
  /** How the flow is entered at all. */
  entries: FlowAction[];
  /** What can be done once inside. */
  actions: FlowAction[];
  /** How it ends — including the unhappy ways. */
  exits: FlowAction[];
}

export const ACTOR_LABEL: Record<ActorId, string> = {
  visitor: 'Besucher',
  customer: 'Kunde',
  owner: 'Inhaber',
  contractor: 'Mitarbeitende',
  applicant: 'Bewerber',
};

const ok = (label: string, href?: string, note?: string): FlowAction => ({
  label,
  href,
  state: 'ok',
  note,
});

/** Closed in this pass. Kept marked so the board records what moved and why. */
const added = (label: string, href?: string, note?: string): FlowAction => ({
  label,
  href,
  state: 'added',
  note,
});

/** Known and deliberately not built. The note has to say why. */
const open = (label: string, note: string): FlowAction => ({
  label,
  state: 'open',
  note,
});

export const FLOWS: Flow[] = [
  {
    id: 'intake',
    de: 'Anfrage stellen',
    en: 'Making a request',
    actors: ['visitor', 'customer', 'owner'],
    entries: [
      ok('Assistent, 8 Schritte', '/anfrage', 'Öffentlich, ohne Konto — §8.3'),
      added(
        'Telefonisch erfassen',
        '/admin/anfragen/neu',
        'Eine Seite, jeder Schritt als Abschnitt. Vorher konnte eine Anfrage nur über die Website entstehen — in einem Betrieb, dessen Arbeit per Telefon hereinkommt',
      ),
      added(
        'Als Entwurf speichern',
        '/admin/anfragen/neu',
        'Für den Anruf, der endet, bevor die Antworten fertig sind. Braucht nur einen Kunden; steht in keiner Warteschlange und beim Kunden nicht im Konto',
      ),
    ],
    actions: [
      ok('Gebietsprüfung', '/anfrage/objekt', '8700 innerhalb, 8001 ausserhalb, 80 ungültig'),
      ok('Preisrahmen live', '/anfrage/leistung', 'Rechnet ab Leistung + Fläche mit'),
      ok('Zutritt hinterlegen', '/anfrage/zutritt', 'Vier Methoden, Codes maskiert'),
      ok('Entwurf überlebt Neuladen', '/anfrage', '30 Tage, §20.1'),
      added(
        'Nach Frist priorisieren',
        '/admin/anfragen',
        'Jede offene Anfrage hat eine Frist aus §4.1 und einen Verzug in Tagen. Überfällige stehen oben — vorher war die Liste nach Eingang sortiert und damit ein Protokoll, keine Warteschlange',
      ),
      added(
        'Filtern nach Status, Leistung, Gebiet, Zeitraum',
        '/admin/anfragen',
        'Plus «nur überfällig». Vorher nur Status und Gebiet',
      ),
      added(
        'Zeilenaktionen',
        '/admin/anfragen',
        'Details, Offerte schreiben, ablehnen, Entwurf weiterbearbeiten oder verwerfen — je nach Status. Vorher führte jede Zeile an genau einen Ort',
      ),
      added(
        'Ablauf sichtbar',
        '/admin/anfragen/req_1',
        'Eingegangen → In Prüfung → Offerte versendet → Antwort, mit Zeitstempeln. Dieselbe Ableitung auf der Kundenseite, damit beide nicht verschieden antworten',
      ),
    ],
    exits: [
      ok('Gesendet', '/anfrage/gesendet'),
      ok('Ausserhalb Gebiet — trotzdem gesendet', '/anfrage/pruefen', '§20.1: markiert, nicht blockiert'),
      added(
        'Zurückziehen',
        '/konto/anfragen/req_3',
        'cancelledByCustomer war deklariert, übersetzt und eingefärbt — und von keinem Bildschirm erreichbar',
      ),
      added(
        'Stornieren durch uns',
        '/admin/anfragen/req_1',
        'Ab «Offerte versendet» ist «Ablehnen» das falsche Wort. Schliesst die Offerte gleich mit',
      ),
      ok(
        'Ablehnen mit Begründung',
        '/admin/anfragen/req_1?action=reject',
        '§4.1. Dialog über der Liste statt eigener Seite — die Absage wird dort entschieden, wo die Zeile steht',
      ),
    ],
  },
  {
    id: 'quote',
    de: 'Offerte & Zahlung',
    en: 'Quote & payment',
    actors: ['owner', 'customer'],
    entries: [
      ok('Offerte schreiben', '/admin/anfragen/req_1/offerte', 'Zeilen vorbefüllt aus der Anfrage'),
      added(
        'Direkt aus der Telefonerfassung',
        '/admin/anfragen/neu',
        '«Erfassen und Offerte schreiben» — der Anruf endet oft mit beidem',
      ),
    ],
    actions: [
      ok('Positionen bearbeiten', '/admin/anfragen/req_1/offerte'),
      ok('Optionale Positionen an/aus', '/offerte/off_1', 'Preis und Dauer bewegen sich zusammen'),
      ok('Termin wählen, 15 Min. reserviert', '/offerte/off_1/termin'),
      ok('Unterschreiben', '/offerte/off_1/unterschrift'),
      ok('Änderung anfragen', '/offerte/off_1/aenderung'),
      added(
        'Freie Zeiten: die fünf Regeln',
        '/admin/anfragen/req_1/offerte',
        'Der Block zeigte Zeiten ohne zu sagen, woher sie kommen — «sucht das System oder der Mensch?» hatte auf dem Bildschirm keine Antwort. Öffnungszeiten und Vorlaufzeit lesen ihre Werte aus den Einstellungen, damit der Text nicht von der Engine abdriften kann',
      ),
      added(
        'Vorlage einsetzen',
        '/admin/nachrichten',
        'Elf Vorlagen lagen in den Einstellungen, genau eine wurde je gelesen. Setzt in der Sprache des Kunden ein und lässt Platzhalter stehen',
      ),
      added(
        'Vorlage im Offert-Builder',
        '/admin/anfragen/req_1/offerte',
        'Screen 48 bekam den Vorlagen-Wähler, das Begleitschreiben nicht — dabei geht genau dieser Text mit jeder einzelnen Offerte raus',
      ),
      added(
        'Wählbare Position: an oder aus vorwählen',
        '/admin/anfragen/req_1/offerte',
        'Der Builder schrieb nur `optional`, nie `selected` — jede wählbare Position ging vorangekreuzt raus. Ein Extra konnte also nur ein Rabatt sein, den der Kunde wegnimmt, nie eine Leistung, die er dazunimmt',
      ),
      added(
        'Begleittext vor dem Senden lesen',
        '/admin/anfragen/req_1/offerte/senden',
        'Die Karte hiess «So sieht es der Kunde» und liess genau den einen Teil weg, der von Hand geschrieben ist',
      ),
      added(
        'Drei Termine vorschlagen (Erstkunde)',
        '/offerte/off_propose/termin',
        'Stammkunden buchen direkt weiter — wir kennen Objekt, Zutritt und Verlauf. Beim ersten Einsatz schlägt der Kunde bis zu drei Termine vor, nichts wird dabei blockiert',
      ),
      added(
        'Termin bestätigen',
        '/admin/offerten/off_propose',
        'Der einzige Schritt in diesem Flow, der beim Inhaber liegt. Reserviert den Slot 48 Stunden; ohne die Karte sah die Offerte aus, als läge sie beim Kunden',
      ),
      added(
        'Zahlungsstand lesen',
        '/admin/offerten',
        'Nur lesend. Der Inhaber hat hier weder Karte einzugeben noch etwas zurückzuerstatten — die eine Auskunft, die fehlte, war ob das Geld da ist',
      ),
    ],
    exits: [
      ok('Bezahlt und gebucht', '/offerte/off_1/bestaetigt'),
      ok('Zahlung fehlgeschlagen', '/offerte/off_1/zahlung', 'Reservierung läuft weiter oder ab'),
      ok('Abgelaufen, neu ausstellen', '/offerte/off_2'),
      added(
        'Offerte ablehnen',
        '/offerte/off_1',
        'Es gab nur annehmen oder ändern. Ein Nein wurde zu Schweigen und drei Wochen später zu «abgelaufen» — ohne Grund im System. Gibt die reservierte Zeit sofort frei',
      ),
      added(
        'Ohne Zahlung gebucht (Paket oder Abo)',
        '/offerte/off_pkg/zahlung',
        '§11.3 — gekaufte Stunden werden nicht zweimal verrechnet. Vorher verlangte der Ablauf eine Karte, belastete den vollen Betrag und liess die Stunden unangetastet im Konto liegen',
      ),
      added(
        'Weiter zur Buchung',
        '/admin/offerten/off_paid',
        'Die Verknüpfung Offerte → Buchung stand in den Daten und auf keinem Bildschirm. «Ist das gemacht worden?» begann bisher im Kalender',
      ),
    ],
  },
  {
    id: 'crm',
    de: 'Kunden & Objekte',
    en: 'Customers & properties',
    actors: ['owner'],
    entries: [
      added(
        'Kunde erfassen',
        '/admin/kunden/neu',
        'Ein Kunde entstand ausschliesslich als Nebenwirkung des Assistenten. Am ersten Tag war /admin/kunden eine Liste ohne Weg, etwas hineinzutun',
      ),
      added('Objekt erfassen', '/admin/objekte', 'Ausserhalb einer Anfrage — für bekannte Adressen'),
      ok('Automatisch aus einer Anfrage', '/anfrage/kontakt'),
    ],
    actions: [
      added('Doppelprüfung auf E-Mail und Telefon', '/admin/kunden/neu', 'Dieselbe Regel wie im Assistenten'),
      ok('Interne Notizen', '/admin/kunden/cus_1'),
      ok('Zutritt und Schlüssel am Objekt', '/admin/objekte/prp_1', 'Codes rollen- und datumsgebunden, §13.1'),
      ok('Verlauf als eine Zeitachse', '/admin/kunden/cus_1'),
      added(
        'Stammdaten bearbeiten',
        '/admin/kunden/cus_1/bearbeiten',
        'Der Datensatz liess sich anlegen und lesen, sonst nichts. Eine am Telefon falsch getippte Nummer blieb falsch — das einzige änderbare Feld war die interne Notiz, also genau das Feld, das der Kunde nie sieht',
      ),
      added(
        'Aktiv / inaktiv setzen',
        '/admin/kunden',
        'Die Spalte zeigte den Status und nichts im Panel konnte ihn schreiben — nur der Kunde selbst, indem er sein Konto schloss',
      ),
      added(
        'Sperren und entsperren',
        '/admin/kunden',
        '«Der ist weg» und «den bedienen wir nicht» waren dieselbe Zeile. Die Sperre beisst wirklich: keine Offerte aus dem Builder, in der Erfassung nicht wählbar, Kundenbereich zu',
      ),
      added(
        'Nach Status filtern',
        '/admin/kunden',
        'Die Statusspalte wurde zum Schalter, bevor sie zum Filter wurde — «wen haben wir gesperrt?» hiess jede Zeile lesen. Dazu die Trefferzahl, die jede andere Admin-Liste über die `Toolbar` längst hatte',
      ),
      added(
        'Zahlungsmittel sehen, hinterlegen, Standard setzen',
        '/admin/kunden/cus_2',
        'Der Kunde sah seine Karten auf Screen 45, der Inhaber nirgends — und am Telefon wird er gefragt, nicht der Kunde. Das Feld ist eine Bezeichnung, nie eine Kartennummer',
      ),
      ok(
        'Zahlungsmittel entfernen',
        '/konto/zahlungsmittel',
        'Durch den Kunden selbst. Hinterlegen gibt er am Telefon durch, löschen nicht — das Zahlungsmittel gehört ihm. Screen 65 sagt das hin, wo der Knopf fehlt, sonst sieht es nach einem vergessenen Control aus',
      ),
      added(
        'Rechnungen des Kunden mit Betrag und Zahlweg',
        '/admin/kunden/cus_2',
        'In der Zeitachse war eine Rechnung eine Zeile mit einer Nummer: kein Betrag, kein Zahlungsstand, kein Zahlweg. Details öffnen im Popup, geändert wird weiterhin nur auf Screen 72',
      ),
      added(
        'Ganzen Verlauf durchsuchen und filtern',
        '/admin/kunden/cus_2/verlauf',
        'Der Datensatz trug die ganze Zeitachse ungefiltert. Jetzt trägt er die letzten fünf, und Screen 65a den Rest — mit Suche, Art-Filter und Zeitraum. Offerten sind neu drin: vorher sprang der Verlauf von der Anfrage direkt zur Buchung',
      ),
    ],
    exits: [
      ok('Konto schliessen', '/konto/profil', 'Durch den Kunden selbst'),
      added(
        'Archivieren und wiederherstellen',
        '/admin/kunden',
        'Aus der Arbeitsliste raus, im Datensatz drin — mit eigenem Tab, denn ein Soft Delete, den man nirgends ansehen kann, ist von einem echten nicht zu unterscheiden',
      ),
      open(
        'Kunde endgültig löschen (revDSG)',
        'Das Archiv ist bewusst kein Löschen. Rechnungen hängen am Datensatz (§15) und drei Admin-Screens dereferenzieren `customerId` mit `!`. Was revDSG für einen Kunden mit Rechnungen verlangt, gehört geklärt, bevor der Knopf gebaut wird',
      ),
    ],
  },
  {
    id: 'job',
    de: 'Einsatz',
    en: 'The job itself',
    actors: ['owner', 'contractor'],
    entries: [
      ok('Aus bezahlter Offerte', '/admin/kalender'),
      added(
        'Von Hand eintragen',
        '/admin/kalender/neu',
        'Eine Buchung entstand ausschliesslich aus einer bezahlten Offerte. Der Auftrag, der am Telefon zustande kommt — die Art, wie dieser Betrieb Arbeit bekommt — hatte keinen Weg in den Kalender, und /admin/buchungen druckte seit dem ersten Tag die Quelle «Manuell» für einen Datensatz, den nichts erzeugen konnte',
      ),
      added(
        'Buchungen als Liste',
        '/admin/buchungen',
        'Die Buchung war die einzige grosse Entität ohne eigene Liste. Der Kalender beantwortet «was ist am Dienstag» — nicht «welche Einsätze kommen aus Offerten», nicht «welcher fertige Einsatz hat noch keine Rechnung»',
      ),
      ok('Heutige Einsätze', '/einsatz', 'Rolle «Mitarbeitende»'),
    ],
    actions: [
      ok('Zuweisen und verschieben', '/admin/buchungen/bkg_1'),
      added(
        'Aktionen direkt aus dem Kalender',
        '/admin/kalender',
        'Verschieben, Zuweisen und Stornieren lagen hinter dem Öffnen des Einsatzes. Das Zeilenmenü springt in dieselbe Ansicht mit dem passenden Feld offen — eine Bestätigung im Dropdown wäre ein Dialog im Menü, und eine zweite Umsetzung von «Stornieren» wäre binnen einer Welle uneinig mit der ersten',
      ),
      added(
        'Legende und Farbe nach Zustand',
        '/admin/kalender',
        'Woche und Monat zeichneten jeden Eintrag in derselben Akzentfarbe — ein stornierter und ein bestätigter Einsatz sahen gleich aus. Farben kommen aus der status-registry, die Legende liest dieselbe Quelle',
      ),
      ok('Ein- und Auschecken mit Fotos', '/einsatz/bkg_1/check'),
      ok('Zugangscodes nur am Einsatztag', '/einsatz/bkg_1', 'Demo-Uhr verschieben — der Block leert sich wirklich'),
      added(
        'Mehraufwand freigeben',
        '/admin/buchungen/bkg_1',
        '§5.3 teilt den Vorgang: melden darf die ausführende Person, bewerten das Büro. Nur die erste Hälfte war gebaut — «wartet auf Freigabe» hatte keinen Ausgang und «abgeschlossen» war unerreichbar',
      ),
    ],
    exits: [
      added('Freigegeben und verrechenbar', '/admin/buchungen/bkg_1'),
      ok('Kein Zutritt, mit Wartezeit und Foto', '/einsatz/bkg_1/kein-zutritt'),
      ok('Storniert', '/admin/buchungen/bkg_1'),
      ok('Verrechnet', '/admin/rechnungen'),
    ],
  },
  {
    /*
     * Neu. Der Kalender hielt ausschliesslich Buchungen, und eine Buchung kam
     * ausschliesslich aus einer bezahlten Offerte — dazwischen lag alles, was
     * den Tag eines kleinen Betriebs ausmacht. «Rückruf zugesagt» stand zweimal
     * im Seed, in einem Notizfeld, ohne Datum und auf keinem Bildschirm
     * wiederfindbar.
     */
    id: 'calls',
    de: 'Anrufe & Termine',
    en: 'Calls & appointments',
    actors: ['owner'],
    entries: [
      added(
        'Termin eintragen',
        '/admin/kalender/neu',
        'Ein Knopf, zwei Dinge: Einsatz oder Anruf. Aus Sicht des Inhabers ist es ein Gedanke — an diesem Tag passiert etwas',
      ),
      added(
        'Ohne Kundenakte',
        '/admin/kalender/neu',
        'Wer einmal angerufen hat, ist kein Kunde. Name und Telefon reichen — sonst füllt sich /admin/kunden mit Leuten, die noch nichts gebucht haben',
      ),
    ],
    actions: [
      added(
        'Ergebnis festhalten',
        '/admin/kalender/cev_today',
        'Die Notiz ist, was gefragt werden sollte; das Ergebnis ist, was gesagt wurde — und genau dieser Text muss in die Anfrage übergehen, wenn Arbeit daraus wird',
      ),
      added(
        'Besichtigung blockiert Zeit, Anruf nicht',
        '/admin/kalender',
        'Eine Besichtigung ist irgendwo, ein Telefonat ist überall. Nur die erste kollidiert mit einem Einsatz. Keines von beiden zählt gegen die zwei Einsätze pro Tag — siehe /open-questions',
      ),
    ],
    exits: [
      added(
        'Daraus wurde eine Anfrage',
        '/admin/kalender/cev_converted',
        'Der eigentliche Zweck. Ohne diesen Weg endet ein gutes Gespräch als abgehakter Kalendereintrag, und dieselben Angaben werden eine Bildschirmbreite weiter aus dem Gedächtnis nochmal getippt',
      ),
      added(
        'Erledigt',
        '/admin/kalender/cev_today',
        'Mit Ergebnis im Verlauf, mit Zeitstempel',
      ),
      added(
        'Niemand erreicht',
        '/admin/kalender/cev_noreply',
        'Ausdrücklich nicht «erledigt». Sonst liest sich eine Woche unbeantworteter Anrufe wie eine Woche erledigter Arbeit',
      ),
      added('Abgesagt', '/admin/kalender', 'Verschwindet aus dem Kalender, bleibt im Datensatz'),
    ],
  },
  {
    id: 'money',
    de: 'Rechnungen & Abos',
    en: 'Invoices & plans',
    actors: ['owner', 'customer'],
    entries: [
      ok('Rechnung aus Einsatz', '/admin/rechnungen'),
      ok('Abo anlegen', '/admin/abos'),
    ],
    actions: [
      ok('Positionen im Entwurf ändern', '/admin/rechnungen/inv_draft'),
      ok('Versenden, als bezahlt erfassen, stornieren', '/admin/rechnungen/inv_draft'),
      added(
        'Zahlweg beim Erfassen angeben',
        '/admin/rechnungen/inv_paid',
        '«Als bezahlt markieren» schrieb den Status und sonst nichts — kein `Payment`, also stand nirgends, wie das Geld gekommen ist. `PaymentMethod` kannte dafür auch die zwei Wege nicht, über die eine Rechnung hier tatsächlich zurückkommt: QR-Rechnung und bar',
      ),
      ok('Besuch überspringen, pausieren, kündigen', '/konto/abo'),
    ],
    exits: [
      ok('Bezahlt', '/konto/rechnungen/inv_paid'),
      ok('Storniert mit Grund', '/admin/rechnungen/inv_draft'),
      ok(
        'Überfällig',
        '/konto/rechnungen/inv_paid',
        'Wird beim Lesen aus dem Fälligkeitsdatum abgeleitet, nicht gespeichert — richtig so, sonst bräuchte es einen nächtlichen Lauf',
      ),
      open(
        'Zahlung im Abo fehlgeschlagen (pastDue)',
        'Nur in den Demodaten vorhanden. Es gibt keinen Abrechnungslauf, der einen fehlgeschlagenen Einzug erzeugen könnte — den zu erfinden, hiesse Verhalten zu behaupten, das der Prototyp nicht hat',
      ),
    ],
  },
  {
    id: 'hiring',
    de: 'Bewerbung & Team',
    en: 'Hiring & team',
    actors: ['applicant', 'owner'],
    entries: [
      ok('Bewerbung', '/jobs/bewerbung', 'Arbeitsbewilligung ist die erste Frage'),
      ok('Spontanbewerbung', '/jobs', 'Wenn keine Stelle offen ist'),
      ok('Stelle anlegen', '/admin/stellen'),
    ],
    actions: [
      ok('Status abfragen', '/jobs/status'),
      ok('Prüfen, ablehnen, löschen', '/admin/bewerbungen/app_1', 'Löschen ist echt, nicht archiviert — revDSG'),
      ok('In Mitarbeiterkonto umwandeln', '/admin/bewerbungen/app_1/konto'),
    ],
    exits: [
      ok('Abgelehnt mit Grund', '/admin/bewerbungen/app_1'),
      ok('Angestellt', '/admin/team'),
      open(
        'Teammitglied von Hand anlegen',
        'Der einzige Weg ins Team führt über eine Bewerbung. Das ist vertretbar — es hält Berechtigungen an einen geprüften Datensatz gebunden — aber am ersten Tag ist /admin/team damit leer und nur über eine erfundene Bewerbung füllbar',
      ),
    ],
  },
];

export function flowCounts() {
  const all = FLOWS.flatMap((f) => [...f.entries, ...f.actions, ...f.exits]);
  return {
    total: all.length,
    added: all.filter((a) => a.state === 'added').length,
    open: all.filter((a) => a.state === 'open').length,
  };
}
