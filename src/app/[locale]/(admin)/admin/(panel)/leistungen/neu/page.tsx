'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FileText, Sparkles } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing, TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Checkbox, Field, Input, NumberField, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SkeletonPage } from '@/components/ui/skeleton';
import {
  CALC_METHODS,
  DURATION_PROFILES,
  slugify,
  uniqueSlug,
} from '@/lib/service-catalogue';
import { useHydrated, useStore } from '@/mock/store';
import type { CalcMethod, DurationProfile } from '@/mock/schema';

/** An empty translation record — four keys, so no locale is silently absent. */
function emptyText(): Record<Locale, string> {
  return { de: '', en: '', fr: '', it: '' };
}

/**
 * Screen 73a — write a service.
 *
 * There was no such screen, and no way to reach one. The catalogue was
 * whatever `SEED_SERVICES` said it was: seven rows, editable in place, and a
 * business that started offering an eighth thing had to wait for a deploy.
 * That is the same gap screen 71a closed for invoices — a record only one
 * process could ever produce — and it is worse here, because the service
 * catalogue is what the request flow, the price list and the whole marketing
 * site are built out of.
 *
 * Two ways to finish, and the difference between them is the point. «Als
 * Entwurf speichern» writes a record that appears nowhere but the admin list,
 * so pricing can be argued about over several days without a half-finished
 * offer sitting on the website. «Anlegen und aufschalten» is the same write
 * plus publication — and it asks first, because it is the one button here that
 * changes what a customer sees.
 *
 * Nothing is written before either button. The form lives in component state,
 * which is what separates this from screen 74: there the service is real and
 * every keystroke autosaves into it.
 */
