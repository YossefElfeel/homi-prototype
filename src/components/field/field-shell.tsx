'use client';

import { useTranslations } from 'next-intl';
import { Lock, Smartphone } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/site/logo';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useHydrated, useStore } from '@/mock/store';

/**
 * Field chrome — a phone frame and a role gate, nothing more.
 *
 * The screen-map calls this mobile only, so the layout is capped at phone
 * width on desktop and says why. Stretching these screens to 1440px would
 * produce a design nobody will ever see and hide the one-handed constraints
 * that actually shaped them.
 */
export function FieldShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('field.shell');
  const demoRoles = useTranslations('demo.roles');
  const hydrated = useHydrated();

  const role = useStore((s) => s.demo.role);
  const member = useStore((s) =>
    s.data.team.find((m) => m.id === s.demo.currentMemberId),
  );

  if (hydrated && role !== 'contractor') {
    return (
      <main id="main" className="mx-auto max-w-2xl px-gutter py-section">
        {/*
          There is no site chrome around this shell, so without an action this
          page had no link on it at all.
        */}
        <EmptyState
          icon={Lock}
          headingLevel={1}
          title={t('gateTitle')}
          body={`${t('gateBody')} ${t('gateCurrent', { role: demoRoles(role) })}`}
          action={
            <Button asChild>
              <Link href="/">{t('gateHome')}</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-sunken">
      <div className="mx-auto min-h-dvh w-full max-w-[26rem] bg-page">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line-subtle bg-page/95 px-5 backdrop-blur-sm">
          {/* The logo is the way back to the job list — this shell has no nav,
              and /einsatz itself had no exit of any kind. */}
          <Link href="/einsatz" aria-label={t('jobsLink')}>
            <Logo showMark={false} />
          </Link>
          {hydrated && member && (
            <span className="text-sm text-ink-secondary">
              {member.firstName} {member.lastName.charAt(0)}.
            </span>
          )}
        </header>

        <main id="main" className="px-5 pb-8">
          {children}
        </main>

        <footer className="mt-8 border-t border-line-subtle px-5 py-6">
          <Link
            href="/"
            className="text-sm text-ink-secondary underline decoration-from-font underline-offset-4"
          >
            {t('exit')}
          </Link>
        </footer>
      </div>

      <p className="mx-auto hidden max-w-[26rem] items-center gap-2 px-5 py-6 text-sm text-ink-tertiary lg:flex">
        <Smartphone className="size-4 shrink-0" aria-hidden />
        {t('desktopNote')}
      </p>
    </div>
  );
}
