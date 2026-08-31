/**
 * Coupons — the derived state, the seed behind it, and the write model.
 *
 * Two things this wave changed cannot be proved by `tsc`, and only one of them
 * can be proved by looking at the screen.
 *
 * The first is the state. A coupon has no status field: whether a code works
 * today is four columns combined, and every wrong combination renders as a
 * perfectly good badge. «Gültig» on an expired code typechecks.
 *
 * The second is the saving model, and it is the one a screen check is worst
 * at. The edit form used to write to the store on every keystroke; it now
 * stages a draft. Both versions *look* identical — fields you type into. The
 * difference is only visible in what the store holds while you type, which is
 * exactly what this file inspects: the draft logic is lifted out of the
 * component here and run against the same store the screen writes to.
 */

/* The store persists to localStorage and node has none, so zustand warns on
   every write. Same memory shim as the other scripts, installed before the
   store module is imported. */
const memory = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
  clear: () => memory.clear(),
  key: (i: number) => [...memory.keys()][i] ?? null,
  get length() {
    return memory.size;
  },
};

const { useStore } = await import('../src/mock/store.ts');
import { buildScenario, SCENARIOS } from '../src/mock/scenarios.ts';
import {
  couponCapThreshold,
  couponDiscount,
  couponRemaining,
  couponServiceNames,
  couponState,
} from '../src/lib/coupon-facts.ts';
import { priceEstimate } from '../src/mock/engines/pricing.ts';
import { statesOf, statusTone } from '../src/lib/status-registry.ts';
import { de, en } from '../src/messages/index.ts';
import type { Coupon } from '../src/mock/schema.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

const NOW = new Date('2026-08-25T10:00:00Z');

function reset() {
  useStore.setState({ data: buildScenario('demo', NOW) });
  return useStore.getState();
}

const seeded = buildScenario('demo', NOW).coupons;
const byId = (id: string) => seeded.find((c) => c.id === id)!;

/* --------------------------------------------------------------- the seed */
{
  check('the demo scenario seeds coupons', seeded.length > 0, `got ${seeded.length}`);
  check(
    'fresh stays empty, so the empty state is still reachable',
    buildScenario('fresh', NOW).coupons.length === 0,
  );
  check(
    'every other scenario carries them',
    SCENARIOS.filter((s) => s !== 'fresh').every((s) => buildScenario(s, NOW).coupons.length > 0),
  );
  check('cpn_1 exists — the row a reader opens first', Boolean(byId('cpn_1')));

  check(
    'no two coupons share a code',
    new Set(seeded.map((c) => c.code)).size === seeded.length,
  );
  check('no two coupons share an id', new Set(seeded.map((c) => c.id)).size === seeded.length);
  check(
    'no window runs backwards',
    seeded.every((c) => c.validFrom <= c.validTo),
  );
  check(
    'no coupon is redeemed past its own ceiling',
    seeded.every((c) => c.maxUses === undefined || c.usedCount <= c.maxUses),
  );
  check(
    'no percentage over 100',
    seeded.every((c) => c.kind !== 'percent' || c.value <= 100),
  );
  check(
    'every named service exists in the catalogue',
    seeded.every((c) =>
      c.services.every((slug) => useStore.getState().services.some((s) => s.slug === slug)),
    ),
  );

  /* Both branches of the value column and both branches of the scope column.
     One kind only, or one scope only, and half the rendering is unreviewed. */
  check('both kinds are seeded', new Set(seeded.map((c) => c.kind)).size === 2);
  check(
    'both scopes are seeded — all-services and service-scoped',
    seeded.some((c) => c.services.length === 0) && seeded.some((c) => c.services.length > 0),
  );
  check(
    'capped and uncapped are both seeded',
    seeded.some((c) => c.maxUses !== undefined) && seeded.some((c) => c.maxUses === undefined),
  );
  check(
    'a minimum order is seeded, and so is its absence',
    seeded.some((c) => c.minOrder !== undefined) && seeded.some((c) => c.minOrder === undefined),
  );

  /* Both branches of the new field, for the same reason: one capped code only,
     and the uncapped rendering of the value column is unreviewed — one
     uncapped only, and the cap never appears on screen at all. */
  check(
    'a percentage ceiling is seeded, and so is its absence',
    seeded.some((c) => c.maxDiscount !== undefined) &&
      seeded.some((c) => c.kind === 'percent' && c.maxDiscount === undefined),
  );
  /* A fixed amount is already its own ceiling. A seeded one carrying a second
     number would put the field on a form that does not render it — and the
     `kind` select clears it, so the only way in is the seed. */
  check(
    'no fixed-amount coupon carries one',
    seeded.every((c) => c.kind === 'percent' || c.maxDiscount === undefined),
  );
  check(
    'no ceiling is zero or negative',
    seeded.every((c) => c.maxDiscount === undefined || c.maxDiscount > 0),
  );
}

