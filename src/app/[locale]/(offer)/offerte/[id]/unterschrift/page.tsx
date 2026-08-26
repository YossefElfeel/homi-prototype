'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { ArrowRight } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Money } from '@/components/ui/money';
import { Checkbox } from '@/components/ui/field';
import { SignaturePad } from '@/components/ui/signature-pad';
import { ContractDocument, SignatureSlot } from '@/components/offer/contract';
import { OfferShell } from '@/components/offer/offer-shell';
import { HoldTimer } from '@/components/offer/hold-timer';
import { useOffer } from '@/components/offer/use-offer';
import { offerTotal } from '@/mock/engines/offers';
import { useHydrated, useNow, useStore } from '@/mock/store';

/**
 * Screen 26 — the electronic signature (§9.2).
 *
 * Distinct from §21 item 9, which removed signatures from *proof of work*. The
 * signature on the quote stays: it is what turns a price into an agreement.
 *
 * What changed is what is being signed. This screen used to show three facts
 * and a link to the terms, which is a summary — you check a summary, you sign
 * a document. The agreement is on the page now, and the company's signature is
 * already on it: the quote left the office signed, and this signature is the
 * one that closes it.
 */
export default function SignaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('offer.sign');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const data = useOffer(id);
  const signOffer = useStore((s) => s.signOffer);

  /* The mark itself, as path data. The pad used to draw onto a canvas and
     keep nothing, so what reached the store was a timestamp and the signature
     was gone the moment the page unmounted. */
  const [path, setPath] = useState('');
  const [accepted, setAccepted] = useState(false);

  if (!hydrated) return <div className="p-gutter text-ink-tertiary">…</div>;
  if (!data) return null;
  const { offer, customer, property, service, hold } = data;

  const slotStart = offer.confirmedSlot
    ? new Date(offer.confirmedSlot)
    : hold
      ? new Date(hold.start)
      : null;

  function proceed() {
    signOffer(
      offer.id,
      { name: `${customer.firstName} ${customer.lastName}`, path },
      now,
    );
    router.push(`/offerte/${offer.id}/zahlung`);
  }

  return (
    <OfferShell offer={offer} step="unterschrift">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h1 className="display-type text-[clamp(2.25rem,3.6vw,2.75rem)]">{t('title')}</h1>
          <p className="mt-4 max-w-[46ch] text-ink-secondary">{t('lead')}</p>

          <Card className="mt-8">
            <CardHeader title={t('documentTitle')} description={t('documentHint')} divided />
            <CardBody>
              {/* Bounded and scrolled rather than run out to full length: the
                  terms are long, and a page that ends four screens below the
                  signature is a page nobody reaches the bottom of. */}
              <div className="max-h-[28rem] overflow-y-auto pe-3">
                <ContractDocument
                  offer={offer}
                  customer={customer}
                  property={property}
                  service={service}
                  slotStart={slotStart}
                />
              </div>
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader title={t('signaturesTitle')} />
            <CardBody className="space-y-8">
              {/* Company first, and stacked rather than side by side, because
                  the order is the point: they signed, now you do. */}
              <SignatureSlot
                caption={t('companyCaption')}
                signature={offer.ownerSignature}
                pending={t('companyPending')}
              />

              <SignatureSlot caption={t('customerCaption')}>
                <SignaturePad
                  label={t('canvasLabel')}
                  hint={t('canvasHint')}
                  clearLabel={t('clear')}
                  onChange={setPath}
                />
              </SignatureSlot>

              <div>
                <Checkbox
                  label={t('confirm')}
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <Button
                  size="lg"
                  className="mt-6"
                  onClick={proceed}
                  disabled={!path || !accepted}
                >
                  {t('continue')}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
                {!path && <p className="mt-3 text-sm text-ink-tertiary">{t('required')}</p>}
              </div>
            </CardBody>
          </Card>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-6 space-y-5">
            {hold && <HoldTimer hold={hold} />}
            <dl className="surface-card divide-y divide-line-subtle p-6">
              <div className="flex items-baseline justify-between gap-4 pb-3">
                <dt className="text-sm text-ink-secondary">{t('summaryService')}</dt>
                <dd className="text-right">{service.name[locale]}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-sm text-ink-secondary">{t('summaryDate')}</dt>
                <dd data-numeric className="text-right">
                  {slotStart
                    ? `${format.dateTime(slotStart, 'dayMonth')}, ${format.dateTime(slotStart, 'time')}`
                    : '—'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 pt-3">
                <dt className="text-sm text-ink-secondary">{t('summaryAmount')}</dt>
                <dd>
                  <Money amount={offerTotal(offer)} emphasis="strong" />
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </OfferShell>
  );
}
