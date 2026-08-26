'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, Eye, KeyRound, Pencil } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import type { AccessMethod } from '@/mock/schema';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useStore } from '@/mock/store';

const ACCESS_METHODS: AccessMethod[] = [
  'customer-present',
  'key-left',
  'key-box',
  'other-person',
];

/**
 * Screen 42 — one property.
 *
 * The access block states who sees these details and when, in the customer's
 * own account — the same sentence the owner sees on the conversion screen and
 * the contractor's permissions. §13 is the most sensitive thing this product
 * stores, and the customer is the one person who is never told about it
 * anywhere else.
 */
export default function AccountPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('account.property');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();

  const { properties, bookings } = useAccount();
  const services = useStore((s) => s.services);
  const patchData = useStore((s) => s.patchData);
  const allProperties = useStore((s) => s.data.properties);

  const [editingAccess, setEditingAccess] = useState(false);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const property = properties.find((p) => p.id === id);
  if (!property) return <p className="text-ink-tertiary">—</p>;

  const history = bookings
    .filter((b) => b.propertyId === property.id)
    .sort((a, b) => (a.start < b.start ? 1 : -1));

  const facts: [string, string][] = [
    [t('area'), `${property.area} m²`],
    [t('rooms'), `${property.rooms}`],
    [t('bathrooms'), `${property.bathrooms}`],
    [t('floor'), `${property.floor}`],
    [t('elevator'), property.hasElevator ? t('yes') : t('no')],
    [t('pets'), property.hasPets ? t('yes') : t('no')],
  ];

  return (
    <div>
      <Button asChild variant="link" className="mb-6">
        <Link href="/konto/objekte">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <h1 className="display-type text-3xl">{property.label}</h1>
      <p className="mt-2 text-ink-secondary">
        {property.street}, <span data-numeric>{property.postcode}</span> {property.city}
      </p>

      <section className="mt-10">
        <h2 className="label-type text-ink-tertiary">{t('factsTitle')}</h2>
        <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-4 border-b border-line-subtle py-2 text-sm"
            >
              <dt className="text-ink-secondary">{label}</dt>
              <dd data-numeric>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="surface-card mt-10 p-6">
        <h2 className="flex items-center gap-2 display-type text-xl">
          <KeyRound className="size-4 text-ink-tertiary" aria-hidden />
          {t('accessTitle')}
        </h2>
        <p className="mt-2 max-w-[var(--measure)] text-sm text-ink-secondary">
          {t('accessBody')}
        </p>

        {property.access ? (
          <p className="mt-4 text-sm">
            {t(`method.${property.access.method}` as 'method.key-box')}
            {property.access.keyLocation && (
              <span className="block text-ink-secondary">{property.access.keyLocation}</span>
            )}
            {property.access.boxLocation && (
              <span className="block text-ink-secondary">{property.access.boxLocation}</span>
            )}
            {property.access.personName && (
              <span className="block text-ink-secondary">
                {property.access.personName}
                {property.access.personPhone ? ` · ${property.access.personPhone}` : ''}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-4 text-sm text-ink-tertiary">{t('accessNone')}</p>
        )}

        <div className="mt-5 flex gap-3 border-l-2 border-rule bg-sunken rounded-[var(--radius-lg)] p-4">
          <Eye className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
          <div>
            <h3 className="text-sm font-medium">{t('accessWhoTitle')}</h3>
            <p className="mt-1 max-w-[var(--measure)] text-sm text-ink-secondary">
              {t('accessWho')}
            </p>
          </div>
        </div>

        {editingAccess ? (
          <form
            className="mt-5 border-t border-line-subtle pt-5"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const method = String(form.get('method') ?? 'customer-present') as AccessMethod;
              const text = (key: string) => {
                const value = String(form.get(key) ?? '').trim();
                return value === '' ? undefined : value;
              };
              /*
               * Codes are deliberately absent. `canSeeAccessCodes` returns false
               * for the customer role, and the paragraph above this block
               * promises exactly that — offering the field here would break the
               * promise on the screen that makes it.
               */
              patchData({
                properties: allProperties.map((p) =>
                  p.id === property.id
                    ? {
                        ...p,
                        access: {
                          ...p.access,
                          method,
                          keyLocation: text('keyLocation'),
                          boxLocation: text('boxLocation'),
                          personName: text('personName'),
                          personPhone: text('personPhone'),
                        },
                      }
                    : p,
                ),
              });
              setEditingAccess(false);
              toast.success(t('accessSaved'));
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('accessMethodLabel')} className="sm:col-span-2">
                {(props) => (
                  <Select
                    {...props}
                    name="method"
                    defaultValue={property.access?.method ?? 'customer-present'}
                  >
                    {ACCESS_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {t(`method.${method}` as 'method.key-box')}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={t('accessKeyLocationLabel')} optional>
                {(props) => (
                  <Input
                    {...props}
                    name="keyLocation"
                    defaultValue={property.access?.keyLocation ?? ''}
                  />
                )}
              </Field>
              <Field label={t('accessBoxLocationLabel')} optional>
                {(props) => (
                  <Input
                    {...props}
                    name="boxLocation"
                    defaultValue={property.access?.boxLocation ?? ''}
                  />
                )}
              </Field>
              <Field label={t('accessPersonLabel')} optional>
                {(props) => (
                  <Input
                    {...props}
                    name="personName"
                    defaultValue={property.access?.personName ?? ''}
                  />
                )}
              </Field>
              <Field label={t('accessPhoneLabel')} optional>
                {(props) => (
                  <Input
                    {...props}
                    name="personPhone"
                    type="tel"
                    defaultValue={property.access?.personPhone ?? ''}
                  />
                )}
              </Field>
            </div>
            <p className="mt-4 text-sm text-ink-tertiary">{t('accessCodeNote')}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="submit" size="sm">
                {t('accessSave')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingAccess(false)}
              >
                {t('dismiss')}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="mt-5"
            onClick={() => setEditingAccess(true)}
          >
            <Pencil className="size-3.5" aria-hidden />
            {t('accessEdit')}
          </Button>
        )}
      </section>

      <Field label={t('notesTitle')} hint={t('notesHint')} className="mt-10">
        {(props) => (
          <Textarea
            rows={3}
            value={property.permanentNotes ?? ''}
            onChange={(e) =>
              patchData({
                properties: allProperties.map((p) =>
                  p.id === property.id ? { ...p, permanentNotes: e.target.value } : p,
                ),
              })
            }
            {...props}
          />
        )}
      </Field>

      <section className="mt-10">
        <h2 className="label-type text-ink-tertiary">{t('historyTitle')}</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-ink-tertiary">{t('historyEmpty')}</p>
        ) : (
          <ul className="mt-3 border-t border-line-subtle">
            {history.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line-subtle py-3"
              >
                <span data-numeric className="text-sm">
                  {format.dateTime(new Date(booking.start), 'full')}
                </span>
                <span className="flex items-center gap-3 text-sm text-ink-secondary">
                  {services.find((s) => s.slug === booking.serviceSlug)?.name[locale]}
                  <StatusBadge entity="booking" state={booking.status} size="sm" />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