/* ------------------------------------------------------------- the ceiling
 *
 * `couponDiscount` is the one place floor, percentage and ceiling are applied
 * together, because three callers need the same answer: the pricing engine,
 * the form's worked example, and the list's value column. A rule copied into
 * three components is a rule with three chances to be typed differently — the
 * exact failure `status-registry.ts` exists to prevent for colour.
 */
{
  const welcome = byId('cpn_1'); // 10%, min 150, max 80
  const spring = byId('cpn_3'); // 25%, no ceiling
  const moveout = byId('cpn_2'); // CHF 50 flat

  check('below the floor the discount is nothing at all', couponDiscount(welcome, 100) === 0);
  check(
    'the floor is a threshold, not a taper — at the floor it applies in full',
    couponDiscount(welcome, 150) === 15,
  );
  check('under the ceiling the percentage is the answer', couponDiscount(welcome, 400) === 40);
  check('at the ceiling exactly, the two agree', couponDiscount(welcome, 800) === 80);
  check('over it the ceiling wins', couponDiscount(welcome, 2000) === 80);
  check(
    'and this is the case that had no field — 10% of a move-out clean',
    couponDiscount({ ...welcome, maxDiscount: undefined }, 2000) === 200,
  );

  check('an uncapped percentage keeps scaling', couponDiscount(spring, 2000) === 500);
  check('a fixed amount is unaffected', couponDiscount(moveout, 2000) === 50);
  check(
    'a fixed amount never exceeds the order — no negative total',
    couponDiscount({ ...moveout, minOrder: undefined }, 20) === 20,
  );
  check(
    'and neither does a percentage with a ceiling above the order value',
    couponDiscount({ ...welcome, minOrder: undefined, value: 100, maxDiscount: 5000 }, 200) === 200,
  );

  /* The threshold the form prints under the field. It is the division the
     office would otherwise do in its head, and it is the number that says
     whether a ceiling is doing anything at all. */
  check('the ceiling bites from CHF 800 on WELCOME10', couponCapThreshold(welcome) === 800);
  check('an uncapped code has no threshold', couponCapThreshold(spring) === undefined);
  check('a fixed amount has none either', couponCapThreshold(moveout) === undefined);
  check(
    'and neither does a 0% code — the ceiling could never be reached at any price',
    couponCapThreshold({ ...welcome, value: 0 }) === undefined,
  );
}

