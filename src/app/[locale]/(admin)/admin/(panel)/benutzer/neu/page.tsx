'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { AREAS, PRESETS, PRESET_KEYS, type PresetKey } from '@/lib/admin-permissions';
import { fullName } from '@/lib/user-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';
import type { TeamRole } from '@/mock/schema';

const ROLES: TeamRole[] = ['contractor', 'office'];

/**
 * Screen U3 — a user typed in by hand.
 *
 * This is the path `/flows` carried as deliberately open for nine waves: the
 * only way into the team was through an accepted application. That kept a
 * contractor's rights tied to a record somebody had checked, which is a good
 * rule for contractors and no rule at all for the bookkeeper, who never applied
 * for anything and whose account the office therefore could not create.
 *
 * Three answers, in the order they matter. Who, what kind of colleague, and
 * what they may open. The third is a preset rather than a matrix — twenty-two
 * switches is not a question to put to somebody who is halfway through typing a
 * phone number, and the rights screen is one click away from the record this
 * form lands on.
 *
 * «Geschäftsleitung» is not on offer. There is one owner, the whole permission
 * model treats them as unbounded, and a second one created from a form would be
 * an account nobody could take back.
 */
export default function NewUserPage() {
  const t = useTranslations('admin.users.create');
  const roles = useTranslations('admin.users.roles');
  const roleHints = useTranslations('admin.users.roleHints');
  const rights = useTranslations('admin.users.rights');
  const navT = useTranslations('admin.shell.nav');
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const team = useStore((s) => s.data.team);
  const createTeamMember = useStore((s) => s.createTeamMember);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<TeamRole>('office');
  /*
   * «Nur eigener Einsatzplan» as the default, not «Voller Zugriff».
   *
   * A form that opens on everything is a form where the fast path is the
   * dangerous one — and the fast path is what a hurried office takes. Starting
   * small means the mistake is an account that cannot do enough, which somebody
   * reports within the hour, rather than one that can do too much, which nobody
   * reports at all.
   */
  const [preset, setPreset] = useState<PresetKey>('field');
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = t('errorRequired');
    if (!lastName.trim()) next.lastName = t('errorRequired');
    if (!email.trim()) next.email = t('errorRequired');
    /* Deliberately loose — the same rule the customer form uses, and for the
       same reason: the point is to catch a phone number typed into the email
       box, not to validate RFC 5322. */
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = t('errorEmail');
    if (!phone.trim()) next.phone = t('errorRequired');
    return next;
  }, [firstName, lastName, email, phone, t]);

  /*
   * The duplicate check, and it is a block rather than a warning.
   *
   * On a customer this is advisory — two records for one household split the
   * history and that is expensive but survivable. Here the email *is* the
   * sign-in, so two accounts on one address is not a messy record, it is a
   * login with two answers. There is nothing to weigh up, so nothing is
   * offered to weigh it with.
   */
  const duplicate = useMemo(() => {
    const mail = email.trim().toLowerCase();
    if (!mail) return null;
    return team.find((m) => m.email.toLowerCase() === mail) ?? null;
  }, [team, email]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const permissions = PRESETS[preset];
  /* Derived, not written out: a third owner-only area added next month names
     itself here rather than making this sentence quietly wrong. */
  const lockedNames = AREAS.filter((a) => a.ownerOnly)
    .map((a) => navT(a.permission))
    .join(', ');

  function submit() {
    setTouched(true);
    if (Object.keys(errors).length > 0 || duplicate) return;

    const id = createTeamMember(
      { firstName, lastName, email, phone, role, permissions },
      now,
    );
    toast.success(t('done', { name: `${firstName.trim()} ${lastName.trim()}` }));
    router.push(`/admin/benutzer/${id}`);
  }

  const show = (key: string) => (touched ? errors[key] : undefined);

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        back={{ href: '/admin/benutzer', label: t('back') }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Card>
          <CardHeader title={t('personTitle')} />
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPhone(e.target.value)}
                />
              )}
            </Field>
          </CardBody>
        </Card>

        {/*
          Cards rather than a Select, for both of the next two blocks.

          The role decides whether somebody turns up in a job assignment and
          the preset decides what they can open — two consequences a reader has
          to be told, and a dropdown has nowhere to tell them. Radio semantics
          come from the inputs, so the keyboard behaves exactly as it would on
          a bare radio group.
        */}
        <Card className="mt-app-section">
          <CardHeader title={t('roleTitle')} description={t('roleHint')} />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {ROLES.map((value) => (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-4 transition-colors',
                  role === value
                    ? 'border-line-focus bg-accent-quiet'
                    : 'border-line-subtle hover:bg-sunken',
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={role === value}
                  onChange={() => setRole(value)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--accent-solid)]"
                />
                <span className="min-w-0">
                  <span className="block font-medium">{roles(value)}</span>
                  <span className="mt-0.5 block text-sm text-ink-tertiary">
                    {roleHints(value)}
                  </span>
                </span>
              </label>
            ))}
          </CardBody>
        </Card>

        <Card className="mt-app-section">
          <CardHeader title={t('accessTitle')} description={t('accessHint')} />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {PRESET_KEYS.map((key) => (
              <label
                key={key}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-4 transition-colors',
                  preset === key
                    ? 'border-line-focus bg-accent-quiet'
                    : 'border-line-subtle hover:bg-sunken',
                )}
              >
                <input
                  type="radio"
                  name="preset"
                  value={key}
                  checked={preset === key}
                  onChange={() => setPreset(key)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--accent-solid)]"
                />
                <span className="min-w-0">
                  <span className="block font-medium">{rights(`presets.${key}`)}</span>
                  {/*
                    The areas themselves, not a count. «6 Bereiche» tells a
                    reader nothing they can act on; the four or five names do,
                    and they are the same names the sidebar uses.

                    «Voller Zugriff» is the exception, and it has to be. Cut to
                    the first four it read «Anfragen, Offerten, Buchungen,
                    Kalender …» — which is exactly what «Betrieb» reads, so the
                    widest option on the list and one of the narrowest looked
                    like the same choice. What full access actually means is the
                    two areas it does *not* include, so that is what it says.
                  */}
                  <span className="mt-0.5 block text-sm text-ink-tertiary">
                    {key === 'full'
                      ? t('accessFullHint', {
                          n: PRESETS.full.length,
                          except: lockedNames,
                        })
                      : PRESETS[key]
                          .slice(0, 4)
                          .map((permission) => navT(permission))
                          .join(', ') + (PRESETS[key].length > 4 ? ' …' : '')}
                  </span>
                </span>
              </label>
            ))}
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
                    name: fullName(duplicate),
                    email: duplicate.email,
                  })}
                </p>
                <Button asChild size="sm" variant="secondary" className="mt-4">
                  <Link href={`/admin/benutzer/${duplicate.id}`}>{t('duplicateOpen')}</Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-app-section flex flex-wrap gap-3">
          <Button type="submit" disabled={Boolean(duplicate)}>
            {t('save')}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/benutzer">{t('cancel')}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
