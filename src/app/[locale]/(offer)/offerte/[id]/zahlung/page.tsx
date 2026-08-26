'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import {
  AlertTriangle,
  CalendarCheck,
  CreditCard,
  Loader2,
  Lock,
  Phone,
  Smartphone,
  Wallet,
} from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Money, formatChf } from '@/components/ui/money';
import { Field, Input } from '@/components/ui/field';
import { OfferShell } from '@/components/offer/offer-shell';
import { HoldTimer } from '@/components/offer/hold-timer';
import { useOffer } from '@/components/offer/use-offer';
import { offerTotal } from '@/mock/engines/offers';
import { requestCoverage } from '@/lib/offer-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { PaymentMethod } from '@/mock/schema';
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/cn';

const METHODS: { value: PaymentMethod; icon: typeof CreditCard; key: 'twint' | 'card' | 'applePay' | 'googlePay' }[] = [
  { value: 'twint', icon: Smartphone, key: 'twint' },
  { value: 'card', icon: CreditCard, key: 'card' },
  { value: 'apple-pay', icon: Wallet, key: 'applePay' },
  { value: 'google-pay', icon: Wallet, key: 'googlePay' },
];

/**
 * Screens 27 and 31.
 *
 * The client confirmed payment in full up front, so this screen carries more
 * weight than any other in the customer-facing product. The design response is
 * the "what happens now" card sitting directly above the pay button:
 *
 *  · what the money buys, with the date
 *  · the cancellation rule as a number, not a link to terms
 *  · who gets in touch, by name and phone
 *
 * Never in a footer, never behind a disclosure. §20.2 also applies: a failed
 * payment does not book the slot, and the hold keeps running so a retry does
 * not cost the customer the time they chose.
 */
