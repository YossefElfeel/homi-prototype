# Homivaro — working rules

## Pull requests

Every PR on this repo follows the shape PR #16 set. It is not decoration: this
prototype replaces a Figma click-through, so the PR body is where a reviewer who
cannot read the diff finds out what moved and why.

**Language.** Title and body in Egyptian Arabic, the way the team talks. Technical
nouns stay in English inline — `flow`, `schema`, `typecheck`, `store`, route paths,
file names, component names. Do not translate them and do not transliterate them.

**Branch.** `fix/wave-<n>-<slug>` for a correction pass, `feat/wave-<n>-<slug>` for
new ground. Wave numbers are sequential across the whole project — check
`git log --oneline` for the last one. Branch off the latest `main`.

**Title.** Either `feat: <ما اتعمل>` for new ground, or `الموجة <n> — <اللي اتصلّح>`
for a correction pass. Say the outcome, not the file count.

**Body.** These sections, in this order, separated by `---`:

1. `## الفكرة باختصار` — the problem in a short narrative. Open on what was
   broken from the *user's* side, not on the code. Name the thing that could not
   be done.
2. `## اللي كان عندنا قبل كده` — what already existed, so the change has a
   baseline. Bullets.
3. `## اللي اتغيّر في الـ PR ده` — numbered sections (`**١.**`, `**٢.**` …), each
   with a bold heading. Use a `| كان | بقى |` table whenever several small gaps
   closed at once. For each change, say why it was wrong before — a list of what
   you added is not a review.
4. `## رايحين على فين` — what this opens up, and what is still deliberately
   open. Anything left undone gets its reason here, not silence.
5. `## الفحص` — a fenced block with the commands actually run and their real
   results. Then the file count and `+added / −removed`.

Close with the Claude Code attribution footer.

**Honesty rules for the body.** State what was verified and *how*. If something
could not be checked, say so in the same breath as the claim — a passing
`tsc --noEmit` proves types, not that a table renders. Never write a check you
did not run. If a check surfaced a bug you then fixed, that belongs in the body:
it is the strongest evidence the check was real.

## Code

- **No raw hex in components.** Colour comes from semantic tokens only.
- **No bare money.** `<Money>` requires a unit.
- **One colour per state.** `lib/status-registry.ts` is the single source for all
  states across every screen.
- **Every list has a real empty state**, with a body explaining *why* it is empty
  and, where one exists, the action that fills it.
- **Every declared state must be reachable.** A status in `schema.ts` that no
  screen can write is a lie the type system will not catch. `/flows` tracks the
  ones that remain and why each is deliberate.
- **Comments explain the decision, not the mechanics.** Say what was wrong
  before, or what breaks without this. Never narrate what the next line does.

## Boards

- `/screens` — does the screen exist.
- `/flows` — can you get in, act, and get out. New flows land with all three
  columns filled (`entries`, `actions`, `exits`) before they count as closed.
- `/open-questions` — assumptions the prototype makes that the business must
  confirm.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Only one `next dev` can hold this directory at a time. If a server is already
running, either use it or stop it — a second `next dev` is refused, and
`next build` writes to the same `.next`. Two servers sharing one `.next` will
eventually corrupt it; the symptom is a `JSON.parse` `SyntaxError` on every
route including `/favicon.ico`, and the fix is `rm -rf .next`.

Those three commands prove types, lint and that every route builds. They do not
prove a screen renders, so anything visual still needs looking at.

**To look at a screen, the browser pane has to be open on screen.** Not merely
started — displayed. A pane that is closed renders its tab at 0×0 with
`document.visibilityState === 'hidden'`, and a hidden zero-size tab never fires
`requestAnimationFrame`. React 19 defers revealing a Suspense boundary to a
callback inside one:

```js
requestAnimationFrame(function () { $RT = performance.now() });
$RB = []; $RV = function (a) { /* reveal the queued boundaries */ };
```

With no frames, `$RV` is never called. Every route under `[locale]/loading.tsx`
then sits on its fallback for ever, the real markup waiting in a hidden
`div#S:0`, and the page reads as "Wird geladen" — which looks exactly like an
infinite loading bug in the app. It is not. `window.$RV(window.$RB)` in the
console reveals the boundary immediately, which is the quickest way to confirm
the pane is the problem rather than the code.

So: never report a visual check as done from a closed pane, and never chase a
stuck loading state before checking `document.visibilityState`.
