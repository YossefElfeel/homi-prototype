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
  Filter,
  MapPin,
  Phone,
  Plus,
  X,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  addDays,
  bookingsOnDay,
  detectRouteConflicts,
  startOfDay,
} from '@/mock/engines/availability';
import { businessWeekday, fromZoned, zonedParts } from '@/lib/business-time';
import {
  calendarDay,
  TONE_CHIP,
  TONE_DOT,
  type CalendarDay,
  type CalendarEntry,
} from '@/lib/calendar-entries';
import { statesOf, statusTone, type StatusTone } from '@/lib/status-registry';
import { ActionIcon } from '@/lib/action-icons';
import type { CalendarEventKind } from '@/mock/schema';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

type View = 'day' | 'week' | 'month' | 'agenda';

const EVENT_ICON: Record<CalendarEventKind, typeof Phone> = {
  'contact-call': Phone,
  'follow-up': Phone,
  viewing: MapPin,
};

/** How many entries a month cell prints before it starts counting instead. */
const MONTH_CELL_LIMIT = 3;

function kindKey(kind: CalendarEventKind) {
  return kind === 'contact-call'
    ? ('kindContactCall' as const)
    : kind === 'follow-up'
      ? ('kindFollowUp' as const)
      : ('kindViewing' as const);
}

/**
 * One row per *colour*, not one row per state.
 *
 * The legend listed all nine booking states down a column, and six of the
 * nine share a dot with another one — «Geplant» and «Verrechnet» are the same
 * blue, «Kein Zutritt» and «Storniert» the same red. Nine rows to explain six
 * colours is three rows a reader has to compare and then discard, and in a
 * side card it was the tallest thing on the screen.
 *
 * Derived from the registry rather than written out, so a state whose tone
 * changes moves rows on its own instead of leaving the legend lying.
 */
function toneRows(
  entity: 'booking' | 'calendarEvent',
  label: (state: string) => string,
): { tone: StatusTone; label: string }[] {
  const byTone = new Map<StatusTone, string[]>();
  for (const state of statesOf(entity)) {
    const tone = statusTone(entity, state);
    byTone.set(tone, [...(byTone.get(tone) ?? []), label(state)]);
  }
  return [...byTone].map(([tone, labels]) => ({ tone, label: labels.join(' · ') }));
}

/**
 * A legend row — and, where the colour belongs to something the calendar
 * actually draws, the control that keeps only it.
 *
 * The legend answered "what does grey mean" and nothing else, which is half a
 * question: the owner reads it because they are looking *for* the grey ones,
 * and then had to find them by eye across a month grid. A row that explains a
 * colour is already the natural place to click on it.
 *
 * `onToggle` is optional because one row is not a filter. Betriebsferien is a
 * property of the day, not an entry in it, so there is nothing to keep.
 */
