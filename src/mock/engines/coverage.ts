/**
 * Service area — spec §6.
 *
 * The eight postcodes map one-to-one onto the eight municipalities named in
 * the team brief. Worth stating plainly because it drives SEO: **the city of
 * Zurich is not in this list**, so the region pages target these eight and
 * never "Reinigung Zürich".
 *
 * Coordinates are municipality centroids, used only to estimate travel time
 * between two jobs (§5.3). They are not addresses.
 */

export interface ServedRegion {
  postcode: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
}

export const SERVED_REGIONS: ServedRegion[] = [
  { postcode: '8700', name: 'Küsnacht', slug: 'kuesnacht', lat: 47.3175, lng: 8.5844 },
  { postcode: '8706', name: 'Meilen', slug: 'meilen', lat: 47.2703, lng: 8.6437 },
  { postcode: '8707', name: 'Uetikon am See', slug: 'uetikon-am-see', lat: 47.2617, lng: 8.6803 },
  { postcode: '8708', name: 'Männedorf', slug: 'maennedorf', lat: 47.2542, lng: 8.6906 },
  { postcode: '8712', name: 'Stäfa', slug: 'staefa', lat: 47.2417, lng: 8.7264 },
  { postcode: '8132', name: 'Egg', slug: 'egg', lat: 47.2967, lng: 8.69 },
  { postcode: '8627', name: 'Grüningen', slug: 'grueningen', lat: 47.2833, lng: 8.7667 },
  { postcode: '8634', name: 'Hombrechtikon', slug: 'hombrechtikon', lat: 47.2533, lng: 8.77 },
];

export type CoverageResult =
  | { state: 'invalid' }
  | { state: 'inside'; region: ServedRegion }
  | { state: 'outside'; postcode: string };

/**
 * §20.1: an out-of-area postcode does not block the request. It shows a clear
 * message and still lets the visitor submit for manual review — the admin
 * inbox flags it, and travel cost can be added to the quote.
 */
export function checkCoverage(postcode: string, served: string[]): CoverageResult {
  const trimmed = postcode.trim();
  if (!/^\d{4}$/.test(trimmed)) return { state: 'invalid' };

  const region = SERVED_REGIONS.find((r) => r.postcode === trimmed);
  if (region && served.includes(trimmed)) return { state: 'inside', region };

  return { state: 'outside', postcode: trimmed };
}

export function regionByPostcode(postcode: string) {
  return SERVED_REGIONS.find((r) => r.postcode === postcode);
}

export function regionBySlug(slug: string) {
  return SERVED_REGIONS.find((r) => r.slug === slug);
}

/** Great-circle distance in km. Good enough to bucket travel time. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  // Road distance runs longer than the crow flies; 1.35 is the usual factor.
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.35 * 10) / 10;
}

/** §5.3 — the buffer the scheduler reserves between two jobs. */
export function travelMinutes(km: number): number {
  if (km < 10) return 15;
  if (km <= 25) return 30;
  if (km <= 50) return 45;
  // Beyond 50 km the job leaves the free-travel radius and goes to manual
  // review (§5.1) — the scheduler still needs a number, so keep scaling.
  return 45 + Math.ceil((km - 50) / 10) * 10;
}
