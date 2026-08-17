'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input, Checkbox } from '@/components/ui/field';
import { Logo } from '@/components/site/logo';
import { useStore } from '@/mock/store';

/** Screen 50 — one user, so this stays as plain as it can be. */
export default function AdminLoginPage() {
  const t = useTranslations('admin.login');
  const router = useRouter();
  const setRole = useStore((s) => s.setRole);

  /*
   * The form used to be entirely uncontrolled — `defaultValue` on both fields,
   * no onChange, and submit() ignored them. The `remember` checkbox was never
   * read either, and `admin.login.error` was defined in every locale with
   * nothing to render it. So the screen had an error state on paper and no
   * way to reach it, which is worse than having none.
   *
   * The prototype still accepts any credentials — that is the demo hint under
   * the form — but "any" is not "none": empty fields are the failure case that
   * a real person will actually hit, and it now behaves like one.
   */
  const [email, setEmail] = useState('marco@homivaro.ch');
  const [password, setPassword] = useState('demo');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'checking'>('idle');

  function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError(t('error'));
      return;
    }

    setError(null);
    setState('checking');
    window.setTimeout(() => {
      // Signing in *is* switching role in the prototype, so the panel behind
      // the gate is reachable without hunting for the demo bar first.
      setRole('owner');
      router.push('/admin');
    }, 700);
  }

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-gutter py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block">
          <Logo />
        </Link>

        <h1 className="display-type mt-8 text-3xl">{t('title')}</h1>
        <p className="mt-2 text-ink-secondary">{t('lead')}</p>

        <form onSubmit={submit} noValidate className="mt-8 space-y-5">
          {/* Alert already carries role="alert" for the danger tone. */}
          {error && <Alert tone="danger">{error}</Alert>}

          <Field label={t('email')}>
            {(props) => (
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                {...props}
              />
            )}
          </Field>
          <Field label={t('password')}>
            {(props) => (
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                {...props}
              />
            )}
          </Field>

          <div className="flex items-center justify-between gap-4">
            {/* Controlled, but honest: the prototype's session is the persisted
                store, so it is always kept. Said in the hint rather than
                pretended at. */}
            <Checkbox
              label={t('remember')}
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            {/* Used to link to this very page. `?von=admin` sends the reset
                screen's back-link here rather than into customer sign-in. */}
            <Link
              href="/passwort?von=admin"
              className="text-sm text-ink-secondary underline decoration-from-font underline-offset-4"
            >
              {t('forgot')}
            </Link>
          </div>

          <Button type="submit" size="lg" block loading={state === 'checking'}>
            {state === 'checking' ? t('submitting') : t('submit')}
          </Button>
        </form>

        <p className="mt-6 text-xs text-ink-tertiary">{t('demoHint')}</p>
      </div>
    </main>
  );
}
