'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Info, Plus, Trash2 } from 'lucide-react';

import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Select } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { PaymentMethodFields } from '@/components/payment/method-fields';
import { planOf } from '@/lib/plan-facts';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';
import {
  METHOD_ICONS,
  SAVABLE_METHODS,
  blankDraft,
  canCarryPlan,
  methodDraftReady,
  methodDraftRecord,
  type PaymentDraft,
} from '@/lib/payment-methods';
import type { SavedMethodKind } from '@/mock/schema';

/**
 * What each savable method is called on this screen. The glyphs are not here:
 * they come from `lib/payment-methods.ts`, which is what stops this screen and
 * the owner's copy of the same list (65) drawing TWINT two different ways.
 */
const LABEL_KEY: Record<SavedMethodKind, string> = {
  card: 'card',
  twint: 'twint',
  'apple-pay': 'applePay',
  'google-pay': 'googlePay',
};

/**
 * Screen 45 — payment methods.
 *
 * TWINT is offered for one-off jobs and blocked for the package, with the
 * reason stated where the choice is made — and as of this wave the dialog that
 * opens a package enforces it instead of merely printing it underneath.
 *
 * The reference this note used to carry was wrong: §11.2 is about fixed
 * visit slots, not about charging. What the block actually rests on is the
 * alert's own claim of «automatische Abbuchung», and §11.5 is decided against
 * it — a package is paid once and renewed by the customer in one click, with
 * no billing run in the product at all. §11.6 on /open-questions is that
 * contradiction; until it is answered the code does what the screen says.
 *
 * **Saving one now asks for it.** The four buttons under «Hinzufügen» used to
 * write a record on the click, labelled with the name of the method — no
 * number, no expiry, nothing typed at all. What that cost, on the one screen
 * whose entire subject is which instruments we hold:
 *
 *  · **two saved cards were the same row.** Both read «Karte». The list could
 *    not say which one the plan charges, and neither could the customer.
 *  · **`expiresAt` was never written.** It is the field that lets the office
 *    ring a week before a plan fails to charge — seeded on both demo
 *    customers, and unreachable from the screen that creates the record.
 *  · **the toast was a lie.** «Zahlungsmittel hinterlegt» after a click that
 *    collected nothing describes a payment method that does not exist.
 *
 * So each kind opens a dialog and asks for what that rail actually needs — a
 * card for its four fields, TWINT for the number it is registered to, a wallet
 * for the device it lives on. The fields themselves are in
 * `components/payment/method-fields.tsx`, shared with screen 65, because the
 * owner takes the same details down over the phone.
 */
