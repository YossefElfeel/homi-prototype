'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Timer } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow } from '@/mock/store';

/**
 * Screen 44 — the hour credit.
 *
 * The expiry warning fires at 90 days, not at 7. §11.3 gives credit a twelve
 * month life, and using up six hours takes planning — a week's notice is not
 * enough to spend it, which makes a late warning worse than none.
 */
export default function AccountCreditPage() {
  const t = useTranslations('account.credit');
  const format = useFormatter();
  const hydrated = useHydrated();
  const now = useNow();

  const { credits } = useAccount();

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const credit = credits[0];

  if (!credit || credit.hoursRemaining <= 0) {
    return (
      <>
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <EmptyState
          className="mt-8"
          icon={Timer}
          title={t('emptyTitle')}
          body={t('emptyBody')}
          action={
            <Button asChild variant="secondary">
              <Link href="/abos">{t('emptyAction')}</Link>
            </Button>
          }
        />
      </>
    );
  }

  const daysLeft = Math.ceil((new Date(credit.expiresAt).getTime() - now.getTime()) / 86_400_000);

  return (
    <div>
      <h1 className="display-type text-3xl">{t('title')}</h1>

      <div className="surface-card mt-8 p-6">
        <p className="label-type text-ink-tertiary">{t('remaining')}</p>
        <p data-numeric className="display-type mt-2 text-4xl">
          {t('hours', { n: credit.hoursRemaining })}
        </p>
        <p className="mt-3 text-sm text-ink-secondary">
          {t('expires')}{' '}
          <span data-numeric>{format.dateTime(new Date(credit.expiresAt), 'full')}</span>
        </p>
      </div>

      {daysLeft <= 90 && (
        <div className="mt-6 flex gap-3 border-l-2 border-status-warning-line bg-status-warning p-5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-status-warning-fg"
            aria-hidden
          />
          <div>
            <h2 className="font-medium text-status-warning-fg">{t('expiringTitle')}</h2>
            <p className="mt-1 max-w-[var(--measure)] text-sm text-status-warning-fg">
              {t('expiringBody', {
                date: format.dateTime(new Date(credit.expiresAt), 'full'),
              })}
            </p>
          </div>
        </div>
      )}

      <Button asChild className="mt-6">
        <Link href="/anfrage">{t('bookAction')}</Link>
      </Button>

      <section className="mt-10">
        <h2 className="label-type text-ink-tertiary">{t('ledgerTitle')}</h2>
        <ul className="mt-3 border-t border-line-subtle">
          {[...credit.ledger]
            .sort((a, b) => (a.at < b.at ? 1 : -1))
            .map((entry, index) => (
              <li
                key={`${entry.at}-${index}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line-subtle py-3"
              >
                <span className="flex flex-wrap items-baseline gap-x-4">
                  <span data-numeric className="text-sm text-ink-tertiary">
                    {format.dateTime(new Date(entry.at), 'short')}
                  </span>
                  <span>{entry.reason}</span>
                </span>
                <span
                  data-numeric
                  className={entry.hours > 0 ? 'text-status-success-fg' : 'text-ink'}
                >
                  {entry.hours > 0 ? '+' : ''}
                  {entry.hours} h
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
