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
      'OVERRIDDEN: the customer picks from live availability in both the one-off and the subscription flow. The quote builder shows a read-only availability panel instead of proposing three slots, and a 15-minute hold protects the §20.2 double-booking race.',
    screens: '25, 31, 54',
    state: 'overridden',
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
    decision: 'Upgrade takes effect immediately; downgrade at the start of the next cycle.',
    screens: '43, 70',
    state: 'decided',
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
    ref: '§19.1',
    question: 'Company legal details for the Imprint?',
    decision:
      'OPEN. Phone numbers come from the brand card; registered address, UID and legal form are placeholders marked TODO:legal. An Imprint is a legal requirement in Switzerland — this must be filled before any real launch.',
    screens: '10',
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
