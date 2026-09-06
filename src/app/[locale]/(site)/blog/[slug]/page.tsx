import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, ChevronRight } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { buildScenario } from '@/mock/scenarios';
import { SEED_SERVICES } from '@/mock/seed';
import { isOffered } from '@/lib/service-catalogue';
import { publishedPosts, readingMinutes, textFor } from '@/lib/blog';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/signature/section-heading';
import { CtaBand } from '@/components/signature/cta-band';
import { ArticleBody } from '@/components/site/article-body';
import { getFormatter } from '@/i18n/format-server';

const DATA = buildScenario('demo', new Date());
const POSTS = publishedPosts(DATA.posts);

/**
 * Only what is published gets a page.
 *
 * The same rule the service template applies, and for the same reason: a draft
 * pre-rendered into a browsable article is the office's unfinished writing on
 * the public internet, and «Entwurf» would mean nothing at all.
 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    POSTS.map((post) => ({ locale, slug: post.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: textFor(post.title, locale as Locale),
    description: textFor(post.excerpt, locale as Locale),
  };
}

/**
 * Screen R2 — one article.
 *
 * Blocks rather than a body of markdown or one rich-text blob, so every
 * heading, paragraph and list carries its own text per language. See
 * `BlogBlock` for why that shape was chosen over a WYSIWYG surface, and
 * `ArticleBody` for the one place that switches on the kind.
 *
 * The link at the foot is the point of the whole Ratgeber commercially: an
 * article about handing back a flat ends on the service that does it. It is
 * only drawn where the post names a service *and* that service is still on
 * sale — an article outliving the thing it advertises is exactly how a
 * marketing site starts linking to 404s.
 */
export default async function RatgeberPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;

  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const theme = await getTheme();
  const t = await getTranslations('site.blog');
  const nav = await getTranslations('nav');
  const format = await getFormatter();

  const author = DATA.team.find((member) => member.id === post.authorId);
  const service = post.serviceSlug
    ? SEED_SERVICES.find((s) => s.slug === post.serviceSlug && isOffered(s))
    : undefined;
  const more = POSTS.filter((p) => p.id !== post.id).slice(0, 2);

  return (
    <>
      <div className="border-b border-line-subtle">
        <div className="mx-auto max-w-7xl px-gutter py-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-tertiary">
              <li>
                <Link href="/" className="inline-flex items-center py-1 transition-colors hover:text-ink">
                  {nav('home')}
                </Link>
              </li>
              <ChevronRight className="size-3.5" aria-hidden />
              <li>
                <Link
                  href="/blog"
                  className="inline-flex items-center py-1 transition-colors hover:text-ink"
                >
                  {nav('blog')}
                </Link>
              </li>
              <ChevronRight className="size-3.5" aria-hidden />
              <li aria-current="page" className="text-ink">
                {textFor(post.title, locale)}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <Section>
        <article className="mx-auto max-w-[68ch]">
          <h1 className="display-type text-display-4">{textFor(post.title, locale)}</h1>

          {/* Who wrote it and when, on one line. A blog whose articles are
              unsigned and undated reads as filler — the byline is what makes
              «wir rufen wirklich an» a person's claim rather than a slogan. */}
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-secondary">
            {author && (
              <span>
                {t('byline', { name: `${author.firstName} ${author.lastName}` })}
              </span>
            )}
            {post.publishedAt && (
              <>
                <span aria-hidden>·</span>
                <time data-numeric dateTime={post.publishedAt}>
                  {format.dateTime(new Date(post.publishedAt), 'full')}
                </time>
              </>
            )}
            <span aria-hidden>·</span>
            <span data-numeric>
              {t('readingTime', { minutes: readingMinutes(post, locale) })}
            </span>
          </p>

          <p className="mt-8 text-lg text-ink-secondary">{textFor(post.excerpt, locale)}</p>

          {post.cover && (
            <Image
              src={post.cover}
              alt={textFor(post.coverAlt, locale)}
              width={1360}
              height={850}
              priority
              className="mt-10 w-full rounded-[var(--radius-lg)] object-cover"
            />
          )}

          <ArticleBody blocks={post.blocks} locale={locale} />

          {service && (
            <aside className="mt-14 rounded-[var(--radius-lg)] bg-sunken p-6 sm:p-8">
              <h2 className="subhead-type text-xl">
                {t('serviceTitle', { service: service.name[locale] ?? service.name.de ?? '' })}
              </h2>
              <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">
                {service.short[locale] ?? service.short.de}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/request?service=${service.slug}`}>
                    {t('serviceCta')}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={`/services/${service.slug}`}>{t('serviceRead')}</Link>
                </Button>
              </div>
            </aside>
          )}
        </article>
      </Section>

      {more.length > 0 && (
        <Section tone="sunken">
          <h2 className="subhead-type text-2xl">{t('moreTitle')}</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {more.map((other) => (
              <li key={other.id} className="surface-card">
                <Link
                  href={`/blog/${other.slug}`}
                  className="flex h-full flex-col p-6 transition-colors hover:bg-accent-subtle"
                >
                  <span data-numeric className="text-sm text-ink-tertiary">
                    {t('readingTime', { minutes: readingMinutes(other, locale) })}
                  </span>
                  <span className="mt-2 font-medium">{textFor(other.title, locale)}</span>
                  <span className="mt-2 text-sm text-ink-secondary">
                    {textFor(other.excerpt, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <CtaBand theme={theme} />
    </>
  );
}
