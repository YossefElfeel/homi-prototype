'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

import { LOCALE_LABELS, routing, TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/ui/page-header';
import { Checkbox, Field, Input, NumberField, Select, Textarea } from '@/components/ui/field';
import { SkeletonPage } from '@/components/ui/skeleton';
import { ActionIcon } from '@/lib/action-icons';
import {
  CALC_METHODS,
  DURATION_PROFILES,
  SERVICE_STATUSES,
  hasPublicPage,
} from '@/lib/service-catalogue';
import { useHydrated, useStore } from '@/mock/store';
import type { CalcMethod, DurationProfile, Service, ServiceStatus } from '@/mock/schema';

/**
 * Screen 74 — editing a service, in all four languages.
 *
 * The four language fields sit side by side rather than behind a language
 * switcher. §20.6 makes German the fallback for anything missing, which means
 * a gap never breaks the site and therefore never announces itself — showing
 * all four at once is the only way it stays visible. They now sit two to a
 * row: four full-width inputs stacked down a wide panel made the page a
 * column of text boxes with a screen's worth of empty space beside them, and
 * the pairing puts German next to English, French next to Italian, which is
 * how a translation is actually checked.
 *
 * Three things were missing outright rather than badly laid out:
 *
 *  · **the short description.** `Service.short` is the line under the name on
 *    every service page and in every tile on the homepage. It was in the
 *    schema, on the website, and on no screen — so the sentence customers read
 *    first was the one sentence the owner could not change.
 *  · **the billing method.** `calc` decides whether the rate below it is per
 *    hour, per counted item or for the whole job. The seed set it; nothing
 *    offered it.
 *  · **the third status.** The visibility control was a checkbox, which is two
 *    states, and it applied on the click — so putting a price on the public
 *    website was the same gesture as ticking a box.
 *
 * Text and numbers still autosave per keystroke; that is what `SaveIndicator`
 * is for and it is right for a field whose worst case is a typo. Status does
 * not, because its worst case is a customer seeing a price nobody meant to
 * publish.
 */
export default function EditServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations('admin.service');
  const servicesT = useTranslations('admin.services');
  const statusT = useTranslations('status.service');
  const appT = useTranslations('app');
  const actionsT = useTranslations('actions');
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();

  const services = useStore((s) => s.services);
  const updateService = useStore((s) => s.updateService);
  const setServiceStatus = useStore((s) => s.setServiceStatus);
  /* A counter, not a boolean: two edits in quick succession have to read as
     two saves, and a boolean that is already true cannot say so. */
  const [saveTick, setSaveTick] = useState(0);
  /** The status picked in the select but not yet applied. `null` once it is. */
  const [nextStatus, setNextStatus] = useState<ServiceStatus | null>(null);

  if (!hydrated) return <SkeletonPage label={t('nameTitle')} />;

  const service = services.find((s) => s.slug === slug);
  if (!service) return <p className="text-ink-tertiary">—</p>;

  function patch(next: Partial<Service>) {
    /* By id, not by rebuilding the whole array from this screen's copy of it.
       The list screen can activate a row while this page is open in another
       tab, and `setServices(services.map(…))` would write this render's stale
       seven back over it. */
    updateService(service!.id, next);
    setSaveTick((n) => n + 1);
  }

  function applyStatus() {
    if (!nextStatus || !service) return;
    setServiceStatus(service.id, nextStatus);
    toast.success(
      nextStatus === 'active'
        ? servicesT('activateDone', { name: service.name[locale] })
        : servicesT('deactivateDone', { name: service.name[locale] }),
    );
    setNextStatus(null);
  }

  const missing = routing.locales.filter((l) => !TRANSLATED_LOCALES.includes(l));
  const priceHint = t(
    service.calc === 'perUnit'
      ? 'basePricePerUnit'
      : service.calc === 'flat'
        ? 'basePriceFlat'
        : 'basePriceHourly',
  );

  return (
    <div>
      <PageHeader
        title={service.name[locale]}
        back={{ href: '/admin/leistungen', label: t('back') }}
        meta={
          <>
            <StatusBadge entity="service" state={service.status} />
            <SaveIndicator
              signal={saveTick}
              savingLabel={appT('saving')}
              savedLabel={appT('saved')}
            />
          </>
        }
        actions={
          hasPublicPage(service) && (
            <Button asChild variant="secondary">
              <a href={`/leistungen/${service.slug}`} target="_blank" rel="noreferrer">
                <ActionIcon.customerView className="size-4" aria-hidden />
                {servicesT('rowCustomerView')}
              </a>
            </Button>
          )
        }
      />

      {missing.length > 0 && (
        /*
         * Was `border-l-2 border-rule bg-sunken` — the same grey well this app
         * uses for "here is some context", sitting directly under a heading
         * that says something is missing. A reader scanning the page had the
         * panel's colour telling them it was fine and its text telling them it
         * was not, and colour wins that argument every time. The danger tint
         * is the one the status registry already spends on things that are
         * wrong, so this panel now agrees with the badges beside it.
         */
        <div className="mb-app-section flex gap-3 rounded-[var(--radius-lg)] border border-status-danger-line bg-status-danger p-5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-status-danger-fg"
            aria-hidden
          />
          <div>
            <h2 className="font-medium text-status-danger-fg">{t('missingTitle')}</h2>
            <p className="mt-1.5 max-w-[var(--measure)] text-sm text-status-danger-fg">
              {t('missingBody')}
            </p>
          </div>
        </div>
      )}

      {/* Full width, for the reason the create screen is: the cards inside are
          two-column grids, and capping the page at 48rem halved the room the
          pairs were put there to use. */}
      <div className="space-y-app-section">
        <Card>
          <CardHeader title={t('nameTitle')} description={t('nameHint')} />
          <CardBody>
            <div className="grid gap-5 sm:grid-cols-2">
              {routing.locales.map((l) => (
                <Field
                  key={l}
                  label={LOCALE_LABELS[l]}
                  optional={!TRANSLATED_LOCALES.includes(l)}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={service.name[l]}
                      onChange={(e) => patch({ name: { ...service.name, [l]: e.target.value } })}
                    />
                  )}
                </Field>
              ))}
            </div>

            <Field className="mt-5" label={t('slugLabel')} hint={t('slugHint')}>
              {(props) => (
                /* Read-only rather than absent: the slug is the public URL,
                   and «wo liegt diese Leistung auf der Website» is a question
                   this screen should answer. Editable it would break every
                   link the business has already sent out. */
                <Input {...props} readOnly value={`/leistungen/${service.slug}`} />
              )}
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('shortTitle')} description={t('shortHint')} />
          <CardBody>
            <div className="grid gap-5 sm:grid-cols-2">
              {routing.locales.map((l) => (
                <Field
                  key={l}
                  label={LOCALE_LABELS[l]}
                  optional={!TRANSLATED_LOCALES.includes(l)}
                >
                  {(props) => (
                    <Textarea
                      {...props}
                      className="min-h-24"
                      value={service.short[l]}
                      onChange={(e) =>
                        patch({ short: { ...service.short, [l]: e.target.value } })
                      }
                    />
                  )}
                </Field>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('pricingTitle')} description={t('pricingHint')} />
          <CardBody>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('calcLabel')}>
                {(props) => (
                  <Select
                    {...props}
                    value={service.calc}
                    onChange={(e) => {
                      const next = e.target.value as CalcMethod;
                      /* Switching to a counted service clears the duration
                         profile in the same write: the hours come from the
                         count, and a profile left set would have the estimate
                         add the area matrix on top of them. */
                      patch(
                        next === 'perUnit'
                          ? { calc: next, durationProfile: 'none' }
                          : { calc: next },
                      );
                    }}
                  >
                    {CALC_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {t(
                          `calc${method.charAt(0).toUpperCase()}${method.slice(1)}` as 'calcHourly',
                        )}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              {/* The hint moves with the billing method, because «Ansatz»
                  means three different numbers depending on it. The label used
                  to read «Stundenansatz» for all three. */}
              <Field label={t('basePrice')} hint={priceHint}>
                {(props) => (
                  <NumberField
                    {...props}
                    min={0}
                    value={service.basePrice}
                    onCommit={(v) => patch({ basePrice: v })}
                  />
                )}
              </Field>

              <Field label={t('minDuration')} hint={t('minDurationHint')}>
                {(props) => (
                  <NumberField
                    {...props}
                    step={0.5}
                    value={service.minDuration}
                    onCommit={(v) => patch({ minDuration: v })}
                  />
                )}
              </Field>

              <Field label={t('profileTitle')} hint={t('profileHint')}>
                {(props) => (
                  <Select
                    {...props}
                    value={service.durationProfile}
                    onChange={(e) =>
                      patch({ durationProfile: e.target.value as DurationProfile })
                    }
                  >
                    {DURATION_PROFILES.map((profile) => (
                      <option key={profile} value={profile}>
                        {t(
                          `profile${profile.charAt(0).toUpperCase()}${profile.slice(1)}` as 'profileStandard',
                        )}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            <Checkbox
              className="mt-6"
              label={
                <>
                  {t('guaranteeLabel')}
                  <span className="mt-1 block text-xs text-ink-tertiary">
                    {t('guaranteeHint')}
                  </span>
                </>
              }
              checked={service.handoverGuarantee}
              onChange={(e) => patch({ handoverGuarantee: e.target.checked })}
            />
          </CardBody>
        </Card>

        {/*
          The one control on this screen that does not autosave.

          Everything above it is a typo away from being wrong and a keystroke
          away from being right again. This one publishes a price to the
          website or withdraws a service mid-request, so the select stages the
          choice and a second, named button commits it — the same shape the
          list screen's confirm dialog has, for the same reason.
        */}
        <Card tone={nextStatus ? 'warning' : 'default'}>
          <CardHeader title={t('statusTitle')} description={t('statusHint')} />
          <CardBody>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('statusTitle')}>
                {(props) => (
                  <Select
                    {...props}
                    value={nextStatus ?? service.status}
                    onChange={(e) => {
                      const picked = e.target.value as ServiceStatus;
                      setNextStatus(picked === service.status ? null : picked);
                    }}
                  >
                    {SERVICE_STATUSES.map((state) => (
                      <option key={state} value={state}>
                        {statusT(state)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            {nextStatus && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="text-sm text-status-warning-fg">
                  {t('statusPending', {
                    from: statusT(service.status),
                    to: statusT(nextStatus),
                  })}
                </p>
                <Button size="sm" onClick={applyStatus}>
                  {t('statusApply')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNextStatus(null)}>
                  {actionsT('cancel')}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
