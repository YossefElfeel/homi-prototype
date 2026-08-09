'use client';

import {
  COOKIE_MAX_AGE,
  INSURANCE_COOKIE,
  STRESS_COOKIE,
  THEME_COOKIE,
  type Theme,
} from './theme';

/**
 * Theme and stress mode live in cookies rather than in the client store.
 *
 * The server needs both at render time: the theme so `data-theme` is correct in
 * the very first HTML (no flash of the wrong direction), and stress mode so the
 * expanded German strings come out of the same `getRequestConfig` the real
 * messages do. Client-only state cannot do either.
 */
function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function applyTheme(theme: Theme) {
  writeCookie(THEME_COOKIE, theme);
  // Pure CSS variable swap — no re-render, no refresh.
  document.documentElement.dataset.theme = theme;
}

export function applyStress(on: boolean) {
  writeCookie(STRESS_COOKIE, on ? 'on' : 'off');
  document.documentElement.dataset.stress = on ? 'on' : 'off';
}

export function applyInsurance(on: boolean) {
  writeCookie(INSURANCE_COOKIE, on ? 'on' : 'off');
}
