'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  X,
} from 'lucide-react';

import { toast } from 'sonner';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ConfirmPanel } from '@/components/ui/confirm-panel';
import { StatusBadge } from '@/components/ui/status-badge';
import { Field, Textarea } from '@/components/ui/field';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { estimateHours } from '@/mock/engines/pricing';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

const ACCESS_LABELS: Record<string, string> = {
  'customer-present': 'Kunde ist da',
  'key-left': 'Schlüssel liegt bereit',
  'key-box': 'Schlüsselkasten mit Code',
  'other-person': 'Andere Person ist da',
};

/**
 * Screen 53 — everything the customer sent, in one place.
 *
 * Two things the brief singles out are built here rather than described:
 *
 *  · access codes are masked by default with an explicit reveal, and the note
 *    beside them states the actual rule — you see them always, the person
 *    doing the job only on the day;
 *  · the internal note is visually separated from everything the customer can
 *    see, because "لازم يبان الفرق ده بصرياً" is the difference between a
 *    private reminder and an accident.
 */
export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.request');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();

  const requests = useStore((s) => s.data.requests);
  const customers = useStore((s) => s.data.customers);
  const properties = useStore((s) => s.data.properties);
  const photos = useStore((s) => s.data.photos);
  const services = useStore((s) => s.services);
  const addOns = useStore((s) => s.addOns);
  const settings = useStore((s) => s.settings);
  const patchData = useStore((s) => s.patchData);
  const data = useStore((s) => s.data);

  const cancelRequest = useStore((s) => s.cancelRequest);
  const now = useNow();

  const [revealed, setRevealed] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const request = requests.find((r) => r.id === id);
  if (!request) return <p className="text-ink-tertiary">—</p>;

  const customer = customers.find((c) => c.id === request.customerId)!;
  const property = properties.find((p) => p.id === request.propertyId)!;
  const service = services.find((s) => s.slug === request.serviceSlug)!;
  const chosen = addOns.filter((a) => request.addOnIds.includes(a.id));
  const requestPhotos = photos.filter((p) => p.requestId === request.id);

  const duration = estimateHours(
    {
      service,
      addOns: chosen,
      area: property.area,
      bathrooms: property.bathrooms,
      hasPets: property.hasPets,
      needsExtraEffort: property.needsExtraEffort,
      windowCount: request.windowCount,
      furniturePieces: request.furniturePieces,
    },
    settings,
  );

  const access = property.access;
  const hasSecrets = Boolean(access?.boxCode || access?.alarmCode);

  function setInternalNote(note: string) {
    patchData({
      requests: data.requests.map((r) =>
        r.id === request!.id ? { ...r, internalNote: note } : r,
      ),
    });
  }

  const answered = request.status !== 'new' && request.status !== 'inReview';

  /*
   * Declining and cancelling are not the same act, and only one of them
   * existed. "Ablehnen" answers an open request with a no; once the quote is
   * out, the honest word is cancel — and it has to take the live offer down
   * with it, which /ablehnen never did.
   */
  const cancellable =
    request.status === 'offerSent' || request.status === 'revisionRequested';

  return (
    <div className="max-w-5xl">
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/anfragen">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 data-numeric className="display-type text-3xl">
              {request.reference}
            </h1>
            <StatusBadge entity="request" state={request.status} />
          </div>
          <p data-numeric className="mt-2 text-sm text-ink-secondary">
            {t('received')} {format.dateTime(new Date(request.createdAt), 'full')},{' '}
            {format.dateTime(new Date(request.createdAt), 'time')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild disabled={answered}>
            <Link href={`/admin/anfragen/${request.id}/offerte`}>
              <FileText className="size-4" aria-hidden />
              {t('replyWithQuote')}
            </Link>
          </Button>
          {cancellable ? (
            <Button variant="danger" onClick={() => setCancelling(true)}>
              <X className="size-4" aria-hidden />
              {t('cancelAction')}
            </Button>
          ) : (
            <Button asChild variant="danger">
              <Link href={`/admin/anfragen/${request.id}/ablehnen`}>
                <X className="size-4" aria-hidden />
                {t('reject')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {cancelling && (
        <ConfirmPanel
          className="mt-6"
          title={t('cancelTitle')}
          body={t('cancelBody')}
          action={t('cancelConfirm')}
          dismiss={t('cancelDismiss')}
          disabled={!cancelReason.trim()}
          onDismiss={() => setCancelling(false)}
          onConfirm={() => {
            cancelRequest(request.id, 'company', cancelReason, now);
            setCancelling(false);
            toast.success(t('cancelDone', { reference: request.reference }));
          }}
        >
          {/* Required here, unlike the customer's own withdrawal: this one is
              the company acting on somebody else's job, and a month later the
              only account of why is whatever was typed in this box. */}
          <Field label={t('cancelReason')}>
            {(props) => (
              <Textarea
                {...props}
                className="min-h-20 bg-card"
                value={cancelReason}
                placeholder={t('cancelReasonPlaceholder')}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            )}
          </Field>
        </ConfirmPanel>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          <Section title={t('serviceTitle')}>
            <Row label={t('serviceTitle')}>{service.name[locale]}</Row>
            <Row label={t('addOns')}>
              {chosen.length ? chosen.map((a) => a.name[locale]).join(', ') : t('noAddOns')}
            </Row>
            <Row label={t('estimated')}>
              <span data-numeric>{duration.scheduledHours} Std.</span>
            </Row>
            <p className="pt-2 text-xs text-ink-tertiary">{t('estimatedNote')}</p>
          </Section>

          <Section title={t('propertyTitle')}>
            <Row label="Adresse">
              {property.street}, <span data-numeric>{property.postcode}</span> {property.city}
            </Row>
            <Row label={t('kind')}>{property.kind}</Row>
            <Row label={t('area')}>
              <span data-numeric>{property.area} m²</span>
            </Row>
            <Row label={t('rooms')}>
              <span data-numeric>{property.rooms}</span>
            </Row>
            <Row label={t('bathrooms')}>
              <span data-numeric>{property.bathrooms}</span>
            </Row>
            <Row label={t('floor')}>
              <span data-numeric>{property.floor}</span>
            </Row>
            <Row label={t('elevator')}>{property.hasElevator ? 'Ja' : 'Nein'}</Row>
            <Row label={t('pets')}>{property.hasPets ? 'Ja' : 'Nein'}</Row>
            <Row label={t('effort')}>{property.needsExtraEffort ? 'Ja' : 'Nein'}</Row>
          </Section>

          <Section title={t('preferredTitle')}>
            <Row label={t('preferredTitle')}>
              {request.preferred.flexible
                ? t('flexible')
                : request.preferred.date
                  ? `${format.dateTime(new Date(request.preferred.date), 'dayMonth')}${request.preferred.band ? ` · ${request.preferred.band}` : ''}`
                  : '—'}
            </Row>
          </Section>

          {/* §13.1 — masked by default, and the rule stated next to the reveal. */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="display-type text-xl">{t('accessTitle')}</h2>
              {hasSecrets && (
                <Button variant="secondary" size="sm" onClick={() => setRevealed((v) => !v)}>
                  {revealed ? (
                    <>
                      <EyeOff className="size-3.5" aria-hidden />
                      {t('accessHide')}
                    </>
                  ) : (
                    <>
                      <Eye className="size-3.5" aria-hidden />
                      {t('accessReveal')}
                    </>
                  )}
                </Button>
              )}
            </div>

            <dl className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
              <Row label="Methode">{access ? ACCESS_LABELS[access.method] : '—'}</Row>
              {access?.keyLocation && <Row label="Ort">{access.keyLocation}</Row>}
              {access?.boxLocation && <Row label="Kasten">{access.boxLocation}</Row>}
              {access?.boxCode && (
                <Row label="Code">
                  <Secret value={access.boxCode} revealed={revealed} />
                </Row>
              )}
              {access?.alarmCode && (
                <Row label="Alarmcode">
                  <Secret value={access.alarmCode} revealed={revealed} />
                </Row>
              )}
              {access?.personName && (
                <Row label="Person">
                  {access.personName} · <span data-numeric>{access.personPhone}</span>
                </Row>
              )}
              {access?.emergencyName && (
                <Row label="Notfall">
                  {access.emergencyName} · <span data-numeric>{access.emergencyPhone}</span>
                </Row>
              )}
            </dl>

            <p className="mt-3 flex gap-2 text-xs text-ink-tertiary">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {t('accessGuard')}
            </p>
          </section>

          <section>
            <h2 className="display-type text-xl">{t('photosTitle')}</h2>
            {requestPhotos.length === 0 ? (
              <p className="mt-3 text-sm text-ink-tertiary">{t('photosEmpty')}</p>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-3">
                {requestPhotos.map((photo) => (
                  <li key={photo.id}>
                    <ImagePlaceholder
                      seed={photo.id}
                      alt={photo.note ?? ''}
                      className="aspect-4/3 rounded-[var(--radius-md)]"
                    />
                    {photo.note && (
                      <p className="mt-2 text-sm text-ink-secondary">{photo.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {request.customerNote && (
              <div className="mt-6">
                <h3 className="label-type text-ink-tertiary">{t('customerNote')}</h3>
                <p className="mt-2 text-ink-secondary">{request.customerNote}</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-8 lg:col-span-5">
          <div className="surface-card p-6">
            <h2 className="label-type text-ink-tertiary">{t('customerTitle')}</h2>
            <p className="mt-3 text-lg font-medium">
              {customer.firstName} {customer.lastName}
            </p>
            <p data-numeric className="mt-1 text-sm text-ink-secondary">
              {customer.phone}
            </p>
            <p className="text-sm text-ink-secondary">{customer.email}</p>
            <p className="mt-1 text-sm text-ink-tertiary">
              {t('language')}: {customer.language.toUpperCase()}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary">
                <a href={`tel:${customer.phone.replace(/\s/g, '')}`}>
                  <Phone className="size-3.5" aria-hidden />
                  {t('call')}
                </a>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}>
                  <MessageCircle className="size-3.5" aria-hidden />
                  {t('whatsapp')}
                </a>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <a href={`mailto:${customer.email}`}>
                  <Mail className="size-3.5" aria-hidden />
                  {t('email')}
                </a>
              </Button>
            </div>
          </div>

          {/* Deliberately not a card: dashed, tinted, and labelled, so it can
              never be mistaken for something the customer sees. */}
          <div className="rounded-[var(--radius-lg)] border border-dashed border-line bg-sunken p-5">
            <h2 className="flex items-center gap-2 font-medium">
              <Lock className="size-4 text-ink-tertiary" aria-hidden />
              {t('internalTitle')}
            </h2>
            <p className="mt-1 text-xs text-ink-tertiary">{t('internalHint')}</p>
            <Textarea
              className="mt-3 min-h-24 bg-page"
              placeholder={t('internalPlaceholder')}
              value={request.internalNote ?? ''}
              onChange={(e) => setInternalNote(e.target.value)}
            />
          </div>

          <div>
            <h2 className="label-type text-ink-tertiary">{t('historyTitle')}</h2>
            <ol className="mt-3 space-y-3 border-l border-line-subtle pl-4">
              {[
                { at: request.createdAt, label: t('historyCreated') },
                request.openedAt && { at: request.openedAt, label: t('historyOpened') },
                request.respondedAt && { at: request.respondedAt, label: t('historyReplied') },
              ]
                .filter(Boolean)
                .map((entry) => {
                  const e = entry as { at: string; label: string };
                  return (
                    <li key={e.label} className="relative text-sm">
                      <span
                        aria-hidden
                        className="absolute top-1.5 -left-[1.3125rem] size-2 rounded-full bg-line"
                      />
                      <span className="block">{e.label}</span>
                      <span data-numeric className="text-ink-tertiary">
                        {format.dateTime(new Date(e.at), 'short')},{' '}
                        {format.dateTime(new Date(e.at), 'time')}
                      </span>
                    </li>
                  );
                })}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="display-type text-xl">{title}</h2>
      <dl className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
        {children}
      </dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-ink-tertiary">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Secret({ value, revealed }: { value: string; revealed: boolean }) {
  return (
    <span
      data-numeric
      className={cn(
        'rounded-sm px-1.5 py-0.5',
        revealed ? 'bg-status-warning text-status-warning-fg' : 'bg-sunken tracking-widest',
      )}
    >
      {revealed ? value : '••••'}
    </span>
  );
}
