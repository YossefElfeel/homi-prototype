'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, DoorOpen, Eye, EyeOff, KeyRound, Lock, User, UserCheck } from 'lucide-react';

import { Field, Input, Textarea } from '@/components/ui/field';
import { BookingStep } from '@/components/booking/booking-step';
import { useStore } from '@/mock/store';
import type { AccessMethod } from '@/mock/schema';
import { cn } from '@/lib/cn';

const OPTIONS: {
  value: AccessMethod;
  icon: typeof DoorOpen;
  label: 'optionPresent' | 'optionKey' | 'optionBox' | 'optionPerson';
  hint: 'optionPresentHint' | 'optionKeyHint' | 'optionBoxHint' | 'optionPersonHint';
}[] = [
  { value: 'customer-present', icon: DoorOpen, label: 'optionPresent', hint: 'optionPresentHint' },
  { value: 'key-left', icon: KeyRound, label: 'optionKey', hint: 'optionKeyHint' },
  { value: 'key-box', icon: Lock, label: 'optionBox', hint: 'optionBoxHint' },
  { value: 'other-person', icon: UserCheck, label: 'optionPerson', hint: 'optionPersonHint' },
];

/**
 * Screen 18 — the anxiety screen.
 *
 * The brief names this and screen 20 (the quote builder) as the two that decide
 * whether the product works: "أكتر لحظة العميل بيحس فيها بقلق. تصميمها بيحدد
 * هيكمل ولا يقف."
 *
 * Three decisions follow from that:
 *
 *  1. The disclosure card comes BEFORE the options, not after and not in a
 *     footnote. The first thing on screen answers the question the visitor is
 *     actually asking, and it is operational — who, and when — rather than a
 *     reassurance slogan.
 *  2. Codes are masked by default with an explicit reveal, so the screen never
 *     leaves a door code sitting in plain text on a phone in public.
 *  3. Emergency details are grouped under "just in case" rather than appended
 *     to the form, so they read as prudence and not as four more fields.
 */