function Swatch({
  tone,
  label,
  pressed,
  onToggle,
}: {
  tone: StatusTone;
  label: string;
  pressed?: boolean;
  onToggle?: () => void;
}) {
  const dot = (
    <span
      aria-hidden
      className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', TONE_DOT[tone])}
    />
  );

  if (!onToggle) {
    return (
      <li className="flex items-start gap-2.5 px-2 py-1 text-sm">
        {dot}
        <span className="min-w-0">{label}</span>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        aria-pressed={pressed}
        onClick={onToggle}
        className={cn(
          'flex w-full items-start gap-2.5 rounded-[var(--radius-sm)] px-2 py-1 text-start text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
          pressed ? 'bg-accent-subtle font-medium text-ink' : 'hover:bg-sunken',
        )}
      >
        {dot}
        <span className="min-w-0">{label}</span>
      </button>
    </li>
  );
}

function ClosureNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-[var(--radius-md)] border border-line bg-sunken p-4">
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
 * What a day *contains* comes from `lib/calendar-entries`. Four views each
 * filtering the source data by hand is how they drift, and this screen had
 * already drifted that way once.
 *
 * The grid is a card now, and the legend is the card beside it. Both were
 * bare-on-page before: the week and month grids floated as hairlines on the
 * page background with nothing holding them, and the legend was a disclosure
 * that pushed the whole calendar down the screen every time it was opened —
 * so the thing it explains scrolled out of view exactly when you needed both.
 */
export default function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = use(searchParams);
  const t = useTranslations('admin.calendar');
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
  const [filters, setFilters] = useState<string[]>([]);
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

  /*
     `getDay()` reads the *browser's* weekday; everything else on this screen —
     `startOfDay`, `addDays`, every rendered time — is bound to Europe/Zurich.
     The two agree only for a reviewer whose clock is at or ahead of Zurich.
     Behind it, Zurich midnight on Monday is still Sunday evening locally, and
     the week grid opened on the wrong six days.
   */
  const weekStart = useMemo(() => {
    const d = startOfDay(cursor);
    return addDays(d, 1 - businessWeekday(d));
  }, [cursor]);

  /* Same mix, and this one was visible: the grid was built from
     `new Date(year, month, 1)` and labelled with `getDate()`, both local, while
     the entries in each cell came from `calendarDay` in Zurich. An hour east of
     Zurich that puts every day's entries under the *next* day's number — which
     nobody caught while a cell drew nothing but coloured dots. */
  const monthAnchor = useMemo(() => zonedParts(cursor), [cursor]);
  const monthFirst = useMemo(
    () => fromZoned(monthAnchor.year, monthAnchor.month, 1),
    [monthAnchor],
  );
  const monthOffset = businessWeekday(monthFirst) - 1;

  const conflicts = useMemo(
    () => detectRouteConflicts(cursor, bookings, properties),
    [cursor, bookings, properties],
  );

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  /**
   * ‹ and ›, one view at a time.
   *
   * Month stepped by *thirty days*, which is not a month. It looked right most
   * of the year and skipped February outright: from 31 January, +30 lands on
   * 2 March, so the owner pressed "next" once and never saw the month in
   * between. Thirty-one-day months drifted the cursor backwards a day at a
   * time until an eleven-month year could double back on itself.
   *
   * Month now moves to the first of the neighbouring month — `fromZoned` takes
   * month 0 and month 13 and normalises them into the year on either side, so
   * December → January needs no special case. Landing on the 1st rather than
   * keeping the day-of-month is deliberate: it is the only date guaranteed to
   * exist in every month, and it is where a month view is looking anyway.
   */
  function shift(direction: -1 | 1) {
    if (view !== 'month') {
      setCursor(addDays(cursor, direction * (view === 'week' ? 7 : 1)));
      return;
    }
    const p = zonedParts(cursor);
    setCursor(fromZoned(p.year, p.month + direction, 1));
  }

  /*
   * The legend, as a filter.
   *
   * Keyed by kind *and* tone. A cancelled job and a cancelled call are both
   * grey and the legend lists them under two different headings — one key per
   * colour would have made the two rows do the same thing.
   *
   * A row can carry more than one state, because the legend merges states that
   * share a dot: «Kein Zutritt» and «Storniert» are one row, so they are one
   * filter. Splitting them here would filter by something the calendar does
   * not draw, and the owner would be selecting a distinction they cannot see.
   */
  const filtering = filters.length > 0;
  const entryKey = (entry: CalendarEntry) =>
    entry.kind === 'hold' ? 'hold' : `${entry.kind}:${entry.tone}`;
  const toggle = (key: string) =>
    setFilters((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    );

  /* Applied to a day after it is built, never inside `calendarDay`. The
     capacity line and the week total count what the day and the week hold —
     filtering the source they read would have both of them report the filter
     back as if it were the schedule. */
  const onlyPicked = (day: CalendarDay): CalendarDay =>
    filtering
      ? { ...day, entries: day.entries.filter((e) => filters.includes(entryKey(e))) }
      : day;

  const todayFull = calendarDay(cursor, source);
  const today = onlyPicked(todayFull);

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

  /** What a grid cell says under the time. A month cell is narrow, so this is
      the one line that has to survive truncation. */
  const entryLine = (entry: CalendarEntry) => {
    if (entry.booking) return serviceName(entry.booking.serviceSlug);
    if (entry.event) return eventT(kindKey(entry.event.kind));
    return t('holdTitle');
  };

  /*
   * One date shape for the whole strip.
   *
   * Day printed «Donnerstag, 20. August 2026» and week printed «Montag,
   * 17. August – Samstag, 22. August» — two different date formats one click
   * apart, and the week one dropped the year entirely, which is exactly the
   * field you need when you have paged four months forward.
   */
  const heading =
    view === 'month'
      ? format.dateTime(cursor, { month: 'long', year: 'numeric' })
      : view === 'week'
        ? `${format.dateTime(weekStart, 'dayDate')} – ${format.dateTime(addDays(weekStart, 5), 'dayDate')}`
        : format.dateTime(cursor, 'dayDate');

  const weekDays = Array.from({ length: 6 }, (_, i) =>
    onlyPicked(calendarDay(addDays(weekStart, i), source)),
  );
  /* Off `bookingsOnDay`, not off the drawn entries. The grid draws closed jobs
     now, and «6 Einsätze · 24 Std.» is a claim about the week's *work* — a job
     that finished and was paid for a fortnight ago is not part of it. */
  const weekJobs = Array.from({ length: 6 }, (_, i) =>
    bookingsOnDay(addDays(weekStart, i), bookings),
  ).flat();

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
        className="flex flex-1 items-center gap-5 py-3"
      >
        {body}
      </Link>
    );
  }

  /**
   * One entry inside a week or month cell.
   *
   * Month used to draw a coloured dot per entry, which answers "is there
   * something that day" and nothing else — the owner had to click into every
   * busy-looking square to find out whether it was a five-minute call or a
   * six-hour job. Same chip as the week grid, one size down.
   */
  function CellChip({ entry, dense = false }: { entry: CalendarEntry; dense?: boolean }) {
    const body = (
      <>
        <span data-numeric className="block font-medium">
          {format.dateTime(entry.start, 'time')}
        </span>
        <span className="block truncate">{entryTitle(entry)}</span>
        {/* The month cell stops at the name; the week cell has the width for
            the service too, and the service is what tells a job from a call. */}
        {!dense && <span className="block truncate opacity-80">{entryLine(entry)}</span>}
      </>
    );

    const shape = cn(
      'block rounded-[var(--radius-sm)]',
      dense ? 'p-1.5 text-[0.6875rem] leading-tight' : 'p-2 text-xs',
      TONE_CHIP[entry.tone],
    );

    /* Coloured by state, not by "is a booking" — a cancelled job and a
       confirmed one used to be identical at a glance, which is the whole
       point of a grid. */
    return entry.href ? (
      <Link href={entry.href} className={cn(shape, 'transition-[filter] hover:brightness-97')}>
        {body}
      </Link>
    ) : (
      <span className={cn(shape, 'border border-dashed')}>{body}</span>
    );
  }

  /**
   * What was a ⋯ menu at the end of every row.
   *
   * The menu held three items, then two, then one: reschedule left for the
   * bookings list, cancel left because calling a job off is a decision with a
   * confirmation panel behind it and not something to reach past a day's
   * entries for. A dropdown whose only item opens the record is two clicks
   * charging for one — and on a settled job it opened onto a grey sentence
   * explaining why it was empty.
   *
   * So: the eye, the same glyph every table in the panel uses for "this row's
   * own record". The row is still a link, and this is the visible affordance
   * saying so — a whole row that happens to be clickable does not announce it.
   *
   * Week and month keep the chip on its own. There is no room beside an entry
   * three words wide, and the chip *is* the link.
   */
  function DetailsLink({ entry }: { entry: CalendarEntry }) {
    /* A held slot has no record to open — the quote exists, the job does not. */
    if (!entry.href) return null;

    return (
      <Link
        href={entry.href}
        title={t('rowOpen')}
        aria-label={t('rowOpen')}
        className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-ink-tertiary transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
      >
        <ActionIcon.open className="size-4" aria-hidden />
      </Link>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        actions={
          /*
            «Tagesroute» sat here and is gone, along with the screen behind it.
            Two jobs a day is not a route, and a second button next to the one
            action this screen actually has made the primary one harder to find.
          */
          <Button asChild>
            <Link href="/admin/kalender/neu">
              <Plus className="size-4" aria-hidden />
              {t('addAction')}
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('previous')}
            onClick={() => shift(-1)}
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
            onClick={() => shift(1)}
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

      {conflicts.length > 0 && view !== 'month' && (
        <ul className="mt-app space-y-2">
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

      {filtering && (
        /* The legend is a side card, and a side card is *below* the grid on a
           narrow screen — so the only thing saying "you are not seeing
           everything" would sit exactly where nobody is looking when a week
           comes up half empty. */
        <div className="mt-app flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-line-subtle bg-sunken px-4 py-2.5 text-sm">
          <Filter className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
          <span className="text-ink-secondary">{t('filterActive')}</span>
          <Button size="sm" variant="ghost" className="ms-auto" onClick={() => setFilters([])}>
            <X className="size-3.5" aria-hidden />
            {t('filterClear')}
          </Button>
        </div>
      )}

      {/*
        Was 9/12 and 3/12. A twelfth is a *proportion*, so the legend grew with
        the window — on a wide screen a column of six short labels was taking
        close to four hundred pixels off the grid beside it, which is the one
        thing on this screen that can actually use them. The legend needs a
        fixed reading width and nothing more; everything else goes to the
        calendar.
      */}
      <div className="gap-app mt-app grid lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div
          id="calendar-panel"
          role="tabpanel"
          aria-labelledby={`calendar-tab-${view}`}
          tabIndex={0}
          className="flex min-w-0 flex-col"
        >
          {view === 'day' && (
            /* `flex-1`, because a day with two entries left the card ending a
               third of the way down a legend that runs the full height — two
               panels side by side, one of them stopping for no reason the
               reader can see. */
            <Card pad="none" className="flex-1">
              <div className="p-card">
                <p data-numeric className="label-type text-ink-tertiary">
                  {t('capacity', {
                    /* The same question the scheduler asks, asked the same
                       way — `todayFull.entries` would now count a job that
                       closed months ago against today's ceiling. */
                    used: bookingsOnDay(cursor, bookings).length,
                    max: settings.maxJobsPerDay,
                  })}
                </p>

                {/* Week and month have always shown closures; day answered
                    "Nothing scheduled" for a day nobody was working, which
                    reads as a day with room in it. */}
                {today.closure && (
                  <div className="mt-4">
                    <ClosureNote
                      title={t('closureTitle')}
                      body={t('closureBody', { reason: today.closure.reason })}
                    />
                  </div>
                )}

                {today.entries.length === 0 &&
                  !today.closure &&
                  /* «Nichts geplant» over a day the filter emptied is a lie
                     with a button under it: it would send the owner to enter
                     an appointment into a day that is already full. */
                  (filtering ? (
                    <EmptyState
                      className="mt-4"
                      compact
                      title={t('filterEmptyTitle')}
                      body={t('filterEmptyBody')}
                      action={
                        <Button variant="secondary" onClick={() => setFilters([])}>
                          {t('filterClear')}
                        </Button>
                      }
                    />
                  ) : (
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
                  ))}
              </div>

              {today.entries.length > 0 && (
                <ul className="divide-y divide-line-subtle border-t border-line-subtle px-card">
                  {today.entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 transition-colors hover:bg-sunken"
                    >
                      <EntryRow
                        entry={entry}
                        time={format.dateTime(entry.start, 'time')}
                        until={format.dateTime(entry.end, 'time')}
                      />
                      <DetailsLink entry={entry} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {view === 'week' && (
            <Card pad="none" className="flex flex-1 flex-col overflow-hidden">
              <div className="overflow-x-auto">
                <div className="grid min-w-3xl grid-cols-6 gap-px bg-line-subtle">
                  {weekDays.map((cell) => (
                    <div key={cell.date.toISOString()} className="min-h-56 bg-card p-3">
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
                          {cell.entries.map((entry) => (
                            <li key={entry.id}>
                              <CellChip entry={entry} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p data-numeric className="mt-auto border-t border-line-subtle p-card text-sm text-ink-tertiary">
                {t('weekTotal', {
                  count: weekJobs.length,
                  hours: weekJobs.reduce((sum, b) => sum + b.duration, 0) / 60,
                })}
              </p>
            </Card>
          )}

          {view === 'month' && (
            <Card pad="none" className="flex-1 overflow-hidden">
              <div className="overflow-x-auto">
                <div className="grid min-w-2xl grid-cols-7 gap-px bg-line-subtle">
                  {Array.from({ length: 42 }, (_, i) => {
                    const day = addDays(monthFirst, i - monthOffset);
                    const parts = zonedParts(day);
                    const inMonth = parts.month === monthAnchor.month;
                    const cell = onlyPicked(calendarDay(day, source));
                    const shown = cell.entries.slice(0, MONTH_CELL_LIMIT);
                    const hidden = cell.entries.length - shown.length;

                    return (
                      /*
                        The cell was one big button that jumped to the day view.
                        It cannot stay one now that the entries inside it are
                        links — a link inside a button is markup no browser
                        agrees on. The date is the button; the entries open
                        themselves.
                      */
                      <div
                        key={day.toISOString()}
                        className={cn(
                          'min-h-32 bg-card p-2',
                          !inMonth && 'opacity-40',
                          cell.closure && 'bg-sunken',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setCursor(day);
                            setView('day');
                          }}
                          className="rounded-[var(--radius-xs)] px-1 text-sm transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
                        >
                          <span data-numeric>{parts.day}</span>
                        </button>

                        {cell.closure ? (
                          <span className="mt-1 block text-[0.625rem] leading-tight text-ink-tertiary">
                            {t('closurePeriod')}
                          </span>
                        ) : (
                          cell.entries.length > 0 && (
                            <>
                              <ul className="mt-1 space-y-1">
                                {shown.map((entry) => (
                                  <li key={entry.id}>
                                    <CellChip entry={entry} dense />
                                  </li>
                                ))}
                              </ul>
                              {hidden > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCursor(day);
                                    setView('day');
                                  }}
                                  data-numeric
                                  className="mt-1 rounded-[var(--radius-xs)] px-1 text-[0.625rem] text-ink-tertiary underline decoration-from-font underline-offset-2 hover:text-ink"
                                >
                                  {t('monthMore', { count: hidden })}
                                </button>
                              )}
                            </>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {view === 'agenda' && (
            <Card pad="none" className="flex-1">
              {(() => {
                /* Built forward from the same day model rather than from a
                   second hand-rolled filter over bookings. That second filter
                   is exactly what lost the closures here. */
                const days = Array.from({ length: 60 }, (_, i) =>
                  onlyPicked(calendarDay(addDays(startOfDay(now), i), source)),
                ).filter(
                  /* A shutdown earns a row because it explains the gap after
                     it — but not under a filter, where sixty days of
                     Betriebsferien would bury the four entries that matched. */
                  (d) => d.entries.length > 0 || (Boolean(d.closure) && !filtering),
                );

                if (days.length === 0) {
                  return (
                    <div className="p-card">
                      {filtering ? (
                        <EmptyState
                          compact
                          title={t('filterEmptyTitle')}
                          body={t('filterEmptyBody')}
                          action={
                            <Button variant="secondary" onClick={() => setFilters([])}>
                              {t('filterClear')}
                            </Button>
                          }
                        />
                      ) : (
                        <EmptyState
                          compact
                          title={t('emptyAgendaTitle')}
                          body={t('emptyAgendaBody')}
                        />
                      )}
                    </div>
                  );
                }

                return (
                  <ul className="divide-y divide-line-subtle px-card">
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
                            <li
                              key={entry.id}
                              className="flex items-center gap-3 transition-colors hover:bg-sunken"
                            >
                              <EntryRow
                                entry={entry}
                                time={format.dateTime(entry.start, 'dayMonth')}
                                until={format.dateTime(entry.start, 'time')}
                              />
                              <DetailsLink entry={entry} />
                            </li>
                          )),
                    )}
                  </ul>
                );
              })()}
            </Card>
          )}
        </div>

        {/*
          The legend and the colours it explains arrived together, and had to.
          Every swatch reads its tone from the status registry — the same call
          the badges make, so the two cannot disagree.

          It was a disclosure above the grid: opening it shoved the calendar
          down by its own height, so the colours and the thing they explain
          were never on screen together. Beside the grid it costs nothing to
          leave open.
        */}
        <aside className="min-w-0">
          <Card className="lg:sticky lg:top-4">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <h2 className="label-type text-ink-tertiary">{t('legendTitle')}</h2>
              {filtering && (
                <Button size="sm" variant="ghost" onClick={() => setFilters([])}>
                  {t('filterClear')}
                </Button>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-tertiary">{t('legendFilterHint')}</p>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-medium">{t('legendJobs')}</p>
                {/* Pulled out by the button's own padding, so turning the rows
                    into controls did not shift the dots off the card's
                    left edge. */}
                <ul className="-mx-2 mt-2 space-y-0.5">
                  {toneRows('booking', (state) => bookingStatusT(state)).map((row) => (
                    <Swatch
                      key={row.tone}
                      tone={row.tone}
                      label={row.label}
                      pressed={filters.includes(`booking:${row.tone}`)}
                      onToggle={() => toggle(`booking:${row.tone}`)}
                    />
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium">{t('legendEvents')}</p>
                <ul className="-mx-2 mt-2 space-y-0.5">
                  {toneRows('calendarEvent', (state) => eventStatusT(state)).map((row) => (
                    <Swatch
                      key={row.tone}
                      tone={row.tone}
                      label={row.label}
                      pressed={filters.includes(`event:${row.tone}`)}
                      onToggle={() => toggle(`event:${row.tone}`)}
                    />
                  ))}
                </ul>
              </div>

              {/*
                «Übriges» stood here — a reserved slot and a company holiday.
                Both explain themselves in the grid without a swatch: a held
                slot is the only dashed chip on the screen and carries the
                words «Reservierte Zeit», and a closed day prints
                «Betriebsferien» across the cell. A legend group exists to
                decode a colour that says nothing on its own, and neither of
                those two ever needed decoding.
              */}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
