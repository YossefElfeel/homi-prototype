import { setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Money, MoneyRange } from '@/components/ui/money';
import { StatusBadge } from '@/components/ui/status-badge';
import { statesOf, type StatusEntity } from '@/lib/status-registry';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = { title: 'Design system' };

/**
 * The Homivaro design system.
 *
 * /foundations answers a different question — it proves the token layer
 * carries four directions without a component knowing which one it is in, so
 * nothing on that page may describe a specific theme. This page is the
 * opposite: it is the specification for the one direction that ships, the
 * approved Figma file, and it says out loud what that direction decided and
 * why. Both are needed. A reviewer who wants "what does Homivaro look like"
 * got no answer from the proof sheet, and the answer lived in 1,200 lines of
 * CSS comments nobody outside the repo reads.
 *
 * Every specimen below renders from the live token. No value on this page is
 * typed twice: a swatch reads `var(--surface-card)` rather than the hex, so
 * the page cannot drift from the system it documents — if a token moves, this
 * page moves with it, and if a token is deleted the swatch goes transparent
 * instead of quietly lying.
 *
 * Forced to `data-theme="homivaro"` on its own wrapper. The demo bar can put
 * the rest of the app in Raster, and a page that claims to specify Homivaro
 * while rendering Goldküste is worse than no page.
 */

const ENTITIES: StatusEntity[] = [
  'request',
  'booking',
  'subscription',
  'invoice',
  'review',
  'application',
];

const BRAND = [
  {
    group: 'Navy — the HOMI wordmark',
    note: 'The ground. Whole surfaces, the footer, an inverted card. Never the accent.',
    tokens: [
      '--brand-navy-900',
      '--brand-navy-800',
      '--brand-navy-700',
      '--brand-navy-600',
      '--brand-navy-500',
    ],
  },
  {
    group: 'Red — VARO and the cross',
    note: 'A verb, not a surface. Buttons, the focus ring, one word per heading, and exactly one large passive field per page.',
    tokens: ['--brand-red-800', '--brand-red-700', '--brand-red-600', '--brand-red-500'],
  },
  {
    group: 'Green — the leaf',
    note: 'Sustainability cue only. It never becomes a second accent.',
    tokens: ['--brand-green-700', '--brand-green-600'],
  },
] as const;

const SURFACES = [
  ['--surface-page', 'The slab. White, floating on navy at 32px.'],
  ['--surface-card', 'A card that has been lifted — the hover state, not the rest state.'],
  ['--surface-sunken', 'A card at rest. Cards are grey until you touch them.'],
  ['--surface-accent-subtle', 'The quiet red wash behind a secondary action.'],
  ['--surface-inverse', 'The ground under the slab, and the dark card.'],
] as const;

const INK = [
  ['--content-primary', 'Headings and body on a light surface.'],
  ['--content-secondary', 'Supporting copy.'],
  ['--content-tertiary', 'Eyebrows and labels at 11px.'],
  ['--content-accent', 'The accent word in a heading, on light ground.'],
  ['--content-inverse', 'Everything on navy.'],
  ['--content-inverse-secondary', 'Supporting copy on navy.'],
  ['--content-accent-inverse', 'The accent word on navy — a lighter red, because the deep one is 1.95:1 there.'],
] as const;

const LINES = [
  ['--border-subtle', 'The default hairline.'],
  ['--border-default', 'The ring a card grows on hover.'],
  ['--border-strong', 'The secondary button outline.'],
  ['--border-focus', 'The focus ring. Never removed, anywhere.'],
] as const;

const DISPLAY = [
  ['--text-display-1', 'text-display-1', 'Poster headline', 'One per page: the hero, or the closing band.'],
  ['--text-display-2', 'text-display-2', 'Masthead', 'An interior page that opens on a dark card.'],
  ['--text-display-3', 'text-display-3', 'Section', 'The workhorse. Six sections use it.'],
  ['--text-display-4', 'text-display-4', 'Page title', 'A title under a masthead, or a panel heading.'],
  ['--text-display-5', 'text-display-5', 'Footer tagline', 'The one heading in the navy footer.'],
  ['--text-display-6', 'text-display-6', 'Card heading', 'The floor step. Below this, Geist.'],
  ['--text-display-floor', 'text-display-floor', 'The floor', 'Deliberately not fluid: the mobile nav, and a price beside a label it must not crowd.'],
] as const;

