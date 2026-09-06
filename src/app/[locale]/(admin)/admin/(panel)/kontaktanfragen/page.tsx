'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Mail, Phone, RotateCcw } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, useConfirmTarget, useDismissLabel } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { ActionIcon } from '@/lib/action-icons';
import { elapsed, hoursSince } from '@/lib/elapsed';
import { cn } from '@/lib/cn';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Locale } from '@/i18n/routing';
import type { Enquiry } from '@/mock/schema';

/** The three answers to "what is in the inbox?". */
type Tab = 'new' | 'answered' | 'deleted';
const TABS: Tab[] = ['new', 'answered', 'deleted'];

/**
 * Screen 84 — what the contact form actually sent.
 *
 * The form validated six fields, showed a spinner and pushed to /danke, and
 * the message existed for 900 milliseconds in a closure. /danke told the
 * visitor we answer within 24 hours. So the site made a promise, on a page
 * built for the purpose, about something nothing had written down — the worst
 * class of gap in this prototype, because it is not a missing screen but a
 * commitment the product could not keep.
 *
 * Cards rather than a table, and for once that is not a size decision: the
 * message *is* the record. A table would put a paragraph somebody wrote by
 * hand into a truncated cell and make the one thing worth reading the one
 * thing you have to click to see.
 */