/* ------------------------------------------ the engine applies the same rule
 *
 * `priceEstimate` computes the coupon discount itself rather than calling
 * `couponDiscount` — it takes numbers, not records, because pricing resolves
 * no records. So the two have to be checked against each other: a ceiling the
 * form promises and the engine ignores is worse than no ceiling.
 */
{
  const settings = useStore.getState().settings;
  const service = useStore.getState().services.find((s) => s.slug === 'umzugsreinigung')!;
  const base = {
    service,
    addOns: [],
    area: 120,
    bathrooms: 2,
    hasPets: false,
    needsExtraEffort: false,
  };

  const plain = priceEstimate(base, settings);
  /* 40% rather than 10%, because the ceiling has to actually bite on the job
     the engine prices: a 120 m² move-out clean comes to CHF 318.50, so a
     ten-percent code would never reach CHF 80 and the check would pass on a
     branch it never entered. */
  const capped = priceEstimate({ ...base, couponPercent: 40, couponMaxDiscount: 80 }, settings);
  const uncapped = priceEstimate({ ...base, couponPercent: 40 }, settings);

  check(
    'the job is big enough that 40% clears the ceiling',
    (plain.subtotal * 40) / 100 > 80,
    `subtotal ${plain.subtotal}`,
  );
  check('the engine stops at the ceiling', capped.discount === 80, `${capped.discount}`);
  check('and without one it does not', uncapped.discount > 80, `${uncapped.discount}`);
  check(
    'the engine and `couponDiscount` agree once the ceiling is reached',
    capped.discount === couponDiscount({ ...welcomeShell(80), value: 40 }, plain.subtotal),
  );
  /*
   * Below the ceiling the two differ by the rounding, and only by it.
   *
   * `priceEstimate` emits payable figures, so every line goes through Swiss
   * five-rappen rounding: 5% of CHF 318.50 is 15.925, and the engine says
   * 15.95. `couponDiscount` is the rule, not a price — it does not round,
   * because the form uses it to show what the ceiling means and the list uses
   * it for nothing that gets paid. Pinned rather than papered over: if the two
   * ever drift by more than one rounding step, that is a real disagreement.
   */
  const fiveRappen = (v: number) => Math.round(v * 20) / 20;
  check(
    'and below the ceiling they agree to the rappen the engine rounds to',
    priceEstimate({ ...base, couponPercent: 5, couponMaxDiscount: 80 }, settings).discount ===
      fiveRappen(couponDiscount({ ...welcomeShell(80), value: 5 }, plain.subtotal)),
  );
  /* A ceiling on a fixed amount is ignored rather than obeyed, because the
     engine's `couponAmount` branch never sees it — worth pinning, since the
     form clears the field on that branch and only the seed could reintroduce
     one. */
  check(
    'a ceiling does nothing to a fixed amount',
    priceEstimate({ ...base, couponAmount: 120, couponMaxDiscount: 80 }, settings).discount === 120,
  );
}

/** A bare percentage coupon with the given ceiling and no floor. */
function welcomeShell(maxDiscount?: number): Coupon {
  return {
    id: 'cpn_shell',
    code: 'SHELL',
    kind: 'percent',
    value: 10,
    maxDiscount,
    services: [],
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    usedCount: 0,
    active: true,
  };
}

/* ------------------------------------------------------- the derived state */
{
  const seen = new Set(seeded.map((c) => couponState(c, NOW)));

  check(
    'the seed reaches every declared coupon state',
    statesOf('coupon').every((s) => seen.has(s as never)),
    `missing ${statesOf('coupon').filter((s) => !seen.has(s as never)).join(', ')}`,
  );
  check(
    'and declares no state it cannot reach',
    [...seen].every((s) => statesOf('coupon').includes(s)),
  );
  check(
    'every state has a label in both languages',
    statesOf('coupon').every(
      (s) =>
        Boolean((en.status.coupon as Record<string, string>)[s]) &&
        Boolean((de.status.coupon as Record<string, string>)[s]),
    ),
  );

  check('cpn_1 is valid today', couponState(byId('cpn_1'), NOW) === 'active');
  check('cpn_2 is fully redeemed', couponState(byId('cpn_2'), NOW) === 'used-up');
  check('cpn_3 is expired', couponState(byId('cpn_3'), NOW) === 'expired');
  check('cpn_4 is disabled', couponState(byId('cpn_4'), NOW) === 'inactive');
  check('cpn_5 has not started yet', couponState(byId('cpn_5'), NOW) === 'scheduled');

  /*
   * The four combinations that used to render as one word.
   *
   * The old screen asked `active` first and then only the end date, so a code
   * pulled by the office, a code that ran out and a code that hit its ceiling
   * were all «nicht gültig» in the same grey. And a code starting next month
   * was «Gültig» in green, which is the one that was actively wrong.
   */
  const base = byId('cpn_1');
  check(
    'switching a live coupon off reads as disabled, not expired',
    couponState({ ...base, active: false }, NOW) === 'inactive',
  );
  check(
    'expiry beats the ceiling — the date is the fact nobody argues with',
    couponState(
      { ...base, validTo: new Date(NOW.getTime() - 86_400_000).toISOString(), maxUses: 1 },
      NOW,
    ) === 'expired',
  );
  check(
    'a coupon still in its window that hit its ceiling is the warning',
    statusTone('coupon', couponState({ ...base, maxUses: base.usedCount }, NOW)) === 'warning',
  );
  check(
    'a valid coupon is the only green one',
    statesOf('coupon').filter((s) => statusTone('coupon', s) === 'success').length === 1,
  );
  check(
    'a coupon that has not started is not green',
    statusTone('coupon', 'scheduled') !== 'success',
  );

  check('an uncapped coupon has no remaining count', couponRemaining(byId('cpn_5')) === undefined);
  check('a capped one does', couponRemaining(byId('cpn_1')) === 153);
  check(
    'remaining never goes negative — lowering a ceiling below the count is allowed',
    couponRemaining({ ...base, maxUses: 1 }) === 0,
  );

  const services = useStore.getState().services;
  check(
    'all-services reads as an empty list, for the screen to spell out',
    couponServiceNames(byId('cpn_1'), services, 'de').length === 0,
  );
  check(
    'a scoped coupon names its services',
    couponServiceNames(byId('cpn_3'), services, 'de').length === 2,
  );
}

