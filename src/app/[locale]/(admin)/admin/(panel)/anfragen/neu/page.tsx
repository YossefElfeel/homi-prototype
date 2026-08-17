'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { AlertTriangle, Building2, Check, Home, Plus, Store } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CollapsibleSection, SectionGroup } from '@/components/ui/collapsible-section';
import { EmptyState } from '@/components/ui/empty-state';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { MoneyRange } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { computeEstimate } from '@/components/booking/use-estimate';
import { addDays, dayBlockReason, startOfDay } from '@/mock/engines/availability';
import { checkCoverage } from '@/mock/engines/coverage';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { PropertyKind, ServiceSlug, TimeBand } from '@/mock/schema';
import { cn } from '@/lib/cn';

const KINDS: {
  value: PropertyKind;
  icon: typeof Home;
  key: 'kindApartment' | 'kindHouse' | 'kindOffice';
}[] = [
  { value: 'apartment', icon: Building2, key: 'kindApartment' },
  { value: 'house', icon: Home, key: 'kindHouse' },
  { value: 'office', icon: Store, key: 'kindOffice' },
];

const BANDS: { value: TimeBand; key: 'bandMorning' | 'bandMidday' | 'bandAfternoon' }[] = [
  { value: 'morning', key: 'bandMorning' },
  { value: 'midday', key: 'bandMidday' },
  { value: 'afternoon', key: 'bandAfternoon' },
];

/* The same map screens 53 and 63 already carry. German only, like theirs — the
   panel is the owner's and runs in German regardless of the site locale. */
const ACCESS_LABELS: Record<string, string> = {
  'customer-present': 'Kunde ist da',
  'key-left': 'Schlüssel liegt bereit',
  'key-box': 'Schlüsselkasten mit Code',
  'other-person': 'Andere Person ist da',
};

/** Four weeks is what the wizard offers; the office should not see fewer days. */
const DAYS_SHOWN = 28;

const NEW_PROPERTY = '__new__';

const emptyProperty = () => ({
  street: '',
  postcode: '',
  city: '',
  kind: 'apartment' as PropertyKind,
  area: null as number | null,
  rooms: null as number | null,
  bathrooms: null as number | null,
  floor: 0,
  hasElevator: false,
  hasPets: false,
  needsExtraEffort: false,
});

/**
 * Screen 52a — intake for the phone.
 *
 * The eight-step wizard is the right shape for a visitor meeting the form for
 * the first time. It is the wrong shape for the person who knows it by heart
 * and is holding a phone while a customer says the address, then the date, then
 * goes back to the address. So the same eight steps live on one page as
 * collapsible sections that can be opened in any order and left open together.
 *
 * What is *not* rebuilt here matters more than what is: coverage, pricing and
 * the lead-time rules are the same engines the public flow calls, and the
 * record it writes goes through `createRequestForCustomer`. A phoned-in request
 * and a self-service one are the same object by the time anything downstream
 * sees them — which is the only way the quote builder, the calendar and the
 * response-time counter can stay honest.
 *
 * Access is deliberately read-only here. It belongs to the property (§13.1),
 * and letting an intake form quietly rewrite the key location of a property
 * that already has one is how a contractor ends up standing at the wrong door.
 */
