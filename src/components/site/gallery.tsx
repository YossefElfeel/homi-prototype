'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { EmptyState } from '@/components/ui/empty-state';
import { useHydrated, useStore } from '@/mock/store';
import type { Photo } from '@/mock/schema';

interface Work {
  id: string;
  before: Photo;
  after: Photo;
}

/**
 * Screens 5 and 6 — the gallery grid and the expanded single work.
 *
 * §20.6: photos are internal by default and only appear here with recorded
 * written consent. So the empty state is not an edge case — it is the launch
 * state, and it has to explain *why* it is empty rather than look broken.
 */
export function Gallery() {
  const t = useTranslations('site.gallery');
  const hydrated = useHydrated();
  const photos = useStore((s) => s.data.photos);
  const [open, setOpen] = useState<Work | null>(null);

  const consented = hydrated ? photos.filter((p) => p.publishConsent) : [];
  const works: Work[] = [];
  for (const photo of consented) {
    if (photo.kind !== 'before' || !photo.bookingId) continue;
    const after = consented.find(
      (p) => p.bookingId === photo.bookingId && p.kind === 'after',
    );
    if (after) works.push({ id: photo.bookingId, before: photo, after });
  }

  if (works.length === 0) {
    return (
      <EmptyState
        title={t('emptyTitle')}
        body={t('emptyBody')}
        action={
          <Button asChild>
            <Link href="/anfrage">{t('emptyCta')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((work) => (
          <li key={work.id}>
            <button
              type="button"
              onClick={() => setOpen(work)}
              className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
            >
              <span className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] bg-line">
                <ImagePlaceholder
                  seed={`${work.id}-before`}
                  alt={`${t('before')} — ${work.before.note ?? ''}`}
                  className="aspect-square"
                />
                <ImagePlaceholder
                  seed={`${work.id}-after`}
                  alt={`${t('after')} — ${work.after.note ?? ''}`}
                  className="aspect-square"
                />
              </span>
              <span className="mt-3 flex items-center justify-between text-sm">
                <span className="text-ink-secondary">{work.before.note}</span>
                <span className="label-type text-ink-tertiary">
                  {t('before')} / {t('after')}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--brand-navy-900)]/85" />
          <Dialog.Content className="fixed inset-4 z-50 flex flex-col overflow-auto rounded-[var(--radius-lg)] bg-page p-6 sm:inset-8 lg:inset-16">
            <div className="flex items-start justify-between gap-6">
              <div>
                <Dialog.Title className="display-type text-2xl">
                  {open?.before.note ?? t('title')}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-ink-secondary">
                  {t('lead')}
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Schliessen"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-sunken"
              >
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>

            {open && (
              <div className="mt-6 grid flex-1 gap-4 lg:grid-cols-2">
                {(
                  [
                    [t('before'), open.before],
                    [t('after'), open.after],
                  ] as const
                ).map(([label, photo]) => (
                  <figure key={label} className="flex flex-col">
                    <ImagePlaceholder
                      seed={`${open.id}-${label}`}
                      alt={`${label} — ${photo.note ?? ''}`}
                      className="aspect-4/3 flex-1 rounded-[var(--radius-md)]"
                    />
                    <figcaption className="label-type mt-3 text-ink-tertiary">
                      {label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
