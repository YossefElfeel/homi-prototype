'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Link2 } from 'lucide-react';

import { Field, Input } from '@/components/ui/field';
import { Photo, isRemote } from '@/components/ui/photo';
import { cn } from '@/lib/cn';

/**
 * Choosing a picture by looking at it.
 *
 * This was a `<select>` of file paths — «/img/hero.webp», «/img/service-1.webp»
 * — with the preview only appearing after the choice was made. So picking the
 * right one of four meant choosing, looking, going back and choosing again, and
 * the two dropdowns for a before-and-after pair made that four round trips for
 * one decision. A grid of thumbnails is the same information in the form the
 * decision is actually made in.
 *
 * The URL field is the second half of the same complaint: the project's four
 * files are not the pictures a real portfolio is made of, and there is no
 * upload here. Pasting a link is the honest way in until there is one — and
 * `Photo` renders a remote picture without the optimizer, because pointing the
 * optimizer at an arbitrary host would make this app an open image proxy.
 */
export function ImagePicker({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: string[];
  value: string;
  onChange: (src: string) => void;
}) {
  const t = useTranslations('admin.imagePicker');
  /* Opens on whichever half the current value came from, so re-opening a
     dialog with a pasted URL in it does not look like the URL was lost. */
  const [external, setExternal] = useState(() => isRemote(value));

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="label-type text-ink-secondary">{label}</p>
        <button
          type="button"
          onClick={() => setExternal((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm text-ink-accent hover:underline"
        >
          <Link2 className="size-3.5" aria-hidden />
          {external ? t('fromProject') : t('fromUrl')}
        </button>
      </div>
      {hint && <p className="mt-1 text-sm text-ink-tertiary">{hint}</p>}

      {external ? (
        <div className="mt-3 space-y-3">
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

          {/* Shown as soon as it could be a picture, so a typo in a link is
              visible here rather than on the website. */}
          {isRemote(value) && (
            <Photo
              src={value}
              alt=""
              width={480}
              height={360}
              className="aspect-[4/3] w-full rounded-[var(--radius-sm)] object-cover"
            />
          )}
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {options.map((src) => {
            const chosen = src === value;
            return (
              <li key={src}>
                <button
                  type="button"
                  aria-pressed={chosen}
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
                    width={240}
                    height={180}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  {/* A tick as well as the ring. On four thumbnails of the same
                      room the ring alone is easy to lose, and this is the one
                      control whose whole job is to say which one is chosen. */}
                  {chosen && (
                    <span className="absolute end-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-accent text-on-accent">
                      <Check className="size-3" aria-hidden />
                    </span>
                  )}
                  <span className="sr-only">{src}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
