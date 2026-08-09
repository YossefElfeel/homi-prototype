'use client';

import { use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { CalendarPlus, Check, Clock, KeyRound, MapPin } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/ui/money';
import { OfferShell } from '@/components/offer/offer-shell';
import { useOffer } from '@/components/offer/use-offer';
import { addMinutes } from '@/mock/engines/availability';
import { offerTotal } from '@/mock/engines/offers';
import { useHydrated, useStore } from '@/mock/store';

const ACCESS_LABELS: Record<string, string> = {
  'customer-present': 'Sie sind da',
  'key-left': 'Schlüssel liegt bereit',
  'key-box': 'Schlüsselkasten mit Code',
  'other-person': 'Jemand anderes ist da',
};

/**
 * Screen 28 — the booking confirmation.
 *
 * Leads with the arrival window rather than a start time, because that is the
 * promise the company can actually keep and the one the marketing site made.
 * Access details are named, never shown: the code stays out of an email-linked
 * page, which is exactly the kind of page that gets forwarded.
 */
export default function ConfirmedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('offer.confirmed');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();
  const settings = useStore((s) => s.settings);

  const data = useOffer(id);
  if (!hydrated) return <div className="p-gutter text-ink-tertiary">…</div>;
  if (!data?.booking) return null;

  const { offer, booking, property, service } = data;
  const start = new Date(booking.start);
  const windowEnd = addMinutes(start, booking.arrivalWindow);

  return (
    <OfferShell offer={offer}>
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-sm border border-status-success-line bg-status-success px-2 py-1 text-xs font-medium text-status-success-fg">
          <Check className="size-3.5" aria-hidden />
          {t('badge')}
        </span>

        <h1 className="display-type mt-5 text-[clamp(1.875rem,4vw,3rem)]">{t('title')}</h1>

        <p className="mt-4 flex items-baseline gap-3">
          <span className="label-type text-ink-tertiary">{t('reference')}</span>
          <span data-numeric className="text-xl font-semibold">
            {booking.reference}
          </span>
        </p>

        <dl className="mt-10 grid gap-px border border-line-subtle bg-line-subtle sm:grid-cols-2">
          <div className="bg-page p-6">
            <dt className="label-type flex items-center gap-2 text-ink-tertiary">
              <Clock className="size-3.5" aria-hidden />
              {t('dateTitle')}
            </dt>
            <dd data-numeric className="mt-2 text-lg">
              {format.dateTime(start, 'full')}
            </dd>
          </div>
          <div className="bg-page p-6">
            <dt className="label-type text-ink-tertiary">{t('windowTitle')}</dt>
            <dd data-numeric className="mt-2 text-lg">
              {t('windowBody', {
                from: format.dateTime(start, 'time'),
                to: format.dateTime(windowEnd, 'time'),
              })}
            </dd>
          </div>
          <div className="bg-page p-6">
            <dt className="label-type flex items-center gap-2 text-ink-tertiary">
              <MapPin className="size-3.5" aria-hidden />
              {t('addressTitle')}
            </dt>
            <dd className="mt-2">
              {property.street}
              <br />
              <span data-numeric>{property.postcode}</span> {property.city}
            </dd>
          </div>
          <div className="bg-page p-6">
            <dt className="label-type flex items-center gap-2 text-ink-tertiary">
              <KeyRound className="size-3.5" aria-hidden />
              {t('accessTitle')}
            </dt>
            {/* Named, not shown. The code is never rendered on a page that
                arrives by email link. */}
            <dd className="mt-2">
              {property.access ? ACCESS_LABELS[property.access.method] : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4 border-y border-line-subtle py-4">
          <span className="text-ink-secondary">
            {t('amountTitle')} · {service.name[locale]}
          </span>
          <Money amount={offerTotal(offer)} emphasis="strong" className="text-xl" />
        </div>

        <h2 className="label-type mt-12 text-ink-tertiary">{t('nextTitle')}</h2>
        <ol className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
          {[t('next1'), t('next2'), t('next3')].map((line, i) => (
            <li key={line} className="flex gap-4 py-4">
              <span data-numeric className="label-type pt-0.5 text-ink-tertiary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-ink-secondary">{line}</span>
            </li>
          ))}
        </ol>

        <section className="mt-8 border-l-2 border-rule bg-sunken p-5">
          <h2 className="font-medium">{t('cancelTitle')}</h2>
          <p data-numeric className="mt-1.5 text-sm text-ink-secondary">
            {t('cancelBody')} ({settings.cancellationFreeHours} h)
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/konto/termine">{t('toAccount')}</Link>
          </Button>
          <Button
            variant="secondary"
            title={t('calendarNote')}
            onClick={() => window.alert(t('calendarNote'))}
          >
            <CalendarPlus className="size-4" aria-hidden />
            {t('addCalendar')}
          </Button>
        </div>
      </div>
    </OfferShell>
  );
}
