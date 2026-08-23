/**
 * The visual directions ship as data, not as forks in the code.
 * A theme re-binds the semantic tokens in globals.css plus seven axes:
 * radius · elevation · surface · rhythm · accent-line · motion · voice.
 *
 * Only the components under components/signature/ are allowed to branch on
 * the theme. Everything else must work in all of them from tokens alone.
 *
 * `homivaro` is not another exploration — it is the approved Figma design, so
 * it leads the list and holds the default. The three after it are wave 1,
 * kept because a comparison you can still open is worth more than a
 * screenshot of one.
 *
 * Kante was a fourth, and it is gone. It was Bebas + Geist + red + scroll
 * reveals — which is what the approved design turned out to be — so it
 * stopped being a comparison and became a near-duplicate that every
 * signature component had to carry a branch for.
 */
export const THEMES = ['homivaro', 'raster', 'zuhause', 'goldkueste'] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'homivaro';

export const THEME_META: Record<Theme, { name: string; note: string }> = {
  homivaro: {
    name: 'Homivaro',
    note: 'The approved design — navy ground, white shell, Bebas caps, red as the only verb',
  },
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
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/**
 * Console density. Comfortable is what you show a client; compact is what an
 * owner running twenty jobs a day actually wants. It only changes the --app-*
 * variables under data-scope="app", so the marketing site never sees it.
 */
export const DENSITIES = ['comfortable', 'compact'] as const;
export type Density = (typeof DENSITIES)[number];

export const DEFAULT_DENSITY: Density = 'comfortable';

export function isDensity(value: unknown): value is Density {
  return typeof value === 'string' && (DENSITIES as readonly string[]).includes(value);
}

/**
 * Sidebar rail. Nineteen destinations is a lot of permanent furniture next to a
 * request the owner is trying to read; collapsed keeps the icons and gives the
 * content 12.5rem back.
 *
 * A cookie for the same reason density is one: the width is applied by the
 * server on the first paint, so the rail does not render wide and snap narrow
 * once the client catches up.
 */
export const SIDEBARS = ['expanded', 'collapsed'] as const;
export type SidebarState = (typeof SIDEBARS)[number];

export const DEFAULT_SIDEBAR: SidebarState = 'expanded';

export function isSidebar(value: unknown): value is SidebarState {
  return typeof value === 'string' && (SIDEBARS as readonly string[]).includes(value);
}

/** Cookies, so the server renders the right theme with no flash. */
export const THEME_COOKIE = 'hv-theme';
export const STRESS_COOKIE = 'hv-stress';
export const DENSITY_COOKIE = 'hv-density';
export const SIDEBAR_COOKIE = 'hv-sidebar';
/**
 * §21 item 12 — in production this is a server-held setting, so the prototype
 * models it as one too rather than as client state. That keeps the About page
 * and the promise block server-rendered, which is where they belong for SEO.
 */
export const INSURANCE_COOKIE = 'hv-insurance';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
