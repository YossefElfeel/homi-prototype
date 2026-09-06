'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { LOCALE_LABELS, routing, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/field';
import { WORK_PHOTOS } from '@/content/bau';
import { ImagePicker } from '@/components/admin/image-picker';
import { useStore } from '@/mock/store';

/**
 * Every picture that exists under /public/construction.
 *
 * Read from the seeded portfolio rather than from the directory, because a
 * browser cannot list a folder — and hard-coding a second list of filenames
 * would be a list to keep in step with the first.
 *
 * These are only the files the project *ships*. The picker adds what this
 * browser has been given since — see `image-store` — so the list somebody
 * chooses from is longer than this one from the first upload onwards.
 */
const AVAILABLE = WORK_PHOTOS.map((p) => p.slug);

export function AddConstructionDialog({
  open,
  onOpenChange,
  group,
  now,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: string;
  now: Date;
}) {
  const t = useTranslations('admin.construction');
  const actionsT = useTranslations('actions');
  const locale = useLocale() as Locale;

  const photos = useStore((s) => s.data.construction);
  const sections = useStore((s) => s.data.constructionSections);
  const addPhoto = useStore((s) => s.addConstructionPhoto);

  const section = sections.find((sec) => sec.id === group);
  const sectionName = section?.title[locale] ?? section?.title.de ?? group;

  const [src, setSrc] = useState('');
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [alt, setAlt] = useState<Partial<Record<Locale, string>>>({});

  /* Only files nothing is using yet. Offering one twice would put the same
     picture in two groups, and the page renders every group — so it would
     appear twice on one screen with no way to tell the copies apart. */
  const unused = useMemo(() => {
    const taken = new Set(photos.map((p) => p.src));
    return AVAILABLE.filter((s) => !taken.has(`/construction/${s}.jpg`));
  }, [photos]);

  const complete = Boolean(src && alt.de?.trim());

  function submit() {
    if (!complete) return;
    addPhoto({ src, group, alt, ...(size ?? {}) }, now);
    toast.success(t('addDone'));
    onOpenChange(false);
    setSrc('');
    setSize(null);
    setAlt({});
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addTitle')}</DialogTitle>
          <DialogDescription>
            {/* The section's own title, from the record. This asked the
                dictionary for a per-group heading — a block deleted in the
                wave that made sections records and let them name themselves —
                so the dialog printed «admin.construction.groups.trockenbau» at
                somebody. The parity check could not see it, because the key
                was assembled from a value at runtime. That blind spot is
                narrower now: `message-test` enumerates the runtime-built keys
                whose value set comes from a union or a registry. */}
            {t('addBody', { group: sectionName })}
          </DialogDescription>
        </DialogHeader>

        {/*
          Always the picker, never a dead end.
          This used to swap the whole form for «every available file is already
          assigned» the moment the project's own files ran out — which was true
          and, once uploads existed, stopped being a reason to refuse. It hid
          the upload button behind a sentence about something else.
        */}
        <div className="space-y-5">
            <ImagePicker
              label={t('addFile')}
              /* Says why only uploads are on offer, rather than replacing the
                 form with that sentence. */
              hint={unused.length === 0 ? t('addNoFiles') : t('addFileHint')}
              options={unused.map((u) => `/construction/${u}.jpg`)}
              /* Everything already in a group — including uploads, which the
                 picker offers from this browser's own library and cannot know
                 are spoken for. */
              exclude={photos.map((p) => p.src)}
              value={src}
              onChange={setSrc}
              /* An upload knows its own dimensions, so the grid gets the real
                 shape rather than the square this used to assume. */
              onUploaded={setSize}
            />

            {/* German is required and the rest are not — §20.6 makes it the
                fallback for every other locale, so one caption is what stands
                between the picture and a screen reader hearing nothing. */}
            {routing.locales.map((l) => (
              <Field
                key={l}
                label={`${t('addAlt')} · ${LOCALE_LABELS[l]}`}
                hint={l === 'de' ? t('addAltHint') : undefined}
              >
                {(props) => (
                  <Input
                    {...props}
                    value={alt[l] ?? ''}
                    onChange={(e) => setAlt({ ...alt, [l]: e.target.value })}
                  />
                )}
              </Field>
            ))}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {actionsT('cancel')}
          </Button>
          <Button disabled={!complete} onClick={submit}>
            {t('addAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
