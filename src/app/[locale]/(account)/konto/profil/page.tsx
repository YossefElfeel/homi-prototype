'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Download, Lock, Trash2 } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { Field, Input, Select, Checkbox } from '@/components/ui/field';
import { ConfirmPanel } from '@/components/ui/confirm-panel';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useStore } from '@/mock/store';
import type { Customer } from '@/mock/schema';

/**
 * Screen 49 — profile and notifications.
 *
 * The operational notifications are shown with the switch missing rather than
 * present-and-disabled, and the reason is written next to them: without a
 * confirmation you would not know when somebody is at your door. §15 makes
 * them non-optional; a greyed-out toggle reads as a feature the company took
 * away, while a stated reason reads as a decision.
 */
export default function AccountProfilePage() {
  const t = useTranslations('account.profile');
  const appT = useTranslations('app');
  const hydrated = useHydrated();

  const { customer } = useAccount();
  const patchData = useStore((s) => s.patchData);
  const customers = useStore((s) => s.data.customers);
  const setRole = useStore((s) => s.setRole);
  const router = useRouter();
  /* A counter, not a boolean: two edits in quick succession have to read as
     two saves, and a boolean that is already true cannot say so. */
  const [saveTick, setSaveTick] = useState(0);
  const [closing, setClosing] = useState(false);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;
  if (!customer) return <p className="text-ink-tertiary">—</p>;

  function patch(next: Partial<Customer>) {
    patchData({
      customers: customers.map((c) => (c.id === customer!.id ? { ...c, ...next } : c)),
    });
    setSaveTick((n) => n + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="display-type text-3xl">{t('title')}</h1>
        {/* One shared save status instead of three hand-rolled chips. */}
          <SaveIndicator
            signal={saveTick}
            savingLabel={appT("saving")}
            savedLabel={appT("saved")}
          />
      </div>

      <section className="mt-10">
        <h2 className="display-type text-xl">{t('personalTitle')}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label={t('firstName')}>
            {(props) => (
              <Input
                value={customer.firstName}
                onChange={(e) => patch({ firstName: e.target.value })}
                autoComplete="given-name"
                {...props}
              />
            )}
          </Field>
          <Field label={t('lastName')}>
            {(props) => (
              <Input
                value={customer.lastName}
                onChange={(e) => patch({ lastName: e.target.value })}
                autoComplete="family-name"
                {...props}
              />
            )}
          </Field>
          <Field label={t('email')}>
            {(props) => (
              <Input
                type="email"
                value={customer.email}
                onChange={(e) => patch({ email: e.target.value })}
                autoComplete="email"
                {...props}
              />
            )}
          </Field>
          <Field label={t('phone')}>
            {(props) => (
              <Input
                type="tel"
                value={customer.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                autoComplete="tel"
                {...props}
              />
            )}
          </Field>
        </div>
        <Field label={t('language')} hint={t('languageHint')} className="mt-5 max-w-xs">
          {(props) => (
            <Select
              value={customer.language}
              onChange={(e) => patch({ language: e.target.value as Locale })}
              {...props}
            >
              {routing.locales.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </section>

      <section className="mt-12">
        <h2 className="display-type text-xl">{t('notificationsTitle')}</h2>

        <div className="mt-5 flex gap-3 border-l-2 border-rule bg-sunken rounded-[var(--radius-lg)] p-5">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
          <div>
            <h3 className="font-medium">{t('operational')}</h3>
            <p className="mt-1 max-w-[var(--measure)] text-sm text-ink-secondary">
              {t('operationalHint')}
            </p>
          </div>
        </div>

        <Checkbox
          className="mt-6"
          label={
            <>
              {t('marketing')}
              <span className="mt-1 block text-xs text-ink-tertiary">
                {t('marketingHint')}
              </span>
            </>
          }
          checked={customer.notifications.marketing}
          onChange={(e) =>
            patch({
              notifications: { ...customer.notifications, marketing: e.target.checked },
            })
          }
        />

        <fieldset className="mt-8">
          <legend className="text-sm font-medium">{t('channelTitle')}</legend>
          <div className="mt-3 space-y-3">
            <Checkbox
              label={t('channelEmail')}
              checked={customer.notifications.channelEmail}
              onChange={(e) =>
                patch({
                  notifications: {
                    ...customer.notifications,
                    channelEmail: e.target.checked,
                  },
                })
              }
            />
            <Checkbox
              label={t('channelSms')}
              checked={customer.notifications.channelSms}
              onChange={(e) =>
                patch({
                  notifications: {
                    ...customer.notifications,
                    channelSms: e.target.checked,
                  },
                })
              }
            />
          </div>
        </fieldset>
      </section>

      <section className="mt-12 border-t border-line-subtle pt-8">
        <h2 className="display-type text-xl">{t('dataTitle')}</h2>
        <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
          {t('dataBody')}
        </p>
        {closing ? (
          <ConfirmPanel
            className="mt-5"
            title={t('deleteConfirmTitle')}
            body={t('deleteConfirmBody')}
            action={t('deleteConfirmAction')}
            dismiss={t('dismiss')}
            onConfirm={() => {
              /*
               * Deactivate, do not delete. `customerId` is referenced by
               * properties, requests, bookings, invoices, subscriptions and
               * messages, and three admin screens dereference it with a
               * non-null assertion — a hard delete would take them down.
               * Retention law says the same thing: the invoices have to stay.
               */
              // Written directly rather than through `patch`, which also
              // flashes the "saved" chip — wrong feedback for closing an
              // account, and on a screen the user is about to leave.
              patchData({
                customers: customers.map((c) =>
                  c.id === customer.id ? { ...c, status: 'inactive' as const } : c,
                ),
              });
              setClosing(false);
              setRole('visitor');
              router.push('/');
            }}
            onDismiss={() => setClosing(false)}
          />
        ) : (
          <>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => toast.success(t('dataExportToast'))}
              >
                <Download className="size-4" aria-hidden />
                {t('dataExport')}
              </Button>
              <Button variant="quiet" onClick={() => setClosing(true)}>
                <Trash2 className="size-4" aria-hidden />
                {t('dataDelete')}
              </Button>
            </div>
            <p className="mt-3 text-sm text-ink-tertiary">{t('dataDeleteNote')}</p>
          </>
        )}
      </section>
    </div>
  );
}
