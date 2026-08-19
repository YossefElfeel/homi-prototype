'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Money } from '@/components/ui/money';
import { SwitchField } from '@/components/ui/switch';
import { planRhythm } from '@/lib/offer-facts';
import { useStore } from '@/mock/store';
import type { Plan } from '@/mock/schema';

/** Everything a plan is, minus the three fields the store assigns. */
export type PlanDraft = Omit<Plan, 'id' | 'reference' | 'order'>;

/**
 * The German string is the record; the other three locales fall back to it.
 *
 * §20.6 makes German the fallback, and a form with four tabs per text field
 * would be four times the work for a translation step that has not happened.
 * Typing into one language and copying it into the rest is what the seed does
 * too — the gap stays visible on the content screens rather than being papered
 * over with an empty string nobody notices until a French customer sees it.
 */
function localised(text: string): Record<Locale, string> {
  return { de: text, en: text, fr: text, it: text };
}

export function emptyPlanDraft(): PlanDraft {
  return {
    name: localised(''),
    description: localised(''),
    features: [],
    price: 0,
    includedVisits: 12,
    validityMonths: 12,
    serviceSlug: 'unterhaltsreinigung',
    extraDiscountPercent: 10,
    active: true,
    visibleOnSite: true,
  };
}

export function planToDraft(plan: Plan): PlanDraft {
  const { id: _id, reference: _reference, order: _order, ...draft } = plan;
  return draft;
}

/**
 * Add and edit are the same form.
 *
 * Written once because they are the same eleven fields and the same rules, and
 * two copies of a form is how one of them ends up missing the validation the
 * other has.
 */
export function PlanForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: PlanDraft;
  submitLabel: string;
  onSubmit: (draft: PlanDraft) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('admin.planForm');
  const rhythmT = useTranslations('admin.rhythm');
  const locale = useLocale() as Locale;
  const services = useStore((s) => s.services);

  const [draft, setDraft] = useState<PlanDraft>(initial);
  /* One textarea, one feature per line. A repeating add/remove row would be
     more chrome than the content deserves, and this is how the list is read
     anyway — top to bottom, in order. */
  const [featureText, setFeatureText] = useState(
    initial.features.map((f) => f[locale] || f.de).join('\n'),
  );

  const patch = (p: Partial<PlanDraft>) => setDraft((d) => ({ ...d, ...p }));

  /*
   * What one visit works out at. The office prices a plan against the hourly
   * rate it already charges, and the only way to know whether CHF 3'440 for
   * twenty-six visits is the right number is to see that it is CHF 132 a
   * visit — so the form says so while the number is being typed rather than
   * leaving it to be discovered on the phone.
   */
  const perVisit = draft.includedVisits > 0 ? draft.price / draft.includedVisits : 0;

  return (
    <form
      className="surface-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const features = featureText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map(localised);
        onSubmit({
          ...draft,
          name: localised(draft.name.de.trim()),
          description: localised(draft.description.de.trim()),
          features,
          // A retired plan cannot be on the site — the same rule the store
          // enforces, applied here so the form never submits a state it would
          // then silently correct.
          visibleOnSite: draft.visibleOnSite && draft.active,
        });
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t('name')} className="sm:col-span-2">
          {(props) => (
            <Input
              {...props}
              required
              value={draft.name.de}
              onChange={(e) => patch({ name: localised(e.target.value) })}
            />
          )}
        </Field>

        <Field label={t('description')} hint={t('descriptionHint')} className="sm:col-span-2">
          {(props) => (
            <Textarea
              {...props}
              className="min-h-20"
              value={draft.description.de}
              onChange={(e) => patch({ description: localised(e.target.value) })}
            />
          )}
        </Field>

        <Field label={t('features')} hint={t('featuresHint')} className="sm:col-span-2">
          {(props) => (
            <Textarea
              {...props}
              value={featureText}
              onChange={(e) => setFeatureText(e.target.value)}
            />
          )}
        </Field>

        <Field label={t('service')} hint={t('serviceHint')}>
          {(props) => (
            <Select
              {...props}
              value={draft.serviceSlug}
              onChange={(e) =>
                patch({ serviceSlug: e.target.value as PlanDraft['serviceSlug'] })
              }
            >
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name[locale]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t('price')} hint={t('priceHint')}>
          {(props) => (
            <Input
              {...props}
              type="number"
              min={0}
              step={10}
              required
              value={draft.price}
              onChange={(e) => patch({ price: Number(e.target.value) })}
            />
          )}
        </Field>

        <Field label={t('includedVisits')}>
          {(props) => (
            <Input
              {...props}
              type="number"
              min={1}
              required
              value={draft.includedVisits}
              onChange={(e) => patch({ includedVisits: Number(e.target.value) })}
            />
          )}
        </Field>

        <Field label={t('validityMonths')} hint={t('validityHint')}>
          {(props) => (
            <Input
              {...props}
              type="number"
              min={1}
              max={36}
              required
              value={draft.validityMonths}
              onChange={(e) => patch({ validityMonths: Number(e.target.value) })}
            />
          )}
        </Field>

        <Field label={t('extraDiscount')} hint={t('extraDiscountHint')}>
          {(props) => (
            <Input
              {...props}
              type="number"
              min={0}
              max={100}
              value={draft.extraDiscountPercent}
              onChange={(e) => patch({ extraDiscountPercent: Number(e.target.value) })}
            />
          )}
        </Field>
      </div>

      {/* Not decoration: these two numbers are the ones the price has to be
          defensible against, and they are both derived from fields above. */}
      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 border-y border-line-subtle py-4 text-sm">
        <div>
          <dt className="label-type text-ink-tertiary">{t('derivedPerVisit')}</dt>
          <dd className="mt-1">
            <Money amount={perVisit} per="visit" />
          </dd>
        </div>
        <div>
          <dt className="label-type text-ink-tertiary">{t('derivedRhythm')}</dt>
          <dd className="mt-1">{rhythmT(planRhythm({ ...draft, id: '', reference: '', order: 0 }))}</dd>
        </div>
      </dl>

      <div className="mt-6 space-y-3">
        <SwitchField
          label={t('active')}
          hint={t('activeHint')}
          checked={draft.active}
          onCheckedChange={(active) =>
            patch({ active, visibleOnSite: active && draft.visibleOnSite })
          }
        />
        <SwitchField
          label={t('visibleOnSite')}
          hint={t('visibleHint')}
          checked={draft.visibleOnSite}
          disabled={!draft.active}
          onCheckedChange={(visibleOnSite) => patch({ visibleOnSite })}
        />
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
