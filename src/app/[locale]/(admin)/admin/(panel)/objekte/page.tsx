'use client';

import { useTranslations } from 'next-intl';
import { DoorOpen, KeyRound, Lock, UserCheck } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { useHydrated, useStore } from '@/mock/store';
import type { AccessMethod, Property } from '@/mock/schema';

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

  return (
    <div className="max-w-6xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <DataView
        className="mt-8"
        items={properties}
        columns={columns}
        getKey={(p) => p.id}
        onSelect={(p) => router.push(`/admin/objekte/${p.id}`)}
        caption={t('title')}
        empty={<EmptyState title={t('emptyTitle')} body={t('emptyBody')} />}
      />
    </div>
  );
}
