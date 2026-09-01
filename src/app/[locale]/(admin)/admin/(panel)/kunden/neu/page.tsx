'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, Mail, Phone } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing, type Locale } from '@/i18n/routing';
import { AddressFields } from '@/components/admin/address-fields';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { EMPTY_ADDRESS, normaliseAddress } from '@/lib/contact-address';
import { PROPERTY_KINDS } from '@/lib/property-facts';
import type { PropertyKind } from '@/mock/schema';
import { useHydrated, useNow, useStore } from '@/mock/store';

/**
 * Screen 64a — add a customer by hand.
 *
 * Until now a customer could only come into existence as a side effect of the
 * public wizard: the contact step of `submitDraft` invents one. That covers the
 * visitor and nobody else — and this is a company whose work arrives by phone
 * and by referral on eight municipalities' worth of lakeshore. The owner had
 * the list (screen 64) and no way to put anything in it.
 *
 * A plain form, deliberately: no wizard, no steps. The one piece of
 * intelligence is the duplicate check, which mirrors the wizard's own rule —
 * match on email *or* phone — because the failure it prevents (two records for
 * one household, history split across both) is invisible at the moment it
 * happens and expensive a month later.
 *
 * **The address.** Until now this form took a name, a number and nothing that
 * said where the person was. Every address in the product is a `Property`, and
 * a property is somewhere work happens — so a customer typed in from a call
 * had no address on file until their first job created one, and the properties
 * block on their record read «no property on file yet» with nothing anywhere
 * that could fill it.
 *
 * Two different facts, so two places, and the form is explicit about which is
 * which:
 *
 *  · **The contact address** is where the person is — where an invoice goes.
 *    It is optional, because the call comes before the address does: a name
 *    and a number is a real customer, and a form that refuses to save one
 *    loses the person who has just rung off.
 *
 *  · **The Objekt** is where the work happens, and it is opt-in. Most of the
 *    time it is the same address, which is why the box exists rather than a
 *    second set of fields; when it is a landlord with three flats it is not,
 *    which is why it is a box and not automatic.
 *
 * The Objekt is created from the address alone. Its size is left open on
 * purpose — «how many square metres?» is not the second question you ask
 * somebody who has just rung, and the record says «not measured yet» until
 * somebody measures it rather than printing a 0 m² that would price.
 */