const FIGURES = [
  ['--text-figure-1', 'text-figure-1', '160+', 'The single large claim.'],
  ['--text-figure-2', 'text-figure-2', '42k+', 'A counter in a band of counters.'],
  ['--text-figure-3', 'text-figure-3', '49.–', 'A price.'],
  ['--text-figure-4', 'text-figure-4', '24 h', 'A stat inside a masthead, or a table row.'],
] as const;

const RADII = [
  ['--radius-xs', 'The focus ring rounding.'],
  ['--radius-sm', 'Small chrome.'],
  ['--radius-md', 'The form field — the one place a pill fights the content.'],
  ['--radius-lg', 'Cards.'],
  ['--radius-xl', 'The shell and the hero.'],
  ['--radius-action', 'Every control. Fully round.'],
] as const;

const MOTION = [
  ['--motion-fast', 'A field border, a colour swap, anything leaving.'],
  ['--motion-base', 'The button wash, a card ground, the arrow walk.'],
  ['--motion-slow', 'A shadow growing under a card.'],
] as const;

const RULES = [
  [
    'No raw hex in a component.',
    'Colour arrives through a semantic token. A component that names a colour cannot be re-themed, and every value on this page would have to be found by hand.',
  ],
  [
    'One colour per state, everywhere.',
    'lib/status-registry.ts is the only thing allowed to map a record state to a status colour, and those colours do not change per theme — status is information, not decoration.',
  ],
  [
    'Nothing sets Bebas below 36px.',
    'It is condensed and caps-only. Under the floor it stops being a voice and becomes a reading problem. A heading that needs to be smaller steps down to Geist and carries its rank with weight — that is what subhead-type is for. One exemption: the wordmark, which is a fixed lockup at 20px and not a reading voice. npm run test:type-floor is the gate.',
  ],
  [
    'No bare money.',
    'The Money component requires a unit. A number on its own beside a currency is how a prototype ships a pricing bug.',
  ],
  [
    'A card is flat until you touch it.',
    'Elevation is the hover, not the rest state. Rows are the exception: a row that lifts under the cursor breaks the comparison the table exists for.',
  ],
] as const;

