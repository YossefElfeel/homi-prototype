'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing, TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox, Field, Input, NumberField, Textarea } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { SwitchField } from '@/components/ui/switch';
import { ActionIcon } from '@/lib/action-icons';
import { addOnReach, addOnUsage } from '@/lib/addon-catalogue';
import { isOffered } from '@/lib/service-catalogue';
import { useHydrated, useStore } from '@/mock/store';
import type { AddOn } from '@/mock/schema';

interface Draft {
  name: Record<Locale, string>;
  short: Record<Locale, string>;
  price: number;
  extraDuration: number;
  services: string[];
}

function draftOf(addOn: AddOn): Draft {
  return {
    name: { ...addOn.name },
    short: { ...addOn.short },
    price: addOn.price,
    extraDuration: addOn.extraDuration,
    services: [...addOn.services],
  };
}

/**
 * Screen 75b — one add-on, read and edited.
 *
 * A created record you cannot open again is a create flow that lies: the first
 * typo in a price would be permanent, and the four translations are never
 * finished in one pass. So screen 75a lands here.
 *
 * One screen rather than the read/edit pair the service catalogue has, and the
 * reason is the saving model. Screen 74 autosaves every keystroke, which is
 * exactly why 74a had to exist beside it — looking up what a service costs
 * cannot mean opening something that writes as you type. This one saves on a
 * button, so reading it is already safe and a second read-only screen would be
 * the same page with its inputs disabled.
 *
 * The one control that does not wait for the button is availability, and it
 * says so. That is the same split as screen 74 — text is an edit in progress,
 * publication is a decision — except that here the decision is instant in both
 * directions, because the switch is its own undo.
 */
export default function AddOnEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations('admin.addon');
  const hydrated = useHydrated();
  const addOn = useStore((s) => s.addOns.find((a) => a.slug === slug));

  /*
   * The gate is a component boundary, not an early return, and that is
   * load-bearing.
   *
   * The store is persisted, so the first render is the seed and the real
   * record arrives a tick later. A `useState(() => draftOf(addOn))` up here
   * would seed the form from the seed copy and then never look again: an
   * add-on whose price had been edited in a previous session would open
   * showing the old figure, the screen would declare unsaved changes it had
   * invented, and saving would quietly write the seed value back over the
   * edit. Mounting the form only once `hydrated` is true — and keying it on
   * the record — means the initialiser runs against the record that is
   * actually stored.
   */
  if (!hydrated) return <SkeletonPage label={t('back')} />;

  if (!addOn) {
    return (
      <PageHeader
        title={t('notFound')}
        back={{ href: '/admin/zusatzleistungen', label: t('back') }}
      />
    );
  }

  return <AddOnEditor key={addOn.id} addOn={addOn} />;
}