export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('offer.payment');
  const f = useTranslations('offer.failed');
  const brand = useTranslations('brand');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const data = useOffer(id);
  const settings = useStore((s) => s.settings);
  const subscriptions = useStore((s) => s.data.subscriptions);
  const plans = useStore((s) => s.plans);
  const payOffer = useStore((s) => s.payOffer);

  const [method, setMethod] = useState<PaymentMethod>('twint');
  const [state, setState] = useState<'idle' | 'processing' | 'failed'>('idle');
  const [outcome, setOutcome] = useState<'succeeded' | 'failed'>('succeeded');

  if (!hydrated) return <div className="p-gutter text-ink-tertiary">…</div>;
  if (!data) return null;
  const { offer, hold, request } = data;
  const amount = offerTotal(offer);

  /*
   * §11.3 — a visit the plan already paid for is not charged again.
   *
   * Without this the flow asked a plan customer for a card and took the full
   * amount for a visit their plan already includes. The gateway is not softened
   * here, it is *absent*: there is nothing to pay, so there is nothing to pay
   * with.
   */
  const coverage = requestCoverage(request, subscriptions, plans, now);
  const covered = coverage.kind !== 'payable';

  function pay() {
    setState('processing');
    window.setTimeout(() => {
      const result = payOffer(offer.id, method, outcome, now);
      if (result.bookingReference) {
        router.push(`/offerte/${offer.id}/bestaetigt`);
      } else {
        setState('failed');
      }
    }, 1400);
  }

  if (covered) {
    return (
      <OfferShell offer={offer} step="zahlung">
        <div className="max-w-2xl">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-status-success text-status-success-fg">
            <Wallet className="size-6" aria-hidden />
          </span>
          <h1 className="display-type mt-7 text-[clamp(2.25rem,3.6vw,2.75rem)]">
            {t('coveredTitle')}
          </h1>
          <p className="mt-4 text-lg text-ink-secondary">{t('coveredSubscription')}</p>

          <div className="surface-card mt-8 p-6">
            <h2 className="flex items-center gap-2 font-medium">
              <CalendarCheck className="size-4 text-ink-secondary" aria-hidden />
              {t('beforeTitle')}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
              <li>
                {t('before1', {
                  date: hold ? format.dateTime(new Date(hold.start), 'dayMonth') : '—',
                })}
              </li>
              <li>{t('before2')}</li>
              <li>{t('before4', { percent: settings.lateCancellationPercent })}</li>
            </ul>
            <Button size="lg" block className="mt-6" onClick={pay} disabled={state === 'processing'}>
              {state === 'processing' ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t('processing')}
                </>
              ) : (
                t('coveredConfirm')
              )}
            </Button>
          </div>
        </div>
      </OfferShell>
    );
  }

  if (state === 'failed') {
    return (
      <OfferShell offer={offer} step="zahlung">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-sm border border-status-danger-line bg-status-danger px-2 py-1 text-xs font-medium text-status-danger-fg">
            <AlertTriangle className="size-3.5" aria-hidden />
            {f('badge')}
          </span>
          <h1 className="display-type mt-5 text-[clamp(2.25rem,3.6vw,2.75rem)]">
            {f('title')}
          </h1>
          <p className="mt-4 text-lg text-ink-secondary">{f('body')}</p>

          {hold ? (
            <HoldTimer hold={hold} className="mt-8" />
          ) : (
            <div className="mt-8 flex gap-3 border-l-2 border-rule bg-sunken p-5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
              <div>
                <h2 className="font-medium">{f('holdLostTitle')}</h2>
                <p className="mt-1.5 text-sm text-ink-secondary">{f('holdLostBody')}</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {hold ? (
              <Button size="lg" onClick={() => setState('idle')}>
                {f('retry')}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => router.push(`/offerte/${offer.id}/termin`)}
              >
                {f('pickNewSlot')}
              </Button>
            )}
            <Button variant="secondary" size="lg" onClick={() => setState('idle')}>
              {f('otherMethod')}
            </Button>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-ink-tertiary">
            <Phone className="size-3.5" aria-hidden />
            {f('help', { phone: brand('phone') })}
          </p>
        </div>
      </OfferShell>
    );
  }

  return (
    <OfferShell offer={offer} step="zahlung">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="display-type text-[clamp(2.25rem,3.6vw,2.75rem)]">{t('title')}</h1>
          <p className="mt-4 max-w-[46ch] text-ink-secondary">{t('lead')}</p>

          <fieldset className="mt-8">
            <legend className="label-type mb-3 text-ink-tertiary">{t('methodTitle')}</legend>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {METHODS.map((option) => {
                const Icon = option.icon;
                const active = method === option.value;
                return (
                  <li key={option.value}>
                    <label
                      className={cn(
                        'flex h-full cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-md)] border px-3 py-4 text-center text-sm transition-colors',
                        active
                          ? 'border-line-strong bg-accent-subtle'
                          : 'border-line hover:bg-sunken',
                      )}
                    >
                      <input
                        type="radio"
                        name="method"
                        className="sr-only"
                        checked={active}
                        onChange={() => setMethod(option.value)}
                      />
                      <Icon className="size-5 text-ink-accent" aria-hidden />
                      {t(option.key)}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          {method === 'card' && (
            <div className="mt-8 space-y-5">
              <Field label={t('cardNumber')}>
                {(props) => (
                  <Input inputMode="numeric" placeholder="4242 4242 4242 4242" {...props} />
                )}
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('cardExpiry')}>
                  {(props) => <Input placeholder="12 / 28" {...props} />}
                </Field>
                <Field label={t('cardCvc')}>
                  {(props) => <Input inputMode="numeric" placeholder="123" {...props} />}
                </Field>
              </div>
              <Field label={t('cardName')}>{(props) => <Input {...props} />}</Field>
            </div>
          )}

          {method === 'twint' && (
            <p className="mt-8 rounded-[var(--radius-md)] bg-sunken p-4 text-sm text-ink-secondary">
              {t('twintHint')}
            </p>
          )}

          {(method === 'apple-pay' || method === 'google-pay') && (
            <p className="mt-8 rounded-[var(--radius-md)] bg-sunken p-4 text-sm text-ink-secondary">
              {t('walletHint')}
            </p>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-6 space-y-5">
            {hold && <HoldTimer hold={hold} />}

            <div className="surface-card p-6">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-ink-secondary">{t('amountDue')}</span>
                <Money amount={amount} emphasis="strong" className="text-2xl" />
              </div>

              {/* Directly above the button, by design. */}
              <div className="mt-6 border-t border-line-subtle pt-5">
                <h2 className="flex items-center gap-2 font-medium">
                  <CalendarCheck className="size-4 text-ink-secondary" aria-hidden />
                  {t('beforeTitle')}
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
                  <li>
                    {t('before1', {
                      date: hold
                        ? format.dateTime(new Date(hold.start), 'dayMonth')
                        : '—',
                    })}
                  </li>
                  <li>{t('before2')}</li>
                  <li>{t('before3')}</li>
                  <li>{t('before4', { percent: settings.lateCancellationPercent })}</li>
                </ul>
                <p className="mt-3 text-sm text-ink-secondary">
                  {t('beforeContact', { name: 'Marco Brunner', phone: brand('phone') })}
                </p>
              </div>

              <Button
                size="lg"
                block
                className="mt-6"
                onClick={pay}
                disabled={state === 'processing'}
              >
                {state === 'processing' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {t('processing')}
                  </>
                ) : (
                  t('pay', { amount: formatChf(amount, locale) })
                )}
              </Button>

              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-tertiary">
                <Lock className="size-3.5" aria-hidden />
                {t('secure')}
              </p>
            </div>

            {/* Prototype control, styled as a tool so it is never mistaken for
                part of the checkout. */}
            <div className="rounded-[var(--radius-md)] border border-dashed border-line p-4">
              <p className="text-xs text-ink-tertiary">{t('mockNotice')}</p>
              <div className="mt-3 flex gap-2">
                {(['succeeded', 'failed'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOutcome(value)}
                    aria-pressed={outcome === value}
                    className={cn(
                      'flex-1 rounded-[var(--radius-sm)] border px-3 py-2 text-xs transition-colors',
                      outcome === value
                        ? 'border-line-strong bg-sunken font-medium'
                        : 'border-line text-ink-tertiary hover:bg-sunken',
                    )}
                  >
                    {value === 'succeeded' ? t('mockSucceed') : t('mockFail')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </OfferShell>
  );
}