export default function NewRequestPage() {
  const t = useTranslations('admin.requestNew');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);
  const settings = useStore((s) => s.settings);
  const bookings = useStore((s) => s.data.bookings);
  const closures = useStore((s) => s.data.closures);
  const createProperty = useStore((s) => s.createProperty);
  const createRequestForCustomer = useStore((s) => s.createRequestForCustomer);

  const [open, setOpen] = useState<string[]>(['customer', 'property', 'service']);

  const [customerId, setCustomerId] = useState('');
  const [propertyChoice, setPropertyChoice] = useState<string>(NEW_PROPERTY);
  const [property, setProperty] = useState(emptyProperty);
  const [serviceSlug, setServiceSlug] = useState<ServiceSlug | ''>('');
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [windowCount, setWindowCount] = useState<number | null>(null);
  const [furniturePieces, setFurniturePieces] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [band, setBand] = useState<TimeBand | null>(null);
  const [flexible, setFlexible] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const customerProperties = useMemo(
    () => properties.filter((p) => p.customerId === customerId),
    [properties, customerId],
  );

  const usingSaved = propertyChoice !== NEW_PROPERTY;
  const savedProperty = usingSaved
    ? customerProperties.find((p) => p.id === propertyChoice)
    : undefined;

  const service = services.find((s) => s.slug === serviceSlug);
  const serviceAddOns = useMemo(
    () =>
      serviceSlug
        ? addOns.filter((a) => a.active && a.services.includes(serviceSlug))
        : [],
    [addOns, serviceSlug],
  );

  const coverage = checkCoverage(
    savedProperty?.postcode ?? property.postcode,
    settings.servedPostcodes,
  );

  const days = useMemo(() => {
    const from = startOfDay(now);
    return Array.from({ length: DAYS_SHOWN }, (_, i) => {
      const day = addDays(from, i);
      return { day, blocked: dayBlockReason(day, { bookings, closures, settings, now }) };
    });
  }, [now, bookings, closures, settings]);

  const estimate = useMemo(
    () =>
      computeEstimate(
        {
          serviceSlug: serviceSlug || null,
          propertyId: savedProperty?.id ?? null,
          property,
          addOnIds,
          windowCount,
          furniturePieces,
        },
        { services, addOns, settings, properties },
      ),
    [
      serviceSlug,
      savedProperty,
      property,
      addOnIds,
      windowCount,
      furniturePieces,
      services,
      addOns,
      settings,
      properties,
    ],
  );

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  /* ------------------------------------------------------------ readiness */

  const propertyReady = usingSaved
    ? Boolean(savedProperty)
    : Boolean(
        property.street &&
          coverage.state !== 'invalid' &&
          property.city &&
          property.area &&
          property.rooms &&
          property.bathrooms,
      );

  const countNeeded =
    service?.calc === 'perUnit'
      ? !windowCount
      : service?.slug === 'moebelmontage'
        ? !furniturePieces
        : false;

  const serviceReady = Boolean(service) && !countNeeded;
  const timeReady = flexible || Boolean(date && band);

  const missing = [
    !customerId && t('missingCustomer'),
    !propertyReady && t('missingProperty'),
    !serviceReady && t('missingService'),
  ].filter(Boolean) as string[];

  const canSave = missing.length === 0;

  /* --------------------------------------------------------------- submit */

  function save(thenQuote: boolean) {
    if (!canSave || !serviceSlug) return;

    /* A typed-in address becomes a real property first — the request needs an
       id to point at, and the office should not have to create the property on
       a separate screen before it can write down the call. */
    const propertyId = savedProperty
      ? savedProperty.id
      : createProperty(
          {
            customerId,
            label: property.street,
            street: property.street,
            postcode: property.postcode,
            city: property.city,
            kind: property.kind,
            area: property.area ?? 0,
            rooms: property.rooms ?? 0,
            bathrooms: property.bathrooms ?? 1,
            floor: property.floor,
            hasElevator: property.hasElevator,
            hasPets: property.hasPets,
            needsExtraEffort: property.needsExtraEffort,
          },
          now,
        );

    const result = createRequestForCustomer(
      {
        customerId,
        propertyId,
        serviceSlug,
        addOnIds,
        windowCount,
        furniturePieces,
        preferred: flexible
          ? { flexible: true }
          : { date: date ?? undefined, band: band ?? undefined, flexible: false },
        customerNote,
        internalNote,
      },
      now,
    );

    toast.success(
      result.outOfArea
        ? t('doneOutOfArea', { reference: result.reference })
        : t('done', { reference: result.reference }),
    );
    router.push(
      thenQuote ? `/admin/anfragen/${result.id}/offerte` : `/admin/anfragen/${result.id}`,
    );
  }

  /* -------------------------------------------------------------- summary */

  const customer = customers.find((c) => c.id === customerId);
  const propertySummary = savedProperty
    ? `${savedProperty.street}, ${savedProperty.postcode} ${savedProperty.city}`
    : property.street
      ? `${property.street}, ${property.postcode} ${property.city}`.trim()
      : t('propertyNone');

  const timeSummary = flexible
    ? t('timeFlexible')
    : date && band
      ? `${format.dateTime(new Date(date), 'short')} · ${t(
          BANDS.find((b) => b.value === band)!.key,
        )}`
      : t('timeNone');

  const allValues = ['customer', 'property', 'access', 'service', 'extras', 'time', 'notes'];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        back={{ href: '/admin/anfragen', label: t('back') }}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(open.length === allValues.length ? [] : allValues)}
          >
            {open.length === allValues.length ? t('closeAll') : t('openAll')}
          </Button>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          headingLevel={2}
          title={t('customerEmptyTitle')}
          body={t('customerEmptyBody')}
          action={
            <Button asChild>
              <Link href="/admin/kunden/neu">
                <Plus className="size-4" aria-hidden />
                {t('customerNew')}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-app-section lg:grid-cols-[1fr_20rem] lg:items-start">
          <SectionGroup value={open} onValueChange={setOpen}>
            {/* ------------------------------------------------ 1 customer */}
            <CollapsibleSection
              value="customer"
              step={1}
              title={t('customerTitle')}
              complete={Boolean(customerId)}
              summary={
                customer ? `${customer.firstName} ${customer.lastName}` : t('customerNone')
              }
            >
              <div className="flex flex-wrap items-end gap-4">
                <Field label={t('customerPick')} className="min-w-64 flex-1">
                  {(props) => (
                    <Select
                      {...props}
                      value={customerId}
                      onChange={(e) => {
                        setCustomerId(e.target.value);
                        /* Properties belong to a customer; keeping the old
                           selection would point the request at somebody
                           else's address. */
                        setPropertyChoice(NEW_PROPERTY);
                        setProperty(emptyProperty());
                      }}
                    >
                      <option value="" disabled>
                        {t('customerPlaceholder')}
                      </option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.lastName}, {c.firstName} — {c.phone}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Button asChild variant="secondary">
                  <Link href="/admin/kunden/neu">
                    <Plus className="size-4" aria-hidden />
                    {t('customerNew')}
                  </Link>
                </Button>
              </div>
            </CollapsibleSection>

            {/* ------------------------------------------------ 2 property */}
            <CollapsibleSection
              value="property"
              step={2}
              title={t('propertyTitle')}
              complete={propertyReady}
              summary={propertySummary}
            >
              {!customerId ? (
                <p className="text-ink-secondary">{t('propertyPickFirst')}</p>
              ) : (
                <div className="space-y-6">
                  {customerProperties.length > 0 && (
                    <Field label={t('propertySaved')}>
                      {(props) => (
                        <Select
                          {...props}
                          value={propertyChoice}
                          onChange={(e) => setPropertyChoice(e.target.value)}
                        >
                          {customerProperties.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label} — {p.postcode} {p.city}
                            </option>
                          ))}
                          <option value={NEW_PROPERTY}>{t('propertyNewShort')}</option>
                        </Select>
                      )}
                    </Field>
                  )}

                  {!usingSaved && (
                    <div className="space-y-6">
                      <Field label={t('street')}>
                        {(props) => (
                          <Input
                            {...props}
                            value={property.street}
                            onChange={(e) =>
                              setProperty({ ...property, street: e.target.value })
                            }
                          />
                        )}
                      </Field>

                      <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
                        <Field
                          label={t('postcode')}
                          error={
                            property.postcode && coverage.state === 'invalid'
                              ? t('postcodeInvalid')
                              : undefined
                          }
                        >
                          {(props) => (
                            <Input
                              {...props}
                              value={property.postcode}
                              inputMode="numeric"
                              maxLength={4}
                              onChange={(e) =>
                                setProperty({
                                  ...property,
                                  postcode: e.target.value.replace(/\D/g, ''),
                                })
                              }
                            />
                          )}
                        </Field>
                        <Field label={t('city')}>
                          {(props) => (
                            <Input
                              {...props}
                              value={property.city}
                              onChange={(e) =>
                                setProperty({ ...property, city: e.target.value })
                              }
                            />
                          )}
                        </Field>
                      </div>

                      {/* Screen 16's three states, inline — the same check the
                          visitor gets, so the office never promises coverage
                          the scheduler will not honour. */}
                      {coverage.state === 'inside' && (
                        <p className="flex items-center gap-2 text-sm text-status-success-fg">
                          <Check className="size-4 shrink-0" aria-hidden />
                          {t('coverageInside', { region: coverage.region.name })}
                        </p>
                      )}
                      {coverage.state === 'outside' && (
                        <Card tone="warning" pad="sm" className="flex gap-3">
                          <AlertTriangle
                            className="mt-0.5 size-4 shrink-0 text-status-warning-fg"
                            aria-hidden
                          />
                          <div>
                            <h3 className="text-sm font-medium">
                              {t('coverageOutsideTitle')}
                            </h3>
                            <p className="mt-1 text-sm text-ink-secondary">
                              {t('coverageOutsideBody', { postcode: coverage.postcode })}
                            </p>
                          </div>
                        </Card>
                      )}

                      <fieldset>
                        <legend className="mb-2 text-sm font-medium">{t('kind')}</legend>
                        <div className="flex flex-wrap gap-2">
                          {KINDS.map(({ value, icon: Icon, key }) => (
                            <label
                              key={value}
                              className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-[var(--radius-action)] border px-4 py-2.5 text-sm transition-colors',
                                property.kind === value
                                  ? 'border-line-strong bg-accent-subtle'
                                  : 'border-line hover:bg-sunken',
                              )}
                            >
                              <input
                                type="radio"
                                name="kind"
                                className="sr-only"
                                checked={property.kind === value}
                                onChange={() => setProperty({ ...property, kind: value })}
                              />
                              <Icon className="size-4" aria-hidden />
                              {t(key)}
                            </label>
                          ))}
                        </div>
                      </fieldset>

                      <div className="grid gap-5 sm:grid-cols-4">
                        <Field label={t('area')}>
                          {(props) => (
                            <Input
                              {...props}
                              type="number"
                              min={1}
                              inputMode="numeric"
                              value={property.area ?? ''}
                              onChange={(e) =>
                                setProperty({
                                  ...property,
                                  area: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                            />
                          )}
                        </Field>
                        <Field label={t('rooms')}>
                          {(props) => (
                            <Input
                              {...props}
                              type="number"
                              min={1}
                              step={0.5}
                              inputMode="decimal"
                              value={property.rooms ?? ''}
                              onChange={(e) =>
                                setProperty({
                                  ...property,
                                  rooms: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                            />
                          )}
                        </Field>
                        <Field label={t('bathrooms')}>
                          {(props) => (
                            <Input
                              {...props}
                              type="number"
                              min={1}
                              inputMode="numeric"
                              value={property.bathrooms ?? ''}
                              onChange={(e) =>
                                setProperty({
                                  ...property,
                                  bathrooms: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                            />
                          )}
                        </Field>
                        <Field label={t('floor')} optional>
                          {(props) => (
                            <Input
                              {...props}
                              type="number"
                              inputMode="numeric"
                              value={property.floor}
                              onChange={(e) =>
                                setProperty({
                                  ...property,
                                  floor: Number(e.target.value) || 0,
                                })
                              }
                            />
                          )}
                        </Field>
                      </div>

                      <div className="space-y-3">
                        <Checkbox
                          label={t('elevator')}
                          checked={property.hasElevator}
                          onChange={(e) =>
                            setProperty({ ...property, hasElevator: e.target.checked })
                          }
                        />
                        <Checkbox
                          label={t('pets')}
                          checked={property.hasPets}
                          onChange={(e) =>
                            setProperty({ ...property, hasPets: e.target.checked })
                          }
                        />
                        <Checkbox
                          label={t('effort')}
                          checked={property.needsExtraEffort}
                          onChange={(e) =>
                            setProperty({
                              ...property,
                              needsExtraEffort: e.target.checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CollapsibleSection>

            {/* -------------------------------------------------- 3 access */}
            <CollapsibleSection
              value="access"
              step={3}
              title={t('accessTitle')}
              complete={Boolean(savedProperty?.access)}
              summary={
                savedProperty?.access
                  ? t('accessOnFile', {
                      method:
                        ACCESS_LABELS[savedProperty.access.method] ??
                        savedProperty.access.method,
                    })
                  : t('accessNone')
              }
            >
              <p className="text-sm text-ink-secondary">{t('accessEditHint')}</p>
              {savedProperty && (
                <Button asChild variant="secondary" size="sm" className="mt-4">
                  <Link href={`/admin/objekte/${savedProperty.id}`}>
                    {t('accessOpenProperty')}
                  </Link>
                </Button>
              )}
            </CollapsibleSection>

            {/* ------------------------------------------------- 4 service */}
            <CollapsibleSection
              value="service"
              step={4}
              title={t('serviceTitle')}
              complete={serviceReady}
              summary={service ? service.name[locale] : t('serviceNone')}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('serviceTitle')}>
                  {(props) => (
                    <Select
                      {...props}
                      value={serviceSlug}
                      onChange={(e) => {
                        setServiceSlug(e.target.value as ServiceSlug);
                        // Add-ons are scoped to a service; carrying them over
                        // would price a window clean onto a furniture job.
                        setAddOnIds([]);
                      }}
                    >
                      <option value="" disabled>
                        {t('serviceNone')}
                      </option>
                      {services
                        .filter((s) => s.active)
                        .map((s) => (
                          <option key={s.slug} value={s.slug}>
                            {s.name[locale]}
                          </option>
                        ))}
                    </Select>
                  )}
                </Field>

                {service?.calc === 'perUnit' && (
                  <Field label={t('windowCount')} hint={t('countHint')}>
                    {(props) => (
                      <Input
                        {...props}
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={windowCount ?? ''}
                        onChange={(e) =>
                          setWindowCount(e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    )}
                  </Field>
                )}

                {service?.slug === 'moebelmontage' && (
                  <Field label={t('furniturePieces')} hint={t('countHint')}>
                    {(props) => (
                      <Input
                        {...props}
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={furniturePieces ?? ''}
                        onChange={(e) =>
                          setFurniturePieces(e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    )}
                  </Field>
                )}
              </div>
            </CollapsibleSection>

            {/* -------------------------------------------------- 5 extras */}
            <CollapsibleSection
              value="extras"
              step={5}
              title={t('extrasTitle')}
              optional
              optionalLabel={t('optional')}
              complete={addOnIds.length > 0}
              summary={
                addOnIds.length > 0 ? t('extrasCount', { n: addOnIds.length }) : t('extrasNone')
              }
            >
              {!service ? (
                <p className="text-ink-secondary">{t('extrasPickService')}</p>
              ) : serviceAddOns.length === 0 ? (
                <p className="text-ink-secondary">{t('extrasEmpty')}</p>
              ) : (
                <div className="space-y-3">
                  {serviceAddOns.map((addOn) => (
                    <Checkbox
                      key={addOn.id}
                      checked={addOnIds.includes(addOn.id)}
                      onChange={(e) =>
                        setAddOnIds(
                          e.target.checked
                            ? [...addOnIds, addOn.id]
                            : addOnIds.filter((id) => id !== addOn.id),
                        )
                      }
                      label={
                        <>
                          <span className="text-ink">{addOn.name[locale]}</span>
                          <span className="mt-0.5 block text-xs text-ink-tertiary">
                            {addOn.short[locale]}
                          </span>
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* ---------------------------------------------------- 6 time */}
            <CollapsibleSection
              value="time"
              step={6}
              title={t('timeTitle')}
              optional
              optionalLabel={t('optional')}
              complete={timeReady}
              summary={timeSummary}
            >
              <p className="text-sm text-ink-secondary">{t('timeLead')}</p>

              <div className="mt-5">
                <Checkbox
                  label={t('timeFlexible')}
                  checked={flexible}
                  onChange={(e) => setFlexible(e.target.checked)}
                />
              </div>

              <fieldset className="mt-6" disabled={flexible}>
                <legend className="label-type mb-3 text-ink-tertiary">
                  {t('timeLeadHint', { hours: settings.minLeadHours })}
                </legend>
                <ul
                  className={cn(
                    'grid grid-cols-4 gap-2 sm:grid-cols-7',
                    flexible && 'opacity-45',
                  )}
                >
                  {days.map(({ day, blocked }) => {
                    const iso = day.toISOString();
                    const active = date === iso;
                    return (
                      <li key={iso}>
                        <label
                          className={cn(
                            'flex h-full flex-col items-center rounded-[var(--radius-md)] border px-1 py-2 text-center transition-colors',
                            blocked
                              ? 'cursor-not-allowed border-line-subtle bg-sunken text-ink-tertiary opacity-60'
                              : 'cursor-pointer border-line hover:bg-sunken',
                            active && !blocked && 'border-line-strong bg-accent-subtle',
                          )}
                          title={
                            blocked === 'too-soon'
                              ? t('timeBlockedSoon', { hours: settings.minLeadHours })
                              : blocked
                                ? t('timeBlockedClosed')
                                : undefined
                          }
                        >
                          <input
                            type="radio"
                            name="day"
                            className="sr-only"
                            disabled={Boolean(blocked)}
                            checked={active}
                            onChange={() => setDate(iso)}
                          />
                          <span className="label-type text-[0.625rem] text-ink-tertiary">
                            {format.dateTime(day, { weekday: 'short' })}
                          </span>
                          <span data-numeric className="text-base">
                            {format.dateTime(day, { day: 'numeric' })}
                          </span>
                          <span className="text-[0.625rem] text-ink-tertiary">
                            {format.dateTime(day, { month: 'short' })}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>

              <fieldset className="mt-6" disabled={flexible}>
                <legend className="label-type mb-3 text-ink-tertiary">{t('timeBand')}</legend>
                <div className={cn('flex flex-wrap gap-2', flexible && 'opacity-45')}>
                  {BANDS.map((b) => (
                    <label
                      key={b.value}
                      className={cn(
                        'cursor-pointer rounded-[var(--radius-action)] border px-4 py-2.5 text-sm transition-colors',
                        band === b.value
                          ? 'border-line-strong bg-accent-subtle'
                          : 'border-line hover:bg-sunken',
                      )}
                    >
                      <input
                        type="radio"
                        name="band"
                        className="sr-only"
                        checked={band === b.value}
                        onChange={() => setBand(b.value)}
                      />
                      {t(b.key)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </CollapsibleSection>

            {/* --------------------------------------------------- 7 notes */}
            <CollapsibleSection
              value="notes"
              step={7}
              title={t('notesTitle')}
              optional
              optionalLabel={t('optional')}
              complete={Boolean(customerNote.trim() || internalNote.trim())}
              summary={customerNote.trim() || internalNote.trim() || t('notesNone')}
            >
              <div className="space-y-5">
                {/*
                  Two boxes, not one. What the customer said travels with the
                  request and can be read back to them; what the office thought
                  never leaves the panel. One field would force the owner to
                  choose between losing the second or leaking it.
                */}
                <Field label={t('customerNote')} hint={t('customerNoteHint')}>
                  {(props) => (
                    <Textarea
                      {...props}
                      value={customerNote}
                      placeholder={t('customerNotePlaceholder')}
                      onChange={(e) => setCustomerNote(e.target.value)}
                    />
                  )}
                </Field>
                <Field label={t('internalNote')} hint={t('internalNoteHint')}>
                  {(props) => (
                    <Textarea
                      {...props}
                      value={internalNote}
                      placeholder={t('internalNotePlaceholder')}
                      onChange={(e) => setInternalNote(e.target.value)}
                    />
                  )}
                </Field>
              </div>
            </CollapsibleSection>
          </SectionGroup>

          {/* ---------------------------------------------- live estimate */}
          <aside className="lg:sticky lg:top-app-section">
            <Card>
              <h2 className="label-type text-ink-tertiary">{t('estimateTitle')}</h2>
              {estimate ? (
                <>
                  <p className="mt-2 text-2xl">
                    <MoneyRange low={estimate.rangeLow} high={estimate.rangeHigh} />
                  </p>
                  <dl className="mt-4 flex items-baseline justify-between border-t border-line-subtle pt-3 text-sm">
                    <dt className="text-ink-secondary">{t('estimateHours')}</dt>
                    <dd data-numeric>
                      {t('hoursValue', { hours: estimate.scheduledHours })}
                    </dd>
                  </dl>
                  <p className="mt-3 text-xs text-ink-tertiary">{t('estimateHint')}</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-ink-secondary">{t('estimateWaiting')}</p>
              )}

              {missing.length > 0 && (
                <div className="mt-5 border-t border-line-subtle pt-4">
                  <p className="text-sm font-medium">{t('missingTitle')}</p>
                  <ul className="mt-1.5 space-y-0.5 text-sm text-ink-secondary">
                    {missing.map((label) => (
                      <li key={label}>· {label}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 space-y-2 border-t border-line-subtle pt-4">
                {/*
                  Two exits, because the office has two. Most calls end with a
                  quote written while the customer is still on the line; some
                  end with "I'll check with my husband" and want only the
                  record. Forcing the second through the quote builder is how
                  half-finished drafts pile up in the offers list.
                */}
                <Button block disabled={!canSave} onClick={() => save(true)}>
                  {t('saveAndQuote')}
                </Button>
                <Button
                  block
                  variant="secondary"
                  disabled={!canSave}
                  onClick={() => save(false)}
                >
                  {t('save')}
                </Button>
                <Button asChild block variant="ghost">
                  <Link href="/admin/anfragen">{t('cancel')}</Link>
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
