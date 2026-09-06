'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ExternalLink, Info } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { useFormatter } from '@/i18n/format';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, useConfirmTarget, useDismissLabel } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import { isReleased, pairWorks, unpairablePhotos, type Work } from '@/lib/gallery';
import { useHydrated, useStore } from '@/mock/store';

type Tab = 'released' | 'waiting' | 'unpairable';
const TABS: Tab[] = ['released', 'waiting', 'unpairable'];

/**
 * Screen 85 — «Unsere Arbeiten», from the office.
 *
 * /work has always been driven by `publishConsent`, and that flag had
 * exactly one writer: the customer's own request page, where they tick or
 * untick it. So the office could see what was on the marketing site and could
 * not change it — and «die Kundin hat am Telefon zugestimmt» had nowhere to go
 * except a developer.
 *
 * The screen is built around the pair rather than the photograph, because the
 * pair is what the customer agreed to and what the website shows. Releasing one
 * half is not half a work; it is one photograph published without permission.
 *
 * The third tab exists to answer a question the other two cannot: «warum ist
 * der Einsatz vom Dienstag nicht dabei?». Two honest reasons — the crew took a
 * context shot that was never meant for the site, or the partner photograph was
 * never taken — and both are better on screen than in somebody's head.
 */
export default function AdminGalleryPage() {
  const t = useTranslations('admin.gallery');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();
  const dismissLabel = useDismissLabel();

  const photos = useStore((s) => s.data.photos);
  const bookings = useStore((s) => s.data.bookings);
  const customers = useStore((s) => s.data.customers);
  const services = useStore((s) => s.services);
  const setWorkReleased = useStore((s) => s.setWorkReleased);

  const [tab, setTab] = useState<Tab>('released');
  const releasing = useConfirmTarget<Work>();

  const works = useMemo(() => pairWorks(photos, bookings), [photos, bookings]);
  const loose = useMemo(() => unpairablePhotos(photos), [photos]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const released = works.filter(isReleased);
  const waiting = works.filter((w) => !isReleased(w));
  const count = (id: Tab) =>
    id === 'released' ? released.length : id === 'waiting' ? waiting.length : loose.length;

  const nameOf = (work: Work) => {
    const c = customers.find((x) => x.id === work.customerId);
    return c ? `${c.firstName} ${c.lastName}` : t('unknownCustomer');
  };
  const serviceOf = (work: Work) => {
    const s = services.find((x) => x.slug === work.serviceSlug);
    return s ? (s.name[locale] ?? s.name.de) : t('unknownService');
  };

  function WorkCard({ work }: { work: Work }) {
    const on = isReleased(work);
    return (
      <li className="surface-card p-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-medium">{serviceOf(work)}</span>
          <span className="text-sm text-ink-secondary">{nameOf(work)}</span>
          <span data-numeric className="ms-auto text-sm text-ink-tertiary">
            {format.dateTime(new Date(work.takenAt), 'short')}
          </span>
        </div>

        {/* Both halves, side by side and the same size. The public page shows
            them as a slider; here they are two pictures to be judged, and a
            slider would make the office drag a handle to see what it is
            deciding about. */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(['before', 'after'] as const).map((half) => (
            <figure key={half} className="overflow-hidden rounded-[var(--radius-sm)] bg-sunken">
              <Image
                src={work[half].src}
                alt=""
                width={480}
                height={360}
                className="aspect-[4/3] w-full object-cover"
              />
              <figcaption className="label-type px-3 py-2 text-ink-tertiary">
                {t(half)}
              </figcaption>
            </figure>
          ))}
        </div>

        {work.before.note && (
          <p className="mt-3 text-sm text-ink-secondary">{work.before.note}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant={on ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => releasing.ask(work)}
          >
            {on ? t('withdraw') : t('release')}
          </Button>
          {on && (
            <Button asChild variant="ghost" size="sm">
              <a href="/work" target="_blank" rel="noreferrer">
                {t('viewOnSite')}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </Button>
          )}
          {work.customerId && (
            <Link
              href={`/admin/customers/${work.customerId}`}
              className="ms-auto text-sm text-ink-accent hover:underline"
            >
              {t('openCustomer')}
            </Link>
          )}
        </div>
      </li>
    );
  }

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} />

      {/* §20.6 is the whole frame for this screen, so it is stated once at the
          top rather than implied by a switch. */}
      <Alert tone="info" className="mt-6" title={t('consentTitle')} icon={Info}>
        {t('consentBody')}
      </Alert>

      {works.length === 0 && loose.length === 0 ? (
        <EmptyState
          className="mt-6"
          headingLevel={2}
          title={t('emptyTitle')}
          body={t('emptyBody')}
        />
      ) : (
        <>
          <div
            role="tablist"
            aria-label={t('title')}
            className="mt-6 flex flex-wrap gap-1 border-b border-line"
          >
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`gal-tab-${id}`}
                aria-selected={tab === id}
                aria-controls="gal-panel"
                tabIndex={tab === id ? 0 : -1}
                onKeyDown={(e) => {
                  const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                  if (delta === 0) return;
                  e.preventDefault();
                  const next = TABS[(TABS.indexOf(id) + delta + TABS.length) % TABS.length]!;
                  setTab(next);
                  document.getElementById(`gal-tab-${next}`)?.focus();
                }}
                onClick={() => setTab(id)}
                className={cn(
                  '-mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 py-2 text-sm transition-colors',
                  tab === id
                    ? 'border-accent font-medium text-ink'
                    : 'border-transparent text-ink-secondary hover:border-line-strong hover:text-ink',
                )}
              >
                {t(`tab${id.charAt(0).toUpperCase()}${id.slice(1)}` as 'tabReleased')}
                <span
                  data-numeric
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs',
                    tab === id ? 'bg-accent-subtle text-ink' : 'bg-sunken text-ink-tertiary',
                  )}
                >
                  {count(id)}
                </span>
              </button>
            ))}
          </div>

          <div id="gal-panel" role="tabpanel" aria-labelledby={`gal-tab-${tab}`} tabIndex={0}>
            {tab === 'unpairable' ? (
              loose.length === 0 ? (
                <EmptyState className="mt-4" compact headingLevel={2} title={t('looseEmptyTitle')} body={t('looseEmptyBody')} />
              ) : (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {loose.map(({ photo, reason }) => (
                    <li key={photo.id} className="surface-card overflow-hidden">
                      <Image
                        src={photo.src}
                        alt=""
                        width={480}
                        height={360}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <div className="p-4">
                        <p className="text-sm font-medium">
                          {t(`reason.${reason}` as 'reason.context')}
                        </p>
                        <p className="mt-1 text-sm text-ink-secondary">
                          {t(`reasonBody.${reason}` as 'reasonBody.context')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : (
              (() => {
                const list = tab === 'released' ? released : waiting;
                if (list.length === 0) {
                  return (
                    <EmptyState
                      className="mt-4"
                      compact
                      headingLevel={2}
                      title={t(tab === 'released' ? 'releasedEmptyTitle' : 'waitingEmptyTitle')}
                      body={t(tab === 'released' ? 'releasedEmptyBody' : 'waitingEmptyBody')}
                    />
                  );
                }
                return (
                  <ul className="mt-4 grid gap-4 lg:grid-cols-2">
                    {list.map((work) => (
                      <WorkCard key={work.bookingId} work={work} />
                    ))}
                  </ul>
                );
              })()
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={releasing.open}
        onOpenChange={(open) => !open && releasing.dismiss()}
        title={
          releasing.target && isReleased(releasing.target)
            ? t('withdrawTitle')
            : t('releaseTitle')
        }
        body={
          releasing.target && isReleased(releasing.target)
            ? t('withdrawBody')
            : t('releaseBody', { name: releasing.target ? nameOf(releasing.target) : '' })
        }
        action={
          releasing.target && isReleased(releasing.target) ? t('withdraw') : t('release')
        }
        dismiss={dismissLabel}
        onConfirm={() => {
          const work = releasing.target;
          if (!work) return;
          const next = !isReleased(work);
          releasing.dismiss();
          setWorkReleased(work.bookingId, next);
          toast.success(next ? t('releaseDone') : t('withdrawDone'));
        }}
      />
    </div>
  );
}
