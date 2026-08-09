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

const todo = (
  ref: string,
  de: string,
  en: string,
  states?: string[],
  note?: string,
): ScreenEntry => ({ ref, de, en, status: 'todo', states, note });

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
      todo('C1', 'Offene Stellen', 'Open roles', ['no openings → Spontanbewerbung']),
      todo('C2', 'Stelle (Vorlage)', 'Role template'),
      todo('C3', 'Bewerbung — Schritt 1', 'Application — step 1', ['field error']),
      todo('C4', 'Bewerbung — Schritt 2', 'Application — step 2', ['upload', 'upload error']),
      todo('C5', 'Bewerbung eingegangen', 'Application received'),
      todo('C6', 'Status abfragen', 'Check status', ['not found']),
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
        'Inline state on screen 15 rather than a page of its own — the spec allows this. Try 8700 (inside), 8001 (outside), 80 (invalid)',
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
      done('26', 'Unterschrift', 'E-signature', '/offerte/off_1/unterschrift', ['empty', 'signed']),
      done('27', 'Zahlung', 'Payment', '/offerte/off_1/zahlung', [
        'TWINT',
        'card',
        'wallet',
        'processing',
      ]),
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
      todo('32', 'Anmelden', 'Sign in', ['error', 'magic link sent']),
      todo('33', 'Konto aktivieren', 'Activate account'),
      todo('34', 'Passwort zurücksetzen', 'Reset password'),
      todo('35', 'Übersicht', 'Dashboard', ['empty']),
      todo('36', 'Meine Anfragen', 'My requests', ['empty']),
      todo('37', 'Anfrage-Detail', 'Request detail'),
      todo('38', 'Meine Offerten', 'My quotes', ['empty']),
      todo('39', 'Meine Rechnungen', 'My invoices', ['empty']),
      todo('40', 'Rechnungs-Detail', 'Invoice detail'),
      todo('41', 'Meine Objekte', 'My properties', ['empty']),
      todo('42', 'Objekt-Detail', 'Property detail'),
      todo('43', 'Mein Abo', 'My plan', ['no plan', 'paused']),
      todo('44', 'Stundenguthaben', 'Hour credit', ['expiring', 'empty']),
      todo('45', 'Zahlungsmittel', 'Payment methods', ['TWINT unavailable']),
      todo('46', 'Bewertung schreiben', 'Write a review'),
      todo('47', 'Vorher / Nachher', 'Before & after', ['empty']),
      todo('48', 'Nachrichten', 'Messages', ['empty']),
      todo('49', 'Profil & Benachrichtigungen', 'Profile & notifications'),
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
      done('52', 'Anfragen', 'Requests', '/admin/anfragen', ['empty', 'no search result']),
      done('53', 'Anfrage-Detail', 'Request detail', '/admin/anfragen/req_1', [
        'codes masked',
        'codes revealed',
      ]),
      done(
        '54',
        'Offerte erstellen',
        'Quote builder',
        '/admin/anfragen/req_1/offerte',
        ['draft', 'inline editing', 'availability panel'],
        'The screen the owner lives in. Two clicks to send, or ⌘/Ctrl+Enter for one — against a target of four',
      ),
      done('55', 'Vorschau & senden', 'Preview & send', '/admin/anfragen/req_1/offerte/senden', [
        'sending',
        'sent',
      ]),
      done('56', 'Anfrage ablehnen', 'Decline request', '/admin/anfragen/req_1/ablehnen', ['sent']),
      done('57', 'Offerten', 'Quotes', '/admin/offerten', ['empty']),
      done('58', 'Kalender — Tag', 'Calendar — day', '/admin/kalender', ['no jobs', 'travel conflict']),
      done('59', 'Kalender — Woche', 'Calendar — week', '/admin/kalender', ['closure period'], 'View switcher on the calendar — a calendar is one screen with four views, not four screens'),
      done('60', 'Kalender — Monat', 'Calendar — month', '/admin/kalender', ['closure period']),
      done('61', 'Agenda', 'Agenda list', '/admin/kalender', ['empty']),
      done('62', 'Routenkarte', 'Route map', '/admin/kalender/karte', ['empty day']),
      done('63', 'Buchungs-Detail', 'Booking detail', '/admin/kalender/bkg_1', ['codes masked']),
      todo('64', 'Kunden', 'Customers', ['empty']),
      todo('65', 'Kunden-Detail', 'Customer detail'),
      todo('66', 'Objekte', 'Properties', ['empty']),
      todo('67', 'Objekt-Detail', 'Property detail'),
      todo('68', 'Schlüsselregister', 'Key log', ['locked — no insurance', 'active']),
      todo('69', 'Abos', 'Subscriptions', ['empty']),
      todo('70', 'Abo-Detail', 'Subscription detail'),
      todo('71', 'Rechnungen', 'Invoices', ['empty']),
      todo('72', 'Rechnung bearbeiten', 'Edit invoice'),
      todo('73', 'Leistungen & Preise', 'Services & pricing'),
      todo('74', 'Leistung bearbeiten', 'Edit service', ['translation gap']),
      todo('75', 'Zusatzleistungen', 'Add-ons'),
      todo('76', 'Gutscheine', 'Coupons', ['empty']),
      todo('77', 'Gutschein bearbeiten', 'Edit coupon'),
      todo('78', 'Bewertungen', 'Reviews', ['empty', 'negative review']),
      todo('79', 'Textvorlagen', 'Message templates'),
      todo('80', 'Einstellungen — Gebiete', 'Settings — regions'),
      todo('81', 'Einstellungen — Zeiten', 'Settings — hours & closures'),
      todo('82', 'Einstellungen — Gebühren', 'Settings — fees & rules'),
      todo('83', 'Änderungsprotokoll', 'Change log', ['empty']),
      todo('84', 'Suche', 'Unified search', ['empty']),
    ],
  },
  {
    id: 'hiring',
    de: 'Bewerbungen & Team',
    en: 'Applications & team',
    note: 'Wave 7 · applicant data is owner-only (revDSG) — contractors never reach these screens',
    screens: [
      todo('H1', 'Bewerbungen', 'Applications', ['empty']),
      todo('H2', 'Bewerbung', 'Application detail', ['reject with reason', 'delete record']),
      todo('H3', 'Stellen', 'Postings', ['empty']),
      todo('H4', 'Stelle bearbeiten', 'Edit posting'),
      todo('H5', 'In Mitarbeiterkonto umwandeln', 'Convert to team account'),
      todo('H6', 'Team', 'Team', ['owner only']),
      todo('H7', 'Teammitglied', 'Team member'),
    ],
  },
  {
    id: 'field',
    de: 'Einsatz',
    en: 'Field',
    note: 'Wave 9 · mobile only · access codes visible on the job day only',
    screens: [
      todo('85', 'Heutige Einsätze', 'Today’s jobs', ['no jobs']),
      todo('86', 'Einsatz-Detail', 'Job detail', ['codes revealed']),
      todo('87', 'Ein- & Auschecken', 'Check in & out', ['photos required']),
      todo('88', 'Freigabe anfragen', 'Request approval', ['no access logged']),
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
