# Homivaro — front-end prototype

A working front-end prototype for **Homivaro**, a Swiss home-services company
(cleaning and furniture assembly) operating on the right shore of Lake Zurich.

No backend. All data is mocked in the browser and persisted to `localStorage`,
but the **business logic is real** — pricing, scheduling, coverage and state
transitions are implemented from the specification rather than faked.

## What this is for

The specification describes 88 screens across six tracks; a seventh (hiring)
and an eighth (users & access) came later, and every template variant and
sub-screen since. **`/screens` counts them** — the number is derived there and
is not repeated here, because the version that was repeated here said 101 while
the board said 121. This prototype replaces the usual Figma click-through: the
design brief calls for the interactive model to be built in code directly, so
design ships as working screens and states.

Progress board: **`/screens`** · Flow board: **`/flows`** · Open assumptions:
**`/open-questions`**

`/screens` counts screens; `/flows` counts *ways through them*. The second board
exists because the first one stopped being enough: every screen was built and
typechecked while the customer list still had no way to add a customer,
three declared request states were unreachable from any button, and a
checked-out job had no exit.

## Getting started

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## The demo bar

The dark pill at the bottom right of every page is the prototype's control
surface — it is not part of the product. From it you can switch:

| Control | What it changes |
| --- | --- |
| **Direction** | One of four visual directions (see below) |
| **Language** | German and English are complete; French and Italian fall back to German per spec §20.6 |
| **Role** | Visitor · Customer · Owner · Contractor — gates who can see access codes and applicant data |
| **Today** | Pins the clock, so the 24-hour lead time and closure periods become testable |
| **Scenario** | Seven data sets, including `Tag 1 — alles leer` for the launch-day empty states |
| **Insurance** | §21 item 12 — toggles the key-log lock and the insurance claim on the About page |
| **DE stress test** | Grows every string by ~30% using real German morphemes, to surface layout breaks |

## Four visual directions

Every screen renders in all four. Only the six components under
`src/components/signature/` may branch on the theme; everything else works from
tokens alone.

| Direction | Character |
| --- | --- |
| **Raster** | Swiss editorial — strict grid, hairlines instead of shadows, generous white, red as a single rule |
| **Zuhause** | Warm trust — ivory paper, soft elevation, rounded geometry, green accent |
| **Goldküste** | Concierge — deep navy sections, serif display, slow motion |
| **Kante** | Bold contemporary — condensed caps, red as a *surface*, scroll-triggered line reveals |

## Architecture

```
src/
  app/[locale]/          route groups: (site) (booking) + /screens /open-questions
  components/
    signature/           the only components allowed to branch on theme
    booking/             the request wizard shell, summary and live estimate
    ui/                  primitives — Money, StatusBadge, Field, Button …
    motion/              scroll reveals for the Kante direction
  content/               long-form editorial content (services, legal)
  i18n/                  routing, request config, German stress transform
  messages/              dictionaries, composed per domain
  mock/
    engines/             pricing · availability · coverage
    schema.ts            20 entities
    store.ts             Zustand + persist
    scenarios.ts         seven demo data sets
```

### Rules the code enforces, so review does not have to

- **No raw hex in components.** Colour comes from semantic tokens only.
- **No bare money.** `<Money>` requires a unit — you cannot render `49` without
  saying what it buys.
- **One colour per state.** `lib/status-registry.ts` is the single source for
  all 34 states across every screen.
- **Every list has a real empty state.** `<EmptyState>` requires a body
  explaining *why* it is empty — and, where one exists, the action that fills it.
- **Every declared state is reachable.** A status in `schema.ts` that no screen
  can write is a lie the type system will not catch; `/flows` lists the two that
  remain and why each is deliberate.
- **Access codes are gated by role and date.** The owner always; the assigned
  contractor only on the day of the job; the customer never.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

Contrast has been measured across all four directions (worst pair 4.8:1), and
layouts verified at 375 / 768 / 1024 / 1440 with the German stress test on.

## Known placeholders

- **Photography** — geometric stand-ins, marked `TODO:asset`.
- **Legal pages** — representative text; registered address, UID and legal form
  are marked `TODO:legal` and must be filled before any real launch.
- **Payment** — fully mocked. No gateway, no money moves.
- **Default locale** — set to English for review convenience. Marked
  `TODO:launch`; the market language is German.
