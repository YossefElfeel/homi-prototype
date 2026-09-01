'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { ConfirmDialog, useConfirmTarget, useDismissLabel } from '@/components/ui/confirm-dialog';
import { Field, Select } from '@/components/ui/field';
import { formatChf } from '@/components/ui/money';
import { EXPENSE_METHODS } from '@/lib/payment-methods';
import type { Locale } from '@/i18n/routing';
import type { Expense, PaymentMethod } from '@/mock/schema';

/**
 * Settling a cost, asked the same way wherever it is asked.
 *
 * It was one dialog on one screen until the workforce board arrived, and a
 * board where hours can be seen to be unpaid and not paid off is a screen that
 * sends the reader to another list to press a button. Copying the dialog
 * across was the other option and the wrong one: the route is required here
 * for a reason — «bezahlt» with nothing saying how is the half of the fact
 * nobody can look up afterwards — and two copies of that rule is one copy that
 * eventually loses it.
 *
 * The route lives in this hook rather than in each screen so that opening the
 * dialog on a second row cannot inherit the first row's answer.
 */
export function useExpensePayment() {
  const held = useConfirmTarget<Expense>();
  const [method, setMethod] = useState<PaymentMethod>('qr-bill');

  return {
    /* `useConfirmTarget` rather than plain state, for the reason the invoice
       list gives: Radix keeps the box mounted through its exit, and clearing
       the row on the dismissing click blanks the sentence naming the receipt
       while it fades. */
    target: held.target,
    open: held.open,
    dismiss: held.dismiss,
    method,
    setMethod,
    ask(expense: Expense) {
      setMethod('qr-bill');
      held.ask(expense);
    },
  };
}

export type ExpensePayment = ReturnType<typeof useExpensePayment>;

export function ExpensePaidDialog({
  payment,
  /** Called with the row and the route. The caller writes and says so. */
  onConfirm,
}: {
  payment: ExpensePayment;
  onConfirm: (expense: Expense, method: PaymentMethod) => void;
}) {
  const t = useTranslations('admin.expenses');
  const methodT = useTranslations('status.method');
  const dismissLabel = useDismissLabel();
  const locale = useLocale() as Locale;

  return (
    <ConfirmDialog
      open={payment.open}
      onOpenChange={(open) => !open && payment.dismiss()}
      tone="default"
      title={t('paidTitle')}
      body={
        payment.target
          ? t('paidBody', {
              reference: payment.target.reference,
              supplier: payment.target.supplier,
              amount: formatChf(payment.target.amount, locale),
            })
          : ''
      }
      action={t('paidAction')}
      dismiss={dismissLabel}
      onConfirm={() => {
        const expense = payment.target;
        if (!expense) return;
        payment.dismiss();
        onConfirm(expense, payment.method);
      }}
    >
      <Field label={t('paidMethod')}>
        {(props) => (
          <Select
            {...props}
            value={payment.method}
            onChange={(e) => payment.setMethod(e.target.value as PaymentMethod)}
          >
            {EXPENSE_METHODS.map((m) => (
              <option key={m} value={m}>
                {methodT(m)}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </ConfirmDialog>
  );
}
