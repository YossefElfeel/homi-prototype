'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Photo, isRemote } from '@/components/ui/photo';
import { isUploaded, listImages, putImage } from '@/lib/image-store';
import { cn } from '@/lib/cn';

/**
 * Choosing a picture.
 *
 * Two rewrites, and both complaints were the same complaint. First it was a
 * `<select>` of file paths, so picking the right one of four meant choose,
 * look, go back, choose again. Then it was a grid — but two of them side by
 * side inside a dialog, which left each tile about sixty pixels across: the
 * information was there and still nobody could see it.
 *
 * So the tiles are large, the grid is two columns wide rather than four, and
 * the pickers stack instead of sitting beside each other. A picture chooser
 * that cannot be looked at is a dropdown with extra steps.
 *
 * The order of the three sources is the second fix. Uploading from the machine
 * you are sitting at is what somebody means by "add a picture"; the four files
 * in the project are a fallback, and a URL is the rare case. They used to be
 * ranked the other way round, with a red link offering the web at the top.
 */
export function ImagePicker({
  label,
  hint,
  options,
  exclude,
  value,
  onChange,
  onUploaded,
}: {
  label: string;
  hint?: string;
  options: string[];
  /**
   * Pictures already spoken for.
   *
   * The construction portfolio renders every group, so the same picture in two
   * of them appears twice on one page with nothing to tell the copies apart.
   * The caller knows what is in use; the picker only knows what exists.
   */
  exclude?: string[];
  value: string;
  onChange: (src: string) => void;
  /** Uploads know their own dimensions; the caller usually wants them. */
  onUploaded?: (size: { width: number; height: number }) => void;
}) {
  const t = useTranslations('admin.imagePicker');
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [showUrl, setShowUrl] = useState(() => isRemote(value));

  /* What this browser is already holding. Read once on mount and after each
     upload — an upload is the only thing that changes it, and re-reading
     IndexedDB on every render of a dialog would be a query per keystroke in
     the caption field next to it. */
  const [library, setLibrary] = useState<string[]>([]);
  const refresh = useCallback(() => {
    listImages()
      .then(setLibrary)
      .catch(() => setLibrary([]));
  }, []);
  useEffect(refresh, [refresh]);

  /* Uploads first — they are this office's own pictures, and the four files
     the project ships are the fallback. Deduplicated because the current value
     may be an upload that is also in the library. */
  const choices = useMemo(() => {
    const taken = new Set((exclude ?? []).filter((src) => src !== value));
    return Array.from(new Set([...library, ...options])).filter((src) => !taken.has(src));
  }, [library, options, exclude, value]);

  async function take(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('notAnImage'));
      return;
    }
    setBusy(true);
    try {
      const stored = await putImage(file);
      onChange(stored.src);
      refresh();
      onUploaded?.({ width: stored.width, height: stored.height });
    } catch {
      /* Quota, a private window with IndexedDB disabled, a file the decoder
         refuses. The office cannot act on which, so the message says the one
         thing that helps: it did not go in, try another. */
      toast.error(t('uploadFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="label-type text-ink-secondary">{label}</p>
      {hint && <p className="mt-1 text-sm text-ink-tertiary">{hint}</p>}

      {/* The current choice, large, whatever it came from. The old picker
          showed the selection only as a ring on a thumbnail — on four photos of
          similar rooms that is not something you can check. */}
      {value && (
        <div className="mt-3 overflow-hidden rounded-[var(--radius-sm)] border border-line">
          <Photo
            src={value}
            alt=""
            width={640}
            height={480}
            className="aspect-[4/3] w-full bg-sunken object-cover"
          />
          <p className="truncate border-t border-line-subtle px-3 py-2 font-mono text-xs text-ink-tertiary">
            {isUploaded(value) ? t('fromThisDevice') : value}
          </p>
        </div>
      )}

      {/* First, because it is what «add a picture» means. */}
      <div className="mt-3">
        <input
          ref={input}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void take(e.target.files?.[0]);
            /* Cleared so choosing the same file twice still fires a change —
               otherwise a retry after a failure silently does nothing. */
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-4" aria-hidden />
          )}
          {busy ? t('uploading') : t('fromDevice')}
        </Button>
        <p className="mt-1.5 text-sm text-ink-tertiary">{t('fromDeviceHint')}</p>
      </div>

      {choices.length > 0 && (
        <div className="mt-5">
          <p className="label-type text-ink-tertiary">
            {t('orChoose', { n: choices.length })}
          </p>
          {/*
            Capped and scrollable, because this list has no natural size any
            more. Four project files fitted a dialog; the pictures this browser
            has been given do not, and they only ever grow. A grid that keeps
            growing pushes the upload button and the caption field off the
            bottom of the screen — the two controls the dialog exists for.
          */}
          <ul className="mt-2 grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pe-1">
            {choices.map((src) => {
              const chosen = src === value;
              return (
                <li key={src}>
                  <button
                    type="button"
                    aria-pressed={chosen}
                    /* Scrolled to on open, so re-opening a dialog does not
                       start at the top of a list whose chosen picture is
                       twenty rows down. */
                    ref={(node) => {
                      if (chosen) node?.scrollIntoView({ block: 'nearest' });
                    }}
                    onClick={() => onChange(src)}
                    className={cn(
                      'relative block w-full overflow-hidden rounded-[var(--radius-sm)] transition-shadow',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
                      chosen
                        ? 'ring-2 ring-accent ring-offset-2 ring-offset-page'
                        : 'ring-1 ring-line hover:ring-line-strong',
                    )}
                  >
                    <Photo
                      src={src}
                      alt=""
                      width={320}
                      height={240}
                      className="aspect-[4/3] w-full bg-sunken object-cover"
                    />
                    {chosen && (
                      <span className="absolute end-2 top-2 grid size-6 place-items-center rounded-full bg-accent text-on-accent">
                        <Check className="size-3.5" aria-hidden />
                      </span>
                    )}
                    <span className="sr-only">{src}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Last, and quiet. It is the rare case, and it was the loudest control
          on the panel. */}
      <div className="mt-4">
        {showUrl ? (
          <Field label={t('urlLabel')} hint={t('urlHint')}>
            {(props) => (
              <Input
                {...props}
                type="url"
                inputMode="url"
                placeholder="https://…"
                value={isRemote(value) ? value : ''}
                onChange={(e) => onChange(e.target.value)}
              />
            )}
          </Field>
        ) : (
          <button
            type="button"
            onClick={() => setShowUrl(true)}
            className="text-sm text-ink-tertiary underline-offset-2 hover:text-ink hover:underline"
          >
            {t('fromUrl')}
          </button>
        )}
      </div>
    </div>
  );
}
