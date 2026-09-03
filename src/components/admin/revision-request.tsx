'use client';

import { useLocale, useTranslations } from 'next-intl';
import { MessageSquareWarning } from 'lucide-react';

import { useFormatter } from '@/i18n/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { elapsed } from '@/lib/elapsed';
import { cn } from '@/lib/cn';
import type { Locale } from '@/i18n/routing';
import type { Offer } from '@/mock/schema';

/**
 * What the customer asked us to change, on both screens that have to answer it.
 *
 * A quote in `revisionRequested` is the one state on either screen where the
 * ball is back with the office and the record says nothing about what to do
 * with it. Before this, the quote detail printed the note in a card *below the
 * lines table* and only when `revisionNote` happened to be set — so
 * `off_acc_revision`, which is seeded in that state with no note, opened on a
 * warning badge with no sentence anywhere on the page explaining it. The
 * request detail did not show it at all: no quote, no note, no way through.
 *
 * One component rather than two, because the two screens would otherwise
 * disagree about what a change request looks like the first time either is
 * touched — and they answer the same question with the same three facts.
 *
 * **The card renders on the state, never on the note.** That inversion is the
 * fix: a badge saying somebody objected, with nothing under it, is the failure
 * being reported. When the note is missing the card says so in words and
 * points at the phone, which is a screen telling the truth about its data
 * rather than one that has quietly gone blank.
 */
export function RevisionRequest({
  offer,
  customerName,
  now,
  action,
  className,
}: {
  offer: Offer;
  customerName?: string;
  now: Date;
  /** «Neue Version ausstellen» — the answer, next to the question. */
  action?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations('admin.revision');
  const reasonLabel = useTranslations('status.revisionReason');
  const locale = useLocale() as Locale;
  const format = useFormatter();

  /* No fallback to `issuedAt` on purpose. That is when *we* sent the quote,
     and on a fourteen-day validity it can be a fortnight off the answer to
     "how long has this been sitting with us" — the one question this line
     exists for. A record old enough not to carry the field shows no line at
     all, which is honest; a wrong date under «seit» is not. */
  const at = offer.revisionRequestedAt;

  /*
   * Whether this is still the open question or already the answered one — and
   * why the version number only survives in the first case.
   *
   * While the quote is `revisionRequested`, `offer.version` *is* the version
   * the customer objected to, so naming it tells the reader which document is
   * being argued about. A reissue then bumps it, and the same sentence started
   * claiming a change had been requested «zu Version 2» — the version written
   * to answer it. Nothing on the record says which version the objection was
   * against, so the answered card names none, and stops telling the office to
   * reply to something they have already replied to.
   */
  const open = offer.status === 'revisionRequested';

  return (
    /* The border, not a tint. The panel directly above this on the quote
       screen — «Termin bestätigen», the other thing waiting on the office —
       is a white card with a warning rule, and two states that mean the same
       thing («this one is yours to answer») must not be drawn two ways. */
    <Card className={cn('border-status-warning-line', className)}>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <MessageSquareWarning className="size-4 text-status-warning-fg" aria-hidden />
            {t('title')}
          </span>
        }
        description={
          open
            ? customerName
              ? t('lead', { name: customerName, version: offer.version })
              : t('leadNoName', { version: offer.version })
            : t('leadAnswered')
        }
        actions={action}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {offer.revisionReason && (
          <Chip tone="warning">{reasonLabel(offer.revisionReason)}</Chip>
        )}
        {at && (
          <span data-numeric className="text-xs text-ink-tertiary">
            {/* How long it has been waiting is a priority, and only an open
                question has one. On the answered card the same words would
                count up for ever beside a request that was dealt with — so
                once it is answered the line keeps the date and drops the
                clock. */}
            {open && `${t('since', { time: elapsed(at, now, locale) })} · `}
            {format.dateTime(new Date(at), 'short')},{' '}
            {format.dateTime(new Date(at), 'time')}
          </span>
        )}
      </div>

      {offer.revisionNote ? (
        /* Quoted rather than set as running text: it is the customer's wording,
           and on a screen the office is about to re-price from, the line
           between what they wrote and what we are saying about it has to be
           visible without reading either. */
        <blockquote className="mt-4 border-s-2 border-status-warning-line ps-4">
          <p className="max-w-[var(--measure)] whitespace-pre-line text-ink-secondary">
            {offer.revisionNote}
          </p>
        </blockquote>
      ) : (
        <p className="mt-4 max-w-[var(--measure)] text-sm text-ink-secondary">
          {t('noNote')}
        </p>
      )}
    </Card>
  );
}
