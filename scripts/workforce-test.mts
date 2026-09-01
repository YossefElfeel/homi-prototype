/**
 * Who is on a job, and how long it took them.
 *
 * Six classes of failure this catches, none of which typechecks as wrong:
 *
 *  · **Hours credited to the wrong person.** `WorkEntry.memberId` exists so
 *    that reassigning a job cannot move somebody else's afternoon onto a new
 *    name. That only holds while `assignBooking` leaves `work` alone, and
 *    nothing about the types says it must.
 *
 *  · **A correction that doubles.** Recording twice is a fix, not a second
 *    afternoon. Without the upsert, checking out, spotting the typo and
 *    re-entering the number bills ten and a half hours for a five-hour job.
 *
 *  · **A total that disagrees with the row above it.** The approval banner,
 *    the list column and the team screen all read `workforce.ts`; that only
 *    stays true while there is one implementation of the sum.
 *
 *  · **A warning that refuses.** `assignmentWarnings` must never block — the
 *    office knows things the record does not. A warning that became a rule
 *    would be discovered on a Friday afternoon by somebody on the phone.
 *
 *  · **A state nothing can reach.** «Nicht zugewiesen» is a filter option, a
 *    column value and an empty state. A seed where every booking carries an
 *    assignee leaves all three unreviewable.
 *
 *  · **German in the mock layer.** The store composes the booking timeline
 *    now that check-out no longer takes a translated label from the screen —
 *    the same rule `EVENT_STATUS_EVENT` states and `lang-check` enforces for
 *    the seed.
 */

/* First, and before the store: see the file's own note. */
import './storage-shim.mts';

import { SCENARIOS, buildScenario } from '../src/mock/scenarios.ts';
import { useStore } from '../src/mock/store.ts';
import {
  assignableTeam,
  assignmentWarnings,
  clashingBookings,
  hasWorkRecord,
  hoursOf,
  isValidWorkHours,
  MAX_WORK_HOURS,
  memberById,
  memberJobCount,
  memberMinutes,
  memberName,
  minutesOf,
  varianceMinutes,
  workEntryFor,
  workedMinutes,
} from '../src/lib/workforce.ts';
import {
  hoursOnSite,
  memberName as labourMemberName,
  suggestedHours,
} from '../src/lib/labour-facts.ts';
import { de, en } from '../src/messages/index.ts';
import type { Booking } from '../src/mock/schema.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

const NOW = new Date('2026-08-25T10:00:00Z');

/* ------------------------------------------------------------- the seed */
{
  const demo = buildScenario('demo', NOW);

  check(
    'the roster is more than one person, or none of this is worth building',
    demo.team.length > 1,
    `got ${demo.team.length}`,
  );
  check(
    'the default scenario spreads the work across it — a column printing one name is the screen §2a took out',
    new Set(demo.bookings.map((b) => b.assigneeId)).size > 1,
  );
  check(
    'and leaves one job for nobody, so «nicht zugewiesen» is a state you can look at',
    demo.bookings.some((b) => !b.assigneeId),
  );
  check(
    'every assignee on a seeded job is somebody on the team',
    demo.bookings.every((b) => !b.assigneeId || demo.team.some((m) => m.id === b.assigneeId)),
  );

  const recorded = demo.bookings.filter(hasWorkRecord);
  check('finished jobs carry their hours', recorded.length > 0, `got ${recorded.length}`);
  check(
    'and every entry belongs to the person the job is on — the whole reason WorkEntry carries a memberId',
    recorded.every((b) => (b.work ?? []).every((w) => w.memberId === b.assigneeId)),
  );
  check(
    'no job records hours twice for the same person',
    recorded.every(
      (b) => new Set((b.work ?? []).map((w) => w.memberId)).size === (b.work ?? []).length,
    ),
  );
  check(
    'no seeded entry is outside the sane range the field enforces',
    recorded.every((b) => (b.work ?? []).every((w) => isValidWorkHours(hoursOf(w.minutes)))),
  );

  /* Both directions. §5.3 reads as "extra time" and the shortfall is the same
     number the other way round — a seed with only overruns makes «unter der
     Planung» a branch nothing draws. */
  check(
    'something ran over the estimate',
    recorded.some((b) => varianceMinutes(b) > 0),
  );
  check(
    'and something came in under it',
    recorded.some((b) => varianceMinutes(b) < 0),
  );

  check(
    'nothing has been checked out of without its hours — that is the row the office is asked to approve',
    demo.bookings
      .filter((b) => b.checkOutAt && b.assigneeId)
      .every((b) => hasWorkRecord(b)),
  );

  check(
    'a scheduled job records nothing, so "not yet" and "zero" stay different facts',
    demo.bookings
      .filter((b) => b.status === 'scheduled')
      .every((b) => !hasWorkRecord(b)),
  );

  const awaiting = demo.bookings.find((b) => b.status === 'awaitingApproval');
  check('the approval banner has a job to sit on', Boolean(awaiting));
  check(
    'with hours on it, so the banner prints a number rather than pointing at the history',
    Boolean(awaiting && hasWorkRecord(awaiting)),
  );
}

