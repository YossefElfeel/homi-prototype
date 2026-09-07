'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Plus, Trash2 } from 'lucide-react';

import { routing, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Field, Input, NumberField } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import type { CountUnit } from '@/mock/schema';

/**
 * What a counted service counts — one block per unit, and there can be several.
 *
 * A window clean counts sashes. A glazing job counts panes *and* frames, and an
 * assembly counts pieces and wall fixings. There was room for exactly one, so
 * the second went into a note the price engine cannot read and the office
 * priced it by hand.
 *
 * The time rule is «every N of these takes M minutes» rather than a rate per
 * item, because that is how the business states it — §5.1 is «half an hour per
 * five windows», and five sashes and six are the same trip up the ladder.
 * Flattening it to six minutes each would quietly reprice every window job.
 */
export function CountUnitsEditor({
  units,
  onChange,
}: {
  units: CountUnit[];
  onChange: (next: CountUnit[]) => void;
}) {
  const t = useTranslations('admin.service');
  const locale = useLocale() as Locale;

  const patch = (id: string, next: Partial<CountUnit>) =>
    onChange(units.map((u) => (u.id === id ? { ...u, ...next } : u)));

  const add = () =>
    onChange([
      ...units,
      {
        id: `cu_${Date.now().toString(36)}`,
        label: {},
        noun: {},
        /* One per block by default: the common case is a thing priced on its
           own, and the window rule is the exception that needs the two
           numbers. Starting at five would put the exception in front of
           everybody. */
        blockOf: 1,
        minutesPerBlock: 15,
      },
    ]);

  return (
    <div className="space-y-5">
      {units.length === 0 && (
        <p className="max-w-[var(--measure)] text-sm text-ink-secondary">{t('countEmpty')}</p>
      )}

      {units.map((unit, index) => (
        <div
          key={unit.id}
          className={cn('rounded-[var(--radius-sm)] border border-line-subtle p-4', 'space-y-4')}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="label-type text-ink-tertiary">{t('countUnitN', { n: index + 1 })}</p>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('countRemove')}
              onClick={() => onChange(units.filter((u) => u.id !== unit.id))}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>

          {/* German only on the question and the plural, like every other
              string on this record: §20.6 makes it the fallback for the other
              three, so one field is what stands between a counted service and
              a form nobody can fill in. The other languages are written on the
              language card above. */}
          <Field label={t('countLabelField')} hint={t('countLabelHint')}>
            {(props) => (
              <Input
                {...props}
                value={unit.label[locale] ?? ''}
                onChange={(e) => patch(unit.id, { label: { ...unit.label, [locale]: e.target.value } })}
              />
            )}
          </Field>

          <Field label={t('countHintField')} hint={t('countHintHint')}>
            {(props) => (
              <Input
                {...props}
                value={unit.hint?.[locale] ?? ''}
                onChange={(e) => patch(unit.id, { hint: { ...unit.hint, [locale]: e.target.value } })}
              />
            )}
          </Field>

          <Field label={t('countNounField')} hint={t('countNounHint')}>
            {(props) => (
              <Input
                {...props}
                value={unit.noun[locale] ?? ''}
                onChange={(e) => patch(unit.id, { noun: { ...unit.noun, [locale]: e.target.value } })}
              />
            )}
          </Field>

          {/* The rule, stated the way the business states it. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('countBlockOf')} hint={t('countBlockOfHint')}>
              {(props) => (
                <NumberField
                  {...props}
                  min={1}
                  value={unit.blockOf}
                  onCommit={(v) => patch(unit.id, { blockOf: Math.max(1, v) })}
                />
              )}
            </Field>
            <Field label={t('countMinutes')} hint={t('countMinutesHint')}>
              {(props) => (
                <NumberField
                  {...props}
                  min={1}
                  value={unit.minutesPerBlock}
                  onCommit={(v) => patch(unit.id, { minutesPerBlock: Math.max(1, v) })}
                />
              )}
            </Field>
          </div>

          {/* The rule read back as a sentence. Two numbers in two boxes is not
              something anybody can check at a glance; «5 → 30 Min.» said in
              words is. */}
          <p className="text-sm text-ink-secondary">
            {t('countRule', { units: unit.blockOf, minutes: unit.minutesPerBlock })}
          </p>
        </div>
      ))}

      <Button variant="secondary" size="sm" onClick={add}>
        <Plus className="size-4" aria-hidden />
        {t('countAdd')}
      </Button>

      {/* Deliberately a warning and not a block. Somebody halfway through
          writing the second unit should not be stopped; the catalogue refuses
          to *publish* it, which is where the decision belongs. */}
      {units.some((u) => !u.label[routing.locales[0]]?.trim() && !u.label.de?.trim()) && (
        <p className="rounded-[var(--radius-sm)] border border-status-warning-line bg-status-warning px-3 py-2 text-sm text-status-warning-fg">
          {t('countMissing')}
        </p>
      )}
    </div>
  );
}
