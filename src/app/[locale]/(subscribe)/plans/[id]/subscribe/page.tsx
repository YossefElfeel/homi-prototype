'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, CalendarCheck, Check, Loader2, Lock } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/empty-state';
import { Money, formatChf } from '@/components/ui/money';
import { SkeletonPage } from '@/components/ui/skeleton';
import { planRhythm } from '@/lib/offer-facts';
import { perVisitPrice } from '@/lib/plan-facts';
import {
  blankDraft,
  cardExpiryValid,
  cardNumberValid,
  formatCardExpiry,
  formatCardNumber,
  methodDraftReady,
  methodDraftRecord,
} from '@/lib/payment-methods';
import { checkCoverage } from '@/mock/engines/coverage';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { PropertyKind } from '@/mock/schema';

/**
 * The checkout a plan never had.
 *
 * «Abo kaufen» on /plans led into the six-step request wizard, which asks for a
 * service the plan already fixes, a preferred date a package does not have, and
 * photographs of a job nobody has described yet — and at the end of it the plan
 * was still only a wish on a request. It became a subscription days later, if
 * the office sent a quote and the customer paid it. So the button did not do
 * what it said, and the delay was invisible: nothing on that path ever told the
 * customer they had not yet bought anything.
 *
 * One page rather than a second wizard, and that is the whole argument of this
 * screen. A package has three unknowns — where, who, which card — and the
 * dialog in the account already proved they fit on one surface. Splitting them
 * across four routes would repeat the mistake this flow exists to correct, and
 * it would move the price off the screen at the moment the customer is deciding
 * whether to spend four figures in one instalment. The summary stays in view
 * the whole way down.
 */