/* --------------------------------------------------- every other scenario */
{
  for (const name of SCENARIOS) {
    const data = buildScenario(name, NOW);
    check(
      `[${name}] no job is assigned to somebody who is not on the team`,
      data.bookings.every((b) => !b.assigneeId || data.team.some((m) => m.id === b.assigneeId)),
    );
    check(
      `[${name}] no recorded hour belongs to somebody who is not on the team`,
      data.bookings.every((b) =>
        (b.work ?? []).every((w) => data.team.some((m) => m.id === w.memberId)),
      ),
    );
    /* The one `withHiring` used to break: it reassigned every booking, so a
       finished job could end up on one contractor with its hours credited to
       another. Only open jobs move now. */
    check(
      `[${name}] a finished job is assigned to whoever recorded its hours`,
      data.bookings.every((b) => !hasWorkRecord(b) || (b.work ?? []).every((w) => w.memberId === b.assigneeId)),
    );
  }

  const states = buildScenario('states', NOW);
  check(
    'the states scenario carries an unassigned job — the column and the filter both have to draw it',
    states.bookings.some((b) => !b.assigneeId),
  );
  check(
    'and hours on more than one person, so the team screen is not one row',
    new Set(states.bookings.flatMap((b) => (b.work ?? []).map((w) => w.memberId))).size > 1,
  );

  const fresh = buildScenario('fresh', NOW);
  check('launch day has no jobs, so the empty states stay reachable', fresh.bookings.length === 0);
  check('and one person on the roster', fresh.team.length === 1);
  check(
    'so the assign filter hides itself rather than offering a dropdown with one name in it',
    fresh.team.length <= 1,
  );

  const hiring = buildScenario('hiring', NOW);
  const contractors = hiring.team.filter((m) => m.role === 'contractor');
  check('the hiring scenario has two contractors', contractors.length === 2);
  check(
    'and open work for both of them — a member picker with an empty day behind one option is a control that looks broken',
    contractors.every((m) => hiring.bookings.some((b) => b.assigneeId === m.id)),
  );
}

