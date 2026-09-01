'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { Receipt } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { InvoiceLines } from '@/components/admin/invoice-lines';
import { offerLineLabel } from '@/lib/offer-label';
import { hasWorkRecord, workedMinutes } from '@/lib/workforce';
import { mayInvoice } from '@/lib/invoice-permissions';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Booking, InvoiceLine } from '@/mock/schema';

/**
 * The payment terms on offer.
 *
 * §10 fixes nothing here and settings carry no field for it, so thirty days —
 * what the store used as its one hardcoded term — stays the default and the
 * others are the two ends the office actually reaches for: ten days for a
 * customer who has been slow before, sixty for a commercial contract that pays
 * on its own cycle. Whether these belong in settings is on /open-questions.
 */
const TERMS = [10, 14, 30, 60] as const;
const DEFAULT_TERM = 30;

const EMPTY_LINE: InvoiceLine = { label: '', quantity: 1, unitPrice: 0 };

/**
 * Screen 71a — raise an invoice by hand.
 *
 * There was no such screen. An invoice could only be born one way: pick a
 * finished job from a dialog on the list, and the store copied the accepted
 * quote's lines into it. That covers the common case and nothing else — a
 * call-out fee, a material charge, a correction agreed on the phone, the
 * second half of a job split across two visits. All of those were written into
 * the accounting system instead, which is how a customer ends up holding an
 * invoice this app has never heard of.
 *
 * The dialog is gone and this replaces it, job included: picking one is a step
 * *inside* creating an invoice rather than the only door into it. What the
 * dialog could never offer is what makes this a screen — every line is
 * editable before the document exists, so the owner is not saving a wrong
 * amount and then correcting it.
 *
 * Nothing is written until «Erstellen». The lines live in component state up
 * to that point, which is the difference between this and screen 72: there the
 * invoice is real and every keystroke autosaves to it.
 */