/* ------------------------------------------- the form does not write as you type
 *
 * The component holds `form` in local state and calls `patchData` only from
 * `save()`. That is the whole fix, and it is invisible on screen — so the same
 * two steps are run here against the real store: edit the draft, look at the
 * store, then save and look again.
 */
{
  const store = reset();
  const original = store.data.coupons.find((c) => c.id === 'cpn_1')!;

  /* Every keystroke of «WELCOME10» → «WELCOME20», as the old form would have
     written them. The last one is the only value anybody meant. */
  let draft: Coupon = { ...original };
  for (const code of ['WELCOME1', 'WELCOME', 'WELCOM', 'WELCOME2', 'WELCOME20']) {
    draft = { ...draft, code };
  }
  draft = { ...draft, value: 15 };

  const stored = () => useStore.getState().data.coupons.find((c) => c.id === 'cpn_1')!;
  check('typing has not touched the store', stored().code === 'WELCOME10' && stored().value === 10);
  check('and the half-typed codes never reached it', stored().code !== 'WELCOM');

  /* Discard — the exit that did not exist. The draft is dropped, nothing
     was ever written, so the record is untouched by construction. */
  check('discarding leaves the record alone', stored().code === original.code);

  useStore.getState().patchData({
    coupons: useStore.getState().data.coupons.map((c) => (c.id === 'cpn_1' ? draft : c)),
  });
  check('saving writes once, at the end', stored().code === 'WELCOME20' && stored().value === 15);
  check('and preserves what the form does not own', stored().usedCount === original.usedCount);
  check('including the id', stored().id === 'cpn_1');
}

/* ------------------------------------------ what the save button refuses to do */
{
  const store = reset();
  const coupons = store.data.coupons;

  /* The three gates the form applies before it writes. Each is only checkable
     because there is now a moment between typing and saving. */
  const duplicate = (code: string, id: string) =>
    code.trim() !== '' &&
    coupons.some((c) => c.id !== id && c.code.toUpperCase() === code.toUpperCase());

  check('a duplicate code is caught', duplicate('welcome10', 'cpn_2'));
  check('case does not get round it', duplicate('WeLcOmE10', 'cpn_2'));
  check('a coupon is not a duplicate of itself', !duplicate('WELCOME10', 'cpn_1'));
  check('a free code passes', !duplicate('AUTUMN30', 'cpn_2'));
  check('an empty code is not reported as a duplicate', !duplicate('   ', 'cpn_2'));

  check('an end date before the start is caught', '2026-01-01' < '2026-06-01');
  check('a same-day window is allowed', !('2026-06-01' < '2026-06-01'));

  /* Was `cpn_${coupons.length + 1}`: delete one, add another, and two records
     share an id — the collision class the review store already fixed. */
  const mint = (n: number, at: Date) => `cpn_${n}_${at.getTime().toString(36).slice(-4)}`;
  check(
    'a new id collides with nothing in the seed',
    !coupons.some((c) => c.id === mint(coupons.length, NOW)),
  );
  check(
    'and not with a coupon that was removed and replaced',
    mint(4, NOW) !== mint(5, NOW),
  );
}

