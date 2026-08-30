'use client';

import { useTranslations } from 'next-intl';
import { Images, Shield } from 'lucide-react';

import { useFormatter } from '@/i18n/format';
import { Alert } from '@/components/ui/alert';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Checkbox } from '@/components/ui/field';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useStore } from '@/mock/store';

/**
 * Screen 47 — before and after.
 *
 * Publishing consent lives here, next to the photos it governs, and it is off
 * unless the customer turns it on. §20.6 makes internal the default; the
 * gallery on the public site reads the same flag, so a photo cannot reach the
 * website without the customer having seen this switch.
 *
 * Each visit is a card, and the consent switch is that card's footer rather
 * than a checkbox floating under four loose images. The switch decides whether
 * those photos go on a public website — it has to be unambiguous which ones it
 * governs, and `space-y-10` between visits was the only thing saying so.
 */
export default function AccountPhotosPage() {
  const t = useTranslations('account.photos');
  const format = useFormatter();
  const hydrated = useHydrated();

  const { photos, bookings } = useAccount();
  const patchData = useStore((s) => s.patchData);
  const allPhotos = useStore((s) => s.data.photos);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const pairs = bookings
    .map((booking) => ({
      booking,
      before: photos.filter((p) => p.bookingId === booking.id && p.kind === 'before'),
      after: photos.filter((p) => p.bookingId === booking.id && p.kind === 'after'),
    }))
    .filter((pair) => pair.before.length > 0 || pair.after.length > 0)
    .sort((a, b) => (a.booking.start < b.booking.start ? 1 : -1));

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} />

      {pairs.length === 0 ? (
        <EmptyState icon={Images} title={t('emptyTitle')} body={t('emptyBody')} />
      ) : (
        <>
          <Alert
            tone="info"
            icon={Shield}
            className="mb-app-section"
            title={t('consentTitle')}
          >
            {t('consentBody')}
          </Alert>

          <ul className="space-y-app-section">
            {pairs.map(({ booking, before, after }) => {
              const all = [...before, ...after];
              const consented = all.every((p) => p.publishConsent);
              return (
                <li key={booking.id}>
                  <Card>
                    <CardHeader
                      title={
                        <span data-numeric>
                          {format.dateTime(new Date(booking.start), 'full')}
                        </span>
                      }
                    />
                    <CardBody className="gap-app grid sm:grid-cols-2">
                      {[
                        { label: t('before'), items: before },
                        { label: t('after'), items: after },
                      ].map((group) => (
                        <div key={group.label}>
                          <p className="mb-2 text-sm font-medium">{group.label}</p>
                          {group.items.length === 0 ? (
                            <ImagePlaceholder
                              seed={`${booking.id}-${group.label}`}
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
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
