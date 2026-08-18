'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, CalendarPlus, Phone } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { dayBlockReason, type DayBlockReason } from '@/mock/engines/availability';
import type { CalendarEventKind, ServiceSlug } from '@/mock/schema';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

type Mode = 'job' | 'event';

/** Durations the owner picks from, in minutes. Half-hour steps, like the engine. */
const JOB_DURATIONS = [120, 180, 240, 300, 360, 480];
const EVENT_DURATIONS = [15, 30, 45, 60, 90];

/**
 * Screen 58a — the calendar's own way in.
 *
 * A `Booking` could only ever be created by `payForOffer`. So the work that
 * arrives the way this business actually gets work — somebody rings up and the
 * job is agreed on the call — had no route into the calendar at all, and
 * /admin/buchungen has been printing a "Manuell" source label since it was
 * built for a kind of record nothing could produce.
 *
 * Two things live behind one button, because from the owner's side they are
 * one thought: something is happening on a day. What separates them is whether
 * it is *work* — a job has a property to drive to, a price and a contractor; a
 * callback has a phone number and five minutes. Modelling the second as a
 * booking would have spent one of the two daily job slots (§1.2) on a phone
 * call and put that call in the contractor's list.
 */
export default function NewAppointmentPage() {
  const t = useTranslations('admin.newAppointment');
  const eventT = useTranslations('admin.event');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const bookings = useStore((s) => s.data.bookings);
  const closures = useStore((s) => s.data.closures);
  const team = useStore((s) => s.data.team);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const createManualBooking = useStore((s) => s.createManualBooking);
  const createCalendarEvent = useStore((s) => s.createCalendarEvent);

  const [mode, setMode] = useState<Mode>('job');

  const [customerId, setCustomerId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [serviceSlug, setServiceSlug] = useState<ServiceSlug>('einmalreinigung');
  const [assigneeId, setAssigneeId] = useState('');
  const [start, setStart] = useState('');
  const [duration, setDuration] = useState(180);
  const [note, setNote] = useState('');

  const [eventKind, setEventKind] = useState<CalendarEventKind>('contact-call');
  const [title, setTitle] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [eventDuration, setEventDuration] = useState(30);

  const customerProperties = useMemo(
    () => properties.filter((p) => p.customerId === customerId),
    [properties, customerId],
  );

  /*
   * The refusal is computed while typing, not on submit.
   *
   * A form that accepts a date and then rejects it has already wasted the call
   * the owner is on. `dayBlockReason` is the same function the customer-facing
   * picker uses, so the two cannot come to different conclusions about whether
   * Saturday the 14th is available.
   */
  const blocked: DayBlockReason | null = useMemo(() => {
    if (mode !== 'job' || !start) return null;
    return dayBlockReason(new Date(start), { bookings, closures, settings, now });
  }, [mode, start, bookings, closures, settings, now]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const activeServices = services.filter((s) => s.active);
  const blockedMessage =
    blocked === 'closed-day'
      ? t('blockedClosedDay')
      : blocked === 'closure-period'
        ? t('blockedClosurePeriod')
        : blocked === 'too-soon'
          ? t('blockedTooSoon', { hours: settings.minLeadHours })
          : blocked === 'at-capacity'
            ? t('blockedAtCapacity', { max: settings.maxJobsPerDay })
            : null;

  const canSubmitJob = Boolean(customerId && propertyId && start) && !blocked;
  const canSubmitEvent = Boolean(title.trim() && start);

  function submitJob() {
    const result = createManualBooking(
      {
        customerId,
        propertyId,
        serviceSlug,
        start: new Date(start).toISOString(),
        duration,
        assigneeId: assigneeId || undefined,
        note,
      },
      now,
    );
    if ('error' in result) {
      // Belt and braces: the form already refuses this, but the store is the
      // thing that must not be walkable around.
      toast.error(t('blockedTitle'));
      return;
    }
    toast.success(t('doneJob', { reference: result.reference }));
    router.push(`/admin/buchungen/${result.id}`);
  }

  function submitEvent() {
    const id = createCalendarEvent(
      {
        kind: eventKind,
        title,
        start: new Date(start).toISOString(),
        duration: eventDuration,
        customerId: customerId || undefined,
        contactName,
        contactPhone,
        propertyId: eventKind === 'viewing' && propertyId ? propertyId : undefined,
        note,
        assigneeId: assigneeId || undefined,
      },
      now,
    );
    toast.success(t('doneEvent'));
    router.push(`/admin/kalender/${id}`);
  }

  /*
   * A job needs a customer and a property, and on launch day there are none.
   * Sending the owner to a form whose first field cannot be filled is the
   * failure the empty-state rule in CLAUDE.md exists to prevent — a call is
   * still possible here, so only the job half is gated.
   */
  const noCustomers = customers.length === 0;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        back={{ href: '/admin/kalender', label: t('back') }}
      />

      <fieldset className="mt-8">
        <legend className="label-type text-ink-tertiary">{t('kindLegend')}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ModeCard
            selected={mode === 'job'}
            onSelect={() => setMode('job')}
            icon={<CalendarPlus className="size-4" aria-hidden />}
            title={t('kindJob')}
            hint={t('kindJobHint')}
          />
          <ModeCard
            selected={mode === 'event'}
            onSelect={() => setMode('event')}
            icon={<Phone className="size-4" aria-hidden />}
            title={t('kindCall')}
            hint={t('kindCallHint')}
          />
        </div>
      </fieldset>

      {mode === 'job' && noCustomers ? (
        <EmptyState
          className="mt-8"
          title={t('noCustomersTitle')}
          body={t('noCustomersBody')}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/kunden/neu">{t('noCustomersAction')}</Link>
            </Button>
          }
        />
      ) : (
        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === 'job') submitJob();
            else submitEvent();
          }}
        >
          {mode === 'event' && (
            <>
              <Field label={t('eventKindLabel')}>
                {(props) => (
                  <Select
                    {...props}
                    value={eventKind}
                    onChange={(e) => setEventKind(e.target.value as CalendarEventKind)}
                  >
                    <option value="contact-call">{eventT('kindContactCall')}</option>
                    <option value="follow-up">{eventT('kindFollowUp')}</option>
                    <option value="viewing">{eventT('kindViewing')}</option>
                  </Select>
                )}
              </Field>

              <Field label={t('titleLabel')}>
                {(props) => (
                  <Input
                    {...props}
                    required
                    value={title}
                    placeholder={t('titlePlaceholder')}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                )}
              </Field>
            </>
          )}

          <Field
            label={t('customerLabel')}
            optional={mode === 'event'}
            hint={mode === 'event' ? t('customerNone') : undefined}
          >
            {(props) => (
              <Select
                {...props}
                required={mode === 'job'}
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setPropertyId('');
                }}
              >
                <option value="">{t('customerPlaceholder')}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          {mode === 'event' && !customerId && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('contactNameLabel')} optional>
                {(props) => (
                  <Input
                    {...props}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                )}
              </Field>
              <Field label={t('contactPhoneLabel')} optional>
                {(props) => (
                  <Input
                    {...props}
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                )}
              </Field>
            </div>
          )}

          {(mode === 'job' || eventKind === 'viewing') && customerId && (
            <Field label={t('propertyLabel')} optional={mode === 'event'}>
              {(props) => (
                <Select
                  {...props}
                  required={mode === 'job'}
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                >
                  <option value="">{t('propertyPlaceholder')}</option>
                  {customerProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label ? `${p.label} — ` : ''}
                      {p.street}, {p.city}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}

          {mode === 'job' && (
            <Field label={t('serviceLabel')}>
              {(props) => (
                <Select
                  {...props}
                  value={serviceSlug}
                  onChange={(e) => setServiceSlug(e.target.value as ServiceSlug)}
                >
                  {activeServices.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name[locale]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('startLabel')}>
              {(props) => (
                <Input
                  {...props}
                  type="datetime-local"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              )}
            </Field>

            <Field label={t('durationLabel')}>
              {(props) =>
                mode === 'job' ? (
                  <Select
                    {...props}
                    value={String(duration)}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    {JOB_DURATIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {t('durationHours', { n: minutes / 60 })}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Select
                    {...props}
                    value={String(eventDuration)}
                    onChange={(e) => setEventDuration(Number(e.target.value))}
                  >
                    {EVENT_DURATIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {t('durationMinutes', { n: minutes })}
                      </option>
                    ))}
                  </Select>
                )
              }
            </Field>
          </div>

          {blockedMessage && (
            <div className="flex gap-3 rounded-[var(--radius-md)] border border-status-warning-line bg-status-warning p-4 text-status-warning-fg">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">{t('blockedTitle')}</p>
                <p data-numeric className="mt-1 text-sm">
                  {blockedMessage}
                </p>
                {/* Where the rule actually lives. Refusing without saying that
                    the ceiling and the holidays are the owner's own settings
                    turns a policy into an obstacle. */}
                <p className="mt-2 text-sm">
                  <Link
                    href="/admin/einstellungen"
                    className="underline decoration-from-font underline-offset-4"
                  >
                    {t('blockedHint')}
                  </Link>
                </p>
              </div>
            </div>
          )}

          {team.length > 0 && (
            <Field label={t('assigneeLabel')} optional>
              {(props) => (
                <Select
                  {...props}
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  <option value="">—</option>
                  {team.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}

          <Field label={t('noteLabel')} optional>
            {(props) => (
              <Textarea
                {...props}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={mode === 'job' ? !canSubmitJob : !canSubmitEvent}>
              {mode === 'job' ? t('submitJob') : t('submitEvent')}
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/kalender">{t('cancel')}</Link>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function ModeCard({
  selected,
  onSelect,
  icon,
  title,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'rounded-[var(--radius-md)] border p-4 text-left transition-colors',
        selected ? 'border-accent bg-accent-subtle' : 'border-line hover:bg-sunken',
      )}
    >
      <span className="flex items-center gap-2 font-medium">
        {icon}
        {title}
      </span>
      <span className="mt-1.5 block text-sm text-ink-secondary">{hint}</span>
    </button>
  );
}
