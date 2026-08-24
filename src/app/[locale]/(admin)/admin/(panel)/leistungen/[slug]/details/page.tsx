'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Link, useRouter } from '@/i18n/navigation';
import { LOCALE_LABELS, routing, TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
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
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { ActionIcon } from '@/lib/action-icons';
import { calcUnit, hasPublicPage, isOffered, serviceUsage } from '@/lib/service-catalogue';
import { useHydrated, useStore } from '@/mock/store';
import type { Service } from '@/mock/schema';

/**
 * Screen 74a — one service, read-only.
 *
 * This was a Sheet sliding in over the list, which is the wrong container for
 * it on two counts. A panel is for something you glance at and dismiss, and
 * this is the screen the office actually reads a service *out of* — the four
 * language columns the table can only count, the usage figure that decides
 * whether the row can be deleted, the billing method spelled out rather than
 * abbreviated. And a Sheet has no address: «schick mir die Teppichreinigung»
 * had no link to send, because the only thing identifying it was a piece of
 * component state on somebody else's list.
 *
 * Read-only is the whole point of it existing beside screen 74. That one
 * autosaves every keystroke, so opening it to check what a service costs means
 * putting the record one stray key away from changing. The only two things
 * here that write are the availability toggle and the delete, and both stop
 * and ask first.
 */
export default function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations('admin.services');
  const serviceT = useTranslations('admin.service');
  const actionsT = useTranslations('actions');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const services = useStore((s) => s.services);
  const plans = useStore((s) => s.plans);
  const data = useStore((s) => s.data);
  const setServiceStatus = useStore((s) => s.setServiceStatus);
  const deleteService = useStore((s) => s.deleteService);

  const [pending, setPending] = useState<'activate' | 'deactivate' | 'delete' | null>(null);

  if (!hydrated) return <SkeletonPage label={t('detailsTitle')} />;

  const service = services.find((s) => s.slug === slug);
  if (!service) return <p className="text-ink-tertiary">—</p>;

  const usage = serviceUsage(service.slug, data, plans);
  const blocked = pending === 'delete' && usage.total > 0;
  const name = service.name[locale];

  function confirmPending() {
    if (!pending || !service) return;

    if (pending === 'delete') {
      if (!deleteService(service.id)) {
        toast.error(t('deleteBlocked'));
        setPending(null);
        return;
      }
      toast.success(t('deleteDone', { name }));
      /* The record this page is about no longer exists, so staying would leave
         the reader on a screen showing a dash where a service was. */
      router.push('/admin/leistungen');
      return;
    }

    const next = pending === 'activate' ? 'active' : 'inactive';
    setServiceStatus(service.id, next);
    toast.success(t(pending === 'activate' ? 'activateDone' : 'deactivateDone', { name }));
    setPending(null);
  }

  const copy = pending
    ? blocked
      ? {
          title: t('deleteBlockedTitle', { name }),
          body: t('deleteBlockedBody', { n: usage.total }),
          action: '',
        }
      : {
          activate: {
            title: t('activateTitle', { name }),
            body: t('activateBody'),
            action: t('activateConfirm'),
          },
          deactivate: {
            title: t('deactivateTitle', { name }),
            body: t('deactivateBody'),
            action: t('deactivateConfirm'),
          },
          delete: {
            title: t('deleteTitle', { name }),
            body: t('deleteBody'),
            action: t('deleteConfirm'),
          },
        }[pending]
    : null;

  return (
    <div>
      <PageHeader
        title={name}
        lead={service.short[locale]}
        back={{ href: '/admin/leistungen', label: t('detailsBack') }}
        meta={<StatusBadge entity="service" state={service.status} />}
        actions={
          <>
            <Button asChild>
              <Link href={`/admin/leistungen/${service.slug}`}>
                <ActionIcon.edit className="size-4" aria-hidden />
                {t('rowEdit')}
              </Link>
            </Button>
            {/*
              The availability control also lives here, and not only in the
              list's toggle column. Below lg the list renders as cards, and a
              card's body is one big <button> — a Switch inside it would be a
              control nested in a control. This page is the phone's path to the
              same decision.
            */}
            {isOffered(service) ? (
              <Button variant="secondary" onClick={() => setPending('deactivate')}>
                <ActionIcon.deactivate className="size-4" aria-hidden />
                {t('rowDeactivate')}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setPending('activate')}>
                <ActionIcon.activate className="size-4" aria-hidden />
                {t('rowActivate')}
              </Button>
            )}
            {hasPublicPage(service) && (
              <Button asChild variant="secondary">
                <a href={`/leistungen/${service.slug}`} target="_blank" rel="noreferrer">
                  <ActionIcon.customerView className="size-4" aria-hidden />
                  {t('rowCustomerView')}
                </a>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-app-section lg:grid-cols-2">
        <Card>
          <CardHeader title={t('detailsPricing')} />
          <CardBody className="space-y-5">
            <Row label={t('colBase')}>
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {/* The unit comes from the billing method. A per-unit service
                    printed as an hourly rate is the exact error the catalogue
                    made everywhere before `calcUnit`. */}
                <Money amount={service.basePrice} per={calcUnit(service.calc)} />
                <span className="text-sm text-ink-tertiary">· {calcLabel(service, t)}</span>
              </span>
            </Row>
            <Row label={t('colMin')}>
              <span data-numeric className="text-sm text-ink-secondary">
                {service.minDuration} h
              </span>
            </Row>
            <Row label={t('detailsProfile')}>
              <span className="text-sm text-ink-secondary">
                {serviceT(
                  `profile${service.durationProfile.charAt(0).toUpperCase()}${service.durationProfile.slice(1)}` as 'profileStandard',
                )}
              </span>
            </Row>
            <Row label={t('detailsGuarantee')}>
              <span className="text-sm text-ink-secondary">
                {service.handoverGuarantee
                  ? t('detailsGuaranteeYes')
                  : t('detailsGuaranteeNo')}
              </span>
            </Row>
            <Row label={t('detailsSlug')}>
              <code className="text-sm text-ink-secondary">/leistungen/{service.slug}</code>
            </Row>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('detailsUsage')} description={t('detailsUsageHint')} />
          <CardBody className="space-y-5">
            <Row label={t('detailsUsageRequests')}>
              <span data-numeric className="text-sm text-ink-secondary">
                {usage.requests}
              </span>
            </Row>
            <Row label={t('detailsUsageBookings')}>
              <span data-numeric className="text-sm text-ink-secondary">
                {usage.bookings}
              </span>
            </Row>
            <Row label={t('detailsUsagePlans')}>
              <span data-numeric className="text-sm text-ink-secondary">
                {usage.plans}
              </span>
            </Row>
            {/* Why the delete button below may refuse, said before it is
                pressed rather than after. */}
            <p className="border-t border-line-subtle pt-4 text-sm text-ink-tertiary">
              {usage.total > 0 ? t('detailsUsageBody', { n: usage.total }) : t('detailsUsageNone')}
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={t('detailsNames')} description={t('detailsLocaleHint')} />
          <CardBody className="grid gap-6 sm:grid-cols-2">
            <Locales values={service.name} label={t('detailsNames')} fallback={t('detailsFallback')} />
            <Locales
              values={service.short}
              label={t('detailsShort')}
              fallback={t('detailsFallback')}
            />
          </CardBody>
        </Card>

        <Card tone="danger" className="lg:col-span-2">
          {/* A heading, not the confirm's question. «Delete "Regular
              cleaning"?» reads as a prompt, and a prompt sitting permanently
              on the page is one the reader answers by ignoring it. */}
          <CardHeader title={t('detailsDangerTitle')} description={t('deleteBody')} />
          <CardBody>
            <Button variant="danger" onClick={() => setPending('delete')}>
              <ActionIcon.delete className="size-4" aria-hidden />
              {t('rowDelete')}
            </Button>
          </CardBody>
        </Card>
      </div>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent closeLabel={actionsT('close')}>
          <DialogHeader>
            <DialogTitle>{copy?.title}</DialogTitle>
            <DialogDescription>{copy?.body}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>
              {blocked ? actionsT('close') : actionsT('cancel')}
            </Button>
            {!blocked && (
              <Button
                variant={pending === 'delete' ? 'danger' : 'primary'}
                onClick={confirmPending}
              >
                {copy?.action}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function calcLabel(service: Service, t: (key: string) => string) {
  return t(
    service.calc === 'perUnit'
      ? 'calcPerUnit'
      : service.calc === 'flat'
        ? 'calcFlat'
        : 'calcHourly',
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

/**
 * One field in all four languages, with the gaps named.
 *
 * §20.6 makes German the fallback, so a missing French string renders as
 * German on the website and nothing anywhere says it is missing. Listing every
 * locale — including the ones that are fine — is what makes the absence
 * visible; showing only the gaps would leave the reader unsure whether the
 * others had been checked.
 */
function Locales({
  label,
  values,
  fallback,
}: {
  label: string;
  values: Record<Locale, string>;
  fallback: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-ink-tertiary uppercase">{label}</p>
      <dl className="mt-3 space-y-2">
        {routing.locales.map((l) => (
          <div key={l} className="flex gap-3 text-sm">
            <dt className="w-16 shrink-0 text-ink-tertiary">{LOCALE_LABELS[l]}</dt>
            <dd className="min-w-0 flex-1">
              <span className="text-ink-secondary">{values[l] || values.de}</span>
              {!TRANSLATED_LOCALES.includes(l) && (
                <span className="mt-0.5 block text-xs text-status-warning-fg">{fallback}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
