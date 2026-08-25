'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { cn } from '@/lib/cn';

/**
 * The question in front of an irreversible step, as a popup.
 *
 * The panel had three shapes across the admin screens, and none of them was
 * the same control:
 *
 *  · `window.confirm` on eight actions — deleting a property, an invoice draft
 *    and a request draft, blocking and archiving a customer, resetting the
 *    whole demo. It is the browser's box, not the product's: it ignores every
 *    token in the theme, it cannot carry a reason field, its buttons say "OK"
 *    and "Cancel" in the *browser's* language rather than the screen's, and on
 *    a phone it is a system alert dropped over the app.
 *  · `ConfirmPanel`, an inline danger-tinted block that replaces the button it
 *    came from. Its own comment explains why — «this prototype has no Dialog
 *    primitive» — which stopped being true two waves later. Inline also means
 *    the confirm can land below the fold on a long screen: on the invoice the
 *    red panel opened underneath the QR-bill and the message box.
 *  · Two hand-written copies of that same block on the applicant screen.
 *
 * So the same decision looked different depending on which screen you were
 * standing on, and one of the three could not be styled, translated or given
 * the field it needed. This is the one shape: a modal, the reader's language,
 * the action named on its own button, and `children` for whatever the decision
 * needs answered before it can be made.
 *
 * `ConfirmPanel` stays for the customer-facing surfaces, which this pass does
 * not touch.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  action,
  dismiss,
  tone = 'danger',
  disabled = false,
  loading = false,
  onConfirm,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body?: React.ReactNode;
  /** Label for the confirming button. Name the act — never "OK". */
  action: string;
  dismiss: string;
  /**
   * `danger` for anything that destroys or withdraws, `default` for a step
   * that is merely hard to undo. It decides the button, not the whole box:
   * a modal painted red edge to edge shouts at a reader who has not agreed to
   * anything yet.
   */
  tone?: 'danger' | 'default';
  /** Blocks the confirm while a required answer below is still empty. */
  disabled?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  /** A reason `Textarea`, a `Select`, a summary of what is about to go. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={dismiss} className={cn('max-w-md', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2.5">
            {tone === 'danger' && (
              <AlertTriangle
                className="mt-0.5 size-5 shrink-0 text-status-danger-fg"
                aria-hidden
              />
            )}
            <span>{title}</span>
          </DialogTitle>
          {body && <DialogDescription>{body}</DialogDescription>}
        </DialogHeader>

        {children}

        <DialogFooter>
          {/* Dismiss first in the DOM so the keyboard reaches the way out
              before the irreversible one, and `autoFocus` on it for the same
              reason: a modal that opens with «löschen» focused turns a stray
              Enter into a deletion. */}
          <Button variant="ghost" autoFocus onClick={() => onOpenChange(false)}>
            {dismiss}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            disabled={disabled}
            loading={loading}
            onClick={onConfirm}
          >
            {action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The same dialog for a list, where the question is about one row.
 *
 * Every table that grew a destructive row action wrote the same three lines of
 * state: which row is pending, is the dialog open, and keep the row alive
 * while Radix animates the close. That last one is the part everybody gets
 * wrong — clearing the row on the click that dismisses blanks the dialog
 * mid-fade, so the reader watches the name they were about to delete
 * disappear from the sentence asking them to confirm it.
 *
 * `useConfirmTarget` holds the row and hands back an `open` flag that follows
 * it, with the last non-null value kept for the length of the exit.
 */
export function useConfirmTarget<T>() {
  const [target, setTarget] = useState<T | null>(null);
  const [shown, setShown] = useState<T | null>(null);
  if (target && target !== shown) setShown(target);

  return {
    /** The row being asked about — read this for the dialog's copy. */
    target: shown,
    open: target !== null,
    ask: setTarget,
    dismiss: () => setTarget(null),
  };
}

/**
 * «Abbrechen» in the reader's language.
 *
 * Ten dialogs would otherwise each reach into their own namespace for the same
 * word. That is already how the way out of a confirm ended up reading
 * «Abbrechen» on the invoice, «Behalten» on the customer's own withdrawal and
 * «Schliessen» on the service catalogue — three answers to «how do I get out of
 * this», one per screen. The local `dismiss` keys stay where other dialogs
 * still use them; what changes is that a confirm no longer invents its own.
 */
export function useDismissLabel() {
  return useTranslations('actions')('cancel');
}
