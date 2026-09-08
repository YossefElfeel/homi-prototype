'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { ConfirmDialog, useDismissLabel } from '@/components/ui/confirm-dialog';
import { usageBreakdown, type PropertyUsage } from '@/lib/property-facts';

/**
 * «Objekt löschen?» — and, when the answer is no, why not.
 *
 * One component rather than the same forty lines on the list and on the
 * property, because the two screens are asking one question. The list asks it
 * about a row, the property asks it about the record you already have open,
 * and a reader who gets «19 Einträge hängen daran» in one place and «Ihr
 * Verlauf hängt daran» in the other has met two different rules.
 *
 * The refusal is shown, not hidden. The office's copy of this list greys the
 * menu entry out and puts the count in its label, which works behind the
 * counter: whoever reads it knows what the number counts and could unpick it.
 * A customer cannot. So the entry is offered on every property here, and the
 * ones it will not delete get the sentence — what holds the address, in their
 * own words, and who to ask if it has to go anyway.
 */
export function PropertyDeleteDialog({
  /** The row being asked about, or `null` while the dialog fades out. */
  target,
  open,
  onOpenChange,
  onConfirm,
}: {
  target: { label: string; usage: PropertyUsage } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations('account.properties');
  const dismissLabel = useDismissLabel();

  const blocked = Boolean(target && target.usage.total > 0);
  const label = target?.label ?? '';

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={blocked ? t('deleteBlockedTitle', { label }) : t('deleteTitle', { label })}
      body={blocked ? t('deleteBlockedBody') : t('deleteBody')}
      action={t('deleteConfirm')}
      dismiss={dismissLabel}
      /* Refused rather than absent. Somebody who opened the menu to delete has
         to see that the act was understood and declined — a button that is
         simply not there answers nothing and reads as a screen that broke. */
      disabled={blocked}
      onConfirm={onConfirm}
    >
      {blocked && target && (
        <div className="rounded-[var(--radius-md)] bg-sunken p-4">
          <p className="text-sm text-ink-secondary">{t('deleteHoldsLead')}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {usageBreakdown(target.usage).map(({ kind, n }) => (
              <li key={kind} data-numeric>
                {t(`holds.${kind}`, { n })}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-[var(--measure)] text-sm text-ink-secondary">
            {t('deleteBlockedExit')}{' '}
            {/* The way out of the refusal, and the only one there is: moving
                out is the case the rule cannot tell apart from a mistake, and
                the office settles it by hand. */}
            <Link
              href="/account/messages"
              className="underline underline-offset-2 hover:text-ink"
            >
              {t('deleteBlockedExitAction')}
            </Link>
          </p>
        </div>
      )}
    </ConfirmDialog>
  );
}