/* ---------------------------------------------------------- the derivations */
{
  const data = buildScenario('demo', NOW);
  const marta = data.team.find((m) => m.id === 'tm_marta')!;
  const owner = data.team.find((m) => m.role === 'owner')!;

  check('the roster is everybody who is active', assignableTeam(data.team).length === data.team.length);
  check(
    'and drops somebody parked — the switch on the team screen says «kann Einsätze zugewiesen bekommen» and one select ignored it',
    assignableTeam([...data.team.slice(1), { ...marta, active: false }]).every((m) => m.active),
  );
  check('the owner stays assignable — most jobs are still his', assignableTeam(data.team).some((m) => m.role === 'owner'));

  check('a member resolves by id', memberById(data.team, 'tm_marta')?.id === 'tm_marta');
  check('an id nobody holds resolves to nobody', memberById(data.team, 'tm_ghost') === undefined);
  check('and so does no id at all', memberById(data.team, undefined) === undefined);
  check('a missing member renders as an empty name, never as "undefined undefined"', memberName(undefined) === '');

  check('60 minutes is one hour', hoursOf(60) === 1);
  check('and a half hour survives the round trip', minutesOf(hoursOf(150)) === 150);
  check('7 h 15 rounds to one decimal rather than printing 7.25', hoursOf(435) === 7.3);

  check('zero hours is refused', !isValidWorkHours(0));
  check('a negative afternoon is refused', !isValidWorkHours(-2));
  check('so is a day longer than a day', !isValidWorkHours(MAX_WORK_HOURS + 0.5));
  check('a typed 80 for 8 is refused — one missed keystroke into a figure work is priced off', !isValidWorkHours(80));
  check('and 8 is fine', isValidWorkHours(8));
  check('text is refused rather than becoming NaN minutes', !isValidWorkHours(Number('abc')));

  const withHours = data.bookings.find(hasWorkRecord)!;
  check('the sum is the entries', workedMinutes(withHours) === (withHours.work ?? []).reduce((n, w) => n + w.minutes, 0));
  check('a job nobody worked sums to nothing without throwing', workedMinutes({ ...withHours, work: undefined }) === 0);
  check('and says so separately', !hasWorkRecord({ ...withHours, work: undefined }));
  check('the entry for a person comes back', workEntryFor(withHours, withHours.assigneeId)?.memberId === withHours.assigneeId);
  check('and for somebody else does not', workEntryFor(withHours, 'tm_ghost') === undefined);

  check(
    'one person’s total is only their own hours',
    memberMinutes(data.bookings, owner.id) ===
      data.bookings.reduce(
        (n, b) => n + (b.work ?? []).reduce((m, w) => (w.memberId === owner.id ? m + w.minutes : m), 0),
        0,
      ),
  );
  check('a person with nothing recorded totals zero rather than NaN', memberMinutes(data.bookings, 'tm_yusuf') === 0);
  check('and counts no jobs', memberJobCount(data.bookings, 'tm_yusuf') === 0);
  check('the job count is jobs, not entries', memberJobCount(data.bookings, marta.id) <= data.bookings.length);
}

/* ------------------------------------------------------------- the warnings */
{
  const data = buildScenario('demo', NOW);
  const marta = data.team.find((m) => m.id === 'tm_marta')!;
  const yusuf = data.team.find((m) => m.id === 'tm_yusuf')!;
  const owner = data.team.find((m) => m.role === 'owner')!;
  const job = data.bookings.find((b) => b.assigneeId === marta.id)!;
  const warn = (m: typeof marta, b: Booking) => assignmentWarnings(m, b, data.bookings, data.properties);

  check(
    'the person the seed assigned raises nothing — a warning on every row is a warning nobody reads',
    warn(marta, job).length === 0,
    warn(marta, job).join(', '),
  );
  check(
    'somebody not cleared for the service is flagged',
    warn(yusuf, { ...job, serviceSlug: 'fensterreinigung' }).includes('skill'),
  );
  check(
    'the owner never is — §22 clears them for everything, and flagging the person who wrote the service list is noise',
    !warn(owner, { ...job, serviceSlug: 'fensterreinigung' }).includes('skill'),
  );
  check(
    'an address outside the area is flagged',
    warn({ ...marta, regions: ['9999'] }, job).includes('region'),
  );
  check(
    'a deactivated person is flagged — they can still be on a job, they just should not be given a new one',
    warn({ ...marta, active: false }, job).includes('inactive'),
  );

  /* The one that cannot be recovered from on the day. */
  const clashing: Booking = {
    ...job,
    id: 'bkg_clash',
    reference: 'B-9999',
    start: new Date(new Date(job.start).getTime() + 30 * 60_000).toISOString(),
  };
  const both = [...data.bookings, clashing];
  check(
    'two jobs overlapping on one person is a clash',
    assignmentWarnings(marta, clashing, both, data.properties).includes('clash'),
  );
  check(
    'the same two on different people is not',
    !assignmentWarnings(marta, { ...clashing, assigneeId: yusuf.id }, both.map((b) => (b.id === job.id ? { ...b, assigneeId: yusuf.id } : b)), data.properties).includes('clash'),
  );
  check(
    'a job never clashes with itself',
    clashingBookings(marta.id, job, data.bookings).every((b) => b.id !== job.id),
  );
  check(
    'a cancelled job occupies nobody — otherwise every replacement clashes with the job it replaced',
    !assignmentWarnings(
      marta,
      clashing,
      both.map((b) => (b.id === job.id ? { ...b, status: 'cancelled' as const } : b)),
      data.properties,
    ).includes('clash'),
  );
  check(
    'and neither does one that finished',
    !assignmentWarnings(
      marta,
      clashing,
      both.map((b) => (b.id === job.id ? { ...b, status: 'closed' as const } : b)),
      data.properties,
    ).includes('clash'),
  );
  /* Against the seed rather than `both`: the 30-minute clash above genuinely
     does run into this one, and testing "no overlap" beside a record that
     overlaps it would only prove the fixture wrong. */
  check(
    'back to back is not an overlap — 09:00–14:00 and 14:00 onwards is one person’s ordinary day',
    !assignmentWarnings(
      marta,
      { ...job, id: 'bkg_after', start: new Date(new Date(job.start).getTime() + job.duration * 60_000).toISOString() },
      data.bookings,
      data.properties,
    ).includes('clash'),
  );
}

