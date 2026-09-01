'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { CalendarCheck, Info, Loader2, ShieldCheck } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Money, MoneyRange } from '@/components/ui/money';
import { BookingStep } from '@/components/booking/booking-step';
import { useEstimate } from '@/components/booking/use-estimate';
import { useNow, useStore } from '@/mock/store';

/**
 * Screen 22 — review and submit.
 *
 * Every section links back to the step that owns it, so correcting something
 * never means starting again. The "what happens next" block sits directly
 * above the submit button rather than below it: the request is free and
 * commits to nothing, and that is the single most useful thing to say at the
 * moment of pressing send.
 */
export default function ReviewStep() {
  const t = useTranslations('booking.review');
  const bt = useTranslations('booking.shell');
  const at = useTranslations('booking.access');
  const tt = useTranslations('booking.time');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();

  const draft = useStore((s) => s.draft);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);
  const properties = useStore((s) => s.data.properties);
  const settings = useStore((s) => s.settings);
  const submitDraft = useStore((s) => s.submitDraft);
  const estimate = useEstimate();
  const [sending, setSending] = useState(false);

  const service = services.find((s) => s.slug === draft.serviceSlug);
  const saved = draft.propertyId ? properties.find((p) => p.id === draft.propertyId) : null;
  const chosen = addOns.filter((a) => draft.addOnIds.includes(a.id));

  const address = saved
    ? `${saved.street}, ${saved.postcode} ${saved.city}`
    : `${draft.property.street}, ${draft.property.postcode} ${draft.property.city}`;
  /* A saved property may predate its measurements — the office can now file an
     address from a phone call. The draft's own numbers are always there, since
     the step that collects them will not advance without them. */
  const size = saved ?? draft.property;
  const specs = [
    size.area != null && `${size.area} m²`,
    size.rooms != null && `${size.rooms} Zi.`,
    size.bathrooms != null && `${size.bathrooms} Bad`,
  ]
    .filter(Boolean)
    .join(' · ');

  const accessLabel = draft.access
    ? {
        'customer-present': at('optionPresent'),
        'key-left': at('optionKey'),
        'key-box': at('optionBox'),
        'other-person': at('optionPerson'),
      }[draft.access.method]
    : '—';

  const timeLabel = draft.preferred.flexible
    ? tt('flexible')
    : draft.preferred.date
      ? `${format.dateTime(new Date(draft.preferred.date), 'dayMonth')}${
          draft.preferred.band
            ? ` · ${tt(
                draft.preferred.band === 'morning'
                  ? 'bandMorning'
                  : draft.preferred.band === 'midday'
                    ? 'bandMidday'
                    : 'bandAfternoon',
              )}`
            : ''
        }`
      : '—';

  function submit() {
    setSending(true);
    window.setTimeout(() => {
      const result = submitDraft(now);
      /* Only reachable by opening this step's URL directly with an
         out-of-area draft, which the wizard itself no longer produces. Back to
         the postcode rather than an error: that step already says why, and it
         is the only screen where the answer can be changed. */
      if (!result) {
        setSending(false);
        router.push('/anfrage/objekt');
        return;
      }
      router.push(`/anfrage/gesendet?ref=${result.reference}`);
    }, 800);
  }

  return (
    <BookingStep step="pruefen" title={t('title')} lead={t('lead')} canContinue>
      <dl className="divide-y divide-line-subtle border-y border-line-subtle">
        <Row label={t('sectionService')} href="/anfrage/leistung" edit={t('edit')}>
          {service?.name[locale] ?? '—'}
        </Row>
        <Row label={t('sectionProperty')} href="/anfrage/objekt" edit={t('edit')}>
          <span className="block">{address}</span>
          <span data-numeric className="block text-sm text-ink-tertiary">
            {specs}
          </span>
        </Row>
        <Row label={t('sectionAddons')} href="/anfrage/extras" edit={t('edit')}>
          {chosen.length ? chosen.map((a) => a.name[locale]).join(', ') : t('noAddons')}
        </Row>
        <Row label={t('sectionAccess')} href="/anfrage/zutritt" edit={t('edit')}>
          {accessLabel}
        </Row>
        <Row label={t('sectionTime')} href="/anfrage/termin" edit={t('edit')}>
          {timeLabel}
        </Row>
        <Row label={t('sectionPhotos')} href="/anfrage/fotos" edit={t('edit')}>
          {draft.photos.length ? (
            <span data-numeric>{draft.photos.length}</span>
          ) : (
            t('noPhotos')
          )}
        </Row>
        <Row label={t('sectionContact')} href="/anfrage/kontakt" edit={t('edit')}>
          <span className="block">
            {draft.contact.firstName} {draft.contact.lastName}
          </span>
          <span className="block text-sm text-ink-tertiary">{draft.contact.email}</span>
        </Row>
      </dl>

      {estimate && (
        <section className="mt-8 rounded-[var(--radius-lg)] border border-line p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="subhead-type text-xl">{t('priceTitle')}</h2>
            <MoneyRange
              low={estimate.rangeLow}
              high={estimate.rangeHigh}
              className="text-2xl font-semibold"
            />
          </div>
          <p className="mt-2 text-sm text-ink-secondary">{t('priceBody')}</p>

          <h3 className="label-type mt-6 text-ink-tertiary">{t('priceBreakdown')}</h3>
          <ul className="mt-2 divide-y divide-line-subtle border-t border-line-subtle">
            {estimate.lines.map((line) => (
              <li key={line.key} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="text-sm text-ink-secondary">
                  {line.kind === 'service' && service ? service.name[locale] : line.label}
                  {line.calc === 'hourly' && (
                    <span data-numeric className="ml-2 text-ink-tertiary">
                      {line.quantity} × <Money amount={line.unitPrice} />
                    </span>
                  )}
                </span>
                <Money amount={line.total} className="text-sm" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 border-l-2 border-rule bg-sunken rounded-[var(--radius-lg)] p-5">
        <h2 className="flex items-center gap-2 font-medium">
          <CalendarCheck className="size-4 text-ink-secondary" aria-hidden />
          {t('afterTitle')}
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-ink-secondary">
          <li>{t('after1')}</li>
          <li>{t('after2', { hours: settings.responseTimeHours })}</li>
          <li>{t('after3')}</li>
        </ol>
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-status-success-fg">
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          {t('noCharge')}
        </p>
      </section>

      <div className="mt-8">
        <Button size="lg" block onClick={submit} disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </Button>
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-ink-tertiary">
          <Info className="size-3.5" aria-hidden />
          {bt('estimateNote')}
        </p>
      </div>
    </BookingStep>
  );
}

function Row({
  label,
  href,
  edit,
  children,
}: {
  label: string;
  href: string;
  edit: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <dt className="label-type text-ink-tertiary">{label}</dt>
        <dd className="mt-1">{children}</dd>
      </div>
      <Link
        href={href}
        className="shrink-0 text-sm text-ink-accent underline decoration-from-font underline-offset-4"
      >
        {edit}
      </Link>
    </div>
  );
}
