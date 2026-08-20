/**
 * The 101 screens, as data.
 *
 * This is the delivery contract: the 88 from the specification plus the 13 of
 * the hiring track. `status` is honest — `done` only once a screen and its
 * required states are actually built, so /screens is a progress board rather
 * than a wish list.
 */

export type ScreenStatus = 'done' | 'wip' | 'todo';

export type TrackId =
  | 'marketing'
  | 'careers'
  | 'booking'
  | 'offer'
  | 'account'
  | 'admin'
  | 'hiring'
  | 'field';

export interface ScreenEntry {
  ref: string;
  de: string;
  en: string;
  href?: string;
  status: ScreenStatus;
  /** Required states beyond the default one. */
  states?: string[];
  note?: string;
}

export interface Track {
  id: TrackId;
  de: string;
  en: string;
  note: string;
  screens: ScreenEntry[];
}

// The `todo` helper lived here through waves 0–9 and is gone now that every
// entry is built. Adding a screen means adding a `done` row with its href —
// there is no longer a way to list a screen that does not exist.

const done = (
  ref: string,
  de: string,
  en: string,
  href: string,
  states?: string[],
  note?: string,
): ScreenEntry => ({ ref, de, en, href, status: 'done', states, note });

export const TRACKS: Track[] = [
  {
    id: 'marketing',
    de: 'Website',
    en: 'Marketing site',
    note: 'Wave 1 · four visual directions · SEO targets the eight served municipalities, not Zurich',
    screens: [
      done('1', 'Startseite', 'Home', '/', ['reviews empty (default)', 'reviews present']),
      done('2', 'Leistung (Vorlage ×7)', 'Service template (×7)', '/leistungen'),
      done('3', 'Preise', 'Pricing', '/preise'),
      done('4', 'Abos', 'Plans', '/abos', ['table ≥lg', 'cards <lg']),
      done('5', 'Referenzen', 'Gallery', '/referenzen', ['empty (default)', 'populated']),
      done('6', 'Einzelne Arbeit', 'Single work', '/referenzen', [], 'Expanded dialog inside the gallery grid'),
      done('7', 'Über uns', 'About', '/ueber-uns', ['insurance on', 'insurance off']),
      done('8', 'Kontakt', 'Contact', '/kontakt', ['sending', 'success', 'field error']),
      done('9', 'Gebiet (Vorlage ×8)', 'Region template (×8)', '/gebiete/kuesnacht'),
      done('10', 'Rechtliches (Vorlage)', 'Legal template', '/rechtliches/agb', [
        'AGB',
        'Datenschutz',
        'Impressum',
      ]),
      done('11', '404', '404', '/diese-seite-gibt-es-nicht'),
      done('12', 'Danke', 'Thank you', '/danke'),
    ],
  },
  {
    id: 'careers',
    de: 'Jobs',
    en: 'Careers',
    note: 'Wave 7 · linked from the footer and About — never from the main nav, which belongs to customers',
    screens: [
      done('C1', 'Offene Stellen', 'Open roles', '/jobs', [
        'no openings → Spontanbewerbung',
      ], 'The default scenario has no postings on purpose — the empty state is the one a reviewer sees first'),
      done('C2', 'Stelle (Vorlage)', 'Role template', '/jobs/reinigungskraft-teilzeit', [], 'Scenario "hiring" — requirements come before benefits, so nobody applies who cannot be hired'),
      done('C3', 'Bewerbung — Schritt 1', 'Application — step 1', '/jobs/bewerbung', [
        'field error',
        'no permit',
      ], 'The work permit is the first question, not the last'),
      done('C4', 'Bewerbung — Schritt 2', 'Application — step 2', '/jobs/bewerbung', [
        'upload',
        'file too large',
      ]),
      done('C5', 'Bewerbung eingegangen', 'Application received', '/jobs/bewerbung/gesendet'),
      done('C6', 'Status abfragen', 'Check status', '/jobs/status', ['idle', 'not found']),
    ],
  },
  {
    id: 'booking',
    de: 'Anfrage',
    en: 'Request flow',
    note: 'Wave 2 · mobile first · live price range on every step',
    screens: [
      done('13', 'Leistung wählen', 'Choose service', '/anfrage/leistung', [
        'windows count',
        'furniture count',
      ]),
      done('14', 'Gespeichertes Objekt', 'Saved property', '/anfrage/objekt', ['empty'], 'Visible when the demo role is "Kunde" — switch role in the demo bar'),
      done('15', 'Neues Objekt', 'New property', '/anfrage/objekt', ['field error']),
      done(
        '16',
        'Gebietsprüfung',
        'Coverage check',
        '/anfrage/objekt',
        ['inside', 'outside', 'invalid'],
        'Inline state on screen 15 rather than a page of its own — the spec allows this. Try 8700 (inside), 8001 (outside), 80 (invalid). Outside is now a stop, not a warning: it blocks Continue and no request is created',
      ),
      done('17', 'Zusatzleistungen', 'Add-ons', '/anfrage/extras', ['none for this service']),
      done('18', 'Zutritt', 'Access method', '/anfrage/zutritt', [
        'present',
        'key left',
        'key box',
        'other person',
        'codes masked',
      ]),
      done('19', 'Wunschtermin', 'Preferred time', '/anfrage/termin', [
        'closed day',
        'too soon',
        'flexible',
      ]),
      done('20', 'Fotos & Notizen', 'Photos & notes', '/anfrage/fotos', [
        'uploading',
        'bad format',
        'too large',
      ]),
      done('21', 'Kontaktdaten', 'Contact details', '/anfrage/kontakt', ['field error']),
      done('22', 'Prüfen & senden', 'Review & submit', '/anfrage/pruefen', [
        'sending',
        'confirmation',
        'out of area',
      ]),
    ],
  },
  {
    id: 'offer',
    de: 'Offerte & Zahlung',
    en: 'Quote & payment',
    note: 'Wave 3 · live slot picker replaced the three fixed proposals · 15-minute slot hold',
    screens: [
      done('23', 'Offerte', 'Quote', '/offerte/off_1'),
      done(
        '24',
        'Optionale Positionen',
        'Optional items',
        '/offerte/off_1',
        ['on', 'off'],
        'Interactive rows on screen 23 — toggling one updates the total and the planned duration together',
      ),
      done('25', 'Termin wählen', 'Pick a slot', '/offerte/off_1/termin', [
        'closed day',
        'too soon',
        'fully booked',
        'no availability',
      ]),
      done(
        '25a',
        'Termine vorschlagen',
        'Propose dates',
        '/offerte/off_propose/termin',
        ['picking', 'sent, waiting', 'confirmed'],
        'The first-job path: up to three dates, nothing blocked until the office picks one. off_propose opens waiting, off_confirm opens confirmed',
      ),
      done(
        '26',
        'Vertrag unterschreiben',
        'Sign the agreement',
        '/offerte/off_1/unterschrift',
        ['empty', 'signed'],
        'The agreement is on the page, with Homivaro’s signature already on it — the quote left the office signed. Was three facts and a link to the terms',
      ),
      done('27', 'Zahlung', 'Payment', '/offerte/off_1/zahlung', [
        'TWINT',
        'card',
        'wallet',
        'processing',
      ]),
      done(
        '27a',
        'Nichts zu bezahlen',
        'Nothing to pay',
        '/offerte/off_pkg/zahlung',
        [],
        '§11.3 — the job is covered by package hours, so the gateway is absent rather than softened',
      ),
      done('28', 'Buchung bestätigt', 'Booking confirmed', '/offerte/off_1/bestaetigt'),
      done('29', 'Änderung anfragen', 'Request a change', '/offerte/off_1/aenderung', ['sent']),
      done('30', 'Offerte abgelaufen', 'Quote expired', '/offerte/off_2', [], 'off_2 is seeded 20 days old, so it opens in the expired state'),
      done('31', 'Zahlung fehlgeschlagen', 'Payment failed', '/offerte/off_1/zahlung', [
        'hold running',
        'hold expired',
      ], 'Pick "Fehlgeschlagene Zahlung" in the prototype control on screen 27'),
    ],
  },
  {
    id: 'account',
    de: 'Kundenbereich',
    en: 'Customer dashboard',
    note: 'Wave 8',
    screens: [
      done('32', 'Anmelden', 'Sign in', '/anmelden', ['error', 'magic link sent'], 'The email link leads; most customers here never chose a password'),
      done('33', 'Konto aktivieren', 'Activate account', '/konto-aktivieren', ['live rules']),
      done('34', 'Passwort zurücksetzen', 'Reset password', '/passwort', ['sent'], 'The confirmation never reveals whether the account exists'),
      done('35', 'Übersicht', 'Dashboard', '/konto', ['empty']),
      done('36', 'Meine Anfragen', 'My requests', '/konto/anfragen', ['empty']),
      done('37', 'Anfrage-Detail', 'Request detail', '/konto/anfragen/req_3', ['waiting', 'quote ready']),
      done('38', 'Meine Offerten', 'My quotes', '/konto/offerten', ['empty', 'expiring']),
      done('39', 'Meine Rechnungen', 'My invoices', '/konto/rechnungen', ['empty']),
      done('40', 'Rechnungs-Detail', 'Invoice detail', '/konto/rechnungen/inv_paid', ['overdue', 'paid']),
      done('41', 'Meine Objekte', 'My properties', '/konto/objekte', ['empty']),
      done('42', 'Objekt-Detail', 'Property detail', '/konto/objekte/prp_2', ['no access details'], 'States who sees the access details and when — in the customer own account'),
      done('43', 'Meine Abos', 'My plans', '/konto/abo', [
        'no plan',
        'two plans, two properties',
        'paused',
        'skips used up',
        'expired with visits left',
      ], 'One card per plan — the demo customer holds one on a flat and one on an office'),
      done('44', 'Stundenguthaben', 'Hour credit', '/konto/guthaben', ['expiring', 'empty']),
      done('45', 'Zahlungsmittel', 'Payment methods', '/konto/zahlungsmittel', ['TWINT unavailable']),
      done('46', 'Bewertung schreiben', 'Write a review', '/konto/bewertung', ['nothing to review', 'sent']),
      done('47', 'Vorher / Nachher', 'Before & after', '/konto/fotos', ['empty', 'consent off']),
      done('48', 'Nachrichten', 'Messages', '/konto/nachrichten', ['empty']),
      done('49', 'Profil & Benachrichtigungen', 'Profile & notifications', '/konto/profil'),
    ],
  },
  {
    id: 'admin',
    de: 'Verwaltung',
    en: 'Admin',
    note: 'Waves 4–6 · fully responsive · every table has a real card view below lg',
    screens: [
      done('50', 'Anmelden', 'Sign in', '/admin/anmelden', ['checking']),
      done('51', 'Start', 'Dashboard', '/admin', ['every block empty'], 'Load the “Tag 1 — alles leer” scenario to see all four empty at once'),
      done('52', 'Anfragen', 'Requests', '/admin/anfragen', [
        'empty',
        'no search result',
        'nothing overdue',
      ]),
      done('53', 'Anfrage-Detail', 'Request detail', '/admin/anfragen/req_2', [
        'codes masked',
        'codes revealed',
      ]),
      done(
        '54',
        'Offerte erstellen',
        'Quote builder',
        '/admin/anfragen/req_2/offerte',
        ['draft', 'inline editing', 'availability panel'],
        'The screen the owner lives in. Two clicks to send, or ⌘/Ctrl+Enter for one — against a target of four',
      ),
      done('55', 'Vorschau & senden', 'Preview & send', '/admin/anfragen/req_2/offerte/senden', [
        'sending',
        'sent',
      ]),
      done(
        '56',
        'Anfrage ablehnen',
        'Decline request',
        '/admin/anfragen/req_2?action=reject',
        ['sending'],
        'A dialog over the queue rather than a page of its own — the decision is made over the row it is about. The link opens the same dialog on the request',
      ),
      done(
        '57',
        'Offerten',
        'Quotes',
        '/admin/offerten',
        ['empty', 'covered by a package', 'payment failed', 'awaiting a date'],
        'Service and rhythm, coverage, payment state and the job it became — all four derived, none of them stored on the offer',
      ),
      done(
        '57a',
        'Offerte-Detail',
        'Quote detail',
        '/admin/offerten/off_propose',
        ['awaiting a date', 'paid with a booking', 'expired'],
        'off_propose opens on the date-confirmation panel — the one action in the quote flow that belongs to the owner',
      ),
      done(
        '57b',
        'Buchungen',
        'Bookings',
        '/admin/buchungen',
        ['empty', 'no filter result'],
        'The list a booking never had. Rows open screen 63 rather than a second detail that would drift from it',
      ),
      done(
        '58',
        'Kalender — Tag',
        'Calendar — day',
        '/admin/kalender',
        ['no jobs', 'travel conflict', 'closure period', 'held slot'],
        'Legend, and the colours it explains, arrived together — week and month drew every entry in one accent tone. Day and agenda now show closures, which only week and month ever did',
      ),
      done(
        '58a',
        'Termin eintragen',
        'Add an appointment',
        '/admin/kalender/neu',
        ['a job', 'a call', 'day refused', 'no customers yet'],
        'Two things behind one button. The job half runs the same dayBlockReason the customer-facing picker runs, so the office cannot click around the daily ceiling',
      ),
      done('59', 'Kalender — Woche', 'Calendar — week', '/admin/kalender', ['closure period'], 'View switcher on the calendar — a calendar is one screen with four views, not four screens'),
      done('60', 'Kalender — Monat', 'Calendar — month', '/admin/kalender', ['closure period']),
      done('61', 'Agenda', 'Agenda list', '/admin/kalender', ['empty']),
      done('62', 'Routenkarte', 'Route map', '/admin/kalender/karte', ['empty day']),
      done(
        '63',
        'Buchungs-Detail',
        'Booking detail',
        '/admin/buchungen/bkg_1',
        ['codes masked', 'settled — actions closed'],
        'The calendar row menu deep-links here with a panel already open. A settled job now says why its actions are shut instead of showing a greyed strip',
      ),
      done(
        '63a',
        'Termin-Detail',
        'Appointment detail',
        '/admin/kalender/cev_today',
        ['planned', 'no reply', 'became a request'],
        'The call that produced work becomes a request without being retyped. cev_converted opens on the closed loop, cev_noreply on the one still outstanding',
      ),
      done('64', 'Kunden', 'Customers', '/admin/kunden', [
        'empty',
        'no search result',
        'no match for the status filter',
      ]),
      done(
        '65',
        'Kunden-Detail',
        'Customer detail',
        '/admin/kunden/cus_2',
        ['no method on file', 'no invoice yet'],
        'Payment methods, the invoices as a table with amount and route, and the last five things that happened. cus_1 opens on the empty halves of all three',
      ),
      done(
        '65a',
        'Kunden-Verlauf',
        'Customer history',
        '/admin/kunden/cus_2/verlauf',
        ['empty', 'no match for the filters'],
        'The timeline the record used to carry whole — searchable, filtered by type and by date. Quotes are in it, which they never were on the record',
      ),
      done('66', 'Objekte', 'Properties', '/admin/objekte', ['empty']),
      done('67', 'Objekt-Detail', 'Property detail', '/admin/objekte/prp_1', [
        'codes masked',
        'codes revealed',
      ]),
      done(
        '68',
        'Schlüsselregister',
        'Key log',
        '/admin/schluessel',
        ['locked — no insurance', 'active', 'empty'],
        'Toggle “Haftpflichtversicherung” in the demo controls to switch states — §21 item 12',
      ),
      done('69', 'Abos', 'Plans', '/admin/abos', ['empty', 'search', 'retired filtered']),
      done('69a', 'Abo anlegen', 'Add plan', '/admin/abos/neu', ['blank']),
      done('69b', 'Abo bearbeiten', 'Edit plan', '/admin/abos/pln_basic/bearbeiten', [
        'existing plan',
      ]),
      done('70', 'Abo-Detail', 'Plan detail', '/admin/abos/pln_basic', [
        'on sale',
        'retired with subscribers',
        'no subscribers',
      ], 'The plan as a product, with everyone on it and their used/remaining visits'),
      done('70a', 'Abonnent', 'Subscriber', '/admin/abos/pln_basic/sub_2', [
        'active',
        'paused',
        'expired',
        'renewed once',
      ], 'One customer on one plan — history, payments and the cancellation rule'),
      done('71', 'Rechnungen', 'Invoices', '/admin/rechnungen', ['empty', 'overdue']),
      done('72', 'Rechnung bearbeiten', 'Edit invoice', '/admin/rechnungen/inv_draft', [
        'draft awaiting approval',
        'sent',
      ], 'The QR-bill is drawn to the real Swiss payment-part proportions'),
      done('73', 'Leistungen & Preise', 'Services & pricing', '/admin/leistungen', [
        'translation gap',
      ]),
      done(
        '74',
        'Leistung bearbeiten',
        'Edit service',
        '/admin/leistungen/grundreinigung',
        ['translation gap'],
        'All four languages side by side — German is the fallback, so a gap never announces itself',
      ),
      done('75', 'Zusatzleistungen', 'Add-ons', '/admin/zusatzleistungen', [], 'Price is billed, time is only scheduled — the distinction the pricing engine enforces'),
      done('76', 'Gutscheine', 'Coupons', '/admin/gutscheine', ['empty']),
      done('77', 'Gutschein bearbeiten', 'Edit coupon', '/admin/gutscheine/neu'),
      done('78', 'Bewertungen', 'Reviews', '/admin/bewertungen', [
        'empty',
        'negative review',
      ], 'A critical review cannot be published without a reply'),
      done('79', 'Textvorlagen', 'Message templates', '/admin/vorlagen', [
        'translation gap',
        'vollständig',
        'mehrere Vorlagen pro Anlass',
        'nur manuell',
        'empty',
      ], 'Drei Anlässe haben im Seed zwei Vorlagen — sonst wäre «als Standard setzen» und die Rückfrage nach der Nachfolgerin mit keinen Daten erreichbar'),
      done('79a', 'Vorlage bearbeiten', 'Edit template', '/admin/vorlagen/neu', [
        'new',
        'translation gap',
        'vollständig',
        'SMS zu lang',
      ], 'Zeigt, in welchen Bereichen die Vorlage angeboten wird — aus derselben Tabelle, die die Wähler lesen'),
      done('80', 'Einstellungen — Gebiete', 'Settings — regions', '/admin/einstellungen'),
      done('81', 'Einstellungen — Zeiten', 'Settings — hours & closures', '/admin/einstellungen', [
        'closure period',
      ]),
      done('82', 'Einstellungen — Gebühren', 'Settings — fees & rules', '/admin/einstellungen', [
        'insurance on/off',
      ]),
      done('83', 'Änderungsprotokoll', 'Change log', '/admin/protokoll', ['empty']),
      done('84', 'Suche', 'Unified search', '/admin/suche', ['idle', 'empty']),
    ],
  },
  {
    id: 'hiring',
    de: 'Bewerbungen & Team',
    en: 'Applications & team',
    note: 'Wave 7 · applicant data is owner-only (revDSG) — contractors never reach these screens',
    screens: [
      done('H1', 'Bewerbungen', 'Applications', '/admin/bewerbungen', [
        'empty',
        'owner only',
        'retention expiring',
      ], 'Contractors lose this screen entirely — a redacted version would still leak that somebody applied'),
      done('H2', 'Bewerbung', 'Application detail', '/admin/bewerbungen/app_1', [
        'reject with reason',
        'delete record',
        'no permit',
      ]),
      done('H3', 'Stellen', 'Postings', '/admin/stellen', ['empty']),
      done('H4', 'Stelle bearbeiten', 'Edit posting', '/admin/stellen/reinigungskraft-teilzeit'),
      done(
        'H5',
        'In Mitarbeiterkonto umwandeln',
        'Convert to team account',
        '/admin/bewerbungen/app_1/konto',
        [],
        'The permission summary is the screen — four plain sentences before the button',
      ),
      done('H6', 'Team', 'Team', '/admin/team', ['owner only']),
      done('H7', 'Teammitglied', 'Team member', '/admin/team/tm_marta'),
    ],
  },
  {
    id: 'field',
    de: 'Einsatz',
    en: 'Field',
    note: 'Wave 9 · mobile only · access codes visible on the job day only',
    screens: [
      done('85', 'Heutige Einsätze', 'Today’s jobs', '/einsatz', ['no jobs'], 'Scenario "hiring" + role "Team member" — today only, plus a glance at tomorrow'),
      done('86', 'Einsatz-Detail', 'Job detail', '/einsatz/bkg_1', ['codes locked', 'codes revealed'], 'Move the demo clock off the job day and the access block genuinely empties (§13)'),
      done('87', 'Ein- & Auschecken', 'Check in & out', '/einsatz/bkg_1/check', ['photos required']),
      done('88', 'Kein Zutritt melden', 'No access', '/einsatz/bkg_1/kein-zutritt', ['no access logged'], 'The wait comes before the form — the fee only holds up if it happened'),
    ],
  },
];

export const TOTAL_SCREENS = TRACKS.reduce((sum, t) => sum + t.screens.length, 0);

export function screenCounts() {
  const all = TRACKS.flatMap((t) => t.screens);
  return {
    total: all.length,
    done: all.filter((s) => s.status === 'done').length,
    wip: all.filter((s) => s.status === 'wip').length,
  };
}
