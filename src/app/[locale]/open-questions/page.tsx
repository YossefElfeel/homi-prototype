import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = { title: 'Open questions' };

type Entry = {
  ref: string;
  question: string;
  decision: string;
  screens: string;
  state: 'decided' | 'open' | 'overridden';
};

/**
 * Every assumption the build rests on, in one place, tied to the screens it
 * touches. `overridden` marks the places where a client decision replaced what
 * the specification says — those are the ones that will bite if they are ever
 * read back out of the original documents.
 */
const ENTRIES: Entry[] = [
  {
    ref: '§21.1',
    question: 'Per room or per hour for recurring cleaning?',
    decision:
      'The hour is the only pricing unit. Area, rooms and bathrooms feed a duration estimate. This is what makes the per-visit price of a plan, and its discount on everything beyond the plan, computable.',
    screens: '13–22, 54, 73',
    state: 'decided',
  },
  {
    ref: '§21.2',
    question: 'How is VAT shown?',
    decision:
      'Not VAT registered — one final price, no tax line anywhere. Stated once on the pricing page rather than repeated per screen.',
    screens: '3, 23, 40, 71',
    state: 'decided',
  },
  {
    ref: '§21.3',
    question: 'Build invoicing or integrate?',
    decision:
      'Integrate with an accounting system (Bexio or equivalent) and issue QR-Rechnung. The prototype renders a real Swiss QR-bill layout against mock data.',
    screens: '40, 71, 72',
    state: 'decided',
  },
  {
    ref: '§21.4',
    question: 'When does the customer pay?',
    decision:
      'Full payment on accepting the quote. Reaffirmed by the client after we proposed a card pre-authorisation instead. The consequence is that the whole trust burden sits on the design — hence the guarantee block, the access-method screen and the “what happens next” card directly above the pay button.',
    screens: '27, 28, 31',
    state: 'decided',
  },
  {
    ref: '§21.5',
    question: 'Three proposed slots, or live availability?',
    decision:
      'OVERRIDDEN, then split by customer. A returning customer picks from live availability and books outright — we know the property, the access and the history, so a confirmation loop would be theatre; a 15-minute hold protects the §20.2 race. A first-time customer proposes up to three dates and the office confirms one, which is then held for 48 hours. Nothing is blocked in the calendar while the proposals sit unanswered.',
    screens: '25, 25a, 31, 54, 57a',
    state: 'overridden',
  },
  {
    ref: '§2a',
    question: 'Does a booking need to be assignable after it is created?',
    decision:
      'Not today. Homivaro is one person, so every job is Marco’s: the booking screen carried an «Assigned to» line printing the same name on every record, and a «Zuweisen» panel whose select had one option in it. Both are gone, and the calendar’s row menu no longer offers a step that leads nowhere. `assigneeId` stays on the record and is still set when a job is created, because the hiring track exists to produce a second pair of hands — the day an application is accepted this screen needs the panel back, and this entry is the note that says so. Confirmed by the client: «no assigned to because it’s solo (one person)».',
    screens: '63, 65',
    state: 'decided',
  },
  {
    ref: '§9.2a',
    question: 'Does the quote need a contract document and a countersignature?',
    decision:
      'Yes to both, and the order runs the other way from the one first assumed: the company signs first and the customer’s signature closes the agreement. So nothing waits on the owner after the customer has paid, and there is no state where money has changed hands against an unsigned contract. The terms are the published AGB rendered inside the document on screen 26 rather than a link beside it — the customer is signing a document, not three facts. The owner’s mark is stored once in settings and applied by sendOffer, and copied onto the offer rather than referenced, so redrawing it never restates a contract already closed. A new version is a new contract: both marks start again.',
    screens: '26, 55, 57a, 80–82',
    state: 'decided',
  },
  {
    ref: '§9.3a',
    question: 'Should the owner see the customer’s payment step at all?',
    decision:
      'Payment state, yes; the payment form, no. The quote list and detail show whether the money arrived, by which method, and why it failed — the owner had to open the invoices list and match by name and date for that. The gateway itself stays in the customer flow; the owner reaches it only through “open the customer view”, which is a preview and is labelled as one.',
    screens: '27, 57, 57a',
    state: 'decided',
  },
  {
    ref: '§1.2a',
    question: 'Does a phone call use up one of the two jobs a day?',
    decision:
      'No, and an on-site viewing does not either — but a viewing blocks the time while a call does not. The two-job ceiling is a statement about how much cleaning one person can do in a day; spending it on a five-minute callback would make the calendar refuse real work in order to protect a phone call. Blocking is a separate question and turns on where the owner has to be: a viewing is somewhere, a call is anywhere. Assumed, not specified — the documents never contemplated anything on the calendar that was not a job.',
    screens: '58, 58a, 63a',
    state: 'open',
  },
  {
    ref: '§4.2a',
    question: 'Can the office book a job the customer never paid for?',
    decision:
      'Yes, and it meets the same gate the customer does. A booking could previously only come out of a paid quote, which does not describe a business whose work arrives by phone. The manual path runs the identical dayBlockReason — Sunday, company holidays, the notice period and the daily ceiling all refuse it — because a rule the office can click around is not a rule. The override the owner actually needs is to move a closure or raise the ceiling, and both already exist in settings.',
    screens: '58a, 57b',
    state: 'decided',
  },
  {
    ref: '§11.2',
    question: 'Is a subscription visit a fixed recurring slot?',
    decision:
      'OVERRIDDEN: no fixed slot. The system proposes the next visit at the same weekday and time; the customer can move any visit to any available slot.',
    screens: '43, 70, 58–61',
    state: 'overridden',
  },
  {
    ref: '§11.1',
    question: 'Is a plan a monthly charge or a package bought up front?',
    decision:
      'OVERRIDDEN: a package, paid once. The whole model read as a monthly subscription — a discount percentage, a next-charge date, a notice period, a minimum term — and the business confirmed the opposite: one payment at sign-up buys a fixed number of visits, usable for a year. Everything followed from that. Plans became a real entity the office can add, price, retire and hide (they were three string literals). Visits are counted, so a plan can run out before its term does. pastDue and cancellationPending were removed as unreachable and expired added. The consequence to confirm: at the seeded rhythms a year of weekly cleaning is a four-figure sum payable on the day, which is a large amount to ask for in one instalment — the alternative is smaller packages, and that is a business decision, not a design one.',
    screens: '4, 43, 69, 69a, 70, 70a',
    state: 'overridden',
  },
  {
    ref: '§11.4',
    question: 'When can a plan be cancelled, and is it refunded?',
    decision:
      'A fixed window from the purchase date — 14 days by default, editable on screen 82 — and only while no visit has taken place. Inside it the plan is undone and the full amount refunded; outside it the plan stands and the visits stay usable to the end of the term. This replaces a one-month notice period, which described the monthly product. The rule lives in the store rather than only in a disabled button, so no URL walks past it.',
    screens: '43, 70, 70a, 82',
    state: 'decided',
  },
  {
    ref: '§11.5',
    question: 'What happens when the year ends?',
    decision:
      'It expires and the customer renews it themselves, in one click, which raises an invoice. Nothing is charged automatically — the prototype has no billing run, and inventing one would claim behaviour it does not have. Expiry is derived from the end date when the record is read rather than stored, for the same reason: a stored flag would be wrong every morning until someone opened the page. Unused visits lapse with the term, and both the customer screen and the panel say so in as many words rather than letting it be discovered.',
    screens: '43, 70a',
    state: 'decided',
  },
  {
    ref: '§21.6',
    question: 'Package credit in visits or hours?',
    decision:
      'Visits, counted on the plan — which replaces the answer of hours in the specification. What a customer buys up front is a plan with a number of included visits, and what they spend is one of those visits; the counter every plan screen already shows is the whole balance. The separate hour credit this question invented is gone from both the customer account and the panel, because it was a second ledger answering the same question: hours came off one balance while the visit counter on the plan stayed where it was, and a job could be covered twice or not at all depending on which of the two a screen happened to read. Work beyond the included visits is quoted and paid for at the discount the plan carries, so nothing is lost — only the second balance.',
    screens: '43, 70a',
    state: 'overridden',
  },
  {
    ref: '§21.7',
    question: 'Changing plan mid-commitment?',
    decision:
      'PARTLY OPEN, and the half that was missing is now built. The rule stands — upgrade immediately, downgrade from the next term. Moving up happens in the account: the customer picks the larger package, sees what changes against the one they hold, and confirms with a method already on file. It is the same subscription on the same address, with a new package, a restarted term and an invoice that carries the credit as its own line. What is still the business decision is the credit itself. The arithmetic used is the only one the model supports without inventing a rate — the unused visits at what the customer paid per visit on the old plan, so on Basic at CHF 3440 for 26 visits, 23 unused visits credit CHF 3043.10 — but whether unused visits are credited at all, in full, or at some other figure is theirs to confirm. The number is printed on the confirmation rather than applied silently, so a customer can check it. Moving down is not built: nothing here schedules a change for a future date, and the screen names the office for it.',
    screens: '43, 70a',
    state: 'open',
  },
  {
    ref: '§21.9',
    question: 'What counts as proof of work?',
    decision:
      'Before/after photos plus check-in and check-out timestamps. Signature and geolocation are out. Note this is separate from the e-signature on the quote (§9.2), which stays.',
    screens: '26, 87',
    state: 'decided',
  },
  {
    ref: '§21.10',
    question: 'Are permissions deferred?',
    decision:
      'No — two roles exist from day one. Access codes: owner always, assigned contractor on the job day only, customer never. Applicant data is owner-only under revDSG.',
    screens: '53, 67, 86, H1, H2',
    state: 'decided',
  },
  {
    ref: '§21.12',
    question: 'Liability insurance and permanent key holding?',
    decision:
      'Key holding stays locked until a policy exists. Both states are built and the demo bar switches between them — neither state ever claims cover that is not there.',
    screens: '7, 68',
    state: 'decided',
  },
  {
    ref: '§5.1',
    question: 'What time does the evening surcharge start?',
    decision:
      'The documents never define it and the working day ends at 18:00. Configurable in settings; 17:00 is the default.',
    screens: '82, 54',
    state: 'decided',
  },
  {
    ref: '§5.1',
    question: 'Which seven services exactly?',
    decision:
      'Derived from the pricing rules plus the four columns of the duration matrix — the documents never list them together. Editable from the admin services screen.',
    screens: '2, 3, 13, 73',
    state: 'decided',
  },
  {
    ref: '§18',
    question: 'Does the admin panel need a footer?',
    decision:
      'No, and it is not an oversight. The panel is a tool, not a page: every route is a working surface with a sidebar that already carries the account, and a footer would take vertical room from tables that need it while repeating links nobody reaches for mid-task. The legal pages the marketing footer carries are a visitor obligation, not an internal one. Recorded here rather than left as a silent absence, so it does not get re-asked every review.',
    screens: '51–86',
    state: 'decided',
  },
  {
    ref: '§21.9',
    question: 'What does an office plan cost, and which other services get one?',
    decision:
      'OPEN. /abos now groups plans by the service they buy, and the two office plans that make that visible are priced by the same arithmetic as the household ones — an office visit at two and a half hours times the CHF 49 rate, less the package discount. The duration is our estimate, not a figure the business gave us, so both prices need confirming. The wider question is which of the seven services can carry a plan at all: a plan is a rhythm, and a move-out clean, a one-off clean and a furniture assembly each happen once. Window and deep cleaning could, but only quarterly — and `RhythmKey` has no quarterly, so neither can be modelled today.',
    screens: '4, 70',
    state: 'open',
  },
  {
    ref: '§19.1',
    question: 'Company legal details for the Imprint?',
    decision:
      'OPEN. Phone numbers come from the brand card; registered address, UID and legal form are placeholders marked TODO:legal. An Imprint is a legal requirement in Switzerland — this must be filled before any real launch.',
    screens: '10',
    state: 'open',
  },
  {
    ref: '§20.1',
    question: 'Does an out-of-area postcode block the request, or only flag it?',
    decision:
      'OVERRIDDEN: it blocks. The specification says marked, not blocked — the request went through, the queue carried a warning chip on the customer’s name, and the office declined it by hand a working day later. So the answer was already known at the postcode field and the visitor spent the wait believing one was coming. The check is now a gate on screen 16, on the phone intake, and in the store, so no URL walks past it. A half-typed postcode is still not a refusal, and a draft taken mid-call is exempt until it is submitted. Consequence to confirm with the business: a job just past the boundary can no longer be taken by adding travel to the quote — the address has to be inside the eight, or the served list has to grow on screen 80.',
    screens: '16, 22, 51, 52, 56, 64',
    state: 'overridden',
  },
  {
    ref: '§10a',
    question: 'Is there anybody but the owner who may raise, approve or cancel an invoice?',
    decision:
      'OPEN, and the prototype assumes not. Billing is owner-only: AdminShell keeps every other role out of the panel entirely, and lib/invoice-permissions writes the same answer out per action so the rule is one table rather than eleven inline conditions. Two things could change it and neither is ours to decide. The hiring track exists to produce a second pair of hands — a contractor who finishes a job is the person who knows what to bill for it, and today they cannot see the invoice at all. And a bookkeeper is the ordinary Swiss arrangement for a company this size: somebody who may raise and send but not cancel, because cancelling is the decision that moves money. Inventing either would mean inventing an approval hierarchy nobody has asked for; the table is written so that adding one is a change in one file.',
    screens: '71, 71a, 72',
    state: 'open',
  },
  {
    ref: '§10b',
    question: 'Are payment terms fixed at thirty days, or set per invoice?',
    decision:
      'Per invoice, chosen at creation, defaulting to thirty. Thirty days was a constant in the store and the only term the product could express, which is what a prototype does before anyone asks — but the two ends the office actually reaches for are a shorter term for a customer who has been slow before and a longer one for a commercial contract that pays on its own cycle. What is deliberately not built: a default term stored per customer. That is the version that stops the owner choosing every time, and it needs the business to say whether a customer’s terms are a standing agreement or a per-job decision. The term counts from approval rather than from creation, because that is the day the customer receives the bill.',
    screens: '71a, 72',
    state: 'open',
  },
  {
    ref: '§17.2a',
    question: 'What does a service the owner adds herself look like on the website?',
    decision:
      'OPEN, and the prototype ships the honest half. The catalogue can now be added to, and a new service reaches the site with everything the seven seeded ones have except two things the code holds rather than the record: its icon and its long-form page copy. The icon falls back to a neutral glyph — deliberately not a crash and deliberately not a guess. The copy — the lead paragraph, the included list, the «what is not included» block, the FAQ — lives in `content/services.ts`, keyed by the seven slugs, which is why an added service is publishable but has no page of its own on the marketing site: /leistungen/[slug] renders only what is offered *and* seeded. Two ways out and the business has to pick one. Either the long copy becomes part of the record and the editor grows a section per block, which makes the catalogue the whole source and the content file redundant. Or an added service stays a request-flow and price-list entity and never gets a marketing page, which is defensible for a call-out fee and wrong for «Teppichreinigung». Until then the seeded draft is the demonstration: it can be priced, activated, booked and billed, and it is not linked from the marketing site.',
    screens: '2, 73, 73a, 74',
    state: 'open',
  },
  {
    ref: '§11a',
    question: 'Is an add-on on a plan-covered visit billed, included, or not offered at all?',
    decision:
      'OPEN, and the prototype currently gives it away. A request covered by an active plan is never quoted — `requestCoverage` returns `subscription`, the quotes list reads «Zahlung nicht fällig», and no invoice is raised. Add-ons ride on that request, so a customer with a plan who ticks «Backofen» gets CHF 39 of work for nothing, silently, and no screen anywhere says so. Three defensible answers and the business has to pick one. Bill the add-on separately, which means a covered visit can still produce a small invoice and the «payment not due» rule stops being absolute. Fold add-ons into the package, which is generous and makes the plan price wrong. Or hide the «Extras» step from a covered request entirely, which is the cheapest to build and the worst to explain on the phone. Deliberately not guessed here: every one of the three changes what a plan is worth, and that is a price decision rather than a screen.',
    screens: '17, 27, 68, 75',
    state: 'open',
  },
  {
    ref: '§17.2b',
    question: 'Does an add-on the owner adds herself reach the marketing site?',
    decision:
      'Not until the next deploy, and that is the same boundary as §17.2 rather than a second problem. /leistungen/[slug] is statically rendered and reads `SEED_ADDONS`, so an add-on written in the panel is bookable, quotable and billable the moment it is switched on — it simply is not advertised on the service page until the site is rebuilt. What *was* a bug and is fixed: the page filtered add-ons by which services they belong to and never by whether they were still offered, so one the owner had switched off went on being advertised at its price while the request flow, which does check, refused to offer it. Both now go through `addOnsForService`.',
    screens: '2, 75, 75a',
    state: 'open',
  },
  {
    ref: '§11.4a',
    question: 'What does an Apple Pay or Google Pay method "on file" actually stand for?',
    decision:
      'OPEN, and the form ships the honest version. A card asks for its four fields and keeps three facts; TWINT asks for the number it is registered to. A wallet has no equivalent — the sheet on the device picks the card and authenticates it, a browser cannot open one, and what the real integration hands back is a token bound to that device. So the form asks which device and says on the form that this is what it is standing in for, which is also the only thing that separates a customer\'s two wallet entries: the seed already labels one «Apple Pay · iPhone». Two things the business has to settle. First, whether a wallet belongs on file at all — a wallet is normally tapped fresh at each checkout, and a saved one that cannot be re-authenticated from the office is a row that promises more than it can do. Second, whether the device list is right: it is four Apple products and three Google ones, picked because they are proper nouns in all four locales, and a real integration would return the device name rather than offer a menu of them. Both answers change the row, not the flow — the card and TWINT halves stand either way.',
    screens: '45, 65',
    state: 'open',
  },
  {
    ref: '§9.4a',
    question: 'Where does a customer actually type a coupon code?',
    decision:
      'OPEN, and the coupon screens are the half that exists. The office can write a code, scope it to services, cap it, date it and switch it off, and `pricing.ts` has been able to apply one since §20.2 — both kinds, never stacked with the plan discount, larger one wins. What no screen does is hand it one. There is no code field in the request flow, none on the quote, none at payment, so `usedCount` never moves and the redemption figures in the seed are history rather than bookkeeping. The place it goes is the decision, not the field. In the request flow the discount is visible before the customer commits, which is what makes a code worth printing — and it means the quote has to be built twice if the office later edits it. On the quote it stays under the office\'s control and the customer meets a number they cannot reproduce from the price list. At payment it is simplest to build and the worst of the three: the amount changes on the last screen, which is the one place this build has spent the most effort making trustworthy. Not guessed here because it also decides where the redemption is recorded, and a coupon that is counted in two places is counted wrong.',
    screens: '17, 27, 31, 76, 77',
    state: 'open',
  },
  {
    ref: '§9.4b',
    question: 'Is the date on a coupon its start, or when it was written?',
    decision:
      'The label now reads «Erstellt am» / "Created at" and the field behind it is still `validFrom`. Worth confirming rather than undoing: the office asked for the wording, and for a code written on the day its window opens the two readings agree. They come apart the moment somebody writes a campaign in advance — which is exactly what `scheduled` exists for, and screen 76 carries a coupon three weeks out to keep that state reachable. So the screen labels a start date as a creation date, and the one coupon where that is wrong is the one the state registry was built around. `Coupon` stores no creation date at all, so this is a label placed over an existing field rather than a field renamed: a real `createdAt` is a schema change plus a value for every seeded coupon, and it buys nothing until the business says which of the two dates it wants to read here. If the answer is both, `validFrom` keeps driving `scheduled` and `createdAt` joins it read-only.',
    screens: '76, 77',
    state: 'open',
  },
  {
    ref: '§7.2b',
    question: 'Where does the end date of a fixed-term job live?',
    decision:
      'Nowhere, and the seed says so in prose. `JobPosting` has `kind: temporary` and nothing else — no end date, no season — so the seasonal role that runs March to October announces that in its summary text, where nothing can read it. Three things follow that a reviewer should see before the schema is settled. The jobs page cannot sort or filter by it. A fixed-term role that has ended stays published until somebody remembers to switch it off, which is the same failure the `validTo` on a coupon exists to prevent. And an accepted applicant becomes a `TeamMember` with a `startedAt` and no end, so the contract type stops being recorded the moment it starts to matter for payroll. The cheap version is a nullable `endsAt` on the posting; the honest version is that the term belongs on the employment, not on the advertisement, and this prototype has no employment record to put it on.',
    screens: 'C1, C2, H3, H4, H7',
    state: 'open',
  },
  {
    ref: '§20.6a',
    question: 'Where does a customer see the photos of a job that has no request behind it?',
    decision:
      'Nowhere, as of this wave, and the answer decides whether a customer-facing job screen has to exist. «Vorher / Nachher» was a tab of its own listing every job the customer ever had; it is a card on the request that produced the job now, which is where somebody actually asks the question — and which is also where the §20.6 consent switch went, because that switch is the only way a customer can take a photograph back off the public gallery. Two kinds of job have no request to hang it on. A plan visit is created from the subscription and carries a `subscriptionId` instead, so the whole of a plan customer’s photography is now unreachable from their own account — and a plan customer is the one who accumulates the most of it. A booking entered by the office without a quote behind it, `bkg_3` in the seed, has neither. Both are still visible to the office and both still reach /referenzen if consent was recorded, so the gap is not in what is stored: it is that the person whose flat is in the picture can no longer withdraw it. The cheap version is a link from the plan to its visits. The honest version is the customer-facing job screen this prototype has never had — every route into a finished job today goes through the request, and two of the three ways a job can be created do not start with one.',
    screens: '37, 43, 47, 5',
    state: 'open',
  },
  {
    ref: '§10.3a',
    question: 'Which costs is the office willing to type in, and how do the standing ones arrive?',
    decision:
      'OPEN, and the whole cost side rests on the answer. Every expense in this build is entered by hand — that is fine for the garage bill that arrives once a quarter and it is not fine for the rent, the insurance and the three subscriptions, which are the same six figures every month for ever. They carry a `recurring` flag today and the analytics read it, so «was läuft weiter, auch wenn der Monat leer ist» is answerable; what nothing does is write next month’s copy. A `RecurringExpense` with no engine behind it would be a record promising an automation the app does not have, so the decision comes first and it is a product decision, not a schema one: does the office want next month raised automatically the day it falls due, or a reminder on the dashboard that it is due and nobody has entered it. The second is less code and more honest — an expense that appears without anybody looking at it is one nobody checks against the bank. Wages are the other half of the same question. They are the largest cost in a cleaning company and they are on the category list, so the profit figure is not a fiction; but nothing here is a payroll, and a business with three contractors will not want to type three lines a month into this screen.',
    screens: '71b, 71c, 71d',
    state: 'open',
  },
  {
    ref: '§10.3b',
    question: 'Does the profit line mean what the owner will read into it?',
    decision:
      'OPEN, and stated on the screen rather than left to be assumed. Revenue and costs are both counted by the month the work happened in — an invoice by the month it was issued, a cost by the day it arose — because counting one on the payment date and the other on the invoice date puts the income and the cost of a single job in different months and makes every monthly figure wrong in a way that averages out to right. The consequence is that revenue includes bills nobody has paid, which is why «offen» is a tile of its own beside it. The bigger assumption is what is *not* in the costs: the owner’s own pay. A sole proprietor draws from the profit, so putting a salary in beside the rent would count the same money twice — but it means the figure headed «Gewinn» is what is left before the owner is paid and before tax, and a 40% margin read without that sentence is a number somebody will quote at a bank. It says so under the tiles. Two things the business has to settle: whether that is the figure they want headed «Gewinn» at all, and whether a second line showing what the owner actually drew belongs beside it.',
    screens: '71b',
    state: 'open',
  },
  {
    ref: '§6a',
    question: 'Is the town on an address the office’s word, or the postcode’s?',
    decision:
      'OPEN, and the form now takes a position that is easy to reverse. The eight municipalities are a fixed table keyed by postcode (`SERVED_REGIONS`), and the properties list derives the zone a row is filed under from the postcode alone — so «8706 / Zürich» filed itself under Meilen and printed Zürich on every quote at that address, and both screens that could produce it were free-text boxes. Typing a served postcode now fills the town, and stops doing so the moment somebody edits the town themselves. That is a convenience, not a constraint: the town stays typeable, an address outside the eight is still enterable and still saveable, and nothing refuses. Whether it should refuse is the question. Making the town a `<Select>` of the eight would make the two impossible to disagree — and would also make an address in Rapperswil unenterable, which the office does take work in occasionally. Not decided here because it also decides what happens to the four seeded properties that sit outside the area today.',
    screens: '66, 67, 67a',
    state: 'open',
  },
  {
    ref: '§9.4c',
    question: 'Should a percentage code without a ceiling be allowed at all?',
    decision:
      'OPEN. The ceiling exists now and is optional, which keeps every seeded code valid and matches how the office already thinks — SPRING25 ran at 25% uncapped on deep cleans and nobody minded, because a deep clean has a natural size. WELCOME10 is the one that needed it: it goes out with every first quote, and 10% of a move-out clean with the windows is CHF 180 handed back to somebody who has never bought anything. So the field is optional and the seed uses it on exactly the code that needs it. The alternative is to require a ceiling on every percentage, on the argument that an uncapped percentage on an open-ended price list is a liability nobody has bounded — the office would have to think about the number once per campaign rather than never. That is a policy the business owns, not a default worth inventing; and it interacts with §9.4a, because until a code can actually be redeemed neither version has ever cost anything.',
    screens: '76, 77',
    state: 'open',
  },
  {
    ref: '§22a',
    question: 'Who besides the owner may hand out access?',
    decision:
      'DECIDED for now, and the decision has a cost the business has to look at. The «Benutzer» right is not grantable: anybody holding it can open their own record and tick the other twenty-one, so offering it would make the whole matrix decoration. «Bewerbungen» is the same shape for a different reason — revDSG, and an application carries a permit and a date of birth belonging to somebody who was never hired. The consequence is that the owner is a single point of failure for access: if Marco is unreachable, nobody can unlock a colleague who has locked themselves out, and nobody can switch off the account of somebody who left on bad terms. The three ways out are a second owner, a break-glass path, or accepting the risk on a company this size. All three are the business’s call, not a default worth inventing — and the screen says out loud which two rights «Voller Zugriff» excludes rather than quietly overstating itself.',
    screens: 'U1, U5',
    state: 'decided',
  },
  {
    ref: '§22b',
    question: 'What happens to the jobs of somebody who is deactivated?',
    decision:
      'OPEN, and the screen refuses to guess. Deactivating stops the sign-in and touches nothing else: assigned jobs keep their assignee, and the confirm dialog counts how many are still ahead and links to the calendar rather than acting. That is deliberate — unassigning them automatically empties a Tuesday nobody has been told about, and holding them for a person who cannot sign in leaves a customer waiting on somebody who has left. Three candidate rules, and they are genuinely different products: unassign and let the calendar show the hole, refuse the deactivation until the jobs are reassigned, or keep them and add an «unbesetzt» state the dashboard counts. The last needs a state that does not exist yet, which is why it is a decision before it is a schema change.',
    screens: 'U1, U2, 62',
    state: 'open',
  },
  {
    ref: '§22c',
    question: 'Does a deactivated colleague’s name stay on the records they left behind?',
    decision:
      'DECIDED, and it is the assumption the whole feature rests on, so it is written down rather than implied. Switching an account off removes nothing: the jobs stay assigned, the change-log entries keep the name that made them, and the record shows the counts before the confirm so the promise can be checked rather than believed. Deleting is refused outright for anybody those counts are not zero for — a user has no archive to be moved into the way a customer does, so the honest answer is a refusal with the number in it, not a second soft state nobody can see. What is not settled is retention: revDSG gives a former employee the same erasure right as anybody else, and «Pia Roth» sitting on a change-log entry two years after she left is personal data with no expiry on it. The applications screen already carries a retention date; accounts do not, and whether they should is a legal question rather than a design one.',
    screens: 'U1, U2, 83',
    state: 'decided',
  },
];

