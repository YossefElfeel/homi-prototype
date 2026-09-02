import type { AddOn, Service } from '@/mock/schema';
import type { PropertyKind } from '@/mock/schema';
import { addOnsForService } from './addon-catalogue';

/**
 * What a service actually needs to be asked about — the companion to
 * `service-catalogue` (what a service *is*) and `addon-catalogue` (what hangs
 * off one).
 *
 * The request flow was one questionnaire for every service, and it showed. A
 * window clean was refused at «Weiter» until the visitor typed a floor area,
 * a room count and a bathroom count — three numbers the pricing engine
 * provably never reads for that service, because `durationProfile: 'none'`
 * skips the entire area branch of `estimateHours`. Office cleaning asked which
 * kind of property it was, having already been told; then asked whether there
 * were pets in the household, and quietly added half an hour to the price of
 * whichever answer came back. Three of the seven bookable services sent every
 * visitor through an add-ons step that could only ever say «nothing here».
 *
 * None of that is catchable by types. A required field that changes no output
 * is a correct render of a wrong idea, and the only defence is to state the
 * rule once and have every screen — the wizard, the phone-intake form, the
 * summary rail, the review page and the pricing gate — read it from here.
 *
 * Derived from the record, never from a slug list. The catalogue is editable
 * (§17.2), so an owner who adds «Fassadenreinigung» back gets a coherent flow
 * out of the fields they filled in rather than the generic one that happens to
 * be hard-coded.
 */
export interface ServiceNeeds {
  /**
   * The property kind the service already implies, or null when it is a real
   * question. Office cleaning is only ever booked for an office; asking again
   * both wastes a tap and lets the answer contradict the service.
   */
  fixedPropertyKind: PropertyKind | null;
  /** Floor area — the first input of the §5.2 duration matrix. */
  asksArea: boolean;
  /** Rooms. Scope for the crew; priced by nothing (see `estimateHours`). */
  asksRooms: boolean;
  /** §5.2 — half an hour for every one past the first. */
  asksBathrooms: boolean;
  /** §5.2 — half an hour. Households have pets; offices do not. */
  asksPets: boolean;
  /** §5.2 — one hour. Only ever added on an area-driven service. */
  asksCondition: boolean;
  /** §5.1 — windows are counted, not measured. */
  asksWindowCount: boolean;
  /** §5.1 — assembly is priced per piece. */
  asksFurniturePieces: boolean;
  /**
   * Which words the size questions are asked in. A workplace has «Räume» and
   * «Toiletten», not «Zimmer» and «Bäder» — the same fields, and the wrong
   * nouns make the form read as one written for somebody else.
   */
  vocabulary: 'home' | 'office';
}

/**
 * The rules, read off the service record.
 *
 * `durationProfile === 'none'` is the load-bearing one: it is exactly the flag
 * `estimateHours` uses to skip area, bathrooms, pets and condition, so it is
 * exactly the flag that decides whether asking about them is honest.
 */
export function serviceNeeds(service: Service | undefined): ServiceNeeds {
  if (!service) {
    return {
      fixedPropertyKind: null,
      asksArea: false,
      asksRooms: false,
      asksBathrooms: false,
      asksPets: false,
      asksCondition: false,
      asksWindowCount: false,
      asksFurniturePieces: false,
      vocabulary: 'home',
    };
  }

  const areaDriven = service.durationProfile !== 'none';
  const office = service.durationProfile === 'office';

  return {
    fixedPropertyKind: office ? 'office' : null,
    asksArea: areaDriven,
    asksRooms: areaDriven,
    asksBathrooms: areaDriven,
    asksPets: areaDriven && !office,
    asksCondition: areaDriven,
    asksWindowCount: service.calc === 'perUnit',
    /* Still the slug, because the 0.75h-per-piece rule in `estimateHours` is
       still the slug's. The day a second assembly service exists this becomes
       a field on the record; until then, inventing one here would put a
       column in the schema that nothing writes. */
    asksFurniturePieces: service.slug === 'moebelmontage',
    vocabulary: office ? 'office' : 'home',
  };
}

/**
 * Whether the add-ons step has anything to show.
 *
 * Asked of the live catalogue rather than answered from a list, because the
 * owner can attach an add-on to any service from /admin/leistungen — the day
 * they attach one to window cleaning, the step has to come back on its own.
 */
export function hasAddOns(addOns: AddOn[], serviceSlug: string | null) {
  return Boolean(serviceSlug) && addOnsForService(addOns, serviceSlug!).length > 0;
}

/** The quantities a service needs before a price can be computed at all. */
export interface EstimateInputs {
  area: number | null | undefined;
  windowCount: number | null | undefined;
  furniturePieces: number | null | undefined;
}

/**
 * Whether there is enough to price honestly.
 *
 * The gate used to be written as «area-driven services need an area, everything
 * else needs a count» — which quietly assumed every profile-less service was
 * one of the two that carry a count. `Fassadenreinigung` is neither: hourly,
 * profile `none`, no count, and priced perfectly well off `minDuration` — but
 * the second half of that ternary returned false for it for ever, so the owner
 * could switch it on and no screen would ever show a price. Asking the needs
 * instead means a service is ready when the things it *asked for* are answered.
 */
export function hasEnoughToPrice(service: Service | undefined, inputs: EstimateInputs) {
  if (!service) return false;
  const needs = serviceNeeds(service);
  if (needs.asksArea && !inputs.area) return false;
  if (needs.asksWindowCount && !inputs.windowCount) return false;
  if (needs.asksFurniturePieces && !inputs.furniturePieces) return false;
  return true;
}

/** The §5.2 facts a property carries, from a `Property` or from a form. */
export interface SizeFacts {
  area?: number | null;
  bathrooms?: number | null;
  hasPets?: boolean | null;
  needsExtraEffort?: boolean | null;
}

/**
 * The duration inputs this service actually consumes, with the rest neutralised.
 *
 * Three screens price the same job — the live range in the wizard, the hours
 * on the request the office opens, and the lines the quote builder starts from
 * — and each read the property's fields straight through. So a saved office
 * with `hasPets` recorded against it got §5.2's half hour added to its quote,
 * on a screen where the question is not asked and by a rule about households.
 * The neutral values are the ones `estimateHours` treats as "nothing to add":
 * one bathroom adds no time, and both flags are additive.
 */
export function durationFacts(service: Service, facts: SizeFacts) {
  const needs = serviceNeeds(service);
  return {
    area: facts.area ?? 0,
    // §5.2 bills every bathroom past the first, so one is the neutral figure.
    bathrooms: facts.bathrooms ?? 1,
    hasPets: needs.asksPets ? Boolean(facts.hasPets) : false,
    needsExtraEffort: needs.asksCondition ? Boolean(facts.needsExtraEffort) : false,
  };
}
