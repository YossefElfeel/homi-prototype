'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowRight,
  Ban,
  Lock,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { ActionIcon } from '@/lib/action-icons';
import { customerHistory, invoiceSubject, invoiceTotal } from '@/lib/customer-history';
import {
  METHOD_ICONS,
  SAVABLE_METHODS,
  cardBrand,
  cardLastFour,
  invoicePayment,
} from '@/lib/payment-methods';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ConfirmDialog, useDismissLabel } from '@/components/ui/confirm-dialog';
import { DataView, type Column } from '@/components/ui/data-view';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/empty-state';
import { RowAction, RowActionButton, RowActions } from '@/components/ui/row-actions';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Invoice, SavedMethodKind } from '@/mock/schema';

/** How much of the timeline the record itself carries. The rest is screen 65a. */
const RECENT = 5;

/**
 * Screen 65 — one customer, their properties, and everything that has happened.
 *
 * The page answers four questions in the order they get asked on a phone call:
 * who is this, what do we hold for them, what have they paid, and what has
 * happened. The last two used to be one merged timeline, which meant the
 * invoice was a line reading "R-2024-014" with no amount, no payment state and
 * no way to see what was on it — the two facts the call is usually about.
 *
 * The timeline stays, shortened to the last five, with the searchable version
 * on its own screen. A list that only grows is a list that stops being read.
 */