/* ----------------------------------------------------------------- the store */
{
  useStore.getState().setScenario('demo');
  const get = () => useStore.getState();
  const find = (id: string) => get().data.bookings.find((b) => b.id === id)!;

  const open = get().data.bookings.find((b) => b.status === 'scheduled' && !b.assigneeId)!;
  check('the seed leaves a job to assign', Boolean(open));

  const logBefore = get().data.changeLog.length;
  const historyBefore = open.history.length;
  get().assignBooking({ id: open.id, memberId: 'tm_yusuf' }, NOW);
  check('assigning writes the name', find(open.id).assigneeId === 'tm_yusuf');
  check('and a timeline entry', find(open.id).history.length === historyBefore + 1);
  check('and reaches the change log — this is somebody’s week moving', get().data.changeLog.length === logBefore + 1);
  check(
    'the timeline says who, not just that something happened',
    find(open.id).history.at(-1)!.label.includes('Yusuf'),
  );

  const settledLog = get().data.changeLog.length;
  get().assignBooking({ id: open.id, memberId: 'tm_yusuf' }, NOW);
  check(
    'assigning the same person again changes nothing — a line saying "still Yusuf" is one more thing to read past',
    get().data.changeLog.length === settledLog,
  );

  get().assignBooking({ id: open.id, memberId: 'tm_marta' }, NOW);
  check('handing it on names both ends', /from .*Yusuf.* to .*Marta/.test(find(open.id).history.at(-1)!.label));
  check(
    'and the log keeps the surnames capitalised — lower-casing the whole line turned four names into nouns',
    /Yusuf Demir/.test(get().data.changeLog[0]!.summary) &&
      /Marta Nowak/.test(get().data.changeLog[0]!.summary),
    get().data.changeLog[0]!.summary,
  );

  get().assignBooking({ id: open.id, memberId: null }, NOW);
  check('taking the name off is a real action, not an error', find(open.id).assigneeId === undefined);
  check('and it is recorded', find(open.id).history.at(-1)!.label.includes('removed'));

  get().assignBooking({ id: 'bkg_nobody', memberId: 'tm_marta' }, NOW);
  check('a booking that is not there is refused quietly', !get().data.bookings.some((b) => b.id === 'bkg_nobody'));
}

