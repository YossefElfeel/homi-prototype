'use client';

import { use, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { SwitchField } from '@/components/ui/switch';
import { AddressFields } from '@/components/admin/address-fields';
import { PROPERTY_KINDS } from '@/lib/property-facts';
import { checkCoverage } from '@/mock/engines/coverage';
import { useHydrated, useStore } from '@/mock/store';
import type { PropertyKind } from '@/mock/schema';

/**
 * Screen 67a — correct a property.
 *
 * 66 could create one and 67 could read it, and between them the only
 * writable field on the record was the standing note. A street number taken
 * down wrong on the phone was therefore wrong for ever: it printed on every
 * quote, every job sheet and every invoice at that address, and the only way
 * to fix it was to create a second property and leave the first one lying
 * there — which is how a list of twelve addresses becomes a list of forty.
 *
 * The owner is not a field here. Moving an address to another household would
 * leave its bookings, quotes and invoices pointing at a customer who never
 * had it; that is a merge, not an edit, and it is named as an open question
 * rather than half-built behind a `<Select>`.
 */
export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.propertyEdit');
  const lt = useTranslations('admin.properties');
  const router = useRouter();
  const hydrated = useHydrated();

  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const settings = useStore((s) => s.settings);
  const updateProperty = useStore((s) => s.updateProperty);

  const property = properties.find((p) => p.id === id);

  const [draft, setDraft] = useState(() => ({
    label: property?.label ?? '',
    street: property?.street ?? '',
    addressDetail: property?.addressDetail ?? '',
    postcode: property?.postcode ?? '',
    city: property?.city ?? '',
    kind: (property?.kind ?? 'apartment') as PropertyKind,
    area: String(property?.area ?? ''),
    rooms: String(property?.rooms ?? ''),
    bathrooms: String(property?.bathrooms ?? ''),
    floor: String(property?.floor ?? 0),
    hasElevator: property?.hasElevator ?? false,
    hasPets: property?.hasPets ?? false,
    needsExtraEffort: property?.needsExtraEffort ?? false,
    permanentNotes: property?.permanentNotes ?? '',
  }));
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!draft.street.trim()) next.street = t('errorRequired');
    if (!/^\d{4}$/.test(draft.postcode.trim())) next.postcode = t('errorPostcode');
    if (!draft.city.trim()) next.city = t('errorRequired');
    if (!(Number(draft.area) > 0)) next.area = t('errorPositive');
    if (!(Number(draft.rooms) > 0)) next.rooms = t('errorPositive');
    if (!(Number(draft.bathrooms) > 0)) next.bathrooms = t('errorPositive');
    return next;
  }, [draft, t]);

  /*
   * A warning rather than a block, which is the opposite of intake.
   *
   * §6 gates the wizard because a request from outside the area is work the
   * business cannot take. This record already exists — the jobs at it have
   * been done — so refusing to save a corrected house number because the
   * postcode is out of area would trap the mistake rather than fix it. What
   * the notice is really for is the zone: the list now filters by it, and an
   * address the eight municipalities do not cover has no zone to be found
   * under.
   */
  const coverage = useMemo(
    () => checkCoverage(draft.postcode, settings.servedPostcodes),
    [draft.postcode, settings.servedPostcodes],
  );

  if (!hydrated) return <SkeletonPage label={t('title')} />;
  if (!property) return <p className="text-ink-tertiary">{t('notFound')}</p>;

  const customer = customers.find((c) => c.id === property.customerId);
  const show = (key: string) => (touched ? errors[key] : undefined);
  const set = (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch }));

  function submit() {
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    const label = draft.label.trim() || draft.street.trim();
    updateProperty(id, {
      label,
      street: draft.street.trim(),
      /* Cleared means "there is nothing more to say", not an empty string —
         the detail screen and the job sheet both test the field before they
         render the line. Same treatment `permanentNotes` gets below. */
      addressDetail: draft.addressDetail.trim() || undefined,
      postcode: draft.postcode.trim(),
      city: draft.city.trim(),
      kind: draft.kind,
      area: Number(draft.area),
      rooms: Number(draft.rooms),
      bathrooms: Number(draft.bathrooms),
      floor: Number(draft.floor) || 0,
      hasElevator: draft.hasElevator,
      hasPets: draft.hasPets,
      needsExtraEffort: draft.needsExtraEffort,
      /* Empty means "no note", not an empty string — the detail screen tests
         the field for truthiness before it renders the block. */
      permanentNotes: draft.permanentNotes.trim() || undefined,
    });
    toast.success(t('done', { label }));
    router.push(`/admin/objekte/${id}`);
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        back={{ href: `/admin/objekte/${id}`, label: t('back') }}
        meta={
          customer && (
            <span className="text-sm text-ink-tertiary">
              {t('owner')}:{' '}
              <Link
                href={`/admin/kunden/${customer.id}`}
                className="underline decoration-from-font underline-offset-4"
              >
                {customer.firstName} {customer.lastName}
              </Link>
            </span>
          )
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Card>
          <CardHeader title={t('addressTitle')} description={t('addressHint')} />
          <CardBody className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={lt('newLabel')} hint={lt('newLabelHint')} optional>
                {(props) => (
                  <Input
                    {...props}
                    value={draft.label}
                    onChange={(e) => set({ label: e.target.value })}
                  />
                )}
              </Field>
              <Field label={lt('newKind')}>
                {(props) => (
                  <Select
                    {...props}
                    value={draft.kind}
                    onChange={(e) => set({ kind: e.target.value as PropertyKind })}
                  >
                    {PROPERTY_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {lt(`kinds.${kind}`)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            {/* The same four fields the create form renders, out of the same
                component — they were two copies that had already drifted, and
                the copy without the coverage check was the one that could put
                «8790 Zürich» into a zone filter derived from the postcode. */}
            <AddressFields
              value={{
                street: draft.street,
                addressDetail: draft.addressDetail,
                postcode: draft.postcode,
                city: draft.city,
              }}
              onChange={(next) => set(next)}
              served={settings.servedPostcodes}
              errors={{
                street: show('street'),
                postcode: show('postcode'),
                city: show('city'),
              }}
            />
          </CardBody>
        </Card>

        {coverage.state === 'outside' && (
          <Card tone="warning" className="mt-app-section">
            <div className="flex gap-3">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-status-warning-fg"
                aria-hidden
              />
              <div className="min-w-0">
                <h2 className="font-medium">{t('outsideTitle')}</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  {t('outsideBody', { postcode: coverage.postcode })}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="mt-app-section">
          <CardHeader title={t('specsTitle')} description={t('specsHint')} />
          <CardBody className="grid gap-5 sm:grid-cols-4">
            <Field label={lt('newArea')} error={show('area')}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={1}
                  value={draft.area}
                  onChange={(e) => set({ area: e.target.value })}
                />
              )}
            </Field>
            <Field label={lt('newRooms')} error={show('rooms')}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={1}
                  step={0.5}
                  value={draft.rooms}
                  onChange={(e) => set({ rooms: e.target.value })}
                />
              )}
            </Field>
            <Field label={lt('newBathrooms')} error={show('bathrooms')}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={1}
                  value={draft.bathrooms}
                  onChange={(e) => set({ bathrooms: e.target.value })}
                />
              )}
            </Field>
            <Field label={lt('newFloor')}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  value={draft.floor}
                  onChange={(e) => set({ floor: e.target.value })}
                />
              )}
            </Field>

            {/*
              All three were fixed at their defaults from the moment a property
              was created: the admin create form writes `false` to each and
              offered no control for any of them. So a third-floor walk-up with
              a dog was indistinguishable from a ground-floor flat — on the two
              screens that price the job and the one that briefs the cleaner.
            */}
            <div className="space-y-4 sm:col-span-4">
              <SwitchField
                label={t('elevator')}
                checked={draft.hasElevator}
                onCheckedChange={(v) => set({ hasElevator: v })}
              />
              <SwitchField
                label={t('pets')}
                hint={t('petsHint')}
                checked={draft.hasPets}
                onCheckedChange={(v) => set({ hasPets: v })}
              />
              <SwitchField
                label={t('extraEffort')}
                hint={t('extraEffortHint')}
                checked={draft.needsExtraEffort}
                onCheckedChange={(v) => set({ needsExtraEffort: v })}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="mt-app-section">
          <CardHeader title={t('notesTitle')} description={t('notesHint')} />
          <CardBody>
            <Field label={t('notesTitle')} className="[&>label]:sr-only">
              {(props) => (
                <Textarea
                  {...props}
                  value={draft.permanentNotes}
                  placeholder={t('notesPlaceholder')}
                  onChange={(e) => set({ permanentNotes: e.target.value })}
                />
              )}
            </Field>
          </CardBody>
        </Card>

        <div className="mt-app-section flex flex-wrap gap-3">
          <Button type="submit">{t('save')}</Button>
          <Button asChild variant="ghost">
            <Link href={`/admin/objekte/${id}`}>{t('cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
