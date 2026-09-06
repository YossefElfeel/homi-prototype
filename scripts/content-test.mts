/**
 * The content registry has to be complete, and "complete" is checkable.
 *
 * A CMS is judged on two failures a typecheck cannot see. The first is a field
 * that edits nothing — a key the registry offers and no screen renders. The
 * second, worse one is a string the registry has never heard of: it is on the
 * website, somebody wants to change it, and the screen that promises to edit
 * every word on the site silently does not contain it. Neither shows up until
 * an editor goes looking for a sentence and cannot find it.
 *
 * So this walks the German dictionary — the market language and the fallback
 * for the other three — and asserts that every leaf in it is claimed by
 * exactly one surface. It also checks the things a missing message key would
 * otherwise turn into a raw dotted path on screen: every surface name, field
 * label and pair label has to exist in both dictionaries.
 */
import { de, en } from '../src/messages/index.ts';
import { landingContent } from '../src/content/landing.ts';
import { contentSurfaces, resolveContent, editMap } from '../src/lib/content-registry.ts';
import { SEED_SERVICES } from '../src/mock/seed.ts';
import { SERVED_REGIONS, validateRegion } from '../src/mock/engines/coverage.ts';
import { SERVICE_SLUGS } from '../src/mock/schema.ts';

let passed = 0;
const failures: string[] = [];

function check(label: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

function at(source: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, key) =>
        node !== null && typeof node === 'object'
          ? (node as Record<string, unknown>)[key]
          : undefined,
      source,
    );
}

const surfaces = contentSurfaces(SEED_SERVICES, 'de');

/* ---- 1. every surface carries something --------------------------------- */

for (const surface of surfaces) {
  check(`[surface] ${surface.id} has fields`, surface.fields.length > 0);
  check(
    `[surface] ${surface.id} has a name`,
    surface.name !== null || surface.nameKey !== null,
  );
  /* A route with a bracket in it is a template nobody can open. The board's
     whole promise to a designer is that the link works from a cold start. */
  check(
    `[surface] ${surface.id} href is a real route`,
    surface.href === null || !surface.href.includes('['),
    surface.href ?? '',
  );
}

/* ---- 2. no key is offered twice ----------------------------------------- */

const seen = new Map<string, string>();
for (const surface of surfaces) {
  for (const field of surface.fields) {
    const owner = seen.get(field.key);
    check(
      `[keys] ${field.key} is claimed once`,
      owner === undefined,
      owner ? `also on ${owner}` : '',
    );
    seen.set(field.key, surface.id);
  }
}

/* ---- 3. every label the screen prints exists in both dictionaries -------- */

for (const surface of surfaces) {
  if (surface.nameKey) {
    for (const [name, dict] of [
      ['de', de],
      ['en', en],
    ] as const) {
      check(
        `[labels] surfaces.${surface.nameKey} in ${name}`,
        typeof at(dict, `admin.website.surfaces.${surface.nameKey}`) === 'string',
      );
    }
  }

  for (const field of surface.fields) {
    if (field.labelKey) {
      for (const [name, dict] of [
        ['de', de],
        ['en', en],
      ] as const) {
        check(
          `[labels] fields.${field.labelKey} in ${name}`,
          typeof at(dict, `admin.website.fields.${field.labelKey}`) === 'string',
        );
      }
    }
    for (const pair of [field.pairKeys?.first, field.pairKeys?.second]) {
      if (!pair) continue;
      check(
        `[labels] ${pair} in de`,
        typeof at(de, `admin.website.${pair}`) === 'string',
      );
    }
  }
}

/* ---- 4. completeness: every German string is reachable ------------------- */

const claimed = new Set<string>();
for (const surface of surfaces) {
  for (const field of surface.fields) {
    if (field.key.startsWith('ui.')) claimed.add(field.key.slice(3));
  }
}

const leaves: string[] = [];
function walk(node: unknown, path: string) {
  if (typeof node === 'string' || Array.isArray(node)) {
    leaves.push(path);
    return;
  }
  if (node === null || typeof node !== 'object') return;
  for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
    walk(child, path ? `${path}.${key}` : key);
  }
}
walk(de, '');

const unreachable = leaves.filter((path) => !claimed.has(path));
check(
  '[coverage] every string in the German dictionary is editable',
  unreachable.length === 0,
  unreachable.length > 0 ? `${unreachable.length} missing, first: ${unreachable.slice(0, 5).join(', ')}` : '',
);
check('[coverage] the dictionary was actually walked', leaves.length > 3000, `${leaves.length} leaves`);

/* ---- 4b. completeness: the homepage's own content file ------------------- */

/*
 * The dictionary check above says nothing about `content/landing.ts`, and that
 * file is where the homepage actually lives. The first cut of the registry
 * offered ten of its blocks and quietly left out the hero heading — the
 * largest text on the site — because nothing was checking.
 *
 * Two exclusions, both documented in the registry: `plans.items` and
 * `coverage.items` are dead copy, overtaken by the store's own plans and
 * regions, and `services.counter` is a function («Leistung 3 von 7») whose
 * two numbers cannot be put in front of an editor as a format string.
 */
/*
 * Excluded, and each for a stated reason rather than to make the number green.
 *
 *  · `plans.items` and `coverage.items` are dead copy — the plan tiles render
 *    from the store's `plans` and the coverage tiles from its `regions`.
 *  · `services.counter` is a function («Leistung 3 von 7»), two numbers in a
 *    sentence that cannot be put in front of an editor as a format string.
 *  · An `avatar`, an `image` or a nav `href` is an asset path or a route, not
 *    a word. Offering them in a text box would let somebody break a link from
 *    the copy screen.
 */
