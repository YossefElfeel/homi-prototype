'use client';

import { use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { ArrowLeft, KeyRound, Lock, Pencil, ShieldAlert } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { zoneOf } from '@/lib/property-facts';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { SecretValue } from '@/components/ui/secret-value';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/field';
import { useHydrated, useStore } from '@/mock/store';
import { areaLabel, figure } from '@/lib/property-size';

const ACCESS_LABELS: Record<string, string> = {
  'customer-present': 'Kunde ist da',
  'key-left': 'Schlüssel liegt bereit',
  'key-box': 'Schlüsselkasten mit Code',
  'other-person': 'Andere Person ist da',
};

/**
 * Screen 67 — the property record.
 *
 * The standing notes matter more than they look: they surface on every job at
 * this address, which is how "the dog is called Nala" stops being something
 * one person happens to remember.
 *
 * Every block is a card now. Three of the five blocks used to sit directly on
 * the page background — a bare `<section>` with a heading — beside two that had
 * a surface, so the screen read as two panels floating over three loose lists
 * rather than one record. The specs grid was worse than loose: it drew its own
 * hairline lattice out of `gap-px` over `bg-line-subtle` with `bg-page` tiles,
 * which is the page's own colour, so the one block claiming to be a surface was
 * the only one *not* on `bg-card`.
 */
export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.property');
  const rt = useTranslations('admin.request');
  const kt = useTranslations('admin.keys');
  const lt = useTranslations('admin.properties');
  const ct = useTranslations('common');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const hydrated = useHydrated();

  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const bookings = useStore((s) => s.data.bookings);
  const keyLog = useStore((s) => s.data.keyLog);
  const services = useStore((s) => s.services);
  const settings = useStore((s) => s.settings);
  const updateProperty = useStore((s) => s.updateProperty);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const property = properties.find((p) => p.id === id);
  if (!property) return <p className="text-ink-tertiary">—</p>;

  const customer = customers.find((c) => c.id === property.customerId);
  const jobs = bookings
    .filter((b) => b.propertyId === property.id)
    .sort((a, b) => b.start.localeCompare(a.start));
  /* Held first, then the returned ones newest-first. A key that is in the
     cupboard right now is the answer to the question the card gets asked;
     the ones already handed back are the audit trail behind it. */
  const keys = keyLog
    .filter((k) => k.propertyId === property.id)
    .sort((a, b) =>
      a.status === b.status
        ? b.receivedAt.localeCompare(a.receivedAt)
        : a.status === 'held'
          ? -1
          : 1,
    );
  const access = property.access;

  function setNotes(notes: string) {
    updateProperty(property!.id, { permanentNotes: notes });
  }

  return (
    <div>
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/objekte">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      {/* The record could be read and not corrected — the only writable field
          on it was the standing note. The list gained an edit action, and the
          screen you land on after following it has to offer the same door. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="display-type text-3xl">{property.label}</h1>
        <Button asChild variant="secondary">
          <Link href={`/admin/objekte/${property.id}/bearbeiten`}>
            <Pencil className="size-4" aria-hidden />
            {t('editAction')}
          </Link>
        </Button>
      </div>
      <p className="mt-2 text-ink-secondary">
        {property.street}, <span data-numeric>{property.postcode}</span> {property.city}
        {customer && (
          <>
            {' · '}
            <Link
              href={`/admin/kunden/${customer.id}`}
              className="underline decoration-from-font underline-offset-4"
            >
              {customer.firstName} {customer.lastName}
            </Link>
          </>
        )}
      </p>
      {/* The line that gets somebody to the door, directly under the one that
          gets them to the building. Absent when there is nothing to add: most
          addresses have nothing, and an empty row here would be a gap the
          reader has to interpret rather than a fact. */}
      {property.addressDetail && (
        <p className="mt-1 text-sm text-ink-tertiary">{property.addressDetail}</p>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          <Card>
            <CardHeader title={t('specsTitle')} />
            <CardBody>
              {/*
                Two columns of labelled rows, not a lattice of tiles. Three of
                these facts were on the record for the first time: the kind and
                the zone are what the list now filters on, and `needsExtraEffort`
                had no reading anywhere at all — the editor writes it, it changes
                what a job costs, and the record it belongs to did not show it.
              */}
              <dl className="grid gap-x-10 text-sm sm:grid-cols-2">
                <DetailRow label={t('kindLabel')}>{lt(`kinds.${property.kind}`)}</DetailRow>
                <DetailRow label={t('zoneLabel')}>{zoneOf(property).label}</DetailRow>
                <DetailRow label={rt('area')}>
                  <span data-numeric>{areaLabel(property.area)}</span>
                </DetailRow>
                <DetailRow label={rt('rooms')}>
                  <span data-numeric>{figure(property.rooms)}</span>
                </DetailRow>
                <DetailRow label={rt('bathrooms')}>
                  <span data-numeric>{figure(property.bathrooms)}</span>
                </DetailRow>
                <DetailRow label={rt('floor')}>
                  <span data-numeric>{property.floor}</span>
                </DetailRow>
                <DetailRow label={rt('elevator')}>
                  {ct(property.hasElevator ? 'yes' : 'no')}
                </DetailRow>
                <DetailRow label={rt('pets')}>{ct(property.hasPets ? 'yes' : 'no')}</DetailRow>
                <DetailRow label={rt('effort')}>
                  {property.needsExtraEffort ? (
                    <Chip tone="warning">{ct('yes')}</Chip>
                  ) : (
                    ct('no')
                  )}
                </DetailRow>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('accessTitle')} />
            <CardBody>
              {/*
                The reveal used to be one button up in this heading governing
                every secret under it, which is the wrong grain twice over: it
                put the key-box code on screen when you asked for the alarm
                code — on a record that is often read with the customer beside
                you — and it sat a heading away from the value it acted on. Per
                value, next to the value, same as screens 62 and 70 already do.
                Inside a card the outer rules are the card's own edges, so only
                the rules between the rows are left.
              */}
              <dl className="divide-y divide-line-subtle border-t border-line-subtle">
                <Row label="Methode">{access ? ACCESS_LABELS[access.method] : '—'}</Row>
                {access?.keyLocation && <Row label="Ort">{access.keyLocation}</Row>}
                {access?.keyReturnLocation && (
                  <Row label="Rückgabe">{access.keyReturnLocation}</Row>
                )}
                {access?.boxLocation && <Row label="Kasten">{access.boxLocation}</Row>}
                {access?.boxCode && (
                  <Row label="Code">
                    <SecretValue
                      value={access.boxCode}
                      revealLabel={rt('accessReveal')}
                      hideLabel={rt('accessHide')}
                    />
                  </Row>
                )}
                {access?.alarmCode && (
                  <Row label="Alarmcode">
                    <SecretValue
                      value={access.alarmCode}
                      revealLabel={rt('accessReveal')}
                      hideLabel={rt('accessHide')}
                    />
                  </Row>
                )}
                {access?.personName && (
                  <Row label="Person">
                    {access.personName}
                    {access.personRelation && (
                      <span className="block text-sm text-ink-tertiary">
                        {access.personRelation}
                      </span>
                    )}
                  </Row>
                )}
                {access?.emergencyName && (
                  <Row label="Notfall">
                    {access.emergencyName}
                    {access.emergencyPhone && (
                      <span data-numeric className="block text-sm text-ink-tertiary">
                        {access.emergencyPhone}
                      </span>
                    )}
                  </Row>
                )}
              </dl>
              <p className="mt-3 flex gap-2 text-xs text-ink-tertiary">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {rt('accessGuard')}
              </p>
            </CardBody>
          </Card>

          <Card pad="none">
            <CardHeader title={t('historyTitle')} className="p-card pb-4" />
            {jobs.length === 0 ? (
              <p className="px-card pb-card text-sm text-ink-tertiary">{t('historyEmpty')}</p>
            ) : (
              <ul className="divide-y divide-line-subtle border-t border-line-subtle px-card">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/admin/buchungen/${job.id}`}
                      className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-sunken"
                    >
                      <span>
                        <span data-numeric className="block">
                          {format.dateTime(new Date(job.start), 'full')}
                        </span>
                        <span className="block text-sm text-ink-secondary">
                          {services.find((s) => s.slug === job.serviceSlug)?.name[locale]}
                        </span>
                      </span>
                      <StatusBadge entity="booking" state={job.status} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <KeyRound className="size-4 text-ink-tertiary" aria-hidden />
                  {t('keysTitle')}
                </span>
              }
              description={settings.hasLiabilityInsurance ? t('keysLead') : undefined}
            />
            <CardBody>
              {!settings.hasLiabilityInsurance ? (
                /*
                 * §21 item 12 — the lock is real, so the panel says what it is
                 * and how to lift it. It used to be the six-word title on its
                 * own: a card that reported a state, gave no reason for it and
                 * offered no way out, on the record where somebody is standing
                 * asking "so do we have a key or not".
                 */
                <div className="flex gap-3 rounded-[var(--radius-md)] border border-status-warning-line bg-status-warning p-4 text-status-warning-fg">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <h3 className="font-medium">{kt('lockedTitle')}</h3>
                    <p className="mt-1 text-sm">{kt('lockedBody')}</p>
                    <Button asChild size="sm" variant="secondary" className="mt-3">
                      <Link href="/admin/einstellungen?tab=fees">{kt('lockedAction')}</Link>
                    </Button>
                    <p className="mt-2 text-xs opacity-80">{kt('lockedHint')}</p>
                  </div>
                </div>
              ) : keys.length === 0 ? (
                <>
                  <p className="text-sm font-medium">{kt('emptyTitle')}</p>
                  <p className="mt-1 text-sm text-ink-tertiary">{t('keysEmptyBody')}</p>
                  <Button asChild size="sm" variant="secondary" className="mt-3">
                    <Link href="/admin/schluessel">{kt('addAction')}</Link>
                  </Button>
                </>
              ) : (
                /*
                 * Was one line per key — storage location and a date, with no
                 * label on either. Which date? Taken or handed back? And a
                 * returned key was drawn exactly like one still in the cupboard,
                 * so the card answered "do we hold a key here" wrongly whenever
                 * the answer was no.
                 */
                <ul className="space-y-3">
                  {keys.map((key) => (
                    <li
                      key={key.id}
                      className="rounded-[var(--radius-md)] border border-line-subtle bg-sunken p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 font-medium">{key.storageLocation}</span>
                        {/* Was a `Chip` with tones picked here, which made this
                            card and the key log two places deciding what
                            colour «in Aufbewahrung» is. */}
                        <StatusBadge entity="key" state={key.status} size="sm" />
                      </div>
                      <dl className="mt-2.5 space-y-1 text-sm">
                        <KeyRow label={kt('colReceived')}>
                          <span data-numeric>
                            {format.dateTime(new Date(key.receivedAt), 'short')}
                          </span>
                        </KeyRow>
                        <KeyRow label={kt('colBy')}>{key.receivedBy}</KeyRow>
                        {/* The handover back, as fully as the handover in. A
                            closed record used to be a bare date: the card said
                            the key had gone and could not say who took it,
                            which is the half a liability question turns on. */}
                        {key.returnedAt && (
                          <KeyRow label={kt('colReturned')}>
                            <span data-numeric>
                              {format.dateTime(new Date(key.returnedAt), 'short')}
                            </span>
                            {key.returnedTo && (
                              <span className="text-ink-tertiary">
                                {' '}
                                · {kt('returnedToShort', { to: key.returnedTo })}
                              </span>
                            )}
                          </KeyRow>
                        )}
                        {key.returnedBy && (
                          <KeyRow label={kt('returnedByLabel')}>{key.returnedBy}</KeyRow>
                        )}
                        {key.returnNote && (
                          <KeyRow label={kt('returnNoteLabel')}>{key.returnNote}</KeyRow>
                        )}
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('notesTitle')} description={t('notesHint')} />
            <CardBody>
              <Textarea
                className="min-h-24"
                placeholder={t('notesPlaceholder')}
                aria-label={t('notesTitle')}
                value={property.permanentNotes ?? ''}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-ink-tertiary">{label}</dt>
      <dd className="min-w-0 text-right [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/** Same shape as the customer record's, so two records read the same way. */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-subtle py-1.5">
      <dt className="shrink-0 text-ink-tertiary">{label}</dt>
      <dd className="min-w-0 text-right [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function KeyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-ink-tertiary">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