const STATE_CLASS: Record<Entry['state'], string> = {
  decided: 'bg-status-success text-status-success-fg border-status-success-line',
  overridden: 'bg-status-warning text-status-warning-fg border-status-warning-line',
  open: 'bg-status-danger text-status-danger-fg border-status-danger-line',
};

export default async function OpenQuestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-4xl px-gutter py-block">
      <header className="border-b border-line-subtle pb-block">
        <p className="label-type text-ink-tertiary">Delivery</p>
        <h1 className="display-type rule-accent mt-3 text-4xl sm:text-5xl">
          Open questions
        </h1>
        <p className="mt-6 max-w-[var(--measure)] text-ink-secondary">
          Every assumption this build rests on. Marked in the code as{' '}
          <code className="rounded-sm bg-sunken px-1.5 py-0.5 text-sm">
            {'// ASSUMPTION §21:'}
          </code>{' '}
          at the point of use. <strong>Overridden</strong> means a client decision replaced
          what the specification says — read those before reopening the documents.
        </p>
      </header>

      <ul className="divide-y divide-line-subtle">
        {ENTRIES.map((entry, i) => (
          <li key={`${entry.ref}-${i}`} className="py-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-sm border px-2 py-0.5 text-xs font-medium ${STATE_CLASS[entry.state]}`}
              >
                {entry.state}
              </span>
              <span data-numeric className="label-type text-ink-tertiary">
                {entry.ref}
              </span>
              <span data-numeric className="label-type text-ink-tertiary">
                Screens {entry.screens}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-medium">{entry.question}</h2>
            <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{entry.decision}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
