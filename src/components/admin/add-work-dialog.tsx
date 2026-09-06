'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import type { Locale } from '@/i18n/routing';
import { useFormatter } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, Input, Select } from '@/components/ui/field';
import { BLOG_IMAGES } from '@/lib/blog';
import { cn } from '@/lib/cn';
import { useNow, useStore } from '@/mock/store';

/**
 * «Referenz hinzufügen» — the door the gallery screen did not have.
 *
 * Photographs reached this app one way: the crew, through the field screens.
 * That is the right default and it was the *only* door, so the office could
 * switch a reference off and never put one on. A gallery you can only subtract
 * from is not a gallery you can build a page with.
 *
 * The booking is required and it is the whole point. A work needs a job behind
 * it or the public grid has no service to file it under and no date to sort it
 * by — and a "reference" with no job behind it is a stock photograph, which is
 * the one thing /referenzen exists not to be.
 *
 * Only jobs that have finished and have no pair yet are offered. Anything else
 * is either a work that already exists — the list behind this dialog is where
 * that is edited — or a job that has not happened.
 */
export function AddWorkDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('admin.gallery');
  const actionsT = useTranslations('actions');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const now = useNow();

  const bookings = useStore((s) => s.data.bookings);
  const photos = useStore((s) => s.data.photos);
  const customers = useStore((s) => s.data.customers);
  const services = useStore((s) => s.services);
  const addWork = useStore((s) => s.addWork);

  const [bookingId, setBookingId] = useState('');
  const [before, setBefore] = useState(BLOG_IMAGES[0] ?? '');
  const [after, setAfter] = useState(BLOG_IMAGES[1] ?? '');
  const [note, setNote] = useState('');

  /*
   * A job is a candidate when the work is *done* and it has no pair yet.
   *
   * Done is three statuses, not one. `closed` is the end of the money — after
   * the invoice is settled — and filtering on it alone left two candidates in
   * the whole seed, both already photographed, so «Referenz hinzufügen» opened
   * on «every finished job already has one» and the flow could not be reached
   * at all. A job that is `completed` or `invoiced` has been carried out; the
   * photograph is of the work, not of the payment.
   *
   * Offering a job that already has a pair would let somebody create a second
   * «before» on one booking, and `pairWorks` takes the first it finds — so the
   * gallery would show one of two pictures, chosen by array order.
   */
  const candidates = useMemo(() => {
    const paired = new Set(
      photos.filter((p) => p.kind === 'before' && p.bookingId).map((p) => p.bookingId),
    );
    return bookings
      .filter(
        (b) =>
          (b.status === 'completed' || b.status === 'invoiced' || b.status === 'closed') &&
          !paired.has(b.id),
      )
      .sort((a, b) => b.start.localeCompare(a.start));
  }, [bookings, photos]);

  const chosen = candidates.find((b) => b.id === bookingId);
  const complete = Boolean(chosen && before && after && before !== after);

  function labelFor(id: string) {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return id;
    const customer = customers.find((c) => c.id === booking.customerId);
    const service = services.find((s) => s.slug === booking.serviceSlug);
    return [
      service ? (service.name[locale] ?? service.name.de) : booking.serviceSlug,
      customer ? `${customer.firstName} ${customer.lastName}` : null,
      format.dateTime(new Date(booking.start), 'short'),
    ]
      .filter(Boolean)
      .join(' · ');
  }

  function submit() {
    if (!chosen) return;
    addWork({ bookingId: chosen.id, before, after, note: note.trim() || undefined }, now);
    toast.success(t('addDone'));
    onOpenChange(false);
    setBookingId('');
    setNote('');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addTitle')}</DialogTitle>
          <DialogDescription>{t('addBody')}</DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          /* Not an error and not an empty dropdown. Every finished job already
             has a reference, which is a good state and reads as a broken form
             unless it says so. */
          <p className="text-ink-secondary">{t('addNoCandidates')}</p>
        ) : (
          <div className="space-y-5">
            <Field label={t('addBooking')} hint={t('addBookingHint')}>
              {(props) => (
                <Select
                  {...props}
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                >
                  <option value="">{t('addBookingPlaceholder')}</option>
                  {candidates.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {labelFor(booking.id)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            {/* Two pickers with a live preview under each. Choosing a picture
                from a list of paths and finding out what it was after saving
                is how the wrong image ends up on the marketing site. */}
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['before', before, setBefore],
                  ['after', after, setAfter],
                ] as const
              ).map(([half, value, set]) => (
                <Field key={half} label={t(half)}>
                  {(props) => (
                    <div className="space-y-2">
                      <Select {...props} value={value} onChange={(e) => set(e.target.value)}>
                        {BLOG_IMAGES.map((src) => (
                          <option key={src} value={src}>
                            {src}
                          </option>
                        ))}
                      </Select>
                      <Image
                        src={value}
                        alt=""
                        width={320}
                        height={240}
                        className={cn(
                          'aspect-[4/3] w-full rounded-[var(--radius-sm)] object-cover',
                          before === after && 'opacity-50',
                        )}
                      />
                    </div>
                  )}
                </Field>
              ))}
            </div>

            {before === after && (
              <p className="text-sm text-status-danger-fg">{t('addSameImage')}</p>
            )}

            <Field label={t('addNote')} hint={t('addNoteHint')}>
              {(props) => (
                <Input {...props} value={note} onChange={(e) => setNote(e.target.value)} />
              )}
            </Field>

            <p className="rounded-[var(--radius-sm)] bg-sunken px-3 py-2 text-sm text-ink-secondary">
              {t('addConsentNote')}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {actionsT('cancel')}
          </Button>
          <Button disabled={!complete} onClick={submit}>
            {t('addAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
