'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Eye, Home, KeyRound, Pencil } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import type { Locale } from '@/i18n/routing';
import type { AccessMethod } from '@/mock/schema';
import { PropertyDeleteDialog } from '@/components/account/property-delete-dialog';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { useConfirmTarget } from '@/components/ui/confirm-dialog';
import { DetailList, DetailRow } from '@/components/ui/detail-list';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination, paginate } from '@/components/ui/pagination';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { ActionIcon } from '@/lib/action-icons';
import { propertyUsage, type PropertyUsage } from '@/lib/property-facts';
import { areaLabel, figure } from '@/lib/property-size';
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
 *
 * Only that one block had a surface under it before. The measurements above it
 * and the visit history below were loose rows on the page ground, which read
 * as "this part matters and those parts are filler" — they are the same
 * record. All four are cards now, in the same split the office's copy of this
 * screen (68) uses.
 */
export default function AccountPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('account.property');
  /* The delete asks the same question here as in the row menu, so it reads the
     same sentences — a confirm worded twice is two different rules to a
     reader. Only the card's own heading is local to this screen. */
  const listT = useTranslations('account.properties');
  const appT = useTranslations('app');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();

  const { customer, properties, bookings } = useAccount();
  const services = useStore((s) => s.services);
  const patchData = useStore((s) => s.patchData);
  const allProperties = useStore((s) => s.data.properties);
  /* The whole set: two of the six things that hold a property — the key
     register and the change log — belong to the office and never reach
     `useAccount`. See the same note on the list. */
  const data = useStore((s) => s.data);
  const deleteProperty = useStore((s) => s.deleteProperty);
  const router = useRouter();

  const [editingAccess, setEditingAccess] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const removing = useConfirmTarget<PropertyUsage>();

  if (!hydrated) return <SkeletonPage label={t('back')} />;

  const property = properties.find((p) => p.id === id);
  /* Was a bare em-dash. A property id that no longer resolves is the same dead
     end the invoice screen already answers with a way back. */
  if (!property) {
    return (
      <EmptyState
        icon={Home}
        headingLevel={1}
        title={t('missingTitle')}
        body={t('missingBody')}
        action={
          <Button asChild variant="secondary">
            <Link href="/account/properties">{t('back')}</Link>
          </Button>
        }
      />
    );
  }

  const history = bookings
    .filter((b) => b.propertyId === property.id)
    .sort((a, b) => (a.start < b.start ? 1 : -1));
  const historyView = paginate(history, historyPage, 10);

  /* The label the delete asks about and reports back. The street stands in for
     a property saved without one, so the confirm never asks about «». */
  const name = property.label || property.street;

  function confirmDelete() {
    /* The store counts again, and the log is signed with the customer's name
       rather than the office's — both for the reasons on the list. */
    if (!deleteProperty(id, customer && `${customer.firstName} ${customer.lastName}`)) {
      toast.error(listT('deleteRaced'));
      removing.dismiss();
      return;
    }
    toast.success(listT('deleteDone', { label: name }));
    /* Back to the list rather than staying on a record that no longer exists,
       which would swap the page for «Dieses Objekt finden wir nicht» — a dead
       end that reads as a broken link rather than as a delete that worked. */
    router.replace('/account/properties');
  }

  const facts: [string, string][] = [
    [t('area'), areaLabel(property.area)],
    [t('rooms'), figure(property.rooms)],
    [t('bathrooms'), figure(property.bathrooms)],
    [t('floor'), `${property.floor}`],
    [t('elevator'), property.hasElevator ? t('yes') : t('no')],
    [t('pets'), property.hasPets ? t('yes') : t('no')],
  ];

  return (
    <div>
      <PageHeader
        back={{ href: '/account/properties', label: t('back') }}
        title={property.label}
        lead={
          <>
            {property.street}, <span data-numeric>{property.postcode}</span>{' '}
            {property.city}
          </>
        }
      />

      <div className="gap-app-section grid lg:grid-cols-12">
        <div className="space-y-app-section lg:col-span-7">
          <Card>
            <CardHeader title={t('factsTitle')} />
            <CardBody>
              <DetailList columns={2}>
                {facts.map(([label, value]) => (
                  <DetailRow key={label} label={label}>
                    <span data-numeric>{value}</span>
                  </DetailRow>
                ))}
              </DetailList>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <KeyRound className="size-4 text-ink-tertiary" aria-hidden />
                  {t('accessTitle')}
                </span>
              }
              description={t('accessBody')}
            />
            <CardBody>
              {property.access ? (
                <p className="text-sm">
                  {t(`method.${property.access.method}` as 'method.key-box')}
                  {property.access.keyLocation && (
                    <span className="block text-ink-secondary">
                      {property.access.keyLocation}
                    </span>
                  )}
                  {property.access.boxLocation && (
                    <span className="block text-ink-secondary">
                      {property.access.boxLocation}
                    </span>
                  )}
                  {property.access.personName && (
                    <span className="block text-ink-secondary">
                      {property.access.personName}
                      {property.access.personPhone
                        ? ` · ${property.access.personPhone}`
                        : ''}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-ink-tertiary">{t('accessNone')}</p>
              )}

              <Alert
                tone="info"
                icon={Eye}
                className="mt-5"
                title={t('accessWhoTitle')}
              >
                {t('accessWho')}
              </Alert>

              {editingAccess ? (
                <form
                  className="mt-5 border-t border-line-subtle pt-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const method = String(
                      form.get('method') ?? 'customer-present',
                    ) as AccessMethod;
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
                  <div className="gap-app grid sm:grid-cols-2">
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
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('notesTitle')} description={t('notesHint')} />
            <CardBody>
              {/* The label is the card's own heading now, so the Field carries
                  only the control — two headings on one box read as two
                  fields, one of which has gone missing. */}
              <Textarea
                rows={3}
                aria-label={t('notesTitle')}
                value={property.permanentNotes ?? ''}
                onChange={(e) =>
                  patchData({
                    properties: allProperties.map((p) =>
                      p.id === property.id
                        ? { ...p, permanentNotes: e.target.value }
                        : p,
                    ),
                  })
                }
              />
            </CardBody>
          </Card>

          {/*
            Its own card, and last. Everything above it is a correction that can
            be corrected again — the access method, the standing note, the
            measurements a quote is priced from. This one cannot, so it does not
            belong under any of their headings. It belongs on this screen all
            the same: somebody who opened the address they typed wrong should
            not have to go back to the list to be rid of it.

            The heading is a heading, not the question. «Objekt löschen?»
            sitting permanently on the page is a prompt the reader answers by
            ignoring it.
          */}
          <Card tone="danger">
            <CardHeader title={t('deleteSectionTitle')} description={t('deleteHint')} />
            <CardBody>
              <Button
                variant="danger"
                size="sm"
                onClick={() => removing.ask(propertyUsage(data, property.id))}
              >
                <ActionIcon.delete className="size-3.5" aria-hidden />
                {listT('rowDelete')}
              </Button>
            </CardBody>
          </Card>
        </div>

        <aside className="lg:col-span-5">
          <Card pad="none">
            <CardHeader className="p-card" title={t('historyTitle')} />
            {history.length === 0 ? (
              <p className="px-card pb-card text-sm text-ink-tertiary">
                {t('historyEmpty')}
              </p>
            ) : (
              <>
                <ul className="border-t border-line-subtle">
                  {historyView.slice.map((booking) => (
                    <li
                      key={booking.id}
                      className="px-card py-row flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line-subtle last:border-0"
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
                {/*
                  A plan cleans this address every fortnight, so the history is
                  the one list in the account with no ceiling on it: a customer
                  three years in had every visit ever made stacked in the aside,
                  and the card grew until the page did. Ten a page, the same ten
                  every table in the product pages at, and the line stays under
                  a short history to say where the ceiling is.
                */}
                <Pagination
                  className="px-card pb-card"
                  page={historyView.page}
                  pageCount={historyView.pageCount}
                  onPageChange={setHistoryPage}
                  label={appT('pageLabel')}
                  previousLabel={appT('pagePrevious')}
                  nextLabel={appT('pageNext')}
                  summary={appT('pageSummary', {
                    from: historyView.from,
                    to: historyView.to,
                    total: historyView.total,
                  })}
                  note={appT('pagePerPage', { n: 10 })}
                />
              </>
            )}
          </Card>
        </aside>
      </div>

      <PropertyDeleteDialog
        target={
          removing.target && {
            label: name,
            usage: removing.target,
          }
        }
        open={removing.open}
        onOpenChange={(open) => !open && removing.dismiss()}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
