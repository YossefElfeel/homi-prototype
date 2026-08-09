'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Home, Plus } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAccount } from '@/lib/use-account';
import { useHydrated } from '@/mock/store';

/** Screen 41 — the customer's properties. */
export default function AccountPropertiesPage() {
  const t = useTranslations('account.properties');
  const hydrated = useHydrated();

  const { properties } = useAccount();

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <Button variant="secondary">
          <Plus className="size-4" aria-hidden />
          {t('addAction')}
        </Button>
      </div>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      {properties.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Home}
          title={t('emptyTitle')}
          body={t('emptyBody')}
        />
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {properties.map((property) => (
            <li key={property.id}>
              <Link
                href={`/konto/objekte/${property.id}`}
                className="surface-card group flex h-full flex-col p-6 transition-colors hover:bg-sunken"
              >
                <h2 className="display-type text-lg">{property.label}</h2>
                <p className="mt-2 text-ink-secondary">
                  {property.street}
                  <br />
                  <span data-numeric>{property.postcode}</span> {property.city}
                </p>
                <p
                  data-numeric
                  className="mt-4 flex flex-wrap gap-x-4 text-sm text-ink-tertiary"
                >
                  <span>{t('area', { n: property.area })}</span>
                  <span>{t('rooms', { n: property.rooms })}</span>
                  <span>{t('bathrooms', { n: property.bathrooms })}</span>
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium">
                  {t('title')}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
