/**
 * Every string the mock layer puts on screen must be English.
 *
 * The seed and the store write free text that no dictionary ever sees —
 * timeline labels, change-log summaries, review bodies, key-log notes. Those
 * bypass next-intl entirely, so a locale switch cannot fix them and the message
 * parity test cannot see them. This walks the built scenarios and fails on any
 * German left behind.
 *
 * Two exemptions, both deliberate. Swiss place names and surnames carry umlauts
 * and are not translatable, and cus_3 writes in French on purpose — a seed where
 * every thread is in one language cannot show that the messages screen copes.
 */
import { buildScenario, SCENARIOS } from '../src/mock/scenarios.ts';

let passed = 0;
const failures: string[] = [];

/* Words that only occur in German, chosen so an English sentence cannot trip
   them. "die" and "der" are left out on purpose — they are also English words
   in other senses and would fire on honest copy. */
const GERMAN =
  /\b(Abo|Einsatz|Einsätze|Gebucht|Rechnung|Offerte|Anfrage|Reinigung|Termin|Kunde|Kundin|Kundschaft|Objekt|Entwurf|Besichtigung|Rückruf|Schlüssel|angelegt|bearbeitet|erstellt|versendet|storniert|gelöscht|geändert|nicht|und|Ihre|Guten|wir|wurde|ist|sind)\b/;

/* The French thread is staged, not a miss. */
const FRENCH_CUSTOMER = 'cus_3';

function check(label: string, value: string, where: string) {
  if (!value) return;
  passed++;
  if (GERMAN.test(value)) failures.push(`${where} — ${label}: ${value.slice(0, 120)}`);
}

for (const name of SCENARIOS) {
  const d = buildScenario(name, new Date('2026-08-25T09:00:00.000Z'));
  const tag = `[${name}]`;

  for (const b of d.bookings) {
    for (const e of b.history) check('booking timeline', e.label, `${tag} ${b.reference}`);
  }
  for (const s of d.subscriptions) {
    for (const e of s.history) check('plan timeline', e.label, `${tag} ${s.reference}`);
    check('plan note', s.internalNotes ?? '', `${tag} ${s.reference}`);
  }
  for (const r of d.requests) {
    check('request note', r.customerNote ?? '', `${tag} ${r.reference}`);
    check('request internal note', r.internalNote ?? '', `${tag} ${r.reference}`);
  }
  for (const c of d.changeLog) check('change log', c.summary, `${tag} ${c.id}`);
  for (const p of d.properties) {
    check('property label', p.label ?? '', `${tag} ${p.id}`);
    check('property note', p.permanentNotes ?? '', `${tag} ${p.id}`);
  }
  for (const k of d.keyLog) {
    check('key location', k.storageLocation ?? '', `${tag} ${k.id}`);
    check('key return note', k.returnNote ?? '', `${tag} ${k.id}`);
  }
  for (const e of d.events) {
    check('calendar title', e.title, `${tag} ${e.reference}`);
    check('calendar note', e.note ?? '', `${tag} ${e.reference}`);
    check('calendar outcome', e.outcome ?? '', `${tag} ${e.reference}`);
    for (const h of e.history) check('calendar timeline', h.label, `${tag} ${e.reference}`);
  }
  for (const r of d.reviews) {
    check('review', r.text ?? '', `${tag} ${r.id}`);
    check('review reply', r.ownerReply ?? '', `${tag} ${r.id}`);
  }
  for (const i of d.invoices) {
    for (const line of i.lines) check('invoice line', line.label, `${tag} ${i.reference}`);
    check('invoice cancel reason', i.cancelReason ?? '', `${tag} ${i.reference}`);
  }
  for (const o of d.offers) check('quote message', o.message ?? '', `${tag} ${o.reference}`);
  for (const m of d.messages) {
    if (m.customerId === FRENCH_CUSTOMER) continue;
    check('message body', m.body, `${tag} ${m.subject}`);
  }
  for (const c of d.closures) check('closure reason', c.reason ?? '', `${tag} ${c.id}`);
  for (const a of d.applications) check('application note', a.internalNotes ?? '', `${tag} ${a.id}`);
}

for (const f of failures) console.log('FAIL  ' + f);
console.log(`\n${passed - failures.length} passed, ${failures.length} failed`);
process.exit(failures.length > 0 ? 1 : 0);
