import type { Booking, Photo } from '@/mock/schema';

/**
 * What counts as a piece of work on /work, in one place.
 *
 * The rule lived inside the public gallery component, which was fine while the
 * gallery was the only thing that knew it. It is not any more: the office needs
 * the same list to decide what may be shown, and a second copy of "a work is a
 * before and an after on the same booking" is how the two screens end up
 * disagreeing about how many pieces of work exist.
 *
 * Note what a work is *not*: a photograph. `context` shots — the ones the crew
 * take of a locked door or a damaged worktop — never pair, and a gallery built
 * from loose photos would put a picture of somebody's broken cupboard on the
 * marketing site.
 */

export interface Work {
  /** The booking is the identity. One job, one piece of work. */
  bookingId: string;
  before: Photo;
  after: Photo;
  serviceSlug: string | undefined;
  customerId: string | undefined;
  takenAt: string;
}

/**
 * Every before/after pair, whatever its consent.
 *
 * Consent is deliberately *not* filtered here. The public gallery wants only
 * released work and the panel wants to see what is waiting for a release —
 * folding the filter into the pairing would leave the office with no way to
 * ask "what could we show if we asked?".
 */
export function pairWorks(photos: Photo[], bookings: Booking[]): Work[] {
  const out: Work[] = [];

  for (const photo of photos) {
    if (photo.kind !== 'before' || !photo.bookingId) continue;
    const after = photos.find((p) => p.bookingId === photo.bookingId && p.kind === 'after');
    if (!after) continue;

    const booking = bookings.find((b) => b.id === photo.bookingId);
    out.push({
      bookingId: photo.bookingId,
      before: photo,
      after,
      serviceSlug: booking?.serviceSlug,
      customerId: booking?.customerId,
      takenAt: photo.takenAt,
    });
  }

  /* Newest first. The gallery pages from the top and the panel reads it as a
     queue of things to ask about, and both want the recent job first. */
  return out.sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

/**
 * Whether both halves may be shown.
 *
 * Both, not either. §20.6 governs the photograph, so a released "after" beside
 * an unreleased "before" is not a half-published work — it is one photograph
 * published without permission, and the pair is the unit the customer agreed
 * to.
 */
export function isReleased(work: Work): boolean {
  return work.before.publishConsent && work.after.publishConsent;
}

export function releasedWorks(photos: Photo[], bookings: Booking[]): Work[] {
  return pairWorks(photos, bookings).filter(isReleased);
}

/**
 * Photographs that cannot become a work, and why.
 *
 * The panel shows these so the answer to «warum ist der Einsatz nicht in den
 * Referenzen?» is on the screen rather than a shrug. Two honest reasons: it is
 * a `context` shot that was never meant for the site, or its partner was never
 * taken.
 */
export interface Unpairable {
  photo: Photo;
  reason: 'context' | 'noPartner';
}

export function unpairablePhotos(photos: Photo[]): Unpairable[] {
  const out: Unpairable[] = [];

  for (const photo of photos) {
    if (photo.kind === 'context') {
      out.push({ photo, reason: 'context' });
      continue;
    }
    if (!photo.bookingId) {
      out.push({ photo, reason: 'noPartner' });
      continue;
    }
    const wanted = photo.kind === 'before' ? 'after' : 'before';
    const partner = photos.find((p) => p.bookingId === photo.bookingId && p.kind === wanted);
    if (!partner) out.push({ photo, reason: 'noPartner' });
  }

  return out;
}
