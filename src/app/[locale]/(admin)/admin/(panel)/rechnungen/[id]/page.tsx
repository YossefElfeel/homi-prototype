'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { BadgeCheck, Receipt, Send } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmDialog, useDismissLabel } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatChf } from '@/components/ui/money';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InvoiceLines } from '@/components/admin/invoice-lines';
import { TemplatePicker } from '@/components/admin/template-picker';
import { ActionIcon } from '@/lib/action-icons';
import { invoiceTotal } from '@/lib/customer-history';
import { effectiveInvoiceStatus, mayInvoice } from '@/lib/invoice-permissions';
import { INVOICE_METHODS, invoicePayment } from '@/lib/payment-methods';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { PaymentMethod } from '@/mock/schema';

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
 *
 * Two things moved in this pass, both about *whose* screen this is. The
 * QR-bill is the document the customer receives, and it sat in the middle of
 * the owner's screen unlabelled, between two panels of office controls — so
 * it now says so and links to the page the customer actually reads. And the
 * office's own irreversible actions were scattered: approve at the top, a red
 * «stornieren» alone at the very bottom below the message box, and no way at
 * all to delete a draft or correct an invoice already sent. They are one
 * section now, at the end, under a heading that names what it is for.
 */
export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.invoice');
  const dismissLabel = useDismissLabel();
  const brand = useTranslations('brand');
  const methodLabel = useTranslations('status.method');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const role = useStore((s) => s.demo.role);
  const invoices = useStore((s) => s.data.invoices);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const payments = useStore((s) => s.data.payments);
  const sendInvoice = useStore((s) => s.sendInvoice);
  const sendMessage = useStore((s) => s.sendMessage);
  const markInvoicePaid = useStore((s) => s.markInvoicePaid);
  const cancelInvoiceInStore = useStore((s) => s.cancelInvoice);
  const reissueInvoice = useStore((s) => s.reissueInvoice);
  const deleteInvoice = useStore((s) => s.deleteInvoice);
  const updateInvoiceLine = useStore((s) => s.updateInvoiceLine);
  const addInvoiceLine = useStore((s) => s.addInvoiceLine);
  const removeInvoiceLine = useStore((s) => s.removeInvoiceLine);

  const [state, setState] = useState<'idle' | 'sending'>('idle');
  /**
   * Which irreversible step is waiting for an answer, if any.
   *
   * All three share one piece of state because at most one of them can be open
   * — and because a second boolean per action is how a screen ends up with two
   * modals stacked on each other.
   */
  const [confirming, setConfirming] = useState<'cancel' | 'reissue' | 'delete' | null>(null);
  const [reason, setReason] = useState('');
  /* The QR-bill is on the invoice, so the slip is what most of them come back
     as — and the owner who was paid in cash at the door only has to change it
     when that is not what happened. */
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('qr-bill');
  const [note, setNote] = useState('');

  if (!hydrated) return <SkeletonPage label={t('back')} />;

  const invoice = invoices.find((i) => i.id === id);
  if (!invoice) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={Receipt}
          headingLevel={1}
          /* Was titled «Alle Rechnungen» — the label of its own back button —
             over a body reading «Versendete Rechnungen sind nicht mehr
             änderbar», which is an answer to a question nobody asked here. */
          title={t('missingTitle')}
          body={t('missingBody')}
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
  const settledBy = invoicePayment(invoice.id, payments);
  const total = invoiceTotal(invoice);

  /*
   * One derived status, then one table of permissions off it.
   *
   * Every control here used to test the stored status inline — `isDraft`,
   * `status !== 'paid' && status !== 'cancelled'`, `status === 'sent' ||
   * status === 'overdue'` — three phrasings of the same rule, and the list
   * screen had a fourth. They now all read `invoice-permissions`, which is
   * also where the answer to "may this person do it at all" lives.
   */
  const status = effectiveInvoiceStatus(invoice, now);
  const canEdit = mayInvoice('editLines', role, status);
  const canApprove = mayInvoice('approve', role, status);
  const canMarkPaid = mayInvoice('markPaid', role, status);
  const canCancel = mayInvoice('cancel', role, status);
  const canReissue = mayInvoice('reissue', role, status);
  const canDelete = mayInvoice('delete', role, status);
  /* Not a permission — a question about whether the customer's page has
     anything on it worth opening. See the QR card's own note. */
  const showCustomerView = invoice.status !== 'draft' && invoice.status !== 'paid';

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

  /* The covering note goes into the customer's own message thread, keyed by
     the invoice reference, so it lands beside everything else about this
     invoice rather than in a mailbox nobody in the product can see. */
  function postNote(body: string) {
    const text = body.trim();
    if (!text) return;
    sendMessage(
      {
        customerId: invoice!.customerId,
        subject: invoice!.reference,
        body: text,
        from: 'homivaro',
      },
      now,
    );
    setNote('');
    toast.success(t('messageSent'));
  }

  function markPaid() {
    markInvoicePaid(invoice!.id, now, method);
    setPaying(false);
    toast.success(t('markPaidDone'));
  }

  function cancel() {
    cancelInvoiceInStore(invoice!.id, reason.trim());
    setConfirming(null);
    setReason('');
    toast.success(t('cancelDone'));
  }

  /** Cancels this one and lands on the corrected draft it opened. */
  function reissue() {
    const replacementId = reissueInvoice(invoice!.id, now, reason.trim());
    setConfirming(null);
    setReason('');
    if (!replacementId) {
      toast.error(t('reissueFailed'));
      return;
    }
    const replacement = useStore.getState().data.invoices.find((i) => i.id === replacementId);
    toast.success(t('reissueDone', { reference: replacement?.reference ?? '' }));
    router.push(`/admin/rechnungen/${replacementId}`);
  }

  function remove() {
    setConfirming(null);
    if (!deleteInvoice(invoice!.id)) {
      toast.error(t('deleteBlocked'));
      return;
    }
    toast.success(t('deleteDone', { reference: invoice!.reference }));
    router.push('/admin/rechnungen');
  }

  return (
    <div>
      <PageHeader
        back={{ href: '/admin/rechnungen', label: t('back') }}
        title={<span data-numeric>{invoice.reference}</span>}
        meta={<StatusBadge entity="invoice" state={status} />}
        actions={
          <>
            {canApprove && (
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

      {canEdit && (
        <Alert tone="warning" className="mb-app" title={t('draftBadge')}>
          {t('editHint')}
        </Alert>
      )}
      {status === 'overdue' && (
        /* Derived from the due date, so a `sent` invoice past its deadline says
           so here as well as in the list. Without this the two screens
           disagreed: the list printed «12 T. überfällig» and the detail was
           still a calm blue «Versendet». */
        <Alert tone="danger" className="mb-app" title={t('overdueTitle')}>
          {t('overdueBody', { date: format.dateTime(new Date(invoice.dueAt), 'full') })}
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
      {invoice.status === 'cancelled' && invoice.cancelReason && (
        /* Was a grey sentence under the buttons at the foot of the page, which
           is the last place anyone looks for the reason a document is void. */
        <Alert tone="neutral" className="mb-app" title={t('cancelledTitle')}>
          {invoice.cancelReason}
        </Alert>
      )}

      {/*
        Screen 72 is titled "Rechnung bearbeiten" and its own doc comment said
        "editable while it is still a draft" — but every line rendered as a
        read-only <th scope="row">. The table is now shared with the create
        screen, and the quantity carries the two buttons that answer "bill one
        hour less" without retyping the cell.
      */}
      <InvoiceLines
        lines={invoice.lines}
        editable={canEdit}
        lockedHint={t('lockedHint')}
        onChange={(index, patch) => updateInvoiceLine(invoice.id, index, patch)}
        onAdd={() => addInvoiceLine(invoice.id)}
        onRemove={(index) => removeInvoiceLine(invoice.id, index)}
      />

      <Card className="mt-app-section">
        <CardHeader
          title={t('qrTitle')}
          description={t('qrLead')}
          actions={
            /*
             * The one control on this screen that is not an office action, and
             * that is exactly why it sits here rather than in the header beside
             * «Freigeben und senden». The block below is the customer's own
             * document rendered on the owner's screen; this opens the page they
             * actually read.
             *
             * Two states do not get it. A draft, because §10 keeps an
             * unapproved amount internal and the account screens refuse one —
             * the link would open a page that says no. And a settled invoice,
             * because there is nothing left for the customer to do with it:
             * their copy drops the payment part once it is paid, so the link
             * would send the owner to a page that no longer shows the thing
             * this card is about.
             */
            showCustomerView ? (
              <Button asChild variant="secondary" size="sm">
                <a
                  href={`/${locale}/konto/rechnungen/${invoice.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ActionIcon.customerView className="size-4" aria-hidden />
                  {t('customerView')}
                </a>
              </Button>
            ) : undefined
          }
        />

        {/*
          The Swiss payment part: receipt on the left, payment part on the
          right, QR in the middle of the right block. Proportions kept so it
          reads as the real thing at a glance.

          One deliberate departure from the real slip. A printed QR-bill repeats
          the payee and the reference on *both* halves, and that is not
          redundancy — the perforation runs down the middle, the payer keeps the
          receipt and the bank keeps the payment part, so each half has to be
          readable on its own once they are apart.

          Nothing here is ever torn. On screen the repeat is just the same lines
          twice, three centimetres apart, and it reads as a rendering fault. So
          every fact is stated once, on the receipt — payee, reference, payer,
          currency and amount — and the payment part carries only what the
          receipt does not: the code itself, and the date the money is due.

          Worth reopening the day this has to produce a printable slip — at that
          point the duplication becomes required again, and it is a rule of the
          Swiss Implementation Guidelines rather than a layout preference.
        */}
        <CardBody className="overflow-x-auto">
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
                  <dd data-numeric>{formatChf(total, locale).replace('CHF ', '')}</dd>
                </div>
              </dl>
            </div>

            <div className="p-5">
              <div>
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
                {/* The one fact the receipt beside it does not carry. The
                    payee, the reference and the amount were all repeated here
                    and are now stated once, on the receipt — see the note
                    above. */}
                <dl className="mt-4 text-sm">
                  <dt className="text-ink-tertiary">{t('dueTitle')}</dt>
                  <dd data-numeric className="mt-0.5">
                    {format.dateTime(new Date(invoice.dueAt), 'full')}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </CardBody>
        <p className="mt-3 text-xs text-ink-tertiary">{t('qrNote')}</p>
      </Card>

      <Card className="mt-app-section">
        <CardHeader title={t('messageTitle')} description={t('messageLead')} />

        {/*
          The customer's language, not the admin's: an invoice note is read by
          the person being billed. `amount` and `dueDate` come from this invoice,
          which is what lets the picker offer one-click sending — a template
          whose placeholders all resolve has nothing left for a human to fill in.
        */}
        <CardBody>
        <TemplatePicker
          flow="invoices"
          locale={customer.language}
          vars={{
            name: `${customer.firstName} ${customer.lastName}`,
            reference: invoice.reference,
            invoiceNumber: invoice.reference,
            amount: formatChf(total, locale),
            dueDate: format.dateTime(new Date(invoice.dueAt), 'full'),
          }}
          hasDraft={Boolean(note.trim())}
          onInsert={(message) => setNote(message.body)}
          onSend={(message) => postNote(message.body)}
        />

        <Field label={t('messageLabel')} hint={t('messageThread', { reference: invoice.reference })} className="mt-5">
          {(props) => (
            <Textarea
              {...props}
              className="min-h-28"
              placeholder={t('messagePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
        </Field>
        <Button className="mt-3" disabled={!note.trim()} onClick={() => postNote(note)}>
          <Send className="size-4" aria-hidden />
          {t('messageSend')}
        </Button>
        </CardBody>
      </Card>

      {/*
        Everything that ends this document, in one place.

        Cancelling used to be a lone red button at the foot of the page, below
        the message box, and it was the only one of these that existed at all:
        a draft nobody wanted had to be cancelled and kept for ever, and an
        invoice already with a customer carrying a wrong amount had no
        correction path other than cancelling it and rebuilding every line by
        hand. The heading is what makes the section legible — three actions
        with one sentence each, rather than a red button with no context.
      */}
      {(canCancel || canReissue || canDelete) && (
        <Card className="mt-app-section">
          <CardHeader title={t('closeTitle')} description={t('closeLead')} />
          <CardBody>
            <div className="flex flex-wrap gap-3">
              {canReissue && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setReason('');
                    setConfirming('reissue');
                  }}
                >
                  {t('reissueAction')}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setReason('');
                    setConfirming('cancel');
                  }}
                >
                  {t('cancelAction')}
                </Button>
              )}
              {/* §15 keeps whatever has been in front of a customer, so this is
                  offered on a draft and nowhere else — and it is offered, because
                  a mistyped draft kept for ever as «storniert» buries the real
                  cancellations under clerical noise. */}
              {canDelete && (
                <Button variant="ghost" onClick={() => setConfirming('delete')}>
                  <ActionIcon.delete className="size-4" aria-hidden />
                  {t('deleteAction')}
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/*
        The three questions, as popups.

        They used to be an inline red panel that replaced the buttons — which
        on this screen means the confirm opened at the very foot of a page
        carrying a QR-bill and a message box above it, so on anything shorter
        than a desk monitor the question you had just asked for was off-screen.
        Deleting a draft did not even get that: it raised a `window.confirm`,
        the browser's own box, in the browser's language.
      */}
      <ConfirmDialog
        open={confirming === 'cancel'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={t('cancelConfirmTitle')}
        body={t('cancelConfirmBody')}
        action={t('cancelConfirmAction')}
        dismiss={dismissLabel}
        disabled={reason.trim() === ''}
        onConfirm={cancel}
      >
        <Field label={t('cancelReason')}>
          {(props) => (
            <Textarea
              {...props}
              className="min-h-20"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirming === 'reissue'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={t('reissueConfirmTitle')}
        body={t('reissueConfirmBody')}
        action={t('reissueConfirmAction')}
        dismiss={dismissLabel}
        disabled={reason.trim() === ''}
        onConfirm={reissue}
      >
        <Field label={t('cancelReason')}>
          {(props) => (
            <Textarea
              {...props}
              className="min-h-20"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirming === 'delete'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={t('deleteConfirmTitle')}
        body={t('deleteConfirm', { reference: invoice.reference })}
        action={t('deleteAction')}
        dismiss={dismissLabel}
        onConfirm={remove}
      />

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
                amount: formatChf(total, locale),
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