export default function NewInvoicePage() {
  const t = useTranslations('admin.invoiceNew');
  const invoiceT = useTranslations('admin.invoice');
  const router = useRouter();
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const role = useStore((s) => s.demo.role);
  const customers = useStore((s) => s.data.customers);
  const bookings = useStore((s) => s.data.bookings);
  const offers = useStore((s) => s.data.offers);
  const invoices = useStore((s) => s.data.invoices);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);
  const settings = useStore((s) => s.settings);
  const createInvoice = useStore((s) => s.createInvoice);

  const [customerId, setCustomerId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [termDays, setTermDays] = useState<number>(DEFAULT_TERM);
  const [lines, setLines] = useState<InvoiceLine[]>([EMPTY_LINE]);
  const [touched, setTouched] = useState(false);

  /*
   * The jobs that can still be billed: finished, and with no live invoice
   * against them. `cancelled` invoices do not count — cancelling one hands the
   * job back (see `releaseBooking`), and the whole point of doing so is to
   * bill it again correctly.
   */
  const billable = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (b.status === 'completed' || b.status === 'awaitingApproval') &&
          !invoices.some((i) => i.bookingId === b.id && i.status !== 'cancelled'),
      ),
    [bookings, invoices],
  );

  const forCustomer = useMemo(
    () => billable.filter((b) => b.customerId === customerId),
    [billable, customerId],
  );

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const activeCustomers = customers.filter((c) => !c.archivedAt);

  /**
   * What a job's lines look like on an invoice.
   *
   * The store used to do this and could only reach `displayLabel || label`,
   * where `label` is the catalogue *slug* — so a seeded invoice carried a line
   * called «unterhaltsreinigung». Resolving it needs the catalogue and a
   * language, both of which live on a screen and neither of which the store
   * has. `offerLineLabel` is the same resolver the quote builder and the
   * customer's own quote use, so the wording on the invoice matches the wording
   * on the paper that was agreed.
   */
  function linesFor(booking: Booking): InvoiceLine[] {
    const offer = offers.find((o) => o.id === booking.offerId);
    const picked = (offer?.lines ?? []).filter((line) => line.selected);
    if (picked.length === 0) {
      /*
       * A job booked by phone has no quote behind it. Priced at the hourly
       * rate — a starting point the owner can see and change, not a zero that
       * has to be noticed.
       *
       * Against the hours actually worked where somebody has recorded them,
       * and the booked duration only until they have. The plan was the only
       * number on the record when this was written; now that check-out stores
       * what really happened, billing the estimate would mean the office
       * reading «6.5 Std. gearbeitet» on the job and typing 5 on its invoice.
       * It stays editable, and what an overrun should *cost* is still open —
       * see §5.3a on /open-questions.
       */
      const minutes = hasWorkRecord(booking) ? workedMinutes(booking) : booking.duration;
      return [
        {
          label: services.find((s) => s.slug === booking.serviceSlug)?.name[locale] ??
            booking.serviceSlug,
          quantity: Math.round((minutes / 60) * 2) / 2,
          unitPrice: settings.hourlyRate,
        },
      ];
    }
    return picked.map((line) => ({
      label: offerLineLabel(line, services, addOns, locale),
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    }));
  }

  function pickBooking(id: string) {
    setBookingId(id);
    if (!id) return;
    const booking = billable.find((b) => b.id === id);
    if (booking) setLines(linesFor(booking));
  }

  function pickCustomer(id: string) {
    setCustomerId(id);
    /* The job belongs to the customer that was chosen when it was picked.
       Leaving it selected would attach one customer's invoice to another's
       job — and silently, since the job select then shows nothing. */
    setBookingId('');
  }

  /* An empty description is the one thing worth blocking: a line with a price
     and no words on it is a charge the customer cannot check. A zero price is
     not blocked — a goodwill line at CHF 0 is a real thing to put on a bill. */
  const missingLabel = lines.some((line) => line.label.trim() === '');

  function submit() {
    setTouched(true);
    if (!customerId || missingLabel) return;

    const id = createInvoice(
      {
        customerId,
        bookingId: bookingId || undefined,
        lines: lines.map((line) => ({ ...line, label: line.label.trim() })),
        termDays,
      },
      now,
    );
    if (!id) {
      toast.error(t('failed'));
      return;
    }
    const reference = useStore.getState().data.invoices.find((i) => i.id === id)?.reference;
    toast.success(invoiceT('createDone', { reference: reference ?? '' }));
    router.push(`/admin/rechnungen/${id}`);
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        back={{ href: '/admin/rechnungen', label: invoiceT('back') }}
      />

      {/* The role arm of `invoice-permissions`, made visible. AdminShell keeps
          everyone but the owner out of the panel entirely, so this cannot fire
          today — it is here so that the day it can, the screen refuses rather
          than writing a document the person is not allowed to raise. */}
      {!mayInvoice('create', role) ? (
        <Alert tone="warning" title={t('deniedTitle')}>
          {t('deniedBody')}
        </Alert>
      ) : activeCustomers.length === 0 ? (
        <Alert tone="warning" title={t('noCustomersTitle')}>
          {t('noCustomersBody')}
        </Alert>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          noValidate
        >
          <Card>
            <CardHeader title={t('aboutTitle')} description={t('aboutLead')} />
            <CardBody className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t('customer')}
                error={touched && !customerId ? t('customerRequired') : undefined}
              >
                {(props) => (
                  <Select
                    {...props}
                    value={customerId}
                    onChange={(e) => pickCustomer(e.target.value)}
                  >
                    <option value="">{t('customerPlaceholder')}</option>
                    {activeCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.lastName}, {c.firstName}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              {/*
                Optional, and that is the change. A job used to be the only way
                in; here it is a shortcut that fills the lines in and ties the
                invoice to the record it came from — so the job's own screen can
                say it has been billed, and the invoice can link back.
              */}
              <Field
                label={t('booking')}
                optional
                hint={
                  !customerId
                    ? t('bookingHintNoCustomer')
                    : forCustomer.length === 0
                      ? t('bookingHintNone')
                      : t('bookingHint')
                }
              >
                {(props) => (
                  <Select
                    {...props}
                    value={bookingId}
                    disabled={forCustomer.length === 0}
                    onChange={(e) => pickBooking(e.target.value)}
                  >
                    <option value="">{t('bookingNone')}</option>
                    {forCustomer.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.reference} · {format.dateTime(new Date(b.start), 'short')}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label={t('term')} hint={t('termHint')} className="sm:max-w-xs">
                {(props) => (
                  <Select
                    {...props}
                    value={String(termDays)}
                    onChange={(e) => setTermDays(Number(e.target.value))}
                  >
                    {TERMS.map((days) => (
                      <option key={days} value={days}>
                        {t('termDays', { days })}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </CardBody>
          </Card>

          <InvoiceLines
            className="mt-app-section"
            lines={lines}
            editable
            onChange={(index, patch) =>
              setLines((current) =>
                current.map((line, i) => (i === index ? { ...line, ...patch } : line)),
              )
            }
            onAdd={() =>
              setLines((current) => [
                ...current,
                /* Priced at the standard hour rather than at zero — the same
                   default `addInvoiceLine` writes on screen 72, so a line
                   added before saving and one added after start alike. */
                { label: '', quantity: 1, unitPrice: settings.hourlyRate },
              ])
            }
            onRemove={(index) =>
              setLines((current) => current.filter((_, i) => i !== index))
            }
          />

          {touched && missingLabel && (
            <Alert tone="danger" className="mt-app">
              {t('lineLabelRequired')}
            </Alert>
          )}

          <div className="mt-app-section flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg">
              <Receipt className="size-4" aria-hidden />
              {invoiceT('createAction')}
            </Button>
            <p className="text-sm text-ink-tertiary">{t('createNote')}</p>
          </div>
        </form>
      )}
    </div>
  );
}
