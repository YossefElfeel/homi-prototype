import type { Property } from '@/mock/schema';

/** The three fields that are absent until somebody has measured the place. */
export type PropertySize = Pick<Property, 'area' | 'rooms' | 'bathrooms'>;

/**
 * The glyph these screens already print for a fact that is not on file — the
 * request detail uses it for a missing preferred date. An unmeasured flat has
 * to read like every other blank on the page, not like a rendering bug.
 */
export const NOT_ON_FILE = '—';

/**
 * True once the place has an area.
 *
 * `area` is the one that decides it: a flat with square metres and no room
 * count can still be priced, and one with rooms and no square metres cannot.
 * See `Property.area` for why absent is a real state here.
 */
export function isMeasured(p: PropertySize): boolean {
  return p.area != null;
}

/** «142 m²», or the dash. */
export function areaLabel(area: number | undefined): string {
  return area == null ? NOT_ON_FILE : `${area} m²`;
}

/** A bare figure — rooms, bathrooms, floor — or the dash. */
export function figure(n: number | undefined): string {
  return n == null ? NOT_ON_FILE : String(n);
}
