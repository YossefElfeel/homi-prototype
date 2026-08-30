'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreditCard, Info, Plus, Trash2 } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
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
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';
import {
  METHOD_ICONS,
  SAVABLE_METHODS,
  blankDraft,
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
 * TWINT is offered for one-off jobs and blocked for the plan, with the reason
 * stated where the choice is made. §11.2 needs a recurring charge and TWINT
 * has no mandate for one; letting a customer pick it and failing at the first
 * charge would be the worst possible place to discover that.
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
  const addPaymentMethod = useStore((s) => s.addPaymentMethod);
  const removePaymentMethod = useStore((s) => s.removePaymentMethod);
  const setDefaultPaymentMethod = useStore((s) => s.setDefaultPaymentMethod);

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
  const forPlan = methods.find((m) => m.kind === 'card');
  const me = customers.find((c) => c.id === customerId);

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
                      removePaymentMethod(method.id);
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
              <button
                key={kind}
                type="button"
                onClick={() => open(kind)}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-card px-4 py-3 text-start transition-[box-shadow,border-color] hover:border-line-focus hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
                )}
              >
                <Icon className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
                <span className="flex-1">{t(key)}</span>
                <Plus className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
              </button>
            );
          })}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t('recurringTitle')} />
        <CardBody className="flex items-center gap-3">
          <CreditCard className="size-4 text-ink-tertiary" aria-hidden />
          <span data-numeric>{forPlan ? forPlan.label : '—'}</span>
        </CardBody>
        <CardBody>
          <Alert tone="neutral" icon={Info} title={t('twintBlockedTitle')}>
            {t('twintBlockedBody')}
          </Alert>
        </CardBody>
      </Card>
      </div>

      <p className="mt-app-section text-sm text-ink-tertiary">{t('demoNote')}</p>

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
