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
 *
 * Written in English, like /screens' notes and unlike the panel it describes.
 * It used to be German prose under English headings, which made it the one
 * surface in the build whose language depended on which half of it you read:
 * the flow was called "Making a request" and everything explaining it was not.
 * The screens themselves stay bilingual — they have customers — but this board
 * has readers, and they are the same people who read the notes on /screens.
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
  /**
   * One name, in English.
   *
   * There was a `de` beside this, rendered as a grey label next to the
   * heading. With the body translated it was the last German on the page and
   * the only thing on it nothing else referred to — a second name for a flow
   * that is not an entity anybody looks up by name.
   */
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
  visitor: 'Visitor',
  customer: 'Customer',
  owner: 'Owner',
  contractor: 'Team member',
  applicant: 'Applicant',
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
    en: 'Making a request',
    actors: ['visitor', 'customer', 'owner'],
    entries: [
      added(
        'Wizard, 7 or 8 steps — the service decides',
        '/anfrage',
        'Public, no account — §8.3. It was eight for everybody, and «Zusätze» was a full screen reading «for this service there are no extras» for the four services that have none. The step list is derived from the catalogue now, so the rail counts what this request actually has',
      ),
      added(
        'Take one over the phone',
        '/admin/anfragen/neu',
        'One page, every step a section. A request could previously only come into being through the website — in a business whose work arrives by telephone',
      ),
      added(
        'Save as a draft',
        '/admin/anfragen/neu',
        'For the call that ends before the answers are finished. Needs only a customer; sits in no queue and not in the customer’s account',
      ),
    ],
    actions: [
      ok(
        'Area check',
        '/anfrage/objekt',
        '8700 inside, 8001 outside, 80 invalid. "Outside" now blocks "continue" — for a saved property too',
      ),
      ok('Live price range', '/anfrage/leistung', 'Counts along from service and area'),
      added(
        'The property step asks only what this service is priced on',
        '/anfrage/objekt',
        'Window cleaning and furniture assembly are priced from a count — `durationProfile: none` makes the estimator skip area, bathrooms, pets and condition entirely — and the step refused to continue until all three numbers had been typed anyway. They are gone for those two services, and the price is unchanged to the rappen',
      ),
      added(
        'Office cleaning stops asking what kind of property it is',
        '/anfrage/objekt',
        'The service names it. The radio group is replaced by a sentence, the saved-property list shows only offices, and «Haustiere im Haushalt» — which was quietly adding §5.2’s half hour to an office quote — is not asked',
      ),
      added(
        'A furniture-assembly job can have two stops',
        '/anfrage/objekt',
        'Collected at one address, assembled at another — a shop, the old flat, a storage unit. Optional and off by default; ticking it asks for the address, the floor and whether there is a lift, because carrying a wardrobe down four flights is the job. It reaches the office panel and the customer’s own request, and it is offered on no other service — everything else works on something that is already there',
      ),
      added(
        'The count reaches the confirmation screen',
        '/anfrage/pruefen',
        '«24 Fensterflügel» is the entire basis of the price and appeared on no summary: not in the rail, which printed the flat’s m² instead, and not on «Alles richtig?». It is the one answer that could not be checked against anything else on the page',
      ),
      added(
        'A stored address with no measurement is refused for a service that needs one',
        '/anfrage/objekt',
        'Picking a saved property skipped every check. `Property.area` is optional — the office can file an address from a phone call — so a deep clean could be requested with no area at all, and the quote builder prices that at `areaTier(0)`, the cheapest bracket on the sheet',
      ),
      ok('Record the access method', '/anfrage/zutritt', 'Four methods, codes masked'),
      ok('The draft survives a reload', '/anfrage', '30 days, §20.1'),
      added(
        'Prioritise by deadline',
        '/admin/anfragen',
        'Every open request has a §4.1 deadline and a delay in days. Overdue ones sit at the top — the list used to be sorted by arrival, which made it a log rather than a queue',
      ),
      added(
        'Filter by status, service, area, period',
        '/admin/anfragen',
        'Status and area only, before',
      ),
      added(
        '"All" / "Overdue" tabs',
        '/admin/anfragen',
        'Was an "overdue only" toggle sitting among the filters, with its count in the results line underneath — the number and the switch that opens it were never on screen together. Both tabs carry their own count, and "nothing overdue" has an empty state of its own rather than claiming "no requests yet"',
      ),
      added(
        'Row actions',
        '/admin/anfragen',
        'Details, write a quote, decline, carry on with a draft or discard it — according to status. Every row used to lead to exactly one place',
      ),
      added(
        'The sequence is visible',
        '/admin/anfragen/req_1',
        'Received → In review → Quote sent → Answer, with timestamps. The same derivation on the customer side, so the two cannot answer differently',
      ),
      added(
        'The customer reads the same rail, under the same name',
        '/konto/anfragen/req_3',
        'It was a vertical list in the sidebar called «Verlauf» while the panel called it «Ablauf» — one derivation, two names and two shapes. Both screens now read it left to right across the top as «Fortschritt der Anfrage»',
      ),
      added(
        'Search your own requests, and filter them by status and service',
        '/konto/anfragen',
        'The account had two requests and both said «Offerte versendet», so nine declared states were reachable from the office side and none from the customer’s. It carries twenty now — one in each state, plus two years of settled history — and the same toolbar the queue has: reference, service or address in the search box, then the two menus',
      ),
    ],
    exits: [
      ok('Sent', '/anfrage/gesendet'),
      added(
        'Outside the area — never taken in at all',
        '/anfrage/objekt',
        'Used to be an exit: the request went out anyway, was flagged, and the refusal followed by hand a working day later. The check now stops at the postcode — on the wizard, in the phone form and in the store, so no URL gets round it',
      ),
      added(
        'Withdraw it',
        '/konto/anfragen/req_3',
        'cancelledByCustomer was declared, translated and coloured — and reachable from no screen',
      ),
      added(
        'Cancelled by us',
        '/admin/anfragen/req_3',
        'From "quote sent" onwards, "decline" is the wrong word. Closes the quote along with it',
      ),
      ok(
        'Decline with a reason',
        '/admin/anfragen/req_2?action=reject',
        '§4.1. A dialog over the list rather than a page of its own — the refusal is decided where the row is',
      ),
      open(
        'A collection outside the area costs something',
        'The second stop on an assembly job is recorded and shown, and it changes no number. §5.1 already answers a detour — past the free radius the job goes to manual review and the owner puts the travel on the quote by hand — so the screen says that instead of inventing a surcharge the pricing engine has no distance input for. Whether a collection should be priced automatically, and from what, is §5.1a on /open-questions',
      ),
      open(
        'Heavily soiled windows cost more',
        '«Der Zustand erfordert deutlich mehr Aufwand» adds an hour on the §5.2 matrix, and the matrix is not consulted for a service priced by count — so the checkbox was on the window-cleaning screen setting a flag that moved nothing. It is not shown there any more rather than made to work: what a filthy window is worth is a price decision, not a UI one. §21a on /open-questions',
      ),
    ],
  },
  {
    id: 'quote',
    en: 'Quote & payment',
    actors: ['owner', 'customer'],
    entries: [
      ok('Write a quote', '/admin/anfragen/req_2/offerte', 'Lines pre-filled from the request'),
      added(
        'Straight out of the phone intake',
        '/admin/anfragen/neu',
        '"Record it and write the quote" — the call often ends with both',
      ),
    ],
    actions: [
      added(
        'Read means read',
        '/admin/anfragen/req_2',
        'The status only moved to "in review" inside the quote builder — one screen too late. A request could be read from top to bottom while it stayed "New", and the customer went on seeing in their account that nobody had looked',
      ),
      ok('Edit the lines', '/admin/anfragen/req_2/offerte'),
      added(
        'The quote builder shows the figure the price rests on',
        '/admin/anfragen/req_acc_expired/offerte',
        'The summary card printed the flat’s measurements and nothing else. On the two services priced by count that now reads «Fläche —» — the size is not asked for because it is not priced — and the count that replaced it was on no screen the owner sees while setting the price. It is a row of its own now, and «Zimmer»/«Bäder» read «Räume»/«Toiletten» on an office job',
      ),
      added(
        'A collection address reaches the person who has to price it',
        '/admin/anfragen/req_acc_expired/offerte',
        '§5.1 puts travel beyond the free radius on the quote *by hand* — this is the hand. Without the second address on this card the rule the request flow states to the customer is one nobody here could follow. Shown with the «put it on the quote» line when it falls outside the eight municipalities',
      ),
      added(
        'And reaches the person who drives there',
        '/einsatz/bkg_acc_h4',
        'A `Booking` has no `requestId`, so the job reaches its collection stop through the quote it came from. The crew screen carries it above the tasks, with the floor, the lift and its own route link — the office knowing about a second stop is worth nothing if the van does not',
      ),
      ok('Optional lines on and off', '/offerte/off_1', 'Price and duration move together'),
      ok('Pick a date, held 15 minutes', '/offerte/off_1/termin'),
      added(
        'Read the contract and sign it',
        '/offerte/off_1/unterschrift',
        'The screen showed three key figures and a link to the terms. Three figures are something you check — what gets signed is a document, and it was nowhere: not on the screen, not in the account afterwards, and not on the owner’s copy either',
      ),
      added(
        'Homivaro signs first',
        '/admin/anfragen/req_1/offerte/senden',
        'The quote goes out signed and the customer’s signature closes the contract. Set from the settings on sending and copied onto the quote — a newly drawn signature never changes a contract that is already closed',
      ),
      added(
        'Store the signature',
        '/admin/einstellungen?tab=contract',
        'sendOffer was already reading the value; without this screen the application put a signature under every contract that the owner could neither see nor change',
      ),
      ok('Ask for a change', '/offerte/off_1/aenderung'),
      added(
        'Free slots: the five rules',
        '/admin/anfragen/req_2/offerte',
        'The block showed times without saying where they came from — "is the system choosing, or a person?" had no answer on screen. Opening hours and lead time read their values from the settings, so the text cannot drift away from the engine',
      ),
      added(
        'Insert a template, or send straight out',
        '/admin/rechnungen/inv_draft',
        'The picker only inserted, and left {name} standing, because nothing resolved the placeholders. They are resolved against the record on screen now — what resolves may go out with one click, what does not blocks direct sending. It is gone from /admin/nachrichten: a conversation there may be about a request, a quote or an invoice, and a picker that cannot tell them apart offers the wrong text as readily as the right one',
      ),
      added(
        'Templates in the quote builder',
        '/admin/anfragen/req_2/offerte',
        'Offered exactly one hard-wired option, which is why "quote expires" had no reachable path anywhere in the product. It reads the quotes area now',
      ),
      added(
        'Selectable line: pre-ticked or not',
        '/admin/anfragen/req_2/offerte',
        'The builder only ever wrote `optional`, never `selected` — so every selectable line went out pre-ticked. An extra could therefore only be a discount the customer takes away, never work they add',
      ),
      added(
        'Read the covering message before sending',
        '/admin/anfragen/req_2/offerte/senden',
        'The card was headed "this is what the customer sees" and left out the one part that is written by hand',
      ),
      added(
        'Propose three dates (first-time customer)',
        '/offerte/off_propose/termin',
        'Regulars book straight on — we know the property, the access and the history. On a first job the customer proposes up to three dates, and nothing is blocked while they sit unanswered',
      ),
      added(
        'Confirm the date',
        '/admin/offerten/off_propose',
        'The only step in this flow that sits with the owner. Holds the slot for 48 hours; without the card the quote looked as though it were with the customer',
      ),
      added(
        'Read the payment state',
        '/admin/offerten',
        'Read-only. The owner has neither a card to enter here nor anything to refund — the one thing missing was whether the money has arrived',
      ),
    ],
    exits: [
      added(
        'Take a refusal back',
        '/admin/anfragen/req_q_rejected',
        'Declining was a one-way street: "write a quote" switches itself off as soon as a request counts as answered, so exactly one action was left on the screen — decline it again. Applies only to our own refusal; if the customer declined the quote, the new version is the answer',
      ),
      ok('Paid and booked', '/offerte/off_1/bestaetigt'),
      ok('Payment failed', '/offerte/off_1/zahlung', 'The hold runs on, or runs out'),
      ok('Expired, reissue it', '/offerte/off_2'),
      added(
        'Decline the quote',
        '/offerte/off_1',
        'There was only accept or amend. A no became silence, and three weeks later "expired" — with no reason in the system. Releases the held time at once',
      ),
      added(
        'Booked without payment (package or plan)',
        '/offerte/off_pkg/zahlung',
        '§11.3 — hours already bought are not charged twice. The flow used to demand a card, charge the full amount, and leave the hours sitting untouched in the account',
      ),
      added(
        'On to the booking',
        '/admin/offerten/off_paid',
        'The quote → booking link was in the data and on no screen. "Did that ever get done?" used to start in the calendar',
      ),
    ],
  },
  {
    id: 'crm',
    en: 'Customers & properties',
    actors: ['owner'],
    entries: [
      added(
        'Add a customer',
        '/admin/kunden/neu',
        'A customer only ever came into being as a side effect of the wizard. On day one /admin/kunden was a list with no way to put anything into it',
      ),
      added('Add a property', '/admin/objekte', 'Outside a request — for addresses we know'),
      ok('Automatically, out of a request', '/anfrage/kontakt'),
      added(
        'Take in a key',
        '/admin/schluessel',
        'The form asked only for the property and listed every address the company has as "label — street". A key is handed over by a person who gives their name, though: the office had to translate that name into one of sixteen labels first, and two customers with a flat on the same street were a mis-pick that nothing afterwards would ever have caught. Customer first, then their properties',
      ),
    ],
    actions: [
      added(
        'Duplicate check on email and phone',
        '/admin/kunden/neu',
        'The same rule as in the wizard',
      ),
      ok('Internal notes', '/admin/kunden/cus_1'),
      ok(
        'Access and keys on the property',
        '/admin/objekte/prp_1',
        'Codes bound to role and date, §13.1',
      ),
      added(
        'Filter by status, search by storage place and person',
        '/admin/schluessel',
        '"Which keys are we holding right now?" meant reading every row and checking the badge. The register keeps returned entries permanently (§13.2), so the list grows away from the answer. It is the one list that is also searched backwards: somebody is standing at the cabinet with a tag reading "slot 3" and needs to know whose door it opens — so the storage place and the names on hand-over and return are searchable too, not just property and customer. Plus the result count every other admin list had through the `Toolbar` long ago',
      ),
      added(
        'Jump from the key to the property',
        '/admin/schluessel',
        'The row had exactly one control — "record a return" — and no way to the address the key belongs to. That is where every question about a key ends, though: whose door, which access, is there a job due there. The jump went via the sidebar and a search for the label read off here',
      ),
      added(
        'Edit a property',
        '/admin/objekte/prp_1/bearbeiten',
        'A property could be created and read, and nothing else. A house number taken down wrong then stood on every quote, every job sheet and every invoice at that address — lift, pets and extra effort were set to `false` on creation and had a switch nowhere',
      ),
      added(
        'Delete a property while nothing hangs off it',
        '/admin/objekte',
        'Seven record types point at a property, three of them with `!`. So only an address that has never been used is deleted; otherwise the menu entry names the number blocking it. In every scenario something hangs off every seeded property — the live state is therefore reachable through "add a property", which is also the only case where "delete" is honest. No archive flag: an address mistyped on the phone is a mistake, and a mistake you can only hide turns twelve properties into forty',
      ),
      open(
        'Reassign a property to another customer',
        'Deliberately not a field in the editor. Moving a property would leave bookings, quotes and invoices pointing at a customer who never had it — that is a merge, not an edit, and it needs a decision about what happens to the history',
      ),
      added(
        'Filter by property type and area, search by name',
        '/admin/objekte',
        'The list could be sorted by nothing and filtered by nothing. The property type did not even have a column, and the area lives solely in the postcode (§6)',
      ),
      added(
        'Last job and next date in the list',
        '/admin/objekte',
        '"When were we last there?" and "when are we back?" sat one click deep in the property history, per address — so people looked in the calendar instead. Both columns are derived from the bookings, and `noAccess` does not count as a job',
      ),
      ok('The history as one timeline', '/admin/kunden/cus_1'),
      added(
        'Edit the master record',
        '/admin/kunden/cus_1/bearbeiten',
        'The record could be created and read, and nothing else. A number mistyped on the phone stayed wrong — the only editable field was the internal note, which is precisely the field the customer never sees',
      ),
      added(
        'Set active / inactive',
        '/admin/kunden',
        'The column showed the status and nothing in the panel could write it — only the customer could, by closing their account',
      ),
      added(
        'Block and unblock',
        '/admin/kunden',
        '"They are gone" and "we do not serve them" were the same row. The block really bites: no quote from the builder, not selectable at intake, customer area shut',
      ),
      added(
        'Filter by status',
        '/admin/kunden',
        'The status column became a switch before it became a filter — "who have we blocked?" meant reading every row. Plus the result count every other admin list had through the `Toolbar` long ago',
      ),
      ok(
        'See, store and default a payment method',
        '/admin/kunden/cus_2',
        'The customer saw their cards on screen 45 and the owner nowhere — and on the phone it is the owner who gets asked, not the customer',
      ),
      added(
        'Put one on file, asking what that method actually needs',
        '/konto/zahlungsmittel',
        'The four buttons wrote a record on the click, labelled with the name of the method: every card saved came out as «Karte», so two of them were one row and the plan had no expiry to warn on. A card now asks for its four fields, TWINT for the number it is registered to, a wallet for the device it lives on — and the same fields serve screen 65, where three of the four used to be a free-text «Bezeichnung» the owner filled in themselves',
      ),
      added(
        'Refuse what cannot be a payment method',
        '/konto/zahlungsmittel',
        'A landline typed into TWINT, a month of 13, a card number four digits long. All three saved silently before — there was nothing to check, because nothing was asked. `13/28` got as far as the owner\'s dialog, which did check the shape and not the month',
      ),
      ok(
        'Remove a payment method',
        '/konto/zahlungsmittel',
        'By the customer themselves. They read a new one out over the phone; deleting one they do not — the payment method is theirs. Screen 65 says so where the button is missing, otherwise it looks like a forgotten control',
      ),
      added(
        'The customer’s invoices, with amount and payment route',
        '/admin/kunden/cus_2',
        'In the timeline an invoice was a row with a number: no amount, no payment state, no route. Details open in a dialog; changes still happen only on screen 72',
      ),
      added(
        'Search and filter the whole history',
        '/admin/kunden/cus_2/verlauf',
        'The record carried the entire timeline unfiltered. It carries the last five now and screen 65a the rest — with search, a type filter and a period. Quotes are newly in it: the history used to jump from the request straight to the booking',
      ),
    ],
    exits: [
      added(
        'Return a key',
        '/admin/schluessel',
        'The return was a button in the table: one click, status flipped, timestamp set, nothing asked — irreversible and without a prompt. The closed entry could therefore answer neither of the two questions ever asked about a key outside the cabinet: who carried it out, and who signed for it. Now a dialog with a date, both names and a note — and the entry stays in the register; it is never deleted',
      ),
      ok('Close the account', '/konto/profil', 'By the customer themselves'),
      added(
        'Archive and restore',
        '/admin/kunden',
        'Out of the working list, still in the records — with a tab of its own, because a soft delete you cannot look at anywhere is indistinguishable from a real one',
      ),
      added(
        'A method on file that says which one it is',
        '/konto/zahlungsmittel',
        'A card leaves its brand, its last four and its expiry — «Mastercard · 1234, gültig bis 03/31». The number, the name and the security code are read by the form and go no further: `SavedPaymentMethod` has nowhere to put them, and a prototype that models a stored PAN is one somebody builds for real',
      ),
      open(
        'Confirm a wallet in the wallet',
        'Apple Pay and Google Pay are a sheet on the device, and a web prototype cannot open one. The form therefore asks for the device instead — which is the one fact a saved wallet token actually carries, and the thing that tells a customer\'s two wallet entries apart — and says on the form that this is what it is standing in for. Whether a wallet is even worth keeping *on file*, as opposed to being tapped fresh at each checkout, is the question underneath; see §11.4a on /open-questions',
      ),
      open(
        'Pay a quote with a method already on file',
        'The checkout on /offerte/[id]/zahlung still draws its own card fields, and they collect nothing — no state, no validation, no record. It never offers the card the customer has already saved either, so somebody with a Visa on file types it again to pay. Left alone in this pass because it is a *charge*, not a save: what it needs is a payment against an offer, and that is the money flow rather than this one',
      ),
      open(
        'Delete a customer for good (revDSG)',
        'The archive is deliberately not a delete. Invoices hang off the record (§15) and three admin screens dereference `customerId` with `!`. What revDSG requires for a customer who has invoices needs settling before the button is built',
      ),
    ],
  },
  {
    id: 'job',
    en: 'The job itself',
    actors: ['owner', 'contractor'],
    entries: [
      ok('From a paid quote', '/admin/kalender'),
      added(
        'Enter one by hand',
        '/admin/kalender/neu',
        'A booking came exclusively from a paid quote. The job that comes together on the phone — the way this business gets work — had no path into the calendar, and /admin/buchungen had been printing the source "manual" since day one for a record that nothing could produce',
      ),
      added(
        'Bookings as a list',
        '/admin/buchungen',
        'The booking was the one large entity without a list of its own. The calendar answers "what is on on Tuesday" — not "which jobs come out of quotes", not "which finished job still has no invoice"',
      ),
      ok('Today’s jobs', '/einsatz', 'Role "team member"'),
      added(
        'Read the day as a different contractor',
        '/einsatz',
        'The demo bar picked the first contractor in the data and offered no way to pick another. With two on the roster and the office able to hand a job to either, assigning one to Yusuf and switching role landed you in Marta\'s day with the job you had just created nowhere on it',
      ),
    ],
    actions: [
      ok('Reschedule', '/admin/buchungen/bkg_1'),
      added(
        'Hand the job to somebody, and take it back',
        '/admin/buchungen/bkg_plan_2?action=assign',
        'This row used to read "Assign and reschedule" and only half of it was true: `assigneeId` was written when a booking was created and no screen could change it afterwards, while the field app filtered a contractor\'s entire day on that one field. The panel warns rather than refuses — not cleared for the service, outside the area, already at another address that hour — because the office knows things the record does not. B-1058 is the seeded job nobody has picked up',
      ),
      added(
        'Find the jobs nobody is doing',
        '/admin/buchungen',
        'The «Ausführung» column and its filter. "What is on Marta\'s week" meant opening every row; "what has nobody yet" was not a question the list could be asked at all',
      ),
      added(
        'Act straight from the calendar',
        '/admin/kalender',
        'Rescheduling, assigning and cancelling all sat behind opening the job. The row menu jumps into the same view with the right field open — a confirmation inside a dropdown would be a dialog in a menu, and a second implementation of "cancel" would disagree with the first inside a wave',
      ),
      added(
        'Legend and colour by state',
        '/admin/kalender',
        'Week and month drew every entry in the same accent colour — a cancelled job and a confirmed one looked alike. The colours come from the status registry, and the legend reads the same source',
      ),
      ok('Check in and out with photos', '/einsatz/bkg_1/check'),
      ok(
        'Access codes only on the day',
        '/einsatz/bkg_1',
        'Move the demo clock — the block really does empty',
      ),
      added(
        'Record the hours worked',
        '/einsatz/bkg_1/check',
        'Check-out asked for the *extra* hours, which made the person in the stairwell subtract the estimate from their own afternoon — and the number the office approves, how long the job took, was never stored at all: it went into the timeline label as a phrase. The field opens on the reading since check-in, the overrun is derived, and the contractor can still correct it until the office accepts the job',
      ),
      ok(
        'Approve the reported time',
        '/admin/buchungen/bkg_7',
        '§5.3 splits the process: the person doing the work reports it, the office judges it. The banner now prints the hours it is asking about instead of pointing at the history',
      ),
      added(
        'Correct the hours from the office',
        '/admin/buchungen/bkg_7',
        'The contractor has gone home and typed 5 for 5.5. Open until an invoice exists, and the timeline says which of the two wrote the number',
      ),
    ],
    exits: [
      ok('Approved and billable', '/admin/buchungen/bkg_7'),
      ok('No access, with waiting time and a photo', '/einsatz/bkg_1/kein-zutritt'),
      ok('Cancelled', '/admin/buchungen/bkg_1'),
      ok('Invoiced', '/admin/rechnungen'),
      open(
        'Bill the overrun',
        'The office can see that a job ran an hour and a half long and can approve it. Turning that into money is still a manual invoice line — nothing carries `varianceMinutes` into the invoice builder, and what the surcharge *is* has never been settled: the hourly rate, a different rate for unplanned time, or nothing at all when the estimate was ours. See §5.3a on /open-questions',
      ),
    ],
  },
  {
    /*
     * New. The calendar held bookings and nothing else, and a booking came
     * only from a paid quote — everything that makes up a small firm's day
     * fell between the two. "Promised a callback" appeared twice in the seed,
     * in a note field, with no date and findable on no screen.
     */
    id: 'calls',
    en: 'Calls & appointments',
    actors: ['owner'],
    entries: [
      added(
        'Put an appointment in',
        '/admin/kalender/neu',
        'One button, two things: a job or a call. From the owner’s side it is one thought — something is happening that day',
      ),
      added(
        'Without a customer record',
        '/admin/kalender/neu',
        'Somebody who has rung once is not a customer. A name and a telephone number are enough — otherwise /admin/kunden fills up with people who have booked nothing',
      ),
    ],
    actions: [
      added(
        'Record the outcome',
        '/admin/kalender/cev_today',
        'The note is what was meant to be asked; the outcome is what was said — and it is exactly that text which has to carry over into the request when work comes of it',
      ),
      added(
        'A viewing blocks time, a call does not',
        '/admin/kalender',
        'A viewing is somewhere, a phone call is anywhere. Only the first collides with a job. Neither counts against the two jobs a day — see /open-questions',
      ),
    ],
    exits: [
      added(
        'It turned into a request',
        '/admin/kalender/cev_converted',
        'The whole point. Without this path a good conversation ends as a ticked-off calendar entry, and the same details get typed again from memory one screen away',
      ),
      added(
        'Done',
        '/admin/kalender/cev_today',
        'With the outcome in the history, with a timestamp',
      ),
      added(
        'Nobody reached',
        '/admin/kalender/cev_noreply',
        'Explicitly not "done". Otherwise a week of unanswered calls reads like a week of finished work',
      ),
      added(
        'Called off',
        '/admin/kalender',
        'Disappears from the calendar, stays in the record',
      ),
    ],
  },
  {
    id: 'money',
    en: 'Invoices & plans',
    actors: ['owner', 'customer'],
    entries: [
      ok('Invoice from a job', '/admin/rechnungen/neu'),
      added(
        'Raise an invoice by hand',
        '/admin/rechnungen/neu',
        'The job was the only way in, so everything else this firm bills for — travel, materials, a correction after a complaint — had no path into the app at all. That got written in the accounting system, and so a customer ends up holding an invoice the app has never heard of. The job is a field on the form now, rather than the door',
      ),
      added(
        'Book somebody’s hours to a job',
        '/admin/ausgaben/neu?kategorie=arbeitszeit',
        'Wages were one lump a month with a person’s name typed into the supplier box — no job, no hours, no rate — so the largest cost in a cleaning company was the one nothing could be asked about. «Wie viele Stunden hat Marta im März gemacht» was a phone call, and «was hat dieser Umzug an Leuten gekostet» had no answer at all: the job knew its price, the month knew its payroll, and nothing joined the two. «Arbeitszeit» is one person on one job and carries the four facts that make it a record — who worked, how long, whose money settled it, who carries it. «Löhne» stays, for the payout that really does have nothing behind it',
      ),
      added(
        'Start from the job, with the job already filled in',
        '/admin/buchungen/bkg_9',
        'The booking screen said what a job was worth and could never say what it took to do, so the subtraction stopped one step short on the one screen where both halves belong. «Arbeitszeit erfassen» opens the form on that job and on the hours the check-in and check-out already recorded — offered rather than written, because somebody who forgets to check out would otherwise book an eleven-hour day',
      ),
      added(
        'Record a cost',
        '/admin/ausgaben/neu',
        'Half of the money had no entity at all. `invoices` said what came in and nothing said what went out, so the question this section is opened to ask — what is left at the end of the month — was answered in a banking app from memory. A supplier bill is open when it is entered and settled in its own step, so the payment route can never be skipped on the way in',
      ),
    ],
    actions: [
      ok('Change the lines in a draft', '/admin/rechnungen/inv_draft'),
      ok('Send, record as paid, cancel', '/admin/rechnungen/inv_draft'),
      added(
        'Name the payment route when recording it',
        '/admin/rechnungen/inv_paid',
        '"Mark as paid" wrote the status and nothing else — no `Payment`, so nowhere said how the money had arrived. `PaymentMethod` did not even know the two routes an invoice actually comes back by here: QR-bill and cash',
      ),
      added(
        'Quantity per line, up and down',
        '/admin/rechnungen/inv_draft',
        '"Bill an hour less" meant: select the cell, retype the number. At a desk that is fine; on a phone it is a numeric keypad over a table — for a change that is almost always ±1',
      ),
      added(
        'Search and filter by status',
        '/admin/rechnungen',
        'The list was six columns with no search and no filter. The QR reference is searchable too, because that is the number on the bank statement — "which invoice does this payment belong to" could not be answered at all before. "Outstanding" stands beside the five statuses because it is the question behind them and none of them',
      ),
      added(
        'Act straight from the row',
        '/admin/rechnungen',
        'Every row could do exactly one thing: open itself. Releasing, cancelling and deleting all meant opening first — which is why there was a bulk release by checkbox, a mass action standing in for the missing row actions. What a row cannot do stays in the menu and carries the reason instead of the name',
      ),
      added(
        'Cancelling and deleting ask first',
        '/admin/rechnungen',
        'Deleting asked with `window.confirm` — the browser’s box, with "OK" and "Cancel" on it in the browser’s language rather than the page’s, and no room for a reason. Cancelling asked with a panel that opened right at the bottom of the page, below the QR-bill and the message field. Both are the same dialog now, and the same dialog stands behind every delete and decline in the panel',
      ),
      added(
        'No changes after release',
        '/admin/rechnungen/inv_sent',
        'Was stated nowhere. The draft editor did lock itself, but did not say what to do instead — now there is "cancel and re-create": the old invoice is cancelled, a draft opens with the same lines, and both documents point at each other',
      ),
      added(
        'Read the two sides together',
        '/admin/finanzen',
        'Revenue and costs are counted by the month the work happened in, not the month the money moved — one rule applied to both, because counting revenue on the payment date and costs on the invoice date puts the income and the cost of one job in different months and makes every monthly figure wrong in a way that averages out to right. The consequence is on the screen rather than hidden: revenue includes bills nobody has paid, so "outstanding" is its own tile beside it',
      ),
      added(
        'Take the list away with you',
        '/admin/rechnungen',
        'The lists were readable and never portable, so the hand-off to the bookkeeper was a screenshot or a phone call. Both download what the filters left, not everything in the store — an export that ignores the toolbar above it is only discovered to be wrong after the file is opened. CSV rather than the app’s own PDF writer, which is one page and does not paginate: the rows that fell off the bottom would go silently',
      ),
      added(
        'Settle a cost, and say how',
        '/admin/ausgaben',
        'The same dialog an invoice is settled with, in the other direction. The route is required for the same reason: "paid" with nothing saying how is the half of the fact nobody can look up afterwards. It is one component now rather than one per screen, because the workforce board settles the same records — and two copies of that rule is one copy that eventually loses it',
      ),
      added(
        'Read the hours as hours',
        '/admin/ausgaben/arbeitszeit',
        'Three tables and three questions: every entry as the chain it is, the same hours by person — who worked how much and who is still owed — and by job, which is the only place a crew is visible at all. A booking carries one `assigneeId` and a Saturday carries two people, so the second pair of hands exists nowhere else in the app. It reads the same month window the analytics screen does, so the labour figure on the two screens cannot disagree',
      ),
      added(
        'Narrow the costs to one person',
        '/admin/ausgaben',
        'The expense list could be narrowed by heading and by state and never by who. A person is a labour fact, so the filter drops everything else by construction — the honest answer to «was hat Marta gekostet», rather than a list that also carries the month’s diesel. The job a cost belongs to is a column now, and searchable: `bookingId` had been on the record since the day it was written and appeared on no screen, so an attribution made in the form was made where nobody could see it',
      ),
      added(
        'Read one person’s hours from their own page',
        '/admin/benutzer/tm_marta',
        'H7 — U2 now — looked forward and only forward — the diary of what somebody is booked for. What they had actually worked, and whether they had been paid for it, sat in the expenses under a name typed into a supplier box, reachable from here only through the search box',
      ),
    ],
    exits: [
      ok('Paid', '/konto/rechnungen/inv_paid'),
      ok('Cancelled with a reason', '/admin/rechnungen/inv_draft'),
      ok(
        'Overdue',
        '/konto/rechnungen/inv_paid',
        'Derived from the due date on reading, not stored — rightly so, otherwise it would need a nightly run',
      ),
      open(
        'Refund',
        'Deliberately pushed to the next wave. Until now it was not buildable at all: a paid invoice had no `Payment` record, so there was nothing a refund could refer to. That exists as of this wave — `refunded` is in `PaymentStatus` and in the status colour table, and the quotes page already shows it for a quote payment. For an invoice, no button leads there yet',
      ),
      added(
        'Draft deleted',
        '/admin/rechnungen',
        '§15 keeps everything that has been with a customer — a draft has been with nobody. Carrying it forever as "cancelled" buries the real cancellations under paperwork. Drafts only, and the store checks that again itself',
      ),
      added(
        'Hours settled',
        '/admin/ausgaben/arbeitszeit',
        'Open → paid from the board itself, with the route recorded, so hours that can be *seen* to be unpaid do not send the reader to a second list to press the button. The «noch nicht ausbezahlt» tile is the number that closes',
      ),
      added(
        'A cost settled',
        '/admin/ausgaben',
        'Open → paid, with the route recorded. The third state — overdue — is derived from the due date rather than stored, for the reason the invoice side gives: writing it down would need a nightly sweep to stay true',
      ),
      added(
        'A cost deleted',
        '/admin/ausgaben',
        'At any status, which is where it parts company with an invoice. §15 keeps a released invoice because somebody outside the company is holding a copy; nobody has ever been handed one of these — it is the office’s own note of a bill it received, and one entered twice is clerical noise rather than a document. The change-log entry outlives the record, so a cost vanishing out of a month somebody has read the profit for can still be accounted for',
      ),
      open(
        'Hours that arrive on their own',
        'The check-in and check-out on a booking are real stamps and the form now offers them — but somebody still has to open the form, pick the person and type an amount, once per pair of hands per job. That is fine for a company of three and it is not a timesheet. What it needs first is a decision rather than code: does a finished job raise its own labour entry for the office to price, or is a reminder that a job has no hours against it the honest version. The second is less machinery and does not put a cost into the accounts that nobody has looked at. On /open-questions',
      ),
      open(
        'A rate somebody agreed to',
        'The hourly rate on this board is a division — the amount typed over the hours typed — and there is no rate card behind it. So two entries for the same person in the same week can carry different rates with nothing saying which is right, and «what do we pay Marta» is not answerable from the app. A rate on `TeamMember` would fix the arithmetic and raise the question that has to be answered first: whether the rate belongs to the person, to the service, or to the contract',
      ),
      open(
        'A cost that recurs on its own',
        'The rent, the insurance and the subscriptions carry a `recurring` flag, and the analytics read it — «was läuft weiter, auch wenn der Monat leer ist». Nothing writes next month’s copy. A `RecurringExpense` with no engine behind it would be a record promising an automation the app does not have, and the honest version needs a decision first: does the office want next month raised automatically, or a reminder that it is due. On /open-questions',
      ),
      open(
        'VAT',
        'Every expense is stored gross, and the analytics add gross figures. The company is under the CHF 100 000 threshold and its own invoices carry «Keine MwSt.», so there is nothing to reclaim and a net/VAT split would model a deduction that cannot be made. It becomes wrong the day the threshold is crossed, which is a business event rather than a missing screen',
      ),
      added(
        'Cancelled and replaced',
        '/admin/rechnungen/inv_sent',
        'Cancelled used to be a dead end: the job stayed on `invoiced`, and the billable list is "completed jobs without an invoice" — so an invoice raised wrongly made its job permanently unbillable. A cancellation gives the job back now',
      ),
      added(
        'Refunded',
        '/admin/abos/pln_basic/sub_2',
        'Was deliberately open — there was no payment record a refund could have referred to. Cancelling a plan inside the withdrawal period now creates a payment with status "refunded" and cancels the invoice with it. For an invoice out of a job, no button leads there yet',
      ),
    ],
  },
  {
    /*
     * Plans were two rows in the money flow and neither was true any more.
     * The reason: a plan was not a thing. `PlanTier` was three string
     * literals, so there was nothing to create, nothing to edit, nothing to
     * withdraw — and the path by which a customer actually gets a plan was
     * simply not wired up.
     */
    id: 'plans',
    en: 'Plans',
    actors: ['visitor', 'customer', 'owner'],
    entries: [
      added('Create a plan', '/admin/abos/neu', 'There was no entity, so there was no creating'),
      added('Edit a plan', '/admin/abos/pln_basic/bearbeiten'),
      ok('The plans page on the website', '/abos'),
      added(
        'Bought from the account itself',
        '/konto/abo',
        'Every route to a plan led out of the account: the empty state to the marketing page, the marketing page into the six-step request wizard — for somebody whose address and card are both already on file. The catalogue is on the plan screen now and the purchase is three answers: which address, which saved method, confirm',
      ),
      added(
        'A plan out of a paid quote',
        '/admin/abos/pln_basic',
        'The real break: a visitor picks a plan, the wish lands on the request, the discount on the quote — and then nobody created a plan. Anyone who took one out on the website had none afterwards',
      ),
    ],
    actions: [
      added(
        'Take it off sale',
        '/admin/abos',
        'Existing plans run on. A year already paid for cannot be withdrawn retrospectively',
      ),
      added(
        'Take it off the website',
        '/admin/abos/pln_buero',
        'Two switches, not one: sell it by telephone before it is announced — and stop advertising it while the existing customers go on using it',
      ),
      added(
        'Count the visits',
        '/admin/abos/pln_basic/sub_2',
        'A plan used to cover everything it touched for a year. A visit is counted on approval, and after that it is gone',
      ),
      added(
        'Skip a visit',
        '/konto/abo',
        'It worked and said nothing about what it does. The section carried only the allowance, so nothing told the customer that the visit is not deducted, that a booking gets cancelled, or which one — and this is the only control in the account that calls off a job. It also offered itself with nothing scheduled, which spent a free skip on a visit that did not exist',
      ),
      added(
        'Compare every plan without leaving the account',
        '/konto/abo',
        'The screen was a receipt: what was bought, nothing about what else is sold. The catalogue below it is the marketing page comparison, same rows, with the reader own column marked — and the cards read stacked or side by side',
      ),
      added('Pause and resume', '/admin/abos/pln_basic/sub_2'),
    ],
    exits: [
      added(
        'Expired',
        '/admin/abos/pln_vip/sub_s_expired',
        'Derived from the end date on reading, not stored — otherwise it would need a nightly run. Unused visits are named, not passed over in silence',
      ),
      added(
        'Renewed',
        '/admin/abos/pln_basic/sub_2',
        'New invoice, visits reset, counter up by one. Deliberately not automatic: nothing here charges on a cycle',
      ),
      added(
        'Cancelled and refunded',
        '/admin/abos/pln_basic/sub_2',
        'Only while no visit has taken place and the withdrawal period is still running. The rule lives in the store, not just in the disabled button — otherwise a URL gets round it',
      ),
      added(
        'Moved up a plan',
        '/konto/abo',
        'The old exit was a row of links to /kontakt?abo=<id> — a contact form that never read the parameter, so the plan the customer picked was lost on arrival. It is the same subscription now: new package, term restarted, visits reset, and an invoice carrying the credit as its own line. The credit is the unused visits at what they paid per visit on the old plan — arithmetic off their own receipt, not a rate we chose, but §21.7 is still open on whether the business credits them at all',
      ),
      open(
        'Move down a plan',
        '§21.7 puts a downgrade at the next term, and nothing here schedules a change for a future date — the store applies what it is told immediately. Building it would mean a pending change on the subscription, which is a second thing that has to be true at midnight and the prototype has no nightly run. The screen says so and names the office',
      ),
      open(
        'Skip beyond the free allowance',
        'The plans FAQ says a further cancellation counts as a delivered visit, and no code path spends a visit that way. So the button is simply absent once the month allowance is gone and the copy sends the customer to the office. Building it means deciding whether a customer may spend a package visit on a cancellation without anybody being there — a business decision, not a screen',
      ),
    ],
  },
  {
    /* The one screen both sides write to — and until now the one without a row
       of its own on this board. Screen 48 stood on /screens as built while for
       months nothing in the panel read the messages at all: exactly the case
       this second table exists for. */
    id: 'messages',
    en: 'The conversation',
    actors: ['owner', 'customer'],
    entries: [
      ok('The customer writes about a reference', '/konto/nachrichten'),
      ok('The owner opens a conversation', '/admin/nachrichten'),
      ok(
        'Out of an invoice',
        '/admin/rechnungen/inv_draft',
        'The covering message lands in the invoice’s thread, not in a second filing place',
      ),
    ],
    actions: [
      ok('Reply', '/admin/nachrichten'),
      added(
        'Attach a file or an image',
        '/admin/nachrichten',
        'The quote, the price list, the photo of the conservatory — everything a reply referred to had to travel alongside by email. Not a `Photo`: an attachment is addressed to a named customer, so the consent question from §20.6 is already answered by sending it, and a PDF would not fit in one anyway',
      ),
      added(
        'Filter by read, unread and period',
        '/admin/nachrichten',
        'A single chip read "unread" and was in fact measuring "the customer wrote last". The two are separated now: `readByAdmin` says what nobody has looked at, and who wrote last says what still owes an answer',
      ),
      ok(
        'Mark a conversation as read',
        '/admin/nachrichten',
        'By opening it. A button for that would be a button for something the click before it has already said',
      ),
    ],
    exits: [
      ok('The reply is in the customer’s account', '/konto/nachrichten'),
      ok('On into the customer record', '/admin/kunden/cus_2'),
      open(
        'The customer attaches something themselves',
        'Only the owner can attach. What a customer uploads comes from outside — storage, a size limit and virus scanning are real questions then, and §22 answers none of them. Screen 20 still takes photos with a request; the framing there is settled',
      ),
      open(
        'Close or archive a conversation',
        'A thread ends today by nobody writing any more. Whether a finished conversation should drop out of the list — and what then happens to a later reply from the customer — is not decided',
      ),
    ],
  },
  {
    id: 'templates',
    en: 'Message templates',
    actors: ['owner'],
    entries: [
      ok('Template overview', '/admin/vorlagen'),
      added(
        'New template',
        '/admin/vorlagen/neu',
        'The eleven templates were a closed union type. Creating a twelfth was not unbuilt but impossible — and "pricing list" from the brief therefore had nowhere to go',
      ),
      added(
        'Out of a picker',
        '/admin/rechnungen',
        'Every picker links to the management screen, so "this template is no good" ends where you change it',
      ),
    ],
    actions: [
      added(
        'Search and filter',
        '/admin/vorlagen',
        'At eleven rows a convenience; at thirty the only way to find anything',
      ),
      added('Edit in four languages', '/admin/vorlagen/tpl_offer_sent'),
      added(
        'Set the default template',
        '/admin/vorlagen',
        'One occasion can have several templates. Which one goes out automatically is a decision — it is set, not guessed',
      ),
      added(
        'Delete with a prompt',
        '/admin/vorlagen',
        'Three different prompts, according to what could break: an ordinary one, one that asks for the successor, and one that says the original text will be restored',
      ),
    ],
    exits: [
      added(
        'The template stands in the pickers',
        '/admin/rechnungen/inv_draft',
        'A template’s area decides which picker offers it — the same table that fills the usage list in the editor',
      ),
      added(
        'The template goes out automatically',
        '/admin/vorlagen',
        'Only with an occasion, and only as the default. Without an occasion it can be chosen by hand alone',
      ),
      added(
        'Deleted — the occasion still sends',
        '/admin/vorlagen',
        'The one assurance that constrains deleting: an occasion is never left without text. Deleting the last template brings the original back',
      ),
      open(
        'Automatic sending itself',
        'There is no job that sends "quote expires" on the expiry date. The prototype has no scheduler, and claiming one would mean showing behaviour that does not exist — the templates are there and can be sent by hand',
      ),
    ],
  },
  {
    id: 'catalogue',
    en: 'Service catalogue',
    actors: ['owner'],
    entries: [
      ok('Catalogue overview', '/admin/leistungen'),
      added(
        'New service',
        '/admin/leistungen/neu',
        'The catalogue was as long as the seed had written it. Offering an eighth service was not an unbuilt screen but a deploy',
      ),
      added(
        'Search and filter',
        '/admin/leistungen',
        'At seven rows, a convenience. As soon as the catalogue can be extended it is the only way to find a service — and the only way to see every draft at once',
      ),
    ],
    actions: [
      added(
        'Look at the details without changing anything',
        '/admin/leistungen/grundreinigung/details',
        'The editor saves on every keystroke. Looking up how a service is billed must not happen there — and a screen of its own has an address you can send to somebody',
      ),
      ok('Edit in four languages', '/admin/leistungen/grundreinigung'),
      added(
        'Edit the short description',
        '/admin/leistungen/grundreinigung',
        '`short` stands on every service page and in every tile on the home page — and stood on no screen. The first sentence a customer reads was the only one the owner could not change',
      ),
      added(
        'Choose how it is billed',
        '/admin/leistungen/grundreinigung',
        'Per hour, per unit or flat. `calc` was a three-way union that only the seed could set — and the list rendered it with a two-way ternary',
      ),
      added(
        'Put on sale and withdraw, with a prompt',
        '/admin/leistungen',
        'A switch in a column of its own, so the state is readable without opening — but it does not act on the click; it opens the prompt. Both directions change what a customer sees',
      ),
    ],
    exits: [
      added(
        'Filed as a draft',
        '/admin/leistungen/neu',
        'Appears nowhere but in the catalogue. This state did not exist before: `active` was a boolean, and "not finished yet" and "withdrawn" were the same row',
      ),
      added(
        'On sale — stands in the request flow',
        '/anfrage/leistung',
        'Website, price list, request flow and sitemap.xml now all read the same function, so "on sale" means the same thing everywhere',
      ),
      added(
        'Withdrawn — its own URL stops answering too',
        '/admin/leistungen',
        '/leistungen/[slug] used to serve every service; only the menus were filtered. Withdrawing therefore meant: disappear from the navigation and stay bookable',
      ),
      open(
        'Putting on sale takes effect on the marketing pages at once',
        'The request flow reads the catalogue from the store and follows immediately. /leistungen, /preise, the home page and the footer are rendered statically from the seed — they follow at the next build. That is the boundary of a prototype without a backend, not a missing screen, and the copy in the panel now says as much',
      ),
      added(
        'Deleted — or refused with a reason',
        '/admin/leistungen',
        'Refused as soon as a request, a job or a plan points at it. The prompt names the number and suggests withdrawing, instead of only saying "no"',
      ),
      open(
        'Change the order on the website',
        '`order` decides how the services stand on the home page and under /leistungen. New services land at the end, and there is no screen that reorders the existing seven — drag-and-drop in the list would be the sensible thing, and that is more than this wave can close',
      ),
      open(
        'Choose an icon per service',
        'The seven seeded services have a fixed icon in the code. One created here gets the fallback glyph — no longer a crash, but no choice either. It is on /open-questions',
      ),
    ],
  },
  {
    id: 'addons',
    en: 'Add-ons',
    actors: ['owner'],
    entries: [
      ok('The list of add-ons', '/admin/zusatzleistungen'),
      added(
        'New add-on',
        '/admin/zusatzleistungen/neu',
        'What a customer can buy on top stood in the seed. "We shampoo carpets now, sixty francs" was a deploy — the same channel as the service catalogue, one level down',
      ),
      added(
        'Filter by service',
        '/admin/zusatzleistungen',
        '"What can you add to a move-out clean" could only be answered by reading the "applies to" column row by row',
      ),
    ],
    actions: [
      added(
        'Edit name and short description in four languages',
        '/admin/zusatzleistungen/fenster',
        'The customer reads both texts in the "extras" step. Neither could be changed — the list displayed them and nothing else',
      ),
      added(
        'Change price and time needed',
        '/admin/zusatzleistungen/fenster',
        'Side by side, each with a hint saying where the two numbers go. The price is billed, the time only scheduled — billing both would mean 45 francs for the windows plus 24.50 for the half hour',
      ),
      added(
        'Decide which services it appears under',
        '/admin/zusatzleistungen/fenster',
        '`services` was a field only the seed could write. Which extras belong to which service was therefore fixed at build time',
      ),
      added(
        'Switch available and hide',
        '/admin/zusatzleistungen',
        'A switch rather than a checkbox, in a column that says what it does. The checkbox sat under "status" — a control under a word that reads like a description. It applies at once and the same click takes it back',
      ),
    ],
    exits: [
      added(
        'Saved hidden',
        '/admin/zusatzleistungen/neu',
        'Appears only in the panel. The price can be argued over for a day without a half-finished offer standing in the live request flow',
      ),
      added(
        'Offered — stands in the "extras" step',
        '/anfrage/extras',
        'The request flow reads the store and follows immediately',
      ),
      added(
        'Deleted — or refused with a reason',
        '/admin/zusatzleistungen',
        'Refused as soon as a request or a quote line points at it. A line remembers the slug: if the record disappears, an invoice already sent reads "backofen" instead of "Backofen"',
      ),
      added(
        'Switched on and unreachable anyway — flagged as such',
        '/admin/zusatzleistungen',
        'Hung off nothing, or only off services that are not on sale. The badge said "available" in green, and no customer could see it',
      ),
      open(
        'An add-on on a plan-covered visit',
        'A job covered by a plan is never quoted — "payment not due". If the customer picks an add-on there, it is therefore free. Whether an add-on on a package visit is billed separately, included in the package, or not offered at all is a business decision; see §11a on /open-questions',
      ),
      open(
        'On the service page of the website',
        '/leistungen/[slug] shows the add-ons from the seed, because the page is built statically — one created here appears at the next deploy. The same boundary as the service catalogue, not a missing screen. At least the page no longer shows hidden ones',
      ),
    ],
  },
  {
    id: 'coupons',
    en: 'Coupons',
    actors: ['owner'],
    entries: [
      added(
        'The list of coupons',
        '/admin/gutscheine',
        'The list was empty in every scenario, and the empty state declared that to be the intention. The only way to screen 77 was therefore "create a coupon" — opening an existing one was simply not possible',
      ),
      ok('New coupon', '/admin/gutscheine/neu'),
      added(
        'Open an existing coupon',
        '/admin/gutscheine/cpn_1',
        'Five codes in the seed, one per state. The edit form had never been opened against a record with values in it',
      ),
      added(
        'Search by code or service',
        '/admin/gutscheine',
        '"We have WELCOME10 here" is the whole question when somebody rings up, and it meant reading the table. The slug is searchable beside the service name, because a quote line stores the slug rather than the name',
      ),
      added(
        'Filter by state',
        '/admin/gutscheine',
        'On the derived state, not on the `active` field. Filtering the raw boolean would file SPRING25 — switched on, expired four months ago — under "valid", which is the exact wrong answer the badge was rewritten to stop giving',
      ),
    ],
    actions: [
      added(
        'Change code, kind and value — and only then save',
        '/admin/gutscheine/cpn_1',
        'Every field wrote to the store on every keystroke, and only when editing. Anyone who opened WELCOME10 to check its ceiling had changed it by tabbing through; clearing the code to retype it saved a coupon with no code',
      ),
      added(
        'Catch a duplicate code',
        '/admin/gutscheine/cpn_1',
        'A redemption resolves by code — two identical codes silently give one campaign the other’s ceiling. It could not be checked while every keystroke was the save: every prefix of an existing code is a duplicate on its way there',
      ),
      added(
        'Catch an end date before the start date',
        '/admin/gutscheine/cpn_1',
        'Produced a coupon that is never valid and stood in the list as "valid" regardless',
      ),
      added(
        'Cap what a percentage may take off',
        '/admin/gutscheine/cpn_1',
        'The floor — a minimum order — has been on this screen since the beginning; the ceiling had no field at all, so 10% took CHF 25 off a small flat and CHF 180 off a move-out clean with the windows, on a code that goes out with every first quote. The third box appears only on a percentage: a fixed amount is already its own ceiling, and a box that can only be filled with the answer above it teaches the reader to skip the form. The list prints the cap under the figure, so it is not a fact you have to open a record to learn',
      ),
      ok(
        'Restrict it to individual services',
        '/admin/gutscheine/cpn_1',
        'None ticked means: applies to all. It is in the list now too, in a column of its own — before, a code for the whole catalogue and one for windows only looked identical',
      ),
      added(
        'Switch a code on or off from the list',
        '/admin/gutscheine',
        'The one control on either coupon screen that writes on the click, and the reason the split exists: here the flip is the whole action and the same click takes it back. On screen 77 the same field waits in the draft beside a half-typed code, where applying it alone would publish one decision out of a record the reader can still see is unfinished. Logged in the Protokoll, because pulling a printed code is what that screen is for',
      ),
      added(
        'Discard instead of saving',
        '/admin/gutscheine/cpn_1',
        'There was no way out of a change. Nothing was staged, so nothing could be abandoned — the back link left the change standing',
      ),
    ],
    exits: [
      ok('Saved — stands in the list', '/admin/gutscheine'),
      added(
        'Switched off',
        '/admin/gutscheine/cpn_4',
        'From the list it applies at once; from the edit screen it waits for the button with everything else. Two saving models for one field, and the difference is what else is in flight beside it',
      ),
      added(
        'Fully redeemed — ceiling reached, window still open',
        '/admin/gutscheine',
        'The only one of the five states in a warning colour. Customers are typing in a code today that the office believes is running; before, expired, fully redeemed and disabled shared one grey badge',
      ),
      added(
        'Expired — without anybody switching anything off',
        '/admin/gutscheine',
        'Read from the data, not from `active`. SPRING25 stands at "active" to this day and has been over for four months',
      ),
      added(
        'Starts later — created, but not valid yet',
        '/admin/gutscheine',
        'The state that did not exist: a code for a campaign in three weeks read as "valid" today. Precisely the question this screen exists to answer',
      ),
      open(
        'Redeem a coupon',
        '`pricing.ts` has been able to do both since §20.2 — percent and amount, and it never stacks with the plan discount. It respects the new ceiling as of this wave, and `couponDiscount` in `lib/coupon-facts.ts` applies floor, percentage and ceiling in one place so the engine and the form cannot disagree. Only, no screen ever hands it one: the request flow has no code field, so `usedCount` moves nowhere and the redemption figures in the seed are history rather than bookkeeping. Deliberately open — whether the code is entered in the wizard, on the quote or only at payment decides where the discount goes on record; see §9.4a on /open-questions',
      ),
      open(
        'Delete a coupon',
        'No deleting, and that is the opposite position to the add-on. A redeemed code stands on a quote that has gone out; if the record disappears, the deduction on an old invoice can no longer be explained. Switching it off takes it out of circulation just as well and keeps the trace',
      ),
    ],
  },
  {
    /*
     * Not a new flow — a flow that had never been written down.
     *
     * Reviews cross three actors and four screens, and the board had no row
     * for them at all, which is how «zurückziehen führt zurück in die
     * Warteschlange» survived: nobody had ever laid the exits out next to each
     * other and noticed that two of the four were the same one.
     */
    id: 'reviews',
    en: 'Reviews',
    actors: ['customer', 'owner', 'visitor'],
    entries: [
      ok(
        'Write a review',
        '/konto/bewertung',
        'Offered on the most recent finished job with no review against it. One review per job, which is also why the seed leaves the demo account one unreviewed — review it in the seed and the screen is unreachable',
      ),
      added(
        'The moderation queue',
        '/admin/bewertungen',
        '`reviews` was an empty array in the default scenario, so the screen opened on «Noch keine Bewertungen» — and that empty state explains itself well enough that it read as finished rather than as never having held a card',
      ),
      added(
        'Search a review by its text, its answer or the household',
        '/admin/bewertungen',
        'The queue was four headed sections and nothing else, so «was hat die Frau Bachmann geschrieben» meant scrolling. The full name is searchable rather than the «Simone B.» the card prints — the initial is what the public may see, not what the office knows',
      ),
      added(
        'Filter by state',
        '/admin/bewertungen',
        'The four headed sections answered this and nothing else, and they could not survive a search — a filtered list has no groups left to head. The state moved onto the card as a badge and became a filter instead',
      ),
      ok(
        'The reviews on the website',
        '/',
        'Published ones only. With none, the written promise block holds the slot instead — an empty carousel costs more trust than it earns',
      ),
    ],
    actions: [
      ok(
        'Agree to publication, or not',
        '/konto/bewertung',
        '§20.6, and the checkbox says exactly what would be shown: first name and one initial',
      ),
      ok(
        'Reply, then publish',
        '/admin/bewertungen',
        'The reply box is inside the card, so answering is the path of least resistance rather than a second screen. A review at three stars or below cannot be published without one',
      ),
      added(
        'Take a published review off the website',
        '/admin/bewertungen',
        'It went back to «Wartet auf Freigabe» — the queue of reviews nobody has read — so a decision the owner had made was filed as one they had not. `hidden` is its own state now, it keeps the reply, and the way back is one button',
      ),
      added(
        'Delete a review',
        '/admin/bewertungen',
        'Nothing on the screen could remove one, which is the single thing §20.6 obliges the office to do when the person who wrote it withdraws their consent. Real, not archived, and the Protokoll records that a review went rather than what it said',
      ),
      ok('Send a refused review back for a second look', '/admin/bewertungen'),
    ],
    exits: [
      ok('Published — on the website, with the reply under it', '/admin/bewertungen'),
      added(
        'Hidden — released once, off the site now',
        '/admin/bewertungen',
        'The seed carries one so the group is not a heading nobody has seen: a four-star review taken down because it thanks a cleaner who has since left',
      ),
      ok('Not published — refused, with or without an answer on the record'),
      added('Deleted — gone, and the log keeps the trace rather than the text'),
      open(
        'Withdraw consent from the customer side',
        'The consent is recorded once, in the form, and the customer has no screen that takes it back — they have to write, and somebody in the office has to act on it. Deliberately open: the deletion this wave adds is the half that had to exist first, because without it there was nothing for that request to be answered with',
      ),
      open(
        'Correct the reply under a published review',
        'The reply box only appears while a review is off the site, so fixing a typo means hiding it, editing and publishing again — three clicks instead of one. That is the trade on purpose: an answer the public has already read should not change under them silently, and the hide makes the correction a visible act',
      ),
    ],
  },
  {
    id: 'hiring',
    en: 'Hiring & team',
    actors: ['applicant', 'owner'],
    entries: [
      ok('Application', '/jobs/bewerbung', 'The work permit is the first question'),
      ok('Speculative application', '/jobs', 'When no position is open'),
      ok('Create a job', '/admin/stellen'),
    ],
    actions: [
      ok('Check the status', '/jobs/status'),
      ok(
        'Review, reject, delete',
        '/admin/bewerbungen/app_1',
        'Deleting is real, not archived — revDSG',
      ),
      ok(
        'Read the CV',
        '/admin/bewerbungen/app_8',
        'A real PDF, generated on download — the record carries a filename and a size, never bytes, and the file says so on its first page',
      ),
      ok('Turn into a staff account', '/admin/bewerbungen/app_1/konto'),
    ],
    exits: [
      ok('Rejected with a reason', '/admin/bewerbungen/app_1'),
      ok('Hired', '/admin/benutzer'),
      added(
        'Add a user by hand',
        '/admin/benutzer/neu',
        'Was the open item on this board for nine waves. The reasoning for keeping it shut — permissions tied to a record somebody checked — held for contractors and never covered the bookkeeper, who applies for nothing and whose account the office therefore could not create at all',
      ),
    ],
  },
  {
    /*
     * Who may open what — and it is a flow rather than a screen list because
     * the interesting part is not the matrix, it is what happens at the two
     * ends of it: somebody being let in, and somebody walking into a room they
     * are not allowed in.
     */
    id: 'access',
    en: 'Users & access',
    actors: ['owner', 'contractor'],
    entries: [
      added('The user list', '/admin/benutzer', 'Sidebar → System → Benutzer'),
      added('Add a user by hand', '/admin/benutzer/neu'),
      ok(
        'Accept an application',
        '/admin/bewerbungen/app_1/konto',
        'Still the only way a contractor arrives — and it grants no console rights, so the four sentences on that screen stay true',
      ),
    ],
    actions: [
      added('Grant or withdraw an area', '/admin/benutzer/tm_marta/rechte'),
      added(
        'Apply a template',
        '/admin/benutzer/tm_marta/rechte',
        'Five starting points. Not roles — «Rechnungen + Ausgaben» and «Ausgaben + Finanzen» are two people in one job, and as roles that would be two roles for one thing',
      ),
      added('Correct name, contact or role', '/admin/benutzer/tm_sandra/bearbeiten'),
      added(
        'Create a password link',
        '/admin/benutzer/tm_sandra',
        'Shown once, valid two hours, points at screen 34 — the real reset page rather than an invented host',
      ),
    ],
    exits: [
      added(
        'Deactivated',
        '/admin/benutzer/tm_pia',
        'Sign-in stops; jobs, expenses and change-log entries stay, and the record counts them before the confirm rather than promising it in a sentence',
      ),
      added('Reactivated', '/admin/benutzer/tm_pia', 'Rights come back as they were'),
      added(
        'Deleted',
        '/admin/benutzer/neu',
        'Only where nothing names the person — otherwise the menu item is disabled and says which records would have been orphaned. Reachable on an account you have just created and not used',
      ),
      added(
        'Locked out of one area',
        '/admin/finanzen',
        'Sign in as a contractor with no finance right and type the URL: the sidebar hides the row and the shell refuses the path, in one place rather than fifty-eight',
      ),
      added(
        'A child route narrower than its parent',
        '/admin/ausgaben/arbeitszeit',
        'The workforce board sits inside /admin/ausgaben and is its own right, because it names who worked which job and what they are still owed — a receipts clerk and a crew manager are not always the same person. `permissionForPath` takes the longest matching prefix, so «Ausgaben» does not carry it and it does not carry «Ausgaben»',
      ),
      open(
        'Somebody other than the owner managing users',
        'The «Benutzer» right cannot be granted, because anybody holding it can grant themselves the rest. That makes the owner a single point of failure for access — if they are unreachable, nobody can unlock a colleague. A second owner, or a break-glass path, is a business decision and sits on /open-questions',
      ),
      open(
        'Reassigning a deactivated person’s future jobs',
        'Deactivating warns that N jobs are still assigned and links to the calendar, but does not move them. Whether those should be unassigned automatically, held for the same person, or refused until reassigned is a decision about a customer’s Tuesday, not about an account',
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
