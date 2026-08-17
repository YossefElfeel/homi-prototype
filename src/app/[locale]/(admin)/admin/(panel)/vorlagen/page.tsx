'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Info, Mail, MessageSquare } from 'lucide-react';

import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';
import { Field, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { SkeletonPage } from '@/components/ui/skeleton';
import { useHydrated, useStore } from '@/mock/store';
import type { MessageTemplateKey } from '@/mock/schema';
import { cn } from '@/lib/cn';

type Channel = 'email' | 'sms';

/** §15 — which channels each event goes out on. */
const EVENTS: { key: MessageTemplateKey; channels: Channel[] }[] = [
  { key: 'request-received', channels: ['email'] },
  { key: 'offer-sent', channels: ['email', 'sms'] },
  { key: 'offer-reminder', channels: ['email'] },
  { key: 'booking-confirmed', channels: ['email', 'sms'] },
  { key: 'appointment-reminder', channels: ['sms'] },
  { key: 'on-the-way', channels: ['sms'] },
  { key: 'job-done', channels: ['email'] },
  { key: 'invoice-sent', channels: ['email'] },
  { key: 'payment-reminder', channels: ['email'] },
  { key: 'cancellation', channels: ['email', 'sms'] },
  { key: 'review-request', channels: ['email'] },
];

/**
 * Screen 79 — message templates.
 *
 * All four languages are edited on one screen rather than behind a language
 * switcher, for the same reason as the service editor: German is the fallback,
 * so a missing translation sends successfully and never complains. The count in
 * the list is the only thing that surfaces it.
 */
export default function AdminTemplatesPage() {
  const t = useTranslations('admin.templates');
  const appT = useTranslations('app');
  const hydrated = useHydrated();

  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const [selected, setSelected] = useState<MessageTemplateKey>('offer-sent');

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const templates = settings.messageTemplates;
  const filled = (key: MessageTemplateKey) =>
    routing.locales.filter((l) => (templates[key][l] ?? '').trim().length > 0).length;

  function setText(key: MessageTemplateKey, locale: Locale, value: string) {
    updateSettings({
      messageTemplates: {
        ...templates,
        [key]: { ...templates[key], [locale]: value },
      },
    });
  }

  return (
    <div className="mx-auto max-w-[90rem]">
      {/* Four languages × nine events, all autosaving in silence. */}
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        actions={
          <SaveIndicator
            signal={templates}
            savingLabel={appT('saving')}
            savedLabel={appT('saved')}
          />
        }
      />

      <div className="gap-app grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <nav aria-label={t('title')}>
          <ul className="border-t border-line-subtle">
            {EVENTS.map(({ key, channels }) => {
              const complete = filled(key) === routing.locales.length;
              const active = key === selected;
              return (
                <li key={key} className="border-b border-line-subtle">
                  <button
                    type="button"
                    onClick={() => setSelected(key)}
                    aria-current={active ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-start justify-between gap-3 px-3 py-3.5 text-start transition-colors',
                      active ? 'bg-sunken' : 'hover:bg-sunken',
                    )}
                  >
                    <span>
                      <span className="block font-medium">
                        {t(`events.${key}` as 'events.offer-sent')}
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-xs text-ink-tertiary">
                        {channels.includes('email') && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="size-3" aria-hidden />
                            {t('channelEmail')}
                          </span>
                        )}
                        {channels.includes('sms') && (
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="size-3" aria-hidden />
                            {t('channelSms')}
                          </span>
                        )}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 shrink-0 rounded-sm border px-1.5 py-0.5 text-xs',
                        complete
                          ? 'border-status-neutral-line bg-status-neutral text-status-neutral-fg'
                          : 'border-status-warning-line bg-status-warning text-status-warning-fg',
                      )}
                    >
                      {complete
                        ? t('complete')
                        : t('missing', { n: routing.locales.length - filled(key) })}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section>
          <h2 className="display-type text-xl">
            {t(`events.${selected}` as 'events.offer-sent')}
          </h2>
          <p className="mt-2 flex items-start gap-2 text-sm text-ink-secondary">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('placeholderNote')}
          </p>

          <div className="mt-6 space-y-5">
            {routing.locales.map((l) => {
              const value = templates[selected][l] ?? '';
              return (
                <Field
                  key={l}
                  label={LOCALE_LABELS[l]}
                  hint={value.trim() ? undefined : t('emptyForLocale')}
                >
                  {(props) => (
                    <Textarea
                      rows={value.trim() ? 7 : 3}
                      value={value}
                      onChange={(e) => setText(selected, l, e.target.value)}
                      {...props}
                    />
                  )}
                </Field>
              );
            })}
          </div>

          <p className="mt-6 text-sm text-ink-tertiary">{t('fallbackNote')}</p>
        </section>
      </div>
    </div>
  );
}
