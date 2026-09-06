import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { buildScenario } from '@/mock/scenarios';
import { publishedPosts, readingMinutes, textFor } from '@/lib/blog';
import { EmptyState } from '@/components/ui/empty-state';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { CtaBand } from '@/components/signature/cta-band';
import { Masthead } from '@/components/landing/Masthead';
import { PageSection, SectionHead } from '@/components/landing/PageSection';
import { ArrowUpRight } from '@/components/landing/icons';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * The seeded articles, as the statically rendered site sees them.
 *
 * The same boundary every other marketing page draws (§17.2b, §17.2c): the
 * panel writes to the store and this page is built at deploy time, so a post
 * published in the office is on the website at the next build. Reading the
 * scenario directly rather than the store is what makes that honest instead of
 * a page that renders nothing on the server and fills in after hydration.
 */
const POSTS = publishedPosts(buildScenario('demo', new Date()).posts);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site.blog' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function RatgeberIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;

  const theme = await getTheme();
  const t = await getTranslations('site.blog');

  const grid =
    POSTS.length === 0 ? (
      /* Launch day. The `fresh` scenario seeds no articles precisely so this
         is a state somebody can reach, and it explains itself rather than
         rendering an empty grid that reads as a broken query. */
      <EmptyState
        headingLevel={2}
        title={t('emptyTitle')}
        body={t('emptyBody')}
      />
    ) : (
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {POSTS.map((post) => (
          <li key={post.id} className="hv-card hv-card-light group overflow-hidden">
            <Link
              href={`/ratgeber/${post.slug}`}
              className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
            >
              {post.cover && (
                <span className="block aspect-[16/10] overflow-hidden">
                  <Image
                    src={post.cover}
                    alt={textFor(post.coverAlt, locale)}
                    width={640}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </span>
              )}
              <span className="flex flex-1 flex-col p-6">
                <span data-numeric className="text-sm text-ink-tertiary">
                  {t('readingTime', { minutes: readingMinutes(post, locale) })}
                </span>
                <span className="mt-2 text-lead font-medium text-ink">
                  {textFor(post.title, locale)}
                </span>
                <span className="mt-2 flex-1 text-sm text-ink-secondary">
                  {textFor(post.excerpt, locale)}
                </span>
                <span className="mt-5 inline-flex items-center gap-2 text-sm text-ink-accent">
                  {t('readMore')}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );

  if (theme === 'homivaro') {
    return (
      <>
        <Masthead lines={t.raw('lines')} lead={t('lead')} />
        <PageSection>
          <SectionHead lines={t.raw('gridLines')} />
          <div className="mt-12">{grid}</div>
        </PageSection>
        <CtaBand theme={theme} />
      </>
    );
  }

  return (
    <>
      <Section>
        <SectionHeading
          theme={theme}
          eyebrow={t('metaTitle')}
          title={t('title')}
          lead={t('lead')}
          align="start"
          level={1}
        />
        <div className="mt-10">{grid}</div>
      </Section>
      <CtaBand theme={theme} />
    </>
  );
}