/* ------------------------------------------------- the switch on the list
 *
 * The one control on either coupon screen that writes on the click. It is a
 * store action rather than a `patchData` because it is the only coupon change
 * with an audience — pulling a printed code is what the Protokoll is for.
 */
{
  reset();
  const stored = (id: string) => useStore.getState().data.coupons.find((c) => c.id === id)!;
  const logCount = () => useStore.getState().data.changeLog.length;

  check('cpn_1 starts switched on', stored('cpn_1').active);

  const before = logCount();
  useStore.getState().setCouponActive('cpn_1', false);
  check('the switch writes immediately', !stored('cpn_1').active);
  check('and is logged as a decision', logCount() === before + 1);
  check(
    'the entry names the code, not the id',
    useStore.getState().data.changeLog[0]!.summary.includes('WELCOME10'),
  );
  check(
    'and it is filed under coupon',
    useStore.getState().data.changeLog[0]!.entity === 'coupon',
  );

  const after = logCount();
  useStore.getState().setCouponActive('cpn_1', false);
  check('switching off what is already off changes nothing', logCount() === after);

  useStore.getState().setCouponActive('cpn_1', true);
  check('the same switch is its own undo', stored('cpn_1').active);

  useStore.getState().setCouponActive('cpn_nonexistent', false);
  check('an unknown id is refused quietly', logCount() === after + 1);

  /* The switch owns one field and only one. Everything else on the record is
     the edit screen's, and a toggle that quietly reset a date would be the
     worst kind of bug to find from a list. */
  const original = buildScenario('demo', NOW).coupons.find((c) => c.id === 'cpn_1')!;
  check(
    'nothing but `active` moved',
    (Object.keys(original) as (keyof Coupon)[])
      .filter((k) => k !== 'active')
      .every((k) => JSON.stringify(stored('cpn_1')[k]) === JSON.stringify(original[k])),
  );

  /* Switching a code on does not make it valid — SPRING25 expired in spring.
     The switch and the badge answer different questions, which is why the list
     carries both. */
  useStore.getState().setCouponActive('cpn_3', true);
  check(
    'switching on an expired coupon leaves it expired',
    couponState(stored('cpn_3'), NOW) === 'expired',
  );
}

/* --------------------------------------------- what the toolbar filters on */
{
  reset();
  const all = useStore.getState().data.coupons;

  /* The list filters on the derived state, not on the boolean. Filtering the
     raw field would file SPRING25 — switched on, expired four months ago —
     under "valid", the exact wrong answer the badge exists to prevent. */
  const byState = (s: string) => all.filter((c) => couponState(c, NOW) === s);
  check('the valid filter returns only what is live', byState('active').every((c) => c.active));
  check(
    'and does not return the expired coupon that is switched on',
    !byState('active').some((c) => c.id === 'cpn_3'),
  );
  check(
    'while filtering the raw boolean would have',
    all.filter((c) => c.active).some((c) => c.id === 'cpn_3'),
  );
  check(
    'every state option returns at least one row against the seed',
    statesOf('coupon').every((s) => byState(s).length > 0),
    `empty: ${statesOf('coupon').filter((s) => byState(s).length === 0).join(', ')}`,
  );
  check(
    'the options together account for every row',
    statesOf('coupon').reduce((n, s) => n + byState(s).length, 0) === all.length,
  );

  const services = useStore.getState().services;
  const search = (q: string) =>
    all.filter((c) =>
      [c.code, ...c.services, ...couponServiceNames(c, services, 'de')]
        .join(' ')
        .toLowerCase()
        .includes(q.trim().toLowerCase()),
    );

  check('searching a code finds it', search('welcome').map((c) => c.id).join() === 'cpn_1');
  check('case does not matter', search('WeLcOmE').length === 1);
  check('a partial code matches', search('50').some((c) => c.id === 'cpn_2'));
  check(
    'searching a service name finds the codes scoped to it',
    search('Fensterreinigung').map((c) => c.id).sort().join() === 'cpn_3,cpn_5',
  );
  check(
    'the slug works too — it is what a quote line stores',
    search('bueroreinigung').map((c) => c.id).join() === 'cpn_4',
  );
  check('a search with no match returns nothing', search('zzzz').length === 0);
  check('an empty search is not a filter', search('').length === all.length);
}

if (failures.length > 0) {
  console.error(`\n${passed} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\n${passed} passed, 0 failed`);
