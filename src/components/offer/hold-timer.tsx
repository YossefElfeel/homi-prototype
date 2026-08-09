'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';

import { HOLD_MINUTES, holdSecondsLeft } from '@/mock/engines/availability';
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
