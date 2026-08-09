'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Building2, Check, Home, Info, Plus, Store } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Field, Input, Checkbox } from '@/components/ui/field';
import { BookingStep } from '@/components/booking/booking-step';
import { checkCoverage } from '@/mock/engines/coverage';
import { useHydrated, useStore } from '@/mock/store';
import type { PropertyKind } from '@/mock/schema';
import { cn } from '@/lib/cn';

const KINDS: { value: PropertyKind; icon: typeof Home; key: 'kindApartment' | 'kindHouse' | 'kindOffice' }[] = [
  { value: 'apartment', icon: Building2, key: 'kindApartment' },
  { value: 'house', icon: Home, key: 'kindHouse' },
  { value: 'office', icon: Store, key: 'kindOffice' },
];

/**
 * Screens 14, 15 and 16 in one step.
 *
 * The coverage check (16) is an inline state here rather than a page of its
 * own — the specification explicitly allows this ("مش لازم يكون شاشة منفصلة"),
 * and interrupting the flow with a full screen to say "yes, we serve your
 * postcode" would be worse for everyone. All three of its states are built.
 *
 * Being outside the area never blocks the request (§20.1): it explains, and
 * offers to send it for manual review.
 */
export default function PropertyStep() {
  const t = useTranslations('booking.property');
  const hydrated = useHydrated();
  const draft = useStore((s) => s.draft);
  const updateDraft = useStore((s) => s.updateDraft);
  const settings = useStore((s) => s.settings);
  const role = useStore((s) => s.demo.role);
  const currentCustomerId = useStore((s) => s.demo.currentCustomerId);
  const properties = useStore((s) => s.data.properties);

  const saved =
    hydrated && role === 'customer'
      ? properties.filter((p) => p.customerId === currentCustomerId)
      : [];

  const p = draft.property;
  const patch = (part: Partial<typeof p>) =>
    updateDraft({ property: { ...p, ...part }, propertyId: null });

  const coverage = checkCoverage(p.postcode, settings.servedPostcodes);
  const usingSaved = Boolean(draft.propertyId);

  const complete = usingSaved || Boolean(p.street && p.postcode && p.city && p.area && p.rooms && p.bathrooms);

  return (
    <BookingStep step="objekt" title={t('title')} canContinue={complete}>
      {saved.length > 0 && (
        <section className="mb-10">
          <h2 className="label-type text-ink-tertiary">{t('savedTitle')}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {saved.map((property) => {
              const active = draft.propertyId === property.id;
              return (
                <li key={property.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors',
                      active ? 'border-line-strong bg-accent-subtle' : 'border-line hover:bg-sunken',
                    )}
                  >
                    <input
                      type="radio"
                      name="property"
                      className="sr-only"
                      checked={active}
                      onChange={() => updateDraft({ propertyId: property.id })}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-medium">{property.label}</span>
                        {active && <Check className="size-4 shrink-0 text-eco" aria-hidden />}
                      </span>
                      <span className="mt-1 block text-sm text-ink-secondary">
                        {property.street}, {property.postcode} {property.city}
                      </span>
                      <span data-numeric className="mt-1 block text-sm text-ink-tertiary">
                        {property.area} m² · {property.rooms} Zi. · {property.bathrooms} Bad
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <Button
            variant="ghost"
            className="mt-3"
            onClick={() => updateDraft({ propertyId: null })}
          >
            <Plus className="size-4" aria-hidden />
            {t('savedNew')}
          </Button>
        </section>
      )}

      {!usingSaved && (
        <div className="space-y-6">
          {saved.length > 0 && (
            <h2 className="label-type text-ink-tertiary">{t('newTitle')}</h2>
          )}

          <Field label={t('street')}>
            {(props) => (
              <Input
                value={p.street}
                autoComplete="street-address"
                onChange={(e) => patch({ street: e.target.value })}
                {...props}
              />
            )}
          </Field>

          <div className="grid gap-6 sm:grid-cols-[8rem_1fr]">
            <Field
              label={t('postcode')}
              error={
                p.postcode && coverage.state === 'invalid'
                  ? 'Vierstellige PLZ'
                  : undefined
              }
            >
              {(props) => (
                <Input
                  value={p.postcode}
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="postal-code"
                  onChange={(e) => patch({ postcode: e.target.value.replace(/\D/g, '') })}
                  {...props}
                />
              )}
            </Field>
            <Field label={t('city')}>
              {(props) => (
                <Input
                  value={p.city}
                  autoComplete="address-level2"
                  onChange={(e) => patch({ city: e.target.value })}
                  {...props}
                />
              )}
            </Field>
          </div>

          {/* Screen 16, inline. */}
          {coverage.state === 'inside' && (
            <p className="flex items-center gap-2 text-sm text-status-success-fg">
              <Check className="size-4 shrink-0" aria-hidden />
              {t('coverageInside', { region: coverage.region.name })}
            </p>
          )}

          {coverage.state === 'outside' && (
            <div className="flex gap-3 border-l-2 border-rule bg-sunken p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
              <div>
                <h3 className="font-medium">{t('coverageOutsideTitle')}</h3>
                <p className="mt-1.5 text-sm text-ink-secondary">
                  {t('coverageOutsideBody', { postcode: coverage.postcode })}
                </p>
                <Button asChild variant="link" className="mt-2.5">
                  <Link href="/gebiete/kuesnacht">{t('coverageShowAreas')}</Link>
                </Button>
              </div>
            </div>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t('kind')}</legend>
            <div className="flex flex-wrap gap-2">
              {KINDS.map(({ value, icon: Icon, key }) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-[var(--radius-action)] border px-4 py-2.5 text-sm transition-colors',
                    p.kind === value
                      ? 'border-line-strong bg-accent-subtle'
                      : 'border-line hover:bg-sunken',
                  )}
                >
                  <input
                    type="radio"
                    name="kind"
                    className="sr-only"
                    checked={p.kind === value}
                    onChange={() => patch({ kind: value })}
                  />
                  <Icon className="size-4" aria-hidden />
                  {t(key)}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-3">
            <Field label={t('area')}>
              {(props) => (
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={p.area ?? ''}
                  onChange={(e) => patch({ area: e.target.value ? Number(e.target.value) : null })}
                  {...props}
                />
              )}
            </Field>
            <Field label={t('rooms')}>
              {(props) => (
                <Input
                  type="number"
                  min={1}
                  step={0.5}
                  inputMode="decimal"
                  value={p.rooms ?? ''}
                  onChange={(e) => patch({ rooms: e.target.value ? Number(e.target.value) : null })}
                  {...props}
                />
              )}
            </Field>
            <Field label={t('bathrooms')}>
              {(props) => (
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={p.bathrooms ?? ''}
                  onChange={(e) =>
                    patch({ bathrooms: e.target.value ? Number(e.target.value) : null })
                  }
                  {...props}
                />
              )}
            </Field>
          </div>

          <div className="flex gap-3 bg-sunken p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
            <div>
              <h3 className="text-sm font-medium">{t('whyTitle')}</h3>
              <p className="mt-1 text-sm text-ink-secondary">{t('whyBody')}</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label={t('floor')} optional>
              {(props) => (
                <Input
                  type="number"
                  inputMode="numeric"
                  value={p.floor}
                  onChange={(e) => patch({ floor: Number(e.target.value) || 0 })}
                  {...props}
                />
              )}
            </Field>
          </div>

          <div className="space-y-3">
            <Checkbox
              label={t('elevator')}
              checked={p.hasElevator}
              onChange={(e) => patch({ hasElevator: e.target.checked })}
            />
            <Checkbox
              label={t('pets')}
              checked={p.hasPets}
              onChange={(e) => patch({ hasPets: e.target.checked })}
            />
            <Checkbox
              label={
                <>
                  {t('effort')}
                  <span className="mt-1 block text-xs text-ink-tertiary">{t('effortHint')}</span>
                </>
              }
              checked={p.needsExtraEffort}
              onChange={(e) => patch({ needsExtraEffort: e.target.checked })}
            />
          </div>
        </div>
      )}
    </BookingStep>
  );
}
