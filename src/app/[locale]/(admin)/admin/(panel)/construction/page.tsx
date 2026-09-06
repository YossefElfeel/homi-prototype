'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, ExternalLink, Plus } from 'lucide-react';

import { LOCALE_LABELS, routing, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, useConfirmTarget, useDismissLabel } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import { WORK_GROUPS } from '@/content/bau';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { ConstructionPhoto } from '@/mock/schema';
import { AddConstructionDialog } from '@/components/admin/add-construction-dialog';

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
  const setVisible = useStore((s) => s.setConstructionVisible);
  const updatePhoto = useStore((s) => s.updateConstructionPhoto);
  const movePhoto = useStore((s) => s.moveConstructionPhoto);
  const removePhoto = useStore((s) => s.removeConstructionPhoto);

  const [group, setGroup] = useState<string>(WORK_GROUPS[0]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const removing = useConfirmTarget<ConstructionPhoto>();

  const inGroup = useMemo(
    () =>
      photos
        .filter((p) => p.group === group)
        .slice()
        .sort((a, b) => a.order - b.order),
    [photos, group],
  );

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const countIn = (id: string) => photos.filter((p) => p.group === id).length;
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

      {/* One tab per group, in the order the page renders them. */}
      <div
        role="tablist"
        aria-label={t('title')}
        className="mt-8 flex flex-wrap gap-1 border-b border-line"
      >
        {WORK_GROUPS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`con-tab-${id}`}
            aria-selected={group === id}
            aria-controls="con-panel"
            tabIndex={group === id ? 0 : -1}
            onKeyDown={(e) => {
              const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (delta === 0) return;
              e.preventDefault();
              const all = WORK_GROUPS;
              const next = all[(all.indexOf(id) + delta + all.length) % all.length]!;
              setGroup(next);
              document.getElementById(`con-tab-${next}`)?.focus();
            }}
            onClick={() => setGroup(id)}
            className={cn(
              '-mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 py-2 text-sm transition-colors',
              group === id
                ? 'border-accent font-medium text-ink'
                : 'border-transparent text-ink-secondary hover:border-line-strong hover:text-ink',
            )}
          >
            {t(`groups.${id}` as 'groups.trockenbau')}
            <span
              data-numeric
              className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                group === id ? 'bg-accent-subtle text-ink' : 'bg-sunken text-ink-tertiary',
              )}
            >
              {countIn(id)}
            </span>
            {/* A group with pictures taken down looks identical to one without,
                and «warum sind da nur drei?» is the question that follows. */}
            {hiddenIn(id) > 0 && (
              <span className="rounded-sm border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-xs text-status-warning-fg">
                {t('hiddenCount', { n: hiddenIn(id) })}
              </span>
            )}
          </button>
        ))}
      </div>

      <div id="con-panel" role="tabpanel" aria-labelledby={`con-tab-${group}`} tabIndex={0}>
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
                <Image
                  src={`/construction/${photo.slug}.jpg`}
                  alt=""
                  width={480}
                  height={360}
                  className="aspect-[4/3] w-full object-cover"
                />

                <div className="p-4">
                  <p className="font-mono text-xs text-ink-tertiary">{photo.slug}</p>

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
                            {WORK_GROUPS.map((g) => (
                              <option key={g} value={g}>
                                {t(`groups.${g}` as 'groups.trockenbau')}
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

      <AddConstructionDialog open={adding} onOpenChange={setAdding} group={group} now={now} />

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
