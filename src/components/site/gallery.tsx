'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { BeforeAfter } from '@/components/site/before-after';
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
 * written consent. So the empty state is not an edge case — it is what the
 * page shows the day nobody has signed one, and it has to explain *why* it is
 * empty rather than look broken. It is reached from the control that governs
 * it: a customer turning consent off in /konto/fotos empties this page.
 *
 * Each work is a slider rather than two frames side by side. See `BeforeAfter`
 * for why: half-width frames a gutter apart make the reader align the two
 * pictures themselves, which is the work the component is supposed to do.
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
    const after = consented.find((p) => p.bookingId === photo.bookingId && p.kind === 'after');
    if (after) works.push({ id: photo.bookingId, before: photo, after });
  }

  if (works.length === 0) {
    return (
      <EmptyState
        // Sits directly under the page title, with no section heading between.
        headingLevel={2}
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
        {works.map((work, i) => (
          <li key={work.id}>
            <BeforeAfter
              beforeSrc={work.before.src}
              afterSrc={work.after.src}
              alt={work.after.note ?? t('title')}
              beforeLabel={t('before')}
              afterLabel={t('after')}
              sliderLabel={`${t('compare')} — ${work.after.note ?? ''}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              // The first tile is above the fold on this page and was loading
              // lazily; the rest are not, and marking them all would have four
              // photographs competing for the same early bandwidth.
              priority={i === 0}
              className="aspect-4/3 rounded-[var(--radius-lg)]"
            />
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-sm text-ink-secondary">{work.before.note}</p>
              {/* A separate control, because the slider already owns every
                  pixel of the picture. A card that both slides and opens on
                  click would do the wrong one of the two every time. */}
              <button
                type="button"
                onClick={() => setOpen(work)}
                className="label-type shrink-0 text-ink-accent underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
              >
                {t('expand')}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog.Root open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--brand-navy-900)]/85" />
          <Dialog.Content className="fixed inset-4 z-50 flex flex-col overflow-auto rounded-[var(--radius-lg)] bg-page p-6 sm:inset-8 lg:inset-16">
            <div className="flex items-start justify-between gap-6">
              <div>
                <Dialog.Title className="subhead-type text-2xl">
                  {open?.before.note ?? t('title')}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-ink-secondary">
                  {t('compareHint')}
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label={t('close')}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-sunken"
              >
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>

            {open && (
              <BeforeAfter
                beforeSrc={open.before.src}
                afterSrc={open.after.src}
                alt={open.after.note ?? t('title')}
                beforeLabel={t('before')}
                afterLabel={t('after')}
                sliderLabel={`${t('compare')} — ${open.after.note ?? ''}`}
                sizes="(max-width: 1024px) 92vw, 80vw"
                className="mt-6 min-h-0 flex-1 rounded-[var(--radius-md)]"
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