/* --------------------------------------------------- recording the hours */
{
  useStore.getState().setScenario('demo');
  const get = () => useStore.getState();
  const find = (id: string) => get().data.bookings.find((b) => b.id === id)!;

  const job = get().data.bookings.find((b) => b.status === 'scheduled' && b.assigneeId)!;
  const who = job.assigneeId!;

  get().recordCheck(job.id, { kind: 'in', photos: ['a', 'b', 'c'], note: '' }, NOW);
  check('checking in starts the job', find(job.id).status === 'inProgress');
  check('and records no hours — nothing has been worked yet', !hasWorkRecord(find(job.id)));

  const out = new Date(NOW.getTime() + 5 * 3_600_000);
  get().recordCheck(job.id, { kind: 'out', photos: ['d', 'e', 'f'], note: 'oven', hours: 5 }, out);
  check('checking out finishes it', find(job.id).status === 'awaitingApproval');
  check('the hours land as a number', workedMinutes(find(job.id)) === 300);
  check('against the person on the job', workEntryFor(find(job.id), who)?.memberId === who);
  check('marked as the field’s own report', workEntryFor(find(job.id), who)?.source === 'field');
  check('the note travels with it', workEntryFor(find(job.id), who)?.note === 'oven');
  check(
    'and the timeline carries the figure — the seed writes the same shape',
    find(job.id).history.at(-1)!.label.includes('5 h worked'),
  );

  /* The failure the upsert exists for. */
  get().recordWorkHours({ bookingId: job.id, memberId: who, minutes: 330, source: 'field' }, out);
  check('correcting replaces rather than adds', workedMinutes(find(job.id)) === 330);
  check('and leaves one entry for that person', (find(job.id).work ?? []).filter((w) => w.memberId === who).length === 1);

  const logBefore = get().data.changeLog.length;
  get().recordWorkHours({ bookingId: job.id, memberId: who, minutes: 300, source: 'field' }, out);
  check(
    'a field report stays out of the change log — it is the record itself, and logging every check-out buries the edits the log exists for',
    get().data.changeLog.length === logBefore,
  );

  get().recordWorkHours({ bookingId: job.id, memberId: who, minutes: 360, source: 'office' }, out);
  check('an office correction does reach it', get().data.changeLog.length === logBefore + 1);
  check('and says so, because "reported" and "decided" are different claims', workEntryFor(find(job.id), who)?.source === 'office');
  check('the timeline says which one too', find(job.id).history.at(-1)!.label.includes('office'));

  const before = workedMinutes(find(job.id));
  get().recordWorkHours({ bookingId: job.id, memberId: who, minutes: 0, source: 'office' }, out);
  check('zero is refused rather than erasing the record', workedMinutes(find(job.id)) === before);
  get().recordWorkHours({ bookingId: job.id, memberId: who, minutes: -60, source: 'office' }, out);
  check('and so is a negative afternoon', workedMinutes(find(job.id)) === before);

  /* The invariant the whole entity exists for. */
  const hoursOwner = workEntryFor(find(job.id), who)!.minutes;
  get().assignBooking({ id: job.id, memberId: 'tm_yusuf' }, out);
  check('reassigning moves the job', find(job.id).assigneeId === 'tm_yusuf');
  check(
    'and leaves the hours with the person who worked them — this is why WorkEntry carries a memberId at all',
    workEntryFor(find(job.id), who)?.minutes === hoursOwner,
  );
  check('the new name has recorded nothing', workEntryFor(find(job.id), 'tm_yusuf') === undefined);
  /* And the office correcting "the hours" must not mean the new name's empty
     entry — the screen edits an entry, not the assignee, so a handed-on job
     cannot end up billed for two afternoons. */
  check(
    'a handed-on job still has exactly one entry',
    (find(job.id).work ?? []).length === 1,
    `got ${(find(job.id).work ?? []).length}`,
  );
  check(
    'and the total is still one afternoon',
    workedMinutes(find(job.id)) === before,
  );

  get().approveBooking(job.id, 'Approved', out);
  check('approving still works with hours on the record', find(job.id).status === 'completed');
  check('and does not disturb them', workedMinutes(find(job.id)) === before);
}

/* ------------------------------------------------------------ the language */
{
  /*
   * The store composes the booking timeline again — check-out used to build it
   * in German, which put «Eingecheckt» among nine English entries in a record
   * no dictionary ever sees. Same rule EVENT_STATUS_EVENT states.
   */
  const GERMAN = /\b(Eingecheckt|Ausgecheckt|Fotos|Zugewiesen|Stunden|gemeldet|erfasst|Einsatz)\b/;

  useStore.getState().setScenario('demo');
  const get = () => useStore.getState();
  const job = get().data.bookings.find((b) => b.status === 'scheduled' && b.assigneeId)!;

  get().recordCheck(job.id, { kind: 'in', photos: ['a'], note: '' }, NOW);
  get().recordCheck(job.id, { kind: 'out', photos: ['b'], note: '', hours: 4 }, NOW);
  get().assignBooking({ id: job.id, memberId: 'tm_yusuf' }, NOW);
  get().recordWorkHours({ bookingId: job.id, memberId: 'tm_yusuf', minutes: 240, source: 'office' }, NOW);

  const written = get().data.bookings.find((b) => b.id === job.id)!.history.slice(-4);
  for (const entry of written) {
    check(`the store writes English: "${entry.label}"`, !GERMAN.test(entry.label));
  }
  for (const entry of get().data.changeLog.slice(0, 2)) {
    check(`and so does the change log: "${entry.summary}"`, !GERMAN.test(entry.summary));
  }
}

