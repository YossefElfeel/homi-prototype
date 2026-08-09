import { useLocale } from 'next-intl';
import { INTL_LOCALES, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

/**
 * Every franc on every screen goes through this component.
 *
 * The brief makes it a rule: "أي رقم فلوس مكتوب معاه العملة والوحدة: 49 فرنك
 * للساعة، مش 49 لوحدها". Enforcing it in a component means review never has to
 * catch a bare number — you physically cannot render one without saying what
 * it buys.
 *
 * Formatting is de-CH: apostrophe thousands separator, and whole francs
 * written the Swiss way — CHF 1'234.50, CHF 49.–
 */

export type MoneyUnit = 'hour' | 'unit' | 'month' | 'visit' | 'none';

const UNIT_SUFFIX: Record<Exclude<MoneyUnit, 'none'>, Record<'de' | 'en', string>> = {
  hour: { de: '/ Std.', en: '/ hr' },
  unit: { de: '/ Stk.', en: '/ unit' },
  month: { de: '/ Monat', en: '/ month' },
  visit: { de: '/ Einsatz', en: '/ visit' },
};

export function formatChf(amount: number, locale: Locale) {
  const formatted = new Intl.NumberFormat(INTL_LOCALES[locale], {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(amount);

  // Swiss convention writes whole francs as "49.–", not "49.00".
  return formatted.replace(/([.,])00$/, '$1–');
}

interface MoneyProps {
  amount: number;
  per?: MoneyUnit;
  /** Renders "ab CHF 98.–" for the from-price used across the marketing site. */
  from?: boolean;
  className?: string;
  emphasis?: 'default' | 'strong' | 'quiet';
}

export function Money({
  amount,
  per = 'none',
  from = false,
  className,
  emphasis = 'default',
}: MoneyProps) {
  const locale = useLocale() as Locale;
  const short = locale === 'en' ? 'en' : 'de';
  const value = formatChf(amount, locale);
  const suffix = per === 'none' ? null : UNIT_SUFFIX[per][short];

  return (
    <span
      data-numeric
      className={cn(
        'whitespace-nowrap',
        emphasis === 'strong' && 'font-semibold',
        emphasis === 'quiet' && 'text-ink-secondary',
        className,
      )}
    >
      {/* A real space, not just a margin — a screen reader would otherwise
          read "abCHF 98". */}
      {from && (
        <span className="text-ink-tertiary">{short === 'de' ? 'ab ' : 'from '}</span>
      )}
      {value}
      {suffix && <span className="ml-1 text-ink-secondary">{suffix}</span>}
    </span>
  );
}

/**
 * A price range — what the booking flow shows live as answers come in.
 *
 * Deliberately *not* two `formatChf` calls joined by a dash: the Swiss
 * whole-franc form already ends in "–", so "CHF 196.– – CHF 245.–" reads as
 * noise. Ranges carry the currency once and drop decimals when both ends are
 * whole, which is how Swiss price ranges are actually written.
 */
export function MoneyRange({
  low,
  high,
  className,
}: {
  low: number;
  high: number;
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const whole = Number.isInteger(low) && Number.isInteger(high);
  const number = new Intl.NumberFormat(INTL_LOCALES[locale], {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return (
    <span data-numeric className={cn('whitespace-nowrap', className)}>
      <span className="text-ink-secondary">CHF </span>
      {number.format(low)}
      <span className="mx-1.5 text-ink-tertiary">–</span>
      {number.format(high)}
    </span>
  );
}
