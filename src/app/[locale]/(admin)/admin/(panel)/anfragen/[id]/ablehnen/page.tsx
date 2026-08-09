'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

const REASONS = ['reasonOutOfArea', 'reasonCapacity', 'reasonScope', 'reasonOther'] as const;

/**
 * Screen 56 — declining, with a reason.
 *
 * §4.1 requires a reason and, where there is one, an alternative. The lead
 * line says why out loud: a short no beats silence, and silence is what this
 * whole system exists to replace.
 *
 * The reason pre-fills the message so the common case is one click and send.
 */
export default function RejectRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.reject');
  const now = useNow();
  const hydrated = useHydrated();

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
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (!hydrated || !request) return <p className="text-ink-tertiary">…</p>;

  function submit() {
    setState('sending');
    window.setTimeout(() => {
      rejectRequest(
        request!.id,
        [t(reason), note, suggestion].filter(Boolean).join(' — '),
        now,
      );
      setState('sent');
    }, 800);
  }

  if (state === 'sent') {
    return (
      <div className="max-w-2xl">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-status-success text-status-success-fg">
          <Check className="size-6" aria-hidden />
        </span>
        <h1 className="display-type mt-7 text-3xl">{t('title')}</h1>
        <p className="mt-4 text-ink-secondary">{t('lead')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/anfragen">{t('cancel')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="link" className="mb-6">
        <Link href={`/admin/anfragen/${id}`}>
          <ArrowLeft className="size-4" aria-hidden />
          {request.reference}
        </Link>
      </Button>

      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-3 text-ink-secondary">{t('lead')}</p>

      <fieldset className="mt-8">
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

      <Field label={t('noteLabel')} hint={t('noteHint')} className="mt-8">
        {(props) => (
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} {...props} />
        )}
      </Field>

      <Field label={t('suggestLabel')} hint={t('suggestHint')} optional className="mt-6">
        {(props) => (
          <Textarea
            className="min-h-20"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            {...props}
          />
        )}
      </Field>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="danger" size="lg" onClick={submit} disabled={state === 'sending'}>
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
          <Link href={`/admin/anfragen/${id}`}>{t('cancel')}</Link>
        </Button>
      </div>
    </div>
  );
}
