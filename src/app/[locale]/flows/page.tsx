import { setRequestLocale } from 'next-intl/server';
import { ArrowRight, Check, CircleDot, Plus } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import {
  ACTOR_LABEL,
  FLOWS,
  flowCounts,
  type ActionState,
  type FlowAction,
} from '@/lib/flow-registry';
import { cn } from '@/lib/cn';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = { title: 'Flow index' };

const MARK: Record<ActionState, { icon: typeof Check; className: string; label: string }> = {
  ok: { icon: Check, className: 'text-status-success-fg', label: 'Works' },
  added: { icon: Plus, className: 'text-ink-accent', label: 'Closed in this pass' },
  open: { icon: CircleDot, className: 'text-status-warning-fg', label: 'Open, on purpose' },
};

function Row({ action }: { action: FlowAction }) {
  const mark = MARK[action.state];
  const Icon = mark.icon;

  const body = (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className={cn('mt-0.5 size-4 shrink-0', mark.className)} aria-label={mark.label} />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block',
            action.state === 'added' && 'font-medium',
            action.href && 'group-hover:text-ink-accent',
          )}
        >
          {action.label}
        </span>
        {action.note && (
          <span className="mt-0.5 block max-w-[var(--measure)] text-[0.8125rem] leading-relaxed text-ink-secondary">
            {action.note}
          </span>
        )}
      </span>
      {action.href && (
        <ArrowRight
          className="mt-0.5 size-3.5 shrink-0 text-ink-tertiary opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      )}
    </div>
  );

  return (
    <li>
      {action.href ? (
        <Link
          href={action.href}
          className="group -mx-2 block rounded-[var(--radius-sm)] px-2 transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
        >
          {body}
        </Link>
      ) : (
        <div className="-mx-2 px-2">{body}</div>
      )}
    </li>
  );
}

function Column({ title, actions }: { title: string; actions: FlowAction[] }) {
  return (
    <div>
      <h3 className="label-type border-b border-line-subtle pb-2 text-ink-tertiary">{title}</h3>
      <ul className="mt-2 divide-y divide-line-subtle">
        {actions.map((action) => (
          <Row key={action.label} action={action} />
        ))}
      </ul>
    </div>
  );
}

/**
 * The flow board.
 *
 * /screens counts screens; this counts *ways through them*. The distinction is
 * the whole point: every screen in the contract existed and typechecked while
 * the customer list had no way to add a customer, three declared request states
 * were unreachable from any button, and a checked-out job had no exit.
 */
export default async function FlowsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const counts = flowCounts();

  return (
    <main className="mx-auto max-w-5xl px-gutter py-block">
      <header className="border-b border-line-subtle pb-block">
        <p className="label-type text-ink-tertiary">Delivery</p>
        <h1 className="display-type rule-accent mt-3 text-4xl sm:text-5xl">Flow index</h1>
        <p className="mt-6 max-w-[var(--measure)] text-ink-secondary">
          Every flow, the ways into it, what can be done inside, and how it ends. The
          exits column is the one that matters: a flow with fewer exits than the real
          world has outcomes is a flow that gets worked around by phone.
        </p>

        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <dt className="label-type text-ink-tertiary">Paths</dt>
            <dd data-numeric className="mt-1 text-3xl font-semibold">
              {counts.total}
            </dd>
          </div>
          <div>
            <dt className="label-type text-ink-tertiary">Closed in this pass</dt>
            <dd data-numeric className="mt-1 text-3xl font-semibold text-ink-accent">
              {counts.added}
            </dd>
          </div>
          <div>
            <dt className="label-type text-ink-tertiary">Open, on purpose</dt>
            <dd data-numeric className="mt-1 text-3xl font-semibold text-status-warning-fg">
              {counts.open}
            </dd>
          </div>
        </dl>

        <p className="mt-6 max-w-[var(--measure)] text-sm text-ink-secondary">
          Open items are listed with the reason they are open. None of them is an
          oversight — each one is a decision that needs an answer from the business
          before a button can honestly be drawn.
        </p>
      </header>

      <div className="space-y-block py-block">
        {FLOWS.map((flow) => (
          <section key={flow.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="display-type text-2xl">{flow.en}</h2>
              <span className="label-type text-ink-tertiary">{flow.de}</span>
            </div>

            <p className="mt-2 flex flex-wrap gap-1.5">
              {flow.actors.map((actor) => (
                <span
                  key={actor}
                  className="rounded-sm bg-sunken px-2 py-0.5 text-[0.6875rem] text-ink-secondary"
                >
                  {ACTOR_LABEL[actor]}
                </span>
              ))}
            </p>

            <div className="mt-6 grid gap-8 lg:grid-cols-3">
              <Column title="Entry" actions={flow.entries} />
              <Column title="Inside" actions={flow.actions} />
              <Column title="Exits" actions={flow.exits} />
            </div>
          </section>
        ))}
      </div>

      <footer className="border-t border-line-subtle pt-block">
        <p className="text-sm text-ink-secondary">
          Screen-by-screen delivery lives on{' '}
          <Link href="/screens" className="underline underline-offset-4">
            /screens
          </Link>
          ; the assumptions this prototype makes are on{' '}
          <Link href="/open-questions" className="underline underline-offset-4">
            /open-questions
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
