'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
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
 * would be a list to keep in step with the first. It is the same honest limit
 * as the blog's image picker: there is no upload in this prototype, and a file
 * input that writes nowhere is a control that lies.
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

  const photos = useStore((s) => s.data.construction);
  const addPhoto = useStore((s) => s.addConstructionPhoto);

  const [src, setSrc] = useState('');
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
    addPhoto({ src, group, alt }, now);
    toast.success(t('addDone'));
    onOpenChange(false);
    setSrc('');
    setAlt({});
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addTitle')}</DialogTitle>
          <DialogDescription>
            {t('addBody', { group: t(`groups.${group}` as 'groups.trockenbau') })}
          </DialogDescription>
        </DialogHeader>

        {unused.length === 0 ? (
          <p className="text-ink-secondary">{t('addNoFiles')}</p>
        ) : (
          <div className="space-y-5">
            <ImagePicker
              label={t('addFile')}
              hint={t('addFileHint')}
              options={unused.map((u) => `/construction/${u}.jpg`)}
              value={src}
              onChange={setSrc}
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
        )}

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
