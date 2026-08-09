'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';
import { Field, Input, Select, Checkbox } from '@/components/ui/field';
import { BookingStep } from '@/components/booking/booking-step';
import { useStore } from '@/mock/store';

/**
 * Screen 21 — contact details.
 *
 * §8.3: a request goes in as a guest. The account is created when the *quote*
 * is sent, and the lead line says so — asking someone to register before they
 * even have a price is exactly the friction this product exists to remove.
 */
export default function ContactStep() {
  const t = useTranslations('booking.contact');
  const draft = useStore((s) => s.draft);
  const updateDraft = useStore((s) => s.updateDraft);

  const c = draft.contact;
  const patch = (part: Partial<typeof c>) => updateDraft({ contact: { ...c, ...part } });

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email);
  const complete =
    Boolean(c.firstName && c.lastName && c.phone) &&
    emailValid &&
    draft.acceptedTerms &&
    draft.acceptedPrivacy;

  return (
    <BookingStep step="kontakt" title={t('title')} lead={t('lead')} canContinue={complete}>
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={t('firstName')}>
            {(props) => (
              <Input
                value={c.firstName}
                autoComplete="given-name"
                onChange={(e) => patch({ firstName: e.target.value })}
                {...props}
              />
            )}
          </Field>
          <Field label={t('lastName')}>
            {(props) => (
              <Input
                value={c.lastName}
                autoComplete="family-name"
                onChange={(e) => patch({ lastName: e.target.value })}
                {...props}
              />
            )}
          </Field>
        </div>

        <Field
          label={t('email')}
          hint={t('emailHint')}
          error={c.email && !emailValid ? 'E-Mail prüfen' : undefined}
        >
          {(props) => (
            <Input
              type="email"
              value={c.email}
              autoComplete="email"
              onChange={(e) => patch({ email: e.target.value })}
              {...props}
            />
          )}
        </Field>

        <Field label={t('phone')} hint={t('phoneHint')}>
          {(props) => (
            <Input
              type="tel"
              value={c.phone}
              autoComplete="tel"
              onChange={(e) => patch({ phone: e.target.value })}
              {...props}
            />
          )}
        </Field>

        <Field label={t('language')} className="max-w-xs">
          {(props) => (
            <Select
              value={c.language}
              onChange={(e) => patch({ language: e.target.value as Locale })}
              {...props}
            >
              {routing.locales.map((locale) => (
                <option key={locale} value={locale}>
                  {LOCALE_LABELS[locale]}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div className="space-y-3 border-t border-line-subtle pt-6">
          <Checkbox
            checked={draft.acceptedTerms}
            onChange={(e) => updateDraft({ acceptedTerms: e.target.checked })}
            label={
              <>
                {t('consentTerms')}{' '}
                <Link
                  href="/rechtliches/agb"
                  className="underline decoration-from-font underline-offset-4"
                >
                  AGB
                </Link>
              </>
            }
          />
          <Checkbox
            checked={draft.acceptedPrivacy}
            onChange={(e) => updateDraft({ acceptedPrivacy: e.target.checked })}
            label={
              <>
                {t('consentPrivacy')}{' '}
                <Link
                  href="/rechtliches/datenschutz"
                  className="underline decoration-from-font underline-offset-4"
                >
                  Datenschutz
                </Link>
              </>
            }
          />
        </div>
      </div>
    </BookingStep>
  );
}