export default function AccessStep() {
  const t = useTranslations('booking.access');
  const draft = useStore((s) => s.draft);
  const updateDraft = useStore((s) => s.updateDraft);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const access = draft.access;
  const method = access?.method;
  const patch = (part: Partial<NonNullable<typeof access>>) =>
    updateDraft({ access: { ...(access ?? { method: 'customer-present' }), ...part } });

  const complete =
    method === 'customer-present'
      ? Boolean(access?.contactPhone)
      : method === 'key-left'
        ? Boolean(access?.keyLocation)
        : method === 'key-box'
          ? Boolean(access?.boxLocation && access?.boxCode)
          : method === 'other-person'
            ? Boolean(access?.personName && access?.personPhone)
            : false;

  function SecretInput({
    name,
    value,
    onChange,
    ...props
  }: {
    name: string;
    value: string;
    onChange: (v: string) => void;
    id?: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
  }) {
    const shown = revealed[name] ?? false;
    return (
      <div className="relative">
        <Input
          type={shown ? 'text' : 'password'}
          value={value}
          autoComplete="off"
          className="pr-12"
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setRevealed((r) => ({ ...r, [name]: !shown }))}
          aria-label={shown ? t('hide') : t('reveal')}
          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-ink-tertiary transition-colors hover:text-ink"
        >
          {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    );
  }

  return (
    <BookingStep step="zutritt" title={t('title')} lead={t('lead')} canContinue={complete}>
      <div className="flex gap-4 rounded-[var(--radius-lg)] border border-line bg-sunken p-5">
        <Lock className="mt-0.5 size-5 shrink-0 text-ink-accent" aria-hidden />
        <div>
          <h2 className="font-medium">{t('disclosureTitle')}</h2>
          <p className="mt-1.5 text-sm text-ink-secondary">{t('disclosureBody')}</p>
        </div>
      </div>

      <fieldset className="mt-8">
        <legend className="sr-only">{t('title')}</legend>
        <ul className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = method === option.value;
            return (
              <li key={option.value}>
                <label
                  className={cn(
                    'flex h-full cursor-pointer gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors',
                    active ? 'border-line-strong bg-accent-subtle' : 'border-line hover:bg-sunken',
                  )}
                >
                  <input
                    type="radio"
                    name="access"
                    className="sr-only"
                    checked={active}
                    onChange={() => updateDraft({ access: { method: option.value } })}
                  />
                  <Icon className="mt-0.5 size-5 shrink-0 text-ink-accent" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-medium">{t(option.label)}</span>
                      {active && <Check className="size-4 shrink-0 text-eco" aria-hidden />}
                    </span>
                    <span className="mt-1 block text-sm text-ink-secondary">
                      {t(option.hint)}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {method && (
        <div className="mt-8 space-y-6 border-t border-line-subtle pt-8">
          {method === 'customer-present' && (
            <Field label={t('contactPhone')}>
              {(props) => (
                <Input
                  type="tel"
                  value={access?.contactPhone ?? ''}
                  onChange={(e) => patch({ contactPhone: e.target.value })}
                  {...props}
                />
              )}
            </Field>
          )}

          {method === 'key-left' && (
            <>
              <Field label={t('keyLocation')} hint={t('keyLocationHint')}>
                {(props) => (
                  <Textarea
                    value={access?.keyLocation ?? ''}
                    onChange={(e) => patch({ keyLocation: e.target.value })}
                    {...props}
                  />
                )}
              </Field>
              <Field label={t('keyReturn')} optional>
                {(props) => (
                  <Input
                    value={access?.keyReturnLocation ?? ''}
                    onChange={(e) => patch({ keyReturnLocation: e.target.value })}
                    {...props}
                  />
                )}
              </Field>
            </>
          )}

          {method === 'key-box' && (
            <>
              <Field label={t('boxLocation')}>
                {(props) => (
                  <Input
                    value={access?.boxLocation ?? ''}
                    onChange={(e) => patch({ boxLocation: e.target.value })}
                    {...props}
                  />
                )}
              </Field>
              <Field label={t('boxCode')} className="max-w-xs">
                {(props) => (
                  <SecretInput
                    name="boxCode"
                    value={access?.boxCode ?? ''}
                    onChange={(v) => patch({ boxCode: v })}
                    {...props}
                  />
                )}
              </Field>
              <Field label={t('keyReturn')} optional>
                {(props) => (
                  <Input
                    value={access?.keyReturnLocation ?? ''}
                    onChange={(e) => patch({ keyReturnLocation: e.target.value })}
                    {...props}
                  />
                )}
              </Field>
            </>
          )}

          {method === 'other-person' && (
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label={t('personName')}>
                {(props) => (
                  <Input
                    value={access?.personName ?? ''}
                    onChange={(e) => patch({ personName: e.target.value })}
                    {...props}
                  />
                )}
              </Field>
              <Field label={t('personPhone')}>
                {(props) => (
                  <Input
                    type="tel"
                    value={access?.personPhone ?? ''}
                    onChange={(e) => patch({ personPhone: e.target.value })}
                    {...props}
                  />
                )}
              </Field>
              <Field label={t('personRelation')} optional className="sm:col-span-2">
                {(props) => (
                  <Input
                    value={access?.personRelation ?? ''}
                    onChange={(e) => patch({ personRelation: e.target.value })}
                    {...props}
                  />
                )}
              </Field>
            </div>
          )}

          <section className="rounded-[var(--radius-lg)] border border-line-subtle p-5">
            <h2 className="flex items-center gap-2 font-medium">
              <User className="size-4 text-ink-tertiary" aria-hidden />
              {t('sharedTitle')}
            </h2>
            <div className="mt-4 space-y-5">
              <Field label={t('alarmCode')} hint={t('alarmHint')} optional className="max-w-xs">
                {(props) => (
                  <SecretInput
                    name="alarmCode"
                    value={access?.alarmCode ?? ''}
                    onChange={(v) => patch({ alarmCode: v })}
                    {...props}
                  />
                )}
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={t('emergencyName')} optional>
                  {(props) => (
                    <Input
                      value={access?.emergencyName ?? ''}
                      onChange={(e) => patch({ emergencyName: e.target.value })}
                      {...props}
                    />
                  )}
                </Field>
                <Field label={t('emergencyPhone')} optional>
                  {(props) => (
                    <Input
                      type="tel"
                      value={access?.emergencyPhone ?? ''}
                      onChange={(e) => patch({ emergencyPhone: e.target.value })}
                      {...props}
                    />
                  )}
                </Field>
              </div>
            </div>
          </section>
        </div>
      )}
    </BookingStep>
  );
}
