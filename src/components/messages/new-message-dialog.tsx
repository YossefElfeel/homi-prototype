'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Send } from 'lucide-react';

import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, Select, Textarea } from '@/components/ui/field';
import { mayInvoice } from '@/lib/invoice-permissions';
import { useAccount } from '@/lib/use-account';
import { useStore } from '@/mock/store';

/**
 * What a customer may open a conversation about.
 *
 * The four record types they already have a screen for — `other` from the
 * thread rail is deliberately not here: it is what the rail falls back to for
 * a reference it cannot place, not something anybody can choose to write to.
 */
export type ComposeKind = 'request' | 'offer' | 'booking' | 'invoice';

/** The order the customer meets these records in, not alphabetical. */
export const COMPOSE_KINDS: ComposeKind[] = ['request', 'offer', 'booking', 'invoice'];

export interface MessageTarget {
  /** The reference the thread will hang off — this *is* `subject`. */
  reference: string;
  /** What the reference is, in words. «O-2494-1» alone tells nobody anything. */
  detail: string;
}

export type MessageTargets = Record<ComposeKind, MessageTarget[]>;

/**
 * Everything in this account a message could be *about*.
 *
 * The one rule this has to keep is that a customer is never offered a record
 * they cannot otherwise see: a draft quote has not been sent and a draft
 * invoice carries a number that can still change, so writing to either would
 * mean naming a reference that appears on no screen of theirs. Both lists are
 * therefore narrowed exactly the way their own screens narrow them — the
 * invoice rule through `mayInvoice`, which is the same table the invoice
 * detail turns a typed-in draft id away with.
 */
export function useMessageTargets(): MessageTargets {
  const { requests, offers, bookings, invoices } = useAccount();
  const services = useStore((s) => s.services);
  const locale = useLocale() as Locale;
  const format = useFormatter();

  return useMemo(() => {
    const serviceName = (slug: string) =>
      services.find((s) => s.slug === slug)?.name[locale] ?? slug;
    const day = (iso?: string) => (iso ? format.dateTime(new Date(iso), 'short') : undefined);
    const detail = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' · ');

    return {
      request: [...requests]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((r) => ({
          reference: r.reference,
          detail: detail(serviceName(r.serviceSlug), day(r.createdAt)),
        })),
      offer: offers
        .filter((o) => o.status !== 'draft')
        .sort((a, b) => (b.issuedAt ?? '').localeCompare(a.issuedAt ?? ''))
        .map((o) => {
          /* A quote carries no service of its own — it prices the request it
             was written for, and that is the word the customer recognises. */
          const request = requests.find((r) => r.id === o.requestId);
          return {
            reference: o.reference,
            detail: detail(
              request ? serviceName(request.serviceSlug) : undefined,
              day(o.issuedAt),
            ),
          };
        }),
      booking: [...bookings]
        .sort((a, b) => b.start.localeCompare(a.start))
        .map((b) => ({
          reference: b.reference,
          detail: detail(serviceName(b.serviceSlug), day(b.start)),
        })),
      invoice: invoices
        .filter((i) => mayInvoice('read', 'customer', i.status))
        .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
        .map((i) => ({ reference: i.reference, detail: detail(day(i.issuedAt)) })),
    };
  }, [requests, offers, bookings, invoices, services, locale, format]);
}

/**
 * Screen 48 — starting the conversation, rather than only answering one.
 *
 * Every message in this system hangs off a reference, and until now only the
 * office could put the first one there. A customer with a question about their
 * invoice had a reply box under every conversation *except* the one that did
 * not exist yet — so the question went by phone, which is the outcome this
 * screen exists to avoid. The empty state said as much out loud: its only
 * action was a link away to the requests list.
 *
 * So the reference is chosen instead of typed, in two steps: what kind of
 * thing this is about, then which one. Typed would mean a customer copying
 * «RE-2026-0048» off a letter, and a typo there opens a thread hanging off a
 * record that does not exist — invisible to the office's own tabs, which file
 * by the same prefix.
 */
