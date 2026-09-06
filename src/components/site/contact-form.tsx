'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea, Checkbox } from '@/components/ui/field';
import { useNow, useStore } from '@/mock/store';

type State = 'idle' | 'sending';
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
  const router = useRouter();
  const now = useNow();
  const submitEnquiry = useStore((st) => st.submitEnquiry);
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
    /*
     * The message is written down now.
     *
     * This was `setTimeout(() => router.push('/thank-you'))` with a comment saying
     * no request leaves the browser — true, and it left the office with
     * nothing. /thank-you tells the visitor we answer within 24 hours, so the form
     * was making a promise about a message that existed for 900ms in a closure
     * and then did not exist at all. The reference goes into the URL because
     * a promise you cannot quote back is not one somebody can chase.
     */
    const { reference } = submitEnquiry(
      {
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        phone: String(data.get('phone') ?? ''),
        subject: String(data.get('subject') ?? ''),
        message: String(data.get('message') ?? ''),
        consent: Boolean(data.get('consent')),
      },
      now,
    );
    window.setTimeout(() => router.push(`/thank-you?ref=${reference}`), 600);
  }

  function revalidate(event: React.FormEvent<HTMLFormElement>) {
    if (!touched) return;
    setErrors(validate(new FormData(event.currentTarget)));
  }

  /*
   * Success is /thank-you, not a panel drawn in place.
   *
   * Screen 12 exists for exactly this moment and nothing reached it: the form
   * confirmed inline, so the one place that tells a visitor what happens next
   * — the three numbered steps, and when to expect an answer — was a URL you
   * had to know. Two designs for one moment, and the shorter one won by
   * default. The «send another» button goes with the panel; /contact is one
   * click away, and a second message is the rarer case than wanting to know
   * whether anyone will call back.
   */
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
                  href="/legal/datenschutz"
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
