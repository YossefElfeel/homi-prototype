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
      /* The default scenario now publishes a review, so the promise block is
         no longer what a reviewer lands on — `fresh` is where the empty case
         lives, and that is the honest home for it: launch day is the only day
         a cleaning company has no reviews at all. */
      done('1', 'Startseite', 'Home', '/', ['reviews present (default)', 'reviews empty (fresh)']),
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
      done(
        '13',
        'Bau & Ausbau',
        'Construction & fit-out',
        '/bau',
        ['Decken & Trockenbau', 'Spanndecken', 'Gewerbe & Akustik', 'Rohbau & Umgebung', 'Lightbox'],
        'The first page here that sells no cleaning service, and the only one that quotes no price: the site rests on CHF 49/h and a ceiling does not. Twenty-two of the owner\'s own photographs, grouped by trade because none of them arrived attached to a job. The close goes to /kontakt, not the request wizard — that wizard asks how many bathrooms a flat has. Whether the trade also belongs in the service catalogue, and what a catalogue row prints when there is no hourly rate to print, is open',
      ),
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
    /* Was the string «Wave 8» — the one track note on this board that made no
       claim about what it contains. Every list here now carries the same
       toolbar the office's do, and every state a screen shows is derived from
       the clock rather than read off a stored field. */
    note: 'Waves 8, 71–76 · every list searches, filters and sorts · same toolbar as the admin panel',
    screens: [
      done('32', 'Anmelden', 'Sign in', '/anmelden', ['error', 'magic link sent'], 'The email link leads; most customers here never chose a password'),
      done('33', 'Konto aktivieren', 'Activate account', '/konto-aktivieren', ['live rules']),
      done('34', 'Passwort zurücksetzen', 'Reset password', '/passwort', ['sent'], 'The confirmation never reveals whether the account exists'),
      done('35', 'Übersicht', 'Dashboard', '/konto', ['empty']),
      done('36', 'Meine Anfragen', 'My requests', '/konto/anfragen', ['empty', 'searched', 'filtered', 'nothing found', 'paged'], 'Twenty requests on the demo account — one in every state it can be in, two years of settled history behind them — so search, both menus and the second page all have something to act on'),
      done('37', 'Anfrage-Detail', 'Request detail', '/konto/anfragen/req_3', ['waiting', 'quote ready', 'quote closed', 'withdrawn'], 'req_acc_new waits, req_acc_accepted runs the rail to the end, req_acc_expired and req_acc_withdrawn stop it early. The badge, the quote card and the rail all read the derived state, so a quote that lapses by date closes all three at once — a state no scenario can stage, because moving the demo clock rebuilds the seed along with it'),
      done('38', 'Meine Offerten', 'My quotes', '/konto/offerten', ['empty', 'expiring', 'searched', 'filtered', 'nothing found', 'sorted', 'paged'], 'Thirteen quotes on the demo account across five states, so the menu, the search and the second page all have something to act on'),
      done('39', 'Meine Rechnungen', 'My invoices', '/konto/rechnungen', ['empty', 'searched', 'filtered', 'nothing found', 'sorted'], 'Five invoices — one page, so paging is the one list state this screen cannot show'),
      done('40', 'Rechnungs-Detail', 'Invoice detail', '/konto/rechnungen/inv_paid', ['overdue', 'paid']),
      done('41', 'Meine Objekte', 'My properties', '/konto/objekte', ['empty', 'searched', 'filtered', 'nothing found', 'sorted'], 'Two properties, a flat and an office, so the type menu has both of its live options'),
      done('42', 'Objekt-Detail', 'Property detail', '/konto/objekte/prp_2', ['no access details'], 'States who sees the access details and when — in the customer own account. The visit history pages at ten; prp_2 carries four, so the line under it states the capacity and no scenario reaches a second page'),
      done('43', 'Meine Abos', 'My plans', '/konto/abo', [
        'no plan',
        'two plans, two properties',
        'paused',
        'skips used up',
        'nothing scheduled to skip',
        'expired with visits left',
        'every plan on sale, stacked or side by side',
        'the upgrades one plan can move to',
        'buying one: address, method, confirm',
      ], 'One card per *section*, not one slab per plan — the plan, then a card each for skipping, moving up and cancelling — and under them every package on sale. Buying and moving up both finish here. The demo customer holds one plan on a flat and one on an office, has a third address carrying none, and the cards of a plan sit closer to each other than two plans do'),
      done(
        '45',
        'Zahlungsmittel',
        'Payment methods',
        '/konto/zahlungsmittel',
        ['TWINT unavailable', 'card form', 'TWINT form', 'wallet form', 'nothing on file'],
        'Each of the four kinds opens the form it needs. Saving used to be the click itself — every card came out labelled «Karte», so two of them were one row. The four tiles that open those forms are real cards rather than buttons wearing a copy of the card treatment',
      ),
      done('46', 'Bewertung schreiben', 'Write a review', '/konto/bewertung', ['nothing to review', 'sent']),
      /* No longer a screen of its own. `empty` went with the tab: a card that
         renders nothing when the job has no photographs needs no empty state,
         and the one it had spoke for a list across every job the customer ever
         had. What it costs is named in the note — a plan visit carries a
         `subscriptionId` and no request, so its pair has no customer-facing
         home until §20.6a on /open-questions is answered. */
      done('47', 'Vorher / Nachher', 'Before & after', '/konto/anfragen/req_acc_h4', ['consent off'], 'A card on the request that produced the job, not a tab. Photos on a plan visit or on a booking with no quote behind it (bkg_3) are unreachable from the account until a job screen exists'),
      /* Wave 76 gave this search over a stack of open threads; the note then
         read «the threads stay bubbles, so there is no table state to show».
         They are a rail now, so there is: which thread is open, and which kind
         the strip is filtered to. */
      done('48', 'Nachrichten', 'Messages', '/konto/nachrichten', ['empty', 'filtered by kind', 'searched', 'nothing found', 'single kind (no tabs)'], 'Four threads on the demo account, one of each kind — a request, a quote, a job and an invoice — so every tab in the strip has something under it. The rail pages at ten, which four threads never reach: the line under it states the capacity and the pager stays out of sight'),
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
      done(
        '53',
        'Anfrage-Detail',
        'Request detail',
        '/admin/anfragen/req_2',
        ['codes masked', 'codes revealed', 'everything folded'],
        'The fold-all button governs the four readable sections. Access is not one of them — a bulk control has no business putting an alarm code on the display',
      ),
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
        ['empty', 'no filter result', 'nobody assigned'],
        'The list a booking never had. Every row carries an amount now — off the quote, the invoice, the plan share or an hourly estimate, and the column says which. «Ausführung» adds who is doing it and how long it took, with a filter that can also ask for the jobs nobody has picked up',
      ),
      done(
        '58',
        'Kalender — Tag',
        'Calendar — day',
        '/admin/kalender',
        ['no jobs', 'travel conflict', 'closure period', 'held slot', 'filtered to nothing'],
        'The legend is the filter: one row per colour, clicking it keeps only that colour across all four views, and every row has something in the seed to find',
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
      done(
        '60',
        'Kalender — Monat',
        'Calendar — month',
        '/admin/kalender',
        ['closure period', 'more than three entries'],
        'Draws the week grid\'s chips instead of coloured dots — a dot said something was on that day and never what',
      ),
      done('61', 'Agenda', 'Agenda list', '/admin/kalender', ['empty', 'filtered to nothing']),
      done(
        '63',
        'Buchungs-Detail',
        'Booking detail',
        '/admin/buchungen/bkg_1',
        [
          'codes masked',
          'settled — actions closed',
          'moved — note above the actions',
          'not assigned',
          'hours over the estimate',
        ],
        'Moving a job writes the customer their notice in the same call, and the screen says what it moved from — bkg_2 opens on a job that was already moved once. «Ausführung» is the section §2a took out and this wave put back: who is on it, planned against worked, and the panel that hands it to somebody else. bkg_7 opens on 6.5 h against a planned 5',
      ),
      done(
        '63a',
        'Termin-Detail',
        'Appointment detail',
        '/admin/kalender/cev_today',
        ['upcoming', 'pending', 'in progress', 'done', 'called off'],
        'The call that produced work becomes a request without being retyped, and the request card says what it will carry before you press. cev_converted opens on the closed loop, cev_noreply on the one still outstanding',
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
        ['no method on file', 'no invoice yet', 'card on file with an expiry'],
        'Every block is a card now. Putting a card on file asks for the four fields it is read off the phone as, and keeps the brand, the last four and the expiry',
      ),
      done(
        '65a',
        'Kunden-Verlauf',
        'Customer history',
        '/admin/kunden/cus_2/verlauf',
        ['empty', 'no match for the filters'],
        'The timeline the record used to carry whole — searchable, filtered by type and by date. Quotes are in it, which they never were on the record',
      ),
      done(
        '66',
        'Objekte',
        'Properties',
        '/admin/objekte',
        ['empty', 'no search result', 'no match for the type or zone filter', 'address outside the eight municipalities'],
        'Last service and next visit are derived from the bookings, so the two questions the office asks this list every day are answered on it rather than in the calendar. The address block on the add form is the same component the edit screen renders now — it gained the detailed address, and typing a served postcode names the area rather than leaving two free-text boxes that could disagree',
      ),
      done('67', 'Objekt-Detail', 'Property detail', '/admin/objekte/prp_1', [
        'codes masked',
        'codes revealed',
      ]),
      done(
        '67a',
        'Objekt bearbeiten',
        'Edit property',
        '/admin/objekte/prp_1/bearbeiten',
        ['field error', 'postcode outside the service area', 'detailed address filled', 'detailed address empty'],
        'Lift, pets and extra effort were written as `false` at creation and had no control anywhere — the three facts that change what a job costs and how it is briefed. The address block is shared with screen 66 now, and carries the detailed address: floor, entrance and bell used to go into the standing notes, which the job sheet prints below the tasks',
      ),
      done(
        '68',
        'Schlüsselregister',
        'Key log',
        '/admin/schluessel',
        ['locked — no insurance', 'active', 'empty', 'filtered to nothing', 'search with no match'],
        'Toggle “Haftpflichtversicherung” in the demo controls to switch states — §21 item 12',
      ),
      done(
        '68a',
        'Schlüssel zurückgeben',
        'Return a key',
        '/admin/schluessel?zurueckgeben=key_1',
        ['a key still held'],
        'A dialog over the register rather than a page of its own — the handover is recorded standing at the row it is about. The link opens the same dialog, and only on a key that is actually still held',
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
      ], 'The plan as a product, with everyone on it and their used/remaining visits. Terms and features are cards, and the subscriber heading carries its own search and count'),
      done('70a', 'Abonnent', 'Subscriber', '/admin/abos/pln_basic/sub_2', [
        'active',
        'paused',
        'expired',
        'renewed once',
      ], 'One customer on one plan — history, payments and the cancellation rule'),
      done('71', 'Rechnungen', 'Invoices', '/admin/rechnungen', [
        'empty',
        'nothing matches the filter',
        'overdue',
      ], 'Search takes the QR reference as well as the number, because that is what a bank statement shows. Every row carries its own menu, gated on status and role. It is the first of three rows in the «Finanzen» group now — the costs and the profit line are the two beside it — and «Rechnungen herunterladen» exports what the filters left rather than everything in the store'),
      done(
        '71a',
        'Rechnung erstellen',
        'Create invoice',
        '/admin/rechnungen/neu',
        ['no billable job', 'no customers'],
        'The job is an optional input, not the way in — everything a company bills that is not a finished job had no route into the product before this',
      ),
      done(
        '71b',
        'Auswertung',
        'Finance analytics',
        '/admin/finanzen',
        ['3 / 6 / 12 months', 'a month in the red', 'nothing recorded yet (fresh)'],
        'The two sides subtracted, which is the question the money section is opened to ask and the one neither list could answer. Both are counted by the month the work happened in — stated on the screen, because a margin whose basis is invisible gets the wrong thing assumed about it. The owner’s own pay is not in the costs, and it says so',
      ),
      done(
        '71c',
        'Ausgaben',
        'Expenses',
        '/admin/ausgaben',
        ['open', 'overdue', 'paid', 'nothing matches the filter', 'empty (fresh)'],
        'The invoice list’s mirror, deliberately — same toolbar, same filters, same row menu. No draft state: a supplier’s bill arrives finished. Deleting is allowed at any status, which is where it parts company with an invoice — nobody outside the company has ever held one. A third filter narrows to one person, and the job a cost belongs to finally has a column of its own — it had been on the record since the day it was written and appeared on no list',
      ),
      done(
        '71d',
        'Ausgabe erfassen',
        'Record an expense',
        '/admin/ausgaben/exp_1',
        ['new', 'unsaved changes', 'field error', 'already paid', 'labour — crew, hours, job'],
        'Stages a draft and writes on the button. Settling is not a field on it — the payment route is asked for in its own dialog on the list, so a receipt cannot flip to «bezahlt» while somebody is fixing a typo in the supplier name. Picking «Arbeitszeit» swaps the supplier box for a crew — who worked, who paid, who carries it — makes the job compulsory, and offers the hours the check-in and check-out already recorded',
      ),
      done(
        '71e',
        'Arbeitszeit',
        'Workforce',
        '/admin/ausgaben/arbeitszeit',
        [
          'entries · by person · by job',
          'open, overdue and paid hours',
          'nothing matches the filter',
          'nothing in the period',
          'nothing recorded at all (fresh)',
        ],
        'The chain job → person → hours → money → payer → responsible: one table that can be acted on and two that add it up. Its own screen rather than a mode of 71c — that list is receipts and this one is hours, and a view switch would have left the category filter applying to one shape and not the other. Everything reads one window, so the labour total here and the «Arbeitszeit» row on 71b are the same number',
      ),
      done('72', 'Rechnung bearbeiten', 'Edit invoice', '/admin/rechnungen/inv_draft', [
        'draft awaiting approval',
        'sent',
        'overdue',
        'cancelled with a reason',
      ], 'The QR-bill is drawn to the real Swiss payment-part proportions, and labelled as the customer’s document rather than the owner’s'),
      done(
        '73',
        'Leistungen & Preise',
        'Services & pricing',
        '/admin/leistungen',
        [
          'translation gap',
          'draft',
          'active',
          'deactivated',
          'search + filter empty',
          'delete refused — still in use',
        ],
        'Availability is a switch in its own column, and it opens the confirm rather than applying on the click',
      ),
      done(
        '73a',
        'Leistung anlegen',
        'Create service',
        '/admin/leistungen/neu',
        ['saved as a draft', 'created and activated'],
        'The catalogue was as long as the seed said it was. Saving as a draft is what lets a price be argued about without a half-finished offer on the website',
      ),
      done(
        '74',
        'Leistung bearbeiten',
        'Edit service',
        '/admin/leistungen/grundreinigung',
        ['translation gap', 'pending status change'],
        'All four languages side by side, two to a row — German is the fallback, so a gap never announces itself. Text autosaves; visibility does not',
      ),
      done(
        '74a',
        'Leistung im Überblick',
        'Service details',
        '/admin/leistungen/grundreinigung/details',
        ['active', 'draft', 'deactivated', 'delete refused'],
        'Read-only, and a page rather than a panel — it has an address you can send, and reading a price no longer means opening a screen that saves as you type',
      ),
      done(
        '75',
        'Zusatzleistungen',
        'Add-ons',
        '/admin/zusatzleistungen',
        [
          'available',
          'hidden',
          'on but unreachable',
          'search + filter empty',
          'delete refused — still quoted',
        ],
        'Availability is a switch under a header saying what it does, not a checkbox under one saying «Status» — and the card above the table is the route an add-on takes from here to the invoice',
      ),
      done(
        '75a',
        'Zusatzleistung anlegen',
        'Create add-on',
        '/admin/zusatzleistungen/neu',
        ['saved hidden', 'created and offered', 'attached to no service'],
        'The extras a customer can buy were whatever the seed said. Which services an add-on hangs off had never been an editable field at all',
      ),
      done(
        '75b',
        'Zusatzleistung bearbeiten',
        'Edit add-on',
        '/admin/zusatzleistungen/fenster',
        ['unsaved changes', 'on but unreachable', 'delete refused'],
        'One screen rather than a read/edit pair: it saves on a button, so reading it is already safe. Availability is the one control that does not wait for that button, and it says so',
      ),
      done(
        '76',
        'Gutscheine',
        'Coupons',
        '/admin/gutscheine',
        ['valid', 'starts later', 'fully redeemed', 'expired', 'disabled', 'empty (fresh)'],
        'The list was empty in every scenario, so the recommendation not to lean on discounts was being made by a table nobody had seen hold a row. Five seeded codes carry the five states; the recommendation stays, under the heading',
      ),
      done(
        '77',
        'Gutschein bearbeiten',
        'Edit coupon',
        '/admin/gutscheine/cpn_1',
        ['unsaved changes', 'duplicate code', 'end before start', 'new', 'percentage with a ceiling', 'fixed amount — no ceiling field'],
        'Every field ran patchData on each keystroke, and only when editing an existing coupon — so an edit could not be abandoned and half-typed values reached the data. It now stages a draft and writes on the button, which is what makes the two checks possible',
      ),
      done(
        '78',
        'Bewertungen',
        'Reviews',
        '/admin/bewertungen',
        [
          'awaiting release',
          'published',
          'hidden',
          'not published',
          'critical review',
          'no consent',
          'delete',
          'filtered to nothing',
          'empty (fresh)',
        ],
        'The queue was empty in the default scenario, so every control on it — the reply box, the consent gate, the critical-review warning — could only be seen by switching scenarios first. Five seeded reviews carry the cases; «Zurückziehen» became «Ausblenden», which is a state of its own rather than a trip back through the queue, and a review can now be deleted outright, which is what §20.6 obliges when consent is withdrawn. The four status headings are gone with them: the state rides on the card, which is what lets the list be searched and filtered at all',
      ),
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
      done(
        'H2',
        'Bewerbung',
        'Application detail',
        '/admin/bewerbungen/app_1',
        ['reject with reason', 'delete record', 'no permit', 'download a document'],
        'The download really produces a PDF — generated on the spot, and it says so on its first page',
      ),
      done('H3', 'Stellen', 'Jobs', '/admin/stellen', ['six seeded', 'empty']),
      done('H4', 'Stelle bearbeiten', 'Edit job', '/admin/stellen/reinigungskraft-teilzeit', [
        'published',
        'draft',
      ]),
      done(
        'H5',
        'In Mitarbeiterkonto umwandeln',
        'Convert to team account',
        '/admin/bewerbungen/app_1/konto',
        [],
        'The permission summary is the screen — four plain sentences before the button',
      ),
      done(
        'H6',
        'Team',
        'Team',
        '/admin/team',
        ['owner only'],
        'No longer in the sidebar — reached from the «Im Team» banner on an accepted application, which is also the only way somebody gets onto it',
      ),
      done(
        'H7',
        'Teammitglied',
        'Team member',
        '/admin/team/tm_marta',
        ['jobs assigned', 'hours recorded', 'nothing recorded yet (tm_yusuf)'],
        'Hours are a total and a list of jobs, deliberately not a payroll run — §22a on /open-questions says what a real one would still have to settle',
      ),
    ],
  },
  {
    id: 'field',
    de: 'Einsatz',
    en: 'Field',
    note: 'Wave 9 · mobile only · access codes visible on the job day only',
    screens: [
      done('85', 'Heutige Einsätze', 'Today’s jobs', '/einsatz', ['no jobs'], 'Scenario "hiring" + role "Team member" — today only, plus a glance at tomorrow'),
      done(
        '86',
        'Einsatz-Detail',
        'Job detail',
        '/einsatz/bkg_1',
        ['codes locked', 'codes revealed', 'finished — hours correctable', 'approved — hours locked'],
        'Move the demo clock off the job day and the access block genuinely empties (§13). A finished job shows the hours reported and lets them be corrected until the office approves it',
      ),
      done(
        '87',
        'Ein- & Auschecken',
        'Check in & out',
        '/einsatz/bkg_1/check',
        ['photos required', 'hours required at check-out'],
        'Check-out asks for the hours worked, prefilled from the time since check-in — it used to ask for the *difference* and store neither',
      ),
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