export default function SubscribePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('site.subscribe');
  const plansT = useTranslations('site.plans');
  const rhythmT = useTranslations('admin.rhythm');
  const brand = useTranslations('brand');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const plans = useStore((s) => s.plans);
  const settings = useStore((s) => s.settings);
  const regions = useStore((s) => s.regions);
  const subscribeAsGuest = useStore((s) => s.subscribeAsGuest);

  const [street, setStreet] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [postcode, setPostcode] = useState('');
  const [city, setCity] = useState('');
  const [kind, setKind] = useState<PropertyKind>('apartment');
  const [floor, setFloor] = useState('');
  const [hasElevator, setHasElevator] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<Locale>(locale);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [card, setCard] = useState(() => blankDraft('card'));
  const [state, setState] = useState<'idle' | 'processing' | 'failed'>('idle');
  /* The prototype's payment outcome, the same control the quote's payment step
     carries. Without it the failure path is unreachable — and a checkout whose
     failure state has never been seen is a checkout with an untested half. */
  const [outcome, setOutcome] = useState<'succeeded' | 'failed'>('succeeded');

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const plan = plans.find((p) => p.id === id);
  /*
   * A retired plan is not a 404. The URL was valid when it was printed, mailed
   * or bookmarked, and «gibt es nicht» for something the customer saw on our
   * own site last week reads as a broken link rather than a withdrawn product.
   */
  if (!plan || !plan.active) {
    return (
      <div className="mx-auto max-w-2xl px-gutter py-16">
        <EmptyState
          icon={AlertTriangle}
          title={t('planGoneTitle')}
          body={t('planGoneBody')}
          action={
            <Button asChild>
              <Link href="/plans">{t('backToPlans')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const coverage = checkCoverage(postcode, settings.servedPostcodes, regions);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const cardReady = methodDraftReady('card', card);

  const complete =
    Boolean(street && postcode && city && floor !== '') &&
    coverage.state === 'inside' &&
    Boolean(firstName && lastName && phone) &&
    emailValid &&
    acceptedTerms &&
    acceptedPrivacy &&
    cardReady;

  function pay() {
    if (!plan) return;
    setState('processing');

    window.setTimeout(() => {
      if (outcome === 'failed') {
        setState('failed');
        return;
      }

      const result = subscribeAsGuest(
        {
          planId: plan.id,
          contact: { firstName, lastName, email, phone, language },
          property: {
            street,
            addressDetail,
            postcode,
            city,
            kind,
            floor: Number(floor),
            hasElevator,
          },
          /* Reduced before it leaves the screen. The store is handed a label and
             an expiry — never the number — so the one place that ever sees a PAN
             is this component, and it does not keep it either. */
          card: methodDraftRecord('card', card),
        },
        now,
      );

      if ('blocked' in result) {
        setState('idle');
        toast.error(t(`blocked${result.blocked[0]!.toUpperCase()}${result.blocked.slice(1)}`));
        return;
      }

      toast.success(t('done', { name: plan.name[locale] }));
      /* Into the account, which `subscribeAsGuest` has just signed them into.
         The plan screen is the confirmation: it carries the package, the visit
         counter, the term and the invoice that was raised — everything a
         dedicated «thank you» page would restate, on the screen they will come
         back to. */
      router.push('/account/plan');
    }, 1400);
  }

  if (state === 'failed') {
    return (
      <div className="mx-auto max-w-2xl px-gutter py-16">
        {/* One word, not the heading again. The badge and the h1 both read
            `failedTitle` at first, so the screen said «Die Zahlung ist nicht
            durchgegangen» twice in a row — the quote's payment step keeps a
            separate short label for exactly this slot. */}
        <span className="inline-flex items-center gap-2 rounded-sm border border-status-danger-line bg-status-danger px-2 py-1 text-xs font-medium text-status-danger-fg">
          <AlertTriangle className="size-3.5" aria-hidden />
          {t('failedBadge')}
        </span>
        <h1 className="display-type mt-5 text-[clamp(2.25rem,3.6vw,2.75rem)]">
          {t('failedTitle')}
        </h1>
        <p className="mt-4 text-lg text-ink-secondary">{t('failedBody')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => setState('idle')}>
            {t('retry')}
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/plans">{t('backToPlans')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-gutter py-10">
      <h1 className="display-type text-[clamp(2.25rem,4vw,2.75rem)]">{t('title')}</h1>
      <p className="mt-4 max-w-[52ch] text-ink-secondary">{t('lead')}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="space-y-12 lg:col-span-7">
          {/* ---------------------------------------------------- the address */}
          <section>
            <h2 className="subhead-type text-2xl">{t('addressTitle')}</h2>
            <p className="mt-2 text-sm text-ink-secondary">{t('addressLead')}</p>

            <div className="mt-6 space-y-6">
              <Field label={t('street')}>
                {(props) => (
                  <Input
                    value={street}
                    autoComplete="street-address"
                    onChange={(e) => setStreet(e.target.value)}
                    {...props}
                  />
                )}
              </Field>

              <Field label={t('addressDetail')} hint={t('addressDetailHint')} optional>
                {(props) => (
                  <Input
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    {...props}
                  />
                )}
              </Field>

              <div className="grid gap-6 sm:grid-cols-[8rem_1fr]">
                <Field
                  label={t('postcode')}
                  error={postcode && coverage.state === 'invalid' ? t('coverageInvalid') : undefined}
                >
                  {(props) => (
                    <Input
                      value={postcode}
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="postal-code"
                      onChange={(e) => setPostcode(e.target.value.replace(/\D/g, ''))}
                      {...props}
                    />
                  )}
                </Field>
                <Field label={t('city')}>
                  {(props) => (
                    <Input
                      value={city}
                      autoComplete="address-level2"
                      onChange={(e) => setCity(e.target.value)}
                      {...props}
                    />
                  )}
                </Field>
              </div>

              {coverage.state === 'inside' && (
                <p className="flex items-center gap-2 text-sm text-eco">
                  <Check className="size-4 shrink-0" aria-hidden />
                  {t('coverageInside', { region: coverage.region.name })}
                </p>
              )}

              {/* Ends the purchase rather than explaining and continuing. A year
                  of visits sold into a postcode nobody can drive to is the one
                  refusal on this screen that has to arrive before the card. */}
              {coverage.state === 'outside' && (
                <Alert
                  tone="warning"
                  action={
                    <Button size="sm" variant="secondary" asChild>
                      <Link href="/contact">{t('coverageOutsideCta')}</Link>
                    </Button>
                  }
                >
                  {t('coverageOutside')}
                </Alert>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <Field label={t('kind')}>
                  {(props) => (
                    <Select
                      value={kind}
                      onChange={(e) => setKind(e.target.value as PropertyKind)}
                      {...props}
                    >
                      <option value="apartment">{t('kindApartment')}</option>
                      <option value="house">{t('kindHouse')}</option>
                      <option value="office">{t('kindOffice')}</option>
                    </Select>
                  )}
                </Field>
                <Field label={t('floor')} hint={t('floorHint')}>
                  {(props) => (
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      {...props}
                    />
                  )}
                </Field>
              </div>

              <Checkbox
                checked={hasElevator}
                onChange={(e) => setHasElevator(e.target.checked)}
                label={t('hasElevator')}
              />
            </div>
          </section>

          {/* ---------------------------------------------------- the person */}
          <section>
            <h2 className="subhead-type text-2xl">{t('contactTitle')}</h2>
            <p className="mt-2 text-sm text-ink-secondary">{t('contactLead')}</p>

            <div className="mt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label={t('firstName')}>
                  {(props) => (
                    <Input
                      value={firstName}
                      autoComplete="given-name"
                      onChange={(e) => setFirstName(e.target.value)}
                      {...props}
                    />
                  )}
                </Field>
                <Field label={t('lastName')}>
                  {(props) => (
                    <Input
                      value={lastName}
                      autoComplete="family-name"
                      onChange={(e) => setLastName(e.target.value)}
                      {...props}
                    />
                  )}
                </Field>
              </div>

              <Field
                label={t('email')}
                hint={t('emailHint')}
                error={email && !emailValid ? t('emailInvalid') : undefined}
              >
                {(props) => (
                  <Input
                    type="email"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    {...props}
                  />
                )}
              </Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field label={t('phone')}>
                  {(props) => (
                    <Input
                      type="tel"
                      value={phone}
                      autoComplete="tel"
                      onChange={(e) => setPhone(e.target.value)}
                      {...props}
                    />
                  )}
                </Field>
                <Field label={t('language')}>
                  {(props) => (
                    <Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Locale)}
                      {...props}
                    >
                      {routing.locales.map((code) => (
                        <option key={code} value={code}>
                          {LOCALE_LABELS[code]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>

              <div className="space-y-3 border-t border-line-subtle pt-6">
                <Checkbox
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  label={
                    <>
                      {t('consentTerms')}{' '}
                      <Link
                        href="/legal/agb"
                        className="underline decoration-from-font underline-offset-4"
                      >
                        AGB
                      </Link>
                    </>
                  }
                />
                <Checkbox
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  label={
                    <>
                      {t('consentPrivacy')}{' '}
                      <Link
                        href="/legal/datenschutz"
                        className="underline decoration-from-font underline-offset-4"
                      >
                        Datenschutz
                      </Link>
                    </>
                  }
                />
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------ the card */}
          <section>
            <h2 className="subhead-type text-2xl">{t('paymentTitle')}</h2>
            <p className="mt-2 text-sm text-ink-secondary">{t('paymentLead')}</p>

            <div className="mt-6 space-y-6">
              <Field
                label={t('cardNumber')}
                error={
                  card.cardNumber && !cardNumberValid(card.cardNumber)
                    ? t('cardNumberInvalid')
                    : undefined
                }
              >
                {(props) => (
                  <Input
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    value={card.cardNumber}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, cardNumber: formatCardNumber(e.target.value) }))
                    }
                    {...props}
                  />
                )}
              </Field>

              <Field label={t('cardName')}>
                {(props) => (
                  <Input
                    autoComplete="cc-name"
                    value={card.cardName}
                    onChange={(e) => setCard((c) => ({ ...c, cardName: e.target.value }))}
                    {...props}
                  />
                )}
              </Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label={t('cardExpiry')}
                  error={
                    card.cardExpiry && !cardExpiryValid(card.cardExpiry)
                      ? t('cardExpiryInvalid')
                      : undefined
                  }
                >
                  {(props) => (
                    <Input
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="09/28"
                      value={card.cardExpiry}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, cardExpiry: formatCardExpiry(e.target.value) }))
                      }
                      {...props}
                    />
                  )}
                </Field>
                <Field
                  label={t('cardCvc')}
                  error={
                    card.cardCvv && !/^\d{3,4}$/.test(card.cardCvv)
                      ? t('cardCvcInvalid')
                      : undefined
                  }
                >
                  {(props) => (
                    <Input
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      value={card.cardCvv}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, cardCvv: e.target.value.replace(/\D/g, '') }))
                      }
                      {...props}
                    />
                  )}
                </Field>
              </div>

              {/* Says what survives the save. The customer is typing a card
                  number into a prototype, and the honest thing is to state what
                  is kept rather than let the form imply all of it is. */}
              <p className="flex gap-2.5 text-sm text-ink-tertiary">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {t('cardStored')}
              </p>
            </div>
          </section>
        </div>

        {/* -------------------------------------------------------- the money */}
        <aside className="lg:col-span-5">
          <div className="sticky top-6 space-y-5">
            <div className="surface-card p-6">
              <h2 className="label-type text-ink-tertiary">{t('summaryTitle')}</h2>
              <p className="subhead-type mt-2 text-2xl">{plan.name[locale]}</p>

              <dl className="mt-5 space-y-2.5 border-t border-line-subtle pt-5 text-sm">
                <Row label={t('summaryVisits')} value={String(plan.includedVisits)} />
                <Row
                  label={t('summaryTerm')}
                  value={t('months', { n: plan.validityMonths })}
                />
                <Row label={t('summaryRhythm')} value={rhythmT(planRhythm(plan))} />
                <Row
                  label={t('summaryPerVisit')}
                  value={formatChf(perVisitPrice(plan), locale)}
                />
              </dl>

              <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-line-subtle pt-5">
                <span className="font-medium">{t('dueNow')}</span>
                <Money amount={plan.price} emphasis="strong" className="text-2xl" />
              </div>
              <p className="mt-2 text-sm text-ink-secondary">
                {t('dueNote', {
                  visits: plan.includedVisits,
                  months: plan.validityMonths,
                  days: settings.planCancellationDays,
                })}
              </p>

              {/* Directly above the button, the way the quote's payment step
                  does it — what the money buys, when somebody calls, and where
                  the invoice lands. Never in a footer. */}
              <div className="mt-6 border-t border-line-subtle pt-5">
                <h3 className="flex items-center gap-2 font-medium">
                  <CalendarCheck className="size-4 text-ink-secondary" aria-hidden />
                  {t('beforeTitle')}
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
                  <li>{t('before1')}</li>
                  <li>{t('before2')}</li>
                  <li>{t('before3')}</li>
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
                disabled={!complete || state === 'processing'}
              >
                {state === 'processing' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {t('processing')}
                  </>
                ) : (
                  t('pay', { amount: formatChf(plan.price, locale) })
                )}
              </Button>

              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-tertiary">
                <Lock className="size-3.5" aria-hidden />
                {t('secure')}
              </p>
            </div>

            <p className="text-sm text-ink-tertiary">{plansT('commitmentNoticeBody')}</p>

            {/* Prototype control, styled as a tool so it is never mistaken for
                part of the checkout — the same treatment on the quote's payment
                step, for the same reason. */}
            <div className="rounded-[var(--radius-md)] border border-dashed border-line p-4">
              <p className="text-xs text-ink-tertiary">{t('mockNotice')}</p>
              <div className="mt-3 flex gap-2">
                {(['succeeded', 'failed'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOutcome(value)}
                    aria-pressed={outcome === value}
                    className={
                      outcome === value
                        ? 'flex-1 rounded-[var(--radius-sm)] border border-line-strong bg-sunken px-3 py-2 text-xs font-medium'
                        : 'flex-1 rounded-[var(--radius-sm)] border border-line px-3 py-2 text-xs text-ink-tertiary transition-colors hover:bg-sunken'
                    }
                  >
                    {value === 'succeeded' ? t('mockSucceed') : t('mockFail')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-secondary">{label}</dt>
      <dd data-numeric className="font-medium">
        {value}
      </dd>
    </div>
  );
}
