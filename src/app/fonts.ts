import {
  Archivo,
  Bebas_Neue,
  Bricolage_Grotesque,
  Figtree,
  Geist,
  Instrument_Sans,
  Instrument_Serif,
  JetBrains_Mono,
} from 'next/font/google';

/**
 * Three themes, three typographic voices — deliberately not one neutral UI
 * font across all of them. `next/font` self-hosts every file at build time,
 * so none of this costs a runtime request to Google.
 *
 * Only the default theme's faces are preloaded; the other two swap in when a
 * reviewer switches direction.
 */

// Raster — Swiss editorial. A grotesque with real character at tight tracking.
export const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
  preload: true,
});

// Zuhause — warm trust.
export const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  preload: false,
});

export const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
  preload: false,
});

// Goldküste — concierge.
export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
  preload: false,
});

export const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
  preload: false,
});

// Kante — the reference template's exact pairing. Bebas Neue is a caps-only
// condensed face: enormous at tight leading, unreadable in long paragraphs.
// That constraint shapes the whole direction, so it is deliberate, not a
// side effect: display lines stay short and Geist carries everything else.
export const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
  preload: false,
});

export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
  preload: false,
});

// Labels, eyebrows and every tabular figure in Raster and Goldküste.
export const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  preload: true,
});

export const fontVariables = [
  archivo.variable,
  bricolage.variable,
  figtree.variable,
  instrumentSerif.variable,
  instrumentSans.variable,
  bebas.variable,
  geist.variable,
  jetbrains.variable,
].join(' ');
