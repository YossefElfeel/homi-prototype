'use client';

import { use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mail, Phone } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { cn } from '@/lib/cn';
import { labourAmount, labourExpenses, labourHours, unpaidLabour } from '@/lib/labour-facts';
import { regionByPostcode } from '@/mock/engines/coverage';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { ServiceSlug } from '@/mock/schema';

/**
 * Screen H7 — one team member.
 *
 * The permission list is the same four sentences the conversion screen showed
 * before the account existed, phrased identically. Wording that drifts between
 * "before you decide" and "what you decided" is how an owner ends up unsure
 * which one is true.
 */
export default function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.member');
  const convert = useTranslations('admin.convert');
  const team = useTranslations('admin.team');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();
  const now = useNow();

  const members = useStore((s) => s.data.team);
  const applications = useStore((s) => s.data.applications);
  const bookings = useStore((s) => s.data.bookings);
  const expenses = useStore((s) => s.data.expenses);
  const properties = useStore((s) => s.data.properties);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const updateTeamMember = useStore((s) => s.updateTeamMember);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const member = members.find((m) => m.id === id);
  if (!member) return <p className="text-ink-tertiary">—</p>;

  const application = applications.find((a) => a.id === member.fromApplicationId);
  const upcoming = bookings
    .filter((b) => b.assigneeId === member.id && new Date(b.start) >= now)
    .sort((a, b) => (a.start < b.start ? -1 : 1))
    .slice(0, 5);

  /*
   * What this person actually worked, as opposed to what they are booked for.
   *
   * The section above is the diary and it looks forward; this looks back, and
   * until this wave there was nothing to look back at — hours were a monthly
   * lump under «Löhne» with a name typed into the supplier box, so a person's
   * own page could not say how much they had done or whether they had been
   * paid for it. Every figure here is over all time on purpose: the person is
   * the subject, not the quarter, and the board one link away is where a period
   * is chosen.
   */
  const labour = labourExpenses(expenses).filter((e) => e.labour.workerId === member.id);
  const labourJobs = new Set(labour.map((e) => e.bookingId)).size;
  const labourOpen = unpaidLabour(labour, now);

  return (
    <div>
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/team">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-type text-3xl">
          {member.firstName} {member.lastName}
        </h1>
        <span className="text-ink-secondary">
          {member.role === 'owner' ? team('roleOwner') : team('roleContractor')}
        </span>
      </div>

      <p className="mt-2 text-sm text-ink-tertiary">
        {t('since')}{' '}
        <span data-numeric>
          {format.dateTime(new Date(member.startedAt), {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </span>
        {application && (
          <>
            {' · '}
            <Link
              href={`/admin/bewerbungen/${application.id}`}
              className="underline-offset-4 hover:underline"
            >
              {t('fromApplication', { reference: application.reference })}
            </Link>
          </>
        )}
      </p>

      <section className="mt-8">
        <h2 className="label-type text-ink-tertiary">{t('contactTitle')}</h2>
        <div className="mt-2 flex flex-wrap gap-x-8">
          <a
            href={`mailto:${member.email}`}
            className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"
          >
            <Mail className="size-4 text-ink-tertiary" aria-hidden />
            {member.email}
          </a>
          <a
            href={`tel:${member.phone.replace(/\s/g, '')}`}
            className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline"
          >
            <Phone className="size-4 text-ink-tertiary" aria-hidden />
            <span data-numeric>{member.phone}</span>
          </a>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display-type text-xl">{t('accessTitle')}</h2>
        {member.role === 'owner' ? (
          <p className="mt-3 border-l-2 border-rule bg-sunken rounded-[var(--radius-lg)] p-5 text-sm text-ink-secondary">
            {t('ownerNote')}
          </p>
        ) : (
          <>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3">
                <Eye className="mt-0.5 size-4 shrink-0 text-status-success-fg" aria-hidden />
                <span className="text-ink-secondary">{convert('accessCan')}</span>
              </li>
              <li className="flex gap-3">
                <Eye className="mt-0.5 size-4 shrink-0 text-status-success-fg" aria-hidden />
                <span className="text-ink-secondary">{convert('accessCanCode')}</span>
              </li>
              <li className="flex gap-3">
                <EyeOff className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
                <span className="text-ink-secondary">{convert('accessCannot')}</span>
              </li>
              <li className="flex gap-3">
                <EyeOff className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
                <span className="text-ink-secondary">
                  {convert('accessCannotApplicants')}
                </span>
              </li>
            </ul>
            <Checkbox
              className="mt-6"
              label={t('activeLabel')}
              checked={member.active}
              onChange={(e) => updateTeamMember(member.id, { active: e.target.checked })}
            />
          </>
        )}
      </section>

      {member.role !== 'owner' && (
        <>
          <section className="mt-10">
            <h2 className="display-type text-xl">{t('skillsTitle')}</h2>
            <p className="mt-1 text-sm text-ink-tertiary">{t('skillsHint')}</p>
            <div className="mt-4 space-y-2.5">
              {services.map((service) => (
                <Checkbox
                  key={service.id}
                  label={service.name[locale]}
                  checked={member.skills.includes(service.slug)}
                  onChange={(e) =>
                    updateTeamMember(member.id, {
                      skills: e.target.checked
                        ? [...member.skills, service.slug as ServiceSlug]
                        : member.skills.filter((s) => s !== service.slug),
                    })
                  }
                />
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="display-type text-xl">{t('regionsTitle')}</h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {settings.servedPostcodes.map((code) => (
                <Checkbox
                  key={code}
                  label={`${code} ${regionByPostcode(code)?.name ?? ''}`}
                  checked={member.regions.includes(code)}
                  onChange={(e) =>
                    updateTeamMember(member.id, {
                      regions: e.target.checked
                        ? [...member.regions, code]
                        : member.regions.filter((c) => c !== code),
                    })
                  }
                />
              ))}
            </div>
          </section>
        </>
      )}

      <section className="mt-10 border-t border-line-subtle pt-8">
        <h2 className="display-type text-xl">{t('labourTitle')}</h2>
        {labour.length === 0 ? (
          <p className="mt-3 text-sm text-ink-tertiary">{t('labourEmpty')}</p>
        ) : (
          <>
            <dl className="mt-4 grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="label-type text-ink-tertiary">{t('labourHours')}</dt>
                <dd data-numeric className="mt-1.5 text-lg">
                  {t('labourHoursValue', { hours: labourHours(labour) })}
                </dd>
                <p className="mt-1 text-sm text-ink-tertiary">
                  {labourJobs === 1 ? t('labourJobsOne') : t('labourJobs', { n: labourJobs })}
                </p>
              </div>
              <div>
                <dt className="label-type text-ink-tertiary">{t('labourAmount')}</dt>
                <dd className="mt-1.5 text-lg">
                  <Money amount={labourAmount(labour)} />
                </dd>
              </div>
              <div>
                <dt className="label-type text-ink-tertiary">{t('labourOutstanding')}</dt>
                {/* Warning-coloured only when there is something to chase — a
                    zero in orange is a problem the reader goes looking for and
                    does not find. */}
                <dd
                  className={cn('mt-1.5 text-lg', labourOpen > 0 && 'text-status-warning-fg')}
                >
                  <Money amount={labourOpen} />
                </dd>
              </div>
            </dl>
            <Button asChild variant="secondary" className="mt-5">
              <Link href="/admin/ausgaben/arbeitszeit">{t('labourLink')}</Link>
            </Button>
          </>
        )}
      </section>

      <section className="mt-10 border-t border-line-subtle pt-8">
        <h2 className="display-type text-xl">{t('jobsTitle')}</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-ink-tertiary">{t('jobsEmpty')}</p>
        ) : (
          <ul className="mt-4 border-t border-line-subtle">
            {upcoming.map((booking) => {
              const property = properties.find((p) => p.id === booking.propertyId);
              return (
                <li key={booking.id} className="border-b border-line-subtle">
                  <Link
                    href={`/admin/kalender?tag=${booking.start.slice(0, 10)}`}
                    className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
                  >
                    <span data-numeric className="text-sm">
                      {format.dateTime(new Date(booking.start), {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-sm text-ink-secondary">
                      {property ? `${property.street}, ${property.city}` : '—'}
                    </span>
                    <ArrowRight className="size-4 text-ink-tertiary" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
