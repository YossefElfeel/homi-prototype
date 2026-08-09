'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Mail } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

/**
 * Screen 34 — resetting a password.
 *
 * The confirmation is deliberately non-committal: "if that account exists".
 * Saying "no account found" would turn this form into a way of checking
 * whether a given person is a Homivaro customer, and in a small market where
 * neighbours know each other, that is information worth protecting.
 */
export default function ResetPasswordPage() {
  const t = useTranslations('account.reset');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-md py-section">
      <Button asChild variant="link" className="mb-6">
        <Link href="/anmelden">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <h1 className="display-type text-[clamp(1.75rem,3.4vw,2.5rem)]">{t('title')}</h1>

      {sent ? (
        <div className="surface-card mt-8 p-6">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-status-success text-status-success-fg">
            <Mail className="size-5" aria-hidden />
          </span>
          <h2 className="display-type mt-5 text-xl">{t('sentTitle')}</h2>
          <p className="mt-2 text-ink-secondary">{t('sentBody')}</p>
        </div>
      ) : (
        <>
          <p className="mt-3 text-ink-secondary">{t('lead')}</p>
          <div className="mt-8 space-y-5">
            <Field label={t('emailLabel')}>
              {(props) => (
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  {...props}
                />
              )}
            </Field>
            <Button className="w-full" disabled={!email.trim()} onClick={() => setSent(true)}>
              {t('submit')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
