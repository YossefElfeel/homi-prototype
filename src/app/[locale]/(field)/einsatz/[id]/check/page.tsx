'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Camera, Check, Trash2 } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { useHydrated, useNow, useStore } from '@/mock/store';

/** §4.2 — the report is only useful if it is comparable. */
const MIN_PHOTOS = 3;

/**
 * Screen 87 — checking in and out.
 *
 * One route, two states, because they are the same act at two ends of a job
 * and splitting them would duplicate the photo rules.
 *
 * The photo minimum is enforced on check-out, not requested. §4.2 makes the
 * before/after pair the evidence behind the handover guarantee, and a job
 * finished without it cannot be defended when a customer disputes it a week
 * later.
 *
 * Extra time is recorded, never charged here. The contractor reports what
 * happened; §5.3 leaves the money decision with the office, and a field screen
 * that could raise an invoice would put that decision on a doorstep.
 */
export default function FieldCheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('field.check');
  const format = useFormatter();
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const bookings = useStore((s) => s.data.bookings);
  const patchData = useStore((s) => s.patchData);

  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [extraHours, setExtraHours] = useState('');

  if (!hydrated) return <p className="py-10 text-ink-tertiary">…</p>;

  const booking = bookings.find((b) => b.id === id);
  if (!booking) return <p className="py-10 text-ink-tertiary">—</p>;

  const checkingOut = Boolean(booking.checkInAt);
  const missing = Math.max(0, MIN_PHOTOS - photos.length);
  // Check-in needs a start time, not a portfolio; check-out needs the pair.
  const blocked = checkingOut && missing > 0;

  function confirm() {
    if (!booking) return;
    patchData({
      bookings: bookings.map((b) =>
        b.id === booking.id
          ? checkingOut
            ? { ...b, checkOutAt: now.toISOString(), status: 'awaitingApproval' as const }
            : { ...b, checkInAt: now.toISOString(), status: 'inProgress' as const }
          : b,
      ),
    });
    router.push(`/einsatz/${booking.id}`);
  }

  return (
    <div className="py-6">
      <Button asChild variant="link" className="mb-4">
        <Link href={`/einsatz/${booking.id}`}>
          <ArrowLeft className="size-4" aria-hidden />
          {t('backToJob')}
        </Link>
      </Button>

      <h1 className="display-type text-2xl">
        {checkingOut ? t('outTitle') : t('inTitle')}
      </h1>
      <p className="mt-2 text-ink-secondary">{checkingOut ? t('outLead') : t('inLead')}</p>
      <p data-numeric className="mt-4 text-lg">
        {t('timeNow', { time: format.dateTime(now, 'time') })}
      </p>

      <section className="mt-8">
        <h2 className="label-type text-ink-tertiary">{t('photosTitle')}</h2>
        <p className="mt-1 text-sm font-medium">
          {checkingOut
            ? t('photosAfter', { n: MIN_PHOTOS })
            : t('photosBefore', { n: MIN_PHOTOS })}
        </p>
        <p className="mt-1 text-sm text-ink-tertiary">{t('photosHint')}</p>

        {photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <li key={photo} className="relative">
                <ImagePlaceholder seed={photo} alt={photo} className="aspect-square" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((p) => p !== photo))}
                  aria-label={t('remove')}
                  className="absolute end-1 top-1 inline-flex size-8 items-center justify-center rounded-full bg-page/90 text-ink transition-colors hover:bg-page"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        <Button
          variant="secondary"
          className="mt-4 w-full"
          onClick={() => setPhotos([...photos, `pho_${booking.id}_${photos.length + 1}`])}
        >
          <Camera className="size-4" aria-hidden />
          {t('addPhoto')}
        </Button>
        <p className="mt-2 text-sm text-ink-tertiary">{t('photoDemo')}</p>

        {blocked && (
          <p className="mt-3 text-sm text-status-danger-fg">
            {t('photosMissing', { n: missing })}
          </p>
        )}
      </section>

      {checkingOut && (
        <section className="mt-8">
          <h2 className="label-type text-ink-tertiary">{t('extraTitle')}</h2>
          <Field label={t('extraLabel')} hint={t('extraHint')} className="mt-2" optional>
            {(props) => (
              <Input
                type="number"
                step={0.5}
                min={0}
                inputMode="decimal"
                value={extraHours}
                onChange={(e) => setExtraHours(e.target.value)}
                {...props}
              />
            )}
          </Field>
        </section>
      )}

      <Field label={t('noteLabel')} hint={t('noteHint')} className="mt-8" optional>
        {(props) => (
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            {...props}
          />
        )}
      </Field>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[26rem] border-t border-line-subtle bg-page/95 px-5 py-4 backdrop-blur-sm">
        <Button className="w-full" disabled={blocked} onClick={confirm}>
          <Check className="size-4" aria-hidden />
          {checkingOut ? t('confirmOut') : t('confirmIn')}
        </Button>
      </div>
    </div>
  );
}
