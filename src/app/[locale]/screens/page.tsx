import { setRequestLocale } from 'next-intl/server';
import { Check, Circle, CircleDot } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { TRACKS, screenCounts, type ScreenStatus } from '@/lib/screen-registry';
import { cn } from '@/lib/cn';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = { title: 'Screen index' };

const MARK: Record<ScreenStatus, { icon: typeof Check; className: string; label: string }> = {
  done: { icon: Check, className: 'text-status-success-fg', label: 'Built' },
  wip: { icon: CircleDot, className: 'text-status-progress-fg', label: 'In progress' },
  todo: { icon: Circle, className: 'text-ink-tertiary/40', label: 'Not started' },
};

/**
 * The delivery board. Every screen in the contract, its required states, and
 * whether it exists yet — so progress is checkable instead of asserted.
 */
export default async function ScreensPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const counts = screenCounts();

  return (
    <main className="mx-auto max-w-5xl px-gutter py-block">
      <header className="border-b border-line-subtle pb-block">
        <p className="label-type text-ink-tertiary">Delivery</p>
        <h1 className="display-type rule-accent mt-3 text-4xl sm:text-5xl">Screen index</h1>
        <p className="mt-6 max-w-[var(--measure)] text-ink-secondary">
          The 88 screens from the specification plus the 13 of the hiring track. States
          listed under a screen are the ones that must exist beyond the default — empty,
          error, and the variants the spec calls for.
        </p>
        <p data-numeric className="mt-6 text-3xl">
          <span className="font-semibold">{counts.done}</span>
          <span className="text-ink-tertiary"> / {counts.total}</span>
          <span className="ml-3 align-middle text-sm text-ink-secondary">built</span>
        </p>
      </header>

      <div className="space-y-block py-block">
        {TRACKS.map((track) => {
          const done = track.screens.filter((s) => s.status === 'done').length;
          return (
            <section key={track.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="display-type text-2xl">{track.en}</h2>
                <span data-numeric className="label-type text-ink-tertiary">
                  {done} / {track.screens.length}
                </span>
              </div>
              <p className="mt-1 mb-5 max-w-[var(--measure)] text-sm text-ink-secondary">
                {track.note}
              </p>

              <ul className="divide-y divide-line-subtle border-y border-line-subtle">
                {track.screens.map((screen) => {
                  const mark = MARK[screen.status];
                  const Icon = mark.icon;
                  const row = (
                    <div className="flex items-start gap-4 py-3">
                      <Icon
                        className={cn('mt-1 size-4 shrink-0', mark.className)}
                        aria-label={mark.label}
                      />
                      <span
                        data-numeric
                        className="label-type w-10 shrink-0 pt-0.5 text-ink-tertiary"
                      >
                        {screen.ref}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{screen.de}</span>
                        <span className="block text-sm text-ink-tertiary">{screen.en}</span>
                        {screen.states && (
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            {screen.states.map((state) => (
                              <span
                                key={state}
                                className="rounded-sm bg-sunken px-1.5 py-0.5 text-[0.6875rem] text-ink-secondary"
                              >
                                {state}
                              </span>
                            ))}
                          </span>
                        )}
                        {screen.note && (
                          <span className="mt-1.5 block max-w-[var(--measure)] text-[0.8125rem] text-ink-secondary italic">
                            {screen.note}
                          </span>
                        )}
                      </span>
                    </div>
                  );

                  return (
                    <li key={screen.ref}>
                      {screen.href ? (
                        <Link
                          href={screen.href}
                          className="block transition-colors hover:bg-sunken"
                        >
                          {row}
                        </Link>
                      ) : (
                        row
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
