'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { ArrowLeft, Check, Loader2, Send } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { ConfirmPanel } from '@/components/ui/confirm-panel';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money, formatChf } from '@/components/ui/money';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Invoice } from '@/mock/schema';

const total = (invoice: Invoice) =>
  invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

/**
 * Screen 72 — the invoice, editable while it is still a draft.
 *
 * §10: invoices are generated automatically after a job and wait for the
 * owner's approval before they go out. That waiting state is the whole point of
 * this screen — an invoice that sends itself is how a wrong amount reaches a
 * customer.
 *
 * The QR-bill is drawn to the real Swiss payment-part proportions because it
 * is instantly recognisable to a Swiss customer, and labelled as a schematic
 * because it is not a valid code.
 */
export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.invoice');
  const brand = useTranslations('brand');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const invoices = useStore((s) => s.data.invoices);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const data = useStore((s) => s.data);
  const patchData = useStore((s) => s.patchData);

  const [state, setState] = useState<'idle' | 'sending'>('idle');
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const invoice = invoices.find((i) => i.id === id);
  if (!invoice) return <p className="text-ink-tertiary">—</p>;

  const customer = customers.find((c) => c.id === invoice.customerId)!;
  const property = properties.find((p) => p.customerId === customer.id);
  const isDraft = invoice.status === 'draft';
  /** A paid invoice is refunded, not cancelled — and cancelling twice is not a thing. */
  const canCancel = invoice.status !== 'paid' && invoice.status !== 'cancelled';

  function send() {
    setState('sending');
    window.setTimeout(() => {
      patchData({
        invoices: data.invoices.map((i) =>
          i.id === invoice!.id
            ? { ...i, status: 'sent' as const, issuedAt: now.toISOString() }
            : i,
        ),
      });
      setState('idle');
    }, 900);
  }

  function cancelInvoice() {
    patchData({
      invoices: data.invoices.map((i) =>
        i.id === invoice!.id
          ? { ...i, status: 'cancelled' as const, cancelReason: reason }
          : i,
      ),
    });
    setCancelling(false);
    toast.success(t('cancelDone'));
  }

  return (
    <div className="max-w-4xl">
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/rechnungen">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 data-numeric className="display-type text-3xl">
          {invoice.reference}
        </h1>
        <StatusBadge entity="invoice" state={invoice.status} />
      </div>
      <p className="mt-2 text-ink-secondary">
        {customer.firstName} {customer.lastName} ·{' '}
        <span data-numeric>{format.dateTime(new Date(invoice.issuedAt), 'full')}</span>
      </p>

      {isDraft && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-sm border border-status-progress-line bg-status-progress px-2.5 py-1.5 text-sm text-status-progress-fg">
          <Check className="size-3.5" aria-hidden />
          {t('draftBadge')}
        </p>
      )}

      <section className="mt-10">
        <h2 className="display-type text-xl">{t('linesTitle')}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-lg border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="label-type py-3 pr-4 text-ink-tertiary">
                  {t('colDescription')}
                </th>
                <th scope="col" className="label-type py-3 pr-4 text-right text-ink-tertiary">
                  {t('colQuantity')}
                </th>
                <th scope="col" className="label-type py-3 pr-4 text-right text-ink-tertiary">
                  {t('colUnit')}
                </th>
                <th scope="col" className="label-type py-3 text-right text-ink-tertiary">
                  {t('colTotal')}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.label} className="border-b border-line-subtle">
                  <th scope="row" className="py-3.5 pr-4 font-normal">
                    {line.label}
                  </th>
                  <td data-numeric className="py-3.5 pr-4 text-right text-ink-secondary">
                    {line.quantity}
                  </td>
                  <td className="py-3.5 pr-4 text-right text-ink-secondary">
                    <Money amount={line.unitPrice} />
                  </td>
                  <td className="py-3.5 text-right">
                    <Money amount={line.quantity * line.unitPrice} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <span className="font-medium">{t('total')}</span>
          <Money amount={total(invoice)} emphasis="strong" className="text-2xl" />
        </p>
        <p className="mt-1 text-right text-xs text-ink-tertiary">{t('noVat')}</p>
      </section>

      <section className="mt-10">
        <h2 className="display-type text-xl">{t('qrTitle')}</h2>
        <p className="mt-1 max-w-[var(--measure)] text-sm text-ink-secondary">{t('qrLead')}</p>

        {/* The Swiss payment part: receipt on the left, payment part on the
            right, QR in the middle of the right block. Proportions kept so it
            reads as the real thing at a glance. */}
        <div className="mt-4 overflow-x-auto">
          <div className="grid min-w-2xl grid-cols-[1fr_2fr] border border-line-strong">
            <div className="border-r border-line-strong p-5">
              <p className="label-type text-ink-tertiary">Empfangsschein</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-ink-tertiary">{t('qrPayableTo')}</dt>
                  <dd className="mt-0.5">
                    {brand('name')}
                    {/* The legal address is still an open question (/open-questions).
                        It used to render the raw `TODO:legal` marker here, inside the
                        payment slip a customer reads. */}
                    <span className="block text-ink-tertiary">{t('qrAddressPending')}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-tertiary">{t('qrReference')}</dt>
                  <dd data-numeric className="mt-0.5">
                    {invoice.qrReference}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-tertiary">{t('qrPayableBy')}</dt>
                  <dd className="mt-0.5">
                    {customer.firstName} {customer.lastName}
                    {property && (
                      <span className="block text-ink-tertiary">
                        {property.street}, {property.postcode} {property.city}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
              <dl className="mt-5 flex gap-6 border-t border-line-subtle pt-3 text-sm">
                <div>
                  <dt className="text-ink-tertiary">{t('qrCurrency')}</dt>
                  <dd data-numeric>CHF</dd>
                </div>
                <div>
                  <dt className="text-ink-tertiary">{t('qrAmount')}</dt>
                  <dd data-numeric>{formatChf(total(invoice), locale).replace('CHF ', '')}</dd>
                </div>
              </dl>
            </div>

            <div className="flex gap-6 p-5">
              <div className="flex-1">
                <p className="label-type text-ink-tertiary">Zahlteil</p>
                <div
                  aria-hidden
                  className="mt-4 grid size-40 shrink-0 grid-cols-8 gap-px border border-line-strong p-1"
                >
                  {/* Schematic only — deterministic from the reference so it
                      looks like a code rather than random noise. */}
                  {Array.from({ length: 64 }, (_, i) => (
                    <span
                      key={i}
                      className={
                        (invoice.qrReference.charCodeAt(i % invoice.qrReference.length) + i) % 3 === 0
                          ? 'bg-ink'
                          : 'bg-transparent'
                      }
                    />
                  ))}
                </div>
                <dl className="mt-4 flex gap-6 text-sm">
                  <div>
                    <dt className="text-ink-tertiary">{t('qrCurrency')}</dt>
                    <dd data-numeric>CHF</dd>
                  </div>
                  <div>
                    <dt className="text-ink-tertiary">{t('qrAmount')}</dt>
                    <dd data-numeric className="font-medium">
                      {formatChf(total(invoice), locale).replace('CHF ', '')}
                    </dd>
                  </div>
                </dl>
              </div>

              <dl className="flex-1 space-y-3 text-sm">
                <div>
                  <dt className="text-ink-tertiary">{t('qrPayableTo')}</dt>
                  <dd className="mt-0.5">{brand('name')}</dd>
                </div>
                <div>
                  <dt className="text-ink-tertiary">{t('qrReference')}</dt>
                  <dd data-numeric className="mt-0.5">
                    {invoice.qrReference}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-tertiary">{t('dueTitle')}</dt>
                  <dd data-numeric className="mt-0.5">
                    {format.dateTime(new Date(invoice.dueAt), 'full')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-tertiary">{t('qrNote')}</p>
      </section>

      <div className="mt-10 space-y-4">
        {isDraft && (
          <Button size="lg" onClick={send} disabled={state === 'sending'}>
            {state === 'sending' ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t('sending')}
              </>
            ) : (
              <>
                {t('sendAction')}
                <Send className="size-4" aria-hidden />
              </>
            )}
          </Button>
        )}

        {/*
          Cancelling used to sit inside the draft-only block, which meant the one
          case where it matters commercially — an invoice already with the
          customer — had no control at all. A paid invoice is refunded, not
          cancelled, so that stays out.
        */}
        {canCancel &&
          (cancelling ? (
            <ConfirmPanel
              title={t('cancelConfirmTitle')}
              body={t('cancelConfirmBody')}
              action={t('cancelConfirmAction')}
              dismiss={t('dismiss')}
              disabled={reason.trim() === ''}
              onConfirm={cancelInvoice}
              onDismiss={() => setCancelling(false)}
            >
              <Field label={t('cancelReason')}>
                {(props) => (
                  <Textarea
                    {...props}
                    className="min-h-20 bg-page"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                )}
              </Field>
            </ConfirmPanel>
          ) : (
            <Button variant="danger" size="lg" onClick={() => setCancelling(true)}>
              {t('cancelAction')}
            </Button>
          ))}

        {invoice.status === 'cancelled' && invoice.cancelReason && (
          <p className="text-sm text-ink-secondary">
            {t('cancelledNote', { reason: invoice.cancelReason })}
          </p>
        )}
      </div>
    </div>
  );
}
