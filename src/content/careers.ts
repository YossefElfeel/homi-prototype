import type { Locale } from '@/i18n/routing';
import { stressString } from '@/i18n/stress';

/**
 * Careers editorial content — lists, which next-intl messages cannot hold.
 *
 * The selection steps do double duty. They tell an applicant what to expect,
 * and they answer the question the specification names as the market's biggest
 * objection: "من اللي هيدخل بيتي؟" — who is coming into my home. That is why
 * the copy is written to be read by a customer as easily as by an applicant,
 * and why the About page links here rather than restating it.
 */
export interface CareersContent {
  how: { title: string; body: string }[];
  next: string[];
}

const DE: CareersContent = {
  how: [
    {
      title: 'Arbeitsbewilligung zuerst',
      body: 'Ohne gültige Bewilligung geht es nicht weiter. Das prüfen wir vor allem anderen.',
    },
    {
      title: 'Referenzen, die wir anrufen',
      body: 'Wir fragen zwei frühere Auftraggeber. Nicht als Formalität — wir rufen wirklich an.',
    },
    {
      title: 'Ein Einsatz zur Probe',
      body: 'Der erste Einsatz läuft in Begleitung. Danach entscheiden beide Seiten.',
    },
    {
      title: 'Festes Team, keine Vermittlung',
      body: 'Bei Ihnen arbeitet dieselbe Person. Wir vermitteln niemanden weiter.',
    },
  ],
  next: [
    'Wir sichten Ihre Unterlagen innerhalb von fünf Arbeitstagen.',
    'Passt es, rufen wir an — nicht per E-Mail, sondern persönlich.',
    'Danach folgt ein Einsatz zur Probe, in Begleitung.',
  ],
};

const EN: CareersContent = {
  how: [
    {
      title: 'The work permit first',
      body: 'Without a valid permit we cannot go further. We check it before anything else.',
    },
    {
      title: 'References we actually call',
      body: 'We ask two previous employers. Not as a formality — we pick up the phone.',
    },
    {
      title: 'One job on trial',
      body: 'The first job runs accompanied. After that both sides decide.',
    },
    {
      title: 'A fixed team, no agency',
      body: 'The same person comes to you. We never pass work on to somebody else.',
    },
  ],
  next: [
    'We review your documents within five working days.',
    'If it fits, we call — not by email, in person.',
    'Then comes one job on trial, accompanied.',
  ],
};

// §20.6 — French and Italian fall back to German, same as everywhere else.
const BY_LOCALE: Record<Locale, CareersContent> = { de: DE, en: EN, fr: DE, it: DE };

export function getCareersContent(locale: Locale, stressed = false): CareersContent {
  const content = BY_LOCALE[locale];
  if (!stressed) return content;

  return {
    how: content.how.map((step) => ({
      title: stressString(step.title),
      body: stressString(step.body),
    })),
    next: content.next.map(stressString),
  };
}
