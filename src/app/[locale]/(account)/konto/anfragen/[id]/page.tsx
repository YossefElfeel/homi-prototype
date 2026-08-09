'use client';

import { use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useStore } from '@/mock/store';

/**
 * Screen 37 — one request, from the customer's side.
 *
 * The waiting state carries the promise with a number in it (§4.1: an answer
 * within 24 hours). "We'll be in touch" is what every competitor says; a stated
 * deadline is the only version that reduces the follow-up call this whole
 * system exists to avoid.
 */
export default function AccountRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('account.request');
  const pt = useTranslations('account.property');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();

  const { requests, offers, properties } = useAccount();
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const request = requests.find((r) => r.id === id);
  if (!request) return <p className="text-ink-tertiary">—</p>;

  const property = properties.find((p) => p.id === request.propertyId);
  const service = services.find((s) => s.slug === request.serviceSlug);
  const offer = offers.find((o) => o.requestId === request.id && o.status !== 'draft');

  return (
    <div className="max-w-3xl">
      <Button asChild variant="link" className="mb-6">
        <Link href="/konto/anfragen">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 data-numeric className="display-type text-3xl">
          {request.reference}
        </h1>
        <StatusBadge entity="request" state={request.status} />
      </div>
      <p className="mt-2 text-sm text-ink-tertiary">
        {t('sentOn')}{' '}
        <span data-numeric>{format.dateTime(new Date(request.createdAt), 'full')}</span>
      </p>

      {offer ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-l-2 border-rule bg-sunken p-6">
          <div>
            <h2 className="font-medium">{t('offerTitle')}</h2>
            <p className="mt-1 text-sm text-ink-secondary">{t('offerBody')}</p>
          </div>
          <Button asChild>
            <Link href={`/offerte/${offer.id}`}>
              {t('offerAction')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 flex gap-3 border-l-2 border-rule bg-sunken p-6">
          <Clock className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
          <div>
            <h2 className="font-medium">{t('waitingTitle')}</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              {t('waitingBody', { hours: settings.responseTimeHours })}
            </p>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="label-type text-ink-tertiary">{t('serviceTitle')}</h2>
          <p className="mt-2">{service?.name[locale] ?? '—'}</p>
        </section>
        <section>
          <h2 className="label-type text-ink-tertiary">{t('propertyTitle')}</h2>
          {property ? (
            <Link
              href={`/konto/objekte/${property.id}`}
              className="mt-2 inline-block underline-offset-4 hover:underline"
            >
              {property.street}, <span data-numeric>{property.postcode}</span>{' '}
              {property.city}
            </Link>
          ) : (
            <p className="mt-2">—</p>
          )}
        </section>
      </div>

      {property && (
        <section className="mt-10">
          <h2 className="label-type text-ink-tertiary">{t('detailsTitle')}</h2>
          <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {[
              [pt('area'), `${property.area} m²`],
              [pt('rooms'), `${property.rooms}`],
              [pt('bathrooms'), `${property.bathrooms}`],
              [pt('floor'), `${property.floor}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-line-subtle py-1.5">
                <dt className="text-ink-secondary">{label}</dt>
                <dd data-numeric>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {request.customerNote && (
        <section className="mt-10">
          <h2 className="label-type text-ink-tertiary">{t('noteTitle')}</h2>
          <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">
            {request.customerNote}
          </p>
        </section>
      )}
    </div>
  );
}
