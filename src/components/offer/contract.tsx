'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';

import type { Locale } from '@/i18n/routing';
import { Money } from '@/components/ui/money';
import { SignatureMark } from '@/components/ui/signature-mark';
import { getLegalDocument } from '@/content/legal';
import { activeLines, offerDiscount, offerSubtotal, offerTotal } from '@/mock/engines/offers';
import type { Customer, Offer, Property, Service, Signature } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * The agreement itself, on the page the customer signs it on — §9.2.
 *
 * Before this, screen 26 asked for a signature over three facts and a link to
 * the terms. Three facts are what you *check*; they are not what you sign. The
 * document was never anywhere: not on the screen, not in the account
 * afterwards, and not on the owner's copy either, so "what exactly did they
 * agree to" had no answer on any screen in the app.
 *
 * The terms come from `content/legal.ts` rather than being retyped here — the
 * AGB the site publishes and the AGB inside the contract have to be the same
 * text, or the contract is quoting a document that does not exist.
 */
export function ContractDocument({
  offer,
  customer,
  property,
  service,
  slotStart,
  className,
}: {
  offer: Offer;
  customer: Customer;
  property: Property;
  service: Service;
  /** The confirmed or held slot, when there is one. */
  slotStart?: Date | null;
  className?: string;
}) {
  const t = useTranslations('offer.contract');
  const brand = useTranslations('brand');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const agb = getLegalDocument('agb', locale);

  const lines = activeLines(offer);
  const discount = offerDiscount(offer);

  return (
    <article className={cn('text-sm', className)}>
      <header className="border-b border-line-subtle pb-4">
        <h2 className="subhead-type text-lg">{t('title')}</h2>
        <p data-numeric className="mt-1 text-ink-tertiary">
          {offer.reference} · {t('versionLabel', { n: offer.version })}
        </p>
      </header>

      <Clause heading={t('partiesHeading')}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Party label={t('contractor')}>
            <p className="font-medium">{brand('name')}</p>
            <p className="text-ink-secondary">{brand('region')}</p>
            <p data-numeric className="text-ink-secondary">
              {brand('phone')}
            </p>
            <p className="text-ink-secondary">{brand('email')}</p>
          </Party>
          <Party label={t('client')}>
            <p className="font-medium">
              {customer.firstName} {customer.lastName}
            </p>
            <p className="text-ink-secondary">
              {property.street}, <span data-numeric>{property.postcode}</span>{' '}
              {property.city}
            </p>
            <p data-numeric className="text-ink-secondary">
              {customer.phone}
            </p>
            <p className="text-ink-secondary">{customer.email}</p>
          </Party>
        </div>
      </Clause>

      <Clause heading={t('serviceHeading')}>
        <dl className="divide-y divide-line-subtle">
          <Row label={t('serviceLabel')}>{service.name[locale]}</Row>
          <Row label={t('addressLabel')}>
            {property.street}, <span data-numeric>{property.postcode}</span>{' '}
            {property.city}
          </Row>
          <Row label={t('dateLabel')}>
            {slotStart ? (
              <span data-numeric>
                {format.dateTime(slotStart, 'full')}, {format.dateTime(slotStart, 'time')}
              </span>
            ) : (
              /* Not «—»: a blank here reads as a missing value, and the date
                 genuinely is still open at this point in the flow. */
              <span className="text-ink-tertiary">{t('dateOpen')}</span>
            )}
          </Row>
          <Row label={t('durationLabel')}>
            <span data-numeric>{t('hours', { n: offer.estimatedHours })}</span>
          </Row>
        </dl>
      </Clause>

      <Clause heading={t('priceHeading')}>
        <dl className="divide-y divide-line-subtle">
          {lines.map((line) => (
            <Row key={line.id} label={line.displayLabel ?? line.label}>
              <Money amount={line.quantity * line.unitPrice} />
            </Row>
          ))}
          {discount > 0 && (
            <>
              <Row label={t('subtotal')}>
                <Money amount={offerSubtotal(offer)} emphasis="quiet" />
              </Row>
              <Row label={t('discount')}>
                <Money amount={-discount} />
              </Row>
            </>
          )}
          <Row label={t('total')}>
            <Money amount={offerTotal(offer)} emphasis="strong" />
          </Row>
        </dl>
        <p className="mt-3 text-xs text-ink-tertiary">{t('priceNote')}</p>
      </Clause>

      <Clause heading={agb.title}>
        <p className="text-ink-secondary">{agb.intro}</p>
        {agb.sections.map((section) => (
          <section key={section.id} className="mt-5">
            <h4 className="font-medium">{section.heading}</h4>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i} className="mt-1.5 text-ink-secondary">
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className="mt-2 space-y-1 ps-5 text-ink-secondary">
                {section.list.map((item, i) => (
                  <li key={i} className="list-disc">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </Clause>
    </article>
  );
}

/**
 * One party's line on the contract: the mark, the name under it, the date.
 *
 * `pending` is a real state and not an empty one — the company's half is
 * already there when the customer arrives, so the gap opposite it has to say
 * *waiting for you* rather than look like a rendering failure.
 */
export function SignatureSlot({
  caption,
  signature,
  pending,
  children,
  className,
}: {
  caption: string;
  signature?: Signature;
  /** Shown in place of a mark when this side has not signed yet. */
  pending?: string;
  /** A live pad, for the side that is signing right now. */
  children?: React.ReactNode;
  className?: string;
}) {
  const format = useFormatter();

  return (
    <div className={cn('min-w-0', className)}>
      <p className="label-type text-ink-tertiary">{caption}</p>
      {children ? (
        <div className="mt-2">{children}</div>
      ) : signature ? (
        <>
          <SignatureMark
            path={signature.path}
            label={`${caption}: ${signature.name}`}
            className="mt-2 text-ink"
          />
          <p className="mt-2 border-t border-line-subtle pt-2 text-sm">
            {signature.name}
            <span className="text-ink-tertiary"> · {signature.role}</span>
          </p>
          <p data-numeric className="text-xs text-ink-tertiary">
            {format.dateTime(new Date(signature.at), 'full')},{' '}
            {format.dateTime(new Date(signature.at), 'time')}
          </p>
        </>
      ) : (
        <div className="mt-2 flex h-14 items-end border-b border-dashed border-line">
          <p className="pb-1 text-sm text-ink-tertiary">{pending}</p>
        </div>
      )}
    </div>
  );
}

function Clause({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="label-type text-ink-tertiary">{heading}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Party({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-ink-tertiary">{label}</p>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
