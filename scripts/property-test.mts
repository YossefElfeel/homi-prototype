/**
 * Invariants for the property wave.
 *
 * Screen 66 stopped reporting only what an address *is* and started reporting
 * what is owed at it. Both new columns are derived from `bookings`, and a
 * derivation is exactly the kind of thing that typechecks while quietly saying
 * something false — so the failures worth catching here are:
 *
 *  · **A visit counted that never happened.** `noAccess` is a job where nobody
 *    got in. Printed under "last service" it tells the office an address is
 *    looked after when it is the one address that was missed.
 *  · **A row in both columns at once.** `last` and `next` partition the jobs at
 *    an address by status. If a status ever landed in both sets, one booking
 *    would be the last service and the next visit simultaneously.
 *  · **A zone that filters to nothing.** The zone options are built from the
 *    properties on hand. A property whose postcode is not among them is a row
 *    no filter setting can reach.
 *  · **A delete that orphans a record.** Seven types carry a `propertyId` and
 *    three dereference it with `!`. The guard has to see all seven.
 */

import { SCENARIOS, buildScenario } from '../src/mock/scenarios.ts';
import {
  PROPERTY_KINDS,
  propertyUsage,
  propertyVisits,
  zoneOf,
  zonesOf,
} from '../src/lib/property-facts.ts';
import { SERVED_REGIONS } from '../src/mock/engines/coverage.ts';
import { de, en } from '../src/messages/index.ts';
import type { BookingStatus } from '../src/mock/schema.ts';

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

/* The seed is written relative to "now", so an invariant that only holds on
   the weekday it was written is not an invariant. Same three clocks as the
   other suites. */
const CLOCKS = [
  new Date('2026-08-17T10:00:00Z'), // Monday
  new Date('2026-08-20T10:00:00Z'), // Thursday
  new Date('2026-08-22T10:00:00Z'), // Saturday
];

/* --------------------------------------------------------------- columns */

/** Never a service: nobody got in, or the job was called off. */
const NOT_A_SERVICE: BookingStatus[] = ['noAccess', 'cancelled'];

for (const name of SCENARIOS) {
  for (const clock of CLOCKS) {
    const data = buildScenario(name, clock);
    const label = `${name}@${clock.toISOString().slice(0, 10)}`;

    for (const property of data.properties) {
      const jobs = data.bookings.filter((b) => b.propertyId === property.id);
      const { last, next } = propertyVisits(data.bookings, property.id);

      check(
        `${label} ${property.id}: last service is not a job nobody attended`,
        !last || !NOT_A_SERVICE.includes(last.status),
        last?.status,
      );
      check(
        `${label} ${property.id}: next visit is not a job nobody attended`,
        !next || !NOT_A_SERVICE.includes(next.status),
        next?.status,
      );
      check(
        `${label} ${property.id}: last and next are different jobs`,
        !last || !next || last.id !== next.id,
      );

      /* The columns claim "most recent" and "earliest". Anything else in the
         same set that beats the chosen row makes both claims false. */
      if (last) {
        const later = jobs.filter(
          (b) => b.id !== last.id && b.start > last.start && b.status === last.status,
        );
        check(
          `${label} ${property.id}: no served job is later than the last service`,
          later.length === 0,
          later.map((b) => b.id).join(', '),
        );
      }
      if (next) {
        const earlier = jobs.filter(
          (b) => b.id !== next.id && b.start < next.start && b.status === next.status,
        );
        check(
          `${label} ${property.id}: no booked job is earlier than the next visit`,
          earlier.length === 0,
          earlier.map((b) => b.id).join(', '),
        );
      }

      /* An address with jobs on the books that shows neither column is the
         silent version of the bug this screen exists to fix. */
      const attended = jobs.filter((b) => !NOT_A_SERVICE.includes(b.status));
      check(
        `${label} ${property.id}: ${attended.length} attended jobs produce a column`,
        attended.length === 0 || Boolean(last) || Boolean(next),
      );
    }
  }
}

/* ------------------------------------------------------------------ zone */

for (const name of SCENARIOS) {
  const data = buildScenario(name, CLOCKS[0]!);
  const options = new Set(zonesOf(data.properties).map((z) => z.key));

  for (const property of data.properties) {
    const zone = zoneOf(property);
    check(
      `${name} ${property.id}: zone has a label`,
      zone.label.trim().length > 0,
      `postcode ${property.postcode}`,
    );
    /* Otherwise the row exists under a filter setting the select does not
       offer, which reads as "this property is gone". */
    check(`${name} ${property.id}: its zone is offered by the filter`, options.has(zone.key));

    const region = SERVED_REGIONS.find((r) => r.postcode === property.postcode);
    if (region) {
      check(
        `${name} ${property.id}: served postcode uses the municipality name`,
        zone.label === region.name,
        `${zone.label} vs ${region.name}`,
      );
    }
  }
}

/* ---------------------------------------------------------------- delete */

for (const name of SCENARIOS) {
  const data = buildScenario(name, CLOCKS[0]!);

  for (const property of data.properties) {
    const usage = propertyUsage(data, property.id);

    /* Counted independently of `propertyUsage`, over the same six types it
       claims to cover. A field added to the schema and forgotten in the guard
       is a delete that leaves a dangling id. */
    const referenced =
      data.requests.some((r) => r.propertyId === property.id) ||
      data.bookings.some((b) => b.propertyId === property.id) ||
      data.subscriptions.some((s) => s.propertyId === property.id) ||
      data.keyLog.some((k) => k.propertyId === property.id) ||
      data.events.some((e) => e.propertyId === property.id) ||
      data.photos.some((p) => p.propertyId === property.id);

    check(
      `${name} ${property.id}: the delete guard agrees with the data`,
      usage.total > 0 === referenced,
      `usage ${usage.total}, referenced ${referenced}`,
    );
  }
}

/* ----------------------------------------------------------- dictionary */

/* A kind in the union with no label is a `<option>` that throws where it used
   to print — and the filter offers one option per kind. */
for (const kind of PROPERTY_KINDS) {
  check(`de labels the ${kind} kind`, Boolean(de.admin.properties.kinds[kind]));
  check(`en labels the ${kind} kind`, Boolean(en.admin.properties.kinds[kind]));
}

/* The keys the two new controls and the new screen read. Parity between the
   dictionaries is `crm-test`'s job; this is about them existing at all. */
const REQUIRED = [
  'properties.colLastService',
  'properties.colNextVisit',
  'properties.filterKind',
  'properties.filterZone',
  'properties.rowDelete',
  'properties.rowDeleteBlocked',
  'propertyEdit.title',
  'propertyEdit.outsideBody',
  'property.editAction',
];

for (const path of REQUIRED) {
  for (const [locale, dict] of [
    ['de', de],
    ['en', en],
  ] as const) {
    const value = path
      .split('.')
      .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], dict.admin);
    check(`${locale} carries admin.${path}`, typeof value === 'string' && value.length > 0);
  }
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.log(`\n${failures.slice(0, 30).join('\n')}`);
  process.exit(1);
}
