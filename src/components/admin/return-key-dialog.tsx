'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useFormatter } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, Input, Textarea } from '@/components/ui/field';
import { StatusBadge } from '@/components/ui/status-badge';
import { useNow, useStore } from '@/mock/store';

/** The `YYYY-MM-DD` an `<input type="date">` speaks, in the local day. */
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Screen 68a — handing a key back.
 *
 * The other half of §13.2, and until now the half with no screen. Taking a key
 * in asked for three things and wrote a record; giving it back was a button in
 * the table that flipped the row to «Zurückgegeben» on the click, stamped the
 * current time and asked nothing. So the closed record could not answer either
 * question anyone actually asks about a key that has left the cupboard — who
 * carried it out, and who signed for it — and the click that closed it was
 * irreversible with no confirm in front of it.
 *
 * It is a dialog rather than a screen for the same reason declining a request
 * is: the decision is small, and the row it belongs to is the context it is
 * made in. What it is not is a bare `window.confirm`, because there are four
 * things to record and a confirm can only take a yes.
 */
export function ReturnKeyDialog({
  keyId,
  onClose,
}: {
  /** The key being handed back, or `null` when the dialog is shut. */
  keyId: string | null;
  onClose: () => void;
}) {
  /* Radix keeps the content mounted for the length of its exit animation, so
     the id has to outlive the close — dropping the body on the dismissing
     click would blank the dialog mid-fade. */
  const [shown, setShown] = useState(keyId);
  if (keyId && keyId !== shown) setShown(keyId);

  return (
    <Dialog
      open={Boolean(keyId)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* Keyed on the key, so opening this on a second one starts from that
          key's own defaults rather than the last one's. */}
      {shown && <Body key={shown} id={shown} onClose={onClose} />}
    </Dialog>
  );
}

function Body({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations('admin.keys');
  const actionT = useTranslations('actions');
  const format = useFormatter();
  const now = useNow();

  const keyLog = useStore((s) => s.data.keyLog);
  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const returnKey = useStore((s) => s.returnKey);

  const entry = keyLog.find((k) => k.id === id);
  const property = properties.find((p) => p.id === entry?.propertyId);
  const customer = customers.find((c) => c.id === property?.customerId);
  const customerName = customer ? `${customer.firstName} ${customer.lastName}` : '';

  const today = dayKey(now);
  const [day, setDay] = useState(today);
  /* Whoever took the key in is the likeliest person to be standing there
     handing it back, and the customer is the likeliest person to be taking
     it — so both fields start filled and get corrected rather than typed. */
  const [returnedBy, setReturnedBy] = useState(entry?.receivedBy ?? '');
  const [returnedTo, setReturnedTo] = useState(customerName);
  const [note, setNote] = useState('');

  if (!entry) return null;

  const takenOn = new Date(entry.receivedAt);
  const heldDays = Math.max(0, Math.round((now.getTime() - takenOn.getTime()) / 86_400_000));

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    /* The chosen day carries no time, so today keeps the real clock and any
       earlier day lands at midday — near enough for a column that prints a
       date, and never a return timestamped before the handover it closes. */
    const at = day === today ? now : new Date(`${day}T12:00:00`);

    const closed = returnKey(id, {
      returnedAt: at.toISOString(),
      returnedBy: returnedBy.trim(),
      returnedTo: returnedTo.trim(),
      returnNote: note.trim() || undefined,
    });

    if (!closed) {
      /* The store re-checks rather than trusting this dialog: the menu item is
         only offered on a held key, and a second tab could have handed the
         same one back between the render and the click. */
      toast.error(t('returnRaceToast'));
      onClose();
      return;
    }

    toast.success(t('returnDone'), {
      description: t('returnDoneBody', { to: returnedTo.trim() }),
    });
    onClose();
  }

  return (
    <DialogContent className="max-w-xl" closeLabel={actionT('close')}>
      <DialogHeader>
        <DialogTitle>{t('returnTitle')}</DialogTitle>
        <DialogDescription>{t('returnLead')}</DialogDescription>
      </DialogHeader>

      {/*
        The record as it stands, before it is closed.

        Without it the dialog is four empty boxes over an unnamed key: the menu
        it opened from is gone, and «Fach 3» is not a thing anyone recognises
        out of context. It also carries the one number that makes the handover
        checkable at the door — how long we have had it.
      */}
      <div className="rounded-[var(--radius-md)] border border-line-subtle bg-sunken p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">{property?.label || property?.street || '—'}</p>
            <p className="text-sm text-ink-tertiary">{customerName || '—'}</p>
          </div>
          <StatusBadge entity="key" state={entry.status} size="sm" />
        </div>
        <dl className="mt-3 space-y-1 text-sm">
          <SummaryRow label={t('colStorage')}>{entry.storageLocation}</SummaryRow>
          <SummaryRow label={t('colReceived')}>
            <span data-numeric>{format.dateTime(takenOn, 'short')}</span>
            <span className="text-ink-tertiary"> · {t('heldFor', { days: heldDays })}</span>
          </SummaryRow>
          <SummaryRow label={t('colBy')}>{entry.receivedBy}</SummaryRow>
        </dl>
      </div>

      <form onSubmit={submit}>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label={t('returnDateLabel')}>
            {(props) => (
              <Input
                {...props}
                type="date"
                required
                value={day}
                /* A key cannot go back before it arrived, and nobody hands one
                   over next Tuesday — both bounds are real, so the control
                   carries them rather than a message explaining them after the
                   fact. */
                min={dayKey(takenOn)}
                max={today}
                onChange={(e) => setDay(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('returnedByLabel')} hint={t('returnedByHint')}>
            {(props) => (
              <Input
                {...props}
                required
                value={returnedBy}
                onChange={(e) => setReturnedBy(e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label={t('returnedToLabel')} hint={t('returnedToHint')} className="mt-5">
          {(props) => (
            <Input
              {...props}
              required
              value={returnedTo}
              onChange={(e) => setReturnedTo(e.target.value)}
            />
          )}
        </Field>

        <Field label={t('returnNoteLabel')} hint={t('returnNoteHint')} optional className="mt-5">
          {(props) => (
            <Textarea
              {...props}
              className="min-h-20"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
        </Field>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('dismiss')}
          </Button>
          <Button type="submit">{t('returnSubmit')}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-ink-tertiary">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
