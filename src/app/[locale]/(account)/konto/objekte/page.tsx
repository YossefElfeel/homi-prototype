'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowRight, Home, Plus } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/field';
import type { PropertyKind } from '@/mock/schema';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';

const KINDS: PropertyKind[] = ['apartment', 'house', 'office'];

/** Screen 41 — the customer's properties. */
export default function AccountPropertiesPage() {
  const t = useTranslations('account.properties');
  const hydrated = useHydrated();

  const { customer, properties } = useAccount();
  const allProperties = useStore((s) => s.data.properties);
  const patchData = useStore((s) => s.patchData);
  const now = useNow();
  const router = useRouter();

  const [adding, setAdding] = useState(false);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;
  if (!customer) return <p className="text-ink-tertiary">—</p>;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <Button variant="secondary" disabled={adding} onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden />
          {t('addAction')}
        </Button>
      </div>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      {adding && (
        <form
          className="surface-card mt-8 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const num = (key: string) => Number(form.get(key) ?? 0);
            const id = `prp_${now.getTime()}`;
            /*
             * Same field set the booking wizard builds in `submitDraft`, so a
             * property added by hand is indistinguishable from one that came
             * through a request.
             */
            patchData({
              properties: [
                ...allProperties,
                {
                  id,
                  customerId: customer.id,
                  label: String(form.get('label') ?? ''),
                  street: String(form.get('street') ?? ''),
                  postcode: String(form.get('postcode') ?? ''),
                  city: String(form.get('city') ?? ''),
                  kind: String(form.get('kind') ?? 'apartment') as PropertyKind,
                  area: num('area'),
                  rooms: num('rooms'),
                  bathrooms: num('bathrooms'),
                  floor: 0,
                  hasElevator: false,
                  hasPets: false,
                  needsExtraEffort: false,
                },
              ],
            });
            setAdding(false);
            toast.success(t('addDone'));
            router.push(`/konto/objekte/${id}`);
          }}
        >
          <h2 className="display-type text-xl">{t('newTitle')}</h2>
          <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
            {t('newLead')}
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label={t('newLabel')} hint={t('newLabelHint')}>
              {(props) => <Input {...props} name="label" required />}
            </Field>
            <Field label={t('newKind')}>
              {(props) => (
                <Select {...props} name="kind" defaultValue="apartment">
                  {KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {t(`kinds.${kind}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('newStreet')} className="sm:col-span-2">
              {(props) => <Input {...props} name="street" required autoComplete="street-address" />}
            </Field>
            <Field label={t('newPostcode')}>
              {(props) => (
                <Input
                  {...props}
                  name="postcode"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  autoComplete="postal-code"
                />
              )}
            </Field>
            <Field label={t('newCity')}>
              {(props) => <Input {...props} name="city" required autoComplete="address-level2" />}
            </Field>
            <Field label={t('newArea')}>
              {(props) => <Input {...props} name="area" type="number" min={1} required />}
            </Field>
            <Field label={t('newRooms')}>
              {(props) => <Input {...props} name="rooms" type="number" min={1} required />}
            </Field>
            <Field label={t('newBathrooms')}>
              {(props) => <Input {...props} name="bathrooms" type="number" min={1} required />}
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit">{t('newSave')}</Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              {t('dismiss')}
            </Button>
          </div>
        </form>
      )}

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
