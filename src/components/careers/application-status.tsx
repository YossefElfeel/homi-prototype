'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input } from '@/components/ui/field';
import { StatusBadge } from '@/components/ui/status-badge';
import { useHydrated, useStore } from '@/mock/store';
import type { ApplicationStatus } from '@/mock/schema';

const STATE_KEY = {
  new: 'stateNew',
  inReview: 'stateInReview',
  accepted: 'stateAccepted',
  rejected: 'stateRejected',
} as const satisfies Record<ApplicationStatus, string>;

/**
 * Screen C6 — checking a status with a reference number.
 *
 * No login, because an applicant does not have an account and forcing one for
 * a single read is how people stop checking and start phoning. The reference
 * is the whole key, so the page shows a state sentence and nothing that would
 * matter if the number were guessed — no address, no documents, no notes.
 *
 * The rejected sentence names the retention period rather than "we'll keep
 * you on file", which is the polite version of the same fact and less honest.
 */
export function ApplicationStatusCheck({ initialReference }: { initialReference?: string }) {
  const t = useTranslations('careers.status');
  const format = useFormatter();
  const hydrated = useHydrated();

  const applications = useStore((s) => s.data.applications);
  const [value, setValue] = useState(initialReference ?? '');
  const [query, setQuery] = useState(initialReference ?? '');

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const trimmed = query.trim().toUpperCase();
  const application = trimmed
    ? applications.find((a) => a.reference.toUpperCase() === trimmed)
    : undefined;

  return (
    <div className="max-w-xl">
      <h1 className="display-type text-[clamp(1.75rem,3.4vw,2.5rem)]">{t('title')}</h1>
      <p className="mt-3 text-ink-secondary">{t('lead')}</p>

      <form
        className="mt-8 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(value);
        }}
      >
        <Field label={t('referenceLabel')} className="min-w-[14rem] flex-1">
          {(props) => (
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t('referencePlaceholder')}
              className="font-mono tracking-wide"
              {...props}
            />
          )}
        </Field>
        <Button type="submit">{t('check')}</Button>
      </form>

      <div aria-live="polite" className="mt-10">
        {trimmed && !application && (
          <EmptyState
            icon={SearchX}
            title={t('notFoundTitle')}
            body={t('notFoundBody')}
            compact
          />
        )}

        {application && (
          <div className="surface-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="subhead-type text-xl">
                {t('foundTitle', { reference: application.reference })}
              </h2>
              <StatusBadge entity="application" state={application.status} />
            </div>
            <p className="mt-4 text-sm text-ink-tertiary">
              {t('submitted')}{' '}
              <span data-numeric>
                {format.dateTime(new Date(application.submittedAt), {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </p>
            <p className="mt-5 max-w-[var(--measure)] text-ink-secondary">
              {t(STATE_KEY[application.status])}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
