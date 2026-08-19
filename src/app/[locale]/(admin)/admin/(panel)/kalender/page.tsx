'use client';

import { use, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import {
  AlertTriangle,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  Map,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  X,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { addDays, detectRouteConflicts, startOfDay } from '@/mock/engines/availability';
import { calendarDay, TONE_CHIP, TONE_DOT, type CalendarEntry } from '@/lib/calendar-entries';
import { statesOf, statusTone, type StatusTone } from '@/lib/status-registry';
import type { Booking, CalendarEventKind } from '@/mock/schema';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

type View = 'day' | 'week' | 'month' | 'agenda';

const EVENT_ICON: Record<CalendarEventKind, typeof Phone> = {
  'contact-call': Phone,
  'follow-up': Phone,
  viewing: MapPin,
};

/** A finished job is history — the row menu offers reading, not moving. */
const SETTLED: Booking['status'][] = [
  'completed',
  'invoiced',
  'closed',
  'cancelled',
  'noAccess',
];

function kindKey(kind: CalendarEventKind) {
  return kind === 'contact-call'
    ? ('kindContactCall' as const)
    : kind === 'follow-up'
      ? ('kindFollowUp' as const)
      : ('kindViewing' as const);
}

function Swatch({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', TONE_DOT[tone])} />
      {label}
    </li>
  );
}

function ClosureNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 flex gap-3 rounded-[var(--radius-md)] border border-line bg-sunken p-4">
      <CalendarOff className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-ink-secondary">{body}</p>
      </div>
    </div>
  );
}

/**
 * Screens 58–61.
 *
 * One route with four views rather than four routes, because that is what a
 * calendar is — nobody navigates to "the week page". The switcher carries the
 * whole thing and the current date survives switching views.
 *
 * §20.5 is enforced visibly: where two jobs sit closer together than the drive
 * between them, the day says so rather than letting the owner discover it on
 * the road.
 *
 * What a day *contains* now comes from `lib/calendar-entries`. Four views each
 * filtering the source data by hand is how they drift, and this screen had
 * already drifted: week and month drew company holidays, day and agenda did
 * not, so a closed day read "Nothing scheduled" — which reads as a free day.
 * Time held against an unsigned quote was drawn nowhere at all while the
 * scheduler refused to offer it, so the owner saw a day the engine considered
 * half spent.
 */
