'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, Input, Checkbox, NumberField } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { SignatureMark } from '@/components/ui/signature-mark';
import { SignaturePad } from '@/components/ui/signature-pad';
import { PageHeader } from '@/components/ui/page-header';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { SkeletonPage } from '@/components/ui/skeleton';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { ClosurePeriod } from '@/mock/schema';
import { cn } from '@/lib/cn';

type Tab = 'regions' | 'hours' | 'fees' | 'contract';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/**
 * Every group on this screen sits on its own white card.
 *
 * The tabs already say "this is one subject at a time", but underneath them
 * the fields were drawn straight onto the panel's grey ground, so a heading,
 * the boxes below it and the next heading were one undivided column with no
 * edge anywhere. Nothing said where "Zuschläge" stopped and "Stornierung"
 * started except a gap.
 */
const CARD = 'surface-card p-6 sm:p-7';

/**
 * A row of fields, aligned.
 *
 * Each `Field` hands its three rows — label, control, hint — to this grid, so
 * every box in a row starts on the same line no matter how many lines the
 * label above it took. Without it "Gratis-Verschiebungen pro Monat" wrapped
 * to two lines and its input hung a line lower than the one beside it.
 */
const ROWS = '[&>*]:row-span-3 [&>*]:grid-rows-subgrid';

/**
 * One column template for the whole fees tab.
 *
 * "Zuschläge" ran at two columns and "Stornierung" at three, so the boxes were
 * half-width in one group and a third in the next — the inputs lined up across
 * a row and with nothing above or below it. Same template everywhere means the
 * left edge of every box in the tab is the left edge of the same column.
 */
