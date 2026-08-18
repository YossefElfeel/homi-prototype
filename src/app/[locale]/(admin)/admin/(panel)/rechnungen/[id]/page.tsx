'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { BadgeCheck, Plus, Receipt, Send, Trash2 } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { ConfirmPanel } from '@/components/ui/confirm-panel';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money, formatChf } from '@/components/ui/money';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { INVOICE_METHODS, invoicePayment } from '@/lib/payment-methods';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Invoice, PaymentMethod } from '@/mock/schema';

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
  const methodLabel = useTranslations('status.method');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const invoices = useStore((s) => s.data.invoices);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const payments = useStore((s) => s.data.payments);
  const sendInvoice = useStore((s) => s.sendInvoice);
  const markInvoicePaid = useStore((s) => s.markInvoicePaid);
  const cancelInvoiceInStore = useStore((s) => s.cancelInvoice);
  const updateInvoiceLine = useStore((s) => s.updateInvoiceLine);
  const addInvoiceLine = useStore((s) => s.addInvoiceLine);
  const removeInvoiceLine = useStore((s) => s.removeInvoiceLine);

  const [state, setState] = useState<'idle' | 'sending'>('idle');
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  /* The QR-bill is on the invoice, so the slip is what most of them come back
     as — and the owner who was paid in cash at the door only has to change it
     when that is not what happened. */
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('qr-bill');

  if (!hydrated) return <SkeletonPage label={t('back')} />;

  const invoice = invoices.find((i) => i.id === id);
  if (!invoice) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={Receipt}
          headingLevel={1}
          title={t('back')}
          body={t('lockedHint')}
          action={
            <Button asChild>
              <Link href="/admin/rechnungen">{t('back')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const customer = customers.find((c) => c.id === invoice.customerId)!;
  const property = properties.find((p) => p.customerId === customer.id);
  const isDraft = invoice.status === 'draft';
  /** A paid invoice is refunded, not cancelled — and cancelling twice is not a thing. */
  const canCancel = invoice.status !== 'paid' && invoice.status !== 'cancelled';
  const canMarkPaid = invoice.status === 'sent' || invoice.status === 'overdue';
  const settledBy = invoicePayment(invoice.id, payments);

  function send() {
    setState('sending');
    /* The fake latency is the point: approving and sending an invoice should
       not feel like flipping a switch. */
    window.setTimeout(() => {
      sendInvoice(invoice!.id, now);
      setState('idle');
      /* Was silent — the badge changed and nothing else. Sending an invoice to
         a customer is the least ambiguous thing on this screen. */
      toast.success(t('sentDone'));
    }, 900);
  }

  function markPaid() {
    markInvoicePaid(invoice!.id, now, method);
    setPaying(false);
    toast.success(t('markPaidDone'));
  }

  function cancelInvoice() {
    cancelInvoiceInStore(invoice!.id, reason);
    setCancelling(false);
    toast.success(t('cancelDone'));
  }

  return (
    <div>
      <PageHeader
        back={{ href: '/admin/rechnungen', label: t('back') }}
        title={<span data-numeric>{invoice.reference}</span>}
        meta={<StatusBadge entity="invoice" state={invoice.status} />}
        actions={
          <>
            {isDraft && (
              <Button onClick={send} loading={state === 'sending'}>
                {t('sendAction')}
                <Send className="size-4" aria-hidden />
              </Button>
            )}
            {canMarkPaid && (
              <Button onClick={() => setPaying(true)}>
                <BadgeCheck className="size-4" aria-hidden />
                {t('markPaid')}
              </Button>
            )}
          </>
        }
      />

      {/* Was plain text — an invoice detail with no route to the customer it
          bills or the job it came from. */}
      <p className="-mt-4 mb-app text-ink-secondary">
        <Link
          href={`/admin/kunden/${customer.id}`}
          className="underline decoration-from-font underline-offset-4"
        >
          {customer.firstName} {customer.lastName}
        </Link>{' '}
        · <span data-numeric>{format.dateTime(new Date(invoice.issuedAt), 'full')}</span>
        {invoice.bookingId && (
          <>
            {' · '}
            <Link
              href={`/admin/buchungen/${invoice.bookingId}`}
              className="underline decoration-from-font underline-offset-4"
            >
              {t('bookingLink')}
            </Link>
          </>
        )}
        {invoice.subscriptionId && (
          <>
            {' · '}
            <Link
              href={`/admin/abos/${invoice.subscriptionId}`}
              className="underline decoration-from-font underline-offset-4"
            >
              {t('subscriptionLink')}
            </Link>
          </>
        )}
      </p>

      {isDraft && (
        <Alert tone="warning" className="mb-app" title={t('draftBadge')}>
          {t('editHint')}
        </Alert>
      )}
      {invoice.status === 'paid' && invoice.paidAt && (
        <Alert tone="success" className="mb-app">
          {/* The seed's paid invoices predate `Payment` records for invoices,
              and so does every invoice paid before this screen asked how. The
              date alone is what those can honestly say. */}
          {settledBy
            ? t('paidVia', {
                date: format.dateTime(new Date(invoice.paidAt), 'full'),
                method: methodLabel(settledBy.method),
              })
            : t('paidOn', {
                date: format.dateTime(new Date(invoice.paidAt), 'full'),
              })}
        </Alert>
      )}

      {/*
        Screen 72 is titled "Rechnung bearbeiten" and its own doc comment says
        "editable while it is still a draft" — but every line rendered as a
        read-only <th scope="row">. Nothing on the page could change an amount,
        which is precisely the case the approval step exists for.
      */}
      <Card pad="none">
        <CardHeader
          className="p-card"
          title={t('linesTitle')}
          description={isDraft ? undefined : t('lockedHint')}
          actions={
            isDraft ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => addInvoiceLine(invoice.id)}
              >
                <Plus className="size-4" aria-hidden />
                {t('addLine')}
              </Button>
            ) : undefined
          }
        />
        <div className="overflow-x-auto border-t border-line-subtle">
          <table className="w-full min-w-xl border-collapse text-left">
            <thead>
              <tr className="border-b border-line-subtle">
                <th scope="col" className="label-type px-card py-2.5 font-medium text-ink-tertiary">
                  {t('colDescription')}
                </th>
                <th scope="col" className="label-type px-3 py-2.5 text-right font-medium text-ink-tertiary">
                  {t('colQuantity')}
                </th>
                <th scope="col" className="label-type px-3 py-2.5 text-right font-medium text-ink-tertiary">
                  {t('colUnit')}
                </th>
                <th scope="col" className="label-type px-card py-2.5 text-right font-medium text-ink-tertiary">
                  {t('colTotal')}
                </th>
                {isDraft && <th scope="col" className="w-12" />}
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line, index) => (
                <tr
                  key={`${line.label}-${index}`}
                  className="border-b border-line-subtle last:border-0"
                >
                  <td className="px-card py-row">
                    {isDraft ? (
                      <Input
                        dense
                        value={line.label}
                        placeholder={t('linePlaceholder')}
                        aria-label={t('colDescription')}
                        onChange={(e) =>
                          updateInvoiceLine(invoice.id, index, { label: e.target.value })
                        }
                      />
                    ) : (
                      line.label
                    )}
                  </td>
                  <td className="px-3 py-row text-right">
                    {isDraft ? (
                      <NumberCell
                        value={line.quantity}
                        label={t('colQuantity')}
                        onChange={(quantity) =>
                          updateInvoiceLine(invoice.id, index, { quantity })
                        }
                      />
                    ) : (
                      <span data-numeric className="text-ink-secondary">
                        {line.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-row text-right">
                    {isDraft ? (
                      <NumberCell
                        value={line.unitPrice}
                        label={t('colUnit')}
                        onChange={(unitPrice) =>
                          updateInvoiceLine(invoice.id, index, { unitPrice })
                        }
                      />
                    ) : (
                      <Money amount={line.unitPrice} emphasis="quiet" />
                    )}
                  </td>
                  <td className="px-card py-row text-right">
                    <Money amount={line.quantity * line.unitPrice} />
                  </td>
                  {isDraft && (
                    <td className="pr-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('removeLine')}
                        onClick={() => removeInvoiceLine(invoice.id, index)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-line-subtle p-card">
          <p className="flex items-baseline justify-between gap-4">
            <span className="font-medium">{t('total')}</span>
            <Money amount={total(invoice)} emphasis="strong" className="text-2xl" />
          </p>
          <p className="mt-1 text-right text-xs text-ink-tertiary">{t('noVat')}</p>
        </div>
      </Card>

      <section className="mt-app-section">
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

      <div className="mt-app-section space-y-4">
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

      {/*
        "Mark as paid" was one click that wrote a status and nothing else. The
        money had moved somehow, and the record could not say how — so a refund
        weeks later started with a phone call to ask the customer. One question
        with a default already filled in is the whole cost of fixing that.
      */}
      <Dialog open={paying} onOpenChange={setPaying}>
        <DialogContent closeLabel={t('dismiss')}>
          <DialogHeader>
            <DialogTitle>{t('markPaidTitle')}</DialogTitle>
            <DialogDescription>
              {t('markPaidLead', {
                reference: invoice.reference,
                amount: formatChf(total(invoice), locale),
              })}
            </DialogDescription>
          </DialogHeader>

          <Field label={t('markPaidMethod')}>
            {(props) => (
              <Select
                {...props}
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                {INVOICE_METHODS.map((value) => (
                  <option key={value} value={value}>
                    {methodLabel(value)}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPaying(false)}>
              {t('dismiss')}
            </Button>
            <Button onClick={markPaid}>
              <BadgeCheck className="size-4" aria-hidden />
              {t('markPaid')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * A number cell that survives being cleared.
 *
 * `Number(e.target.value) || 0` is used across the admin forms, and it means
 * selecting a price and pressing backspace to retype it writes 0 to the live
 * record between keystrokes. On a settings screen that silently zeroes the
 * Saturday surcharge; here it zeroes a line on a real invoice. Empty is held
 * as empty and only committed as a number once it parses.
 */
function NumberCell({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState<string | null>(null);

  return (
    <Input
      dense
      inputMode="decimal"
      aria-label={label}
      className="text-right"
      value={text ?? String(value)}
      onChange={(e) => {
        setText(e.target.value);
        const parsed = Number(e.target.value);
        if (e.target.value.trim() !== '' && Number.isFinite(parsed)) onChange(parsed);
      }}
      onBlur={() => setText(null)}
    />
  );
}
