'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { SwitchField } from '@/components/ui/switch';
import { FinanceTabs } from '@/components/admin/finance-tabs';
import { EXPENSE_CATEGORIES, effectiveExpenseStatus } from '@/lib/expense-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Expense, ExpenseCategory } from '@/mock/schema';

/**
 * Everything the form may change.
 *
 * `status`, `paidAt` and `method` are not in it, and that is the one decision
 * worth stating: settling a cost is its own act with its own dialog, on the
 * list, where the payment route is asked for. A `<Select>` here that could flip
 * a receipt to «bezahlt» while the reader was correcting a typo in the supplier
 * name would be the same class of bug the coupon form was rewritten to remove.
 */
type Draft = Pick<
  Expense,
  'category' | 'supplier' | 'note' | 'amount' | 'incurredAt' | 'dueAt' | 'bookingId' | 'recurring'
>;

function draftOf(expense: Expense): Draft {
  return {
    category: expense.category,
    supplier: expense.supplier,
    note: expense.note,
    amount: expense.amount,
    incurredAt: expense.incurredAt,
    dueAt: expense.dueAt,
    bookingId: expense.bookingId,
    recurring: expense.recurring,
  };
}

function blankExpense(now: Date): Expense {
  return {
    id: 'neu',
    reference: '',
    category: 'supplies',
    supplier: '',
    amount: 0,
    /* Today, because a receipt is normally typed in on the day it arrives —
       and because an empty date field on a form whose whole subject is which
       month a cost lands in is a blank the reader has to think about first. */
    incurredAt: now.toISOString(),
    status: 'open',
  };
}

/**
 * Screen 71d — recording or correcting a cost.
 *
 * `/admin/ausgaben/neu` opens the same form empty, which is the shape screen 77
 * already uses and for the reason written there: a separate "new" screen drifts
 * from the edit screen inside a month.
 *
 * It stages a draft and writes on the button — never on the keystroke. That is
 * not a style choice: this screen edits live figures that a profit line on the
 * next tab is computed from, so half a typed amount reaching the store means
 * the analytics are briefly wrong for a month the reader may be looking at.
 * The coupon form's own note records what that cost when it was the other way
 * round.
 */