function AddOnEditor({ addOn }: { addOn: AddOn }) {
  const t = useTranslations('admin.addon');
  const listT = useTranslations('admin.addons');
  const actionsT = useTranslations('actions');
  const locale = useLocale() as Locale;
  const router = useRouter();

  const services = useStore((s) => s.services);
  const data = useStore((s) => s.data);
  const updateAddOn = useStore((s) => s.updateAddOn);
  const setAddOnActive = useStore((s) => s.setAddOnActive);
  const deleteAddOn = useStore((s) => s.deleteAddOn);

  const [form, setForm] = useState<Draft>(() => draftOf(addOn));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dirty =
    routing.locales.some(
      (l) => form.name[l] !== addOn.name[l] || form.short[l] !== addOn.short[l],
    ) ||
    form.price !== addOn.price ||
    form.extraDuration !== addOn.extraDuration ||
    form.services.length !== addOn.services.length ||
    form.services.some((s) => !addOn.services.includes(s));

  const usage = addOnUsage(addOn, data);
  const reach = addOnReach(addOn, services);
  const name = addOn.name[locale];

  function save() {
    updateAddOn(addOn.id, {
      name: form.name,
      short: form.short,
      price: form.price,
      extraDuration: form.extraDuration,
      services: form.services,
    });
    toast.success(t('saved', { name: form.name[locale] || form.name.de }));
  }

  function toggleService(slug: string) {
    setForm({
      ...form,
      services: form.services.includes(slug)
        ? form.services.filter((x) => x !== slug)
        : [...form.services, slug],
    });
  }

  function toggleAvailability(next: boolean) {
    setAddOnActive(addOn.id, next);
    toast.success(listT(next ? 'switchedOn' : 'switchedOff', { name }));
  }

  function confirmDelete() {
    if (!deleteAddOn(addOn.id)) {
      toast.error(listT('deleteBlocked'));
      setConfirmingDelete(false);
      return;
    }
    toast.success(listT('deleteDone', { name }));
    /* The record this page is about no longer exists, so staying would leave
       the reader on a screen saying «gibt es nicht mehr» where an add-on was. */
    router.push('/admin/zusatzleistungen');
  }

  return (
    <div>
      <PageHeader
        title={name}
        lead={addOn.short[locale]}
        back={{ href: '/admin/zusatzleistungen', label: t('back') }}
        meta={<StatusBadge entity="addOn" state={addOn.active ? 'active' : 'inactive'} />}
      />

      <div className="grid gap-app-section lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader title={t('availabilityTitle')} description={t('availabilityHint')} />
          <CardBody className="space-y-4">
            <SwitchField
              label={t('availabilityLabel')}
              checked={addOn.active}
              onCheckedChange={toggleAvailability}
            />
            {/*
              Switched on and still invisible.

              Availability is necessary and not sufficient: an add-on reaches a
              customer only through a service that is itself on sale. Saying so
              here, beside the switch that was just flipped, is the difference
              between «ich habe es eingeschaltet und es passiert nichts» and a
              screen that explains itself.
            */}
            {addOn.active && !reach.reachable && (
              <Alert tone="warning" icon={AlertTriangle}>
                {addOn.services.length === 0
                  ? listT('unreachableNone')
                  : listT('unreachableInactive')}
              </Alert>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={t('nameTitle')} description={t('nameHint')} />
          <CardBody>
            {/* All four languages side by side rather than behind a switcher:
                §20.6 makes German the fallback, so a gap never breaks anything
                and therefore never announces itself. */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {routing.locales.map((l) => (
                <Field key={l} label={LOCALE_LABELS[l]} optional={l !== 'de'}>
                  {(props) => (
                    <Input
                      {...props}
                      value={form.name[l]}
                      onChange={(e) =>
                        setForm({ ...form, name: { ...form.name, [l]: e.target.value } })
                      }
                    />
                  )}
                </Field>
              ))}
            </div>
            <p className="mt-4 text-sm text-ink-tertiary">{t('localeHint')}</p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={t('shortTitle')} description={t('shortHint')} />
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
                      value={form.short[l]}
                      onChange={(e) =>
                        setForm({ ...form, short: { ...form.short, [l]: e.target.value } })
                      }
                    />
                  )}
                </Field>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('pricingTitle')} description={t('pricingHint')} />
          <CardBody className="space-y-5">
            <Field label={t('priceLabel')} hint={t('priceHint')}>
              {(props) => (
                <NumberField
                  {...props}
                  min={0}
                  value={form.price}
                  onCommit={(price) => setForm({ ...form, price })}
                />
              )}
            </Field>
            <Field label={t('durationLabel')} hint={t('durationHint')}>
              {(props) => (
                <NumberField
                  {...props}
                  step={0.25}
                  min={0}
                  value={form.extraDuration}
                  onCommit={(extraDuration) => setForm({ ...form, extraDuration })}
                />
              )}
            </Field>
            {/* The two numbers read back as the customer will meet them, with
                the unit spelled out — the whole distinction this record carries
                is that the francs are per job and the hours are not billed. */}
            <p className="flex flex-wrap items-baseline gap-x-2 border-t border-line-subtle pt-4 text-sm text-ink-tertiary">
              <Money amount={form.price} per="visit" />
              {form.extraDuration > 0 && <span data-numeric>· +{form.extraDuration} h</span>}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('servicesTitle')} description={t('servicesHint')} />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((s) => (
                <Checkbox
                  key={s.id}
                  label={
                    <>
                      {s.name[locale]}
                      {/* A service that is a draft or withdrawn can still be
                          ticked — it may come back on sale — but ticking only
                          those produces an add-on nobody can reach, so the state
                          is said here rather than discovered later. */}
                      {!isOffered(s) && (
                        <span className="mt-0.5 block text-xs text-ink-tertiary">
                          {t('servicesInactive')}
                        </span>
                      )}
                    </>
                  }
                  checked={form.services.includes(s.slug)}
                  onChange={() => toggleService(s.slug)}
                />
              ))}
            </div>
            {form.services.length === 0 && (
              <Alert tone="warning" className="mt-6">
                {t('servicesRequired')}
              </Alert>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('usageTitle')} description={t('usageHint')} />
          <CardBody className="space-y-5">
            <Row label={t('usageRequests')}>
              <span data-numeric className="text-sm text-ink-secondary">
                {usage.requests}
              </span>
            </Row>
            <Row label={t('usageOffers')}>
              <span data-numeric className="text-sm text-ink-secondary">
                {usage.offers}
              </span>
            </Row>
            <Row label={t('slugLabel')}>
              <code className="text-sm text-ink-secondary">{addOn.slug}</code>
            </Row>
            <p className="border-t border-line-subtle pt-4 text-sm text-ink-tertiary">
              {t('slugHint')}
            </p>
            {/* Why the delete button below may refuse, said before it is
                pressed rather than after. */}
            <p className="text-sm text-ink-tertiary">
              {usage.total > 0 ? t('usageBody', { n: usage.total }) : t('usageNone')}
            </p>
          </CardBody>
        </Card>

        <Card tone="danger">
          {/* A heading, not the confirm's question. «Zusatzleistung löschen?»
              reads as a prompt, and a prompt sitting permanently on a page is
              one the reader answers by ignoring it. */}
          <CardHeader title={t('dangerTitle')} description={listT('deleteBody')} />
          <CardBody>
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              <ActionIcon.delete className="size-4" aria-hidden />
              {listT('rowDelete')}
            </Button>
          </CardBody>
        </Card>
      </div>

      {/*
        The save row, and it appears only when there is something to save.

        A permanently visible «Speichern» on a screen whose switch already
        writes on its own is what would make the split confusing. With the
        button absent until a field changes, its arrival *is* the statement
        that these fields are the ones that wait.
      */}
      {dirty && (
        <div className="mt-app-section flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={save}>
            {t('save')}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => setForm(draftOf(addOn))}>
            {t('discard')}
          </Button>
          <p className="max-w-[var(--measure)] text-sm text-ink-tertiary">{t('unsaved')}</p>
        </div>
      )}

      <Dialog
        open={confirmingDelete}
        onOpenChange={(open) => !open && setConfirmingDelete(false)}
      >
        <DialogContent closeLabel={actionsT('close')}>
          <DialogHeader>
            <DialogTitle>
              {usage.total > 0
                ? listT('deleteBlockedTitle', { name })
                : listT('deleteTitle', { name })}
            </DialogTitle>
            <DialogDescription>
              {usage.total > 0
                ? listT('deleteBlockedBody', { n: usage.total, slug: addOn.slug, name })
                : listT('deleteBody')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
              {usage.total > 0 ? actionsT('close') : actionsT('cancel')}
            </Button>
            {usage.total === 0 && (
              <Button variant="danger" onClick={confirmDelete}>
                {listT('deleteConfirm')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="text-sm text-ink-tertiary">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
