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
        '/request',
        'Public, no account — §8.3. It was eight for everybody, and «Zusätze» was a full screen reading «for this service there are no extras» for the four services that have none. The step list is derived from the catalogue now, so the rail counts what this request actually has',
      ),
      added(
        'Take one over the phone',
        '/admin/requests/new',
        'One page, every step a section. A request could previously only come into being through the website — in a business whose work arrives by telephone',
      ),
      added(
        'Save as a draft',
        '/admin/requests/new',
        'For the call that ends before the answers are finished. Needs only a customer; sits in no queue and not in the customer’s account',
      ),
    ],
    actions: [
      ok(
        'Area check',
        '/request/property',
        '8700 inside, 8001 outside, 80 invalid. "Outside" now blocks "continue" — for a saved property too',
      ),
      ok('Live price range', '/request/service', 'Counts along from service and area'),
      added(
        'The property step asks only what this service is priced on',
        '/request/property',
        'Window cleaning and furniture assembly are priced from a count — `durationProfile: none` makes the estimator skip area, bathrooms, pets and condition entirely — and the step refused to continue until all three numbers had been typed anyway. They are gone for those two services, and the price is unchanged to the rappen',
      ),
      added(
        'Office cleaning stops asking what kind of property it is',
        '/request/property',
        'The service names it. The radio group is replaced by a sentence, the saved-property list shows only offices, and «Haustiere im Haushalt» — which was quietly adding §5.2’s half hour to an office quote — is not asked',
      ),
      added(
        'A furniture-assembly job can have two stops',
        '/request/property',
        'Collected at one address, assembled at another — a shop, the old flat, a storage unit. Optional and off by default; ticking it asks for the address, the floor and whether there is a lift, because carrying a wardrobe down four flights is the job. It reaches the office panel and the customer’s own request, and it is offered on no other service — everything else works on something that is already there',
      ),
      added(
        'The count reaches the confirmation screen',
        '/request/review',
        '«24 Fensterflügel» is the entire basis of the price and appeared on no summary: not in the rail, which printed the flat’s m² instead, and not on «Alles richtig?». It is the one answer that could not be checked against anything else on the page',
      ),
      added(
        'A stored address with no measurement is refused for a service that needs one',
        '/request/property',
        'Picking a saved property skipped every check. `Property.area` is optional — the office can file an address from a phone call — so a deep clean could be requested with no area at all, and the quote builder prices that at `areaTier(0)`, the cheapest bracket on the sheet',
      ),
      ok('Pick a slot', '/request/slot', 'Live availability — the picker reads the same engine the office schedules from, so a slot offered here is a slot that exists'),
      ok('Attach photographs', '/request/photos', 'What the office would otherwise ask for on the telephone, and the thing that makes a quote possible without a visit'),
      ok('Record the access method', '/request/access', 'Four methods, codes masked'),
      ok('The draft survives a reload', '/request', '30 days, §20.1'),
      added(
        'Prioritise by deadline',
        '/admin/requests',
        'Every open request has a §4.1 deadline and a delay in days. Overdue ones sit at the top — the list used to be sorted by arrival, which made it a log rather than a queue',
      ),
      added(
        'Filter by status, service, area, period',
        '/admin/requests',
        'Status and area only, before',
      ),
      added(
        '"All" / "Overdue" tabs',
        '/admin/requests',
        'Was an "overdue only" toggle sitting among the filters, with its count in the results line underneath — the number and the switch that opens it were never on screen together. Both tabs carry their own count, and "nothing overdue" has an empty state of its own rather than claiming "no requests yet"',
      ),
      added(
        'Row actions',
        '/admin/requests',
        'Details, write a quote, decline, carry on with a draft or discard it — according to status. Every row used to lead to exactly one place',
      ),
      added(
        'The sequence is visible',
        '/admin/requests/req_1',
        'Received → In review → Quote sent → Answer, with timestamps. The same derivation on the customer side, so the two cannot answer differently',
      ),
      added(
        'The customer reads the same rail, under the same name',
        '/account/requests/req_3',
        'It was a vertical list in the sidebar called «Verlauf» while the panel called it «Ablauf» — one derivation, two names and two shapes. Both screens now read it left to right across the top as «Fortschritt der Anfrage»',
      ),
      added(
        'Search your own requests, and filter them by status and service',
        '/account/requests',
        'The account had two requests and both said «Offerte versendet», so nine declared states were reachable from the office side and none from the customer’s. It carries twenty now — one in each state, plus two years of settled history — and the same toolbar the queue has: reference, service or address in the search box, then the two menus',
      ),
    ],
    exits: [
      ok('Sent', '/request/sent'),
      added(
        'Outside the area — never taken in at all',
        '/request/property',
        'Used to be an exit: the request went out anyway, was flagged, and the refusal followed by hand a working day later. The check now stops at the postcode — on the wizard, in the phone form and in the store, so no URL gets round it',
      ),
      added(
        'Withdraw it',
        '/account/requests/req_3',
        'cancelledByCustomer was declared, translated and coloured — and reachable from no screen',
      ),
      added(
        'Cancelled by us',
        '/admin/requests/req_3',
        'From "quote sent" onwards, "decline" is the wrong word. Closes the quote along with it',
      ),
      ok(
        'Decline with a reason',
        '/admin/requests/req_2?action=reject',
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
      ok('Write a quote', '/admin/requests/req_2/quote', 'Lines pre-filled from the request'),
      added(
        'Straight out of the phone intake',
        '/admin/requests/new',
        '"Record it and write the quote" — the call often ends with both',
      ),
    ],
    actions: [
      added(
        'Read means read',
        '/admin/requests/req_2',
        'The status only moved to "in review" inside the quote builder — one screen too late. A request could be read from top to bottom while it stayed "New", and the customer went on seeing in their account that nobody had looked',
      ),
      ok('Edit the lines', '/admin/requests/req_2/quote'),
      added(
        'The quote builder shows the figure the price rests on',
        '/admin/requests/req_acc_expired/quote',
        'The summary card printed the flat’s measurements and nothing else. On the two services priced by count that now reads «Fläche —» — the size is not asked for because it is not priced — and the count that replaced it was on no screen the owner sees while setting the price. It is a row of its own now, and «Zimmer»/«Bäder» read «Räume»/«Toiletten» on an office job',
      ),
      added(
        'A collection address reaches the person who has to price it',
        '/admin/requests/req_acc_expired/quote',
        '§5.1 puts travel beyond the free radius on the quote *by hand* — this is the hand. Without the second address on this card the rule the request flow states to the customer is one nobody here could follow. Shown with the «put it on the quote» line when it falls outside the eight municipalities',
      ),
      added(
        'And reaches the person who drives there',
        '/job/bkg_acc_h4',
        'A `Booking` has no `requestId`, so the job reaches its collection stop through the quote it came from. The crew screen carries it above the tasks, with the floor, the lift and its own route link — the office knowing about a second stop is worth nothing if the van does not',
      ),
      ok('Optional lines on and off', '/quote/off_1', 'Price and duration move together'),
      ok('Pick a date, held 15 minutes', '/quote/off_1/termin'),
      added(
        'Read the contract and sign it',
        '/quote/off_1/unterschrift',
        'The screen showed three key figures and a link to the terms. Three figures are something you check — what gets signed is a document, and it was nowhere: not on the screen, not in the account afterwards, and not on the owner’s copy either',
      ),
      added(
        'Homivaro signs first',
        '/admin/requests/req_1/quote/send',
        'The quote goes out signed and the customer’s signature closes the contract. Set from the settings on sending and copied onto the quote — a newly drawn signature never changes a contract that is already closed',
      ),
      added(
        'Store the signature',
        '/admin/settings?tab=contract',
        'sendOffer was already reading the value; without this screen the application put a signature under every contract that the owner could neither see nor change',
      ),
      ok('Ask for a change', '/quote/off_1/aenderung'),
      added(
        'Free slots: the five rules',
        '/admin/requests/req_2/quote',
        'The block showed times without saying where they came from — "is the system choosing, or a person?" had no answer on screen. Opening hours and lead time read their values from the settings, so the text cannot drift away from the engine',
      ),
      added(
        'Insert a template, or send straight out',
        '/admin/invoices/inv_draft',
        'The picker only inserted, and left {name} standing, because nothing resolved the placeholders. They are resolved against the record on screen now — what resolves may go out with one click, what does not blocks direct sending. It is gone from /admin/nachrichten: a conversation there may be about a request, a quote or an invoice, and a picker that cannot tell them apart offers the wrong text as readily as the right one',
      ),
      added(
        'Templates in the quote builder',
        '/admin/requests/req_2/quote',
        'Offered exactly one hard-wired option, which is why "quote expires" had no reachable path anywhere in the product. It reads the quotes area now',
      ),
      added(
        'Selectable line: pre-ticked or not',
        '/admin/requests/req_2/quote',
        'The builder only ever wrote `optional`, never `selected` — so every selectable line went out pre-ticked. An extra could therefore only be a discount the customer takes away, never work they add',
      ),
      added(
        'Read the covering message before sending',
        '/admin/requests/req_2/quote/send',
        'The card was headed "this is what the customer sees" and left out the one part that is written by hand',
      ),
      added(
        'Propose three dates (first-time customer)',
        '/quote/off_propose/termin',
        'Regulars book straight on — we know the property, the access and the history. On a first job the customer proposes up to three dates, and nothing is blocked while they sit unanswered',
      ),
      added(
        'Confirm the date',
        '/admin/quotes/off_propose',
        'The only step in this flow that sits with the owner. Holds the slot for 48 hours; without the card the quote looked as though it were with the customer',
      ),
      added(
        'Read the payment state',
        '/admin/quotes',
        'Read-only. The owner has neither a card to enter here nor anything to refund — the one thing missing was whether the money has arrived',
      ),
    ],
    exits: [
      added(
        'Take a refusal back',
        '/admin/requests/req_q_rejected',
        'Declining was a one-way street: "write a quote" switches itself off as soon as a request counts as answered, so exactly one action was left on the screen — decline it again. Applies only to our own refusal; if the customer declined the quote, the new version is the answer',
      ),
      ok('Paid and booked', '/quote/off_1/bestaetigt'),
      ok('Payment failed', '/quote/off_1/zahlung', 'The hold runs on, or runs out'),
      ok('Expired, reissue it', '/quote/off_2'),
      added(
        'Decline the quote',
        '/quote/off_1',
        'There was only accept or amend. A no became silence, and three weeks later "expired" — with no reason in the system. Releases the held time at once',
      ),
      added(
        'Booked without payment (package or plan)',
        '/quote/off_pkg/zahlung',
        '§11.3 — hours already bought are not charged twice. The flow used to demand a card, charge the full amount, and leave the hours sitting untouched in the account',
      ),
      added(
        'On to the booking',
        '/admin/quotes/off_paid',
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
        '/admin/customers/new',
        'A customer only ever came into being as a side effect of the wizard. On day one /admin/customers was a list with no way to put anything into it',
      ),
      added('Add a property', '/admin/properties', 'Outside a request — for addresses we know'),
      ok('Automatically, out of a request', '/request/contact'),
      ok('Hand a key back', '/admin/keys?returnKey=key_1', 'Deep-linked from the key’s own row, so the confirm opens on the right key rather than asking somebody to find it again in a list of sixteen'),
      added(
        'Take in a key',
        '/admin/keys',
        'The form asked only for the property and listed every address the company has as "label — street". A key is handed over by a person who gives their name, though: the office had to translate that name into one of sixteen labels first, and two customers with a flat on the same street were a mis-pick that nothing afterwards would ever have caught. Customer first, then their properties',
      ),
    ],
    actions: [
      added(
        'Duplicate check on email and phone',
        '/admin/customers/new',
        'The same rule as in the wizard',
      ),
      ok('Internal notes', '/admin/customers/cus_1'),
      ok(
        'Access and keys on the property',
        '/admin/properties/prp_1',
        'Codes bound to role and date, §13.1',
      ),
      added(
        'Filter by status, search by storage place and person',
        '/admin/keys',
        '"Which keys are we holding right now?" meant reading every row and checking the badge. The register keeps returned entries permanently (§13.2), so the list grows away from the answer. It is the one list that is also searched backwards: somebody is standing at the cabinet with a tag reading "slot 3" and needs to know whose door it opens — so the storage place and the names on hand-over and return are searchable too, not just property and customer. Plus the result count every other admin list had through the `Toolbar` long ago',
      ),
      added(
        'Jump from the key to the property',
        '/admin/keys',
        'The row had exactly one control — "record a return" — and no way to the address the key belongs to. That is where every question about a key ends, though: whose door, which access, is there a job due there. The jump went via the sidebar and a search for the label read off here',
      ),
      added(
        'Edit a property',
        '/admin/properties/prp_1/edit',
        'A property could be created and read, and nothing else. A house number taken down wrong then stood on every quote, every job sheet and every invoice at that address — lift, pets and extra effort were set to `false` on creation and had a switch nowhere',
      ),
      ok(
        'Delete a property while nothing hangs off it',
        '/admin/properties',
        'Seven record types point at a property, three of them with `!`. So only an address that has never been used is deleted; otherwise the menu entry names the number blocking it. Both outcomes are seeded: `prp_2c` («Attika Stäfa») has never been used in any scenario and deletes, `prp_2` carries nineteen records and refuses — this note used to claim something hung off every seeded property, and it was wrong, which is why the live state was thought to need "add a property" first. No archive flag: an address mistyped on the phone is a mistake, and a mistake you can only hide turns twelve properties into forty',
      ),
      open(
        'Reassign a property to another customer',
        'Deliberately not a field in the editor. Moving a property would leave bookings, quotes and invoices pointing at a customer who never had it — that is a merge, not an edit, and it needs a decision about what happens to the history',
      ),
      added(
        'Filter by property type and area, search by name',
        '/admin/properties',
        'The list could be sorted by nothing and filtered by nothing. The property type did not even have a column, and the area lives solely in the postcode (§6)',
      ),
      added(
        'Last job and next date in the list',
        '/admin/properties',
        '"When were we last there?" and "when are we back?" sat one click deep in the property history, per address — so people looked in the calendar instead. Both columns are derived from the bookings, and `noAccess` does not count as a job',
      ),
      ok('The history as one timeline', '/admin/customers/cus_1'),
      added(
        'Edit the master record',
        '/admin/customers/cus_1/edit',
        'The record could be created and read, and nothing else. A number mistyped on the phone stayed wrong — the only editable field was the internal note, which is precisely the field the customer never sees',
      ),
      added(
        'Set active / inactive',
        '/admin/customers',
        'The column showed the status and nothing in the panel could write it — only the customer could, by closing their account',
      ),
      added(
        'Block and unblock',
        '/admin/customers',
        '"They are gone" and "we do not serve them" were the same row. The block really bites: no quote from the builder, not selectable at intake, customer area shut',
      ),
      added(
        'Filter by status',
        '/admin/customers',
        'The status column became a switch before it became a filter — "who have we blocked?" meant reading every row. Plus the result count every other admin list had through the `Toolbar` long ago',
      ),
      ok(
        'See, store and default a payment method',
        '/admin/customers/cus_2',
        'The customer saw their cards on screen 45 and the owner nowhere — and on the phone it is the owner who gets asked, not the customer',
      ),
      added(
        'Put one on file, asking what that method actually needs',
        '/account/payment-methods',
        'The four buttons wrote a record on the click, labelled with the name of the method: every card saved came out as «Karte», so two of them were one row and the plan had no expiry to warn on. A card now asks for its four fields, TWINT for the number it is registered to, a wallet for the device it lives on — and the same fields serve screen 65, where three of the four used to be a free-text «Bezeichnung» the owner filled in themselves',
      ),
      added(
        'Refuse what cannot be a payment method',
        '/account/payment-methods',
        'A landline typed into TWINT, a month of 13, a card number four digits long. All three saved silently before — there was nothing to check, because nothing was asked. `13/28` got as far as the owner\'s dialog, which did check the shape and not the month',
      ),
      ok(
        'Remove a payment method',
        '/account/payment-methods',
        'By the customer themselves. They read a new one out over the phone; deleting one they do not — the payment method is theirs. Screen 65 says so where the button is missing, otherwise it looks like a forgotten control',
      ),
      added(
        'Move a package onto another card',
        '/account/payment-methods',
        'There was no way to do it. «Für das Abo» printed the first card in the list — not the one marked «Standard», not anything the customer had chosen, and read-only — so the only way to move a package off a card was to delete the card. A customer now holds one row per running package and picks its card there, and `Subscription.paymentMethodId` is what the dialog that opens a package writes',
      ),
      added(
        'Refuse to delete a card a package is running on',
        '/account/payment-methods',
        'The bin used to take it and report success, leaving the package pointing at an id that was not there any more. The refusal comes as a dialog over the page rather than a toast — it names the package, «Diese Karte belastet S-0013», and it asks for something to be done first, which is not a thing to say on a four-second timer. «Entfernen» is shown and disabled beside the way out, the same call the plan catalogue makes: a control that simply does nothing reads as a broken button',
      ),
      added(
        'The customer’s invoices, with amount and payment route',
        '/admin/customers/cus_2',
        'In the timeline an invoice was a row with a number: no amount, no payment state, no route. Details open in a dialog; changes still happen only on screen 72',
      ),
      added(
        'Search and filter the whole history',
        '/admin/customers/cus_2/history',
        'The record carried the entire timeline unfiltered. It carries the last five now and screen 65a the rest — with search, a type filter and a period. Quotes are newly in it: the history used to jump from the request straight to the booking',
      ),
    ],
    exits: [
      added(
        'Return a key',
        '/admin/keys',
        'The return was a button in the table: one click, status flipped, timestamp set, nothing asked — irreversible and without a prompt. The closed entry could therefore answer neither of the two questions ever asked about a key outside the cabinet: who carried it out, and who signed for it. Now a dialog with a date, both names and a note — and the entry stays in the register; it is never deleted',
      ),
      ok('Close the account', '/account/profile', 'By the customer themselves'),
      added(
        'Archive and restore',
        '/admin/customers',
        'Out of the working list, still in the records — with a tab of its own, because a soft delete you cannot look at anywhere is indistinguishable from a real one',
      ),
      added(
        'A method on file that says which one it is',
        '/account/payment-methods',
        'A card leaves its brand, its last four and its expiry — «Mastercard · 1234, gültig bis 03/31». The number, the name and the security code are read by the form and go no further: `SavedPaymentMethod` has nowhere to put them, and a prototype that models a stored PAN is one somebody builds for real',
      ),
      open(
        'Confirm a wallet in the wallet',
        'Apple Pay and Google Pay are a sheet on the device, and a web prototype cannot open one. The form therefore asks for the device instead — which is the one fact a saved wallet token actually carries, and the thing that tells a customer\'s two wallet entries apart — and says on the form that this is what it is standing in for. Whether a wallet is even worth keeping *on file*, as opposed to being tapped fresh at each checkout, is the question underneath; see §11.4a on /open-questions',
      ),
      open(
        'Pay a quote with a method already on file',
        'The checkout on /quote/[id]/payment still draws its own card fields, and they collect nothing — no state, no validation, no record. It never offers the card the customer has already saved either, so somebody with a Visa on file types it again to pay. Left alone in this pass because it is a *charge*, not a save: what it needs is a payment against an offer, and that is the money flow rather than this one',
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
      ok('From a paid quote', '/admin/calendar'),
      added(
        'Enter one by hand',
        '/admin/calendar/new',
        'A booking came exclusively from a paid quote. The job that comes together on the phone — the way this business gets work — had no path into the calendar, and /admin/bookings had been printing the source "manual" since day one for a record that nothing could produce',
      ),
      added(
        'Bookings as a list',
        '/admin/bookings',
        'The booking was the one large entity without a list of its own. The calendar answers "what is on on Tuesday" — not "which jobs come out of quotes", not "which finished job still has no invoice"',
      ),
      ok('Today’s jobs', '/job', 'Role "team member"'),
      added(
        'Read the day as a different contractor',
        '/job',
        'The demo bar picked the first contractor in the data and offered no way to pick another. With two on the roster and the office able to hand a job to either, assigning one to Yusuf and switching role landed you in Marta\'s day with the job you had just created nowhere on it',
      ),
    ],
    actions: [
      ok('Reschedule', '/admin/bookings/bkg_1'),
      added(
        'Hand the job to somebody, and take it back',
        '/admin/bookings/bkg_plan_2?action=assign',
        'This row used to read "Assign and reschedule" and only half of it was true: `assigneeId` was written when a booking was created and no screen could change it afterwards, while the field app filtered a contractor\'s entire day on that one field. The panel warns rather than refuses — not cleared for the service, outside the area, already at another address that hour — because the office knows things the record does not. B-1058 is the seeded job nobody has picked up',
      ),
      added(
        'Find the jobs nobody is doing',
        '/admin/bookings',
        'The «Ausführung» column and its filter. "What is on Marta\'s week" meant opening every row; "what has nobody yet" was not a question the list could be asked at all',
      ),
      added(
        'Act straight from the calendar',
        '/admin/calendar',
        'Rescheduling, assigning and cancelling all sat behind opening the job. The row menu jumps into the same view with the right field open — a confirmation inside a dropdown would be a dialog in a menu, and a second implementation of "cancel" would disagree with the first inside a wave',
      ),
      added(
        'Legend and colour by state',
        '/admin/calendar',
        'Week and month drew every entry in the same accent colour — a cancelled job and a confirmed one looked alike. The colours come from the status registry, and the legend reads the same source',
      ),
      ok('Check in and out with photos', '/job/bkg_1/check'),
      ok(
        'Access codes only on the day',
        '/job/bkg_1',
        'Move the demo clock — the block really does empty',
      ),
      added(
        'Record the hours worked',
        '/job/bkg_1/check',
        'Check-out asked for the *extra* hours, which made the person in the stairwell subtract the estimate from their own afternoon — and the number the office approves, how long the job took, was never stored at all: it went into the timeline label as a phrase. The field opens on the reading since check-in, the overrun is derived, and the contractor can still correct it until the office accepts the job',
      ),
      ok(
        'Approve the reported time',
        '/admin/bookings/bkg_7',
        '§5.3 splits the process: the person doing the work reports it, the office judges it. The banner now prints the hours it is asking about instead of pointing at the history',
      ),
      added(
        'Correct the hours from the office',
        '/admin/bookings/bkg_7',
        'The contractor has gone home and typed 5 for 5.5. Open until an invoice exists, and the timeline says which of the two wrote the number',
      ),
    ],
    exits: [
      ok('Approved and billable', '/admin/bookings/bkg_7'),
      ok('No access, with waiting time and a photo', '/job/bkg_1/no-access'),
      ok('Cancelled', '/admin/bookings/bkg_1'),
      ok('Invoiced', '/admin/invoices'),
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
        '/admin/calendar/new',
        'One button, two things: a job or a call. From the owner’s side it is one thought — something is happening that day',
      ),
      added(
        'Without a customer record',
        '/admin/calendar/new',
        'Somebody who has rung once is not a customer. A name and a telephone number are enough — otherwise /admin/customers fills up with people who have booked nothing',
      ),
    ],
    actions: [
      added(
        'Record the outcome',
        '/admin/calendar/cev_today',
        'The note is what was meant to be asked; the outcome is what was said — and it is exactly that text which has to carry over into the request when work comes of it',
      ),
      added(
        'A viewing blocks time, a call does not',
        '/admin/calendar',
        'A viewing is somewhere, a phone call is anywhere. Only the first collides with a job. Neither counts against the two jobs a day — see /open-questions',
      ),
    ],
    exits: [
      added(
        'It turned into a request',
        '/admin/calendar/cev_converted',
        'The whole point. Without this path a good conversation ends as a ticked-off calendar entry, and the same details get typed again from memory one screen away',
      ),
      added(
        'Done',
        '/admin/calendar/cev_today',
        'With the outcome in the history, with a timestamp',
      ),
      added(
        'Nobody reached',
        '/admin/calendar/cev_noreply',
        'Explicitly not "done". Otherwise a week of unanswered calls reads like a week of finished work',
      ),
      added(
        'Called off',
        '/admin/calendar',
        'Disappears from the calendar, stays in the record',
      ),
    ],
  },
  {
    id: 'money',
    en: 'Invoices & plans',
    actors: ['owner', 'customer'],
    entries: [
      ok('Invoice from a job', '/admin/invoices/new'),
      added(
        'Raise an invoice by hand',
        '/admin/invoices/new',
        'The job was the only way in, so everything else this firm bills for — travel, materials, a correction after a complaint — had no path into the app at all. That got written in the accounting system, and so a customer ends up holding an invoice the app has never heard of. The job is a field on the form now, rather than the door',
      ),
      added(
        'Book somebody’s hours to a job',
        '/admin/expenses/new?kategorie=arbeitszeit',
        'Wages were one lump a month with a person’s name typed into the supplier box — no job, no hours, no rate — so the largest cost in a cleaning company was the one nothing could be asked about. «Wie viele Stunden hat Marta im März gemacht» was a phone call, and «was hat dieser Umzug an Leuten gekostet» had no answer at all: the job knew its price, the month knew its payroll, and nothing joined the two. «Arbeitszeit» is one person on one job and carries the four facts that make it a record — who worked, how long, whose money settled it, who carries it. «Löhne» stays, for the payout that really does have nothing behind it',
      ),
      added(
        'Start from the job, with the job already filled in',
        '/admin/bookings/bkg_9',
        'The booking screen said what a job was worth and could never say what it took to do, so the subtraction stopped one step short on the one screen where both halves belong. «Arbeitszeit erfassen» opens the form on that job and on the hours the check-in and check-out already recorded — offered rather than written, because somebody who forgets to check out would otherwise book an eleven-hour day',
      ),
      added(
        'Record a cost',
        '/admin/expenses/new',
        'Half of the money had no entity at all. `invoices` said what came in and nothing said what went out, so the question this section is opened to ask — what is left at the end of the month — was answered in a banking app from memory. A supplier bill is open when it is entered and settled in its own step, so the payment route can never be skipped on the way in',
      ),
    ],
    actions: [
      ok('Change the lines in a draft', '/admin/invoices/inv_draft'),
      ok('Send, record as paid, cancel', '/admin/invoices/inv_draft'),
      added(
        'Name the payment route when recording it',
        '/admin/invoices/inv_paid',
        '"Mark as paid" wrote the status and nothing else — no `Payment`, so nowhere said how the money had arrived. `PaymentMethod` did not even know the two routes an invoice actually comes back by here: QR-bill and cash',
      ),
      added(
        'Quantity per line, up and down',
        '/admin/invoices/inv_draft',
        '"Bill an hour less" meant: select the cell, retype the number. At a desk that is fine; on a phone it is a numeric keypad over a table — for a change that is almost always ±1',
      ),
      added(
        'Search and filter by status',
        '/admin/invoices',
        'The list was six columns with no search and no filter. The QR reference is searchable too, because that is the number on the bank statement — "which invoice does this payment belong to" could not be answered at all before. "Outstanding" stands beside the five statuses because it is the question behind them and none of them',
      ),
      added(
        'Act straight from the row',
        '/admin/invoices',
        'Every row could do exactly one thing: open itself. Releasing, cancelling and deleting all meant opening first — which is why there was a bulk release by checkbox, a mass action standing in for the missing row actions. What a row cannot do stays in the menu and carries the reason instead of the name',
      ),
      added(
        'Cancelling and deleting ask first',
        '/admin/invoices',
        'Deleting asked with `window.confirm` — the browser’s box, with "OK" and "Cancel" on it in the browser’s language rather than the page’s, and no room for a reason. Cancelling asked with a panel that opened right at the bottom of the page, below the QR-bill and the message field. Both are the same dialog now, and the same dialog stands behind every delete and decline in the panel',
      ),
      added(
        'No changes after release',
        '/admin/invoices/inv_sent',
        'Was stated nowhere. The draft editor did lock itself, but did not say what to do instead — now there is "cancel and re-create": the old invoice is cancelled, a draft opens with the same lines, and both documents point at each other',
      ),
      added(
        'Read the two sides together',
        '/admin/finance',
        'Revenue and costs are counted by the month the work happened in, not the month the money moved — one rule applied to both, because counting revenue on the payment date and costs on the invoice date puts the income and the cost of one job in different months and makes every monthly figure wrong in a way that averages out to right. The consequence is on the screen rather than hidden: revenue includes bills nobody has paid, so "outstanding" is its own tile beside it',
      ),
      added(
        'Take the list away with you',
        '/admin/invoices',
        'The lists were readable and never portable, so the hand-off to the bookkeeper was a screenshot or a phone call. Both download what the filters left, not everything in the store — an export that ignores the toolbar above it is only discovered to be wrong after the file is opened. CSV rather than the app’s own PDF writer, which is one page and does not paginate: the rows that fell off the bottom would go silently',
      ),
      ok('Open one cost', '/admin/expenses/exp_1', 'Where a receipt, a supplier and a payment method are read rather than counted'),
      added(
        'Settle a cost, and say how',
        '/admin/expenses',
        'The same dialog an invoice is settled with, in the other direction. The route is required for the same reason: "paid" with nothing saying how is the half of the fact nobody can look up afterwards. It is one component now rather than one per screen, because the workforce board settles the same records — and two copies of that rule is one copy that eventually loses it',
      ),
      added(
        'Read the hours as hours',
        '/admin/expenses/hours',
        'Three tables and three questions: every entry as the chain it is, the same hours by person — who worked how much and who is still owed — and by job, which is the only place a crew is visible at all. A booking carries one `assigneeId` and a Saturday carries two people, so the second pair of hands exists nowhere else in the app. It reads the same month window the analytics screen does, so the labour figure on the two screens cannot disagree',
      ),
      added(
        'Narrow the costs to one person',
        '/admin/expenses',
        'The expense list could be narrowed by heading and by state and never by who. A person is a labour fact, so the filter drops everything else by construction — the honest answer to «was hat Marta gekostet», rather than a list that also carries the month’s diesel. The job a cost belongs to is a column now, and searchable: `bookingId` had been on the record since the day it was written and appeared on no screen, so an attribution made in the form was made where nobody could see it',
      ),
      added(
        'Read one person’s hours from their own page',
        '/admin/users/tm_marta',
        'H7 — U2 now — looked forward and only forward — the diary of what somebody is booked for. What they had actually worked, and whether they had been paid for it, sat in the expenses under a name typed into a supplier box, reachable from here only through the search box',
      ),
    ],
    exits: [
      ok('Paid', '/account/invoices/inv_paid'),
      ok('Cancelled with a reason', '/admin/invoices/inv_draft'),
      ok(
        'Overdue',
        '/account/invoices/inv_paid',
        'Derived from the due date on reading, not stored — rightly so, otherwise it would need a nightly run',
      ),
      open(
        'Refund',
        'Deliberately pushed to the next wave. Until now it was not buildable at all: a paid invoice had no `Payment` record, so there was nothing a refund could refer to. That exists as of this wave — `refunded` is in `PaymentStatus` and in the status colour table, and the quotes page already shows it for a quote payment. For an invoice, no button leads there yet',
      ),
      added(
        'Draft deleted',
        '/admin/invoices',
        '§15 keeps everything that has been with a customer — a draft has been with nobody. Carrying it forever as "cancelled" buries the real cancellations under paperwork. Drafts only, and the store checks that again itself',
      ),
      added(
        'Hours settled',
        '/admin/expenses/hours',
        'Open → paid from the board itself, with the route recorded, so hours that can be *seen* to be unpaid do not send the reader to a second list to press the button. The «noch nicht ausbezahlt» tile is the number that closes',
      ),
      added(
        'A cost settled',
        '/admin/expenses',
        'Open → paid, with the route recorded. The third state — overdue — is derived from the due date rather than stored, for the reason the invoice side gives: writing it down would need a nightly sweep to stay true',
      ),
      added(
        'A cost deleted',
        '/admin/expenses',
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
        '/admin/invoices/inv_sent',
        'Cancelled used to be a dead end: the job stayed on `invoiced`, and the billable list is "completed jobs without an invoice" — so an invoice raised wrongly made its job permanently unbillable. A cancellation gives the job back now',
      ),
      added(
        'Refunded',
        '/admin/subscriptions/pln_basic/sub_2',
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
      added('Create a plan', '/admin/subscriptions/new', 'There was no entity, so there was no creating'),
      added('Edit a plan', '/admin/subscriptions/pln_basic/edit'),
      ok('The plans page on the website', '/plans'),
      added(
        'Bought from the account itself',
        '/account/plan',
        'Every route to a plan led out of the account: the empty state to the marketing page, the marketing page into the six-step request wizard — for somebody whose address and card are both already on file. The catalogue is on the plan screen now and the purchase is three answers: which address, which saved method, confirm',
      ),
      added(
        'A plan out of a paid quote',
        '/admin/subscriptions/pln_basic',
        'The real break: a visitor picks a plan, the wish lands on the request, the discount on the quote — and then nobody created a plan. Anyone who took one out on the website had none afterwards',
      ),
    ],
    actions: [
      added(
        'Take it off sale',
        '/admin/subscriptions',
        'Existing plans run on. A year already paid for cannot be withdrawn retrospectively',
      ),
      added(
        'Take it off the website',
        '/admin/subscriptions/pln_buero',
        'Two switches, not one: sell it by telephone before it is announced — and stop advertising it while the existing customers go on using it',
      ),
      added(
        'Count the visits',
        '/admin/subscriptions/pln_basic/sub_2',
        'A plan used to cover everything it touched for a year. A visit is counted on approval, and after that it is gone',
      ),
      added(
        'Skip a visit',
        '/account/plan',
        'It worked and said nothing about what it does. The section carried only the allowance, so nothing told the customer that the visit is not deducted, that a booking gets cancelled, or which one — and this is the only control in the account that calls off a job. It also offered itself with nothing scheduled, which spent a free skip on a visit that did not exist',
      ),
      added(
        'Compare every plan without leaving the account',
        '/account/plan',
        'The screen was a receipt: what was bought, nothing about what else is sold. The catalogue below it is the marketing page comparison, same rows, with the reader own column marked — and the cards read stacked or side by side',
      ),
      added('Pause and resume', '/admin/subscriptions/pln_basic/sub_2'),
    ],
    exits: [
      added(
        'Expired',
        '/admin/subscriptions/pln_vip/sub_s_expired',
        'Derived from the end date on reading, not stored — otherwise it would need a nightly run. Unused visits are named, not passed over in silence',
      ),
      added(
        'Renewed',
        '/admin/subscriptions/pln_basic/sub_2',
        'New invoice, visits reset, counter up by one. Deliberately not automatic: nothing here charges on a cycle',
      ),
      added(
        'Cancelled and refunded',
        '/admin/subscriptions/pln_basic/sub_2',
        'Only while no visit has taken place and the withdrawal period is still running. The rule lives in the store, not just in the disabled button — otherwise a URL gets round it',
      ),
      added(
        'Moved up a plan',
        '/account/plan',
        'The old exit was a row of links to /contact?plan=<id> — a contact form that never read the parameter, so the plan the customer picked was lost on arrival. It is the same subscription now: new package, term restarted, visits reset, and an invoice carrying the credit as its own line. The credit is the unused visits at what they paid per visit on the old plan — arithmetic off their own receipt, not a rate we chose, but §21.7 is still open on whether the business credits them at all',
      ),
      added(
        'Deleted — or refused with a reason',
        '/admin/subscriptions',
        'The catalogue could only ever grow. Retiring was the one way off the list, and it is the right act for a plan that has been sold — but it left the plan created by mistake sitting there for ever with «zurückgezogen» beside it, indistinguishable from a real product taken off sale. Refused as soon as anybody holds it, ever held it, or a request still names it; the refusal counts them and points at the retire switch instead',
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
      ok('The customer writes about a reference', '/account/messages'),
      ok('The owner opens a conversation', '/admin/messages'),
      ok(
        'Out of an invoice',
        '/admin/invoices/inv_draft',
        'The covering message lands in the invoice’s thread, not in a second filing place',
      ),
    ],
    actions: [
      ok('Reply', '/admin/messages'),
      added(
        'Attach a file or an image',
        '/admin/messages',
        'The quote, the price list, the photo of the conservatory — everything a reply referred to had to travel alongside by email. Not a `Photo`: an attachment is addressed to a named customer, so the consent question from §20.6 is already answered by sending it, and a PDF would not fit in one anyway',
      ),
      added(
        'Filter by read, unread and period',
        '/admin/messages',
        'A single chip read "unread" and was in fact measuring "the customer wrote last". The two are separated now: `readByAdmin` says what nobody has looked at, and who wrote last says what still owes an answer',
      ),
      ok(
        'Mark a conversation as read',
        '/admin/messages',
        'By opening it. A button for that would be a button for something the click before it has already said',
      ),
    ],
    exits: [
      ok('The reply is in the customer’s account', '/account/messages'),
      ok('On into the customer record', '/admin/customers/cus_2'),
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
      ok('Template overview', '/admin/templates'),
      added(
        'New template',
        '/admin/templates/new',
        'The eleven templates were a closed union type. Creating a twelfth was not unbuilt but impossible — and "pricing list" from the brief therefore had nowhere to go',
      ),
      added(
        'Out of a picker',
        '/admin/invoices',
        'Every picker links to the management screen, so "this template is no good" ends where you change it',
      ),
    ],
    actions: [
      added(
        'Search and filter',
        '/admin/templates',
        'At eleven rows a convenience; at thirty the only way to find anything',
      ),
      added('Edit in four languages', '/admin/templates/tpl_offer_sent'),
      added(
        'Set the default template',
        '/admin/templates',
        'One occasion can have several templates. Which one goes out automatically is a decision — it is set, not guessed',
      ),
      added(
        'Delete with a prompt',
        '/admin/templates',
        'Three different prompts, according to what could break: an ordinary one, one that asks for the successor, and one that says the original text will be restored',
      ),
    ],
    exits: [
      added(
        'The template stands in the pickers',
        '/admin/invoices/inv_draft',
        'A template’s area decides which picker offers it — the same table that fills the usage list in the editor',
      ),
      added(
        'The template goes out automatically',
        '/admin/templates',
        'Only with an occasion, and only as the default. Without an occasion it can be chosen by hand alone',
      ),
      added(
        'Deleted — the occasion still sends',
        '/admin/templates',
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
      ok('Catalogue overview', '/admin/services'),
      added(
        'New service',
        '/admin/services/new',
        'The catalogue was as long as the seed had written it. Offering an eighth service was not an unbuilt screen but a deploy',
      ),
      added(
        'Search and filter',
        '/admin/services',
        'At seven rows, a convenience. As soon as the catalogue can be extended it is the only way to find a service — and the only way to see every draft at once',
      ),
    ],
    actions: [
      added(
        'Look at the details without changing anything',
        '/admin/services/grundreinigung/details',
        'The editor saves on every keystroke. Looking up how a service is billed must not happen there — and a screen of its own has an address you can send to somebody',
      ),
      ok('Edit in four languages', '/admin/services/grundreinigung'),
      added(
        'Edit the short description',
        '/admin/services/grundreinigung',
        '`short` stands on every service page and in every tile on the home page — and stood on no screen. The first sentence a customer reads was the only one the owner could not change',
      ),
      added(
        'Choose how it is billed',
        '/admin/services/grundreinigung',
        'Per hour, per unit or flat. `calc` was a three-way union that only the seed could set — and the list rendered it with a two-way ternary',
      ),
      added(
        'Say what is counted, and how long it takes',
        '/admin/services/new',
        'A card that only exists for a service billed by count, and it takes several units: a window clean counts sashes, a glazing job counts panes and frames. There was one fixed question in the code, so every counted service asked about windows',
      ),
      added(
        'Put on sale and withdraw, with a prompt',
        '/admin/services',
        'A switch in a column of its own, so the state is readable without opening — but it does not act on the click; it opens the prompt. Both directions change what a customer sees',
      ),
    ],
    exits: [
      added(
        'Filed as a draft',
        '/admin/services/new',
        'Appears nowhere but in the catalogue. This state did not exist before: `active` was a boolean, and "not finished yet" and "withdrawn" were the same row',
      ),
      added(
        'Refused: counted, but nothing says what is counted',
        '/admin/services/new',
        'Both the create form and the availability switch refuse it, and both say why. Published, the request flow would have drawn a number box with nothing written over it — saving the same record as a draft still works',
      ),
      added(
        'On sale — stands in the request flow',
        '/request/service',
        'Website, price list, request flow and sitemap.xml now all read the same function, so "on sale" means the same thing everywhere',
      ),
      added(
        'Withdrawn — its own URL stops answering too',
        '/admin/services',
        '/services/[slug] used to serve every service; only the menus were filtered. Withdrawing therefore meant: disappear from the navigation and stay bookable',
      ),
      open(
        'Putting on sale takes effect on the marketing pages at once',
        'The request flow reads the catalogue from the store and follows immediately. /services, /pricing, the home page and the footer are rendered statically from the seed — they follow at the next build. That is the boundary of a prototype without a backend, not a missing screen, and the copy in the panel now says as much',
      ),
      added(
        'Deleted — or refused with a reason',
        '/admin/services',
        'Refused as soon as a request, a job or a plan points at it. The prompt names the number and suggests withdrawing, instead of only saying "no"',
      ),
      open(
        'Change the order on the website',
        '`order` decides how the services stand on the home page and under /services. New services land at the end, and there is no screen that reorders the existing seven — drag-and-drop in the list would be the sensible thing, and that is more than this wave can close',
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
      ok('The list of add-ons', '/admin/add-ons'),
      added(
        'New add-on',
        '/admin/add-ons/new',
        'What a customer can buy on top stood in the seed. "We shampoo carpets now, sixty francs" was a deploy — the same channel as the service catalogue, one level down',
      ),
      added(
        'Filter by service',
        '/admin/add-ons',
        '"What can you add to a move-out clean" could only be answered by reading the "applies to" column row by row',
      ),
    ],
    actions: [
      added(
        'Edit name and short description in four languages',
        '/admin/add-ons/fenster',
        'The customer reads both texts in the "extras" step. Neither could be changed — the list displayed them and nothing else',
      ),
      added(
        'Change price and time needed',
        '/admin/add-ons/fenster',
        'Side by side, each with a hint saying where the two numbers go. The price is billed, the time only scheduled — billing both would mean 45 francs for the windows plus 24.50 for the half hour',
      ),
      added(
        'Decide which services it appears under',
        '/admin/add-ons/fenster',
        '`services` was a field only the seed could write. Which extras belong to which service was therefore fixed at build time',
      ),
      added(
        'Switch available and hide',
        '/admin/add-ons',
        'A switch rather than a checkbox, in a column that says what it does. The checkbox sat under "status" — a control under a word that reads like a description. It applies at once and the same click takes it back',
      ),
    ],
    exits: [
      added(
        'Saved hidden',
        '/admin/add-ons/new',
        'Appears only in the panel. The price can be argued over for a day without a half-finished offer standing in the live request flow',
      ),
      added(
        'Offered — stands in the "extras" step',
        '/request/extras',
        'The request flow reads the store and follows immediately',
      ),
      added(
        'Deleted — or refused with a reason',
        '/admin/add-ons',
        'Refused as soon as a request or a quote line points at it. A line remembers the slug: if the record disappears, an invoice already sent reads "backofen" instead of "Backofen"',
      ),
      added(
        'Switched on and unreachable anyway — flagged as such',
        '/admin/add-ons',
        'Hung off nothing, or only off services that are not on sale. The badge said "available" in green, and no customer could see it',
      ),
      open(
        'An add-on on a plan-covered visit',
        'A job covered by a plan is never quoted — "payment not due". If the customer picks an add-on there, it is therefore free. Whether an add-on on a package visit is billed separately, included in the package, or not offered at all is a business decision; see §11a on /open-questions',
      ),
      open(
        'On the service page of the website',
        '/services/[slug] shows the add-ons from the seed, because the page is built statically — one created here appears at the next deploy. The same boundary as the service catalogue, not a missing screen. At least the page no longer shows hidden ones',
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
        '/admin/coupons',
        'The list was empty in every scenario, and the empty state declared that to be the intention. The only way to screen 77 was therefore "create a coupon" — opening an existing one was simply not possible',
      ),
      added(
        'New coupon',
        '/admin/coupons/new',
        'Stood on this board as working and had not been for eleven waves. The URL rename moved the button from /neu to /new and left the screen still testing for /neu, so «Gutschein erstellen» — the only entry into screen 77 that does not need an existing code — answered «Dieser Gutschein existiert nicht mehr». The same slip killed «Kosten erfassen» and «Vorlage erstellen»; all three now read one constant',
      ),
      added(
        'Open an existing coupon',
        '/admin/coupons/cpn_1',
        'Five codes in the seed, one per state. The edit form had never been opened against a record with values in it',
      ),
      added(
        'Search by code or service',
        '/admin/coupons',
        '"We have WELCOME10 here" is the whole question when somebody rings up, and it meant reading the table. The slug is searchable beside the service name, because a quote line stores the slug rather than the name',
      ),
      added(
        'Filter by state',
        '/admin/coupons',
        'On the derived state, not on the `active` field. Filtering the raw boolean would file SPRING25 — switched on, expired four months ago — under "valid", which is the exact wrong answer the badge was rewritten to stop giving',
      ),
    ],
    actions: [
      added(
        'Change code, kind and value — and only then save',
        '/admin/coupons/cpn_1',
        'Every field wrote to the store on every keystroke, and only when editing. Anyone who opened WELCOME10 to check its ceiling had changed it by tabbing through; clearing the code to retype it saved a coupon with no code',
      ),
      added(
        'Catch a duplicate code',
        '/admin/coupons/cpn_1',
        'A redemption resolves by code — two identical codes silently give one campaign the other’s ceiling. It could not be checked while every keystroke was the save: every prefix of an existing code is a duplicate on its way there',
      ),
      added(
        'Catch an end date before the start date',
        '/admin/coupons/cpn_1',
        'Produced a coupon that is never valid and stood in the list as "valid" regardless',
      ),
      added(
        'Cap what a percentage may take off',
        '/admin/coupons/cpn_1',
        'The floor — a minimum order — has been on this screen since the beginning; the ceiling had no field at all, so 10% took CHF 25 off a small flat and CHF 180 off a move-out clean with the windows, on a code that goes out with every first quote. The third box appears only on a percentage: a fixed amount is already its own ceiling, and a box that can only be filled with the answer above it teaches the reader to skip the form. The list prints the cap under the figure, so it is not a fact you have to open a record to learn',
      ),
      ok(
        'Restrict it to individual services',
        '/admin/coupons/cpn_1',
        'None ticked means: applies to all. It is in the list now too, in a column of its own — before, a code for the whole catalogue and one for windows only looked identical',
      ),
      added(
        'Switch a code on or off from the list',
        '/admin/coupons',
        'The one control on either coupon screen that writes on the click, and the reason the split exists: here the flip is the whole action and the same click takes it back. On screen 77 the same field waits in the draft beside a half-typed code, where applying it alone would publish one decision out of a record the reader can still see is unfinished. Logged in the Protokoll, because pulling a printed code is what that screen is for',
      ),
      added(
        'Discard instead of saving',
        '/admin/coupons/cpn_1',
        'There was no way out of a change. Nothing was staged, so nothing could be abandoned — the back link left the change standing',
      ),
    ],
    exits: [
      ok('Saved — stands in the list', '/admin/coupons'),
      added(
        'Switched off',
        '/admin/coupons/cpn_4',
        'From the list it applies at once; from the edit screen it waits for the button with everything else. Two saving models for one field, and the difference is what else is in flight beside it',
      ),
      added(
        'Fully redeemed — ceiling reached, window still open',
        '/admin/coupons',
        'The only one of the five states in a warning colour. Customers are typing in a code today that the office believes is running; before, expired, fully redeemed and disabled shared one grey badge',
      ),
      added(
        'Expired — without anybody switching anything off',
        '/admin/coupons',
        'Read from the data, not from `active`. SPRING25 stands at "active" to this day and has been over for four months',
      ),
      added(
        'Starts later — created, but not valid yet',
        '/admin/coupons',
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
        '/account/review',
        'Offered on the most recent finished job with no review against it. One review per job, which is also why the seed leaves the demo account one unreviewed — review it in the seed and the screen is unreachable',
      ),
      added(
        'The moderation queue',
        '/admin/reviews',
        '`reviews` was an empty array in the default scenario, so the screen opened on «Noch keine Bewertungen» — and that empty state explains itself well enough that it read as finished rather than as never having held a card',
      ),
      added(
        'Search a review by its text, its answer or the household',
        '/admin/reviews',
        'The queue was four headed sections and nothing else, so «was hat die Frau Bachmann geschrieben» meant scrolling. The full name is searchable rather than the «Simone B.» the card prints — the initial is what the public may see, not what the office knows',
      ),
      added(
        'Filter by state',
        '/admin/reviews',
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
        '/account/review',
        '§20.6, and the checkbox says exactly what would be shown: first name and one initial',
      ),
      ok(
        'Reply, then publish',
        '/admin/reviews',
        'The reply box is inside the card, so answering is the path of least resistance rather than a second screen. A review at three stars or below cannot be published without one',
      ),
      added(
        'Take a published review off the website',
        '/admin/reviews',
        'It went back to «Wartet auf Freigabe» — the queue of reviews nobody has read — so a decision the owner had made was filed as one they had not. `hidden` is its own state now, it keeps the reply, and the way back is one button',
      ),
      added(
        'Delete a review',
        '/admin/reviews',
        'Nothing on the screen could remove one, which is the single thing §20.6 obliges the office to do when the person who wrote it withdraws their consent. Real, not archived, and the Protokoll records that a review went rather than what it said',
      ),
      ok('Send a refused review back for a second look', '/admin/reviews'),
    ],
    exits: [
      ok('Published — on the website, with the reply under it', '/admin/reviews'),
      added(
        'Hidden — released once, off the site now',
        '/admin/reviews',
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
      ok('Application', '/jobs/apply', 'The work permit is the first question'),
      ok('A posting', '/jobs/reinigungskraft-teilzeit', 'What the role actually is, before anybody fills in a form'),
      ok('Speculative application', '/jobs', 'When no position is open'),
      ok('Create a job', '/admin/postings'),
      ok('Edit a posting', '/admin/postings/reinigungskraft-teilzeit', 'Closing one stops it taking applications without deleting the ones it already took'),
    ],
    actions: [
      ok('Sent, with a reference', '/jobs/apply/sent', 'The number the status page asks for'),
      ok('Check the status', '/jobs/status'),
      ok(
        'Review, reject, delete',
        '/admin/applications/app_1',
        'Deleting is real, not archived — revDSG',
      ),
      ok(
        'Read the CV',
        '/admin/applications/app_8',
        'A real PDF, generated on download — the record carries a filename and a size, never bytes, and the file says so on its first page',
      ),
      ok('Turn into a staff account', '/admin/applications/app_1/account'),
      added(
        'Delete a job — or be refused with a reason',
        '/admin/postings',
        'The list could only ever grow. Unpublishing was the one way off the jobs page, and it is the right act for a job that has taken applications — but it left the duplicate and the abandoned draft sitting in the list for ever with «Entwurf» beside them, indistinguishable from a role somebody is still writing. Refused as soon as any application names the job, because the applications screens read the title off that id and fall through to «Spontanbewerbung» when it is gone — so a deletion would relabel people who answered an advert as people who wrote in unprompted, and no filter on the list could find them again',
      ),
    ],
    exits: [
      ok('Rejected with a reason', '/admin/applications/app_1'),
      ok('Hired', '/admin/users'),
      added(
        'Add a user by hand',
        '/admin/users/new',
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
      added('The user list', '/admin/users', 'Sidebar → System → Benutzer'),
      added('Add a user by hand', '/admin/users/new'),
      ok(
        'Accept an application',
        '/admin/applications/app_1/account',
        'Still the only way a contractor arrives — and it grants no console rights, so the four sentences on that screen stay true',
      ),
    ],
    actions: [
      added('Grant or withdraw an area', '/admin/users/tm_marta/permissions'),
      added(
        'Apply a template',
        '/admin/users/tm_marta/permissions',
        'Five starting points. Not roles — «Rechnungen + Ausgaben» and «Ausgaben + Finanzen» are two people in one job, and as roles that would be two roles for one thing',
      ),
      added('Correct name, contact or role', '/admin/users/tm_sandra/edit'),
      added(
        'Create a password link',
        '/admin/users/tm_sandra',
        'Shown once, valid two hours, points at screen 34 — the real reset page rather than an invented host',
      ),
    ],
    exits: [
      added(
        'Deactivated',
        '/admin/users/tm_pia',
        'Sign-in stops; jobs, expenses and change-log entries stay, and the record counts them before the confirm rather than promising it in a sentence',
      ),
      added('Reactivated', '/admin/users/tm_pia', 'Rights come back as they were'),
      added(
        'Deleted',
        '/admin/users/new',
        'Only where nothing names the person — otherwise the menu item is disabled and says which records would have been orphaned. Reachable on an account you have just created and not used',
      ),
      added(
        'Locked out of one area',
        '/admin/finance',
        'Sign in as a contractor with no finance right and type the URL: the sidebar hides the row and the shell refuses the path, in one place rather than fifty-eight',
      ),
      added(
        'A child route narrower than its parent',
        '/admin/expenses/hours',
        'The workforce board sits inside /admin/expenses and is its own right, because it names who worked which job and what they are still owed — a receipts clerk and a crew manager are not always the same person. `permissionForPath` takes the longest matching prefix, so «Ausgaben» does not carry it and it does not carry «Ausgaben»',
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
  {
    /*
     * The customer looking after their own account.
     *
     * Eight screens under /account and no flow. `crm` is the office reading the
     * same records from the other side, which is a different journey with
     * different exits — the customer cannot see another customer, cannot price
     * anything, and is the only actor who can withdraw consent for a
     * photograph. The board had the office's half and not theirs.
     */
    id: 'account',
    en: 'A customer looking after their own account',
    actors: ['customer'],
    entries: [
      ok('The dashboard', '/account', 'What is happening now — the next visit, anything owed, anything waiting on them'),
      ok('Their requests', '/account/requests', 'Every request they have sent, with what became of it'),
      ok('Their quotes', '/account/quotes', 'Including the expired ones, because «why can I not accept this» is a question the list has to answer'),
      added('Their appointments', '/account/appointments', 'The one large record the account had no way in to. `useAccount` had returned `bookings` since wave 8 and two screens read them — the dashboard, to print the next date, and the review form, to work out what was reviewable — so a customer with fourteen visits behind them could open none of them'),
    ],
    actions: [
      ok('Accept or decline a quote', '/quote/off_1', 'The one screen where a customer commits money'),
      ok('Edit one property', '/account/properties/prp_2', 'Size and access are what a quote is priced from, so they are the customer’s to correct'),
      ok('Look after their properties', '/account/properties', 'Address, size, access — the facts a quote is priced from'),
      added(
        'Delete one of their own properties',
        '/account/properties',
        'The list could only grow: a flat typed in by hand and got wrong stayed on the customer’s own screen for ever, and the only way out was to ask the office to do it behind the counter. Same guard as the panel’s — an address nothing has used yet goes, one with history stays so the invoices behind it still resolve (§15) — but the refusal is worded for the person who owns the address rather than for the person who could unpick it: what holds it, counted in requests, appointments, plans and keys, and a link to write to the office for the case the rule cannot tell from a mistake, which is having moved out. `prp_2c` deletes, `prp_2` refuses',
      ),
      ok('Change how they are reached', '/account/profile', 'Operational mail is not optional and the screen says so rather than offering a switch that does nothing'),
      ok('Pay an invoice', '/account/invoices', 'Card, TWINT or the QR bill'),
      ok('Manage the plan', '/account/plan', 'Skip a visit, pause, or cancel inside the cooling-off window'),
      ok('Withdraw consent for a photograph', '/account/requests/req_3', 'The customer is the only actor who can, and it empties the public gallery entry the same moment'),
      ok('Write to the office', '/account/messages', 'One thread per reference, so a question about an invoice is not filed with a question about a booking'),
      added('Call off a visit', '/account/appointments/bkg_acc_accepted', 'Section 12 promises this at checkout and repeats the deadline on the dashboard, and until wave 116 neither sentence had a control behind it anywhere in the product — the only way to cancel was the telephone. Free inside the window, and it states the percentage rather than a figure in francs, because what that percentage applies to is unsettled for a plan visit'),
      added('Find out why they were charged for a locked door', '/account/appointments/bkg_acc_noaccess', 'Section 4.2 puts a fee on an invoice for work nobody did. The customer-facing explanation of where it came from did not exist on any screen'),
    ],
    exits: [
      ok('A booked job', '/account/requests/req_acc_h4', 'The request that became work, with its date and its crew'),
      ok('A review left', '/account/review', 'Only for jobs that are finished, and only once'),
      added('Finding out what became of a review', '/account/review', 'Four states in `ReviewStatus`, and the person who wrote the words could see none of them. Two of those are why it matters: waiting a fortnight in `pending` and being turned down outright looked identical from outside the office, which is silence'),
      added('The history of a finished visit', '/account/appointments/bkg_acc_hist_6', 'What was done, when, at which address, with the before-and-after pair and the invoice it became — reachable from the job rather than by matching a date against the invoices list'),
      ok('The plan ended', '/account/plan', 'Inside the window it is refunded; outside it runs to the end of the term'),
      open(
        'Closing the account',
        'Section 15 lets a customer close their own, and `status: inactive` is the state it produces — but nothing on /account writes it. It is the one thing on this list where the customer half is missing and the office half works: the panel can archive them, they cannot leave. What that should do to an open plan is the question underneath it',
      ),
    ],
  },
  {
    /*
     * The funnel, and it was the one flow nobody had written down.
     *
     * Eleven marketing screens were reachable from the board only as *screens*
     * — /services, /pricing, /areas/<slug>, the legal pages, the 404. `/flows`
     * asks a different question than `/screens` does: not "does it exist" but
     * "can you get in, act, and get out". For the marketing site that question
     * is the whole business case, because every request the company ever gets
     * starts on one of these pages.
     */
    id: 'visit',
    en: 'A visitor arriving and asking for a price',
    actors: ['visitor'],
    entries: [
      ok('The home page', '/', 'Where the coverage check sits, so the first question a visitor has — «do you come to me?» — is answered above the fold'),
      ok('A service page', '/services/umzugsreinigung', 'The seven pages search sends people to. Each one carries the «what is not included» block the brief refuses to let anybody cut'),
      ok('A municipality page', '/areas/kuesnacht', '§6 makes these eight the entire local search surface — and deliberately not Zurich'),
      ok('A guide', '/blog/wohnungsabgabe-checkliste', 'The other half of search: somebody typing «Wohnungsabgabe Checkliste» at eleven at night, three days before they move'),
      ok('Somebody pasted a link', '/pricing', 'Every page carries the same header, so no page is a place you can only arrive at'),
    ],
    actions: [
      ok('Check the postcode', '/', 'A gate, not a label — an address outside the eight is refused where it is typed, not three screens later'),
      ok('Compare the plans', '/plans', 'The tiles read from the store, so a plan the office retires stops being advertised'),
      ok('Read what a job costs', '/pricing', 'One hourly rate, and the surcharges named as their own lines rather than folded into a total'),
      ok('Look at the work', '/work', 'Before and after, and only where §20.6 consent was recorded — which is why the page can be empty'),
      ok('Read who they are dealing with', '/about', 'One person, one area — the page the whole trust argument rests on'),
      ok('Read the small print', '/legal/agb', 'German only, deliberately: a machine-translated contract is worse than none'),
    ],
    exits: [
      ok('Into the request flow', '/request/service', 'The one conversion this site is built for'),
      ok('A message sent, and confirmed', '/thank-you', 'With a reference to quote, because a promise nobody can chase is not one'),
      ok('A message instead', '/contact', 'For the people who will not fill in a nine-step wizard, which is most of them on a phone'),
      ok('A wrong URL', '/diese-seite-gibt-es-nicht', 'The designed 404, with the ways back on it — not the framework’s bare page'),
      open(
        'Leaving and coming back',
        'Nothing is remembered between visits except the request draft, which is keyed to this browser. A visitor who read three service pages on Tuesday arrives on Thursday to the same site as a stranger. Whether that is worth a cookie is a question about what the business wants to know about people who have not asked for anything yet',
      ),
    ],
  },
  {
    /*
     * Getting in, which had four screens and no flow.
     *
     * It is the one journey where every unhappy path is a support call: a link
     * that expired, an account nobody activated, a password reset that went to
     * an address the person no longer reads. The board carried none of them.
     */
    id: 'auth',
    en: 'Getting into an account',
    actors: ['customer', 'owner', 'contractor'],
    entries: [
      ok('Ask for a link', '/sign-in', '§13 — a magic link rather than a password, because a cleaning customer signs in twice a year and a password they set in March is a password they have forgotten by June'),
      ok('Activate a new account', '/activate-account', 'The account the office created for somebody it took a request from over the telephone'),
      ok('Set a password', '/password', 'The path for the accounts that do have one — the team'),
      ok('The panel has its own door', '/admin/sign-in', 'Outside the gated area, so it is the one admin screen a signed-out person can open'),
    ],
    actions: [
      ok('Switch who you are', '/', 'The demo bar’s role control, which is what stands in for signing in at all — this prototype has no session'),
      ok('Reach a gated screen', '/account/requests', 'Every screen under /account and /admin refuses a reader in the wrong role, and says which role it wants'),
    ],
    exits: [
      ok('Into the account', '/account', 'The dashboard the link lands on'),
      ok('Into the panel', '/admin', 'For the roles that may open it'),
      ok('Refused, with a reason', '/admin/customers', 'The access gate names the right that is missing rather than saying «no»'),
      open(
        'The link actually arrives',
        'No email leaves this app — the sign-in screen says a link was sent and the demo bar is what actually changes who you are. Everything downstream of that is real: the roles, the gates and the per-right refusals. What is missing is the delivery, and it is missing everywhere the product sends mail',
      ),
      open(
        'A link that expired',
        '`issuePasswordReset` stamps a link with `RESET_LINK_HOURS` and the users screen shows when it runs out, but no screen consumes one — so «this link has expired» is a state the record can express and nobody can reach. It needs the sign-in screen to take a token, which needs the mail that carries it',
      ),
    ],
  },
  {
    /*
     * The Protokoll, which every other flow writes to and none of them read.
     *
     * `logChange` is called from forty places. Until this entry the board had
     * no row for the screen that answers the question all of them exist to
     * answer: «since when has Saturday cost 25%, and who decided that?»
     */
    id: 'changelog',
    en: 'Finding out what changed',
    actors: ['owner'],
    entries: [
      ok('Open the log', '/admin/changelog', 'Every price, rule, catalogue and content change lands here'),
      ok('From a person', '/admin/users', 'A team member’s record links into the log filtered to what they did'),
      ok('Search the whole panel', '/admin/search', 'The command palette reaches the record itself rather than the log entry about it'),
    ],
    actions: [
      ok('Filter by who', '/admin/changelog', 'The question is nearly always about a person, not a date'),
      ok('Read what a settings change was', '/admin/settings', 'Autosaving screens coalesce their entries, so changing «25» to «30» is one line rather than three'),
    ],
    exits: [
      ok('The answer, with a date and a name', '/admin/changelog'),
      open(
        'Undo',
        'The log says what happened and never puts it back. Reversing a settings change is retyping the old number, which is why the entry records the field rather than the value — a log that implied undo and did not have it would be worse than one that plainly does not',
      ),
      open(
        'What a deleted record said',
        'An erasure keeps the fact and never the text — a review erased under §20.6 leaves «Review erased on request (1★)» and nothing else. That is the point, and it means the log cannot answer «what did it say» for exactly the records somebody most often asks about',
      ),
    ],
  },
  {
    id: 'construction',
    en: 'Curating the construction portfolio',
    actors: ['owner', 'visitor'],
    entries: [
      added('Open the portfolio', '/admin/construction', 'One tab per group, in the order the page renders them — so the screen and the page are the same shape'),
      added('Read it', '/construction', 'Four sections, one per group'),
    ],
    actions: [
      added('Take a picture down', '/admin/construction', 'The commonest edit to a portfolio is not adding — it is removing the one job the client would rather not see advertised, and putting it back six months later'),
      added('Reorder within a group', '/admin/construction', 'Which ceiling leads the section is the whole of what a portfolio decides'),
      added('Write the caption', '/admin/construction', 'Per language, and it is what a screen reader is given — a missing one is flagged on the card'),
      added('Move it to another group', '/admin/construction', 'A picture filed under the wrong trade is the commonest thing to find and the hardest to fix in a file'),
      added('Add one from this machine', '/admin/construction', 'A file from the computer somebody is sitting at, scaled to 1600 px and kept in IndexedDB — `localStorage` holds the rest of the store and one phone photograph would have taken the whole dataset with it'),
      added('Or one already in the project', '/admin/construction', 'The twenty-two the prototype ships, and anything uploaded earlier — an upload is reusable rather than being spent on the record it was made for'),
      added('Rewrite a section heading', '/admin/construction', 'Three fields per language: the plain heading, and the two halves of the two-colour display heading — which words are red is a writing decision, not formatting'),
      added('Reorder the sections', '/admin/construction', 'The arrows set the order the page renders them in'),
      added('Add or remove a section', '/admin/construction', 'A section still holding pictures is refused with the count: deleting a heading is a labelling decision, deleting the work under it is not'),
    ],
    exits: [
      added('On the page', '/construction', 'The grid reads the record and falls back to the file before hydration, so the server still renders the real page rather than a gap that fills in'),
      added('Off the page', '/construction', 'A group whose pictures were all taken down renders nothing at all — an empty grid under a heading reads as a load that failed'),
      added(
        'A photograph that was never in the project',
        '/admin/construction',
        'The picker takes a file from the machine, shrinks it to 1600 px and keeps it in IndexedDB. What it cannot do is put it anywhere else: the pictures live in this browser, so another computer sees the seeded twenty-two and nothing that was added here',
      ),
      open(
        'A picture that survives the browser',
        'An upload is real and it is local. Storage that outlives one machine is the thing a server is for, and it brings the questions this prototype has no answer to — where the file lives, what it costs, and who owns the photograph of somebody else\u2019s building',
      ),
    ],
  },
  {
    id: 'gallery',
    en: 'Putting a job in the gallery',
    actors: ['contractor', 'owner', 'customer', 'visitor'],
    entries: [
      added('The crew photographs the job', '/job/bkg_3/check', 'A before and an after on one booking — a context shot never pairs, and a gallery built from loose photos would put a picture of a damaged worktop on the marketing site'),
      added('The office adds one by hand', '/admin/work', 'The door the screen did not have. Photos reached this app one way — the field screens — so a job shot on somebody’s phone, or pictures a customer sent by mail, could not become a reference at all'),
      added('The pair waits for a decision', '/admin/work', 'The «Ohne Freigabe» tab, which is where a job sits until somebody asks'),
    ],
    actions: [
      added('Release it', '/admin/work', 'Both halves at once — the pair is what the customer agreed to, and releasing one is a photograph published without permission'),
      added('Withdraw it', '/admin/work', 'Off the site at once; the pictures stay on the job'),
      added('The customer withdraws consent', '/account/requests/req_3', 'The other writer, and the one §20.6 is actually about'),
    ],
    exits: [
      added('On /work', '/work', 'Filtered by the same rule the panel applies — `lib/gallery` is the one place that knows what a work is'),
      added('Never shown', '/admin/work', 'The «Kein Paar» tab says which of the two honest reasons applies'),
      open(
        'Consent is asserted, not recorded',
        'The switch says written consent exists and the confirm says so out loud, but the app holds no document, no date and no signature — §20.6 wants the record. Where that lives is a question about how the business actually collects it: a tick on the job sheet the customer signs, a line in the contract, or a separate form',
      ),
    ],
  },
  {
    id: 'enquiry',
    en: 'Answering a contact enquiry',
    actors: ['visitor', 'owner'],
    entries: [
      added('Somebody fills in the form', '/contact', 'Six fields, one of them a consent tick that §20.6 requires before anything is stored'),
      added('It lands in the inbox', '/admin/enquiries', 'Oldest first in the open tab — an inbox is a queue, and the one about to break the promise on /contact is the one that has waited longest'),
    ],
    actions: [
      added('Read it', '/admin/enquiries', 'Cards, not a table: the message is the record, and a truncated cell would hide the only thing worth reading'),
      added('Reply', '/admin/enquiries', 'By mail or phone, through the links on the card. The answer happens outside this app and an outbox that sends nothing would be worse than saying so'),
      added('Write the answer down', '/admin/enquiries', 'Replying *is* answering, so it is one action — the screen used to record that somebody answered and never what they said, which is the half that matters when the person rings a week later and gets whoever picks up'),
      added('Mark it answered', '/admin/enquiries', 'Still there for the ones dealt with entirely by phone, where there is no text to keep'),
      added('Turn it into a customer', '/admin/customers/cus_1', 'The commercial exit. Not automatic — one of the five seeded enquiries is a supplier'),
      added('Delete it', '/admin/enquiries', 'Into the bin, recoverable — the rule a review already follows'),
    ],
    exits: [
      added('Answered', '/admin/enquiries', 'Off the open queue, with the name and date on the record'),
      added('A customer record', '/admin/customers/cus_1', 'The enquiry links to it and stops being something to answer'),
      added('A request', '/admin/requests', 'The commercial exit, and the one the inbox is actually for'),
      added('Binned', '/admin/enquiries', 'Restorable from the third tab; spam is the honest reason'),
      open(
        'The reply actually leaves the building',
        'The answer is written down and, where the person is already a customer, lands in their message thread — but nothing in this app sends an email. The office still replies by mail or telephone; this records what was said rather than saying it. An outbox is a wave of its own, and the templates screen already holds the texts it would use',
      ),
      added('Turn it into a request', '/admin/requests/new?enquiry=enq_1', 'The wizard opens pre-filled with the customer, where one exists, and the words the person actually wrote — and the enquiry links to the request it became'),
    ],
  },
  {
    id: 'blog',
    en: 'Writing a blog post',
    actors: ['owner', 'visitor'],
    entries: [
      added('Write a new one', '/admin/blog', 'Created as a draft, always — «aufschalten» on an untitled post would put a blank card on the index'),
      added('Pick up a draft', '/admin/blog', 'Drafts sort to the top: the list is a desk, not an archive'),
      added('Read one', '/blog', 'The section a visitor finds through search rather than through the menu'),
    ],
    actions: [
      added('Write it in sections', '/admin/blog/wohnungsabgabe-checkliste', 'A heading and its paragraphs, so every block is separately translatable — and no markdown in front of the office'),
      added('Translate it', '/admin/blog/wohnungsabgabe-checkliste', 'A language counts as written only when the title, the lead and every heading are there; half a translation reads as a broken page rather than an untranslated one'),
      added('Put a picture in it', '/admin/blog/wohnungsabgabe-checkliste', 'From this machine, from the project, or from an address — the same picker the portfolio screens use'),
      added('Point it at a service', '/admin/blog/wohnungsabgabe-checkliste', 'Draws the box at the foot of the article that leads into the request flow — the commercial point of the whole section'),
    ],
    exits: [
      added('Published', '/blog/wohnungsabgabe-checkliste', 'Into the index and the sitemap, at the next build'),
      added('Withdrawn', '/admin/blog', '`publishedAt` is kept, so re-publishing gives you the same article rather than a new one'),
      added('Deleted', '/admin/blog', 'For good, and deliberately with no archive: no invoice hangs off a piece of writing'),
      open(
        'A visitor sees it',
        '/blog is statically rendered like the rest of the marketing site, so an article published in the panel is on the website at the next build — the same boundary as §17.2b and §17.2c, said out loud in the publish confirm rather than implied',
      ),
      open(
        'Somebody outside the office writes one',
        'The «website» right covers the homepage, the legal pages and the blog together. A freelance writer who should be able to draft an article and nothing else has no shape in the matrix — that is a fourth permission, and whether the business wants one is a question about how it actually commissions writing',
      ),
    ],
  },
  {
    id: 'area',
    en: 'Changing the service area',
    actors: ['owner'],
    entries: [
      added('The area list in settings', '/admin/settings', 'Eight switches over a frozen array became a list with an «add» on it'),
    ],
    actions: [
      ok('Switch an area off', '/admin/settings', 'Stops new requests; every property, job and invoice in that town stays'),
      added('Add a municipality', '/admin/settings', 'Postcode, name, page address and coordinates. Refused on a duplicate postcode or a duplicate URL — two towns on one address means one of them is unreachable'),
      added('Correct one', '/admin/settings', 'A changed postcode moves in `servedPostcodes` with it, or the area would answer «ausserhalb» for its own town'),
    ],
    exits: [
      added('Removed', '/admin/settings', 'Only while nothing sits on the postcode'),
      added(
        'Removal refused, with the count',
        '/admin/settings',
        'Properties, customer addresses and applications are counted first. A postcode is not a foreign key, so deleting the row breaks nothing a type would notice — it just makes every address in that town read as outside the area, silently',
      ),
      open(
        'The area’s own page appears',
        '/areas and its children are pre-rendered from `SERVED_REGIONS`, so a municipality added in the panel is served, quotable and bookable at once and gets its page at the next build. Removing a seeded one has the mirror problem, and the confirm step says so',
      ),
      open(
        'Coordinates come from somewhere other than a person',
        'Latitude and longitude are typed, validated only against Switzerland’s bounding box, and drive the travel buffer between two jobs. A real build geocodes the name; this one asks, and says on the form what the numbers are for',
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
