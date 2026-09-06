'use client';

import { useMemo, useState } from 'react';
import { Photo } from '@/components/ui/photo';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, ExternalLink, Plus } from 'lucide-react';

import { LOCALE_LABELS, routing, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, useConfirmTarget, useDismissLabel } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';

import { useHydrated, useNow, useStore } from '@/mock/store';
import type { ConstructionPhoto } from '@/mock/schema';
import { AddConstructionDialog } from '@/components/admin/add-construction-dialog';
import { AddSectionDialog } from '@/components/admin/add-section-dialog';

/**
 * Screen 86 — the construction portfolio, from the office.
 *
 * `content/bau.ts` argued, correctly, that these are not `Photo`s: a `Photo` is
 * customer work joined to a booking and gated on §20.6 consent, and the whole
 * subject of that gate is that a customer may switch a picture off. These are
 * the company photographing its own jobs, and nobody's consent is involved.
 *
 * Where the argument stopped short was concluding "so they live in a file".
 * Which twenty-two pictures a construction firm leads with, in what order, and
 * what each one is called are decisions the business makes and changes — and
 * until now they were a developer's to make.
 *
 * Tabs are the four groups because that is how the page itself is built: one
 * section per group, in order. A tab per group means the screen and the page
 * are the same shape, and «wo steht das Bild?» is answered by looking.
 */
