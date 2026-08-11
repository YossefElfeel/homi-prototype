'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Field, Input, Checkbox } from '@/components/ui/field';
import { Logo } from '@/components/site/logo';
import { useStore } from '@/mock/store';

/** Screen 50 — one user, so this stays as plain as it can be. */
export default function AdminLoginPage() {
  const t = useTranslations('admin.login');
  const router = useRouter();
  const setRole = useStore((s) => s.setRole);

  const [state, setState] = useState<'idle' | 'checking'>('idle');

  function submit(event: React.FormEvent) {
    event.preventDefault();
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

        <form onSubmit={submit} className="mt-8 space-y-5">
          <Field label={t('email')}>
            {(props) => (
              <Input type="email" autoComplete="email" defaultValue="marco@homivaro.ch" {...props} />
            )}
          </Field>
          <Field label={t('password')}>
            {(props) => (
              <Input type="password" autoComplete="current-password" defaultValue="demo" {...props} />
            )}
          </Field>

          <div className="flex items-center justify-between gap-4">
            <Checkbox label={t('remember')} defaultChecked />
            {/* Used to link to this very page. `?von=admin` sends the reset
                screen's back-link here rather than into customer sign-in. */}
            <Link
              href="/passwort?von=admin"
              className="text-sm text-ink-secondary underline decoration-from-font underline-offset-4"
            >
              {t('forgot')}
            </Link>
          </div>

          <Button type="submit" size="lg" block disabled={state === 'checking'}>
            {state === 'checking' ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t('submitting')}
              </>
            ) : (
              t('submit')
            )}
          </Button>
        </form>

        <p className="mt-6 text-xs text-ink-tertiary">{t('demoHint')}</p>
      </div>
    </main>
  );
}
