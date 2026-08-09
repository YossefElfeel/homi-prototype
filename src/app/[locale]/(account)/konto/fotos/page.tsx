'use client';

import { useTranslations } from 'next-intl';
import { Images, Shield } from 'lucide-react';

import { useFormatter } from '@/i18n/format';
import { EmptyState } from '@/components/ui/empty-state';
import { Checkbox } from '@/components/ui/field';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useStore } from '@/mock/store';

/**
 * Screen 47 — before and after.
 *
 * Publishing consent lives here, next to the photos it governs, and it is off
 * unless the customer turns it on. §20.6 makes internal the default; the
 * gallery on the public site reads the same flag, so a photo cannot reach the
 * website without the customer having seen this switch.
 */
export default function AccountPhotosPage() {
  const t = useTranslations('account.photos');
  const format = useFormatter();
  const hydrated = useHydrated();

  const { photos, bookings } = useAccount();
  const patchData = useStore((s) => s.patchData);
  const allPhotos = useStore((s) => s.data.photos);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const pairs = bookings
    .map((booking) => ({
      booking,
      before: photos.filter((p) => p.bookingId === booking.id && p.kind === 'before'),
      after: photos.filter((p) => p.bookingId === booking.id && p.kind === 'after'),
    }))
    .filter((pair) => pair.before.length > 0 || pair.after.length > 0)
    .sort((a, b) => (a.booking.start < b.booking.start ? 1 : -1));

  return (
    <div className="max-w-4xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      {pairs.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Images}
          title={t('emptyTitle')}
          body={t('emptyBody')}
        />
      ) : (
        <>
          <div className="mt-8 flex gap-3 border-l-2 border-rule bg-sunken p-5">
            <Shield className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
            <div>
              <h2 className="font-medium">{t('consentTitle')}</h2>
              <p className="mt-1 max-w-[var(--measure)] text-sm text-ink-secondary">
                {t('consentBody')}
              </p>
            </div>
          </div>

          <ul className="mt-8 space-y-10">
            {pairs.map(({ booking, before, after }) => {
              const all = [...before, ...after];
              const consented = all.every((p) => p.publishConsent);
              return (
                <li key={booking.id}>
                  <h2 data-numeric className="label-type text-ink-tertiary">
                    {format.dateTime(new Date(booking.start), 'full')}
                  </h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {[
                      { label: t('before'), items: before },
                      { label: t('after'), items: after },
                    ].map((group) => (
                      <div key={group.label}>
                        <p className="mb-2 text-sm font-medium">{group.label}</p>
                        {group.items.length === 0 ? (
                          <ImagePlaceholder seed={`${booking.id}-${group.label}`} alt={group.label} className="aspect-[4/3]" />
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
                  </div>
                  <Checkbox
                    className="mt-4"
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
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
