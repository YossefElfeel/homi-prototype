'use client';

import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, TRANSLATED_LOCALES } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { Field, Input, NumberField, Select, Checkbox } from '@/components/ui/field';
import { useHydrated, useStore } from '@/mock/store';
import type { DurationProfile, Service } from '@/mock/schema';

const PROFILES: DurationProfile[] = ['standard', 'deep', 'moveout', 'office', 'none'];

/**
 * Screen 74 — editing a service, in all four languages.
 *
 * The four language fields sit side by side rather than behind a language
 * switcher. §20.6 makes German the fallback for anything missing, which means
 * a gap never breaks the site and therefore never announces itself — showing
 * all four at once is the only way it stays visible.
 */
export default function EditServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations('admin.service');
  const appT = useTranslations('app');
  const hydrated = useHydrated();

  const services = useStore((s) => s.services);
  const setServices = useStore((s) => s.setServices);
  /* A counter, not a boolean: two edits in quick succession have to read as
     two saves, and a boolean that is already true cannot say so. */
  const [saveTick, setSaveTick] = useState(0);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const service = services.find((s) => s.slug === slug);
  if (!service) return <p className="text-ink-tertiary">—</p>;

  function patch(next: Partial<Service>) {
    setServices(services.map((s) => (s.slug === slug ? { ...s, ...next } : s)));
    setSaveTick((n) => n + 1);
  }

  const missing = routing.locales.filter((l) => !TRANSLATED_LOCALES.includes(l));

  return (
    <div className="max-w-3xl">
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/leistungen">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="display-type text-3xl">{service.name.de}</h1>
        {/* One shared save status instead of three hand-rolled chips. */}
          <SaveIndicator
            signal={saveTick}
            savingLabel={appT("saving")}
            savedLabel={appT("saved")}
          />
      </div>

      {missing.length > 0 && (
        <div className="mt-6 flex gap-3 border-l-2 border-rule bg-sunken p-5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
          <div>
            <h2 className="font-medium">{t('missingTitle')}</h2>
            <p className="mt-1.5 text-sm text-ink-secondary">{t('missingBody')}</p>
          </div>
        </div>
      )}

      <section className="mt-10">
        <h2 className="display-type text-xl">{t('nameTitle')}</h2>
        <p className="mt-1 text-sm text-ink-secondary">{t('nameHint')}</p>
        <div className="mt-4 space-y-4">
          {routing.locales.map((l) => (
            <Field
              key={l}
              label={LOCALE_LABELS[l]}
              optional={!TRANSLATED_LOCALES.includes(l)}
            >
              {(props) => (
                <Input
                  value={service.name[l]}
                  onChange={(e) => patch({ name: { ...service.name, [l]: e.target.value } })}
                  {...props}
                />
              )}
            </Field>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display-type text-xl">{t('pricingTitle')}</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label={t('basePrice')}>
            {(props) => (
              <NumberField
                value={service.basePrice}
                onCommit={(v) => patch({ basePrice: v })}
                {...props}
              />
            )}
          </Field>
          <Field label={t('minDuration')}>
            {(props) => (
              <NumberField
                step={0.5}
                value={service.minDuration}
                onCommit={(v) => patch({ minDuration: v })}
                {...props}
              />
            )}
          </Field>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display-type text-xl">{t('profileTitle')}</h2>
        <p className="mt-1 max-w-[var(--measure)] text-sm text-ink-secondary">
          {t('profileHint')}
        </p>
        <Field label={t('profileTitle')} className="mt-4 max-w-xs">
          {(props) => (
            <Select
              value={service.durationProfile}
              onChange={(e) => patch({ durationProfile: e.target.value as DurationProfile })}
              {...props}
            >
              {PROFILES.map((profile) => (
                <option key={profile} value={profile}>
                  {t(
                    `profile${profile.charAt(0).toUpperCase()}${profile.slice(1)}` as 'profileStandard',
                  )}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </section>

      <section className="mt-10 space-y-4 border-t border-line-subtle pt-8">
        <Checkbox
          label={
            <>
              {t('guaranteeLabel')}
              <span className="mt-1 block text-xs text-ink-tertiary">
                {t('guaranteeHint')}
              </span>
            </>
          }
          checked={service.handoverGuarantee}
          onChange={(e) => patch({ handoverGuarantee: e.target.checked })}
        />
        <Checkbox
          label={t('activeLabel')}
          checked={service.active}
          onChange={(e) => patch({ active: e.target.checked })}
        />
      </section>
    </div>
  );
}