const DEAD_LANDING = ['plans.items', 'coverage.items', 'services.counter'];
const NOT_COPY = /(\.avatar|\.image|\.href)$/;

const landingCovered = new Set<string>();
for (const surface of surfaces) {
  if (surface.id !== 'page.home' && surface.id !== 'page.chrome') continue;
  for (const field of surface.fields) {
    if (!field.key.startsWith('ui.')) landingCovered.add(field.hint);
  }
}

const landingLeaves: string[] = [];
function walkLanding(node: unknown, path: string) {
  if (typeof node === 'string') {
    landingLeaves.push(path);
    return;
  }
  if (node === null || typeof node !== 'object') return;
  for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
    walkLanding(child, path ? `${path}.${key}` : key);
  }
}
walkLanding(landingContent('de'), '');

const uncovered = landingLeaves.filter((path) => {
  if (DEAD_LANDING.some((dead) => path === dead || path.startsWith(`${dead}.`))) return false;
  if (NOT_COPY.test(path)) return false;
  for (const claimed of landingCovered) {
    if (path === claimed || path.startsWith(`${claimed}.`)) return false;
  }
  return true;
});

check(
  '[coverage] every word on the homepage is editable',
  uncovered.length === 0,
  uncovered.length > 0 ? `${uncovered.length} missing: ${uncovered.slice(0, 8).join(', ')}` : '',
);
check(
  '[coverage] landing.ts was actually walked',
  landingLeaves.length > 100,
  `${landingLeaves.length} leaves`,
);

/* ---- 4c. no field is left with a dotted path for a name ------------------ */

for (const surface of surfaces) {
  if (surface.scope === 'panel') continue;
  for (const field of surface.fields) {
    check(
      `[labels] ${field.key} has something to derive a name from`,
      field.labelKey !== null || (field.tail !== undefined && field.tail.length > 0),
    );
  }
}

/* ---- 5. the seven seeded services arrive with their copy ----------------- */

for (const slug of SERVICE_SLUGS) {
  const surface = surfaces.find((s) => s.id === `service.${slug}`);
  check(`[services] ${slug} has a surface`, surface !== undefined);
  if (!surface) continue;

  for (const name of ['lead', 'included', 'notIncluded', 'faq']) {
    const field = surface.fields.find((f) => f.key.endsWith(`.${name}`));
    check(`[services] ${slug}.${name} exists`, field !== undefined);
    if (!field) continue;
    const value = field.defaults.de;
    check(
      `[services] ${slug}.${name} has German copy`,
      value !== undefined && (typeof value === 'string' ? value.length > 0 : value.length > 0),
    );
  }
}

/* ---- 6. §20.6 — French borrows German, and says so ----------------------- */

const home = surfaces.find((s) => s.id === 'page.home')!;
const heroSub = home.fields.find((f) => f.key === 'page.home.hero.sub')!;
check('[locale] French falls back to German', resolveContent(heroSub, 'fr', {}).source === 'fallback');
check('[locale] German is its own default', resolveContent(heroSub, 'de', {}).source === 'default');

/* An edited German has to carry the fallback too, or the editor would be shown
   a sentence the site no longer renders. */
const edited = editMap([
  {
    key: 'page.home.hero.sub',
    kind: 'text',
    values: { de: 'Neu geschrieben.' },
    updatedAt: new Date().toISOString(),
  },
]);
const italian = resolveContent(heroSub, 'it', edited);
check(
  '[locale] an edited German is what the other languages fall back to',
  italian.source === 'fallback' && italian.value === 'Neu geschrieben.',
  String(italian.value),
);
check(
  '[locale] an edited language reports itself as edited',
  resolveContent(heroSub, 'de', edited).source === 'edited',
);

/* ---- 7. the service area refuses what would break silently --------------- */

const good = { postcode: '8702', name: 'Zollikon', slug: 'zollikon', lat: 47.34, lng: 8.577 };
check('[area] a plausible municipality is accepted', validateRegion(good, SERVED_REGIONS) === null);
check(
  '[area] a duplicate postcode is refused',
  validateRegion({ ...good, postcode: '8700' }, SERVED_REGIONS) === 'postcodeTaken',
);
check(
  '[area] a duplicate page address is refused',
  validateRegion({ ...good, slug: 'meilen' }, SERVED_REGIONS) === 'slugTaken',
);
check(
  '[area] three digits is not a postcode',
  validateRegion({ ...good, postcode: '870' }, SERVED_REGIONS) === 'postcodeFormat',
);
check(
  '[area] coordinates off the map are refused',
  validateRegion({ ...good, lat: 0, lng: 0 }, SERVED_REGIONS) === 'coordinates',
);
check(
  '[area] a row may keep its own postcode while being edited',
  validateRegion(
    { postcode: '8700', name: 'Küsnacht ZH', slug: 'kuesnacht', lat: 47.3175, lng: 8.5844 },
    SERVED_REGIONS,
    '8700',
  ) === null,
);

/* ---- report ------------------------------------------------------------- */

console.log(`\n${passed} passed, ${failures.length} failed`);
for (const failure of failures.slice(0, 25)) console.log(`  ✗ ${failure}`);
if (failures.length > 25) console.log(`  … and ${failures.length - 25} more`);
if (failures.length > 0) process.exit(1);