export default function AdminEnquiriesPage() {
  const t = useTranslations('admin.enquiries');
  const appT = useTranslations('app');
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();
  const dismissLabel = useDismissLabel();

  const enquiries = useStore((s) => s.data.enquiries);
  const team = useStore((s) => s.data.team);
  const settings = useStore((s) => s.settings);
  const setEnquiryStatus = useStore((s) => s.setEnquiryStatus);
  const deleteEnquiry = useStore((s) => s.deleteEnquiry);
  const restoreEnquiry = useStore((s) => s.restoreEnquiry);
  const convertEnquiry = useStore((s) => s.convertEnquiry);

  const [tab, setTab] = useState<Tab>('new');
  const [query, setQuery] = useState('');
  const deleting = useConfirmTarget<Enquiry>();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enquiries
      .filter((e) => {
        if (tab === 'deleted') return Boolean(e.deletedAt);
        if (e.deletedAt) return false;
        return e.status === tab;
      })
      .filter((e) =>
        q
          ? [e.name, e.email, e.phone, e.subject, e.message, e.reference]
              .join(' ')
              .toLowerCase()
              .includes(q)
          : true,
      )
      /* Oldest first in the new tab, newest first everywhere else. An inbox is
         a queue: the message that has been waiting longest is the one about to
         break the promise on /kontakt, and sorting newest-first buries it. */
      .slice()
      .sort((a, b) =>
        tab === 'new'
          ? a.receivedAt.localeCompare(b.receivedAt)
          : b.receivedAt.localeCompare(a.receivedAt),
      );
  }, [enquiries, tab, query]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const count = (id: Tab) =>
    enquiries.filter((e) => (id === 'deleted' ? Boolean(e.deletedAt) : !e.deletedAt && e.status === id))
      .length;

  const overdueHours = settings.responseTimeHours;
  const isOverdue = (e: Enquiry) =>
    e.status === 'new' &&
    !e.deletedAt &&
    hoursSince(e.receivedAt, now) > overdueHours;

  function convert(enquiry: Enquiry) {
    const id = convertEnquiry(enquiry.id, now);
    if (!id) return;
    toast.success(t('convertDone', { name: enquiry.name }));
    router.push(`/admin/kunden/${id}`);
  }

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} />

      {enquiries.length === 0 ? (
        <EmptyState headingLevel={2} title={t('emptyTitle')} body={t('emptyBody')} />
      ) : (
        <>
          {/* The same underlined strip as the review moderation. Somebody who
              has learned one inbox has learned the other. */}
          <div role="tablist" aria-label={t('title')} className="flex flex-wrap gap-1 border-b border-line">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`enq-tab-${id}`}
                aria-selected={tab === id}
                aria-controls="enq-panel"
                tabIndex={tab === id ? 0 : -1}
                onKeyDown={(e) => {
                  const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                  if (delta === 0) return;
                  e.preventDefault();
                  const next = TABS[(TABS.indexOf(id) + delta + TABS.length) % TABS.length]!;
                  setTab(next);
                  document.getElementById(`enq-tab-${next}`)?.focus();
                }}
                onClick={() => setTab(id)}
                className={cn(
                  '-mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 py-2 text-sm transition-colors',
                  tab === id
                    ? 'border-accent font-medium text-ink'
                    : 'border-transparent text-ink-secondary hover:border-line-strong hover:text-ink',
                )}
              >
                {t(`tab${id.charAt(0).toUpperCase()}${id.slice(1)}` as 'tabNew')}
                <span
                  data-numeric
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs',
                    tab === id ? 'bg-accent-subtle text-ink' : 'bg-sunken text-ink-tertiary',
                  )}
                >
                  {count(id)}
                </span>
              </button>
            ))}
          </div>

          <Toolbar
            className="mt-6"
            search={{
              value: query,
              onChange: setQuery,
              label: t('search'),
              placeholder: t('searchPlaceholder'),
              clearLabel: appT('clearSearch'),
            }}
            count={appT('resultsAll', { total: visible.length })}
          />

          <div id="enq-panel" role="tabpanel" aria-labelledby={`enq-tab-${tab}`} tabIndex={0}>
            {visible.length === 0 ? (
              <EmptyState
                className="mt-4"
                headingLevel={2}
                compact
                title={t('tabEmptyTitle')}
                body={t('tabEmptyBody')}
              />
            ) : (
              <ul className="mt-4 space-y-3">
                {visible.map((enquiry) => {
                  const answeredBy = team.find((m) => m.id === enquiry.answeredBy);
                  return (
                    <li key={enquiry.id} className="surface-card p-5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <StatusBadge entity="enquiry" state={enquiry.status} size="sm" />
                        <span className="font-medium">{enquiry.name}</span>
                        <span data-numeric className="font-mono text-xs text-ink-tertiary">
                          {enquiry.reference}
                        </span>
                        <span
                          data-numeric
                          className="ms-auto text-sm text-ink-tertiary"
                          title={format.dateTime(new Date(enquiry.receivedAt), 'full')}
                        >
                          {elapsed(enquiry.receivedAt, now, locale)}
                        </span>
                      </div>

                      {/* The promise on /kontakt is a number in settings, so
                          the warning is derived from it rather than from a
                          constant typed here — change the response time and
                          this moves with it. */}
                      {isOverdue(enquiry) && (
                        <Alert tone="warning" className="mt-3" title={t('overdueTitle')}>
                          {t('overdueBody', { hours: overdueHours })}
                        </Alert>
                      )}

                      {enquiry.subject && (
                        <p className="mt-3 font-medium text-ink">{enquiry.subject}</p>
                      )}
                      <p className="mt-2 whitespace-pre-line text-ink-secondary">
                        {enquiry.message}
                      </p>

                      {/* mailto and tel, because the answer happens outside
                          this app and pretending otherwise would mean building
                          an outbox that sends nothing. */}
                      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <a
                          href={`mailto:${enquiry.email}?subject=${encodeURIComponent(
                            enquiry.subject ?? enquiry.reference,
                          )}`}
                          className="inline-flex items-center gap-1.5 text-ink-accent hover:underline"
                        >
                          <Mail className="size-3.5" aria-hidden />
                          {enquiry.email}
                        </a>
                        {enquiry.phone && (
                          <a
                            href={`tel:${enquiry.phone.replace(/\s/g, '')}`}
                            className="inline-flex items-center gap-1.5 text-ink-accent hover:underline"
                          >
                            <Phone className="size-3.5" aria-hidden />
                            <span data-numeric>{enquiry.phone}</span>
                          </a>
                        )}
                      </p>

                      {answeredBy && enquiry.answeredAt && (
                        <p className="mt-3 text-sm text-ink-tertiary">
                          {t('answeredBy', {
                            name: `${answeredBy.firstName} ${answeredBy.lastName}`,
                            date: format.dateTime(new Date(enquiry.answeredAt), 'short'),
                          })}
                        </p>
                      )}

                      {enquiry.customerId && (
                        <p className="mt-3 text-sm">
                          <Link
                            href={`/admin/kunden/${enquiry.customerId}`}
                            className="text-ink-accent hover:underline"
                          >
                            {t('becameCustomer')}
                          </Link>
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {enquiry.deletedAt ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              restoreEnquiry(enquiry.id);
                              toast.success(t('restoreDone', { ref: enquiry.reference }));
                            }}
                          >
                            <RotateCcw className="size-4" aria-hidden />
                            {t('restore')}
                          </Button>
                        ) : (
                          <>
                            {enquiry.status === 'new' ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEnquiryStatus(enquiry.id, 'answered', now);
                                  toast.success(t('answeredDone', { ref: enquiry.reference }));
                                }}
                              >
                                {t('markAnswered')}
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setEnquiryStatus(enquiry.id, 'new', now);
                                  toast.success(t('reopenDone', { ref: enquiry.reference }));
                                }}
                              >
                                {t('reopen')}
                              </Button>
                            )}

                            {/* Not every message is a customer — one of the
                                seeded five is a supplier — so this is a
                                decision on the record rather than something
                                that happens on read. */}
                            {!enquiry.customerId && (
                              <Button variant="secondary" size="sm" onClick={() => convert(enquiry)}>
                                {t('convert')}
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="ms-auto"
                              onClick={() => deleting.ask(enquiry)}
                            >
                              <ActionIcon.delete className="size-4" aria-hidden />
                              {t('delete')}
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleting.open}
        onOpenChange={(open) => !open && deleting.dismiss()}
        title={t('deleteTitle')}
        body={t('deleteBody')}
        action={t('delete')}
        dismiss={dismissLabel}
        tone="danger"
        onConfirm={() => {
          const enquiry = deleting.target;
          if (!enquiry) return;
          deleting.dismiss();
          deleteEnquiry(enquiry.id, now);
          toast.success(t('deleteDone', { ref: enquiry.reference }));
        }}
      />
    </div>
  );
}
