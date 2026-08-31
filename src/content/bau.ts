import type { Locale } from '@/i18n/routing';

/**
 * The construction portfolio.
 *
 * Deliberately *not* in the message dictionary and deliberately not in the
 * mock store either — and the second one is the distinction that matters.
 *
 * `/referenzen` is customer work: before-and-after pairs joined to a booking,
 * shown only where §20.6 consent was recorded, and empty by default. These are
 * the company's *own* photographs of its own jobs, so no consent gate applies
 * and no store row governs them. Modelling them as store `Photo`s would have
 * put twenty-two records into a gallery whose whole subject is that a customer
 * can switch a photo off — and switching one of these off is not a thing
 * anybody can do.
 *
 * TODO:asset — supplied as phone photographs. Resolutions vary from 720×540 to
 * 1600×1600 and a few are soft at full width; the grid is sized so none of them
 * is asked to fill more than it can carry.
 */
export interface WorkPhoto {
  /** File under /public/bau, without the extension. */
  slug: string;
  group: WorkGroup;
  width: number;
  height: number;
  alt: { de: string; en: string };
}

export const WORK_GROUPS = ['trockenbau', 'spanndecken', 'gewerbe', 'umgebung'] as const;
export type WorkGroup = (typeof WORK_GROUPS)[number];

const t = (de: string, en: string) => ({ de, en });

