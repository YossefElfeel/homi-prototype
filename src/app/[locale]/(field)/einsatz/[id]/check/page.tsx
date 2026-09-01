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
import { hoursOf, isValidWorkHours, MAX_WORK_HOURS } from '@/lib/workforce';

/** §4.2 — the report is only useful if it is comparable. */
const MIN_PHOTOS = 3;

/**
 * The clock's own answer, rounded to the half hour — or the estimate when the
 * clock is not answering sensibly.
 *
 * Nobody standing in a hallway types 4.7. Rounding to the granularity the
 * field is stepped in is what makes the prefilled value something to confirm
 * rather than something to correct — and half an hour is also the smallest
 * unit §5.3 is ever going to argue about.
 *
 * The fallback is not defensive coding. A check-in nobody checked out of stays
 * open, so opening this screen the next morning reads twenty-six hours — which
 * fails the field's own validation and greets the contractor with an error
 * against a number they did not type. The planned duration is the honest
 * opening bid there: it is what the job was thought to be, and it is something
 * to correct rather than something to clear first.
 */
function elapsedHours(from: string | undefined, to: Date, fallbackMinutes: number) {
  if (!from) return hoursOf(fallbackMinutes);
  const minutes = (to.getTime() - new Date(from).getTime()) / 60_000;
  const rounded = Math.round((minutes / 60) * 2) / 2;
  return isValidWorkHours(rounded) ? rounded : hoursOf(fallbackMinutes);
}

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
 * Time is recorded, never charged here. The contractor reports what happened;
 * §5.3 leaves the money decision with the office, and a field screen that
 * could raise an invoice would put that decision on a doorstep.
 *
 * What is reported changed with this wave: the field asked for the *extra*
 * hours, which made the person in the stairwell subtract the estimate from
 * their own afternoon, and left the number the office actually approves —
 * how long the job took — on no record at all. It asks for the hours worked
 * now, opens on the reading off the clock since check-in, and the office
 * derives the overrun. Required rather than optional, because a check-out
 * with no time on it is the one the office has to phone about.
 */
export default function FieldCheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('field.check');
  const format = useFormatter();
  const hydrated = useHydrated();
  const now = useNow();

  const bookings = useStore((s) => s.data.bookings);
  const memberId = useStore((s) => s.demo.currentMemberId);
  const recordCheck = useStore((s) => s.recordCheck);

  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState('');
  /*
   * Null until the screen knows whether it is a check-out and what the clock
   * says — the booking is not resolved yet at this point, and an initialiser
   * that guessed would have to guess again once it was. `??` below fills it
   * the first time it is read, and any keystroke after that wins.
   */
  const [hours, setHours] = useState<string | null>(null);
  const [done, setDone] = useState<'in' | 'out' | null>(null);

  if (!hydrated) return <SkeletonPage label={t('inTitle')} />;

  const booking = bookings.find((b) => b.id === id);
  if (!booking) return <p className="py-10 text-ink-tertiary">—</p>;

  const checkingOut = Boolean(booking.checkInAt);
  const missing = Math.max(0, MIN_PHOTOS - photos.length);
  const suggested = elapsedHours(booking.checkInAt, now, booking.duration);
  const hoursValue = hours ?? String(suggested);
  const hoursOk = isValidWorkHours(Number(hoursValue));
  /* Check-in needs a start time, not a portfolio; check-out needs the pair —
     and the hours, which the office prices the job off and cannot derive from
     anything else on the record. */
  const blocked = checkingOut && (missing > 0 || !hoursOk);

  function confirm() {
    if (!booking) return;
    const kind = checkingOut ? ('out' as const) : ('in' as const);

    /*
     * This used to write only the timestamp and the status: the three photos
     * the screen had just insisted on, the note and the reported hours were
     * all dropped on navigate.
     */
    recordCheck(
      booking.id,
      {
        kind,
        photos,
        note,
        hours: kind === 'out' ? Number(hoursValue) : null,
        /* Who is standing here, not who the office wrote down. They are the
           same on every honest path — and when they are not, the hours belong
           to the person who worked them. */
        memberId,
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
          <h2 className="label-type text-ink-tertiary">{t('hoursTitle')}</h2>
          {/* The estimate, said out loud beside the box. Without it the number
              is a figure typed into a void; with it, the person who took two
              hours longer than planned can see that they did, which is the
              moment the note field is worth filling in. */}
          <p data-numeric className="mt-1 text-sm text-ink-secondary">
            {t('hoursPlanned', { hours: booking.duration / 60 })}
          </p>
          <Field
            label={t('hoursLabel')}
            hint={t('hoursHint')}
            error={hoursOk ? undefined : t('hoursInvalid', { max: MAX_WORK_HOURS })}
            className="mt-3"
          >
            {(props) => (
              <Input
                type="number"
                step={0.5}
                min={0.5}
                max={MAX_WORK_HOURS}
                inputMode="decimal"
                value={hoursValue}
                onChange={(e) => setHours(e.target.value)}
                {...props}
              />
            )}
          </Field>
          <p className="mt-2 text-sm text-ink-tertiary">{t('hoursSuggested')}</p>
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
