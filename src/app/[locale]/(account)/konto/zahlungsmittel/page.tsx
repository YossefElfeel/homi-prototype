'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreditCard, Info, Plus, Trash2 } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';
import { METHOD_ICONS, SAVABLE_METHODS } from '@/lib/payment-methods';
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
 */
export default function AccountPaymentPage() {
  const t = useTranslations('account.payment');
  const hydrated = useHydrated();
  const now = useNow();

  /*
   * These lived in `useState`, seeded with two hard-coded cards. Adding a
   * method, removing one, or changing the default all worked convincingly and
   * were discarded on the next navigation — on the one screen whose entire
   * subject is what has been saved.
   */
  const customerId = useStore((s) => s.demo.currentCustomerId);
  const allMethods = useStore((s) => s.data.paymentMethods);
  const addPaymentMethod = useStore((s) => s.addPaymentMethod);
  const removePaymentMethod = useStore((s) => s.removePaymentMethod);
  const setDefaultPaymentMethod = useStore((s) => s.setDefaultPaymentMethod);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const methods = allMethods.filter((m) => m.customerId === customerId);
  const forPlan = methods.find((m) => m.kind === 'card');

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
                <span className="flex items-center gap-3">
                  <Icon className="size-4 text-ink-tertiary" aria-hidden />
                  <span data-numeric>{method.label}</span>
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
        <CardHeader title={t('addTitle')} />
        <CardBody className="gap-app grid sm:grid-cols-2">
          {SAVABLE_METHODS.map((kind) => {
            const Icon = METHOD_ICONS[kind];
            const key = LABEL_KEY[kind];
            return (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  addPaymentMethod({ customerId, kind, label: t(key) }, now);
                  toast.success(t('added'));
                }}
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
    </div>
  );
}