export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.customer');
  /* The list owns the vocabulary for these three states and the two decisions
     that reach them. A second copy here is a second thing to reword. */
  const lt = useTranslations('admin.customers');
  /* Field labels belong to the form that writes them (64a), not to a second
     list here that would drift the first time one is reworded. */
  const ft = useTranslations('admin.customerNew');
  const methodLabel = useTranslations('status.method');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const dismissLabel = useDismissLabel();
  const now = useNow();
  const hydrated = useHydrated();

  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const requests = useStore((s) => s.data.requests);
  const offers = useStore((s) => s.data.offers);
  const bookings = useStore((s) => s.data.bookings);
  const invoices = useStore((s) => s.data.invoices);
  const payments = useStore((s) => s.data.payments);
  const paymentMethods = useStore((s) => s.data.paymentMethods);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const services = useStore((s) => s.services);
  const plans = useStore((s) => s.plans);
  const data = useStore((s) => s.data);
  const patchData = useStore((s) => s.patchData);
  const updateCustomer = useStore((s) => s.updateCustomer);
  const addPaymentMethod = useStore((s) => s.addPaymentMethod);
  /* No `removePaymentMethod` here on purpose — see the list. */
  const setDefaultPaymentMethod = useStore((s) => s.setDefaultPaymentMethod);

  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<SavedMethodKind>('card');
  const [label, setLabel] = useState('');
  /* The four a card is read off the phone as. Only the brand, the last four
     and the expiry survive `saveMethod`. */
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  /** The invoice open in the popup, by id — never the record, which the store replaces. */
  const [openInvoice, setOpenInvoice] = useState<string | null>(null);
  /* One record on this screen, so a flag is enough — the list needs
     `useConfirmTarget` because there the question is about a row. */
  const [confirming, setConfirming] = useState<'block' | 'archive' | null>(null);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const customer = customers.find((c) => c.id === id);
  if (!customer) return <p className="text-ink-tertiary">—</p>;

  const owned = properties.filter((p) => p.customerId === customer.id);
  const subscription = subscriptions.find(
    (s) => s.customerId === customer.id && s.status !== 'cancelled',
  );
  const myInvoices = invoices
    .filter((i) => i.customerId === customer.id)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const paid = myInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + invoiceTotal(i), 0);
  const myMethods = paymentMethods.filter((m) => m.customerId === customer.id);

  const sources = {
    requests,
    offers,
    bookings,
    invoices,
    subscriptions,
    plans,
    services,
    locale,
  };
  const timeline = customerHistory(customer.id, sources);
  const invoiceInDialog = myInvoices.find((i) => i.id === openInvoice);

  const name = `${customer.firstName} ${customer.lastName}`;

  /* The reversals ask nothing. Undoing a block or pulling a record back out of
     the archive is the safe direction, and a confirm on it makes the undo feel
     as heavy as the act it undoes. */
  function toggleBlock() {
    if (customer!.status === 'blocked') {
      updateCustomer(customer!.id, { status: 'active' });
      toast.success(lt('unblockDone', { name }));
      return;
    }
    setConfirming('block');
  }

  function toggleArchive() {
    if (customer!.archivedAt) {
      updateCustomer(customer!.id, { archivedAt: undefined });
      toast.success(lt('restoreDone', { name }));
      return;
    }
    setConfirming('archive');
  }

  function confirmBlock() {
    setConfirming(null);
    updateCustomer(customer!.id, { status: 'blocked' });
    toast.success(lt('blockDone', { name }));
  }

  function confirmArchive() {
    setConfirming(null);
    updateCustomer(customer!.id, { archivedAt: now.toISOString() });
    toast.success(lt('archiveDone', { name }));
  }

  function setNotes(notes: string) {
    patchData({
      customers: data.customers.map((c) =>
        c.id === customer!.id ? { ...c, internalNotes: notes } : c,
      ),
    });
  }

  /*
   * A card has four fields, and only two of them are kept.
   *
   * The dialog asked for a *label* — "type Visa · 4242 yourself" — which is
   * the shape of the record leaking into the form. Nobody reading a card off
   * the phone has a label; they have a number, a name, an expiry and a
   * security code, and the label is what the product should work out.
   *
   * So the four are typed and the save keeps the brand, the last four and the
   * expiry. The number and the code never reach the store, and `SavedPaymentMethod`
   * has nowhere to put them — a prototype that models a stored PAN is a
   * prototype somebody builds for real.
   */
  const cardReady =
    cardLastFour(cardNumber).length === 4 &&
    cardName.trim().length > 0 &&
    /^\d{2}\/\d{2}$/.test(cardExpiry) &&
    /^\d{3,4}$/.test(cardCvv);
  const canSave = kind === 'card' ? cardReady : label.trim().length > 0;

  function saveMethod() {
    addPaymentMethod(
      kind === 'card'
        ? {
            customerId: customer!.id,
            kind,
            label: `${cardBrand(cardNumber)} · ${cardLastFour(cardNumber)}`,
            expiresAt: cardExpiry,
          }
        : { customerId: customer!.id, kind, label: label.trim() },
      now,
    );
    setAdding(false);
    setLabel('');
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvv('');
    setKind('card');
    toast.success(t('paymentAdded'));
  }


  /*
   * Six columns on a record screen rather than a list screen, so `tableOnly`
   * carries the two that are already on the card in another form: the card
   * shows the amount next to the title and the payment state as its trailing
   * badge, and repeating them as labelled rows underneath is the "compressed
   * table" the brief rules out.
   */
  const invoiceColumns: Column<Invoice>[] = [
    {
      key: 'reference',
      header: t('colInvoice'),
      primary: true,
      sortBy: (i) => i.reference,
      cell: (i) => (
        <span data-numeric className="font-medium">
          {i.reference}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('colPaymentStatus'),
      trailing: true,
      sortBy: (i) => i.status,
      cell: (i) => <StatusBadge entity="invoice" state={i.status} size="sm" />,
    },
    {
      key: 'service',
      header: t('colService'),
      cell: (i) => (
        <span className="text-ink-secondary">{invoiceSubject(i, sources)}</span>
      ),
    },
    {
      key: 'date',
      header: t('colDate'),
      sortBy: (i) => i.issuedAt,
      cell: (i) => (
        <span data-numeric className="text-sm text-ink-secondary">
          {format.dateTime(new Date(i.issuedAt), 'short')}
        </span>
      ),
    },
    {
      key: 'method',
      header: t('colMethod'),
      cell: (i) => {
        const payment = invoicePayment(i.id, payments);
        /* An unpaid invoice has no method and never had one — printing an em
           dash there would read as missing data rather than as "still open". */
        if (!payment) {
          return <span className="text-sm text-ink-tertiary">{t('methodNone')}</span>;
        }
        const Icon = METHOD_ICONS[payment.method];
        return (
          <span className="inline-flex items-center gap-2 text-sm text-ink-secondary">
            <Icon className="size-3.5 shrink-0 text-ink-tertiary" aria-hidden />
            {methodLabel(payment.method)}
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: t('colAmount'),
      align: 'end',
      trailing: true,
      sortBy: (i) => invoiceTotal(i),
      cell: (i) => <Money amount={invoiceTotal(i)} />,
    },
  ];

  return (
    <div>
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/kunden">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="display-type text-3xl">{name}</h1>

        {/* The record could be read here and changed nowhere. Every decision
            the list can take now also lives on the screen you land on when you
            follow a link into this customer from a request or an invoice. */}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/admin/kunden/${customer.id}/bearbeiten`}>
              <Pencil className="size-3.5" aria-hidden />
              {t('edit')}
            </Link>
          </Button>
          <Button size="sm" variant="secondary" onClick={toggleBlock}>
            {customer.status === 'blocked' ? (
              <ShieldCheck className="size-3.5" aria-hidden />
            ) : (
              <Ban className="size-3.5" aria-hidden />
            )}
            {lt(customer.status === 'blocked' ? 'rowUnblock' : 'rowBlock')}
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleArchive}>
            {customer.archivedAt ? (
              <ArchiveRestore className="size-3.5" aria-hidden />
            ) : (
              <Archive className="size-3.5" aria-hidden />
            )}
            {lt(customer.archivedAt ? 'rowRestore' : 'rowArchive')}
          </Button>
        </div>
      </div>

      {customer.status === 'blocked' && (
        <Alert tone="danger" icon={Ban} title={t('blockedTitle')} className="mt-5">
          {t('blockedBody')}
        </Alert>
      )}
      {customer.archivedAt && (
        <Alert tone="warning" icon={Archive} title={t('archivedTitle')} className="mt-3">
          {t('archivedBody')}
        </Alert>
      )}

      {/*
        Name, since-date and language used to be three loose lines under the
        heading, and the contact links a bare row of buttons under those — the
        only block on the screen with no surface of its own, next to four that
        had one. Status was not there at all, so "why can I not send this
        person a quote" had no answer on the record it was true of.
      */}
      <Card className="mt-6">
        <CardHeader title={t('detailsTitle')} />
        <CardBody>
          <dl className="grid gap-x-10 text-sm sm:grid-cols-2">
            <DetailRow label={t('statusLabel')}>
              {customer.status === 'blocked' ? (
                <Chip tone="danger">{lt('blocked')}</Chip>
              ) : customer.status === 'active' ? (
                lt('active')
              ) : (
                lt('inactive')
              )}
            </DetailRow>
            <DetailRow label={t('since')}>
              <span data-numeric>
                {format.dateTime(new Date(customer.createdAt), 'full')}
              </span>
            </DetailRow>
            <DetailRow label={ft('email')}>{customer.email}</DetailRow>
            <DetailRow label={ft('phone')}>
              <span data-numeric>{customer.phone}</span>
            </DetailRow>
            <DetailRow label={t('language')}>{customer.language.toUpperCase()}</DetailRow>
            {customer.archivedAt && (
              <DetailRow label={lt('tabArchived')}>
                <span data-numeric>
                  {format.dateTime(new Date(customer.archivedAt), 'full')}
                </span>
              </DetailRow>
            )}
          </dl>
        </CardBody>

        <CardFooter>
          <Button asChild size="sm" variant="secondary">
            <a href={`tel:${customer.phone.replace(/\s/g, '')}`}>
              <Phone className="size-3.5" aria-hidden />
              {customer.phone}
            </a>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}>
              <MessageCircle className="size-3.5" aria-hidden />
              WhatsApp
            </a>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <a href={`mailto:${customer.email}`}>
              <Mail className="size-3.5" aria-hidden />
              {customer.email}
            </a>
          </Button>
        </CardFooter>
      </Card>

      {/*
        Everything on this screen is now on a card.
        Six blocks, and three of them — the properties, the saved methods, the
        recent history — were bare headings over a list drawn straight onto the
        page background, next to three that had a surface. There is no rule the
        reader can infer from that: it reads as some of the record being part
        of the record and the rest being page furniture.
      */}
      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          <Card pad="none">
            <CardHeader title={t('propertiesTitle')} className="p-card pb-4" />
            {owned.length === 0 ? (
              <p className="px-card pb-card text-sm text-ink-tertiary">
                {t('propertiesEmpty')}
              </p>
            ) : (
              <ul className="divide-y divide-line-subtle border-t border-line-subtle px-card">
                {owned.map((property) => (
                  <li key={property.id}>
                    <Link
                      href={`/admin/objekte/${property.id}`}
                      className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-sunken"
                    >
                      <span>
                        <span className="block font-medium">{property.label}</span>
                        <span className="block text-sm text-ink-secondary">
                          {property.street}, <span data-numeric>{property.postcode}</span>{' '}
                          {property.city}
                        </span>
                      </span>
                      <span data-numeric className="text-sm text-ink-tertiary">
                        {property.area} m²
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/*
            §11.2 pays a plan by card and §10 settles an invoice by QR-bill, so
            "what do we have on file for this person" was a real question with
            no screen behind it: the customer could see their own methods on 45
            and the owner could see nothing at all. The list is the same store
            records, which is what makes the two views agree.
          */}
          <Card pad="none">
            <CardHeader
              className="p-card pb-4"
              title={t('paymentTitle')}
              description={t('paymentLead')}
              actions={
                <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
                  <Plus className="size-3.5" aria-hidden />
                  {t('paymentAdd')}
                </Button>
              }
            />

            {myMethods.length === 0 ? (
              <p className="border-t border-line-subtle p-card text-sm text-ink-tertiary">
                {t('paymentEmpty')}
              </p>
            ) : (
              <ul className="divide-y divide-line-subtle border-t border-line-subtle px-card">
                {myMethods.map((method) => {
                  const Icon = METHOD_ICONS[method.kind];
                  return (
                    <li
                      key={method.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                        <span className="min-w-0">
                          <span data-numeric className="block">
                            {method.label}
                          </span>
                          <span className="block text-xs text-ink-tertiary">
                            {methodLabel(method.kind)} ·{' '}
                            {t('paymentAddedOn', {
                              date: format.dateTime(new Date(method.addedAt), 'short'),
                            })}
                            {/* The one field of a card worth keeping besides
                                the brand and the last four: a plan charged to
                                a card that runs out mid-term is a phone call
                                the record can prompt a week early. */}
                            {method.expiresAt && (
                              <>
                                {' · '}
                                <span data-numeric>
                                  {t('paymentExpires', { date: method.expiresAt })}
                                </span>
                              </>
                            )}
                          </span>
                        </span>
                        {method.isDefault && <Chip>{t('paymentDefaultLabel')}</Chip>}
                      </span>
                      {/*
                        Which card is charged is an instruction the customer
                        gives on the phone, so the owner can act on it. Deleting
                        one is not: it is the customer's own instrument, and it
                        stays theirs to remove on screen 45. A bin icon here
                        would be the owner throwing away something they were
                        only ever shown.
                      */}
                      {!method.isDefault && (
                        <Button
                          variant="quiet"
                          size="sm"
                          onClick={() => {
                            setDefaultPaymentMethod(method.id);
                            toast.success(t('paymentDefaultSet'));
                          }}
                        >
                          {t('paymentMakeDefault')}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Says where the missing control is. A section that can add and
                cannot remove looks like a control that was forgotten unless
                the screen names the reason — and "ring us to delete your card"
                is the support call this sentence prevents. */}
            {myMethods.length > 0 && (
              <p className="border-t border-line-subtle p-card text-xs text-ink-tertiary">
                {t('paymentRemoveHint')}
              </p>
            )}
          </Card>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader title={t('subscriptionTitle')} />
            {subscription ? (
              <Link
                href={`/admin/abos/${subscription.planId}/${subscription.id}`}
                className="mt-2 flex items-center justify-between gap-3"
              >
                <span className="font-medium">
                  {plans.find((x) => x.id === subscription.planId)?.name[locale] ?? '—'}
                </span>
                <StatusBadge entity="subscription" state={subscription.status} size="sm" />
              </Link>
            ) : (
              <p className="mt-2 text-ink-tertiary">{t('noSubscription')}</p>
            )}

            <div className="mt-5 border-t border-line-subtle pt-4">
              <CardHeader title={t('revenueTitle')} headingLevel={3} />
              <p className="mt-2 text-2xl">
                <Money amount={paid} emphasis="strong" />
              </p>
            </div>
          </Card>

          <Card tone="muted" className="border-dashed">
            <CardHeader
              headingLevel={2}
              title={
                <span className="flex items-center gap-2">
                  <Lock className="size-4 text-ink-tertiary" aria-hidden />
                  {t('notesTitle')}
                </span>
              }
            />
            <p className="mt-1 text-xs text-ink-tertiary">{t('notesHint')}</p>
            <Textarea
              className="mt-3 min-h-24 bg-page"
              placeholder={t('notesPlaceholder')}
              value={customer.internalNotes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Card>
        </aside>
      </div>

      {/*
        Full width rather than in the seven-column half, because six columns in
        a half-width grid cell is the squeezed table the card layout exists to
        avoid. This is also the only place in the panel where one customer's
        invoices are listed together — /admin/rechnungen is every customer's.
      */}
      <section className="mt-10">
        <h2 className="display-type text-xl">{t('invoicesTitle')}</h2>
        <DataView
          className="mt-4"
          items={myInvoices}
          columns={invoiceColumns}
          getKey={(i) => i.id}
          caption={t('invoicesTitle')}
          rowActions={(i) => (
            <RowActions>
              {/* Opens over the record rather than navigating: the question is
                  usually "what was on that one" mid-call, and leaving the
                  customer to answer it costs the way back. */}
              <RowActionButton
                label={t('invoiceRowView')}
                onClick={() => setOpenInvoice(i.id)}
              >
                <ActionIcon.open aria-hidden />
              </RowActionButton>
              <RowAction href={`/admin/rechnungen/${i.id}`} label={t('invoiceDialogOpen')}>
                <ActionIcon.invoice aria-hidden />
              </RowAction>
            </RowActions>
          )}
          empty={
            <EmptyState
              icon={Receipt}
              title={t('invoicesEmptyTitle')}
              body={t('invoicesEmptyBody')}
            />
          }
        />
      </section>

      <Card pad="none" className="mt-10">
        <CardHeader
          className="p-card pb-4"
          title={t('historyTitle')}
          description={
            timeline.length > 0
              ? t('historyRecent', { n: Math.min(RECENT, timeline.length) })
              : undefined
          }
          actions={
            timeline.length > 0 ? (
              <Button asChild variant="link" size="sm">
                <Link href={`/admin/kunden/${customer.id}/verlauf`}>
                  {t('historyAll')}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            ) : undefined
          }
        />

        {timeline.length === 0 ? (
          <div className="px-card pb-card">
            <EmptyState compact title={t('historyEmpty')} body={t('historyEmpty')} />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-line-subtle border-t border-line-subtle px-card">
              {timeline.slice(0, RECENT).map((entry) => (
                <li key={`${entry.kind}-${entry.id}`}>
                  <Link
                    href={entry.href}
                    className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:bg-sunken"
                  >
                    <span className="min-w-0">
                      <span className="label-type block text-ink-tertiary">
                        {t(kindKey(entry.kind))}
                      </span>
                      <span data-numeric className="block">
                        {entry.reference} · {entry.detail}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span data-numeric className="text-sm text-ink-tertiary">
                        {entry.at ? format.dateTime(new Date(entry.at), 'short') : '—'}
                      </span>
                      <StatusBadge
                        entity={entry.badge.entity}
                        state={entry.badge.state}
                        size="sm"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent closeLabel={t('paymentCancel')}>
          <DialogHeader>
            <DialogTitle>{t('paymentAddTitle')}</DialogTitle>
            <DialogDescription>{t('paymentAddLead')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label={t('paymentKind')}>
              {(props) => (
                <Select
                  {...props}
                  value={kind}
                  onChange={(e) => setKind(e.target.value as SavedMethodKind)}
                >
                  {SAVABLE_METHODS.map((value) => (
                    <option key={value} value={value}>
                      {methodLabel(value)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {kind === 'card' ? (
              <>
                <Field label={t('cardNumber')}>
                  {(props) => (
                    <Input
                      {...props}
                      data-numeric
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                    />
                  )}
                </Field>
                <Field label={t('cardName')}>
                  {(props) => (
                    <Input
                      {...props}
                      autoComplete="off"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder={`${customer.firstName} ${customer.lastName}`}
                    />
                  )}
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('cardExpiry')}>
                    {(props) => (
                      <Input
                        {...props}
                        data-numeric
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="09/28"
                      />
                    )}
                  </Field>
                  <Field label={t('cardCvv')} hint={t('cardCvvHint')}>
                    {(props) => (
                      <Input
                        {...props}
                        data-numeric
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                      />
                    )}
                  </Field>
                </div>
                {/* Says what survives the save, on the form that collects it.
                    An owner typing a customer's card number over the phone is
                    entitled to know which parts of it we keep. */}
                <p className="rounded-[var(--radius-sm)] bg-sunken p-3 text-xs text-ink-tertiary">
                  {t('cardStorageNote')}
                </p>
              </>
            ) : (
              <Field label={t('paymentLabelField')} hint={t('paymentLabelHint')}>
                {(props) => (
                  <Input
                    {...props}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={t('paymentLabelPlaceholder')}
                  />
                )}
              </Field>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {t('paymentCancel')}
            </Button>
            <Button onClick={saveMethod} disabled={!canSave}>
              {t('paymentAddSave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(invoiceInDialog)} onOpenChange={() => setOpenInvoice(null)}>
        <DialogContent closeLabel={t('dismiss')}>
          {invoiceInDialog && (
            <InvoiceDialogBody
              invoice={invoiceInDialog}
              subject={invoiceSubject(invoiceInDialog, sources)}
              methodName={(() => {
                const payment = invoicePayment(invoiceInDialog.id, payments);
                return payment ? methodLabel(payment.method) : undefined;
              })()}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Both were `window.confirm`, the same two as on the list — and the same
          two decisions, so the same box asks them. */}
      <ConfirmDialog
        open={confirming === 'block'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={lt('blockConfirmTitle', { name })}
        body={lt('blockConfirm')}
        action={lt('rowBlock')}
        dismiss={dismissLabel}
        onConfirm={confirmBlock}
      />

      <ConfirmDialog
        open={confirming === 'archive'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={lt('archiveConfirmTitle', { name })}
        body={lt('archiveConfirm')}
        action={lt('rowArchive')}
        dismiss={dismissLabel}
        onConfirm={confirmArchive}
      />
    </div>
  );
}

/** The timeline's four kinds answer to four label keys on `admin.customer`. */
function kindKey(kind: 'request' | 'offer' | 'booking' | 'invoice') {
  return (
    {
      request: 'typeRequest',
      offer: 'typeOffer',
      booking: 'typeBooking',
      invoice: 'typeInvoice',
    } as const
  )[kind];
}

/**
 * The popup's contents.
 *
 * Read-only on purpose: screen 72 is where an invoice is edited, and a second
 * place to change an amount is a second place two amounts can disagree.
 */
function InvoiceDialogBody({
  invoice,
  subject,
  methodName,
}: {
  invoice: Invoice;
  subject: string;
  methodName?: string;
}) {
  const t = useTranslations('admin.customer');
  const format = useFormatter();

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          <span data-numeric>{invoice.reference}</span>
        </DialogTitle>
        <DialogDescription>{subject}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge entity="invoice" state={invoice.status} />
        {invoice.paidAt && (
          <span className="text-sm text-ink-secondary">
            {methodName
              ? t('invoiceDialogPaidVia', { method: methodName })
              : t('invoiceDialogPaid')}
          </span>
        )}
      </div>

      <dl className="mt-4 grid gap-x-10 text-sm sm:grid-cols-2">
        <DetailRow label={t('invoiceDialogIssued')}>
          <span data-numeric>{format.dateTime(new Date(invoice.issuedAt), 'full')}</span>
        </DetailRow>
        <DetailRow label={t('invoiceDialogDue')}>
          <span data-numeric>{format.dateTime(new Date(invoice.dueAt), 'full')}</span>
        </DetailRow>
        {invoice.paidAt && (
          <DetailRow label={t('invoiceDialogPaid')}>
            <span data-numeric>{format.dateTime(new Date(invoice.paidAt), 'full')}</span>
          </DetailRow>
        )}
      </dl>

      <h3 className="label-type mt-5 text-ink-tertiary">{t('invoiceDialogLines')}</h3>
      <ul className="mt-2 divide-y divide-line-subtle border-y border-line-subtle">
        {invoice.lines.map((line, index) => (
          <li
            key={`${line.label}-${index}`}
            className="flex items-baseline justify-between gap-4 py-2 text-sm"
          >
            <span className="min-w-0">
              {line.label}
              {line.quantity !== 1 && (
                <span data-numeric className="text-ink-tertiary">
                  {' '}
                  × {line.quantity}
                </span>
              )}
            </span>
            <Money amount={line.quantity * line.unitPrice} />
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-baseline justify-between gap-4">
        <span className="font-medium">{t('invoiceDialogTotal')}</span>
        <Money amount={invoiceTotal(invoice)} emphasis="strong" className="text-xl" />
      </p>

      <DialogFooter>
        <Button asChild variant="secondary">
          <Link href={`/admin/rechnungen/${invoice.id}`}>{t('invoiceDialogOpen')}</Link>
        </Button>
      </DialogFooter>
    </>
  );
}

/** Label left, value right — the shape the summary blocks already use. */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-subtle py-1.5">
      <dt className="shrink-0 text-ink-tertiary">{label}</dt>
      <dd className="min-w-0 text-right [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
