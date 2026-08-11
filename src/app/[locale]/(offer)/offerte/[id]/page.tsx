'use client';

import { use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { ArrowRight, Check, Download, Info, ShieldCheck } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/ui/money';
import { EmptyState } from '@/components/ui/empty-state';
import { OfferShell } from '@/components/offer/offer-shell';
import { useOffer } from '@/components/offer/use-offer';
import {
  activeLines,
  isExpired,
  offerDiscount,
  offerHours,
  offerSubtotal,
  offerTotal,
} from '@/mock/engines/offers';
import { arrivalWindowMinutes } from '@/mock/engines/pricing';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

/**
 * Screens 23, 24 and 30.
 *
 * 24 (optional items) is not a separate page: switching a line on or off has
 * to update the total in place, and sending someone to another screen to do it
 * would break the one thing that makes the interaction worth having.
 */
export default function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('offer.detail');
  const e = useTranslations('offer.expired');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const data = useOffer(id);
  const toggleOfferLine = useStore((s) => s.toggleOfferLine);
  const reissueOffer = useStore((s) => s.reissueOffer);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);

  if (!hydrated) return <div className="p-gutter text-ink-tertiary">…</div>;
  if (!data) {
    return (
      <main className="mx-auto max-w-2xl px-gutter py-section">
        <EmptyState
          title="Offerte nicht gefunden"
          body="Der Link ist möglicherweise veraltet. Melden Sie sich bei uns, wir senden ihn neu."
          action={
            <Button asChild>
              <Link href="/">Zur Startseite</Link>
            </Button>
          }
        />
      </main>
    );
  }

  const { offer, property, customer, service } = data;
  const expired = isExpired(offer, now) || offer.status === 'expired';

  const optional = offer.lines.filter((line) => line.optional);
  const fixed = offer.lines.filter((line) => !line.optional);
  const hours = offerHours(offer);

  // Line labels are engine keys ("service:grundreinigung", "addon:backofen",
  // "surcharge:saturday") — resolve them to the customer's language.
  function labelFor(label: string) {
    const svc = services.find((s) => s.slug === label);
    if (svc) return svc.name[locale];
    const add = addOns.find((a) => a.slug === label);
    if (add) return add.name[locale];
    return label;
  }

  if (expired) {
    return (
      <OfferShell offer={offer}>
        <div className="max-w-2xl">
          <h1 className="display-type text-[clamp(1.875rem,4vw,3rem)]">{e('title')}</h1>
          <p className="mt-5 text-lg text-ink-secondary">
            {e('body', {
              date: offer.expiresAt
                ? format.dateTime(new Date(offer.expiresAt), 'full')
                : '—',
            })}
          </p>
          <p className="mt-4 flex gap-2 text-sm text-ink-tertiary">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {e('keptPrices')}
          </p>
          <Button
            size="lg"
            className="mt-8"
            onClick={() => reissueOffer(offer.id, now)}
          >
            {e('action')}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </OfferShell>
    );
  }

  return (
    <OfferShell offer={offer} step="offer">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="display-type text-[clamp(1.75rem,3.6vw,2.75rem)]">{t('title')}</h1>
          <p className="mt-3 text-ink-secondary">
            {t('for')} {customer.firstName} {customer.lastName} · {property.street},{' '}
            {property.postcode} {property.city}
          </p>

          <section className="mt-8 rounded-[var(--radius-lg)] bg-sunken p-5">
            <h2 className="label-type text-ink-tertiary">{t('intro')}</h2>
            <p className="mt-2 text-sm whitespace-pre-line text-ink-secondary">
              {offer.message}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="display-type text-xl">{t('linesTitle')}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-md border-collapse text-left">
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
                  {fixed.map((line) => (
                    <tr key={line.id} className="border-b border-line-subtle">
                      <th scope="row" className="py-3.5 pr-4 font-normal">
                        {labelFor(line.label)}
                      </th>
                      <td data-numeric className="py-3.5 pr-4 text-right text-ink-secondary">
                        {line.calc === 'hourly'
                          ? t('hours', { n: line.quantity })
                          : line.quantity}
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
          </section>

          {optional.length > 0 && (
            <section className="mt-10">
              <h2 className="display-type text-xl">{t('optionalTitle')}</h2>
              <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
                {t('optionalLead')}
              </p>
              <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
                {optional.map((line) => (
                  <li key={line.id}>
                    <label className="flex cursor-pointer items-center gap-4 py-4">
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-[var(--radius-xs)] border transition-colors',
                          line.selected
                            ? 'border-accent bg-accent text-on-accent'
                            : 'border-line',
                        )}
                      >
                        {line.selected && <Check className="size-3.5" aria-hidden />}
                      </span>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={line.selected}
                        onChange={() => toggleOfferLine(offer.id, line.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{labelFor(line.label)}</span>
                        <span className="label-type ml-2 text-ink-tertiary">
                          {t('optionalBadge')}
                        </span>
                      </span>
                      <Money
                        amount={line.quantity * line.unitPrice}
                        className={cn(!line.selected && 'text-ink-tertiary line-through')}
                      />
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-6 space-y-5">
            <div className="surface-card p-6">
              <dl className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <dt className="text-ink-secondary">{t('subtotal')}</dt>
                  <dd>
                    <Money amount={offerSubtotal(offer)} />
                  </dd>
                </div>
                {offerDiscount(offer) > 0 && (
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <dt className="text-ink-secondary">{t('discount')}</dt>
                    <dd className="text-status-success-fg">
                      −<Money amount={offerDiscount(offer)} />
                    </dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-4 border-t border-line-subtle pt-3">
                  <dt className="font-medium">{t('total')}</dt>
                  <dd className="text-2xl">
                    <Money amount={offerTotal(offer)} emphasis="strong" />
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-ink-tertiary">{t('noVat')}</p>

              <p data-numeric className="mt-5 border-t border-line-subtle pt-4 text-sm text-ink-secondary">
                {t('durationNote', {
                  hours,
                  window: `${arrivalWindowMinutes(hours) / 60} Std.`,
                })}
              </p>

              <Button
                size="lg"
                block
                className="mt-6"
                onClick={() => router.push(`/offerte/${offer.id}/termin`)}
                disabled={activeLines(offer).length === 0}
              >
                {t('accept')}
                <ArrowRight className="size-4" aria-hidden />
              </Button>

              <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
                <Button asChild variant="link">
                  <Link href={`/offerte/${offer.id}/aenderung`}>{t('requestChange')}</Link>
                </Button>
                <Button
                  variant="link"
                  title={t('downloadNote')}
                  onClick={() => toast.info(t('downloadNote'))}
                >
                  <Download className="size-4" aria-hidden />
                  {t('downloadPdf')}
                </Button>
              </div>
            </div>

            {/* Answers the question the accept button provokes, before it is
                asked: accepting is not the same as being charged. */}
            <div className="border-l-2 border-rule bg-sunken p-5">
              <h2 className="font-medium">{t('notBookedTitle')}</h2>
              <p className="mt-1.5 text-sm text-ink-secondary">{t('notBookedBody')}</p>
            </div>

            {service.handoverGuarantee && (
              <div className="flex gap-3 rounded-[var(--radius-md)] bg-status-success p-4 text-status-success-fg">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div>
                  <h2 className="text-sm font-medium">{t('guaranteeTitle')}</h2>
                  <p className="mt-1 text-sm">{t('guaranteeBody')}</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </OfferShell>
  );
}
