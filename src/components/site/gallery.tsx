'use client';

import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { BeforeAfter } from '@/components/site/before-after';
import { EmptyState } from '@/components/ui/empty-state';
import { useHydrated, useStore } from '@/mock/store';
import { SEED_SERVICES } from '@/mock/seed';
import type { Locale } from '@/i18n/routing';
import type { Photo } from '@/mock/schema';

/** How many works a visitor gets before asking for more. */
const PAGE = 6;

interface Work {
  id: string;
  before: Photo;
  after: Photo;
  /** The service the job was booked as. The photos do not carry one, so it is
      joined through the booking they belong to. */
  serviceSlug: string | undefined;
}

/**
 * Screens 5 and 6 — the gallery grid and the expanded single work.
 *
 * §20.6: photos are internal by default and only appear here with recorded
 * written consent. So the empty state is not an edge case — it is what the
 * page shows the day nobody has signed one, and it has to explain *why* it is
 * empty rather than look broken. It is reached from the control that governs
 * it: a customer turning consent off on their own request — the «Vorher /
 * Nachher» card on /konto/anfragen/[id] — empties this page.
 *
 * Each work is a slider rather than two frames side by side. See `BeforeAfter`
 * for why: half-width frames a gutter apart make the reader align the two
 * pictures themselves, which is the work the component is supposed to do.
 *
 * The grid filters by service and pages. Somebody landing here is rarely asking
 * "show me everything" — they are asking "what does a move-out clean look
 * like", and an undifferentiated grid gave them no way to ask the narrower
 * question.
 *
 * Both controls are driven by the consent that exists, never by a fixed list of
 * services. Section 20.6 governs what may appear here, so a chip for a service
 * with no released work would advertise photographs the business is not allowed
 * to show. The row lists only services with something behind them and hides
 * itself below two, and "show more" appears only when there is genuinely more.
 */
export function Gallery() {
  const t = useTranslations('site.gallery');
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const photos = useStore((s) => s.data.photos);
  const bookings = useStore((s) => s.data.bookings);
  const [open, setOpen] = useState<Work | null>(null);
  const [service, setService] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);

  const works = useMemo(() => {
    const consented = hydrated ? photos.filter((p) => p.publishConsent) : [];
    const out: Work[] = [];
    for (const photo of consented) {
      if (photo.kind !== 'before' || !photo.bookingId) continue;
      const after = consented.find((p) => p.bookingId === photo.bookingId && p.kind === 'after');
      if (!after) continue;
      const booking = bookings.find((b) => b.id === photo.bookingId);
      out.push({ id: photo.bookingId, before: photo, after, serviceSlug: booking?.serviceSlug });
    }
    return out;
  }, [hydrated, photos, bookings]);

  /* One entry per service that has released work, in the catalogue's order so
     the row reads like every other service list on the site. */
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const work of works) {
      if (!work.serviceSlug) continue;
      counts.set(work.serviceSlug, (counts.get(work.serviceSlug) ?? 0) + 1);
    }
    return SEED_SERVICES.filter((entry) => counts.has(entry.slug)).map((entry) => ({
      slug: entry.slug,
      name: entry.name[locale],
      count: counts.get(entry.slug) ?? 0,
    }));
  }, [works, locale]);

  const filtered = service ? works.filter((work) => work.serviceSlug === service) : works;
  const visible = filtered.slice(0, shown);

  if (works.length === 0) {
    return (
      <EmptyState
        // Sits directly under the page title, with no section heading between.
        headingLevel={2}
        title={t('emptyTitle')}
        body={t('emptyBody')}
        action={
          <Button asChild>
            <Link href="/anfrage">{t('emptyCta')}</Link>
          </Button>
        }
      />
    );
  }

  const choose = (slug: string | null) => {
    setService(slug);
    /* Paging resets with the filter. Carrying "show 12" into a category with
       three works leaves the button hidden and the count wrong. */
    setShown(PAGE);
  };

  return (
    <>
      {/* One service is not a choice, so the row only earns its space at two. */}
      {categories.length > 1 && (
        <div className="mb-8">
          <h2 className="label-type text-ink-tertiary">{t('filterLabel')}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <FilterChip active={service === null} onClick={() => choose(null)}>
              {t('filterAll')} <Count>{works.length}</Count>
            </FilterChip>
            {categories.map((category) => (
              <FilterChip
                key={category.slug}
                active={service === category.slug}
                onClick={() => choose(category.slug)}
              >
                {category.name} <Count>{category.count}</Count>
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((work, i) => (
          <li key={work.id}>
            <BeforeAfter
              beforeSrc={work.before.src}
              afterSrc={work.after.src}
              alt={work.after.note ?? t('title')}
              beforeLabel={t('before')}
              afterLabel={t('after')}
              sliderLabel={`${t('compare')} — ${work.after.note ?? ''}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              // The first tile is above the fold on this page and was loading
              // lazily; the rest are not, and marking them all would have four
              // photographs competing for the same early bandwidth.
              priority={i === 0}
              className="aspect-4/3 rounded-[var(--radius-lg)]"
            />
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-sm text-ink-secondary">{work.before.note}</p>
              {/* A separate control, because the slider already owns every
                  pixel of the picture. A card that both slides and opens on
                  click would do the wrong one of the two every time. */}
              <button
                type="button"
                onClick={() => setOpen(work)}
                className="label-type shrink-0 text-ink-accent underline-offset-4 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
              >
                {t('expand')}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Only when there is more. A button that pages nothing is a dead end
          dressed as an affordance. */}
      {visible.length < filtered.length && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
            {t('showMore')}
          </Button>
          <p aria-live="polite" className="label-type text-ink-tertiary">
            {t('showingCount', { shown: visible.length, total: filtered.length })}
          </p>
        </div>
      )}

      <Dialog.Root open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--brand-navy-900)]/85" />
          <Dialog.Content className="fixed inset-4 z-50 flex flex-col overflow-auto rounded-[var(--radius-lg)] bg-page p-6 sm:inset-8 lg:inset-16">
            <div className="flex items-start justify-between gap-6">
              <div>
                <Dialog.Title className="subhead-type text-2xl">
                  {open?.before.note ?? t('title')}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-ink-secondary">
                  {t('compareHint')}
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label={t('close')}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-sunken"
              >
                <X className="size-5" aria-hidden />
              </Dialog.Close>
            </div>

            {open && (
              <BeforeAfter
                beforeSrc={open.before.src}
                afterSrc={open.after.src}
                alt={open.after.note ?? t('title')}
                beforeLabel={t('before')}
                afterLabel={t('after')}
                sliderLabel={`${t('compare')} — ${open.after.note ?? ''}`}
                sizes="(max-width: 1024px) 92vw, 80vw"
                className="mt-6 min-h-0 flex-1 rounded-[var(--radius-md)]"
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

/**
 * A filter chip.
 *
 * Deliberately not `ui/chip.tsx`. That component is static by contract — "an
 * interactive chip is a button" is written into it — and this one is a button
 * that also reports whether it is the current filter, which is what
 * `aria-pressed` is for.
 */
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ' +
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus ' +
        (active
          ? 'border-transparent bg-accent text-on-accent'
          : 'border-line text-ink hover:border-line-strong hover:bg-sunken')
      }
    >
      {children}
    </button>
  );
}

/** The tally inside a chip, dimmed so the service name stays the label. */
function Count({ children }: { children: React.ReactNode }) {
  return (
    <span data-numeric className="opacity-60">
      {children}
    </span>
  );
}
