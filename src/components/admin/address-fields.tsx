'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, MapPin } from 'lucide-react';

import { Field, Input } from '@/components/ui/field';
import { checkCoverage, regionByPostcode } from '@/mock/engines/coverage';
import { cn } from '@/lib/cn';

export interface AddressValue {
  street: string;
  /** Floor, entrance, bell — the half that gets somebody to the door. */
  addressDetail: string;
  /** The area code. In this market it is the PLZ, and the form says PLZ. */
  postcode: string;
  /** The area name. Auto-filled from the code when the code names one. */
  city: string;
}

/**
 * One address, one component, two screens.
 *
 * Creating a property and correcting one were two copies of the same four
 * fields, and they had already drifted: the create form had no validation and
 * no coverage feedback at all, so an address typed «8790 Zürich» went in
 * silently and turned up in a zone filter under a municipality nobody had
 * written. Both screens render this now, so a rule added to one is a rule on
 * both.
 *
 * Three things changed about what the address *is*:
 *
 *  · **The detailed address exists.** A street and a number reach the
 *    building; «3. OG links, Klingel Meier» reaches the flat. It was being
 *    typed into the standing notes — the field that also carries "dog in the
 *    living room" — where the job sheet prints it at the bottom, after the
 *    point somebody standing at a door needed it.
 *
 *  · **The area code and the area name are one answer, not two.** They were
 *    two free-text boxes that could disagree, and «8706 / Zürich» was
 *    enterable: the properties list derives its zone from the postcode, so
 *    that row filed itself under Meilen while the record printed Zürich on
 *    every quote. Typing a served code now fills the name.
 *
 *  · **The area is named on screen**, under the pair, rather than being a fact
 *    the reader has to know the postcode table to check.
 *
 * The auto-fill stops the moment somebody edits the name themselves. Filling a
 * field is a convenience; overwriting what a person just typed is the
 * behaviour that makes people fight a form.
 */
export function AddressFields({
  value,
  onChange,
  errors,
  served,
  className,
}: {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  errors?: Partial<Record<keyof AddressValue, string>>;
  /** `Settings.servedPostcodes` — §6 decides which eight are inside. */
  served: string[];
  className?: string;
}) {
  const t = useTranslations('admin.address');
  /* Ours until somebody types in it. Not derived from whether the value
     matches a region name: an address in Meilen whose name the office typed by
     hand is still theirs, and the next postcode edit must not take it back. */
  const [nameOwned, setNameOwned] = useState(true);

  const coverage = checkCoverage(value.postcode, served);
  const region = regionByPostcode(value.postcode.trim());

  function patch(next: Partial<AddressValue>) {
    onChange({ ...value, ...next });
  }

  function onPostcode(postcode: string) {
    const match = regionByPostcode(postcode.trim());
    patch({
      postcode,
      /* Only forward. Deleting a digit out of a served code does not blank the
         town that code filled in — it would empty the field mid-correction,
         which is the one moment the reader is looking somewhere else. */
      city: match && nameOwned ? match.name : value.city,
    });
  }

  return (
    <div className={cn('space-y-5', className)}>
      <Field label={t('street')} error={errors?.street}>
        {(props) => (
          <Input
            {...props}
            value={value.street}
            autoComplete="street-address"
            onChange={(e) => patch({ street: e.target.value })}
          />
        )}
      </Field>

      <Field label={t('detail')} hint={t('detailHint')} optional>
        {(props) => (
          <Input
            {...props}
            value={value.addressDetail}
            /* `address-line2` is exactly this field's name in the autofill
               vocabulary, so a browser that has the address already offers the
               right half of it. */
            autoComplete="address-line2"
            placeholder={t('detailPlaceholder')}
            onChange={(e) => patch({ addressDetail: e.target.value })}
          />
        )}
      </Field>

      {/*
        The area, as one block with a name on it.

        Two boxes side by side under a card heading that says «Adresse» read as
        two more address lines; under their own heading they read as the one
        question they are — which of the eight municipalities is this. The
        heading is also what makes the line underneath belong to both of them
        rather than only to the box it happens to sit below.
      */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t('areaLegend')}</legend>
        <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
          <Field label={t('areaCode')} error={errors?.postcode}>
            {(props) => (
              <Input
                {...props}
                value={value.postcode}
                inputMode="numeric"
                maxLength={4}
                autoComplete="postal-code"
                onChange={(e) => onPostcode(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('areaName')} error={errors?.city}>
            {(props) => (
              <Input
                {...props}
                value={value.city}
                autoComplete="address-level2"
                onChange={(e) => {
                  setNameOwned(false);
                  patch({ city: e.target.value });
                }}
              />
            )}
          </Field>
        </div>

        {/*
          What the code resolved to, in words.

          `invalid` says nothing on purpose — a half-typed postcode is not an
          address outside the area, and telling somebody they are out of the
          service region on the second keystroke is the behaviour the coverage
          engine's own note rules out for the booking flow.
        */}
        {coverage.state === 'inside' && region && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-status-success-fg">
            <Check className="size-3.5 shrink-0" aria-hidden />
            {t('areaMatched', { region: region.name })}
          </p>
        )}
        {coverage.state === 'outside' && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-secondary">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {t('areaUnknown', { postcode: coverage.postcode })}
          </p>
        )}
      </fieldset>
    </div>
  );
}
