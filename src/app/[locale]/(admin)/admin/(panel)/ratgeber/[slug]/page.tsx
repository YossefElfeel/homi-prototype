'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, ExternalLink, Plus, Trash2 } from 'lucide-react';

import { LOCALE_LABELS, routing, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/cn';
import { BLOG_IMAGES, emptySection, isPublished, missingLocales } from '@/lib/blog';
import { isOffered } from '@/lib/service-catalogue';
import { useHydrated, useStore } from '@/mock/store';
import type { BlogSection } from '@/mock/schema';

/**
 * Screen R4 — writing one article.
 *
 * Everything autosaves per keystroke, which is right for prose and is exactly
 * why publishing is *not* here: the list next door owns that, behind a confirm.
 * The worst case on this screen is a typo somebody can see; the worst case of
 * an accidental publish is an unfinished article on the public internet.
 *
 * One language at a time, like the content editor and for the same reason a
 * service's four-column layout does not survive contact with a paragraph. The
 * tab carries its own gap count so «ist das Englische geschrieben?» is
 * answered before you press it — and a language counts as written only when
 * the title, the excerpt and every section heading are there, because a piece
 * with an English headline over German paragraphs reads as broken rather than
 * as untranslated.
 */
export default function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations('admin.blog');
  const appT = useTranslations('app');
  const readerLocale = useLocale() as Locale;
  const hydrated = useHydrated();

  const posts = useStore((s) => s.data.posts);
  const team = useStore((s) => s.data.team);
  const services = useStore((s) => s.services);
  const updatePost = useStore((s) => s.updatePost);

  const [locale, setLocale] = useState<Locale>(readerLocale);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  /** One locale of a per-language field, without disturbing the others. */
  const setText = (
    field: 'title' | 'excerpt' | 'coverAlt',
    value: string,
  ) => updatePost(post.id, { [field]: { ...post[field], [locale]: value } });

  const patchSection = (id: string, patch: Partial<BlogSection>) =>
    updatePost(post.id, {
      sections: post.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const moveSection = (index: number, to: number) => {
    const next = [...post.sections];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    updatePost(post.id, { sections: next });
  };

  return (
    <div>
      <PageHeader
        title={post.title[locale] || post.title.de || t('untitled')}
        lead={t('editorLead')}
        back={{ href: '/admin/ratgeber', label: t('backToList') }}
        actions={
          <div className="flex items-center gap-3">
            <SaveIndicator
              signal={post}
              savingLabel={appT('saving')}
              savedLabel={appT('saved')}
            />
            <StatusBadge entity="blogPost" state={post.status} size="sm" />
            {isPublished(post) && (
              <Button asChild variant="secondary" size="sm">
                <a href={`/ratgeber/${post.slug}`} target="_blank" rel="noreferrer">
                  {t('rowView')}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </Button>
            )}
          </div>
        }
      />

      {/* Four tabs, and French and Italian are on it: they have no dictionary
          at all, so they are the languages most in need of a place to be
          written rather than the ones to leave off. */}
      <div role="tablist" aria-label={t('localeTab')} className="mt-8 flex flex-wrap gap-1">
        {routing.locales.map((id) => {
          const gap = missingLocales(post, [id]).length > 0;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`post-locale-${id}`}
              aria-selected={locale === id}
              aria-controls="post-panel"
              tabIndex={locale === id ? 0 : -1}
              onKeyDown={(e) => {
                const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                if (delta === 0) return;
                e.preventDefault();
                const all = routing.locales;
                const next = all[(all.indexOf(id) + delta + all.length) % all.length]!;
                setLocale(next);
                document.getElementById(`post-locale-${next}`)?.focus();
              }}
              onClick={() => setLocale(id)}
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
                locale === id
                  ? 'bg-accent-subtle font-medium text-ink'
                  : 'text-ink-secondary hover:bg-sunken',
              )}
            >
              {LOCALE_LABELS[id]}
              {gap && (
                <span className="rounded-sm border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-xs text-status-warning-fg">
                  {t('gapShort')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div id="post-panel" role="tabpanel" aria-labelledby={`post-locale-${locale}`} tabIndex={0}>
        <Card className="mt-6">
          <CardHeader title={t('basicsTitle')} />
          <CardBody className="space-y-5">
            <Field label={t('fieldTitle')}>
              {(props) => (
                <Input
                  {...props}
                  value={post.title[locale] ?? ''}
                  onChange={(e) => setText('title', e.target.value)}
                />
              )}
            </Field>

            <Field label={t('fieldExcerpt')} hint={t('fieldExcerptHint')}>
              {(props) => (
                <Textarea
                  {...props}
                  rows={3}
                  value={post.excerpt[locale] ?? ''}
                  onChange={(e) => setText('excerpt', e.target.value)}
                />
              )}
            </Field>

            {/* One slug for every language, and it is derived from the German.
                Four URLs for one article would split whatever search value it
                earns four ways, and §20.6 already makes German the version the
                other three fall back to. */}
            <Field label={t('fieldSlug')} hint={t('fieldSlugHint', { slug: post.slug })}>
              {(props) => (
                <Input
                  {...props}
                  value={post.slug}
                  onChange={(e) => updatePost(post.id, { slug: e.target.value })}
                />
              )}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('fieldAuthor')} hint={t('fieldAuthorHint')}>
                {(props) => (
                  <Select
                    {...props}
                    value={post.authorId}
                    onChange={(e) => updatePost(post.id, { authorId: e.target.value })}
                  >
                    {team.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label={t('fieldService')} hint={t('fieldServiceHint')}>
                {(props) => (
                  <Select
                    {...props}
                    value={post.serviceSlug ?? ''}
                    onChange={(e) =>
                      updatePost(post.id, { serviceSlug: e.target.value || undefined })
                    }
                  >
                    <option value="">{t('serviceNone')}</option>
                    {services.filter(isOffered).map((service) => (
                      <option key={service.slug} value={service.slug}>
                        {service.name[locale] ?? service.name.de}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card className="mt-5">
          <CardHeader title={t('coverTitle')} />
          <CardBody className="space-y-5">
            {/* A menu of what is already in /public/img, not a file input.
                There is no upload in this prototype, and a control that takes
                a file and writes nowhere is worse than no control. */}
            <Field label={t('fieldCover')} hint={t('fieldCoverHint')}>
              {(props) => (
                <Select
                  {...props}
                  value={post.cover ?? ''}
                  onChange={(e) => updatePost(post.id, { cover: e.target.value || undefined })}
                >
                  <option value="">{t('imageNone')}</option>
                  {BLOG_IMAGES.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {post.cover && (
              <Field label={t('fieldCoverAlt')} hint={t('fieldAltHint')}>
                {(props) => (
                  <Input
                    {...props}
                    value={post.coverAlt?.[locale] ?? ''}
                    onChange={(e) => setText('coverAlt', e.target.value)}
                  />
                )}
              </Field>
            )}
          </CardBody>
        </Card>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="display-type text-xl">{t('sectionsTitle')}</h2>
          <Button
            variant="secondary"
            onClick={() =>
              updatePost(post.id, {
                sections: [...post.sections, emptySection(post.sections.length)],
              })
            }
          >
            <Plus className="size-4" aria-hidden />
            {t('addSection')}
          </Button>
        </div>

        {post.sections.length === 0 ? (
          <p className="mt-4 max-w-[var(--measure)] text-ink-secondary">{t('sectionsEmpty')}</p>
        ) : (
          <ul className="mt-4 space-y-5">
            {post.sections.map((section, index) => (
              <li key={section.id}>
                <Card>
                  <CardHeader
                    title={
                      section.heading[locale] ||
                      section.heading.de ||
                      t('sectionUntitled', { n: index + 1 })
                    }
                    actions={
                      <span className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('moveUp')}
                          disabled={index === 0}
                          onClick={() => moveSection(index, index - 1)}
                        >
                          <ChevronUp className="size-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('moveDown')}
                          disabled={index === post.sections.length - 1}
                          onClick={() => moveSection(index, index + 1)}
                        >
                          <ChevronDown className="size-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('removeSection')}
                          onClick={() =>
                            updatePost(post.id, {
                              sections: post.sections.filter((s) => s.id !== section.id),
                            })
                          }
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </span>
                    }
                  />
                  <CardBody className="space-y-5">
                    <Field label={t('fieldHeading')}>
                      {(props) => (
                        <Input
                          {...props}
                          value={section.heading[locale] ?? ''}
                          onChange={(e) =>
                            patchSection(section.id, {
                              heading: { ...section.heading, [locale]: e.target.value },
                            })
                          }
                        />
                      )}
                    </Field>

                    {/* One paragraph per line. The record holds an array, so
                        the split happens here rather than in the renderer —
                        a body kept as one string with newlines in it is how a
                        paragraph break silently becomes whitespace on the
                        page. Blank lines are dropped on the way in. */}
                    <Field label={t('fieldParagraphs')} hint={t('fieldParagraphsHint')}>
                      {(props) => (
                        <Textarea
                          {...props}
                          rows={7}
                          value={(section.paragraphs[locale] ?? []).join('\n\n')}
                          onChange={(e) =>
                            patchSection(section.id, {
                              paragraphs: {
                                ...section.paragraphs,
                                [locale]: e.target.value
                                  .split(/\n{2,}/)
                                  .map((p) => p.trim())
                                  .filter(Boolean),
                              },
                            })
                          }
                        />
                      )}
                    </Field>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label={t('fieldImage')}>
                        {(props) => (
                          <Select
                            {...props}
                            value={section.image ?? ''}
                            onChange={(e) =>
                              patchSection(section.id, { image: e.target.value || undefined })
                            }
                          >
                            <option value="">{t('imageNone')}</option>
                            {BLOG_IMAGES.map((src) => (
                              <option key={src} value={src}>
                                {src}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                      {section.image && (
                        <Field label={t('fieldImageAlt')} hint={t('fieldAltHint')}>
                          {(props) => (
                            <Input
                              {...props}
                              value={section.imageAlt?.[locale] ?? ''}
                              onChange={(e) =>
                                patchSection(section.id, {
                                  imageAlt: { ...section.imageAlt, [locale]: e.target.value },
                                })
                              }
                            />
                          )}
                        </Field>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
