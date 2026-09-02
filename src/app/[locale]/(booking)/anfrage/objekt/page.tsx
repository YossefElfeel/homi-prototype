'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, Building2, Check, Home, Info, Plus, Store } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Field, Input, Checkbox } from '@/components/ui/field';
import { BookingStep } from '@/components/booking/booking-step';
import { checkCoverage } from '@/mock/engines/coverage';
import { useHydrated, useStore } from '@/mock/store';
import type { PropertyKind } from '@/mock/schema';
import { cn } from '@/lib/cn';
import { areaLabel } from '@/lib/property-size';
import { serviceNeeds } from '@/lib/service-flow';

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
 * Being outside the area ends the flow here. The step used to explain and then
 * let the visitor continue anyway, which meant the wizard collected access
 * codes, photos and a preferred date for an address the company does not
 * serve, and the refusal arrived by email a day later. The postcode is the
 * cheapest place to say no, and it is the only place where saying it costs the
 * visitor nothing.
 */
export default function PropertyStep() {
  const t = useTranslations('booking.property');
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const draft = useStore((s) => s.draft);
  const updateDraft = useStore((s) => s.updateDraft);
  const settings = useStore((s) => s.settings);
  const services = useStore((s) => s.services);
  const role = useStore((s) => s.demo.role);
  const currentCustomerId = useStore((s) => s.demo.currentCustomerId);
  const properties = useStore((s) => s.data.properties);

  const service = services.find((s) => s.slug === draft.serviceSlug);
  const needs = serviceNeeds(service);
  const kindLocked = needs.fixedPropertyKind;
  const office = needs.vocabulary === 'office';

  const saved =
    hydrated && role === 'customer'
      ? properties
          .filter((p) => p.customerId === currentCustomerId)
          /* Office cleaning runs on the `office` duration profile, so offering
             the customer's flat here would price a home at a workplace's
             hours. When the service names the kind of property, only that kind
             can be the property. */
          .filter((p) => !kindLocked || p.kind === kindLocked)
      : [];

  const p = draft.property;
  const patch = (part: Partial<typeof p>) =>
    updateDraft({ property: { ...p, ...part }, propertyId: null });

  /*
   * The service already answered this, so the draft has to carry the answer —
   * otherwise a request for office cleaning is filed against a property whose
   * `kind` still says «apartment», and every screen downstream reads the
   * contradiction rather than the service. Written here rather than on the
   * service step because the visitor can reach this step by any route,
   * including the back button after switching service.
   *
   * Deliberately not through `patch`, which clears `propertyId`: this runs on
   * arrival, so routing it through the "the visitor typed something" helper
   * would un-select a saved property the moment the step opened. The pets flag
   * goes with it — it may be left over from a flat the same draft started as,
   * and «Haustiere im Haushalt» is not a fact an office record should carry
   * whether or not anything prices it.
   */
  useEffect(() => {
    if (!kindLocked || (p.kind === kindLocked && !p.hasPets)) return;
    updateDraft({ property: { ...p, kind: kindLocked, hasPets: false } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kindLocked, p.kind, p.hasPets]);

  const usingSaved = Boolean(draft.propertyId);
  const savedProperty = properties.find((x) => x.id === draft.propertyId);

  /* A saved address goes through the same gate as a typed one. The check read
     the form's postcode only, so picking a stored property skipped it — and a
     stored property can sit outside the area, either because it was saved
     before the rule or because the served list changed under it. */
  const coverage = checkCoverage(
    usingSaved ? (savedProperty?.postcode ?? '') : p.postcode,
    settings.servedPostcodes,
  );

  /*
   * A saved address is not automatically a complete one.
   *
   * Picking one skipped every check, which was safe only while every stored
   * property carried a measurement. It does not: the office can file an
   * address from a phone call without one, and `Property.area` is optional so
   * that "unmeasured" stays a real state. Choosing such a flat for a deep
   * clean got the request through with no area at all, and `buildOfferLines`
   * would then quote it at `areaTier(0)` — the *cheapest* bracket on the
   * sheet, which is the kind of wrong number nobody queries.
   */
  const savedIncomplete = Boolean(
    usingSaved && savedProperty && needs.asksArea && savedProperty.area == null,
  );

  /*
   * Only the answers this service actually consumes.
   *
   * Continue used to demand an area, a room count and a bathroom count from
   * everyone — including window cleaning and furniture assembly, whose
   * `durationProfile: 'none'` makes `estimateHours` skip the entire area
   * branch. Three numbers, typed under protest, that could not move the price
   * by a rappen: the flow's own definition of a required field said so, and
   * nothing on the screen did.
   */
  const complete = usingSaved
    ? Boolean(savedProperty) && !savedIncomplete
    : Boolean(
        p.street &&
          p.postcode &&
          p.city &&
          (!needs.asksArea || p.area) &&
          (!needs.asksRooms || p.rooms) &&
          (!needs.asksBathrooms || p.bathrooms),
      );

  return (
    <BookingStep
      step="objekt"
      title={t('title')}
      canContinue={complete && coverage.state !== 'outside'}
    >
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
                        {[
                          areaLabel(property.area),
                          property.rooms != null &&
                            `${property.rooms} ${office ? t('roomsShortOffice') : t('roomsShort')}`,
                          property.bathrooms != null &&
                            `${property.bathrooms} ${office ? t('bathroomsShortOffice') : t('bathroomsShort')}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
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

          {/* Not asked when the service already said it — see `kindLocked`.
              The sentence replaces the control rather than leaving a silently
              pre-selected radio, which reads as a bug. */}
          {kindLocked ? (
            <p className="flex items-center gap-2 text-sm text-ink-secondary">
              <Store className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
              {t('kindFromService', { service: service?.name[locale] ?? '' })}
            </p>
          ) : (
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
          )}

          {/*
            The size block, and only for the services whose duration is
            computed from it. A window clean is priced from a count of window
            leaves; it was still refused at Continue until three numbers had
            been typed that `estimateHours` never reads.
          */}
          {(needs.asksArea || needs.asksRooms || needs.asksBathrooms) && (
            <>
              <div className="grid gap-6 sm:grid-cols-3">
                {needs.asksArea && (
                  <Field label={t('area')}>
                    {(props) => (
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={p.area ?? ''}
                        onChange={(e) =>
                          patch({ area: e.target.value ? Number(e.target.value) : null })
                        }
                        {...props}
                      />
                    )}
                  </Field>
                )}
                {needs.asksRooms && (
                  /* «Zimmer» is a flat; a workplace has «Räume». Same field,
                     and the wrong noun makes the form read as one written for
                     somebody else's booking. */
                  <Field label={office ? t('roomsOffice') : t('rooms')}>
                    {(props) => (
                      <Input
                        type="number"
                        min={1}
                        step={0.5}
                        inputMode="decimal"
                        value={p.rooms ?? ''}
                        onChange={(e) =>
                          patch({ rooms: e.target.value ? Number(e.target.value) : null })
                        }
                        {...props}
                      />
                    )}
                  </Field>
                )}
                {needs.asksBathrooms && (
                  <Field label={office ? t('bathroomsOffice') : t('bathrooms')}>
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
                )}
              </div>

              <div className="flex gap-3 bg-sunken p-4">
                <Info className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
                <div>
                  <h2 className="text-sm font-medium">{t('whyTitle')}</h2>
                  <p className="mt-1 text-sm text-ink-secondary">{t('whyBody')}</p>
                </div>
              </div>
            </>
          )}

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
            {/* Stays for every service: it is how the crew reaches the door,
                not an input to the price. */}
            <Checkbox
              label={t('elevator')}
              checked={p.hasElevator}
              onChange={(e) => patch({ hasElevator: e.target.checked })}
            />
            {/* «Haustiere im Haushalt» has no answer at a workplace, and the
                half hour §5.2 adds for one was being charged for whichever
                answer came back. Gone for the office profile, and gone for the
                counted services, where the surcharge is never applied at
                all. */}
            {needs.asksPets && (
              <Checkbox
                label={t('pets')}
                checked={p.hasPets}
                onChange={(e) => patch({ hasPets: e.target.checked })}
              />
            )}
            {needs.asksCondition && (
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
            )}
          </div>
        </div>
      )}

      {/* A stored address with no measurement on it. Says which figure is
          missing and where to add it, rather than leaving a dead Continue
          button on a card that looks complete. */}
      {savedIncomplete && (
        <div className="mt-8 flex gap-3 border-l-2 border-status-warning-fg bg-sunken p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-warning-fg" aria-hidden />
          <div>
            <h2 className="font-medium">{t('savedUnmeasuredTitle')}</h2>
            <p className="mt-1.5 text-sm text-ink-secondary">{t('savedUnmeasuredBody')}</p>
            <Button variant="link" className="mt-2.5" onClick={() => updateDraft({ propertyId: null })}>
              {t('savedNew')}
            </Button>
          </div>
        </div>
      )}

      {/* Outside the area, so nothing below this matters — and it sits outside
          the form block because a *saved* address can be outside too, and the
          version nested in the form left that case with a dead Continue button
          and no sentence explaining why. */}
      {coverage.state === 'outside' && (
        <div className="mt-8 flex gap-3 border-l-2 border-status-danger-fg bg-sunken p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-danger-fg" aria-hidden />
          <div>
            <h2 className="font-medium">{t('coverageOutsideTitle')}</h2>
            <p className="mt-1.5 text-sm text-ink-secondary">
              {t('coverageOutsideBody', { postcode: coverage.postcode })}
            </p>
            {/* The index, not Küsnacht. The label promises the areas we serve,
                and someone whose postcode we just refused needs the list that
                answers "then where do you go" — not one town's sales page. */}
            <Button asChild variant="link" className="mt-2.5">
              <Link href="/gebiete">{t('coverageShowAreas')}</Link>
            </Button>
          </div>
        </div>
      )}
    </BookingStep>
  );
}
