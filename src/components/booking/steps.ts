import type { AddOn } from '@/mock/schema';
import { hasAddOns } from '@/lib/service-flow';

/**
 * Every step the wizard can show, in order. Not the list any one visitor
 * walks — that is `stepsForService`.
 */
export const BOOKING_STEPS = [
  'leistung',
  'objekt',
  'extras',
  'zutritt',
  'termin',
  'fotos',
  'kontakt',
  'pruefen',
] as const;

export type BookingStepName = (typeof BOOKING_STEPS)[number];

/**
 * The steps this particular request actually has.
 *
 * All eight were shown to everyone, and «Zusätze» was the one that could not
 * survive the reading: add-ons are attached to services, and four of the nine
 * catalogue services have none — so window cleaning, office cleaning and
 * furniture assembly each sent the visitor to a full screen, with a heading
 * and a progress bar and a Continue button, whose entire content was the
 * sentence «for this service there are no extras». A step that can only ever
 * be empty is not an optional step; it is a wrong step count.
 *
 * Derived from the live catalogue, so an add-on newly attached to window
 * cleaning brings the step back without anyone editing this file.
 */
export function stepsForService(
  serviceSlug: string | null,
  addOns: AddOn[],
): BookingStepName[] {
  const extras = hasAddOns(addOns, serviceSlug);
  return BOOKING_STEPS.filter((step) => step !== 'extras' || extras);
}

export function stepIndex(step: BookingStepName, steps: readonly BookingStepName[]) {
  return steps.indexOf(step);
}

export function prevStep(
  step: BookingStepName,
  steps: readonly BookingStepName[],
): BookingStepName | null {
  const i = steps.indexOf(step);
  return i > 0 ? steps[i - 1]! : null;
}

export function nextStep(
  step: BookingStepName,
  steps: readonly BookingStepName[],
): BookingStepName | null {
  const i = steps.indexOf(step);
  return i >= 0 && i < steps.length - 1 ? steps[i + 1]! : null;
}

/**
 * Where to send somebody who opened a step this request does not have.
 *
 * A skipped step is still an addressable URL — from a bookmark, from the back
 * button after changing service, from a link in a 24-hour reminder mail. The
 * first step at or after it that this request *does* have is where the flow
 * would have put them anyway, so go there instead of rendering a screen with a
 * progress rail that cannot locate itself. Falls back to the first step, which
 * is only reachable if the whole list were empty.
 */
export function resumeStep(
  step: BookingStepName,
  steps: readonly BookingStepName[],
): BookingStepName {
  const from = BOOKING_STEPS.indexOf(step);
  const onward = BOOKING_STEPS.slice(Math.max(from, 0)).find((s) => steps.includes(s));
  return onward ?? steps[0] ?? 'leistung';
}
