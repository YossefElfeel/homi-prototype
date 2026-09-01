'use client';

import { use, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, Mail, Phone } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing, type Locale } from '@/i18n/routing';
import { AddressFields } from '@/components/admin/address-fields';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { normaliseAddress, toDraft } from '@/lib/contact-address';
import { useHydrated, useStore } from '@/mock/store';

/**
 * Screen 64b — correct a customer's details.
 *
 * The record could be created (64a) and read (65) and nothing else. A phone
 * number typed wrong on the call that created it stayed wrong, and the only
 * field the panel could actually change was the internal note — which is the
 * one field the customer never sees.
 *
 * Field labels, validation copy and the duplicate warning are 64a's, reused
 * rather than re-typed: two forms over one record that disagree about what a
 * valid email is are worse than either of them alone.
 */
export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.customerEdit');
  const ft = useTranslations('admin.customerNew');
  const router = useRouter();
  const hydrated = useHydrated();

  const customers = useStore((s) => s.data.customers);
  const settings = useStore((s) => s.settings);
  const updateCustomer = useStore((s) => s.updateCustomer);
  const customer = customers.find((c) => c.id === id);

  const [draft, setDraft] = useState(() => ({
    firstName: customer?.firstName ?? '',
    lastName: customer?.lastName ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    language: (customer?.language ?? 'de') as Locale,
    internalNotes: customer?.internalNotes ?? '',
    address: toDraft(customer?.address),
  }));
  const [touched, setTouched] = useState(false);
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!draft.firstName.trim()) next.firstName = ft('errorRequired');
    if (!draft.lastName.trim()) next.lastName = ft('errorRequired');
    if (!draft.email.trim()) next.email = ft('errorRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))
      next.email = ft('errorEmail');
    if (!draft.phone.trim()) next.phone = ft('errorPhone');

    /* 64a's rules, not a second opinion on them: optional as a whole, and
       refused half-typed. See the note there. */
    const postcode = draft.address.postcode.trim();
    if (postcode && !/^\d{4}$/.test(postcode)) next.postcode = ft('errorPostcode');
    if (draft.address.street.trim() && !postcode) next.postcode = ft('errorRequired');
    if (draft.address.street.trim() && !draft.address.city.trim())
      next.city = ft('errorRequired');
    if (!draft.address.street.trim() && (postcode || draft.address.city.trim()))
      next.street = ft('errorStreetMissing');

    return next;
  }, [draft, ft]);

  /* Same rule as 64a — email *or* phone — with the record itself excluded.
     Without that exclusion the form would report every customer as a duplicate
     of themselves the moment it opened. */
  const duplicate = useMemo(() => {
    const mail = draft.email.trim().toLowerCase();
    const tel = draft.phone.trim();
    const others = customers.filter((c) => c.id !== id);

    const byEmail = mail ? others.find((c) => c.email.toLowerCase() === mail) : undefined;
    if (byEmail) return { customer: byEmail, field: 'email' as const };

    const byPhone = tel ? others.find((c) => c.phone === tel) : undefined;
    if (byPhone) return { customer: byPhone, field: 'phone' as const };

    return null;
  }, [customers, id, draft.email, draft.phone]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;
  if (!customer) return <p className="text-ink-tertiary">{t('notFound')}</p>;

  const blocked = duplicate !== null && !overrideDuplicate;
  const show = (key: string) => (touched ? errors[key] : undefined);
  const set = (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch }));

  function submit() {
    setTouched(true);
    if (Object.keys(errors).length > 0 || blocked) return;

    updateCustomer(id, {
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      language: draft.language,
      /* Empty means "no note", not an empty string — the detail screen tests
         the field for truthiness before it renders the block. */
      internalNotes: draft.internalNotes.trim() || undefined,
      /* Same treatment, and it is what makes clearing an address possible:
         emptying the street drops the whole block rather than storing four
         blank strings the detail screen would render as an empty card. */
      address: normaliseAddress(draft.address),
    });
    toast.success(
      t('done', { name: `${draft.firstName.trim()} ${draft.lastName.trim()}` }),
    );
    router.push(`/admin/kunden/${id}`);
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        back={{ href: `/admin/kunden/${id}`, label: t('back') }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Card>
          <CardHeader title={ft('contactTitle')} />
          <CardBody className="grid gap-5 sm:grid-cols-2">
            <Field label={ft('firstName')} error={show('firstName')}>
              {(props) => (
                <Input
                  {...props}
                  value={draft.firstName}
                  autoComplete="given-name"
                  onChange={(e) => set({ firstName: e.target.value })}
                />
              )}
            </Field>
            <Field label={ft('lastName')} error={show('lastName')}>
              {(props) => (
                <Input
                  {...props}
                  value={draft.lastName}
                  autoComplete="family-name"
                  onChange={(e) => set({ lastName: e.target.value })}
                />
              )}
            </Field>
            <Field label={ft('email')} hint={ft('emailHint')} error={show('email')}>
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  inputMode="email"
                  value={draft.email}
                  leading={<Mail aria-hidden />}
                  onChange={(e) => {
                    set({ email: e.target.value });
                    setOverrideDuplicate(false);
                  }}
                />
              )}
            </Field>
            <Field label={ft('phone')} error={show('phone')}>
              {(props) => (
                <Input
                  {...props}
                  type="tel"
                  inputMode="tel"
                  value={draft.phone}
                  placeholder="+41 79 000 00 00"
                  leading={<Phone aria-hidden />}
                  onChange={(e) => {
                    set({ phone: e.target.value });
                    setOverrideDuplicate(false);
                  }}
                />
              )}
            </Field>
            <Field
              label={ft('language')}
              hint={ft('languageHint')}
              className="sm:col-span-2 sm:max-w-xs"
            >
              {(props) => (
                <Select
                  {...props}
                  value={draft.language}
                  onChange={(e) => set({ language: e.target.value as Locale })}
                >
                  {routing.locales.map((l) => (
                    <option key={l} value={l}>
                      {LOCALE_LABELS[l]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </CardBody>
        </Card>

        {/* 64a's block, in 64a's position. The Objekt checkbox is deliberately
            not here: this customer's properties already exist as records of
            their own, and a box that silently created a fourth one every time
            somebody fixed a house number is not an edit. */}
        <Card className="mt-app-section">
          <CardHeader title={ft('addressTitle')} description={ft('addressHint')} />
          <CardBody>
            <AddressFields
              value={draft.address}
              onChange={(address) => set({ address })}
              served={settings.servedPostcodes}
              errors={{
                street: show('street'),
                postcode: show('postcode'),
                city: show('city'),
              }}
            />
          </CardBody>
        </Card>

        <Card className="mt-app-section">
          <CardHeader title={ft('notesTitle')} description={ft('notesHint')} />
          <CardBody>
            <Field label={ft('notesTitle')} className="[&>label]:sr-only">
              {(props) => (
                <Textarea
                  {...props}
                  value={draft.internalNotes}
                  placeholder={ft('notesPlaceholder')}
                  onChange={(e) => set({ internalNotes: e.target.value })}
                />
              )}
            </Field>
          </CardBody>
        </Card>

        {duplicate && (
          <Card tone="warning" className="mt-app-section">
            <div className="flex gap-3">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-status-warning-fg"
                aria-hidden
              />
              <div className="min-w-0">
                <h2 className="font-medium">{ft('duplicateTitle')}</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  {ft('duplicateBody', {
                    name: `${duplicate.customer.firstName} ${duplicate.customer.lastName}`,
                    field:
                      duplicate.field === 'email'
                        ? ft('duplicateFieldEmail')
                        : ft('duplicateFieldPhone'),
                  })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/admin/kunden/${duplicate.customer.id}`}>
                      {ft('duplicateOpen')}
                    </Link>
                  </Button>
                  {!overrideDuplicate && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setOverrideDuplicate(true)}
                    >
                      {ft('duplicateIgnore')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-app-section flex flex-wrap gap-3">
          <Button type="submit" disabled={blocked}>
            {t('save')}
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/admin/kunden/${id}`}>{t('cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
