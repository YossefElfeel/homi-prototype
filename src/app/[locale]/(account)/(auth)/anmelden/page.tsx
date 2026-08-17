'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ArrowRight, Mail } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useStore } from '@/mock/store';

/**
 * Screen 32 — sign in.
 *
 * The email link leads, the password is the fallback. §8.3 lets people request
 * as a guest, so most customers here have never chosen a password — putting a
 * password field first would make the majority feel locked out of an account
 * they did not know they had.
 *
 * "No account yet?" says the truth rather than offering a sign-up: accounts are
 * created when the first quote goes out, and a registration form that produces
 * an empty account is a dead end.
 */
export default function SignInPage() {
  const t = useTranslations('account.signIn');
  const router = useRouter();
  const setRole = useStore((s) => s.setRole);

  const [mode, setMode] = useState<'link' | 'password'>('link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  function signIn() {
    /*
     * `password` was held in state and never read: in password mode the form
     * validated the email and let any password through, including none. The
     * prototype still accepts any *value* — it has one customer and signing in
     * is a role switch — but an empty required field is a real failure state,
     * and it now reaches the error the screen already had.
     */
    if (!email.trim() || (mode === 'password' && !password.trim())) {
      setError(true);
      return;
    }
    setError(false);
    setRole('customer');
    router.push('/konto');
  }

  return (
    <div className="mx-auto max-w-md py-section">
      <h1 className="display-type text-[clamp(1.75rem,3.4vw,2.5rem)]">{t('title')}</h1>
      <p className="mt-3 text-ink-secondary">{t('lead')}</p>

      {sent ? (
        <div className="surface-card mt-8 p-6">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-status-success text-status-success-fg">
            <Mail className="size-5" aria-hidden />
          </span>
          <h2 className="display-type mt-5 text-xl">{t('sentTitle')}</h2>
          <p className="mt-2 text-ink-secondary">{t('sentBody', { email })}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={signIn}>
              {t('title')}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button variant="quiet" onClick={() => setSent(false)}>
              {t('sentAgain')}
            </Button>
          </div>
          <p className="mt-4 text-sm text-ink-tertiary">{t('demoNote')}</p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {error && (
            <div className="flex gap-3 border-l-2 border-status-danger-line bg-status-danger p-4">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-status-danger-fg"
                aria-hidden
              />
              <div>
                <h2 className="text-sm font-medium text-status-danger-fg">
                  {t('errorTitle')}
                </h2>
                <p className="mt-1 text-sm text-status-danger-fg">{t('errorBody')}</p>
              </div>
            </div>
          )}

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

          {mode === 'password' && (
            <Field label={t('passwordLabel')}>
              {(props) => (
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  {...props}
                />
              )}
            </Field>
          )}

          <Button
            className="w-full"
            onClick={() => {
              if (!email.trim()) {
                setError(true);
                return;
              }
              if (mode === 'link') setSent(true);
              else signIn();
            }}
          >
            {mode === 'link' ? t('linkAction') : t('passwordAction')}
          </Button>

          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <button
              type="button"
              onClick={() => setMode(mode === 'link' ? 'password' : 'link')}
              className="min-h-11 text-ink-secondary underline-offset-4 hover:text-ink hover:underline"
            >
              {mode === 'link' ? t('usePassword') : t('useLink')}
            </button>
            {mode === 'password' && (
              <Link
                href="/passwort"
                className="inline-flex min-h-11 items-center text-ink-secondary underline-offset-4 hover:text-ink hover:underline"
              >
                {t('forgot')}
              </Link>
            )}
          </div>

          <p className="text-sm text-ink-tertiary">{t('demoNote')}</p>
        </div>
      )}

      <div className="mt-10 border-t border-line-subtle pt-8">
        <h2 className="font-medium">{t('noAccountTitle')}</h2>
        <p className="mt-2 text-sm text-ink-secondary">{t('noAccountBody')}</p>
        <Button asChild variant="secondary" className="mt-4">
          <Link href="/anfrage">{t('noAccountAction')}</Link>
        </Button>
      </div>
    </div>
  );
}
