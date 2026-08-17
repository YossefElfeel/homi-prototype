'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreditCard, Info, Plus, Smartphone, Trash2 } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';
import type { PaymentMethod } from '@/mock/schema';

const ADDABLE = [
  { kind: 'card', key: 'card', icon: CreditCard },
  { kind: 'twint', key: 'twint', icon: Smartphone },
  { kind: 'apple-pay', key: 'applePay', icon: Smartphone },
  { kind: 'google-pay', key: 'googlePay', icon: Smartphone },
] as const satisfies readonly { kind: PaymentMethod; key: string; icon: typeof CreditCard }[];

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
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('title')} lead={t('lead')} />

      <Card pad="none">
        <h2 className="label-type px-card pt-card text-ink-tertiary">
          {t('savedTitle')}
        </h2>
        {methods.length === 0 ? (
          <p className="px-card pt-2 pb-card text-sm text-ink-tertiary">
            {t('savedNone')}
          </p>
        ) : (
          <ul className="mt-3">
            {methods.map((method) => (
              <li
                key={method.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line-subtle px-card py-row"
              >
                <span className="flex items-center gap-3">
                  {method.kind === 'card' ? (
                    <CreditCard className="size-4 text-ink-tertiary" aria-hidden />
                  ) : (
                    <Smartphone className="size-4 text-ink-tertiary" aria-hidden />
                  )}
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
            ))}
          </ul>
        )}
      </Card>

      <section className="mt-app-section">
        <h2 className="label-type text-ink-tertiary">{t('addTitle')}</h2>
        <div className="gap-app mt-3 grid sm:grid-cols-2">
          {ADDABLE.map(({ kind, key, icon: Icon }) => (
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
          ))}
        </div>
      </section>

      <section className="mt-app-section border-t border-line-subtle pt-8">
        <h2 className="display-type text-xl">{t('recurringTitle')}</h2>
        <p className="mt-3 flex items-center gap-3">
          <CreditCard className="size-4 text-ink-tertiary" aria-hidden />
          <span data-numeric>{forPlan ? forPlan.label : '—'}</span>
        </p>
        <Alert tone="neutral" icon={Info} className="mt-5" title={t('twintBlockedTitle')}>
          {t('twintBlockedBody')}
        </Alert>
      </section>

      <p className="mt-8 text-sm text-ink-tertiary">{t('demoNote')}</p>
    </div>
  );
}
