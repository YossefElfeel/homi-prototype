'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Download, FileQuestion } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { DetailList, DetailRow } from '@/components/ui/detail-list';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { effectiveInvoiceStatus, mayInvoice } from '@/lib/invoice-permissions';
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
 *
 * That notice was also the wrong colour. `status-registry` files `overdue`
 * under `danger` and the badge three lines above it rendered red from exactly
 * that entry, while the panel underneath was drawn amber by hand — the same
 * state in two colours, on one screen, a centimetre apart. It is an `Alert`
 * now, which takes its tone from the registry like everything else.
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

  if (!hydrated) return <SkeletonPage label={t('back')} />;

  const invoice = invoices.find((i) => i.id === id);
  /*
   * §10 — an unapproved invoice is the office's own document and its amount can
   * still change. The list filtered drafts out for exactly that reason and this
   * screen did not, so a draft's id typed into the address bar showed a
   * customer a number nobody had agreed to. The rule is `invoice-permissions`
   * now, the same table the panel reads, and it is asked from the *customer's*
   * side no matter who is looking: this page is the customer's view, and an
   * owner opening it to check what was sent has to see what was sent.
   *
   * A missing invoice and a withheld one land in the same place on purpose.
   * Telling somebody «diese Rechnung existiert, Sie dürfen sie nur nicht
   * sehen» leaks the amount's existence and answers a question they cannot
   * act on.
   */
  if (!invoice || !mayInvoice('read', 'customer', invoice.status)) {
    return (
      <EmptyState
        icon={FileQuestion}
        headingLevel={1}
        title={t('missingTitle')}
        body={t('missingBody')}
        action={
          <Button asChild variant="secondary">
            <Link href="/konto/rechnungen">{t('back')}</Link>
          </Button>
        }
      />
    );
  }

  const total = invoice.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const status = effectiveInvoiceStatus(invoice, now);
  const overdue = status === 'overdue';

  return (
    <div>
      {/*
        The number, the state and the download are the invoice's letterhead,
        and they were the one block on this screen still standing on the grey
        page ground with three white cards underneath. On a document that block
        *is* the document — floating it above the paper made it read as loose
        page furniture rather than as the top of the bill. `flush` hands the
        spacing under it to the card, which owns it now.
      */}
      <Card className="mb-app-section">
        <PageHeader
          flush
          back={{ href: '/konto/rechnungen', label: t('back') }}
          title={<span data-numeric>{invoice.reference}</span>}
          /* The derived status, so a bill past its date does not greet the
             person who owes it with a neutral «Versendet». */
          meta={<StatusBadge entity="invoice" state={status} />}
          actions={
            <Button variant="secondary" onClick={() => toast.info(t('downloadToast'))}>
              <Download className="size-4" aria-hidden />
              {t('download')}
            </Button>
          }
        />
      </Card>

      {overdue && (
        <Alert tone="danger" className="mb-app-section" title={t('overdueTitle')}>
          {t('overdueBody', {
            date: format.dateTime(new Date(invoice.dueAt), 'full'),
          })}
        </Alert>
      )}

      <div className="gap-app-section grid lg:grid-cols-12">
        <div className="lg:col-span-7">
          {/*
            The positions were a bare `<ul>` with hairlines, sitting on the page
            ground under a small grey label — the document a customer is asked
            to pay, drawn as loose text. Same card the office reads them in on
            screen 72, down to where the total sits.
          */}
          <Card pad="none">
            <CardHeader className="p-card" title={t('linesTitle')} />
            <ul className="border-t border-line-subtle">
              {invoice.lines.map((line, index) => (
                <li
                  key={`${line.label}-${index}`}
                  className="px-card py-row flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line-subtle last:border-0"
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
            <div className="p-card border-t border-line-subtle">
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{t('total')}</span>
                <Money amount={total} emphasis="strong" className="text-2xl" />
              </p>
            </div>
          </Card>
        </div>

        <aside className="space-y-app-section lg:col-span-5">
          {/* No heading on purpose: three labelled dates under the invoice
              number they belong to, where a heading could only repeat the
              page title. The rows carry their own labels. */}
          <Card>
            <DetailList>
              <DetailRow label={t('issued')}>
                <span data-numeric>
                  {format.dateTime(new Date(invoice.issuedAt), 'short')}
                </span>
              </DetailRow>
              <DetailRow label={t('due')}>
                <span data-numeric>
                  {format.dateTime(new Date(invoice.dueAt), 'short')}
                </span>
              </DetailRow>
              {invoice.paidAt && (
                <DetailRow label={t('paidOn')}>
                  <span data-numeric>
                    {format.dateTime(new Date(invoice.paidAt), 'short')}
                  </span>
                </DetailRow>
              )}
            </DetailList>
          </Card>

          {invoice.status !== 'paid' && (
            <Card>
              <CardHeader title={t('qrTitle')} description={t('qrBody')} />
              <CardBody>
                <p className="label-type text-ink-tertiary">{t('reference')}</p>
                {/* Was `break-all`, which at 375px split «09008» after its
                    first digit — the exact failure the note at the top of this
                    file warns about, on the line the customer types into
                    e-banking. `break-words` breaks at the spaces between the
                    reference's own groups and only inside one if a single
                    group cannot fit, which at five characters it always can. */}
                <p data-numeric className="mt-1 font-mono text-lg break-words">
                  {invoice.qrReference}
                </p>
              </CardBody>
            </Card>
          )}
        </aside>
      </div>

      {/* Same footing as the payment screen's demo note: a statement about the
          prototype, not about this invoice, so it sits outside the record. */}
      <p className="mt-app-section text-sm text-ink-tertiary">{t('downloadNote')}</p>
    </div>
  );
}
