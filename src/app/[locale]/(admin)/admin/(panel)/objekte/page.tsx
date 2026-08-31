'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { toast } from 'sonner';
import { DoorOpen, KeyRound, Lock, Plus, Search, UserCheck } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { ActionIcon } from '@/lib/action-icons';
import { PROPERTY_KINDS, propertyUsage, propertyVisits, zoneOf, zonesOf } from '@/lib/property-facts';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import {
  ConfirmDialog,
  useConfirmTarget,
  useDismissLabel,
} from '@/components/ui/confirm-dialog';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import {
  RowAction,
  RowActionButton,
  RowActions,
  RowActionsDivider,
} from '@/components/ui/row-actions';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { AddressFields, type AddressValue } from '@/components/admin/address-fields';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { AccessMethod, Booking, Property, PropertyKind } from '@/mock/schema';

const ACCESS_ICONS: Record<AccessMethod, typeof DoorOpen> = {
  'customer-present': DoorOpen,
  'key-left': KeyRound,
  'key-box': Lock,
  'other-person': UserCheck,
};

const EMPTY_ADDRESS: AddressValue = { street: '', addressDetail: '', postcode: '', city: '' };

const ACCESS_SHORT: Record<AccessMethod, string> = {
  'customer-present': 'Kunde da',
  'key-left': 'Schlüssel',
  'key-box': 'Kasten',
  'other-person': 'Andere Person',
};

/**
 * Screen 66 — every property, and what is owed at it.
 *
 * The list was five columns of what an address *is* — label, owner, street,
 * area, access method — sorted by nothing, filtered by nothing, and acted on
 * only by opening it. Two questions the office asks this screen every day had
 * no answer on it: "when were we last at this address" and "when are we next
 * there". Both were one click and a scroll away on the property's own history,
 * per address, which is why the answer was normally looked up in the calendar
 * instead.
 *
 * The two date columns are derived, not stored — see `lib/property-facts.ts`.
 */
