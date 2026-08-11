'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, Input, Checkbox } from '@/components/ui/field';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { ClosurePeriod } from '@/mock/schema';
import { cn } from '@/lib/cn';

type Tab = 'regions' | 'hours' | 'fees';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/**
 * Screens 80–82 — settings, in three tabs.
 *
 * Every number on this screen is one the engines actually read: change the
 * Saturday surcharge and the next quote is priced differently; drop
 * "jobs per day" to one and the slot picker stops offering the second slot.
 * The values are not decoration, which is why the hints say what each one
 * controls rather than restating the label.
 */
export default function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: requestedTab } = use(searchParams);
  const t = useTranslations('admin.settings');
  const format = useFormatter();
  const hydrated = useHydrated();
  const now = useNow();

  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const closures = useStore((s) => s.data.closures);
  const patchData = useStore((s) => s.patchData);

  // The key register's locked state links straight to the insurance toggle,
  // which lives in the fees tab — without this it landed on the region editor.
  const [tab, setTab] = useState<Tab>(() =>
    requestedTab === 'hours' || requestedTab === 'fees' ? requestedTab : 'regions',
  );

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'regions', label: t('tabRegions') },
    { id: 'hours', label: t('tabHours') },
    { id: 'fees', label: t('tabFees') },
  ];

  const toggleDay = (day: number) =>
    updateSettings({
      workingDays: settings.workingDays.includes(day)
        ? settings.workingDays.filter((d) => d !== day)
        : [...settings.workingDays, day].sort((a, b) => a - b),
    });

  const addClosure = () => {
    const start = new Date(now.getTime() + 30 * 86_400_000);
    const closure: ClosurePeriod = {
      id: `cls_${closures.length + 1}`,
      start: start.toISOString().slice(0, 10),
      end: new Date(start.getTime() + 6 * 86_400_000).toISOString().slice(0, 10),
      reason: '',
      recurringYearly: false,
    };
    patchData({ closures: [...closures, closure] });
  };

  const patchClosure = (id: string, patch: Partial<ClosurePeriod>) =>
    patchData({ closures: closures.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  return (
    <div className="max-w-4xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>

      <div role="tablist" aria-label={t('title')} className="mt-6 flex flex-wrap gap-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`settings-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls="settings-panel"
            // Roving tabIndex plus arrow keys — the half of the tab contract
            // that `role="tab"` alone was promising and not delivering.
            tabIndex={tab === item.id ? 0 : -1}
            onKeyDown={(e) => {
              const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (delta === 0) return;
              e.preventDefault();
              const ids = tabs.map((x) => x.id);
              const next = ids[(ids.indexOf(item.id) + delta + ids.length) % ids.length]!;
              setTab(next);
              document.getElementById(`settings-tab-${next}`)?.focus();
            }}
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
              tab === item.id
                ? 'bg-accent-subtle font-medium text-ink'
                : 'text-ink-secondary hover:bg-sunken',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        id="settings-panel"
        role="tabpanel"
        aria-labelledby={`settings-tab-${tab}`}
        tabIndex={0}
      >
      {tab === 'regions' && (
        <section className="mt-8">
          <h2 className="display-type text-xl">{t('regionsTitle')}</h2>
          <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">
            {t('regionsLead')}
          </p>

          <ul className="mt-6 border-t border-line-subtle">
            {SERVED_REGIONS.map((region) => {
              const included = settings.servedPostcodes.includes(region.postcode);
              return (
                <li
                  key={region.postcode}
                  className="flex items-center justify-between gap-4 border-b border-line-subtle py-3"
                >
                  <span className="flex items-baseline gap-3">
                    <span data-numeric className="text-ink-tertiary">
                      {region.postcode}
                    </span>
                    <span className="font-medium">{region.name}</span>
                  </span>
                  <Checkbox
                    label={
                      <span className="text-sm text-ink-secondary">
                        {included ? t('regionsIncluded') : t('regionsExcluded')}
                      </span>
                    }
                    checked={included}
                    onChange={(e) =>
                      updateSettings({
                        servedPostcodes: e.target.checked
                          ? [...settings.servedPostcodes, region.postcode]
                          : settings.servedPostcodes.filter((p) => p !== region.postcode),
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>

          <p className="mt-6 flex max-w-[var(--measure)] items-start gap-2 text-sm text-ink-secondary">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('regionsZurichNote')}
          </p>
        </section>
      )}

      {tab === 'hours' && (
        <section className="mt-8">
          <h2 className="display-type text-xl">{t('hoursTitle')}</h2>

          <fieldset className="mt-5">
            <legend className="label-type text-ink-secondary">{t('hoursDays')}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const on = settings.workingDays.includes(day);
                // 2024-01-01 was a Monday, so day 1..7 lands on Mon..Sun —
                // the same 1 = Monday convention `workingDays` uses. Built in
                // UTC because the formatter renders in Europe/Zurich: a local
                // midnight west of Zurich would shift every label back a day.
                const label = format.dateTime(new Date(Date.UTC(2024, 0, day)), {
                  weekday: 'short',
                });
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      'min-h-11 rounded-[var(--radius-sm)] border px-4 text-sm transition-colors',
                      on
                        ? 'border-accent bg-accent-subtle font-medium text-ink'
                        : 'border-line text-ink-secondary hover:bg-sunken',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label={t('hoursFrom')}>
              {(props) => (
                <Input
                  type="time"
                  value={settings.dayStart}
                  onChange={(e) => updateSettings({ dayStart: e.target.value })}
                  {...props}
                />
              )}
            </Field>
            <Field label={t('hoursTo')}>
              {(props) => (
                <Input
                  type="time"
                  value={settings.dayEnd}
                  onChange={(e) => updateSettings({ dayEnd: e.target.value })}
                  {...props}
                />
              )}
            </Field>
            <Field label={t('hoursCapacity')} hint={t('hoursCapacityHint')}>
              {(props) => (
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={settings.maxJobsPerDay}
                  onChange={(e) =>
                    updateSettings({ maxJobsPerDay: Math.max(1, Number(e.target.value) || 1) })
                  }
                  {...props}
                />
              )}
            </Field>
            <Field label={t('hoursLead')} hint={t('hoursLeadHint')}>
              {(props) => (
                <Input
                  type="number"
                  inputMode="numeric"
                  value={settings.minLeadHours}
                  onChange={(e) =>
                    updateSettings({ minLeadHours: Number(e.target.value) || 0 })
                  }
                  {...props}
                />
              )}
            </Field>
          </div>

          <h3 className="display-type mt-10 text-lg">{t('closuresTitle')}</h3>
          <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
            {t('closuresLead')}
          </p>

          {closures.length === 0 ? (
            <p className="mt-4 text-sm text-ink-tertiary">{t('closuresEmpty')}</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {closures.map((closure) => (
                <li key={closure.id} className="surface-card p-5">
                  <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
                    <Field label={t('closuresFrom')}>
                      {(props) => (
                        <Input
                          type="date"
                          value={closure.start.slice(0, 10)}
                          onChange={(e) =>
                            patchClosure(closure.id, { start: e.target.value })
                          }
                          {...props}
                        />
                      )}
                    </Field>
                    <Field label={t('closuresTo')}>
                      {(props) => (
                        <Input
                          type="date"
                          value={closure.end.slice(0, 10)}
                          onChange={(e) => patchClosure(closure.id, { end: e.target.value })}
                          {...props}
                        />
                      )}
                    </Field>
                    <div className="flex items-end">
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={() =>
                          patchData({
                            closures: closures.filter((c) => c.id !== closure.id),
                          })
                        }
                      >
                        <Trash2 className="size-4" aria-hidden />
                        <span className="sr-only sm:not-sr-only">{t('closuresRemove')}</span>
                      </Button>
                    </div>
                  </div>
                  <Field label={t('closuresReason')} className="mt-4">
                    {(props) => (
                      <Input
                        value={closure.reason}
                        onChange={(e) => patchClosure(closure.id, { reason: e.target.value })}
                        {...props}
                      />
                    )}
                  </Field>
                  <Checkbox
                    className="mt-4"
                    label={t('closuresYearly')}
                    checked={closure.recurringYearly}
                    onChange={(e) => patchClosure(closure.id, { recurringYearly: e.target.checked })}
                  />
                </li>
              ))}
            </ul>
          )}

          <Button variant="secondary" className="mt-5" onClick={addClosure}>
            <Plus className="size-4" aria-hidden />
            {t('closuresAdd')}
          </Button>
        </section>
      )}

      {tab === 'fees' && (
        <section className="mt-8 space-y-10">
          <div>
            <h2 className="display-type text-xl">{t('feesTitle')}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label={`${t('feeSaturday')} (%)`}>
                {(props) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={settings.saturdaySurchargePercent}
                    onChange={(e) =>
                      updateSettings({
                        saturdaySurchargePercent: Number(e.target.value) || 0,
                      })
                    }
                    {...props}
                  />
                )}
              </Field>
              <Field label={`${t('feeEvening')} (%)`}>
                {(props) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={settings.eveningSurchargePercent}
                    onChange={(e) =>
                      updateSettings({
                        eveningSurchargePercent: Number(e.target.value) || 0,
                      })
                    }
                    {...props}
                  />
                )}
              </Field>
              <Field label={t('feeEveningFrom')} hint={t('feeEveningNote')}>
                {(props) => (
                  <Input
                    type="time"
                    value={settings.eveningSurchargeFrom}
                    onChange={(e) =>
                      updateSettings({ eveningSurchargeFrom: e.target.value })
                    }
                    {...props}
                  />
                )}
              </Field>
              <Field label={`${t('feeTravel')} (km)`}>
                {(props) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={settings.freeTravelKm}
                    onChange={(e) =>
                      updateSettings({ freeTravelKm: Number(e.target.value) || 0 })
                    }
                    {...props}
                  />
                )}
              </Field>
            </div>
          </div>

          <div>
            <h2 className="display-type text-xl">{t('rulesTitle')}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <Field label={`${t('ruleFreeUntil')} (${t('hours')})`}>
                {(props) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={settings.cancellationFreeHours}
                    onChange={(e) =>
                      updateSettings({ cancellationFreeHours: Number(e.target.value) || 0 })
                    }
                    {...props}
                  />
                )}
              </Field>
              <Field label={`${t('ruleLate')} (%)`}>
                {(props) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={settings.lateCancellationPercent}
                    onChange={(e) =>
                      updateSettings({ lateCancellationPercent: Number(e.target.value) || 0 })
                    }
                    {...props}
                  />
                )}
              </Field>
              <Field label={`${t('ruleNoAccess')} (%)`}>
                {(props) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={settings.noAccessFeePercent}
                    onChange={(e) =>
                      updateSettings({ noAccessFeePercent: Number(e.target.value) || 0 })
                    }
                    {...props}
                  />
                )}
              </Field>
            </div>
          </div>

          <div>
            <h2 className="display-type text-xl">{t('subscriptionTitle')}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <Field label={`${t('ruleCommitment')} (${t('months')})`}>
                {(props) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={settings.subscriptionCommitmentMonths}
                    onChange={(e) =>
                      updateSettings({
                        subscriptionCommitmentMonths: Number(e.target.value) || 0,
                      })
                    }
                    {...props}
                  />
                )}
              </Field>
              <Field label={`${t('ruleNotice')} (${t('months')})`}>
                {(props) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={settings.subscriptionNoticeMonths}
                    onChange={(e) =>
                      updateSettings({
                        subscriptionNoticeMonths: Number(e.target.value) || 0,
                      })
                    }
                    {...props}
                  />
                )}
              </Field>
              <Field label={t('ruleSkips')}>
                {(props) => (
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={settings.monthlyFreeSkips}
                    onChange={(e) =>
                      updateSettings({ monthlyFreeSkips: Number(e.target.value) || 0 })
                    }
                    {...props}
                  />
                )}
              </Field>
            </div>
          </div>

          <div className="border-t border-line-subtle pt-8">
            <h2 className="display-type text-xl">{t('insuranceTitle')}</h2>
            <div className="mt-4 flex gap-3 border-l-2 border-rule bg-sunken p-5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
              <p className="max-w-[var(--measure)] text-sm text-ink-secondary">
                {t('insuranceHint')}
              </p>
            </div>
            <Checkbox
              className="mt-5"
              label={t('insuranceLabel')}
              checked={settings.hasLiabilityInsurance}
              onChange={(e) =>
                updateSettings({ hasLiabilityInsurance: e.target.checked })
              }
            />
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
