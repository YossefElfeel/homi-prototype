'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Download } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/ui/money';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow } from '@/mock/store';

/**
 * Screen 40 — one invoice.
 *
 * The QR reference is the payload, so it gets the weight and the tabular
 * numerals. §10 makes the QR-bill the payment method here; a customer types
 * that reference into e-banking, and a line break in the wrong place costs
 * them a failed payment.
 *
 * The overdue notice ends with "if you have already paid, disregard this" —
 * bank transfers cross with reminders constantly, and a reminder that does not
 * allow for it reads as an accusation.
 */
export default function AccountInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('account.invoice');
  const format = useFormatter();
  const hydrated = useHydrated();
  const now = useNow();

  const { invoices } = useAccount();

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const invoice = invoices.find((i) => i.id === id);
  if (!invoice) return <p className="text-ink-tertiary">—</p>;

  const total = invoice.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const overdue =
    invoice.status === 'overdue' ||
    (invoice.status === 'sent' && new Date(invoice.dueAt) < now);

  return (
    <div>
      <Button asChild variant="link" className="mb-6">
        <Link href="/konto/rechnungen">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 data-numeric className="display-type text-3xl">
          {invoice.reference}
        </h1>
        <StatusBadge entity="invoice" state={invoice.status} />
      </div>

      {overdue && (
        <div className="mt-6 flex gap-3 border-l-2 border-status-warning-line bg-status-warning p-5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-status-warning-fg"
            aria-hidden
          />
          <div>
            <h2 className="font-medium text-status-warning-fg">{t('overdueTitle')}</h2>
            <p className="mt-1 max-w-[var(--measure)] text-sm text-status-warning-fg">
              {t('overdueBody', {
                date: format.dateTime(new Date(invoice.dueAt), 'full'),
              })}
            </p>
          </div>
        </div>
      )}

      <dl className="mt-8 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="label-type text-ink-tertiary">{t('issued')}</dt>
          <dd data-numeric className="mt-1">
            {format.dateTime(new Date(invoice.issuedAt), 'short')}
          </dd>
        </div>
        <div>
          <dt className="label-type text-ink-tertiary">{t('due')}</dt>
          <dd data-numeric className="mt-1">
            {format.dateTime(new Date(invoice.dueAt), 'short')}
          </dd>
        </div>
        {invoice.paidAt && (
          <div>
            <dt className="label-type text-ink-tertiary">{t('paidOn')}</dt>
            <dd data-numeric className="mt-1">
              {format.dateTime(new Date(invoice.paidAt), 'short')}
            </dd>
          </div>
        )}
      </dl>

      <section className="mt-10">
        <h2 className="label-type text-ink-tertiary">{t('linesTitle')}</h2>
        <ul className="mt-3 border-t border-line-subtle">
          {invoice.lines.map((line, index) => (
            <li
              key={`${line.label}-${index}`}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line-subtle py-3"
            >
              <span>{line.label}</span>
              <span className="flex items-baseline gap-4">
                {line.quantity !== 1 && (
                  <span data-numeric className="text-sm text-ink-tertiary">
                    {line.quantity} ×
                  </span>
                )}
                <Money amount={line.quantity * line.unitPrice} />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-baseline justify-between gap-4">
          <span className="font-medium">{t('total')}</span>
          <Money amount={total} emphasis="strong" className="text-xl" />
        </p>
      </section>

      {invoice.status !== 'paid' && (
        <section className="surface-card mt-10 p-6">
          <h2 className="display-type text-xl">{t('qrTitle')}</h2>
          <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
            {t('qrBody')}
          </p>
          <p className="label-type mt-5 text-ink-tertiary">{t('reference')}</p>
          <p data-numeric className="mt-1 font-mono text-lg break-all">
            {invoice.qrReference}
          </p>
        </section>
      )}

      <div className="mt-8">
        <Button variant="secondary" onClick={() => toast.info(t('downloadToast'))}>
          <Download className="size-4" aria-hidden />
          {t('download')}
        </Button>
        <p className="mt-2 text-sm text-ink-tertiary">{t('downloadNote')}</p>
      </div>
    </div>
  );
}
