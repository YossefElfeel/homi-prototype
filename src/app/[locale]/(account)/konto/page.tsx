'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, CalendarDays, FileText, Home, Receipt } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
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
 *
 * The three blocks used to be one column of `<section className="mt-10">`, and
 * only the appointment had a surface under it — so "wartet auf Sie", the half
 * of the screen that asks the customer for something, read as loose text
 * beneath the half that does not.
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

  if (!hydrated) return <SkeletonPage label={nav('nav.dashboard')} />;

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
        <PageHeader
          title={
            customer ? t('greeting', { name: customer.firstName }) : nav('nav.dashboard')
          }
        />
        <EmptyState
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

  const waiting = openOffers.length + openInvoices.length + (unread > 0 ? 1 : 0);

  return (
    <div>
      <PageHeader title={t('greeting', { name: customer?.firstName ?? '' })} />

      <div className="gap-app-section grid lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card>
            <CardHeader title={t('nextTitle')} />
            <CardBody>
              {next && nextProperty && arrivalEnd && freeUntil ? (
                <>
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
                    <Alert tone="info" className="mt-4">
                      <span data-numeric>
                        {t('movedNote', {
                          from: format.dateTime(new Date(next.reschedule.from), 'full'),
                          at: format.dateTime(new Date(next.reschedule.at), 'full'),
                        })}
                      </span>
                    </Alert>
                  )}

                  <p className="mt-4 text-sm text-ink-tertiary">
                    {t('cancelFreeUntil', {
                      date: format.dateTime(freeUntil, 'full'),
                    })}
                  </p>
                  <Button asChild variant="secondary" size="sm" className="mt-5">
                    <Link href={`/konto/objekte/${nextProperty.id}`}>
                      <CalendarDays className="size-3.5" aria-hidden />
                      {t('nextAction')}
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-ink-tertiary">{t('nextNone')}</p>
              )}
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-app-section lg:col-span-5">
          {/* `pad="none"` so a row's hover fill reaches the card's own edges —
              padded, every row would be a stripe with a margin around it. */}
          <Card pad="none">
            <CardHeader className="p-card" title={t('openTitle')} />
            {waiting === 0 ? (
              <p className="px-card pb-card text-sm text-ink-tertiary">{t('openNone')}</p>
            ) : (
              <ul className="border-t border-line-subtle">
                {openOffers.map((offer) => (
                  <WaitingRow
                    key={offer.id}
                    href={`/offerte/${offer.id}`}
                    icon={FileText}
                  >
                    {t('openOffer', {
                      reference: offer.reference,
                      date: offer.expiresAt
                        ? format.dateTime(new Date(offer.expiresAt), 'short')
                        : '—',
                    })}
                  </WaitingRow>
                ))}
                {openInvoices.map((invoice) => (
                  <WaitingRow
                    key={invoice.id}
                    href={`/konto/rechnungen/${invoice.id}`}
                    icon={Receipt}
                  >
                    {t('openInvoice', {
                      reference: invoice.reference,
                      date: format.dateTime(new Date(invoice.dueAt), 'short'),
                    })}
                  </WaitingRow>
                ))}
                {unread > 0 && (
                  <WaitingRow href="/konto/nachrichten">
                    {t('openMessage', { n: unread })}
                  </WaitingRow>
                )}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title={t('quickTitle')} />
            <CardBody className="flex flex-wrap gap-3">
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
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function WaitingRow({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon?: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <li className="border-b border-line-subtle last:border-0">
      <Link
        href={href}
        className="px-card min-h-row-h flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-sunken"
      >
        <span className="flex items-center gap-3">
          {/* The message row has no glyph of its own, and an icon column that
              is empty on one row out of three reads as a missing image. The
              text starts at the same place either way. */}
          {Icon ? (
            <Icon className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
          ) : (
            <span aria-hidden className="size-4 shrink-0" />
          )}
          {children}
        </span>
        <ArrowRight className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
      </Link>
    </li>
  );
}