export default function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = use(searchParams);
  const t = useTranslations('admin.calendar');
  const mapT = useTranslations('admin.map');
  const eventT = useTranslations('admin.event');
  const bookingStatusT = useTranslations('status.booking');
  const eventStatusT = useTranslations('status.calendarEvent');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const now = useNow();
  const hydrated = useHydrated();

  const bookings = useStore((s) => s.data.bookings);
  const events = useStore((s) => s.data.events);
  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const closures = useStore((s) => s.data.closures);
  const holds = useStore((s) => s.holds);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);

  const [view, setView] = useState<View>('day');
  const [legendOpen, setLegendOpen] = useState(false);
  // `?tag` makes the calendar deep-linkable — a team member's job list links
  // to the day it happens on. A lazy initialiser, not an effect: an effect
  // would undo the "Today" button on every render.
  const [cursor, setCursor] = useState(() =>
    tag && /^\d{4}-\d{2}-\d{2}$/.test(tag) ? startOfDay(new Date(tag)) : startOfDay(now),
  );

  const source = useMemo(
    () => ({ bookings, events, holds, closures, now }),
    [bookings, events, holds, closures, now],
  );

  const weekStart = useMemo(() => {
    const d = startOfDay(cursor);
    const weekday = d.getDay() === 0 ? 7 : d.getDay();
    return addDays(d, 1 - weekday);
  }, [cursor]);

  const conflicts = useMemo(
    () => detectRouteConflicts(cursor, bookings, properties),
    [cursor, bookings, properties],
  );

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const step = view === 'month' ? 30 : view === 'week' ? 7 : 1;
  const today = calendarDay(cursor, source);

  const nameOf = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };
  const propertyOf = (id: string) => properties.find((p) => p.id === id);
  const serviceName = (slug: string) =>
    services.find((s) => s.slug === slug)?.name[locale] ?? slug;

  /** The label a merged entry carries in a list. */
  const entryTitle = (entry: CalendarEntry) => {
    if (entry.booking) return nameOf(entry.booking.customerId);
    if (entry.event) return entry.event.title;
    return t('holdTitle');
  };

  const entryDetail = (entry: CalendarEntry) => {
    if (entry.booking) {
      const property = propertyOf(entry.booking.propertyId);
      const where = [property?.street, property?.city].filter(Boolean).join(', ');
      return [serviceName(entry.booking.serviceSlug), where].filter(Boolean).join(' · ');
    }
    if (entry.event) {
      const who =
        entry.event.contactName ??
        (entry.event.customerId ? nameOf(entry.event.customerId) : undefined);
      return [eventT(kindKey(entry.event.kind)), who].filter(Boolean).join(' · ');
    }
    return t('legendHoldHint');
  };

  const heading =
    view === 'month'
      ? format.dateTime(cursor, { month: 'long', year: 'numeric' })
      : view === 'week'
        ? `${format.dateTime(weekStart, 'dayMonth')} – ${format.dateTime(addDays(weekStart, 5), 'dayMonth')}`
        : format.dateTime(cursor, 'full');

  const weekDays = Array.from({ length: 6 }, (_, i) =>
    calendarDay(addDays(weekStart, i), source),
  );
  const weekJobs = weekDays.flatMap((d) => d.entries.filter((e) => e.kind === 'booking'));

  function EntryRow({ entry, time, until }: { entry: CalendarEntry; time: string; until: string }) {
    const Icon = entry.event ? EVENT_ICON[entry.event.kind] : entry.kind === 'hold' ? Clock : null;

    const body = (
      <>
        <span data-numeric className="w-28 shrink-0">
          {time}
          <span className="block text-sm text-ink-tertiary">{until}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 font-medium">
            {Icon && <Icon className="size-3.5 shrink-0 text-ink-tertiary" aria-hidden />}
            {entryTitle(entry)}
          </span>
          <span className="block truncate text-sm text-ink-secondary">{entryDetail(entry)}</span>
        </span>
        {entry.booking && <StatusBadge entity="booking" state={entry.booking.status} size="sm" />}
        {entry.event && (
          <StatusBadge entity="calendarEvent" state={entry.event.status} size="sm" />
        )}
      </>
    );

    /* A held slot has no record to open — the quote exists, the job does not. */
    if (!entry.href) {
      return <span className="flex flex-1 items-center gap-5 py-3">{body}</span>;
    }

    return (
      <Link
        href={entry.href}
        className="flex flex-1 items-center gap-5 py-3 transition-colors hover:bg-sunken"
      >
        {body}
      </Link>
    );
  }

  /**
   * The row menu.
   *
   * Every item links to the booking detail with the panel it means already
   * open. Performing the action here would put a confirmation panel inside a
   * dropdown and give cancel a second implementation — the two would disagree
   * about what cancelling does within a wave.
   */
  function RowMenu({ entry }: { entry: CalendarEntry }) {
    if (!entry.booking) return null;
    const booking = entry.booking;
    const settled = SETTLED.includes(booking.status);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t('rowActions')}
          className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-ink-tertiary hover:bg-sunken hover:text-ink"
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={`/admin/buchungen/${booking.id}`}>{t('rowOpen')}</Link>
          </DropdownMenuItem>
          {settled ? (
            <p className="px-2 py-1.5 text-xs text-ink-tertiary">{t('rowSettled')}</p>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <Link href={`/admin/buchungen/${booking.id}?action=reschedule`}>
                  <Clock className="size-4" aria-hidden />
                  {t('rowReschedule')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/buchungen/${booking.id}?action=cancel`}>
                  <X className="size-4" aria-hidden />
                  {t('rowCancel')}
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/kalender/karte" title={t('routeHint')}>
              <Map className="size-3.5" aria-hidden />
              {mapT('routeAction')}
            </Link>
          </Button>
          {/*
            A booking could only ever come out of a paid quote, so the job
            agreed on the phone had no way in — and /admin/buchungen printed a
            "Manuell" source label for a record nothing in the app could
            produce.
          */}
          <Button asChild size="sm">
            <Link href="/admin/kalender/neu">
              <Plus className="size-3.5" aria-hidden />
              {t('addAction')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('previous')}
            onClick={() => setCursor(addDays(cursor, -step))}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(startOfDay(now))}>
            {t('today')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('next')}
            onClick={() => setCursor(addDays(cursor, step))}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
          <span data-numeric className="ml-3 font-medium">
            {heading}
          </span>
        </div>

        <div role="tablist" aria-label={t('title')} className="flex gap-1">
          {(['day', 'week', 'month', 'agenda'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`calendar-tab-${value}`}
              aria-selected={view === value}
              aria-controls="calendar-panel"
              // Roving tabIndex: one stop for the whole strip, arrows move
              // between the views — the tab contract this was missing.
              tabIndex={view === value ? 0 : -1}
              onKeyDown={(e) => {
                const views = ['day', 'week', 'month', 'agenda'] as const;
                const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                if (delta === 0) return;
                e.preventDefault();
                const next = views[(views.indexOf(value) + delta + views.length) % views.length]!;
                setView(next);
                document.getElementById(`calendar-tab-${next}`)?.focus();
              }}
              onClick={() => setView(value)}
              className={cn(
                'rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
                view === value
                  ? 'bg-accent-subtle font-medium text-ink'
                  : 'text-ink-secondary hover:bg-sunken',
              )}
            >
              {t(`view${value.charAt(0).toUpperCase()}${value.slice(1)}` as 'viewDay')}
            </button>
          ))}
        </div>
      </div>

      {/*
        The legend and the colours it explains arrived together, and had to.
        Week and month drew every entry in one accent tone, so a legend would
        have described a distinction the grid did not make. Every swatch reads
        its tone from the status registry — the same call the badges make, so
        the two cannot disagree.
      */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setLegendOpen((v) => !v)}
          aria-expanded={legendOpen}
          aria-controls="calendar-legend"
          className="text-sm text-ink-secondary underline decoration-from-font underline-offset-4 hover:text-ink"
        >
          {legendOpen ? t('legendHide') : t('legendShow')}
        </button>
        {legendOpen && (
          <div
            id="calendar-legend"
            className="mt-3 grid gap-6 rounded-[var(--radius-md)] border border-line-subtle p-5 sm:grid-cols-3"
          >
            <div>
              <p className="label-type text-ink-tertiary">{t('legendJobs')}</p>
              <ul className="mt-2 space-y-1.5">
                {statesOf('booking').map((state) => (
                  <Swatch
                    key={state}
                    tone={statusTone('booking', state)}
                    label={bookingStatusT(state)}
                  />
                ))}
              </ul>
            </div>
            <div>
              <p className="label-type text-ink-tertiary">{t('legendEvents')}</p>
              <ul className="mt-2 space-y-1.5">
                {statesOf('calendarEvent').map((state) => (
                  <Swatch
                    key={state}
                    tone={statusTone('calendarEvent', state)}
                    label={eventStatusT(state)}
                  />
                ))}
              </ul>
            </div>
            <div>
              <p className="label-type text-ink-tertiary">{t('legendOther')}</p>
              <ul className="mt-2 space-y-1.5">
                <Swatch tone="progress" label={t('legendHold')} />
                <li className="flex items-center gap-2.5 text-sm">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full border border-line bg-sunken"
                  />
                  {t('legendClosure')}
                </li>
              </ul>
              <p className="mt-3 max-w-[var(--measure)] text-xs text-ink-tertiary">
                {t('legendHoldHint')}
              </p>
            </div>
          </div>
        )}
      </div>

      {conflicts.length > 0 && view !== 'month' && (
        <ul className="mt-6 space-y-2">
          {conflicts.map((conflict) => (
            <li
              key={`${conflict.a.id}-${conflict.b.id}`}
              className="flex gap-3 rounded-[var(--radius-md)] border border-status-warning-line bg-status-warning p-4 text-status-warning-fg"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">{t('conflictTitle')}</p>
                <p data-numeric className="mt-1 text-sm">
                  {t('conflictBody', {
                    a: nameOf(conflict.a.customerId),
                    b: nameOf(conflict.b.customerId),
                    available: Math.round(conflict.available),
                    needed: conflict.needed,
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div
        id="calendar-panel"
        role="tabpanel"
        aria-labelledby={`calendar-tab-${view}`}
        tabIndex={0}
      >
        {view === 'day' && (
          <section className="mt-8">
            <p data-numeric className="label-type text-ink-tertiary">
              {t('capacity', {
                used: today.entries.filter((e) => e.kind === 'booking').length,
                max: settings.maxJobsPerDay,
              })}
            </p>

            {/* Drawn here for the first time. Week and month have always shown
                closures; day answered "Nothing scheduled" for a day nobody was
                working, which reads as a day with room in it. */}
            {today.closure && (
              <ClosureNote
                title={t('closureTitle')}
                body={t('closureBody', { reason: today.closure.reason })}
              />
            )}

            {today.entries.length === 0
              ? !today.closure && (
                  <EmptyState
                    className="mt-4"
                    compact
                    title={t('emptyDayTitle')}
                    body={t('emptyDayBody')}
                    action={
                      <Button asChild variant="secondary">
                        <Link href="/admin/kalender/neu">{t('addAction')}</Link>
                      </Button>
                    }
                  />
                )
              : (
                  <ul className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
                    {today.entries.map((entry) => (
                      <li key={entry.id} className="flex items-center gap-3">
                        <EntryRow
                          entry={entry}
                          time={format.dateTime(entry.start, 'time')}
                          until={format.dateTime(entry.end, 'time')}
                        />
                        <RowMenu entry={entry} />
                      </li>
                    ))}
                  </ul>
                )}
          </section>
        )}

        {view === 'week' && (
          <section className="mt-8 overflow-x-auto">
            <div className="grid min-w-3xl grid-cols-6 gap-px bg-line-subtle">
              {weekDays.map((cell) => (
                <div key={cell.date.toISOString()} className="min-h-56 bg-page p-3">
                  <p className="label-type text-ink-tertiary">
                    {format.dateTime(cell.date, { weekday: 'short' })}
                  </p>
                  <p data-numeric className="mt-1 text-lg">
                    {format.dateTime(cell.date, { day: 'numeric' })}
                  </p>
                  {cell.closure ? (
                    <p className="mt-3 rounded-[var(--radius-sm)] bg-sunken p-2 text-xs text-ink-tertiary">
                      {t('closurePeriod')}
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-1.5">
                      {cell.entries.map((entry) => {
                        const chip = (
                          <>
                            <span data-numeric className="block font-medium">
                              {format.dateTime(entry.start, 'time')}
                            </span>
                            <span className="block truncate">{entryTitle(entry)}</span>
                          </>
                        );
                        return (
                          <li key={entry.id}>
                            {/* Coloured by state, not by "is a booking". Every
                                entry used to be bg-accent-subtle, which made a
                                cancelled job and a confirmed one identical at a
                                glance — the whole point of a week grid. */}
                            {entry.href ? (
                              <Link
                                href={entry.href}
                                className={cn(
                                  'block rounded-[var(--radius-sm)] p-2 text-xs transition-[filter] hover:brightness-97',
                                  TONE_CHIP[entry.tone],
                                )}
                              >
                                {chip}
                              </Link>
                            ) : (
                              <span
                                className={cn(
                                  'block rounded-[var(--radius-sm)] border border-dashed p-2 text-xs',
                                  TONE_CHIP[entry.tone],
                                )}
                              >
                                {chip}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <p data-numeric className="mt-4 text-sm text-ink-tertiary">
              {t('weekTotal', {
                count: weekJobs.length,
                hours: weekJobs.reduce((sum, e) => sum + (e.booking?.duration ?? 0), 0) / 60,
              })}
            </p>
          </section>
        )}

        {view === 'month' && (
          <section className="mt-8 overflow-x-auto">
            <div className="grid min-w-2xl grid-cols-7 gap-px bg-line-subtle">
              {Array.from({ length: 42 }, (_, i) => {
                const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
                const offset = (first.getDay() === 0 ? 7 : first.getDay()) - 1;
                const day = addDays(first, i - offset);
                const inMonth = day.getMonth() === cursor.getMonth();
                const cell = calendarDay(day, source);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      setCursor(day);
                      setView('day');
                    }}
                    className={cn(
                      'min-h-20 bg-page p-2 text-left transition-colors hover:bg-sunken',
                      !inMonth && 'opacity-40',
                      cell.closure && 'bg-sunken',
                    )}
                  >
                    <span data-numeric className="text-sm">
                      {day.getDate()}
                    </span>
                    {cell.closure ? (
                      <span className="mt-1 block text-[0.625rem] leading-tight text-ink-tertiary">
                        {t('closurePeriod')}
                      </span>
                    ) : (
                      cell.entries.length > 0 && (
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {cell.entries.map((entry) => (
                            <span
                              key={entry.id}
                              aria-hidden
                              className={cn(
                                'size-1.5 rounded-full',
                                TONE_DOT[entry.tone],
                                /* A held slot is not a job yet. Hollow rather
                                   than solid, so the month reads "spoken for"
                                   without claiming work is booked here. */
                                entry.kind === 'hold' && 'bg-transparent ring-1 ring-current',
                              )}
                            />
                          ))}
                        </span>
                      )
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {view === 'agenda' && (
          <section className="mt-8">
            {(() => {
              /* Built forward from the same day model rather than from a second
                 hand-rolled filter over bookings. That second filter is exactly
                 what lost the closures here. */
              const days = Array.from({ length: 60 }, (_, i) =>
                calendarDay(addDays(startOfDay(now), i), source),
              ).filter((d) => d.entries.length > 0 || d.closure);

              if (days.length === 0) {
                return <EmptyState title={t('emptyAgendaTitle')} body={t('emptyAgendaBody')} />;
              }

              return (
                <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                  {days.flatMap((day) =>
                    day.closure && day.entries.length === 0
                      ? [
                          <li key={`closed-${day.date.toISOString()}`} className="py-4">
                            <span data-numeric className="text-sm text-ink-tertiary">
                              {format.dateTime(day.date, 'dayMonth')}
                            </span>
                            <span className="mt-1 flex items-center gap-2 text-sm text-ink-secondary">
                              <CalendarOff className="size-3.5 shrink-0" aria-hidden />
                              {t('closurePeriod')}
                            </span>
                          </li>,
                        ]
                      : day.entries.map((entry) => (
                          <li key={entry.id} className="flex items-center gap-3">
                            <EntryRow
                              entry={entry}
                              time={format.dateTime(entry.start, 'dayMonth')}
                              until={format.dateTime(entry.start, 'time')}
                            />
                            <RowMenu entry={entry} />
                          </li>
                        )),
                  )}
                </ul>
              );
            })()}
          </section>
        )}
      </div>
    </div>
  );
}
