'use client';

import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { Users, Wallet } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { formatChf } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { SwitchField } from '@/components/ui/switch';
import { EXPENSE_CATEGORIES, effectiveExpenseStatus } from '@/lib/expense-facts';
import { isCompleteLabour, memberName, suggestedHours } from '@/lib/labour-facts';
import type { Locale } from '@/i18n/routing';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Booking, Expense, ExpenseCategory, LabourEntry, TeamMember } from '@/mock/schema';

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
  | 'category'
  | 'supplier'
  | 'note'
  | 'amount'
  | 'incurredAt'
  | 'dueAt'
  | 'bookingId'
  | 'recurring'
  | 'labour'
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
    labour: expense.labour,
  };
}

/**
 * The crew a labour cost opens with.
 *
 * The worker is deliberately blank: it is the fact the whole record is about,
 * and a select that arrives pre-filled with whoever happens to be first in the
 * roster is a name somebody will save without reading. The payer and the
 * responsible do start on the owner, because that is the true answer nine
 * times out of ten and the tenth is a change of one select rather than a
 * question asked three times a day.
 */
function blankLabour(ownerId: string): LabourEntry {
  return { workerId: '', paidById: ownerId, responsibleId: ownerId, hours: 0 };
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
 * Finished jobs only. Attributing a cost to a visit that has not happened is a
 * claim about money spent on work nobody has done, and the list would be every
 * booking in the calendar rather than the handful this could be about.
 *
 * A job the office could not get into is on the list on purpose: somebody
 * drove there and waited, and those hours were worked whether or not the door
 * opened.
 */
function billableJobs(bookings: Booking[]): Booking[] {
  return bookings.filter(
    (b) => b.status !== 'scheduled' && b.status !== 'rescheduled' && b.status !== 'cancelled',
  );
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

  const expense = useStore((s) => s.data.expenses.find((e) => e.id === id));

  /* A component boundary rather than an early return, for the reason screen 77
     gives: the store is persisted, so the first render is the seed and the
     stored record lands a tick later. Seeding `useState` up here would open the
     form on the seed copy and then save it back over the edit. */
  if (!hydrated) return <SkeletonPage label={t('back')} />;

  if (id === 'neu') return <NewExpense />;

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

/**
 * The empty form, and what the screen it was opened from already knows.
 *
 * `?einsatz=bkg_…` opens it on a job and on the labour category. Without it,
 * «Arbeitszeit erfassen» on a booking would drop the reader into a blank form
 * and ask them to find, in a select of forty, the job they were looking at a
 * second ago — which is how a cost ends up on the wrong one.
 */
function NewExpense() {
  const now = useNow();
  const search = useSearchParams();
  const team = useStore((s) => s.data.team);
  const bookings = useStore((s) => s.data.bookings);

  const [seed] = useState<Expense>(() => {
    const blank = blankExpense(now);
    const bookingId = search.get('einsatz') ?? undefined;
    const job = bookingId ? billableJobs(bookings).find((b) => b.id === bookingId) : undefined;
    /* The job implies the category; the board's own button says it outright and
       leaves the job to be picked. Neither is a claim the form cannot undo —
       the category select is the first control on the screen. */
    if (!job && search.get('kategorie') !== 'arbeitszeit') return blank;

    const owner = team.find((m) => m.role === 'owner') ?? team[0];
    return {
      ...blank,
      category: 'labour',
      bookingId: job?.id,
      /* What the job already knows. Offered, not imposed — the hours field is
         editable and says where the figure came from. Was the check-in/
         check-out span; it is the hours the person *reported* where there are
         any, which is a figure two people have looked at rather than the
         distance between two stamps. */
      labour: { ...blankLabour(owner?.id ?? ''), hours: suggestedHours(job)?.hours ?? 0 },
    };
  });

  return <ExpenseEditor expense={seed} isNew />;
}

function ExpenseEditor({ expense, isNew = false }: { expense: Expense; isNew?: boolean }) {
  const t = useTranslations('admin.expense');
  const listT = useTranslations('admin.expenses');
  const methodT = useTranslations('status.method');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const now = useNow();

  const bookings = useStore((s) => s.data.bookings);
  const properties = useStore((s) => s.data.properties);
  const team = useStore((s) => s.data.team);
  const createExpense = useStore((s) => s.createExpense);
  const updateExpense = useStore((s) => s.updateExpense);

  const [form, setForm] = useState<Draft>(() => draftOf(expense));
  const [touched, setTouched] = useState(false);

  const owner = team.find((m) => m.role === 'owner') ?? team[0];
  const isLabour = form.category === 'labour';

  const stored = draftOf(expense);
  const dirty =
    form.category !== stored.category ||
    form.supplier !== stored.supplier ||
    (form.note ?? '') !== (stored.note ?? '') ||
    form.amount !== stored.amount ||
    form.incurredAt !== stored.incurredAt ||
    (form.dueAt ?? '') !== (stored.dueAt ?? '') ||
    (form.bookingId ?? '') !== (stored.bookingId ?? '') ||
    Boolean(form.recurring) !== Boolean(stored.recurring) ||
    /* Compared as a whole rather than field by field: the four move together,
       and a `dirty` that missed one of them would grey out the save button
       over an edit that had really been made. */
    JSON.stringify(form.labour ?? null) !== JSON.stringify(stored.labour ?? null);

  const supplier = form.supplier.trim();
  /* Not asked for on a labour row — the worker's name is the supplier, and the
     store writes it. Validating a field the reader cannot see would be a form
     that refuses to save and does not say where. */
  const supplierError = !isLabour && supplier === '' ? t('errorSupplier') : undefined;
  const amountError = form.amount > 0 ? undefined : t('errorAmount');
  /* A deadline before the cost arose is a date somebody mistyped — a supplier
     cannot ask to be paid before they billed. Caught here rather than left to
     make «überfällig» true from the moment the receipt is saved. */
  const dueError =
    form.dueAt && form.dueAt.slice(0, 10) < form.incurredAt.slice(0, 10)
      ? t('errorDueBeforeIncurred')
      : undefined;

  const workerError = isLabour && !form.labour?.workerId ? t('errorWorker') : undefined;
  const hoursError = isLabour && !((form.labour?.hours ?? 0) > 0) ? t('errorHours') : undefined;
  const bookingError = isLabour && !form.bookingId ? t('errorBooking') : undefined;
  const paidByError = isLabour && !form.labour?.paidById ? t('errorPaidBy') : undefined;
  const responsibleError =
    isLabour && !form.labour?.responsibleId ? t('errorResponsible') : undefined;

  const valid =
    !supplierError &&
    !amountError &&
    !dueError &&
    !workerError &&
    !hoursError &&
    !bookingError &&
    !paidByError &&
    !responsibleError;
  const show = (error?: string) => (touched ? error : undefined);

  function patch(next: Partial<Draft>) {
    setForm({ ...form, ...next });
  }

  function patchLabour(next: Partial<LabourEntry>) {
    setForm({
      ...form,
      labour: { ...(form.labour ?? blankLabour(owner?.id ?? '')), ...next },
    });
  }

  /**
   * Switching category, and the two fields that leave with it.
   *
   * A cost that stops being labour drops its crew, and one that becomes labour
   * drops «läuft jeden Monat» — hours on one job do not recur, and a flag left
   * set behind a control the reader can no longer see would count that job in
   * the fixed-cost tile every month for ever. The store enforces the first half
   * again on write; this is so the form is honest about what it is holding.
   */
  function pickCategory(category: ExpenseCategory) {
    if (category === 'labour') {
      patch({
        category,
        recurring: undefined,
        labour: form.labour ?? blankLabour(owner?.id ?? ''),
      });
      return;
    }
    patch({ category, labour: undefined });
  }

  function save() {
    setTouched(true);
    if (!valid) return;

    /* The worker's name goes in as the supplier so a labour row reads the same
       as every other row in the list and the export. The store derives it
       again from the id — this is the copy the reader sees, that one is the
       copy that cannot go stale in a second tab. */
    const worker = form.labour && team.find((m) => m.id === form.labour!.workerId);
    const supplierValue = isLabour ? memberName(worker ?? undefined) : supplier;

    if (isNew) {
      const id = createExpense(
        {
          category: form.category,
          supplier: supplierValue,
          note: form.note,
          amount: form.amount,
          incurredAt: form.incurredAt,
          dueAt: form.dueAt,
          bookingId: form.bookingId,
          recurring: form.recurring,
          labour: isLabour && isCompleteLabour(form.labour, form.bookingId) ? form.labour : undefined,
        },
        now,
      );
      /* The store re-checks rather than trusting the button — the same rules,
         in the one place a second tab cannot get round. `null` means it
         refused, and there is nothing to navigate to. */
      if (!id) return;
      const created = useStore.getState().data.expenses.find((e) => e.id === id);
      toast.success(t('created', { reference: created?.reference ?? '' }));
    } else {
      updateExpense(expense.id, { ...form, supplier: supplierValue });
      toast.success(t('saved', { reference: expense.reference }));
    }

    router.push('/admin/ausgaben');
  }

  const state = effectiveExpenseStatus(expense, now);
  const overdueDays = expense.dueAt
    ? Math.ceil((now.getTime() - new Date(expense.dueAt).getTime()) / 86_400_000)
    : 0;

  const jobs = billableJobs(bookings).sort((a, b) => b.start.localeCompare(a.start));
  /*
   * Forty of them, plus whichever one this record already points at.
   *
   * The cap keeps a select on a phone from being a thousand rows. Without the
   * second half it also silently dropped the job off any cost older than the
   * last forty — the select fell back to «keinem Einsatz zugeordnet» and saving
   * a corrected amount would have quietly detached the attribution.
   */
  const billable = [
    ...jobs.slice(0, 40),
    ...jobs.slice(40).filter((b) => b.id === form.bookingId),
  ];

  const selectedJob = bookings.find((b) => b.id === form.bookingId);
  const suggestion = suggestedHours(selectedJob);

  /**
   * Who the three selects offer.
   *
   * Active people, plus anyone this record already names. An inactive
   * contractor still worked the hours that are on a cost from March, and a
   * select that dropped them would rewrite the record to somebody else the
   * next time an amount was corrected.
   */
  function people(current: string | undefined): TeamMember[] {
    return team.filter((m) => m.active || m.id === current);
  }

  const memberOption = (m: TeamMember) =>
    m.active ? memberName(m) : t('inactiveMember', { name: memberName(m) });

  const workedHours = form.labour?.hours ?? 0;
  const rate = form.amount > 0 && workedHours > 0 ? form.amount / workedHours : null;

  const jobLabel = (b: Booking) => {
    const property = properties.find((p) => p.id === b.propertyId);
    return `${b.reference} · ${property?.street ?? '—'} · ${format.dateTime(new Date(b.start), 'short')}`;
  };

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

      <div className="space-y-app-section">
        <Card>
          <CardHeader title={t('sectionWhatTitle')} />
          <CardBody className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* The supplier is the worker on a labour row, so the box is
                  gone rather than disabled with the name typed into it — a
                  read-only field that repeats a select two cards down is a
                  second place for the same fact to be wrong. */}
              {!isLabour && (
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
              )}
              <Field
                label={t('categoryLabel')}
                hint={isLabour ? t('categoryHintLabour') : undefined}
              >
                {(props) => (
                  <Select
                    {...props}
                    value={form.category}
                    onChange={(e) => pickCategory(e.target.value as ExpenseCategory)}
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

        {/*
          The people card, and it only exists on a labour cost.

          Above the money rather than below it, because the amount on this kind
          of row is read against the hours — «CHF 208» means nothing until the
          6.5 above it is on the screen.
        */}
        {isLabour && (
          <Card>
            <CardHeader title={t('sectionLabourTitle')} description={t('sectionLabourLead')} />
            <CardBody className="space-y-5">
              {team.length === 0 ? (
                /* Nobody to book against. Said out loud rather than left as a
                   select with one blank option in it — a form that cannot be
                   completed has to say which half is missing. */
                <EmptyState
                  icon={Users}
                  compact
                  headingLevel={3}
                  title={t('noTeamTitle')}
                  body={t('noTeamBody')}
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label={t('workerLabel')}
                    hint={t('workerHint')}
                    error={show(workerError)}
                  >
                    {(props) => (
                      <Select
                        {...props}
                        value={form.labour?.workerId ?? ''}
                        onChange={(e) => patchLabour({ workerId: e.target.value })}
                      >
                        <option value="">{t('workerNone')}</option>
                        {people(form.labour?.workerId).map((m) => (
                          <option key={m.id} value={m.id}>
                            {memberOption(m)}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>

                  <div className="grid content-start gap-1.5">
                    <Field
                      label={t('hoursLabel')}
                      hint={t('hoursHint')}
                      error={show(hoursError)}
                    >
                      {(props) => (
                        <Input
                          {...props}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step={0.25}
                          value={form.labour?.hours || ''}
                          onChange={(e) => patchLabour({ hours: Number(e.target.value) })}
                        />
                      )}
                    </Field>
                    {/* What the job itself recorded, offered as a button
                        rather than written in. Somebody who forgets to check
                        out would otherwise book an eleven-hour day, and the
                        person entering the cost is the one who knows.

                        Two sentences, not one with a number swapped in: the
                        hours the cleaner reported and the span between two
                        stamps are different claims, and «Check-in bis
                        Check-out» said over a reported figure would be a lie
                        about where it came from. */}
                    {suggestion !== null && suggestion.hours !== form.labour?.hours && (
                      <p className="text-sm text-ink-tertiary">
                        {suggestion.source === 'reported'
                          ? t('hoursReported', { hours: suggestion.hours })
                          : t('hoursOnSite', { hours: suggestion.hours })}{' '}
                        <button
                          type="button"
                          className="font-medium text-ink-accent underline-offset-4 hover:underline"
                          onClick={() => patchLabour({ hours: suggestion.hours })}
                        >
                          {t('hoursUse')}
                        </button>
                      </p>
                    )}
                  </div>

                  <Field
                    label={t('paidByLabel')}
                    hint={t('paidByHint')}
                    error={show(paidByError)}
                  >
                    {(props) => (
                      <Select
                        {...props}
                        value={form.labour?.paidById ?? ''}
                        onChange={(e) => patchLabour({ paidById: e.target.value })}
                      >
                        {people(form.labour?.paidById).map((m) => (
                          <option key={m.id} value={m.id}>
                            {memberOption(m)}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>

                  <Field
                    label={t('responsibleLabel')}
                    hint={t('responsibleHint')}
                    error={show(responsibleError)}
                  >
                    {(props) => (
                      <Select
                        {...props}
                        value={form.labour?.responsibleId ?? ''}
                        onChange={(e) => patchLabour({ responsibleId: e.target.value })}
                      >
                        {people(form.labour?.responsibleId).map((m) => (
                          <option key={m.id} value={m.id}>
                            {memberOption(m)}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title={t('sectionMoneyTitle')} />
          <CardBody className="grid gap-5 sm:grid-cols-3">
            <div className="grid content-start gap-1.5">
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
              {/* The number the two fields actually make. Nobody types a rate
                  here and no rate card exists — this is the division, shown
                  because CHF 208 for a shift is unreadable until it is CHF 32
                  an hour. */}
              {isLabour && (
                <p className="text-sm text-ink-tertiary">
                  {rate === null
                    ? t('rateHintNone')
                    : /* `formatChf` rather than `<Money>`, the way every
                         confirm dialog in the panel writes a figure into a
                         sentence: the unit is the sentence's own last three
                         words, and a component cannot be interpolated into an
                         ICU message. */
                      t('rateHint', { rate: formatChf(rate, locale) })}
                </p>
              )}
            </div>
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

            {/* Hours on one job do not run every month, so the switch is not
                offered on a labour cost — see `pickCategory` for what happens
                to a flag that was already set. */}
            {!isLabour && (
              <div className="sm:col-span-3">
                <SwitchField
                  label={t('recurringLabel')}
                  hint={t('recurringHint')}
                  checked={Boolean(form.recurring)}
                  onCheckedChange={(v) => patch({ recurring: v || undefined })}
                />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t('sectionJobTitle')}
            description={isLabour ? t('bookingHintLabour') : t('bookingHint')}
          />
          <CardBody>
            {isLabour && billable.length === 0 ? (
              <EmptyState
                icon={Wallet}
                compact
                headingLevel={3}
                title={t('noJobTitle')}
                body={t('noJobBody')}
              />
            ) : (
              <Field
                label={t('bookingLabel')}
                error={show(bookingError)}
                optional={!isLabour}
              >
                {(props) => (
                  <Select
                    {...props}
                    value={form.bookingId ?? ''}
                    onChange={(e) => patch({ bookingId: e.target.value || undefined })}
                  >
                    {/* On a labour row the blank option is a prompt, not a
                        choice — the store refuses hours with no job on them,
                        so an option that says «keinem Einsatz zugeordnet»
                        would be an answer the form cannot accept. */}
                    <option value="">
                      {isLabour ? t('bookingNoneLabour') : t('bookingNone')}
                    </option>
                    {billable.map((b) => (
                      <option key={b.id} value={b.id}>
                        {jobLabel(b)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
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
