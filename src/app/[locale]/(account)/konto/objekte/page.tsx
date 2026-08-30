'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowRight, Home, Plus } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
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

  if (!hydrated) return <SkeletonPage label={t('title')} />;
  /* No customer record means there is nothing to attach a property to, and the
     add form would have no `customerId` to write. Was a bare em-dash, which
     reads as a screen that failed rather than one with nothing on it. */
  if (!customer) {
    return (
      <>
        <PageHeader title={t('title')} lead={t('lead')} />
        <EmptyState icon={Home} title={t('emptyTitle')} body={t('emptyBody')} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        actions={
          <Button variant="secondary" disabled={adding} onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden />
            {t('addAction')}
          </Button>
        }
      />

      {adding && (
        <Card className="mb-app-section">
          <CardHeader title={t('newTitle')} description={t('newLead')} />
          <CardBody>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const num = (key: string) => Number(form.get(key) ?? 0);
                // Length first: `now` only ticks every 30s, so a bare timestamp
                // collides for two properties added in one sitting.
                const id = `prp_${allProperties.length}_${now.getTime().toString(36).slice(-4)}`;
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
              <div className="grid gap-5 sm:grid-cols-2">
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
                  {(props) => (
                    <Input {...props} name="street" required autoComplete="street-address" />
                  )}
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
                  {(props) => (
                    <Input {...props} name="city" required autoComplete="address-level2" />
                  )}
                </Field>
                <Field label={t('newArea')}>
                  {(props) => <Input {...props} name="area" type="number" min={1} required />}
                </Field>
                <Field label={t('newRooms')}>
                  {(props) => <Input {...props} name="rooms" type="number" min={1} required />}
                </Field>
                <Field label={t('newBathrooms')}>
                  {(props) => (
                    <Input {...props} name="bathrooms" type="number" min={1} required />
                  )}
                </Field>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="submit">{t('newSave')}</Button>
                <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                  {t('dismiss')}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {properties.length === 0 ? (
        <EmptyState icon={Home} title={t('emptyTitle')} body={t('emptyBody')} />
      ) : (
        <ul className="gap-app grid sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <li key={property.id}>
              {/* Was a hand-written copy of the card's hover treatment — a
                  colour change where every other clickable card in the product
                  lifts. One component, one behaviour. */}
              <Card asChild interactive className="group flex h-full flex-col">
                <Link href={`/konto/objekte/${property.id}`}>
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
                  {/* `mt-auto` so the call to action sits on one line across the
                      row however tall each address makes its own card. */}
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium">
                    {t('title')}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
