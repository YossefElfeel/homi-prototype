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

export function stepIndex(step: BookingStepName) {
  return BOOKING_STEPS.indexOf(step);
}

export function prevStep(step: BookingStepName): BookingStepName | null {
  const i = stepIndex(step);
  return i > 0 ? BOOKING_STEPS[i - 1]! : null;
}

export function nextStep(step: BookingStepName): BookingStepName | null {
  const i = stepIndex(step);
  return i < BOOKING_STEPS.length - 1 ? BOOKING_STEPS[i + 1]! : null;
}

export const TOTAL_STEPS = BOOKING_STEPS.length;