export function NewMessageDialog({
  open,
  targets,
  onClose,
  onSend,
}: {
  open: boolean;
  targets: MessageTargets;
  onClose: () => void;
  /**
   * Handed up rather than written from here. The screen behind already sends
   * the replies, and one writer is what keeps a new thread and an answer to an
   * existing one from acknowledging themselves differently.
   */
  onSend: (reference: string, body: string) => void;
}) {
  /*
   * Radix keeps the content mounted for the length of its exit animation, so
   * the body cannot be dropped on close — it would blank the dialog mid-fade.
   * It must not carry the last draft into the next open either, and a key that
   * changes on each open answers both. Adjusted during render rather than in
   * an effect, the same way the thread rail resets its page.
   */
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((n) => n + 1);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Body key={session} targets={targets} onClose={onClose} onSend={onSend} />
    </Dialog>
  );
}

function Body({
  targets,
  onClose,
  onSend,
}: {
  targets: MessageTargets;
  onClose: () => void;
  onSend: (reference: string, body: string) => void;
}) {
  const t = useTranslations('account.messages');
  const actionT = useTranslations('actions');

  /* Opening on a kind this customer has none of would make the first thing
     they see an explanation of why they cannot do anything. */
  const initial = COMPOSE_KINDS.find((k) => targets[k].length > 0) ?? 'request';
  const [kind, setKind] = useState<ComposeKind>(initial);
  const [reference, setReference] = useState(targets[initial][0]?.reference ?? '');
  const [body, setBody] = useState('');

  const options = targets[kind];

  function pickKind(next: ComposeKind) {
    setKind(next);
    /* The reference belongs to the kind above it. Left alone, sending would
       file an invoice question under the quote that was selected first. */
    setReference(targets[next][0]?.reference ?? '');
  }

  return (
    <DialogContent className="max-w-lg" closeLabel={actionT('close')}>
      <DialogHeader>
        <DialogTitle>{t('composeTitle')}</DialogTitle>
        <DialogDescription>{t('composeLead')}</DialogDescription>
      </DialogHeader>

      <Field label={t('composeKindLabel')}>
        {(props) => (
          <Select
            value={kind}
            onChange={(e) => pickKind(e.target.value as ComposeKind)}
            {...props}
          >
            {/*
              All four, including the ones with nothing under them — unlike the
              tabs behind this dialog, which only exist for kinds that have a
              thread. A tab that is absent is a tab you never look for; a
              missing choice here is a customer hunting for «Rechnung» and
              concluding the screen is broken. The count says which are worth
              opening before they open one.
            */}
            {COMPOSE_KINDS.map((k) => (
              <option key={k} value={k}>
                {`${t(`kind.${k}`)} (${targets[k].length})`}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {options.length === 0 ? (
        /* No action button with it: what fills this list is a request the
           customer makes, a quote we write, a job that is booked or an invoice
           we send — and three of those four are ours to do, so an action here
           could only ever point at the one they already know about. */
        <p className="mt-5 rounded-[var(--radius-sm)] bg-sunken p-4 text-sm text-ink-secondary">
          {t('composeEmptyKind', { kind: t(`kind.${kind}`) })}
        </p>
      ) : (
        <Field label={t('composeRefLabel')} hint={t('composeRefHint')} className="mt-5">
          {(props) => (
            <Select
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              {...props}
            >
              {options.map((option) => (
                <option key={option.reference} value={option.reference}>
                  {option.detail
                    ? `${option.reference} — ${option.detail}`
                    : option.reference}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      <Field label={t('composeBodyLabel')} className="mt-5">
        {(props) => (
          <Textarea
            {...props}
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('composeBodyPlaceholder')}
          />
        )}
      </Field>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          {actionT('cancel')}
        </Button>
        <Button
          disabled={!reference || !body.trim()}
          onClick={() => onSend(reference, body.trim())}
        >
          <Send className="size-4" aria-hidden />
          {t('send')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
