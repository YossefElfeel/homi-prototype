'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CalendarDays, FileText, Home, Receipt } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';

/**
 * Screen 35 — the dashboard.
 *
 * Two blocks, in this order: the next appointment, then anything waiting on
 * the customer. Everything else is navigation. The specification's problem is
 * that customers phone to ask "when are you coming?" and "did you get my
 * payment?" — this screen exists to answer both without a call.
 *
 * The free-cancellation deadline (§12) sits under the appointment rather than
 * in a policy page: it is only useful while it is still true.
 */
export default function AccountDashboardPage() {
  const t = useTranslations('account.dashboard');
  const nav = useTranslations('account.shell');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const now = useNow();

  const { customer, bookings, offers, invoices, messages } = useAccount();
  const services = useStore((s) => s.services);
  const properties = useStore((s) => s.data.properties);
  const settings = useStore((s) => s.settings);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const next = bookings
    .filter((b) => new Date(b.start) >= now && b.status !== 'closed')
    .sort((a, b) => (a.start < b.start ? -1 : 1))[0];

  const openOffers = offers.filter((o) => o.status === 'sent');
  const openInvoices = invoices.filter(
    (i) => i.status === 'sent' || i.status === 'overdue',
  );
  const unread = messages.filter((m) => m.from === 'homivaro' && !m.readByCustomer).length;

  const nothingYet =
    bookings.length === 0 && offers.length === 0 && invoices.length === 0;

  if (nothingYet) {
    return (
      <>
        {/* No customer at all (the launch-day scenario) means there is no name
            to greet — "Hello" with a hole after it reads as a bug. The page
            falls back to its own name and lets the empty state do the welcome. */}
        <h1 className="display-type text-3xl">
          {customer ? t('greeting', { name: customer.firstName }) : nav('nav.dashboard')}
        </h1>
        <EmptyState
          className="mt-8"
          title={t('emptyTitle')}
          body={t('emptyBody')}
          action={
            <Button asChild>
              <Link href="/anfrage">
                {t('emptyAction')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  const nextProperty = next && properties.find((p) => p.id === next.propertyId);
  const nextService =
    next && services.find((s) => s.slug === next.serviceSlug)?.name[locale];
  const arrivalEnd =
    next && new Date(new Date(next.start).getTime() + next.arrivalWindow * 60_000);
  const freeUntil =
    next &&
    new Date(new Date(next.start).getTime() - settings.cancellationFreeHours * 3_600_000);

  return (
    <>
      <h1 className="display-type text-3xl">
        {t('greeting', { name: customer?.firstName ?? '' })}
      </h1>

      <section className="mt-8">
        <h2 className="label-type text-ink-tertiary">{t('nextTitle')}</h2>
        {next && nextProperty && arrivalEnd && freeUntil ? (
          <div className="surface-card mt-3 p-6">
            <p className="display-type text-2xl">
              {format.dateTime(new Date(next.start), 'full')}
            </p>
            <p data-numeric className="mt-2 text-ink-secondary">
              {t('arrival', {
                from: format.dateTime(new Date(next.start), 'time'),
                to: format.dateTime(arrivalEnd, 'time'),
              })}
            </p>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-secondary">
              <span>{nextService}</span>
              <span aria-hidden className="text-ink-tertiary">
                ·
              </span>
              <span>
                {nextProperty.street}, {nextProperty.city}
              </span>
            </p>
            {/*
              The date used to change under them. A rescheduled job looked
              exactly like one that had always been on that day, so the only
              way to find out we had moved it was to have remembered the old
              date — and then to doubt yourself.
            */}
            {next.reschedule && (
              <p
                data-numeric
                className="mt-4 rounded-[var(--radius-sm)] bg-status-info p-3 text-sm text-status-info-fg"
              >
                {t('movedNote', {
                  from: format.dateTime(new Date(next.reschedule.from), 'full'),
                  at: format.dateTime(new Date(next.reschedule.at), 'full'),
                })}
              </p>
            )}

            <p className="mt-4 text-sm text-ink-tertiary">
              {t('cancelFreeUntil', { date: format.dateTime(freeUntil, 'full') })}
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-5">
              <Link href={`/konto/objekte/${nextProperty.id}`}>
                <CalendarDays className="size-3.5" aria-hidden />
                {t('nextAction')}
              </Link>
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-ink-secondary">{t('nextNone')}</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="label-type text-ink-tertiary">{t('openTitle')}</h2>
        {openOffers.length + openInvoices.length + (unread > 0 ? 1 : 0) === 0 ? (
          <p className="mt-3 text-ink-secondary">{t('openNone')}</p>
        ) : (
          <ul className="mt-3 border-t border-line-subtle">
            {openOffers.map((offer) => (
              <li key={offer.id} className="border-b border-line-subtle">
                <Link
                  href={`/offerte/${offer.id}`}
                  className="flex min-h-11 items-center justify-between gap-4 py-3.5"
                >
                  <span className="flex items-center gap-3">
                    <FileText className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                    {t('openOffer', {
                      reference: offer.reference,
                      date: offer.expiresAt
                        ? format.dateTime(new Date(offer.expiresAt), 'short')
                        : '—',
                    })}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                </Link>
              </li>
            ))}
            {openInvoices.map((invoice) => (
              <li key={invoice.id} className="border-b border-line-subtle">
                <Link
                  href={`/konto/rechnungen/${invoice.id}`}
                  className="flex min-h-11 items-center justify-between gap-4 py-3.5"
                >
                  <span className="flex items-center gap-3">
                    <Receipt className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                    {t('openInvoice', {
                      reference: invoice.reference,
                      date: format.dateTime(new Date(invoice.dueAt), 'short'),
                    })}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                </Link>
              </li>
            ))}
            {unread > 0 && (
              <li className="border-b border-line-subtle">
                <Link
                  href="/konto/nachrichten"
                  className="flex min-h-11 items-center justify-between gap-4 py-3.5"
                >
                  <span>{t('openMessage', { n: unread })}</span>
                  <ArrowRight className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="label-type text-ink-tertiary">{t('quickTitle')}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/anfrage">{t('quickRequest')}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/konto/objekte">
              <Home className="size-4" aria-hidden />
              {t('quickProperties')}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/konto/rechnungen">
              <Receipt className="size-4" aria-hidden />
              {t('quickInvoices')}
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
