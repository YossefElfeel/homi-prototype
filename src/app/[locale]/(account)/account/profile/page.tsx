'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Download, Lock, Trash2 } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { SkeletonPage } from '@/components/ui/skeleton';
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
 *
 * Three settings groups that write to the same record were three `<section>`s
 * separated by nothing but `mt-12`, so the only thing telling you where
 * «Benachrichtigungen» stopped and «Ihre Daten» began was the amount of air
 * above the heading. On a screen whose last control closes the account, that
 * boundary has to be drawn rather than implied.
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

  if (!hydrated || !customer) return <SkeletonPage label={t('title')} />;

  function patch(next: Partial<Customer>) {
    patchData({
      customers: customers.map((c) => (c.id === customer!.id ? { ...c, ...next } : c)),
    });
    setSaveTick((n) => n + 1);
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        /* One shared save status instead of three hand-rolled chips. */
        meta={
          <SaveIndicator
            signal={saveTick}
            savingLabel={appT('saving')}
            savedLabel={appT('saved')}
          />
        }
      />

      <div className="space-y-app-section">
        <Card>
          <CardHeader title={t('personalTitle')} />
          <CardBody>
            <div className="gap-app grid sm:grid-cols-2">
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
              {/* Its own row rather than the third cell of a two-up grid: the
                  language of everything we send is not a peer of "phone". */}
              <Field
                label={t('language')}
                hint={t('languageHint')}
                className="sm:col-span-2 sm:max-w-xs"
              >
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
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('notificationsTitle')} />
          <CardBody>
            <Alert tone="neutral" icon={Lock} title={t('operational')}>
              {t('operationalHint')}
            </Alert>

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
                  notifications: {
                    ...customer.notifications,
                    marketing: e.target.checked,
                  },
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
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('dataTitle')} description={t('dataBody')} />
          <CardBody>
            {closing ? (
              <ConfirmPanel
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
                <div className="flex flex-wrap gap-3">
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
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
