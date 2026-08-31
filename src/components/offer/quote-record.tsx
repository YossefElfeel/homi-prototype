'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';

import type { Locale } from '@/i18n/routing';
import { Chip } from '@/components/ui/chip';
import { Money } from '@/components/ui/money';
import { offerLineLabel } from '@/lib/offer-label';
import {
  offerDiscount,
  offerHours,
  offerSubtotal,
  offerTotal,
} from '@/mock/engines/offers';
import { useStore } from '@/mock/store';
import type { Offer, OfferLine, Property, Service } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * The quote, on the three screens where it can no longer be acted on.
 *
 * A closed quote used to be a headline and one sentence. «Offerte abgelehnt»
 * and a button — no service, no address, no line, no franc. So the customer
 * who opens O-2514 from their own list eight weeks later to check *what* they
 * turned down finds a page that cannot tell them, and the number they came for
 * is on the row they clicked to get here.
 *
 * Read-only on purpose, and that is the whole difference from the live quote
 * above it. An optional line on a settled quote is a fact — it was in or it was
 * out — so it is printed with its state rather than offered as a checkbox: on
 * an accepted quote a switch would let somebody change the total of a contract
 * they have already signed and paid.
 *
 * The subtotal counts what `activeLines` counts, so this table and the amount
 * that was actually charged are the same arithmetic.
 */
export function QuoteRecord({
  offer,
  service,
  property,
  facts,
  className,
}: {
  offer: Offer;
  service: Service;
  property: Property;
  /**
   * The date that closed this quote. Every state has one and no two states
   * name it the same thing — «abgelehnt am», «angenommen am», «abgelaufen am»
   * — so the caller brings its own rather than this guessing from a status.
   */
  facts?: { label: string; value: React.ReactNode }[];
  className?: string;
}) {
  const t = useTranslations('offer.record');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);

  const discount = offerDiscount(offer);
  const hours = offerHours(offer);
  const labelFor = (line: OfferLine) => offerLineLabel(line, services, addOns, locale);

  return (
    <section className={cn('mt-12', className)}>
      <h2 className="subhead-type text-xl">{t('title')}</h2>

      <dl className="mt-4 grid gap-px border border-line-subtle bg-line-subtle sm:grid-cols-2">
        <Fact label={t('reference')}>
          <span data-numeric>
            {offer.reference}
            {offer.version > 1 && (
              <span className="text-ink-tertiary"> · {t('version', { n: offer.version })}</span>
            )}
          </span>
        </Fact>
        <Fact label={t('service')}>{service.name[locale]}</Fact>
        <Fact label={t('address')}>
          {property.street}, <span data-numeric>{property.postcode}</span> {property.city}
        </Fact>
        <Fact label={t('issued')}>
          <span data-numeric>
            {offer.issuedAt ? format.dateTime(new Date(offer.issuedAt), 'full') : '—'}
          </span>
        </Fact>
        {facts?.map((fact) => (
          <Fact key={fact.label} label={fact.label}>
            {fact.value}
          </Fact>
        ))}
        {/* Hours, not the arrival window. The window is a promise about a visit,
            and on a quote that produced no visit it would be a promise about
            nothing. */}
        <Fact label={t('duration')}>
          <span data-numeric>{t('durationValue', { hours })}</span>
        </Fact>
      </dl>

      {offer.message && (
        <div className="mt-6 rounded-[var(--radius-lg)] bg-sunken p-5">
          <h3 className="label-type text-ink-tertiary">{t('message')}</h3>
          <p className="mt-2 text-sm whitespace-pre-line text-ink-secondary">
            {offer.message}
          </p>
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-md border-collapse text-left">
          <caption className="sr-only">{t('linesTitle')}</caption>
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
            {offer.lines.map((line) => {
              const counted = !line.optional || line.selected;
              return (
                <tr key={line.id} className="border-b border-line-subtle">
                  <th scope="row" className="py-3.5 pr-4 font-normal">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cn(!counted && 'text-ink-tertiary')}>
                        {labelFor(line)}
                      </span>
                      {line.optional && (
                        <Chip tone={line.selected ? 'accent' : 'neutral'}>
                          {line.selected ? t('optionalOn') : t('optionalOff')}
                        </Chip>
                      )}
                    </span>
                  </th>
                  <td data-numeric className="py-3.5 pr-4 text-right text-ink-secondary">
                    {line.calc === 'hourly' ? t('hours', { n: line.quantity }) : line.quantity}
                  </td>
                  <td className="py-3.5 pr-4 text-right text-ink-secondary">
                    <Money amount={line.unitPrice} emphasis="quiet" />
                  </td>
                  <td className="py-3.5 text-right">
                    <Money
                      amount={line.quantity * line.unitPrice}
                      className={cn(!counted && 'text-ink-tertiary line-through')}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <dl className="mt-5 ml-auto max-w-sm space-y-2.5">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <dt className="text-ink-secondary">{t('subtotal')}</dt>
          <dd>
            <Money amount={offerSubtotal(offer)} />
          </dd>
        </div>
        {discount > 0 && (
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <dt className="text-ink-secondary">{t('discount')}</dt>
            <dd className="text-status-success-fg">
              −<Money amount={discount} />
            </dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4 border-t border-line-subtle pt-3">
          <dt className="font-medium">{t('total')}</dt>
          <dd className="text-xl">
            <Money amount={offerTotal(offer)} emphasis="strong" />
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-right text-xs text-ink-tertiary">{t('noVat')}</p>
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-page p-5">
      <dt className="label-type text-ink-tertiary">{label}</dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  );
}
