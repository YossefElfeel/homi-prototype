/**
 * Nothing in the Homivaro direction may set Bebas below 36px.
 *
 * The rule was written in two comments — one in globals.css, one in fonts.ts —
 * and neither of them can fail a build. It had been broken at twenty-six call
 * sites by the time anybody counted: a masthead stat at 34px, a mosaic card at
 * 30px, a service title whose clamp floor was `2rem`, a price at 30px on
 * mobile, the hero badge at 24px, the section headings on /foundations,
 * /screens and /flows at 24px, and every heading in the quote, booking and
 * careers flows at 28–30px. Bebas is condensed and caps-only, so under the
 * floor it stops being a voice and becomes a reading problem — which is
 * something you notice on a phone months later, not in review.
 *
 * ONE THING IS EXEMPT, and it is not checked here because it does not use the
 * `display-type` composite: the wordmark. `site/logo.tsx` sets HOMIVARO in the
 * display face at 20px with its own weight and tracking. A logotype is a fixed
 * lockup, not a reading voice, and the floor has nothing to say about it.
 *
 * So the rule gets a gate.
 *
 * TWO EXCLUSIONS, both because the face is not Bebas there and a size under
 * the floor is therefore correct:
 *
 *  · the console. `[data-scope='app']` re-binds --font-display to Geist —
 *    "a page title above a table is interface, not a headline". Every screen
 *    inside AppShell renders Geist, which is readable at any size. Confirmed
 *    empirically: /de/admin/anfragen renders zero Bebas elements.
 *
 *  · files that branch on the theme. `signature/cta-band.tsx` returns four
 *    different trees, and only one of them is Homivaro; the other three set
 *    Archivo, Bricolage or Instrument Serif, none of which is caps-only. A
 *    static scan cannot follow a `theme === 'zuhause'` branch, so it does not
 *    try — it skips the file and says so at the end rather than reporting six
 *    findings that are all correct code.
 *
 * What is left is the surface where Bebas actually renders, and there the
 * check is exact. It does not follow a size inherited from a parent or built
 * at runtime; neither has ever happened here, every violation above was a
 * literal class on the same element, and a checker that guessed at
 * inheritance would be wrong often enough to get switched off.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const CSS = 'src/app/globals.css';
const ROOTS = ['src/app', 'src/components'];
const FLOOR = 36;

/** The step a heading takes when it drops under the floor. Not a violation. */
const STEPS_DOWN = 'subhead-type';

/** Rendered inside AppShell, where --font-display is Geist. */
const CONSOLE = [
  join('src', 'components', 'ui'),
  join('src', 'components', 'admin'),
  join('src', 'components', 'app'),
  join('src', 'components', 'field'),
  join('src', 'components', 'messages'),
  join('src', 'components', 'account'),
  join('src', 'app', '[locale]', '(admin)'),
  join('src', 'app', '[locale]', '(account)'),
  join('src', 'app', '[locale]', '(field)'),
];

/** A file that renders a different display face per direction. */
const BRANCHES_ON_THEME = /theme === '|:\s*Theme|theme=\{/;

// ---------------------------------------------------------------- the tokens

/**
 * Read the scale out of globals.css rather than restating it. A test that
 * hard-codes the numbers it is testing keeps passing after the tokens move.
 */
function readScale(): Map<string, number> {
  const css = readFileSync(CSS, 'utf8');
  const scale = new Map<string, number>();
  for (const m of css.matchAll(/^\s*(--text-[a-z0-9-]+):\s*([^;]+);/gm)) {
    const [, name, raw] = m;
    if (!name || !raw) continue;
    const min = smallestOf(raw.trim());
    if (min !== null) scale.set(name.replace(/^--text-/, ''), min);
  }
  return scale;
}

/** The smallest px a declaration can render at: a clamp's first argument. */
function smallestOf(raw: string): number | null {
  const clamp = raw.match(/clamp\(\s*([^,]+),/);
  const value = (clamp?.[1] ?? raw).trim();
  const px = value.match(/^([\d.]+)px$/);
  if (px?.[1]) return Number(px[1]);
  const rem = value.match(/^([\d.]+)rem$/);
  if (rem?.[1]) return Number(rem[1]) * 16;
  return null;
}

/** Tailwind's own scale, for the `text-2xl` / `text-4xl` end of the range. */
const TAILWIND: Record<string, number> = {
  '2xs': 11, xs: 12, sm: 14, base: 16, lg: 18, xl: 20,
  '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60,
  '7xl': 72, '8xl': 96, '9xl': 128,
};

const scale = readScale();

/**
 * A size class, resolved to its smallest rendered px.
 *
 * `sm:text-lg` is read as `text-lg`: a breakpoint prefix raises the size above
 * that width and says nothing about the width below it, which is the one the
 * floor is about — and a 30px mobile price stepping up to 36px at `sm` was one
 * of the twenty-six.
 */
function sizeOf(cls: string): number | null {
  const key = cls.replace(/^[a-z]+:/, '').match(/^text-(.+)$/)?.[1];
  if (!key) return null;
  const named = scale.get(key) ?? TAILWIND[key];
  if (named !== undefined) return named;
  const arbitrary = key.match(/^\[(.+)\]$/)?.[1];
  return arbitrary ? smallestOf(arbitrary.replace(/\s+/g, '')) : null;
}

// ------------------------------------------------------------------ the scan

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sources(path, out);
    else if (path.endsWith('.tsx')) out.push(path);
  }
  return out;
}

const failures: string[] = [];
const skipped: string[] = [];
let checked = 0;

for (const root of ROOTS) {
  for (const file of sources(root)) {
    if (CONSOLE.some((dir) => file.startsWith(dir + sep))) continue;

    const src = readFileSync(file, 'utf8');
    if (!src.includes('display-type')) continue;
    if (BRANCHES_ON_THEME.test(src)) {
      skipped.push(file);
      continue;
    }

    src.split('\n').forEach((line, i) => {
      if (!line.includes('display-type') || line.includes(STEPS_DOWN)) return;

      // Only the classes on the same element as display-type. Splitting on
      // quotes keeps a neighbouring className on the same source line from
      // being read as part of this one.
      for (const chunk of line.split(/['"`]/)) {
        if (!chunk.includes('display-type')) continue;
        for (const cls of chunk.split(/\s+/)) {
          const size = sizeOf(cls);
          if (size === null) continue;
          checked++;
          if (size < FLOOR) {
            failures.push(
              `${file}:${i + 1} — ${cls} renders at ${size}px, under the ${FLOOR}px floor`,
            );
          }
        }
      }
    });
  }
}

// Every display and figure token must itself clamp at the floor, or a call
// site can obey this checker and still break the rule.
for (const [name, min] of scale) {
  if (!/^(display|figure)-/.test(name)) continue;
  checked++;
  if (min < FLOOR) {
    failures.push(`${CSS} — --text-${name} clamps at ${min}px, under the ${FLOOR}px floor`);
  }
}

for (const f of failures) console.log('FAIL  ' + f);
if (skipped.length) {
  console.log(
    `\n${skipped.length} file(s) skipped — they render a different display face per ` +
      `direction, so a size under the floor is correct in three of the four:\n` +
      skipped.map((f) => '      ' + f).join('\n'),
  );
}
console.log(
  `\n${checked - failures.length} passed, ${failures.length} failed ` +
    `(${scale.size} scale tokens read from ${CSS})`,
);
process.exit(failures.length > 0 ? 1 : 0);
