'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import {
  CalendarClock,
  Check,
  FileText,
  History,
  PhoneOff,
  RotateCcw,
  StickyNote,
  User,
  X,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { CollapsibleSection, SectionGroup } from '@/components/ui/collapsible-section';
import { ConfirmDialog, useDismissLabel } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { addMinutes } from '@/mock/engines/availability';
import { offerTotal } from '@/mock/engines/offers';
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
 * The whole reason this record exists is the request card: a call that
 * produced work has to be able to become a request without being retyped.
 * Without that path the owner finishes a good phone call, ticks the entry off,
 * and then enters the same customer, address and service again from memory in
 * a different screen — which is exactly the double entry that makes people
 * stop using the calendar and go back to a notebook.
 *
 * `pending` is deliberately not `done`. Nobody picking up leaves the promise
 * outstanding, and folding the two together would let a week of unanswered
 * calls read as a week of completed work.
 */
export default function CalendarEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.event');
  const dismissLabel = useDismissLabel();
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const events = useStore((s) => s.data.events);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const requests = useStore((s) => s.data.requests);
  const offers = useStore((s) => s.data.offers);
  const team = useStore((s) => s.data.team);
  const services = useStore((s) => s.services);
  const setStatus = useStore((s) => s.setCalendarEventStatus);
  const updateEvent = useStore((s) => s.updateCalendarEvent);

  const [confirming, setConfirming] = useState(false);
  /* The slot is open on arrival; the rest carry a summary while closed. Three
     blocks of flat text was most of this screen's height for facts that are
     read once and then not again. */
  const [openSections, setOpenSections] = useState<string[]>(['slot']);

  const event = events.find((e) => e.id === id);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  /*
   * An em-dash was the whole screen for an id that matches nothing.
   *
   * It stopped being a theoretical case with this wave: /admin/kalender/karte
   * used to be the route map and is now nothing, so every old link to it lands
   * on this branch — inside the panel shell, with one dash and no way out.
   */
  if (!event) {
    return (
      <EmptyState
        icon={CalendarClock}
        /* h1: the empty state *is* the page here, and a screen reader
           navigating by heading would otherwise find none. */
        headingLevel={1}
        title={t('notFoundTitle')}
        body={t('notFoundBody')}
        action={
          <Button asChild variant="secondary">
            <Link href="/admin/kalender">{t('back')}</Link>
          </Button>
        }
      />
    );
  }

  const customer = customers.find((c) => c.id === event.customerId);
  const property = properties.find((p) => p.id === event.propertyId);
  const request = requests.find((r) => r.id === event.requestId);
  const assignee = team.find((m) => m.id === event.assigneeId);
  const start = new Date(event.start);

  /* The quote written against the request, when there is one. What the call
     was worth is the last thing the overview is missing, and it lives two
     records away — event → request → offer. */
  const offer = request
    ? offers
        .filter((o) => o.requestId === request.id)
        .sort((a, b) => b.version - a.version)[0]
    : undefined;

  const contactName = customer
    ? `${customer.firstName} ${customer.lastName}`
    : (event.contactName ?? '—');
  const contactPhone = event.contactPhone ?? customer?.phone;
  const address = property ? `${property.street}, ${property.city}` : undefined;

  /* Open means there is still something to do. `inProgress` is closed even
     though nobody ticked it — the work moved on to the request. */
  const open = event.status === 'upcoming' || event.status === 'pending';

  /* A closed entry reopens rather than being edited back into life, so the
     timeline keeps both the closing and the reason somebody changed their
     mind. An entry that became a request is the one exception: reopening it
     would leave two live records for one job.

     Which left «Aktionen» standing over an empty box on exactly that entry —
     a heading promising controls that were never going to render. */
  const canReopen = !open && event.status !== 'inProgress';

  const convertHref = `/admin/anfragen/neu?event=${event.id}${
    event.customerId ? `&customer=${event.customerId}` : ''
  }`;

  return (
    <div>
      <PageHeader
        title={event.title}
        back={{ href: '/admin/kalender', label: t('back') }}
        /*
          The reference and the kind used to sit here as two grey chips. «K-404»
          is an id nothing on this screen or any other lets you search by, and
          «Nachfassen» is a fact about the entry rather than about its title —
          it reads better one line down, inside the slot card, where the rest of
          the entry's facts already are.
        */
        meta={<StatusBadge entity="calendarEvent" state={event.status} />}
        actions={
          /* The point of the whole entity, and it was a button at the bottom of
             a sidebar card. It is the primary action of the screen. */
          request ? (
            <Button asChild variant="secondary">
              <Link href={`/admin/anfragen/${request.id}`}>
                <FileText className="size-4" aria-hidden />
                {t('requestLink', { reference: request.reference })}
              </Link>
            </Button>
          ) : (
            open && (
              <Button asChild>
                <Link href={convertHref}>
                  <FileText className="size-4" aria-hidden />
                  {t('convertAction')}
                </Link>
              </Button>
            )
          )
        }
      />

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <h2 className="label-type text-ink-tertiary">{t('detailsTitle')}</h2>

          <SectionGroup value={openSections} onValueChange={setOpenSections}>
            <CollapsibleSection
              value="slot"
              icon={CalendarClock}
              title={t('slotTitle')}
              summary={
                <span data-numeric>
                  {format.dateTime(start, 'dayMonth')}, {format.dateTime(start, 'time')}
                </span>
              }
            >
              <dl className="grid gap-5 sm:grid-cols-3">
                <div>
                  <dt className="label-type text-ink-tertiary">{t('whenTitle')}</dt>
                  <dd data-numeric className="mt-1.5">
                    {format.dateTime(start, 'dayMonth')}
                    <span className="block text-lg">
                      {format.dateTime(start, 'time')}–
                      {format.dateTime(addMinutes(start, event.duration), 'time')}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="label-type text-ink-tertiary">{t('durationTitle')}</dt>
                  <dd data-numeric className="mt-1.5 text-lg">
                    {t('minutes', { n: event.duration })}
                  </dd>
                </div>
                <div>
                  <dt className="label-type text-ink-tertiary">{t('kindTitle')}</dt>
                  <dd className="mt-1.5">{t(kindKey(event.kind))}</dd>
                </div>
              </dl>
            </CollapsibleSection>

            <CollapsibleSection
              value="contact"
              icon={User}
              title={t('contactTitle')}
              summary={contactName}
            >
              <dl className="divide-y divide-line-subtle border-t border-line-subtle">
                <Row label={t('contactName')}>
                  {customer ? (
                    <Link
                      href={`/admin/kunden/${customer.id}`}
                      className="font-medium text-ink-accent hover:underline"
                    >
                      {contactName}
                    </Link>
                  ) : (
                    contactName
                  )}
                </Row>
                {contactPhone && (
                  <Row label={t('contactPhone')}>
                    <a
                      href={`tel:${contactPhone.replace(/\s/g, '')}`}
                      data-numeric
                      className="underline-offset-4 hover:underline"
                    >
                      {contactPhone}
                    </a>
                  </Row>
                )}
                {property && (
                  <Row label={t('contactAddress')}>
                    <Link
                      href={`/admin/objekte/${property.id}`}
                      className="text-ink-accent hover:underline"
                    >
                      {address}
                    </Link>
                  </Row>
                )}
                {assignee && (
                  <Row label={t('contactAssignee')}>
                    {assignee.firstName} {assignee.lastName}
                  </Row>
                )}
              </dl>
            </CollapsibleSection>

            {event.note && (
              <CollapsibleSection
                value="note"
                icon={StickyNote}
                title={t('noteTitle')}
                summary={event.note}
              >
                <p className="max-w-[var(--measure)] whitespace-pre-line text-ink-secondary">
                  {event.note}
                </p>
              </CollapsibleSection>
            )}

            <CollapsibleSection
              value="history"
              icon={History}
              title={t('historyTitle')}
              summary={event.history[event.history.length - 1]?.label}
            >
              <ol className="space-y-3 border-l border-line-subtle pl-4">
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
            </CollapsibleSection>
          </SectionGroup>

          {/*
            Written after the call. The note in the section above is what the
            owner meant to ask; this is what they were told — and it is the
            text that has to survive into the request if this becomes work.
          */}
          <MessageCard
            /* Keyed on what is stored, so a save — or landing on a different
               entry — rebuilds the draft instead of leaving the box showing
               the last record's text. */
            key={`${event.id}:${event.outcome ?? ''}`}
            stored={event.outcome ?? ''}
            onSave={(next) => {
              updateEvent(event.id, { outcome: next || undefined });
              toast.success(t('messageSaved'));
            }}
          />
        </div>

        <aside className="space-y-6 lg:col-span-5">
          {/*
            The overview of the request, on both sides of the conversion.
            Before it, the sidebar carried a paragraph explaining what the
            button would do and nothing about *what* would be carried over —
            so the owner had to open the intake form to find out whether the
            phone number and the address were already on the record. After it,
            all this screen said was "this became A-2602": the state, the
            service and the amount were three clicks away in another screen.
          */}
          <Card>
            <CardHeader
              title={t('requestTitle')}
              description={request ? t('requestDoneLead') : t('requestOpenLead')}
              actions={
                request && (
                  <StatusBadge entity="request" state={request.status} size="sm" />
                )
              }
            />
            <CardBody>
              {request ? (
                <dl className="divide-y divide-line-subtle border-t border-line-subtle">
                  <Row label={t('requestReference')}>
                    <Link
                      href={`/admin/anfragen/${request.id}`}
                      data-numeric
                      className="text-ink-accent hover:underline"
                    >
                      {request.reference}
                    </Link>
                  </Row>
                  <Row label={t('requestService')}>
                    {services.find((s) => s.slug === request.serviceSlug)?.name[locale] ??
                      request.serviceSlug}
                  </Row>
                  <Row label={t('requestCreated')}>
                    <span data-numeric>
                      {format.dateTime(new Date(request.createdAt), 'short')}
                    </span>
                  </Row>
                  <Row label={t('requestAmount')}>
                    {/* No quote yet is the normal state right after a call —
                        printing a dash without saying why reads as missing
                        data rather than as work still to do. */}
                    {offer ? (
                      <Money amount={offerTotal(offer)} emphasis="strong" />
                    ) : (
                      <span className="text-sm text-ink-tertiary">
                        {t('requestNoAmount')}
                      </span>
                    )}
                  </Row>
                </dl>
              ) : (
                <>
                  <dl className="divide-y divide-line-subtle border-t border-line-subtle">
                    <Row label={t('contactName')}>{contactName}</Row>
                    <Row label={t('contactPhone')}>
                      {contactPhone ? (
                        <span data-numeric>{contactPhone}</span>
                      ) : (
                        <span className="text-sm text-ink-tertiary">
                          {t('requestMissing')}
                        </span>
                      )}
                    </Row>
                    <Row label={t('contactAddress')}>
                      {address ?? (
                        <span className="text-sm text-ink-tertiary">
                          {t('requestMissing')}
                        </span>
                      )}
                    </Row>
                    <Row label={t('messageTitle')}>
                      {event.outcome ? (
                        <span className="text-sm">{event.outcome}</span>
                      ) : (
                        <span className="text-sm text-ink-tertiary">
                          {t('requestMissing')}
                        </span>
                      )}
                    </Row>
                  </dl>
                  {open && (
                    <Button asChild block className="mt-4">
                      <Link href={convertHref}>
                        <FileText className="size-4" aria-hidden />
                        {t('convertAction')}
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </CardBody>
          </Card>

          {(open || canReopen) && (
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

                    {event.status !== 'pending' && (
                      <>
                        <Button
                          block
                          variant="secondary"
                          onClick={() => {
                            setStatus(event.id, 'pending', now);
                            toast.success(t('noReplyToast'));
                          }}
                        >
                          <PhoneOff className="size-4" aria-hidden />
                          {t('markNoReply')}
                        </Button>
                        <p className="px-1 text-xs text-ink-tertiary">{t('markNoReplyHint')}</p>
                      </>
                    )}

                    <Button block variant="danger" onClick={() => setConfirming(true)}>
                      <X className="size-4" aria-hidden />
                      {t('cancel')}
                    </Button>
                  </>
                ) : (
                  <Button
                    block
                    variant="secondary"
                    onClick={() => {
                      setStatus(event.id, 'upcoming', now);
                      toast.success(t('reopenToast'));
                    }}
                  >
                    <RotateCcw className="size-4" aria-hidden />
                    {t('reopen')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Was an inline panel inside the right-hand column, where it replaced
          the button and pushed the two above it around as it opened. */}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('cancelConfirmTitle')}
        body={t('cancelConfirmBody')}
        action={t('cancel')}
        dismiss={dismissLabel}
        onConfirm={() => {
          setStatus(event.id, 'cancelled', now);
          setConfirming(false);
          toast.success(t('cancelToast'));
        }}
      />
    </div>
  );
}

/**
 * The message is a field on the page, not a mode.
 *
 * It used to sit behind a «Was ist herausgekommen?» button: read the entry,
 * press a button, then type. The one thing the owner does after a call is
 * write down what was said, and putting it one click behind a disclosure meant
 * the field was empty on most records — which then made the request this entry
 * converts into empty too.
 */
function MessageCard({
  stored,
  onSave,
}: {
  stored: string;
  onSave: (next: string) => void;
}) {
  const t = useTranslations('admin.event');
  const [draft, setDraft] = useState(stored);

  return (
    <Card>
      <CardHeader title={t('messageTitle')} description={t('messageHint')} />
      <CardBody>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(draft.trim());
          }}
        >
          <Field label={t('messageTitle')}>
            {(props) => (
              <Textarea
                {...props}
                rows={3}
                value={draft}
                placeholder={t('messagePlaceholder')}
                onChange={(e) => setDraft(e.target.value)}
              />
            )}
          </Field>
          <Button type="submit" size="sm" disabled={draft.trim() === stored}>
            {t('messageSave')}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-ink-tertiary">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
