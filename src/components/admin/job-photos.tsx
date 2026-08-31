'use client';

import { useTranslations } from 'next-intl';
import { Camera } from 'lucide-react';

import { useFormatter } from '@/i18n/format';
import { BeforeAfter } from '@/components/site/before-after';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import type { Photo } from '@/mock/schema';

/**
 * How the job actually turned out, on the record that sold it.
 *
 * The office had two ways to see a finished job and neither was this one. The
 * public gallery shows only what a customer has released, so most work never
 * appears there at all; the customer's own «Vorher / Nachher» card is behind an
 * account nobody in the office can sign into. So the one screen that says what
 * was promised — the quote — could not show what was delivered, and answering
 * "did we do this properly?" meant asking the person who did it.
 *
 * The slider rather than two frames side by side, for the reason the site
 * component already gives: the claim is *this exact spot, changed*, and two
 * half-width frames a gutter apart make the reader do the alignment in their
 * head.
 *
 * **Read-only on purpose.** §20.6 puts publishing consent with the customer,
 * and `/konto/anfragen/[id]` is the only place it can be withdrawn. A switch
 * here would let the office release a customer's home to the public site on
 * their behalf, which is the one thing that rule exists to prevent. The chip
 * reports where consent stands; it does not move it.
 */
export function JobPhotos({
  photos,
  className,
}: {
  photos: Photo[];
  className?: string;
}) {
  const t = useTranslations('admin.jobPhotos');
  const format = useFormatter();

  /* Oldest first on each side, then zipped. Within one job the pairs are
     rooms, and a team that shot three befores and three afters shot them in
     the same order — sorting by time is what keeps the kitchen's "after" from
     landing on the bathroom's "before". */
  const byTime = (a: Photo, b: Photo) => a.takenAt.localeCompare(b.takenAt);
  const before = photos.filter((p) => p.kind === 'before').sort(byTime);
  const after = photos.filter((p) => p.kind === 'after').sort(byTime);

  const pairs = before
    .map((b, i) => ({ before: b, after: after[i] }))
    .filter((p): p is { before: Photo; after: Photo } => Boolean(p.after));

  /* A half that never got its partner. Shown rather than dropped: "the team
     photographed this before and never after" is a real thing that happens on
     a job, and silently hiding it would make the card claim the set is
     complete. */
  const singles = [
    ...before.slice(pairs.length).map((p) => ({ photo: p, label: t('before') })),
    ...after.slice(pairs.length).map((p) => ({ photo: p, label: t('after') })),
  ];

  return (
    <Card className={className}>
      <CardHeader title={t('title')} description={t('lead')} />

      {pairs.length === 0 && singles.length === 0 ? (
        /* The job is finished and nobody photographed it. That is worth saying
           out loud on the quote — it is the office's own record that is
           missing, and the body names who fills it rather than leaving the
           reader to guess. */
        <EmptyState
          compact
          className="mt-4"
          icon={Camera}
          title={t('emptyTitle')}
          body={t('emptyBody')}
        />
      ) : (
        <div className="gap-app mt-4 grid">
          {pairs.map(({ before: b, after: a }) => (
            <figure key={b.id} className="m-0">
              <BeforeAfter
                beforeSrc={b.src}
                afterSrc={a.src}
                alt={a.note ?? t('title')}
                beforeLabel={t('before')}
                afterLabel={t('after')}
                sliderLabel={`${t('compare')} — ${a.note ?? ''}`}
                sizes="(max-width: 1024px) 100vw, 640px"
                className="aspect-4/3 rounded-[var(--radius-md)]"
              />
              <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-ink-secondary">
                  {b.note ?? '—'}
                  <span data-numeric className="text-ink-tertiary">
                    {' · '}
                    {format.dateTime(new Date(a.takenAt), 'short')}
                  </span>
                </span>
                <Chip tone={a.publishConsent && b.publishConsent ? 'success' : 'neutral'}>
                  {a.publishConsent && b.publishConsent
                    ? t('consentReleased')
                    : t('consentInternal')}
                </Chip>
              </figcaption>
            </figure>
          ))}

          {singles.map(({ photo, label }) => (
            <figure key={photo.id} className="m-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.note ?? label}
                className="aspect-4/3 w-full rounded-[var(--radius-md)] object-cover"
              />
              <figcaption className="mt-2 text-sm text-ink-secondary">
                {t('unpaired', { side: label })}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </Card>
  );
}
