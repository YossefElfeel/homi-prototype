'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarCheck, Clock } from 'lucide-react';

import { useFormatter } from '@/i18n/format';
import { HOLD_MINUTES, holdSecondsLeft } from '@/mock/engines/availability';
import { CONFIRMED_HOLD_HOURS } from '@/lib/offer-facts';
import { useStore } from '@/mock/store';
import type { SlotHold } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * The 15-minute slot hold.
 *
 * This exists because the client replaced the three fixed proposals with a
 * live picker. That is friendlier, and it makes the §20.2 race — two customers
 * choosing the same time while both are paying — much more likely. The hold is
 * what stops it, and the countdown is what makes the hold honest rather than
 * a silent server-side rule.
 *
 * It ticks against the real clock rather than counting down from a stored
 * number, so a backgrounded tab cannot hold a slot indefinitely.
 */
export function HoldTimer({
  hold,
  onExpire,
  className,
}: {
  hold: SlotHold;
  onExpire?: () => void;
  className?: string;
}) {
  const t = useTranslations('offer.slot');
  const format = useFormatter();
  const dateOverride = useStore((s) => s.demo.dateOverride);
  const [seconds, setSeconds] = useState(() =>
    holdSecondsLeft(hold, dateOverride ? new Date(dateOverride) : new Date()),
  );

  useEffect(() => {
    const id = setInterval(() => {
      const now = dateOverride ? new Date(dateOverride) : new Date();
      setSeconds(holdSecondsLeft(hold, now));
    }, 1000);
    return () => clearInterval(id);
  }, [hold, dateOverride]);

  useEffect(() => {
    if (seconds === 0) onExpire?.();
  }, [seconds, onExpire]);

  /*
   * A date the office confirmed is not a checkout timer.
   *
   * Rendering it as one would print "2879:41" and put a stopwatch on a
   * decision that has already been made — the customer chose, we agreed, and
   * the only thing left is signing. So it says what the reservation is and
   * until when, and counts nothing down.
   */
  if (hold.confirmed) {
    return (
      <div
        className={cn(
          'flex gap-3 rounded-[var(--radius-md)] border border-status-success-line bg-status-success p-4',
          className,
        )}
      >
        <CalendarCheck className="mt-0.5 size-4 shrink-0 text-status-success-fg" aria-hidden />
        <div>
          <p className="font-medium text-status-success-fg">{t('confirmedTitle')}</p>
          <p className="mt-1 text-sm text-status-success-fg">
            {t('confirmedBody', {
              date: `${format.dateTime(new Date(hold.start), 'full')}, ${format.dateTime(new Date(hold.start), 'time')}`,
              hours: CONFIRMED_HOLD_HOURS,
            })}
          </p>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const formatted = `${minutes}:${String(rest).padStart(2, '0')}`;
  const urgent = seconds > 0 && seconds <= 120;

  return (
    <div
      className={cn(
        'flex gap-3 rounded-[var(--radius-md)] border p-4',
        urgent
          ? 'border-status-warning-line bg-status-warning'
          : 'border-line bg-sunken',
        className,
      )}
      // Announced only when it becomes urgent, so a screen reader is not told
      // the time every second.
      aria-live={urgent ? 'polite' : 'off'}
    >
      <Clock
        className={cn('mt-0.5 size-4 shrink-0', urgent ? 'text-status-warning-fg' : 'text-ink-secondary')}
        aria-hidden
      />
      <div>
        <p className={cn('font-medium', urgent && 'text-status-warning-fg')}>
          {t('holdTitle')}
        </p>
        <p
          className={cn('mt-1 text-sm', urgent ? 'text-status-warning-fg' : 'text-ink-secondary')}
        >
          {t('holdBody', { minutes: HOLD_MINUTES })}{' '}
          <strong data-numeric className="font-semibold">
            {t('holdRemaining', { time: formatted })}
          </strong>
        </p>
      </div>
    </div>
  );
}
