'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { AlertTriangle, Building2, Check, Home, Plus, Store, Trash2 } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CollapsibleSection, SectionGroup } from '@/components/ui/collapsible-section';
import { ConfirmDialog, useDismissLabel } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { MoneyRange } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { computeEstimate } from '@/components/booking/use-estimate';
import { addDays, dayBlockReason, startOfDay } from '@/mock/engines/availability';
import { checkCoverage } from '@/mock/engines/coverage';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { PropertyKind, TimeBand } from '@/mock/schema';
import { isOffered } from '@/lib/service-catalogue';
import { serviceNeeds } from '@/lib/service-flow';
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
 * The wizard is the right shape for a visitor meeting the form for the first
 * time. It is the wrong shape for the person who knows it by heart and is
 * holding a phone while a customer says the address, then the date, then goes
 * back to the address. So the same steps live on one page as collapsible
 * sections that can be opened in any order and left open together.
 *
 * Which questions those sections carry is the service's answer, not this
 * page's: `serviceNeeds` is the same module the wizard reads, so the office is
 * never asked down the telephone for a figure the website would not have
 * collected — nor spared one it would have.
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
  const dismissLabel = useDismissLabel();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const requests = useStore((s) => s.data.requests);
  const services = useStore((s) => s.services);
  const plans = useStore((s) => s.plans);
  const addOns = useStore((s) => s.addOns);
  const settings = useStore((s) => s.settings);
  const bookings = useStore((s) => s.data.bookings);
  const closures = useStore((s) => s.data.closures);
  const createProperty = useStore((s) => s.createProperty);
  const createRequestForCustomer = useStore((s) => s.createRequestForCustomer);
  const updateRequest = useStore((s) => s.updateRequest);
  const submitRequestDraft = useStore((s) => s.submitRequestDraft);
  const discardRequestDraft = useStore((s) => s.discardRequestDraft);
  const events = useStore((s) => s.data.events);
  const linkEventToRequest = useStore((s) => s.linkEventToRequest);

  const search = useSearchParams();
  /** Set when the screen was opened on an existing draft (`?draft=req_…`). */
  const draftId = search.get('draft');
  const draft = requests.find((r) => r.id === draftId && r.status === 'draft');

  /*
   * Set when this intake came out of a call on the calendar (`?event=cev_…`).
   *
   * Without the link back, a call that produced work would be ticked off in
   * one screen and retyped from memory in another, and the calendar entry
   * would sit there afterwards as a promise still apparently unkept.
   */
  const sourceEventId = search.get('event');
  const sourceEvent = events.find((e) => e.id === sourceEventId);

  const [open, setOpen] = useState<string[]>(['customer', 'property', 'service']);
  const [discarding, setDiscarding] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [propertyChoice, setPropertyChoice] = useState<string>(NEW_PROPERTY);
  const [property, setProperty] = useState(emptyProperty);
  const [serviceSlug, setServiceSlug] = useState<string>('');
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [windowCount, setWindowCount] = useState<number | null>(null);
  const [furniturePieces, setFurniturePieces] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [band, setBand] = useState<TimeBand | null>(null);
  const [flexible, setFlexible] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [internalNote, setInternalNote] = useState('');

  /*
   * Load an existing draft into the form, exactly once.
   *
   * Once only, and guarded by a ref rather than by comparing values: every
   * field below is controlled, so re-running this on any later render would
   * fight the person typing — each keystroke would be reset to what the store
   * still holds. The draft is the starting point, not a live binding.
   */
  /*
   * Prefill from the call, once, on the same guard and for the same reason as
   * the draft below: every field is controlled, so re-running would fight the
   * person typing. The customer and the note are all a call can supply — the
   * address and the service are what the request screen is for.
   */
  const seededFromEvent = useRef(false);
  useEffect(() => {
    if (!sourceEvent || seededFromEvent.current) return;
    seededFromEvent.current = true;
    setCustomerId(sourceEvent.customerId ?? '');
    /* Unconditional, mirroring the draft loader below. Both fields already
       default to empty, so branching here buys nothing but a cascading-render
       lint error. */
    setInternalNote([sourceEvent.note, sourceEvent.outcome].filter(Boolean).join('\n'));
  }, [sourceEvent]);

  const loaded = useRef<string | null>(null);
  useEffect(() => {
    if (!draft || loaded.current === draft.id) return;
    loaded.current = draft.id;

    setCustomerId(draft.customerId);
    setPropertyChoice(draft.propertyId);
    setServiceSlug(draft.serviceSlug);
    setAddOnIds(draft.addOnIds);
    setWindowCount(draft.windowCount ?? null);
    setFurniturePieces(draft.furniturePieces ?? null);
    setFlexible(draft.preferred.flexible);
    setDate(draft.preferred.date ?? null);
    setBand(draft.preferred.band ?? null);
    setCustomerNote(draft.customerNote ?? '');
    setInternalNote(draft.internalNote ?? '');
  }, [draft]);

  const customerProperties = useMemo(
    () => properties.filter((p) => p.customerId === customerId),
    [properties, customerId],
  );

  const usingSaved = propertyChoice !== NEW_PROPERTY;
  const savedProperty = usingSaved
    ? customerProperties.find((p) => p.id === propertyChoice)
    : undefined;

  const service = services.find((s) => s.slug === serviceSlug);
  const needs = serviceNeeds(service);
  const office = needs.vocabulary === 'office';
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
        { services, addOns, settings, properties, plans },
      ),
    [
      plans,
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

  /* The same rule the wizard applies, from the same module. The office had to
     collect an area, a room count and a bathroom count before it could file a
     phoned-in window clean — three questions to read down the line whose
     answers the quote would never use. */
  const propertyReady = usingSaved
    ? Boolean(savedProperty)
    : Boolean(
        property.street &&
          coverage.state !== 'invalid' &&
          property.city &&
          (!needs.asksArea || property.area) &&
          (!needs.asksRooms || property.rooms) &&
          (!needs.asksBathrooms || property.bathrooms),
      );

  const countNeeded =
    (needs.asksWindowCount && !windowCount) ||
    (needs.asksFurniturePieces && !furniturePieces);

  const serviceReady = Boolean(service) && !countNeeded;
  const timeReady = flexible || Boolean(date && band);

  const missing = [
    !customerId && t('missingCustomer'),
    !propertyReady && t('missingProperty'),
    /* Its own line rather than folded into `propertyReady`: everything else in
       that list is an answer still to be typed, and this one is complete and
       still refused. The office needs to read which of the two it is. */
    propertyReady && coverage.state === 'outside' && t('missingOutOfArea'),
    !serviceReady && t('missingService'),
  ].filter(Boolean) as string[];

  const canSave = missing.length === 0;

  /* --------------------------------------------------------------- submit */

  const preferred = flexible
    ? { flexible: true }
    : { date: date ?? undefined, band: band ?? undefined, flexible: false };

  /**
   * Turns whatever address is on screen into a real property id.
   *
   * A typed-in address has to become a property before anything can point at
   * it — and the office should not have to visit another screen mid-call to
   * make that happen. Returns null only when there is nothing to save yet,
   * which is legal for a draft and not for a request.
   */
  function resolvePropertyId(): string | null {
    if (savedProperty) return savedProperty.id;
    if (!customerId || !property.street) return null;
    return createProperty(
      {
        customerId,
        label: property.street,
        street: property.street,
        postcode: property.postcode,
        city: property.city,
        /* `Property.area` is optional so "unmeasured" and "measures nothing"
           stay different facts — and a request the office takes for window
           cleaning now legitimately has no area at all. */
        kind: needs.fixedPropertyKind ?? property.kind,
        area: property.area ?? undefined,
        rooms: property.rooms ?? undefined,
        bathrooms: property.bathrooms ?? undefined,
        floor: property.floor,
        hasElevator: property.hasElevator,
        hasPets: property.hasPets,
        needsExtraEffort: property.needsExtraEffort,
      },
      now,
    );
  }

  function save(thenQuote: boolean) {
    if (!canSave || !serviceSlug) return;
    const propertyId = resolvePropertyId();
    if (!propertyId) return;

    /* Promoting an existing draft rather than creating a second record — the
       reference the office may already have read out on the phone stays the
       one the customer hears again. */
    if (draft) {
      updateRequest(draft.id, {
        customerId,
        propertyId,
        serviceSlug,
        addOnIds,
        windowCount: windowCount ?? undefined,
        furniturePieces: furniturePieces ?? undefined,
        preferred,
        customerNote: customerNote.trim() || undefined,
        internalNote: internalNote.trim() || undefined,
      });
      submitRequestDraft(draft.id, now);
      toast.success(t('done', { reference: draft.reference }));
      router.push(
        thenQuote ? `/admin/anfragen/${draft.id}/offerte` : `/admin/anfragen/${draft.id}`,
      );
      return;
    }

    const result = createRequestForCustomer(
      {
        customerId,
        propertyId,
        serviceSlug,
        addOnIds,
        windowCount,
        furniturePieces,
        preferred,
        customerNote,
        internalNote,
      },
      now,
    );

    /* The store refuses an out-of-area address, and `canSave` already says so
       above the buttons — this is the belt to that pair of braces, so a rule
       change in one place cannot leave the screen claiming a request exists. */
    if (!result) {
      toast.error(t('missingOutOfArea'));
      return;
    }

    /* Closes the loop on the calendar. The call stops being an open promise
       the moment the work it produced exists. */
    if (sourceEvent) linkEventToRequest(sourceEvent.id, result.id, now);

    toast.success(t('done', { reference: result.reference }));
    router.push(
      thenQuote ? `/admin/anfragen/${result.id}/offerte` : `/admin/anfragen/${result.id}`,
    );
  }

  /**
   * Save without finishing.
   *
   * The only hard requirement is a customer — a draft has to belong to
   * somebody to be findable again. Everything else may be missing, which is
   * the entire point: the call ended before the answers did.
   */
  function saveDraft() {
    if (!customerId) return;

    if (draft) {
      updateRequest(draft.id, {
        customerId,
        propertyId: resolvePropertyId() ?? draft.propertyId,
        ...(serviceSlug ? { serviceSlug } : {}),
        addOnIds,
        windowCount: windowCount ?? undefined,
        furniturePieces: furniturePieces ?? undefined,
        preferred,
        customerNote: customerNote.trim() || undefined,
        internalNote: internalNote.trim() || undefined,
      });
      toast.success(t('draftUpdated'));
      router.push('/admin/anfragen');
      return;
    }

    const result = createRequestForCustomer(
      {
        customerId,
        /* An empty string rather than a fabricated property: the draft has to
           be storable before the address is known, and a placeholder record in
           `properties` would be a real object nobody asked for. */
        propertyId: resolvePropertyId() ?? '',
        serviceSlug: serviceSlug || 'unterhaltsreinigung',
        addOnIds,
        windowCount,
        furniturePieces,
        preferred,
        customerNote,
        internalNote,
        asDraft: true,
      },
      now,
    );
    /* `asDraft` is exempt from the area check, so this branch is unreachable —
       it is here because the signature cannot say "never null for a draft",
       and a `!` would silently become a crash the day that changes. */
    if (!result) return;
    toast.success(t('draftSaved', { reference: result.reference }));
    router.push('/admin/anfragen');
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
    <div>
      <PageHeader
        title={draft ? t('draftTitle') : t('title')}
        lead={draft ? t('draftLead') : t('lead')}
        back={{ href: '/admin/anfragen', label: t('back') }}
        meta={
          draft && (
            <StatusBadge entity="request" state="draft" />
          )
        }
        actions={
          <>
            {draft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDiscarding(true)}
              >
                <Trash2 className="size-3.5" aria-hidden />
                {t('draftDiscard')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(open.length === allValues.length ? [] : allValues)}
            >
              {open.length === allValues.length ? t('closeAll') : t('openAll')}
            </Button>
          </>
        }
      />

      {/* A link that no longer resolves is worse than a missing one: it looks
          like the draft was lost rather than already dealt with. */}
      {draftId && !draft && (
        <Card tone="warning" pad="sm" className="mb-app-section flex gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-warning-fg" aria-hidden />
          <p className="text-sm">{t('draftNotFound')}</p>
        </Card>
      )}

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
                      {/* A blocked customer stays in the list and cannot be
                          picked. Hiding them outright would read as "this
                          person is not in the system", which is a different
                          fact and sends the owner off to create a second
                          record for somebody they blocked on purpose. */}
                      {customers.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          disabled={c.status === 'blocked'}
                        >
                          {c.lastName}, {c.firstName} — {c.phone}
                          {c.status === 'blocked' ? ` (${t('customerBlocked')})` : ''}
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

                      {/* The service already named it — see `serviceNeeds`.
                          Asking again on the phone is a question the office
                          reads aloud and the customer answers with «it's an
                          office, that's what I said». */}
                      {needs.fixedPropertyKind ? (
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
                      )}

                      <div className="grid gap-5 sm:grid-cols-4">
                        {needs.asksArea && (
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
                        )}
                        {needs.asksRooms && (
                          <Field label={office ? t('roomsOffice') : t('rooms')}>
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
                        )}
                        {needs.asksBathrooms && (
                          <Field label={office ? t('bathroomsOffice') : t('bathrooms')}>
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
                        )}
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
                        {needs.asksPets && (
                          <Checkbox
                            label={t('pets')}
                            checked={property.hasPets}
                            onChange={(e) =>
                              setProperty({ ...property, hasPets: e.target.checked })
                            }
                          />
                        )}
                        {needs.asksCondition && (
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
                        )}
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
                        setServiceSlug(e.target.value);
                        // Add-ons are scoped to a service; carrying them over
                        // would price a window clean onto a furniture job.
                        setAddOnIds([]);
                      }}
                    >
                      <option value="" disabled>
                        {t('serviceNone')}
                      </option>
                      {services
                        .filter(isOffered)
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
                /* Names the figure this service is actually waiting on. It
                   said «Leistung und Fläche fehlen noch» for everything, so on
                   a window clean the office was told to supply an area the
                   form no longer has a field for. */
                <p className="mt-2 text-sm text-ink-secondary">
                  {needs.asksWindowCount
                    ? t('estimateWaitingWindows')
                    : needs.asksFurniturePieces
                      ? t('estimateWaitingPieces')
                      : t('estimateWaiting')}
                </p>
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
                  {draft ? t('draftPromote') : t('save')}
                </Button>
                {/* Needs only a customer, so it stays available exactly when
                    the other two are not — which is the moment it is for. */}
                <Button block variant="quiet" disabled={!customerId} onClick={saveDraft}>
                  {t('saveDraft')}
                </Button>
                <p className="text-center text-xs text-ink-tertiary">
                  {t('saveDraftHint')}
                </p>
                <Button asChild block variant="ghost">
                  <Link href="/admin/anfragen">{t('cancel')}</Link>
                </Button>
              </div>
            </Card>
          </aside>
        </div>
      )}

      {/* Throwing away a call taken by hand is the one irreversible step on
          this screen, and it used to ask with the browser's own box. */}
      <ConfirmDialog
        open={discarding}
        onOpenChange={setDiscarding}
        title={t('draftDiscardConfirmTitle')}
        body={t('draftDiscardConfirm')}
        action={t('draftDiscard')}
        dismiss={dismissLabel}
        onConfirm={() => {
          setDiscarding(false);
          if (!draft) return;
          discardRequestDraft(draft.id);
          toast.success(t('draftDiscardDone'));
          router.push('/admin/anfragen');
        }}
      />
    </div>
  );
}
