'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { EyeOff, Sparkles } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing, TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Checkbox, Field, Input, NumberField, Textarea } from '@/components/ui/field';
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
import { slugify, uniqueAddOnSlug } from '@/lib/addon-catalogue';
import { isOffered } from '@/lib/service-catalogue';
import { useHydrated, useStore } from '@/mock/store';

/** An empty translation record — four keys, so no locale is silently absent. */
function emptyText(): Record<Locale, string> {
  return { de: '', en: '', fr: '', it: '' };
}

/**
 * Screen 75a — write an add-on.
 *
 * There was no such screen and no way to reach one. The list of extras a
 * customer can buy was `SEED_ADDONS` and nothing else, so «wir bieten jetzt
 * auch Teppichshampoonieren für 60 Franken an» was a deploy — the same gap
 * screen 73a closed for the service catalogue, and the cheaper half of it to
 * fix, since an add-on has no marketing page and no URL of its own to keep.
 *
 * The form is grouped the way the thing is explained: what it is called, what
 * the customer is told they get, what it costs and what it costs the calendar,
 * and which services it hangs off. That last card is the one that did not
 * exist as an idea anywhere in the admin before — `services` was a field only
 * the seed could write, so which extras belonged to which service was fixed at
 * build time.
 *
 * Two ways to finish, and the difference is the point. Saving it hidden writes
 * a record that appears nowhere but this panel, so a price can be argued about
 * for a day without an unfinished offer sitting in a live request flow.
 * «Anlegen und anbieten» is the same write plus publication, and it asks
 * first, because it is the one button here a customer feels.
 *
 * Nothing is written before either button.
 */
export default function NewAddOnPage() {
  const t = useTranslations('admin.addonNew');
  const addonT = useTranslations('admin.addon');
  const actionsT = useTranslations('actions');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const addOns = useStore((s) => s.addOns);
  const services = useStore((s) => s.services);
  const createAddOn = useStore((s) => s.createAddOn);

  const [name, setName] = useState(emptyText);
  const [short, setShort] = useState(emptyText);
  const [price, setPrice] = useState(45);
  const [extraDuration, setExtraDuration] = useState(0.5);
  const [chosen, setChosen] = useState<string[]>([]);
  /** Only after a save attempt — an error under a field nobody has reached yet
      is the form telling the owner off for not having typed it. */
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const germanName = name.de.trim();
  const missingName = germanName === '';
  /* Not a blocker, unlike the name. An add-on attached to nothing is a
     perfectly reasonable thing to save while the owner decides which services
     should carry it — it simply cannot be offered, which is what the warning
     says and what the confirm below refuses to skip past. */
  const missingServices = chosen.length === 0;
  /* Shown live so the slug is a consequence of the name rather than a surprise
     after saving — and it is the real one, collision suffix included, because
     `uniqueAddOnSlug` runs against the same list the store will use. */
  const slug = uniqueAddOnSlug(slugify(germanName) || 'zusatz', addOns);

  function save(active: boolean) {
    setTouched(true);
    if (missingName) return;

    const addOn = createAddOn({
      name,
      short,
      price,
      extraDuration,
      services: chosen,
      active,
    });

    setConfirming(false);
    toast.success(
      t(active ? 'createdActive' : 'createdHidden', {
        name: addOn.name[locale] || germanName,
      }),
    );
    /* Straight into the editor rather than back to the list: the four
       translations are almost never finished in one pass, and the editor is
       where they are — along with the usage panel, which is the only place the
       consequences of the record are visible. */
    router.push(`/admin/zusatzleistungen/${addOn.slug}`);
  }

  function toggleService(slugValue: string) {
    setChosen((prev) =>
      prev.includes(slugValue) ? prev.filter((x) => x !== slugValue) : [...prev, slugValue],
    );
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        back={{ href: '/admin/zusatzleistungen', label: t('back') }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (missingName) return;
          setConfirming(true);
        }}
      >
        <Card>
          <CardHeader title={addonT('nameTitle')} description={addonT('nameHint')} />
          <CardBody>
            {/* All four languages side by side rather than behind a switcher,
                for the same reason as screen 73a: §20.6 makes German the
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

            <p className="mt-4 text-sm text-ink-tertiary">{t('slugPreview', { slug })}</p>
          </CardBody>
        </Card>

        <Card className="mt-app-section">
          <CardHeader title={addonT('shortTitle')} description={addonT('shortHint')} />
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
          <CardHeader title={addonT('pricingTitle')} description={addonT('pricingHint')} />
          <CardBody>
            {/*
              The two numbers sit side by side because their difference is the
              rule the pricing engine enforces, and reading them apart is what
              makes an add-on cost twice — once as a flat price and again as
              billed hours. Each hint says which of the two it feeds.
            */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={addonT('priceLabel')} hint={addonT('priceHint')}>
                {(props) => (
                  <NumberField {...props} min={0} value={price} onCommit={setPrice} />
                )}
              </Field>
              <Field label={addonT('durationLabel')} hint={addonT('durationHint')}>
                {(props) => (
                  <NumberField
                    {...props}
                    step={0.25}
                    min={0}
                    value={extraDuration}
                    onCommit={setExtraDuration}
                  />
                )}
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card className="mt-app-section">
          <CardHeader title={addonT('servicesTitle')} description={addonT('servicesHint')} />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((s) => (
                <Checkbox
                  key={s.id}
                  label={
                    <>
                      {s.name[locale]}
                      {/* A service that is a draft or withdrawn can still be
                          ticked — it will come back on sale — but ticking only
                          those produces an add-on nobody can reach, so the
                          state is said here rather than discovered later. */}
                      {!isOffered(s) && (
                        <span className="mt-0.5 block text-xs text-ink-tertiary">
                          {addonT('servicesInactive')}
                        </span>
                      )}
                    </>
                  }
                  checked={chosen.includes(s.slug)}
                  onChange={() => toggleService(s.slug)}
                />
              ))}
            </div>

            {missingServices && (
              <Alert tone="warning" className="mt-6">
                {addonT('servicesRequired')}
              </Alert>
            )}
          </CardBody>
        </Card>

        {touched && missingName && (
          <Alert tone="danger" className="mt-app">
            {t('nameRequired')}
          </Alert>
        )}

        <div className="mt-app-section flex flex-wrap items-center gap-3">
          {/*
            The hidden save is the plain button and comes first. Offering it is
            the consequential act, so it is the one that opens a dialog — and
            putting the safe finish first means the fast path out of this screen
            is the one that reaches nobody.
          */}
          <Button type="button" variant="secondary" size="lg" onClick={() => save(false)}>
            <EyeOff className="size-4" aria-hidden />
            {t('saveHidden')}
          </Button>
          <Button type="submit" size="lg" disabled={missingServices}>
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
