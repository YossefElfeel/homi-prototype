import { cookies } from 'next/headers';
import {
  DEFAULT_THEME,
  INSURANCE_COOKIE,
  STRESS_COOKIE,
  THEME_COOKIE,
  isTheme,
  type Theme,
} from './theme';

/**
 * Server-side theme read, for the six signature components that genuinely
 * change layout between directions (Goldküste's hero is a full-bleed navy
 * section; Raster's is a split grid — no token can express that).
 *
 * Everything else must work from tokens alone. If a component reaches for this
 * helper, that is the signal to ask whether it belongs in components/signature/.
 */
export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : DEFAULT_THEME;
}

/**
 * §21 item 12. Defaults to false — the company has no policy today, so the
 * honest default is the state where the site makes no insurance claim and
 * permanent key holding stays locked.
 */
export async function getHasInsurance(): Promise<boolean> {
  const store = await cookies();
  return store.get(INSURANCE_COOKIE)?.value === 'on';
}

/**
 * Editorial content in src/content/ sits outside the message pipeline, so it
 * has to ask for the stress flag itself — otherwise those blocks would be the
 * one place on the site never tested at full German length.
 */
export async function getStressMode(): Promise<boolean> {
  const store = await cookies();
  return store.get(STRESS_COOKIE)?.value === 'on';
}
