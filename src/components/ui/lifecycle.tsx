import { Check, Circle, Dot, X } from 'lucide-react';

import { cn } from '@/lib/cn';

export type StageState =
  /** Reached and passed. */
  | 'done'
  /** Where the record is now. */
  | 'current'
  /** Not reached yet. */
  | 'pending'
  /** Reached, and the answer was no — declined, cancelled, expired. */
  | 'failed'
  /** Legitimately never happened: a request answered without a quote. */
  | 'skipped';

export interface Stage {
  key: string;
  label: string;
  /** Rendered under the label. Usually a timestamp. */
  detail?: React.ReactNode;
  state: StageState;
}

const DOT: Record<StageState, { icon: typeof Check; ring: string; icon_: string }> = {
  done: { icon: Check, ring: 'bg-accent', icon_: 'text-on-accent' },
  current: {
    icon: Dot,
    ring: 'bg-accent ring-4 ring-accent-quiet',
    icon_: 'text-on-accent',
  },
  pending: { icon: Circle, ring: 'bg-sunken', icon_: 'text-ink-tertiary' },
  failed: {
    icon: X,
    ring: 'bg-status-danger ring-4 ring-status-danger',
    icon_: 'text-status-danger-fg',
  },
  skipped: { icon: Circle, ring: 'bg-sunken', icon_: 'text-ink-tertiary' },
};

/**
 * Where a record has got to, and where it can still go.
 *
 * `StepRail` is the wizard's, and it cannot say this: it only moves forward and
 * only ever succeeds. A request has outcomes — declined, withdrawn, expired —
 * and drawing those as "step 4 of 4, complete" is worse than drawing nothing,
 * because the shape says finished-well when the record says finished-badly.
 *
 * So `failed` is a state of its own, and it stops the rail rather than
 * completing it: everything after a failed stage stays `pending` and greyed,
 * which is the truth — those things are not going to happen now.
 *
 * A list, not a nav: these are facts about a record, not places to go.
 */
export function Lifecycle({
  stages,
  label,
  className,
  orientation = 'vertical',
}: {
  stages: Stage[];
  label: string;
  className?: string;
  /**
   * `horizontal` when the rail is the header of a record rather than an item
   * in its sidebar — it reads left to right like the process it describes and
   * the whole run is visible before any of the detail. It scrolls sideways
   * rather than wrapping: eight stages folded onto two lines stop being a
   * sequence and start being a grid.
   */
  orientation?: 'vertical' | 'horizontal';
}) {
  if (orientation === 'horizontal') {
    return <LifecycleRow stages={stages} label={label} className={className} />;
  }

  return (
    <ol aria-label={label} className={cn('space-y-0', className)}>
      {stages.map((stage, i) => {
        const mark = DOT[stage.state];
        const Icon = mark.icon;
        const last = i === stages.length - 1;
        /* The connector belongs to the stage above it and takes its colour from
           whether *that* stage was reached — so the line stops where the record
           stopped, instead of running on to a stage nothing ever reached. */
        const connectorLit = stage.state === 'done';

        return (
          <li key={stage.key} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  mark.ring,
                )}
              >
                <Icon
                  className={cn(
                    stage.state === 'current' ? 'size-4' : 'size-3.5',
                    mark.icon_,
                  )}
                  aria-hidden
                />
              </span>
              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    'w-0.5 flex-1 rounded-full',
                    connectorLit ? 'bg-accent' : 'bg-line-subtle',
                  )}
                />
              )}
            </span>

            <span className={cn('min-w-0 flex-1', last ? 'pb-0' : 'pb-5')}>
              <span
                className={cn(
                  'block text-sm',
                  stage.state === 'current' && 'font-medium text-ink',
                  stage.state === 'done' && 'text-ink',
                  stage.state === 'failed' && 'font-medium text-status-danger-fg',
                  (stage.state === 'pending' || stage.state === 'skipped') &&
                    'text-ink-tertiary',
                )}
              >
                {stage.label}
              </span>
              {stage.detail && (
                <span data-numeric className="mt-0.5 block text-xs text-ink-tertiary">
                  {stage.detail}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function LifecycleRow({
  stages,
  label,
  className,
}: {
  stages: Stage[];
  label: string;
  className?: string;
}) {
  return (
    /* The scroller, not the list, owns the overflow — `overflow-x` on the `ol`
       would clip the `current` dot's ring against its own edge. */
    <div className={cn('-mx-1 overflow-x-auto px-1 pb-1', className)}>
      <ol aria-label={label} className="flex min-w-max items-start">
        {stages.map((stage, i) => {
          const mark = DOT[stage.state];
          const Icon = mark.icon;
          const last = i === stages.length - 1;
          const connectorLit = stage.state === 'done';

          return (
            <li
              key={stage.key}
              className={cn('flex min-w-0 flex-col', !last && 'flex-1')}
            >
              <span className="flex items-center">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full',
                    mark.ring,
                  )}
                >
                  <Icon
                    className={cn(
                      stage.state === 'current' ? 'size-4' : 'size-3.5',
                      mark.icon_,
                    )}
                    aria-hidden
                  />
                </span>
                {!last && (
                  <span
                    aria-hidden
                    className={cn(
                      'mx-1.5 h-0.5 w-14 flex-1 rounded-full',
                      connectorLit ? 'bg-accent' : 'bg-line-subtle',
                    )}
                  />
                )}
              </span>

              <span className={cn('mt-2 block', !last && 'pe-4')}>
                <span
                  className={cn(
                    'block text-sm',
                    stage.state === 'current' && 'font-medium text-ink',
                    stage.state === 'done' && 'text-ink',
                    stage.state === 'failed' && 'font-medium text-status-danger-fg',
                    (stage.state === 'pending' || stage.state === 'skipped') &&
                      'text-ink-tertiary',
                  )}
                >
                  {stage.label}
                </span>
                {stage.detail && (
                  <span data-numeric className="mt-0.5 block text-xs text-ink-tertiary">
                    {stage.detail}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
