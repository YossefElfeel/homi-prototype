'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Check, Eye, EyeOff, KeyRound } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Field, Input, Checkbox } from '@/components/ui/field';
import { regionByPostcode } from '@/mock/engines/coverage';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { ServiceSlug } from '@/mock/schema';

/**
 * Screen H5 — turning an accepted applicant into a team account.
 *
 * The permission summary is the point of this screen, not the form fields.
 * The owner is about to give a stranger the address of a house and, on the
 * day, its alarm code — so what that account will and will not see is stated
 * in four plain sentences before the button, not linked to from a settings
 * page nobody opens. The rules listed here are the ones the field screens
 * actually enforce (§13).
 */
export default function ConvertApplicantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('admin.convert');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const applications = useStore((s) => s.data.applications);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const convertApplicant = useStore((s) => s.convertApplicant);
  const updateTeamMember = useStore((s) => s.updateTeamMember);

  const application = applications.find((a) => a.id === id);

  const [email, setEmail] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[] | null>(null);
  const [skills, setSkills] = useState<string[] | null>(null);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;
  if (!application) return <p className="text-ink-tertiary">—</p>;

  const name = `${application.firstName} ${application.lastName}`;
  const emailValue =
    email ??
    `${application.firstName.toLowerCase()}.${application.lastName.toLowerCase()}@homivaro.ch`;
  const regionValue = regions ?? settings.servedPostcodes;
  const skillValue =
    skills ??
    (application.experienceAreas.includes('assembly')
      ? ['moebelmontage']
      : (['unterhaltsreinigung', 'einmalreinigung'] as ServiceSlug[]));

  function confirm() {
    const memberId = convertApplicant(id, now);
    updateTeamMember(memberId, {
      email: emailValue,
      regions: regionValue,
      skills: skillValue,
    });
    router.push(`/admin/team/${memberId}`);
  }

  return (
    <div>
      <Button asChild variant="link" className="mb-6">
        <Link href={`/admin/bewerbungen/${id}`}>
          <ArrowLeft className="size-4" aria-hidden />
          {name}
        </Link>
      </Button>

      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead', { name })}</p>

      <section className="surface-card mt-8 p-6">
        <h2 className="flex items-center gap-2 font-medium">
          <KeyRound className="size-4 text-ink-tertiary" aria-hidden />
          {t('accessTitle')}
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex gap-3">
            <Eye className="mt-0.5 size-4 shrink-0 text-status-success-fg" aria-hidden />
            <span className="text-ink-secondary">{t('accessCan')}</span>
          </li>
          <li className="flex gap-3">
            <Eye className="mt-0.5 size-4 shrink-0 text-status-success-fg" aria-hidden />
            <span className="text-ink-secondary">{t('accessCanCode')}</span>
          </li>
          <li className="flex gap-3">
            <EyeOff className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
            <span className="text-ink-secondary">{t('accessCannot')}</span>
          </li>
          <li className="flex gap-3">
            <EyeOff className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
            <span className="text-ink-secondary">{t('accessCannotApplicants')}</span>
          </li>
        </ul>
      </section>

      <div className="mt-8 space-y-6">
        <Field label={t('emailLabel')}>
          {(props) => (
            <Input
              type="email"
              value={emailValue}
              onChange={(e) => setEmail(e.target.value)}
              {...props}
            />
          )}
        </Field>

        <fieldset>
          <legend className="text-sm font-medium">{t('regionsLabel')}</legend>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {settings.servedPostcodes.map((code) => (
              <Checkbox
                key={code}
                label={`${code} ${regionByPostcode(code)?.name ?? ''}`}
                checked={regionValue.includes(code)}
                onChange={(e) =>
                  setRegions(
                    e.target.checked
                      ? [...regionValue, code]
                      : regionValue.filter((c) => c !== code),
                  )
                }
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">{t('skillsLabel')}</legend>
          <p className="mt-1 text-sm text-ink-tertiary">{t('skillsHint')}</p>
          <div className="mt-3 space-y-2.5">
            {services.map((service) => (
              <Checkbox
                key={service.id}
                label={service.name[locale]}
                checked={skillValue.includes(service.slug)}
                onChange={(e) =>
                  setSkills(
                    e.target.checked
                      ? [...skillValue, service.slug]
                      : skillValue.filter((s) => s !== service.slug),
                  )
                }
              />
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-line-subtle pt-6">
        <Button onClick={confirm}>
          <Check className="size-4" aria-hidden />
          {t('confirm')}
        </Button>
        <Button asChild variant="quiet">
          <Link href={`/admin/bewerbungen/${id}`}>{t('cancel')}</Link>
        </Button>
      </div>
    </div>
  );
}