/* -------------------------------------------------------------- the copy */
{
  /* Both dictionaries or neither. `en` is typed against `de`, so a missing key
     is a compile error — what this catches is the other half: a key that exists
     in both and is still the German string. */
  const keys = [
    'workTitle',
    'assigneeLabel',
    'unassigned',
    'assign',
    'reassign',
    'plannedLabel',
    'workedLabel',
    'noHours',
    'varianceLabel',
    'warn_clash',
    'warn_skill',
    'warn_region',
    'warn_inactive',
    'hoursCorrect',
    'approveHours',
  ] as const;
  for (const key of keys) {
    check(`admin.booking.${key} is translated`, de.admin.booking[key] !== en.admin.booking[key]);
  }
  check('the field asks for hours worked, not for the difference', 'hoursLabel' in de.field.check);
  /* The booking screen carries two hours cards since wave 83 landed — the
     report on the left, the wage cost on the right. They must not both say
     «Gearbeitet», and the cost card must not claim nothing is recorded on a
     job whose report is on the same screen. */
  check('the reported hours are labelled as reported', de.admin.booking.workedLabel === 'Gemeldet');
  check('and the labour card talks about money, not about the report',
    !de.admin.booking.labourEmpty.includes('erfasst'), de.admin.booking.labourEmpty);
  check('the two cards do not share a heading',
    de.admin.booking.workTitle !== de.admin.booking.labourTitle);
  check(
    'the settled hint still names assigning, which is true again',
    de.admin.booking.settledHint.includes('Zuweisen'),
  );
}


/* ------------------------------------- the join with the labour costs */
{
  /*
   * Wave 83 opens the wage form on `hoursOnSite` — the span between the two
   * stamps — and its own note says why that is uncomfortable: somebody who
   * forgets to check out books an eleven-hour day. The report is the better
   * figure and it exists now, so the form has to prefer it *and say which one
   * it got*: «Check-in bis Check-out» over a reported number would be a claim
   * about a provenance it does not have.
   */
  const data = buildScenario('demo', NOW);
  const reported = data.bookings.find(hasWorkRecord)!;

  const fromReport = suggestedHours(reported);
  check('a job with a report suggests the report', fromReport?.source === 'reported');
  check(
    'and the figure is the reported one',
    fromReport?.hours === hoursOf(workedMinutes(reported)),
  );
  /*
   * And the seed has to keep a job where the two genuinely disagree, or the
   * whole preference is unreviewable: a reader opening the wage form would see
   * the same figure either way and could not tell which one it came from.
   * B-1054 is it — stamped 09:02 to 12:10, three hours reported.
   */
  const divergent = data.bookings
    .filter(hasWorkRecord)
    .find((b) => hoursOnSite(b) !== null && hoursOnSite(b) !== hoursOf(workedMinutes(b)));
  check('the seed keeps a job whose report and stamps disagree', Boolean(divergent));
  check(
    'and the suggestion follows the report there, not the span',
    suggestedHours(divergent)?.hours === hoursOf(workedMinutes(divergent!)),
    `report ${hoursOf(workedMinutes(divergent!))} vs span ${hoursOnSite(divergent!)}`,
  );

  const stampsOnly = { ...reported, work: undefined };
  const fromStamps = suggestedHours(stampsOnly);
  check('a job from before this wave falls back to the stamps', fromStamps?.source === 'onSite');
  check(
    'and says so, so the sentence beside it stays true',
    fromStamps?.hours === hoursOnSite(stampsOnly),
  );

  check(
    'a job nobody has finished suggests nothing at all',
    suggestedHours({ ...reported, work: undefined, checkInAt: undefined, checkOutAt: undefined }) ===
      null,
  );
  check('and neither does no job', suggestedHours(undefined) === null);

  /* One spelling of a name across both libraries — see labour-facts.memberName. */
  const marta = data.team.find((m) => m.id === 'tm_marta')!;
  check('both libraries spell a name the same way', labourMemberName(marta) === memberName(marta));
  check(
    'and only the cost side falls back to a dash',
    labourMemberName(undefined) === '—' && memberName(undefined) === '',
  );
}

if (failures.length > 0) {
  console.error(`\n${passed} passed, ${failures.length} failed\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\n${passed} passed, 0 failed`);
