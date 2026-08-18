'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, Textarea } from '@/components/ui/field';
import { useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

const REASONS = ['reasonOutOfArea', 'reasonCapacity', 'reasonScope', 'reasonOther'] as const;

/**
 * Screen 56 — declining, with a reason. §4.1 requires the reason and, where
 * there is one, an alternative: a short no beats silence, and silence is what
 * this whole system exists to replace.
 *
 * It used to be a page of its own at `/admin/anfragen/[id]/ablehnen`, which
 * made saying no cost a navigation away from the queue, a form, and a
 * navigation back. The decision is small and the queue is the context it is
 * made in — so it is a dialog, and the row it belongs to stays on screen
 * behind it. `?action=reject` on the request opens the same dialog, so the
 * step is still linkable without being a screen.
 */
export function RejectRequestDialog({
  requestId,
  onClose,
}: {
  /** The request being declined, or `null` when the dialog is shut. */
  requestId: string | null;
  onClose: () => void;
}) {
  /*
   * Radix keeps the content mounted for the length of its exit animation, so
   * the id has to outlive the close — dropping the body on the click that
   * dismisses it would blank the dialog mid-fade.
   */
  const [shown, setShown] = useState(requestId);
  if (requestId && requestId !== shown) setShown(requestId);

  return (
    <Dialog
      open={Boolean(requestId)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* Keyed on the request, so opening this on a second one starts from
          that request's own default reason rather than the last one's. */}
      {shown && <Body key={shown} id={shown} onClose={onClose} />}
    </Dialog>
  );
}

function Body({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations('admin.reject');
  const actionT = useTranslations('actions');
  const now = useNow();

  const requests = useStore((s) => s.data.requests);
  const properties = useStore((s) => s.data.properties);
  const rejectRequest = useStore((s) => s.rejectRequest);

  const request = requests.find((r) => r.id === id);
  const property = properties.find((p) => p.id === request?.propertyId);

  const [reason, setReason] = useState<(typeof REASONS)[number]>(
    request?.outOfArea ? 'reasonOutOfArea' : 'reasonCapacity',
  );
  const [note, setNote] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [sending, setSending] = useState(false);

  if (!request) return null;

  function submit() {
    setSending(true);
    window.setTimeout(() => {
      rejectRequest(id, [t(reason), note, suggestion].filter(Boolean).join(' — '), now);
      /*
       * The page this replaced ended on a confirmation screen whose only
       * forward action was a link back to where you already were. Here the
       * answer is behind the overlay — the row's status flips to «declined»
       * as the dialog closes — so the confirmation is a toast, not a screen.
       */
      toast.success(t('sentTitle'), { description: t('sentBody') });
      onClose();
    }, 800);
  }

  return (
    <DialogContent
      className="max-w-xl"
      closeLabel={actionT('close')}
      showClose={!sending}
      /* Nothing dismisses a send in flight — the request would be declined
         anyway and the dialog would not be there to say so. */
      onEscapeKeyDown={(e) => {
        if (sending) e.preventDefault();
      }}
      onInteractOutside={(e) => {
        if (sending) e.preventDefault();
      }}
    >
      <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>{t('lead')}</DialogDescription>
      </DialogHeader>

      <fieldset>
        <legend className="mb-3 text-sm font-medium">{t('reasonLabel')}</legend>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((value) => (
            <label
              key={value}
              className={cn(
                'cursor-pointer rounded-[var(--radius-action)] border px-4 py-2.5 text-sm transition-colors',
                reason === value
                  ? 'border-line-strong bg-accent-subtle'
                  : 'border-line hover:bg-sunken',
              )}
            >
              <input
                type="radio"
                name="reason"
                className="sr-only"
                checked={reason === value}
                onChange={() => setReason(value)}
              />
              {t(value)}
            </label>
          ))}
        </div>
        {request.outOfArea && property && (
          <p data-numeric className="mt-3 text-sm text-status-warning-fg">
            {property.postcode} {property.city}
          </p>
        )}
      </fieldset>

      <Field label={t('noteLabel')} hint={t('noteHint')} className="mt-6">
        {(props) => (
          <Textarea
            className="min-h-24"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            {...props}
          />
        )}
      </Field>

      <Field label={t('suggestLabel')} hint={t('suggestHint')} optional className="mt-5">
        {(props) => (
          <Textarea
            className="min-h-20"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            {...props}
          />
        )}
      </Field>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={sending}>
          {t('cancel')}
        </Button>
        <Button variant="danger" onClick={submit} disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
