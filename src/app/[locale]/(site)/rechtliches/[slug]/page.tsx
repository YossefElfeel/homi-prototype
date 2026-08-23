import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getFormatter } from '@/i18n/format-server';
import { AlertTriangle } from 'lucide-react';

import { routing, type Locale } from '@/i18n/routing';
import { LEGAL_SLUGS, getLegalDocument, type LegalSlug } from '@/content/legal';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => LEGAL_SLUGS.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!LEGAL_SLUGS.includes(slug as LegalSlug)) return {};
  const doc = getLegalDocument(slug as LegalSlug, locale as Locale);
  return { title: doc.title, description: doc.intro };
}

/**
 * Screen 10 — the legal template, serving all three documents.
 *
 * The requirement is that it "has to carry a lot of text without becoming
 * tiring": a narrow measure, a table of contents that sticks on desktop, and
 * generous space between sections. Placeholder blocks are flagged in the page
 * itself rather than in a comment, so nobody publishes one by accident.
 */
export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (!LEGAL_SLUGS.includes(slug as LegalSlug)) notFound();
  const doc = getLegalDocument(slug as LegalSlug, locale as Locale);

  const t = await getTranslations('site.legal');
  const brand = await getTranslations('brand');
  const format = await getFormatter();

  return (
    <div className="mx-auto max-w-7xl px-gutter py-block">
      <header className="border-b border-line-subtle pb-8">
        <h1 className="display-type text-[clamp(36px,4.5vw,56px)]">{doc.title}</h1>
        <p className="mt-4 text-sm text-ink-tertiary">
          {t('updated')}{' '}
          <time data-numeric dateTime={doc.updated}>
            {format.dateTime(new Date(doc.updated), 'full')}
          </time>
        </p>
        <p className="mt-6 max-w-[var(--measure)] text-lg text-ink-secondary">{doc.intro}</p>
      </header>

      <div className="grid gap-12 py-block lg:grid-cols-12">
        <nav aria-label={t('tocTitle')} className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <h2 className="label-type text-ink-tertiary">{t('tocTitle')}</h2>
            <ol className="mt-4 space-y-2">
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm text-ink-secondary transition-colors hover:text-ink"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="lg:col-span-8 lg:col-start-5">
          {doc.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 border-b border-line-subtle py-8 first:pt-0 last:border-0"
            >
              <h2 className="subhead-type text-xl">{section.heading}</h2>

              {section.placeholder && (
                <p className="mt-4 flex gap-3 border-l-2 border-rule bg-sunken p-4 text-sm text-ink-secondary">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t('placeholderNotice')}
                </p>
              )}

              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="max-w-[var(--measure)] text-ink-secondary">
                    {paragraph}
                  </p>
                ))}
              </div>

              {section.list && (
                <ul className="mt-4 max-w-[var(--measure)] space-y-2">
                  {section.list.map((item) => (
                    <li key={item} className="flex gap-3 text-ink-secondary">
                      <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-ink-tertiary" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="pt-8">
            <h2 className="subhead-type text-xl">{t('contactTitle')}</h2>
            <p className="mt-3 max-w-[var(--measure)] text-ink-secondary">
              {t('contactBody', { email: brand('email') })}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
