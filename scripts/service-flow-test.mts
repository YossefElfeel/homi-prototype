/**
 * A question the flow asks has to be one the price can answer.
 *
 * The request flow was one questionnaire for every service. Window cleaning
 * refused «Weiter» until the visitor had typed a floor area, a room count and
 * a bathroom count — three numbers `estimateHours` provably never reads for
 * that service, because `durationProfile: 'none'` skips the whole area branch.
 * Office cleaning asked which kind of property it was, having been told by the
 * service, and then asked whether there were pets in the household.
 *
 * This file exists because none of that is catchable any other way:
 *
 *  · It typechecks. A required field that changes no output is well-typed.
 *  · `npm run build` proves the route renders, not that the form is right.
 *  · Reading the screen does not catch it either — a field asking for square
 *    metres looks exactly the same whether or not the answer is used.
 *
 * So the rule is asserted against the catalogue: for every service the seed
 * ships, every question the flow asks must move the estimate, and every
 * question it does not ask must not.
 */
import { SEED_SERVICES, SEED_ADDONS, SEED_SETTINGS } from '../src/mock/seed.ts';
import { serviceNeeds, hasEnoughToPrice, durationFacts } from '../src/lib/service-flow.ts';
import { stepsForService, BOOKING_STEPS } from '../src/components/booking/steps.ts';
import { addOnsForService } from '../src/lib/addon-catalogue.ts';
import { isOffered } from '../src/lib/service-catalogue.ts';
import { priceEstimate } from '../src/mock/engines/pricing.ts';
import { buildScenario } from '../src/mock/scenarios.ts';
import type { Service } from '../src/mock/schema.ts';

const DEMO = buildScenario('demo', new Date('2026-09-03T09:00:00.000Z'));

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

/** Everything a visitor can actually pick in the wizard. */
const BOOKABLE = SEED_SERVICES.filter((s) => isOffered(s) && !s.quotedIndividually);

/** A priced draft for one service, with every quantity answered. */
function estimate(service: Service, over: Record<string, unknown> = {}) {
  const facts = {
    area: 120,
    bathrooms: 2,
    hasPets: true,
    needsExtraEffort: true,
    ...over,
  };
  return priceEstimate(
    {
      service,
      addOns: [],
      ...durationFacts(service, facts),
      windowCount: 20,
      furniturePieces: 3,
    },
    SEED_SETTINGS,
  ).total;
}

console.log(`\n— every asked question moves the price, every unasked one does not —\n`);

for (const service of BOOKABLE) {
  const needs = serviceNeeds(service);
  const base = estimate(service);

  /*
   * The load-bearing assertion. `asksArea` is a claim that the area is an
   * input; if it is, doubling it has to change the total, and if it is not,
   * changing it must not. Same for the other three §5.2 facts.
   */
  const moves = (over: Record<string, unknown>) => estimate(service, over) !== base;

  check(
    `${service.slug} · area`,
    moves({ area: 400 }) === needs.asksArea,
    needs.asksArea ? 'asked and priced' : 'not asked and not priced',
  );
  check(
    `${service.slug} · bathrooms`,
    moves({ bathrooms: 6 }) === needs.asksBathrooms,
    needs.asksBathrooms ? 'asked and priced' : 'not asked and not priced',
  );
  check(
    `${service.slug} · pets`,
    moves({ hasPets: false }) === needs.asksPets,
    needs.asksPets ? 'asked and priced' : 'not asked and not priced',
  );
  check(
    `${service.slug} · condition`,
    moves({ needsExtraEffort: false }) === needs.asksCondition,
    needs.asksCondition ? 'asked and priced' : 'not asked and not priced',
  );
}

console.log(`\n— the two counted services, and only those —\n`);

check(
  'fensterreinigung asks for a window count',
  serviceNeeds(SEED_SERVICES.find((s) => s.slug === 'fensterreinigung')!).asksWindowCount,
);
check(
  'moebelmontage asks for a piece count',
  serviceNeeds(SEED_SERVICES.find((s) => s.slug === 'moebelmontage')!).asksFurniturePieces,
);
check(
  'no other bookable service asks for either',
  BOOKABLE.filter((s) => serviceNeeds(s).asksWindowCount || serviceNeeds(s).asksFurniturePieces)
    .length === 2,
);

console.log(`\n— only assembly can have two stops —\n`);

