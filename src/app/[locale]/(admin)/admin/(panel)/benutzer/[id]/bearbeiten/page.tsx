'use client';

import { use, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Checkbox, Field, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { doesFieldWork, fullName } from '@/lib/user-facts';
import { regionByPostcode } from '@/mock/engines/coverage';
import { useHydrated, useStore } from '@/mock/store';
import type { TeamRole } from '@/mock/schema';

/**
 * Screen U4 — the account's own details.
 *
 * Deliberately not the rights. Those have a screen of their own, because they
 * are the only thing here that changes what somebody can *do* — everything on
 * this form is a correction, and mixing a typo in a phone number with an
 * escalation of access puts them behind one «Speichern» and makes the
 * dangerous one look as routine as the harmless one.
 *
 * The skills and regions blocks moved here from the old team record, where they
 * autosaved on every tick. On a screen with a save button that would have been
 * two contradictory promises at once, so they are staged with the rest of the
 * form now.
 */
export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.users.edit');
  const create = useTranslations('admin.users.create');
  const roles = useTranslations('admin.users.roles');
  const detail = useTranslations('admin.users.detail');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const team = useStore((s) => s.data.team);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const updateTeamMember = useStore((s) => s.updateTeamMember);

  const member = team.find((m) => m.id === id);

  const [form, setForm] = useState(() => ({
    firstName: member?.firstName ?? '',
    lastName: member?.lastName ?? '',
    email: member?.email ?? '',
    phone: member?.phone ?? '',
    role: (member?.role ?? 'contractor') as TeamRole,
    skills: member?.skills ?? [],
    regions: member?.regions ?? [],
  }));
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = create('errorRequired');
    if (!form.lastName.trim()) next.lastName = create('errorRequired');
    if (!form.email.trim()) next.email = create('errorRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = create('errorEmail');
    if (!form.phone.trim()) next.phone = create('errorRequired');
    return next;
  }, [form, create]);

  if (!hydrated) return <SkeletonPage label={t('back')} />;
  if (!member) return <p className="text-ink-tertiary">—</p>;

  const isOwner = member.role === 'owner';
  const show = (key: string) => (touched ? errors[key] : undefined);
  const patch = (next: Partial<typeof form>) => setForm((f) => ({ ...f, ...next }));

  function submit() {
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    updateTeamMember(member!.id, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      /* The owner's role is the one field this form cannot move — see the
         notice below the select. */
      role: isOwner ? 'owner' : form.role,
      /* An office account keeps neither. Leaving stale skills behind would put
         a person back in the assignee picker the moment somebody flipped the
         role again, carrying clearances nobody re-checked. */
      skills: doesFieldWork({ role: form.role }) ? form.skills : [],
      regions: doesFieldWork({ role: form.role }) ? form.regions : [],
    });

    toast.success(t('done'));
    router.push(`/admin/benutzer/${member!.id}`);
  }

  const fieldWork = isOwner || doesFieldWork({ role: form.role });

  return (
    <div>
      <PageHeader
        title={t('title', { name: fullName(member) })}
        lead={t('lead')}
        back={{ href: `/admin/benutzer/${member.id}`, label: t('back') }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Card>
          <CardHeader title={create('personTitle')} />
          <CardBody className="grid gap-5 sm:grid-cols-2">
            <Field label={create('firstName')} error={show('firstName')}>
              {(props) => (
                <Input
                  {...props}
                  value={form.firstName}
                  autoComplete="given-name"
                  onChange={(e) => patch({ firstName: e.target.value })}
                />
              )}
            </Field>
            <Field label={create('lastName')} error={show('lastName')}>
              {(props) => (
                <Input
                  {...props}
                  value={form.lastName}
                  autoComplete="family-name"
                  onChange={(e) => patch({ lastName: e.target.value })}
                />
              )}
            </Field>
            <Field label={create('email')} hint={create('emailHint')} error={show('email')}>
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  inputMode="email"
                  value={form.email}
                  leading={<Mail aria-hidden />}
                  onChange={(e) => patch({ email: e.target.value })}
                />
              )}
            </Field>
            <Field label={create('phone')} error={show('phone')}>
              {(props) => (
                <Input
                  {...props}
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  leading={<Phone aria-hidden />}
                  onChange={(e) => patch({ phone: e.target.value })}
                />
              )}
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-app-section">
          <CardHeader title={create('roleTitle')} description={create('roleHint')} />
          <CardBody>
            {isOwner ? (
              <p className="text-sm text-ink-secondary">{t('roleLockedOwner')}</p>
            ) : (
              <>
                <Field label={create('roleTitle')} className="max-w-xs [&>label]:sr-only">
                  {(props) => (
                    <Select
                      {...props}
                      value={form.role}
                      onChange={(e) => patch({ role: e.target.value as TeamRole })}
                    >
                      <option value="contractor">{roles('contractor')}</option>
                      <option value="office">{roles('office')}</option>
                    </Select>
                  )}
                </Field>
                {/* Only while the change is actually being made. A permanent
                    warning under a select is a warning nobody reads by the
                    third visit. */}
                {form.role === 'office' && member.role !== 'office' && (
                  <Alert tone="warning" className="mt-4">
                    {t('roleChangeWarning')}
                  </Alert>
                )}
              </>
            )}
          </CardBody>
        </Card>

        {fieldWork && (
          <>
            <Card className="mt-app-section">
              <CardHeader
                title={detail('skillsTitle')}
                description={detail('skillsHint')}
              />
              <CardBody className="space-y-2.5">
                {services.map((service) => (
                  <Checkbox
                    key={service.id}
                    label={service.name[locale]}
                    checked={form.skills.includes(service.slug)}
                    onChange={(e) =>
                      patch({
                        skills: e.target.checked
                          ? [...form.skills, service.slug]
                          : form.skills.filter((s) => s !== service.slug),
                      })
                    }
                  />
                ))}
              </CardBody>
            </Card>

            <Card className="mt-app-section">
              <CardHeader title={detail('regionsTitle')} />
              <CardBody className="grid gap-2.5 sm:grid-cols-2">
                {settings.servedPostcodes.map((code) => (
                  <Checkbox
                    key={code}
                    label={`${code} ${regionByPostcode(code)?.name ?? ''}`}
                    checked={form.regions.includes(code)}
                    onChange={(e) =>
                      patch({
                        regions: e.target.checked
                          ? [...form.regions, code]
                          : form.regions.filter((c) => c !== code),
                      })
                    }
                  />
                ))}
              </CardBody>
            </Card>
          </>
        )}

        <div className="mt-app-section flex flex-wrap gap-3">
          <Button type="submit">{t('save')}</Button>
          <Button asChild variant="ghost">
            <Link href={`/admin/benutzer/${member.id}`}>{t('cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
