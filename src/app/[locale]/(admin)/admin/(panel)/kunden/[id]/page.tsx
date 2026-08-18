'use client';

import { use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Ban,
  Lock,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Chip } from '@/components/ui/chip';
import { StatusBadge } from '@/components/ui/status-badge';
import { Money } from '@/components/ui/money';
import { Textarea } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/empty-state';
import { useHydrated, useNow, useStore } from '@/mock/store';

/**
 * Screen 65 — one customer, their properties, and everything that has happened.
 *
 * The history merges requests, bookings and invoices into a single timeline
 * rather than three tabs. When the phone rings, the owner needs "what is going
 * on with this person" in one read, not a filing system.
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
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const requests = useStore((s) => s.data.requests);
  const bookings = useStore((s) => s.data.bookings);
  const invoices = useStore((s) => s.data.invoices);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const services = useStore((s) => s.services);
  const data = useStore((s) => s.data);
  const patchData = useStore((s) => s.patchData);
  const updateCustomer = useStore((s) => s.updateCustomer);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const customer = customers.find((c) => c.id === id);
  if (!customer) return <p className="text-ink-tertiary">—</p>;

  const owned = properties.filter((p) => p.customerId === customer.id);
  const subscription = subscriptions.find(
    (s) => s.customerId === customer.id && s.status !== 'cancelled',
  );
  const paid = invoices
    .filter((i) => i.customerId === customer.id && i.status === 'paid')
    .reduce((sum, i) => sum + i.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0), 0);

  const timeline = [
    ...requests
      .filter((r) => r.customerId === customer.id)
      .map((r) => ({
        at: r.createdAt,
        kind: t('typeRequest'),
        label: `${r.reference} · ${services.find((s) => s.slug === r.serviceSlug)?.name[locale]}`,
        badge: <StatusBadge entity="request" state={r.status} size="sm" />,
        href: `/admin/anfragen/${r.id}`,
      })),
    ...bookings
      .filter((b) => b.customerId === customer.id)
      .map((b) => ({
        at: b.start,
        kind: t('typeBooking'),
        label: `${b.reference} · ${services.find((s) => s.slug === b.serviceSlug)?.name[locale]}`,
        badge: <StatusBadge entity="booking" state={b.status} size="sm" />,
        href: `/admin/buchungen/${b.id}`,
      })),
    ...invoices
      .filter((i) => i.customerId === customer.id)
      .map((i) => ({
        at: i.issuedAt,
        kind: t('typeInvoice'),
        label: i.reference,
        badge: <StatusBadge entity="invoice" state={i.status} size="sm" />,
        href: `/admin/rechnungen/${i.id}`,
      })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const name = `${customer.firstName} ${customer.lastName}`;

  function toggleBlock() {
    if (customer!.status === 'blocked') {
      updateCustomer(customer!.id, { status: 'active' });
      toast.success(lt('unblockDone', { name }));
      return;
    }
    if (!window.confirm(lt('blockConfirm', { name }))) return;
    updateCustomer(customer!.id, { status: 'blocked' });
    toast.success(lt('blockDone', { name }));
  }

  function toggleArchive() {
    if (customer!.archivedAt) {
      updateCustomer(customer!.id, { archivedAt: undefined });
      toast.success(lt('restoreDone', { name }));
      return;
    }
    if (!window.confirm(lt('archiveConfirm', { name }))) return;
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
      <div className="surface-card mt-6 p-5">
        <h2 className="label-type text-ink-tertiary">{t('detailsTitle')}</h2>
        <dl className="mt-3 grid gap-x-10 text-sm sm:grid-cols-2">
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

        <div className="mt-5 flex flex-wrap gap-2 border-t border-line-subtle pt-4">
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
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          <section>
            <h2 className="display-type text-xl">{t('propertiesTitle')}</h2>
            {owned.length === 0 ? (
              <p className="mt-3 text-sm text-ink-tertiary">{t('propertiesEmpty')}</p>
            ) : (
              <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
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
          </section>

          <section>
            <h2 className="display-type text-xl">{t('historyTitle')}</h2>
            {timeline.length === 0 ? (
              <EmptyState compact className="mt-4" title={t('historyEmpty')} body={t('historyEmpty')} />
            ) : (
              <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
                {timeline.map((entry) => (
                  <li key={`${entry.kind}-${entry.label}`}>
                    <Link
                      href={entry.href}
                      className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:bg-sunken"
                    >
                      <span className="min-w-0">
                        <span className="label-type block text-ink-tertiary">{entry.kind}</span>
                        <span data-numeric className="block">
                          {entry.label}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span data-numeric className="text-sm text-ink-tertiary">
                          {format.dateTime(new Date(entry.at), 'short')}
                        </span>
                        {entry.badge}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <div className="surface-card p-5">
            <h2 className="label-type text-ink-tertiary">{t('subscriptionTitle')}</h2>
            {subscription ? (
              <Link
                href={`/admin/abos/${subscription.id}`}
                className="mt-2 flex items-center justify-between gap-3"
              >
                <span className="font-medium capitalize">{subscription.plan}</span>
                <StatusBadge entity="subscription" state={subscription.status} size="sm" />
              </Link>
            ) : (
              <p className="mt-2 text-ink-tertiary">{t('noSubscription')}</p>
            )}

            <h2 className="label-type mt-5 border-t border-line-subtle pt-4 text-ink-tertiary">
              {t('revenueTitle')}
            </h2>
            <p className="mt-2 text-2xl">
              <Money amount={paid} emphasis="strong" />
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-dashed border-line bg-sunken p-5">
            <h2 className="flex items-center gap-2 font-medium">
              <Lock className="size-4 text-ink-tertiary" aria-hidden />
              {t('notesTitle')}
            </h2>
            <p className="mt-1 text-xs text-ink-tertiary">{t('notesHint')}</p>
            <Textarea
              className="mt-3 min-h-24 bg-page"
              placeholder={t('notesPlaceholder')}
              value={customer.internalNotes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </aside>
      </div>
    </div>
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
