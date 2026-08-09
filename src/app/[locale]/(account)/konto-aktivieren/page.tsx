'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

/**
 * Screen 33 — activating the account.
 *
 * Skipping the password is a first-class option, not fine print. The account
 * already exists (it was created with the first quote) and the email link
 * works forever; forcing a password here adds a credential to remember without
 * adding security.
 *
 * The rules are shown as live checks rather than as an error after submitting.
 */
export default function ActivateAccountPage() {
  const t = useTranslations('account.activate');
  const router = useRouter();
  const setRole = useStore((s) => s.setRole);

  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');

  const longEnough = password.length >= 10;
  const matches = password.length > 0 && password === repeat;

  function done() {
    setRole('customer');
    router.push('/konto');
  }

  return (
    <div className="mx-auto max-w-md py-section">
      <h1 className="display-type text-[clamp(1.75rem,3.4vw,2.5rem)]">{t('title')}</h1>
      <p className="mt-3 text-ink-secondary">{t('lead')}</p>

      <div className="mt-8 space-y-5">
        <Field label={t('passwordLabel')}>
          {(props) => (
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              {...props}
            />
          )}
        </Field>
        <Field label={t('repeatLabel')}>
          {(props) => (
            <Input
              type="password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              autoComplete="new-password"
              {...props}
            />
          )}
        </Field>

        <div>
          <p className="label-type text-ink-tertiary">{t('rulesTitle')}</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {[
              { ok: longEnough, label: t('ruleLength') },
              { ok: matches, label: t('ruleMatch') },
            ].map((rule) => (
              <li key={rule.label} className="flex items-center gap-2">
                {rule.ok ? (
                  <Check className="size-4 text-status-success-fg" aria-hidden />
                ) : (
                  <X className="size-4 text-ink-tertiary" aria-hidden />
                )}
                <span className={cn(rule.ok ? 'text-ink' : 'text-ink-secondary')}>
                  {rule.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Button className="w-full" disabled={!longEnough || !matches} onClick={done}>
          {t('submit')}
        </Button>
      </div>

      <div className="mt-8 border-t border-line-subtle pt-6">
        <Button variant="quiet" onClick={done}>
          {t('skip')}
        </Button>
        <p className="mt-2 text-sm text-ink-tertiary">{t('skipHint')}</p>
      </div>
    </div>
  );
}
