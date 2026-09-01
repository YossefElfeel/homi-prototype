'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Filter, Home, Plus, Search, X } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { RowAction, RowActions } from '@/components/ui/row-actions';
import { ActionIcon } from '@/lib/action-icons';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Toolbar } from '@/components/ui/toolbar';
import { propertyVisits } from '@/lib/property-facts';
import type { Booking, Property, PropertyKind } from '@/mock/schema';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';

const KINDS: PropertyKind[] = ['apartment', 'house', 'office'];

/**
 * Screen 41 — the customer's properties.
 *
 * It was a grid of hand-built cards: the label set as its own `h2` four steps
 * larger than every other card title in the account, a pasted copy of the
 * card's hover treatment, and no way to search, sort or ask when anybody is
 * next coming. A household with one flat never noticed; a landlord with nine
 * had a wall of tiles and a scroll.
 *
 * It is the same table the office reads on /admin/objekte now, minus the two
 * columns that only mean something behind the counter — whose property it is,
 * and which zone it falls in.
 */
export default function AccountPropertiesPage() {
  const t = useTranslations('account.properties');
  const appT = useTranslations('app');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();

  const { customer, properties, bookings } = useAccount();
  const allProperties = useStore((s) => s.data.properties);
  const services = useStore((s) => s.services);
  const patchData = useStore((s) => s.patchData);
  const now = useNow();
  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | PropertyKind>('all');

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

  const q = query.trim().toLowerCase();
  const rows = properties
    .filter((p) => (kind === 'all' ? true : p.kind === kind))
    /* Label first, because it is what the property is called out loud —
       «Wohnung Küsnacht», not a postcode. The address follows because that is
       as often what somebody is reading off a letter. */
    .filter(
      (p) =>
        !q ||
        [p.label, p.street, p.postcode, p.city].join(' ').toLowerCase().includes(q),
    );

  const filtering = Boolean(q) || kind !== 'all';

  function reset() {
    setQuery('');
    setKind('all');
  }

  /** The service name, or the slug if the catalogue no longer carries it. */
  const serviceName = (booking: Booking) =>
    services.find((s) => s.slug === booking.serviceSlug)?.name[locale] ?? booking.serviceSlug;

  const visitsOf = (p: Property) => propertyVisits(bookings, p.id);

  const columns: Column<Property>[] = [
    {
      key: 'label',
      header: t('colLabel'),
      primary: true,
      sortBy: (p) => p.label.toLowerCase(),
      cell: (p) => p.label,
    },
    {
      key: 'address',
      header: t('colAddress'),
      sortBy: (p) => `${p.postcode} ${p.street}`,
      cell: (p) => (
        <span className="text-ink-secondary">
          {p.street}
          <span className="block text-sm text-ink-tertiary">
            <span data-numeric>{p.postcode}</span> {p.city}
          </span>
        </span>
      ),
    },
    {
      key: 'kind',
      header: t('colKind'),
      tableOnly: true,
      sortBy: (p) => p.kind,
      cell: (p) => t(`kinds.${p.kind}`),
    },
    {
      /* The measurements were three grey figures at the foot of a tile. They
         are what a quote is priced off, so they stay — as one line, where they
         can be compared down the column instead of across a grid. */
      key: 'size',
      header: t('colSize'),
      align: 'end',
      /* Unmeasured places group at one end rather than scattering through the
         column as if they were the smallest flats on the list. */
      sortBy: (p) => p.area ?? -1,
      cell: (p) =>
        p.area == null ? (
          <span className="text-sm text-ink-tertiary">{t('sizeUnknown')}</span>
        ) : (
          <span data-numeric className="text-sm text-ink-secondary">
            {t('area', { n: p.area })}
            {p.rooms != null && (
              <span className="block text-ink-tertiary">{t('rooms', { n: p.rooms })}</span>
            )}
          </span>
        ),
    },
    {
      /*
       * «Wann kommt ihr wieder» — the question this screen was opened with and
       * could not answer. The office has had the column since /admin/objekte
       * was rebuilt; the customer looking at their own flat had to go to the
       * dashboard and hope it was the next appointment overall.
       */
      key: 'nextVisit',
      header: t('colNextVisit'),
      cell: (p) => {
        const next = visitsOf(p).next;
        if (!next) return <span className="text-ink-tertiary">{t('nothingBooked')}</span>;
        const start = new Date(next.start);
        return (
          <span>
            <span data-numeric className="block">
              {format.dateTime(start, 'short')}, {format.dateTime(start, 'time')}
            </span>
            <span className="block text-sm text-ink-tertiary">{serviceName(next)}</span>
          </span>
        );
      },
      sortBy: (p) => visitsOf(p).next?.start ?? null,
    },
  ];

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
              <div className="gap-app grid sm:grid-cols-2">
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

      {properties.length > 0 && (
        <Toolbar
          search={{
            value: query,
            onChange: setQuery,
            label: t('search'),
            clearLabel: appT('clearSearch'),
          }}
          count={
            filtering
              ? appT('results', { shown: rows.length, total: properties.length })
              : appT('resultsAll', { total: properties.length })
          }
          filters={
            <>
              <label className="min-w-44">
                <span className="sr-only">{t('filterKind')}</span>
                <Select
                  dense
                  value={kind}
                  onChange={(e) => setKind(e.target.value as 'all' | PropertyKind)}
                >
                  <option value="all">
                    {t('filterKind')}: {t('filterAll')}
                  </option>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(`kinds.${k}`)}
                    </option>
                  ))}
                </Select>
              </label>

              {filtering && (
                <Button size="sm" variant="ghost" onClick={reset}>
                  <X className="size-3.5" aria-hidden />
                  {t('filterReset')}
                </Button>
              )}
            </>
          }
        />
      )}

      <DataView
        items={rows}
        columns={columns}
        getKey={(p) => p.id}
        onSelect={(p) => router.push(`/konto/objekte/${p.id}`)}
        caption={t('title')}
        rowActions={(p) => (
          <RowActions>
            <RowAction href={`/konto/objekte/${p.id}`} label={t('rowOpen')}>
              <ActionIcon.open aria-hidden />
            </RowAction>
          </RowActions>
        )}
        empty={
          query.trim() ? (
            <EmptyState
              icon={Search}
              title={t('searchEmptyTitle')}
              body={t('searchEmptyBody', { query })}
              action={
                <Button variant="secondary" onClick={reset}>
                  {t('filterReset')}
                </Button>
              }
            />
          ) : filtering ? (
            <EmptyState
              icon={Filter}
              title={t('filterEmptyTitle')}
              body={t('filterEmptyBody')}
              action={
                <Button variant="secondary" onClick={reset}>
                  {t('filterReset')}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Home}
              title={t('emptyTitle')}
              body={t('emptyBody')}
              /* The button the header has been carrying all along. Leaving the
                 empty state without it meant the one screen whose whole message
                 is "there is nothing here yet" was also the one that did not
                 say how to change that. */
              action={
                <Button disabled={adding} onClick={() => setAdding(true)}>
                  <Plus className="size-4" aria-hidden />
                  {t('addAction')}
                </Button>
              }
            />
          )
        }
      />
    </>
  );
}
