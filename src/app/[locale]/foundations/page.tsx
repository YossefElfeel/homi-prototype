import { setRequestLocale } from 'next-intl/server';
import { Money, MoneyRange } from '@/components/ui/money';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { statesOf, type StatusEntity } from '@/lib/status-registry';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = { title: 'Foundations' };

const ENTITIES: StatusEntity[] = [
  'request',
  'booking',
  'subscription',
  'invoice',
  'review',
  'application',
];

const SURFACES = [
  ['--surface-page', 'bg-page'],
  ['--surface-card', 'bg-card'],
  ['--surface-sunken', 'bg-sunken'],
  ['--surface-accent-subtle', 'bg-accent-subtle'],
  ['--accent-solid', 'bg-accent'],
  ['--surface-inverse', 'bg-inverse'],
] as const;

/**
 * Wave 0 deliverable: proof the token system carries all three directions.
 * Switch the theme in the demo bar — nothing on this page branches on it.
 */
export default async function FoundationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-5xl px-gutter py-block">
      <header className="border-b border-line-subtle pb-block">
        <p className="label-type text-ink-tertiary">Wave 0 · Design system</p>
        <h1 className="display-type rule-accent mt-3 text-5xl sm:text-6xl">Foundations</h1>
        <p className="mt-6 max-w-[var(--measure)] text-lg text-ink-secondary">
          Every element below reads from semantic tokens only. Switching the direction in
          the demo bar re-binds those tokens — no component on this page knows which theme
          it is rendering in.
        </p>
      </header>

      <Section title="Type" note="Display, body and label voices change per direction.">
        <div className="space-y-6">
          <p className="display-type text-6xl">Sauber. Zuverlässig.</p>
          <p className="display-type text-display-6">Reinigung am rechten Zürichseeufer</p>
          <p className="max-w-[var(--measure)] text-base text-ink-secondary">
            Wir reinigen Privathaushalte und kleine Büros zwischen Küsnacht und
            Hombrechtikon. Fester Stundensatz, verbindliche Offerte innert 24 Stunden,
            dokumentierte Ein- und Austrittszeiten.
          </p>
          <p className="label-type text-ink-tertiary">Label / eyebrow / tabular figures</p>
        </div>
      </Section>

      <Section title="Surfaces" note="Six roles. Components never name a colour.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SURFACES.map(([token, cls]) => (
            <div
              key={token}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-line-subtle"
            >
              <div className={`h-16 ${cls}`} />
              <p className="label-type bg-card px-3 py-2 text-ink-tertiary normal-case">
                {token}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Status"
        note="34 states, one colour each, identical on every screen. Source: lib/status-registry.ts."
      >
        <div className="space-y-5">
          {ENTITIES.map((entity) => (
            <div key={entity}>
              <p className="label-type mb-2 text-ink-tertiary">{entity}</p>
              <div className="flex flex-wrap gap-2">
                {statesOf(entity).map((state) => (
                  <StatusBadge key={state} entity={entity} state={state} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Money"
        note="de-CH formatting with the apostrophe separator. A bare number cannot be rendered — the component requires a unit."
      >
        <ul className="space-y-2 text-lg">
          <li>
            <Money amount={49} per="hour" />
          </li>
          <li>
            <Money amount={12} per="unit" />
          </li>
          <li>
            <Money amount={1234.5} emphasis="strong" />
          </li>
          <li>
            <Money amount={196} from />
          </li>
          <li>
            <MoneyRange low={196} high={245} />
            <span className="ml-2 text-sm text-ink-tertiary">
              live estimate during the booking flow
            </span>
          </li>
        </ul>
      </Section>

      <Section title="Actions" note="One primary per screen. Geometry comes from the theme.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Offerte anfordern</Button>
          <Button variant="secondary">Preise ansehen</Button>
          <Button variant="quiet">Termin verschieben</Button>
          <Button variant="ghost">Abbrechen</Button>
          <Button variant="danger">Auftrag ablehnen</Button>
          <Button variant="link">Mehr erfahren</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>
    </main>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-line-subtle py-block last:border-0">
      <h2 className="subhead-type text-2xl">{title}</h2>
      <p className="mt-2 mb-6 max-w-[var(--measure)] text-sm text-ink-secondary">{note}</p>
      {children}
    </section>
  );
}
