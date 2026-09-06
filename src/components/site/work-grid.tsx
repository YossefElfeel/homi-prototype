'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { altFor, photosIn, type WorkPhoto } from '@/content/bau';
import { useHydrated, useStore } from '@/mock/store';
import type { Locale } from '@/i18n/routing';

/**
 * The construction portfolio grid, one instance per trade.
 *
 * Not `Gallery`. That component is a before-and-after slider over store photos
 * whose whole subject is consent — it pages, it has an empty state that
 * explains why nobody has signed one, and it joins each pair to the booking it
 * came from. None of that applies to a fixed set of the company's own
 * photographs, and reusing it would have meant threading a "no consent needed"
 * flag through every one of those decisions.
 *
 * The lightbox exists because the source images are phone photographs of
 * ceilings — the subject is above the photographer, so the detail that sells
 * the work (a cove edge, a bevel, a joint) is small in the frame and lost at
 * grid size.
 */
export function WorkGrid({ group }: { group: string }) {
  /*
   * The live portfolio, seed-first.
   *
   * The office decides which pictures lead and in what order (§22), so this
   * reads the record rather than the file — the same way `Gallery` reads the
   * consented photos next door. Before hydration it falls back to the file, so
   * the server renders the real page instead of a gap that fills in: these are
   * twenty-two images above the fold on the one page that is entirely
   * photographs.
   */
  const hydrated = useHydrated();
  const stored = useStore((s) => s.data.construction);

  const photos: WorkPhoto[] = hydrated
    ? stored
        .filter((p) => p.group === group && p.visible)
        .sort((a, b) => a.order - b.order)
        .map((p) => ({
          slug: p.slug,
          group: p.group as WorkPhoto['group'],
          width: p.width,
          height: p.height,
          alt: { de: p.alt.de ?? '', en: p.alt.en ?? '' },
        }))
    : photosIn(group as WorkPhoto['group']);

  const t = useTranslations('site.bau');
  const locale = useLocale() as Locale;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const step = useCallback(
    (by: number) =>
      setOpenIndex((i) => (i === null ? null : (i + by + photos.length) % photos.length)),
    [photos.length],
  );

  const open = openIndex === null ? null : photos[openIndex];

  /* A group whose pictures were all taken down renders nothing — the section
     heading above it is the page's, and an empty grid under a heading reads as
     a load that failed. */
  if (photos.length === 0) return null;

  return (
    <>
      {/* Mixed orientations — portrait ceilings next to landscape gardens — so
          every tile is the same square and the photograph is cropped to it.
          Letting each tile take its own aspect ratio gave a column of ragged
          heights that read as a broken layout rather than a portfolio. */}
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {photos.map((photo, i) => (
          <li key={photo.slug}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group relative block aspect-square w-full overflow-hidden rounded-[var(--radius-lg)] bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
            >
              <Image
                src={`/construction/${photo.slug}.jpg`}
                alt={altFor(photo, locale)}
                fill
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root open={open !== null} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--brand-navy-900)]/85" />
          <Dialog.Content className="fixed inset-4 z-50 flex flex-col rounded-[var(--radius-lg)] bg-page p-4 sm:inset-8 sm:p-6 lg:inset-16">
            <div className="flex items-start justify-between gap-6">
              {/* The alt text is the caption. One sentence describing the work
                  serves the screen reader and the person looking at a ceiling
                  they cannot name — writing it twice would have let the two
                  drift apart. */}
              <Dialog.Title className="max-w-[var(--measure)] text-sm text-ink-secondary">
                {open ? altFor(open, locale) : ''}
              </Dialog.Title>
              <Dialog.Close
                aria-label={t('close')}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-sunken"
              >
                <X className="size-4" aria-hidden />
              </Dialog.Close>
            </div>

            {open && (
              <div className="relative mt-4 min-h-0 flex-1">
                <Image
                  src={`/construction/${open.slug}.jpg`}
                  alt=""
                  fill
                  sizes="90vw"
                  className="object-contain"
                />
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-2">
              <LightboxStep label={t('previous')} onClick={() => step(-1)}>
                <ChevronLeft className="size-4" aria-hidden />
              </LightboxStep>
              <span data-numeric className="min-w-24 text-center text-sm text-ink-tertiary">
                {t('counter', { n: (openIndex ?? 0) + 1, total: photos.length })}
              </span>
              <LightboxStep label={t('next')} onClick={() => step(1)}>
                <ChevronRight className="size-4" aria-hidden />
              </LightboxStep>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function LightboxStep({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-line-subtle transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
    >
      {children}
    </button>
  );
}
