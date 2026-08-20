'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DoorOpen, KeyRound, Lock, Plus, UserCheck } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { AccessMethod, Property, PropertyKind } from '@/mock/schema';

const ACCESS_ICONS: Record<AccessMethod, typeof DoorOpen> = {
  'customer-present': DoorOpen,
  'key-left': KeyRound,
  'key-box': Lock,
  'other-person': UserCheck,
};

const ACCESS_SHORT: Record<AccessMethod, string> = {
  'customer-present': 'Kunde da',
  'key-left': 'Schlüssel',
  'key-box': 'Kasten',
  'other-person': 'Andere Person',
};

/** Screen 66 — every property, with its access method visible at a glance. */
export default function PropertiesPage() {
  const t = useTranslations('admin.properties');
  const router = useRouter();
  const hydrated = useHydrated();

  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const createProperty = useStore((s) => s.createProperty);
  const now = useNow();

  const [adding, setAdding] = useState(false);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const columns: Column<Property>[] = [
    { key: 'label', header: t('colLabel'), primary: true, cell: (p) => p.label },
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
      cell: (p) => {
        const c = customers.find((x) => x.id === p.customerId);
        return c ? `${c.firstName} ${c.lastName}` : '—';
      },
    },
    {
      key: 'address',
      header: t('colAddress'),
      cell: (p) => (
        <span className="text-ink-secondary">
          {p.street}, <span data-numeric>{p.postcode}</span> {p.city}
        </span>
      ),
    },
    {
      key: 'specs',
      header: t('colSpecs'),
      align: 'end',
      cell: (p) => (
        <span data-numeric className="text-sm text-ink-tertiary">
          {p.area} m² · {p.rooms} Zi. · {p.bathrooms} Bad
        </span>
      ),
    },
  ];

  /* A property with no customer belongs to nobody: it could never surface in a
     request, a plan or an invoice. So the button is honest about being unusable
     until there is somebody to attach one to. */
  const addButton = (
    <Button disabled={adding || customers.length === 0} onClick={() => setAdding(true)}>
      <Plus className="size-4" aria-hidden />
      {t('addAction')}
    </Button>
  );

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
            const street = String(form.get('street') ?? '');
            if (!customerId || !street) return;

            const id = createProperty(
              {
                customerId,
                label: String(form.get('label') ?? '').trim() || street,
                street,
                postcode: String(form.get('postcode') ?? ''),
                city: String(form.get('city') ?? ''),
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
            setAdding(false);
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

          <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_8rem_1fr]">
            <Field label={t('newStreet')}>
              {(props) => <Input {...props} name="street" required />}
            </Field>
            <Field label={t('newPostcode')}>
              {(props) => (
                <Input {...props} name="postcode" inputMode="numeric" maxLength={4} required />
              )}
            </Field>
            <Field label={t('newCity')}>
              {(props) => <Input {...props} name="city" required />}
            </Field>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-5">
            <Field label={t('newKind')}>
              {(props) => (
                <Select {...props} name="kind" defaultValue="apartment">
                  <option value="apartment">Wohnung</option>
                  <option value="house">Haus</option>
                  <option value="office">Büro</option>
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
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              {t('dismiss')}
            </Button>
          </div>
        </form>
      )}

      <DataView
        items={properties}
        columns={columns}
        getKey={(p) => p.id}
        onSelect={(p) => router.push(`/admin/objekte/${p.id}`)}
        caption={t('title')}
        empty={
          <EmptyState
            title={t('emptyTitle')}
            body={customers.length === 0 ? t('newNoCustomers') : t('emptyBody')}
            action={customers.length > 0 ? addButton : undefined}
          />
        }
      />
    </div>
  );
}
