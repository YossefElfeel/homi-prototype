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
      'The hour is the only pricing unit. Area, rooms and bathrooms feed a duration estimate. This is what makes hour-based package credits and plan discounts computable.',
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
      'Hours, tied to a specific property and its recorded specification. A differently-priced visit converts to hours at the current rate.',
    screens: '44, 70',
    state: 'decided',
  },
  {
    ref: '§21.7',
    question: 'Changing plan mid-commitment?',
    decision:
      'PARTLY OPEN. The rule stands — upgrade immediately, downgrade from the next term — and the customer can now see the larger plans and ask for one, which they previously could not do at all. What is not built is the money: on a package bought up front, an upgrade has to credit the visits already paid for, and nobody has said how that is calculated. So the request reaches the office and the adjustment is made by hand. Building the formula would mean inventing a number the business has not confirmed.',
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
