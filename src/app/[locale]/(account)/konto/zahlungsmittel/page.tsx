'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, Info, Plus, Smartphone, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useHydrated } from '@/mock/store';
import { cn } from '@/lib/cn';
import type { PaymentMethod } from '@/mock/schema';

interface SavedMethod {
  id: string;
  kind: PaymentMethod;
  label: string;
  isDefault: boolean;
}

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

  const [methods, setMethods] = useState<SavedMethod[]>([
    { id: 'pm_1', kind: 'card', label: 'Visa · 4242', isDefault: true },
    { id: 'pm_2', kind: 'twint', label: 'TWINT · 079 …', isDefault: false },
  ]);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const forPlan = methods.find((m) => m.kind === 'card');

  return (
    <div className="max-w-3xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      <section className="mt-8">
        <h2 className="label-type text-ink-tertiary">{t('savedTitle')}</h2>
        {methods.length === 0 ? (
          <p className="mt-3 text-sm text-ink-tertiary">{t('savedNone')}</p>
        ) : (
          <ul className="mt-3 border-t border-line-subtle">
            {methods.map((method) => (
              <li
                key={method.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line-subtle py-3"
              >
                <span className="flex items-center gap-3">
                  {method.kind === 'card' ? (
                    <CreditCard className="size-4 text-ink-tertiary" aria-hidden />
                  ) : (
                    <Smartphone className="size-4 text-ink-tertiary" aria-hidden />
                  )}
                  <span data-numeric>{method.label}</span>
                  {method.isDefault && (
                    <span className="rounded-sm border border-status-neutral-line bg-status-neutral px-1.5 py-0.5 text-xs text-status-neutral-fg">
                      {t('defaultLabel')}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  {!method.isDefault && (
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() =>
                        setMethods(
                          methods.map((m) => ({ ...m, isDefault: m.id === method.id })),
                        )
                      }
                    >
                      {t('makeDefault')}
                    </Button>
                  )}
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => setMethods(methods.filter((m) => m.id !== method.id))}
                  >
                    <Trash2 className="size-4" aria-hidden />
                    <span className="sr-only">{t('remove')}</span>
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="label-type text-ink-tertiary">{t('addTitle')}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {ADDABLE.map(({ kind, key, icon: Icon }) => (
            <button
              key={kind}
              type="button"
              onClick={() =>
                setMethods([
                  ...methods,
                  {
                    id: `pm_${methods.length + 1}`,
                    kind,
                    label: t(key),
                    isDefault: methods.length === 0,
                  },
                ])
              }
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] border border-line px-4 py-3 text-start transition-colors hover:bg-sunken',
              )}
            >
              <Icon className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
              <span className="flex-1">{t(key)}</span>
              <Plus className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10 border-t border-line-subtle pt-8">
        <h2 className="display-type text-xl">{t('recurringTitle')}</h2>
        <p className="mt-3 flex items-center gap-3">
          <CreditCard className="size-4 text-ink-tertiary" aria-hidden />
          <span data-numeric>{forPlan ? forPlan.label : '—'}</span>
        </p>
        <div className="mt-5 flex gap-3 border-l-2 border-rule bg-sunken p-5">
          <Info className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
          <div>
            <h3 className="font-medium">{t('twintBlockedTitle')}</h3>
            <p className="mt-1 max-w-[var(--measure)] text-sm text-ink-secondary">
              {t('twintBlockedBody')}
            </p>
          </div>
        </div>
      </section>

      <p className="mt-8 text-sm text-ink-tertiary">{t('demoNote')}</p>
    </div>
  );
}