export default function AdminConstructionPage() {
  const t = useTranslations('admin.construction');
  const appT = useTranslations('app');
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const now = useNow();
  const dismissLabel = useDismissLabel();

  const photos = useStore((s) => s.data.construction);
  const sections = useStore((s) => s.data.constructionSections);
  const updateSection = useStore((s) => s.updateConstructionSection);
  const moveSection = useStore((s) => s.moveConstructionSection);
  const removeSection = useStore((s) => s.removeConstructionSection);
  const setVisible = useStore((s) => s.setConstructionVisible);
  const updatePhoto = useStore((s) => s.updateConstructionPhoto);
  const movePhoto = useStore((s) => s.moveConstructionPhoto);
  const removePhoto = useStore((s) => s.removeConstructionPhoto);

  const [group, setGroup] = useState<string>('');
  const [editingSection, setEditingSection] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const removing = useConfirmTarget<ConstructionPhoto>();

  const ordered = useMemo(
    () => sections.slice().sort((a, b) => a.order - b.order),
    [sections],
  );

  /* The chosen tab, or the first section. Held as a *value* rather than an
     index so removing a section cannot leave the panel pointing at a slot
     that no longer exists. */
  const current = ordered.find((sec) => sec.id === group) ?? ordered[0];

  const inGroup = useMemo(
    () =>
      photos
        .filter((p) => p.group === current?.id)
        .slice()
        .sort((a, b) => a.order - b.order),
    [photos, current?.id],
  );

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const countIn = (id: string) => photos.filter((p) => p.group === id).length;
  const nameOf = (sec: { title: Partial<Record<Locale, string>>; id: string }) =>
    sec.title[locale] ?? sec.title.de ?? sec.id;
  const hiddenIn = (id: string) => photos.filter((p) => p.group === id && !p.visible).length;

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        actions={
          <div className="flex items-center gap-3">
            <SaveIndicator
              signal={photos}
              savingLabel={appT('saving')}
              savedLabel={appT('saved')}
            />
            <Button asChild variant="secondary" size="sm">
              <a href="/construction" target="_blank" rel="noreferrer">
                {t('viewPage')}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" aria-hidden />
              {t('addAction')}
            </Button>
          </div>
        }
      />

      {/*
        The section controls sit on the tab strip, not in the page header.
        Four buttons up there overflowed the row and wrapped under the lead,
        which is what made them look adrift — but the placement was wrong
        before it was ugly: «Abschnitt bearbeiten» and «Neuer Abschnitt» act on
        a *section*, and the tab strip is what a section is on this screen. The
        header keeps what belongs to the page.
      */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line">
        <div role="tablist" aria-label={t('title')} className="flex flex-wrap gap-1">
        {ordered.map((sec) => (
          <button
            key={sec.id}
            type="button"
            role="tab"
            id={`con-tab-${sec.id}`}
            aria-selected={current?.id === sec.id}
            aria-controls="con-panel"
            tabIndex={current?.id === sec.id ? 0 : -1}
            onKeyDown={(e) => {
              const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (delta === 0) return;
              e.preventDefault();
              const i = ordered.findIndex((x) => x.id === sec.id);
              const next = ordered[(i + delta + ordered.length) % ordered.length]!;
              setGroup(next.id);
              document.getElementById(`con-tab-${next.id}`)?.focus();
            }}
            onClick={() => {
              setGroup(sec.id);
              setEditingSection(false);
            }}
            className={cn(
              '-mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 py-2 text-sm transition-colors',
              current?.id === sec.id
                ? 'border-accent font-medium text-ink'
                : 'border-transparent text-ink-secondary hover:border-line-strong hover:text-ink',
            )}
          >
            {nameOf(sec)}
            <span
              data-numeric
              className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                current?.id === sec.id
                  ? 'bg-accent-subtle text-ink'
                  : 'bg-sunken text-ink-tertiary',
              )}
            >
              {countIn(sec.id)}
            </span>
            {/* A group with pictures taken down looks identical to one without,
                and «warum sind da nur drei?» is the question that follows. */}
            {hiddenIn(sec.id) > 0 && (
              <span className="rounded-sm border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-xs text-status-warning-fg">
                {t('hiddenCount', { n: hiddenIn(sec.id) })}
              </span>
            )}
          </button>
          ))}
        </div>

        {/* Ghost buttons, so the strip still reads as tabs. Two filled ones
            here would compete with the tab that is actually selected. */}
        <div className="flex shrink-0 items-center gap-1 pb-2">
          <Button variant="ghost" size="sm" onClick={() => setEditingSection((v) => !v)}>
            {t('sectionEdit')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAddingSection(true)}>
            <Plus className="size-4" aria-hidden />
            {t('sectionNew')}
          </Button>
        </div>
      </div>

      {current && editingSection && (
        <div className="surface-card mt-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="display-type text-lg">{t('sectionHeadings')}</h2>
            <span className="flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('sectionUp')}
                disabled={ordered[0]?.id === current.id}
                onClick={() => moveSection(current.id, -1)}
              >
                <ChevronUp className="size-4" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('sectionDown')}
                disabled={ordered[ordered.length - 1]?.id === current.id}
                onClick={() => moveSection(current.id, 1)}
              >
                <ChevronDown className="size-4" aria-hidden />
              </Button>
            </span>
          </div>

          <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
            {t('sectionHeadingsHint')}
          </p>

          <div className="mt-5 space-y-6">
            {routing.locales.map((l) => (
              <div key={l} className="space-y-3">
                <p className="label-type text-ink-tertiary">{LOCALE_LABELS[l]}</p>
                <Field label={t('sectionTitle')} hint={t('sectionTitleHint')}>
                  {(props) => (
                    <Input
                      {...props}
                      value={current.title[l] ?? ''}
                      onChange={(e) =>
                        updateSection(current.id, {
                          title: { ...current.title, [l]: e.target.value },
                        })
                      }
                    />
                  )}
                </Field>
                {/* Two halves, because the display heading is two colours and
                    which words are red is a writing decision — see
                    `lib/display-headline.ts`. */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t('sectionLead')} hint={t('sectionLeadHint')}>
                    {(props) => (
                      <Input
                        {...props}
                        value={current.lead[l] ?? ''}
                        onChange={(e) =>
                          updateSection(current.id, {
                            lead: { ...current.lead, [l]: e.target.value },
                          })
                        }
                      />
                    )}
                  </Field>
                  <Field label={t('sectionAccent')} hint={t('sectionAccentHint')}>
                    {(props) => (
                      <Input
                        {...props}
                        value={current.accent[l] ?? ''}
                        onChange={(e) =>
                          updateSection(current.id, {
                            accent: { ...current.accent, [l]: e.target.value },
                          })
                        }
                      />
                    )}
                  </Field>
                </div>
                <Field label={t('sectionBody')} hint={t('sectionBodyHint')}>
                  {(props) => (
                    <Textarea
                      {...props}
                      rows={3}
                      value={current.body[l] ?? ''}
                      onChange={(e) =>
                        updateSection(current.id, {
                          body: { ...current.body, [l]: e.target.value },
                        })
                      }
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line-subtle pt-4">
            <Button variant="secondary" size="sm" onClick={() => setEditingSection(false)}>
              {t('doneEditing')}
            </Button>
            {/* Refused while it holds pictures, and the message counts them.
                Deleting a heading is a labelling decision; deleting the jobs it
                labels is not, and one confirm cannot honestly ask both. */}
            <Button
              variant="ghost"
              size="sm"
              className="ms-auto"
              onClick={() => {
                if (countIn(current.id) > 0) {
                  toast.error(t('sectionBlocked', { n: countIn(current.id) }));
                  return;
                }
                removeSection(current.id);
                setEditingSection(false);
                toast.success(t('sectionRemoveDone'));
              }}
            >
              {t('sectionRemove')}
            </Button>
          </div>
        </div>
      )}

      <div id="con-panel" role="tabpanel" aria-labelledby={`con-tab-${current?.id}`} tabIndex={0}>
        {inGroup.length === 0 ? (
          <EmptyState
            className="mt-6"
            compact
            headingLevel={2}
            title={t('emptyTitle')}
            body={t('emptyBody')}
            action={<Button onClick={() => setAdding(true)}>{t('addAction')}</Button>}
          />
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inGroup.map((photo, index) => (
              <li
                key={photo.id}
                className={cn('surface-card overflow-hidden', !photo.visible && 'opacity-60')}
              >
                <Photo
                  src={photo.src}
                  alt=""
                  width={480}
                  height={360}
                  className="aspect-[4/3] w-full object-cover"
                />

                <div className="p-4">
                  <p className="truncate font-mono text-xs text-ink-tertiary">{photo.src}</p>

                  {/* The caption is what a screen reader is given, so it is
                      edited here rather than hidden behind a detail screen —
                      and per language, because it is a sentence. */}
                  {editing === photo.id ? (
                    <div className="mt-3 space-y-3">
                      {routing.locales.map((l) => (
                        <Field key={l} label={LOCALE_LABELS[l]}>
                          {(props) => (
                            <Input
                              {...props}
                              value={photo.alt[l] ?? ''}
                              onChange={(e) =>
                                updatePhoto(photo.id, {
                                  alt: { ...photo.alt, [l]: e.target.value },
                                })
                              }
                            />
                          )}
                        </Field>
                      ))}
                      <Field label={t('groupField')}>
                        {(props) => (
                          <Select
                            {...props}
                            value={photo.group}
                            onChange={(e) => updatePhoto(photo.id, { group: e.target.value })}
                          >
                            {ordered.map((g) => (
                              <option key={g.id} value={g.id}>
                                {nameOf(g)}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                      <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>
                        {t('doneEditing')}
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-ink-secondary">
                      {photo.alt[locale] ?? photo.alt.de ?? (
                        <span className="text-status-warning-fg">{t('noAlt')}</span>
                      )}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={photo.visible}
                        onCheckedChange={(next) => setVisible(photo.id, next)}
                        aria-label={t('visible')}
                      />
                      <span className={photo.visible ? 'text-ink' : 'text-ink-tertiary'}>
                        {photo.visible ? t('visible') : t('hidden')}
                      </span>
                    </label>

                    <span className="ms-auto flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('moveUp')}
                        disabled={index === 0}
                        onClick={() => movePhoto(photo.id, -1)}
                      >
                        <ChevronUp className="size-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('moveDown')}
                        disabled={index === inGroup.length - 1}
                        onClick={() => movePhoto(photo.id, 1)}
                      >
                        <ChevronDown className="size-4" aria-hidden />
                      </Button>
                    </span>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(editing === photo.id ? null : photo.id)}
                    >
                      {t('edit')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removing.ask(photo)}>
                      {t('remove')}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddSectionDialog
        open={addingSection}
        onOpenChange={setAddingSection}
        onCreated={(id) => {
          setGroup(id);
          /* Straight into the editor: a section is a heading, and the one
             just made has only the German title on it. */
          setEditingSection(true);
        }}
      />

      <AddConstructionDialog
        open={adding}
        onOpenChange={setAdding}
        group={current?.id ?? ''}
        now={now}
      />

      <ConfirmDialog
        open={removing.open}
        onOpenChange={(open) => !open && removing.dismiss()}
        title={t('removeTitle')}
        body={t('removeBody')}
        action={t('remove')}
        dismiss={dismissLabel}
        tone="danger"
        onConfirm={() => {
          const photo = removing.target;
          if (!photo) return;
          removing.dismiss();
          removePhoto(photo.id);
          toast.success(t('removeDone'));
        }}
      />
    </div>
  );
}
