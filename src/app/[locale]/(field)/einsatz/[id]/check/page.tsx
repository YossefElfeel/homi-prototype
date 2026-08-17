'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Camera, Check, Trash2 } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { BottomActionBar, BottomActionBarSpacer } from '@/components/ui/bottom-action-bar';
import { SkeletonPage } from '@/components/ui/skeleton';
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
  const hydrated = useHydrated();
  const now = useNow();

  const bookings = useStore((s) => s.data.bookings);
  const recordCheck = useStore((s) => s.recordCheck);

  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [extraHours, setExtraHours] = useState('');
  const [done, setDone] = useState<'in' | 'out' | null>(null);

  if (!hydrated) return <SkeletonPage label={t('inTitle')} />;

  const booking = bookings.find((b) => b.id === id);
  if (!booking) return <p className="py-10 text-ink-tertiary">—</p>;

  const checkingOut = Boolean(booking.checkInAt);
  const missing = Math.max(0, MIN_PHOTOS - photos.length);
  // Check-in needs a start time, not a portfolio; check-out needs the pair.
  const blocked = checkingOut && missing > 0;

  function confirm() {
    if (!booking) return;
    const kind = checkingOut ? ('out' as const) : ('in' as const);

    /*
     * This used to write only the timestamp and the status: the three photos
     * the screen had just insisted on, the note and the reported extra hours
     * were all dropped on navigate.
     */
    recordCheck(
      booking.id,
      {
        kind,
        photos,
        note,
        extraHours: extraHours.trim() ? Number(extraHours) : null,
      },
      now,
    );
    /* The confirmation copy (doneInTitle / doneOutTitle / doneOutBody) was
       written and translated in every locale, and no screen rendered it —
       check-out bounced straight back to the job with no acknowledgement that
       anything had been recorded. */
    setDone(kind);
  }

  if (done) {
    return (
      <div className="py-10">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-status-success text-status-success-fg">
          <Check className="size-6" aria-hidden />
        </span>
        <h1 className="display-type mt-6 text-2xl">
          {done === 'in'
            ? t('doneInTitle', { time: format.dateTime(now, 'time') })
            : t('doneOutTitle', { time: format.dateTime(now, 'time') })}
        </h1>
        <p className="mt-3 text-ink-secondary">
          {done === 'out' ? t('doneOutBody') : t('doneInBody')}
        </p>
        <div className="mt-8 space-y-3">
          <Button asChild block>
            <Link href={`/einsatz/${booking.id}`}>{t('backToJob')}</Link>
          </Button>
          <Button asChild block variant="secondary">
            <Link href="/einsatz">{t('backToDay')}</Link>
          </Button>
        </div>
      </div>
    );
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

      {/* Reserves the height the fixed bar covers — the note field used to sit
          permanently underneath it on a short screen. */}
      <BottomActionBarSpacer />

      <BottomActionBar visibility="always" className="mx-auto max-w-[26rem]">
        <Button block size="lg" disabled={blocked} onClick={confirm}>
          <Check className="size-4" aria-hidden />
          {checkingOut ? t('confirmOut') : t('confirmIn')}
        </Button>
      </BottomActionBar>
    </div>
  );
}
