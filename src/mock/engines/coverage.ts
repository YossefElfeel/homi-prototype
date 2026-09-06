/**
 * Service area — spec §6.
 *
 * The eight postcodes below map one-to-one onto the eight municipalities named
 * in the team brief. Worth stating plainly because it drives SEO: **the city of
 * Zurich is not in this list**, so the region pages target these eight and
 * never "Reinigung Zürich".
 *
 * Coordinates are municipality centroids, used only to estimate travel time
 * between two jobs (§5.3). They are not addresses.
 *
 * The list used to be the whole truth. It is now the *seed*: the store keeps a
 * live `regions` array, the settings screen adds to it and removes from it,
 * and every function here takes the list it should read. The reason is that
 * "we now also clean in Zollikon" was, until this wave, a code change — the
 * settings screen offered eight switches over a frozen array and no ninth row
 * could ever exist. A business that grows by one municipality a year cannot
 * have that be a deploy.
 */

export interface ServedRegion {
  postcode: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
}

/**
 * The eight the business launched with.
 *
 * Still the default and still what the statically rendered marketing pages
 * read — /gebiete and its eight children are built at deploy time, so an area
 * added in the panel is served, quotable and bookable at once and gets its
 * own page at the next build. Same boundary as §17.2b, named on
 * /open-questions rather than hidden here.
 */
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
 * The area check is a gate, not a label.
 *
 * It used to mark and wave through: an out-of-area postcode still produced a
 * request, the queue flagged it, and the office declined it by hand. That put
 * the "no" three screens and a working day after the point where it was
 * already known, and the visitor spent the wait believing an answer was
 * coming. `outside` now stops the flow where the postcode is typed, so nobody
 * is told no about a request that was never taken.
 *
 * `invalid` is deliberately not a refusal — a half-typed postcode is not an
 * address outside the area, and treating it as one would reject people
 * mid-keystroke.
 */
export function checkCoverage(
  postcode: string,
  served: string[],
  /* The live list, for anything reading the store. Defaulted to the seed so
     the statically rendered pages — which have no store — keep working
     unchanged rather than each growing a copy of this argument. */
  regions: ServedRegion[] = SERVED_REGIONS,
): CoverageResult {
  const trimmed = postcode.trim();
  if (!/^\d{4}$/.test(trimmed)) return { state: 'invalid' };

  const region = regions.find((r) => r.postcode === trimmed);
  if (region && served.includes(trimmed)) return { state: 'inside', region };

  return { state: 'outside', postcode: trimmed };
}

export function regionByPostcode(postcode: string, regions: ServedRegion[] = SERVED_REGIONS) {
  return regions.find((r) => r.postcode === postcode);
}

export function regionBySlug(slug: string, regions: ServedRegion[] = SERVED_REGIONS) {
  return regions.find((r) => r.slug === slug);
}

/**
 * Why an area cannot be added under these details, or `null` if it can.
 *
 * The three that matter are all uniqueness, and all three are silent failures
 * rather than crashes — which is what makes them worth a gate. A duplicate
 * postcode makes `checkCoverage` answer with whichever row it hits first, so
 * the same address is inside or outside the area depending on list order. A
 * duplicate slug makes two municipalities share `/gebiete/<slug>`, and only
 * one of them is reachable. An empty name puts a blank tile on the area index.
 *
 * Returns a message *key*, not a sentence: this runs in the store's language
 * and is printed in the reader's.
 */
export type RegionProblem =
  | 'postcodeFormat'
  | 'postcodeTaken'
  | 'nameRequired'
  | 'slugTaken'
  | 'coordinates';

export function validateRegion(
  candidate: ServedRegion,
  regions: ServedRegion[],
  /** The row being edited, which is allowed to keep its own postcode and slug. */
  ignorePostcode?: string,
): RegionProblem | null {
  const others = regions.filter((r) => r.postcode !== ignorePostcode);

  if (!/^\d{4}$/.test(candidate.postcode)) return 'postcodeFormat';
  if (others.some((r) => r.postcode === candidate.postcode)) return 'postcodeTaken';
  if (!candidate.name.trim()) return 'nameRequired';
  if (!candidate.slug || others.some((r) => r.slug === candidate.slug)) return 'slugTaken';
  /*
   * Coordinates are required rather than optional, and this is the one
   * validation that is about a number nobody sees. `travelMinutes` reads the
   * distance between two jobs to reserve the gap between them, so an area at
   * (0, 0) is 5000 km off the Gulf of Guinea: every job in it leaves the
   * free-travel radius, goes to manual review, and the scheduler quietly
   * stops offering slots. A missing pair of numbers would look like nothing
   * at all on this screen and like a broken calendar on the next one.
   */
  if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lng)) return 'coordinates';
  if (candidate.lat < 45.8 || candidate.lat > 47.9 || candidate.lng < 5.9 || candidate.lng > 10.6) {
    return 'coordinates';
  }

  return null;
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
