'use client';

import { use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { ExternalLink, FileText, RefreshCw } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  daysLeft,
  isExpired,
  offerDiscount,
  offerHours,
  offerSubtotal,
  offerTotal,
} from '@/mock/engines/offers';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { offerLineLabel } from '@/lib/offer-label';
import type { Locale } from '@/i18n/routing';

/**
 * Screen 57, detail half — new.
 *
 * The list had no detail view, so opening a row pushed the owner to
 * `/offerte/[id]`: the customer's own quote page, whose only way out is a
 * hardcoded German link to the marketing home page. Answering "what did we
 * actually quote here" meant leaving the console and navigating back in.
 *
 * The customer view is still one click away — it is the right screen for
 * checking what they see — but it is now a deliberate trip, not the default.
 */
export default function AdminOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('admin.offerDetail');
  const listT = useTranslations('admin.offers');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const offers = useStore((s) => s.data.offers);
  const requests = useStore((s) => s.data.requests);
  const customers = useStore((s) => s.data.customers);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);
  const reissueOffer = useStore((s) => s.reissueOffer);

  if (!hydrated) return <SkeletonPage label={listT('title')} />;

  const offer = offers.find((o) => o.id === id);

  if (!offer) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={FileText}
          headingLevel={1}
          title={t('notFoundTitle')}
          body={t('notFoundBody')}
          action={
            <Button asChild>
              <Link href="/admin/offerten">{t('back')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const request = requests.find((r) => r.id === offer.requestId);
  const customer = customers.find((c) => c.id === request?.customerId);
  const expired = isExpired(offer, now);
  const left = daysLeft(offer, now);
  const discount = offerDiscount(offer);

  const state = expired && offer.status === 'sent' ? 'expired' : offer.status;

  function reissue() {
    reissueOffer(offer!.id, now);
    toast.success(t('reissued'));
    router.push(`/admin/anfragen/${offer!.requestId}/offerte`);
  }

  return (
    <div className="mx-auto max-w-[80rem]">
      <PageHeader
        back={{ href: '/admin/offerten', label: t('back') }}
        title={offer.reference}
        meta={
          <>
            <StatusBadge
              entity="request"
              state={
                state === 'sent'
                  ? 'offerSent'
                  : state === 'draft'
                    ? 'draft'
                    : state
              }
            />
            {offer.version > 1 && (
              <Chip tone="neutral">{t('version', { n: offer.version })}</Chip>
            )}
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={reissue}>
              <RefreshCw className="size-4" aria-hidden />
              {t('reissue')}
            </Button>
            <Button asChild variant="secondary">
              {/* Deliberately a plain anchor with a new tab: this leaves the
                  console for the customer-facing flow, and coming back should
                  not mean re-navigating the panel. */}
              <a href={`/offerte/${offer.id}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" aria-hidden />
                {t('openAsCustomer')}
              </a>
            </Button>
          </>
        }
      />

      {expired && (
        <Alert tone="warning" className="mb-app">
          {t('expiredNote')}
        </Alert>
      )}

      <div className="gap-app grid lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card pad="none">
            <CardHeader className="p-card" title={t('linesTitle')} />
            <div className="overflow-x-auto border-t border-line-subtle">
              <table className="w-full min-w-xl border-collapse text-left">
                <thead>
                  <tr className="border-b border-line-subtle">
                    <th className="label-type px-card py-2.5 font-medium text-ink-tertiary">
                      {t('colLine')}
                    </th>
                    <th className="label-type px-3 py-2.5 text-right font-medium text-ink-tertiary">
                      {t('colQuantity')}
                    </th>
                    <th className="label-type px-3 py-2.5 text-right font-medium text-ink-tertiary">
                      {t('colUnitPrice')}
                    </th>
                    <th className="label-type px-card py-2.5 text-right font-medium text-ink-tertiary">
                      {t('colSum')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offer.lines.map((line) => (
                    <tr
                      key={line.id}
                      className="border-b border-line-subtle last:border-0"
                    >
                      <td className="px-card py-row">
                        <span className="flex flex-wrap items-center gap-2">
                          {offerLineLabel(line, services, addOns, locale)}
                          {line.optional && (
                            <Chip tone={line.selected ? 'accent' : 'neutral'}>
                              {line.selected ? t('optional') : t('notSelected')}
                            </Chip>
                          )}
                        </span>
                        {line.note && (
                          <span className="mt-0.5 block text-sm text-ink-tertiary">
                            {line.note}
                          </span>
                        )}
                      </td>
                      <td data-numeric className="px-3 py-row text-right">
                        {line.quantity}
                      </td>
                      <td className="px-3 py-row text-right">
                        <Money amount={line.unitPrice} emphasis="quiet" />
                      </td>
                      <td className="px-card py-row text-right">
                        <Money
                          amount={line.unitPrice * line.quantity}
                          emphasis={line.selected ? 'default' : 'quiet'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {offer.message && (
            <Card className="mt-app">
              <CardHeader title={t('messageTitle')} />
              <p className="mt-3 max-w-[var(--measure)] whitespace-pre-line text-ink-secondary">
                {offer.message}
              </p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="space-y-app lg:sticky lg:top-[calc(var(--app-topbar-h)+1rem)]">
            <Card>
              <dl className="space-y-3 text-sm">
                <Row label={t('customer')}>
                  {customer ? (
                    <Link
                      href={`/admin/kunden/${customer.id}`}
                      className="font-medium text-ink-accent hover:underline"
                    >
                      {customer.firstName} {customer.lastName}
                    </Link>
                  ) : (
                    '—'
                  )}
                </Row>
                <Row label={t('request')}>
                  {request ? (
                    <Link
                      href={`/admin/anfragen/${request.id}`}
                      className="font-medium text-ink-accent hover:underline"
                      data-numeric
                    >
                      {request.reference}
                    </Link>
                  ) : (
                    '—'
                  )}
                </Row>
                <Row label={t('issued')}>
                  <span data-numeric>
                    {offer.issuedAt
                      ? format.dateTime(new Date(offer.issuedAt), 'short')
                      : '—'}
                  </span>
                </Row>
                <Row label={t('expires')}>
                  <span data-numeric>
                    {offer.expiresAt
                      ? format.dateTime(new Date(offer.expiresAt), 'short')
                      : '—'}
                    {left !== null && left > 0 && (
                      <span className="ms-2 text-ink-tertiary">
                        {listT('expiresIn', { days: left })}
                      </span>
                    )}
                  </span>
                </Row>
                <Row label={t('hours')}>
                  <span data-numeric>{offerHours(offer).toFixed(1)}</span>
                </Row>
              </dl>
            </Card>

            <Card>
              <dl className="space-y-2 text-sm">
                <Row label={t('subtotal')}>
                  <Money amount={offerSubtotal(offer)} emphasis="quiet" />
                </Row>
                {discount > 0 && (
                  <Row label={t('discount')}>
                    <Money amount={-discount} emphasis="quiet" />
                  </Row>
                )}
                <div className="flex items-baseline justify-between gap-4 border-t border-line-subtle pt-3">
                  <dt className="font-medium">{t('total')}</dt>
                  <dd>
                    <Money amount={offerTotal(offer)} emphasis="strong" />
                  </dd>
                </div>
              </dl>
            </Card>

            <Button asChild block variant="secondary">
              <Link href={`/admin/anfragen/${offer.requestId}`}>
                {t('openRequest')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-ink-tertiary">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