export default async function DesignSystemPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div data-theme="homivaro" className="bg-page text-ink">
      <main className="mx-auto max-w-6xl px-gutter py-block">
        <header className="border-b border-line-subtle pb-block">
          <p className="label-type text-ink-tertiary">Wave 61 · The approved direction</p>
          <h1 className="display-type rule-accent mt-3 text-display-4">
            Homivaro <span className="text-ink-accent">design system</span>
          </h1>
          <p className="mt-6 max-w-[var(--measure)] text-lead text-ink-secondary">
            The specification for the direction that ships. Every swatch, size and
            duration below is read from the live token rather than copied out of it, so
            this page cannot drift from <code className="text-ink">globals.css</code>.
          </p>
          <p className="mt-4 max-w-[var(--measure)] text-body text-ink-tertiary">
            Looking for proof the token layer survives a theme switch instead?{' '}
            <Link href="/foundations" className="text-ink-accent underline underline-offset-4">
              /foundations
            </Link>{' '}
            renders the same kit with nothing on it branching on a theme. This page is the
            opposite question: what did <em>this</em> direction decide, and why.
          </p>
        </header>

        <Section
          title="How a colour reaches a component"
          note="Three layers, consumed strictly top-down. A component never skips one."
        >
          <ol className="grid gap-3 sm:grid-cols-3">
            {[
              ['1 · Brand', '--brand-navy-900', 'The raw values. Never referenced by a component.'],
              ['2 · Semantic', '--surface-inverse', 'What a component is allowed to name.'],
              ['3 · Theme', '[data-theme]', 'Re-binds layer 2. This is the only layer that changes.'],
            ].map(([step, token, note]) => (
              <li key={step} className="rounded-[var(--radius-lg)] bg-sunken p-5">
                <p className="label-type text-ink-tertiary">{step}</p>
                <code className="mt-2 block text-body text-ink-accent">{token}</code>
                <p className="mt-2 text-body text-ink-secondary">{note}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          title="Brand"
          note="Three ramps, and a rule about each. The rules matter more than the values — red stops being the brand the moment it becomes a background."
        >
          <div className="space-y-8">
            {BRAND.map((ramp) => (
              <div key={ramp.group}>
                <h3 className="subhead-type text-lg">{ramp.group}</h3>
                <p className="mt-1 max-w-[var(--measure)] text-body text-ink-secondary">
                  {ramp.note}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {ramp.tokens.map((token) => (
                    <div key={token} className="w-40">
                      <div
                        className="h-16 rounded-[var(--radius-md)] border border-line-subtle"
                        style={{ background: `var(${token})` }}
                      />
                      <code className="mt-2 block text-2xs text-ink-tertiary">{token}</code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Surfaces"
          note="The page is not the ground — navy is. The white slab floats on it, and the footer is that navy showing through again at the bottom."
        >
          <TokenTable rows={SURFACES} swatch />
        </Section>

        <Section
          title="Ink"
          note="Every ink token clears 4.5:1 against both the page and the sunken card, not just the lighter of the two. Where that forced a deviation from the Figma file, globals.css records the ratio and the reason."
        >
          <TokenTable rows={INK} type />
        </Section>

        <Section title="Lines" note="Four weights, and the focus ring is one of them.">
          <TokenTable rows={LINES} swatch />
        </Section>

        <Section
          title="Display type"
          note="Bebas Neue, caps-only and condensed. Seven steps, every one clamping at 36px — the floor is the rule, not a coincidence, and npm run test:type-floor fails the build on anything under it. Specimens render at the size you would get on this viewport; resize the window and they move."
        >
          <div className="space-y-6">
            {DISPLAY.map(([token, util, role, note]) => (
              <div
                key={token}
                className="border-b border-line-subtle pb-6 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <code className="text-2xs text-ink-accent">{util}</code>
                  <span className="label-type text-ink-tertiary">{role}</span>
                </div>
                <p className={`display-type mt-2 leading-[0.95] ${util}`}>Sauber. Zuverlässig.</p>
                <p className="mt-2 max-w-[var(--measure)] text-body text-ink-secondary">{note}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Figures"
          note="The same face used as a number rather than a sentence. Separate from the display steps because a figure is set at tighter leading, and because its size answers to the number beside it, not to the heading above it."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {FIGURES.map(([token, util, sample, note]) => (
              <div key={token} className="rounded-[var(--radius-lg)] bg-sunken p-6">
                <p data-numeric className={`display-type leading-[0.8] text-ink-accent ${util}`}>
                  {sample}
                </p>
                <code className="mt-3 block text-2xs text-ink-tertiary">{util}</code>
                <p className="mt-1 text-body text-ink-secondary">{note}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="The three voices"
          note="Bebas carries headings above the floor. Geist carries everything else — and that includes headings below it."
        >
          <div className="space-y-7">
            <Voice
              util="display-type"
              note="Bebas. Caps, tight tracking, 0.95 leading. Only above 36px."
            >
              <p className="display-type text-display-6">Reinigung am Zürichsee</p>
            </Voice>
            <Voice
              util="subhead-type"
              note="Geist at 500. The step a heading takes when it drops under the floor — rank carried by weight instead of size."
            >
              <p className="subhead-type text-xl">Reinigung am Zürichsee</p>
            </Voice>
            <Voice util="label-type" note="Geist at 11px, 0.06em, uppercase. Eyebrows and column headers.">
              <p className="label-type text-ink-tertiary">Reinigung am Zürichsee</p>
            </Voice>
            <Voice
              util="text-lead / text-body"
              note="17px opens a section; 15px is the site's real default for supporting copy. Both were arbitrary values in thirty-eight places before this wave."
            >
              <p className="max-w-[var(--measure)] text-lead">
                Wir reinigen Privathaushalte und kleine Büros zwischen Küsnacht und
                Hombrechtikon.
              </p>
              <p className="mt-2 max-w-[var(--measure)] text-body text-ink-secondary">
                Fester Stundensatz, verbindliche Offerte innert 24 Stunden, dokumentierte
                Ein- und Austrittszeiten.
              </p>
            </Voice>
          </div>
        </Section>

        <Section
          title="Radius"
          note="Everything is a rounded rectangle. The shell and the hero at 32, cards at 24, controls fully round."
        >
          <div className="flex flex-wrap gap-4">
            {RADII.map(([token, note]) => (
              <div key={token} className="w-52">
                <div
                  className="h-20 bg-sunken"
                  style={{ borderRadius: `var(${token})` }}
                />
                <code className="mt-2 block text-2xs text-ink-tertiary">{token}</code>
                <p className="mt-1 text-body text-ink-secondary">{note}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Elevation"
          note="A card is flat until hovered. These are the lift — hover the two cards below to see the whole gesture, which is a ground change and a ring as well as a shadow."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="hv-card hv-card-light p-6">
              <p className="subhead-type text-lg">Card at rest</p>
              <p className="mt-1 text-body text-ink-secondary">
                Sunken ground, no border, no shadow. Hover: the ground lifts to white, a
                hairline ring appears inside the radius, and the shadow grows.
              </p>
            </div>
            <div className="hv-card hv-card-dark p-6">
              <p className="subhead-type text-lg">Dark card at rest</p>
              <p className="mt-1 text-body" style={{ color: 'var(--content-inverse-secondary)' }}>
                The same gesture on navy, where the ring is a white wash rather than a
                border colour.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            {(['--shadow-sm', '--shadow-md', '--shadow-lg'] as const).map((token) => (
              <div key={token} className="w-52">
                <div
                  className="h-20 rounded-[var(--radius-lg)] bg-card"
                  style={{ boxShadow: `var(${token})` }}
                />
                <code className="mt-3 block text-2xs text-ink-tertiary">{token}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Rhythm"
          note="Four spacing tokens carry the whole site. The gutter is the only one that changes at a breakpoint — 48px above 900px, 24 below."
        >
          <div className="space-y-3">
            {(
              [
                ['--space-section', 'Between sections.'],
                ['--space-block', 'Between blocks inside a section.'],
                ['--space-gutter', 'The page inset.'],
              ] as const
            ).map(([token, note]) => (
              <div key={token} className="flex items-center gap-4">
                <div
                  className="h-6 shrink-0 rounded-[var(--radius-xs)] bg-accent"
                  style={{ width: `var(${token})` }}
                />
                <code className="text-2xs text-ink-tertiary">{token}</code>
                <span className="text-body text-ink-secondary">{note}</span>
              </div>
            ))}
            <p className="pt-2 text-body text-ink-secondary">
              <code className="text-ink">--measure</code> caps a column of prose at 62ch,
              and <code className="text-ink">.hv-container</code> caps the page at 90rem.
              Neither is a max-width a component picks for itself.
            </p>
          </div>
        </Section>

        <Section
          title="Motion"
          note="One easing for the whole direction — long tail, no overshoot — and the same curve in JS, so a CSS transition and a tween cannot drift apart. Everything here collapses under prefers-reduced-motion."
        >
          <div className="space-y-3">
            {MOTION.map(([token, note]) => (
              <div key={token} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <code className="w-36 shrink-0 text-2xs text-ink-accent">{token}</code>
                <span className="text-body text-ink-secondary">{note}</span>
              </div>
            ))}
            <p className="pt-2 text-body text-ink-secondary">
              <code className="text-ink">--ease-standard</code> is{' '}
              <code className="text-ink">cubic-bezier(0.16, 1, 0.3, 1)</code>, and it is the
              only easing the direction uses.
            </p>
          </div>
        </Section>

        <Section
          title="The recurring gesture"
          note="Red washes to navy and navy washes to red — the two brand colours trading places. It is the one move the direction repeats, and it is why the buttons are worth looking at rather than reading. Hover them."
        >
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
          <p className="mt-4 max-w-[var(--measure)] text-body text-ink-secondary">
            One primary per screen. The design also drifts the control toward the cursor;
            that third of the gesture needs a spring and therefore a client component, and
            this is the same button the console renders on 58 screens — so it is dropped
            rather than paid for everywhere.
          </p>
        </Section>

        <Section
          title="Composites"
          note="Where a pattern is more than a token, it is a class in globals.css scoped to this direction — so switching to Raster cannot inherit a rounded shell or a card that lifts."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ['.hv-shell', 'The white slab: 32px radius, clipped, floating on navy.'],
                ['.hv-card', 'The one hover every card on the site uses.'],
                ['.hv-action', 'The button wash, and the arrow that walks right.'],
                ['.hv-field', 'The form the design never drew — the card language, one level in.'],
                ['.hv-row', 'A table row: the card’s colour shift and none of its lift.'],
                ['.hv-footer', 'Re-binds the semantic tokens for its own subtree, so the footer markup is identical in all four directions.'],
                ['.hv-scrim', 'Four stops, not two — the headline stays readable without greying out the photograph.'],
                ['.hv-grain', 'Gives the flat red closing band somewhere for the light to sit.'],
                ['.hv-outline-text', 'The accent word where recolouring is not available. Falls back to solid white.'],
                ['.rule-accent', 'The red hairline under a heading.'],
              ] as const
            ).map(([name, note]) => (
              <div key={name} className="rounded-[var(--radius-lg)] bg-sunken p-5">
                <code className="text-body text-ink-accent">{name}</code>
                <p className="mt-1.5 text-body text-ink-secondary">{note}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <p className="label-type text-ink-tertiary">.hv-field, live</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="ds-name" className="block text-sm font-medium">
                  Name
                </label>
                <input
                  id="ds-name"
                  className="hv-field h-11 px-4"
                  defaultValue="Küsnacht"
                  readOnly
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ds-invalid" className="block text-sm font-medium">
                  Postleitzahl
                </label>
                <input
                  id="ds-invalid"
                  className="hv-field h-11 px-4"
                  aria-invalid
                  defaultValue="9000"
                  readOnly
                />
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Status"
          note="34 states, one colour each, identical on every screen and in every direction. Status is information, not decoration — so these are the one colour family a theme may not re-bind. Source: lib/status-registry.ts."
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
            <div className="pt-2">
              <p className="label-type mb-2 text-ink-tertiary">Chip — annotates, never reports state</p>
              <div className="flex flex-wrap gap-2">
                <Chip>8127 Forch</Chip>
                <Chip tone="info">DE</Chip>
                <Chip tone="accent">Empfohlen</Chip>
                <Chip tone="warning">2 Lücken</Chip>
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Money"
          note="de-CH formatting with the apostrophe separator. A bare number cannot be rendered — the component requires a unit, which is what stops a price shipping without one."
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
              <span className="ml-2 text-body text-ink-tertiary">
                the live estimate during the booking flow
              </span>
            </li>
          </ul>
        </Section>

        <Section
          title="The rules"
          note="Five decisions the rest of the system depends on. Each one exists because breaking it already cost something."
        >
          <dl className="space-y-5">
            {RULES.map(([rule, why]) => (
              <div key={rule} className="border-l-2 border-rule pl-5">
                <dt className="subhead-type text-lg">{rule}</dt>
                <dd className="mt-1 max-w-[var(--measure)] text-body text-ink-secondary">
                  {why}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      </main>
    </div>
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
      <h2 className="display-type text-display-6">{title}</h2>
      <p className="mt-2 mb-7 max-w-[var(--measure)] text-body text-ink-secondary">{note}</p>
      {children}
    </section>
  );
}

/**
 * A swatch reads the token rather than a copy of its value, which is the only
 * reason this page is safe to leave in the repo: a documentation page that
 * restates the values it documents is a second source of truth, and the second
 * one is always the stale one.
 */
function TokenTable({
  rows,
  swatch,
  type,
}: {
  rows: readonly (readonly [string, string])[];
  swatch?: boolean;
  type?: boolean;
}) {
  return (
    <ul className="divide-y divide-line-subtle">
      {rows.map(([token, note]) => (
        <li key={token} className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
          {swatch ? (
            <span
              className="size-11 shrink-0 rounded-[var(--radius-sm)] border border-line-subtle"
              style={{ background: `var(${token})` }}
            />
          ) : null}
          {type ? (
            <span
              className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-sunken text-lg font-semibold"
              style={{ color: `var(${token})` }}
            >
              Aa
            </span>
          ) : null}
          <code className="w-64 shrink-0 text-2xs text-ink-tertiary">{token}</code>
          <span className="min-w-0 flex-1 text-body text-ink-secondary">{note}</span>
        </li>
      ))}
    </ul>
  );
}

function Voice({
  util,
  note,
  children,
}: {
  util: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line-subtle pb-6 last:border-0 last:pb-0">
      <code className="text-2xs text-ink-accent">{util}</code>
      <div className="mt-2">{children}</div>
      <p className="mt-2 max-w-[var(--measure)] text-body text-ink-secondary">{note}</p>
    </div>
  );
}