const FEE_GRID = cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3', ROWS);

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
  const appT = useTranslations('app');
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
    requestedTab === 'hours' || requestedTab === 'fees' || requestedTab === 'contract'
      ? requestedTab
      : 'regions',
  );
  /* Null while the stored mark stands. Non-null means a pad is open and this
     is what has been drawn into it — the stored one is not touched until the
     new mark is saved, so abandoning a redraw leaves every future contract
     with the signature it already had. */
  const [redrawn, setRedrawn] = useState<string | null>(null);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'regions', label: t('tabRegions') },
    { id: 'hours', label: t('tabHours') },
    { id: 'fees', label: t('tabFees') },
    { id: 'contract', label: t('tabContract') },
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
    <div>
      {/*
        Every field on this screen writes to the live store on each keystroke,
        and did so in complete silence — ~25 inputs that changed pricing and
        scheduling rules with no acknowledgement of any kind, and no entry in
        the change log the panel keeps for exactly this.
      */}
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        actions={
          <SaveIndicator
            signal={settings}
            savingLabel={appT('saving')}
            savedLabel={appT('saved')}
          />
        }
      />

      <div role="tablist" aria-label={t('title')} className="flex flex-wrap gap-1">
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
        <section className={cn('mt-8', CARD)}>
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
                  className="flex items-center justify-between gap-4 border-b border-line-subtle py-3 last:border-b-0"
                >
                  <span className="flex items-baseline gap-3">
                    <span data-numeric className="text-ink-tertiary">
                      {region.postcode}
                    </span>
                    <span id={`region-${region.postcode}`} className="font-medium">
                      {region.name}
                    </span>
                  </span>
                  {/*
                    A switch, not a tick. Nothing on this screen is staged: the
                    postcode leaves the service area the instant it is flipped
                    and the quote engine reads the new list on the next request.
                    A checkbox says a form is being filled in and a save button
                    is waiting somewhere below — there is none, and the lead
                    text says so.
                  */}
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        'min-w-24 text-right text-sm',
                        included ? 'text-ink-secondary' : 'text-ink-tertiary',
                      )}
                    >
                      {included ? t('regionsIncluded') : t('regionsExcluded')}
                    </span>
                    <Switch
                      aria-labelledby={`region-${region.postcode}`}
                      checked={included}
                      onCheckedChange={(next) =>
                        updateSettings({
                          servedPostcodes: next
                            ? [...settings.servedPostcodes, region.postcode]
                            : settings.servedPostcodes.filter(
                                (p) => p !== region.postcode,
                              ),
                        })
                      }
                    />
                  </span>
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
        <section className="mt-8 space-y-6">
          <div className={CARD}>
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

            <div className={cn('mt-6 grid gap-5 sm:grid-cols-2', ROWS)}>
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
                  <NumberField
                    min={1}
                    value={settings.maxJobsPerDay}
                    onCommit={(v) => updateSettings({ maxJobsPerDay: v })}
                    {...props}
                  />
                )}
              </Field>
              <Field label={t('hoursLead')} hint={t('hoursLeadHint')}>
                {(props) => (
                  <NumberField
                    value={settings.minLeadHours}
                    onCommit={(v) => updateSettings({ minLeadHours: v })}
                    {...props}
                  />
                )}
              </Field>
            </div>
          </div>

          {/*
            Its own card rather than a heading further down the first one.
            Working hours are one rule that always applies; a closure is a
            dated exception to it, and the two were reading as one long form.
          */}
          <div className={CARD}>
            <h3 className="display-type text-lg">{t('closuresTitle')}</h3>
            <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
              {t('closuresLead')}
            </p>

            {/* The rows below are outlined, not cards: a card inside a card is
                two edges saying the same thing, and the inner one wins. */}
            {closures.length === 0 ? (
              <p className="mt-4 text-sm text-ink-tertiary">{t('closuresEmpty')}</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {closures.map((closure) => (
                  <li
                    key={closure.id}
                    className="rounded-[var(--radius-md)] border border-line-subtle p-5"
                  >
                    {/* No `ROWS` here on purpose — the remove button is the third
                        cell and it aligns to the bottom of the band, which a
                        trailing hint row would push below the inputs. */}
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
          </div>
        </section>
      )}

      {tab === 'fees' && (
        <section className="mt-8 space-y-6">
          <div className={CARD}>
            <h2 className="display-type text-xl">{t('feesTitle')}</h2>
            <div className={cn('mt-5', FEE_GRID)}>
              <Field label={`${t('feeSaturday')} (%)`}>
                {(props) => (
                  <NumberField
                    value={settings.saturdaySurchargePercent}
                    onCommit={(v) => updateSettings({ saturdaySurchargePercent: v })}
                    {...props}
                  />
                )}
              </Field>
              <Field label={`${t('feeEvening')} (%)`}>
                {(props) => (
                  <NumberField
                    value={settings.eveningSurchargePercent}
                    onCommit={(v) => updateSettings({ eveningSurchargePercent: v })}
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
                  <NumberField
                    value={settings.freeTravelKm}
                    onCommit={(v) => updateSettings({ freeTravelKm: v })}
                    {...props}
                  />
                )}
              </Field>
            </div>
          </div>

          <div className={CARD}>
            <h2 className="display-type text-xl">{t('rulesTitle')}</h2>
            <div className={cn('mt-5', FEE_GRID)}>
              <Field label={`${t('ruleFreeUntil')} (${t('hours')})`}>
                {(props) => (
                  <NumberField
                    value={settings.cancellationFreeHours}
                    onCommit={(v) => updateSettings({ cancellationFreeHours: v })}
                    {...props}
                  />
                )}
              </Field>
              <Field label={`${t('ruleLate')} (%)`}>
                {(props) => (
                  <NumberField
                    value={settings.lateCancellationPercent}
                    onCommit={(v) => updateSettings({ lateCancellationPercent: v })}
                    {...props}
                  />
                )}
              </Field>
              <Field label={`${t('ruleNoAccess')} (%)`}>
                {(props) => (
                  <NumberField
                    value={settings.noAccessFeePercent}
                    onCommit={(v) => updateSettings({ noAccessFeePercent: v })}
                    {...props}
                  />
                )}
              </Field>
            </div>
          </div>

          <div className={CARD}>
            <h2 className="display-type text-xl">{t('subscriptionTitle')}</h2>
            {/*
              The term length and the plan discount used to be edited here, and
              they are gone rather than moved: both are properties of a *plan*
              now, and two plans are allowed to differ on either. Editing them
              globally would have quietly rewritten every plan at once.

              What remains here is the one rule that is a promise the business
              makes once rather than per product.
            */}
            <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-tertiary">
              {t('subscriptionMoved')}
            </p>
            <div className={cn('mt-5', FEE_GRID)}>
              <Field label={`${t('ruleCancellation')} (${t('days')})`} hint={t('ruleCancellationHint')}>
                {(props) => (
                  <NumberField
                    value={settings.planCancellationDays}
                    onCommit={(v) => updateSettings({ planCancellationDays: v })}
                    {...props}
                  />
                )}
              </Field>
              <Field label={t('ruleSkips')}>
                {(props) => (
                  <NumberField
                    value={settings.monthlyFreeSkips}
                    onCommit={(v) => updateSettings({ monthlyFreeSkips: v })}
                    {...props}
                  />
                )}
              </Field>
            </div>
          </div>

          <div className={CARD}>
            <h2 className="display-type text-xl">{t('insuranceTitle')}</h2>
            <div className="mt-4 flex gap-3 border-l-2 border-rule bg-sunken rounded-[var(--radius-lg)] p-5">
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

      {/*
        §9.2 — the mark that goes on every quote.

        It has to be *somewhere*: `sendOffer` reads it, so a signature stored
        in settings that no screen can show or change is a value the panel
        applies to contracts on the owner's behalf without ever admitting it
        exists.
      */}
      {tab === 'contract' && (
        <section className={cn('mt-8 max-w-2xl', CARD)}>
          <h2 className="display-type text-xl">{t('contractTitle')}</h2>
          <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">
            {t('contractLead')}
          </p>

          <div className={cn('mt-6 grid gap-4 sm:grid-cols-2', ROWS)}>
            <Field label={t('signatureName')}>
              {(props) => (
                <Input
                  {...props}
                  value={settings.ownerSignature.name}
                  onChange={(e) =>
                    updateSettings({
                      ownerSignature: { ...settings.ownerSignature, name: e.target.value },
                    })
                  }
                />
              )}
            </Field>
            <Field label={t('signatureRole')} hint={t('signatureRoleHint')}>
              {(props) => (
                <Input
                  {...props}
                  value={settings.ownerSignature.role}
                  onChange={(e) =>
                    updateSettings({
                      ownerSignature: { ...settings.ownerSignature, role: e.target.value },
                    })
                  }
                />
              )}
            </Field>
          </div>

          <div className="mt-8">
            <p className="label-type text-ink-tertiary">{t('signatureCurrent')}</p>
            {redrawn === null ? (
              <>
                <div className="mt-3 rounded-[var(--radius-lg)] border border-line-subtle bg-page px-5 py-4">
                  <SignatureMark
                    path={settings.ownerSignature.path}
                    label={settings.ownerSignature.name}
                    className="text-ink"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setRedrawn('')}
                >
                  {t('signatureRedraw')}
                </Button>
              </>
            ) : (
              <>
                <SignaturePad
                  className="mt-3"
                  label={t('signatureLabel')}
                  hint={t('signatureHint')}
                  clearLabel={t('signatureClearLabel')}
                  onChange={setRedrawn}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={!redrawn}
                    onClick={() => {
                      updateSettings({
                        ownerSignature: { ...settings.ownerSignature, path: redrawn },
                      });
                      setRedrawn(null);
                    }}
                  >
                    {t('signatureSave')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setRedrawn(null)}>
                    {t('signatureCancel')}
                  </Button>
                </div>
              </>
            )}
            <p className="mt-4 flex gap-2 text-sm text-ink-tertiary">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('signatureNote')}
            </p>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