export default function NewCustomerPage() {
  const t = useTranslations('admin.customerNew');
  /* The properties list owns the words for the three kinds. A second copy here
     is a second thing to reword the next time «Büro» becomes «Gewerbe». */
  const pt = useTranslations('admin.properties');
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const customers = useStore((s) => s.data.customers);
  const settings = useStore((s) => s.settings);
  const createCustomer = useStore((s) => s.createCustomer);
  const createProperty = useStore((s) => s.createProperty);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<Locale>('de');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  /** Off by default: creating a record nobody asked for is not a convenience. */
  const [alsoProperty, setAlsoProperty] = useState(false);
  const [propertyKind, setPropertyKind] = useState<PropertyKind>('apartment');

  const [touched, setTouched] = useState(false);
  /** Set once the owner has seen the duplicate warning and said "anyway". */
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = t('errorRequired');
    if (!lastName.trim()) next.lastName = t('errorRequired');
    if (!email.trim()) next.email = t('errorRequired');
    // Deliberately loose. A stricter pattern rejects valid addresses, and the
    // prototype never sends mail — the point is to catch a typed-in phone
    // number in the email box, not to validate RFC 5322.
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = t('errorEmail');
    if (!phone.trim()) next.phone = t('errorPhone');

    /*
     * The address is optional; a half-typed one is not.
     *
     * Nothing here fires on an untouched block — leaving the whole thing empty
     * is a legitimate way to save a customer. What it catches is the address
     * somebody started and did not finish: a street with no postcode reaches
     * no letterbox, and a two-digit PLZ is a typo rather than a decision.
     */
    const postcode = address.postcode.trim();
    if (postcode && !/^\d{4}$/.test(postcode)) next.postcode = t('errorPostcode');
    if (address.street.trim() && !postcode) next.postcode = t('errorRequired');
    if (address.street.trim() && !address.city.trim()) next.city = t('errorRequired');
    if (!address.street.trim() && (postcode || address.city.trim()))
      next.street = t('errorStreetMissing');

    return next;
  }, [firstName, lastName, email, phone, address, t]);

  /* Matched on the trimmed, lower-cased value — "Anna@…" and "anna@…" are one
     person, and a trailing space from a paste should not create a second. */
  const duplicate = useMemo(() => {
    const mail = email.trim().toLowerCase();
    const tel = phone.trim();
    if (!mail && !tel) return null;

    const byEmail = mail ? customers.find((c) => c.email.toLowerCase() === mail) : undefined;
    if (byEmail) return { customer: byEmail, field: 'email' as const };

    const byPhone = tel ? customers.find((c) => c.phone === tel) : undefined;
    if (byPhone) return { customer: byPhone, field: 'phone' as const };

    return null;
  }, [customers, email, phone]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const blocked = duplicate !== null && !overrideDuplicate;

  function submit() {
    setTouched(true);
    if (Object.keys(errors).length > 0 || blocked) return;

    const contact = normaliseAddress(address);
    const id = createCustomer(
      { firstName, lastName, email, phone, language, internalNotes: notes, address: contact },
      now,
    );

    /* Only with an address to build it from — the box can be ticked and the
       block left empty, and creating a property with no street would put an
       unnamed row in the properties list that nothing could ever match. */
    if (alsoProperty && contact) {
      createProperty(
        {
          customerId: id,
          /* The street is the label until somebody names it, which is what
             the admin intake form does with a typed-in address too. */
          label: contact.street,
          street: contact.street,
          addressDetail: contact.addressDetail,
          postcode: contact.postcode,
          city: contact.city,
          kind: propertyKind,
          /* Left absent, not zeroed — nobody has measured this place. The
             record reads «not measured yet» until somebody does. */
          area: undefined,
          rooms: undefined,
          bathrooms: undefined,
          floor: 0,
          hasElevator: false,
          hasPets: false,
          needsExtraEffort: false,
        },
        now,
      );
    }

    toast.success(t('done', { name: `${firstName.trim()} ${lastName.trim()}` }));
    router.push(`/admin/kunden/${id}`);
  }

  const show = (key: string) => (touched ? errors[key] : undefined);

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        back={{ href: '/admin/kunden', label: t('back') }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Card>
          <CardHeader title={t('contactTitle')} />
          <CardBody className="grid gap-5 sm:grid-cols-2">
            <Field label={t('firstName')} error={show('firstName')}>
              {(props) => (
                <Input
                  {...props}
                  value={firstName}
                  autoComplete="given-name"
                  onChange={(e) => setFirstName(e.target.value)}
                />
              )}
            </Field>
            <Field label={t('lastName')} error={show('lastName')}>
              {(props) => (
                <Input
                  {...props}
                  value={lastName}
                  autoComplete="family-name"
                  onChange={(e) => setLastName(e.target.value)}
                />
              )}
            </Field>
            <Field label={t('email')} hint={t('emailHint')} error={show('email')}>
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  inputMode="email"
                  value={email}
                  leading={<Mail aria-hidden />}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setOverrideDuplicate(false);
                  }}
                />
              )}
            </Field>
            <Field label={t('phone')} error={show('phone')}>
              {(props) => (
                <Input
                  {...props}
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  placeholder="+41 79 000 00 00"
                  leading={<Phone aria-hidden />}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setOverrideDuplicate(false);
                  }}
                />
              )}
            </Field>
            <Field
              label={t('language')}
              hint={t('languageHint')}
              className="sm:col-span-2 sm:max-w-xs"
            >
              {(props) => (
                <Select
                  {...props}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Locale)}
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

        {/*
          Its own card, under the contact block and above the note.

          Not folded into «Kontakt»: the four fields there are one person, and
          an address is a different kind of answer — it has its own validation,
          its own area check, and a decision attached to it about whether the
          work happens there too.
        */}
        <Card className="mt-app-section">
          <CardHeader title={t('addressTitle')} description={t('addressHint')} />
          <CardBody>
            <AddressFields
              value={address}
              onChange={setAddress}
              served={settings.servedPostcodes}
              errors={{
                street: show('street'),
                postcode: show('postcode'),
                city: show('city'),
              }}
            />

            {/*
              The Objekt decision, shown only once there is an address to make
              it about. An empty block with a checkbox under it asks the reader
              to decide something before they have typed the thing it applies
              to.
            */}
            {address.street.trim() && (
              <div className="mt-6 border-t border-line-subtle pt-5">
                <Checkbox
                  checked={alsoProperty}
                  onChange={(e) => setAlsoProperty(e.target.checked)}
                  label={
                    <>
                      <span className="block font-medium text-ink">
                        {t('alsoPropertyLabel')}
                      </span>
                      <span className="mt-0.5 block">{t('alsoPropertyHint')}</span>
                    </>
                  }
                />

                {alsoProperty && (
                  <Field
                    label={t('propertyKind')}
                    hint={t('propertyKindHint')}
                    className="mt-5 sm:max-w-xs"
                  >
                    {(props) => (
                      <Select
                        {...props}
                        value={propertyKind}
                        onChange={(e) => setPropertyKind(e.target.value as PropertyKind)}
                      >
                        {PROPERTY_KINDS.map((kind) => (
                          <option key={kind} value={kind}>
                            {pt(`kinds.${kind}`)}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="mt-app-section">
          <CardHeader title={t('notesTitle')} description={t('notesHint')} />
          <CardBody>
            <Field label={t('notesTitle')} className="[&>label]:sr-only">
              {(props) => (
                <Textarea
                  {...props}
                  value={notes}
                  placeholder={t('notesPlaceholder')}
                  onChange={(e) => setNotes(e.target.value)}
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
                <h2 className="font-medium">{t('duplicateTitle')}</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  {t('duplicateBody', {
                    name: `${duplicate.customer.firstName} ${duplicate.customer.lastName}`,
                    field:
                      duplicate.field === 'email'
                        ? t('duplicateFieldEmail')
                        : t('duplicateFieldPhone'),
                  })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/admin/kunden/${duplicate.customer.id}`}>
                      {t('duplicateOpen')}
                    </Link>
                  </Button>
                  {/* An override, not a bypass: it is one click, and it is a
                      click the owner has to make on purpose after reading who
                      the other record belongs to. */}
                  {!overrideDuplicate && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setOverrideDuplicate(true)}
                    >
                      {t('duplicateIgnore')}
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
            <Link href="/admin/kunden">{t('cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
