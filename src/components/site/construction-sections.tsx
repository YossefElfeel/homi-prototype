'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { Locale } from '@/i18n/routing';
import type { Theme } from '@/lib/theme';
import { Section } from '@/components/signature/section-heading';
import { PageSection, SectionHead } from '@/components/landing/PageSection';
import { WorkGrid } from '@/components/site/work-grid';
import { WORK_GROUPS } from '@/content/bau';
import { useHydrated, useStore } from '@/mock/store';

/**
 * The sections of /construction, from the record.
 *
 * The four groups were a `const` union and their headings were six message
 * keys apiece, so the page had four sections for ever — a firm taking on a
 * fifth trade could photograph it and had nowhere to put it, and the sentence
 * over «Spanndecken» belonged to whoever wrote the dictionary.
 *
 * Client-side because the sections are now data, and seed-first for the same
 * reason `WorkGrid` is: this is the whole body of the page, and rendering a
 * gap that fills in after hydration would be worse than a page that moves
 * once. Before hydration it draws the four seeded groups with their message
 * headings, which is exactly what the server used to send.
 */
export function ConstructionSections({ theme }: { theme: Theme }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('site.bau');
  const d = useTranslations('site.display.bau');
  const hydrated = useHydrated();
  const stored = useStore((s) => s.data.constructionSections);

  const pick = (field: Partial<Record<Locale, string>>) => field[locale] ?? field.de ?? '';

  const sections = hydrated
    ? stored
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((section) => ({
          id: section.id,
          title: pick(section.title),
          body: pick(section.body),
          lines: [
            { lead: pick(section.lead) },
            { accent: pick(section.accent) },
          ].filter((line) => (line.lead ?? line.accent ?? '') !== ''),
        }))
    : WORK_GROUPS.map((group) => ({
        id: group,
        title: t(`groups.${group}.title`),
        body: t(`groups.${group}.body`),
        lines: d.raw(`groupLines.${group}`) as { lead?: string; accent?: string }[],
      }));

  if (theme === 'homivaro') {
    return (
      <>
        {sections.map((section, i) => (
          <PageSection key={section.id} tone={i % 2 === 1 ? 'sunken' : undefined}>
            <SectionHead lines={section.lines} />
            <p className="mt-5 max-w-[var(--measure)] text-ink-secondary">{section.body}</p>
            <div className="mt-10">
              <WorkGrid group={section.id} />
            </div>
          </PageSection>
        ))}
      </>
    );
  }

  return (
    <>
      {sections.map((section) => (
        <Section key={section.id}>
          <h2 className="subhead-type text-2xl">{section.title}</h2>
          <p className="mt-4 max-w-[var(--measure)] text-ink-secondary">{section.body}</p>
          <div className="mt-8">
            <WorkGrid group={section.id} />
          </div>
        </Section>
      ))}
    </>
  );
}
