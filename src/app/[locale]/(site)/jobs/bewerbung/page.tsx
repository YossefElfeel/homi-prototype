import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { routing, type Locale } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { hiringPostings } from '@/mock/scenarios';
import { ApplicationForm } from '@/components/careers/application-form';
import { Masthead } from '@/components/landing/Masthead';
import { PageSection } from '@/components/landing/PageSection';
import { Section, SectionHeading } from '@/components/signature/section-heading';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** See the posting route: `createdAt` is the only thing the date reaches. */
const PUBLISHED = hiringPostings(new Date(0));

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ stelle?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { stelle } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'careers.form' });
  const posting = PUBLISHED.find((p) => p.slug === stelle);

  /* The role in the tab title, because this is the page an applicant leaves
     open in a second tab while they find their permit number and their notice
     period — and «Homivaro» three times over tells them nothing about which
     one they were filling in. */
  return {
    title: posting ? t('forPosting', { title: posting.title[locale as Locale] }) : t('spontaneousTitle'),
    robots: { index: false },
  };
}

/**
 * Screens C3 and C4 — one route, two steps.
 *
 * `?stelle=` carries the role across from the posting. Without it the form is
 * a speculative application, which is the same form minus one line of context.
 *
 * The page rendered as a bare `…` until the store rehydrated: no heading, no
 * title, nothing. The form still needs the client — it writes to the store and
 * it reads the posting the office can edit — but the frame around it does not,
 * so the heading and the metadata are server work now.
 */
export default async function ApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ stelle?: string }>;
}) {
  const { locale } = await params;
  const { stelle } = await searchParams;
  setRequestLocale(locale);

  const theme = await getTheme();
  const t = await getTranslations('careers.form');
  const d = await getTranslations('site.display.careers');
  const posting = PUBLISHED.find((p) => p.slug === stelle);
  const lead = posting
    ? t('forPosting', { title: posting.title[locale as Locale] })
    : t('spontaneousLead');

  if (theme === 'homivaro') {
    return (
      <>
        <Masthead lines={d.raw('applyLines')} lead={lead} />
        <PageSection>
          <ApplicationForm postingSlug={stelle} />
        </PageSection>
      </>
    );
  }

  return (
    <>
      <Section>
        <SectionHeading
          theme={theme}
          eyebrow={t('eyebrow')}
          title={t('title')}
          lead={lead}
          align="start"
          level={1}
        />
      </Section>
      <Section>
        <ApplicationForm postingSlug={stelle} />
      </Section>
    </>
  );
}