export default function AccountPaymentPage() {
  const t = useTranslations('account.payment');
  const formT = useTranslations('paymentForm');
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const now = useNow();

  /*
   * These lived in `useState`, seeded with two hard-coded cards. Adding a
   * method, removing one, or changing the default all worked convincingly and
   * were discarded on the next navigation — on the one screen whose entire
   * subject is what has been saved.
   */
  const customerId = useStore((s) => s.demo.currentCustomerId);
  const customers = useStore((s) => s.data.customers);
  const allMethods = useStore((s) => s.data.paymentMethods);
  const plans = useStore((s) => s.plans);
  const addPaymentMethod = useStore((s) => s.addPaymentMethod);
  const removePaymentMethod = useStore((s) => s.removePaymentMethod);
  const setDefaultPaymentMethod = useStore((s) => s.setDefaultPaymentMethod);
  const setSubscriptionMethod = useStore((s) => s.setSubscriptionMethod);
  const { properties, subscriptions } = useAccount();

  /*
   * `adding` is the kind being added and doubles as whether the dialog is open,
   * because the dialog has no meaning without one. The draft is seeded from the
   * kind on open — a wallet arrives with its first device already picked — and
   * thrown away on close, so abandoning a half-typed card leaves nothing
   * behind for the next one.
   */
  const [adding, setAdding] = useState<SavedMethodKind | null>(null);
  const [draft, setDraft] = useState<PaymentDraft>(() => blankDraft('card'));

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const methods = allMethods.filter((m) => m.customerId === customerId);
  const me = customers.find((c) => c.id === customerId);

  /*
   * Which packages are still going to be billed — the same two states
   * `removePaymentMethod` refuses to let a card out from under. If the two
   * lists ever disagree, the screen shows a package whose card it will
   * nevertheless let you delete, or refuses a deletion it never explained.
   *
   * `expired` and `cancelled` are left out: renewing raises a fresh invoice
   * and asks again, so nothing about them is waiting on a stored instrument.
   */
  const billable = subscriptions.filter((s) => s.status === 'active' || s.status === 'paused');
  /* Only the rails that can carry a recurring charge — one rule, in
     `lib/payment-methods.ts`, shared with the dialog that opens a package. */
  const planCards = methods.filter((m) => canCarryPlan(m.kind));

  function open(kind: SavedMethodKind) {
    setDraft(blankDraft(kind));
    setAdding(kind);
  }

  function save() {
    if (!adding || !methodDraftReady(adding, draft)) return;
    addPaymentMethod({ customerId, kind: adding, ...methodDraftRecord(adding, draft) }, now);
    setAdding(null);
    toast.success(t('added'));
  }

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} />

      <div className="space-y-app-section">
        <Card pad="none">
          <CardHeader className="p-card" title={t('savedTitle')} />
          {methods.length === 0 ? (
            <p className="px-card pb-card text-sm text-ink-tertiary">
              {t('savedNone')}
            </p>
          ) : (
            <ul className="border-t border-line-subtle">
              {methods.map((method) => {
                const Icon = METHOD_ICONS[method.kind];
                return (
                <li
                  key={method.id}
                  className="px-card py-row flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line-subtle last:border-0"
                >
                  {/* Wraps as whole parts, and the label never breaks inside
                      itself. On a 375px screen the expiry took just enough room
                      to split «Visa · 4242» across two lines — a card number cut
                      in half reads as two numbers. */}
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Icon className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                    <span data-numeric className="whitespace-nowrap">
                      {method.label}
                    </span>
                    {/* The expiry is collected now, so it is shown. A card whose
                        date the customer cannot read here is one they find out
                        about from a declined plan charge. */}
                    {method.expiresAt && (
                      <span data-numeric className="text-sm whitespace-nowrap text-ink-tertiary">
                        {t('expires', { date: method.expiresAt })}
                      </span>
                    )}
                    {method.isDefault && <Chip>{t('defaultLabel')}</Chip>}
                  </span>
                  <span className="flex items-center gap-1">
                    {!method.isDefault && (
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => {
                          setDefaultPaymentMethod(method.id);
                          toast.success(t('defaultSet'));
                        }}
                      >
                        {t('makeDefault')}
                      </Button>
                    )}
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => {
                        /* The refusal is the whole point. This click used to
                           delete a card a running package was billed to and
                           report success; the package was left pointing at an
                           id that no longer existed, and nothing on any screen
                           said so. */
                        const result = removePaymentMethod(method.id);
                        if ('blocked' in result) {
                          toast.error(t('removeBlocked', { plans: result.plans.join(', ') }));
                          return;
                        }
                        toast.success(t('removed'));
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      <span className="sr-only">{t('remove')}</span>
                    </Button>
                  </span>
                </li>
                );
              })}
            </ul>
          )}
        </Card>
  
        <Card>
          <CardHeader title={t('addTitle')} description={t('addLead')} />
          <CardBody className="gap-app grid sm:grid-cols-2">
            {SAVABLE_METHODS.map((kind) => {
              const Icon = METHOD_ICONS[kind];
              const key = LABEL_KEY[kind];
              return (
                /* Was a bare `<button>` carrying a hand-typed copy of the card's
                   hover treatment — and it had already drifted: a border-colour
                   change where every other clickable card in the product lifts.
                   `asChild` is what makes `interactive` reachable from a control
                   that has to *be* the button. */
                <Card key={kind} asChild interactive pad="sm">
                  <button
                    type="button"
                    onClick={() => open(kind)}
                    className="flex min-h-11 items-center gap-3"
                  >
                    <Icon className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                    <span className="flex-1">{t(key)}</span>
                    <Plus className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                  </button>
                </Card>
              );
            })}
          </CardBody>
        </Card>
  
        {/*
          One row per package, and each row is a control.
       
          This card used to print a single card label off `methods.find(m =>
          m.kind === 'card')` — the first card in the list, which was neither
          the one marked «Standard» nor anything the customer had chosen. Three
          things were wrong with it at once and they compounded:
       
           · **it answered for the wrong number of packages.** A customer holds
             one package per address, and the demo account holds two. One line
             could not say which card each was on, so it said one of them and
             looked like the answer for both.
           · **nothing could change it.** The line was read-only and there was
             no other control, so the only way to move a package to another
             card was to delete the one it was on — the single act that must not
             be allowed while a package is running.
           · **it disagreed with «Standard» directly above it.** Marking a
             second card as default moved the chip and left this line alone, so
             one screen gave two answers to one question.
       
          Now it reads `Subscription.paymentMethodId`, which is what the
          subscribe dialog writes and what the charge would actually use.
        */}
        <Card pad="none">
          <CardHeader
            className="p-card"
            title={t('recurringTitle')}
            description={t('recurringLead')}
          />

          {billable.length === 0 ? (
            <p className="px-card pb-card text-sm text-ink-tertiary">{t('recurringNone')}</p>
          ) : (
            <ul className="border-t border-line-subtle">
              {billable.map((subscription) => {
                const plan = planOf(subscription, plans);
                const property = properties.find((p) => p.id === subscription.propertyId);
                const bound = methods.find((m) => m.id === subscription.paymentMethodId);
                return (
                  <li
                    key={subscription.id}
                    className="px-card py-row flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line-subtle last:border-0"
                  >
                    {/* The address, not just the package name: two packages of
                        the same kind at two addresses are told apart by where
                        they are, which is the only part the customer thinks in. */}
                    <span className="flex flex-col">
                      <span>{plan ? plan.name[locale] : subscription.reference}</span>
                      <span className="text-sm text-ink-tertiary">
                        {property ? property.label : subscription.reference}
                      </span>
                    </span>

                    {planCards.length === 0 ? (
                      /* Not an empty select. A customer with only a TWINT on
                         file has nothing this control could offer, and an
                         empty dropdown would read as a bug rather than as the
                         missing card it is. */
                      <span className="text-sm text-ink-tertiary">{t('recurringNoCard')}</span>
                    ) : (
                      <Select
                        dense
                        className="max-w-64"
                        aria-label={t('recurringPickFor', {
                          plan: plan ? plan.name[locale] : subscription.reference,
                        })}
                        value={bound?.id ?? ''}
                        onChange={(event) => {
                          setSubscriptionMethod(subscription.id, event.target.value, now);
                          toast.success(t('recurringSet'));
                        }}
                      >
                        {/* Only while nothing is set — a store persisted before
                            45, or a package seeded as a state fixture. Once a
                            card is chosen there is no way back to "none", and
                            offering one would invite a package with no
                            instrument on a screen that just fixed that. */}
                        {!bound && <option value="">{t('recurringUnset')}</option>}
                        {planCards.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </Select>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* The alert describes a rule that is now enforced rather than
              merely stated: the dialog that opens a package offers cards only,
              and `setSubscriptionMethod` refuses anything else. */}
          <div className="p-card border-t border-line-subtle">
            <Alert tone="neutral" icon={Info} title={t('twintBlockedTitle')}>
              {t('twintBlockedBody')}
            </Alert>
          </div>
        </Card>
      </div>

      <Dialog open={adding !== null} onOpenChange={(o) => !o && setAdding(null)}>
        <DialogContent closeLabel={formT('cancel')}>
          {adding && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t('addDialogTitle', { method: t(LABEL_KEY[adding]) })}
                </DialogTitle>
                {/* Two leads, not four. What separates them is the one thing a
                    customer picking a method needs to know before typing:
                    whether it can carry the plan. Only the card can. */}
                <DialogDescription>
                  {t(adding === 'card' ? 'addLeadCard' : 'addLeadOneOff')}
                </DialogDescription>
              </DialogHeader>

              <PaymentMethodFields
                kind={adding}
                draft={draft}
                onChange={setDraft}
                namePlaceholder={me ? `${me.firstName} ${me.lastName}` : undefined}
              />

              <DialogFooter>
                <Button variant="ghost" onClick={() => setAdding(null)}>
                  {formT('cancel')}
                </Button>
                <Button onClick={save} disabled={!methodDraftReady(adding, draft)}>
                  {formT('save')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
