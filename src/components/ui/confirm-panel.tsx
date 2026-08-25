'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

/**
 * The confirm step for a destructive action on a customer-facing screen.
 *
 * The brief's rule is that nothing irreversible happens on a single click, and
 * when this was written the prototype had no Dialog primitive — so the shape
 * became an inline danger-tinted panel replacing the button it came from.
 *
 * It has one now, and the admin panel has moved to it: see `ConfirmDialog`,
 * which is a modal, cannot open below the fold, and is the same control on
 * every screen. What is left here is the three places a customer withdraws
 * something of their own — a request, a quote, their account — and those were
 * deliberately not touched in that pass. Whether they should follow is a
 * question about the customer surfaces, not about this component.
 *
 * Presentational on purpose: the open/closed `useState` stays in the page, so
 * reading a screen still tells you whether it has a confirm step.
 *
 * `children` carries whatever the decision needs before it can be made — a
 * reason `Select`, a note `Textarea` — and renders between the body and the
 * buttons.
 */
export function ConfirmPanel({
  title,
  body,
  action,
  dismiss,
  onConfirm,
  onDismiss,
  disabled,
  className,
  children,
}: {
  title: string;
  body: string;
  /** Label for the destructive button. Name the act — never "OK". */
  action: string;
  dismiss: string;
  onConfirm: () => void;
  onDismiss: () => void;
  /** Blocks the confirm while a required reason is still empty. */
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-status-danger-line bg-status-danger p-4',
        className,
      )}
    >
      <h3 className="font-medium text-status-danger-fg">{title}</h3>
      <p className="mt-1.5 max-w-[var(--measure)] text-sm text-status-danger-fg">{body}</p>
      {children && <div className="mt-4">{children}</div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="danger" size="sm" onClick={onConfirm} disabled={disabled}>
          {action}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          {dismiss}
        </Button>
      </div>
    </div>
  );
}