export default function NewServicePage() {
  const t = useTranslations('admin.serviceNew');
  const serviceT = useTranslations('admin.service');
  const actionsT = useTranslations('actions');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const createService = useStore((s) => s.createService);

  const [name, setName] = useState(emptyText);
  const [short, setShort] = useState(emptyText);
  const [calc, setCalc] = useState<CalcMethod>('hourly');
  const [durationProfile, setDurationProfile] = useState<DurationProfile>('standard');
  const [basePrice, setBasePrice] = useState(settings.hourlyRate);
  const [minDuration, setMinDuration] = useState(settings.minimumHours);
  const [handoverGuarantee, setHandoverGuarantee] = useState(false);
  /** Only after a save attempt — an error under a field nobody has reached yet
      is the form telling the owner off for not having typed it. */
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const germanName = name.de.trim();
  const missingName = germanName === '';
  /* Shown live so the URL is a consequence of the name rather than a surprise
     after saving — and it is the real one, collision suffix included, because
     `uniqueSlug` runs against the same list the store will use. */
  const slug = uniqueSlug(slugify(germanName) || 'leistung', services);

  function save(activate: boolean) {
    setTouched(true);
    if (missingName) return;

    const service = createService({
      name,
      short,
      calc,
      durationProfile,
      basePrice,
      minDuration,
      handoverGuarantee,
      status: activate ? 'active' : 'draft',
    });

    setConfirming(false);
    toast.success(
      t(activate ? 'createdActive' : 'createdDraft', { name: service.name[locale] || germanName }),
    );
    /* Straight into the editor rather than back to the list: the four
       translations and the copy are almost never finished in one pass, and the
       editor is where they are. */
    router.push(`/admin/leistungen/${service.slug}`);
  }

  const priceHint = serviceT(
    calc === 'perUnit'
      ? 'basePricePerUnit'
      : calc === 'flat'
        ? 'basePriceFlat'
        : 'basePriceHourly',
  );

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        back={{ href: '/admin/leistungen', label: t('back') }}
      />

      {/*
        Full width, not a 48rem column.

        The cap made sense when this was four stacked inputs; it does not now
        that every card inside is a two-column grid. At `max-w-3xl` on a desk
        screen the form sat in the left half of the panel with a screen's worth
        of nothing beside it, and the two-per-row pairs it exists to hold were
        squeezed into half the room they had.
      */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (missingName) return;
          setConfirming(true);
        }}
      >
        <Card>
          <CardHeader title={serviceT('nameTitle')} description={serviceT('nameHint')} />
          <CardBody>
            {/* Two to a row, and each one as wide as its half. All four
                languages sit side by side rather than behind a switcher for
                the same reason they do on screen 74: §20.6 makes German the
                fallback, so a gap never breaks anything and therefore never
                announces itself. */}
            <div className="grid gap-5 sm:grid-cols-2">
              {routing.locales.map((l) => (
                <Field
                  key={l}
                  label={LOCALE_LABELS[l]}
                  optional={l !== 'de'}
                  error={touched && l === 'de' && missingName ? t('nameRequired') : undefined}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={name[l]}
                      onChange={(e) => setName({ ...name, [l]: e.target.value })}
                    />
                  )}
                </Field>
              ))}
            </div>

            <p className="mt-4 text-sm text-ink-tertiary">
              {t('slugPreview', { slug })}
            </p>
          </CardBody>
        </Card>

        <Card className="mt-app-section">
          <CardHeader title={serviceT('shortTitle')} description={serviceT('shortHint')} />
          <CardBody>
            <div className="grid gap-5 sm:grid-cols-2">
              {routing.locales.map((l) => (
                <Field
                  key={l}
                  label={LOCALE_LABELS[l]}
                  optional={!TRANSLATED_LOCALES.includes(l)}
                >
                  {(props) => (
                    <Textarea
                      {...props}
                      className="min-h-24"
                      value={short[l]}
                      onChange={(e) => setShort({ ...short, [l]: e.target.value })}
                    />
                  )}
                </Field>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="mt-app-section">
          <CardHeader title={serviceT('pricingTitle')} description={serviceT('pricingHint')} />
          <CardBody>
            <div className="grid gap-5 sm:grid-cols-2">
              {/*
                The billing method comes first because it decides what every
                number under it means. It could not be set at all before: the
                seed wrote `calc` and no screen offered it, so a business
                selling anything at a flat price had no way to say so.
              */}
              <Field label={serviceT('calcLabel')}>
                {(props) => (
                  <Select
                    {...props}
                    value={calc}
                    onChange={(e) => {
                      const next = e.target.value as CalcMethod;
                      setCalc(next);
                      /* A counted service takes its hours from the count, not
                         from the area matrix — leaving a profile set would
                         have the estimate add both. */
                      if (next === 'perUnit') setDurationProfile('none');
                    }}
                  >
                    {CALC_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {serviceT(
                          `calc${method.charAt(0).toUpperCase()}${method.slice(1)}` as 'calcHourly',
                        )}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label={serviceT('basePrice')} hint={priceHint}>
                {(props) => (
                  <NumberField
                    {...props}
                    min={0}
                    value={basePrice}
                    onCommit={setBasePrice}
                  />
                )}
              </Field>

              <Field label={serviceT('minDuration')} hint={serviceT('minDurationHint')}>
                {(props) => (
                  <NumberField
                    {...props}
                    step={0.5}
                    min={settings.minimumHours}
                    value={minDuration}
                    onCommit={setMinDuration}
                  />
                )}
              </Field>

              <Field label={serviceT('profileTitle')} hint={serviceT('profileHint')}>
                {(props) => (
                  <Select
                    {...props}
                    value={durationProfile}
                    onChange={(e) => setDurationProfile(e.target.value as DurationProfile)}
                  >
                    {DURATION_PROFILES.map((profile) => (
                      <option key={profile} value={profile}>
                        {serviceT(
                          `profile${profile.charAt(0).toUpperCase()}${profile.slice(1)}` as 'profileStandard',
                        )}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            <Checkbox
              className="mt-6"
              label={
                <>
                  {serviceT('guaranteeLabel')}
                  <span className="mt-1 block text-xs text-ink-tertiary">
                    {serviceT('guaranteeHint')}
                  </span>
                </>
              }
              checked={handoverGuarantee}
              onChange={(e) => setHandoverGuarantee(e.target.checked)}
            />
          </CardBody>
        </Card>

        {touched && missingName && (
          <Alert tone="danger" className="mt-app">
            {t('nameRequired')}
          </Alert>
        )}

        <div className="mt-app-section flex flex-wrap items-center gap-3">
          {/*
            The draft button is the plain one and comes first. Publishing is
            the consequential act, so it is the one that opens a dialog — and
            putting the safe finish first means the fast path out of this
            screen is the one that reaches nobody.
          */}
          <Button type="button" variant="secondary" size="lg" onClick={() => save(false)}>
            <FileText className="size-4" aria-hidden />
            {t('saveDraft')}
          </Button>
          <Button type="submit" size="lg">
            <Sparkles className="size-4" aria-hidden />
            {t('saveActive')}
          </Button>
          <p className="max-w-[var(--measure)] text-sm text-ink-tertiary">{t('createNote')}</p>
        </div>
      </form>

      <Dialog open={confirming} onOpenChange={(open) => !open && setConfirming(false)}>
        <DialogContent closeLabel={t('dismiss')}>
          <DialogHeader>
            <DialogTitle>{t('activateTitle', { name: germanName })}</DialogTitle>
            <DialogDescription>{t('activateBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {actionsT('cancel')}
            </Button>
            <Button onClick={() => save(true)}>{t('activateConfirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
