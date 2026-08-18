'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, Mail, Phone } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
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
 * A plain form, deliberately: no wizard, no steps. Six fields is not a journey.
 * The one piece of intelligence is the duplicate check, which mirrors the
 * wizard's own rule — match on email *or* phone — because the failure it
 * prevents (two records for one household, history split across both) is
 * invisible at the moment it happens and expensive a month later.
 */
export default function NewCustomerPage() {
  const t = useTranslations('admin.customerNew');
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const customers = useStore((s) => s.data.customers);
  const createCustomer = useStore((s) => s.createCustomer);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<Locale>('de');
  const [notes, setNotes] = useState('');

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
    return next;
  }, [firstName, lastName, email, phone, t]);

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

    const id = createCustomer(
      { firstName, lastName, email, phone, language, internalNotes: notes },
      now,
    );
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