export default function PropertiesPage() {
  const t = useTranslations('admin.properties');
  const appT = useTranslations('app');
  const router = useRouter();
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();

  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const bookings = useStore((s) => s.data.bookings);
  const services = useStore((s) => s.services);
  const data = useStore((s) => s.data);
  const settings = useStore((s) => s.settings);
  const createProperty = useStore((s) => s.createProperty);
  const deleteProperty = useStore((s) => s.deleteProperty);
  const now = useNow();

  const dismissLabel = useDismissLabel();
  const deleting = useConfirmTarget<Property>();
  const [adding, setAdding] = useState(false);
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [addressTouched, setAddressTouched] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | PropertyKind>('all');
  const [zone, setZone] = useState('all');

  const zones = useMemo(() => zonesOf(properties), [properties]);

  /* Derived once for the whole table rather than per cell: two columns read it
     and both are sortable, so the naive version rescans every booking four
     times per row and again on every comparison the sort makes. */
  const visits = useMemo(
    () => new Map(properties.map((p) => [p.id, propertyVisits(bookings, p.id)])),
    [properties, bookings],
  );

  const customerName = useMemo(() => {
    const byId = new Map(customers.map((c) => [c.id, `${c.firstName} ${c.lastName}`]));
    return (id: string) => byId.get(id) ?? '—';
  }, [customers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return properties
      .filter((p) => (kind === 'all' ? true : p.kind === kind))
      .filter((p) => (zone === 'all' ? true : p.postcode === zone))
      .filter((p) =>
        q
          ? /* The label is first because it is what the office calls the
               address out loud — «Büro Seestrasse», not a postcode. The rest
               are here because a caller reads out whatever is in front of
               them, which is as often the street or the owner's name. */
            [p.label, p.street, p.postcode, p.city, customerName(p.customerId)]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      );
  }, [properties, kind, zone, query, customerName]);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const filtering = kind !== 'all' || zone !== 'all' || Boolean(query.trim());

  /** The service name, or the slug if the catalogue no longer carries it. */
  const serviceName = (booking: Booking) =>
    services.find((s) => s.slug === booking.serviceSlug)?.name[locale] ?? booking.serviceSlug;

  const columns: Column<Property>[] = [
    { key: 'label', header: t('colLabel'), primary: true, cell: (p) => p.label,
      sortBy: (p) => p.label.toLowerCase() },
    {
      key: 'access',
      header: t('colAccess'),
      trailing: true,
      cell: (p) => {
        if (!p.access) return <span className="text-ink-tertiary">—</span>;
        const Icon = ACCESS_ICONS[p.access.method];
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-secondary">
            <Icon className="size-3.5" aria-hidden />
            {ACCESS_SHORT[p.access.method]}
          </span>
        );
      },
    },
    {
      key: 'customer',
      header: t('colCustomer'),
      cell: (p) => customerName(p.customerId),
      sortBy: (p) => customerName(p.customerId).toLowerCase(),
    },
    {
      key: 'address',
      header: t('colAddress'),
      cell: (p) => (
        <span className="text-ink-secondary">
          {p.street}
          <span className="block text-sm text-ink-tertiary">
            <span data-numeric>{p.postcode}</span> {zoneOf(p).label}
          </span>
        </span>
      ),
      sortBy: (p) => `${p.postcode} ${p.street}`,
    },
    {
      /* Was two columns' worth of nothing: `colSpecs` printed the numbers and
         the *kind* — the thing the new filter selects on — appeared nowhere at
         all, so filtering to «Büro» left a table with no column explaining why
         those rows survived. */
      key: 'kind',
      header: t('colKind'),
      cell: (p) => (
        <span>
          {t(`kinds.${p.kind}`)}
          <span data-numeric className="block text-sm text-ink-tertiary">
            {p.area} m² · {p.rooms} Zi. · {p.bathrooms} Bad
          </span>
        </span>
      ),
      sortBy: (p) => p.kind,
    },
    {
      key: 'lastService',
      header: t('colLastService'),
      cell: (p) => {
        const last = visits.get(p.id)?.last;
        if (!last) return <span className="text-ink-tertiary">{t('never')}</span>;
        return (
          <span>
            <span data-numeric className="block">
              {format.dateTime(new Date(last.start), 'short')}
            </span>
            <span className="block text-sm text-ink-tertiary">{serviceName(last)}</span>
          </span>
        );
      },
      sortBy: (p) => visits.get(p.id)?.last?.start ?? null,
    },
    {
      key: 'nextVisit',
      header: t('colNextVisit'),
      cell: (p) => {
        const next = visits.get(p.id)?.next;
        if (!next) return <span className="text-ink-tertiary">{t('nothingBooked')}</span>;
        const start = new Date(next.start);
        /*
         * A job still on the books whose day has gone.
         *
         * Nothing sweeps these: `scheduled` is written when the slot is taken
         * and only a check-in moves it, so the seed carries one or two in most
         * scenarios and real use would carry more. Dropping them from the
         * column would blank it for precisely the rows that need chasing, and
         * printing the date bare would file a job nobody turned up to under
         * "next visit" — so it is printed, and marked.
         */
        const overdue = next.status !== 'inProgress' && start < now;
        return (
          <span>
            <span data-numeric className="block">
              {format.dateTime(start, 'short')}, {format.dateTime(start, 'time')}
            </span>
            <span className="block text-sm text-ink-tertiary">{serviceName(next)}</span>
            {/* A job that has been moved, or one the crew is standing in right
                now, is not the same news as a plain «scheduled» — and the date
                alone cannot say which of the three this is. */}
            {(next.status !== 'scheduled' || overdue) && (
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                {next.status !== 'scheduled' && (
                  <StatusBadge entity="booking" state={next.status} size="sm" />
                )}
                {overdue && <Chip tone="warning">{t('overdue')}</Chip>}
              </span>
            )}
          </span>
        );
      },
      sortBy: (p) => visits.get(p.id)?.next?.start ?? null,
    },
  ];

  /* A property with no customer belongs to nobody: it could never surface in a
     request, a plan or an invoice. So the button is honest about being unusable
     until there is somebody to attach one to. */
  const addButton = (
    <Button
      disabled={adding || customers.length === 0}
      onClick={() => {
        /* Opened blank, not on whatever the last abandoned attempt held. The
           address block lives in page state rather than inside the unmounted
           form, so it does not clear itself. */
        setAddress(EMPTY_ADDRESS);
        setAddressTouched(false);
        setAdding(true);
      }}
    >
      <Plus className="size-4" aria-hidden />
      {t('addAction')}
    </Button>
  );

  function closeAddForm() {
    setAdding(false);
    setAddress(EMPTY_ADDRESS);
    setAddressTouched(false);
  }

  function confirmDelete() {
    const property = deleting.target;
    if (!property) return;
    deleting.dismiss();
    /* The store re-checks rather than trusting this screen's arithmetic: the
       menu item is only enabled when the usage count is zero, and a second
       tab could have booked the address between the render and the click. */
    if (!deleteProperty(property.id)) {
      toast.error(t('deleteBlockedToast'));
      return;
    }
    toast.success(t('deleteDone', { label: property.label || property.street }));
  }

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} actions={addButton} />

      {adding && (
        <form
          className="surface-card mb-app-section p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const customerId = String(form.get('customerId') ?? '');
            const street = address.street.trim();
            /* The address block is controlled, so its three required values are
               checked here rather than by the browser: `required` on an input
               inside a component the parent does not own is a rule that stops
               working the day the component stops rendering it. */
            if (!customerId || !street || !address.postcode.trim() || !address.city.trim()) {
              setAddressTouched(true);
              return;
            }

            const id = createProperty(
              {
                customerId,
                label: String(form.get('label') ?? '').trim() || street,
                street,
                /* Empty means "there is nothing more to say", not an empty
                   string — the property record and the job sheet both test the
                   field for truthiness before they render the line. */
                addressDetail: address.addressDetail.trim() || undefined,
                postcode: address.postcode.trim(),
                city: address.city.trim(),
                kind: String(form.get('kind') ?? 'apartment') as PropertyKind,
                area: Number(form.get('area')) || 0,
                rooms: Number(form.get('rooms')) || 0,
                bathrooms: Number(form.get('bathrooms')) || 1,
                floor: Number(form.get('floor')) || 0,
                hasElevator: false,
                hasPets: false,
                needsExtraEffort: false,
              },
              now,
            );
            closeAddForm();
            toast.success(t('newDone'));
            /* Straight to the detail screen, which is where access details,
               keys and permanent notes live — the things a property is
               actually for. */
            router.push(`/admin/objekte/${id}`);
          }}
        >
          <h2 className="display-type text-xl">{t('newTitle')}</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label={t('newCustomer')}>
              {(props) => (
                <Select {...props} name="customerId" required defaultValue="">
                  <option value="" disabled>
                    {t('newCustomerPlaceholder')}
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.lastName}, {c.firstName}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('newLabel')} hint={t('newLabelHint')} optional>
              {(props) => <Input {...props} name="label" />}
            </Field>
          </div>

          {/* The address is a controlled block now — see `AddressFields`. It
              is the one part of this form the edit screen also renders, and it
              was the part that had already drifted: the postcode here accepted
              anything and said nothing about which of the eight municipalities
              it meant. The rest of the form stays uncontrolled and is still
              read out of `FormData` on submit. */}
          <AddressFields
            className="mt-5"
            value={address}
            onChange={setAddress}
            served={settings.servedPostcodes}
            /* Only after a submit that went nowhere. Marking three fields red
               the moment the form opens tells somebody they got something
               wrong before they have typed anything. */
            errors={
              addressTouched
                ? {
                    street: address.street.trim() ? undefined : t('errorRequired'),
                    postcode: /^\d{4}$/.test(address.postcode.trim())
                      ? undefined
                      : t('errorPostcode'),
                    city: address.city.trim() ? undefined : t('errorRequired'),
                  }
                : undefined
            }
          />

          <div className="mt-5 grid gap-5 sm:grid-cols-5">
            <Field label={t('newKind')}>
              {(props) => (
                <Select {...props} name="kind" defaultValue="apartment">
                  {PROPERTY_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(`kinds.${k}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('newArea')}>
              {(props) => <Input {...props} name="area" type="number" min={1} required />}
            </Field>
            <Field label={t('newRooms')}>
              {(props) => (
                <Input {...props} name="rooms" type="number" min={1} step={0.5} required />
              )}
            </Field>
            <Field label={t('newBathrooms')}>
              {(props) => <Input {...props} name="bathrooms" type="number" min={1} required />}
            </Field>
            <Field label={t('newFloor')} optional>
              {(props) => <Input {...props} name="floor" type="number" defaultValue={0} />}
            </Field>
          </div>

          <p className="mt-4 text-sm text-ink-tertiary">{t('newAccessNote')}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit">{t('newSave')}</Button>
            <Button type="button" variant="ghost" onClick={closeAddForm}>
              {t('dismiss')}
            </Button>
          </div>
        </form>
      )}

      {/* The screen carried no toolbar at all. Sixteen addresses in the default
          scenario is already past the point where "find the Meilen office"
          means reading every row, and the count is the only confirmation that
          typing in the box changed anything. */}
      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('search'),
          placeholder: t('searchPlaceholder'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: filtered.length, total: properties.length })
            : appT('resultsAll', { total: properties.length })
        }
        filters={
          <>
            <label className="min-w-36">
              <span className="sr-only">{t('filterKind')}</span>
              <Select
                dense
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
              >
                <option value="all">
                  {t('filterKind')}: {t('filterAll')}
                </option>
                {PROPERTY_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`kinds.${k}`)}
                  </option>
                ))}
              </Select>
            </label>
            {/* §6 draws the area as eight municipalities and the postcode is
                the only field that says which one. The options are built from
                the properties on hand rather than from all eight, so the list
                never offers a zone that would filter to nothing. */}
            <label className="min-w-36">
              <span className="sr-only">{t('filterZone')}</span>
              <Select dense value={zone} onChange={(e) => setZone(e.target.value)}>
                <option value="all">
                  {t('filterZone')}: {t('filterAll')}
                </option>
                {zones.map((z) => (
                  <option key={z.key} value={z.key}>
                    {z.label} ({z.key})
                  </option>
                ))}
              </Select>
            </label>
          </>
        }
      />

      <DataView
        items={filtered}
        columns={columns}
        getKey={(p) => p.id}
        onSelect={(p) => router.push(`/admin/objekte/${p.id}`)}
        caption={t('title')}
        openLabel={t('rowView')}
        /*
         * Opening the record was the row's only trick. Correcting a street
         * number meant opening the property to find there was nowhere to do it
         * there either, and an address typed wrong on a call could not be
         * removed at all — so the list grew a duplicate every time.
         */
        rowActions={(p) => {
          const usage = propertyUsage(data, p.id);
          return (
            <RowActions>
              <RowAction href={`/admin/objekte/${p.id}`} label={t('rowView')}>
                <ActionIcon.open aria-hidden />
              </RowAction>
              <RowAction href={`/admin/objekte/${p.id}/bearbeiten`} label={t('rowEdit')}>
                <ActionIcon.edit aria-hidden />
              </RowAction>
              <RowActionsDivider />
              <RowActionButton
                tone="danger"
                disabled={usage.total > 0}
                /* The label carries the reason: six record types point at a
                   property, and an address with history is kept so the
                   invoices behind it still resolve (§15). */
                label={
                  usage.total > 0
                    ? t('rowDeleteBlocked', { n: usage.total })
                    : t('rowDelete')
                }
                onClick={() => deleting.ask(p)}
              >
                <ActionIcon.delete aria-hidden />
              </RowActionButton>
            </RowActions>
          );
        }}
        empty={
          /* Three ways to be empty, and they need three different sentences.
             Keying the empty state on the data alone would answer "no match
             for Meilen" with "properties come from requests" — an explanation
             of how to create the rows you were looking at a second ago. */
          filtering ? (
            <EmptyState
              icon={Search}
              title={t('searchEmptyTitle')}
              body={query.trim() ? t('searchEmptyBody', { query }) : t('filterEmptyBody')}
            />
          ) : (
            <EmptyState
              title={t('emptyTitle')}
              body={customers.length === 0 ? t('newNoCustomers') : t('emptyBody')}
              action={customers.length > 0 ? addButton : undefined}
            />
          )
        }
      />

      {/* Was a `window.confirm` — the browser's own box, in the browser's
          language, over a themed table. */}
      <ConfirmDialog
        open={deleting.open}
        onOpenChange={(open) => !open && deleting.dismiss()}
        title={t('deleteConfirmTitle')}
        body={t('deleteConfirm', {
          label: deleting.target?.label || deleting.target?.street || '',
        })}
        action={t('rowDelete')}
        dismiss={dismissLabel}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