export default function ExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.expense');
  const hydrated = useHydrated();
  const now = useNow();

  const expense = useStore((s) => s.data.expenses.find((e) => e.id === id));

  /* A component boundary rather than an early return, for the reason screen 77
     gives: the store is persisted, so the first render is the seed and the
     stored record lands a tick later. Seeding `useState` up here would open the
     form on the seed copy and then save it back over the edit. */
  if (!hydrated) return <SkeletonPage label={t('back')} />;

  if (id === 'neu') return <ExpenseEditor expense={blankExpense(now)} isNew />;

  if (!expense) {
    return (
      <div>
        <PageHeader
          title={t('notFoundTitle')}
          back={{ href: '/admin/ausgaben', label: t('back') }}
        />
        <EmptyState
          icon={Wallet}
          headingLevel={2}
          title={t('notFoundTitle')}
          body={t('notFoundBody')}
          action={
            <Button asChild>
              <Link href="/admin/ausgaben">{t('back')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <ExpenseEditor key={expense.id} expense={expense} />;
}

function ExpenseEditor({ expense, isNew = false }: { expense: Expense; isNew?: boolean }) {
  const t = useTranslations('admin.expense');
  const listT = useTranslations('admin.expenses');
  const methodT = useTranslations('status.method');
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();

  const bookings = useStore((s) => s.data.bookings);
  const properties = useStore((s) => s.data.properties);
  const createExpense = useStore((s) => s.createExpense);
  const updateExpense = useStore((s) => s.updateExpense);

  const [form, setForm] = useState<Draft>(() => draftOf(expense));
  const [touched, setTouched] = useState(false);

  const stored = draftOf(expense);
  const dirty =
    form.category !== stored.category ||
    form.supplier !== stored.supplier ||
    (form.note ?? '') !== (stored.note ?? '') ||
    form.amount !== stored.amount ||
    form.incurredAt !== stored.incurredAt ||
    (form.dueAt ?? '') !== (stored.dueAt ?? '') ||
    (form.bookingId ?? '') !== (stored.bookingId ?? '') ||
    Boolean(form.recurring) !== Boolean(stored.recurring);

  const supplier = form.supplier.trim();
  const supplierError = supplier === '' ? t('errorSupplier') : undefined;
  const amountError = form.amount > 0 ? undefined : t('errorAmount');
  /* A deadline before the cost arose is a date somebody mistyped — a supplier
     cannot ask to be paid before they billed. Caught here rather than left to
     make «überfällig» true from the moment the receipt is saved. */
  const dueError =
    form.dueAt && form.dueAt.slice(0, 10) < form.incurredAt.slice(0, 10)
      ? t('errorDueBeforeIncurred')
      : undefined;

  const valid = !supplierError && !amountError && !dueError;
  const show = (error?: string) => (touched ? error : undefined);

  function patch(next: Partial<Draft>) {
    setForm({ ...form, ...next });
  }

  function save() {
    setTouched(true);
    if (!valid) return;

    if (isNew) {
      const id = createExpense(
        {
          category: form.category,
          supplier,
          note: form.note,
          amount: form.amount,
          incurredAt: form.incurredAt,
          dueAt: form.dueAt,
          bookingId: form.bookingId,
          recurring: form.recurring,
        },
        now,
      );
      /* The store re-checks rather than trusting the button — the same two
         rules, in the one place a second tab cannot get round. `null` means it
         refused, and there is nothing to navigate to. */
      if (!id) return;
      const created = useStore.getState().data.expenses.find((e) => e.id === id);
      toast.success(t('created', { reference: created?.reference ?? '' }));
    } else {
      updateExpense(expense.id, { ...form, supplier });
      toast.success(t('saved', { reference: expense.reference }));
    }

    router.push('/admin/ausgaben');
  }

  const state = effectiveExpenseStatus(expense, now);
  const overdueDays = expense.dueAt
    ? Math.ceil((now.getTime() - new Date(expense.dueAt).getTime()) / 86_400_000)
    : 0;

  /* Finished jobs only. Attributing a cost to a visit that has not happened is
     a claim about money spent on work nobody has done, and the list would be
     every booking in the calendar rather than the handful this could be about. */
  const billable = bookings
    .filter((b) => b.status !== 'scheduled' && b.status !== 'rescheduled' && b.status !== 'cancelled')
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, 40);

  return (
    <div>
      <PageHeader
        title={isNew ? t('newTitle') : expense.supplier}
        back={{ href: '/admin/ausgaben', label: t('back') }}
        /* The badge reads the *stored* record, not the draft: it says what is
           true right now, and changing a due date in the form has not made
           anything true yet. */
        meta={isNew ? undefined : <StatusBadge entity="expense" state={state} />}
        lead={
          isNew
            ? t('newLead')
            : expense.status === 'paid' && expense.paidAt
              ? t('statusPaid', {
                  date: format.dateTime(new Date(expense.paidAt), 'short'),
                  method: expense.method ? methodT(expense.method) : '—',
                })
              : state === 'overdue'
                ? t('statusOverdue', { days: overdueDays })
                : t('statusOpen')
        }
      />

      <FinanceTabs />

      <div className="space-y-app-section">
        <Card>
          <CardHeader title={t('sectionWhatTitle')} />
          <CardBody className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t('supplierLabel')}
                hint={t('supplierHint')}
                error={show(supplierError)}
              >
                {(props) => (
                  <Input
                    {...props}
                    value={form.supplier}
                    onChange={(e) => patch({ supplier: e.target.value })}
                  />
                )}
              </Field>
              <Field label={t('categoryLabel')}>
                {(props) => (
                  <Select
                    {...props}
                    value={form.category}
                    onChange={(e) => patch({ category: e.target.value as ExpenseCategory })}
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {listT(`categories.${c}`)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <Field label={t('noteLabel')} hint={t('noteHint')} optional>
              {(props) => (
                <Textarea
                  {...props}
                  className="min-h-20"
                  value={form.note ?? ''}
                  onChange={(e) => patch({ note: e.target.value || undefined })}
                />
              )}
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('sectionMoneyTitle')} />
          <CardBody className="grid gap-5 sm:grid-cols-3">
            <Field label={t('amountLabel')} hint={t('amountHint')} error={show(amountError)}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.05}
                  value={form.amount || ''}
                  onChange={(e) => patch({ amount: Number(e.target.value) })}
                />
              )}
            </Field>
            <Field label={t('incurredLabel')} hint={t('incurredHint')}>
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={form.incurredAt.slice(0, 10)}
                  onChange={(e) =>
                    patch({
                      incurredAt: e.target.value
                        ? new Date(`${e.target.value}T10:00:00`).toISOString()
                        : form.incurredAt,
                    })
                  }
                />
              )}
            </Field>
            <Field
              label={t('dueLabel')}
              hint={t('dueHint')}
              error={show(dueError)}
              optional
            >
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={form.dueAt?.slice(0, 10) ?? ''}
                  onChange={(e) =>
                    patch({
                      dueAt: e.target.value
                        ? new Date(`${e.target.value}T10:00:00`).toISOString()
                        : undefined,
                    })
                  }
                />
              )}
            </Field>

            <div className="sm:col-span-3">
              <SwitchField
                label={t('recurringLabel')}
                hint={t('recurringHint')}
                checked={Boolean(form.recurring)}
                onCheckedChange={(v) => patch({ recurring: v || undefined })}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('sectionJobTitle')} description={t('bookingHint')} />
          <CardBody>
            <Field label={t('bookingLabel')} optional>
              {(props) => (
                <Select
                  {...props}
                  value={form.bookingId ?? ''}
                  onChange={(e) => patch({ bookingId: e.target.value || undefined })}
                >
                  <option value="">{t('bookingNone')}</option>
                  {billable.map((b) => {
                    const property = properties.find((p) => p.id === b.propertyId);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.reference} · {property?.street ?? '—'} ·{' '}
                        {format.dateTime(new Date(b.start), 'short')}
                      </option>
                    );
                  })}
                </Select>
              )}
            </Field>
          </CardBody>
        </Card>
      </div>

      {/* Always present and disabled until there is something to save — the
          same row screen 77 carries, for the same reason: a form that saves on
          a button it does not show until you have typed makes the reader find
          that out by typing. */}
      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line-subtle pt-6">
        <Button size="lg" onClick={save} disabled={!isNew && !dirty}>
          {isNew ? t('create') : t('save')}
        </Button>
        {isNew ? (
          <Button asChild variant="ghost" size="lg">
            <Link href="/admin/ausgaben">{t('cancel')}</Link>
          </Button>
        ) : (
          dirty && (
            <Button variant="ghost" size="lg" onClick={() => setForm(draftOf(expense))}>
              {t('discard')}
            </Button>
          )
        )}
        {!isNew && dirty && (
          <p className="max-w-[var(--measure)] text-sm text-ink-tertiary">{t('unsaved')}</p>
        )}
      </div>
    </div>
  );
}