const assembly = SEED_SERVICES.find((s) => s.slug === 'moebelmontage')!;
check('moebelmontage offers a collection address', serviceNeeds(assembly).asksPickupAddress);
check(
  'no other bookable service does',
  BOOKABLE.filter((s) => serviceNeeds(s).asksPickupAddress).length === 1,
);
/* A second stop is a fact about the day, not about the money — §5.1 prices a
   detour by hand on the quote, and the engine has no distance input at all.
   Asserted so that "the pickup silently moved the estimate" cannot pass. */
check(
  'a collection address does not move the estimate',
  estimate(assembly) === estimate(assembly, { area: 400, bathrooms: 9 }),
  'assembly is priced from the piece count either way',
);
/* The state has to be reachable from the seed, or the office panel draws a
   collection block only a hand-typed request could ever fill. */
const withPickup = DEMO.requests.filter((r) => r.pickup);
check(
  'the seed carries a request with a collection address',
  withPickup.length > 0,
  withPickup.map((r) => r.reference).join(', '),
);
check(
  'that request is an assembly job',
  withPickup.every((r) => serviceNeeds(SEED_SERVICES.find((s) => s.slug === r.serviceSlug)).asksPickupAddress),
);

console.log(`\n— the office knows it is an office —\n`);

const office = SEED_SERVICES.find((s) => s.slug === 'bueroreinigung')!;
check('bueroreinigung fixes the property kind', serviceNeeds(office).fixedPropertyKind === 'office');
check('bueroreinigung does not ask about pets', serviceNeeds(office).asksPets === false);
check('bueroreinigung uses the workplace vocabulary', serviceNeeds(office).vocabulary === 'office');
/* The half hour §5.2 adds for a household pet was being charged on an office
   quote, for a question the form does not ask. */
check(
  'a saved office carrying hasPets is priced without it',
  estimate(office, { hasPets: true }) === estimate(office, { hasPets: false }),
);
check(
  'no other bookable service fixes the kind',
  BOOKABLE.filter((s) => serviceNeeds(s).fixedPropertyKind !== null).length === 1,
);

console.log(`\n— the step list is the catalogue's, not a constant —\n`);

for (const service of BOOKABLE) {
  const steps = stepsForService(service.slug, SEED_ADDONS);
  const hasExtras = addOnsForService(SEED_ADDONS, service.slug).length > 0;
  check(
    `${service.slug} · «extras» step`,
    steps.includes('extras') === hasExtras,
    hasExtras ? `${steps.length} steps, add-ons offered` : `${steps.length} steps, none to offer`,
  );
  /* Everything except «extras» is unconditional — a shorter list than that
     would mean a request nobody can complete. */
  check(
    `${service.slug} · keeps every other step`,
    BOOKING_STEPS.filter((s) => s !== 'extras').every((s) => steps.includes(s)),
  );
}

check(
  'at least one service is 8 steps and at least one is 7',
  BOOKABLE.some((s) => stepsForService(s.slug, SEED_ADDONS).length === 8) &&
    BOOKABLE.some((s) => stepsForService(s.slug, SEED_ADDONS).length === 7),
);

console.log(`\n— nothing bookable is unpriceable once its questions are answered —\n`);

for (const service of BOOKABLE) {
  const needs = serviceNeeds(service);
  check(
    `${service.slug} · prices from the answers it asked for`,
    hasEnoughToPrice(service, {
      area: needs.asksArea ? 120 : null,
      windowCount: needs.asksWindowCount ? 20 : null,
      furniturePieces: needs.asksFurniturePieces ? 3 : null,
    }),
  );
}

/*
 * The gate used to read «area-driven services need an area, everything else
 * needs a count», which silently assumed every profile-less service carried
 * one. Facade cleaning is hourly, profile `none`, and has no count — it prices
 * perfectly well off `minDuration`, and the old second branch returned false
 * for it for ever. It is `inactive` in the seed, so the owner switching it back
 * on is all it would have taken.
 */
const facade = SEED_SERVICES.find((s) => s.slug === 'fassadenreinigung')!;
check(
  'a service with neither an area nor a count can still be priced',
  hasEnoughToPrice(facade, { area: null, windowCount: null, furniturePieces: null }),
  `min ${facade.minDuration}h × CHF ${facade.basePrice}`,
);

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
