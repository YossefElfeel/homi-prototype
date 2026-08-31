import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { routing, type Locale } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { hiringPostings } from '@/mock/scenarios';
import { JobPostingDetail } from '@/components/careers/job-posting-detail';
import { Masthead } from '@/components/landing/Masthead';
import { PageSection } from '@/components/landing/PageSection';
import { Section, SectionHeading } from '@/components/signature/section-heading';

/**
 * `createdAt` is the only field `hiringPostings` derives from the date it is
 * given, and nothing on the server reads it — the published date is rendered
 * client-side from the live store, where it belongs. So the epoch is not a
 * stand-in for "now": it is the argument this call has no use for.
 */
const PUBLISHED = hiringPostings(new Date(0));

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    PUBLISHED.map((posting) => ({ locale, slug: posting.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const posting = PUBLISHED.find((p) => p.slug === slug);
  if (!posting) return {};
  return {
    title: posting.title[locale as Locale],
    description: posting.summary[locale as Locale],
  };
}

/**
 * Screen C2 — one role.
 *
 * **It used to be `'use client'` in its entirety**, and that cost it two
 * things a job advert cannot do without. A client page cannot export
 * `generateMetadata`, so every posting shipped under the site's generic title
 * — a pasted link to a vacancy said "Homivaro — Clean. Reliable. Swiss
 * quality." and nothing about the job. And nothing was server-rendered, so the
 * document was one ellipsis: a crawler, a link preview and a visitor on a slow
 * connection all got an empty page on the one route whose entire purpose is to
 * be found and forwarded.
 *
 * The split follows what actually changes. Title and summary come from the
 * published set at build time, which is what the metadata and the masthead
 * need. Everything the office edits — the lists, the workload, the published
 * date — stays in `JobPostingDetail` against the live store, so an edit on
 * /admin/stellen still shows here without a rebuild.
 */
export default async function JobPostingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const theme = await getTheme();
  const t = await getTranslations('careers.posting');
  const d = await getTranslations('site.display.careers');

  /*
   * Deliberately not `notFound()` on a slug this set does not know.
   *
   * `PUBLISHED` is the build-time catalogue, and the office can add a role on
   * /admin/stellen after the build — that posting lives only in the store. A
   * 404 here would make every role the owner creates unreachable on the site
   * that advertises it. So an unknown slug still renders, under the careers
   * heading rather than a role name, and `JobPostingDetail` decides against
   * the live store: the real posting if it is there, the empty state if it is
   * not. What is lost is only the tailored heading and metadata, which is the
   * honest trade — we genuinely do not know the title until the client does.
   */
  const posting = PUBLISHED.find((p) => p.slug === slug);
  const title = posting?.title[locale as Locale];
  const lead = posting?.summary[locale as Locale];

  if (theme === 'homivaro') {
    return (
      <>
        {/* One line, and it is the role — not a display headline split into a
            navy half and a red one. Which words carry the feeling is a writing
            decision the copy makes, and nobody writes it per vacancy. */}
        <Masthead lines={title ? [{ accent: title }] : d.raw('openLines')} lead={lead} />
        <PageSection>
          <JobPostingDetail slug={slug} />
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
          title={title ?? t('back')}
          lead={lead}
          align="start"
          level={1}
        />
      </Section>
      <Section>
        <JobPostingDetail slug={slug} />
      </Section>
    </>
  );
}
