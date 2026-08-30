'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowRight, Home, Loader2, Lock } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Money, formatChf } from '@/components/ui/money';
import { cn } from '@/lib/cn';
import { planRhythm } from '@/lib/offer-facts';
import { METHOD_ICONS } from '@/lib/payment-methods';
import { perVisitPrice, propertyOptions, upgradeQuote } from '@/lib/plan-facts';
import { useAccount } from '@/lib/use-account';
import { useNow, useStore } from '@/mock/store';
import type { ID, Plan, Property, Subscription } from '@/mock/schema';

/**
 * What the customer is about to buy: a package, and — when they already hold
 * one on that address — the package it replaces.
 */
export type SubscribeIntent = {
  plan: Plan;
  /** Set for an upgrade. The address is then fixed and cannot be chosen. */
  upgradeOn?: Subscription;
};

/**
 * Buying a plan from inside the account, which was not possible at all.
 *
 * Every route to a plan went out through the front door. The empty state on
 * screen 43 sent the customer to the marketing page, the marketing page sent
 * them into the request wizard, and the wizard is six steps of address, service
 * and preferred date — for somebody whose address is already on file, whose
 * service is fixed by the plan they picked, and whose card is already saved.
 * The upgrade links were worse: `/kontakt?abo=<id>`, a contact form that never
 * read the parameter, so the plan they chose was lost on arrival and they had
 * to name it again to a person.
 *
 * So this is the whole purchase: which address, which saved method, confirm.
 * Nothing here asks a question the account can already answer.
 *
 * It refuses to render a card form when nothing is on file, and sends the
 * customer to screen 45 instead. A second place to type a card number is a
 * second place to get that wrong, and the one that persists is over there.
 */
export function SubscribeDialog({
  intent,
  onClose,
}: {
  intent: SubscribeIntent | null;
  onClose: () => void;
}) {
  if (!intent) return null;
  /*
   * Keyed, so a second plan gets a second form rather than the first one's
   * answers.
   *
   * The address and the method start from what the account already knows —
   * default card, first free address — and that is an initial value, not a
   * synchronisation. Resetting it from an effect on every open would mean one
   * render with the previous plan's choices still in it, and on an address
   * that is free for one package and taken for the next, that render is wrong
   * rather than merely stale.
   */
  return (
    <SubscribeForm
      key={`${intent.plan.id}:${intent.upgradeOn?.id ?? 'new'}`}
      intent={intent}
      onClose={onClose}
    />
  );
}

