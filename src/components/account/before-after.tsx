'use client';

import { useTranslations } from 'next-intl';

import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/field';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { useStore } from '@/mock/store';
import type { Photo } from '@/mock/schema';

/**
 * The before-and-after pair for one job, and the consent that governs it.
 *
 * This was screen 47, a tab of its own listing every job the customer had ever
 * had. A gallery of pairs sorted by date is the wrong shape for the question
 * anyone actually arrives with — "how did *that* job turn out" — and it made
 * the customer match a date in a photo card against a date in their request
 * list to answer it. The photos belong to the job, so they live on the job.
 *
 * Publishing consent moves with them, and has to: §20.6 makes internal the
 * default, the gallery on the public site reads the same flag, and this switch
 * is the only place a customer can turn it back off. Leaving it behind on a
 * deleted screen would have been the one removal in this change with legal
 * weight.
 *
 * Renders nothing when the job has no photos. There is no empty state to write
 * here — a request that has not been carried out yet has no "before", and a
 * card explaining that on every open request would be noise on the screens
 * where the customer is waiting for a quote.
 */
export function BeforeAfter({ photos }: { photos: Photo[] }) {
  const t = useTranslations('account.photos');
  const patchData = useStore((s) => s.patchData);
  const allPhotos = useStore((s) => s.data.photos);

  const before = photos.filter((p) => p.kind === 'before');
  const after = photos.filter((p) => p.kind === 'after');
  if (before.length === 0 && after.length === 0) return null;

  const all = [...before, ...after];
  const consented = all.every((p) => p.publishConsent);

  return (
    <Card>
      <CardHeader title={t('title')} description={t('consentBody')} />
      <CardBody className="gap-app grid sm:grid-cols-2">
        {[
          { label: t('before'), items: before },
          { label: t('after'), items: after },
        ].map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-sm font-medium">{group.label}</p>
            {/* One side of a pair can be missing — the team photographed the
                room afterwards and not before, or the other way round. The
                placeholder keeps the two columns the same height, so a single
                photo does not read as a broken layout. */}
            {group.items.length === 0 ? (
              <ImagePlaceholder
                seed={group.label}
                alt={group.label}
                className="aspect-[4/3]"
              />
            ) : (
              group.items.map((photo) => (
                <ImagePlaceholder
                  key={photo.id}
                  seed={photo.id}
                  alt={photo.note ?? group.label}
                  className="aspect-[4/3]"
                />
              ))
            )}
          </div>
        ))}
      </CardBody>
      <CardFooter>
        <Checkbox
          label={t('consentLabel')}
          checked={consented}
          onChange={(e) =>
            patchData({
              photos: allPhotos.map((p) =>
                all.some((x) => x.id === p.id)
                  ? { ...p, publishConsent: e.target.checked }
                  : p,
              ),
            })
          }
        />
      </CardFooter>
    </Card>
  );
}
