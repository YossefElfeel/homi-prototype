'use client';

import { use, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { ArrowLeft, CalendarClock, Plus, Send, Trash2 } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/ui/money';
import { Input, Select, Textarea } from '@/components/ui/field';
import { nextSlots, startOfDay } from '@/mock/engines/availability';
import { offerHours, offerSubtotal, offerTotal, offerDiscount } from '@/mock/engines/offers';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { CalcMethod, OfferLine } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * Screen 54 — the one the whole product turns on.
 *
 * The brief: "أهم شاشة في المرحلة الأولى كلها. صاحب الشركة هيقعد فيها كل يوم"
 * and "الشاشة دي لازم تشتغل بأقل عدد كليكات ممكن. أي خطوة زيادة هنا بتتضرب في
 * عدد الطلبات كلها."
 *
 * So the interaction budget is the design:
 *
 *   open (lines already filled)  →  Preview & send  →  Send   = 2 clicks
 *   or ⌘/Ctrl + Enter                                          = 1
 *
 * Against a target of four. Everything else follows from that: the request
 * summary is pinned so the owner never navigates away to check something, every
 * value is editable in place rather than behind a dialog, and the availability
 * panel is read-only — the customer picks the slot now (the client's override
 * of §21 item 5), so this exists to keep the owner aware of capacity while
 * pricing, not to make them choose.
 */
export default function QuoteBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.builder');
  const rt = useTranslations('admin.request');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const requests = useStore((s) => s.data.requests);
  const offers = useStore((s) => s.data.offers);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const bookings = useStore((s) => s.data.bookings);
  const closures = useStore((s) => s.data.closures);
  const holds = useStore((s) => s.holds);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);
  const settings = useStore((s) => s.settings);

  const ensureDraftOffer = useStore((s) => s.ensureDraftOffer);
  const updateOffer = useStore((s) => s.updateOffer);
  const updateOfferLine = useStore((s) => s.updateOfferLine);
  const addOfferLine = useStore((s) => s.addOfferLine);
  const removeOfferLine = useStore((s) => s.removeOfferLine);

  // The draft is created as a side effect on the store, then *derived* back
  // out of it — holding its id in local state would mean setting state inside
  // an effect and re-rendering the whole builder twice on open.
  useEffect(() => {
    if (!hydrated) return;
    ensureDraftOffer(id, now);
    // Intentionally once per request: re-running would keep re-opening it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, id]);

  const offer = offers.find(
    (o) => o.requestId === id && (o.status === 'draft' || o.status === 'sent'),
  );
  const offerId = offer?.id ?? null;
  const request = requests.find((r) => r.id === id);

  const hours = offer ? offerHours(offer) : 0;

  const slots = useMemo(() => {
    if (!request || !offer) return [];
    const property = properties.find((p) => p.id === request.propertyId);
    if (!property) return [];
    return nextSlots(
      {
        from: startOfDay(now),
        days: 21,
        durationMinutes: Math.round(hours * 60),
        property,
        bookings,
        holds,
        closures,
        properties,
        settings,
        now,
      },
      5,
    );
  }, [request, offer, hours, properties, bookings, holds, closures, settings, now]);

  // ⌘/Ctrl + Enter sends. The owner does this dozens of times a week.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && offerId) {
        event.preventDefault();
        router.push(`/admin/anfragen/${id}/offerte/senden`);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [offerId, id, router]);

  if (!hydrated || !offer || !request) return <p className="text-ink-tertiary">…</p>;

  const customer = customers.find((c) => c.id === request.customerId)!;
  const property = properties.find((p) => p.id === request.propertyId)!;
  const service = services.find((s) => s.slug === request.serviceSlug)!;
  const plan = subscriptions.find(
    (s) => s.customerId === customer.id && s.status === 'active',
  )?.plan;

  function labelFor(line: OfferLine) {
    const svc = services.find((s) => s.slug === line.label);
    if (svc) return svc.name[locale];
    const add = addOns.find((a) => a.slug === line.label);
    if (add) return add.name[locale];
    return line.label;
  }

  return (
    <div className="max-w-6xl pb-28 lg:pb-0">
      <Button asChild variant="link" className="mb-6">
        <Link href={`/admin/anfragen/${id}`}>
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <span data-numeric className="label-type text-ink-tertiary">
          {request.reference} · {offer.reference}
        </span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <section>
            <h2 className="display-type text-xl">{t('linesTitle')}</h2>
            <p className="mt-1 text-sm text-ink-secondary">{t('linesLead')}</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-2xl border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="label-type py-2 pr-3 text-ink-tertiary">
                      {t('colDescription')}
                    </th>
                    <th scope="col" className="label-type w-28 py-2 pr-3 text-ink-tertiary">
                      {t('colCalc')}
                    </th>
                    <th scope="col" className="label-type w-20 py-2 pr-3 text-right text-ink-tertiary">
                      {t('colQuantity')}
                    </th>
                    <th scope="col" className="label-type w-24 py-2 pr-3 text-right text-ink-tertiary">
                      {t('colUnit')}
                    </th>
                    <th scope="col" className="label-type w-24 py-2 pr-3 text-right text-ink-tertiary">
                      {t('colTotal')}
                    </th>
                    <th scope="col" className="w-20 py-2 pr-3">
                      <span className="sr-only">{t('optional')}</span>
                    </th>
                    <th scope="col" className="w-10 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {offer.lines.map((line) => (
                    <tr key={line.id} className="border-b border-line-subtle">
                      <td className="py-1.5 pr-3">
                        <CellInput
                          value={labelFor(line)}
                          onChange={(v) => updateOfferLine(offer.id, line.id, { label: v })}
                          aria-label={t('colDescription')}
                        />
                      </td>
                      <td className="py-1.5 pr-3">
                        <Select
                          value={line.calc}
                          aria-label={t('colCalc')}
                          onChange={(e) =>
                            updateOfferLine(offer.id, line.id, {
                              calc: e.target.value as CalcMethod,
                            })
                          }
                          className="h-9 border-transparent bg-transparent px-2 text-sm hover:border-line"
                        >
                          <option value="hourly">{t('calcHourly')}</option>
                          <option value="flat">{t('calcFlat')}</option>
                          <option value="perUnit">{t('calcUnit')}</option>
                        </Select>
                      </td>
                      <td className="py-1.5 pr-3">
                        <CellInput
                          numeric
                          value={String(line.quantity)}
                          onChange={(v) =>
                            updateOfferLine(offer.id, line.id, { quantity: Number(v) || 0 })
                          }
                          aria-label={t('colQuantity')}
                        />
                      </td>
                      <td className="py-1.5 pr-3">
                        <CellInput
                          numeric
                          value={String(line.unitPrice)}
                          onChange={(v) =>
                            updateOfferLine(offer.id, line.id, { unitPrice: Number(v) || 0 })
                          }
                          aria-label={t('colUnit')}
                        />
                      </td>
                      <td className="py-1.5 pr-3 text-right">
                        <Money amount={line.quantity * line.unitPrice} />
                      </td>
                      <td className="py-1.5 pr-3">
                        <label
                          title={t('optionalHint')}
                          className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-tertiary"
                        >
                          <input
                            type="checkbox"
                            checked={line.optional}
                            onChange={(e) =>
                              updateOfferLine(offer.id, line.id, {
                                optional: e.target.checked,
                              })
                            }
                            className="size-3.5 accent-[var(--accent-solid)]"
                          />
                          {t('optional')}
                        </label>
                      </td>
                      <td className="py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeOfferLine(offer.id, line.id)}
                          aria-label={`${t('removeLine')} — ${labelFor(line)}`}
                          className="inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-ink-tertiary transition-colors hover:bg-status-danger hover:text-status-danger-fg"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button variant="ghost" size="sm" className="mt-3" onClick={() => addOfferLine(offer.id)}>
              <Plus className="size-3.5" aria-hidden />
              {t('addLine')}
            </Button>
          </section>

          <section className="mt-10">
            <h2 className="display-type text-xl">{t('discountTitle')}</h2>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="w-40">
                <span className="sr-only">{t('discountTitle')}</span>
                <Select
                  value={offer.discountKind ?? 'none'}
                  onChange={(e) =>
                    updateOffer(offer.id, {
                      discountKind:
                        e.target.value === 'none'
                          ? undefined
                          : (e.target.value as 'percent' | 'amount'),
                      discountValue: e.target.value === 'none' ? undefined : 0,
                    })
                  }
                >
                  <option value="none">{t('discountNone')}</option>
                  <option value="percent">{t('discountPercent')}</option>
                  <option value="amount">{t('discountAmount')}</option>
                </Select>
              </label>
              {offer.discountKind && (
                <Input
                  type="number"
                  inputMode="decimal"
                  className="w-28"
                  aria-label={t('discountTitle')}
                  value={offer.discountValue ?? 0}
                  onChange={(e) =>
                    updateOffer(offer.id, { discountValue: Number(e.target.value) || 0 })
                  }
                />
              )}
            </div>
            {plan && (
              <p className="mt-3 text-sm text-status-success-fg">
                {t('planDiscount', { percent: settings.planDiscounts[plan] })}
              </p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="display-type text-xl">{t('messageTitle')}</h2>
            <p className="mt-1 text-sm text-ink-secondary">{t('messageHint')}</p>
            <Textarea
              className="mt-3 min-h-44"
              value={offer.message}
              onChange={(e) => updateOffer(offer.id, { message: e.target.value })}
            />
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-24 space-y-5">
            {/* Pinned so the owner never leaves this screen to check a detail. */}
            <div className="surface-card p-5">
              <h2 className="label-type text-ink-tertiary">{rt('customerTitle')}</h2>
              <p className="mt-2 font-medium">
                {customer.firstName} {customer.lastName}
              </p>
              <p className="text-sm text-ink-secondary">
                {property.street}, <span data-numeric>{property.postcode}</span>{' '}
                {property.city}
              </p>
              <dl className="mt-4 space-y-1.5 border-t border-line-subtle pt-3 text-sm">
                <SummaryRow label={rt('serviceTitle')}>{service.name[locale]}</SummaryRow>
                <SummaryRow label={rt('area')}>
                  <span data-numeric>
                    {property.area} m² · {property.rooms} Zi. · {property.bathrooms} Bad
                  </span>
                </SummaryRow>
                <SummaryRow label={rt('preferredTitle')}>
                  {request.preferred.flexible
                    ? rt('flexible')
                    : request.preferred.date
                      ? format.dateTime(new Date(request.preferred.date), 'dayMonth')
                      : '—'}
                </SummaryRow>
                {request.customerNote && (
                  <p className="pt-2 text-ink-secondary italic">
                    “{request.customerNote}”
                  </p>
                )}
              </dl>
            </div>

            <div className="surface-card p-5">
              <dl className="space-y-2">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <dt className="text-ink-secondary">{t('subtotal')}</dt>
                  <dd>
                    <Money amount={offerSubtotal(offer)} />
                  </dd>
                </div>
                {offerDiscount(offer) > 0 && (
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <dt className="text-ink-secondary">{t('discountTitle')}</dt>
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
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <dt className="text-ink-tertiary">{t('hoursTotal')}</dt>
                  <dd data-numeric className="text-ink-secondary">
                    {hours} Std.
                  </dd>
                </div>
              </dl>

              <label className="mt-5 flex items-center justify-between gap-3 border-t border-line-subtle pt-4 text-sm">
                <span className="text-ink-secondary">{t('validityTitle')}</span>
                <span data-numeric className="text-ink">
                  {t('validityDays', { days: settings.offerValidityDays })}
                </span>
              </label>

              <Button asChild size="lg" block className="mt-5">
                <Link href={`/admin/anfragen/${id}/offerte/senden`}>
                  {t('previewSend')}
                  <Send className="size-4" aria-hidden />
                </Link>
              </Button>
              <p className="mt-2 text-center text-xs text-ink-tertiary">
                {t('shortcutHint', { key: '⌘/Ctrl + ⏎' })}
              </p>
            </div>

            {/* Read-only. The customer picks the slot — this is here so the
                owner prices with capacity in view, not to make them choose. */}
            <div className="rounded-[var(--radius-lg)] border border-dashed border-line p-5">
              <h2 className="flex items-center gap-2 font-medium">
                <CalendarClock className="size-4 text-ink-tertiary" aria-hidden />
                {t('availabilityTitle')}
              </h2>
              <p className="mt-1 text-xs text-ink-tertiary">{t('availabilityLead')}</p>
              {slots.length === 0 ? (
                <p className="mt-3 text-sm text-ink-secondary">{t('availabilityNone')}</p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {slots.map((slot) => (
                    <li
                      key={slot.start}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span data-numeric>
                        {format.dateTime(new Date(slot.start), 'dayMonth')},{' '}
                        {format.dateTime(new Date(slot.start), 'time')}
                      </span>
                      {slot.routeCost > 0 && (
                        <span data-numeric className="text-xs text-ink-tertiary">
                          {t('routeCost', { minutes: slot.routeCost })}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile: the total and the send button never leave the thumb. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line-subtle bg-page/97 px-gutter pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="label-type text-ink-tertiary">{t('total')}</p>
          <Money amount={offerTotal(offer)} emphasis="strong" className="text-lg" />
        </div>
        <Button asChild size="lg">
          <Link href={`/admin/anfragen/${id}/offerte/senden`}>
            {t('previewSend')}
            <Send className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-ink-tertiary">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

/**
 * Edit in place. No dialog, no edit mode — the owner tabs across the row and
 * types. Borders only appear on hover and focus so a filled table still reads
 * as a document rather than a form.
 */
function CellInput({
  value,
  onChange,
  numeric,
  ...props
}: Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
}) {
  return (
    <input
      {...props}
      value={value}
      inputMode={numeric ? 'decimal' : undefined}
      data-numeric={numeric ? '' : undefined}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 w-full rounded-[var(--radius-sm)] border border-transparent bg-transparent px-2 text-sm transition-colors',
        'hover:border-line focus:border-line-focus focus:bg-card',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-line-focus',
        numeric && 'text-right',
      )}
    />
  );
}
