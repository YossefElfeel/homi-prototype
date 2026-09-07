/**
 * Deleting a job, and the rule that refuses to.
 *
 * A screen check cannot catch what this file is for. The harm in deleting a
 * posting that has applications is not a crash and not a blank — both admin
 * screens look up the job as `postings.find(p => p.id === a.postingId)` and
 * fall through to «Spontanbewerbung» when the lookup misses. So a wrong delete
 * renders *fine*. It just says something false about people who are still in
 * the table: that they wrote in unprompted, when they answered an advert.
 *
 * That is an assertion about two records at once, which is why it is here
 * rather than in a rendering pass. `seed-test` proves the seeded data is
 * internally consistent; nothing proved it stays that way after an action.
 */

/* The store persists to localStorage and node has none, so zustand warns on
   every single write. A memory shim, installed before the store is imported —
   the same one `plan-test` uses, and for the same reason. */
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
import { buildScenario } from '../src/mock/scenarios.ts';
import { postingUsage } from '../src/lib/posting-facts.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

const NOW = new Date('2026-08-17T10:00:00Z');

/** A fresh world per case: these actions write, and a shared store would make
    the order of the cases part of what is being tested. */
function reset() {
  useStore.setState({ data: buildScenario('demo', NOW) });
  return useStore.getState();
}

const state = () => useStore.getState();

/* ------------------------------------------- both states are in the demo */
{
  reset();
  const postings = state().data.postings;
  const applications = state().data.applications;

  const applied = postings.filter((p) => postingUsage(p.id, applications).total > 0);
  const untouched = postings.filter((p) => postingUsage(p.id, applications).total === 0);

  /* The point of the assertion is the reviewer, not the code. Both answers the
     screen can give have to be one click from a cold start, or the refusal is
     a state somebody can only reach by wrecking the demo first. */
  check('the demo holds a job somebody applied for', applied.length > 0, `${applied.length}`);
  check('and a job nobody applied for', untouched.length > 0, `${untouched.length}`);
  check(
    'and one of the untouched ones is published, so the public-page warning is reachable',
    untouched.some((p) => p.published),
  );
  check(
    'and one is a draft, so the plain confirm is reachable too',
    untouched.some((p) => !p.published),
  );

  const withOpen = applied.find((p) => postingUsage(p.id, applications).open > 0);
  check('and one whose applications are not all answered', Boolean(withOpen), withOpen?.slug);
}

/* ------------------------------------------------------- the job that may go */
{
  reset();
  const before = state().data.postings.length;
  const target = state().data.postings.find(
    (p) => postingUsage(p.id, state().data.applications).total === 0,
  )!;

  check('a job nobody applied for can be deleted', state().deletePosting(target.id));
  check('and it is gone', state().data.postings.length === before - 1);
  check(
    'and it is gone by id, not just by count',
    !state().data.postings.some((p) => p.id === target.id),
  );

  /* The summary carries the title because after this the id resolves to
     nothing — the log entry is the only place left that can say which job. */
  const logged = state().data.changeLog.find(
    (e) => e.entityId === target.id && e.summary.includes('deleted'),
  );
  check('deleting a job is logged', Boolean(logged));
  check(
    'and the log entry names it, because the id no longer resolves',
    Boolean(logged && (logged.summary.includes(target.title.en) || logged.summary.includes(target.title.de))),
    logged?.summary,
  );

  check('deleting it a second time is refused', state().deletePosting(target.id) === false);
}

/* --------------------------------------------------- the job that may not */
{
  reset();
  const target = state().data.postings.find(
    (p) => postingUsage(p.id, state().data.applications).total > 0,
  )!;

  check('a job somebody applied for is refused', state().deletePosting(target.id) === false);
  check('and it is still there', state().data.postings.some((p) => p.id === target.id));

}

/* ------------------------------------------ answered is not the same as gone */
{
  /*
   * Every application answered, and it is still refused.
   *
   * This is the assertion worth having. «Nobody is waiting on it any more» is
   * the reading that would let a job be deleted out from under a rejection
   * letter and a hire — the applicant screen keeps both, and both print the
   * job's title off this id. Built rather than found: the demo has no posting
   * whose applications are all closed, so reading one out would have tested
   * nothing.
   *
   * Its own block, on a fresh store, because the first draft of this case ran
   * after the refusal above and passed with the rule taken out — the earlier
   * delete had already removed the record, so what it actually checked was
   * that a job which is gone cannot be deleted twice.
   */
  reset();
  const target = state().data.postings.find(
    (p) => postingUsage(p.id, state().data.applications).total > 0,
  )!;
  useStore.setState({
    data: {
      ...state().data,
      applications: state().data.applications.map((a) =>
        a.postingId === target.id ? { ...a, status: 'rejected' as const } : a,
      ),
    },
  });
  check(
    'a job whose applications have all been answered is still refused',
    postingUsage(target.id, state().data.applications).open === 0 &&
      state().deletePosting(target.id) === false,
  );
  check('and it is still there', state().data.postings.some((p) => p.id === target.id));
}

/* ------------------------------------- what the rule is actually protecting */
{
  reset();
  /* Delete everything the store will let go of, then ask the question the two
     admin screens ask. If any application were left pointing at a job that no
     longer exists, /admin/applications would call that person a
     Spontanbewerbung — while the record itself still says otherwise — and its
     job filter, built from the postings that exist plus one «spontan» option
     testing `!a.postingId`, would have no option that matches them at all. */
  for (const p of [...state().data.postings]) state().deletePosting(p.id);

  const orphaned = state().data.applications.filter(
    (a) => a.postingId && !state().data.postings.some((p) => p.id === a.postingId),
  );
  check(
    'no allowed delete can orphan an application',
    orphaned.length === 0,
    orphaned.map((a) => a.reference).join(', '),
  );
  check(
    'and an orphan would have been a lie, not a blank',
    /* The check above is only worth anything because of this: these records
       carry `spontaneous: false`, so the fallback the screens would show
       contradicts the row it is drawn from. */
    state().data.applications.filter((a) => a.postingId).every((a) => a.spontaneous === false),
  );
  check(
    'the jobs that were refused are all of them the ones with applications',
    state().data.postings.every((p) => postingUsage(p.id, state().data.applications).total > 0),
  );
}

/* -------------------------------------------- the create flow's own output */
{
  reset();
  const before = state().data.postings.length;
  const { id } = state().createPosting(NOW);
  check('a job can be created', state().data.postings.length === before + 1);

  /* «Stelle anlegen» makes the record before anything is typed into it, so
     backing out of the create flow is exactly the case delete exists for. It
     was, until now, the one thing the screen could not do. */
  check('and the untouched record it lands on can be deleted again', state().deletePosting(id));
  check('leaving the list as it was', state().data.postings.length === before);
}

/* -------------------------------------------------- a published job may go */
{
  reset();
  const target = state().data.postings.find(
    (p) => p.published && postingUsage(p.id, state().data.applications).total === 0,
  )!;

  /* Deliberate, and the confirm says so rather than the rule hiding it: a live
     advert nobody answered is the duplicate, or the role filled off-platform.
     Refusing it would leave delete useful on drafts only. What the reader is
     told is which public page goes with it. */
  check('a published job nobody applied for can be deleted', state().deletePosting(target.id));
}

if (failures.length > 0) {
  console.error(`\n${passed} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\n${passed} passed, 0 failed`);
