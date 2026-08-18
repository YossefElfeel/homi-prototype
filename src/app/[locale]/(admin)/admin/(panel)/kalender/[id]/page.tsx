'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { Check, FileText, PhoneOff, RotateCcw, X } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmPanel } from '@/components/ui/confirm-panel';
import { Field, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { addMinutes } from '@/mock/engines/availability';
import type { CalendarEventKind } from '@/mock/schema';
import { useHydrated, useNow, useStore } from '@/mock/store';

function kindKey(kind: CalendarEventKind) {
  return kind === 'contact-call'
    ? ('kindContactCall' as const)
    : kind === 'follow-up'
      ? ('kindFollowUp' as const)
      : ('kindViewing' as const);
}

/**
 * Screen 63a — one calendar entry that is not a job.
 *
 * The whole reason this record exists is the last card on the page: a call
 * that produced work has to be able to become a request without being retyped.
 * Without that path the owner finishes a good phone call, ticks the entry off,
 * and then enters the same customer, address and service again from memory in
 * a different screen — which is exactly the double entry that makes people
 * stop using the calendar and go back to a notebook.
 *
 * `noReply` is deliberately not `done`. Nobody picking up leaves the promise
 * outstanding, and folding the two together would let a week of unanswered
 * calls read as a week of completed work.
 */
export default function CalendarEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.event');
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const events = useStore((s) => s.data.events);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const requests = useStore((s) => s.data.requests);
  const team = useStore((s) => s.data.team);
  const setStatus = useStore((s) => s.setCalendarEventStatus);
  const updateEvent = useStore((s) => s.updateCalendarEvent);

  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const event = events.find((e) => e.id === id);
  if (!event) return <p className="text-ink-tertiary">—</p>;

  const customer = customers.find((c) => c.id === event.customerId);
  const property = properties.find((p) => p.id === event.propertyId);
  const request = requests.find((r) => r.id === event.requestId);
  const assignee = team.find((m) => m.id === event.assigneeId);
  const start = new Date(event.start);

  /* Open means there is still something to do. `converted` is closed even
     though nobody ticked it — the work moved on to the request. */
  const open = event.status === 'planned' || event.status === 'noReply';

  return (
    <div>
      <PageHeader
        title={event.title}
        back={{ href: '/admin/kalender', label: t('back') }}
        meta={
          <span className="flex flex-wrap items-center gap-3">
            <span data-numeric className="label-type text-ink-tertiary">
              {event.reference}
            </span>
            <span className="label-type text-ink-tertiary">{t(kindKey(event.kind))}</span>
            <StatusBadge entity="calendarEvent" state={event.status} />
          </span>
        }
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <dl className="grid gap-px border border-line-subtle bg-line-subtle sm:grid-cols-2">
            <div className="bg-page p-5">
              <dt className="label-type text-ink-tertiary">{t('whenTitle')}</dt>
              <dd data-numeric className="mt-2">
                {format.dateTime(start, 'dayMonth')}
                <span className="block text-lg">
                  {format.dateTime(start, 'time')}–
                  {format.dateTime(addMinutes(start, event.duration), 'time')}
                </span>
              </dd>
            </div>
            <div className="bg-page p-5">
              <dt className="label-type text-ink-tertiary">{t('contactTitle')}</dt>
              <dd className="mt-2">
                {customer ? (
                  <Link
                    href={`/admin/kunden/${customer.id}`}
                    className="underline decoration-from-font underline-offset-4"
                  >
                    {customer.firstName} {customer.lastName}
                  </Link>
                ) : (
                  (event.contactName ?? '—')
                )}
                {(event.contactPhone ?? customer?.phone) && (
                  <span data-numeric className="block text-sm text-ink-secondary">
                    {event.contactPhone ?? customer?.phone}
                  </span>
                )}
                {property && (
                  <span className="block text-sm text-ink-tertiary">
                    {property.street}, {property.city}
                  </span>
                )}
                {assignee && (
                  <span className="block text-sm text-ink-tertiary">
                    {assignee.firstName} {assignee.lastName}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {event.note && (
            <section>
              <h2 className="display-type text-xl">{t('noteTitle')}</h2>
              <p className="mt-3 max-w-[var(--measure)] whitespace-pre-line text-ink-secondary">
                {event.note}
              </p>
            </section>
          )}

          <section>
            <h2 className="display-type text-xl">{t('outcomeTitle')}</h2>
            {/*
              Written after the call, not before it. The note above is what the
              owner meant to ask; this is what they were told — and it is the
              text that has to survive into the request if this becomes work.
            */}
            {outcome === null ? (
              <div className="mt-3">
                <p className="max-w-[var(--measure)] whitespace-pre-line text-ink-secondary">
                  {event.outcome ?? '—'}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setOutcome(event.outcome ?? '')}
                >
                  {t('outcomeLabel')}
                </Button>
              </div>
            ) : (
              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  updateEvent(event.id, { outcome: outcome.trim() || undefined });
                  setOutcome(null);
                  toast.success(t('outcomeSaved'));
                }}
              >
                <Field label={t('outcomeLabel')}>
                  {(props) => (
                    <Textarea
                      {...props}
                      rows={3}
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                    />
                  )}
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm">
                    {t('outcomeTitle')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOutcome(null)}
                  >
                    {t('dismiss')}
                  </Button>
                </div>
              </form>
            )}
          </section>

          <section>
            <h2 className="display-type text-xl">{t('historyTitle')}</h2>
            <ol className="mt-4 space-y-3 border-l border-line-subtle pl-4">
              {event.history.map((entry, index) => (
                // Not keyed on `at` alone: two actions inside one 30s tick of
                // `useNow` share a timestamp.
                <li key={`${entry.at}-${index}`} className="relative text-sm">
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[1.3125rem] size-2 rounded-full bg-line"
                  />
                  <span className="block">{entry.label}</span>
                  <span data-numeric className="text-ink-tertiary">
                    {format.dateTime(new Date(entry.at), 'short')}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          {/*
            The point of the whole entity. A call that produced work becomes a
            request here, with the customer already chosen — otherwise the owner
            retypes from memory in a different screen, which is the double entry
            that sends people back to a paper diary.
          */}
          {request ? (
            <div className="surface-card p-5">
              <h2 className="label-type text-ink-tertiary">{t('convertTitle')}</h2>
              <p className="mt-2 text-sm text-ink-secondary">
                {t('convertedNote', { reference: request.reference })}
              </p>
              <Button asChild variant="secondary" size="sm" className="mt-4">
                <Link href={`/admin/anfragen/${request.id}`}>
                  <FileText className="size-3.5" aria-hidden />
                  {t('requestLink', { reference: request.reference })}
                </Link>
              </Button>
            </div>
          ) : (
            open && (
              <div className="surface-card p-5">
                <h2 className="label-type text-ink-tertiary">{t('convertTitle')}</h2>
                <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
                  {t('convertBody')}
                </p>
                <Button asChild className="mt-4">
                  <Link
                    href={`/admin/anfragen/neu?event=${event.id}${
                      event.customerId ? `&customer=${event.customerId}` : ''
                    }`}
                  >
                    <FileText className="size-4" aria-hidden />
                    {t('convertAction')}
                  </Link>
                </Button>
              </div>
            )
          )}

          <div>
            <h2 className="label-type text-ink-tertiary">{t('actionsTitle')}</h2>
            <div className="mt-3 space-y-2">
              {open ? (
                <>
                  <Button
                    block
                    variant="secondary"
                    onClick={() => {
                      setStatus(event.id, 'done', now);
                      toast.success(t('doneToast'));
                    }}
                  >
                    <Check className="size-4" aria-hidden />
                    {t('markDone')}
                  </Button>

                  {event.status !== 'noReply' && (
                    <>
                      <Button
                        block
                        variant="secondary"
                        onClick={() => {
                          setStatus(event.id, 'noReply', now);
                          toast.success(t('noReplyToast'));
                        }}
                      >
                        <PhoneOff className="size-4" aria-hidden />
                        {t('markNoReply')}
                      </Button>
                      <p className="px-1 text-xs text-ink-tertiary">{t('markNoReplyHint')}</p>
                    </>
                  )}

                  {confirming ? (
                    <ConfirmPanel
                      title={t('cancel')}
                      body={t('convertBody')}
                      action={t('cancel')}
                      dismiss={t('dismiss')}
                      onConfirm={() => {
                        setStatus(event.id, 'cancelled', now);
                        setConfirming(false);
                        toast.success(t('cancelToast'));
                      }}
                      onDismiss={() => setConfirming(false)}
                    />
                  ) : (
                    <Button block variant="danger" onClick={() => setConfirming(true)}>
                      <X className="size-4" aria-hidden />
                      {t('cancel')}
                    </Button>
                  )}
                </>
              ) : (
                /* A closed entry reopens rather than being edited back into
                   life, so the timeline keeps both the closing and the reason
                   somebody changed their mind. */
                event.status !== 'converted' && (
                  <Button
                    block
                    variant="secondary"
                    onClick={() => {
                      setStatus(event.id, 'planned', now);
                      toast.success(t('reopenToast'));
                    }}
                  >
                    <RotateCcw className="size-4" aria-hidden />
                    {t('reopen')}
                  </Button>
                )
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
