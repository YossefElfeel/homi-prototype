/**
 * The three visual directions ship as data, not as forks in the code.
 * A theme re-binds the semantic tokens in globals.css plus seven axes:
 * radius · elevation · surface · rhythm · accent-line · motion · voice.
 *
 * Only the components under components/signature/ are allowed to branch on
 * the theme. Everything else must work in all three from tokens alone.
 */
export const THEMES = ['raster', 'zuhause', 'goldkueste', 'kante'] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'raster';

export const THEME_META: Record<Theme, { name: string; note: string }> = {
  raster: {
    name: 'Raster',
    note: 'Swiss editorial — strict grid, hairlines, generous white, red as a rule',
  },
  zuhause: {
    name: 'Zuhause',
    note: 'Warm trust — ivory paper, soft elevation, rounded, green accent',
  },
  goldkueste: {
    name: 'Goldküste',
    note: 'Concierge — deep navy sections, serif display, slow motion',
  },
  kante: {
    name: 'Kante',
    note: 'Bold contemporary — condensed caps, red as a surface, scroll reveals',
  },
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/** Cookies, so the server renders the right theme with no flash. */
export const THEME_COOKIE = 'hv-theme';
export const STRESS_COOKIE = 'hv-stress';
/**
 * §21 item 12 — in production this is a server-held setting, so the prototype
 * models it as one too rather than as client state. That keeps the About page
 * and the promise block server-rendered, which is where they belong for SEO.
 */
export const INSURANCE_COOKIE = 'hv-insurance';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