function SubscribeForm({
  intent,
  onClose,
}: {
  intent: SubscribeIntent;
  onClose: () => void;
}) {
  const t = useTranslations('account.subscription');
  const rhythmT = useTranslations('admin.rhythm');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const now = useNow();

  const { customerId, properties, subscriptions } = useAccount();
  const plans = useStore((s) => s.plans);
  const settings = useStore((s) => s.settings);
  const allMethods = useStore((s) => s.data.paymentMethods);
  const openSubscription = useStore((s) => s.openSubscription);
  const upgradeSubscription = useStore((s) => s.upgradeSubscription);

  const methods = allMethods.filter((m) => m.customerId === customerId);
  const options = propertyOptions(properties, subscriptions, now);
  const free = options.filter((o) => !o.heldBy);

  const [propertyId, setPropertyId] = useState<ID | null>(
    () => intent.upgradeOn?.propertyId ?? free[0]?.property.id ?? null,
  );
  const [methodId, setMethodId] = useState<ID | null>(
    () => methods.find((m) => m.isDefault)?.id ?? methods[0]?.id ?? null,
  );
  const [working, setWorking] = useState(false);

  const { plan, upgradeOn } = intent;
  const from = upgradeOn ? plans.find((p) => p.id === upgradeOn.planId) : undefined;
  const quote = upgradeOn && from ? upgradeQuote(upgradeOn, from, plan) : null;
  const due = quote ? quote.due : plan.price;

  const method = methods.find((m) => m.id === methodId);
  const property = properties.find((p) => p.id === propertyId);
  const canConfirm = Boolean(method && property) && !working;

  function confirm() {
    if (!method || !property) return;
    setWorking(true);

    if (upgradeOn) {
      const result = upgradeSubscription(
        { id: upgradeOn.id, toPlanId: plan.id, method: method.kind },
        now,
      );
      if ('blocked' in result) {
        setWorking(false);
        toast.error(t(`upgradeBlocked.${result.blocked}`));
        return;
      }
      toast.success(t('upgradeDone', { name: plan.name[locale] }));
      onClose();
      return;
    }

    const id = openSubscription(
      { customerId, propertyId: property.id, planId: plan.id, method: method.kind },
      now,
    );
    setWorking(false);
    if (!id) {
      toast.error(t('subscribeRefused'));
      return;
    }
    toast.success(t('subscribeDone', { name: plan.name[locale] }));
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent closeLabel={t('close')} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {upgradeOn
              ? t('confirmUpgradeTitle', { name: plan.name[locale] })
              : t('confirmTitle', { name: plan.name[locale] })}
          </DialogTitle>
          <DialogDescription>
            {t('confirmLead', {
              visits: plan.includedVisits,
              months: plan.validityMonths,
              rhythm: rhythmT(planRhythm(plan)),
            })}
          </DialogDescription>
        </DialogHeader>

        {/* What actually changes, for an upgrade. A price and a visit count on
            their own do not answer "am I better off"; the old figures have to
            stand next to the new ones, and this is the last screen before the
            money moves. */}
        {from && (
          <dl className="mb-5 divide-y divide-line-subtle rounded-[var(--radius-md)] border border-line-subtle">
            <Change
              label={t('changeVisits')}
              before={String(from.includedVisits)}
              after={String(plan.includedVisits)}
            />
            <Change
              label={t('changeRhythm')}
              before={rhythmT(planRhythm(from))}
              after={rhythmT(planRhythm(plan))}
            />
            <Change
              label={t('changeDiscount')}
              before={`${from.extraDiscountPercent}%`}
              after={`${plan.extraDiscountPercent}%`}
            />
            <Change
              label={t('changePerVisit')}
              before={formatChf(perVisitPrice(from), locale)}
              after={formatChf(perVisitPrice(plan), locale)}
            />
          </dl>
        )}

        {/* The address. Fixed for an upgrade — a plan that changed address on
            its way up would leave the remaining visits at the old one. */}
        {upgradeOn ? (
          <p className="flex items-center gap-2 text-sm text-ink-secondary">
            <Home className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
            {t('upgradeFor', { property: property?.label ?? t('propertyUnknown') })}
          </p>
        ) : (
          <fieldset>
            <legend className="label-type mb-2.5 text-ink-tertiary">{t('pickProperty')}</legend>
            {options.length === 0 ? (
              <Alert tone="neutral">{t('noProperties')}</Alert>
            ) : (
              <ul className="space-y-2">
                {options.map(({ property: p, heldBy }) => (
                  <li key={p.id}>
                    <PropertyChoice
                      property={p}
                      blocked={
                        heldBy
                          ? t('propertyTaken', {
                              plan:
                                plans.find((x) => x.id === heldBy.planId)?.name[locale] ??
                                heldBy.reference,
                              date: format.dateTime(new Date(heldBy.endDate), 'short'),
                            })
                          : null
                      }
                      checked={propertyId === p.id}
                      onSelect={() => setPropertyId(p.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {free.length === 0 && options.length > 0 && (
              <Alert tone="neutral" className="mt-3">
                {t('allPropertiesTaken')}
              </Alert>
            )}
          </fieldset>
        )}

        <fieldset className="mt-5">
          <legend className="label-type mb-2.5 text-ink-tertiary">{t('pickMethod')}</legend>
          {methods.length === 0 ? (
            <Alert
              tone="warning"
              action={
                <Button size="sm" asChild>
                  <Link href="/konto/zahlungsmittel">
                    {t('addMethod')}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              }
            >
              {t('noMethod')}
            </Alert>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {methods.map((m) => {
                const Icon = METHOD_ICONS[m.kind];
                const active = methodId === m.id;
                return (
                  <li key={m.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-sm transition-colors',
                        active
                          ? 'border-line-strong bg-accent-subtle'
                          : 'border-line hover:bg-sunken',
                      )}
                    >
                      <input
                        type="radio"
                        name="subscribe-method"
                        className="sr-only"
                        checked={active}
                        onChange={() => setMethodId(m.id)}
                      />
                      <Icon className="size-4 shrink-0 text-ink-accent" aria-hidden />
                      <span className="min-w-0 truncate">{m.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </fieldset>

        {/* The money, itemised. On an upgrade the amount charged is not the
            price on the card the customer just clicked, and an unexplained
            difference in either direction is a telephone call. */}
        <div className="mt-6 rounded-[var(--radius-md)] bg-sunken p-4">
          {quote && (
            <>
              <Line label={t('duePlan', { name: plan.name[locale] })}>
                <Money amount={plan.price} />
              </Line>
              <Line label={t('dueCredit', { n: quote.visitsLeft })}>
                <span data-numeric className="text-eco">
                  −{formatChf(quote.credit, locale)}
                </span>
              </Line>
            </>
          )}
          <div
            className={cn(
              'flex items-baseline justify-between gap-4',
              quote && 'mt-2.5 border-t border-line-subtle pt-2.5',
            )}
          >
            <span className="font-medium">{t('dueNow')}</span>
            <Money amount={due} emphasis="strong" className="text-xl" />
          </div>
          <p className="mt-2 text-sm text-ink-secondary">
            {t('dueNote', {
              visits: plan.includedVisits,
              months: plan.validityMonths,
              days: settings.planCancellationDays,
            })}
          </p>
        </div>

        <Button block size="lg" className="mt-5" onClick={confirm} disabled={!canConfirm}>
          {working ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t('confirmWorking')}
            </>
          ) : (
            t('confirmPay', { amount: formatChf(due, locale) })
          )}
        </Button>
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-tertiary">
          <Lock className="size-3.5" aria-hidden />
          {t('confirmSecure')}
        </p>
      </DialogContent>
    </Dialog>
  );
}

function PropertyChoice({
  property,
  blocked,
  checked,
  onSelect,
}: {
  property: Property;
  blocked: string | null;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-sm transition-colors',
        blocked
          ? 'cursor-not-allowed border-line-subtle bg-sunken'
          : checked
            ? 'cursor-pointer border-line-strong bg-accent-subtle'
            : 'cursor-pointer border-line hover:bg-sunken',
      )}
    >
      <input
        type="radio"
        name="subscribe-property"
        className="sr-only"
        disabled={Boolean(blocked)}
        checked={checked && !blocked}
        onChange={onSelect}
      />
      <Home
        className={cn('mt-0.5 size-4 shrink-0', blocked ? 'text-ink-tertiary' : 'text-ink-accent')}
        aria-hidden
      />
      <span className="min-w-0">
        <span className={cn('block font-medium', blocked && 'text-ink-secondary')}>
          {property.label}
        </span>
        <span className="block text-ink-tertiary">
          {property.street}, {property.postcode} {property.city}
        </span>
        {/* The reason on the row rather than a disabled control with nothing to
            say. "Why can I not pick my flat" is the only question a greyed line
            raises, and it is answerable in one sentence. */}
        {blocked && <span className="mt-1 block text-ink-secondary">{blocked}</span>}
      </span>
    </label>
  );
}

function Change({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className="flex items-center gap-2">
        <span data-numeric className="text-ink-tertiary line-through">
          {before}
        </span>
        <ArrowRight className="size-3.5 text-ink-tertiary" aria-hidden />
        <span data-numeric className="font-medium">
          {after}
        </span>
      </dd>
    </div>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 text-sm">
      <span className="text-ink-secondary">{label}</span>
      <span>{children}</span>
    </div>
  );
}
