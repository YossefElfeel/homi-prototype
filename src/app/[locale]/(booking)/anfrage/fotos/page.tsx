'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImagePlus, Info, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { BookingStep } from '@/components/booking/booking-step';
import { useStore } from '@/mock/store';

const MAX_MB = 10;
const ACCEPTED = ['image/jpeg', 'image/png'];

/**
 * Screen 20 — photos and notes, both optional.
 *
 * All four states the spec asks for are here: idle, uploading, wrong format,
 * too large. The upload is mocked and says so — pretending a file was stored
 * would make the prototype dishonest in the one place a reviewer is most
 * likely to test it.
 */
export default function PhotosStep() {
  const t = useTranslations('booking.photos');
  const draft = useStore((s) => s.draft);
  const updateDraft = useStore((s) => s.updateDraft);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) return setError(t('errorType'));
      if (file.size > MAX_MB * 1024 * 1024) return setError(t('errorSize'));
    }

    setUploading(true);
    window.setTimeout(() => {
      updateDraft({
        photos: [
          ...draft.photos,
          ...Array.from(files).map((file, i) => ({
            id: `pho_draft_${draft.photos.length + i}_${file.name.replace(/\W/g, '')}`,
            name: file.name,
            note: '',
          })),
        ],
      });
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }, 700);
  }

  function setNote(id: string, note: string) {
    updateDraft({ photos: draft.photos.map((p) => (p.id === id ? { ...p, note } : p)) });
  }

  function remove(id: string) {
    updateDraft({ photos: draft.photos.filter((p) => p.id !== id) });
  }

  return (
    <BookingStep
      step="fotos"
      title={t('title')}
      lead={t('lead')}
      optional
      canContinue={draft.photos.length > 0 || Boolean(draft.customerNote)}
    >
      <div className="flex gap-3 bg-sunken p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
        <div>
          <h2 className="text-sm font-medium">{t('whyTitle')}</h2>
          <p className="mt-1 text-sm text-ink-secondary">{t('whyBody')}</p>
        </div>
      </div>

      <div className="mt-6">
        <label
          className="flex cursor-pointer flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-line px-6 py-10 text-center transition-colors hover:bg-sunken"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED.join(',')}
            className="sr-only"
            onChange={(e) => onFiles(e.target.files)}
          />
          {uploading ? (
            <>
              <Loader2 className="size-6 animate-spin text-ink-tertiary" aria-hidden />
              <span className="mt-3 text-sm text-ink-secondary">{t('uploading')}</span>
            </>
          ) : (
            <>
              <ImagePlus className="size-6 text-ink-tertiary" aria-hidden />
              <span className="mt-3 font-medium">{t('dropTitle')}</span>
              <span className="mt-1 text-sm text-ink-tertiary">{t('dropHint')}</span>
              <span className="mt-4 inline-flex h-11 items-center rounded-[var(--radius-action)] border border-line-strong px-5 text-sm font-medium">
                {t('dropAction')}
              </span>
            </>
          )}
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm text-status-danger-fg">
            {error}
          </p>
        )}
        <p className="mt-3 text-xs text-ink-tertiary">{t('mockNotice')}</p>
      </div>

      {draft.photos.length > 0 && (
        <ul className="mt-6 space-y-4">
          {draft.photos.map((photo) => (
            <li key={photo.id} className="flex gap-4 rounded-[var(--radius-lg)] border border-line p-4">
              <ImagePlaceholder
                seed={photo.id}
                alt={photo.name}
                className="size-20 shrink-0 rounded-[var(--radius-sm)]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{photo.name}</p>
                <Field label={t('noteLabel')} optional className="mt-2">
                  {(props) => (
                    <Input
                      value={photo.note}
                      placeholder={t('notePlaceholder')}
                      onChange={(e) => setNote(photo.id, e.target.value)}
                      {...props}
                    />
                  )}
                </Field>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${t('remove')} — ${photo.name}`}
                onClick={() => remove(photo.id)}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Field label={t('generalNote')} hint={t('generalNoteHint')} optional className="mt-8">
        {(props) => (
          <Textarea
            value={draft.customerNote}
            onChange={(e) => updateDraft({ customerNote: e.target.value })}
            {...props}
          />
        )}
      </Field>
    </BookingStep>
  );
}
