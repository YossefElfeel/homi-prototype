'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { OfferShell } from '@/components/offer/offer-shell';
import { useOffer } from '@/components/offer/use-offer';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { RevisionReason } from '@/mock/schema';
import { cn } from '@/lib/cn';

/**
 * The four buttons, each carrying the key it stores.
 *
 * The label used to be the whole record: `submit` sent `` `${t(reason)}: ${message}` ``
 * and the key was thrown away at the call site. So what reached the office was
 * the customer's *language*, and «Der Leistungsumfang» could not be shown as a
 * chip, counted, or read by anybody working in English. The key travels beside
 * the message now, and each screen looks up its own label.
 */
const REASONS = [
  { key: 'price', label: 'reasonPrice' },
  { key: 'scope', label: 'reasonScope' },
  { key: 'date', label: 'reasonDate' },
  { key: 'other', label: 'reasonOther' },
] as const satisfies readonly { key: RevisionReason; label: string }[];

/**
 * Screen 29 — negotiation.
 *
 * §20.1 says a change request produces a new version and voids the current
 * one. The copy is careful about the order: the current quote stays valid
 * until the replacement arrives, so asking a question never costs the customer
 * the price they already have.
 */
export default function ChangePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('offer.change');
  const hydrated = useHydrated();

  const data = useOffer(id);
  const settings = useStore((s) => s.settings);
  const requestOfferChange = useStore((s) => s.requestOfferChange);
  const now = useNow();

  const [reason, setReason] = useState<RevisionReason>('price');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (!hydrated) return <div className="p-gutter text-ink-tertiary">…</div>;
  if (!data) return null;
  const { offer } = data;

  function submit() {
    setState('sending');
    window.setTimeout(() => {
      requestOfferChange(offer.id, reason, message, now);
      setState('sent');
    }, 900);
  }

  if (state === 'sent') {
    return (
      <OfferShell offer={offer}>
        <div className="max-w-2xl">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-status-success text-status-success-fg">
            <Check className="size-6" aria-hidden />
          </span>
          <h1 className="display-type mt-7 text-[clamp(2.25rem,3.6vw,2.75rem)]">
            {t('sentTitle')}
          </h1>
          <p className="mt-4 text-lg text-ink-secondary">
            {t('sentBody', { hours: settings.responseTimeHours })}
          </p>
          <Button asChild variant="secondary" className="mt-8">
            <Link href={`/offerte/${offer.id}`}>
              <ArrowLeft className="size-4" aria-hidden />
              {t('back')}
            </Link>
          </Button>
        </div>
      </OfferShell>
    );
  }

  return (
    <OfferShell offer={offer}>
      <div className="max-w-2xl">
        <h1 className="display-type text-[clamp(2.25rem,3.6vw,2.75rem)]">{t('title')}</h1>
        <p className="mt-4 text-ink-secondary">{t('lead')}</p>

        <fieldset className="mt-8">
          <legend className="mb-3 text-sm font-medium">{t('reasonLabel')}</legend>
          <div className="flex flex-wrap gap-2">
            {REASONS.map(({ key, label }) => (
              <label
                key={key}
                className={cn(
                  'cursor-pointer rounded-[var(--radius-action)] border px-4 py-2.5 text-sm transition-colors',
                  reason === key
                    ? 'border-line-strong bg-accent-subtle'
                    : 'border-line hover:bg-sunken',
                )}
              >
                <input
                  type="radio"
                  name="reason"
                  className="sr-only"
                  checked={reason === key}
                  onChange={() => setReason(key)}
                />
                {t(label)}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label={t('messageLabel')} hint={t('messageHint')} className="mt-8">
          {(props) => (
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              {...props}
            />
          )}
        </Field>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={submit} disabled={!message.trim() || state === 'sending'}>
            {state === 'sending' ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t('submitting')}
              </>
            ) : (
              t('submit')
            )}
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href={`/offerte/${offer.id}`}>{t('back')}</Link>
          </Button>
        </div>
      </div>
    </OfferShell>
  );
}
