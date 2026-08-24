'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Loader2 } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea, Checkbox } from '@/components/ui/field';

type State = 'idle' | 'sending' | 'success';
type Errors = Partial<Record<'name' | 'email' | 'message' | 'consent', string>>;

/**
 * Screen 8 — the contact form, with all four states the spec asks for:
 * idle, sending, success, and per-field errors.
 *
 * Validation runs on submit and then live per field, so a visitor is never
 * scolded for a field they have not finished typing yet. Errors sit next to
 * the field they belong to, and the first invalid field takes focus — an error
 * summary at the top of the page alone is not enough.
 */
export function ContactForm() {
  const t = useTranslations('site.contact');
  const form = useTranslations('form');
  const [state, setState] = useState<State>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);

  function validate(data: FormData): Errors {
    const next: Errors = {};
    if (!String(data.get('name') ?? '').trim()) next.name = form('errorRequired');

    const email = String(data.get('email') ?? '').trim();
    if (!email) next.email = form('errorRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = form('errorEmail');

    if (!String(data.get('message') ?? '').trim()) next.message = form('errorRequired');
    if (!data.get('consent')) next.consent = form('errorRequired');
    return next;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = validate(data);
    setErrors(next);
    setTouched(true);

    if (Object.keys(next).length > 0) {
      const first = event.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.focus();
      return;
    }

    setState('sending');
    // Mock only — no request leaves the browser.
    window.setTimeout(() => setState('success'), 900);
  }

  function revalidate(event: React.FormEvent<HTMLFormElement>) {
    if (!touched) return;
    setErrors(validate(new FormData(event.currentTarget)));
  }

  if (state === 'success') {
    return (
      <div className="surface-card p-8">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-status-success text-status-success-fg">
          <Check className="size-5" aria-hidden />
        </span>
        <h2 className="subhead-type mt-5 text-2xl">{t('successTitle')}</h2>
        <p className="mt-3 text-ink-secondary">{t('successBody')}</p>
        <Button variant="secondary" className="mt-7" onClick={() => setState('idle')}>
          {t('successAgain')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onInput={revalidate} noValidate className="surface-card p-6 sm:p-8">
      <h2 className="subhead-type text-2xl">{t('formTitle')}</h2>

      <div className="mt-7 space-y-5">
        <Field label={t('fieldName')} error={errors.name}>
          {(props) => <Input name="name" autoComplete="name" {...props} />}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('fieldEmail')} error={errors.email}>
            {(props) => (
              <Input name="email" type="email" autoComplete="email" {...props} />
            )}
          </Field>
          <Field label={t('fieldPhone')} optional>
            {(props) => <Input name="phone" type="tel" autoComplete="tel" {...props} />}
          </Field>
        </div>

        <Field label={t('fieldSubject')} optional>
          {(props) => <Input name="subject" {...props} />}
        </Field>

        <Field label={t('fieldMessage')} error={errors.message}>
          {(props) => <Textarea name="message" {...props} />}
        </Field>

        <div>
          <Checkbox
            name="consent"
            value="yes"
            label={
              <>
                {t('consent')}{' '}
                <Link
                  href="/rechtliches/datenschutz"
                  className="underline decoration-from-font underline-offset-4"
                >
                  {t('consentLink')}
                </Link>
              </>
            }
          />
          {errors.consent && (
            <p className="mt-1.5 text-sm text-status-danger-fg">{errors.consent}</p>
          )}
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-8" disabled={state === 'sending'}>
        {state === 'sending' ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t('sending')}
          </>
        ) : (
          t('submit')
        )}
      </Button>
    </form>
  );
}