export const WORK_PHOTOS: WorkPhoto[] = [
  // Trockenbau — abgehängte Decken, Lichtvouten, Wandbilder in Gipskarton.
  { slug: 'decke-led-oval', group: 'trockenbau', width: 1600, height: 1200,
    alt: t('Abgehängte Decke mit geschwungener Lichtvoute und farbiger LED-Beleuchtung',
           'Suspended ceiling with a curved light cove and coloured LED lighting') },
  { slug: 'decke-wohnraum', group: 'trockenbau', width: 720, height: 960,
    alt: t('Wohnraumdecke mit umlaufender Voute und eingelassenen Spots',
           'Living-room ceiling with a perimeter cove and recessed spots') },
  { slug: 'decke-kreise', group: 'trockenbau', width: 1200, height: 1600,
    alt: t('Deckenrelief aus konzentrischen Kreisen, verputzt und gestrichen',
           'Ceiling relief of concentric circles, plastered and painted') },
  { slug: 'wand-cheminee', group: 'trockenbau', width: 1440, height: 1080,
    alt: t('Wandverkleidung mit beleuchteten Nischen um Cheminée und Fernseher',
           'Wall unit with lit niches around a fireplace and television') },
  { slug: 'wand-led-welle', group: 'trockenbau', width: 960, height: 960,
    alt: t('Geschwungenes Wandelement mit indirekter LED-Beleuchtung, im Bau',
           'Curved wall element with indirect LED lighting, under construction') },
  { slug: 'wand-ziegel-nischen', group: 'trockenbau', width: 720, height: 540,
    alt: t('Wandgestaltung mit Sichtziegel-Einsatz und runden Nischen',
           'Wall design with an exposed-brick inset and round niches') },
  { slug: 'decke-raute-rohbau', group: 'trockenbau', width: 1600, height: 900,
    alt: t('Deckenkonstruktion im Rohbau: ovale Blende mit Rautenausschnitt',
           'Ceiling construction in the shell: an oval fascia with a diamond cut-out') },
  { slug: 'wand-nischen', group: 'trockenbau', width: 1600, height: 900,
    alt: t('Fertige Wand mit symmetrischen Nischen vor dem Anstrich',
           'Finished wall with symmetrical niches before painting') },

  // Spanndecken — bedruckte Folie, hinterleuchtet.
  { slug: 'spanndecke-galaxie', group: 'spanndecken', width: 1600, height: 900,
    alt: t('Hinterleuchtete Spanndecke mit Galaxie-Motiv über einem Wohnraum',
           'Backlit stretch ceiling with a galaxy print over a living room') },
  { slug: 'spanndecke-mond', group: 'spanndecken', width: 1291, height: 1600,
    alt: t('Schlafzimmer mit hinterleuchtetem Mondmotiv über dem Bett',
           'Bedroom with a backlit moon motif above the bed') },
  { slug: 'spanndecke-himmel', group: 'spanndecken', width: 720, height: 1280,
    alt: t('Spanndecke mit Himmel- und Blütenmotiv in einem fensterlosen Raum',
           'Stretch ceiling with a sky and blossom print in a windowless room') },
  { slug: 'spanndecke-blaetter', group: 'spanndecken', width: 960, height: 540,
    alt: t('Spanndecke mit Blätterdach-Motiv, von unten hinterleuchtet',
           'Stretch ceiling with a leaf-canopy print, backlit from below') },
  { slug: 'spanndecke-unterwasser', group: 'spanndecken', width: 1200, height: 1600,
    alt: t('Korridor mit Unterwassermotiv auf der gesamten Deckenlänge',
           'Corridor with an underwater print running the full length of the ceiling') },
  { slug: 'spanndecke-orchidee', group: 'spanndecken', width: 1200, height: 1600,
    alt: t('Wohnraum mit Orchideenmotiv an der Decke und passendem Wandelement',
           'Living room with an orchid ceiling print and a matching wall element') },

  // Gewerbe — Akustik, Raster, grosse Spannweiten.
  { slug: 'gewerbe-ringleuchten', group: 'gewerbe', width: 768, height: 1024,
    alt: t('Saaldecke mit runden Akustikpaneelen und Ringleuchten',
           'Hall ceiling with round acoustic panels and ring luminaires') },
  { slug: 'akustik-segel', group: 'gewerbe', width: 960, height: 720,
    alt: t('Farbige Akustiksegel unter einer offenen Installationsdecke',
           'Coloured acoustic baffles under an exposed services ceiling') },
  { slug: 'rasterdecke-montage', group: 'gewerbe', width: 794, height: 1600,
    alt: t('Montage einer Rasterdecke von der Hebebühne aus',
           'Grid ceiling being installed from a scissor lift') },

  // Rohbau und Umgebung — Ständerwerk, Fassade, Aussenanlagen.
  { slug: 'staenderwerk', group: 'umgebung', width: 1200, height: 1600,
    alt: t('Metallständerwerk für Trennwände, gestellt und ausgerichtet',
           'Metal stud framing for partition walls, erected and aligned') },
  { slug: 'fassade-geruest', group: 'umgebung', width: 900, height: 1600,
    alt: t('Fahrgerüst an einer Giebelfassade für Arbeiten an der Holzschalung',
           'Mobile scaffold at a gable facade for work on the timber cladding') },
  { slug: 'umgebung-aushub', group: 'umgebung', width: 1600, height: 1600,
    alt: t('Aushub und gesetzte Randabschlüsse vor dem Aufbau des Sitzplatzes',
           'Excavation and set edging before the terrace was built up') },
  { slug: 'umgebung-fertig', group: 'umgebung', width: 1600, height: 900,
    alt: t('Derselbe Garten fertig: Plattenweg, Kiesflächen, Bepflanzung und Grillkamin',
           'The same garden finished: paved path, gravel beds, planting and a garden fireplace') },
  { slug: 'umgebung-sitzplatz', group: 'umgebung', width: 1600, height: 900,
    alt: t('Fertiger Sitzplatz mit Plattenbelag, Kiesbett und Grillkamin',
           'Finished terrace with paving, gravel bed and garden fireplace') },
];

export function photosIn(group: WorkGroup) {
  return WORK_PHOTOS.filter((p) => p.group === group);
}

export function altFor(photo: WorkPhoto, locale: Locale) {
  /* German is the fallback for every locale that is not written, §20.6 — and
     alt text is the one string where an empty fallback is worse than a wrong
     language: a screen reader gets nothing at all. */
  return locale === 'en' ? photo.alt.en : photo.alt.de;
}
